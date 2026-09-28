import { LanguageCode, TranslationDictionary } from './types';
import { en } from './locales/en';
import { zhCN } from './locales/zh-CN';
import { zhTW } from './locales/zh-TW';
import { cs } from './locales/cs';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { es } from './locales/es';
import { it } from './locales/it';
import { ja } from './locales/ja';
import { ko } from './locales/ko';
import { nl } from './locales/nl';
import { ru } from './locales/ru';
import { pt } from './locales/pt';
import { da } from './locales/da';
import { no } from './locales/no';
import { fi } from './locales/fi';
import { sv } from './locales/sv';
import { th } from './locales/th';
import { ms } from './locales/ms';
import { tr } from './locales/tr';

export * from './types';
export * from './languages';

const rawTranslations: Record<LanguageCode, Partial<TranslationDictionary>> = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  cs,
  fr,
  de,
  es,
  it,
  ja,
  ko,
  nl,
  ru,
  pt,
  da,
  no,
  fi,
  sv,
  th,
  ms,
  tr,
};

function deepMerge(target: any, source: any): any {
  if (!source) return target;
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }
  return output;
}

export const translations: Record<LanguageCode, TranslationDictionary> = {} as any;

// Precompute complete merged dictionaries with English fallback
for (const lang of Object.keys(rawTranslations) as LanguageCode[]) {
  translations[lang] = deepMerge(en, rawTranslations[lang]);
}

export function getTranslation(lang: LanguageCode): TranslationDictionary {
  return translations[lang] || translations.en;
}
