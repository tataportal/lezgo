import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import type { Event } from '../../lib/types';
import { formatDateShort, formatPriceShort, getActivePhase, getEventImage, getEventBadges, toDate } from '../../lib/helpers';
import { EventBadge } from './EventBadge';
import './EventCard.css';

/** Strip [DEMO] prefix and badge text from display names */
const cleanName = (s?: string) =>
  s ? s.replace(/^\[DEMO\]\s*/i, '').replace(/\s*[—–-]\s*Early Supporter Badge/gi, '').trim() : s;

interface EventCardProps {
  event: Event;
  /** Pass true when resale listings exist for this event */
  hasResaleListings?: boolean;
  /** Pass true when presale sold out in < 24h */
  presaleSoldInOneDay?: boolean;
  /** Pass true when event is exclusive to Lezgo */
  isExclusive?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, hasResaleListings, presaleSoldInOneDay, isExclusive }) => {
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

  const badges = getEventBadges(event, { hasResaleListings, presaleSoldInOneDay, isExclusive });

  return (
    <div className="ev-card" onClick={handleClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }} role="link" tabIndex={0} aria-label={event.name}>
      <div className="ev-card__image-wrapper">
        <div className="ev-card__image" style={backgroundStyle} />

        {badges.adjective && (
          <EventBadge
            label={t.common.badges[badges.adjective.labelKey]}
            variant={badges.adjective.variant}
            position="left"
          />
        )}
        {badges.ticket && (
          <EventBadge
            label={t.common.badges[badges.ticket.labelKey]}
            variant={badges.ticket.variant}
            position="right"
          />
        )}
      </div>

      <div className="ev-card__content">
        {/* Date first, then name, then venue — matches monolith order */}
        <div className="ev-card__date">{formatDateShort(toDate(event.date), t.home.monthsFull)}</div>
        <div className="ev-card__title">{cleanName(event.name)}</div>
        <div className="ev-card__venue">
          {event.venue || ''}
          {event.venue && event.location ? `, ${event.location}` : event.location || ''}
        </div>

        <div className="ev-card__footer">
          <span className="ev-card__price">
            {lowestPrice !== null
              ? (lowestPrice === 0 ? (t.common.freeEntry || 'Entrada libre') : formatPriceShort(lowestPrice))
              : '---'}
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
