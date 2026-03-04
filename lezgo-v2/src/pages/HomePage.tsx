import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/events/EventCard';
import { formatDateES, formatPriceShort, getActivePhase, toDate } from '../lib/helpers';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { events, loading, error } = useEvents({ status: 'published' });

  const { featuredEvent, promoEvents, upcomingEvents, moreEvents } = useMemo(() => {
    if (!events || events.length === 0) {
      return { featuredEvent: null, promoEvents: [], upcomingEvents: [], moreEvents: [] };
    }

    // Get featured event (first featured event or first event if none featured)
    const featured = events.find((e) => e.featured) || events[0];

    // Get remaining events
    const remaining = events.filter((e) => e.id !== featured.id);

    // First 2 remaining go to promo cards
    const promo = remaining.slice(0, 2);

    // Rest split into upcoming and more
    const rest = remaining.slice(2);
    const midpoint = Math.ceil(rest.length / 2);
    const upcoming = rest.slice(0, midpoint);
    const more = rest.slice(midpoint);

    return {
      featuredEvent: featured,
      promoEvents: promo,
      upcomingEvents: upcoming,
      moreEvents: more,
    };
  }, [events]);

  const handleNavigateEvent = (eventId: string) => {
    navigate(`/evento/${eventId}`);
  };

  // Get lowest price from an event's active tiers
  const getLowestPrice = (event: typeof featuredEvent): number | null => {
    if (!event) return null;
    let lowest: number | null = null;
    for (const tier of event.tiers || []) {
      const activePhase = getActivePhase(tier);
      if (activePhase) {
        if (lowest === null || activePhase.price < lowest) {
          lowest = activePhase.price;
        }
      }
    }
    return lowest;
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
            CERO ESTAFAS · TU ID = TU ENTRADA · REVENTA SEGURA · SIN BOTS ·&nbsp;
          </span>
          <span className="home-marquee__text">
            CERO ESTAFAS · TU ID = TU ENTRADA · REVENTA SEGURA · SIN BOTS ·&nbsp;
          </span>
        </div>
      </div>

      {/* Hero Section — Left-aligned, bottom-justified like monolith */}
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
            <div className="home-hero__badge">
              <span>★</span> DESTACADO
            </div>

            <h1 className="home-hero__title">{featuredEvent.name}</h1>

            {featuredEvent.subtitle && (
              <p className="home-hero__subtitle">{featuredEvent.subtitle}</p>
            )}

            <div className="home-hero__meta">
              {formatDateES(toDate(featuredEvent.date))}
              {featuredEvent.venue ? ` · ${featuredEvent.venue}` : ''}
              {featuredEvent.location ? ` · ${featuredEvent.location}` : ''}
            </div>

            <div className="home-hero__actions">
              <button
                className="home-hero__cta"
                onClick={() => handleNavigateEvent(featuredEvent.id)}
              >
                Ver entradas →
              </button>

              {featuredEvent.organizer && (
                <span className="home-hero__sponsor">
                  Presentado por <span>{featuredEvent.organizer}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Promo Cards — Full-bleed 1:1 image cards like monolith */}
      {promoEvents.length > 0 && (
        <section className="home-promo">
          <div className="page-container">
            <h2 className="home-promo__title">Destacados</h2>
            <div className="home-promo__grid">
              {promoEvents.map((event) => {
                const lowestPrice = getLowestPrice(event);
                return (
                  <div
                    key={event.id}
                    className="promo-card"
                    onClick={() => handleNavigateEvent(event.id)}
                  >
                    <div
                      className="promo-card__image"
                      style={{
                        backgroundImage: event.image
                          ? `url(${event.image})`
                          : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                      }}
                    />
                    <div className="promo-card__overlay" />
                    <div className="promo-card__body">
                      {event.status === 'sold-out' ? (
                        <span className="promo-card__tag">AGOTADO</span>
                      ) : (
                        <span className="promo-card__tag">
                          {event.genre || 'EVENTO'}
                        </span>
                      )}
                      <div className="promo-card__name">{event.name}</div>
                      <div className="promo-card__info">
                        {formatDateES(toDate(event.date))}
                        {lowestPrice !== null ? ` · Desde ${formatPriceShort(lowestPrice)}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events Grid — 4-col */}
      {upcomingEvents.length > 0 && (
        <section className="home-upcoming">
          <div className="page-container">
            <h2 className="home-upcoming__title">Próximos eventos</h2>
            <div className="home-upcoming__grid">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* More Events Grid — 4-col */}
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
