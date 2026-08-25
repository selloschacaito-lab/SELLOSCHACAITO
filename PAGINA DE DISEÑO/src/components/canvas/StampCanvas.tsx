import React, { forwardRef, useState, useRef, useImperativeHandle, useCallback } from 'react';
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

interface StampCanvasProps {
  project: StampProject;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer?: (layer: StampLayer) => void;
  zoom: number;
}

export const StampCanvas = forwardRef<SVGSVGElement, StampCanvasProps>(
  ({ project, selectedLayerId, onSelectLayer, onUpdateLayer, zoom }, ref) => {
    const { color, layers, showGrid, grungeEffect, shape } = project;
    const internalSvgRef = useRef<SVGSVGElement | null>(null);

    useImperativeHandle(ref, () => internalSvgRef.current as SVGSVGElement);

    const widthMm = project.widthMm || project.sizeMm || 40;
    const heightMm = project.heightMm || project.sizeMm || 40;

    const baseUnit = 300;
    const maxDim = Math.max(widthMm, heightMm);
    const viewWidth = Math.round((widthMm / maxDim) * baseUnit);
    const viewHeight = Math.round((heightMm / maxDim) * baseUnit);

    const halfW = viewWidth / 2;
    const halfH = viewHeight / 2;

    const [dragState, setDragState] = useState<{
      isDragging: boolean;
      layerId: string;
      startX: number;
      startY: number;
      initOffsetX: number;
      initOffsetY: number;
    } | null>(null);

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

    const handlePointerDown = (e: React.PointerEvent, layer: StampLayer) => {
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);

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
      if (!dragState || !dragState.isDragging || !onUpdateLayer) return;

      const svgCoords = getSvgCoordinates(e);
      const dx = svgCoords.x - dragState.startX;
      const dy = svgCoords.y - dragState.startY;

      const currentLayer = layers.find((l) => l.id === dragState.layerId);
      if (!currentLayer) return;

      if (currentLayer.type === 'center-text') {
        const cnt = currentLayer as CenterTextLayer;
        onUpdateLayer({
          ...cnt,
          offsetX: Math.round(dragState.initOffsetX + dx),
          offsetY: Math.round(dragState.initOffsetY + dy),
        });
      } else if (currentLayer.type === 'icon') {
        const ic = currentLayer as IconLayer;
        onUpdateLayer({
          ...ic,
          offsetX: Math.round(dragState.initOffsetX + dx),
          offsetY: Math.round(dragState.initOffsetY + dy),
        });
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      if (dragState) {
        try {
          (e.target as Element).releasePointerCapture(e.pointerId);
        } catch (_) {}
        setDragState(null);
      }
    };

    return (
      <div
        className="relative flex items-center justify-center p-8 overflow-auto h-full w-full bg-slate-900/60 select-none touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          className="transition-transform duration-150 ease-out bg-white rounded-xl shadow-2xl p-6 border border-slate-700/60 relative"
        >
          <svg
            ref={internalSvgRef}
            id="stamp-canvas-svg"
            viewBox={`${-halfW} ${-halfH} ${viewWidth} ${viewHeight}`}
            style={{
              width: `${Math.min(520, Math.max(300, (viewWidth / viewHeight) * 360))}px`,
              height: `${Math.min(520, Math.max(200, (viewHeight / viewWidth) * 360))}px`,
              filter: grungeEffect > 0 ? `url(#grunge-filter)` : 'none',
              touchAction: 'none',
            }}
            className="overflow-visible"
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
                    scale={(grungeEffect / 100) * 4}
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              )}

              {/* Definición de paths precisos para arcos de texto */}
              {layers
                .filter((l): l is CircularTextLayer => l.type === 'circular-text' && l.visible)
                .map((layer) => {
                  const r = (layer.radius / 100) * Math.min(halfW, halfH) * 0.94;
                  const isBottom = layer.isReversed ?? (layer.position === 'bottom');
                  const pathD = describeTextArc(0, 0, r, layer.startAngle, layer.sweepAngle, isBottom);

                  return <path key={`path-${layer.id}`} id={`path-${layer.id}`} d={pathD} fill="none" />;
                })}
            </defs>

            {showGrid && (
              <GridOverlay
                shape={shape}
                widthMm={widthMm}
                heightMm={heightMm}
                viewWidth={viewWidth}
                viewHeight={viewHeight}
              />
            )}

            <g className="stamp-elements-group">
              {layers.map((layer) => {
                if (!layer.visible) return null;
                const isSelected = layer.id === selectedLayerId;
                const isDraggingThis = dragState?.layerId === layer.id;

                switch (layer.type) {
                  case 'frame': {
                    const f = layer as FrameLayer;
                    const strokeDasharray =
                      f.style === 'dashed' ? '8 5' : f.style === 'dotted' ? '3 4' : 'none';

                    if (shape === 'circle') {
                      const r = (f.radius / 100) * Math.min(halfW, halfH) * 0.94;

                      if (f.style === 'scalloped') {
                        const scallopedD = generateScallopedCircle(0, 0, r, f.scallopCount || 36, 4);
                        return (
                          <path
                            key={f.id}
                            d={scallopedD}
                            fill="none"
                            stroke={color}
                            strokeWidth={f.strokeWidth}
                            onClick={() => onSelectLayer(f.id)}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'stroke-sky-500 stroke-[3.5]' : ''
                            }`}
                          />
                        );
                      }

                      if (f.style === 'double') {
                        const gap = f.doubleGap || 4;
                        return (
                          <g key={f.id} onClick={() => onSelectLayer(f.id)} className="cursor-pointer">
                            <circle
                              cx="0"
                              cy="0"
                              r={r}
                              fill="none"
                              stroke={color}
                              strokeWidth={f.strokeWidth}
                            />
                            <circle
                              cx="0"
                              cy="0"
                              r={Math.max(5, r - gap - f.strokeWidth)}
                              fill="none"
                              stroke={color}
                              strokeWidth={f.strokeWidth * 0.75}
                            />
                          </g>
                        );
                      }

                      return (
                        <circle
                          key={f.id}
                          cx="0"
                          cy="0"
                          r={r}
                          fill="none"
                          stroke={color}
                          strokeWidth={f.strokeWidth}
                          strokeDasharray={strokeDasharray}
                          onClick={() => onSelectLayer(f.id)}
                          className={`cursor-pointer transition-all ${
                            isSelected ? 'stroke-sky-500 stroke-[3.5]' : ''
                          }`}
                        />
                      );
                    }

                    const wPct = f.widthPercent || f.radius || 92;
                    const hPct = f.heightPercent || f.radius || 90;
                    const frameW = (wPct / 100) * halfW * 2 * 0.94;
                    const frameH = (hPct / 100) * halfH * 2 * 0.94;
                    const rx = f.cornerRadius !== undefined ? f.cornerRadius : 4;

                    if (f.style === 'double') {
                      const gap = f.doubleGap || 3;
                      return (
                        <g key={f.id} onClick={() => onSelectLayer(f.id)} className="cursor-pointer">
                          <rect
                            x={-frameW / 2}
                            y={-frameH / 2}
                            width={frameW}
                            height={frameH}
                            rx={rx}
                            fill="none"
                            stroke={color}
                            strokeWidth={f.strokeWidth}
                          />
                          <rect
                            x={-frameW / 2 + gap + f.strokeWidth / 2}
                            y={-frameH / 2 + gap + f.strokeWidth / 2}
                            width={Math.max(10, frameW - (gap + f.strokeWidth / 2) * 2)}
                            height={Math.max(10, frameH - (gap + f.strokeWidth / 2) * 2)}
                            rx={Math.max(0, rx - 2)}
                            fill="none"
                            stroke={color}
                            strokeWidth={f.strokeWidth * 0.75}
                          />
                        </g>
                      );
                    }

                    return (
                      <rect
                        key={f.id}
                        x={-frameW / 2}
                        y={-frameH / 2}
                        width={frameW}
                        height={frameH}
                        rx={rx}
                        fill="none"
                        stroke={color}
                        strokeWidth={f.strokeWidth}
                        strokeDasharray={strokeDasharray}
                        onClick={() => onSelectLayer(f.id)}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'stroke-sky-500 stroke-[3.5]' : ''
                        }`}
                      />
                    );
                  }

                  case 'circular-text': {
                    const ct = layer as CircularTextLayer;
                    return (
                      <text
                        key={ct.id}
                        fill={color}
                        fontFamily={ct.fontFamily}
                        fontSize={ct.fontSize}
                        fontWeight={ct.isBold ? 'bold' : 'normal'}
                        fontStyle={ct.isItalic ? 'italic' : 'normal'}
                        letterSpacing={`${ct.letterSpacing}px`}
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
                    const posX = cnt.offsetX || 0;
                    const posY = cnt.offsetY || 0;

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
                            x={posX - 70}
                            y={posY - 12}
                            width="140"
                            height={Math.max(24, lines.length * cnt.fontSize * 1.3)}
                            fill="rgba(56, 189, 248, 0.08)"
                            stroke="#38bdf8"
                            strokeWidth="0.8"
                            strokeDasharray="3 3"
                            rx="4"
                            className="pointer-events-none"
                          />
                        )}
                        <text
                          x={posX}
                          y={posY}
                          fill={color}
                          textAnchor={textAnchor}
                          fontFamily={cnt.fontFamily}
                          fontSize={cnt.fontSize}
                          fontWeight={cnt.isBold ? 'bold' : 'normal'}
                          fontStyle={cnt.isItalic ? 'italic' : 'normal'}
                          letterSpacing={`${cnt.letterSpacing}px`}
                          className="select-none"
                        >
                          {lines.map((line, idx) => (
                            <tspan
                              key={idx}
                              x={posX}
                              dy={idx === 0 ? 0 : `${cnt.fontSize * (cnt.lineHeight || 1.2)}px`}
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
                    const posX = ic.offsetX || 0;
                    const posY = ic.offsetY || 0;

                    return (
                      <g
                        key={ic.id}
                        transform={`translate(${posX}, ${posY}) scale(${ic.size / 36}) rotate(${
                          ic.rotation
                        })`}
                        onPointerDown={(e) => handlePointerDown(e, ic)}
                        className={`transition-opacity cursor-grab active:cursor-grabbing ${
                          isDraggingThis ? 'opacity-70' : ''
                        }`}
                      >
                        {isSelected && (
                          <circle
                            cx="0"
                            cy="0"
                            r="22"
                            fill="rgba(56, 189, 248, 0.1)"
                            stroke="#38bdf8"
                            strokeWidth="1"
                            strokeDasharray="3 3"
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
