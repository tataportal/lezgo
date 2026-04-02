import type { ReactNode } from 'react';

interface FieldProps {
  label?: string;
  help?: string;
  children: ReactNode;
}

export function Field({ label, help, children }: FieldProps) {
  return (
    <label className="ds-v3-field">
      {label ? <span className="ds-v3-field-label">{label}</span> : null}
      {children}
      {help ? <span className="ds-v3-field-help">{help}</span> : null}
    </label>
  );
}
