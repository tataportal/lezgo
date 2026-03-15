import type { BadgeVariant } from '../../lib/constants';
import './EventBadge.css';

interface EventBadgeProps {
  label: string;
  variant: BadgeVariant;
  position: 'left' | 'right';
}

export function EventBadge({ label, variant, position }: EventBadgeProps) {
  return (
    <span
      className={`ev-badge ev-badge--${variant} ev-badge--${position}`}
    >
      {label}
    </span>
  );
}
