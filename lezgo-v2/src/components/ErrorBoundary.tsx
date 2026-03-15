import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

// W1 FIX: Simple i18n for error boundary (class component can't use hooks)
const ERROR_TEXTS: Record<string, { title: string; desc: string; reload: string }> = {
  es: { title: 'Algo salió mal', desc: 'Hubo un error cargando esta página. Intenta recargar.', reload: 'Recargar página' },
  en: { title: 'Something went wrong', desc: 'There was an error loading this page. Try reloading.', reload: 'Reload page' },
  zh: { title: '出了点问题', desc: '加载此页面时出错。请尝试重新加载。', reload: '重新加载页面' },
};

function getErrorTexts() {
  const lang = (typeof localStorage !== 'undefined' && localStorage.getItem('lezgo-lang')) || 'es';
  return ERROR_TEXTS[lang] || ERROR_TEXTS.es;
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LEZGO Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const texts = getErrorTexts();
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: '#fff',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#E5FF00' }}>
            {texts.title}
          </h1>
          <p style={{ color: '#999', marginBottom: '2rem', maxWidth: '400px' }}>
            {texts.desc}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              background: '#E5FF00',
              color: '#0A0A0A',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            {texts.reload}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
