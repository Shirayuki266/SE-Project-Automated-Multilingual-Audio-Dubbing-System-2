export interface SupportedLanguageConfig {
  code: 'vi' | 'en' | 'ko' | 'ja' | 'zh' | 'fr' | 'de' | 'es' | 'th' | 'id' | 'ru' | 'hi' | 'it';
  geminiCode: string;
  ttsCode: string;
  label: string;
  nativeName: string;
  flag: string;
  isSourceDefault?: boolean;
}

export const SUPPORTED_LANGUAGES: SupportedLanguageConfig[] = [
  { code: 'vi', geminiCode: 'vi', ttsCode: 'vi', label: 'Tiếng Việt', nativeName: 'Tiếng Việt', flag: '🇻🇳', isSourceDefault: true },
  { code: 'en', geminiCode: 'en', ttsCode: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ko', geminiCode: 'ko', ttsCode: 'ko', label: '한국어 (Korean)', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ja', geminiCode: 'ja', ttsCode: 'ja', label: '日本語 (Japanese)', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', geminiCode: 'zh-CN', ttsCode: 'zh', label: '中文 (zh-CN)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'fr', geminiCode: 'fr', ttsCode: 'fr', label: 'Français (French)', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', geminiCode: 'de', ttsCode: 'de', label: 'Deutsch (German)', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', geminiCode: 'es', ttsCode: 'es', label: 'Español (Spanish)', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'th', geminiCode: 'th', ttsCode: 'th', label: 'ไทย (Thai)', nativeName: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'id', geminiCode: 'id', ttsCode: 'id', label: 'Bahasa Indonesia', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ru', geminiCode: 'ru', ttsCode: 'ru', label: 'Русский (Russian)', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'hi', geminiCode: 'hi', ttsCode: 'hi', label: 'हिन्दी (Hindi)', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'it', geminiCode: 'it', ttsCode: 'it', label: 'Italiano (Italian)', nativeName: 'Italiano', flag: '🇮🇹' },
];

export const TARGET_TRANSLATION_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => !l.isSourceDefault);
