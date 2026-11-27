import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getReviewUiStrings } from '../i18n/formatters';

interface LanguageSelectorProps {
  variant?: 'compact' | 'full' | 'dropdown' | 'inline-links';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const { currentLang, currentLangMeta, setLanguage, languages, t } = useLanguage();
  const ui = getReviewUiStrings(currentLang);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('touchstart', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
      // Auto-focus search input
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return languages;
    const query = searchQuery.toLowerCase().trim();
    return languages.filter(
      (lang) =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [languages, searchQuery]);

  if (variant === 'inline-links') {
    return (
      <div className={`flex flex-wrap gap-2 text-xs ${className}`}>
        {languages.map((lang) => {
          const isSelected = lang.code === currentLang;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer text-xs flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#D90000] text-white font-semibold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#252C3B] dark:hover:bg-[#313A4E] dark:text-zinc-200'
              }`}
              aria-label={`${lang.nativeName} (${lang.name})`}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative group ${className}`}>
      {/* Trigger Button */}
      <button
        id="language-selector-trigger"
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchQuery('');
        }}
        aria-label={`Current language: ${currentLangMeta.nativeName}. Click to change language.`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer select-none ${
          isOpen
            ? 'bg-slate-200 text-slate-900 dark:bg-[#2D3546] dark:text-white ring-2 ring-slate-400/30'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-[#232936]/90 dark:hover:bg-[#2D3546] dark:text-zinc-200 border border-slate-200/80 dark:border-white/15 shadow-2xs'
        }`}
      >
        {/* Globe Icon */}
        <svg
          className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.6 9h16.8M3.6 15h16.8M12 3a15.3 15.3 0 014 9 15.3 15.3 0 01-4 9 15.3 15.3 0 01-4-9 15.3 15.3 0 014-9z"
          />
        </svg>

        <span className="font-semibold text-xs tracking-tight">
          {variant === 'compact' ? currentLangMeta.code.toUpperCase() : currentLangMeta.nativeName}
        </span>

        {/* Chevron */}
        <svg
          className={`w-3 h-3 text-slate-400 dark:text-zinc-500 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-slate-700 dark:text-white' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Sleek App Tooltip when closed */}
      {!isOpen && (
        <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 opacity-0 -translate-y-1.5 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap hidden sm:block">
          <div className="px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-950 text-xs font-semibold shadow-xl shadow-black/20 backdrop-blur-md border border-white/10 dark:border-black/10 select-none">
            {t.nav.selectLanguage}
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="language-dropdown-menu"
          className="absolute right-0 top-full mt-2 w-64 max-w-[90vw] rounded-2xl bg-white dark:bg-[#232936] border border-slate-200 dark:border-white/15 shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
        >
          {/* Header & Search */}
          <div className="p-1.5 pb-2 border-b border-slate-100 dark:border-white/10">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5 px-1">
              <span>{t.nav.selectLanguage}</span>
              <span>{ui.selectLanguageCount}</span>
            </div>
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={ui.searchLanguagesPlaceholder}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#1B202B] border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-64 overflow-y-auto py-1 space-y-0.5 custom-scrollbar">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => {
                const isSelected = lang.code === currentLang;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-red-50 text-[#D90000] dark:bg-red-950/40 dark:text-red-400 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-sm shrink-0">{lang.flag}</span>
                      <div className="flex flex-col truncate">
                        <span className="font-medium truncate">{lang.nativeName}</span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                          {lang.name}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-[#D90000] dark:text-red-400 shrink-0 ml-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500">
                {ui.noLanguageFound}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
