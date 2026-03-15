import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="lz-footer">
      <div className="lz-footer-inner">
        <div className="lz-footer-brand">
          <span className="lz-logo">LEZGO</span>
        </div>
        <div className="lz-footer-links">
          <Link to="/conocenos">{t.footer.about}</Link>
          <Link to="/privacidad">{t.footer.privacy}</Link>
          <Link to="/terminos">{t.footer.terms}</Link>
        </div>
        <div className="lz-footer-copy">
          &copy; {new Date().getFullYear()} Lezgo. {t.footer.tagline}
        </div>
      </div>
    </footer>
  );
}
