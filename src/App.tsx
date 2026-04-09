import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { loading } = useAuth();
  const { pathname } = useLocation();
  const isDeck = pathname === '/deck';

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
      {!isDeck && <Header />}
      <main className={isDeck ? '' : 'lz-main'}>
        <Outlet />
      </main>
      {!isDeck && <Footer />}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: 'var(--gray-800)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontFamily: "'Inter', -apple-system, system-ui, sans-serif",
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
