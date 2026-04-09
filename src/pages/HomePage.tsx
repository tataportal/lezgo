import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/events/EventCard';
import './HomePage.css';

const VISITED_KEY = 'lezgo_visited';

export default function HomePage() {
  const { t } = useTranslation();
  const { events, loading } = useEvents({ status: 'published' });
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(VISITED_KEY)) {
        setIsReturningVisitor(true);
      } else {
        localStorage.setItem(VISITED_KEY, '1');
      }
    } catch { /* blocked */ }
  }, []);

  const MARQUEE_ITEMS = [
    t.home.marquee.verifiedId,
    t.home.marquee.marketplace,
    t.home.marquee.noScams,
    t.home.marquee.idIsTicket,
    t.home.marquee.safeResale,
    t.home.marquee.scanEnter,
  ];

  const previewEvents = useMemo(() => {
    if (!events || events.length === 0) return [];
    return events.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, 4);
  }, [events]);

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
                  <path d="M7.5 15c0 0 2 4 4.5 4s4.5-4 4.5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </svg>
              </span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ 1. HERO ═══ */}
      <section className="hh-hero">
        <HeroVideoBg videoId="UEzJ-Ckl7co" start={28} end={115} fallbackImg="/hero-bg.jpg" />
        <div className="hh-hero__overlay" />
        <div className="hh-hero__grain" />

        <div className="hh-hero__content">
          <div className="hh-hero__eyebrow">
            <span className="hh-hero__dot" /> {t.home.heroEyebrow}
          </div>
          <h1 className="hh-hero__h1">
            {t.home.editorialH1.split('. ').map((part, i, arr) => (
              <span key={i} className={i === 1 ? 'hh-hero__h1-accent' : ''}>
                {part}{i < arr.length - 1 ? '.' : ''}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="hh-hero__sub">{t.home.editorialSub}</p>
          <div className="hh-hero__actions">
            <Link to="/eventos" className="btn-primary">
              {t.home.heroCta}
            </Link>
            <Link to="/como-funciona" className="btn-ghost">
              {t.home.hiw.learnMore}
            </Link>
          </div>

          <div className="hh-hero__stats">
            <div className="hh-hero__stat">
              <div className="hh-hero__stat-num">100%</div>
              <div className="hh-hero__stat-label">{t.home.statVerified}</div>
            </div>
            <div className="hh-hero__stat">
              <div className="hh-hero__stat-num">0</div>
              <div className="hh-hero__stat-label">{t.home.statFakes}</div>
            </div>
            <div className="hh-hero__stat">
              <div className="hh-hero__stat-num">{'<'}24h</div>
              <div className="hh-hero__stat-label">{t.home.statSupport}</div>
            </div>
          </div>
        </div>

        <div className="hh-hero__scroll">
          <span>SCROLL</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12m0 0l-5-5m5 5l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      <div className="home-content">

        {/* Returning visitor: events first */}
        {isReturningVisitor && previewEvents.length > 0 && (
          <EventsPreviewSection events={previewEvents} t={t} />
        )}

        {/* ═══ 2. HOW IT WORKS ═══ */}
        <section className="hh-hiw">
          <div className="hh-section-head">
            <div className="hh-section-tag">/ 02</div>
            <h2 className="hh-section-h2">{t.home.hiw.title}</h2>
            <Link to="/como-funciona" className="hh-section-more">{t.home.hiw.learnMore}</Link>
          </div>
          <div className="hh-hiw__steps">
            {[
              { num: '01', title: t.home.hiw.step1Title, desc: t.home.hiw.step1Desc, icon: 'id' },
              { num: '02', title: t.home.hiw.step2Title, desc: t.home.hiw.step2Desc, icon: 'ticket' },
              { num: '03', title: t.home.hiw.step3Title, desc: t.home.hiw.step3Desc, icon: 'scan' },
            ].map((s) => (
              <div key={s.num} className="hh-hiw__step">
                <div className="hh-hiw__step-num">{s.num}</div>
                <div className="hh-hiw__step-icon">
                  {s.icon === 'id' && (
                    <svg viewBox="0 0 64 64" fill="none">
                      <rect x="6" y="14" width="52" height="36" rx="3" stroke="currentColor" strokeWidth="2.5"/>
                      <circle cx="20" cy="30" r="5" stroke="currentColor" strokeWidth="2.5"/>
                      <path d="M12 44c2-4 6-6 8-6s6 2 8 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="34" y1="26" x2="52" y2="26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="34" y1="34" x2="48" y2="34" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="34" y1="42" x2="44" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  )}
                  {s.icon === 'ticket' && (
                    <svg viewBox="0 0 64 64" fill="none">
                      <path d="M6 22a4 4 0 014-4h44a4 4 0 014 4v6a4 4 0 100 8v6a4 4 0 01-4 4H10a4 4 0 01-4-4v-6a4 4 0 100-8v-6z" stroke="currentColor" strokeWidth="2.5"/>
                      <line x1="32" y1="18" x2="32" y2="46" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3"/>
                    </svg>
                  )}
                  {s.icon === 'scan' && (
                    <svg viewBox="0 0 64 64" fill="none">
                      <path d="M10 18V12a2 2 0 012-2h6M54 18V12a2 2 0 00-2-2h-6M10 46v6a2 2 0 002 2h6M54 46v6a2 2 0 01-2 2h-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      <line x1="6" y1="32" x2="58" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      <rect x="20" y="22" width="24" height="20" rx="2" stroke="currentColor" strokeWidth="2.5"/>
                    </svg>
                  )}
                </div>
                <h3 className="hh-hiw__step-title">{s.title}</h3>
                <p className="hh-hiw__step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 3. WHY LEZGO ═══ */}
        <section className="hh-why">
          <div className="hh-section-head">
            <div className="hh-section-tag">/ 03</div>
            <h2 className="hh-section-h2">{t.home.whyTitle}</h2>
          </div>
          <div className="hh-why__grid">
            {(t.home.why as Array<{ icon: string; title: string; desc: string }>).map((r, i) => (
              <div key={i} className="hh-why__item">
                <div className="hh-why__num">0{i + 1}</div>
                <div className="hh-why__title">{r.title}</div>
                <div className="hh-why__desc">{r.desc}</div>
                <div className="hh-why__arrow">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 15L15 5M15 5H7M15 5v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 4. FAQ PREVIEW ═══ */}
        <section className="hh-faq">
          <div className="hh-section-head">
            <div className="hh-section-tag">/ 04</div>
            <h2 className="hh-section-h2">{t.home.faqTitle}</h2>
            <Link to="/faq" className="hh-section-more">{t.home.faqMore}</Link>
          </div>
          <div className="hh-faq__list">
            {(t.home.faqPreview as Array<{ q: string; a: string }>).map((item, i) => {
              const open = openFaq === i;
              return (
                <button
                  key={i}
                  className={`hh-faq__item${open ? ' is-open' : ''}`}
                  onClick={() => setOpenFaq(open ? null : i)}
                >
                  <div className="hh-faq__row">
                    <span className="hh-faq__num">0{i + 1}</span>
                    <span className="hh-faq__q">{item.q}</span>
                    <span className="hh-faq__toggle">{open ? '−' : '+'}</span>
                  </div>
                  {open && <div className="hh-faq__a">{item.a}</div>}
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══ 5. UPCOMING EVENTS ═══ */}
        {!isReturningVisitor && (
          loading && events.length === 0 ? (
            <div className="home-loading">
              <div className="loading-spinner" />
              <p>{t.home.loadingEvents}</p>
            </div>
          ) : previewEvents.length > 0 ? (
            <EventsPreviewSection events={previewEvents} t={t} />
          ) : null
        )}

        {/* ═══ 6. FINAL CTA ═══ */}
        <section className="hh-final">
          <div className="hh-final__bg" />
          <div className="hh-final__content">
            <div className="hh-final__eyebrow">{t.home.resaleCtaLabel}</div>
            <h2 className="hh-final__h2">
              {t.home.finalCtaLine1}<br />{t.home.finalCtaLine2}
            </h2>
            <div className="hh-final__actions">
              <Link to="/reventa" className="btn-primary">{t.home.resaleCtaBtn}</Link>
              <Link to="/eventos" className="btn-ghost-dark">{t.home.heroCta}</Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

/* ── EVENTS PREVIEW ── */
function EventsPreviewSection({ events }: { events: any[]; t: any }) {
  return (
    <section className="hh-events" id="upcoming-events">
      <div className={`events-grid${events.length < 4 ? ' events-grid--centered' : ''}`}>
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

/* ── HERO VIDEO BG (lazy-loaded YouTube) ── */
function HeroVideoBg({ videoId, start = 0, end, fallbackImg }: { videoId: string; start?: number; end?: number; fallbackImg: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!wrapRef.current) return;
    const timer = setTimeout(() => {
      if (!wrapRef.current) return;
      const iframe = document.createElement('iframe');
      const startParam = start ? '&start=' + start : '';
      const endParam = end ? '&end=' + end : '';
      iframe.src =
        'https://www.youtube.com/embed/' + videoId +
        '?autoplay=1&mute=1&loop=1&playlist=' + videoId +
        '&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1' +
        startParam + endParam;
      iframe.allow = 'autoplay; encrypted-media';
      iframe.style.opacity = '0';
      iframe.style.transition = 'opacity 1.2s ease';
      wrapRef.current.appendChild(iframe);
      iframeRef.current = iframe;
      iframe.onload = () => { iframe.style.opacity = '1'; setReady(true); };
    }, 1500);
    return () => clearTimeout(timer);
  }, [videoId, start, end]);

  useEffect(() => {
    if (!end || !ready || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const yt = 'https://www.youtube.com';
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== yt) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.event === 'onStateChange' && data?.info === 0) {
          iframe.contentWindow?.postMessage(`{"event":"command","func":"seekTo","args":[${start}, true]}`, yt);
          iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', yt);
        }
      } catch {}
    };
    window.addEventListener('message', onMsg);
    const poll = setInterval(() => {
      iframe.contentWindow?.postMessage('{"event":"listening","id":1,"channel":"widget"}', yt);
    }, 2000);
    return () => { window.removeEventListener('message', onMsg); clearInterval(poll); };
  }, [start, end, ready]);

  return (
    <div className="hh-hero__bg" ref={wrapRef} style={{ backgroundImage: `url(${fallbackImg})` }} />
  );
}
