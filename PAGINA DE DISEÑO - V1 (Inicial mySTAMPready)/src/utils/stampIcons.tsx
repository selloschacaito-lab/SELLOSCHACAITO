import React from 'react';

export const STAMP_ICONS: Record<string, { label: string; render: (color: string) => React.ReactNode }> = {
  star: {
    label: 'Estrella Clásica',
    render: (color) => (
      <polygon
        points="0,-18 5.5,-5.5 19,-5.5 8.5,3 12.5,16 0,8.5 -12.5,16 -8.5,3 -19,-5.5 -5.5,-5.5"
        fill={color}
      />
    ),
  },
  scale: {
    label: 'Balanza de la Justicia',
    render: (color) => (
      <g fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="0" y1="-18" x2="0" y2="18" />
        <line x1="-18" y1="-12" x2="18" y2="-12" />
        <path d="M-22,-4 L-14,-4 L-18,6 Z" fill={color} />
        <path d="M14,-4 L22,-4 L18,6 Z" fill={color} />
        <line x1="-18" y1="-12" x2="-18" y2="-4" />
        <line x1="18" y1="-12" x2="18" y2="-4" />
        <path d="M-10,18 L10,18" />
      </g>
    ),
  },
  cross: {
    label: 'Cruz Médica',
    render: (color) => (
      <path
        d="M-5,-16 L5,-16 L5,-5 L16,-5 L16,5 L5,5 L5,16 L-5,16 L-5,5 L-16,5 L-16,-5 L-5,-5 Z"
        fill={color}
      />
    ),
  },
  shield: {
    label: 'Escudo de Seguridad',
    render: (color) => (
      <path
        d="M0,-16 Q14,-14 14,0 Q14,14 0,18 Q-14,14 -14,0 Q-14,-14 0,-16 Z"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      />
    ),
  },
  crown: {
    label: 'Corona Real',
    render: (color) => (
      <polygon
        points="-16,-6 -10,12 10,12 16,-6 8,0 0,-12 -8,0"
        fill={color}
      />
    ),
  },
  ribbon: {
    label: 'Cinta de Certificación',
    render: (color) => (
      <g fill={color}>
        <circle cx="0" cy="-4" r="10" fill="none" stroke={color} strokeWidth="2.5" />
        <polygon points="-5,6 -10,18 0,14 10,18 5,6" />
      </g>
    ),
  },
  check: {
    label: 'Aprobado / Check',
    render: (color) => (
      <path
        d="M-12,0 L-4,8 L14,-10"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
};
