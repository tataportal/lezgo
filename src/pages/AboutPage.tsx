import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import './AboutPage.css';

interface FAQItem {
  question: string;
  answer: string;
}

const SmileyIcon = () => (
  <span className="acid-smiley">
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
      <circle cx="8.5" cy="10" r="1.5" fill="currentColor"/>
      <circle cx="15.5" cy="10" r="1.5" fill="currentColor"/>
      <path d="M7.5 15c0 0 2 4 4.5 4s4.5-4 4.5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  </span>
);

const IdIcon = ({ valid }: { valid: boolean }) => (
  <span className={`cf-id-icon ${valid ? 'cf-id-valid' : 'cf-id-invalid'}`}>
    <svg viewBox="0 0 40 28" fill="none">
      <rect x="1" y="1" width="38" height="26" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="5" y="5" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="10" cy="9" r="2.5" fill="currentColor" opacity="0.5"/>
      <rect x="19" y="6" width="14" height="2" rx="1" fill="currentColor" opacity="0.4"/>
      <rect x="19" y="11" width="10" height="2" rx="1" fill="currentColor" opacity="0.3"/>
      <rect x="5" y="19" width="28" height="2" rx="1" fill="currentColor" opacity="0.25"/>
      <rect x="5" y="23" width="18" height="1.5" rx="0.75" fill="currentColor" opacity="0.15"/>
      {valid ? (
        <circle cx="33" cy="21" r="5" fill="var(--green)" opacity="0.9"/>
      ) : (
        <circle cx="33" cy="21" r="5" fill="var(--pink)" opacity="0.9"/>
      )}
      {valid ? (
        <path d="M30.5 21l1.8 1.8 3.2-3.2" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      ) : (
        <>
          <path d="M31 19l4 4" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M35 19l-4 4" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
        </>
      )}
    </svg>
  </span>
);

/* ── 3D Rotating Card ────────────────────────────────────── */

interface CardFace {
  label: string;
  sub: string;
  emoji: string;
  type: 'doc' | 'ticket';
}

const cardFaces: CardFace[] = [
  { label: 'DNI', sub: 'Documento Nacional de Identidad', emoji: '🪪', type: 'doc' },
  { label: 'EVENT TICKET', sub: 'LEZGO Launch Party', emoji: '🎟️', type: 'ticket' },
  { label: 'CARNET DE EXTRANJERÍA', sub: 'Permiso de Residencia', emoji: '🛂', type: 'doc' },
  { label: 'CONFERENCE PASS', sub: 'Tech Summit 2026', emoji: '🎫', type: 'ticket' },
  { label: 'PASAPORTE', sub: 'República del Perú', emoji: '📘', type: 'doc' },
  { label: 'CLUB MEMBERSHIP', sub: 'VIP Access Card', emoji: '💳', type: 'ticket' },
];

const CardContent = ({ face }: { face: CardFace }) => (
  <div className={`h3d-content h3d-content--${face.type}`}>
    <div className="h3d-top">
      <span className="h3d-emoji">{face.emoji}</span>
      <span className="h3d-brand">LEZGO</span>
    </div>
    <div className="h3d-label">{face.label}</div>
    <div className="h3d-sub">{face.sub}</div>
    <div className="h3d-lines">
      <div className="h3d-line" style={{ width: '75%' }} />
      <div className="h3d-line" style={{ width: '55%' }} />
      <div className="h3d-line" style={{ width: '40%' }} />
    </div>
    <div className="h3d-bottom">
      <div className="h3d-chip" />
      <span className="h3d-verified">✓ VERIFIED</span>
    </div>
  </div>
);

const HeroCard3D = () => {
  const [frontIdx, setFrontIdx] = useState(0);
  const [backIdx, setBackIdx] = useState(1);
  const [rotation, setRotation] = useState(0);

  const flip = useCallback(() => {
    setRotation(prev => {
      const next = prev + 180;
      const newStep = Math.round(next / 180);
      // After flip animation completes, update the hidden face with next content
      setTimeout(() => {
        if (newStep % 2 === 0) {
          setBackIdx((newStep + 1) % cardFaces.length);
        } else {
          setFrontIdx((newStep + 1) % cardFaces.length);
        }
      }, 900);
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(flip, 2800);
    return () => clearInterval(timer);
  }, [flip]);

  return (
    <div className="h3d-scene">
      <div className="h3d-card" style={{ transform: `rotateY(${rotation}deg)` }}>
        <div className="h3d-face h3d-front">
          <CardContent face={cardFaces[frontIdx]} />
        </div>
        <div className="h3d-face h3d-back">
          <CardContent face={cardFaces[backIdx]} />
        </div>
      </div>
      {/* Reflection */}
      <div className="h3d-reflection" style={{ transform: `rotateY(${rotation}deg)` }} />
    </div>
  );
};

export default function AboutPage() {
  const navigate = useNavigate();
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

  const asistentesFeatures = [
    { icon: '🎟️', title: t.about.features.buyTicket, desc: t.about.features.buyTicketDesc },
    { icon: '🆔', title: t.about.features.presentId, desc: t.about.features.presentIdDesc },
    { icon: '🔄', title: t.about.features.safeResale, desc: t.about.features.safeResaleDesc },
    { icon: '🏆', title: t.about.features.earnBadges, desc: t.about.features.earnBadgesDesc },
    { icon: '⚡', title: t.about.features.earlyAccess, desc: t.about.features.earlyAccessDesc },
    { icon: '🔒', title: t.about.features.antiScalping, desc: t.about.features.antiScalpingDesc },
  ];

  const asistentesCompare = {
    old: t.about.beforeItems,
    lezgo: t.about.nowItems,
  };

  const asistentesFA: FAQItem[] = t.about.faqAttendees.map(item => ({
    question: item.q,
    answer: item.a,
  }));

  const orgPhases = [
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

  const orgFeatures = [
    { icon: '📊', title: t.about.orgFeatures.totalControl, desc: t.about.orgFeatures.totalControlDesc },
    { icon: '💸', title: t.about.orgFeatures.noMiddlemen, desc: t.about.orgFeatures.noMiddlemenDesc },
    { icon: '🛡️', title: t.about.orgFeatures.antifraud, desc: t.about.orgFeatures.antifraudDesc },
    { icon: '📈', title: t.about.orgFeatures.realTimeAnalytics, desc: t.about.orgFeatures.realTimeAnalyticsDesc },
    { icon: '🔄', title: t.about.orgFeatures.controlledResale, desc: t.about.orgFeatures.controlledResaleDesc },
    { icon: '🤝', title: t.about.orgFeatures.dedicatedSupport, desc: t.about.orgFeatures.dedicatedSupportDesc },
  ];

  const orgFA: FAQItem[] = t.about.faqOrganizers.map(item => ({
    question: item.q,
    answer: item.a,
  }));

  const currentFaq = activeTab === 'asistentes' ? asistentesFA : orgFA;

  const switchTab = (tab: 'asistentes' | 'promotores') => {
    setActiveTab(tab);
    setExpandedFaq(null);
  };

  return (
    <div>
      {/* Marquee */}
      <div className="marquee">
        <div className="marquee-track">
          {marqueeItems.map((item, i) => (
            <span key={i} className="marquee-item">
              <SmileyIcon /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* Hero — Brutalist Avant-Garde */}
      <section className="cf-hero" id="conocenos-hero">
        {/* Animated noise grain */}
        <div className="cf-hero-noise" />

        {/* Giant rotating text ring */}
        <div className="cf-hero-ring">
          <svg viewBox="0 0 500 500" className="cf-hero-ring-svg">
            <defs>
              <path id="circlePath" d="M250,250 m-200,0 a200,200 0 1,1 400,0 a200,200 0 1,1 -400,0" />
            </defs>
            <text>
              <textPath href="#circlePath" className="cf-ring-text">
                COMPRA SEGURA • SIN ESTAFAS • ID VERIFICADO • REVENTA OFICIAL • COMPRA SEGURA • SIN ESTAFAS • ID VERIFICADO • REVENTA OFICIAL •
              </textPath>
            </text>
          </svg>
        </div>

        <div className="cf-hero-content">
          <div className="cf-hero-eyebrow">
            <span className="cf-hero-eyebrow-line" />
            <span>{t.about.welcome}</span>
            <span className="cf-hero-eyebrow-line" />
          </div>

          <h1 className="cf-hero-title">
            <span className="cf-hero-title-outline">{t.about.buyTickets}</span>
            <span className="cf-hero-title-accent">
              <span className="cf-hero-title-accent-bg" />
              {t.about.tickets}
            </span>
            <span className="cf-hero-title-white">{t.about.noFear}</span>
          </h1>

          <p className="cf-hero-subtitle">{t.about.heroDesc}</p>

          <HeroCard3D />

          <div className="cf-hero-stats">
            <div className="cf-hero-stat">
              <span className="cf-hero-stat-num">0%</span>
              <span className="cf-hero-stat-label">ESTAFAS</span>
            </div>
            <div className="cf-hero-stat-divider" />
            <div className="cf-hero-stat">
              <span className="cf-hero-stat-num">100%</span>
              <span className="cf-hero-stat-label">VERIFICADO</span>
            </div>
            <div className="cf-hero-stat-divider" />
            <div className="cf-hero-stat">
              <span className="cf-hero-stat-num">1:1</span>
              <span className="cf-hero-stat-label">TICKET = DNI</span>
            </div>
          </div>

          <div className="cf-btns">
            <button className="conocenos-pill" onClick={() => navigate('/eventos')}>{t.about.viewEvents}</button>
            <button className="conocenos-pill-outline" onClick={() => navigate('/reventa')}>{t.about.searchResale}</button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="cf-hero-scroll">
          <div className="cf-hero-scroll-line" />
          <span>SCROLL</span>
        </div>
      </section>

      {/* Sticky Tabs */}
      <div className="conocenos-tabs-container">
        <div className="conocenos-tabs">
          <button className={`conocenos-tab ${activeTab === 'asistentes' ? 'active' : ''}`} onClick={() => switchTab('asistentes')}>
            {t.about.tabAttendees}
          </button>
          <button className={`conocenos-tab ${activeTab === 'promotores' ? 'active' : ''}`} onClick={() => switchTab('promotores')}>
            {t.about.tabPromoters}
          </button>
        </div>
      </div>

      {/* Asistentes Content */}
      {activeTab === 'asistentes' && (
        <div className="conocenos-tab-content active">
          {/* How it works */}
          <div className="cf-section">
            <div className="cf-section-label">{t.about.howItWorks}</div>
            <div className="cf-section-title">{t.about.yourTicketYourId}</div>
            <div className="cf-section-text">
              {t.about.howItWorksDesc}
            </div>

            {/* 3-step flow */}
            <div className="cf-steps">
              <div className="cf-step">
                <div className="cf-step-num">01</div>
                <h3>{t.about.steps.buy}</h3>
                <p>{t.about.steps.buyDesc}</p>
              </div>
              <div className="cf-step-arrow">→</div>
              <div className="cf-step">
                <div className="cf-step-num">02</div>
                <h3>{t.about.steps.showId}</h3>
                <p>{t.about.steps.showIdDesc}</p>
              </div>
              <div className="cf-step-arrow">→</div>
              <div className="cf-step">
                <div className="cf-step-num">03</div>
                <h3>{t.about.steps.enjoy}</h3>
                <p>{t.about.steps.enjoyDesc}</p>
              </div>
            </div>

            <div className="cf-features">
              {asistentesFeatures.map((f, i) => (
                <div key={i} className="cf-feature">
                  <div className="cf-feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison */}
          <div className="cf-section">
            <div className="cf-section-label">{t.about.beforeVsNow}</div>
            <div className="cf-section-title">{t.about.differenceIsReal}</div>
            <div className="cf-compare">
              <div className="cf-compare-card cf-compare-old">
                <h3>{t.about.beforeTitle}</h3>
                <ul className="cf-compare-list">
                  {asistentesCompare.old.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
              <div className="cf-compare-card cf-compare-new">
                <h3>{t.about.nowTitle}</h3>
                <ul className="cf-compare-list">
                  {asistentesCompare.lezgo.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="cf-faq-section">
            <div className="cf-section-label">{t.about.faqTitle}</div>
            <div className="cf-section-title" style={{ marginBottom: 32 }}>{t.about.faqHeading}</div>
            <div className="cf-faq-list">
              {currentFaq.map((item, idx) => (
                <div key={idx} className="cf-faq-item">
                  <button className="cf-faq-question" onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}>
                    <span>{item.question}</span>
                    <span className="cf-faq-toggle">{expandedFaq === idx ? '−' : '+'}</span>
                  </button>
                  {expandedFaq === idx && (
                    <div className="cf-faq-answer">{item.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Promotores Content */}
      {activeTab === 'promotores' && (
        <div className="conocenos-tab-content active">
          {/* Phases */}
          <div className="cf-section">
            <div className="cf-section-label">{t.about.orgPhases}</div>
            <div className="cf-section-title">{t.about.orgPhasesTitle}</div>
            <div className="cf-phases">
              {orgPhases.map((phase, i) => (
                <div key={i} className="cf-phase">
                  <div className="cf-phase-title">{phase.phase}</div>
                  <div className="cf-phase-items">
                    {phase.items.map((item, j) => (
                      <div key={j} className="cf-phase-item">{item}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="cf-section">
            <div className="cf-section-label">{t.about.orgTools}</div>
            <div className="cf-section-title">{t.about.orgToolsTitle}</div>
            <div className="cf-features">
              {orgFeatures.map((f, i) => (
                <div key={i} className="cf-feature">
                  <div className="cf-feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue share callout */}
          <div className="cf-section">
            <div className="cf-section-label">{t.about.promoterRevenue}</div>
            <div className="cf-section-title">{t.about.promoterRevenueTitle}</div>
            <div className="cf-revenue-cards">
              <div className="cf-revenue-card">
                <div className="cf-revenue-pct">5%</div>
                <div className="cf-revenue-label">{t.about.revenueDirectSale}</div>
                <p>{t.about.revenueDirectSaleDesc}</p>
              </div>
              <div className="cf-revenue-card">
                <div className="cf-revenue-pct">10%</div>
                <div className="cf-revenue-label">{t.about.revenueResale}</div>
                <p>{t.about.revenueResaleDesc}</p>
              </div>
              <div className="cf-revenue-card cf-revenue-card--highlight">
                <div className="cf-revenue-pct">100%</div>
                <div className="cf-revenue-label">{t.about.revenueTransparency}</div>
                <p>{t.about.revenueTransparencyDesc}</p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="cf-faq-section">
            <div className="cf-section-label">{t.about.faqTitle}</div>
            <div className="cf-section-title" style={{ marginBottom: 32 }}>{t.about.faqHeading}</div>
            <div className="cf-faq-list">
              {currentFaq.map((item, idx) => (
                <div key={idx} className="cf-faq-item">
                  <button className="cf-faq-question" onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}>
                    <span>{item.question}</span>
                    <span className="cf-faq-toggle">{expandedFaq === idx ? '−' : '+'}</span>
                  </button>
                  {expandedFaq === idx && (
                    <div className="cf-faq-answer">{item.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="cf-footer">
        <div className="cf-footer-logo">LEZGO</div>
        <div className="cf-footer-copy">{t.footer.copy}</div>
      </div>
    </div>
  );
}
