import { useState } from 'react';
import './DeckPage.css';

type Language = 'es' | 'en';
type Mode = 'simple' | 'tech';

const translations = {
  es: {
    title: 'COMPRA VENDE Y REVENDE TICKETS SEGURO',
    subtitle: 'Plataforma verificada de tickets para eventos',
    contactBtn: 'CONTACTAR EQUIPO',
    problem: 'El Problema',
    problemDesc:
      'El 40% de tickets en Perú son falsificados. Los revendedores abusan de precios. No hay verificación real.',
    solution: 'La Solución',
    solutionDesc:
      'Verificación de identidad en cada compra. Marketplace controlado. Protección total para asistentes y organizadores.',
    howWorks: 'Cómo funciona',
    forFans: 'Para asistentes',
    forOrganizers: 'Para organizadores',
    buy: 'Compra',
    verify: 'Verifica ID',
    resell: 'Revende',
    create: 'Crea evento',
    dashboard: 'Dashboard',
    scanner: 'Scanner',
    businessModel: 'Modelo de negocio',
    directSale: 'Venta directa: 5%',
    resaleFee: 'Reventa: 10%',
    traction: 'Tracción',
    team: 'Equipo',
    teamLeader: 'Lider del proyecto',
    contact: 'Contacto',
    contactEmail: 'tata@frensonly.club',
  },
  en: {
    title: 'BUY SELL AND RESELL TICKETS SAFELY',
    subtitle: 'Verified ticketing platform for events',
    contactBtn: 'CONTACT TEAM',
    problem: 'The Problem',
    problemDesc:
      '40% of tickets in Peru are fake. Resellers abuse prices. No real verification.',
    solution: 'The Solution',
    solutionDesc:
      'Identity verification on every purchase. Controlled marketplace. Full protection for attendees and organizers.',
    howWorks: 'How it works',
    forFans: 'For attendees',
    forOrganizers: 'For organizers',
    buy: 'Buy',
    verify: 'Verify ID',
    resell: 'Resell',
    create: 'Create event',
    dashboard: 'Dashboard',
    scanner: 'Scanner',
    businessModel: 'Business Model',
    directSale: 'Direct sale: 5%',
    resaleFee: 'Resale: 10%',
    traction: 'Traction',
    team: 'Team',
    teamLeader: 'Project Leader',
    contact: 'Contact',
    contactEmail: 'tata@frensonly.club',
  },
};

export default function DeckPage() {
  const [lang, setLang] = useState<Language>('es');
  const [mode, setMode] = useState<Mode>('simple');

  const t = translations[lang];

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
              ES
            </button>
            <button
              className={`toggle-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              EN
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
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>

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

        <a href="mailto:tata@frensonly.club" className="contact-btn">
          {t.contactBtn}
        </a>
      </section>

      {/* Problem Section */}
      <section className="section-deck problem-section">
        <h2>{t.problem}</h2>
        <p>{t.problemDesc}</p>
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
        <h2>{t.solution}</h2>
        <p>{t.solutionDesc}</p>
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
        <h2>{t.howWorks}</h2>

        <div className="flow-container">
          <div className="flow-track">
            <h3>{t.forFans}</h3>
            <div className="flow-steps">
              <div className="flow-step">
                <div className="step-icon">1</div>
                <div className="step-title">{t.buy}</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-icon">2</div>
                <div className="step-title">{t.verify}</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-icon">3</div>
                <div className="step-title">{t.resell}</div>
              </div>
            </div>
          </div>

          <div className="flow-track">
            <h3>{t.forOrganizers}</h3>
            <div className="flow-steps">
              <div className="flow-step">
                <div className="step-icon">1</div>
                <div className="step-title">{t.create}</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-icon">2</div>
                <div className="step-title">{t.dashboard}</div>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-step">
                <div className="step-icon">3</div>
                <div className="step-title">{t.scanner}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Model Section */}
      <section className="section-deck business-model">
        <h2>{t.businessModel}</h2>
        <div className="fee-structure">
          <div className="fee-card">
            <div className="fee-label">{t.directSale}</div>
            <div className="fee-amount">5%</div>
          </div>
          <div className="fee-card">
            <div className="fee-label">{t.resaleFee}</div>
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
        <h2>{t.traction}</h2>
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
        <h2>{t.team}</h2>
        <div className="team-card">
          <div className="team-avatar">T</div>
          <div className="team-info">
            <div className="team-name">{t.teamLeader}</div>
            <div className="team-role">Building the future of ticketing in Peru</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="deck-footer">
        <h3>{t.contact}</h3>
        <a href="mailto:tata@frensonly.club" className="footer-email">
          {t.contactEmail}
        </a>
        <p className="footer-text">LEZGO • Lima, Peru • 2024</p>
      </footer>
    </div>
  );
}
