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

export interface CallContact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  role: string;
  location: string;
  langCode: string;
  languageName: string;
  greetingInNative: string;
  greetingTranslated: string;
  typicalTopics: string[];
}

export const CALL_CONTACTS: CallContact[] = [
  {
    id: 'contact-elena',
    name: 'Elena Morales',
    phone: '+34 91 555 0184',
    avatar: '👩🏻‍💼',
    role: 'Supply Chain Director',
    location: 'Madrid, Spain',
    langCode: 'es-ES',
    languageName: 'Spanish (Spain)',
    greetingInNative: '¡Hola! Buenos días, qué bueno hablar contigo. ¿Cómo va el envío internacional?',
    greetingTranslated: 'Hello! Good morning, great to speak with you. How is the international shipment going?',
    typicalTopics: ['Contract Terms', 'Delivery Schedule', 'Payment Invoice', 'Project Scope'],
  },
  {
    id: 'contact-abebe',
    name: 'Abebe Tadesse',
    phone: '+251 11 555 8920',
    avatar: '👨🏾‍💼',
    role: 'Regional Operations Lead',
    location: 'Addis Ababa, Ethiopia',
    langCode: 'am-ET',
    languageName: 'Amharic (Ethiopia)',
    greetingInNative: 'ሰላም! እንደምን ነዎት? ጥሪዎትን በደስታ ተቀብያለሁ። ዛሬ በምን ልርዳዎት?',
    greetingTranslated: 'Hello! How are you? I gladly received your call. How may I assist you today?',
    typicalTopics: ['Logistics Update', 'Office Meeting', 'AgriTech Partnership', 'Flight Schedule'],
  },
  {
    id: 'contact-jean',
    name: 'Dr. Jean Dupont',
    phone: '+33 1 42 68 55 00',
    avatar: '👨🏼‍⚕️',
    role: 'Medical & Health Consultant',
    location: 'Paris, France',
    langCode: 'fr-FR',
    languageName: 'French (France)',
    greetingInNative: 'Bonjour! Je suis le docteur Dupont. Comment se sent votre patient aujourd’hui?',
    greetingTranslated: 'Hello! I am Doctor Dupont. How is your patient feeling today?',
    typicalTopics: ['Patient Health', 'Prescription Follow-up', 'Consultation Hours', 'Travel Advice'],
  },
  {
    id: 'contact-kenji',
    name: 'Kenji Sato',
    phone: '+81 3 5555 0142',
    avatar: '👨🏻‍💻',
    role: 'Hardware Systems Engineer',
    location: 'Tokyo, Japan',
    langCode: 'ja-JP',
    languageName: 'Japanese',
    greetingInNative: 'もしもし、佐藤です。音声通話システムの接続テストですね。よく聞こえますよ。',
    greetingTranslated: 'Hello, this is Sato. Voice call translation test connection, right? I can hear you clearly.',
    typicalTopics: ['API Integration', 'Hardware Test', 'Tokyo Meeting', 'Audio Latency'],
  },
  {
    id: 'contact-fatima',
    name: 'Fatima Al-Mansoor',
    phone: '+971 4 312 9000',
    avatar: '👩🏽‍💼',
    role: 'Commercial Investment Broker',
    location: 'Dubai, UAE',
    langCode: 'ar-SA',
    languageName: 'Arabic (Saudi Arabia)',
    greetingInNative: 'مرحباً بك! يسعدني التحدث معك اليوم بخصوص تفاصيل الاستثمار والمشروع الجديد.',
    greetingTranslated: 'Welcome! I am pleased to speak with you today regarding investment details and the new project.',
    typicalTopics: ['Investment Proposal', 'Conference Schedule', 'Financial Transfer', 'Partnership'],
  },
  {
    id: 'contact-hans',
    name: 'Hans Weber',
    phone: '+49 30 2000 8471',
    avatar: '👨🏼‍💼',
    role: 'Manufacturing Plant Manager',
    location: 'Berlin, Germany',
    langCode: 'de-DE',
    languageName: 'German (Germany)',
    greetingInNative: 'Guten Tag! Hier spricht Hans Weber. Haben Sie die technischen Spezifikationen erhalten?',
    greetingTranslated: 'Good day! This is Hans Weber speaking. Have you received the technical specifications?',
    typicalTopics: ['Quality Inspection', 'Factory Timeline', 'Equipment Delivery', 'Safety Standards'],
  },
];

export const IN_CALL_QUICK_PHRASES = [
  'Hello, can you hear my voice clearly?',
  'Yes, I understand you perfectly.',
  'Could you please repeat that more slowly?',
  'Let us confirm the meeting date for tomorrow.',
  'What is the estimated delivery time for our order?',
  'Thank you very much for your cooperation. Have a wonderful day!',
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
];

