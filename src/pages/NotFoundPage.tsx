import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--sp-10) var(--sp-6)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 'var(--fs-display)', marginBottom: 'var(--sp-4)', opacity: 0.6 }}>404</div>
      <h1 style={{ fontSize: 'var(--fs-h2)', fontWeight: 800, marginBottom: 'var(--sp-2)', color: 'var(--acid)' }}>
        {t.common.notFoundTitle}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-8)', maxWidth: '400px' }}>
        {t.common.notFoundDesc}
      </p>
      <button
        onClick={() => navigate('/')}
        className="lz-btn-primary"
        style={{ padding: 'var(--sp-3) var(--sp-8)' }}
      >
        {t.common.goHome}
      </button>
    </div>
  );
}
