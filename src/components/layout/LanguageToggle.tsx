import { useTranslation, type Language } from '../../i18n';

const langs: { code: Language; label: string }[] = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中文' },
];

export default function LanguageToggle() {
  const { lang, setLang } = useTranslation();

  return (
    <div className="lz-lang-toggle">
      {langs.map(({ code, label }) => (
        <button
          key={code}
          className={`lz-lang-btn${lang === code ? ' lz-lang-btn--active' : ''}`}
          onClick={() => setLang(code)}
          aria-label={`Switch to ${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
