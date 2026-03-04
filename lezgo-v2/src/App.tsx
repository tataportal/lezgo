import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">LEZGO</div>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="lz-main">
        <Outlet />
      </main>
      <Footer />
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
