import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getEventsByOrganizer } from '../services/eventService';
import { useTranslation } from '../i18n';
import { apiFetch } from '../lib/api';
import type { Event } from '../lib/types';
import { formatPrice, toDate, getActivePhase, LOCALE_MAP } from '../lib/helpers';
import { FEES } from '../lib/constants';
import toast from 'react-hot-toast';
import './OrganizerPage.css';

interface EventStats {
  event: Event;
  ticketsSold: number;
  revenue: number;
  capacity: number;
}

// Analytics API response types
interface AnalyticsData {
  overview: {
    totalTickets: number;
    totalRevenue: number;
    totalEvents: number;
    totalCapacity: number;
    fillRate: number;
    checkInRate: number;
    transferRate: number;
    usedTickets: number;
    transferredTickets: number;
    resaleTickets: number;
    uniqueBuyers: number;
    avgTicketsPerBuyer: number;
    avgRevPerBuyer: number;
  };
  salesTimeline: { date: string; count: number; revenue: number }[];
  peakHours: { hour: number; count: number; label: string }[];
  tierBreakdown: { count: number; revenue: number; tierName: string }[];
  eventBreakdown: { count: number; revenue: number; eventName: string }[];
  coupons: { totalUsages: number; totalSavings: number; conversionLift: number };
  consumerBehavior: {
    segments: { singleEvent: number; multiEvent: number; highSpender: number; groupBuyer: number; total: number };
    medianSpend: number;
    avgSpend: number;
    repeatRate: number;
    groupBuyRate: number;
  };
  timeRange: string;
  generatedAt: string;
}

interface CouponData {
  id: string;
  code: string;
  discount: number;
  maxUses: number;
  usedCount: number;
  active: boolean;
  eventId: string | null;
  description: string;
  createdAt: string | null;
  expiresAt: string | null;
}

type TabId = 'dashboard' | 'analytics' | 'coupons';

export default function OrganizerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useTranslation();
  const locale = LOCALE_MAP[lang] || 'es-PE';

  // Dashboard state
  const [events, setEvents] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('');

  // Coupons state
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount: '',
    maxUses: '',
    expiresAt: '',
    eventId: '',
    description: '',
  });
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      if (!user) return;
      try {
        const userEvents = await getEventsByOrganizer(user.uid);
        const stats = userEvents.map((event) => {
          const tiers = event.tiers || [];
          const ticketsSold = tiers.reduce((sum, tier) => sum + (tier.sold || 0), 0);
          const revenue = tiers.reduce((sum, tier) => {
            const phase = getActivePhase(tier);
            return sum + (tier.sold || 0) * (phase?.price || 0);
          }, 0);
          const capacity = tiers.reduce((sum, tier) => sum + tier.capacity, 0);
          return { event, ticketsSold, revenue, capacity };
        });
        setEvents(stats);
      } catch (error) {
        console.error('Error loading events:', error);
        toast.error(t.organizer.errorGeneric || 'Error');
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, [user]);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    if (!user) return;
    setAnalyticsLoading(true);
    try {
      const data = await apiFetch<AnalyticsData>('organizer-analytics', {
        body: {
          timeRange,
          eventId: selectedEventFilter || undefined,
        },
      });
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error(t.organizer.errorGeneric || 'Error');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [user, timeRange, selectedEventFilter]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);

  // Load coupons
  const loadCoupons = useCallback(async () => {
    if (!user) return;
    setCouponsLoading(true);
    try {
      const data = await apiFetch<{ coupons: CouponData[] }>('manage-coupon', {
        body: { action: 'list' },
      });
      setCoupons(data.coupons);
    } catch (error) {
      console.error('Error loading coupons:', error);
      toast.error(t.organizer.errorGeneric || 'Error');
    } finally {
      setCouponsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'coupons') {
      loadCoupons();
    }
  }, [activeTab, loadCoupons]);

  // Coupon actions
  const handleCreateCoupon = async () => {
    setCouponError('');
    setCouponSuccess('');

    if (!couponForm.code || !couponForm.discount || !couponForm.maxUses) {
      setCouponError(t.organizer.couponErrorRequired);
      return;
    }

    const discountNum = parseFloat(couponForm.discount) / 100;
    if (discountNum <= 0 || discountNum > 1) {
      setCouponError(t.organizer.couponErrorDiscount);
      return;
    }

    try {
      await apiFetch('manage-coupon', {
        body: {
          action: 'create',
          code: couponForm.code,
          discount: discountNum,
          maxUses: parseInt(couponForm.maxUses),
          expiresAt: couponForm.expiresAt || undefined,
          eventId: couponForm.eventId || undefined,
          description: couponForm.description,
        },
      });
      setCouponSuccess(t.organizer.couponCreated);
      setCouponForm({ code: '', discount: '', maxUses: '', expiresAt: '', eventId: '', description: '' });
      setShowCouponForm(false);
      loadCoupons();
    } catch (error: any) {
      setCouponError(error.message || t.organizer.couponErrorCreate);
    }
  };

  const handleToggleCoupon = async (code: string, active: boolean) => {
    try {
      await apiFetch('manage-coupon', {
        body: { action: 'update', code, active: !active },
      });
      loadCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
      toast.error(t.organizer.errorGeneric || 'Error');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm(t.organizer.confirmDeleteCoupon || 'Delete this coupon?')) return;
    try {
      await apiFetch('manage-coupon', {
        body: { action: 'delete', code },
      });
      loadCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error(t.organizer.errorGeneric || 'Error');
    }
  };

  // Dashboard calculations
  const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);
  const totalTicketsSold = events.reduce((sum, e) => sum + e.ticketsSold, 0);
  const totalEvents = events.length;
  const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
  const fee = totalRevenue * FEES.DIRECT_TOTAL;
  const netRevenue = totalRevenue - fee;

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case 'published': return t.common.published;
      case 'draft': return t.common.draft;
      case 'sold-out': return t.common.soldOut;
      case 'past': return t.common.past;
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="og-view">
      {/* HEADER */}
      <div className="og-header">
        <div className="og-header-top">
          <div>
            <div className="og-badge">{t.organizer.panel}</div>
            <h1>{t.organizer.myDashboard}</h1>
            <p>{t.organizer.welcome} {user?.displayName || (t.organizer.organizerDefault || 'Organizador')}</p>
          </div>
          <button className="og-btn-new" onClick={() => navigate('/event-form')}>
            {t.organizer.newEvent}
          </button>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="og-tabs">
        <button
          className={`og-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 {t.organizer.tabDashboard}
        </button>
        <button
          className={`og-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 {t.organizer.tabAnalytics}
        </button>
        <button
          className={`og-tab ${activeTab === 'coupons' ? 'active' : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          🏷️ {t.organizer.tabCoupons}
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════
          TAB: DASHBOARD
         ════════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && (
        <>
          {/* QUICK ACTIONS */}
          <div className="og-quick-actions">
            <button className="og-quick-btn" onClick={() => navigate('/event-form')}>
              <span className="og-quick-icon">✏️</span>
              {t.organizer.createEvent}
            </button>
            <button className="og-quick-btn" onClick={() => navigate('/scanner')}>
              <span className="og-quick-icon">📱</span>
              {t.organizer.openScanner}
            </button>
            <button className="og-quick-btn" onClick={() => setActiveTab('analytics')}>
              <span className="og-quick-icon">📈</span>
              {t.organizer.tabAnalytics}
            </button>
          </div>

          {/* METRICS */}
          <div className="og-metrics">
            <div className="og-metric">
              <div className="og-metric-label">{t.organizer.ticketsSold}</div>
              <div className="og-metric-value">{totalTicketsSold}</div>
              <div className="og-metric-change">{totalEvents} {totalEvents !== 1 ? t.organizer.eventPlural : t.organizer.eventSingular} · {totalCapacity} {t.organizer.capacityLabel}</div>
            </div>
            <div className="og-metric">
              <div className="og-metric-label">{t.organizer.grossRevenue}</div>
              <div className="og-metric-value acid">{formatPrice(totalRevenue)}</div>
              <div className="og-metric-change">{t.organizer.grossDesc}</div>
            </div>
            <div className="og-metric">
              <div className="og-metric-label">{t.organizer.lezgoFee}</div>
              <div className="og-metric-value acid">{formatPrice(fee)}</div>
              <div className="og-metric-change">{t.organizer.feeDesc}</div>
            </div>
            <div className="og-metric">
              <div className="og-metric-label">{t.organizer.netRevenue}</div>
              <div className="og-metric-value acid">{formatPrice(netRevenue)}</div>
              <div className="og-metric-change">{t.organizer.netDesc}</div>
            </div>
          </div>

          {/* EVENTS SECTION */}
          <div className="og-section">
            <div className="og-section-title">{t.organizer.myEvents}</div>

            {events.length === 0 ? (
              <div className="og-empty-state">
                <div className="og-empty-icon">📭</div>
                <div className="og-empty-title">{t.organizer.noEvents}</div>
                <div className="og-empty-text">{t.organizer.noEventsDesc}</div>
                <button className="og-btn-new" onClick={() => navigate('/event-form')} style={{ marginTop: '16px' }}>
                  {t.organizer.newEvent}
                </button>
              </div>
            ) : (
              <div className="og-events">
                {events.map((stats) => {
                  const event = stats.event;
                  const progress = stats.capacity > 0 ? (stats.ticketsSold / stats.capacity) * 100 : 0;
                  const eventDate = toDate(event.date);
                  return (
                    <div key={event.id} className="og-event-card">
                      <div className="og-event-img" style={{ backgroundImage: `url(${event.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"%3E%3Crect fill="%23111" width="400" height="120"/%3E%3C/svg%3E'})` }}>
                        <div className="og-event-status">{getStatusBadgeText(event.status)}</div>
                      </div>
                      <div className="og-event-body">
                        <div className="og-event-name">{event.name}</div>
                        <div className="og-event-meta">
                          {eventDate.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="og-event-progress">
                          <div className="og-event-bar">
                            <div className="og-event-bar-fill" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="og-event-progress-info">
                            <div><span className="og-progress-pct">{Math.round(progress)}%</span></div>
                            <div><span className="og-capacity-label">{stats.ticketsSold}/{stats.capacity}</span></div>
                          </div>
                        </div>
                      </div>
                      <div className="og-event-actions">
                        <button className="og-act-btn primary" onClick={() => navigate(`/event-form?id=${event.id}`)}>{t.common.edit}</button>
                        <button className="og-act-btn ghost" onClick={() => navigate(`/evento/${event.slug || event.id}`)}>{t.common.view}</button>
                        <button className="og-act-btn ghost" onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}>
                          {expandedEventId === event.id ? '↑' : '↓'} {t.organizer.tiers || 'Tiers'}
                        </button>
                      </div>
                      {expandedEventId === event.id && (
                        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                          <table className="og-table">
                            <thead>
                              <tr>
                                <th>{t.organizer.tierType}</th>
                                <th>{t.organizer.tierSold}</th>
                                <th>{t.organizer.tierCapacity}</th>
                                <th>{t.organizer.tierRevenue}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(event.tiers || []).map((tier) => {
                                const tierRevenue = tier.sold * (tier.phases?.[0]?.price || 0);
                                return (
                                  <tr key={tier.id}>
                                    <td>{tier.name}</td>
                                    <td>{tier.sold}</td>
                                    <td>{tier.capacity}</td>
                                    <td>{formatPrice(tierRevenue)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: ANALYTICS
         ════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="og-analytics">
          {/* FILTERS */}
          <div className="og-analytics-filters">
            <div className="og-time-range">
              {(['7d', '30d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  className={`og-range-btn ${timeRange === range ? 'active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range === '7d' ? t.organizer.last7d : range === '30d' ? t.organizer.last30d : t.organizer.allTime}
                </button>
              ))}
            </div>
            {events.length > 1 && (
              <select
                className="og-event-filter"
                value={selectedEventFilter}
                onChange={(e) => setSelectedEventFilter(e.target.value)}
              >
                <option value="">{t.organizer.allEvents}</option>
                {events.map((s) => (
                  <option key={s.event.id} value={s.event.id}>{s.event.name}</option>
                ))}
              </select>
            )}
          </div>

          {analyticsLoading ? (
            <div className="og-analytics-loading">
              <div className="loading-spinner" />
              <p>{t.organizer.loadingAnalytics}</p>
            </div>
          ) : analytics ? (
            <>
              {/* OVERVIEW METRICS */}
              <div className="og-metrics">
                <div className="og-metric">
                  <div className="og-metric-label">{t.organizer.ticketsSold}</div>
                  <div className="og-metric-value">{analytics.overview.totalTickets}</div>
                  <div className="og-metric-change">{t.organizer.uniqueBuyers}: {analytics.overview.uniqueBuyers}</div>
                </div>
                <div className="og-metric">
                  <div className="og-metric-label">{t.organizer.grossRevenue}</div>
                  <div className="og-metric-value acid">{formatPrice(analytics.overview.totalRevenue)}</div>
                  <div className="og-metric-change">{t.organizer.avgPerBuyer}: {formatPrice(analytics.overview.avgRevPerBuyer)}</div>
                </div>
                <div className="og-metric">
                  <div className="og-metric-label">{t.organizer.fillRateLabel}</div>
                  <div className="og-metric-value">{analytics.overview.fillRate}%</div>
                  <div className="og-metric-change">{analytics.overview.totalTickets}/{analytics.overview.totalCapacity} {t.organizer.capacityLabel}</div>
                </div>
                <div className="og-metric">
                  <div className="og-metric-label">{t.organizer.checkInRateLabel}</div>
                  <div className="og-metric-value">{analytics.overview.checkInRate}%</div>
                  <div className="og-metric-change">{analytics.overview.usedTickets} {t.organizer.checkedIn}</div>
                </div>
              </div>

              {/* SALES TIMELINE */}
              <div className="og-section">
                <div className="og-section-title">{t.organizer.salesTimeline}</div>
                {analytics.salesTimeline.length > 0 ? (
                  <div className="og-chart-container">
                    <div className="og-chart">
                      {analytics.salesTimeline.map((day) => {
                        const maxCount = Math.max(...analytics.salesTimeline.map((d) => d.count), 1);
                        const height = (day.count / maxCount) * 100;
                        const isHighest = day.count === maxCount;
                        return (
                          <div
                            key={day.date}
                            className={`og-bar ${isHighest ? 'highlight' : ''}`}
                            style={{ height: `${Math.max(height, 4)}%` }}
                            title={`${day.date}: ${day.count} tickets — ${formatPrice(day.revenue)}`}
                          />
                        );
                      })}
                    </div>
                    <div className="og-chart-labels">
                      {analytics.salesTimeline.map((day, i) => {
                        const show = analytics.salesTimeline.length <= 10 || i % Math.ceil(analytics.salesTimeline.length / 8) === 0;
                        return show ? (
                          <div key={day.date} className="og-chart-label">{day.date.slice(5)}</div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="og-empty-state">
                    <div className="og-empty-icon">📊</div>
                    <div className="og-empty-title">{t.organizer.noSalesData}</div>
                  </div>
                )}
              </div>

              {/* TIER BREAKDOWN + PEAK HOURS */}
              <div className="og-analytics-grid">
                {/* TIER BREAKDOWN */}
                <div className="og-analytics-card">
                  <div className="og-card-title">{t.organizer.tierBreakdownTitle}</div>
                  {analytics.tierBreakdown.length > 0 ? (
                    <div className="og-tier-bars">
                      {analytics.tierBreakdown.map((tier) => {
                        const maxTierCount = Math.max(...analytics.tierBreakdown.map((t) => t.count), 1);
                        const pct = (tier.count / maxTierCount) * 100;
                        return (
                          <div key={tier.tierName} className="og-tier-row">
                            <div className="og-tier-label">
                              <span className="og-tier-name">{tier.tierName}</span>
                              <span className="og-tier-count">{tier.count} — {formatPrice(tier.revenue)}</span>
                            </div>
                            <div className="og-tier-bar-bg">
                              <div className="og-tier-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="og-no-data">{t.organizer.noData}</div>
                  )}
                </div>

                {/* PEAK HOURS */}
                <div className="og-analytics-card">
                  <div className="og-card-title">{t.organizer.peakHoursTitle}</div>
                  {analytics.peakHours.length > 0 ? (
                    <div className="og-peak-hours">
                      {analytics.peakHours.map((ph, i) => (
                        <div key={ph.hour} className={`og-peak-row ${i === 0 ? 'top' : ''}`}>
                          <span className="og-peak-time">{ph.label}</span>
                          <div className="og-peak-bar-bg">
                            <div
                              className="og-peak-bar-fill"
                              style={{ width: `${(ph.count / analytics.peakHours[0].count) * 100}%` }}
                            />
                          </div>
                          <span className="og-peak-count">{ph.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="og-no-data">{t.organizer.noData}</div>
                  )}
                </div>
              </div>

              {/* COUPON ANALYTICS */}
              {analytics.coupons.totalUsages > 0 && (
                <div className="og-section">
                  <div className="og-section-title">{t.organizer.couponAnalytics}</div>
                  <div className="og-metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="og-metric">
                      <div className="og-metric-label">{t.organizer.couponUsages}</div>
                      <div className="og-metric-value">{analytics.coupons.totalUsages}</div>
                      <div className="og-metric-change">{t.organizer.couponConversion}: {analytics.coupons.conversionLift}%</div>
                    </div>
                    <div className="og-metric">
                      <div className="og-metric-label">{t.organizer.couponSavingsLabel}</div>
                      <div className="og-metric-value acid">{formatPrice(analytics.coupons.totalSavings)}</div>
                      <div className="og-metric-change">{t.organizer.discountGiven}</div>
                    </div>
                    <div className="og-metric">
                      <div className="og-metric-label">{t.organizer.conversionLift}</div>
                      <div className="og-metric-value">{analytics.coupons.conversionLift}%</div>
                      <div className="og-metric-change">{t.organizer.ofTotalSales}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════
                  CONSUMER BEHAVIOR ANALYTICS (anonymized, sellable)
                 ═══════════════════════════════════════════════ */}
              <div className="og-section">
                <div className="og-section-title">
                  {t.organizer.consumerBehaviorTitle}
                  <span className="og-section-badge">{t.organizer.anonymized}</span>
                </div>

                {analytics.consumerBehavior.segments.total > 0 ? (
                  <>
                    {/* BEHAVIOR METRICS */}
                    <div className="og-metrics" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <div className="og-metric">
                        <div className="og-metric-label">{t.organizer.uniqueBuyers}</div>
                        <div className="og-metric-value">{analytics.consumerBehavior.segments.total}</div>
                        <div className="og-metric-change">{t.organizer.identifiedProfiles}</div>
                      </div>
                      <div className="og-metric">
                        <div className="og-metric-label">{t.organizer.avgSpendLabel}</div>
                        <div className="og-metric-value acid">{formatPrice(analytics.consumerBehavior.avgSpend)}</div>
                        <div className="og-metric-change">{t.organizer.medianLabel}: {formatPrice(analytics.consumerBehavior.medianSpend)}</div>
                      </div>
                      <div className="og-metric">
                        <div className="og-metric-label">{t.organizer.repeatRateLabel}</div>
                        <div className="og-metric-value">{analytics.consumerBehavior.repeatRate}%</div>
                        <div className="og-metric-change">{t.organizer.multiEventBuyers}</div>
                      </div>
                      <div className="og-metric">
                        <div className="og-metric-label">{t.organizer.groupBuyRateLabel}</div>
                        <div className="og-metric-value">{analytics.consumerBehavior.groupBuyRate}%</div>
                        <div className="og-metric-change">{t.organizer.buyThreePlus}</div>
                      </div>
                    </div>

                    {/* SEGMENT VISUALIZATION */}
                    <div className="og-segments">
                      <div className="og-segment-card">
                        <div className="og-segment-icon">👤</div>
                        <div className="og-segment-value">{analytics.consumerBehavior.segments.singleEvent}</div>
                        <div className="og-segment-label">{t.organizer.segSingleEvent}</div>
                        <div className="og-segment-desc">{t.organizer.segSingleEventDesc}</div>
                        <div className="og-segment-pct">
                          {analytics.consumerBehavior.segments.total > 0
                            ? Math.round((analytics.consumerBehavior.segments.singleEvent / analytics.consumerBehavior.segments.total) * 100)
                            : 0}%
                        </div>
                      </div>
                      <div className="og-segment-card highlight">
                        <div className="og-segment-icon">🔄</div>
                        <div className="og-segment-value">{analytics.consumerBehavior.segments.multiEvent}</div>
                        <div className="og-segment-label">{t.organizer.segMultiEvent}</div>
                        <div className="og-segment-desc">{t.organizer.segMultiEventDesc}</div>
                        <div className="og-segment-pct">
                          {analytics.consumerBehavior.segments.total > 0
                            ? Math.round((analytics.consumerBehavior.segments.multiEvent / analytics.consumerBehavior.segments.total) * 100)
                            : 0}%
                        </div>
                      </div>
                      <div className="og-segment-card">
                        <div className="og-segment-icon">💎</div>
                        <div className="og-segment-value">{analytics.consumerBehavior.segments.highSpender}</div>
                        <div className="og-segment-label">{t.organizer.segHighSpender}</div>
                        <div className="og-segment-desc">{t.organizer.segHighSpenderDesc}</div>
                        <div className="og-segment-pct">
                          {analytics.consumerBehavior.segments.total > 0
                            ? Math.round((analytics.consumerBehavior.segments.highSpender / analytics.consumerBehavior.segments.total) * 100)
                            : 0}%
                        </div>
                      </div>
                      <div className="og-segment-card">
                        <div className="og-segment-icon">👥</div>
                        <div className="og-segment-value">{analytics.consumerBehavior.segments.groupBuyer}</div>
                        <div className="og-segment-label">{t.organizer.segGroupBuyer}</div>
                        <div className="og-segment-desc">{t.organizer.segGroupBuyerDesc}</div>
                        <div className="og-segment-pct">
                          {analytics.consumerBehavior.segments.total > 0
                            ? Math.round((analytics.consumerBehavior.segments.groupBuyer / analytics.consumerBehavior.segments.total) * 100)
                            : 0}%
                        </div>
                      </div>
                    </div>

                    {/* INSIGHTS PANEL */}
                    <div className="og-insights">
                      <div className="og-insights-header">
                        <span className="og-insights-icon">🧠</span>
                        <span>{t.organizer.insightsTitle}</span>
                      </div>
                      <div className="og-insights-grid">
                        <div className="og-insight">
                          <div className="og-insight-label">{t.organizer.insightAvgTickets}</div>
                          <div className="og-insight-value">{analytics.overview.avgTicketsPerBuyer}</div>
                          <div className="og-insight-desc">{t.organizer.insightAvgTicketsDesc}</div>
                        </div>
                        <div className="og-insight">
                          <div className="og-insight-label">{t.organizer.insightTransferRate}</div>
                          <div className="og-insight-value">{analytics.overview.transferRate}%</div>
                          <div className="og-insight-desc">{t.organizer.insightTransferDesc}</div>
                        </div>
                        <div className="og-insight">
                          <div className="og-insight-label">{t.organizer.insightResale}</div>
                          <div className="og-insight-value">{analytics.overview.resaleTickets}</div>
                          <div className="og-insight-desc">{t.organizer.insightResaleDesc}</div>
                        </div>
                        <div className="og-insight">
                          <div className="og-insight-label">{t.organizer.insightLoyalty}</div>
                          <div className="og-insight-value">
                            {analytics.consumerBehavior.repeatRate > 20 ? '🟢' : analytics.consumerBehavior.repeatRate > 5 ? '🟡' : '🔴'}
                          </div>
                          <div className="og-insight-desc">
                            {analytics.consumerBehavior.repeatRate > 20
                              ? t.organizer.loyaltyHigh
                              : analytics.consumerBehavior.repeatRate > 5
                              ? t.organizer.loyaltyMedium
                              : t.organizer.loyaltyLow}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DATA DISCLAIMER */}
                    <div className="og-data-disclaimer">
                      🔒 {t.organizer.dataDisclaimer}
                    </div>
                  </>
                ) : (
                  <div className="og-empty-state">
                    <div className="og-empty-icon">👥</div>
                    <div className="og-empty-title">{t.organizer.noBehaviorData}</div>
                    <div className="og-empty-text">{t.organizer.noBehaviorDataDesc}</div>
                  </div>
                )}
              </div>

              {/* GENERATED AT */}
              <div className="og-generated-at">
                {t.organizer.generatedAt}: {new Date(analytics.generatedAt).toLocaleString(locale)}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          TAB: COUPONS
         ════════════════════════════════════════════════════════ */}
      {activeTab === 'coupons' && (
        <div className="og-coupons">
          {/* CREATE COUPON HEADER */}
          <div className="og-section">
            <div className="og-section-header">
              <div className="og-section-title">{t.organizer.manageCoupons}</div>
              <button className="og-btn-new" onClick={() => setShowCouponForm(!showCouponForm)}>
                {showCouponForm ? t.common.cancel : t.organizer.newCoupon}
              </button>
            </div>

            {/* CREATE COUPON FORM */}
            {showCouponForm && (
              <div className="og-coupon-form">
                <div className="og-form-row">
                  <div className="og-form-field">
                    <label>{t.organizer.couponCode}</label>
                    <input
                      type="text"
                      placeholder="SUMMER2026"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      maxLength={20}
                    />
                  </div>
                  <div className="og-form-field">
                    <label>{t.organizer.couponDiscount}</label>
                    <input
                      type="number"
                      placeholder="15"
                      min="1"
                      max="100"
                      value={couponForm.discount}
                      onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })}
                    />
                    <span className="og-form-hint">%</span>
                  </div>
                  <div className="og-form-field">
                    <label>{t.organizer.couponMaxUses}</label>
                    <input
                      type="number"
                      placeholder="100"
                      min="1"
                      value={couponForm.maxUses}
                      onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                    />
                  </div>
                </div>
                <div className="og-form-row">
                  <div className="og-form-field">
                    <label>{t.organizer.couponExpiry}</label>
                    <input
                      type="date"
                      value={couponForm.expiresAt}
                      onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                    />
                  </div>
                  <div className="og-form-field">
                    <label>{t.organizer.couponEvent}</label>
                    <select
                      value={couponForm.eventId}
                      onChange={(e) => setCouponForm({ ...couponForm, eventId: e.target.value })}
                    >
                      <option value="">{t.organizer.allEvents}</option>
                      {events.map((s) => (
                        <option key={s.event.id} value={s.event.id}>{s.event.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="og-form-field">
                    <label>{t.organizer.couponDescription}</label>
                    <input
                      type="text"
                      placeholder={t.organizer.couponDescPlaceholder}
                      value={couponForm.description}
                      onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                    />
                  </div>
                </div>

                {couponError && <div className="og-form-error">{couponError}</div>}
                {couponSuccess && <div className="og-form-success">{couponSuccess}</div>}

                <button className="og-btn-create-coupon" onClick={handleCreateCoupon}>
                  {t.organizer.createCoupon}
                </button>
              </div>
            )}

            {/* COUPONS LIST */}
            {couponsLoading ? (
              <div className="og-analytics-loading">
                <div className="loading-spinner" />
              </div>
            ) : coupons.length === 0 ? (
              <div className="og-empty-state">
                <div className="og-empty-icon">🏷️</div>
                <div className="og-empty-title">{t.organizer.noCoupons}</div>
                <div className="og-empty-text">{t.organizer.noCouponsDesc}</div>
              </div>
            ) : (
              <div className="og-coupons-list">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className={`og-coupon-card ${!coupon.active ? 'inactive' : ''}`}>
                    <div className="og-coupon-header">
                      <div className="og-coupon-code">{coupon.code}</div>
                      <div className={`og-coupon-status ${coupon.active ? 'active' : 'inactive'}`}>
                        {coupon.active ? t.organizer.couponActive : t.organizer.couponInactive}
                      </div>
                    </div>
                    <div className="og-coupon-details">
                      <div className="og-coupon-detail">
                        <span className="og-coupon-detail-label">{t.organizer.couponDiscount}</span>
                        <span className="og-coupon-detail-value">{Math.round(coupon.discount * 100)}%</span>
                      </div>
                      <div className="og-coupon-detail">
                        <span className="og-coupon-detail-label">{t.organizer.couponUsed}</span>
                        <span className="og-coupon-detail-value">{coupon.usedCount}/{coupon.maxUses}</span>
                      </div>
                      {coupon.expiresAt && (
                        <div className="og-coupon-detail">
                          <span className="og-coupon-detail-label">{t.organizer.couponExpiry}</span>
                          <span className="og-coupon-detail-value">
                            {new Date(coupon.expiresAt).toLocaleDateString(locale)}
                          </span>
                        </div>
                      )}
                      {coupon.description && (
                        <div className="og-coupon-detail full">
                          <span className="og-coupon-detail-label">{t.organizer.couponDescription}</span>
                          <span className="og-coupon-detail-value">{coupon.description}</span>
                        </div>
                      )}
                    </div>
                    <div className="og-coupon-actions">
                      <button
                        className={`og-act-btn ${coupon.active ? 'ghost' : 'primary'}`}
                        onClick={() => handleToggleCoupon(coupon.code, coupon.active)}
                      >
                        {coupon.active ? t.organizer.deactivate : t.organizer.activate}
                      </button>
                      <button
                        className="og-act-btn ghost danger"
                        onClick={() => handleDeleteCoupon(coupon.code)}
                      >
                        {t.organizer.deleteCoupon}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
