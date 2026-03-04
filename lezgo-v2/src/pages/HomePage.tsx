import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/events/EventCard';
import { formatDateES, toDate } from '../lib/helpers';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { events, loading, error } = useEvents({ status: 'published' });

  const { featuredEvent, upcomingEvents, moreEvents } = useMemo(() => {
    if (!events || events.length === 0) {
      return { featuredEvent: null, upcomingEvents: [], moreEvents: [] };
    }

    // Get featured event (first featured event or first event if none featured)
    const featured = events.find((e) => e.featured) || events[0];

    // Get remaining events
    const remaining = events.filter((e) => e.id !== featured.id);

    // Split remaining into two halves for the two grids
    const midpoint = Math.ceil(remaining.length / 2);
    const upcoming = remaining.slice(0, midpoint);
    const more = remaining.slice(midpoint);

    return {
      featuredEvent: featured,
      upcomingEvents: upcoming,
      moreEvents: more,
    };
  }, [events]);

  const handleFeaturedCTA = () => {
    if (featuredEvent) {
      navigate(`/evento/${featuredEvent.id}`);
    }
  };

  if (error) {
    return (
      <div className="home-error">
        <p>Error cargando eventos: {error}</p>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Marquee Banner */}
      <div className="home-marquee">
        <div className="home-marquee__track">
          <span className="home-marquee__text">
            CERO ESTAFAS · TU ID = TU ENTRADA · REVENTA SEGURA · SIN BOTS ·
            CERO ESTAFAS · TU ID = TU ENTRADA · REVENTA SEGURA · SIN BOTS
          </span>
        </div>
      </div>

      {/* Hero Section */}
      {featuredEvent && (
        <div className="home-hero">
          <div
            className="home-hero__background"
            style={{
              backgroundImage: featuredEvent.image
                ? `url(${featuredEvent.image})`
                : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            }}
          />
          <div className="home-hero__overlay" />

          <div className="home-hero__content">
            <h1 className="home-hero__title">{featuredEvent.name}</h1>

            {featuredEvent.subtitle && (
              <p className="home-hero__subtitle">{featuredEvent.subtitle}</p>
            )}

            <div className="home-hero__info">
              <span className="home-hero__date">
                {formatDateES(toDate(featuredEvent.date))}
              </span>
              <span className="home-hero__venue">
                {featuredEvent.venue || ''}{featuredEvent.venue && featuredEvent.location ? ' • ' : ''}{featuredEvent.location || ''}
              </span>
            </div>

            <button className="home-hero__cta lz-btn lz-btn-primary" onClick={handleFeaturedCTA}>
              Ver entradas →
            </button>
          </div>
        </div>
      )}

      {/* Promo Cards Section */}
      {upcomingEvents.length > 0 && (
        <section className="home-promo">
          <div className="page-container">
            <h2 className="home-promo__title">Destacados</h2>
            <div className="home-promo__grid">
              {upcomingEvents.slice(0, 2).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events Grid */}
      {upcomingEvents.length > 0 && (
        <section className="home-upcoming">
          <div className="page-container">
            <h2 className="home-upcoming__title">Próximos eventos</h2>
            <div className="home-upcoming__grid">
              {upcomingEvents.slice(2).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* More Events Grid */}
      {moreEvents.length > 0 && (
        <section className="home-more">
          <div className="page-container">
            <h2 className="home-more__title">Más en Lima</h2>
            <div className="home-more__grid">
              {moreEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && events.length === 0 && (
        <div className="home-loading">
          <div className="loading-spinner" />
          <p>Cargando eventos...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <div className="home-empty">
          <div className="page-container">
            <h2>No hay eventos disponibles</h2>
            <p>Vuelve más tarde para ver los próximos eventos</p>
          </div>
        </div>
      )}
    </div>
  );
}