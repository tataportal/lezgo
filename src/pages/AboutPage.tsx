import { useState } from 'react';
import { useTranslation } from '../i18n';
import { Icon, type IconName } from '../components/ui';
import { IdentityPlaneScene } from '../components/about/IdentityPlaneScene';
import './AboutPage.css';


interface FAQItem {
  question: string;
  answer: string;
}

interface FeatureItem {
  icon: IconName;
  title: string;
  desc: string;
}

interface PhaseItem {
  phase: string;
  items: string[];
}

export default function AboutPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'asistentes' | 'promotores'>('asistentes');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const marqueeItems = [
    t.about.marquee.safePurchase,
    t.about.marquee.verifiedId,
    t.about.marquee.noScams,
    t.about.marquee.verifiedResale,
    t.about.marquee.totalControl,
    t.about.marquee.safePurchase,
    t.about.marquee.verifiedId,
    t.about.marquee.noScams,
    t.about.marquee.verifiedResale,
    t.about.marquee.totalControl,
  ];

  const attendeeAssurances: FeatureItem[] = [
    { icon: 'id', title: t.about.features.presentId, desc: t.about.features.presentIdDesc },
    { icon: 'transfer', title: t.about.features.safeResale, desc: t.about.features.safeResaleDesc },
    { icon: 'lock', title: t.about.features.antiScalping, desc: t.about.features.antiScalpingDesc },
  ];

  const attendeePerks: FeatureItem[] = [
    { icon: 'ticket', title: t.about.features.buyTicket, desc: t.about.features.buyTicketDesc },
    { icon: 'star', title: t.about.features.earnBadges, desc: t.about.features.earnBadgesDesc },
    { icon: 'spark', title: t.about.features.earlyAccess, desc: t.about.features.earlyAccessDesc },
  ];

  const promoterCore: FeatureItem[] = [
    { icon: 'analytics', title: t.about.orgFeatures.totalControl, desc: t.about.orgFeatures.totalControlDesc },
    { icon: 'shield', title: t.about.orgFeatures.antifraud, desc: t.about.orgFeatures.antifraudDesc },
    { icon: 'money', title: t.about.orgFeatures.controlledResale, desc: t.about.orgFeatures.controlledResaleDesc },
  ];

  const promoterPerks: FeatureItem[] = [
    { icon: 'building', title: t.about.orgFeatures.noMiddlemen, desc: t.about.orgFeatures.noMiddlemenDesc },
    { icon: 'analytics', title: t.about.orgFeatures.realTimeAnalytics, desc: t.about.orgFeatures.realTimeAnalyticsDesc },
    { icon: 'user-check', title: t.about.orgFeatures.dedicatedSupport, desc: t.about.orgFeatures.dedicatedSupportDesc },
  ];

  const attendeeFaq: FAQItem[] = t.about.faqAttendees.map((item) => ({
    question: item.q,
    answer: item.a,
  }));

  const promoterFaq: FAQItem[] = t.about.faqOrganizers.map((item) => ({
    question: item.q,
    answer: item.a,
  }));

  const promoterPhases: PhaseItem[] = [
    {
      phase: t.about.orgPhaseLabels.preLaunch,
      items: [
        t.about.orgPhaseItems.createEvent,
        t.about.orgPhaseItems.defineTickets,
        t.about.orgPhaseItems.eventPage,
      ],
    },
    {
      phase: t.about.orgPhaseLabels.launch,
      items: [
        t.about.orgPhaseItems.dashboard,
        t.about.orgPhaseItems.scannerID,
        t.about.orgPhaseItems.antiScalping,
      ],
    },
    {
      phase: t.about.orgPhaseLabels.postEvent,
      items: [
        t.about.orgPhaseItems.resaleRevenue,
        t.about.orgPhaseItems.analytics,
        t.about.orgPhaseItems.nextEvent,
      ],
    },
  ];

  const activeFaq = activeTab === 'asistentes' ? attendeeFaq : promoterFaq;

  const handleTab = (tab: 'asistentes' | 'promotores') => {
    setActiveTab(tab);
    setExpandedFaq(null);
  };

  const allFeatures = activeTab === 'asistentes'
    ? [...attendeeAssurances, ...attendeePerks]
    : [...promoterCore, ...promoterPerks];

  return (
    <div className="ab-page">

      {/* ── Marquee ─────────────────────────────── */}
      <div className="ab-marquee" aria-hidden="true">
        <div className="ab-marquee-track">
          {marqueeItems.map((item, i) => (
            <span key={i} className="ab-marquee-item">{item}</span>
          ))}
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────── */}
      <section className="ab-hero">

        {/* Tab pills */}
        <div className="ab-hero-tabs">
          <button
            className={`ab-hero-tab${activeTab === 'asistentes' ? ' ab-hero-tab--active' : ''}`}
            onClick={() => handleTab('asistentes')}
          >
            {t.about.tabAttendees}
          </button>
          <button
            className={`ab-hero-tab${activeTab === 'promotores' ? ' ab-hero-tab--active' : ''}`}
            onClick={() => handleTab('promotores')}
          >
            {t.about.tabPromoters}
          </button>
        </div>

        {/* Three.js identity card scene */}
        <IdentityPlaneScene />

        {/* Headline + sub */}
        <div className="ab-hero-text">
          <h1 className="ab-hero-title">
            <span className="ab-hero-line">COMPRA</span>
            <span className="ab-hero-line">SIN MIEDO</span>
          </h1>
          <p className="ab-hero-sub">
            {t.about.heroSubMain}{' '}
            <span className="ab-hero-sub--acid">{t.about.heroSubAccent}</span>
          </p>
        </div>

      </section>


      {/* ── How it works ─────────────────────────── */}
      <section className="ab-section">
        <div className="ab-shell">
          <div className="ab-section-head">
            <p className="ab-kicker">
              {activeTab === 'asistentes' ? '01 — Cómo funciona' : '01 — Operación'}
            </p>
            <h2 className="ab-section-title">
              {activeTab === 'asistentes'
                ? t.about.yourTicketYourId
                : t.about.orgPhasesTitle}
            </h2>
            <p className="ab-section-body">
              {activeTab === 'asistentes'
                ? t.about.howItWorksDesc
                : 'Crea el evento, vende con control y opera el ingreso con identidad real.'}
            </p>
          </div>

          {activeTab === 'asistentes' ? (
            <div className="ab-steps-list">
              {[
                { n: '01', title: t.about.steps.buy, desc: t.about.steps.buyDesc },
                { n: '02', title: t.about.steps.showId, desc: t.about.steps.showIdDesc },
                { n: '03', title: t.about.steps.enjoy, desc: t.about.steps.enjoyDesc },
              ].map((step) => (
                <div key={step.n} className="ab-step-row">
                  <span className="ab-step-n">{step.n}</span>
                  <div className="ab-step-content">
                    <h3 className="ab-step-title">{step.title}</h3>
                    <p className="ab-step-desc">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ab-steps-list">
              {promoterPhases.map((phase, i) => (
                <div key={i} className="ab-step-row">
                  <span className="ab-step-n">0{i + 1}</span>
                  <div className="ab-step-content">
                    <h3 className="ab-step-title">{phase.phase}</h3>
                    <div className="ab-phase-items">
                      {phase.items.map((item, j) => (
                        <span key={j} className="ab-phase-item">{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section className="ab-section">
        <div className="ab-shell">
          <div className="ab-section-head">
            <p className="ab-kicker">
              {activeTab === 'asistentes' ? '02 — Lo que ganas' : '02 — Herramientas'}
            </p>
            <h2 className="ab-section-title">
              {activeTab === 'asistentes'
                ? <>Beneficios reales.<br />Sin letra chica.</>
                : 'Las piezas que sostienen la operación.'}
            </h2>
          </div>

          <div className="ab-features-grid">
            {allFeatures.map((item, i) => (
              <div key={i} className="ab-feature-cell">
                <div className="ab-feature-icon">
                  <Icon name={item.icon} size={20} />
                </div>
                <h3 className="ab-feature-title">{item.title}</h3>
                <p className="ab-feature-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compare / Revenue ────────────────────── */}
      {activeTab === 'asistentes' ? (
        <section className="ab-section">
          <div className="ab-shell">
            <div className="ab-section-head">
              <p className="ab-kicker">03 — La diferencia</p>
              <h2 className="ab-section-title">{t.about.differenceIsReal}</h2>
            </div>

            <div className="ab-compare">
              <div className="ab-compare-col ab-compare-col--before">
                <p className="ab-compare-label">{t.about.beforeTitle}</p>
                <ul className="ab-compare-list">
                  {t.about.beforeItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="ab-compare-col ab-compare-col--after">
                <p className="ab-compare-label">{t.about.nowTitle}</p>
                <ul className="ab-compare-list">
                  {t.about.nowItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="ab-section">
          <div className="ab-shell">
            <div className="ab-section-head">
              <p className="ab-kicker">03 — Comisiones</p>
              <h2 className="ab-section-title">
                {t.about.promoterRevenueTitle.split('\n').map((line: string, i: number, arr: string[]) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </h2>
            </div>

            <div className="ab-revenue-row">
              <div className="ab-revenue-cell">
                <span className="ab-revenue-value">5%</span>
                <h3 className="ab-revenue-label">{t.about.revenueDirectSale}</h3>
                <p className="ab-revenue-desc">{t.about.revenueDirectSaleDesc}</p>
              </div>
              <div className="ab-revenue-cell">
                <span className="ab-revenue-value">10%</span>
                <h3 className="ab-revenue-label">{t.about.revenueResale}</h3>
                <p className="ab-revenue-desc">{t.about.revenueResaleDesc}</p>
              </div>
              <div className="ab-revenue-cell ab-revenue-cell--accent">
                <span className="ab-revenue-value">100%</span>
                <h3 className="ab-revenue-label">{t.about.revenueTransparency}</h3>
                <p className="ab-revenue-desc">{t.about.revenueTransparencyDesc}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────── */}
      <section className="ab-section ab-section--last">
        <div className="ab-shell">
          <div className="ab-section-head">
            <p className="ab-kicker">
              {activeTab === 'asistentes' ? '04 — FAQ' : '04 — FAQ'}
            </p>
            <h2 className="ab-section-title">{t.about.faqHeading}</h2>
          </div>

          <div className="ab-faq-list">
            {activeFaq.map((item, idx) => (
              <div key={idx} className="ab-faq-item">
                <button
                  className="ab-faq-q"
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  aria-expanded={expandedFaq === idx}
                >
                  <span>{item.question}</span>
                  <span className="ab-faq-icon" aria-hidden="true">
                    {expandedFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {expandedFaq === idx && (
                  <div className="ab-faq-a">{item.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
