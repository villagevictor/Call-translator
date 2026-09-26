import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage, TranscriptItem, HardwareTelemetry, CallMode } from './types';
import { SUPPORTED_LANGUAGES } from './data/languages';
import { WebAudioVadEngine } from './utils/audioVAD';
import { CallTranslatorApp } from './components/CallTranslatorApp';
import { DeveloperModal } from './components/DeveloperModal';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [callMode, setCallMode] = useState<CallMode>('LIVE_CALL_COMPANION');
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  const [sourceLang, setSourceLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]); // English (US)
  const [targetLang, setTargetLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[4]); // Spanish (Spain)

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [autoSpeakTranslation, setAutoSpeakTranslation] = useState(true);
  const [vadThreshold, setVadThreshold] = useState(28);

  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [activeSpeakerLabel, setActiveSpeakerLabel] = useState<string | null>(null);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);

  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);

  const [telemetry, setTelemetry] = useState<HardwareTelemetry>({
    sampleRate: 16000,
    channelConfig: 'CHANNEL_IN_MONO',
    bitDepth: 16,
    frameSizeBytes: 3200,
    frameIntervalMs: 100,
    currentDecibels: 0,
    vadThresholdDb: 28,
    isVoiceActive: false,
    totalFramesCaptured: 0,
    framesSent: 0,
    framesGatedSilence: 0,
    currentLatencyMs: 0,
    wsConnected: false,
    reconnectAttempts: 0,
    audioTrackBufferFillPercent: 42,
  });

  const vadEngineRef = useRef<WebAudioVadEngine | null>(null);
  const callTimerRef = useRef<number | null>(null);

  // Call duration counter
  useEffect(() => {
    if (isListening) {
      callTimerRef.current = window.setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
        setTelemetry((prev) => ({
          ...prev,
          totalFramesCaptured: prev.totalFramesCaptured + 1,
        }));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      setCallDurationSeconds(0);
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [isListening]);

  // Handle live microphone VAD callbacks
  const handleAudioLevel = useCallback(
    (decibels: number, isVoiceActive: boolean) => {
      if (isMicMuted) {
        setTelemetry((prev) => ({
          ...prev,
          currentDecibels: 0,
          isVoiceActive: false,
        }));
        return;
      }

      setTelemetry((prev) => ({
        ...prev,
        currentDecibels: decibels,
        isVoiceActive,
        totalFramesCaptured: prev.totalFramesCaptured + 1,
        framesSent: isVoiceActive ? prev.framesSent + 1 : prev.framesSent,
        framesGatedSilence: !isVoiceActive ? prev.framesGatedSilence + 1 : prev.framesGatedSilence,
      }));
    },
    [isMicMuted]
  );

  const handlePcmChunkReady = useCallback(
    (_chunk: Int16Array, _base64Pcm: string) => {
      if (isMicMuted) return;
      // In production Android, this chunk is forwarded over the WebSocket channel
    },
    [isMicMuted]
  );

  // Play translated speech using Gemini TTS or Web Speech Synthesis
  const playSpeechSynthesis = useCallback(
    (text: string, langCode: string, audioBase64?: string | null) => {
      if (!autoSpeakTranslation) return;

      // 1. If high-fidelity Gemini TTS audio returned, play through audio context
      if (audioBase64) {
        try {
          const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
          audio.play().catch(() => {});
          return;
        } catch (_) {}
      }

      // 2. Client-side Speech Synthesis fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find((v) => v.lang.startsWith(langCode.substring(0, 2)));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    },
    [autoSpeakTranslation]
  );

  // Translate recognized speech in real time
  const handleSpeechRecognized = useCallback(
    async (spokenText: string, isFinal: boolean) => {
      if (!isFinal || !spokenText.trim() || isProcessingSpeech || isMicMuted) return;

      try {
        setIsProcessingSpeech(true);
        setActiveSpeakerLabel('Microphone');
        const startTime = performance.now();

        const response = await fetch('/api/translate-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: spokenText.trim(),
            sourceLang: sourceLang.code,
            targetLang: targetLang.code,
            speaker: 'LOCAL_USER',
          }),
        });

        if (!response.ok) {
          throw new Error('Translation request failed');
        }

        const data = await response.json();
        const measuredLatency = Math.round(performance.now() - startTime);

        const newTranscript: TranscriptItem = {
          id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          speaker: 'LOCAL_USER',
          originalText: spokenText.trim(),
          translatedText: data.translatedText || spokenText.trim(),
          sourceLang: sourceLang.code,
          targetLang: targetLang.code,
          timestamp: Date.now(),
          audioUrl: data.ttsAudioBase64,
          latencyMs: measuredLatency,
        };

        setTranscripts((prev) => [...prev, newTranscript]);
        setTelemetry((prev) => ({
          ...prev,
          currentLatencyMs: measuredLatency,
        }));

        playSpeechSynthesis(newTranscript.translatedText, targetLang.code, data.ttsAudioBase64);
      } catch (err) {
        console.error('Translation error:', err);
      } finally {
        setIsProcessingSpeech(false);
        setActiveSpeakerLabel(null);
      }
    },
    [
      isProcessingSpeech,
      isMicMuted,
      sourceLang,
      targetLang,
      playSpeechSynthesis,
    ]
  );

  // Custom text speech sender
  const handleSendCustomSpeech = useCallback(
    async (text: string, speaker: 'LOCAL_USER' | 'REMOTE_PARTY' = 'LOCAL_USER') => {
      if (!text.trim() || isProcessingSpeech) return;

      try {
        setIsProcessingSpeech(true);
        setActiveSpeakerLabel(speaker === 'LOCAL_USER' ? 'You' : 'Remote');
        const startTime = performance.now();

        const curSource = speaker === 'LOCAL_USER' ? sourceLang.code : targetLang.code;
        const curTarget = speaker === 'LOCAL_USER' ? targetLang.code : sourceLang.code;

        const response = await fetch('/api/translate-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            sourceLang: curSource,
            targetLang: curTarget,
            speaker,
          }),
        });

        if (!response.ok) {
          throw new Error('Translation request failed');
        }

        const data = await response.json();
        const measuredLatency = Math.round(performance.now() - startTime);

        const newTranscript: TranscriptItem = {
          id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          speaker,
          originalText: text.trim(),
          translatedText: data.translatedText || text.trim(),
          sourceLang: curSource,
          targetLang: curTarget,
          timestamp: Date.now(),
          audioUrl: data.ttsAudioBase64,
          latencyMs: measuredLatency,
        };

        setTranscripts((prev) => [...prev, newTranscript]);
        setTelemetry((prev) => ({
          ...prev,
          currentLatencyMs: measuredLatency,
        }));

        playSpeechSynthesis(newTranscript.translatedText, curTarget, data.ttsAudioBase64);
      } catch (err) {
        console.error('Custom speech error:', err);
      } finally {
        setIsProcessingSpeech(false);
        setActiveSpeakerLabel(null);
      }
    },
    [
      isProcessingSpeech,
      sourceLang.code,
      targetLang.code,
      playSpeechSynthesis,
    ]
  );

  // Toggle Live Listening / Call Translation Engine
  const handleToggleListening = useCallback(async () => {
    if (isListening) {
      if (vadEngineRef.current) {
        vadEngineRef.current.stop();
        vadEngineRef.current = null;
      }
      setIsListening(false);
      setTelemetry((prev) => ({
        ...prev,
        wsConnected: false,
        isVoiceActive: false,
        currentDecibels: 0,
      }));
    } else {
      vadEngineRef.current = new WebAudioVadEngine(
        {
          onAudioLevel: handleAudioLevel,
          onPcmChunkReady: handlePcmChunkReady,
          onSpeechRecognized: handleSpeechRecognized,
          onError: (errMsg: string) => {
            console.error('Audio engine error:', errMsg);
            setIsListening(false);
          },
        },
        vadThreshold
      );

      const success = await vadEngineRef.current.start(sourceLang.code);
      if (success) {
        setIsListening(true);
        setTelemetry((prev) => ({
          ...prev,
          wsConnected: true,
        }));
      }
    }
  }, [
    isListening,
    handleAudioLevel,
    handlePcmChunkReady,
    handleSpeechRecognized,
    sourceLang.code,
    vadThreshold,
  ]);

  // Swap Languages
  const handleSwapLanguages = useCallback(() => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);

    if (vadEngineRef.current) {
      vadEngineRef.current.setLanguage(targetLang.code);
    }
  }, [sourceLang, targetLang]);

  // Update VAD Threshold dynamically
  const handleVadThresholdChange = useCallback((newThreshold: number) => {
    setVadThreshold(newThreshold);
    setTelemetry((prev) => ({ ...prev, vadThresholdDb: newThreshold }));
    if (vadEngineRef.current) {
      vadEngineRef.current.setThreshold(newThreshold);
    }
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950">
      <CallTranslatorApp
        isListening={isListening}
        onToggleListening={handleToggleListening}
        callMode={callMode}
        onCallModeChange={setCallMode}
        sourceLang={sourceLang}
        targetLang={targetLang}
        onSourceLangChange={(lang) => {
          setSourceLang(lang);
          if (vadEngineRef.current) vadEngineRef.current.setLanguage(lang.code);
        }}
        onTargetLangChange={setTargetLang}
        onSwapLanguages={handleSwapLanguages}
        transcripts={transcripts}
        onClearTranscripts={() => setTranscripts([])}
        telemetry={telemetry}
        isMicMuted={isMicMuted}
        onToggleMicMute={() => setIsMicMuted((prev) => !prev)}
        autoSpeakTranslation={autoSpeakTranslation}
        onToggleAutoSpeak={() => setAutoSpeakTranslation((prev) => !prev)}
        onSendCustomSpeech={handleSendCustomSpeech}
        isProcessingSpeech={isProcessingSpeech}
        onPlayTts={(text, lang, audioUrl) => playSpeechSynthesis(text, lang, audioUrl)}
        callDurationSeconds={callDurationSeconds}
        onOpenDevModal={() => setIsDevModalOpen(true)}
        vadThreshold={vadThreshold}
        onVadThresholdChange={handleVadThresholdChange}
        activeSpeakerLabel={activeSpeakerLabel}
      />

      {/* Android 14 Developer Tools & Kotlin Architecture Modal */}
      <DeveloperModal
        isOpen={isDevModalOpen}
        onClose={() => setIsDevModalOpen(false)}
        telemetry={telemetry}
        isCallActive={isListening}
        callDurationSeconds={callDurationSeconds}
      />
    </div>
  );
}
