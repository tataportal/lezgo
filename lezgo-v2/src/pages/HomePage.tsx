import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/events/EventCard';
import { formatDateES, formatDateVeryShort, formatPriceShort, getActivePhase, getEventBadges, getEventImage, toDate } from '../lib/helpers';
import { EventBadge } from '../components/events/EventBadge';
import './HomePage.css';

/** Strip unwanted badge text from event names/subtitles (comes from Firestore data) */
const cleanText = (s?: string) =>
  s ? s.replace(/\s*[—–-]\s*Early Supporter Badge/gi, '').trim() || undefined : undefined;

export default function HomePage() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { events, loading, error } = useEvents();
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const MARQUEE_ITEMS = [
    t.home.marquee.verifiedId,
    t.home.marquee.marketplace,
    t.home.marquee.noScams,
    t.home.marquee.idIsTicket,
    t.home.marquee.safeResale,
    t.home.marquee.scanEnter,
  ];

  const { featuredEvent, promoEvents, upcomingEvents, moreEvents, allListEvents } = useMemo(() => {
    if (!events || events.length === 0) {
      return { featuredEvent: null, promoEvents: [], upcomingEvents: [], moreEvents: [], allListEvents: [] };
    }

    // Hero: prioritize LEZGO event, then any featured, then first
    const featured =
      events.find((e) => e.name?.toLowerCase().includes('lezgo')) ||
      events.find((e) => e.featured) ||
      events[0];
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

    // Remaining events: sort by date, split into 4-event sections
    const rest = remaining.filter((e) => !promo.find((p) => p.id === e.id));
    const sortedRest = rest.slice().sort((a, b) => (a.date < b.date ? -1 : 1));
    const upcoming = sortedRest.slice(0, 4);
    const more = sortedRest.slice(4, 8);

    // All events sorted by date for list view (includes hero)
    const allSorted = events.slice().sort((a, b) => (a.date < b.date ? -1 : 1));

    return { featuredEvent: featured, promoEvents: promo, upcomingEvents: upcoming, moreEvents: more, allListEvents: allSorted };
  }, [events]);

  /* Filter events by search text */
  const filteredUpcoming = useMemo(() => {
    if (!searchText.trim()) return upcomingEvents;
    const q = searchText.toLowerCase();
    const all = [...(upcomingEvents || []), ...(moreEvents || [])];
    return all.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.genre?.toLowerCase().includes(q) ||
      e.lineup?.some((a: string) => a.toLowerCase().includes(q))
    );
  }, [searchText, upcomingEvents, moreEvents]);

  const handleNavigateEvent = (eventSlugOrId: string) => {
    navigate(`/evento/${eventSlugOrId}`);
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
      const section = document.getElementById('upcoming-events');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Log error for debugging but don't block render — show events if we have them
  if (error) console.error('[HomePage] Event fetch error:', error);

  if (error && events.length === 0) {
    return (
      <div className="home-error">
        <p>{t.home.errorLoading}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* ── Marquee — Ported from monolith ── */}
      <div className="home-marquee">
        <div className="home-marquee__track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="home-marquee__item">
              <span className="acid-smiley">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="10" r="1.5" fill="currentColor"/>
                  <circle cx="15.5" cy="10" r="1.5" fill="currentColor"/>
                  <path d="M7.5 15c0 0 2 4 4.5 4s4.5-4 4.5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                </svg>
              </span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero — Ported from monolith (with YouTube video support) ── */}
      {featuredEvent && (
        <section className="home-hero" id="home-hero">
          <HeroVideoWrap
            image={featuredEvent.image}
            genre={featuredEvent.genre}
            heroVideo={featuredEvent.heroVideo || 'UEzJ-Ckl7co'}
            heroVideoStart={28}
            heroVideoEnd={115}
          />
          <div className="home-hero__overlay" />

          <div className="home-hero__content">
            <div className="home-hero__badge">{t.home.featured}</div>

            <h1 className="home-hero__title">{cleanText(featuredEvent.name)}</h1>

            {(cleanText(featuredEvent.subtitle) || featuredEvent.description) && (
              <div className="home-hero__subtitle">
                {cleanText(featuredEvent.subtitle) || featuredEvent.description}
              </div>
            )}

            <div className="home-hero__meta">
              {formatDateES(toDate(featuredEvent.date), lang)}
              {featuredEvent.venue ? ` · ${featuredEvent.venue}` : ''}
              {featuredEvent.location ? `, ${featuredEvent.location}` : ''}
            </div>

            <div className="home-hero__actions">
              <button
                className="home-hero__cta"
                onClick={() => handleNavigateEvent(featuredEvent.slug || featuredEvent.id)}
              >
                {featuredEvent.status === 'sold-out' ? t.home.soldOutResale : t.home.viewTickets}
              </button>
              <div className="home-hero__sponsor">
                {featuredEvent.organizer && featuredEvent.organizer !== 'demo-user-001' ? (
                  <>{t.home.producedBy} <span>{featuredEvent.organizer}</span>{t.home.poweredBy}</>
                ) : (
                  <>{t.home.poweredBy.trim()}</>
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
            <div className="search-field-label">{t.home.location}</div>
            <div className="search-field-value">{t.home.locationDefault}</div>
          </div>
          <div className="search-field">
            <div className="search-field-label">{t.home.dates}</div>
            <div className="search-field-value">{t.home.allDates}</div>
          </div>
          <div className="search-field search-field--main">
            <div className="search-field-label">{t.home.search || t.common.search}</div>
            <input
              className="search-input"
              type="text"
              placeholder={t.home.searchPlaceholder}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <button className="search-btn" onClick={handleSearch}>{t.home.search || t.common.search}</button>
        </div>
      </div>

      {/* ── Content wrapper — matches monolith .content ── */}
      <div className="home-content">

        {/* ── Promo Cards — "No te los pierdas" ── */}
        {promoEvents.length > 0 && (
          <>
            <div className="section-head">
              <h2 className="section-title">{t.home.dontMiss}</h2>
            </div>
            <div className="home-promo__grid">
              {promoEvents.map((event) => {
                const price = getLowestPrice(event);
                const badges = getEventBadges(event);
                // Monolith format: "11 Marzo · venue, location — Desde S/ 0"
                const dateStr = formatDateVeryShort(toDate(event.date), t.home.monthsFull);
                const sub = dateStr
                  + (event.venue ? ` · ${event.venue}` : '')
                  + (event.location ? `, ${event.location}` : '')
                  + (price !== null ? ` — ${formatPriceShort(price)}` : '');
                return (
                  <div
                    key={event.id}
                    className="promo-card"
                    onClick={() => handleNavigateEvent(event.slug || event.id)}
                  >
                    <div
                      className="promo-card__image"
                      style={{
                        backgroundImage: `url(${getEventImage(event.id, event.image, event.genre)})`,
                      }}
                    />
                    <div className="promo-card__overlay" />

                    {badges.adjective && (
                      <EventBadge
                        label={t.common.badges[badges.adjective.labelKey]}
                        variant={badges.adjective.variant}
                        position="left"
                      />
                    )}
                    {badges.ticket && (
                      <EventBadge
                        label={t.common.badges[badges.ticket.labelKey]}
                        variant={badges.ticket.variant}
                        position="right"
                      />
                    )}

                    <div className="promo-card__body">
                      <span className="promo-card__tag">{event.genre || 'EVENTO'}</span>
                      <h3 className="promo-card__name">
                        {event.name}
                        {cleanText(event.subtitle) ? ` — ${cleanText(event.subtitle)}` : ''}
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
            {t.home.idBanner.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i === 0 && <br />}
              </span>
            ))}
          </p>
        </div>

        {/* ── Próximos eventos ── */}
        {upcomingEvents.length > 0 && (
          <>
            <div className="section-head" id="upcoming-events">
              <h2 className="section-title">{searchText.trim() ? t.home.searchResults.replace('{query}', searchText) : t.home.upcoming}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="view-toggle" id="ev-view-toggle">
                  <button
                    className={`view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title={t.home.grid}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
                  </button>
                  <button
                    className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title={t.home.byDate}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="3" rx="1"/><rect x="1" y="6.5" width="14" height="3" rx="1"/><rect x="1" y="12" width="14" height="3" rx="1"/></svg>
                  </button>
                </div>
                <span className="section-more">{t.common.viewAll}</span>
              </div>
            </div>

            {/* Grid view */}
            {viewMode === 'grid' && (
              <>
                {searchText.trim() && filteredUpcoming.length === 0 ? (
                  <div className="home-empty-search">
                    <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>🔍</span>
                    <p>{t.common.noSearchResults} &ldquo;{searchText}&rdquo;</p>
                  </div>
                ) : (
                  <div className={`events-grid${(searchText.trim() ? filteredUpcoming : upcomingEvents).length < 4 ? ' events-grid--centered' : ''}`}>
                    {(searchText.trim() ? filteredUpcoming : upcomingEvents).map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Date list view (RA-style) */}
            {viewMode === 'list' && (
              <DateListView events={allListEvents} onNavigate={handleNavigateEvent} getLowestPrice={getLowestPrice} t={t} />
            )}
          </>
        )}

        {/* ── Más en Lima — only visible in grid view ── */}
        {viewMode === 'grid' && moreEvents.length > 0 && (
          <>
            <div className="section-head">
              <h2 className="section-title">{t.home.moreInLima}</h2>
              <span className="section-more">{t.common.viewAll}</span>
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
          <p>{t.home.loadingEvents}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <div className="home-empty">
          <div className="home-content">
            <h2>{t.home.noEvents}</h2>
            <p>{t.home.noEventsDesc}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   HERO VIDEO WRAP — Ported from monolith
   Shows image first, lazy-loads YouTube iframe
   ═══════════════════════════════════════════ */

interface HeroVideoWrapProps {
  image?: string;
  genre?: string;
  heroVideo?: string;
  heroVideoStart?: number; // seconds — start playback here
  heroVideoEnd?: number; // seconds — loop back to start at this point
}

function HeroVideoWrap({ image, genre, heroVideo, heroVideoStart = 0, heroVideoEnd }: HeroVideoWrapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const { t } = useTranslation();
  const bgImg = getEventImage('', image, genre);

  useEffect(() => {
    if (!heroVideo || !wrapRef.current) return;

    // Lazy-load YouTube iframe after 2s (non-blocking, matches monolith)
    const timer = setTimeout(() => {
      if (!wrapRef.current) return;
      const iframe = document.createElement('iframe');
      iframe.id = 'hero-yt-iframe';
      const startParam = heroVideoStart ? '&start=' + heroVideoStart : '';
      const endParam = heroVideoEnd ? '&end=' + heroVideoEnd : '';
      iframe.src =
        'https://www.youtube.com/embed/' + heroVideo +
        '?autoplay=1&mute=1&loop=1&playlist=' + heroVideo +
        '&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&origin=' +
        encodeURIComponent(window.location.origin) + startParam + endParam;
      iframe.allow = 'autoplay; encrypted-media';
      iframe.allowFullscreen = true;
      iframe.style.opacity = '0';
      iframe.style.transition = 'opacity 1s ease';
      wrapRef.current.appendChild(iframe);
      iframeRef.current = iframe;
      iframe.onload = () => {
        iframe.style.opacity = '1';
        setVideoReady(true);
      };
    }, 2000);

    return () => clearTimeout(timer);
  }, [heroVideo, heroVideoStart, heroVideoEnd]);

  // When heroVideoEnd is set, poll current time and seekTo(0) at the end
  // YouTube's end param doesn't loop well, so we handle it manually
  useEffect(() => {
    if (!heroVideoEnd || !videoReady || !iframeRef.current) return;

    const iframe = iframeRef.current;
    const yt = 'https://www.youtube.com';

    // Listen for YouTube API messages (current time, state changes)
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== yt) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // When video state is ENDED (0), seek back to start
        if (data?.event === 'onStateChange' && data?.info === 0) {
          iframe.contentWindow?.postMessage(
            `{"event":"command","func":"seekTo","args":[${heroVideoStart}, true]}`, yt
          );
          iframe.contentWindow?.postMessage(
            '{"event":"command","func":"playVideo","args":""}', yt
          );
        }
      } catch { /* ignore non-JSON messages */ }
    };
    window.addEventListener('message', onMsg);

    // Also poll as a safety net — YouTube's onStateChange can be unreliable
    const poll = setInterval(() => {
      iframe.contentWindow?.postMessage(
        '{"event":"listening","id":1,"channel":"widget"}', yt
      );
    }, 2000);

    return () => {
      window.removeEventListener('message', onMsg);
      clearInterval(poll);
    };
  }, [heroVideoStart, heroVideoEnd, videoReady]);

  const toggleMute = () => {
    if (!iframeRef.current) return;
    const cmd = muted
      ? '{"event":"command","func":"unMute","args":""}'
      : '{"event":"command","func":"mute","args":""}';
    iframeRef.current.contentWindow?.postMessage(cmd, 'https://www.youtube.com');
    setMuted(!muted);
  };

  return (
    <div className="hero-video-wrap" ref={wrapRef}>
      <div
        className="hero-bg-img"
        style={{
          backgroundImage: `url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      />
      {heroVideo && videoReady && (
        <button className="hero-mute-btn" onClick={toggleMute} title={muted ? t.home.unmute : t.home.mute}>
          {muted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   DATE LIST VIEW — RA-style calendar list
   Ported from monolith renderDateList()
   ═══════════════════════════════════════════ */

interface DateListViewProps {
  events: any[];
  onNavigate: (id: string) => void;
  getLowestPrice: (event: any) => number | null;
  t: any;
}

function DateListView({ events, onNavigate, getLowestPrice, t }: DateListViewProps) {
  // Group events by date
  const groups = useMemo(() => {
    const map: Record<string, any[]> = {};
    events.forEach((ev) => {
      const d = toDate(ev.date);
      const key = d instanceof Date && !isNaN(d.getTime())
        ? d.toISOString().substring(0, 10)
        : 'sin-fecha';
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return Object.keys(map).sort().map((key) => ({ dateKey: key, events: map[key] }));
  }, [events]);

  return (
    <div className="events-datelist active">
      {groups.map(({ dateKey, events: groupEvents }) => {
        const d = new Date(dateKey + 'T12:00:00');
        const dayNum = d.getDate();
        const weekday = t.home.days[d.getDay()];
        const month = t.home.months[d.getMonth()];

        return (
          <div key={dateKey} className="dl-date-group">
            <div className="dl-date-header">
              <div className="dl-date-slash" />
              <div className="dl-date-label">{weekday}, {dayNum} {month}</div>
            </div>
            {groupEvents.map((ev) => {
              const venueLine = (ev.venue || '') + (ev.location ? `, ${ev.location}` : '');
              const price = getLowestPrice(ev);
              const isSold = ev.status === 'sold-out';

              return (
                <div key={ev.id} className="dl-event-row" onClick={() => onNavigate(ev.slug || ev.id)}>
                  <div
                    className="dl-event-img"
                    style={{
                      backgroundImage: `url(${getEventImage(ev.id, ev.image, ev.genre)})`,
                    }}
                  />
                  <div className="dl-event-info">
                    {cleanText(ev.subtitle) && (
                      <div className="dl-event-subtitle">{cleanText(ev.subtitle)}</div>
                    )}
                    <div className="dl-event-name">{ev.name}</div>
                    <div className="dl-event-venue">
                      <svg width="16" height="16" className="dl-event-venue-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      {venueLine}
                    </div>
                    {ev.tags && ev.tags.length > 0 && (
                      <div className="dl-event-tags">
                        {ev.tags.slice(0, 3).map((t: string, i: number) => (
                          <span key={i} className="dl-event-tag">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="dl-event-right">
                    {isSold ? (
                      <>
                        <div className="dl-event-sold">{t.common.soldOut}</div>
                        <div className="dl-event-sold-link">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                            <line x1="7" y1="7" x2="7.01" y2="7"/>
                          </svg>
                          {t.home.resale}
                        </div>
                      </>
                    ) : price !== null ? (
                      <>
                        {price > 0 && <div className="dl-event-price-label">{t.common.from}</div>}
                        <div className="dl-event-price">{formatPriceShort(price)}</div>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
