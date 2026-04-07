import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/events/EventCard';
import { getActivePhase, getEventImage, toDate } from '../lib/helpers';
import './HomePage.css';

const VISITED_KEY = 'lezgo_visited';

export default function HomePage() {
  const { t } = useTranslation();
  const { events, loading } = useEvents({ status: 'published' });
  const [isReturningVisitor, setIsReturningVisitor] = useState(false);

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

      {/* ── 1. HERO ── */}
      <section className="home-hero-editorial">
        <div className="home-hero-editorial__inner">
          <h1 className="home-hero-editorial__h1">{t.home.editorialH1}</h1>
          <p className="home-hero-editorial__sub">{t.home.editorialSub}</p>
          <div className="home-hero-editorial__actions">
            <Link to="/eventos" className="home-hero-editorial__cta-primary">
              {t.home.heroCta}
            </Link>
            <Link to="/como-funciona" className="home-hero-editorial__cta-secondary">
              {t.home.hiw.learnMore}
            </Link>
          </div>
        </div>
      </section>

      <div className="home-content">

        {/* ── Returning visitor: events first ── */}
        {isReturningVisitor && previewEvents.length > 0 && (
          <EventsPreviewSection events={previewEvents} t={t} />
        )}

        {/* ── 2. HOW IT WORKS ── */}
        <HowItWorksSection t={t} />

        {/* ── 3. WHY LEZGO ── */}
        <WhyLezgoSection t={t} />

        {/* ── 4. FAQ PREVIEW ── */}
        <FAQPreviewSection t={t} />

        {/* ── 5. UPCOMING EVENTS ── */}
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

        {/* ── 6. FINAL CTA ── */}
        <section className="home-final-cta">
          <div className="home-final-cta__inner">
            <p className="home-final-cta__label">{t.home.resaleCtaLabel}</p>
            <Link to="/reventa" className="home-final-cta__link">{t.home.resaleCtaBtn}</Link>
          </div>
        </section>

      </div>
    </div>
  );
}

/* ── HOW IT WORKS ── */
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
        <Link to="/como-funciona" className="section-more">{t.home.hiw.learnMore}</Link>
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

/* ── WHY LEZGO ── */
function WhyLezgoSection({ t }: { t: any }) {
  const reasons: Array<{ icon: string; title: string; desc: string }> = t.home.why;
  return (
    <section className="home-why">
      <div className="section-head">
        <h2 className="section-title">{t.home.whyTitle}</h2>
      </div>
      <div className="home-why__grid">
        {reasons.map((r, i) => (
          <div key={i} className="home-why__item">
            <div className="home-why__icon">{r.icon}</div>
            <div className="home-why__title">{r.title}</div>
            <div className="home-why__desc">{r.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── FAQ PREVIEW ── */
function FAQPreviewSection({ t }: { t: any }) {
  const faqs: Array<{ q: string; a: string }> = t.home.faqPreview;
  return (
    <section className="home-faq-preview">
      <div className="section-head">
        <h2 className="section-title">{t.home.faqTitle}</h2>
        <Link to="/faq" className="section-more">{t.home.faqMore}</Link>
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

/* ── EVENTS PREVIEW ── */
function EventsPreviewSection({ events, t }: { events: any[]; t: any }) {
  return (
    <section className="home-events-preview" id="upcoming-events">
      <div className="section-head">
        <h2 className="section-title">{t.home.upcoming}</h2>
        <Link to="/eventos" className="section-more">{t.common.viewAll}</Link>
      </div>
      <div className={`events-grid${events.length < 4 ? ' events-grid--centered' : ''}`}>
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
