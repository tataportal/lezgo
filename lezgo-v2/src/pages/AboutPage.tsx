import { useState } from 'react';
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


export default function AboutPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'asistentes' | 'organizadores'>('asistentes');
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

  const switchTab = (tab: 'asistentes' | 'organizadores') => {
    setActiveTab(tab);
    setExpandedFaq(null);
  };

  return (
    <div>
      {/* ── Marquee ── */}
      <div className="marquee">
        <div className="marquee-track">
          {marqueeItems.map((item, i) => (
            <span key={i} className="marquee-item">
              <SmileyIcon /> {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero with Fake vs Real Tickets ── */}
      <section className="cf-hero" id="conocenos-hero">
        <div className="cf-glow cf-glow-1" />
        <div className="cf-glow cf-glow-2" />

        <div className="cf-hero-inner">
          <div>
            <div className="cf-hero-badge"><SmileyIcon /> {t.about.welcome}</div>
            <h1>
              <span className="outline">{t.about.buyTickets}</span>
              <span className="acid-text" style={{ position: 'relative', display: 'inline-block' }}>
                <span className="cf-glitch-layer cf-glitch-pink" aria-hidden="true">{t.about.tickets}</span>
                <span className="cf-glitch-layer cf-glitch-cyan" aria-hidden="true">{t.about.tickets}</span>
                <span style={{ animation: 'conocenos-glitch 3s infinite' }}>{t.about.tickets}</span>
              </span>
              <span className="white-text">{t.about.noFear}</span>
            </h1>
            <p className="cf-hero-text"><strong>{t.about.heroDesc}</strong></p>
            <div className="cf-btns">
              <button className="conocenos-pill" onClick={() => navigate('/reventa')}>{t.about.searchResale}</button>
              <button className="conocenos-pill-outline" onClick={() => navigate('/inicio')}>{t.about.viewEvents}</button>
            </div>
          </div>

          {/* Fake vs Real Tickets */}
          <div className="cf-tickets">
            <div className="cf-ticket cf-ticket-fake">
              <div className="gline gline-1" />
              <div className="gline gline-2" />
              <div className="gline gline-3" />
              <div className="cf-ticket-badge badge-fake">FALSO</div>
              <div className="cf-ticket-event">Bad Bunny — World Tour</div>
              <div className="cf-ticket-venue-sm">Estadio Nacional · 15 Mar 2026</div>
              <div className="cf-ticket-row">
                <div>
                  <div className="cf-ticket-price-label">{t.about.scammerPrice}</div>
                  <div className="cf-ticket-price">S/450</div>
                </div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', textAlign: 'right' as const }}>
                  {t.about.realPrice} <span style={{ textDecoration: 'line-through' }}>S/90</span>
                </div>
              </div>
              <div className="cf-ticket-qr">
                <div className="cf-qr-mini" />
                <span>{t.about.invalidQr}</span>
              </div>
            </div>

            <div className="cf-ticket cf-ticket-real">
              <div className="cf-ticket-badge badge-verified"><SmileyIcon /> {t.about.verifiedBadge}</div>
              <div className="cf-ticket-event">Bad Bunny — World Tour</div>
              <div className="cf-ticket-venue-sm">Estadio Nacional · 15 Mar 2026</div>
              <div className="cf-ticket-row">
                <div>
                  <div className="cf-ticket-price-label">{t.about.fairPrice}</div>
                  <div className="cf-ticket-price">S/90</div>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'right' as const }}>
                  {t.about.linkedTo}<br />
                  <span style={{ color: 'var(--acid)', fontWeight: 700 }}>Mario L. ✓</span>
                </div>
              </div>
              <div className="cf-ticket-qr">
                <div className="cf-qr-mini"><div className="cf-qr-inner" /></div>
                <span>{t.about.idVerified}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sticky Tabs ── */}
      <div className="conocenos-tabs-container">
        <div className="conocenos-tabs">
          <button className={`conocenos-tab ${activeTab === 'asistentes' ? 'active' : ''}`} onClick={() => switchTab('asistentes')}>
            {t.about.tabAttendees}
          </button>
          <button className={`conocenos-tab ${activeTab === 'organizadores' ? 'active' : ''}`} onClick={() => switchTab('organizadores')}>
            {t.about.tabOrganizers}
          </button>
        </div>
      </div>

      {/* ── Asistentes Content ── */}
      {activeTab === 'asistentes' && (
        <div className="conocenos-tab-content active">
          {/* How it works */}
          <div className="cf-section">
            <div className="cf-section-label">{t.about.howItWorks}</div>
            <div className="cf-section-title">{t.about.yourTicketYourId}</div>
            <div className="cf-section-text">
              {t.about.howItWorksDesc}
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

      {/* ── Organizadores Content ── */}
      {activeTab === 'organizadores' && (
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

      {/* ── Footer ── */}
      <div className="cf-footer">
        <div className="cf-footer-logo">LEZGO</div>
        <div className="cf-footer-copy">{t.footer.copy}</div>
      </div>
    </div>
  );
}
