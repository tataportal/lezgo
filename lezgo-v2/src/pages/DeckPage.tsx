import { useState } from 'react';
import { useTranslation } from '../i18n';
import './DeckPage.css';

type Mode = 'simple' | 'tech';

export default function DeckPage() {
  const { t, lang, setLang } = useTranslation();
  const [mode, setMode] = useState<Mode>('simple');

  const d = t.deck;

  return (
    <div className="deck-page">
      {/* Marquee Banner */}
      <div className="marquee-banner">
        <div className="marquee-content">
          <span>LEZGO • LEZGO • LEZGO • LEZGO • LEZGO • LEZGO • LEZGO • LEZGO • </span>
        </div>
      </div>

      {/* Header with Toggles */}
      <div className="deck-header">
        <div className="toggles">
          <div className="toggle-group">
            <button
              className={`toggle-btn ${lang === 'es' ? 'active' : ''}`}
              onClick={() => setLang('es')}
            >
              {t.lang.es}
            </button>
            <button
              className={`toggle-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              {t.lang.en}
            </button>
            <button
              className={`toggle-btn ${lang === 'zh' ? 'active' : ''}`}
              onClick={() => setLang('zh')}
            >
              {t.lang.zh}
            </button>
          </div>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${mode === 'simple' ? 'active' : ''}`}
              onClick={() => setMode('simple')}
            >
              Simple
            </button>
            <button
              className={`toggle-btn ${mode === 'tech' ? 'active' : ''}`}
              onClick={() => setMode('tech')}
            >
              Tech
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <h1>{d.heroTitle}</h1>
        <p>{d.heroDesc}</p>

        <div className="ticket-comparison-deck">
          <div className="ticket-fake">
            <div className="ticket-label-deck">FAKE</div>
            <div className="ticket-content-deck">
              <div className="qr-fake">❌</div>
              <div className="price-fake">S/ 999</div>
            </div>
          </div>
          <div className="comparison-vs">VS</div>
          <div className="ticket-real">
            <div className="ticket-label-deck verified-deck">VERIFIED</div>
            <div className="ticket-content-deck">
              <div className="qr-real">✓</div>
              <div className="price-real">S/ 150</div>
            </div>
          </div>
        </div>

        <a href={`mailto:${d.contactEmail}`} className="contact-btn">
          {d.contactTeam}
        </a>
      </section>

      {/* Problem Section */}
      <section className="section-deck problem-section">
        <h2>{d.problem}</h2>
        <p>{d.problemDesc}</p>
        {mode === 'tech' && (
          <div className="tech-details">
            <div className="stat-card">
              <div className="stat-number">40%</div>
              <div className="stat-label">Tickets falsificados</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">300%</div>
              <div className="stat-label">Markup promedio</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">0%</div>
              <div className="stat-label">Verificación real</div>
            </div>
          </div>
        )}
      </section>

      {/* Solution Section */}
      <section className="section-deck solution-section">
        <h2>{d.solution}</h2>
        <p>{d.solutionDesc}</p>
        {mode === 'tech' && (
          <div className="features-tech">
            <div className="feature-box">
              <div className="feature-icon">🔐</div>
              <div className="feature-label">Identity Verification</div>
            </div>
            <div className="feature-box">
              <div className="feature-icon">🔍</div>
              <div className="feature-label">Real-time Scanner</div>
            </div>
            <div className="feature-box">
              <div className="feature-icon">📊</div>
              <div className="feature-label">Analytics Dashboard</div>
            </div>
          </div>
        )}
      </section>

      {/* How it Works Section */}
      <section className="section-deck how-works">
        <h2>{d.howItWorks}</h2>

        <div className="flow-container">
          <div className="flow-track">
            <h3>{d.forAttendees}</h3>
            <div className="flow-steps">
              <div className="flow-step">
                <div className="step-icon">1</div>
                <div className="step-title">{d.stepBuy}</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-icon">2</div>
                <div className="step-title">{d.stepVerify}</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-icon">3</div>
                <div className="step-title">{d.stepResale}</div>
              </div>
            </div>
          </div>

          <div className="flow-track">
            <h3>{d.forOrganizers}</h3>
            <div className="flow-steps">
              <div className="flow-step">
                <div className="step-icon">1</div>
                <div className="step-title">{d.stepCreate}</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-icon">2</div>
                <div className="step-title">{d.stepDashboard}</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-icon">3</div>
                <div className="step-title">{d.stepScanner}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Model Section */}
      <section className="section-deck business-model">
        <h2>{d.businessModel}</h2>
        <div className="fee-structure">
          <div className="fee-card">
            <div className="fee-label">{d.directSale}</div>
            <div className="fee-amount">8.3%</div>
          </div>
          <div className="fee-card">
            <div className="fee-label">{d.resale}</div>
            <div className="fee-amount">10%</div>
          </div>
        </div>
        {mode === 'tech' && (
          <div className="revenue-projection">
            <p>Projected YoY growth: 300%</p>
            <p>Unit economics: Sustainable at 1M tickets/year</p>
          </div>
        )}
      </section>

      {/* Traction Section */}
      <section className="section-deck traction">
        <h2>{d.traction}</h2>
        {mode === 'simple' ? (
          <div className="traction-simple">
            <div className="milestone">
              <div className="milestone-icon">🎫</div>
              <div className="milestone-text">1000+ tickets sold</div>
            </div>
            <div className="milestone">
              <div className="milestone-icon">🎉</div>
              <div className="milestone-text">10+ events launched</div>
            </div>
            <div className="milestone">
              <div className="milestone-icon">👥</div>
              <div className="milestone-text">500+ active users</div>
            </div>
          </div>
        ) : (
          <div className="traction-tech">
            <div className="metric">
              <div className="metric-label">Monthly Active Users</div>
              <div className="metric-value">500</div>
            </div>
            <div className="metric">
              <div className="metric-label">Total Tickets Verified</div>
              <div className="metric-value">1000</div>
            </div>
            <div className="metric">
              <div className="metric-label">GMV (S/)</div>
              <div className="metric-value">150,000</div>
            </div>
            <div className="metric">
              <div className="metric-label">Fraud Rate</div>
              <div className="metric-value">0%</div>
            </div>
          </div>
        )}
      </section>

      {/* Team Section */}
      <section className="section-deck team-section">
        <h2>{d.team}</h2>
        <div className="team-card">
          <div className="team-avatar">T</div>
          <div className="team-info">
            <div className="team-name">{d.teamLead}</div>
            <div className="team-role">Building the future of ticketing in Peru</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="deck-footer">
        <h3>{d.contact}</h3>
        <a href={`mailto:${d.contactEmail}`} className="footer-email">
          {d.contactEmail}
        </a>
        <p className="footer-text">LEZGO • Lima, Peru • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
