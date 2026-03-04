import { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { validateCoupon } from '../../services/couponService';
import { purchaseTickets } from '../../services/ticketService';
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
  const { user, profile } = useAuth();
  const [step, setStep] = useState<PurchaseStep>(0);
  const [quantities, setQuantities] = useState<{ [tierId: string]: number }>({});
  const [name, setName] = useState('');
  const [dni, setDni] = useState('');
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
    return (
      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
          <button className="pm-close" onClick={onClose}>✕</button>
          <div className="pm-content">
            <h2 className="pm-title">Inicia sesión</h2>
            <p className="pm-subtitle">Necesitas estar registrado para comprar entradas</p>
            <div className="pm-auth-buttons">
              <button className="pm-button pm-button--google">
                🔍 Continuar con Google
              </button>
              <button className="pm-button pm-button--magic">
                ✨ Link mágico
              </button>
            </div>
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
      toast.error('Ingresa un código de cupón');
      return;
    }

    setLoading(true);
    try {
      const result = await validateCoupon(couponCode);
      if (result.valid && result.discount) {
        setCouponDiscount(result.discount);
        setCouponApplied(true);
        toast.success('Cupón aplicado correctamente');
      } else {
        toast.error(result.error || 'Cupón inválido');
      }
    } catch (error) {
      toast.error('Error al validar cupón');
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
            <h2 className="pm-title">Selecciona entradas</h2>
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
                        {available > 0 ? `${available} disponibles` : 'Agotadas'}
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
                Atrás
              </button>
              <button
                className="pm-button pm-button--primary"
                onClick={() => setStep(2)}
                disabled={totalQty === 0}
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
            <h2 className="pm-title">Verificación de identidad</h2>
            <p className="pm-subtitle">Completa tus datos</p>

            <div className="pm-form">
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pm-input"
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
                className="pm-input"
              />
            </div>

            <div className="pm-actions">
              <button
                className="pm-button pm-button--secondary"
                onClick={() => setStep(1)}
              >
                Atrás
              </button>
              <button
                className="pm-button pm-button--primary"
                onClick={() => setStep(3)}
                disabled={!name.trim() || dni.length !== 8}
              >
                Continuar
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
            <h2 className="pm-title">Cupón y resumen</h2>

            <div className="pm-coupon-section">
              <h3 className="pm-section-title">Cupón de descuento</h3>
              <div className="pm-coupon-input-group">
                <input
                  type="text"
                  placeholder="Ingresa código de cupón"
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
                    {loading ? 'Validando...' : 'Aplicar'}
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
                    Remover
                  </button>
                )}
              </div>
            </div>

            <div className="pm-summary">
              <h3 className="pm-section-title">Resumen de compra</h3>
              <div className="pm-summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="pm-summary-row pm-summary-row--discount">
                  <span>Descuento ({(couponDiscount * 100).toFixed(0)}%)</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              {subtotal > 0 && discount < subtotal && (
                <>
                  <div className="pm-summary-row pm-summary-row--fees">
                    <span>Plataforma (3.3%)</span>
                    <span>{formatPrice((subtotal - discount) * 0.033)}</span>
                  </div>
                  <div className="pm-summary-row pm-summary-row--fees">
                    <span>Verificación (2.1%)</span>
                    <span>{formatPrice((subtotal - discount) * 0.021)}</span>
                  </div>
                  <div className="pm-summary-row pm-summary-row--fees">
                    <span>Procesamiento (2.9%)</span>
                    <span>{formatPrice((subtotal - discount) * 0.029)}</span>
                  </div>
                </>
              )}
              <div className="pm-summary-row pm-summary-row--total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="pm-actions">
              <button
                className="pm-button pm-button--secondary"
                onClick={() => setStep(2)}
              >
                Atrás
              </button>
              <button
                className="pm-button pm-button--primary"
                onClick={handlePurchase}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Comprar entradas'}
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
            <h2 className="pm-title">¡Compra confirmada!</h2>
            <p className="pm-subtitle">Tus entradas han sido generadas exitosamente</p>

            <div className="pm-confirmation-details">
              <div className="pm-detail">
                <span className="pm-detail-label">Evento</span>
                <span className="pm-detail-value">{event.name}</span>
              </div>
              <div className="pm-detail">
                <span className="pm-detail-label">Fecha</span>
                <span className="pm-detail-value">{formatDate(event.date)}</span>
              </div>
              <div className="pm-detail">
                <span className="pm-detail-label">Entradas</span>
                <span className="pm-detail-value">
                  {Object.values(quantities).reduce((a, b) => a + b, 0)} entradas
                </span>
              </div>
              <div className="pm-detail">
                <span className="pm-detail-label">Total pagado</span>
                <span className="pm-detail-value pm-detail-value--highlight">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="pm-actions">
              <button
                className="pm-button pm-button--primary"
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
