import { Link } from 'react-router-dom';

export const LongArrow = ({
  color = 'currentColor',
  length = 48,
  className = '',
}: {
  color?: string;
  length?: number;
  className?: string;
}) => (
  <svg
    className={className}
    width={length}
    height="10"
    viewBox={`0 0 ${length} 10`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <line x1="0" y1="5" x2={length - 2} y2="5" stroke={color} strokeWidth="1.5" />
    <polyline
      points={`${length - 10},0 ${length - 1},5 ${length - 10},10`}
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </svg>
);

export interface FhButtonProps {
  children: React.ReactNode;
  variant?: 'acid' | 'outline';
  className?: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  arrowLength?: number;
  arrowColor?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export function FhButton({
  children,
  variant = 'acid',
  className = '',
  to,
  href,
  onClick,
  arrowLength = 44,
  arrowColor,
  type = 'button',
  'aria-label': ariaLabel,
}: FhButtonProps) {
  const defaultColor = variant === 'outline' ? '#ebff06' : '#000';
  const color = arrowColor ?? defaultColor;
  const cls = `fh-btn fh-btn-${variant}${className ? ' ' + className : ''}`;

  if (to) {
    return (
      <Link to={to} className={cls} aria-label={ariaLabel} onClick={onClick}>
        <span>{children}</span>
        <LongArrow color={color} length={arrowLength} />
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} aria-label={ariaLabel}>
        <span>{children}</span>
        <LongArrow color={color} length={arrowLength} />
      </a>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} aria-label={ariaLabel}>
      <span>{children}</span>
      <LongArrow color={color} length={arrowLength} />
    </button>
  );
}
