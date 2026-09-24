import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage, TranscriptItem, HardwareTelemetry } from './types';
import { SUPPORTED_LANGUAGES } from './data/languages';
import { WebAudioVadEngine } from './utils/audioVAD';
import { CallTranslatorApp } from './components/CallTranslatorApp';
import { DeveloperModal } from './components/DeveloperModal';

export default function App() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  const [sourceLang, setSourceLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]); // English (US)
  const [targetLang, setTargetLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[1]); // Spanish (Spain)

  const [useLiveMic, setUseLiveMic] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [isDevSheetOpen, setIsDevSheetOpen] = useState(false);

  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([
    {
      id: 'init-1',
      speaker: 'LOCAL_USER',
      originalText: 'Hello! I am testing the real-time call translation service.',
      translatedText: '¡Hola! Estoy probando el servicio de traducción de llamadas en tiempo real.',
      sourceLang: 'en-US',
      targetLang: 'es-ES',
      timestamp: Date.now() - 35000,
    },
    {
      id: 'init-2',
      speaker: 'REMOTE_PARTY',
      originalText: 'Perfecto, la calidad del audio es excelente y no hay retraso.',
      translatedText: 'Perfect, the audio quality is excellent and there is no delay.',
      sourceLang: 'es-ES',
      targetLang: 'en-US',
      timestamp: Date.now() - 20000,
    },
  ]);

  const [telemetry, setTelemetry] = useState<HardwareTelemetry>({
    sampleRate: 16000,
    channelConfig: 'CHANNEL_IN_MONO',
    bitDepth: 16,
    frameSizeBytes: 3200,
    frameIntervalMs: 100,
    currentDecibels: 0,
    vadThresholdDb: 30,
    isVoiceActive: false,
    totalFramesCaptured: 128,
    framesSent: 42,
    framesGatedSilence: 86,
    currentLatencyMs: 38,
    wsConnected: false,
    reconnectAttempts: 0,
    audioTrackBufferFillPercent: 45,
  });

  const vadEngineRef = useRef<WebAudioVadEngine | null>(null);
  const callTimerRef = useRef<number | null>(null);

  // Call duration timer
  useEffect(() => {
    if (isCallActive) {
      callTimerRef.current = window.setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
        setTelemetry((prev) => ({
          ...prev,
          totalFramesCaptured: prev.totalFramesCaptured + 1,
          currentLatencyMs: Math.floor(35 + Math.random() * 12),
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
  }, [isCallActive]);

  // Handle live microphone VAD callbacks
  const handleAudioLevel = useCallback((decibels: number, isVoiceActive: boolean) => {
    setTelemetry((prev) => ({
      ...prev,
      currentDecibels: decibels,
      isVoiceActive,
      totalFramesCaptured: prev.totalFramesCaptured + 1,
      framesSent: isVoiceActive ? prev.framesSent + 1 : prev.framesSent,
      framesGatedSilence: !isVoiceActive ? prev.framesGatedSilence + 1 : prev.framesGatedSilence,
    }));
  }, []);

  const handlePcmChunkReady = useCallback(
    async (pcm16: Int16Array, base64Pcm: string) => {
      // Periodic speech trigger if voice is sustained
      console.log('VAD active PCM chunk captured (3200 bytes)');
    },
    []
  );

  // Initialize Web Audio VAD
  useEffect(() => {
    vadEngineRef.current = new WebAudioVadEngine({
      onAudioLevel: handleAudioLevel,
      onPcmChunkReady: handlePcmChunkReady,
      onError: (err) => console.warn('VAD Audio Warning:', err),
    });

    return () => {
      vadEngineRef.current?.stop();
    };
  }, [handleAudioLevel, handlePcmChunkReady]);

  // Start Call
  const handleStartCall = async () => {
    setIsCallActive(true);
    setTelemetry((prev) => ({
      ...prev,
      wsConnected: true,
      currentDecibels: 24,
      isVoiceActive: false,
    }));

    if (useLiveMic && vadEngineRef.current) {
      await vadEngineRef.current.start();
    }
  };

  // Stop Call
  const handleStopCall = () => {
    setIsCallActive(false);
    vadEngineRef.current?.stop();
    setTelemetry((prev) => ({
      ...prev,
      wsConnected: false,
      currentDecibels: 0,
      isVoiceActive: false,
    }));
  };

  const handleToggleLiveMic = async () => {
    const nextState = !useLiveMic;
    setUseLiveMic(nextState);

    if (isCallActive) {
      if (nextState) {
        await vadEngineRef.current?.start();
      } else {
        vadEngineRef.current?.stop();
      }
    }
  };

  const handleSwapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  // Send speech to Gemini API endpoint
  const handleSendSpeech = async (text: string, speaker: 'LOCAL_USER' | 'REMOTE_PARTY') => {
    if (!text.trim() || isProcessingSpeech) return;
    setIsProcessingSpeech(true);

    const sLang = speaker === 'LOCAL_USER' ? sourceLang.code : targetLang.code;
    const tLang = speaker === 'LOCAL_USER' ? targetLang.code : sourceLang.code;

    // Simulate audio frame transmission telemetry bump
    setTelemetry((prev) => ({
      ...prev,
      totalFramesCaptured: prev.totalFramesCaptured + 10,
      framesSent: prev.framesSent + 10,
      isVoiceActive: true,
      currentDecibels: 58 + Math.floor(Math.random() * 20),
    }));

    try {
      const response = await fetch('/api/translate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang: sLang,
          targetLang: tLang,
          speaker,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const newItem: TranscriptItem = {
        id: `msg-${Date.now()}`,
        speaker: data.speaker || speaker,
        originalText: data.originalText || text,
        translatedText: data.translatedText || text,
        sourceLang: sLang,
        targetLang: tLang,
        timestamp: data.timestamp || Date.now(),
        audioUrl: data.ttsAudioBase64 ? `data:audio/mp3;base64,${data.ttsAudioBase64}` : null,
      };

      setTranscripts((prev) => [...prev, newItem]);

      // Play audio automatically if returned or synthesize
      if (newItem.audioUrl) {
        handlePlayAudioTrack(newItem.translatedText, tLang, newItem.audioUrl);
      } else {
        handlePlayAudioTrack(newItem.translatedText, tLang);
      }
    } catch (err: any) {
      console.warn('Backend translation fallback:', err);
      // Fallback local translation if server is offline
      const fallbackTranslation = `[${tLang.split('-')[0].toUpperCase()}] ${text}`;
      const fallbackItem: TranscriptItem = {
        id: `msg-${Date.now()}`,
        speaker,
        originalText: text,
        translatedText: fallbackTranslation,
        sourceLang: sLang,
        targetLang: tLang,
        timestamp: Date.now(),
      };
      setTranscripts((prev) => [...prev, fallbackItem]);
      handlePlayAudioTrack(fallbackItem.translatedText, tLang);
    } finally {
      setIsProcessingSpeech(false);
      setTimeout(() => {
        setTelemetry((prev) => ({
          ...prev,
          isVoiceActive: false,
          currentDecibels: 22,
        }));
      }, 1000);
    }
  };

  // Playback speech using AudioTrack simulation
  const handlePlayAudioTrack = (text: string, langCode: string, audioUrl?: string | null) => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((e) => console.warn('Audio play error:', e));
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] h-[100dvh] bg-neutral-950 flex flex-col justify-center items-center overflow-hidden font-sans">
      {/* The App Interface: Shown normally, edge-to-edge on phone or centered on tablet/desktop */}
      <main className="w-full h-full max-w-lg md:h-[94vh] md:max-h-[840px] md:my-auto md:rounded-3xl md:border md:border-neutral-800 md:shadow-2xl overflow-hidden flex flex-col bg-neutral-950">
        <CallTranslatorApp
          isCallActive={isCallActive}
          onStartCall={handleStartCall}
          onStopCall={handleStopCall}
          sourceLang={sourceLang}
          targetLang={targetLang}
          onSourceLangChange={setSourceLang}
          onTargetLangChange={setTargetLang}
          onSwapLanguages={handleSwapLanguages}
          transcripts={transcripts}
          onClearTranscripts={() => setTranscripts([])}
          telemetry={telemetry}
          useLiveMic={useLiveMic}
          onToggleLiveMic={handleToggleLiveMic}
          onSendSpeech={handleSendSpeech}
          isProcessingSpeech={isProcessingSpeech}
          onPlayTts={handlePlayAudioTrack}
          callDurationSeconds={callDurationSeconds}
          onOpenDevSheet={() => setIsDevSheetOpen(true)}
        />
      </main>

      {/* Developer & Code Modal: Opened discreetly via the Code icon in top bar */}
      <DeveloperModal
        isOpen={isDevSheetOpen}
        onClose={() => setIsDevSheetOpen(false)}
        telemetry={telemetry}
        isCallActive={isCallActive}
        callDurationSeconds={callDurationSeconds}
      />
    </div>
  );
}
