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
  PhoneCall,
  Smartphone,
  Headphones,
  AlertTriangle
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 text-neutral-200">
      {/* Overview Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-neutral-100 mb-2 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          End-to-End System Pipeline &amp; Android 14 Telephony Architecture
        </h2>
        <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
          This low-latency bi-directional speech translation system is engineered specifically for Android 14+ (API 34) hardware, telephony permissions, and networking constraints. It balances real-time audio I/O, hardware echo cancellation, network chunking, and strict OS battery/foreground policies.
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
              <Radio className="w-5 h-5 text-sky-400 mb-1" />
              <div className="font-bold text-neutral-200">Ktor CIO WSS</div>
              <div className="text-[10px] text-neutral-400">Binary 3200B Chunks</div>
              <div className="text-[9px] text-sky-400 mt-1">Gemini Live Pipeline</div>
            </div>

            <ArrowRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 w-36">
              <Smartphone className="w-5 h-5 text-indigo-400 mb-1" />
              <div className="font-bold text-neutral-200">Floating HUD</div>
              <div className="text-[10px] text-neutral-400">SYSTEM_ALERT_WINDOW</div>
              <div className="text-[9px] text-indigo-400 mt-1">Live Dialer Subtitles</div>
            </div>

            <ArrowRight className="w-4 h-4 text-neutral-600 flex-shrink-0" />

            {/* Step 5 */}
            <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 w-36">
              <Volume2 className="w-5 h-5 text-purple-400 mb-1" />
              <div className="font-bold text-neutral-200">AudioTrack Play</div>
              <div className="text-[10px] text-neutral-400">CONTENT_TYPE_SPEECH</div>
              <div className="text-[9px] text-purple-400 mt-1">Stream to Call / Speaker</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Android Platform Limitations & Real Solutions */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Critical Android Telephony Audio Constraint &amp; Production Solution
        </h3>
        <p className="text-xs text-amber-200/90 leading-relaxed mb-4">
          On Android 10, 11, 12, 13, and 14+, regular third-party applications running in consumer sandboxes cannot directly intercept raw cellular baseband downlink/uplink audio streams (<code className="text-amber-300 font-mono text-[11px]">CAPTURE_AUDIO_OUTPUT</code> is reserved strictly for OEM system apps with platform signing keys).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <div className="font-bold text-white mb-1 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>A) Speakerphone Acoustic Path</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              When the active call is on speakerphone, <code className="text-indigo-300 font-mono text-[10px]">VOICE_COMMUNICATION</code> records ambient sound while hardware <code className="text-indigo-300 font-mono text-[10px]">AcousticEchoCanceler</code> suppresses feedback, enabling simultaneous two-way capture.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <div className="font-bold text-white mb-1 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>B) Telecom InCallService</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Registering an official <code className="text-emerald-300 font-mono text-[10px]">InCallService</code> gives the app direct access to the Telecom Call lifecycle, allowing programmatic audio routing (<code className="text-emerald-300 font-mono text-[10px]">ROUTE_SPEAKER</code>, <code className="text-emerald-300 font-mono text-[10px]">ROUTE_BLUETOOTH</code>).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800">
            <div className="font-bold text-white mb-1 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>C) Floating Call Overlay HUD</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Using <code className="text-sky-300 font-mono text-[10px]">TYPE_APPLICATION_OVERLAY</code>, the app floats live translated subtitles and quick-response audio controls directly on top of the native phone dialer during active calls.
            </p>
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
                <span>PendingIntents for in-call mute and language swapping directly from notification shade.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 font-mono text-[10px] text-neutral-500">
            CallTranslationService.kt
          </div>
        </div>

        {/* Requirement 2: AudioRecord Hardware Engine */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Cpu className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                2. Low-Latency Audio HAL
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              High-fidelity 16kHz MONO 16-bit PCM configuration. Uses <code className="text-amber-300 font-mono text-[11px]">VOICE_COMMUNICATION</code> to trigger Qualcomm/MediaTek hardware DSP echo cancellation and automatic gain control.
            </p>

            <ul className="mt-3 flex flex-col gap-2 text-[11px] text-neutral-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>3200-byte frame chunking delivers consistent ~100ms transmission intervals.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>RMS-based decibel evaluation (~30dB floor) gates silent packets.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 font-mono text-[10px] text-neutral-500">
            AudioHardwareEngine.kt
          </div>
        </div>

        {/* Requirement 3: Ktor WebSockets Pipeline */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-400 mb-2">
              <Radio className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                3. Low-Latency Network Pipe
              </h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Built on Ktor CIO asynchronous WebSockets with Kotlin Coroutines. Pipes raw binary audio frames directly into Gemini 2.5 Flash / Gemini 3.8 Flash streaming endpoints with auto-reconnection.
            </p>

            <ul className="mt-3 flex flex-col gap-2 text-[11px] text-neutral-300">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Zero thread-blocking: Dispatchers.Default for VAD, Dispatchers.IO for networking.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Full fallback to on-device Android TextToSpeech when offline.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 font-mono text-[10px] text-neutral-500">
            TranslationWebSocketClient.kt
          </div>
        </div>
      </div>
    </div>
  );
};
