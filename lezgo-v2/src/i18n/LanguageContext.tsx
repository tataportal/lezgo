import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import es, { type Translations } from './translations/es';
import en from './translations/en';
import zh from './translations/zh';

export type Language = 'es' | 'en' | 'zh';

const translations: Record<Language, Translations> = { es, en, zh };

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
      if (saved && translations[saved]) return saved;
    } catch {}
    return 'es';
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try { localStorage.setItem('lezgo-lang', newLang); } catch {}
    document.documentElement.lang = newLang === 'zh' ? 'zh-CN' : newLang;
  }, []);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
