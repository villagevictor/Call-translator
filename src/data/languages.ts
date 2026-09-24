import { SupportedLanguage } from '../types';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸', nativeName: 'English' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'fr-FR', name: 'French (France)', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de-DE', name: 'German (Germany)', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵', nativeName: '日本語' },
  { code: 'zh-CN', name: 'Mandarin (Chinese)', flag: '🇨🇳', nativeName: '中文' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷', nativeName: 'Português' },
  { code: 'it-IT', name: 'Italian (Italy)', flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷', nativeName: '한국어' },
];

export const PRESET_CALL_SCENARIOS = [
  {
    title: 'International Business Meeting',
    sourceLang: 'en-US',
    targetLang: 'es-ES',
    dialogue: [
      { speaker: 'LOCAL_USER' as const, text: 'Good morning! Thank you for joining our cross-border project call today.' },
      { speaker: 'REMOTE_PARTY' as const, text: '¡Buenos días! Es un placer. Hemos revisado la propuesta del contrato y todo parece excelente.' },
      { speaker: 'LOCAL_USER' as const, text: 'Wonderful. Can we confirm the milestone delivery date for next Tuesday?' },
      { speaker: 'REMOTE_PARTY' as const, text: 'Sí, confirmado para el martes a las diez de la mañana hora de Madrid.' },
    ],
  },
  {
    title: 'Hotel & Travel Concierge',
    sourceLang: 'en-US',
    targetLang: 'ja-JP',
    dialogue: [
      { speaker: 'LOCAL_USER' as const, text: 'Hello, I would like to reserve a non-smoking room for two nights starting Friday.' },
      { speaker: 'REMOTE_PARTY' as const, text: 'かしこまりました。金曜日からの2泊、禁煙のお部屋をご用意いたします。' },
      { speaker: 'LOCAL_USER' as const, text: 'Does the reservation include breakfast and airport shuttle service?' },
      { speaker: 'REMOTE_PARTY' as const, text: 'はい、朝食ビュッフェと空港送迎シャトルバスが含まれております。' },
    ],
  },
  {
    title: 'Emergency Medical Assistance',
    sourceLang: 'en-US',
    targetLang: 'fr-FR',
    dialogue: [
      { speaker: 'LOCAL_USER' as const, text: 'Hello, I need urgent advice. My travel partner has a high fever and severe headache.' },
      { speaker: 'REMOTE_PARTY' as const, text: 'Bonjour, restez calme. Le médecin de garde arrive dans quinze minutes.' },
      { speaker: 'LOCAL_USER' as const, text: 'Thank you so much. Should we give them any water or keep them lying down?' },
      { speaker: 'REMOTE_PARTY' as const, text: 'Gardez-le allongé dans un endroit frais et donnez-lui de petites gorgées d’eau.' },
    ],
  },
];
