import React from 'react';
import {
  Layers,
  ShieldAlert,
  Mic,
  Volume2,
  Radio,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Lock,
  BatteryCharging
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 text-neutral-200">
      {/* Overview Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-100 mb-2 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          End-to-End System Pipeline &amp; Android 14 Architecture
        </h2>
        <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
          This low-latency bi-directional speech translation system is engineered specifically for Android 14+ (API 34) hardware and networking constraints. It balances real-time audio I/O, hardware echo cancellation, network chunking, and strict OS battery/foreground policies.
        </p>

        {/* Visual Pipeline Flow */}
        <div className="mt-6 p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl overflow-x-auto">
          <div className="flex items-center min-w-[750px] justify-between text-xs font-mono">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 w-36">
              <Mic className="w-5 h-5 text-indigo-400 mb-1" />
              <div className="font-bold text-neutral-200">Hardware HAL</div>
              <div className="text-[10px] text-neutral-400">VOICE_COMMUNICATION</div>
              <div className="text-[9px] text-emerald-400 mt-1">AEC &amp; AGC Active</div>
            </div>

            <ArrowRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 w-36">
              <Cpu className="w-5 h-5 text-amber-400 mb-1" />
              <div className="font-bold text-neutral-200">AudioRecord Engine</div>
              <div className="text-[10px] text-neutral-400">16kHz 16-bit PCM</div>
              <div className="text-[9px] text-neutral-400 mt-1">1600 Samples / Frame</div>
            </div>

            <ArrowRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 w-36">
              <BatteryCharging className="w-5 h-5 text-emerald-400 mb-1" />
              <div className="font-bold text-neutral-200">RMS VAD Gate</div>
              <div className="text-[10px] text-neutral-400">Threshold: ~30 dB</div>
              <div className="text-[9px] text-emerald-400 mt-1">Drops Silent Frames</div>
            </div>

            <ArrowRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 w-36">
              <Radio className="w-5 h-5 text-sky-400 mb-1" />
              <div className="font-bold text-neutral-200">Ktor CIO WSS</div>
              <div className="text-[10px] text-neutral-400">Binary 3200B Chunks</div>
              <div className="text-[9px] text-sky-400 mt-1">Auto-reconnect Backoff</div>
            </div>

            <ArrowRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />

            {/* Step 5 */}
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 w-36">
              <Volume2 className="w-5 h-5 text-purple-400 mb-1" />
              <div className="font-bold text-neutral-200">AudioTrack Play</div>
              <div className="text-[10px] text-neutral-400">CONTENT_TYPE_SPEECH</div>
              <div className="text-[9px] text-purple-400 mt-1">Stream Mode / Earpiece</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Detailed Technical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Requirement 1: Android 14 Foreground Service */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <ShieldAlert className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                1. Android 14 Foreground Rules
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Android 14 (API 34) strictly terminates foreground services that access the microphone without declaring <code className="text-indigo-300 font-mono text-[11px]">FOREGROUND_SERVICE_TYPE_MICROPHONE</code> and <code className="text-indigo-300 font-mono text-[11px]">FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK</code> in both the Manifest and in <code className="text-indigo-300 font-mono text-[11px]">startForeground()</code>.
            </p>

            <ul className="mt-3 flex flex-col gap-2 text-[11px] text-neutral-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Non-intrusive LOW importance notification channel prevents beeping over phone calls.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Graceful cleanup on <code className="font-mono text-neutral-300">ACTION_STOP_CALL</code> with notification dismissal.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Requirement 2: AudioRecord & Echo Cancellation */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Mic className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                2. Hardware AEC &amp; VAD Math
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Using <code className="text-amber-300 font-mono text-[11px]">MediaRecorder.AudioSource.VOICE_COMMUNICATION</code> engages OEM Hardware Acoustic Echo Cancellation at the Audio HAL layer, preventing the caller's translated voice from looping back into the microphone.
            </p>

            <div className="mt-3 p-2.5 bg-neutral-950/70 border border-neutral-800 rounded-xl text-[11px] font-mono text-neutral-300">
              <div className="text-neutral-500 mb-1">// RMS Decibel Formula</div>
              <div>rms = sqrt(∑(sample²) / N)</div>
              <div>dB = 20 * log10(rms / 32768) + 90</div>
            </div>
          </div>
        </div>

        {/* Requirement 3: Ktor WebSockets */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <Radio className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                3. Low-Latency Ktor CIO Pipeline
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Ktor CIO provides pure Kotlin non-blocking I/O on <code className="text-sky-300 font-mono text-[11px]">Dispatchers.IO</code> without heavy OkHttp dependencies. Binary audio frames stream directly into <code className="text-sky-300 font-mono text-[11px]">AudioTrack.write()</code> with zero intermediate memory allocations.
            </p>

            <ul className="mt-3 flex flex-col gap-2 text-[11px] text-neutral-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Exponential backoff reconnection with 1s to 16s delay ceiling.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>15-second heartbeat ping keeps WebSocket socket alive through mobile NAT routers.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
