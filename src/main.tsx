import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './i18n';
import { router } from './router';
import './styles/globals.css';

// Lazy-load analytics to avoid CSP/crash issues
const loadAnalytics = async () => {
  try {
    const { inject } = await import('@vercel/analytics');
    inject();
    const { injectSpeedInsights } = await import('@vercel/speed-insights');
    injectSpeedInsights();
  } catch { /* silently fail if blocked by CSP */ }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <LanguageProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </LanguageProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);

loadAnalytics();
