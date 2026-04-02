import type { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'accent' | 'success' | 'muted';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
}

export function Badge({
  children,
  className = '',
  variant = 'muted',
  ...props
}: BadgeProps) {
  return (
    <span className={`ds-v3-badge ds-v3-badge--${variant} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
