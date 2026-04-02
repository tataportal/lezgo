import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { validateEventCoupon } from '../../services/couponService';
import { purchaseTickets } from '../../services/ticketService';
import { useTranslation } from '../../i18n';
import { formatPrice, toDate, getActivePhase, LOCALE_MAP } from '../../lib/helpers';
import { calculateBuyerFeeForTickets, sanitizeIdInput, isValidId, ID_CONFIG, type IdType } from '../../lib/constants';
import type { Event } from '../../lib/types';
import { Icon } from '../ui';
import toast from 'react-hot-toast';
import './PurchaseModal.css';

type PurchaseStep = 'login' | 'checkout' | 'success';

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
  const [step, setStep] = useState<PurchaseStep>('login');
  const [quantities, setQuantities] = useState<{ [tierId: string]: number }>({});
  const [name, setName] = useState('');
  const [idType, setIdType] = useState<IdType>('dni');
  const [dni, setDni] = useState('');
  const [magicEmail, setMagicEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponTierId, setCouponTierId] = useState<string | null>(null);
  const [couponApplied, setCouponApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<{ badgeNumber: number; badgeType: string }[]>([]);

  // Reset all state when modal opens
  useEffect(() => {
    if (open) {
      setStep(user ? 'checkout' : 'login');
      setQuantities({});
      setName(profile?.displayName || '');
      setIdType('dni');
      setDni(profile?.dni || '');
      setMagicEmail('');
      setMagicLinkSent(false);
      setCouponCode('');
      setCouponDiscount(0);
      setCouponTierId(null);
      setCouponApplied(false);
      setEarnedBadges([]);
      setLoading(false);
    }
  }, [open]);

  // When user logs in during the flow, move to checkout
  useEffect(() => {
    if (user && step === 'login') {
      setStep('checkout');
      setName(profile?.displayName || '');
      setDni(profile?.dni || '');
    }
  }, [user]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
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

  // Whether user needs to fill DNI
  const needsDni = !profile?.dni;

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
    if (!event || couponDiscount <= 0) return 0;
    return (event.tiers || []).reduce((sum, tier) => {
      const qty = quantities[tier.id] || 0;
      if (!qty) return sum;
      if (couponTierId && couponTierId !== tier.id) return sum;
      const activePhase = getActivePhase(tier);
      const tierSubtotal = (activePhase?.price || 0) * qty;
      return sum + tierSubtotal * couponDiscount;
    }, 0);
  }, [event, quantities, couponDiscount, couponTierId]);

  const discountedTicketPrices = useMemo(() => {
    if (!event) return [] as number[];

    const prices: number[] = [];
    for (const tier of event.tiers || []) {
      const qty = quantities[tier.id] || 0;
      if (!qty) continue;

      const activePhase = getActivePhase(tier);
      const basePrice = activePhase?.price || 0;
      const isCouponEligible = couponApplied && (!couponTierId || couponTierId === tier.id);
      const discountedPrice = Math.max(basePrice - (isCouponEligible ? basePrice * couponDiscount : 0), 0);

      for (let i = 0; i < qty; i++) {
        prices.push(discountedPrice);
      }
    }

    return prices;
  }, [event, quantities, couponApplied, couponDiscount, couponTierId]);

  const feeBase = Math.max(subtotal - discount, 0);
  const buyerFee = calculateBuyerFeeForTickets(discountedTicketPrices);
  const total = feeBase + buyerFee;
  const totalSelected = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const isFree = subtotal === 0;
  const maxTicketsPerBuyer = Math.max(Number(event?.maxTicketsPerBuyer ?? 1), 1);

  const handleAddQty = (tierId: string) => {
    if (totalSelected >= maxTicketsPerBuyer) return;
    setQuantities({ ...quantities, [tierId]: 1 });
  };

  const handleRemoveQty = (tierId: string) => {
    const currentQty = quantities[tierId] || 0;
    if (currentQty > 0) {
      setQuantities({ ...quantities, [tierId]: currentQty - 1 });
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !event) {
      toast.error(t.purchase.couponLabel);
      return;
    }

    setLoading(true);
    try {
      const selectedTierIds = (event.tiers || [])
        .filter((tier) => (quantities[tier.id] || 0) > 0)
        .map((tier) => tier.id);
      const result = await validateEventCoupon(couponCode, event.id, selectedTierIds);
      if (result.valid && result.discount) {
        setCouponDiscount(result.discount);
        setCouponTierId(result.tierId || null);
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

  const canPurchase = useMemo(() => {
    if (totalSelected === 0) return false;
    if (needsDni && (!name.trim() || !isValidId(dni, idType))) return false;
    return true;
  }, [totalSelected, needsDni, name, dni, idType]);

  const handlePurchase = async () => {
    if (!canPurchase || !event) return;

    // Save DNI if needed
    if (needsDni) {
      try {
        await updateProfile({ displayName: name.trim(), dni: dni.trim(), dniType: idType });
      } catch (error) {
        const msg = error instanceof Error ? error.message : t.purchase.errorGeneric || 'Error en la compra';
        toast.error(msg);
        return;
      }
    }

    setLoading(true);
    try {
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
      setStep('success');
      toast.success(isFree ? t.purchase.reserveSuccess : t.purchase.purchaseSuccess);
    } catch (error) {
      const msg = error instanceof Error ? error.message : (t.purchase.errorGeneric || 'Error en la compra');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // ── Login Step ──
  if (step === 'login' && !user) {
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
        <div className="pm-modal pm-modal--login" onClick={(e) => e.stopPropagation()}>
          <button className="pm-close" onClick={onClose} aria-label={t.common.close}>✕</button>

          <div className="pm-login-header">
            <div className="pm-login-logo">LEZGO</div>
            <div className="pm-login-icon"><Icon name="ticket" size={28} /></div>
          </div>

          <div className="pm-content pm-content--centered">
            <h2 className="pm-title">{t.purchase.loginTitle}</h2>
            <p className="pm-subtitle">{t.purchase.loginDesc}</p>

            {!magicLinkSent ? (
              <div className="pm-auth-buttons">
                <button
                  className="pm-button pm-button--google"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{marginRight: '8px'}}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t.purchase.googleBtn}
                </button>

                <div className="pm-or-divider">
                  <span className="pm-or-line"></span>
                  <span className="pm-or-text">{t.purchase.or}</span>
                  <span className="pm-or-line"></span>
                </div>

                <input
                  type="email"
                  placeholder={t.purchase.emailPlaceholder}
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMagicLink()}
                  className="pm-input pm-input--mb"
                />
                <button
                  className="pm-button pm-button--magic"
                  onClick={handleMagicLink}
                  disabled={loading || !magicEmail.trim()}
                >
                  {loading ? t.common.processing : t.purchase.sendMagicLink}
                </button>
              </div>
            ) : (
              <div className="pm-magic-link-sent">
                <div className="pm-magic-link-icon"><Icon name="user-check" size={28} /></div>
                <h3 className="pm-magic-link-title">{t.purchase.checkEmail}</h3>
                <p className="pm-magic-link-desc">{magicEmail}</p>
                <button
                  className="pm-button pm-button--secondary"
                  onClick={() => setMagicLinkSent(false)}
                  style={{marginTop: 'var(--sp-4)'}}
                >
                  {t.common.back}
                </button>
              </div>
            )}

            <p className="pm-login-footer">{t.purchase.secureLogin || 'Tu información está protegida'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event || !user) return null;

  // ── Checkout Step (single view: tickets + identity + summary) ──
  if (step === 'checkout') {
    return (
      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal pm-modal--large" onClick={(e) => e.stopPropagation()}>
          <button className="pm-close" onClick={onClose} aria-label={t.common.close}>✕</button>

          <div className="pm-content">
            <h2 className="pm-title">{t.purchase.selectTickets}</h2>
            <p className="pm-subtitle">{event.name}</p>

            {/* ── Ticket Selection ── */}
            <div className="pm-tiers">
              {(event.tiers || []).map((tier) => {
                const activePhase = getActivePhase(tier);
                const available = tier.capacity - tier.sold;
                const currentQty = quantities[tier.id] || 0;

                const isLocked = tier.unlockAfterTier
                  ? (() => {
                      const prerequisite = (event.tiers || []).find((t: { id: string }) => t.id === tier.unlockAfterTier);
                      return prerequisite ? prerequisite.sold < prerequisite.capacity : false;
                    })()
                  : false;

                return (
                  <div key={tier.id} className={`pm-tier-card${isLocked ? ' pm-tier-card--locked' : ''}${currentQty > 0 ? ' pm-tier-card--selected' : ''}`}>
                    <div className="pm-tier-info">
                      <h3 className="pm-tier-name">{tier.name}</h3>
                      {isLocked ? (
                        <p className="pm-tier-locked-msg"><Icon name="lock" size={14} /> {t.purchase.unlocksWhen || 'Se abre cuando'} {tier.unlockAfterTier?.toUpperCase()} {t.purchase.sellsOut || 'se agote'}</p>
                      ) : (
                        <>
                          <p className="pm-tier-price">{formatPrice(activePhase?.price || 0)}</p>
                          <p className="pm-tier-available">
                            {available > 0 ? `${available} ${t.purchase.available}` : t.purchase.soldOutLabel}
                          </p>
                        </>
                      )}
                    </div>
                    {!isLocked && available > 0 && (
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
                          disabled={totalSelected >= maxTicketsPerBuyer || currentQty >= available}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="pm-ticket-limit-note">
              {t.purchase.ticketLimitLabel}: {maxTicketsPerBuyer} {maxTicketsPerBuyer === 1 ? t.purchase.entrySingular : t.purchase.entryPlural}
            </p>

            {/* ── Identity Section (only if no DNI on file) ── */}
            {needsDni && totalSelected > 0 && (
              <div className="pm-section">
                <h3 className="pm-section-title">{t.purchase.verifyTitle}</h3>
                <p className="pm-section-desc">{t.purchase.verifyDesc}</p>
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
              </div>
            )}

            {/* ── Coupon Section (only when tickets have a price and are selected) ── */}
            {!isFree && totalSelected > 0 && (
              <div className="pm-section">
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

            {/* ── Summary (shows when tickets are selected) ── */}
            {totalSelected > 0 && (
              <div className="pm-summary">
                <h3 className="pm-section-title">{t.purchase.orderSummary}</h3>

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
                    {buyerFee > 0 && (
                      <div className="pm-summary-row pm-summary-row--fees">
                        <span>{t.purchase.buyerFee}</span>
                        <span>{formatPrice(buyerFee)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="pm-summary-row pm-summary-row--total">
                  <span>{t.purchase.total}</span>
                  <span>{isFree ? t.common.free : formatPrice(total)}</span>
                </div>
              </div>
            )}

            {/* ── Action Button ── */}
            <div className="pm-actions">
              <button
                className="pm-button pm-button--primary pm-button--full"
                onClick={handlePurchase}
                disabled={loading || !canPurchase}
              >
                {loading
                  ? t.common.processing
                  : totalSelected === 0
                    ? t.purchase.selectTickets
                    : isFree
                      ? t.purchase.reserveTickets
                      : t.purchase.buyTickets
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Success Step ──
  if (step === 'success') {
    return (
      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="pm-close" onClick={onClose} aria-label={t.common.close}>✕</button>

          <div className="pm-content pm-content--centered pm-success-wrap">
            <div className="pm-success-icon">✓</div>
            <h2 className="pm-title">{isFree ? t.purchase.reserveConfirmTitle : t.purchase.confirmTitle}</h2>
            <p className="pm-subtitle">{isFree ? t.purchase.reserveConfirmDesc : t.purchase.confirmDesc}</p>

            {earnedBadges.length > 0 && (
              <div className="pm-badge-reveal">
                <div className="pm-badge-reveal__icon"><Icon name="spark" size={26} /></div>
                <div className="pm-badge-reveal__title">{t.purchase.earlyAdopterBadge}</div>
                <div className="pm-badge-reveal__number">
                  #{String(earnedBadges[0].badgeNumber).padStart(3, '0')} / {event.badgeConfig?.totalSupply || 100}
                </div>
                <div className="pm-badge-reveal__desc">
                  {t.purchase.numberedCollectibleMedal}
                </div>
              </div>
            )}

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
