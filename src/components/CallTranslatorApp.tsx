import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
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
  Bell,
  Send,
  Code2,
  Settings,
  X,
  ShieldCheck,
  Check,
  Download,
  Grid,
  Users,
  User,
  Activity,
  MessageSquare,
  Globe,
  Sliders
} from 'lucide-react';
import { SupportedLanguage, TranscriptItem, HardwareTelemetry, CallState, CallMode } from '../types';
import { SUPPORTED_LANGUAGES, CALL_CONTACTS, CallContact, IN_CALL_QUICK_PHRASES } from '../data/languages';
import { callSoundEngine } from '../utils/callSounds';

interface CallTranslatorAppProps {
  callState: CallState;
  callMode: CallMode;
  onCallModeChange: (mode: CallMode) => void;
  onStartCall: (contact?: CallContact, customNumber?: string) => void;
  onEndCall: () => void;
  activeContact: CallContact | null;
  customPhoneNumber: string;
  onCustomPhoneNumberChange: (num: string) => void;
  sourceLang: SupportedLanguage;
  targetLang: SupportedLanguage;
  onSourceLangChange: (lang: SupportedLanguage) => void;
  onTargetLangChange: (lang: SupportedLanguage) => void;
  onSwapLanguages: () => void;
  transcripts: TranscriptItem[];
  onClearTranscripts: () => void;
  telemetry: HardwareTelemetry;
  useLiveMic: boolean;
  onToggleLiveMic: () => void;
  isMicMuted: boolean;
  onToggleMicMute: () => void;
  isSpeakerOn: boolean;
  onToggleSpeaker: () => void;
  autoSpeakTranslation: boolean;
  onToggleAutoSpeak: () => void;
  onSendSpeech: (text: string, speaker: 'LOCAL_USER' | 'REMOTE_PARTY') => Promise<void>;
  isProcessingSpeech: boolean;
  onPlayTts: (text: string, lang: string, audioUrl?: string | null) => void;
  callDurationSeconds: number;
  onOpenDevSheet: () => void;
  vadThreshold: number;
  onVadThresholdChange: (threshold: number) => void;
  activeSpeakerLabel: string | null;
}

export const CallTranslatorApp: React.FC<CallTranslatorAppProps> = ({
  callState,
  callMode,
  onCallModeChange,
  onStartCall,
  onEndCall,
  activeContact,
  customPhoneNumber,
  onCustomPhoneNumberChange,
  sourceLang,
  targetLang,
  onSourceLangChange,
  onTargetLangChange,
  onSwapLanguages,
  transcripts,
  onClearTranscripts,
  telemetry,
  useLiveMic,
  onToggleLiveMic,
  isMicMuted,
  onToggleMicMute,
  isSpeakerOn,
  onToggleSpeaker,
  autoSpeakTranslation,
  onToggleAutoSpeak,
  onSendSpeech,
  isProcessingSpeech,
  onPlayTts,
  callDurationSeconds,
  onOpenDevSheet,
  vadThreshold,
  onVadThresholdChange,
  activeSpeakerLabel,
}) => {
  const [showNotificationShade, setShowNotificationShade] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);
  const [customInputText, setCustomInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'CONTACTS' | 'DIALER' | 'TRANSCRIPT'>('CONTACTS');
  const [showInCallKeypad, setShowInCallKeypad] = useState(false);
  const [showInCallSettings, setShowInCallSettings] = useState(false);
  const [searchLangQuery, setSearchLangQuery] = useState('');

  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript container during call
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcripts, isProcessingSpeech]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCustomSubmit = (e?: React.FormEvent, speaker: 'LOCAL_USER' | 'REMOTE_PARTY' = 'LOCAL_USER') => {
    if (e) e.preventDefault();
    if (!customInputText.trim() || isProcessingSpeech) return;
    onSendSpeech(customInputText.trim(), speaker);
    setCustomInputText('');
  };

  const handleDtmfPress = (key: string) => {
    callSoundEngine.playDtmf(key);
    if (callState === 'IDLE') {
      onCustomPhoneNumberChange(customPhoneNumber + key);
    }
  };

  const handleExportTranscript = () => {
    if (transcripts.length === 0) return;
    const content = transcripts
      .map(
        (t) =>
          `[${new Date(t.timestamp).toLocaleTimeString()}] ${t.speaker === 'LOCAL_USER' ? 'You' : 'Remote Party'}:
Original (${t.sourceLang}): ${t.originalText}
Translation (${t.targetLang}): ${t.translatedText}\n`
      )
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchLangQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchLangQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchLangQuery.toLowerCase())
  );

  return (
    <div className="relative w-full h-full flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden select-none">
      {/* Top App Bar (Android Compose TopAppBar with material header) */}
      <header className="flex-shrink-0 px-4 py-2.5 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-950/40">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-neutral-100 tracking-tight flex items-center gap-1.5">
              Live Call Translator
            </h1>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`w-2 h-2 rounded-full ${
                  callState === 'IN_CALL'
                    ? 'bg-emerald-400 animate-pulse'
                    : callState === 'RINGING' || callState === 'DIALING'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-neutral-500'
                }`}
              />
              <span
                className={
                  callState === 'IN_CALL'
                    ? 'text-emerald-400 font-semibold'
                    : callState === 'RINGING' || callState === 'DIALING'
                    ? 'text-amber-400 font-medium'
                    : 'text-neutral-400'
                }
              >
                {callState === 'IN_CALL'
                  ? `In Call • ${formatTime(callDurationSeconds)}`
                  : callState === 'RINGING' || callState === 'DIALING'
                  ? 'Connecting...'
                  : 'Ready • AEC 16kHz'}
              </span>
              {callState === 'IN_CALL' && isMicMuted && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/70 text-red-200 border border-red-700/50">
                  MUTED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top App Bar Actions */}
        <div className="flex items-center gap-1.5">
          {/* Notification Shade Trigger (Android 14 Foreground Service) */}
          <button
            onClick={() => setShowNotificationShade(!showNotificationShade)}
            className={`p-2 rounded-xl border text-xs transition relative ${
              callState === 'IN_CALL'
                ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40'
                : 'border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900'
            }`}
            title="Android 14 Foreground Service Notification"
            aria-label="Notification shade"
          >
            <Bell className="w-4 h-4" />
            {callState === 'IN_CALL' && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            )}
          </button>

          {/* Discreet Developer / Architecture Inspector */}
          <button
            onClick={onOpenDevSheet}
            className="p-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-indigo-300 transition"
            title="Developer Inspector & Kotlin Android 14 Project Code"
            aria-label="Developer settings"
          >
            <Code2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Android 14 Foreground Service Notification Shade Dropdown */}
      {showNotificationShade && (
        <div className="absolute top-13 inset-x-2 z-40 bg-neutral-900/98 backdrop-blur-md rounded-2xl border border-neutral-800 p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-neutral-200">
                Android 14 Foreground Service
              </span>
            </div>
            <button
              onClick={() => setShowNotificationShade(false)}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Service Class:</span>
              <span className="font-mono text-[11px] text-indigo-400">CallTranslationService</span>
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Foreground Type:</span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-1 rounded">
                MICROPHONE | MEDIA_PLAYBACK
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Hardware Audio HAL:</span>
              <span className="text-[11px]">16kHz Mono PCM16 (AEC Voice)</span>
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">WebSocket Pipeline:</span>
              <span className={`text-[11px] font-mono ${telemetry.wsConnected ? 'text-emerald-400' : 'text-neutral-400'}`}>
                {telemetry.wsConnected ? 'CONNECTED (wss://)' : 'STANDBY'}
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Est. Latency:</span>
              <span className="font-mono text-emerald-400">{telemetry.currentLatencyMs} ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Dynamic View: Switched based on CallState */}
      {callState === 'IN_CALL' ? (
        /* ================= IN-CALL SCREEN (TRANSLATE WHILE CALLING) ================= */
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 relative overflow-hidden">
          {/* In-Call Header: Contact info & Live duration */}
          <div className="flex-shrink-0 px-4 pt-3 pb-2 flex items-center justify-between border-b border-neutral-800/60 bg-neutral-900/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-2xl shadow-inner">
                {activeContact ? activeContact.avatar : '📞'}
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                  {activeContact ? activeContact.name : customPhoneNumber || 'Voice Call'}
                </h2>
                <p className="text-xs text-neutral-400 flex items-center gap-1">
                  <span>{activeContact ? activeContact.location : 'Direct Line'}</span>
                  <span>•</span>
                  <span className="text-indigo-400 font-medium">
                    {sourceLang.name.split(' ')[0]} ⇄ {targetLang.name.split(' ')[0]}
                  </span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-base font-mono font-bold text-emerald-400 tracking-wider">
                {formatTime(callDurationSeconds)}
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{telemetry.currentLatencyMs}ms AEC</span>
              </div>
            </div>
          </div>

          {/* Audio Waveform Activity HUD (Remote Party & Local User) */}
          <div className="flex-shrink-0 px-4 py-2 bg-neutral-900/60 border-b border-neutral-800/40 grid grid-cols-2 gap-2 text-xs">
            {/* Remote Party Audio Stream */}
            <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-950/80 text-teal-400 flex items-center justify-center text-xs">
                {activeContact ? activeContact.avatar : '🌐'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="truncate">{activeContact ? activeContact.name.split(' ')[0] : 'Remote'}</span>
                  <span className="text-teal-400 font-mono text-[10px]">AudioTrack</span>
                </div>
                {/* Visualizer bars */}
                <div className="flex items-center gap-0.5 h-3 mt-0.5">
                  {[40, 70, 30, 85, 55, 60, 20].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        activeSpeakerLabel?.includes('Remote') || isProcessingSpeech
                          ? 'bg-teal-400'
                          : 'bg-neutral-800'
                      }`}
                      style={{
                        height:
                          activeSpeakerLabel?.includes('Remote') || isProcessingSpeech
                            ? `${Math.max(15, (h * (Math.random() + 0.5)) % 100)}%`
                            : '20%',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Local User (You) Audio Stream */}
            <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-950/80 text-indigo-400 flex items-center justify-center text-xs">
                {isMicMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>You (Mic)</span>
                  <span className={`font-mono text-[10px] ${telemetry.isVoiceActive ? 'text-indigo-400' : 'text-neutral-500'}`}>
                    {Math.round(telemetry.currentDecibels)} dB
                  </span>
                </div>
                {/* Visualizer bars */}
                <div className="flex items-center gap-0.5 h-3 mt-0.5">
                  {[25, 60, 80, 45, 90, 35, 50].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-150 ${
                        telemetry.isVoiceActive && !isMicMuted ? 'bg-indigo-400' : 'bg-neutral-800'
                      }`}
                      style={{
                        height:
                          telemetry.isVoiceActive && !isMicMuted
                            ? `${Math.min(100, Math.max(20, (telemetry.currentDecibels / 80) * h))}%`
                            : '20%',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Floating Translation HUD (Shows what is being translated in real-time) */}
          {activeSpeakerLabel && (
            <div className="px-4 py-1.5 bg-indigo-950/40 border-b border-indigo-800/30 flex items-center justify-between text-xs text-indigo-300 animate-pulse">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                <span>{activeSpeakerLabel}</span>
              </div>
              <span className="text-[10px] font-mono text-indigo-400">Translating...</span>
            </div>
          )}

          {/* Live In-Call Conversation Stream (Transcripts with instantaneous translation) */}
          <div
            ref={transcriptScrollRef}
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 scroll-smooth"
          >
            {transcripts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-3 text-neutral-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-300">Live Call Translation Active</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                  Speak into your microphone or tap a quick phrase below. Your speech will be translated and spoken aloud in the call immediately!
                </p>
              </div>
            ) : (
              transcripts.map((item) => {
                const isLocal = item.speaker === 'LOCAL_USER';
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col ${isLocal ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3 shadow-md ${
                        isLocal
                          ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-xs'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-tl-xs'
                      }`}
                    >
                      {/* Speaker Badge */}
                      <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1">
                        <span className="font-semibold uppercase tracking-wider">
                          {isLocal ? 'You' : activeContact ? activeContact.name : 'Remote Party'}
                        </span>
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>

                      {/* Translated Speech (Primary for the listener) */}
                      <p className="text-sm font-medium leading-relaxed">
                        {item.translatedText}
                      </p>

                      {/* Original Speech Subtitle */}
                      <p
                        className={`text-xs mt-1.5 pt-1.5 border-t border-white/10 leading-snug ${
                          isLocal ? 'text-indigo-200' : 'text-neutral-400'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold mr-1 opacity-70">
                          {item.sourceLang.split('-')[0]}:
                        </span>
                        {item.originalText}
                      </p>

                      {/* Audio replay button */}
                      <div className="mt-2 flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPlayTts(item.translatedText, item.targetLang, item.audioUrl)}
                          className="px-2 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-[10px] flex items-center gap-1 transition"
                          title="Play translated speech"
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>Replay</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {isProcessingSpeech && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 p-2 rounded-xl bg-neutral-900/60 w-fit">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span>Translating voice stream...</span>
              </div>
            )}
          </div>

          {/* Quick In-Call Phrases (Instant 1-tap translation during the call) */}
          <div className="flex-shrink-0 px-3 py-1.5 bg-neutral-900/40 border-t border-neutral-800/40 overflow-x-auto no-scrollbar flex items-center gap-1.5">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider pl-1 whitespace-nowrap">
              Quick Say:
            </span>
            {IN_CALL_QUICK_PHRASES.map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => onSendSpeech(phrase, 'LOCAL_USER')}
                disabled={isProcessingSpeech}
                className="px-2.5 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs whitespace-nowrap border border-neutral-700/60 transition active:scale-95 disabled:opacity-50"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* In-Call Keypad (DTMF Dialpad overlay) */}
          {showInCallKeypad && (
            <div className="p-3 bg-neutral-900 border-t border-neutral-800 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 text-xs">
                <span className="text-neutral-400 font-semibold">Touch-Tone Keypad (DTMF)</span>
                <button
                  onClick={() => setShowInCallKeypad(false)}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleDtmfPress(k)}
                    className="h-10 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-sm flex items-center justify-center transition active:bg-indigo-600"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* In-Call Settings Overlay */}
          {showInCallSettings && (
            <div className="p-3 bg-neutral-900 border-t border-neutral-800 animate-in fade-in duration-150 text-xs space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
                <span className="font-semibold text-neutral-200">In-Call Translation Controls</span>
                <button
                  onClick={() => setShowInCallSettings(false)}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-neutral-200">Auto-Speak Translations (TTS)</div>
                  <div className="text-[11px] text-neutral-400">Play translated voice over call audio</div>
                </div>
                <button
                  onClick={onToggleAutoSpeak}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    autoSpeakTranslation ? 'bg-emerald-600' : 'bg-neutral-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      autoSpeakTranslation ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-neutral-300">VAD Sensitivity Threshold:</span>
                  <span className="font-mono text-indigo-400">{vadThreshold} dB</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="50"
                  value={vadThreshold}
                  onChange={(e) => onVadThresholdChange(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleExportTranscript}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Call Transcript (.txt)</span>
                </button>
                <button
                  onClick={onClearTranscripts}
                  className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 transition"
                >
                  Clear History
                </button>
              </div>
            </div>
          )}

          {/* In-Call Bottom Control Bar (Android Phone In-Call Controls) */}
          <div className="flex-shrink-0 px-4 py-3 bg-neutral-900/95 border-t border-neutral-800">
            {/* Direct Speech / Text Bar */}
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={customInputText}
                onChange={(e) => setCustomInputText(e.target.value)}
                placeholder="Type or speak anything to translate in call..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!customInputText.trim() || isProcessingSpeech}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition"
                title="Send speech"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* Phone In-Call Buttons (Mute, Keypad, Speaker, Swap, Settings, Hangup) */}
            <div className="flex items-center justify-around">
              {/* Mute Mic */}
              <button
                onClick={onToggleMicMute}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition ${
                  isMicMuted ? 'text-red-400 bg-red-950/60' : 'text-neutral-300 hover:text-white'
                }`}
                title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border transition ${
                    isMicMuted
                      ? 'border-red-500 bg-red-900/40'
                      : 'border-neutral-700 bg-neutral-800'
                  }`}
                >
                  {isMicMuted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5" />}
                </div>
                <span className="text-[10px]">{isMicMuted ? 'Unmute' : 'Mute'}</span>
              </button>

              {/* Keypad */}
              <button
                onClick={() => setShowInCallKeypad(!showInCallKeypad)}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition ${
                  showInCallKeypad ? 'text-indigo-400' : 'text-neutral-300 hover:text-white'
                }`}
                title="Open touch-tone keypad"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border ${
                    showInCallKeypad
                      ? 'border-indigo-500 bg-indigo-950/50'
                      : 'border-neutral-700 bg-neutral-800'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Keypad</span>
              </button>

              {/* Speaker / Earpiece */}
              <button
                onClick={onToggleSpeaker}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition ${
                  isSpeakerOn ? 'text-emerald-400' : 'text-neutral-300 hover:text-white'
                }`}
                title={isSpeakerOn ? 'Speakerphone Active' : 'Earpiece Mode'}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border ${
                    isSpeakerOn
                      ? 'border-emerald-500 bg-emerald-950/50'
                      : 'border-neutral-700 bg-neutral-800'
                  }`}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </div>
                <span className="text-[10px]">{isSpeakerOn ? 'Speaker' : 'Earpiece'}</span>
              </button>

              {/* Swap Languages */}
              <button
                onClick={onSwapLanguages}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl text-neutral-300 hover:text-white transition"
                title="Swap translation direction"
              >
                <div className="w-11 h-11 rounded-full flex items-center justify-center border border-neutral-700 bg-neutral-800">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Swap</span>
              </button>

              {/* Settings / Controls */}
              <button
                onClick={() => setShowInCallSettings(!showInCallSettings)}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition ${
                  showInCallSettings ? 'text-indigo-400' : 'text-neutral-300 hover:text-white'
                }`}
                title="In-call settings"
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center border ${
                    showInCallSettings
                      ? 'border-indigo-500 bg-indigo-950/50'
                      : 'border-neutral-700 bg-neutral-800'
                  }`}
                >
                  <Sliders className="w-5 h-5" />
                </div>
                <span className="text-[10px]">Controls</span>
              </button>

              {/* Big Red Hang Up Button */}
              <button
                onClick={onEndCall}
                className="flex flex-col items-center gap-1 p-2 rounded-2xl text-white transition active:scale-95"
                title="End Translation Call"
              >
                <div className="w-13 h-13 rounded-full bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/50 flex items-center justify-center">
                  <PhoneOff className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-red-400 font-semibold">End Call</span>
              </button>
            </div>
          </div>
        </div>
      ) : callState === 'RINGING' || callState === 'DIALING' ? (
        /* ================= OUTGOING CALLING / RINGING SCREEN ================= */
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 text-center relative overflow-hidden">
          {/* Pulsating Ringing Waves */}
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full bg-indigo-600/20 absolute -inset-4 animate-ping" />
            <div className="w-24 h-24 rounded-full bg-emerald-500/30 absolute -inset-2 animate-pulse" />
            <div className="w-20 h-20 rounded-3xl bg-neutral-800 border-2 border-indigo-500 flex items-center justify-center text-4xl shadow-2xl relative z-10">
              {activeContact ? activeContact.avatar : '📞'}
            </div>
          </div>

          <h2 className="text-xl font-bold text-neutral-100">
            {activeContact ? activeContact.name : customPhoneNumber || 'Voice Call'}
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            {activeContact ? `${activeContact.role} • ${activeContact.location}` : 'Live Translation Call'}
          </p>
          <div className="mt-4 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-indigo-400 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Establishing AEC 16kHz WebSocket...</span>
          </div>

          <div className="mt-12">
            <button
              onClick={onEndCall}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center text-white shadow-xl shadow-red-950 transition active:scale-95"
              title="Cancel Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="block text-xs text-neutral-400 mt-2 font-medium">Cancel</span>
          </div>
        </div>
      ) : (
        /* ================= IDLE CALL HUB (CONTACTS / DIALER / TRANSLATION SETUP) ================= */
        <div className="flex-1 flex flex-col min-h-0 bg-neutral-950">
          {/* Language Pair Selector Strip */}
          <div className="flex-shrink-0 px-4 py-3 bg-neutral-900/60 border-b border-neutral-800">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
              <span>Your Spoken Language</span>
              <span>Translate To</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Source Language Button */}
              <div className="relative flex-1">
                <button
                  onClick={() => {
                    setSourceDropdownOpen(!sourceDropdownOpen);
                    setTargetDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-left transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{sourceLang.flag}</span>
                    <span className="text-xs font-semibold text-neutral-200 truncate">
                      {sourceLang.name}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-1 flex-shrink-0" />
                </button>

                {sourceDropdownOpen && (
                  <div className="absolute top-11 inset-x-0 z-50 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 max-h-60 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Search language..."
                      value={searchLangQuery}
                      onChange={(e) => setSearchLangQuery(e.target.value)}
                      className="w-full px-2 py-1 mb-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
                    />
                    {filteredLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onSourceLangChange(lang);
                          setSourceDropdownOpen(false);
                          setSearchLangQuery('');
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition ${
                          sourceLang.code === lang.code
                            ? 'bg-indigo-600 text-white'
                            : 'hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span className="flex-1 truncate">{lang.name}</span>
                        <span className="text-[10px] opacity-70">{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap Button */}
              <button
                onClick={onSwapLanguages}
                className="p-2 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition active:scale-95"
                title="Swap translation languages"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>

              {/* Target Language Button */}
              <div className="relative flex-1">
                <button
                  onClick={() => {
                    setTargetDropdownOpen(!targetDropdownOpen);
                    setSourceDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-left transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{targetLang.flag}</span>
                    <span className="text-xs font-semibold text-neutral-200 truncate">
                      {targetLang.name}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-1 flex-shrink-0" />
                </button>

                {targetDropdownOpen && (
                  <div className="absolute top-11 inset-x-0 z-50 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-2 max-h-60 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Search language..."
                      value={searchLangQuery}
                      onChange={(e) => setSearchLangQuery(e.target.value)}
                      className="w-full px-2 py-1 mb-2 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none"
                    />
                    {filteredLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          onTargetLangChange(lang);
                          setTargetDropdownOpen(false);
                          setSearchLangQuery('');
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition ${
                          targetLang.code === lang.code
                            ? 'bg-emerald-600 text-white'
                            : 'hover:bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span className="flex-1 truncate">{lang.name}</span>
                        <span className="text-[10px] opacity-70">{lang.nativeName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs (Call Contacts, Phone Dialer, Past Transcripts) */}
          <div className="flex-shrink-0 px-4 pt-2 border-b border-neutral-800 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('CONTACTS')}
              className={`pb-2.5 px-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
                activeTab === 'CONTACTS'
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Call Partners</span>
            </button>
            <button
              onClick={() => setActiveTab('DIALER')}
              className={`pb-2.5 px-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
                activeTab === 'DIALER'
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Keypad Dialer</span>
            </button>
            <button
              onClick={() => setActiveTab('TRANSCRIPT')}
              className={`pb-2.5 px-2 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
                activeTab === 'TRANSCRIPT'
                  ? 'border-indigo-500 text-indigo-400 font-bold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Call History ({transcripts.length})</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {activeTab === 'CONTACTS' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                  <span>Select a native speaker to call with live translation:</span>
                  <span className="text-[11px] text-emerald-400 font-medium">Interactive Calling</span>
                </div>

                {CALL_CONTACTS.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl flex-shrink-0">
                        {contact.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-neutral-200 truncate">{contact.name}</h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800/50">
                            {contact.languageName.split(' ')[0]}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 truncate">{contact.role}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{contact.phone} • {contact.location}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onStartCall(contact)}
                      className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition active:scale-95 flex-shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : activeTab === 'DIALER' ? (
              <div className="max-w-xs mx-auto flex flex-col items-center">
                {/* Number Display */}
                <div className="w-full mb-4 px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-center">
                  <div className="text-xl font-mono font-bold text-neutral-100 tracking-wider min-h-[28px]">
                    {customPhoneNumber || 'Enter number'}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    Live translation enabled: {sourceLang.name.split(' ')[0]} ⇄ {targetLang.name.split(' ')[0]}
                  </div>
                </div>

                {/* Keypad Grid */}
                <div className="grid grid-cols-3 gap-3 w-full mb-6">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                    <button
                      key={k}
                      onClick={() => handleDtmfPress(k)}
                      className="h-14 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-lg font-bold text-neutral-200 flex flex-col items-center justify-center transition active:bg-indigo-600 active:text-white"
                    >
                      <span>{k}</span>
                    </button>
                  ))}
                </div>

                {/* Call & Backspace Controls */}
                <div className="flex items-center gap-4">
                  {customPhoneNumber.length > 0 && (
                    <button
                      onClick={() => onCustomPhoneNumberChange(customPhoneNumber.slice(0, -1))}
                      className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition"
                      title="Backspace"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => onStartCall(undefined, customPhoneNumber || '+1 (555) 019-2831')}
                    className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-95"
                  >
                    <Phone className="w-5 h-5" />
                    <span>Start Call</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TRANSCRIPT TAB */
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs">
                  <span className="text-neutral-400">Archived Call Transcripts</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportTranscript}
                      disabled={transcripts.length === 0}
                      className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs flex items-center gap-1 transition disabled:opacity-40"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export</span>
                    </button>
                    <button
                      onClick={onClearTranscripts}
                      disabled={transcripts.length === 0}
                      className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs transition disabled:opacity-40"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {transcripts.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500 text-xs">
                    No transcript entries yet. Start a call to generate live translated speech logs!
                  </div>
                ) : (
                  transcripts.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-neutral-400">
                        <span className="font-semibold text-indigo-400">
                          {t.speaker === 'LOCAL_USER' ? 'You' : 'Remote Party'}
                        </span>
                        <span>{new Date(t.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-neutral-200 font-medium">{t.translatedText}</p>
                      <p className="text-neutral-400 text-[11px] pt-1 border-t border-neutral-800">
                        Original: {t.originalText}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Start Floating Call Bar at bottom of IDLE screen */}
          <div className="flex-shrink-0 p-3 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleLiveMic}
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-1.5 transition ${
                  useLiveMic
                    ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
                title="Microphone input toggle"
              >
                {useLiveMic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span className="font-medium">{useLiveMic ? 'Mic Live' : 'Mic Off'}</span>
              </button>

              <button
                onClick={onToggleAutoSpeak}
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-1.5 transition ${
                  autoSpeakTranslation
                    ? 'border-indigo-500/50 bg-indigo-950/40 text-indigo-400'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
                title="Auto-speak translations toggle"
              >
                <Volume2 className="w-4 h-4" />
                <span className="font-medium">{autoSpeakTranslation ? 'TTS On' : 'TTS Off'}</span>
              </button>
            </div>

            <button
              onClick={() => onStartCall(CALL_CONTACTS[0])}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 transition active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Call Elena (Live Translation)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
