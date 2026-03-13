import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getEventsByOrganizer } from '../services/eventService';
import { getTicketsByEvent } from '../services/ticketService';
import { useTranslation } from '../i18n';
import type { Event } from '../lib/types';
import { formatPrice, toDate } from '../lib/helpers';
import './OrganizerPage.css';

interface EventStats {
  event: Event;
  ticketsSold: number;
  revenue: number;
  capacity: number;
}

export default function OrganizerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [events, setEvents] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      if (!user) return;

      try {
        const userEvents = await getEventsByOrganizer(user.uid);

        const statsPromises = userEvents.map(async (event) => {
          const tickets = await getTicketsByEvent(event.id);
          const ticketsSold = tickets.filter(
            (t) => t.status === 'active' || t.status === 'transferred'
          ).length;
          const revenue = tickets
            .filter((t) => t.status === 'active' || t.status === 'transferred')
            .reduce((sum, t) => sum + t.price, 0);
          const capacity = (event.tiers || []).reduce((sum, tier) => sum + tier.capacity, 0);

          return { event, ticketsSold, revenue, capacity };
        });

        const stats = await Promise.all(statsPromises);
        setEvents(stats);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [user]);

  const totalRevenue = events.reduce((sum, e) => sum + e.revenue, 0);
  const totalTicketsSold = events.reduce((sum, e) => sum + e.ticketsSold, 0);
  const totalEvents = events.length;
  const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
  const fee = totalRevenue * 0.08;
  const netRevenue = totalRevenue - fee;

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case 'published':
        return t.common.published;
      case 'draft':
        return t.common.draft;
      case 'sold-out':
        return t.common.soldOut;
      case 'past':
        return t.common.past;
      default:
        return status;
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
            <p>{t.organizer.welcome} {user?.displayName || 'Organizador'}</p>
          </div>
          <button className="og-btn-new" onClick={() => navigate('/event-form')}>
            {t.organizer.newEvent}
          </button>
        </div>
      </div>

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
        <button className="og-quick-btn" onClick={() => {}}>
          <span className="og-quick-icon">📥</span>
          {t.organizer.exportAll}
        </button>
      </div>

      {/* METRICS */}
      <div className="og-metrics">
        <div className="og-metric">
          <div className="og-metric-label">{t.organizer.ticketsSold}</div>
          <div className="og-metric-value">{totalTicketsSold}</div>
          <div className="og-metric-change">{totalEvents} {totalEvents !== 1 ? t.organizer.eventPlural : t.organizer.eventSingular} · {totalCapacity} {t.organizer.capacityLabel}</div>
          <div className="og-metric-change">{t.organizer.totalTickets}</div>
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

      {/* REVENUE CHART SECTION */}
      <div className="og-section">
        <div className="og-section-title">{t.organizer.weeklyRevenue}</div>
        <div className="og-chart">
          <div className="og-bar" style={{ height: '45%' }} />
          <div className="og-bar highlight" style={{ height: '78%' }} />
          <div className="og-bar" style={{ height: '52%' }} />
          <div className="og-bar" style={{ height: '68%' }} />
          <div className="og-bar" style={{ height: '38%' }} />
          <div className="og-bar" style={{ height: '85%' }} />
          <div className="og-bar" style={{ height: '62%' }} />
          <div className="og-bar" style={{ height: '55%' }} />
        </div>
        <div className="og-chart-labels">
          {t.organizer.weekDays.map((day) => (
            <div key={day} className="og-chart-label">{day}</div>
          ))}
          <div className="og-chart-label">{t.organizer.today}</div>
        </div>
      </div>

      {/* EVENTS SECTION */}
      <div className="og-section">
        <div className="og-section-title">{t.organizer.myEvents}</div>

        {events.length === 0 ? (
          <div className="og-empty-state">
            <div className="og-empty-icon">📭</div>
            <div className="og-empty-title">{t.organizer.noEvents}</div>
            <div className="og-empty-text">
              {t.organizer.noEventsDesc}
            </div>
            <button
              className="og-btn-new"
              onClick={() => navigate('/event-form')}
              style={{ marginTop: '16px' }}
            >
              {t.organizer.newEvent}
            </button>
          </div>
        ) : (
          <>
            <div className="og-events">
              {events.map((stats) => {
                const event = stats.event;
                const progress =
                  stats.capacity > 0 ? (stats.ticketsSold / stats.capacity) * 100 : 0;
                const eventDate = toDate(event.date);

                return (
                  <div key={event.id} className="og-event-card">
                    {/* EVENT IMAGE */}
                    <div
                      className="og-event-img"
                      style={{
                        backgroundImage: `url(${event.image || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"%3E%3Crect fill="%23111" width="400" height="120"/%3E%3C/svg%3E'})`,
                      }}
                    >
                      <div className="og-event-status">
                        {getStatusBadgeText(event.status)}
                      </div>
                    </div>

                    {/* EVENT BODY */}
                    <div className="og-event-body">
                      <div className="og-event-name">{event.name}</div>
                      <div className="og-event-meta">
                        {eventDate.toLocaleDateString('es-PE', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>

                      {/* PROGRESS BAR */}
                      <div className="og-event-progress">
                        <div className="og-event-bar">
                          <div
                            className="og-event-bar-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="og-event-progress-info">
                          <div>
                            <span className="og-progress-pct">{Math.round(progress)}%</span>
                          </div>
                          <div>
                            <span className="og-capacity-label">
                              {stats.ticketsSold}/{stats.capacity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EVENT ACTIONS */}
                    <div className="og-event-actions">
                      <button
                        className="og-act-btn primary"
                        onClick={() => navigate(`/event-form?id=${event.id}`)}
                      >
                        {t.common.edit}
                      </button>
                      <button
                        className="og-act-btn ghost"
                        onClick={() => navigate(`/evento/${event.slug || event.id}`)}
                      >
                        {t.common.view}
                      </button>
                      <button
                        className="og-act-btn ghost"
                        onClick={() =>
                          setExpandedEventId(
                            expandedEventId === event.id ? null : event.id
                          )
                        }
                      >
                        {expandedEventId === event.id ? '↑' : '↓'} Tiers
                      </button>
                    </div>

                    {/* EXPANDABLE TIER DETAILS */}
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
          </>
        )}
      </div>
    </div>
  );
}
