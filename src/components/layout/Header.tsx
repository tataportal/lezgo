import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { FhButton, LongArrow } from '../ui/FhButton';
import './GlobalHeader.css';

const SMILE_SRC = '/figma/smile.svg';
const LOGO_SRC  = '/figma/lezgo-logo.svg';

export default function Header() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.displayName || user?.email?.split('@')[0] || '';
  const handleAvatarError = useCallback(() => setAvatarFailed(true), []);
  useEffect(() => { setAvatarFailed(false); }, [profile?.photoURL]);

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Lock scroll + Escape to close mobile menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* ====== HEADER BAR ====== */}
      <header className="fh-header">
        <div className="fh-header-inner">
          {/* Logo */}
          <Link to="/" className="fh-logo-link" aria-label="Inicio LEZGO">
            <img className="fh-logo" src={LOGO_SRC} alt="LEZGO" />
          </Link>

          {/* Desktop nav */}
          <nav className="fh-nav" aria-label="Navegación principal">
            <Link
              className={`fh-nav-link${isActive('/eventos') ? ' fh-nav-active' : ''}`}
              to="/eventos"
            >EVENTOS</Link>
            <Link
              className={`fh-nav-link${isActive('/reventa') ? ' fh-nav-active' : ''}`}
              to="/reventa"
            >REVENTA</Link>
            <Link
              className={`fh-nav-link${isActive('/conocenos') ? ' fh-nav-active' : ''}`}
              to="/conocenos"
            >CONÓCENOS</Link>
          </nav>

          {/* Right section */}
          <div className="fh-header-right">
            <button type="button" className="fh-flag" aria-label="Perú">🇵🇪</button>

            {user ? (
              /* ── Logged in: avatar + dropdown ── */
              <div className="fh-profile-menu" ref={profileRef}>
                <button
                  type="button"
                  className="fh-profile-btn"
                  onClick={() => setProfileOpen(o => !o)}
                  aria-label="Menú de perfil"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  {profile?.photoURL && !avatarFailed ? (
                    <img
                      src={profile.photoURL}
                      alt=""
                      className="fh-user-avatar"
                      onError={handleAvatarError}
                    />
                  ) : (
                    <div className="fh-user-avatar fh-user-avatar-placeholder">
                      {(profile?.displayName || user.email || '?')[0].toUpperCase()}
                    </div>
                  )}
                </button>
                {profileOpen && (
                  <div className="lz-dropdown" style={{ right: 0, minWidth: '12rem' }}>
                    <span
                      className="lz-dropdown-item"
                      style={{
                        fontFamily: "'Big Shoulders Display', sans-serif",
                        fontWeight: 900,
                        fontSize: '0.875rem',
                        color: 'var(--acid)',
                        cursor: 'default',
                        pointerEvents: 'none',
                      }}
                    >
                      {displayName}
                    </span>
                    <div className="lz-dropdown-divider" />
                    <Link to="/perfil" className="lz-dropdown-item" onClick={() => setProfileOpen(false)}>
                      Mi perfil
                    </Link>
                    <Link to="/mis-entradas" className="lz-dropdown-item" onClick={() => setProfileOpen(false)}>
                      Mis entradas
                    </Link>
                    <div className="lz-dropdown-divider" />
                    <button
                      className="lz-dropdown-item lz-dropdown-item--danger"
                      onClick={() => { logout(); setProfileOpen(false); }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Logged out: INICIAR SESIÓN ── */
              <FhButton to="/auth" className="fh-login" arrowLength={28}>
                INICIAR SESIÓN
              </FhButton>
            )}

            {/* Hamburger */}
            <button
              type="button"
              className={`fh-menu-toggle${menuOpen ? ' fh-menu-open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              aria-controls="fh-mobile-menu"
            >
              <span className="fh-menu-bar" />
              <span className="fh-menu-bar" />
              <span className="fh-menu-bar" />
            </button>
          </div>
        </div>

        {/* Marquee ticker */}
        <div className="fh-marquee-bar">
          <div className="fh-marquee-track">
            {Array.from({ length: 6 }).map((_, i) => (
              <span className="fh-marquee-item" key={i} aria-hidden={i > 0}>
                <img src={SMILE_SRC} alt="" className="fh-marquee-smile" /> ACCESO VERIFICADO CON IDENTIDAD
                <img src={SMILE_SRC} alt="" className="fh-marquee-smile" /> SIN REVENTAS FALSAS
                <img src={SMILE_SRC} alt="" className="fh-marquee-smile" /> TU DNI ES TU ENTRADA
                <img src={SMILE_SRC} alt="" className="fh-marquee-smile" /> MARKETPLACE SEGURO
                <img src={SMILE_SRC} alt="" className="fh-marquee-smile" /> ESCANEA Y ENTRA
                <img src={SMILE_SRC} alt="" className="fh-marquee-smile" /> SIN DRAMAS
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ====== MOBILE MENU DRAWER ====== */}
      <div
        id="fh-mobile-menu"
        className={`fh-mobile-menu${menuOpen ? ' fh-mobile-menu-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div
          className="fh-mobile-menu-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
        <nav className="fh-mobile-menu-panel" aria-label="Menú móvil">
          <Link to="/eventos" className="fh-mobile-link" onClick={() => setMenuOpen(false)}>
            EVENTOS <LongArrow color="currentColor" length={28} />
          </Link>
          <Link to="/reventa" className="fh-mobile-link" onClick={() => setMenuOpen(false)}>
            REVENTA <LongArrow color="currentColor" length={28} />
          </Link>
          <Link to="/conocenos" className="fh-mobile-link" onClick={() => setMenuOpen(false)}>
            CONÓCENOS <LongArrow color="currentColor" length={28} />
          </Link>

          {user ? (
            <>
              <div className="fh-mobile-divider" />
              <Link to="/perfil" className="fh-mobile-link" onClick={() => setMenuOpen(false)}>
                MI PERFIL <LongArrow color="currentColor" length={28} />
              </Link>
              <Link to="/mis-entradas" className="fh-mobile-link" onClick={() => setMenuOpen(false)}>
                MIS ENTRADAS <LongArrow color="currentColor" length={28} />
              </Link>
              <FhButton
                className="fh-mobile-cta"
                variant="outline"
                arrowLength={36}
                onClick={() => { logout(); setMenuOpen(false); }}
              >
                CERRAR SESIÓN
              </FhButton>
            </>
          ) : (
            <FhButton
              to="/auth"
              className="fh-mobile-cta"
              arrowLength={36}
              onClick={() => setMenuOpen(false)}
            >
              INICIAR SESIÓN
            </FhButton>
          )}
        </nav>
      </div>
    </>
  );
}
