import React from 'react';

type Variant = 'default' | 'mono' | 'money';

const variantClass: Record<Variant, string> = {
  default: 'text-ink font-semibold',
  mono: 'text-ink font-mono',
  money: 'text-warning font-mono font-bold',
};

const fieldBase =
  'w-full box-border bg-field border border-border-strong rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors placeholder:text-faint';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: Variant;
}

export const Input: React.FC<InputProps> = ({ variant = 'default', className = '', ...rest }) => (
  <input className={`${fieldBase} ${variantClass[variant]} ${className}`} {...rest} />
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea: React.FC<TextareaProps> = ({ className = '', ...rest }) => (
  <textarea className={`${fieldBase} text-ink resize-none ${className}`} {...rest} />
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select: React.FC<SelectProps> = ({ className = '', children, ...rest }) => (
  <select className={`${fieldBase} text-ink cursor-pointer ${className}`} {...rest}>
    {children}
  </select>
);
