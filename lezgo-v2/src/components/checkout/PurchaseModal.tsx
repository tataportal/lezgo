import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateCoupon } from '../../services/couponService';
import { purchaseTickets } from '../../services/ticketService';
import { useTranslation } from '../../i18n';
import { formatPrice, toDate, getActivePhase, LOCALE_MAP } from '../../lib/helpers';
import { FEES, sanitizeIdInput, isValidId, ID_CONFIG, type IdType } from '../../lib/constants';
import type { Event } from '../../lib/types';
import toast from 'react-hot-toast';
import './PurchaseModal.css';

type PurchaseStep = 0 | 1 | 2 | 3 | 4;

interface PurchaseModalProps {
  event: Event | null;
  open: boolean;
  onClose: () => void;
}

export function PurchaseModal({ event, open, onClose }: PurchaseModalProps) {
  const { user, profile, loginWithGoogle, sendMagicLink, updateProfile } = useAuth();
  const { t, lang } = useTranslation();
  const locale = LOCALE_MAP[lang] || 'es-PE';
  const navigate = useNavigate();
  const [step, setStep] = useState<PurchaseStep>(0);
  const [quantities, setQuantities] = useState<{ [tierId: string]: number }>({});
  const [name, setName] = useState('');
  const [idType, setIdType] = useState<IdType>('dni');
  const [dni, setDni] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<{ badgeNumber: number; badgeType: string }[]>([]);

  // Reset all state when modal opens
  useEffect(() => {
    if (open) {
      setStep(0);
      setQuantities({});
      setName('');
      setIdType('dni');
      setDni('');
      setMagicEmail('');
      setMagicLinkSent(false);
      setCouponCode('');
      setCouponDiscount(0);
      setCouponApplied(false);
      setEarnedBadges([]);
      setLoading(false);
    }
  }, [open]);

  // Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);

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

  const fees = subtotal > 0 && discount < subtotal ? (subtotal - discount) * FEES.DIRECT_TOTAL : 0;
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
          <button className="pm-close" onClick={onClose} aria-label={t.common.close}>✕</button>
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
      toast.error(t.purchase.errorNoTickets || 'Selecciona al menos una entrada');
      return;
    }

    setLoading(true);
    try {
      // Only send minimal data — server reads event, user profile, and prices from Firestore
      const purchaseInput = {
        eventId: event.id,
        quantities: (event.tiers || [])
          .filter((tier) => (quantities[tier.id] || 0) > 0)
          .map((tier) => ({
            tierId: tier.id,
            tierName: tier.name,
            quantity: quantities[tier.id],
          })),
        couponCode: couponApplied ? couponCode : undefined,
      };

      const result = await purchaseTickets(purchaseInput);
      if (result.badges && result.badges.length > 0) {
        setEarnedBadges(result.badges.map((b: any) => ({ badgeNumber: b.badgeNumber, badgeType: b.badgeType })));
      }
      setStep(4);
      toast.success(subtotal === 0 ? t.purchase.reserveSuccess : t.purchase.purchaseSuccess);
    } catch (error) {
      const msg = error instanceof Error ? error.message : (t.purchase.errorGeneric || 'Error en la compra');
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
          <button className="pm-close" onClick={onClose} aria-label={t.common.close}>✕</button>
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
          <button className="pm-close" onClick={onClose} aria-label={t.common.close}>✕</button>
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
                onChange={(e) => { setIdType(e.target.value as IdType); setDni(''); }}
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
                onChange={(e) => setDni(sanitizeIdInput(e.target.value, idType))}
                maxLength={ID_CONFIG[idType].maxLength}
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
                onClick={async () => {
                  // Save DNI to user profile so the server can read it during purchase
                  try {
                    await updateProfile({ displayName: name.trim(), dni: dni.trim() });
                  } catch {
                    // Profile update failed but don't block — server will validate
                  }
                  setStep(3);
                }}
                disabled={!name.trim() || !isValidId(dni, idType)}
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
    const isFree = subtotal === 0;
    return (
      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal pm-modal--large" onClick={(e) => e.stopPropagation()}>
          <button className="pm-close" onClick={onClose} aria-label={t.common.close}>✕</button>
          <div className="pm-progress">
            <div className="pm-dot completed"></div>
            <div className="pm-dot completed"></div>
            <div className="pm-dot active"></div>
            <div className="pm-dot"></div>
          </div>

          <div className="pm-content">
            <h2 className="pm-title">{isFree ? t.purchase.summaryTitle : t.purchase.couponTitle}</h2>

            {/* Only show coupon section when tickets have a price */}
            {!isFree && (
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
            )}

            <div className="pm-summary">
              <h3 className="pm-section-title">{t.purchase.orderSummary}</h3>

              {/* Show selected tickets */}
              {(event.tiers || []).filter((tier) => (quantities[tier.id] || 0) > 0).map((tier) => {
                const qty = quantities[tier.id] || 0;
                const activePhase = getActivePhase(tier);
                return (
                  <div key={tier.id} className="pm-summary-row">
                    <span>{tier.name} x{qty}</span>
                    <span>{formatPrice((activePhase?.price || 0) * qty)}</span>
                  </div>
                );
              })}

              {!isFree && (
                <>
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
                  {discount < subtotal && (
                    <>
                      <div className="pm-summary-row pm-summary-row--fees">
                        <span>{t.purchase.feePlatform}</span>
                        <span>{formatPrice((subtotal - discount) * FEES.DIRECT_PLATFORM)}</span>
                      </div>
                      <div className="pm-summary-row pm-summary-row--fees">
                        <span>{t.purchase.feeVerification}</span>
                        <span>{formatPrice((subtotal - discount) * FEES.DIRECT_VERIFY)}</span>
                      </div>
                      <div className="pm-summary-row pm-summary-row--fees">
                        <span>{t.purchase.feeProcessing}</span>
                        <span>{formatPrice((subtotal - discount) * FEES.DIRECT_PROCESSING)}</span>
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="pm-summary-row pm-summary-row--total">
                <span>{t.purchase.total}</span>
                <span>{isFree ? t.common.free : formatPrice(total)}</span>
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
                {loading ? t.common.processing : (isFree ? t.purchase.reserveTickets : t.purchase.buyTickets)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Confirmation
  if (step === 4) {
    const isFree = total === 0;
    return (
      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="pm-close" onClick={onClose} aria-label={t.common.close}>✕</button>
          <div className="pm-progress">
            <div className="pm-dot completed"></div>
            <div className="pm-dot completed"></div>
            <div className="pm-dot completed"></div>
            <div className="pm-dot completed"></div>
          </div>

          <div className="pm-content pm-content--centered">
            <div className="pm-success-icon">✓</div>
            <h2 className="pm-title">{isFree ? t.purchase.reserveConfirmTitle : t.purchase.confirmTitle}</h2>
            <p className="pm-subtitle">{isFree ? t.purchase.reserveConfirmDesc : t.purchase.confirmDesc}</p>

            <div className="pm-confirmation-details">
              <div className="pm-detail">
                <span className="pm-detail-label">{t.purchase.eventLabel}</span>
                <span className="pm-detail-value">{event.name}</span>
              </div>
              <div className="pm-detail">
                <span className="pm-detail-label">{t.purchase.dateLabel}</span>
                <span className="pm-detail-value">{toDate(event.date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="pm-detail">
                <span className="pm-detail-label">{t.purchase.ticketsLabel}</span>
                <span className="pm-detail-value">
                  {Object.values(quantities).reduce((a, b) => a + b, 0)} {t.myTickets.tickets}
                </span>
              </div>
              <div className="pm-detail">
                <span className="pm-detail-label">{isFree ? t.purchase.priceLabel : t.purchase.totalPaid}</span>
                <span className="pm-detail-value pm-detail-value--highlight">
                  {isFree ? t.common.free : formatPrice(total)}
                </span>
              </div>
            </div>

            {earnedBadges.length > 0 && (
              <div className="pm-badge-reveal">
                <div className="pm-badge-reveal__icon">⚡</div>
                <div className="pm-badge-reveal__title">Early Adopter Badge</div>
                <div className="pm-badge-reveal__number">
                  #{String(earnedBadges[0].badgeNumber).padStart(3, '0')} / 100
                </div>
                <div className="pm-badge-reveal__desc">
                  Tu medalla numerada de colección
                </div>
              </div>
            )}

            <div className="pm-actions">
              <button
                className="pm-button pm-button--primary"
                onClick={() => { onClose(); navigate('/mis-entradas'); }}
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
