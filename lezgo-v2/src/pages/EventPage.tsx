import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventById } from '../hooks/useEvents';
import { formatPrice, getActivePhase, getEventImage, LOCALE_MAP, toDate } from '../lib/helpers';
import { PurchaseModal } from '../components/checkout/PurchaseModal';
import { useTranslation } from '../i18n';
import './EventPage.css';

/* ── Helpers ── */
const prettify = (s: string) =>
  s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// defaultProhibited is now fetched from translations via useTranslation()

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { event, loading, error } = useEventById(eventId || '');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const { t, lang } = useTranslation();

  const handleBuyTickets = () => setShowPurchaseModal(true);

  if (error) {
    console.error('[EventPage] Error loading event:', error, 'slug/id:', eventId);
    return (
      <div className="ev-detail-error">
        <p>{t.common.error}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    );
  }

  if (loading || !event) {
    return (
      <div className="ev-detail-loading">
        <div className="loading-spinner" />
        <p>{t.event.loadingEvent}</p>
      </div>
    );
  }

  const isSoldOut = event.status === 'sold-out';
  const vs = event.visibleSections || {};
  const meta = event.meta || {};
  const evTags: string[] = Array.isArray(event.tags) ? event.tags : [];
  const imgUrl = getEventImage(event.id, event.image, event.genre);

  // Date
  const dateObj = toDate(event.date);
  const dateLabel =
    dateObj instanceof Date && !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString(LOCALE_MAP[lang] || LOCALE_MAP.es, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : '';

  // Location
  let venueLabel = event.venue || '';
  if (event.location) venueLabel += ', ' + event.location;

  // Time
  const timeLabel = (event.timeStart || '22:00') + ' — ' + (event.timeEnd || '05:00');

  // Info chips
  const genreKeywords = [
    'techno','dark-techno','hard-techno','melodic-techno','house','deep-house',
    'minimal','dnb','ambient','electronica','breaks','acid','progressive','tech-house','trance',
  ];
  const genreTags = evTags.filter((t) => genreKeywords.includes(t));
  const ageTags = evTags.filter((t) => ['18+', '21+', 'all-ages'].includes(t));
  const settingTags = evTags.filter((t) => ['indoor', 'outdoor', 'open-air', 'mixed'].includes(t));

  const infoChips: { icon: string; text: string }[] = [];
  if (genreTags.length > 0) infoChips.push({ icon: '🎵', text: genreTags.map(prettify).join(' / ') });
  if (ageTags.length > 0) infoChips.push({ icon: '🪪', text: ageTags[0] });
  if (settingTags.length > 0) infoChips.push({ icon: '🏛️', text: prettify(settingTags[0]) });
  if (meta.alcohol) infoChips.push({ icon: '🍸', text: t.event.barAvailable });
  if (meta.multiStage) infoChips.push({ icon: '🔊', text: t.event.multiRoom });
  if (!meta.reentry) infoChips.push({ icon: '🚫', text: t.event.noReentry });

  // Also add from legacy chip fields
  if (event.genre && infoChips.length === 0) infoChips.push({ icon: '🎵', text: event.genre });
  if (meta.ageRestriction && ageTags.length === 0) infoChips.push({ icon: '🪪', text: meta.ageRestriction });
  if (meta.crowdSize) infoChips.push({ icon: '👥', text: `${t.event.capacity} ${meta.crowdSize.toLocaleString()}` });
  if (meta.outdoor !== undefined && settingTags.length === 0)
    infoChips.push({ icon: '🏛️', text: meta.outdoor ? t.event.outdoorLabel : t.event.indoorLabel });

  const showInfo = vs.tags !== false && infoChips.length > 0;
  const prohibitedItems: string[] = event.prohibitedItems || t.event.defaultProhibited;

  const hasLineup = Array.isArray(event.lineup) && event.lineup.length > 0 && vs.lineup !== false;
  const showAbout = vs.about !== false && (event.description || event.descriptionLong);
  const showVenue = vs.venue !== false && event.venue;

  // Lowest price for sticky CTA
  const lowestPrice = (event.tiers || []).reduce((min: number | null, tier: any) => {
    const phase = getActivePhase(tier);
    if (!phase) return min;
    return min === null || phase.price < min ? phase.price : min;
  }, null as number | null);

  // Venue chips
  const venueChips: string[] = [];
  const setting = evTags.find((tag) => ['indoor', 'outdoor', 'open-air', 'mixed'].includes(tag));
  if (setting) venueChips.push(prettify(setting));
  if (meta.crowdSize) venueChips.push(`${t.event.capacityLabel} ${meta.crowdSize.toLocaleString()}`);
  if (meta.multiStage) venueChips.push(t.event.multiStage);
  venueChips.push(t.event.gateVerification);

  const mapsUrl =
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent((event.venue || '') + ' ' + (event.location || ''));

  return (
    <div className="ev-detail">
      {/* ═══ HERO ═══ */}
      <section className="ev-hero">
        <div className="ev-hero-bg" style={{ backgroundImage: `url(${imgUrl})` }} />
        <div className="ev-hero-content">
          <a className="ev-hero-back" onClick={() => navigate(-1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t.event.backToEvents}
          </a>
          <h1 className="ev-hero-title">{event.name}</h1>
          {event.subtitle && <div className="ev-hero-sub">{event.subtitle}</div>}
          {event.description && <p className="ev-hero-desc">{event.description}</p>}

          <div className="ev-hero-meta">
            <div className="ev-hero-meta-item">
              <div className="icon">📅</div>
              <div>{dateLabel}</div>
            </div>
            <a
              className="ev-hero-meta-item"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit' }}
            >
              <div className="icon">📍</div>
              <div>{venueLabel}</div>
            </a>
            <div className="ev-hero-meta-item">
              <div className="icon">🕐</div>
              <div>{timeLabel}</div>
            </div>
          </div>

          <div className="ev-hero-ctas">
            {isSoldOut ? (
              <button className="ev-btn ev-btn-sold" onClick={() => navigate('/reventa')}>
                {t.event.soldOutResale}
              </button>
            ) : (
              <button className="ev-btn ev-btn-primary" onClick={handleBuyTickets}>
                {lowestPrice === 0 ? t.event.reserveTickets : t.event.buyTickets}
              </button>
            )}
            <button className="ev-btn ev-btn-outline">{t.event.addCalendar}</button>
          </div>
        </div>
      </section>

      {/* ═══ TICKETS ═══ */}
      <div className="ev-divider" />
      <section className="ev-section">
        <div className="ev-section-label">{t.event.tickets}</div>
        <h2 className="ev-section-heading">
          {t.event.chooseExperience} <em>{t.event.experience}</em>
        </h2>
        <div className="ev-tk-grid-wrap">
          <div className="ev-tk-grid">
            {(event.tiers || []).map((tier, idx) => {
              const activePhase = getActivePhase(tier);
              const remaining = Math.max(0, tier.capacity - tier.sold);
              const isTierSold = remaining === 0;
              const tierClass = `ev-tk-tier-${Math.min(idx + 1, 4)}`;
              const cardClass = isTierSold
                ? 'ev-tk-card ev-tk-card--sold'
                : 'ev-tk-card ev-tk-card--avail';

              return (
                <div key={tier.id} className={cardClass} onClick={() => !isTierSold && handleBuyTickets()}>
                  <div className={`ev-tk-inner ${isTierSold ? 'ev-tk-sold' : tierClass}`}>
                    <div className="ev-tk-header">
                      <div className="ev-tk-name">{tier.name}</div>
                    </div>

                    {tier.includes && tier.includes.length > 0 && (
                      <ul className="ev-tk-includes">
                        {tier.includes.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    )}

                    {/* Phase pricing */}
                    <div className="ev-tk-phases">
                      {(tier.phases || []).map((phase: any, pi: number) => {
                        const isActive = phase.active;
                        const isPast = !phase.active && pi < (tier.phases || []).findIndex((p: any) => p.active);
                        const cls = isActive
                          ? 'ev-tk-phase ev-tk-phase--active'
                          : isPast
                          ? 'ev-tk-phase ev-tk-phase--past'
                          : 'ev-tk-phase ev-tk-phase--future';
                        return (
                          <div key={pi} className={cls}>
                            <div className="ev-tk-phase-left">
                              <div className="ev-tk-phase-dot" />
                              <span className="ev-tk-phase-name">{phase.name}</span>
                            </div>
                            <span className="ev-tk-phase-price">{formatPrice(phase.price)}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Simple price if no phases */}
                    {(!tier.phases || tier.phases.length === 0) && activePhase && (
                      <div className="ev-tk-price-simple">{formatPrice(activePhase.price)}</div>
                    )}

                    <div className="ev-tk-bottom">
                      {isTierSold ? (
                        <div className="ev-tk-sold-all">{t.event.soldOutTag}</div>
                      ) : (
                        <button className="ev-tk-buy" onClick={(e) => { e.stopPropagation(); handleBuyTickets(); }}>
                          {(activePhase?.price || 0) === 0 ? t.event.reserve : t.event.buy}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="ev-tk-overlay">
                    <div className="ev-tk-overlay-icon">{isTierSold ? '🔄' : '🎫'}</div>
                    <div className="ev-tk-overlay-text">
                      {isTierSold ? t.event.searchResale : ((activePhase?.price || 0) === 0 ? t.event.reserveTickets : t.event.buyTickets)}
                    </div>
                    <div className="ev-tk-overlay-hint">
                      {isTierSold ? t.event.verifiedFans : `${remaining} ${t.event.available}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Marketplace banner — visible when sold out */}
        {isSoldOut && (
          <div className="ev-mp-banner">
            <div className="ev-mp-info">
              <div className="ev-mp-title">{t.event.resaleBannerTitle}</div>
              <div className="ev-mp-desc">
                {t.event.resaleBannerDesc}
              </div>
            </div>
            <div className="ev-mp-action">
              <button className="ev-btn ev-btn-primary" onClick={() => navigate('/reventa')}>
                {t.event.resaleBannerBtn}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ═══ LINEUP ═══ */}
      {hasLineup && (
        <>
          <div className="ev-divider" />
          <section className="ev-section">
            <div className="ev-section-label">{t.event.lineup}</div>
            <h2 className="ev-section-heading">
              {t.event.confirmedArtists} <em>{t.event.confirmed}</em>
            </h2>
            <div className="ev-lineup-grid">
              {(event.lineup || []).map((artist: string, idx: number) => (
                <div key={idx} className={`ev-lineup-card${idx === 0 ? ' ev-lineup-card--hl' : ''}`}>
                  <div
                    className="ev-lineup-card-img"
                    style={{
                      backgroundImage: `url(https://picsum.photos/seed/${encodeURIComponent(artist)}/400/500)`,
                    }}
                  />
                  <div className="ev-lineup-card-overlay" />
                  <div className="ev-lineup-card-content">
                    <div className="ev-lineup-name">{artist}</div>
                  </div>
                  {idx === 0 && <div className="ev-lineup-badge">{t.event.headliner}</div>}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ═══ INFO ═══ */}
      {showInfo && (
        <>
          <div className="ev-divider" />
          <section className="ev-section">
            <div className="ev-section-label">{t.event.eventInfo}</div>
            <h2 className="ev-section-heading">
              {t.event.needToKnow} <em>{t.event.needToKnowEm}</em>
            </h2>
            <div className="ev-info-box">
              <div>
                <div className="ev-info-group-title">{t.event.details}</div>
                <div className="ev-info-list">
                  {infoChips.map((chip, i) => (
                    <div key={i} className="ev-info-chip">
                      <span>{chip.icon}</span> {chip.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ev-info-divider" />
              <div>
                <div className="ev-info-group-title">{t.event.notAllowed}</div>
                <div className="ev-info-prohibited-items">
                  {prohibitedItems.map((item, i) => (
                    <div key={i} className="ev-info-prohibited-tag">
                      🚫 {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ═══ ABOUT ═══ */}
      {showAbout && (
        <>
          <div className="ev-divider" />
          <section className="ev-section" style={{ textAlign: 'center' }}>
            <div className="ev-section-label">{t.event.aboutEvent}</div>
            <h2 className="ev-section-heading">{event.name}</h2>
            {event.description && <p className="ev-about-text">{event.description}</p>}
            {event.descriptionLong && <p className="ev-about-text">{event.descriptionLong}</p>}
          </section>
        </>
      )}

      {/* ═══ VENUE ═══ */}
      {showVenue && (
        <>
          <div className="ev-divider" />
          <section className="ev-section">
            <div className="ev-venue-block">
              <div className="ev-venue-info">
                <div className="ev-section-label" style={{ textAlign: 'left' }}>
                  {t.event.venue}
                </div>
                <div className="ev-venue-name">{event.venue}</div>
                <div className="ev-venue-addr">
                  {event.address || ''}
                  {event.location ? (event.address ? ', ' : '') + event.location : ''}
                </div>
                <div className="ev-venue-chips">
                  {venueChips.map((chip, i) => (
                    <div key={i} className="ev-venue-chip">
                      {chip}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ev-venue-map">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="ev-venue-map-link">
                  <div style={{ fontSize: 'var(--fs-3xl)' }}>📍</div>
                  <div style={{ color: 'var(--text)', fontSize: 'var(--fs-base)', fontWeight: 700 }}>
                    {t.event.viewOnMaps}
                  </div>
                  <div style={{ color: 'var(--text-mid)', fontSize: 'var(--fs-sm)' }}>
                    {event.venue}
                    {event.location ? ', ' + event.location : ''}
                  </div>
                </a>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ═══ TRUST ═══ */}
      <div className="ev-divider" />
      <section className="ev-section">
        <div className="ev-trust-row">
          <div className="ev-trust-item">
            <div className="ev-trust-icon">✅</div>
            <div className="ev-trust-text">
              {t.event.trustLinkedDni.split('\n').map((line: string, idx: number) => (
                <span key={idx}>
                  {line}
                  {idx < t.event.trustLinkedDni.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
          <div className="ev-trust-item">
            <div className="ev-trust-icon">🔄</div>
            <div className="ev-trust-text">
              {t.event.trustSafeResale.split('\n').map((line: string, idx: number) => (
                <span key={idx}>
                  {line}
                  {idx < t.event.trustSafeResale.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
          <div className="ev-trust-item">
            <div className="ev-trust-icon">🪪</div>
            <div className="ev-trust-text">
              {t.event.trustGateVerify.split('\n').map((line: string, idx: number) => (
                <span key={idx}>
                  {line}
                  {idx < t.event.trustGateVerify.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
          <div className="ev-trust-item">
            <div className="ev-trust-icon">💬</div>
            <div className="ev-trust-text">
              {t.event.trustSupport.split('\n').map((line: string, idx: number) => (
                <span key={idx}>
                  {line}
                  {idx < t.event.trustSupport.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STICKY MOBILE CTA ═══ */}
      {!isSoldOut && (
        <div className="ev-sticky-cta">
          <div className="ev-sticky-cta-content">
            <div className="ev-sticky-cta-price">
              {lowestPrice !== null
                ? lowestPrice === 0
                  ? t.common.free
                  : `${t.common.from} ${formatPrice(lowestPrice)}`
                : ''}
            </div>
            <button className="ev-sticky-cta-btn" onClick={handleBuyTickets}>
              {lowestPrice === 0 ? t.event.reserveTickets : t.event.buyTickets}
            </button>
          </div>
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <div className="ev-footer">
        <div className="ev-footer-logo">L E Z G O</div>
        <div className="ev-footer-copy">{t.footer.tagline}</div>
      </div>

      {/* Purchase Modal */}
      <PurchaseModal event={event} open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)} />
    </div>
  );
}
