import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  raised?: boolean;
  glow?: boolean;
  padded?: boolean;
}

export function Card({
  children,
  className = '',
  raised = false,
  glow = false,
  padded = true,
  ...props
}: CardProps) {
  const classes = [
    'ds-v3-surface',
    raised ? 'ds-v3-surface--raised' : '',
    glow ? 'ds-v3-surface--glow' : '',
    padded ? 'ds-v3-panel' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
