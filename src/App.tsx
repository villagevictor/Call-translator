import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Smartphone,
  Code2,
  Activity,
  Layers,
  Download,
  Sparkles,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Github,
  CheckCircle2,
  Radio,
  Zap,
  Cpu
} from 'lucide-react';
import { AndroidPhoneSimulator } from './components/AndroidPhoneSimulator';
import { AudioEngineDashboard } from './components/AudioEngineDashboard';
import { CodeProjectExplorer } from './components/CodeProjectExplorer';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { SupportedLanguage, TranscriptItem, HardwareTelemetry } from './types';
import { SUPPORTED_LANGUAGES, PRESET_CALL_SCENARIOS } from './data/languages';
import { WebAudioVadEngine } from './utils/audioVAD';
import { generateAndroidProjectZip } from './utils/zipExport';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'telemetry' | 'architecture'>('simulator');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState(0);

  const [sourceLang, setSourceLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]); // English (US)
  const [targetLang, setTargetLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[1]); // Spanish (Spain)

  const [useLiveMic, setUseLiveMic] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
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

  // Send simulated or spoken speech to Gemini API endpoint
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

  const handleDownloadAllZip = async () => {
    const zipBlob = await generateAndroidProjectZip();
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Android-VoiceCall-Translation-Kotlin.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Global Navigation Bar */}
      <header className="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-950/50">
              <Phone className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white">
                  Android Voice &amp; Call Translation Studio
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Android 14+ (API 34)
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Ktor CIO WebSockets • 16kHz PCM AudioRecord/AudioTrack • RMS VAD ~30dB
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                activeTab === 'simulator'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Phone Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Kotlin Codebase</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                activeTab === 'telemetry'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Audio Engine &amp; VAD</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                activeTab === 'architecture'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Architecture</span>
            </button>
          </div>

          {/* Download Project Button */}
          <button
            onClick={handleDownloadAllZip}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-semibold text-neutral-100 transition shadow"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Android Project (.zip)</span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col">
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Interactive Phone Simulator */}
            <div className="lg:col-span-5 flex justify-center">
              <AndroidPhoneSimulator
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
                onSendSimulatedSpeech={handleSendSpeech}
                isProcessingSpeech={isProcessingSpeech}
                onPlayTts={handlePlayAudioTrack}
                callDurationSeconds={callDurationSeconds}
              />
            </div>

            {/* Right: Real-time Audio Hardware Telemetry & Quick Test Station */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <AudioEngineDashboard
                telemetry={telemetry}
                isCallActive={isCallActive}
                callDurationSeconds={callDurationSeconds}
              />

              {/* Developer Quick-Test & Speech Simulator Console */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-neutral-100">
                      Live Call Speech Generator &amp; Microphone Input
                    </h3>
                  </div>

                  <button
                    onClick={handleToggleLiveMic}
                    className={`px-3 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                      useLiveMic
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
                    }`}
                  >
                    {useLiveMic ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>{useLiveMic ? 'Live Mic Active' : 'Enable Real Mic'}</span>
                  </button>
                </div>

                <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                  Speak into your physical microphone with live 16kHz sampling and RMS decibel thresholding, or click any conversation scenario below to simulate caller voice frames:
                </p>

                {/* Scenario Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {PRESET_CALL_SCENARIOS.map((scenario, sIdx) => (
                    <div
                      key={sIdx}
                      className="bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80 flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-neutral-200 mb-1">{scenario.title}</div>
                        <div className="text-[11px] text-neutral-500 font-mono mb-2">
                          {scenario.sourceLang} ➔ {scenario.targetLang}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2">
                        {scenario.dialogue.slice(0, 2).map((item, idx) => (
                          <button
                            key={idx}
                            disabled={!isCallActive || isProcessingSpeech}
                            onClick={() => handleSendSpeech(item.text, item.speaker)}
                            className="text-left px-2 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 rounded text-[11px] text-neutral-300 truncate transition disabled:opacity-40"
                          >
                            <span className="font-semibold text-indigo-400 mr-1">
                              {item.speaker === 'LOCAL_USER' ? 'You:' : 'Caller:'}
                            </span>
                            {item.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {!isCallActive && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                    <Radio className="w-4 h-4 flex-shrink-0 animate-pulse" />
                    <span>
                      The Call Translation Foreground Service is currently idle. Click{' '}
                      <strong>Start Live Translation Call</strong> on the phone simulator to activate the Audio Hardware Engine!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'code' && <CodeProjectExplorer />}

        {activeTab === 'telemetry' && (
          <AudioEngineDashboard
            telemetry={telemetry}
            isCallActive={isCallActive}
            callDurationSeconds={callDurationSeconds}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-900/40 py-4 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500">
          <div>
            <span>Android 14+ Low-Latency Audio Streaming Architecture • Ktor CIO WebSockets</span>
          </div>
          <div className="flex items-center gap-4">
            <span>AudioRecord 16kHz MONO</span>
            <span>•</span>
            <span>Acoustic Echo Cancellation (AEC)</span>
            <span>•</span>
            <span>AudioTrack Stream Playback</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
