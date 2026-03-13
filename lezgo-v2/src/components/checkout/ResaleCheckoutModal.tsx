import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { purchaseResale } from '../../services/resaleService';
import { toDate, formatPrice } from '../../lib/helpers';
import { useTranslation } from '../../i18n';
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
  const { t } = useTranslation();
  const [step, setStep] = useState<ResaleCheckoutStep>(0);
  const [dni, setDni] = useState('');
  const [idType, setIdType] = useState<'dni' | 'ce' | 'pasaporte'>('dni');
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
        const msg = err instanceof Error ? err.message : t.resaleCheckout.errorLogin;
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    const handleMagicLink = async () => {
      if (!email.trim()) {
        toast.error(t.resaleCheckout.errorEmail);
        return;
      }

      try {
        setLoading(true);
        await sendMagicLink(email);
        setMagicLinkSent(true);
        toast.success(t.resaleCheckout.successMagicLink);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.resaleCheckout.errorSendLink;
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
            <h2 className="rcm-title">{t.resaleCheckout.loginTitle}</h2>
            <p className="rcm-subtitle">{t.resaleCheckout.loginDesc}</p>

            {!magicLinkSent ? (
              <>
                <div className="rcm-auth-buttons">
                  <button
                    className="rcm-button rcm-button--google"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    🔍 {t.resaleCheckout.googleBtn}
                  </button>
                  <div className="rcm-divider">{t.resaleCheckout.divider}</div>
                  <input
                    type="email"
                    placeholder={t.resaleCheckout.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rcm-input"
                  />
                  <button
                    className="rcm-button rcm-button--magic"
                    onClick={handleMagicLink}
                    disabled={loading || !email.trim()}
                  >
                    ✨ {t.resaleCheckout.magicLinkBtn}
                  </button>
                </div>
              </>
            ) : (
              <div className="rcm-message">
                <p>{t.resaleCheckout.checkEmail}</p>
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
            <h2 className="rcm-title">{t.resaleCheckout.reviewTitle}</h2>

            <div className="rcm-listing-card">
              <div className="rcm-card-image">
                <img src={resale.image || ''} alt={resale.eventName || ''} />
              </div>

              <div className="rcm-card-details">
                <h3 className="rcm-event-name">{resale.eventName || 'Event'}</h3>
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
                    <span>{t.resaleCheckout.originalPrice}</span>
                    <span className="rcm-price-original">
                      {formatPrice(resale.originalPrice)}
                    </span>
                  </div>
                  <div className="rcm-price-row rcm-price-row--asking">
                    <span>{t.resaleCheckout.askingPrice}</span>
                    <span className="rcm-price-asking">
                      {formatPrice(resale.askingPrice)}
                    </span>
                  </div>
                </div>

                <div className="rcm-seller-info">
                  <span className="rcm-seller-label">{t.resaleCheckout.sellerVerified}</span>
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
                {t.common.cancel}
              </button>
              <button
                className="rcm-button rcm-button--primary"
                onClick={() => setStep(2)}
              >
                {t.common.next}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: DNI Verification
  if (step === 2) {
    const isFormValid = name.trim() && (idType === 'dni' ? dni.length === 8 : idType === 'ce' ? dni.length === 9 : dni.length >= 5);

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
            <h2 className="rcm-title">{t.resaleCheckout.verifyTitle}</h2>
            <p className="rcm-subtitle">{t.resaleCheckout.verifyDesc}</p>

            <div className="rcm-form">
              <input
                type="text"
                placeholder={t.resaleCheckout.fullNamePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rcm-input"
              />
              <select
                value={idType}
                onChange={(e) => { setIdType(e.target.value as 'dni' | 'ce' | 'pasaporte'); setDni(''); }}
                className="rcm-input rcm-select"
              >
                <option value="dni">{t.resaleCheckout.idTypeDni}</option>
                <option value="ce">{t.resaleCheckout.idTypeCe}</option>
                <option value="pasaporte">{t.resaleCheckout.idTypePassport}</option>
              </select>
              <input
                type="text"
                placeholder={
                  idType === 'dni' ? t.resaleCheckout.dniPlaceholder :
                  idType === 'ce' ? t.resaleCheckout.cePlaceholder :
                  t.resaleCheckout.passportPlaceholder
                }
                value={dni}
                onChange={(e) => {
                  if (idType === 'pasaporte') {
                    setDni(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12));
                  } else {
                    const maxLen = idType === 'dni' ? 8 : 9;
                    setDni(e.target.value.replace(/\D/g, '').slice(0, maxLen));
                  }
                }}
                maxLength={idType === 'pasaporte' ? 12 : idType === 'ce' ? 9 : 8}
                className="rcm-input"
              />
              <p className="rcm-form-hint">{t.resaleCheckout.formHint}</p>
            </div>

            <div className="rcm-actions">
              <button
                className="rcm-button rcm-button--secondary"
                onClick={() => setStep(1)}
              >
                {t.common.back}
              </button>
              <button
                className="rcm-button rcm-button--primary"
                onClick={() => setStep(3)}
                disabled={!isFormValid}
              >
                {t.common.next}
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
        toast.error(t.resaleCheckout.errorEmail);
        return;
      }

      try {
        setLoading(true);
        await purchaseResale({
          resaleId: resale.id,
          buyerId: user.uid,
          buyerEmail: user.email,
        });

        toast.success(t.resaleCheckout.purchaseSuccess);
        setStep(4);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.resaleCheckout.errorPurchase;
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
            <h2 className="rcm-title">{t.resaleCheckout.summaryTitle}</h2>

            <div className="rcm-summary">
              <div className="rcm-summary-section">
                <h3 className="rcm-section-title">{t.resaleCheckout.ticketLabel}</h3>
                <div className="rcm-summary-row">
                  <span>{resale.eventName}</span>
                  <span>{resale.ticketTier}</span>
                </div>
              </div>

              <div className="rcm-summary-section">
                <h3 className="rcm-section-title">{t.resaleCheckout.priceLabel}</h3>
                <div className="rcm-summary-row">
                  <span>{t.resaleCheckout.askingPrice}</span>
                  <span>{formatPrice(resale.askingPrice)}</span>
                </div>
                <div className="rcm-summary-row rcm-summary-row--fee">
                  <span>{t.resaleCheckout.feeLabel}</span>
                  <span>{formatPrice(platformFee)}</span>
                </div>
                <div className="rcm-summary-row rcm-summary-row--total">
                  <span>{t.resaleCheckout.totalLabel}</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="rcm-summary-section">
                <h3 className="rcm-section-title">{t.resaleCheckout.sellerLabel}</h3>
                <div className="rcm-summary-seller">
                  <span className="rcm-summary-seller-name">{resale.sellerName}</span>
                  <span className="rcm-summary-seller-badge">✓ {t.resaleCheckout.verified}</span>
                </div>
              </div>
            </div>

            <div className="rcm-info-box">
              <p>{t.resaleCheckout.infoMessage}</p>
            </div>

            <div className="rcm-actions">
              <button
                className="rcm-button rcm-button--secondary"
                onClick={() => setStep(2)}
                disabled={loading}
              >
                {t.common.back}
              </button>
              <button
                className="rcm-button rcm-button--primary"
                onClick={handlePurchase}
                disabled={loading}
              >
                {loading ? t.resaleCheckout.processing : t.resaleCheckout.buyBtn}
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
            <h2 className="rcm-title">{t.resaleCheckout.confirmTitle}</h2>
            <p className="rcm-subtitle">{t.resaleCheckout.confirmDesc}</p>

            <div className="rcm-confirmation-details">
              <div className="rcm-detail">
                <span className="rcm-detail-label">{t.resaleCheckout.eventLabel}</span>
                <span className="rcm-detail-value">{resale.eventName}</span>
              </div>
              <div className="rcm-detail">
                <span className="rcm-detail-label">{t.resaleCheckout.dateLabel}</span>
                <span className="rcm-detail-value">
                  {toDate(resale.eventDate).toLocaleDateString('es-PE', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="rcm-detail">
                <span className="rcm-detail-label">{t.resaleCheckout.totalPaidLabel}</span>
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
                {t.resaleCheckout.goToTickets}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
