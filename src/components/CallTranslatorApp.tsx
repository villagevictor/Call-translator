import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowRightLeft,
  ChevronDown,
  Play,
  RotateCcw,
  Sparkles,
  Radio,
  Send,
  Code2,
  Download,
  Activity,
  Sliders,
  Smartphone,
  PhoneCall,
  Users,
  Copy,
  Check,
  Headphones,
  HelpCircle,
  FileText
} from 'lucide-react';
import { SupportedLanguage, TranscriptItem, HardwareTelemetry, CallMode } from '../types';
import { SUPPORTED_LANGUAGES, REAL_CALL_QUICK_PHRASES, QuickCallPhrase } from '../data/languages';

interface CallTranslatorAppProps {
  isListening: boolean;
  onToggleListening: () => void;
  callMode: CallMode;
  onCallModeChange: (mode: CallMode) => void;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  onSourceLangChange: (lang: SupportedLanguage) => void;
  onTargetLangChange: (lang: SupportedLanguage) => void;
  onSwapLanguages: () => void;
  transcripts: TranscriptItem[];
  onClearTranscripts: () => void;
  telemetry: HardwareTelemetry;
  isMicMuted: boolean;
  onToggleMicMute: () => void;
  autoSpeakTranslation: boolean;
  onToggleAutoSpeak: () => void;
  onSendCustomSpeech: (text: string, speaker: 'LOCAL_USER' | 'REMOTE_PARTY') => Promise<void>;
  isProcessingSpeech: boolean;
  onPlayTts: (text: string, lang: string, audioUrl?: string | null) => void;
  callDurationSeconds: number;
  onOpenDevModal: () => void;
  vadThreshold: number;
  onVadThresholdChange: (threshold: number) => void;
  activeSpeakerLabel: string | null;
}

export const CallTranslatorApp: React.FC<CallTranslatorAppProps> = ({
  isListening,
  onToggleListening,
  callMode,
  onCallModeChange,
  sourceLang,
  targetLang,
  onSourceLangChange,
  onTargetLangChange,
  onSwapLanguages,
  transcripts,
  onClearTranscripts,
  telemetry,
  isMicMuted,
  onToggleMicMute,
  autoSpeakTranslation,
  onToggleAutoSpeak,
  onSendCustomSpeech,
  isProcessingSpeech,
  onPlayTts,
  callDurationSeconds,
  onOpenDevModal,
  vadThreshold,
  onVadThresholdChange,
  activeSpeakerLabel,
}) => {
  const [customInputText, setCustomInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcripts when new item arrives
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendCustomText = async (speaker: 'LOCAL_USER' | 'REMOTE_PARTY' = 'LOCAL_USER') => {
    if (!customInputText.trim() || isProcessingSpeech) return;
    const textToSend = customInputText.trim();
    setCustomInputText('');
    await onSendCustomSpeech(textToSend, speaker);
  };

  const handleQuickPhraseClick = async (phrase: QuickCallPhrase) => {
    if (isProcessingSpeech) return;
    await onSendCustomSpeech(phrase.english, 'LOCAL_USER');
  };

  const handleCopyTranscript = (item: TranscriptItem) => {
    const copyText = `${item.speaker === 'LOCAL_USER' ? 'You' : 'Remote'}: "${item.originalText}" -> "${item.translatedText}"`;
    navigator.clipboard.writeText(copyText);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportTranscriptText = () => {
    if (transcripts.length === 0) return;
    const lines = transcripts.map((t) => {
      const time = new Date(t.timestamp).toLocaleTimeString();
      const speaker = t.speaker === 'LOCAL_USER' ? 'You' : 'Remote Party';
      return `[${time}] ${speaker} (${t.sourceLang} -> ${t.targetLang}):\nOriginal: ${t.originalText}\nTranslated: ${t.translatedText}\n`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-translation-transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const latestTranscript = transcripts[transcripts.length - 1];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Top Application Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-white tracking-tight">
                  Real-Time Call Translator
                </h1>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Two-way speech translation for active phone calls • Android 14+ Telecom Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Guide Button */}
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Call Setup Guide</span>
            </button>

            {/* Android 14 Project Button */}
            <button
              onClick={onOpenDevModal}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition active:scale-95"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Android 14 Project</span>
            </button>
          </div>
        </div>
      </header>

      {/* Setup Guide Banner (Collapsible) */}
      {showGuide && (
        <div className="bg-indigo-950/40 border-b border-indigo-800/50 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-indigo-200">
            <div className="flex items-start gap-2.5">
              <Headphones className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold text-white">How to translate a REAL phone call:</span>
                <span className="ml-1 text-indigo-200/90">
                  Place your phone on <strong>speakerphone</strong> next to this microphone (or use a Bluetooth headset). The engine isolates both your voice and the phone speaker audio with hardware echo cancellation, translates in real-time, and plays translated speech back into the call so the other person hears it!
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-xs text-indigo-400 hover:text-white underline self-end sm:self-center"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Call Controls & Audio Console (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Main Status & Activation Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm">
            {/* Mode Selector Tabs */}
            <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-5">
              <button
                onClick={() => onCallModeChange('LIVE_CALL_COMPANION')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  callMode === 'LIVE_CALL_COMPANION'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Active Call Companion</span>
              </button>
              <button
                onClick={() => onCallModeChange('DUAL_SPEAKER')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                  callMode === 'DUAL_SPEAKER'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Two-Way Conversation</span>
              </button>
            </div>

            {/* Live State & Timer */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isListening ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
                  {isListening ? 'Live Translation Active' : 'Standby / Idle'}
                </span>
              </div>
              {isListening && (
                <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-slate-800 text-emerald-400 border border-slate-700">
                  {formatDuration(callDurationSeconds)}
                </div>
              )}
            </div>

            {/* Language Pair Selector */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5 mb-5">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Translation Route</span>
                <span className="text-indigo-400 font-mono text-[10px]">GEMINI 3.8 FLASH</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Source Language */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">
                    {callMode === 'LIVE_CALL_COMPANION' ? 'Your Language' : 'Speaker 1'}
                  </label>
                  <select
                    value={sourceLang.code}
                    onChange={(e) => {
                      const found = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
                      if (found) onSourceLangChange(found);
                    }}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Swap Button */}
                <button
                  onClick={onSwapLanguages}
                  className="mt-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
                  title="Swap Languages"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>

                {/* Target Language */}
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] text-slate-500 font-medium mb-1">
                    {callMode === 'LIVE_CALL_COMPANION' ? 'Caller / Remote Language' : 'Speaker 2'}
                  </label>
                  <select
                    value={targetLang.code}
                    onChange={(e) => {
                      const found = SUPPORTED_LANGUAGES.find((l) => l.code === e.target.value);
                      if (found) onTargetLangChange(found);
                    }}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg py-2 px-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.flag} {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={onToggleListening}
              className={`w-full py-4 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg transition active:scale-98 ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>Stop Call Translation</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>Start Live Call Translation</span>
                </>
              )}
            </button>

            {/* In-Call Quick Controls */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={onToggleMicMute}
                disabled={!isListening}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-40 ${
                  isMicMuted
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMicMuted ? 'Mic Muted' : 'Mute Mic'}</span>
              </button>

              <button
                onClick={onToggleAutoSpeak}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  autoSpeakTranslation
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {autoSpeakTranslation ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{autoSpeakTranslation ? 'Auto-TTS On' : 'Auto-TTS Off'}</span>
              </button>
            </div>
          </div>

          {/* Real-Time Audio Hardware & VAD Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                <span>Audio Engine &amp; VAD Telemetry</span>
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                telemetry.isVoiceActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {telemetry.isVoiceActive ? 'VOICE DETECTED' : 'SILENCE GATED'}
              </span>
            </div>

            {/* Decibel VU Meter */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Input Level</span>
                <span className="font-mono font-bold text-slate-200">
                  {telemetry.currentDecibels.toFixed(1)} dBFS
                </span>
              </div>
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                <div
                  className={`h-full transition-all duration-75 rounded-full ${
                    telemetry.isVoiceActive ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.min(100, (telemetry.currentDecibels / 90) * 100)}%` }}
                />
                {/* VAD threshold marker line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                  style={{ left: `${(vadThreshold / 90) * 100}%` }}
                  title={`VAD Threshold: ${vadThreshold}dB`}
                />
              </div>
            </div>

            {/* VAD Sensitivity Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>VAD Threshold (Gate Silence)</span>
                <span className="font-mono text-slate-300">{vadThreshold} dB</span>
              </div>
              <input
                type="range"
                min="15"
                max="60"
                step="1"
                value={vadThreshold}
                onChange={(e) => onVadThresholdChange(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Hardware Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-500">Sample Rate</div>
                <div className="font-mono font-bold text-slate-200">16,000 Hz</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-500">Chunk Size</div>
                <div className="font-mono font-bold text-slate-200">3200 B</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="text-[10px] text-slate-500">API Latency</div>
                <div className="font-mono font-bold text-emerald-400">
                  {telemetry.currentLatencyMs > 0 ? `${telemetry.currentLatencyMs}ms` : '--'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Spoken Phrases for Live Calls */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
              <span>Quick Spoken Phone Phrases</span>
              <span className="text-[10px] text-slate-500 lowercase">tap to speak into call</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REAL_CALL_QUICK_PHRASES.map((phrase) => (
                <button
                  key={phrase.id}
                  onClick={() => handleQuickPhraseClick(phrase)}
                  disabled={isProcessingSpeech}
                  className="p-2 text-left rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50"
                >
                  <div className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wide">
                    {phrase.category}
                  </div>
                  <div className="line-clamp-2 mt-0.5">{phrase.english}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Subtitles, Transcripts & Spoken Output (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Active Subtitle Heads-Up Banner */}
          <div className="rounded-2xl border border-indigo-900/50 bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-slate-900/80 p-5 shadow-xl backdrop-blur-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                <span>Live Subtitles HUD</span>
              </span>
              {activeSpeakerLabel && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Speaking: {activeSpeakerLabel}
                </span>
              )}
            </div>

            {latestTranscript ? (
              <div className="py-2">
                <div className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {latestTranscript.translatedText}
                </div>
                {latestTranscript.originalText && (
                  <div className="text-sm text-slate-400 mt-1 italic">
                    "{latestTranscript.originalText}"
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-slate-500 text-sm italic">
                {isListening
                  ? 'Listening for speech from you or the phone call...'
                  : 'Start call translation to view live subtitles in real-time.'}
              </div>
            )}
          </div>

          {/* Full Conversation Transcript Feed */}
          <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Call Conversation Transcript</h3>
                <span className="text-xs text-slate-400 font-mono">({transcripts.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportTranscriptText}
                  disabled={transcripts.length === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30"
                  title="Download .txt"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  onClick={onClearTranscripts}
                  disabled={transcripts.length === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition disabled:opacity-30"
                  title="Clear Transcripts"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Transcripts Scroll Container */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[440px]">
              {transcripts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 text-center">
                  <PhoneCall className="w-10 h-10 text-slate-700 mb-3" />
                  <p className="text-sm font-medium text-slate-400">No utterances recorded yet</p>
                  <p className="text-xs text-slate-600 max-w-sm mt-1">
                    Click "Start Live Call Translation" and begin speaking or initiate a phone call on speakerphone.
                  </p>
                </div>
              ) : (
                transcripts.map((item) => {
                  const isUser = item.speaker === 'LOCAL_USER';
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {isUser ? 'You' : 'Remote Party'}
                        </span>
                        <span className="text-[9px] text-slate-600 font-mono">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        {item.latencyMs && (
                          <span className="text-[9px] font-mono text-emerald-400/80">
                            {item.latencyMs}ms
                          </span>
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 border shadow-sm ${
                          isUser
                            ? 'bg-indigo-600/20 border-indigo-500/30 text-white rounded-tr-none'
                            : 'bg-slate-800/80 border-slate-700/80 text-slate-100 rounded-tl-none'
                        }`}
                      >
                        <div className="font-semibold text-sm leading-relaxed">
                          {item.translatedText}
                        </div>
                        {item.originalText && item.originalText !== item.translatedText && (
                          <div className="text-xs text-slate-400 mt-1 italic pt-1 border-t border-slate-700/50">
                            "{item.originalText}"
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 mt-2 pt-1">
                          <button
                            onClick={() => onPlayTts(item.translatedText, item.targetLang, item.audioUrl)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
                            title="Play Spoken Audio"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyTranscript(item)}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
                            title="Copy"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Custom Spoken Text Input Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendCustomText('LOCAL_USER');
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={customInputText}
                  onChange={(e) => setCustomInputText(e.target.value)}
                  placeholder={`Type in ${sourceLang.name} to translate & speak out loud...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={!customInputText.trim() || isProcessingSpeech}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Speak into Call</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
