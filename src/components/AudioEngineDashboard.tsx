import React from 'react';
import {
  Activity,
  Cpu,
  Radio,
  Server,
  Volume2,
  Zap,
  ShieldCheck,
  BarChart2,
  HardDrive,
  Layers,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { HardwareTelemetry } from '../types';

interface AudioEngineDashboardProps {
  telemetry: HardwareTelemetry;
  isCallActive: boolean;
  callDurationSeconds: number;
}

export const AudioEngineDashboard: React.FC<AudioEngineDashboardProps> = ({
  telemetry,
  isCallActive,
  callDurationSeconds,
}) => {
  // Bandwidth savings calculation:
  // Without VAD, continuously sending 3200 bytes per 100ms = 32,000 bytes/sec (~32 KB/s)
  const totalFrames = telemetry.totalFramesCaptured || 1;
  const savingsPercent = Math.min(
    95,
    Math.max(0, Math.round((telemetry.framesGatedSilence / Math.max(1, telemetry.totalFramesCaptured)) * 100))
  );

  const kbSent = Math.round((telemetry.framesSent * 3200) / 1024);
  const kbSaved = Math.round((telemetry.framesGatedSilence * 3200) / 1024);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner with Service & Hardware Status */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                Audio Hardware Engine &amp; VAD Pipeline
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Android 14 HAL
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Acoustic Echo Cancellation (AEC), 16kHz PCM Sampling, Decibel RMS Gating, Ktor WebSockets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs font-mono">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCallActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'
                }`}
              />
              <span className={isCallActive ? 'text-emerald-400' : 'text-neutral-400'}>
                {isCallActive ? 'AEC HAL ACTIVE' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: Sample Rate & Channel */}
          <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mb-1">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>AudioRecord HAL</span>
            </div>
            <div className="text-sm font-bold text-neutral-100 font-mono">16,000 Hz MONO</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">VOICE_COMMUNICATION (AEC)</div>
          </div>

          {/* Card 2: Chunk Frame Size */}
          <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chunk Framing</span>
            </div>
            <div className="text-sm font-bold text-neutral-100 font-mono">3,200 Bytes</div>
            <div className="text-[11px] text-neutral-500 mt-0.5">~100ms / 1600 Samples PCM</div>
          </div>

          {/* Card 3: RMS Decibels */}
          <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mb-1">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Live RMS Level</span>
            </div>
            <div className="text-sm font-bold text-neutral-100 font-mono flex items-center gap-1.5">
              <span>{Math.round(telemetry.currentDecibels)} dB</span>
              <span className="text-[10px] text-neutral-400 font-normal">
                (Thresh: 30 dB)
              </span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              {telemetry.isVoiceActive ? 'Voice Active (>30dB)' : 'Gated Silence (<30dB)'}
            </div>
          </div>

          {/* Card 4: WebSocket Pipe */}
          <div className="bg-neutral-950/60 rounded-xl p-3 border border-neutral-800/80">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1 mb-1">
              <Radio className="w-3.5 h-3.5 text-sky-400" />
              <span>Ktor CIO Pipeline</span>
            </div>
            <div className="text-sm font-bold text-neutral-100 font-mono">
              {isCallActive ? 'CONNECTED (WSS)' : 'IDLE'}
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Ping: 15s • Latency ~{telemetry.currentLatencyMs}ms
            </div>
          </div>
        </div>
      </div>

      {/* Network Traffic & VAD Savings Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bandwidth Savings Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                VAD Mobile Uplink Optimization
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {savingsPercent}% Bandwidth Saved
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Android Voice Activity Detection computes Root Mean Square (RMS) on 1600 PCM samples. Silence below ~30 dB is dropped before network socket serialization, saving mobile battery and cellular data.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 grid grid-cols-3 gap-2 text-center">
            <div className="bg-neutral-950/40 p-2 rounded-xl border border-neutral-800/60">
              <div className="text-[10px] text-neutral-400">Total Captured</div>
              <div className="text-xs font-bold font-mono text-neutral-200">
                {telemetry.totalFramesCaptured} frames
              </div>
            </div>
            <div className="bg-neutral-950/40 p-2 rounded-xl border border-neutral-800/60">
              <div className="text-[10px] text-neutral-400">Sent Upstream</div>
              <div className="text-xs font-bold font-mono text-indigo-400">
                {telemetry.framesSent} ({kbSent} KB)
              </div>
            </div>
            <div className="bg-neutral-950/40 p-2 rounded-xl border border-neutral-800/60">
              <div className="text-[10px] text-neutral-400">Silence Gated</div>
              <div className="text-xs font-bold font-mono text-emerald-400">
                {telemetry.framesGatedSilence} ({kbSaved} KB)
              </div>
            </div>
          </div>
        </div>

        {/* AudioTrack Playback Telemetry */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                AudioTrack Downstream Playback
              </h3>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                MODE_STREAM
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Downstream TTS audio packets are streamed directly into an unbuffered <code className="text-neutral-300 font-mono text-[11px]">AudioTrack</code> configured with <code className="text-neutral-300 font-mono text-[11px]">USAGE_VOICE_COMMUNICATION</code> and <code className="text-neutral-300 font-mono text-[11px]">CONTENT_TYPE_SPEECH</code> to route properly to earpiece or speaker.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-neutral-300">Android 14 Foreground Compliance</span>
            </div>
            <span className="font-mono text-neutral-400 text-[11px]">
              Microphone + Media Playback
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
