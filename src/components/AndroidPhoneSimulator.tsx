import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Wifi,
  Battery,
  ArrowRightLeft,
  ChevronDown,
  Volume2 as SpeakerIcon,
  Play,
  RotateCcw,
  Sparkles,
  Radio,
  Sliders,
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SupportedLanguage, TranscriptItem, HardwareTelemetry } from '../types';
import { SUPPORTED_LANGUAGES, PRESET_CALL_SCENARIOS } from '../data/languages';

interface AndroidPhoneSimulatorProps {
  isCallActive: boolean;
  onStartCall: () => void;
  onStopCall: () => void;
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
  onSendSimulatedSpeech: (text: string, speaker: 'LOCAL_USER' | 'REMOTE_PARTY') => void;
  isProcessingSpeech: boolean;
  onPlayTts: (text: string, lang: string, audioUrl?: string | null) => void;
  callDurationSeconds: number;
}

export const AndroidPhoneSimulator: React.FC<AndroidPhoneSimulatorProps> = ({
  isCallActive,
  onStartCall,
  onStopCall,
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
  onSendSimulatedSpeech,
  isProcessingSpeech,
  onPlayTts,
  callDurationSeconds,
}) => {
  const [showNotificationShade, setShowNotificationShade] = useState(false);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript container
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendPrompt = (text: string, speaker: 'LOCAL_USER' | 'REMOTE_PARTY') => {
    if (!text.trim() || isProcessingSpeech) return;
    onSendSimulatedSpeech(text.trim(), speaker);
    setCustomInput('');
  };

  return (
    <div className="flex flex-col items-center">
      {/* Device Frame */}
      <div className="relative w-[380px] h-[780px] bg-neutral-950 rounded-[48px] p-3 shadow-2xl border-4 border-neutral-800 ring-1 ring-white/10 flex flex-col overflow-hidden select-none">
        {/* Hardware Bezel & Punch Hole Speaker / Camera */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-neutral-900 rounded-b-2xl z-50 flex items-center justify-center gap-3">
          <div className="w-12 h-1 bg-neutral-700 rounded-full" />
          <div className="w-2.5 h-2.5 bg-neutral-800 rounded-full border border-neutral-700/80" />
        </div>

        {/* Screen Content Wrapper */}
        <div className="relative w-full h-full bg-neutral-900 rounded-[38px] flex flex-col overflow-hidden text-neutral-100 font-sans">
          {/* Android 14 Status Bar */}
          <div className="h-9 px-6 pt-1.5 flex items-center justify-between text-xs font-medium text-neutral-300 z-40 bg-neutral-900/90 backdrop-blur">
            <span>09:41</span>

            {/* Notification / Foreground Service Status Icons */}
            <div className="flex items-center gap-1.5">
              {isCallActive && (
                <div
                  onClick={() => setShowNotificationShade(!showNotificationShade)}
                  className="flex items-center gap-1 cursor-pointer bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full text-[10px] animate-pulse"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>AEC Mic</span>
                </div>
              )}
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">5G</span>
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Android 14 Notification Shade Pull-down Drawer */}
          {showNotificationShade && (
            <div className="absolute top-9 left-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-xl border-b border-neutral-800 p-4 shadow-2xl animate-in slide-in-from-top duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                    <Radio className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-100">CallTranslationService</div>
                    <div className="text-[11px] text-neutral-400">Android 14 Foreground Service</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationShade(false)}
                  className="text-xs text-neutral-400 hover:text-white px-2 py-1 bg-neutral-800 rounded"
                >
                  Close
                </button>
              </div>

              {/* Dynamic Notification Card */}
              <div className="bg-neutral-900 rounded-xl p-3 border border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-semibold text-emerald-400">
                      Live Translation ({formatTime(callDurationSeconds)})
                    </span>
                  </div>
                  <div className="flex gap-1 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">
                      MIC+MEDIA
                    </span>
                  </div>
                </div>

                <div className="text-xs text-neutral-300 mt-1">
                  Active translation route: {sourceLang.flag} {sourceLang.code} ➔ {targetLang.flag}{' '}
                  {targetLang.code}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      onStopCall();
                      setShowNotificationShade(false);
                    }}
                    className="flex-1 py-1.5 px-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    End Translation
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1"
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* App Header (Compose TopAppBar) */}
          <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                  Voice &amp; Call Translator
                </h1>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCallActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                    }`}
                  />
                  <span className={isCallActive ? 'text-emerald-400 font-medium' : 'text-neutral-400'}>
                    {isCallActive ? `Live Session • ${formatTime(callDurationSeconds)}` : 'Hardware AEC Ready'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNotificationShade(!showNotificationShade)}
                className={`p-1.5 rounded-lg border text-xs transition ${
                  isCallActive
                    ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30'
                    : 'border-neutral-800 text-neutral-400 hover:text-white'
                }`}
                title="View Android 14 Notification Shade"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
              {transcripts.length > 0 && (
                <button
                  onClick={onClearTranscripts}
                  className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white transition"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Main Compose Body */}
          <div className="flex-1 flex flex-col px-3.5 py-2.5 overflow-hidden gap-2.5">
            {/* Language Selection Card */}
            <div className="bg-neutral-800/80 rounded-2xl p-2.5 border border-neutral-700/60 shadow-sm relative">
              <div className="grid grid-cols-2 gap-2 relative">
                {/* Source Language Button */}
                <div className="relative">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 mb-1 ml-1 flex items-center gap-1">
                    <Mic className="w-3 h-3 text-indigo-400" />
                    Speak
                  </div>
                  <button
                    disabled={isCallActive}
                    onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                    className="w-full h-10 px-2.5 rounded-xl bg-neutral-900 border border-neutral-700/80 flex items-center justify-between text-xs text-neutral-100 disabled:opacity-60 transition hover:border-neutral-600"
                  >
                    <span className="flex items-center gap-1.5 font-medium truncate">
                      <span>{sourceLang.flag}</span>
                      <span className="truncate">{sourceLang.name.split(' ')[0]}</span>
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  </button>

                  {sourceDropdownOpen && (
                    <div className="absolute top-12 left-0 w-44 max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-50 p-1">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            onSourceLangChange(lang);
                            setSourceDropdownOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-neutral-800 flex items-center gap-2"
                        >
                          <span>{lang.flag}</span>
                          <span className="text-neutral-200">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Target Language Button */}
                <div className="relative">
                  <div className="text-[10px] uppercase font-bold text-neutral-400 mb-1 ml-1 flex items-center gap-1">
                    <SpeakerIcon className="w-3 h-3 text-emerald-400" />
                    Translate To
                  </div>
                  <button
                    disabled={isCallActive}
                    onClick={() => setTargetDropdownOpen(!targetDropdownOpen)}
                    className="w-full h-10 px-2.5 rounded-xl bg-neutral-900 border border-neutral-700/80 flex items-center justify-between text-xs text-neutral-100 disabled:opacity-60 transition hover:border-neutral-600"
                  >
                    <span className="flex items-center gap-1.5 font-medium truncate">
                      <span>{targetLang.flag}</span>
                      <span className="truncate">{targetLang.name.split(' ')[0]}</span>
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                  </button>

                  {targetDropdownOpen && (
                    <div className="absolute top-12 right-0 w-44 max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl z-50 p-1">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            onTargetLangChange(lang);
                            setTargetDropdownOpen(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-neutral-800 flex items-center gap-2"
                        >
                          <span>{lang.flag}</span>
                          <span className="text-neutral-200">{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Center Swap Button */}
                <button
                  disabled={isCallActive}
                  onClick={onSwapLanguages}
                  className="absolute left-1/2 top-[26px] -translate-x-1/2 w-7 h-7 rounded-full bg-neutral-800 border border-neutral-600 hover:border-indigo-400 text-neutral-200 flex items-center justify-center shadow transition active:scale-95 disabled:opacity-40"
                  title="Swap languages"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live Audio VAD Meter & Decibel Indicator */}
            {isCallActive && (
              <div className="bg-neutral-800/90 rounded-2xl p-2.5 border border-neutral-700/60 shadow-sm flex flex-col gap-1.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        telemetry.isVoiceActive ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'
                      }`}
                    />
                    <span className={telemetry.isVoiceActive ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}>
                      {telemetry.isVoiceActive
                        ? 'Speech Detected (Streaming 3200B Frames)'
                        : 'Silence Gate Active (<30dB Gated)'}
                    </span>
                  </div>
                  <div className="font-mono text-neutral-300 font-bold">
                    {Math.round(telemetry.currentDecibels)} dB
                  </div>
                </div>

                {/* Meter Bar with 30dB threshold indicator */}
                <div className="relative w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700/80">
                  <div
                    className={`h-full transition-all duration-100 ${
                      telemetry.isVoiceActive
                        ? 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                        : 'bg-neutral-600'
                    }`}
                    style={{ width: `${Math.min(100, (telemetry.currentDecibels / 90) * 100)}%` }}
                  />
                  {/* ~30 dB Threshold Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                    style={{ left: `${(30 / 90) * 100}%` }}
                    title="VAD Gate Threshold (30 dB)"
                  />
                </div>
              </div>
            )}

            {/* Live Transcription Scrolling Conversation Panel */}
            <div
              ref={scrollRef}
              className="flex-1 bg-neutral-950/60 rounded-2xl border border-neutral-800/80 p-2.5 overflow-y-auto flex flex-col gap-2.5 scroll-smooth"
            >
              {transcripts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-neutral-500 gap-2">
                  <div className="w-12 h-12 rounded-full bg-neutral-800/60 border border-neutral-700 flex items-center justify-center text-neutral-400">
                    <Phone className="w-6 h-6 text-neutral-400" />
                  </div>
                  <div className="text-xs font-semibold text-neutral-300">
                    {isCallActive ? 'Ready for speech' : 'Call Translation Inactive'}
                  </div>
                  <p className="text-[11px] leading-relaxed text-neutral-400 max-w-[220px]">
                    {isCallActive
                      ? 'Speak into microphone or select a prompt below to see live translation.'
                      : 'Tap Start Live Translation to launch Android 14 Foreground Service.'}
                  </p>
                </div>
              ) : (
                transcripts.map((item) => {
                  const isLocal = item.speaker === 'LOCAL_USER';
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col max-w-[85%] ${
                        isLocal ? 'self-end items-end' : 'self-start items-start'
                      } animate-in fade-in-up duration-200`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-0.5 px-1">
                        <span>{isLocal ? 'You (Local Mic)' : 'Remote Caller'}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>

                      <div
                        className={`rounded-2xl p-2.5 text-xs shadow-md border ${
                          isLocal
                            ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-500/50 rounded-br-xs'
                            : 'bg-neutral-800 text-neutral-100 border-neutral-700 rounded-bl-xs'
                        }`}
                      >
                        {/* Primary Translated Output */}
                        <div className="font-semibold text-sm leading-snug tracking-wide">
                          {item.translatedText}
                        </div>

                        {/* Original Spoken Text Subtitle */}
                        {item.originalText && item.originalText !== item.translatedText && (
                          <div
                            className={`mt-1.5 text-[11px] italic border-t pt-1 ${
                              isLocal ? 'border-indigo-400/40 text-indigo-200' : 'border-neutral-700 text-neutral-400'
                            }`}
                          >
                            "{item.originalText}"
                          </div>
                        )}

                        {/* TTS Playback Action */}
                        <button
                          onClick={() => onPlayTts(item.translatedText, item.targetLang, item.audioUrl)}
                          className={`mt-2 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition ${
                            isLocal
                              ? 'bg-indigo-900/60 hover:bg-indigo-900 text-indigo-200'
                              : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-200'
                          }`}
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>AudioTrack Play</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}

              {isProcessingSpeech && (
                <div className="self-center flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800/90 text-neutral-300 text-xs border border-neutral-700 shadow-md animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  <span>Translating voice frame...</span>
                </div>
              )}
            </div>

            {/* Quick Testing Call Prompts / Scenario Drawer */}
            {isCallActive && (
              <div className="bg-neutral-800/60 rounded-xl p-2 border border-neutral-700/60 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="font-semibold uppercase tracking-wider">Test Scenario Simulator:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onToggleLiveMic}
                      className={`px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px] border transition ${
                        useLiveMic
                          ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/50'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}
                    >
                      <Mic className="w-2.5 h-2.5" />
                      {useLiveMic ? 'Live Mic ON' : 'Use Prompts'}
                    </button>
                  </div>
                </div>

                <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                  {PRESET_CALL_SCENARIOS[selectedScenarioIndex]?.dialogue.map((item: { text: string; speaker: 'LOCAL_USER' | 'REMOTE_PARTY' }, idx: number) => (
                    <button
                      key={idx}
                      disabled={isProcessingSpeech}
                      onClick={() => handleSendPrompt(item.text, item.speaker)}
                      className="flex-shrink-0 text-left px-2 py-1 bg-neutral-900 hover:bg-neutral-700 border border-neutral-700/80 rounded-lg text-[10px] text-neutral-300 max-w-[150px] truncate transition"
                    >
                      <span className="font-semibold text-indigo-300 mr-1">
                        {item.speaker === 'LOCAL_USER' ? 'You:' : 'Caller:'}
                      </span>
                      {item.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Action Button (Compose Call Controls) */}
            <div className="pt-1">
              {!isCallActive ? (
                <button
                  onClick={onStartCall}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-[0.98]"
                >
                  <Phone className="w-4 h-4 fill-current" />
                  <span>Start Live Translation Call</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={onStopCall}
                    className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 transition active:scale-[0.98]"
                  >
                    <PhoneOff className="w-4 h-4 fill-current" />
                    <span>End Translation Call</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Android Navigation Bar */}
          <div className="h-6 flex items-center justify-center pb-1">
            <div className="w-32 h-1 bg-neutral-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
