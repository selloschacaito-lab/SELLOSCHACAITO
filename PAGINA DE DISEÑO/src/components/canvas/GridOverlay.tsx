import React from 'react';
import type { StampShape } from '../../types/stamp';

interface GridOverlayProps {
  shape: StampShape;
  widthMm: number;
  heightMm: number;
  viewWidth: number;
  viewHeight: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({
  shape,
  widthMm,
  heightMm,
  viewWidth,
  viewHeight,
}) => {
  const halfW = viewWidth / 2;
  const halfH = viewHeight / 2;

  const boundW = halfW * 0.94;
  const boundH = halfH * 0.94;

  return (
    <g className="grid-overlay opacity-40 pointer-events-none select-none">
      <defs>
        <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#64748b" strokeWidth="0.4" />
        </pattern>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="url(#smallGrid)" />
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#94a3b8" strokeWidth="0.8" />
        </pattern>
      </defs>

      <rect
        x={-halfW}
        y={-halfH}
        width={viewWidth}
        height={viewHeight}
        fill="url(#grid)"
      />

      {/* Ejes centrales cruzados */}
      <line
        x1={-halfW}
        y1="0"
        x2={halfW}
        y2="0"
        stroke="#38bdf8"
        strokeWidth="0.75"
        strokeDasharray="3 3"
      />
      <line
        x1="0"
        y1={-halfH}
        x2="0"
        y2={halfH}
        stroke="#38bdf8"
        strokeWidth="0.75"
        strokeDasharray="3 3"
      />

      {/* Borde exterior guía según la forma */}
      {shape === 'circle' ? (
        <>
          <circle
            cx="0"
            cy="0"
            r={boundW}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <circle
            cx="0"
            cy="0"
            r={boundW * 0.75}
            fill="none"
            stroke="#64748b"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
        </>
      ) : (
        <>
          <rect
            x={-boundW}
            y={-boundH}
            width={boundW * 2}
            height={boundH * 2}
            rx="4"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
          <rect
            x={-boundW * 0.8}
            y={-boundH * 0.8}
            width={boundW * 1.6}
            height={boundH * 1.6}
            rx="2"
            fill="none"
            stroke="#64748b"
            strokeWidth="0.5"
            strokeDasharray="2 2"
          />
        </>
      )}

      {/* Etiqueta de medida física */}
      <text
        x="0"
        y={halfH - 6}
        textAnchor="middle"
        fill="#38bdf8"
        fontSize="7"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        LÍMITE DE PLACA: {widthMm} x {heightMm} mm
      </text>
    </g>
  );
};
