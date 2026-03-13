import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import type { Event } from '../../lib/types';
import { formatDateShort, formatPriceShort, getActivePhase, getEventImage, toDate } from '../../lib/helpers';
import './EventCard.css';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
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
  const img = getEventImage(event.id, event.image);
  const backgroundStyle: React.CSSProperties = { backgroundImage: `url(${img})` };

  // Badge logic — matches monolith: sold-out = hot red, featured = nuevo acid border
  const getBadge = () => {
    if (event.status === 'sold-out') return { text: t.common.soldOut, className: 'ev-card__badge--sold-out' };
    if (event.featured) return { text: t.common.published === 'Publicado' ? 'Destacado' : t.common.published, className: 'ev-card__badge--featured' };
    return null;
  };

  const badge = getBadge();

  return (
    <div className="ev-card" onClick={handleClick}>
      <div className="ev-card__image-wrapper">
        <div className="ev-card__image" style={backgroundStyle} />

        {badge && (
          <div className={`ev-card__badge ${badge.className}`}>{badge.text}</div>
        )}
      </div>

      <div className="ev-card__content">
        {/* Date first, then name, then venue — matches monolith order */}
        <div className="ev-card__date">{formatDateShort(toDate(event.date))}</div>
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
