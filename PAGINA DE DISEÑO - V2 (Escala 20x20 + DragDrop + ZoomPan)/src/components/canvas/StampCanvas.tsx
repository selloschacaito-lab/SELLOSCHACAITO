import React, { forwardRef, useState, useRef, useImperativeHandle, useCallback, useEffect } from 'react';
import type {
  StampProject,
  StampLayer,
  FrameLayer,
  CircularTextLayer,
  CenterTextLayer,
  IconLayer,
} from '../../types/stamp';
import { describeTextArc, generateScallopedCircle } from '../../utils/svgCalculations';
import { STAMP_ICONS } from '../../utils/stampIcons';
import { GridOverlay } from './GridOverlay';
import { Move, Maximize2 } from 'lucide-react';

interface StampCanvasProps {
  project: StampProject;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer?: (layer: StampLayer) => void;
  zoom: number;
  onZoomChange?: (newZoom: number) => void;
}

export const StampCanvas = forwardRef<SVGSVGElement, StampCanvasProps>(
  ({ project, selectedLayerId, onSelectLayer, onUpdateLayer, zoom, onZoomChange }, ref) => {
    const { color, layers, showGrid, grungeEffect, shape } = project;
    const internalSvgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => internalSvgRef.current as SVGSVGElement);

    // Medidas físicas en milímetros
    const widthMm = project.widthMm || project.sizeMm || 40;
    const heightMm = project.heightMm || project.sizeMm || 40;

    // Escala del sello respecto a la medida base de 40mm
    const scaleFactor = Math.max(0.4, widthMm / 40);

    // Estado de Paneo (Desplazamiento con clic de la rueda)
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const panStartRef = useRef<{ startX: number; startY: number; initPanX: number; initPanY: number }>({
      startX: 0,
      startY: 0,
      initPanX: 0,
      initPanY: 0,
    });

    // Estado del Arrastre Táctil / Mouse de Elementos (Drag & Drop)
    const [dragState, setDragState] = useState<{
      isDragging: boolean;
      layerId: string;
      startX: number;
      startY: number;
      initOffsetX: number;
      initOffsetY: number;
    } | null>(null);

    // Manejo de zoom fluido con la rueda del ratón
    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      if (!onZoomChange) return;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(5.0, Math.max(0.2, zoom * zoomFactor));
      onZoomChange(Number(newZoom.toFixed(2)));
    };

    // Prevenir el scroll automático del navegador con el clic de la rueda
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const preventWheelDefault = (e: WheelEvent) => {
        e.preventDefault();
      };

      container.addEventListener('wheel', preventWheelDefault, { passive: false });
      return () => {
        container.removeEventListener('wheel', preventWheelDefault);
      };
    }, []);

    const getSvgCoordinates = useCallback((e: React.PointerEvent) => {
      const svg = internalSvgRef.current;
      if (!svg) return { x: 0, y: 0 };

      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };

      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      const svgPoint = point.matrixTransform(ctm.inverse());
      return { x: svgPoint.x, y: svgPoint.y };
    }, []);

    // Inicio de Paneo con la Rueda del Ratón (botón central = 1) o clic en fondo
    const handleCanvasPointerDown = (e: React.PointerEvent) => {
      if (e.button === 1 || e.altKey) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initPanX: pan.x,
          initPanY: pan.y,
        };
      }
    };

    const handlePointerDown = (e: React.PointerEvent, layer: StampLayer) => {
      if (e.button === 1) return; // Si es clic de rueda, permitir paneo

      e.stopPropagation();
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch (_) {}

      onSelectLayer(layer.id);

      const svgCoords = getSvgCoordinates(e);

      if (layer.type === 'center-text') {
        const cnt = layer as CenterTextLayer;
        setDragState({
          isDragging: true,
          layerId: layer.id,
          startX: svgCoords.x,
          startY: svgCoords.y,
          initOffsetX: cnt.offsetX || 0,
          initOffsetY: cnt.offsetY || 0,
        });
      } else if (layer.type === 'icon') {
        const ic = layer as IconLayer;
        setDragState({
          isDragging: true,
          layerId: layer.id,
          startX: svgCoords.x,
          startY: svgCoords.y,
          initOffsetX: ic.offsetX || 0,
          initOffsetY: ic.offsetY || 0,
        });
      }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      // 1. Si está paneando con la rueda del ratón
      if (isPanning) {
        const dx = e.clientX - panStartRef.current.startX;
        const dy = e.clientY - panStartRef.current.startY;
        setPan({
          x: panStartRef.current.initPanX + dx,
          y: panStartRef.current.initPanY + dy,
        });
        return;
      }

      // 2. Si está arrastrando un elemento (texto / icono)
      if (!dragState || !dragState.isDragging || !onUpdateLayer) return;

      const svgCoords = getSvgCoordinates(e);
      const dxMm = svgCoords.x - dragState.startX;
      const dyMm = svgCoords.y - dragState.startY;

      const dPercentX = (dxMm / (widthMm / 2)) * 50;
      const dPercentY = (dyMm / (heightMm / 2)) * 50;

      const currentLayer = (layers || []).find((l) => l.id === dragState.layerId);
      if (!currentLayer) return;

      if (currentLayer.type === 'center-text') {
        const cnt = currentLayer as CenterTextLayer;
        onUpdateLayer({
          ...cnt,
          offsetX: Math.round(dragState.initOffsetX + dPercentX),
          offsetY: Math.round(dragState.initOffsetY + dPercentY),
        });
      } else if (currentLayer.type === 'icon') {
        const ic = currentLayer as IconLayer;
        onUpdateLayer({
          ...ic,
          offsetX: Math.round(dragState.initOffsetX + dPercentX),
          offsetY: Math.round(dragState.initOffsetY + dPercentY),
        });
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      if (isPanning) {
        setIsPanning(false);
      }
      if (dragState) {
        try {
          (e.target as Element).releasePointerCapture(e.pointerId);
        } catch (_) {}
        setDragState(null);
      }
    };

    const handleResetView = () => {
      setPan({ x: 0, y: 0 });
      if (onZoomChange) onZoomChange(1.0);
    };

    return (
      <div
        ref={containerRef}
        className={`relative flex items-center justify-center p-8 overflow-hidden h-full w-full bg-slate-900/90 select-none touch-none ${
          isPanning ? 'cursor-grabbing' : 'cursor-default'
        }`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onAuxClick={(e) => e.preventDefault()}
      >
        {/* Botón flotante para restablecer posición y zoom */}
        {(pan.x !== 0 || pan.y !== 0 || zoom !== 1.0) && (
          <button
            onClick={handleResetView}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-sky-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition backdrop-blur-sm"
            title="Centrar mesa de trabajo y zoom 100%"
          >
            <Maximize2 size={13} />
            Centrar Vista (100%)
          </button>
        )}

        {/* Indicador de controles de navegación */}
        <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/70 border border-slate-800 px-2.5 py-1 rounded-md pointer-events-none backdrop-blur-sm">
          <Move size={12} className="text-sky-400" />
          <span>Rueda: Zoom | Clic Rueda: Panear mesa de trabajo</span>
        </div>

        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
          className="transition-transform duration-75 ease-out bg-white rounded-xl shadow-2xl p-4 border border-slate-700/60 relative"
        >
          {/* Tapete Fijo de 20x20 cm (-100mm a +100mm en viewBox) */}
          <svg
            ref={internalSvgRef}
            id="stamp-canvas-svg"
            viewBox="-100 -100 200 200"
            className="w-[520px] h-[520px] overflow-visible"
            style={{
              filter: grungeEffect > 0 ? `url(#grunge-filter)` : 'none',
              touchAction: 'none',
            }}
          >
            <defs>
              {grungeEffect > 0 && (
                <filter id="grunge-filter" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency={0.04 + (grungeEffect / 100) * 0.05}
                    numOctaves="3"
                    result="noise"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale={(grungeEffect / 100) * 1.5}
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              )}

              {/* Trazados de arcos de texto calculados en mm reales */}
              {(layers || [])
                .filter((l): l is CircularTextLayer => l.type === 'circular-text' && l.visible)
                .map((layer) => {
                  const rMm = (layer.radius / 100) * (widthMm / 2);
                  const isBottom = layer.isReversed ?? (layer.position === 'bottom');
                  const pathD = describeTextArc(0, 0, rMm, layer.startAngle, layer.sweepAngle, isBottom);

                  return <path key={`path-${layer.id}`} id={`path-${layer.id}`} d={pathD} fill="none" />;
                })}
            </defs>

            {/* Rejilla milimétrica y marcas de 20x20 cm */}
            {showGrid && (
              <GridOverlay
                shape={shape}
                widthMm={widthMm}
                heightMm={heightMm}
              />
            )}

            {/* Elementos del Sello en Escala Real */}
            <g className="stamp-elements-group">
              {(layers || []).map((layer) => {
                if (!layer.visible) return null;
                const isSelected = layer.id === selectedLayerId;
                const isDraggingThis = dragState?.layerId === layer.id;

                switch (layer.type) {
                  case 'frame': {
                    const f = layer as FrameLayer;
                    const strokeWidthMm = (f.strokeWidth || 2) * 0.2;
                    const strokeDasharray =
                      f.style === 'dashed' ? '2.5, 1.5' : f.style === 'dotted' ? '0.8, 1.2' : 'none';

                    if (shape === 'circle') {
                      const rMm = (f.radius / 100) * (widthMm / 2);

                      if (f.style === 'scalloped') {
                        const scallopedD = generateScallopedCircle(0, 0, rMm, f.scallopCount || 36, 1.2);
                        return (
                          <path
                            key={f.id}
                            d={scallopedD}
                            fill="none"
                            stroke={color}
                            strokeWidth={strokeWidthMm}
                            onClick={() => onSelectLayer(f.id)}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'stroke-sky-500 stroke-[1.2]' : ''
                            }`}
                          />
                        );
                      }

                      if (f.style === 'double') {
                        const gapMm = (f.doubleGap || 4) * 0.25;
                        return (
                          <g key={f.id} onClick={() => onSelectLayer(f.id)} className="cursor-pointer">
                            <circle
                              cx="0"
                              cy="0"
                              r={rMm}
                              fill="none"
                              stroke={color}
                              strokeWidth={strokeWidthMm}
                            />
                            <circle
                              cx="0"
                              cy="0"
                              r={Math.max(1, rMm - gapMm - strokeWidthMm)}
                              fill="none"
                              stroke={color}
                              strokeWidth={strokeWidthMm * 0.75}
                            />
                          </g>
                        );
                      }

                      return (
                        <circle
                          key={f.id}
                          cx="0"
                          cy="0"
                          r={rMm}
                          fill="none"
                          stroke={color}
                          strokeWidth={strokeWidthMm}
                          strokeDasharray={strokeDasharray}
                          onClick={() => onSelectLayer(f.id)}
                          className={`cursor-pointer transition-all ${
                            isSelected ? 'stroke-sky-500 stroke-[1.2]' : ''
                          }`}
                        />
                      );
                    }

                    // Marco Rectangular / Cuadrado en mm
                    const wPct = f.widthPercent || f.radius || 92;
                    const hPct = f.heightPercent || f.radius || 90;
                    const frameWMm = (wPct / 100) * widthMm;
                    const frameHMm = (hPct / 100) * heightMm;
                    const rxMm = (f.cornerRadius !== undefined ? f.cornerRadius : 4) * 0.25;

                    if (f.style === 'double') {
                      const gapMm = (f.doubleGap || 3) * 0.25;
                      return (
                        <g key={f.id} onClick={() => onSelectLayer(f.id)} className="cursor-pointer">
                          <rect
                            x={-frameWMm / 2}
                            y={-frameHMm / 2}
                            width={frameWMm}
                            height={frameHMm}
                            rx={rxMm}
                            fill="none"
                            stroke={color}
                            strokeWidth={strokeWidthMm}
                          />
                          <rect
                            x={-frameWMm / 2 + gapMm + strokeWidthMm / 2}
                            y={-frameHMm / 2 + gapMm + strokeWidthMm / 2}
                            width={Math.max(2, frameWMm - (gapMm + strokeWidthMm / 2) * 2)}
                            height={Math.max(2, frameHMm - (gapMm + strokeWidthMm / 2) * 2)}
                            rx={Math.max(0, rxMm - 0.5)}
                            fill="none"
                            stroke={color}
                            strokeWidth={strokeWidthMm * 0.75}
                          />
                        </g>
                      );
                    }

                    return (
                      <rect
                        key={f.id}
                        x={-frameWMm / 2}
                        y={-frameHMm / 2}
                        width={frameWMm}
                        height={frameHMm}
                        rx={rxMm}
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidthMm}
                        strokeDasharray={strokeDasharray}
                        onClick={() => onSelectLayer(f.id)}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'stroke-sky-500 stroke-[1.2]' : ''
                        }`}
                      />
                    );
                  }

                  case 'circular-text': {
                    const ct = layer as CircularTextLayer;
                    const fontSizeMm = (ct.fontSize || 14) * 0.28 * scaleFactor;
                    const letterSpacingMm = (ct.letterSpacing || 0) * 0.2 * scaleFactor;

                    return (
                      <text
                        key={ct.id}
                        fill={color}
                        fontFamily={ct.fontFamily}
                        fontSize={`${fontSizeMm.toFixed(2)}px`}
                        fontWeight={ct.isBold ? 'bold' : 'normal'}
                        fontStyle={ct.isItalic ? 'italic' : 'normal'}
                        letterSpacing={`${letterSpacingMm.toFixed(2)}px`}
                        dominantBaseline="central"
                        onClick={() => onSelectLayer(ct.id)}
                        className={`cursor-pointer select-none ${isSelected ? 'opacity-85 font-semibold' : ''}`}
                      >
                        <textPath
                          href={`#path-${ct.id}`}
                          startOffset="50%"
                          textAnchor="middle"
                        >
                          {ct.text}
                        </textPath>
                      </text>
                    );
                  }

                  case 'center-text': {
                    const cnt = layer as CenterTextLayer;
                    const lines = cnt.text.split('\n');
                    const textAnchor =
                      cnt.alignment === 'left' ? 'start' : cnt.alignment === 'right' ? 'end' : 'middle';
                    const posX = ((cnt.offsetX || 0) / 100) * (widthMm / 2);
                    const posY = ((cnt.offsetY || 0) / 100) * (heightMm / 2);
                    const fontSizeMm = (cnt.fontSize || 14) * 0.28 * scaleFactor;
                    const letterSpacingMm = (cnt.letterSpacing || 0) * 0.2 * scaleFactor;

                    return (
                      <g
                        key={cnt.id}
                        onPointerDown={(e) => handlePointerDown(e, cnt)}
                        className={`transition-opacity cursor-grab active:cursor-grabbing ${
                          isDraggingThis ? 'opacity-70' : ''
                        }`}
                      >
                        {isSelected && (
                          <rect
                            x={posX - widthMm * 0.4}
                            y={posY - fontSizeMm}
                            width={widthMm * 0.8}
                            height={Math.max(fontSizeMm * 1.5, lines.length * fontSizeMm * 1.3)}
                            fill="rgba(56, 189, 248, 0.08)"
                            stroke="#38bdf8"
                            strokeWidth="0.3"
                            strokeDasharray="1 1"
                            rx="1"
                            className="pointer-events-none"
                          />
                        )}
                        <text
                          x={posX}
                          y={posY}
                          fill={color}
                          textAnchor={textAnchor}
                          fontFamily={cnt.fontFamily}
                          fontSize={`${fontSizeMm.toFixed(2)}px`}
                          fontWeight={cnt.isBold ? 'bold' : 'normal'}
                          fontStyle={cnt.isItalic ? 'italic' : 'normal'}
                          letterSpacing={`${letterSpacingMm.toFixed(2)}px`}
                          className="select-none"
                        >
                          {lines.map((line, idx) => (
                            <tspan
                              key={idx}
                              x={posX}
                              dy={idx === 0 ? 0 : `${(fontSizeMm * (cnt.lineHeight || 1.2)).toFixed(2)}px`}
                            >
                              {line}
                            </tspan>
                          ))}
                        </text>
                      </g>
                    );
                  }

                  case 'icon': {
                    const ic = layer as IconLayer;
                    const iconDef = STAMP_ICONS[ic.iconKey] || STAMP_ICONS.star;
                    const posX = ((ic.offsetX || 0) / 100) * (widthMm / 2);
                    const posY = ((ic.offsetY || 0) / 100) * (heightMm / 2);
                    const scale = ((ic.size || 36) / 36) * 0.28 * scaleFactor;

                    return (
                      <g
                        key={ic.id}
                        transform={`translate(${posX.toFixed(2)}, ${posY.toFixed(2)}) scale(${scale.toFixed(
                          3
                        )}) rotate(${ic.rotation})`}
                        onPointerDown={(e) => handlePointerDown(e, ic)}
                        className={`transition-opacity cursor-grab active:cursor-grabbing ${
                          isDraggingThis ? 'opacity-70' : ''
                        }`}
                      >
                        {isSelected && (
                          <circle
                            cx="0"
                            cy="0"
                            r="20"
                            fill="rgba(56, 189, 248, 0.1)"
                            stroke="#38bdf8"
                            strokeWidth="0.8"
                            strokeDasharray="2 2"
                            className="pointer-events-none"
                          />
                        )}
                        {iconDef.render(color)}
                      </g>
                    );
                  }

                  default:
                    return null;
                }
              })}
            </g>
          </svg>
        </div>
      </div>
    );
  }
);
