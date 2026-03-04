import { useState } from 'react';
import './AboutPage.css';

interface FAQItem {
  question: string;
  answer: string;
}

const asistentesSteps = [
  { title: 'Compra entrada', icon: '🎟️' },
  { title: 'Presenta ID', icon: '🆔' },
  { title: 'Revende seguro', icon: '🔄' },
];

const asistentesFeatures = [
  { title: 'Badges', desc: 'Sube de nivel con cada evento' },
  { title: 'Acceso anticipado', desc: 'Sé el primero en comprar' },
  { title: 'Beneficios exclusivos', desc: 'Descuentos y ofertas especiales' },
  { title: 'Perfil verificado', desc: 'Confianza garantizada' },
];

const asistentesCommitments = [
  { title: 'Cero sorpresas', desc: 'Sin cargos ocultos' },
  { title: 'Marketplace abierto', desc: 'Revende cuando quieras' },
  { title: 'Data protegida', desc: 'Tu privacidad primero' },
  { title: 'Anti-scalping', desc: 'Precios justos siempre' },
  { title: 'Soporte real', desc: 'Ayuda en vivo 24/7' },
  { title: 'Nivel internacional', desc: 'Crece sin límites' },
];

const asistentesFA: FAQItem[] = [
  {
    question: '¿Cómo compro mi entrada?',
    answer:
      'Entra a LEZGO, selecciona el evento, elige tu tipo de entrada y completa el pago. En segundos tendrás tu QR en tu perfil.',
  },
  {
    question: '¿Qué necesito para entrar al evento?',
    answer:
      'Tu documento de identidad (DNI) y tu código QR. Nos aseguramos que eres tú el que compró la entrada.',
  },
  {
    question: '¿Qué pasa si no puedo asistir?',
    answer:
      'Sin problema. Puedes vender tu entrada en el marketplace de LEZGO. Fija el precio que quieras y alguien la comprará.',
  },
  {
    question: '¿Se puede transferir la entrada?',
    answer:
      'Sí, puedes transferir tu entrada a un amigo o revenderla. El nuevo propietario debe verificar su identidad.',
  },
  {
    question: '¿Qué tipos de eventos hay?',
    answer:
      'Tenemos de todo: conciertos, festivales, clubs, teatro, deportes. Filtra por género, fecha o ubicación.',
  },
];

const organizadoresSteps = [
  { phase: 'Pre-lanzamiento', items: ['Crea evento', 'Define entradas', 'Página del evento'] },
  { phase: 'Lanzamiento', items: ['Dashboard', 'Scanner ID', 'Anti-scalping'] },
  { phase: 'Post-evento', items: ['Revenue en reventa', 'Analytics', 'Next evento'] },
];

const organizadoresFeatures = [
  { title: 'Control total', desc: 'Gestiona tu evento desde el dashboard' },
  { title: 'Sin intermediarios', desc: 'Vende directamente, sin comisiones altísimas' },
  { title: 'Antifraud', desc: 'Verificación de identidad en la puerta' },
  { title: 'Analytics real-time', desc: 'Datos en vivo de tu evento' },
  { title: 'Reventa controlada', desc: 'Gana en reventa sin perder control' },
  { title: 'Soporte dedicado', desc: 'Equipo listo para ayudarte' },
];

const organizadoresFA: FAQItem[] = [
  {
    question: '¿Cuánto cuesta crear un evento?',
    answer:
      'Crear el evento es gratis. Pagamos comisión solo cuando vendes entradas: 5% por venta directa, 10% por reventa.',
  },
  {
    question: '¿Cómo funciona el pago?',
    answer:
      'Recibes el dinero dentro de 48 horas después del evento. Depositamos directamente a tu cuenta bancaria o billetera digital.',
  },
  {
    question: '¿Puedo controlar los precios de reventa?',
    answer:
      'Sí. Puedes establecer un techo de precio máximo para que no se especule. Nosotros nos encargamos de validar.',
  },
  {
    question: '¿Qué datos obtengo de mi evento?',
    answer:
      'Dashboard completo con: entradas vendidas, ingresos, datos demográficos, asistencia, reventa. Todo en tiempo real.',
  },
  {
    question: '¿Puedo usar el scanner en cualquier parte?',
    answer:
      'Sí. El scanner de LEZGO funciona en cualquier dispositivo. Offline también funciona. Solo necesitas conexión para sincronizar.',
  },
  {
    question: '¿Hay descuentos para eventos grandes?',
    answer:
      'Sí. Tenemos tarifas especiales para eventos corporativos y festivals. Contacta a nuestro equipo para negociar.',
  },
];

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<'asistentes' | 'organizadores'>('asistentes');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');

  const currentFaq = activeTab === 'asistentes' ? asistentesFA : organizadoresFA;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email submitted:', email);
    setEmail('');
  };

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="hero-section">
        <h1>COMPRA TICKETS SIN MIEDO</h1>
        <p>Verificación de identidad, transparencia total, sin sorpresas</p>

        <div className="ticket-comparison">
          <div className="ticket-card fake">
            <div className="ticket-badge">FALSO</div>
            <div className="ticket-content">
              <div className="ticket-qr">❌</div>
              <div className="ticket-info">
                <div className="ticket-price-fake">S/ 999</div>
                <div className="ticket-label">QR inválido</div>
              </div>
            </div>
          </div>

          <div className="comparison-arrow">→</div>

          <div className="ticket-card real">
            <div className="ticket-badge verified">VERIFICADO</div>
            <div className="ticket-content">
              <div className="ticket-qr">✓</div>
              <div className="ticket-info">
                <div className="ticket-price-real">S/ 150</div>
                <div className="ticket-label">Identidad verificada</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="tabs-section">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'asistentes' ? 'active' : ''}`}
            onClick={() => setActiveTab('asistentes')}
          >
            PARA ASISTENTES
          </button>
          <button
            className={`tab-btn ${activeTab === 'organizadores' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizadores')}
          >
            PARA ORGANIZADORES
          </button>
        </div>

        {activeTab === 'asistentes' && (
          <div className="tab-content asistentes-tab">
            {/* Así Funciona */}
            <div className="section">
              <h2>Así funciona para ti</h2>
              <div className="steps-grid">
                {asistentesSteps.map((step, idx) => (
                  <div key={idx} className="step-card">
                    <div className="step-icon">{step.icon}</div>
                    <div className="step-title">{step.title}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Beneficios */}
            <div className="section">
              <h2>Beneficios</h2>
              <div className="features-grid">
                {asistentesFeatures.map((feature, idx) => (
                  <div key={idx} className="feature-card">
                    <div className="feature-title">{feature.title}</div>
                    <div className="feature-desc">{feature.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compromisos */}
            <div className="section">
              <h2>Nuestros compromisos</h2>
              <div className="commitments-grid">
                {asistentesCommitments.map((commitment, idx) => (
                  <div key={idx} className="commitment-card">
                    <div className="commitment-title">{commitment.title}</div>
                    <div className="commitment-desc">{commitment.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="section faq-section">
              <h2>Preguntas frecuentes</h2>
              <div className="faq-list">
                {currentFaq.map((item, idx) => (
                  <div
                    key={idx}
                    className={`faq-item ${expandedFaq === idx ? 'expanded' : ''}`}
                  >
                    <button
                      className="faq-question"
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    >
                      <span>{item.question}</span>
                      <span className="faq-toggle">{expandedFaq === idx ? '−' : '+'}</span>
                    </button>
                    {expandedFaq === idx && (
                      <div className="faq-answer">{item.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'organizadores' && (
          <div className="tab-content organizadores-tab">
            {/* Fases */}
            <div className="section">
              <h2>Fases de tu evento</h2>
              <div className="phases-grid">
                {organizadoresSteps.map((phase, phaseIdx) => (
                  <div key={phaseIdx} className="phase-card">
                    <div className="phase-title">{phase.phase}</div>
                    <div className="phase-items">
                      {phase.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="phase-item">
                          ✓ {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mecánicas de venta */}
            <div className="section">
              <h2>Mecánicas de venta</h2>
              <div className="features-grid">
                {organizadoresFeatures.map((feature, idx) => (
                  <div key={idx} className="feature-card">
                    <div className="feature-title">{feature.title}</div>
                    <div className="feature-desc">{feature.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="section faq-section">
              <h2>Preguntas frecuentes</h2>
              <div className="faq-list">
                {currentFaq.map((item, idx) => (
                  <div
                    key={idx}
                    className={`faq-item ${expandedFaq === idx ? 'expanded' : ''}`}
                  >
                    <button
                      className="faq-question"
                      onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    >
                      <span>{item.question}</span>
                      <span className="faq-toggle">{expandedFaq === idx ? '−' : '+'}</span>
                    </button>
                    {expandedFaq === idx && (
                      <div className="faq-answer">{item.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Capture */}
      <section className="email-section">
        <h2>Mantente informado</h2>
        <form onSubmit={handleEmailSubmit} className="email-form">
          <input
            type="email"
            placeholder="Tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Suscribirse</button>
        </form>
      </section>
    </div>
  );
}
