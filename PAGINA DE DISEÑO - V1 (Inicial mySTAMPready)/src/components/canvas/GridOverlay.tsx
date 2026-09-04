import React from 'react';
import type { StampShape } from '../../types/stamp';

interface GridOverlayProps {
  shape: StampShape;
  widthMm: number;
  heightMm: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({
  shape,
  widthMm,
  heightMm,
}) => {
  // Tapete fijo de 20x20 cm (200x200 mm): desde -100mm hasta +100mm
  const halfStampW = widthMm / 2;
  const halfStampH = heightMm / 2;

  // Marcas de centímetros (-9cm a +9cm)
  const cmTicks = [-80, -60, -40, -20, 20, 40, 60, 80];

  return (
    <g className="grid-overlay pointer-events-none select-none">
      <defs>
        {/* Cuadrícula milímetro a milímetro (1 mm) */}
        <pattern id="mmGrid1" width="2" height="2" patternUnits="userSpaceOnUse">
          <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#e2e8f0" strokeWidth="0.15" />
        </pattern>
        {/* Cuadrícula centímetro a centímetro (10 mm = 1 cm) */}
        <pattern id="cmGrid10" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="url(#mmGrid1)" />
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#cbd5e1" strokeWidth="0.4" />
        </pattern>
      </defs>

      {/* Fondo cuadriculado del tapete de 20x20 cm */}
      <rect x="-100" y="-100" width="200" height="200" fill="url(#cmGrid10)" />

      {/* Borde exterior del tapete de 20x20 cm */}
      <rect
        x="-99.5"
        y="-99.5"
        width="199"
        height="199"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="0.8"
      />

      {/* Ejes centrales cruzados en (0,0) */}
      <line x1="-100" y1="0" x2="100" y2="0" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="2 2" />
      <line x1="0" y1="-100" x2="0" y2="100" stroke="#0ea5e9" strokeWidth="0.5" strokeDasharray="2 2" />

      {/* Marcas numéricas de centímetros sobre los ejes */}
      {cmTicks.map((pos) => (
        <g key={`cm-${pos}`}>
          <line x1={pos} y1="-2" x2={pos} y2="2" stroke="#64748b" strokeWidth="0.4" />
          <text
            x={pos}
            y="4.5"
            textAnchor="middle"
            fill="#64748b"
            fontSize="3"
            fontFamily="monospace"
          >
            {pos / 10}
          </text>

          <line x1="-2" y1={pos} x2="2" y2={pos} stroke="#64748b" strokeWidth="0.4" />
          <text
            x="-4.5"
            y={pos + 1}
            textAnchor="end"
            fill="#64748b"
            fontSize="3"
            fontFamily="monospace"
          >
            {pos / 10}
          </text>
        </g>
      ))}

      {/* Línea guía del tamaño exacto del sello seleccionado */}
      {shape === 'circle' ? (
        <g>
          {/* Círculo límite real */}
          <circle
            cx="0"
            cy="0"
            r={halfStampW}
            fill="none"
            stroke="#0284c7"
            strokeWidth="0.6"
            strokeDasharray="2 1.5"
          />
          {/* Etiqueta de medida */}
          <text
            x="0"
            y={halfStampW + 4}
            textAnchor="middle"
            fill="#0284c7"
            fontSize="3.2"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            SELLO REDONDO: Ø {widthMm} mm ({widthMm / 10} cm)
          </text>
        </g>
      ) : (
        <g>
          {/* Rectángulo límite real */}
          <rect
            x={-halfStampW}
            y={-halfStampH}
            width={widthMm}
            height={heightMm}
            rx="1"
            fill="none"
            stroke="#0284c7"
            strokeWidth="0.6"
            strokeDasharray="2 1.5"
          />
          {/* Etiqueta de medida */}
          <text
            x="0"
            y={halfStampH + 4}
            textAnchor="middle"
            fill="#0284c7"
            fontSize="3.2"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            SELLO: {widthMm} x {heightMm} mm ({(widthMm / 10).toFixed(1)} x {(heightMm / 10).toFixed(1)} cm)
          </text>
        </g>
      )}

      {/* Rótulo del tapete de 20x20 cm */}
      <text
        x="-96"
        y="-94"
        fill="#64748b"
        fontSize="3"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        MESA DE TRABAJO: 20 x 20 cm (Escala Real 1:1)
      </text>
    </g>
  );
};
