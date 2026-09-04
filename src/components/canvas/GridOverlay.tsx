import React from 'react';
import type { StampShape } from '../../types/stamp';

interface GridOverlayProps {
  shape: StampShape;
  widthMm: number;
  heightMm: number;
}

const PT_TO_MM = 25.4 / 72.0;

export const GridOverlay: React.FC<GridOverlayProps> = ({
  shape,
  widthMm,
  heightMm,
}) => {
  // Hoja Tamaño Carta estándar: 215.9 mm x 279.4 mm (21.59 cm x 27.94 cm)
  const halfPaperW = 107.95; // 215.9 / 2
  const halfPaperH = 139.7;  // 279.4 / 2

  // Medidas del sello
  const halfStampW = widthMm / 2;
  const halfStampH = heightMm / 2;

  // Grosor de línea de 0.25 pt
  const stroke025Pt = 0.25 * PT_TO_MM;

  // Marcas de centímetros de la hoja carta a lo largo del borde
  const paperTicksX = [];
  for (let cm = 0; cm <= 21; cm++) {
    const xPos = -halfPaperW + cm * 10;
    if (xPos <= halfPaperW) {
      paperTicksX.push({ cm, xPos });
    }
  }

  const paperTicksY = [];
  for (let cm = 0; cm <= 27; cm++) {
    const yPos = -halfPaperH + cm * 10;
    if (yPos <= halfPaperH) {
      paperTicksY.push({ cm, yPos });
    }
  }

  return (
    <g className="grid-overlay pointer-events-none select-none">
      <defs>
        {/* Cuadrícula milimétrica (1 mm) */}
        <pattern id="mmGrid1" width="2" height="2" patternUnits="userSpaceOnUse">
          <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#f1f5f9" strokeWidth="0.1" />
        </pattern>
        {/* Cuadrícula centimétrica (10 mm = 1 cm) */}
        <pattern id="cmGrid10" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="url(#mmGrid1)" />
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.25" />
        </pattern>
      </defs>

      {/* 1. FONDO DE HOJA CARTA (21.59 x 27.94 cm) */}
      <rect
        x={-halfPaperW}
        y={-halfPaperH}
        width={215.9}
        height={279.4}
        fill="#ffffff"
      />
      <rect
        x={-halfPaperW}
        y={-halfPaperH}
        width={215.9}
        height={279.4}
        fill="url(#cmGrid10)"
      />
      {/* Borde exterior de la hoja carta */}
      <rect
        x={-halfPaperW}
        y={-halfPaperH}
        width={215.9}
        height={279.4}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="0.5"
      />

      {/* 2. REGLAS PERIMETRALES DE LA HOJA CARTA (en cm) */}
      {/* Regla Superior de la Hoja */}
      <g className="paper-ruler-top">
        <rect
          x={-halfPaperW}
          y={-halfPaperH}
          width={215.9}
          height="5.5"
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="0.3"
        />
        {paperTicksX.map((t) => (
          <g key={`ptop-${t.cm}`}>
            <line
              x1={t.xPos}
              y1={-halfPaperH}
              x2={t.xPos}
              y2={-halfPaperH + (t.cm % 5 === 0 ? 3.8 : 2.2)}
              stroke="#64748b"
              strokeWidth={t.cm % 5 === 0 ? 0.35 : 0.2}
            />
            {t.cm % 2 === 0 && (
              <text
                x={t.xPos}
                y={-halfPaperH + 4.8}
                textAnchor="middle"
                fill="#475569"
                fontSize="2.1"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {t.cm}
              </text>
            )}
          </g>
        ))}
      </g>

      {/* Regla Izquierda de la Hoja */}
      <g className="paper-ruler-left">
        <rect
          x={-halfPaperW}
          y={-halfPaperH}
          width="5.5"
          height={279.4}
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="0.3"
        />
        {paperTicksY.map((t) => (
          <g key={`pleft-${t.cm}`}>
            <line
              x1={-halfPaperW}
              y1={t.yPos}
              x2={-halfPaperW + (t.cm % 5 === 0 ? 3.8 : 2.2)}
              y2={t.yPos}
              stroke="#64748b"
              strokeWidth={t.cm % 5 === 0 ? 0.35 : 0.2}
            />
            {t.cm % 2 === 0 && (
              <text
                x={-halfPaperW + 4.5}
                y={t.yPos + 0.8}
                textAnchor="end"
                fill="#475569"
                fontSize="2.1"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {t.cm}
              </text>
            )}
          </g>
        ))}
      </g>

      {/* Ejes centrales cruzados en (0,0) */}
      <line x1={-halfPaperW + 5.5} y1="0" x2={halfPaperW} y2="0" stroke="#38bdf8" strokeWidth="0.25" strokeDasharray="2 2" opacity="0.4" />
      <line x1="0" y1={-halfPaperH + 5.5} x2="0" y2={halfPaperH} stroke="#38bdf8" strokeWidth="0.25" strokeDasharray="2 2" opacity="0.4" />

      {/* 3. LÍNEAS GUÍA DOBLES DEL SELLO (0.25 PT GRIS CLARO: EXTERIOR MEDIDA EXACTA + INTERIOR 1MM LÍMITE DE DISEÑO) */}
      <g className="stamp-double-guides">
        {shape === 'circle' ? (
          <>
            {/* Línea Exterior: Diámetro exacto del sello (ej. 50mm / 5cm) con 0.25pt gris */}
            <circle
              cx="0"
              cy="0"
              r={halfStampW}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={stroke025Pt}
            />
            {/* Línea Interior: 1mm más pequeña dentro (Límite del diseño) con 0.25pt gris */}
            <circle
              cx="0"
              cy="0"
              r={Math.max(1, halfStampW - 1)}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={stroke025Pt}
            />
          </>
        ) : (
          <>
            {/* Línea Exterior: Medida exacta del rectángulo/cuadrado con 0.25pt gris */}
            <rect
              x={-halfStampW}
              y={-halfStampH}
              width={widthMm}
              height={heightMm}
              fill="none"
              stroke="#94a3b8"
              strokeWidth={stroke025Pt}
            />
            {/* Línea Interior: 1mm más pequeña todo alrededor con 0.25pt gris */}
            <rect
              x={-halfStampW + 1}
              y={-halfStampH + 1}
              width={Math.max(2, widthMm - 2)}
              height={Math.max(2, heightMm - 2)}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth={stroke025Pt}
            />
          </>
        )}
      </g>
    </g>
  );
};
