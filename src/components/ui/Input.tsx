import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Input({ className = '', ...props }: InputProps) {
  return <input className={`ds-v3-input ${className}`.trim()} {...props} />;
}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return <textarea className={`ds-v3-input ds-v3-input--textarea ${className}`.trim()} {...props} />;
}
