export interface VadEngineCallbacks {
  onAudioLevel: (decibels: number, isVoiceActive: boolean) => void;
  onPcmChunkReady: (chunk: Int16Array, base64Pcm: string) => void;
  onSpeechRecognized?: (transcript: string, isFinal: boolean) => void;
  onError: (err: string) => void;
}

export class WebAudioVadEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private muteGainNode: GainNode | null = null;
  private isRunning: boolean = false;
  private vadThresholdDb: number = 28.0;
  private callbacks: VadEngineCallbacks;
  private speechRecognition: any = null;
  private isRecognitionActive: boolean = false;
  private currentLanguage: string = 'en-US';

  constructor(callbacks: VadEngineCallbacks, thresholdDb: number = 28.0) {
    this.callbacks = callbacks;
    this.vadThresholdDb = thresholdDb;
  }

  setLanguage(langCode: string) {
    this.currentLanguage = langCode;
    if (this.speechRecognition && this.isRecognitionActive) {
      try {
        this.speechRecognition.lang = langCode;
      } catch (e) {
        console.warn('Could not update recognition lang on the fly', e);
      }
    }
  }

  async start(langCode?: string): Promise<boolean> {
    try {
      this.stop();
      if (langCode) this.currentLanguage = langCode;

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

      // Buffer size 2048
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

      // Create a zero-gain node so local mic audio does not echo back into headphones/speaker
      this.muteGainNode = this.audioContext.createGain();
      this.muteGainNode.gain.value = 0.0;

      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.muteGainNode);
      this.muteGainNode.connect(this.audioContext.destination);

      this.isRunning = true;

      // Start Web Speech Recognition if available in browser
      this.startSpeechRecognition();

      return true;
    } catch (err: any) {
      console.error('Audio VAD error:', err);
      this.callbacks.onError(err.message || 'Microphone access denied');
      return false;
    }
  }

  private startSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log('Web Speech Recognition not supported in this browser environment');
      return;
    }

    try {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = this.currentLanguage;

      this.speechRecognition.onresult = (event: any) => {
        if (!this.isRunning) return;
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript;
          } else {
            interimText += res[0].transcript;
          }
        }

        if (finalText.trim() && this.callbacks.onSpeechRecognized) {
          this.callbacks.onSpeechRecognized(finalText.trim(), true);
        } else if (interimText.trim() && this.callbacks.onSpeechRecognized) {
          this.callbacks.onSpeechRecognized(interimText.trim(), false);
        }
      };

      this.speechRecognition.onerror = (e: any) => {
        // Silently recover if user stops speaking or transient network error
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('SpeechRecognition warning:', e.error);
        }
      };

      this.speechRecognition.onend = () => {
        // Auto-restart recognition if call is still active
        if (this.isRunning && this.isRecognitionActive) {
          try {
            this.speechRecognition.start();
          } catch (_) {}
        }
      };

      this.speechRecognition.start();
      this.isRecognitionActive = true;
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
    }
  }

  stop() {
    this.isRunning = false;
    this.isRecognitionActive = false;

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (_) {}
      this.speechRecognition = null;
    }

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.muteGainNode) {
      this.muteGainNode.disconnect();
      this.muteGainNode = null;
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
