import React from 'react';
import { COLORS } from './tokens';

interface Props {
  title: string;
  subtitle: string;
}

// Logo + RESIDUI used to live here too, but AppShell's MobileTopBar now shows
// both persistently above this — keep just the per-screen context line.
export const Header: React.FC<Props> = ({ title, subtitle }) => (
  <div
    style={{
      padding: '14px 16px 12px',
      borderBottom: `1px solid ${COLORS.borderDivider}`,
    }}
  >
    <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
    <div style={{ fontSize: 11, color: COLORS.textMuted }}>{subtitle}</div>
  </div>
);
