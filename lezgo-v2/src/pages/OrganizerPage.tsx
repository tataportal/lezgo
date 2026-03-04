import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getEventsByOrganizer } from '../services/eventService';
import { getTicketsByEvent } from '../services/ticketService';
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
          const capacity = event.tiers.reduce((sum, tier) => sum + tier.capacity, 0);

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
  const checkInRate =
    totalCapacity > 0
      ? Math.round((totalTicketsSold / totalCapacity) * 100)
      : 0;

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publicado';
      case 'draft':
        return 'Borrador';
      case 'sold-out':
        return 'Agotado';
      case 'past':
        return 'Pasado';
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'status-published';
      case 'draft':
        return 'status-draft';
      case 'sold-out':
        return 'status-sold-out';
      case 'past':
        return 'status-past';
      default:
        return '';
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
    <div className="organizer-page">
      {/* Header */}
      <div className="organizer-header">
        <div className="organizer-header-content">
          <div className="organizer-badge">MODO ORGANIZADOR</div>
          <h1 className="organizer-title">Dashboard</h1>
          <button
            className="organizer-btn-create"
            onClick={() => navigate('/event-form')}
          >
            Crear evento
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="organizer-stats-grid">
        <div className="stat-card">
          <div className="stat-label">Ingresos Totales</div>
          <div className="stat-value">{formatPrice(totalRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Entradas Vendidas</div>
          <div className="stat-value">{totalTicketsSold}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Eventos</div>
          <div className="stat-value">{totalEvents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tasa de Check-in</div>
          <div className="stat-value">{checkInRate}%</div>
        </div>
      </div>

      {/* Events List */}
      <div className="organizer-events-section">
        <h2 className="organizer-section-title">Mis Eventos</h2>

        {events.length === 0 ? (
          <div className="organizer-empty">
            <p>No tienes eventos aún. Crea tu primer evento para comenzar.</p>
            <button
              className="organizer-btn-primary"
              onClick={() => navigate('/event-form')}
            >
              Crear evento
            </button>
          </div>
        ) : (
          <div className="organizer-events-list">
            {events.map((stats) => {
              const event = stats.event;
              const progress = stats.capacity > 0 ? (stats.ticketsSold / stats.capacity) * 100 : 0;
              const eventDate = toDate(event.date);

              return (
                <div key={event.id} className="event-card">
                  <div className="event-card-header">
                    <div className="event-card-image">
                      <img src={event.image} alt={event.name} />
                    </div>
                    <div className="event-card-info">
                      <h3 className="event-card-name">{event.name}</h3>
                      <p className="event-card-date">
                        {eventDate.toLocaleDateString('es-PE', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="event-card-status">
                        <span className={`status-badge ${getStatusBadgeClass(event.status)}`}>
                          {getStatusBadgeText(event.status)}
                        </span>
                      </div>
                    </div>
                    <div className="event-card-meta">
                      <div className="event-card-meta-item">
                        <span className="meta-label">Vendidas</span>
                        <span className="meta-value">
                          {stats.ticketsSold}/{stats.capacity}
                        </span>
                      </div>
                      <div className="event-card-meta-item">
                        <span className="meta-label">Ingresos</span>
                        <span className="meta-value">{formatPrice(stats.revenue)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="event-progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>

                  {/* Actions */}
                  <div className="event-card-actions">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => navigate(`/event-form?id=${event.id}`)}
                    >
                      Editar
                    </button>
                    <button
                      className="action-btn view-btn"
                      onClick={() => navigate(`/evento/${event.id}`)}
                    >
                      Ver
                    </button>
                    <button
                      className="action-btn expand-btn"
                      onClick={() =>
                        setExpandedEventId(
                          expandedEventId === event.id ? null : event.id
                        )
                      }
                    >
                      {expandedEventId === event.id ? '↑' : '↓'} Detalles
                    </button>
                  </div>

                  {/* Expandable Tier Details */}
                  {expandedEventId === event.id && (
                    <div className="event-tier-details">
                      <table className="tier-table">
                        <thead>
                          <tr>
                            <th>Tipo de Entrada</th>
                            <th>Vendidas</th>
                            <th>Capacidad</th>
                            <th>Ingresos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {event.tiers.map((tier) => {
                            const tierRevenue = tier.sold * (tier.phases[0]?.price || 0);
                            return (
                              <tr key={tier.id}>
                                <td className="tier-name">{tier.name}</td>
                                <td className="tier-sold">{tier.sold}</td>
                                <td className="tier-capacity">{tier.capacity}</td>
                                <td className="tier-revenue">
                                  {formatPrice(tierRevenue)}
                                </td>
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
    </div>
  );
}
