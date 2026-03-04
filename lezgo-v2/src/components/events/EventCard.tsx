import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Event } from '../../lib/types';
import { formatDateES, formatPriceShort, getActivePhase, toDate } from '../../lib/helpers';
import './EventCard.css';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/evento/${event.id}`);
  };

  // Get lowest price from active phase in tiers
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
  const imageUrl = event.image || 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
  const backgroundImage = event.image
    ? `url(${imageUrl})`
    : 'none';

  const backgroundStyle: React.CSSProperties = event.image
    ? { backgroundImage }
    : {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      };

  return (
    <div className="ev-card" onClick={handleClick}>
      <div className="ev-card__image-wrapper">
        <div className="ev-card__image" style={backgroundStyle} />

        {event.status === 'sold-out' && (
          <div className="ev-card__badge ev-card__badge--sold-out">AGOTADO</div>
        )}
        {event.featured && event.status !== 'sold-out' && (
          <div className="ev-card__badge ev-card__badge--featured">DESTACADO</div>
        )}
      </div>

      <div className="ev-card__content">
        <div className="ev-card__title">{event.name}</div>

        <div className="ev-card__meta">
          <span className="ev-card__date">{formatDateES(toDate(event.date))}</span>
          <span className="ev-card__venue">
            {event.venue || ''}
            {event.venue && event.location ? <span className="ev-card__location"> • {event.location}</span> : event.location ? <span className="ev-card__location">{event.location}</span> : null}
          </span>
        </div>

        <div className="ev-card__footer">
          <div className="ev-card__price">
            {lowestPrice !== null ? (
              <>
                <span className="ev-card__price-label">Desde</span>
                <span className="ev-card__price-value">{formatPriceShort(lowestPrice)}</span>
              </>
            ) : (
              <span className="ev-card__price-value">---</span>
            )}
          </div>

          <div className="ev-card__verified">
            <span className="ev-card__verified-check">✓</span>
          </div>
        </div>
      </div>
    </div>
  );
};
