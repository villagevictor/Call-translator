import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SupportedLanguage, TranscriptItem, HardwareTelemetry, CallState, CallMode } from './types';
import { SUPPORTED_LANGUAGES, CALL_CONTACTS, CallContact } from './data/languages';
import { WebAudioVadEngine } from './utils/audioVAD';
import { CallTranslatorApp } from './components/CallTranslatorApp';
import { DeveloperModal } from './components/DeveloperModal';
import { callSoundEngine } from './utils/callSounds';

export default function App() {
  const [callState, setCallState] = useState<CallState>('IDLE');
  const [callMode, setCallMode] = useState<CallMode>('AI_PARTNER');
  const [activeContact, setActiveContact] = useState<CallContact | null>(null);
  const [customPhoneNumber, setCustomPhoneNumber] = useState('');
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  const [sourceLang, setSourceLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]); // English (US)
  const [targetLang, setTargetLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[4]); // Spanish (Spain)

  const [useLiveMic, setUseLiveMic] = useState(true);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [autoSpeakTranslation, setAutoSpeakTranslation] = useState(true);
  const [vadThreshold, setVadThreshold] = useState(28);

  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [activeSpeakerLabel, setActiveSpeakerLabel] = useState<string | null>(null);
  const [isDevSheetOpen, setIsDevSheetOpen] = useState(false);

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
    currentLatencyMs: 34,
    wsConnected: false,
    reconnectAttempts: 0,
    audioTrackBufferFillPercent: 42,
  });

  const vadEngineRef = useRef<WebAudioVadEngine | null>(null);
  const callTimerRef = useRef<number | null>(null);
  const connectingTimeoutRef = useRef<number | null>(null);

  // Call duration counter
  useEffect(() => {
    if (callState === 'IN_CALL') {
      callTimerRef.current = window.setInterval(() => {
        setCallDurationSeconds((prev) => prev + 1);
        setTelemetry((prev) => ({
          ...prev,
          totalFramesCaptured: prev.totalFramesCaptured + 1,
          currentLatencyMs: Math.floor(32 + Math.random() * 10),
        }));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callState]);

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
    async (pcm16: Int16Array, base64Pcm: string) => {
      // Audio chunk captured for WebSocket pipeline
    },
    []
  );

  // Speech recognized via Web Speech API in real-time
  const handleSpeechRecognized = useCallback(
    async (transcript: string, isFinal: boolean) => {
      if (callState !== 'IN_CALL' || isMicMuted || !transcript.trim()) return;

      if (isFinal) {
        handleSendSpeech(transcript.trim(), 'LOCAL_USER');
      } else {
        setActiveSpeakerLabel(`You: "${transcript.trim()}"`);
      }
    },
    [callState, isMicMuted]
  );

  // Initialize Web Audio VAD
  useEffect(() => {
    vadEngineRef.current = new WebAudioVadEngine(
      {
        onAudioLevel: handleAudioLevel,
        onPcmChunkReady: handlePcmChunkReady,
        onSpeechRecognized: handleSpeechRecognized,
        onError: (err) => console.warn('VAD Audio Warning:', err),
      },
      vadThreshold
    );

    return () => {
      vadEngineRef.current?.stop();
    };
  }, [handleAudioLevel, handlePcmChunkReady, handleSpeechRecognized, vadThreshold]);

  // Adjust threshold on change
  useEffect(() => {
    vadEngineRef.current?.setThreshold(vadThreshold);
  }, [vadThreshold]);

  // Start Call Flow
  const handleStartCall = (contact?: CallContact, customNum?: string) => {
    const targetContact = contact || (customNum ? null : CALL_CONTACTS[0]);
    setActiveContact(targetContact || null);
    if (customNum) setCustomPhoneNumber(customNum);

    // If calling a specific contact, configure target language to match their native tongue
    if (targetContact) {
      const matchLang = SUPPORTED_LANGUAGES.find((l) => l.code === targetContact.langCode);
      if (matchLang) {
        setTargetLang(matchLang);
      }
    }

    setCallState('RINGING');
    setCallDurationSeconds(0);
    callSoundEngine.playOutgoingRing();

    setTelemetry((prev) => ({
      ...prev,
      wsConnected: true,
      currentLatencyMs: 38,
    }));

    // Connect after 2.2 seconds of ringing
    connectingTimeoutRef.current = window.setTimeout(async () => {
      callSoundEngine.playConnectChime();
      setCallState('IN_CALL');

      // Start mic if enabled
      if (useLiveMic && !isMicMuted && vadEngineRef.current) {
        await vadEngineRef.current.start(sourceLang.code);
      }

      // If calling an AI partner, they speak their native greeting
      if (targetContact) {
        setTimeout(() => {
          handleIncomingPartnerSpeech(
            targetContact.greetingInNative,
            targetContact.greetingTranslated,
            targetContact.langCode,
            sourceLang.code,
            targetContact.name
          );
        }, 800);
      }
    }, 2200);
  };

  // End Call
  const handleEndCall = () => {
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current);
      connectingTimeoutRef.current = null;
    }
    callSoundEngine.playEndCallChime();
    setCallState('IDLE');
    setActiveSpeakerLabel(null);
    setIsProcessingSpeech(false);
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

    if (callState === 'IN_CALL') {
      if (nextState && !isMicMuted) {
        await vadEngineRef.current?.start(sourceLang.code);
      } else {
        vadEngineRef.current?.stop();
      }
    }
  };

  const handleToggleMicMute = () => {
    const nextMute = !isMicMuted;
    setIsMicMuted(nextMute);
    if (nextMute) {
      vadEngineRef.current?.stop();
    } else if (callState === 'IN_CALL' && useLiveMic) {
      vadEngineRef.current?.start(sourceLang.code);
    }
  };

  const handleSwapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    vadEngineRef.current?.setLanguage(targetLang.code);
  };

  // Play audio track
  const handlePlayAudioTrack = (text: string, langCode: string, audioUrl?: string | null) => {
    if (!isSpeakerOn) return;

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

  // Receive speech from the remote partner in the call
  const handleIncomingPartnerSpeech = (
    nativeText: string,
    translatedText: string,
    remoteLang: string,
    userLang: string,
    partnerName: string
  ) => {
    setActiveSpeakerLabel(`${partnerName} speaking (${remoteLang.split('-')[0]})...`);

    const newItem: TranscriptItem = {
      id: `partner-${Date.now()}`,
      speaker: 'REMOTE_PARTY',
      originalText: nativeText,
      translatedText: translatedText,
      sourceLang: remoteLang,
      targetLang: userLang,
      timestamp: Date.now(),
      latencyMs: 38,
    };

    setTranscripts((prev) => [...prev, newItem]);

    // Play translation to user
    if (autoSpeakTranslation) {
      handlePlayAudioTrack(translatedText, userLang);
    }

    setTimeout(() => {
      setActiveSpeakerLabel(null);
    }, 1500);
  };

  // User speaks in the call -> Translate & Send -> Call partner replies naturally!
  const handleSendSpeech = async (text: string, speaker: 'LOCAL_USER' | 'REMOTE_PARTY') => {
    if (!text.trim() || isProcessingSpeech) return;
    setIsProcessingSpeech(true);
    setActiveSpeakerLabel(speaker === 'LOCAL_USER' ? 'Translating your speech...' : 'Translating remote speech...');

    const sLang = speaker === 'LOCAL_USER' ? sourceLang.code : targetLang.code;
    const tLang = speaker === 'LOCAL_USER' ? targetLang.code : sourceLang.code;

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

      // Speak translated speech over the call
      if (autoSpeakTranslation) {
        handlePlayAudioTrack(newItem.translatedText, tLang, newItem.audioUrl);
      }

      // If user spoke during an active call with an AI partner, have the partner reply in their native tongue
      if (callState === 'IN_CALL' && speaker === 'LOCAL_USER' && activeContact) {
        setTimeout(async () => {
          try {
            setActiveSpeakerLabel(`${activeContact.name} is speaking (${activeContact.languageName.split(' ')[0]})...`);

            const partnerRes = await fetch('/api/call-partner-reply', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contactName: activeContact.name,
                contactRole: activeContact.role,
                contactLang: targetLang.code,
                userLang: sourceLang.code,
                conversationHistory: transcripts.slice(-4),
                lastUserMessage: newItem.translatedText,
              }),
            });

            if (partnerRes.ok) {
              const partnerData = await partnerRes.json();
              handleIncomingPartnerSpeech(
                partnerData.partnerNativeText,
                partnerData.translatedToUserText,
                targetLang.code,
                sourceLang.code,
                activeContact.name
              );
            }
          } catch (pErr) {
            console.warn('Partner reply fallback:', pErr);
          }
        }, 1200);
      }
    } catch (err: any) {
      console.warn('Backend translation fallback:', err);
      const fallbackItem: TranscriptItem = {
        id: `msg-${Date.now()}`,
        speaker,
        originalText: text,
        translatedText: `[${tLang.split('-')[0].toUpperCase()}] ${text}`,
        sourceLang: sLang,
        targetLang: tLang,
        timestamp: Date.now(),
      };
      setTranscripts((prev) => [...prev, fallbackItem]);
      if (autoSpeakTranslation) {
        handlePlayAudioTrack(fallbackItem.translatedText, tLang);
      }
    } finally {
      setIsProcessingSpeech(false);
      setTimeout(() => {
        setActiveSpeakerLabel(null);
      }, 1000);
    }
  };

  return (
    <div className="w-full min-h-[100dvh] h-[100dvh] bg-neutral-950 flex flex-col justify-center items-center overflow-hidden font-sans">
      {/* The Native Phone Call Interface */}
      <main className="w-full h-full max-w-lg md:h-[94vh] md:max-h-[840px] md:my-auto md:rounded-3xl md:border md:border-neutral-800 md:shadow-2xl overflow-hidden flex flex-col bg-neutral-950">
        <CallTranslatorApp
          callState={callState}
          callMode={callMode}
          onCallModeChange={setCallMode}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          activeContact={activeContact}
          customPhoneNumber={customPhoneNumber}
          onCustomPhoneNumberChange={setCustomPhoneNumber}
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
          isMicMuted={isMicMuted}
          onToggleMicMute={handleToggleMicMute}
          isSpeakerOn={isSpeakerOn}
          onToggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
          autoSpeakTranslation={autoSpeakTranslation}
          onToggleAutoSpeak={() => setAutoSpeakTranslation(!autoSpeakTranslation)}
          onSendSpeech={handleSendSpeech}
          isProcessingSpeech={isProcessingSpeech}
          onPlayTts={handlePlayAudioTrack}
          callDurationSeconds={callDurationSeconds}
          onOpenDevSheet={() => setIsDevSheetOpen(true)}
          vadThreshold={vadThreshold}
          onVadThresholdChange={setVadThreshold}
          activeSpeakerLabel={activeSpeakerLabel}
        />
      </main>

      {/* Developer & Android 14 Project Modal */}
      <DeveloperModal
        isOpen={isDevSheetOpen}
        onClose={() => setIsDevSheetOpen(false)}
        telemetry={telemetry}
        isCallActive={callState === 'IN_CALL'}
        callDurationSeconds={callDurationSeconds}
      />
    </div>
  );
}
