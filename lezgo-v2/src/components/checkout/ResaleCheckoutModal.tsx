import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { purchaseResale } from '../../services/resaleService';
import { toDate, formatPrice } from '../../lib/helpers';
import type { Resale } from '../../lib/types';
import toast from 'react-hot-toast';
import './ResaleCheckoutModal.css';

type ResaleCheckoutStep = 0 | 1 | 2 | 3 | 4;

interface ResaleCheckoutModalProps {
  resale: Resale | null;
  open: boolean;
  onClose: () => void;
}

const PLATFORM_FEE_PERCENTAGE = 0.05;

export default function ResaleCheckoutModal({
  resale,
  open,
  onClose,
}: ResaleCheckoutModalProps) {
  const { user, profile, loginWithGoogle, sendMagicLink } = useAuth();
  const [step, setStep] = useState<ResaleCheckoutStep>(0);
  const [dni, setDni] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!open || !resale) return null;

  // Determine initial step based on auth state
  const getInitialStep = (): ResaleCheckoutStep => {
    if (!user) return 0;
    if (!profile?.dni) return 2;
    return 1;
  };

  // Calculate totals
  const platformFee = useMemo(() => {
    return resale.askingPrice * PLATFORM_FEE_PERCENTAGE;
  }, [resale.askingPrice]);

  const total = useMemo(() => {
    return resale.askingPrice + platformFee;
  }, [resale.askingPrice, platformFee]);

  // Step 0: Login
  if (step === 0 && !user) {
    const handleGoogleLogin = async () => {
      try {
        setLoading(true);
        await loginWithGoogle();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    const handleMagicLink = async () => {
      if (!email.trim()) {
        toast.error('Ingresa tu email');
        return;
      }

      try {
        setLoading(true);
        await sendMagicLink(email);
        setMagicLinkSent(true);
        toast.success('Link mágico enviado a tu email');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al enviar link';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="rcm-overlay" onClick={onClose}>
        <div className="rcm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="rcm-close" onClick={onClose}>✕</button>
          <div className="rcm-content">
            <h2 className="rcm-title">Inicia sesión</h2>
            <p className="rcm-subtitle">Necesitas estar registrado para comprar</p>

            {!magicLinkSent ? (
              <>
                <div className="rcm-auth-buttons">
                  <button
                    className="rcm-button rcm-button--google"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    🔍 Continuar con Google
                  </button>
                  <div className="rcm-divider">o</div>
                  <input
                    type="email"
                    placeholder="Tu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rcm-input"
                  />
                  <button
                    className="rcm-button rcm-button--magic"
                    onClick={handleMagicLink}
                    disabled={loading || !email.trim()}
                  >
                    ✨ Enviar link mágico
                  </button>
                </div>
              </>
            ) : (
              <div className="rcm-message">
                <p>Revisa tu email para el link de acceso</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Initialize step if user just logged in
  if (step === 0 && user) {
    const initialStep = getInitialStep();
    if (initialStep !== 0) {
      setStep(initialStep);
      return null;
    }
  }

  if (!user) return null;

  // Step 1: Review Listing
  if (step === 1) {
    return (
      <div className="rcm-overlay" onClick={onClose}>
        <div className="rcm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="rcm-close" onClick={onClose}>✕</button>
          <div className="rcm-progress">
            <div className="rcm-dot active"></div>
            <div className="rcm-dot"></div>
            <div className="rcm-dot"></div>
            <div className="rcm-dot"></div>
          </div>

          <div className="rcm-content">
            <h2 className="rcm-title">Revisa el listado</h2>

            <div className="rcm-listing-card">
              <div className="rcm-card-image">
                <img src={resale.image} alt={resale.eventName} />
              </div>

              <div className="rcm-card-details">
                <h3 className="rcm-event-name">{resale.eventName}</h3>
                <p className="rcm-event-meta">
                  {toDate(resale.eventDate).toLocaleDateString('es-PE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
                <p className="rcm-event-venue">{resale.eventVenue}</p>

                <div className="rcm-ticket-info">
                  <p className="rcm-ticket-tier">{resale.ticketTier}</p>
                </div>

                <div className="rcm-pricing">
                  <div className="rcm-price-row">
                    <span>Precio original</span>
                    <span className="rcm-price-original">
                      {formatPrice(resale.originalPrice)}
                    </span>
                  </div>
                  <div className="rcm-price-row rcm-price-row--asking">
                    <span>Precio de venta</span>
                    <span className="rcm-price-asking">
                      {formatPrice(resale.askingPrice)}
                    </span>
                  </div>
                </div>

                <div className="rcm-seller-info">
                  <span className="rcm-seller-label">Vendedor verificado</span>
                  <div className="rcm-seller">
                    <span className="rcm-seller-name">{resale.sellerName}</span>
                    <span className="rcm-seller-badge">✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rcm-actions">
              <button
                className="rcm-button rcm-button--secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                className="rcm-button rcm-button--primary"
                onClick={() => setStep(2)}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: DNI Verification
  if (step === 2) {
    const isFormValid = name.trim() && dni.length === 8;

    return (
      <div className="rcm-overlay" onClick={onClose}>
        <div className="rcm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="rcm-close" onClick={onClose}>✕</button>
          <div className="rcm-progress">
            <div className="rcm-dot completed"></div>
            <div className="rcm-dot active"></div>
            <div className="rcm-dot"></div>
            <div className="rcm-dot"></div>
          </div>

          <div className="rcm-content">
            <h2 className="rcm-title">Verificación de identidad</h2>
            <p className="rcm-subtitle">Necesitamos validar tu identidad</p>

            <div className="rcm-form">
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rcm-input"
              />
              <input
                type="text"
                placeholder="DNI (8 dígitos)"
                value={dni}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setDni(val);
                }}
                maxLength={8}
                className="rcm-input"
              />
              <p className="rcm-form-hint">Tu información está protegida y encriptada</p>
            </div>

            <div className="rcm-actions">
              <button
                className="rcm-button rcm-button--secondary"
                onClick={() => setStep(1)}
              >
                Atrás
              </button>
              <button
                className="rcm-button rcm-button--primary"
                onClick={() => setStep(3)}
                disabled={!isFormValid}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation & Purchase
  if (step === 3) {
    const handlePurchase = async () => {
      if (!user?.email) {
        toast.error('Error: email no disponible');
        return;
      }

      try {
        setLoading(true);
        await purchaseResale({
          resaleId: resale.id,
          buyerId: user.uid,
          buyerEmail: user.email,
        });

        toast.success('¡Entrada comprada exitosamente!');
        setStep(4);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error en la compra';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="rcm-overlay" onClick={onClose}>
        <div className="rcm-modal rcm-modal--large" onClick={(e) => e.stopPropagation()}>
          <button className="rcm-close" onClick={onClose}>✕</button>
          <div className="rcm-progress">
            <div className="rcm-dot completed"></div>
            <div className="rcm-dot completed"></div>
            <div className="rcm-dot active"></div>
            <div className="rcm-dot"></div>
          </div>

          <div className="rcm-content">
            <h2 className="rcm-title">Resumen de compra</h2>

            <div className="rcm-summary">
              <div className="rcm-summary-section">
                <h3 className="rcm-section-title">Entrada</h3>
                <div className="rcm-summary-row">
                  <span>{resale.eventName}</span>
                  <span>{resale.ticketTier}</span>
                </div>
              </div>

              <div className="rcm-summary-section">
                <h3 className="rcm-section-title">Precio</h3>
                <div className="rcm-summary-row">
                  <span>Precio de venta</span>
                  <span>{formatPrice(resale.askingPrice)}</span>
                </div>
                <div className="rcm-summary-row rcm-summary-row--fee">
                  <span>Comisión (5%)</span>
                  <span>{formatPrice(platformFee)}</span>
                </div>
                <div className="rcm-summary-row rcm-summary-row--total">
                  <span>Total a pagar</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="rcm-summary-section">
                <h3 className="rcm-section-title">Vendedor</h3>
                <div className="rcm-summary-seller">
                  <span className="rcm-summary-seller-name">{resale.sellerName}</span>
                  <span className="rcm-summary-seller-badge">✓ Verificado</span>
                </div>
              </div>
            </div>

            <div className="rcm-info-box">
              <p>Después de completar tu compra, la entrada se transferirá automáticamente a tu cuenta.</p>
            </div>

            <div className="rcm-actions">
              <button
                className="rcm-button rcm-button--secondary"
                onClick={() => setStep(2)}
                disabled={loading}
              >
                Atrás
              </button>
              <button
                className="rcm-button rcm-button--primary"
                onClick={handlePurchase}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Comprar entrada'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Confirmation Success
  if (step === 4) {
    return (
      <div className="rcm-overlay" onClick={onClose}>
        <div className="rcm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="rcm-close" onClick={onClose}>✕</button>
          <div className="rcm-progress">
            <div className="rcm-dot completed"></div>
            <div className="rcm-dot completed"></div>
            <div className="rcm-dot completed"></div>
            <div className="rcm-dot completed"></div>
          </div>

          <div className="rcm-content rcm-content--centered">
            <div className="rcm-success-icon">✓</div>
            <h2 className="rcm-title">¡Compra confirmada!</h2>
            <p className="rcm-subtitle">Tu entrada ha sido transferida a tu cuenta</p>

            <div className="rcm-confirmation-details">
              <div className="rcm-detail">
                <span className="rcm-detail-label">Evento</span>
                <span className="rcm-detail-value">{resale.eventName}</span>
              </div>
              <div className="rcm-detail">
                <span className="rcm-detail-label">Fecha</span>
                <span className="rcm-detail-value">
                  {toDate(resale.eventDate).toLocaleDateString('es-PE', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="rcm-detail">
                <span className="rcm-detail-label">Total pagado</span>
                <span className="rcm-detail-value rcm-detail-value--highlight">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <div className="rcm-actions">
              <button
                className="rcm-button rcm-button--primary"
                onClick={onClose}
              >
                Ir a mis entradas
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
