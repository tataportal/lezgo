import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface TabsProps {
  children: ReactNode;
  className?: string;
}

interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export function Tabs({ children, className = '' }: TabsProps) {
  return <div className={`ds-v3-tabs ${className}`.trim()}>{children}</div>;
}

export function TabButton({
  active = false,
  children,
  className = '',
  type = 'button',
  ...props
}: TabButtonProps) {
  return (
    <button
      type={type}
      className={`ds-v3-tab ${active ? 'is-active' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
