import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="lz-footer">
      <div className="lz-footer-inner">
        {/* Col 1: Brand + tagline */}
        <div className="lz-footer-brand">
          <span className="lz-logo">LEZGO</span>
          <p className="lz-footer-tagline">{t.footer.tagline}</p>
        </div>

        {/* Col 2: Nav links */}
        <div className="lz-footer-col">
          <div className="lz-footer-col-title">Navegación</div>
          <div className="lz-footer-links">
            <Link to="/eventos">Eventos</Link>
            <Link to="/reventa">{t.nav.resale}</Link>
            <Link to="/conocenos">{t.footer.about}</Link>
          </div>
        </div>

        {/* Col 3: Legal + Redes */}
        <div className="lz-footer-col">
          <div className="lz-footer-col-title">Legal</div>
          <div className="lz-footer-links">
            <Link to="/privacidad">{t.footer.privacy}</Link>
            <Link to="/terminos">{t.footer.terms}</Link>
          </div>

          <div className="lz-footer-col-title lz-footer-social-title">Redes</div>
          <div className="lz-footer-socials">
            <a href="https://instagram.com/lezgo.fans" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="https://tiktok.com/@lezgo.fans" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13.2a8.16 8.16 0 005.58 2.2V12a4.85 4.85 0 01-3.58-1.59V6.69h3.58z" />
              </svg>
            </a>
            <a href="https://youtube.com/@lezgofans" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="lz-footer-bottom">
        &copy; {new Date().getFullYear()} Lezgo. {t.footer.tagline}
      </div>
    </footer>
  );
}
