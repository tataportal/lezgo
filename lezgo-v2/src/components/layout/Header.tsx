import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../i18n';
import { useState, useCallback, useEffect } from 'react';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const { user, profile, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const handleAvatarError = useCallback(() => setAvatarFailed(true), []);
  useEffect(() => { setAvatarFailed(false); }, [profile?.photoURL]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="lz-header">
      <div className="lz-header-inner">
        <Link to="/" className="lz-logo">LEZGO</Link>

        <nav className={`lz-nav ${mobileOpen ? 'lz-nav-open' : ''}`}>
          <Link
            to="/"
            className={`lz-nav-link ${isActive('/') ? 'active' : ''}`}
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
                <Link to="/mis-entradas" className="lz-nav-link" onClick={() => setMobileOpen(false)}>
                  {t.nav.myTickets}
                </Link>
                <Link to="/perfil" className="lz-nav-link" onClick={() => setMobileOpen(false)}>
                  {t.nav.profile || 'Perfil'}
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); }} className="lz-nav-link" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textAlign: 'left', padding: 0, fontSize: 'inherit' }}>
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="lz-btn lz-btn-primary" style={{ width: '100%', textAlign: 'center' }} onClick={() => setMobileOpen(false)}>
                  {t.nav.login}
                </Link>
              </>
            )}
            <LanguageToggle />
          </div>
        </nav>

        <div className="lz-header-actions">
          <LanguageToggle />
          {user ? (
            <>
              <Link to="/mis-entradas" className="lz-btn lz-btn-ghost">
                {t.nav.myTickets}
              </Link>
              <button onClick={logout} className="lz-btn lz-btn-ghost">
                {t.nav.logout}
              </button>
              <Link to="/perfil" className="lz-avatar-link">
                {profile?.photoURL && !avatarFailed ? (
                  <img src={profile.photoURL} alt="" className="lz-avatar" onError={handleAvatarError} />
                ) : (
                  <div className="lz-avatar lz-avatar-placeholder">
                    {(profile?.displayName || user.email || '?')[0].toUpperCase()}
                  </div>
                )}
              </Link>
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
