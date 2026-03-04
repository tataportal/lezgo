import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventById } from '../hooks/useEvents';
import { formatDateES, formatPrice, getActivePhase, toDate } from '../lib/helpers';
import './EventPage.css';

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { event, loading, error } = useEventById(eventId || '');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  const handleBuyTickets = () => {
    if (!event) return;
    navigate(`/evento/${event.id}`);
  };

  const handleResale = () => {
    navigate('/reventa');
  };

  const handleTierBuy = (tierId: string) => {
    setSelectedTierId(tierId);
    setShowPurchaseModal(true);
  };

  if (error) {
    return (
      <div className="ev-detail-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (loading || !event) {
    return (
      <div className="ev-detail-loading">
        <div className="loading-spinner" />
        <p>Cargando evento...</p>
      </div>
    );
  }

  const isSoldOut = event.status === 'sold-out';
  const hasLineup = event.visibleSections.lineup && event.lineup && event.lineup.length > 0;
  const hasVenue = event.visibleSections.venue;

  return (
    <div className="ev-detail">
      {/* Hero Section */}
      <div className="ev-detail-hero">
        <div
          className="ev-detail-hero__background"
          style={{
            backgroundImage: event.image
              ? `url(${event.image})`
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          }}
        />
        <div className="ev-detail-hero__overlay" />

        <div className="ev-detail-hero__content">
          <h1 className="ev-detail-hero__title">{event.name}</h1>

          {event.subtitle && (
            <p className="ev-detail-hero__subtitle">{event.subtitle}</p>
          )}

          <div className="ev-detail-hero__info">
            <span className="ev-detail-hero__date">
              {formatDateES(toDate(event.date))}
            </span>
            <span className="ev-detail-hero__venue">
              {event.venue} • {event.location}
            </span>
          </div>
        </div>
      </div>

      <div className="page-container">
        {/* CTA Section */}
        <div className="ev-detail-cta">
          {isSoldOut ? (
            <button className="ev-detail-cta__button ev-detail-cta__button--secondary" onClick={handleResale}>
              AGOTADO — Ver en reventa
            </button>
          ) : (
            <button className="ev-detail-cta__button lz-btn lz-btn-primary" onClick={handleBuyTickets}>
              Comprar entradas
            </button>
          )}
        </div>

        {/* Ticket Tiers Section */}
        <section className="ev-detail-tiers">
          <h2 className="ev-detail-tiers__title">Entradas disponibles</h2>

          <div className="ev-detail-tiers__list">
            {(event.tiers || []).map((tier) => {
              const activePhase = getActivePhase(tier);
              const remaining = Math.max(0, tier.capacity - tier.sold);

              return (
                <div key={tier.id} className="ev-detail-tier-card">
                  <div className="ev-detail-tier-card__header">
                    <div className="ev-detail-tier-card__name-wrap">
                      <h3 className="ev-detail-tier-card__name">{tier.name}</h3>
                      {activePhase && (
                        <span className="ev-detail-tier-card__phase">{activePhase.name}</span>
                      )}
                    </div>

                    {activePhase && (
                      <div className="ev-detail-tier-card__price">{formatPrice(activePhase.price)}</div>
                    )}
                  </div>

                  <div className="ev-detail-tier-card__info">
                    <div className="ev-detail-tier-card__availability">
                      <span className="ev-detail-tier-card__availability-label">Disponibles:</span>
                      <span className="ev-detail-tier-card__availability-value">
                        {remaining} de {tier.capacity}
                      </span>
                    </div>

                    <div className="ev-detail-tier-card__progress">
                      <div className="ev-detail-tier-card__progress-bar">
                        <div
                          className="ev-detail-tier-card__progress-fill"
                          style={{
                            width: `${(tier.sold / tier.capacity) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {tier.phases.length > 1 && (
                      <div className="ev-detail-tier-card__phases">
                        <span className="ev-detail-tier-card__phases-label">Fases:</span>
                        <div className="ev-detail-tier-card__phases-list">
                          {tier.phases.map((phase, idx) => (
                            <span
                              key={idx}
                              className={`ev-detail-tier-card__phase-badge ${
                                phase.active ? 'ev-detail-tier-card__phase-badge--active' : ''
                              }`}
                            >
                              {phase.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="ev-detail-tier-card__button lz-btn lz-btn-primary"
                    onClick={() => handleTierBuy(tier.id)}
                    disabled={remaining === 0}
                  >
                    {remaining === 0 ? 'Agotado' : 'Comprar'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Event Info Chips */}
        {(event.meta.crowdSize || event.genre || event.meta.ageRestriction || event.meta.outdoor !== undefined || event.meta.alcohol !== undefined || event.meta.reentry !== undefined || event.meta.multiStage) && (
          <section className="ev-detail-chips">
            <div className="ev-detail-chips__grid">
              {event.genre && (
                <div className="ev-detail-chip">
                  <span className="ev-detail-chip__label">Género</span>
                  <span className="ev-detail-chip__value">{event.genre}</span>
                </div>
              )}

              {event.meta.ageRestriction && (
                <div className="ev-detail-chip">
                  <span className="ev-detail-chip__label">Edad mínima</span>
                  <span className="ev-detail-chip__value">{event.meta.ageRestriction}</span>
                </div>
              )}

              {event.meta.crowdSize && (
                <div className="ev-detail-chip">
                  <span className="ev-detail-chip__label">Aforo</span>
                  <span className="ev-detail-chip__value">{event.meta.crowdSize}</span>
                </div>
              )}

              {event.meta.outdoor !== undefined && (
                <div className="ev-detail-chip">
                  <span className="ev-detail-chip__label">Ubicación</span>
                  <span className="ev-detail-chip__value">
                    {event.meta.outdoor ? 'Aire libre' : 'Cubierto'}
                  </span>
                </div>
              )}

              {event.meta.alcohol !== undefined && (
                <div className="ev-detail-chip">
                  <span className="ev-detail-chip__label">Alcohol</span>
                  <span className="ev-detail-chip__value">
                    {event.meta.alcohol ? 'Permitido' : 'Prohibido'}
                  </span>
                </div>
              )}

              {event.meta.reentry !== undefined && (
                <div className="ev-detail-chip">
                  <span className="ev-detail-chip__label">Reentrada</span>
                  <span className="ev-detail-chip__value">
                    {event.meta.reentry ? 'Permitida' : 'No permitida'}
                  </span>
                </div>
              )}

              {event.meta.multiStage && (
                <div className="ev-detail-chip">
                  <span className="ev-detail-chip__label">Escenarios</span>
                  <span className="ev-detail-chip__value">Múltiples</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Lineup Section */}
        {hasLineup && (
          <section className="ev-detail-lineup">
            <h2 className="ev-detail-lineup__title">Artistas</h2>
            <div className="ev-detail-lineup__grid">
              {event.lineup.map((artist, idx) => (
                <div key={idx} className="ev-detail-artist-card">
                  <div className="ev-detail-artist-card__placeholder" />
                  <div className="ev-detail-artist-card__name">{artist}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* About Section */}
        {(event.description || event.descriptionLong) && (
          <section className="ev-detail-about">
            <h2 className="ev-detail-about__title">Sobre el evento</h2>

            {event.description && (
              <p className="ev-detail-about__description">{event.description}</p>
            )}

            {event.descriptionLong && (
              <p className="ev-detail-about__description-long">{event.descriptionLong}</p>
            )}
          </section>
        )}

        {/* Venue Section */}
        {hasVenue && (
          <section className="ev-detail-venue">
            <h2 className="ev-detail-venue__title">Lugar</h2>

            <div className="ev-detail-venue__info">
              <div className="ev-detail-venue__name">{event.venue}</div>
              <div className="ev-detail-venue__address">{event.address || event.location}</div>

              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(
                  `${event.venue}, ${event.address || event.location}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ev-detail-venue__map-link lz-btn lz-btn-ghost"
              >
                Ver en Google Maps
              </a>
            </div>
          </section>
        )}
      </div>

      {/* Sticky Mobile CTA */}
      <div className="ev-detail-mobile-cta">
        <div className="ev-detail-mobile-cta__price">
          {(event.tiers || [])[0] && getActivePhase((event.tiers || [])[0]) && (
            <>
              <span className="ev-detail-mobile-cta__price-label">Desde</span>
              <span className="ev-detail-mobile-cta__price-value">
                {formatPrice(getActivePhase((event.tiers || [])[0])?.price || 0)}
              </span>
            </>
          )}
        </div>

        <button
          className="ev-detail-mobile-cta__button lz-btn lz-btn-primary"
          onClick={handleBuyTickets}
          disabled={isSoldOut}
        >
          {isSoldOut ? 'Agotado' : 'Comprar'}
        </button>
      </div>

      {/* Purchase Modal Placeholder */}
      {showPurchaseModal && (
        <div className="ev-detail-modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="ev-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ev-detail-modal__header">
              <h3>Comprar entradas</h3>
              <button
                className="ev-detail-modal__close"
                onClick={() => setShowPurchaseModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="ev-detail-modal__body">
              <p>Componente de compra de entradas - próximamente disponible</p>
              {selectedTierId && (
                <p>Tier seleccionado: {selectedTierId}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
