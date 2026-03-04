import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/events/EventCard';
import { formatDateES, formatDateVeryShort, formatPriceShort, getActivePhase, toDate } from '../lib/helpers';
import './HomePage.css';

const MARQUEE_ITEMS = [
  '✓ VERIFICADO CON ID',
  '☺ MARKETPLACE',
  '✓ CERO ESTAFAS',
  '☺ TU ID = TU ENTRADA',
  '✓ REVENTA SEGURA',
  '☺ ESCANEA Y ENTRA',
];

export default function HomePage() {
  const navigate = useNavigate();
  const { events, loading, error } = useEvents({ status: 'published' });
  const [searchText, setSearchText] = useState('');

  const { featuredEvent, promoEvents, upcomingEvents, moreEvents } = useMemo(() => {
    if (!events || events.length === 0) {
      return { featuredEvent: null, promoEvents: [], upcomingEvents: [], moreEvents: [] };
    }

    const featured = events.find((e) => e.featured) || events[0];
    const remaining = events.filter((e) => e.id !== featured.id);

    // Promo: prioritize featured, then sold-out, then by date (top 2)
    const sorted = remaining.slice().sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.status === 'sold-out' && b.status !== 'sold-out') return -1;
      if (a.status !== 'sold-out' && b.status === 'sold-out') return 1;
      return a.date < b.date ? -1 : 1;
    });
    const promo = sorted.slice(0, 2);

    // Remaining events: sort by date, split into two halves
    const rest = remaining.filter((e) => !promo.find((p) => p.id === e.id));
    const sortedRest = rest.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const half = Math.ceil(sortedRest.length / 2);
    const upcoming = sortedRest.slice(0, half);
    const more = sortedRest.slice(half);

    return { featuredEvent: featured, promoEvents: promo, upcomingEvents: upcoming, moreEvents: more };
  }, [events]);

  const handleNavigateEvent = (eventId: string) => {
    navigate(`/evento/${eventId}`);
  };

  const getLowestPrice = (event: typeof featuredEvent): number | null => {
    if (!event) return null;
    let lowest: number | null = null;
    for (const tier of event.tiers || []) {
      const activePhase = getActivePhase(tier);
      if (activePhase && (lowest === null || activePhase.price < lowest)) {
        lowest = activePhase.price;
      }
    }
    return lowest;
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      navigate(`/eventos?q=${encodeURIComponent(searchText.trim())}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
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
      {/* ── Marquee — Ported from monolith ── */}
      <div className="home-marquee">
        <div className="home-marquee__track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="home-marquee__item">{item}</span>
          ))}
        </div>
      </div>

      {/* ── Hero — Ported from monolith ── */}
      {featuredEvent && (
        <section className="home-hero" id="home-hero">
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
            <div className="home-hero__badge">Destacado</div>

            <h1 className="home-hero__title">{featuredEvent.name}</h1>

            {(featuredEvent.subtitle || featuredEvent.description) && (
              <div className="home-hero__subtitle">
                {featuredEvent.subtitle || featuredEvent.description}
              </div>
            )}

            <div className="home-hero__meta">
              {formatDateES(toDate(featuredEvent.date))}
              {featuredEvent.venue ? ` · ${featuredEvent.venue}` : ''}
              {featuredEvent.location ? `, ${featuredEvent.location}` : ''}
            </div>

            <div className="home-hero__actions">
              <button
                className="home-hero__cta"
                onClick={() => handleNavigateEvent(featuredEvent.id)}
              >
                {featuredEvent.status === 'sold-out' ? 'AGOTADO — Ver reventa →' : 'Ver entradas →'}
              </button>
              <div className="home-hero__sponsor">
                {featuredEvent.organizer && featuredEvent.organizer !== 'demo-user-001' ? (
                  <>Producido por <span>{featuredEvent.organizer}</span>. Powered by </>
                ) : (
                  <>Powered by </>
                )}
                <span>LEZGO ☺</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Search Bar — Ported from monolith ── */}
      <div className="search-section">
        <div className="search-bar">
          <div className="search-field">
            <div className="search-field-label">Ubicación</div>
            <div className="search-field-value">Lima, Perú</div>
          </div>
          <div className="search-field">
            <div className="search-field-label">Fechas</div>
            <div className="search-field-value">Todas las fechas</div>
          </div>
          <div className="search-field search-field--main">
            <div className="search-field-label">Buscar</div>
            <input
              className="search-input"
              type="text"
              placeholder="Evento, artista o lugar..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <button className="search-btn" onClick={handleSearch}>Buscar</button>
        </div>
      </div>

      {/* ── Content wrapper — matches monolith .content ── */}
      <div className="home-content">

        {/* ── Promo Cards — "No te los pierdas" ── */}
        {promoEvents.length > 0 && (
          <>
            <div className="section-head">
              <h2 className="section-title">No te los pierdas</h2>
            </div>
            <div className="home-promo__grid">
              {promoEvents.map((event) => {
                const price = getLowestPrice(event);
                const isSold = event.status === 'sold-out';
                const tag = isSold ? 'AGOTADO' : (event.genre || 'EVENTO');
                // Monolith format: "11 Marzo · venue, location — Desde S/ 0"
                const dateStr = formatDateVeryShort(toDate(event.date));
                const sub = dateStr
                  + (event.venue ? ` · ${event.venue}` : '')
                  + (event.location ? `, ${event.location}` : '')
                  + (price !== null ? ` — ${formatPriceShort(price)}` : '');
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
                      <span className="promo-card__tag">{tag}</span>
                      <h3 className="promo-card__name">
                        {event.name}
                        {event.subtitle ? ` — ${event.subtitle}` : ''}
                      </h3>
                      <p className="promo-card__info">{sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── ID Banner — Ported from monolith ── */}
        <div className="id-banner">
          <div className="id-banner__icon">☺</div>
          <p>
            Cada entrada en Lezgo está vinculada a tu DNI, carnet de extranjería o pasaporte.<br />
            Escanea tu identificación en la puerta y entra. Cero fraude.
          </p>
        </div>

        {/* ── Próximos eventos ── */}
        {upcomingEvents.length > 0 && (
          <>
            <div className="section-head">
              <h2 className="section-title">Próximos eventos</h2>
              <span className="section-more">Ver todos →</span>
            </div>
            <div className={`events-grid${upcomingEvents.length < 4 ? ' events-grid--centered' : ''}`}>
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}

        {/* ── Más en Lima ── */}
        {moreEvents.length > 0 && (
          <>
            <div className="section-head">
              <h2 className="section-title">Más en Lima</h2>
              <span className="section-more">Ver todos →</span>
            </div>
            <div className={`events-grid${moreEvents.length < 4 ? ' events-grid--centered' : ''}`}>
              {moreEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </div>

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
          <div className="home-content">
            <h2>No hay eventos disponibles</h2>
            <p>Vuelve más tarde para ver los próximos eventos</p>
          </div>
        </div>
      )}
    </div>
  );
}
