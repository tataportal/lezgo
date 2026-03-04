import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export default function Header() {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
            Eventos
          </Link>
          <Link
            to="/reventa"
            className={`lz-nav-link ${isActive('/reventa') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Reventa
          </Link>
          <Link
            to="/conocenos"
            className={`lz-nav-link ${isActive('/conocenos') ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            Conócenos
          </Link>
        </nav>

        <div className="lz-header-actions">
          {user ? (
            <>
              <Link to="/mis-entradas" className="lz-btn lz-btn-ghost">
                Mis Entradas
              </Link>
              <button onClick={logout} className="lz-btn lz-btn-ghost">
                Salir
              </button>
              <Link to="/perfil" className="lz-avatar-link">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="lz-avatar" />
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
                Iniciar sesión
              </Link>
              <Link to="/auth?tab=register" className="lz-btn lz-btn-primary">
                Crear cuenta
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
