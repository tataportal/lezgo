import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import App from './App';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load all pages for code splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const EventPage = lazy(() => import('./pages/EventPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MyTicketsPage = lazy(() => import('./pages/MyTicketsPage'));
const OrganizerPage = lazy(() => import('./pages/OrganizerPage'));
const ScannerPage = lazy(() => import('./pages/ScannerPage'));
const EventFormPage = lazy(() => import('./pages/EventFormPage'));
const PromoterPage = lazy(() => import('./pages/PromoterPage'));
const DeckPage = lazy(() => import('./pages/DeckPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="loading-screen">
            <div className="branded-loader">
              <div className="branded-loader-logo">LEZGO</div>
              <div className="branded-loader-bars">
                <span /><span /><span /><span /><span />
              </div>
            </div>
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <SuspenseWrap><HomePage /></SuspenseWrap>,
      },
      {
        path: 'eventos',
        element: <SuspenseWrap><EventsPage /></SuspenseWrap>,
      },
      {
        path: 'evento/:eventId',
        element: <SuspenseWrap><EventPage /></SuspenseWrap>,
      },
      {
        path: 'reventa',
        element: <SuspenseWrap><MarketplacePage /></SuspenseWrap>,
      },
      {
        path: 'conocenos',
        element: <SuspenseWrap><AboutPage /></SuspenseWrap>,
      },
      {
        path: 'auth',
        element: <SuspenseWrap><AuthPage /></SuspenseWrap>,
      },
      {
        path: 'perfil',
        element: (
          <ProtectedRoute>
            <SuspenseWrap><ProfilePage /></SuspenseWrap>
          </ProtectedRoute>
        ),
      },
      {
        path: 'mis-entradas',
        element: (
          <ProtectedRoute>
            <SuspenseWrap><MyTicketsPage /></SuspenseWrap>
          </ProtectedRoute>
        ),
      },
      {
        path: 'organizer',
        element: (
          <ProtectedRoute requirePromoter>
            <SuspenseWrap><OrganizerPage /></SuspenseWrap>
          </ProtectedRoute>
        ),
      },
      {
        path: 'scanner',
        element: (
          <ProtectedRoute requirePromoter>
            <SuspenseWrap><ScannerPage /></SuspenseWrap>
          </ProtectedRoute>
        ),
      },
      {
        path: 'event-form',
        element: (
          <ProtectedRoute requirePromoter>
            <SuspenseWrap><EventFormPage /></SuspenseWrap>
          </ProtectedRoute>
        ),
      },
      {
        path: 'promotor/:name',
        element: <SuspenseWrap><PromoterPage /></SuspenseWrap>,
      },
      {
        path: 'deck',
        element: <SuspenseWrap><DeckPage /></SuspenseWrap>,
      },
      {
        path: 'privacidad',
        element: <SuspenseWrap><PrivacyPage /></SuspenseWrap>,
      },
      {
        path: 'terminos',
        element: <SuspenseWrap><TermsPage /></SuspenseWrap>,
      },
      {
        // /inicio redirects to homepage (used by AuthPage, AboutPage, MyTicketsPage)
        path: 'inicio',
        element: <SuspenseWrap><HomePage /></SuspenseWrap>,
      },
      {
        path: '*',
        element: <SuspenseWrap><NotFoundPage /></SuspenseWrap>,
      },
    ],
  },
]);
