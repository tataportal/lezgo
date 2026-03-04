import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvents } from '../services/eventService';
import type { Event } from '../lib/types';
import './PromoterPage.css';

interface EventCardProps {
  event: Event;
}

function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="event-card"
      onClick={() => navigate(`/evento/${event.slug}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="event-image">
        <img src={event.image || ''} alt={event.name || ''} />
        <div className="event-status">{event.status || ''}</div>
      </div>
      <div className="event-details">
        <h3>{event.name || ''}</h3>
        <p className="event-subtitle">{event.subtitle || ''}</p>
        <div className="event-meta">
          <span className="event-date">{event.dateLabel || ''}</span>
          <span className="event-venue">{event.venue || ''}</span>
        </div>
      </div>
    </div>
  );
}

export default function PromoterPage() {
  const { promoterName } = useParams<{ promoterName: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        // Load all events and filter by organizer name
        const allEvents = await getEvents({ status: 'published' });
        const filtered = allEvents.filter(
          (event) => event.organizer === promoterName
        );
        setEvents(filtered);
      } catch (error) {
        console.error('Error loading promoter events:', error);
      } finally {
        setLoading(false);
      }
    };

    if (promoterName) {
      loadEvents();
    }
  }, [promoterName]);

  return (
    <div className="promoter-page">
      <button className="back-link" onClick={() => navigate('/eventos')}>
        ← Volver a eventos
      </button>

      <div className="promoter-header">
        <div className="promoter-avatar">
          <div className="avatar-circle">
            {promoterName?.charAt(0).toUpperCase()}
          </div>
          <div className="verified-ring"></div>
        </div>
        <div className="promoter-info">
          <div className="promoter-name">
            {promoterName}
            <span className="checkmark">✓</span>
          </div>
          <div className="promoter-status">
            Productor verificado · {events.length} evento{events.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="promoter-content">
        {loading ? (
          <div className="loading">Cargando eventos...</div>
        ) : events.length > 0 ? (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="no-events">
            <p>No hay eventos publicados de este productor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
