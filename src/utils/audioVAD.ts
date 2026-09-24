export interface VadEngineCallbacks {
  onAudioLevel: (decibels: number, isVoiceActive: boolean) => void;
  onPcmChunkReady: (chunk: Int16Array, base64Pcm: string) => void;
  onError: (err: string) => void;
}

export class WebAudioVadEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private isRunning: boolean = false;
  private vadThresholdDb: number = 30.0;
  private callbacks: VadEngineCallbacks;

  // 16000Hz * 0.1s = 1600 samples = 3200 bytes
  private frameSizeSamples: number = 1600;

  constructor(callbacks: VadEngineCallbacks, thresholdDb: number = 30.0) {
    this.callbacks = callbacks;
    this.vadThresholdDb = thresholdDb;
  }

  async start(): Promise<boolean> {
    try {
      this.stop();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.mediaStream = stream;
      // Target 16kHz audio context matching Android 16kHz VOICE_COMMUNICATION
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: 16000 });

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(stream);

      // Buffer size 2048 is standard for script processor
      this.processorNode = this.audioContext.createScriptProcessor(2048, 1, 1);

      this.processorNode.onaudioprocess = (event: AudioProcessingEvent) => {
        if (!this.isRunning) return;

        const inputChannelData = event.inputBuffer.getChannelData(0);
        const sampleCount = inputChannelData.length;

        // Convert Float32 to Int16 PCM and calculate RMS decibels
        const pcm16 = new Int16Array(sampleCount);
        let sumSquares = 0.0;

        for (let i = 0; i < sampleCount; i++) {
          const sample = Math.max(-1, Math.min(1, inputChannelData[i]));
          const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
          pcm16[i] = int16;
          sumSquares += int16 * int16;
        }

        const rms = Math.sqrt(sumSquares / sampleCount);
        let decibels = 0.0;
        if (rms > 0.0) {
          decibels = Math.max(0, 20 * Math.log10(Math.max(1.0, rms) / 32768.0) + 90.0);
        }

        const isVoiceActive = decibels >= this.vadThresholdDb;
        this.callbacks.onAudioLevel(decibels, isVoiceActive);

        if (isVoiceActive) {
          // Convert to base64
          const buffer = pcm16.buffer;
          const bytes = new Uint8Array(buffer);
          let binary = '';
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          this.callbacks.onPcmChunkReady(pcm16, base64);
        }
      };

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);

      this.isRunning = true;
      return true;
    } catch (err: any) {
      console.error('Audio VAD error:', err);
      this.callbacks.onError(err.message || 'Microphone access denied');
      return false;
    }
  }

  stop() {
    this.isRunning = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.callbacks.onAudioLevel(0, false);
  }

  setThreshold(thresholdDb: number) {
    this.vadThresholdDb = thresholdDb;
  }
}
