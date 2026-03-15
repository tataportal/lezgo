import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import type { Event } from '../../lib/types';
import { formatDateShort, formatPriceShort, getActivePhase, getEventImage, toDate } from '../../lib/helpers';
import './EventCard.css';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = () => {
    navigate(`/evento/${event.slug || event.id}`);
  };

  const getLowestPrice = (): number | null => {
    let lowest: number | null = null;
    for (const tier of (event.tiers || [])) {
      const activePhase = getActivePhase(tier);
      if (activePhase) {
        if (lowest === null || activePhase.price < lowest) {
          lowest = activePhase.price;
        }
      }
    }
    return lowest;
  };

  const lowestPrice = getLowestPrice();
  const img = getEventImage(event.id, event.image, event.genre);
  const backgroundStyle: React.CSSProperties = { backgroundImage: `url(${img})` };

  // Badge logic — matches monolith: sold-out = hot red, featured = nuevo acid border
  const getBadge = () => {
    if (event.status === 'sold-out') return { text: t.common.soldOut, className: 'ev-card__badge--sold-out' };
    if (event.featured) return { text: t.home?.featured || '★', className: 'ev-card__badge--featured' };
    return null;
  };

  const badge = getBadge();

  return (
    <div className="ev-card" onClick={handleClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }} role="link" tabIndex={0} aria-label={event.name}>
      <div className="ev-card__image-wrapper">
        <div className="ev-card__image" style={backgroundStyle} />

        {badge && (
          <div className={`ev-card__badge ${badge.className}`}>{badge.text}</div>
        )}
      </div>

      <div className="ev-card__content">
        {/* Date first, then name, then venue — matches monolith order */}
        <div className="ev-card__date">{formatDateShort(toDate(event.date), t.home.monthsFull)}</div>
        <div className="ev-card__title">{event.name}</div>
        <div className="ev-card__venue">
          {event.venue || ''}
          {event.venue && event.location ? `, ${event.location}` : event.location || ''}
        </div>

        <div className="ev-card__footer">
          <span className="ev-card__price">
            {lowestPrice !== null ? formatPriceShort(lowestPrice) : '---'}
          </span>
          <span className="ev-card__verified">☺ {t.common.verified}</span>
        </div>
      </div>
    </div>
  );
};

const MemoizedEventCard = memo(EventCard);
export default MemoizedEventCard;
export { MemoizedEventCard as EventCard };
