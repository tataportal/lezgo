import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { useAuth } from './contexts/AuthContext';

function isLocalPreviewHost(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

const isDeckExperience = typeof window !== 'undefined' && (
  window.location.hostname === 'deck.lezgo.fans' ||
  (window.location.pathname === '/deck' && isLocalPreviewHost(window.location.hostname))
);

const isEmailPreviewExperience = typeof window !== 'undefined' &&
  window.location.pathname === '/email-previews' &&
  isLocalPreviewHost(window.location.hostname);

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.location.hostname === 'deck.lezgo.fans' || location.pathname === '/deck') {
      window.history.scrollRestoration = 'manual';
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [location.pathname]);

  return null;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="branded-loader">
          <div className="branded-loader-logo">LEZGO</div>
          <div className="branded-loader-bars">
            <span /><span /><span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ScrollManager />
      {!isDeckExperience && !isEmailPreviewExperience && <Header />}
      <main className={isDeckExperience ? 'lz-main lz-main--deck' : isEmailPreviewExperience ? 'lz-main lz-main--deck' : 'lz-main'}>
        <Outlet />
      </main>
      {!isDeckExperience && !isEmailPreviewExperience && <Footer />}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--gray-800)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: "'Sora', sans-serif",
          },
          success: {
            iconTheme: { primary: 'var(--green)', secondary: 'var(--gray-900)' },
          },
          error: {
            iconTheme: { primary: 'var(--red)', secondary: 'var(--gray-900)' },
          },
        }}
      />
    </>
  );
}
