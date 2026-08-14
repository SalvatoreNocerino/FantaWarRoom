import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<Props> = ({ children, className = '' }) => (
  <div className={`py-6 text-center text-xs text-faint ${className}`}>{children}</div>
);
