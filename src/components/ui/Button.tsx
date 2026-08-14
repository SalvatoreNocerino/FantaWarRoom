import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink hover:brightness-110 shadow-lg shadow-accent/20',
  secondary: 'bg-field border border-accent/30 text-accent hover:border-accent',
  ghost: 'bg-transparent border border-border-strong text-ink-soft hover:bg-surface-2',
  destructive: 'bg-transparent text-faint hover:text-negative',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-sm rounded-xl',
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button: React.FC<Props> = ({ variant = 'primary', size = 'md', className = '', children, ...rest }) => (
  <button
    type={rest.type ?? 'button'}
    className={`inline-flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${className}`}
    {...rest}
  >
    {children}
  </button>
);
