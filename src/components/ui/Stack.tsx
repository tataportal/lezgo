import type { HTMLAttributes, ReactNode } from 'react';

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  size?: 'md' | 'lg';
}

export function Stack({ children, className = '', size = 'md', ...props }: StackProps) {
  const sizeClass = size === 'lg' ? 'ds-v3-stack--lg' : '';
  return (
    <div className={`ds-v3-stack ${sizeClass} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
