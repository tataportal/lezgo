import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/layout/Header';
import { FhButton } from '../components/ui/FhButton';
import './FigmaHomePage.css';

const FAQ_ITEMS: { q: string; a: string }[] = [
  { q: 'Qué compras en Lezgo?', a: 'Un derecho de ingreso al evento.' },
  { q: 'Cómo funciona Lezgo?', a: 'Lezgo asigna tu acceso a tu identidad para validar tu ingreso de forma más clara y segura.' },
  { q: 'Lezgo usa códigos QR?', a: 'No. En Lezgo no existen códigos QR. Todo el acceso está vinculado a tu identidad.' },
  { q: 'Qué documentos acepta Lezgo?', a: 'DNI, carnet de extranjería o pasaporte.' },
  { q: 'Por qué tengo que verificar mi identidad?', a: 'Para asignar tu acceso correctamente y validar tu ingreso en la puerta.' },
  { q: 'Qué pasa al llegar al evento?', a: 'Escaneas tu identificación en la entrada y verificamos si tienes un acceso válido asignado.' },
  { q: 'Puedo transferir mi acceso en Lezgo?', a: 'Sí. Puedes transferir tu acceso a través de la app.' },
  { q: 'Transferir mi acceso tiene costo?', a: 'Sí. La transferencia tiene un pequeño fee.' },
  { q: 'Puedo entrar con un screenshot?', a: 'No. El ingreso no depende de screenshots ni de códigos QR.' },
  { q: 'Dónde veo mis accesos?', a: 'En tu perfil dentro de la app.' },
  { q: 'Lezgo guarda mi historial?', a: 'Sí. Tu perfil puede mostrar tu historial de asistencia y tus accesos.' },
];

const IMG = {
  rect23: '/figma/phone.png',
  lezgo: '/figma/lezgo-logo.svg',
  globe: '/figma/globe.svg',
  smile: '/figma/smile.svg',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FigmaHomePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setEmailError('Escribe tu correo.');
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setEmailError('Correo no válido.');
      return;
    }
    setEmailError(null);
    setSubscribed(true);
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>('.fh-reveal');
    if (!items.length) return;

    // If reduced motion, reveal everything immediately
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      items.forEach((el) => el.classList.add('fh-in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fh-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -80px 0px' }
    );

    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Parallax follow — the ELIPSE drifts toward the cursor within each section
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const sections = root.querySelectorAll<HTMLElement>('.fh-how');
    const handlers: Array<{ el: HTMLElement; move: (e: MouseEvent) => void; leave: () => void }> = [];

    sections.forEach((section) => {
      // Max travel in px — small drift so it feels subtle
      const MAX = 30;
      const move = (e: MouseEvent) => {
        const r = section.getBoundingClientRect();
        // Normalized -1..1 from section center
        const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
        section.style.setProperty('--fh-mx', `${(nx * MAX).toFixed(1)}px`);
        section.style.setProperty('--fh-my', `${(ny * MAX).toFixed(1)}px`);
      };
      const leave = () => {
        section.style.setProperty('--fh-mx', '0px');
        section.style.setProperty('--fh-my', '0px');
      };
      section.addEventListener('mousemove', move);
      section.addEventListener('mouseleave', leave);
      handlers.push({ el: section, move, leave });
    });

    return () => {
      handlers.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move);
        el.removeEventListener('mouseleave', leave);
      });
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>LEZGO — Tu DNI es tu entrada. Sin reventas falsas, sin dramas.</title>
        <meta
          name="description"
          content="Ticketing verificado con identidad. Compra tu entrada, se asigna a tu DNI y entra al evento sin QRs transferibles ni reventas falsas."
        />
        <meta name="theme-color" content="#000000" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="LEZGO — Tu DNI es tu entrada" />
        <meta
          property="og:description"
          content="Ticketing verificado con identidad. Sin QRs transferibles, sin reventas falsas, sin dramas."
        />
        <meta property="og:image" content="/figma/phone.png" />
        <meta property="og:site_name" content="LEZGO" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LEZGO — Tu DNI es tu entrada" />
        <meta
          name="twitter:description"
          content="Ticketing verificado con identidad. Sin reventas falsas, sin dramas."
        />
        <meta name="twitter:image" content="/figma/phone.png" />
        <link rel="canonical" href="https://lezgo.fans/" />
      </Helmet>

      <Header />
      <div className="fh-root" ref={rootRef}>

      {/* ====== HERO ====== */}
      <section className="fh-hero">
        <div className="fh-hero-bg" aria-hidden="true">
          <div className="fh-hero-bg-grid" />
          <div className="fh-hero-bg-glow" />
          <div className="fh-hero-bg-dome" />
        </div>
        <div className="fh-hero-inner">
          <div className="fh-badge fh-reveal">
            <span className="fh-badge-dot" />
            <span className="fh-badge-text">ACCESO VERIFICADO CON IDENTIDAD</span>
          </div>

          <h1 className="fh-h1 fh-reveal" data-delay="1">
            COMPRA CON CONFIANZA
            <span className="fh-h1-acid">ENTRA SIN DRAMAS</span>
          </h1>

          <p className="fh-hero-sub fh-reveal" data-delay="3">
            Tu acceso se asigna a tu identidad para que puedas entrar de forma más segura,
            sin capturas ni confusión en la puerta.
          </p>

          <div className="fh-hero-stats fh-reveal" data-delay="4">
            <div className="fh-stat">
              <p className="fh-stat-num">24/7</p>
              <p className="fh-stat-lbl">Transferencias in-app</p>
            </div>
            <span className="fh-stat-divider" />
            <div className="fh-stat">
              <p className="fh-stat-num">0</p>
              <p className="fh-stat-lbl">QRs usados</p>
            </div>
            <span className="fh-stat-divider" />
            <div className="fh-stat">
              <p className="fh-stat-num">100%</p>
              <p className="fh-stat-lbl">Entradas verificadas</p>
            </div>
          </div>

          <div className="fh-hero-ctas fh-reveal" data-delay="5">
            <FhButton to="/eventos">VER EVENTOS</FhButton>
            <FhButton to="/conocenos" variant="outline">CONOCE MÁS</FhButton>
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="fh-section fh-how">
        <div className="fh-section-inner">
          <div className="fh-tag fh-reveal">/ 02</div>
          <h2 className="fh-section-title fh-reveal" data-delay="1">CÓMO FUNCIONA?</h2>

          <div className="fh-steps">
            <article className="fh-step fh-reveal" data-delay="1">
              <p className="fh-step-num">01</p>
              <h3 className="fh-step-title">VERIFICA TU IDENTIDAD</h3>
              <p className="fh-step-body">Escanea tu DNI, carnet de extranjería o pasaporte.</p>
              <FhButton to="/auth" className="fh-step-btn">VERIFICA AQUÍ</FhButton>
            </article>

            <article className="fh-step fh-reveal" data-delay="2">
              <p className="fh-step-num">02</p>
              <h3 className="fh-step-title">COMPRA TU ENTRADA</h3>
              <p className="fh-step-body">
                Tu acceso se asigna automáticamente a tu identidad.
                <br /><br />
                Solo puede moverse desde la app.
              </p>
            </article>

            <article className="fh-step fh-reveal" data-delay="3">
              <p className="fh-step-num">03</p>
              <h3 className="fh-step-title">ESCANEA Y ENTRA</h3>
              <p className="fh-step-body">
                En la puerta escaneas tu identificación para validar tu ingreso.
                <br /><br />
                Sin capturas, sin QR transferibles.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ====== WHY LEZGO ====== */}
      <section className="fh-section fh-why">
        <div className="fh-section-inner">
          <div className="fh-tag fh-reveal">/ 03</div>
          <h2 className="fh-section-title fh-reveal" data-delay="1">POR QUÉ LEZGO?</h2>

          <div className="fh-bento">
            {/* Left column */}
            <div className="fh-bento-left">
              <div className="fh-card fh-card-construye fh-reveal" data-delay="1">
                <div>
                  <h3>
                    CONSTRUYE TU PERFIL<br />DE FAN VERIFICADO
                  </h3>
                  <p>
                    Cada evento al que asistes suma a tu historial dentro de la app
                    y te acerca a beneficios, recompensas y futuras experiencias.
                  </p>
                </div>
              </div>

              <div className="fh-bento-row">
                <div className="fh-card fh-card-spinner fh-reveal" data-delay="3">
                  <div className="fh-spinner-stage">
                    <div className="fh-spinner-disc" aria-hidden="true" />
                    <div className="fh-spinner-rotate" aria-hidden="true">
                      <svg viewBox="0 0 208 208" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <path
                            id="fh-circle-path"
                            fill="none"
                            d="M 104,104 m -75,0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"
                          />
                        </defs>
                        <text
                          fill="#fff"
                          fontFamily="'Big Shoulders Display', 'Arial Black', sans-serif"
                          fontSize="28"
                          fontWeight="900"
                          letterSpacing="1"
                        >
                          <textPath href="#fh-circle-path" startOffset="1%">NO DRAMAS</textPath>
                          <textPath href="#fh-circle-path" startOffset="34.33%">NO DRAMAS</textPath>
                          <textPath href="#fh-circle-path" startOffset="67.66%">NO DRAMAS</textPath>
                        </text>
                      </svg>
                    </div>
                    <img className="fh-spinner-globe" src={IMG.globe} alt="" />
                  </div>
                </div>

                <div className="fh-card fh-card-transfer fh-reveal" data-delay="4">
                  <div className="fh-transfer-content">
                    <h3>TRANSFIERE TU ACCESO DESDE LA APP</h3>
                    <p>Si no puedes ir, lo mueves de forma clara y ordenada.</p>
                    <FhButton to="/reventa" className="fh-transfer-btn" arrowLength={40}>IR AL MARKETPLACE</FhButton>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="fh-bento-right">
              <div className="fh-card fh-card-disenado fh-reveal" data-delay="2">
                <div className="fh-disenado-marquee">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span className="fh-disenado-item" key={i} aria-hidden={i > 0}>
                      Diseñado para fans, no revendedores
                      <img src={IMG.smile} alt="" className="fh-disenado-smile" />
                    </span>
                  ))}
                </div>
              </div>

              <div className="fh-card fh-card-phone fh-reveal" data-delay="5">
                <img src={IMG.rect23} alt="" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== NEWSLETTER ====== */}
      <section className="fh-newsletter">
        <div className="fh-newsletter-inner">
          <div className="fh-newsletter-text fh-reveal">
            <div className="fh-tag">/ NEWSLETTER</div>
            <h2 className="fh-newsletter-title">
              <span className="fh-newsletter-acid">CERO SPAM.</span>
            </h2>
            <p className="fh-newsletter-sub">
              Te escribimos solo cuando la app sale, cuando hay features nuevas
              o cuando ocurre un evento importante. Nada más.
            </p>
          </div>

          <form
            className="fh-newsletter-form fh-reveal"
            data-delay="1"
            onSubmit={handleSubscribe}
            noValidate
          >
            {subscribed ? (
              <div className="fh-newsletter-success" role="status" aria-live="polite">
                <span className="fh-newsletter-success-icon" aria-hidden="true">✓</span>
                <div>
                  <strong>LISTO, TE AVISAMOS.</strong>
                  <p>Revisa tu correo para confirmar.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="fh-newsletter-field">
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    className={`fh-newsletter-input ${emailError ? 'fh-newsletter-input-error' : ''}`}
                    aria-label="Correo electrónico"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'fh-newsletter-error' : undefined}
                  />
                  {emailError && (
                    <span
                      id="fh-newsletter-error"
                      className="fh-newsletter-error"
                      role="alert"
                    >
                      {emailError}
                    </span>
                  )}
                </div>
                <FhButton type="submit" className="fh-newsletter-btn" arrowLength={40}>AVÍSAME</FhButton>
              </>
            )}
          </form>

          {!subscribed && (
            <p className="fh-newsletter-privacy fh-reveal" data-delay="2">
              Puedes darte de baja cuando quieras.
            </p>
          )}
        </div>
      </section>

      {/* ====== FAQ ====== */}
      <section className="fh-faq">
        <div className="fh-faq-inner">
          <div className="fh-faq-head">
            <div className="fh-tag fh-reveal">/ FAQ</div>
            <h2 className="fh-faq-title fh-reveal" data-delay="1">
              PREGUNTAS<br />FRECUENTES
            </h2>
          </div>

          <div className="fh-faq-list fh-reveal" data-delay="2">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className={`fh-faq-item ${isOpen ? 'fh-faq-open' : ''}`}
                >
                  <button
                    type="button"
                    className="fh-faq-q"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <span className="fh-faq-icon" aria-hidden="true">
                      <span className="fh-faq-icon-h" />
                      <span className="fh-faq-icon-v" />
                    </span>
                  </button>
                  <div className="fh-faq-a">
                    <p>{item.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="fh-footer">
        <div className="fh-footer-inner">
          <div className="fh-footer-brand">
            <img src={IMG.lezgo} alt="LEZGO" className="fh-footer-logo" />
            <p className="fh-footer-tagline">
              Ticketing sin fraude. Diseñado para fans, no revendedores.
            </p>
            <div className="fh-footer-socials">
              <a href="https://instagram.com/lezgo.fans" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="https://tiktok.com/@lezgo.fans" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13.2a8.16 8.16 0 005.58 2.2V12a4.85 4.85 0 01-3.58-1.59V6.69h3.58z" />
                </svg>
              </a>
              <a href="https://youtube.com/@lezgofans" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          <div className="fh-footer-col">
            <div className="fh-footer-col-title">Navegación</div>
            <Link to="/eventos">Eventos</Link>
            <Link to="/reventa">Reventa</Link>
            <Link to="/conocenos">Conócenos</Link>
          </div>

          <div className="fh-footer-col">
            <div className="fh-footer-col-title">Legal</div>
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/terminos">Términos</Link>
          </div>

          <div className="fh-footer-col">
            <div className="fh-footer-col-title">Soporte</div>
            <a href="mailto:hola@lezgo.fans">hola@lezgo.fans</a>
            <a href="https://instagram.com/lezgo.fans" target="_blank" rel="noopener noreferrer">Instagram</a>
          </div>
        </div>

        <div className="fh-footer-bottom">
          <span>© {new Date().getFullYear()} LEZGO. Todos los derechos reservados.</span>
          <span>Hecho en Lima, Perú 🇵🇪</span>
        </div>
      </footer>
      </div>
    </>
  );
}
