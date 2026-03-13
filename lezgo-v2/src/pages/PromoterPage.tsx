import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvents } from '../services/eventService';
import { useTranslation } from '../i18n';
import type { Event } from '../lib/types';
import './PromoterPage.css';

interface PromoCardProps {
  event: Event;
}

function PromoCard({ event }: PromoCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="promo-card"
      onClick={() => navigate(`/evento/${event.slug}`)}
    >
      <div className="promo-card-img">
        <img src={event.image || ''} alt={event.name || ''} />
      </div>
      <div className="promo-card-body">
        <div className="promo-tag">{event.status || ''}</div>
        <h3>{event.name || ''}</h3>
        <p>{event.subtitle || ''}</p>
        <p>{event.dateLabel || ''}</p>
      </div>
    </div>
  );
}

export default function PromoterPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        // Load all events and filter by organizer name
        const allEvents = await getEvents({ status: 'published' });
        const filtered = allEvents.filter(
          (event) => event.organizer === name
        );
        setEvents(filtered);
      } catch (error) {
        console.error('Error loading promoter events:', error);
      } finally {
        setLoading(false);
      }
    };

    if (name) {
      loadEvents();
    }
  }, [name]);

  return (
    <div className="pf">
      <button className="pf-back" onClick={() => navigate('/')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        {t.promoter.backToEvents}
      </button>

      <div className="pf-header">
        <div className="pf-avatar">
          <div className="pf-verified-ring"></div>
          {name?.charAt(0).toUpperCase()}
        </div>
        <div className="pf-info">
          <h1>
            {name}
            <span className="pf-check">✓</span>
          </h1>
          <div className="pf-meta">
            {t.promoter.verified} <span>{events.length} {events.length !== 1 ? t.promoter.eventPlural : t.promoter.eventSingular}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="pf-loading">{t.promoter.loadingEvents}</div>
      ) : events.length > 0 ? (
        <>
          <h2 className="promotor-events-title">{t.promoter.theirEvents}</h2>
          <div className="promotor-events-grid">
            {events.map((event) => (
              <PromoCard key={event.id} event={event} />
            ))}
          </div>
        </>
      ) : (
        <div className="pf-empty">
          <p>{t.promoter.noEvents}</p>
        </div>
      )}
    </div>
  );
}
