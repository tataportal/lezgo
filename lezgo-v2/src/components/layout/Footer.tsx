import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="lz-footer">
      <div className="lz-footer-inner">
        <div className="lz-footer-brand">
          <span className="lz-logo">LEZGO</span>
        </div>
        <div className="lz-footer-links">
          <Link to="/conocenos">Conócenos</Link>
          <Link to="/privacy">Privacidad</Link>
          <Link to="/terms">Términos</Link>
        </div>
        <div className="lz-footer-copy">
          &copy; {new Date().getFullYear()} Lezgo. Tickets verificados con tu identidad.
        </div>
      </div>
    </footer>
  );
}
