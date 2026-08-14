import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Slider: React.FC<Props> = ({ className = '', ...rest }) => (
  <input type="range" className={`w-full h-2 bg-surface-2 rounded-lg accent-accent cursor-pointer ${className}`} {...rest} />
);
