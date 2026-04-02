import type { HTMLAttributes, ReactNode } from 'react';

interface StatProps extends HTMLAttributes<HTMLDivElement> {
  label: ReactNode;
  value: ReactNode;
  caption?: ReactNode;
}

export function Stat({
  label,
  value,
  caption,
  className = '',
  ...props
}: StatProps) {
  return (
    <div className={`ds-v3-stat ${className}`.trim()} {...props}>
      <div className="ds-v3-stat-label">{label}</div>
      <div className="ds-v3-stat-value">{value}</div>
      {caption ? <div className="ds-v3-stat-caption">{caption}</div> : null}
    </div>
  );
}
