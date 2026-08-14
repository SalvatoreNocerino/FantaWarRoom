import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** surface = top-level card (bgCard); nested = inset panel inside a card (bgSurface2). */
  variant?: 'surface' | 'nested';
  as?: 'div' | 'section';
}

export const Card: React.FC<CardProps> = ({ variant = 'surface', as = 'div', className = '', children, ...rest }) => {
  const Tag = as;
  const base = variant === 'nested' ? 'bg-surface-2 rounded-xl' : 'bg-surface border border-border rounded-2xl';
  return (
    <Tag className={`${base} ${className}`} {...rest}>
      {children}
    </Tag>
  );
};
