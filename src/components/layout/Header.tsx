import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation, type Language } from '../../i18n';
import { useState, useCallback, useEffect, useRef } from 'react';

const FLAG_LANGS: { code: Language; flagSrc: string; label: string }[] = [
  { code: 'es', flagSrc: '/flags/pe.svg', label: 'Español' },
  { code: 'en', flagSrc: '/flags/us.svg', label: 'English' },
  { code: 'zh', flagSrc: '/flags/cn.svg', label: '中文' },
];

export default function Header() {
  const { user, profile, logout } = useAuth();
  const { t, lang, setLang } = useTranslation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const handleAvatarError = useCallback(() => setAvatarFailed(true), []);
  useEffect(() => { setAvatarFailed(false); }, [profile?.photoURL]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const displayName = profile?.displayName || user?.email?.split('@')[0] || '';
  const currentFlag = FLAG_LANGS.find(l => l.code === lang)!;

  return (
    <header className="lz-header">
      <div className="lz-header-inner">
        <Link to="/" className="lz-logo">LEZGO</Link>

        <nav className={`lz-nav ${mobileOpen ? 'lz-nav-open' : ''}`}>
          <Link
            to="/eventos"
            className={`lz-nav-link ${isActive('/eventos') || isActive('/') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {t.nav.events}
          </Link>
          <Link
            to="/reventa"
            className={`lz-nav-link ${isActive('/reventa') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {t.nav.resale}
          </Link>
          <Link
            to="/conocenos"
            className={`lz-nav-link ${isActive('/conocenos') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {t.nav.about}
          </Link>

          {/* Mobile-only: user actions inside nav */}
          <div className="lz-mobile-actions">
            {user ? (
              <>
                <Link to="/perfil" className="lz-nav-link" onClick={() => setMobileOpen(false)}>
                  {t.nav.profile || 'Perfil'}
                </Link>
                <Link to="/mis-entradas" className="lz-nav-link" onClick={() => setMobileOpen(false)}>
                  {t.nav.myTickets}
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="lz-nav-link" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textAlign: 'left', padding: 0, fontSize: 'inherit' }}>
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <Link to="/auth" className="lz-btn lz-btn-primary" style={{ width: '100%', textAlign: 'center' }} onClick={() => setMobileOpen(false)}>
                {t.nav.login}
              </Link>
            )}
          </div>
        </nav>

        <div className="lz-header-actions">
          {/* Language flag selector */}
          <div className="lz-lang-flag" ref={langRef}>
            <button
              className="lz-lang-flag-btn"
              onClick={() => { setLangOpen(!langOpen); setProfileOpen(false); }}
              aria-label="Change language"
            >
              <img src={currentFlag.flagSrc} alt="" className="lz-lang-flag-icon" aria-hidden="true" />
            </button>
            {langOpen && (
              <div className="lz-dropdown lz-lang-dropdown">
                {FLAG_LANGS.map(({ code, flagSrc, label }) => (
                  <button
                    key={code}
                    className={`lz-dropdown-item${lang === code ? ' active' : ''}`}
                    onClick={() => { setLang(code); setLangOpen(false); }}
                  >
                    <img src={flagSrc} alt="" className="lz-lang-flag-icon" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user ? (
            <>
              {/* Greeting */}
              <span className="lz-header-greeting">
                {lang === 'es' ? 'Hola' : lang === 'zh' ? '你好' : 'Hi'}, {displayName}
              </span>

              {/* Profile avatar + dropdown */}
              <div className="lz-profile-menu" ref={profileRef}>
                <button
                  className="lz-avatar-btn"
                  onClick={() => { setProfileOpen(!profileOpen); setLangOpen(false); }}
                >
                  {profile?.photoURL && !avatarFailed ? (
                    <img src={profile.photoURL} alt="" className="lz-avatar" onError={handleAvatarError} />
                  ) : (
                    <div className="lz-avatar lz-avatar-placeholder">
                      {(profile?.displayName || user.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                </button>
                {profileOpen && (
                  <div className="lz-dropdown lz-profile-dropdown">
                    <Link to="/perfil" className="lz-dropdown-item" onClick={() => setProfileOpen(false)}>
                      {t.nav.profile || 'Mi perfil'}
                    </Link>
                    <Link to="/mis-entradas" className="lz-dropdown-item" onClick={() => setProfileOpen(false)}>
                      {t.nav.myTickets}
                    </Link>
                    <Link to="/perfil#badges" className="lz-dropdown-item" onClick={() => setProfileOpen(false)}>
                      {t.profile.badges || 'Badges'}
                    </Link>
                    <Link to="/perfil#settings" className="lz-dropdown-item" onClick={() => setProfileOpen(false)}>
                      {t.nav.settings}
                    </Link>
                    <div className="lz-dropdown-divider" />
                    <button className="lz-dropdown-item lz-dropdown-item--danger" onClick={() => { logout(); setProfileOpen(false); }}>
                      {t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/auth" className="lz-btn lz-btn-ghost">
                {t.nav.login}
              </Link>
              <Link to="/auth?tab=register" className="lz-btn lz-btn-primary">
                {t.nav.register}
              </Link>
            </>
          )}
        </div>

        <button
          className="lz-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
