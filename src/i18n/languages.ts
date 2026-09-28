import { LanguageCode, LanguageMeta } from './types';

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', hreflang: 'en', flag: '🇺🇸' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', hreflang: 'zh-CN', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', hreflang: 'zh-TW', flag: '🇹🇼' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', hreflang: 'cs', flag: '🇨🇿' },
  { code: 'fr', name: 'French', nativeName: 'Français', hreflang: 'fr', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', hreflang: 'de', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', hreflang: 'es', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', hreflang: 'it', flag: '🇮🇹' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', hreflang: 'ja', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', hreflang: 'ko', flag: '🇰🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', hreflang: 'nl', flag: '🇳🇱' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', hreflang: 'ru', flag: '🇷🇺' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', hreflang: 'pt', flag: '🇵🇹' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', hreflang: 'da', flag: '🇩🇰' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', hreflang: 'no', flag: '🇳🇴' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', hreflang: 'fi', flag: '🇫🇮' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', hreflang: 'sv', flag: '🇸🇪' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', hreflang: 'th', flag: '🇹🇭' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', hreflang: 'ms', flag: '🇲🇾' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', hreflang: 'tr', flag: '🇹🇷' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function getLanguageMeta(code: LanguageCode): LanguageMeta {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.code === code) ||
    SUPPORTED_LANGUAGES[0]
  );
}
