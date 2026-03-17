import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import es, { type Translations } from './translations/es';

export type Language = 'es' | 'en' | 'zh';

const translationLoaders: Record<string, () => Promise<{ default: Translations }>> = {
  en: () => import('./translations/en'),
  zh: () => import('./translations/zh'),
};

// Cache loaded translations so we don't re-fetch
const loadedTranslations: Partial<Record<Language, Translations>> = { es };

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'es',
  setLang: () => {},
  t: es,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('lezgo-lang') as Language;
      if (saved && (saved === 'es' || saved === 'en' || saved === 'zh')) return saved;
    } catch {}
    return 'es';
  });

  const [translations, setTranslations] = useState<Translations>(
    loadedTranslations[lang] || es,
  );

  // Set initial html lang attribute on mount
  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load translations when language changes
  useEffect(() => {
    if (lang === 'es') {
      setTranslations(es);
      return;
    }

    const cached = loadedTranslations[lang];
    if (cached) {
      setTranslations(cached);
      return;
    }

    const loader = translationLoaders[lang];
    if (loader) {
      loader().then((mod) => {
        loadedTranslations[lang] = mod.default;
        setTranslations(mod.default);
      });
    }
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try { localStorage.setItem('lezgo-lang', newLang); } catch {}
    document.documentElement.lang = newLang === 'zh' ? 'zh-CN' : newLang;
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
