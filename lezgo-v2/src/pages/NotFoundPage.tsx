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
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '72px', marginBottom: '16px', opacity: 0.6 }}>404</div>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: 'var(--acid)' }}>
        {t.common.notFoundTitle}
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '400px' }}>
        {t.common.notFoundDesc}
      </p>
      <button
        onClick={() => navigate('/')}
        className="lz-btn-primary"
        style={{ padding: '12px 32px' }}
      >
        {t.common.goHome}
      </button>
    </div>
  );
}
