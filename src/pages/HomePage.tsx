import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/events/EventCard';
import {
  formatDateES,
  formatDateVeryShort,
  formatPriceShort,
  getActivePhase,
  getEventBadges,
  getEventImage,
  toDate,
} from '../lib/helpers';
import { EventBadge } from '../components/events/EventBadge';
import './HomePage.css';

const cleanText = (s?: string) =>
  s
    ? s
        .replace(/\s*[—–-]\s*Early Supporter Badge/gi, '')
        .replace(/^\[DEMO\]\s*/i, '')
        .trim() || undefined
    : undefined;

const VISITED_KEY = 'lezgo_visited';

export default function HomePage() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const { events, loading, error } = useEvents({ status: 'published' });
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(VISITED_KEY)) {
        setIsReturningVisitor(true);
      } else {
        localStorage.setItem(VISITED_KEY, '1');
      }
    } catch {
      /* localStorage blocked */
    }
  }, []);

  const MARQUEE_ITEMS = [
    t.home.marquee.verifiedId,
    t.home.marquee.marketplace,
    t.home.marquee.noScams,
    t.home.marquee.idIsTicket,
    t.home.marquee.safeResale,
    t.home.marquee.scanEnter,
  ];

  const { featuredEvent, promoEvents, previewEvents } = useMemo(() => {
    if (!events || events.length === 0) {
      return { featuredEvent: null, promoEvents: [], previewEvents: [] };
    }

    const featured =
      events.find((e) => e.name?.toLowerCase().includes('lezgo')) ||
      events.find((e) => e.featured) ||
      events[0];
    const remaining = events.filter((e) => e.id !== featured.id);

    const sorted = remaining.slice().sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.status === 'sold-out' && b.status !== 'sold-out') return -1;
      if (a.status !== 'sold-out' && b.status === 'sold-out') return 1;
      return a.date < b.date ? -1 : 1;
    });

    const promo = sorted.slice(0, 2);
    const preview = sorted.slice(2, 6);

    return { featuredEvent: featured, promoEvents: promo, previewEvents: preview };
  }, [events]);

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

  const handleNavigateEvent = (eventSlugOrId: string) => {
    navigate(`/evento/${eventSlugOrId}`);
  };

  if (error) console.error('[HomePage] Event fetch error:', error);

  if (error && events.length === 0) {
    return (
      <div className="home-error">
        <p>{t.home.errorLoading}</p>
        <button onClick={() => window.location.reload()} className="home-error__btn">
          Reintentar
        </button>
      </div>
    );
  }

  const eventsForPreview = [...promoEvents, ...previewEvents].slice(0, 4);
  const hasEvents = events.length > 0;

  return (
    <div className="home-page">
      {/* ── Marquee ── */}
      <div className="home-marquee">
        <div className="home-marquee__track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="home-marquee__item">
              <span className="acid-smiley">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
                  <circle cx="15.5" cy="10" r="1.5" fill="currentColor" />
                  <path
                    d="M7.5 15c0 0 2 4 4.5 4s4.5-4 4.5-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ── */}
      {featuredEvent ? (
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
                  <>
                    {t.home.producedBy} <span>{featuredEvent.organizer}</span>
                    {t.home.poweredBy}
                  </>
                ) : (
                  <>{t.home.poweredBy.trim()}</>
                )}
                <span>LEZGO ☺</span>
              </div>
            </div>
          </div>
        </section>
      ) : (
        !loading && (
          <section className="home-editorial-hero">
            <div className="home-editorial-hero__content">
              <h1 className="home-editorial-hero__h1">{t.home.editorialH1}</h1>
              <p className="home-editorial-hero__sub">{t.home.editorialSub}</p>
              <Link to="/eventos" className="home-editorial-hero__cta">
                {t.home.viewTickets}
              </Link>
            </div>
          </section>
        )
      )}

      <div className="home-content">
        {/* ── Returning visitors: events first ── */}
        {isReturningVisitor && hasEvents && (
          <EventsPreviewSection events={eventsForPreview} t={t} />
        )}

        {/* ── Promo Cards ── */}
        {promoEvents.length > 0 && (
          <>
            <div className="section-head">
              <h2 className="section-title">{t.home.dontMiss}</h2>
            </div>
            <div className="home-promo__grid">
              {promoEvents.map((event) => {
                const price = getLowestPrice(event);
                const badges = getEventBadges(event);
                const dateStr = formatDateVeryShort(toDate(event.date), t.home.monthsFull);
                const sub =
                  dateStr +
                  (event.venue ? ` · ${event.venue}` : '') +
                  (event.location ? `, ${event.location}` : '') +
                  (price !== null ? ` — ${formatPriceShort(price)}` : '');
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
                        {cleanText(event.name)}
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

        {/* ── ID Banner ── */}
        <div className="id-banner">
          <div className="id-banner__copy">
            <div className="id-banner__icon">☺</div>
            <p>
              {t.home.idBanner.split('\n').map((line: string, i: number) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* ── How it works ── */}
        <HowItWorksSection t={t} />

        {/* ── Events preview (new visitors) ── */}
        {!isReturningVisitor && hasEvents && (
          <EventsPreviewSection events={eventsForPreview} t={t} />
        )}

        {/* ── FAQ preview ── */}
        <FAQPreviewSection t={t} />

        {/* ── Resale CTA ── */}
        <div className="home-resale-cta">
          <div className="home-resale-cta__inner">
            <span className="home-resale-cta__label">{t.home.resaleCtaLabel}</span>
            <Link to="/reventa" className="home-resale-cta__link">
              {t.home.resaleCtaBtn}
            </Link>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && events.length === 0 && (
          <div className="home-loading">
            <div className="loading-spinner" />
            <p>{t.home.loadingEvents}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════ */
function HowItWorksSection({ t }: { t: any }) {
  const steps = [
    { num: '01', title: t.home.hiw.step1Title, desc: t.home.hiw.step1Desc },
    { num: '02', title: t.home.hiw.step2Title, desc: t.home.hiw.step2Desc },
    { num: '03', title: t.home.hiw.step3Title, desc: t.home.hiw.step3Desc },
  ];
  return (
    <section className="home-hiw">
      <div className="section-head">
        <h2 className="section-title">{t.home.hiw.title}</h2>
        <Link to="/como-funciona" className="section-more">
          {t.home.hiw.learnMore}
        </Link>
      </div>
      <div className="home-hiw__steps">
        {steps.map((s) => (
          <div key={s.num} className="home-hiw__step">
            <div className="home-hiw__step-num">{s.num}</div>
            <div className="home-hiw__step-title">{s.title}</div>
            <div className="home-hiw__step-desc">{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   EVENTS PREVIEW
   ═══════════════════════════════════════════ */
function EventsPreviewSection({ events, t }: { events: any[]; t: any }) {
  if (events.length === 0) return null;
  return (
    <section className="home-events-preview" id="upcoming-events">
      <div className="section-head">
        <h2 className="section-title">{t.home.upcoming}</h2>
        <Link to="/eventos" className="section-more">
          {t.common.viewAll}
        </Link>
      </div>
      <div className={`events-grid${events.length < 4 ? ' events-grid--centered' : ''}`}>
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FAQ PREVIEW
   ═══════════════════════════════════════════ */
function FAQPreviewSection({ t }: { t: any }) {
  const faqs: Array<{ q: string; a: string }> = t.home.faqPreview;
  return (
    <section className="home-faq-preview">
      <div className="section-head">
        <h2 className="section-title">{t.home.faqTitle}</h2>
        <Link to="/faq" className="section-more">
          {t.home.faqMore}
        </Link>
      </div>
      <div className="home-faq__list">
        {faqs.map((item, i) => (
          <div key={i} className="home-faq__item">
            <div className="home-faq__q">{item.q}</div>
            <div className="home-faq__a">{item.a}</div>
          </div>
        ))}
      </div>
    </section>
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
  heroVideoStart?: number;
  heroVideoEnd?: number;
}

function HeroVideoWrap({
  image,
  genre,
  heroVideo,
  heroVideoStart = 0,
  heroVideoEnd,
}: HeroVideoWrapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const { t } = useTranslation();
  const bgImg = getEventImage('', image, genre);

  useEffect(() => {
    if (!heroVideo || !wrapRef.current) return;
    const timer = setTimeout(() => {
      if (!wrapRef.current) return;
      const iframe = document.createElement('iframe');
      iframe.id = 'hero-yt-iframe';
      const startParam = heroVideoStart ? '&start=' + heroVideoStart : '';
      const endParam = heroVideoEnd ? '&end=' + heroVideoEnd : '';
      iframe.src =
        'https://www.youtube.com/embed/' +
        heroVideo +
        '?autoplay=1&mute=1&loop=1&playlist=' +
        heroVideo +
        '&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&origin=' +
        encodeURIComponent(window.location.origin) +
        startParam +
        endParam;
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

  useEffect(() => {
    if (!heroVideoEnd || !videoReady || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const yt = 'https://www.youtube.com';
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== yt) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.event === 'onStateChange' && data?.info === 0) {
          iframe.contentWindow?.postMessage(
            `{"event":"command","func":"seekTo","args":[${heroVideoStart}, true]}`,
            yt
          );
          iframe.contentWindow?.postMessage(
            '{"event":"command","func":"playVideo","args":""}',
            yt
          );
        }
      } catch {
        /* ignore non-JSON */
      }
    };
    window.addEventListener('message', onMsg);
    const poll = setInterval(() => {
      iframe.contentWindow?.postMessage(
        '{"event":"listening","id":1,"channel":"widget"}',
        yt
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
        <button
          className="hero-mute-btn"
          onClick={toggleMute}
          title={muted ? t.home.unmute : t.home.mute}
        >
          {muted ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
