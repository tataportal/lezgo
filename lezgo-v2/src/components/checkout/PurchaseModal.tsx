import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { validateCoupon } from '../../services/couponService';
import { purchaseTickets } from '../../services/ticketService';
import { useTranslation } from '../../i18n';
import type { Event, EventTier, EventPhase } from '../../lib/types';
import toast from 'react-hot-toast';
import './PurchaseModal.css';

type PurchaseStep = 0 | 1 | 2 | 3 | 4;

interface PurchaseModalProps {
  event: Event | null;
  open: boolean;
  onClose: () => void;
}

const formatPrice = (n: number) => `S/ ${n.toLocaleString('es-PE')}`;

const formatDate = (dateStr: any) => {
  const date = dateStr instanceof Date ? dateStr : dateStr.toDate?.() || new Date(dateStr);
  return date.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

function getActivePhase(tier: EventTier): EventPhase | null {
  if (!tier.phases || tier.phases.length === 0) return null;
  let cumulativeSold = 0;
  for (const phase of tier.phases) {
    if (phase.active) {
      // Calculate cumulative capacity for this phase
      const phaseIndex = tier.phases.indexOf(phase);
      const previousCapacity = tier.phases
        .slice(0, phaseIndex)
        .reduce((sum, _p) => {
      // pIndex is calculated but not used - kept for clarity
          return sum + Math.ceil(tier.capacity / tier.phases.length);
        }, 0);

      if (cumulativeSold >= previousCapacity && cumulativeSold < previousCapacity + Math.ceil(tier.capacity / tier.phases.length)) {
        return phase;
      }
    }
    cumulativeSold += Math.ceil(tier.capacity / tier.phases.length);
  }
  return tier.phases.find((p) => p.active) || null;
}

export function PurchaseModal({ event, open, onClose }: PurchaseModalProps) {
  const { user, profile, loginWithGoogle, sendMagicLink } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState<PurchaseStep>(0);
  const [quantities, setQuantities] = useState<{ [tierId: string]: number }>({});
  const [name, setName] = useState('');
  const [idType, setIdType] = useState<'dni' | 'ce' | 'pasaporte'>('dni');
  const [dni, setDni] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize step based on user auth
  const getInitialStep = (): PurchaseStep => {
    if (!user) return 0;
    if (!profile?.dni) return 2;
    return 1;
  };

  // Calculate totals
  const subtotal = useMemo(() => {
    if (!event) return 0;
    return (event.tiers || []).reduce((sum, tier) => {
      const qty = quantities[tier.id] || 0;
      const activePhase = getActivePhase(tier);
      return sum + (activePhase?.price || 0) * qty;
    }, 0);
  }, [event, quantities]);

  const discount = useMemo(() => {
    return subtotal * couponDiscount;
  }, [subtotal, couponDiscount]);

  const fees = subtotal > 0 && discount < subtotal ? (subtotal - discount) * 0.083 : 0;
  const total = subtotal - discount + fees;

  // Step 0: Login
  if (step === 0 && open && !user) {
    const handleGoogleLogin = async () => {
      try {
        setLoading(true);
        await loginWithGoogle();
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.purchase.errorLogin;
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    const handleMagicLink = async () => {
      if (!magicEmail.trim()) {
        toast.error(t.purchase.errorEmail);
        return;
      }
      try {
        setLoading(true);
        await sendMagicLink(magicEmail);
        setMagicLinkSent(true);
        toast.success(t.purchase.linkSent);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.purchase.errorSendLink;
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="pm-close" onClick={onClose}>✕</button>
          <div className="pm-content">
            <h2 className="pm-title">{t.purchase.loginTitle}</h2>
            <p className="pm-subtitle">{t.purchase.loginDesc}</p>

            {!magicLinkSent ? (
              <div className="pm-auth-buttons">
                <button
                  className="pm-button pm-button--google"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  {t.purchase.googleBtn}
                </button>
                <div style={{ textAlign: 'center', color: '#666', margin: '12px 0' }}>{t.purchase.or}</div>
                <input
                  type="email"
                  placeholder={t.purchase.emailPlaceholder}
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  className="pm-input"
                  style={{ marginBottom: '8px' }}
                />
                <button
                  className="pm-button pm-button--magic"
                  onClick={handleMagicLink}
                  disabled={loading || !magicEmail.trim()}
                >
                  {t.purchase.sendMagicLink}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>
                <p>{t.purchase.checkEmail}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!open || !event || !user) return null;

  // Initialize step properly
  if (step === 0 && user) {
    setStep(getInitialStep());
    return null;
  }

  const handleAddQty = (tierId: string) => {
    const currentQty = quantities[tierId] || 0;
    if (currentQty < 6) {
      setQuantities({ ...quantities, [tierId]: currentQty + 1 });
    }
  };

  const handleRemoveQty = (tierId: string) => {
    const currentQty = quantities[tierId] || 0;
    if (currentQty > 0) {
      setQuantities({ ...quantities, [tierId]: currentQty - 1 });
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error(t.purchase.couponLabel);
      return;
    }

    setLoading(true);
    try {
      const result = await validateCoupon(couponCode);
      if (result.valid && result.discount) {
        setCouponDiscount(result.discount);
        setCouponApplied(true);
        toast.success(t.purchase.couponApplied);
      } else {
        toast.error(result.error || t.purchase.couponInvalid);
      }
    } catch (error) {
      toast.error(t.purchase.couponError);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (step !== 3) return;

    const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0);
    if (totalQty === 0) {
      toast.error('Selecciona al menos una entrada');
      return;
    }

    setLoading(true);
    try {
      const purchaseInput = {
        eventId: event.id,
        eventName: event.name,
        eventDate: event.date,
        eventDateLabel: event.dateLabel,
        eventTimeStart: '20:00',
        eventTimeEnd: '06:00',
        eventVenue: event.venue,
        eventLocation: event.location,
        userId: user.uid,
        userEmail: user.email || '',
        userDni: dni,
        userName: name,
        quantities: (event.tiers || [])
          .filter((tier) => (quantities[tier.id] || 0) > 0)
          .map((tier) => ({
            tierId: tier.id,
            tierName: tier.name,
            quantity: quantities[tier.id],
          })),
        couponCode: couponApplied ? couponCode : undefined,
      };

      await purchaseTickets(purchaseInput);
      setStep(4);
      toast.success('¡Entradas compradas exitosamente!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error en la compra';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Ticket Selection
  if (step === 1) {
    const totalQty = Object.values(quantities).reduce((a, b) => a + b, 0);
    return (
      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="pm-close" onClick={onClose}>✕</button>
          <div className="pm-progress">
            <div className="pm-dot active"></div>
            <div className="pm-dot"></div>
            <div className="pm-dot"></div>
            <div className="pm-dot"></div>
          </div>

          <div className="pm-content">
            <h2 className="pm-title">{t.purchase.selectTickets}</h2>
            <p className="pm-subtitle">{event.name}</p>

            <div className="pm-tiers">
              {(event.tiers || []).map((tier) => {
                const activePhase = getActivePhase(tier);
                const available = tier.capacity - tier.sold;
                const currentQty = quantities[tier.id] || 0;

                return (
                  <div key={tier.id} className="pm-tier-card">
                    <div className="pm-tier-info">
                      <h3 className="pm-tier-name">{tier.name}</h3>
                      <p className="pm-tier-price">{formatPrice(activePhase?.price || 0)}</p>
                      <p className="pm-tier-available">
                        {available > 0 ? `${available} ${t.purchase.available}` : t.purchase.soldOutLabel}
                      </p>
                    </div>
                    {available > 0 && (
                      <div className="pm-qty-selector">
                        <button
                          className="pm-qty-btn"
                          onClick={() => handleRemoveQty(tier.id)}
                          disabled={currentQty === 0}
                        >
                          −
                        </button>
                        <span className="pm-qty-display">{currentQty}</span>
                        <button
                          className="pm-qty-btn"
                          onClick={() => handleAddQty(tier.id)}
                          disabled={currentQty >= 6 || currentQty >= available}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pm-actions">
              <button
                className="pm-button pm-button--secondary"
                onClick={() => setStep(0)}
              >
                {t.common.back}
              </button>
              <button
                className="pm-button pm-button--primary"
                onClick={() => setStep(2)}
                disabled={totalQty === 0}
              >
                {t.common.continue}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: DNI Verification
  if (step === 2) {
    return (
      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="pm-close" onClick={onClose}>✕</button>
          <div className="pm-progress">
            <div className="pm-dot completed"></div>
            <div className="pm-dot active"></div>
            <div className="pm-dot"></div>
            <div className="pm-dot"></div>
          </div>

          <div className="pm-content">
            <h2 className="pm-title">{t.purchase.verifyTitle}</h2>
            <p className="pm-subtitle">{t.purchase.verifyDesc}</p>

            <div className="pm-form">
              <input
                type="text"
                placeholder={t.purchase.fullNamePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pm-input"
              />
              <select
                value={idType}
                onChange={(e) => { setIdType(e.target.value as 'dni' | 'ce' | 'pasaporte'); setDni(''); }}
                className="pm-input pm-select"
              >
                <option value="dni">{t.purchase.dniLabel}</option>
                <option value="ce">{t.purchase.carnetLabel}</option>
                <option value="pasaporte">{t.purchase.passportLabel}</option>
              </select>
              <input
                type="text"
                placeholder={
                  idType === 'dni' ? t.purchase.dniPlaceholder :
                  idType === 'ce' ? t.purchase.carnetPlaceholder :
                  t.purchase.passportPlaceholder
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
                className="pm-input"
              />
            </div>

            <div className="pm-actions">
              <button
                className="pm-button pm-button--secondary"
                onClick={() => setStep(1)}
              >
                {t.common.back}
              </button>
              <button
                className="pm-button pm-button--primary"
                onClick={() => setStep(3)}
                disabled={!name.trim() || (idType === 'dni' ? dni.length !== 8 : idType === 'ce' ? dni.length !== 9 : dni.length < 5)}
              >
                {t.common.continue}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Coupon & Summary
  if (step === 3) {
    return (
      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal pm-modal--large" onClick={(e) => e.stopPropagation()}>
          <button className="pm-close" onClick={onClose}>✕</button>
          <div className="pm-progress">
            <div className="pm-dot completed"></div>
            <div className="pm-dot completed"></div>
            <div className="pm-dot active"></div>
            <div className="pm-dot"></div>
          </div>

          <div className="pm-content">
            <h2 className="pm-title">{t.purchase.couponTitle}</h2>

            <div className="pm-coupon-section">
              <h3 className="pm-section-title">{t.purchase.couponLabel}</h3>
              <div className="pm-coupon-input-group">
                <input
                  type="text"
                  placeholder={t.purchase.couponPlaceholder}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={couponApplied}
                  className="pm-coupon-input"
                />
                {!couponApplied && (
                  <button
                    className="pm-button pm-button--secondary pm-button--sm"
                    onClick={handleApplyCoupon}
                    disabled={loading || !couponCode.trim()}
                  >
                    {loading ? t.purchase.validating : t.purchase.apply}
                  </button>
                )}
                {couponApplied && (
                  <button
                    className="pm-button pm-button--danger pm-button--sm"
                    onClick={() => {
                      setCouponCode('');
                      setCouponApplied(false);
                      setCouponDiscount(0);
                    }}
                  >
                    {t.purchase.remove}
                  </button>
                )}
              </div>
            </div>

            <div className="pm-summary">
              <h3 className="pm-section-title">{t.purchase.orderSummary}</h3>
              <div className="pm-summary-row">
                <span>{t.purchase.subtotal}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="pm-summary-row pm-summary-row--discount">
                  <span>{t.purchase.discount} ({(couponDiscount * 100).toFixed(0)}%)</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              {subtotal > 0 && discount < subtotal && (
                <>
                  <div className="pm-summary-row pm-summary-row--fees">
                    <span>{t.purchase.feePlatform}</span>
                    <span>{formatPrice((subtotal - discount) * 0.033)}</span>
                  </div>
                  <div className="pm-summary-row pm-summary-row--fees">
                    <span>{t.purchase.feeVerification}</span>
                    <span>{formatPrice((subtotal - discount) * 0.021)}</span>
                  </div>
                  <div className="pm-summary-row pm-summary-row--fees">
                    <span>{t.purchase.feeProcessing}</span>
                    <span>{formatPrice((subtotal - discount) * 0.029)}</span>
                  </div>
                </>
              )}
              <div className="pm-summary-row pm-summary-row--total">
                <span>{t.purchase.total}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="pm-actions">
              <button
                className="pm-button pm-button--secondary"
                onClick={() => setStep(2)}
              >
                {t.common.back}
              </button>
              <button
                className="pm-button pm-button--primary"
                onClick={handlePurchase}
                disabled={loading}
              >
                {loading ? t.common.processing : t.purchase.buyTickets}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Confirmation
  if (step === 4) {
    return (
      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="pm-close" onClick={onClose}>✕</button>
          <div className="pm-progress">
            <div className="pm-dot completed"></div>
            <div className="pm-dot completed"></div>
            <div className="pm-dot completed"></div>
            <div className="pm-dot completed"></div>
          </div>

          <div className="pm-content pm-content--centered">
            <div className="pm-success-icon">✓</div>
            <h2 className="pm-title">{t.purchase.confirmTitle}</h2>
            <p className="pm-subtitle">{t.purchase.confirmDesc}</p>

            <div className="pm-confirmation-details">
              <div className="pm-detail">
                <span className="pm-detail-label">{t.purchase.eventLabel}</span>
                <span className="pm-detail-value">{event.name}</span>
              </div>
              <div className="pm-detail">
                <span className="pm-detail-label">{t.purchase.dateLabel}</span>
                <span className="pm-detail-value">{formatDate(event.date)}</span>
              </div>
              <div className="pm-detail">
                <span className="pm-detail-label">{t.purchase.ticketsLabel}</span>
                <span className="pm-detail-value">
                  {Object.values(quantities).reduce((a, b) => a + b, 0)} {t.myTickets.tickets}
                </span>
              </div>
              <div className="pm-detail">
                <span className="pm-detail-label">{t.purchase.totalPaid}</span>
                <span className="pm-detail-value pm-detail-value--highlight">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="pm-actions">
              <button
                className="pm-button pm-button--primary"
                onClick={onClose}
              >
                {t.purchase.goToTickets}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
