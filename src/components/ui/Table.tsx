import React from 'react';

export const TableWrap: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-surface border border-border rounded-2xl overflow-hidden shadow-xl ${className}`}>
    <div className="overflow-x-auto">{children}</div>
  </div>
);

export const Thead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead>
    <tr className="bg-surface-2 border-b border-border-soft text-muted font-mono text-[11px] uppercase tracking-wider">
      {children}
    </tr>
  </thead>
);

export const Tbody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="divide-y divide-border-soft">{children}</tbody>
);

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

export const Tr: React.FC<RowProps> = ({ clickable, className = '', children, ...rest }) => (
  <tr className={`${clickable ? 'hover:bg-surface-2 cursor-pointer transition-colors group' : ''} ${className}`} {...rest}>
    {children}
  </tr>
);
