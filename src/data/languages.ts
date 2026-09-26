import { SupportedLanguage } from '../types';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸', nativeName: 'English' },
  { code: 'am-ET', name: 'Amharic (Ethiopia)', flag: '🇪🇹', nativeName: 'አማርኛ' },
  { code: 'ti-ET', name: 'Tigrinya (Ethiopia/Eritrea)', flag: '🇪🇷', nativeName: 'ትግርኛ' },
  { code: 'om-ET', name: 'Oromo (Ethiopia)', flag: '🇪🇹', nativeName: 'Afaan Oromoo' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr-FR', name: 'French (France)', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'de-DE', name: 'German (Germany)', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'zh-CN', name: 'Mandarin (Chinese)', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'it-IT', name: 'Italian (Italy)', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'hi-IN', name: 'Hindi (India)', flag: '🇮🇳', nativeName: 'हिन्दी' },
  { code: 'sw-KE', name: 'Swahili (Kenya)', flag: '🇰🇪', nativeName: 'Kiswahili' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
];

export interface QuickCallPhrase {
  id: string;
  category: 'Greeting' | 'Clarification' | 'Hold' | 'Agreement' | 'Closing';
  english: string;
}

export const REAL_CALL_QUICK_PHRASES: QuickCallPhrase[] = [
  {
    id: 'phrase-greeting-translator',
    category: 'Greeting',
    english: 'Hello, I am using a real-time call translator. Please speak clearly.',
  },
  {
    id: 'phrase-repeat',
    category: 'Clarification',
    english: 'Could you please repeat what you just said?',
  },
  {
    id: 'phrase-hold',
    category: 'Hold',
    english: 'Please hold on for just a moment while I review this.',
  },
  {
    id: 'phrase-agree',
    category: 'Agreement',
    english: 'Yes, I understand and agree with your proposal.',
  },
  {
    id: 'phrase-closing',
    category: 'Closing',
    english: 'Thank you for your time. I will follow up with you soon. Goodbye.',
  },
  {
    id: 'phrase-audio-check',
    category: 'Clarification',
    english: 'Can you hear the translated voice clearly on your end?',
  },
];
