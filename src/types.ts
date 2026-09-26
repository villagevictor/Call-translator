export type SpeakerRole = 'LOCAL_USER' | 'REMOTE_PARTY' | 'SYSTEM';

export type CallState = 'IDLE' | 'LISTENING_CALL' | 'PAUSED';
export type CallMode = 'LIVE_CALL_COMPANION' | 'DUAL_SPEAKER';

export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

export interface TranscriptItem {
  id: string;
  speaker: SpeakerRole;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  audioUrl?: string | null;
  latencyMs?: number;
}

export interface HardwareTelemetry {
  sampleRate: number;
  channelConfig: string;
  bitDepth: number;
  frameSizeBytes: number;
  frameIntervalMs: number;
  currentDecibels: number;
  vadThresholdDb: number;
  isVoiceActive: boolean;
  totalFramesCaptured: number;
  framesSent: number;
  framesGatedSilence: number;
  currentLatencyMs: number;
  wsConnected: boolean;
  reconnectAttempts: number;
  audioTrackBufferFillPercent: number;
}

export interface AndroidProjectFile {
  path: string;
  name: string;
  category: 'Kotlin' | 'Manifest' | 'Gradle' | 'Config';
  language: string;
  content: string;
}
