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
          padding: 'var(--sp-8)',
          color: 'var(--text)',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: 'var(--fs-h1)', marginBottom: 'var(--sp-4)', color: 'var(--acid)' }}>
            {texts.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-8)', maxWidth: '400px' }}>
            {texts.desc}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              background: 'var(--acid)',
              color: 'var(--bg)',
              border: 'none',
              padding: 'var(--sp-3) var(--sp-8)',
              borderRadius: 'var(--radius-md)',
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
