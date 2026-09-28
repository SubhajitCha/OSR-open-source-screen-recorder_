import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageCode, LanguageMeta, TranslationDictionary } from '../i18n/types';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, getLanguageMeta } from '../i18n/languages';
import { getTranslation } from '../i18n';

interface LanguageContextValue {
  currentLang: LanguageCode;
  currentLangMeta: LanguageMeta;
  t: TranslationDictionary;
  setLanguage: (lang: LanguageCode, updateUrl?: boolean) => void;
  languages: LanguageMeta[];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function detectInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  try {
    // 1. Check URL query parameters (e.g. ?lang=es or ?hl=zh-CN)
    const urlParams = new URLSearchParams(window.location.search);
    const queryLang = urlParams.get('lang') || urlParams.get('hl');
    if (queryLang) {
      const match = SUPPORTED_LANGUAGES.find(
        (l) => l.code.toLowerCase() === queryLang.toLowerCase() ||
               l.hreflang.toLowerCase() === queryLang.toLowerCase() ||
               (queryLang.toLowerCase().startsWith('zh') && (queryLang.includes('tw') || queryLang.includes('hant') ? l.code === 'zh-TW' : l.code === 'zh-CN'))
      );
      if (match) return match.code;
    }

    // 2. Check local storage
    const storedLang = localStorage.getItem('osr_language') as LanguageCode;
    if (storedLang && SUPPORTED_LANGUAGES.some((l) => l.code === storedLang)) {
      return storedLang;
    }

    // 3. Check browser navigator language
    const browserLanguages = navigator.languages || [navigator.language];
    for (const bLang of browserLanguages) {
      if (!bLang) continue;
      const lower = bLang.toLowerCase();

      // Special handling for Chinese
      if (lower.startsWith('zh')) {
        if (lower.includes('tw') || lower.includes('hk') || lower.includes('hant') || lower.includes('mo')) {
          return 'zh-TW';
        }
        return 'zh-CN';
      }

      // Check exact match
      const exactMatch = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === lower || l.hreflang.toLowerCase() === lower);
      if (exactMatch) return exactMatch.code;

      // Check prefix match (e.g. "es-419" -> "es", "fr-FR" -> "fr", "de-AT" -> "de", "nb" -> "no")
      const prefix = lower.split('-')[0];
      if (prefix === 'nb' || prefix === 'nn') return 'no';

      const prefixMatch = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === prefix);
      if (prefixMatch) return prefixMatch.code;
    }
  } catch {
    // ignore
  }

  return DEFAULT_LANGUAGE;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLangState] = useState<LanguageCode>(detectInitialLanguage);

  const t = useMemo(() => getTranslation(currentLang), [currentLang]);
  const currentLangMeta = useMemo(() => getLanguageMeta(currentLang), [currentLang]);

  // Synchronize HTML element lang attribute and dynamic SEO meta tags
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = currentLang;
        document.documentElement.dir = currentLangMeta.dir || 'ltr';

        // Update document title and description if available
        if (t.meta) {
          document.title = t.meta.title;

          const descMeta = document.querySelector('meta[name="description"]');
          if (descMeta) {
            descMeta.setAttribute('content', t.meta.description);
          }

          const ogTitleMeta = document.querySelector('meta[property="og:title"]');
          if (ogTitleMeta) {
            ogTitleMeta.setAttribute('content', t.meta.ogTitle);
          }

          const ogDescMeta = document.querySelector('meta[property="og:description"]');
          if (ogDescMeta) {
            ogDescMeta.setAttribute('content', t.meta.ogDescription);
          }

          const twTitleMeta = document.querySelector('meta[name="twitter:title"]');
          if (twTitleMeta) {
            twTitleMeta.setAttribute('content', t.meta.ogTitle);
          }

          const twDescMeta = document.querySelector('meta[name="twitter:description"]');
          if (twDescMeta) {
            twDescMeta.setAttribute('content', t.meta.ogDescription);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [currentLang, t, currentLangMeta]);

  const setLanguage = useCallback((newLang: LanguageCode, updateUrl: boolean = true) => {
    setCurrentLangState(newLang);
    try {
      localStorage.setItem('osr_language', newLang);

      if (updateUrl && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (newLang === DEFAULT_LANGUAGE) {
          url.searchParams.delete('lang');
        } else {
          url.searchParams.set('lang', newLang);
        }
        window.history.replaceState({}, '', url.toString());
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        currentLangMeta,
        t,
        setLanguage,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
