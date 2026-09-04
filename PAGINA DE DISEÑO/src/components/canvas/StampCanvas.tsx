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
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer?: (layer: StampLayer) => void;
  zoom: number;
  onZoomChange?: (newZoom: number) => void;
}

// 1 pt = 1/72 pulgada = 25.4 / 72 mm = 0.352778 mm
const PT_TO_MM = 25.4 / 72.0;

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const StampCanvas = forwardRef<SVGSVGElement, StampCanvasProps>(
  ({ project, selectedLayerId, onSelectLayer, onUpdateLayer, zoom, onZoomChange }, ref) => {
    const { color, layers, showGrid, grungeEffect, shape } = project;
    const internalSvgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => internalSvgRef.current as SVGSVGElement);

    // Medidas físicas en milímetros
    const widthMm = project.widthMm || project.sizeMm || 40;
    const heightMm = project.heightMm || project.sizeMm || 40;
    const halfStampW = widthMm / 2;
    const halfStampH = heightMm / 2;

    // Límite de seguridad del diseño (1 mm hacia adentro del borde físico)
    const safetyLimitR = Math.max(1, halfStampW - 1.0);
    const safetyLimitW = Math.max(2, widthMm - 2.0);
    const safetyLimitH = Math.max(2, heightMm - 2.0);

    // Estado de Paneo
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState<boolean>(false);
    const panStartRef = useRef<{ startX: number; startY: number; initPanX: number; initPanY: number }>({
      startX: 0,
      startY: 0,
      initPanX: 0,
      initPanY: 0,
    });

    const isDragMovedRef = useRef<boolean>(false);

    // Estado de Arrastre
    const [dragState, setDragState] = useState<{
      isDragging: boolean;
      layerId: string;
      startX: number;
      startY: number;
      initOffsetX: number;
      initOffsetY: number;
    } | null>(null);

    // Estado de Redimensionamiento
    const [resizeState, setResizeState] = useState<{
      isResizing: boolean;
      layerId: string;
      handle: HandlePosition;
      startX: number;
      startY: number;
      initLayer: StampLayer;
      initBBox: { x: number; y: number; width: number; height: number };
    } | null>(null);

    // Manejo de zoom fluido
    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      if (!onZoomChange) return;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(5.0, Math.max(0.2, zoom * zoomFactor));
      onZoomChange(Number(newZoom.toFixed(2)));
    };

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

    const handleCanvasPointerDown = (e: React.PointerEvent) => {
      isDragMovedRef.current = false;
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

    const handleCanvasBackgroundClick = () => {
      if (!isDragMovedRef.current) {
        onSelectLayer(null);
      }
    };

    const handlePointerDown = (e: React.PointerEvent, layer: StampLayer) => {
      if (e.button === 1) return;

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

    const handleHandlePointerDown = (
      e: React.PointerEvent,
      handle: HandlePosition,
      layer: StampLayer,
      bbox: { x: number; y: number; width: number; height: number }
    ) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch (_) {}

      const svgCoords = getSvgCoordinates(e);

      setResizeState({
        isResizing: true,
        layerId: layer.id,
        handle,
        startX: svgCoords.x,
        startY: svgCoords.y,
        initLayer: JSON.parse(JSON.stringify(layer)),
        initBBox: bbox,
      });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      isDragMovedRef.current = true;

      if (isPanning) {
        const dx = e.clientX - panStartRef.current.startX;
        const dy = e.clientY - panStartRef.current.startY;
        setPan({
          x: panStartRef.current.initPanX + dx,
          y: panStartRef.current.initPanY + dy,
        });
        return;
      }

      const svgCoords = getSvgCoordinates(e);

      // Redimensionamiento con Tope Inteligente (Stop al límite de seguridad de 1 mm)
      if (resizeState && resizeState.isResizing && onUpdateLayer) {
        const dx = svgCoords.x - resizeState.startX;
        const dy = svgCoords.y - resizeState.startY;
        const init = resizeState.initLayer;
        const handle = resizeState.handle;
        const isShift = e.shiftKey;
        const isAlt = e.altKey;
        const mult = isAlt ? 2 : 1;

        if (init.type === 'center-text') {
          const cnt = init as CenterTextLayer;
          const initScaleX = cnt.scaleX || 1;
          const initScaleY = cnt.scaleY || 1;
          const initBoxW = resizeState.initBBox.width;
          const initBoxH = resizeState.initBBox.height;

          if (isShift) {
            // Escala de tamaño de fuente con límite inteligente
            const deltaDist = (handle.includes('e') || handle.includes('s') ? 1 : -1) * (Math.abs(dx) > Math.abs(dy) ? dx : dy);
            const deltaFont = (deltaDist / 1.5) * mult;
            const maxAllowedFont = Math.min(48, Math.max(4, (safetyLimitH / 1.5) / PT_TO_MM));
            const newFont = Math.min(maxAllowedFont, Math.max(4, Number((cnt.fontSize + deltaFont).toFixed(1))));
            onUpdateLayer({ ...cnt, fontSize: newFont });
          } else {
            // Estiramiento libre con tope
            let newScaleX = initScaleX;
            let newScaleY = initScaleY;

            if (handle === 'e') {
              newScaleX = Math.max(0.2, initScaleX + (dx / (initBoxW / 2)) * mult);
            } else if (handle === 'w') {
              newScaleX = Math.max(0.2, initScaleX - (dx / (initBoxW / 2)) * mult);
            } else if (handle === 's') {
              newScaleY = Math.max(0.2, initScaleY + (dy / (initBoxH / 2)) * mult);
            } else if (handle === 'n') {
              newScaleY = Math.max(0.2, initScaleY - (dy / (initBoxH / 2)) * mult);
            } else {
              const deltaXDir = handle.includes('e') ? dx : -dx;
              const deltaYDir = handle.includes('s') ? dy : -dy;
              newScaleX = Math.max(0.2, initScaleX + (deltaXDir / (initBoxW / 2)) * mult);
              newScaleY = Math.max(0.2, initScaleY + (deltaYDir / (initBoxH / 2)) * mult);
            }

            // Clamping para que no exceda el límite del sello
            const maxScaleX = (safetyLimitW / initBoxW) * 1.05;
            const maxScaleY = (safetyLimitH / initBoxH) * 1.05;

            onUpdateLayer({
              ...cnt,
              scaleX: Number(Math.min(maxScaleX, newScaleX).toFixed(3)),
              scaleY: Number(Math.min(maxScaleY, newScaleY).toFixed(3)),
            });
          }
        } else if (init.type === 'frame') {
          const f = init as FrameLayer;
          const strokeMm = (f.strokeWidth || 1.5) * PT_TO_MM;

          if (shape === 'circle') {
            const deltaDist = (handle.includes('e') || handle.includes('s') ? 1 : -1) * (Math.abs(dx) > Math.abs(dy) ? dx : dy);
            const deltaPct = (deltaDist / halfStampW) * 100 * mult;
            // Tope máximo para que el borde exterior no sobrepase los 1mm del límite
            const maxRadiusPct = Math.floor(((safetyLimitR - strokeMm / 2) / halfStampW) * 100);
            const newRadius = Math.min(maxRadiusPct, Math.max(10, Math.round(f.radius + deltaPct)));
            onUpdateLayer({ ...f, radius: newRadius });
          } else {
            let deltaW = 0;
            let deltaH = 0;

            if (handle.includes('e')) deltaW = dx;
            if (handle.includes('w')) deltaW = -dx;
            if (handle.includes('s')) deltaH = dy;
            if (handle.includes('n')) deltaH = -dy;

            if (isShift) {
              const maxDelta = Math.max(Math.abs(deltaW), Math.abs(deltaH)) * (deltaW >= 0 && deltaH >= 0 ? 1 : -1);
              deltaW = maxDelta;
              deltaH = maxDelta;
            }

            const deltaPctW = (deltaW / widthMm) * 100 * mult;
            const deltaPctH = (deltaH / heightMm) * 100 * mult;

            const maxWPct = Math.floor(((safetyLimitW - strokeMm) / widthMm) * 100);
            const maxHPct = Math.floor(((safetyLimitH - strokeMm) / heightMm) * 100);

            const newWPct = Math.min(maxWPct, Math.max(15, Math.round((f.widthPercent || 92) + deltaPctW)));
            const newHPct = Math.min(maxHPct, Math.max(15, Math.round((f.heightPercent || 90) + deltaPctH)));

            onUpdateLayer({
              ...f,
              widthPercent: handle === 'n' || handle === 's' ? (f.widthPercent || 92) : newWPct,
              heightPercent: handle === 'e' || handle === 'w' ? (f.heightPercent || 90) : newHPct,
            });
          }
        } else if (init.type === 'circular-text') {
          const ct = init as CircularTextLayer;
          const fontSizeMm = (ct.fontSize || 12) * PT_TO_MM;
          const deltaDist = (handle.includes('e') || handle.includes('s') ? 1 : -1) * (Math.abs(dx) > Math.abs(dy) ? dx : dy);

          // Tope de radio para que las letras no choquen ni salgan del límite de 1mm
          const maxTextRadiusMm = safetyLimitR - fontSizeMm * 0.65;
          const maxRadiusPct = Math.floor((maxTextRadiusMm / halfStampW) * 100);

          if (isShift) {
            const deltaFont = (deltaDist / 2) * mult;
            const maxFont = Math.min(24, Math.max(4, ((safetyLimitR - (ct.radius / 100) * halfStampW) * 1.4) / PT_TO_MM));
            const newFont = Math.min(maxFont, Math.max(4, Number((ct.fontSize + deltaFont).toFixed(1))));
            onUpdateLayer({ ...ct, fontSize: newFont });
          } else {
            const deltaPct = (deltaDist / halfStampW) * 100 * mult;
            const newRadius = Math.min(maxRadiusPct, Math.max(20, Math.round(ct.radius + deltaPct)));
            onUpdateLayer({ ...ct, radius: newRadius });
          }
        } else if (init.type === 'icon') {
          const ic = init as IconLayer;
          const deltaDist = (handle.includes('e') || handle.includes('s') ? 1 : -1) * (Math.abs(dx) > Math.abs(dy) ? dx : dy);
          const deltaSize = (deltaDist * 1.5) * mult;
          const newSize = Math.min(85, Math.max(10, Math.round(ic.size + deltaSize)));
          onUpdateLayer({ ...ic, size: newSize });
        }
        return;
      }

      // Arrastre con Tope Inteligente dentro del área de seguridad
      if (!dragState || !dragState.isDragging || !onUpdateLayer) return;

      const dxMm = svgCoords.x - dragState.startX;
      const dyMm = svgCoords.y - dragState.startY;

      const dPercentX = (dxMm / halfStampW) * 50;
      const dPercentY = (dyMm / halfStampH) * 50;

      const currentLayer = (layers || []).find((l) => l.id === dragState.layerId);
      if (!currentLayer) return;

      if (currentLayer.type === 'center-text') {
        const cnt = currentLayer as CenterTextLayer;
        const targetX = Math.round(dragState.initOffsetX + dPercentX);
        const targetY = Math.round(dragState.initOffsetY + dPercentY);

        // Clamping para que el centro del texto no se salga del sello
        const clampedX = Math.min(75, Math.max(-75, targetX));
        const clampedY = Math.min(75, Math.max(-75, targetY));

        onUpdateLayer({
          ...cnt,
          offsetX: clampedX,
          offsetY: clampedY,
        });
      } else if (currentLayer.type === 'icon') {
        const ic = currentLayer as IconLayer;
        const targetX = Math.round(dragState.initOffsetX + dPercentX);
        const targetY = Math.round(dragState.initOffsetY + dPercentY);

        const clampedX = Math.min(75, Math.max(-75, targetX));
        const clampedY = Math.min(75, Math.max(-75, targetY));

        onUpdateLayer({
          ...ic,
          offsetX: clampedX,
          offsetY: clampedY,
        });
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      if (isPanning) {
        setIsPanning(false);
      }
      if (resizeState) {
        try {
          (e.target as Element).releasePointerCapture(e.pointerId);
        } catch (_) {}
        setResizeState(null);
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

    // Bounding Box con PADDING DE DESPLAZAMIENTO HACIA AFUERA (1.2 mm) para no tocar el elemento
    const getSelectedBoundingBox = () => {
      if (!selectedLayerId) return null;
      const layer = (layers || []).find((l) => l.id === selectedLayerId);
      if (!layer || !layer.visible) return null;

      // Margen de separación hacia afuera para la caja de selección (1.2 mm)
      const pad = 1.2;

      switch (layer.type) {
        case 'frame': {
          const f = layer as FrameLayer;
          const strokeMm = (f.strokeWidth || 1.5) * PT_TO_MM;
          if (shape === 'circle') {
            const r = (f.radius / 100) * halfStampW + strokeMm / 2;
            return {
              x: -r - pad,
              y: -r - pad,
              width: (r + pad) * 2,
              height: (r + pad) * 2,
              layer,
            };
          } else {
            const w = ((f.widthPercent || 92) / 100) * widthMm + strokeMm;
            const h = ((f.heightPercent || 90) / 100) * heightMm + strokeMm;
            return {
              x: -w / 2 - pad,
              y: -h / 2 - pad,
              width: w + pad * 2,
              height: h + pad * 2,
              layer,
            };
          }
        }
        case 'circular-text': {
          const ct = layer as CircularTextLayer;
          const fontSizeMm = (ct.fontSize || 12) * PT_TO_MM;
          const r = (ct.radius / 100) * halfStampW + fontSizeMm * 0.55;
          return {
            x: -r - pad,
            y: -r - pad,
            width: (r + pad) * 2,
            height: (r + pad) * 2,
            layer,
          };
        }
        case 'center-text': {
          const cnt = layer as CenterTextLayer;
          const lines = cnt.text.split('\n');
          const posX = ((cnt.offsetX || 0) / 100) * halfStampW;
          const posY = ((cnt.offsetY || 0) / 100) * halfStampH;
          const fontSizeMm = (cnt.fontSize || 12) * PT_TO_MM;
          const scaleX = cnt.scaleX || 1;
          const scaleY = cnt.scaleY || 1;
          const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
          const baseW = Math.max(10, maxLineLen * fontSizeMm * 0.58 + (cnt.letterSpacing || 0) * PT_TO_MM * maxLineLen);
          const baseH = Math.max(fontSizeMm * 1.2, lines.length * fontSizeMm * (cnt.lineHeight || 1.2));
          const boxW = baseW * scaleX;
          const boxH = baseH * scaleY;
          return {
            x: posX - boxW / 2 - pad,
            y: posY - boxH / 2 - pad,
            width: boxW + pad * 2,
            height: boxH + pad * 2,
            layer,
          };
        }
        case 'icon': {
          const ic = layer as IconLayer;
          const posX = ((ic.offsetX || 0) / 100) * halfStampW;
          const posY = ((ic.offsetY || 0) / 100) * halfStampH;
          const sizeMm = Math.max(6, ((ic.size || 36) / 36) * (widthMm / 40) * 12);
          return {
            x: posX - sizeMm / 2 - pad,
            y: posY - sizeMm / 2 - pad,
            width: sizeMm + pad * 2,
            height: sizeMm + pad * 2,
            layer,
          };
        }
        default:
          return null;
      }
    };

    const bbox = getSelectedBoundingBox();

    // 8 Puntos de tiradores de transformación finos y desplazados hacia afuera
    const handles: { id: HandlePosition; x: number; y: number; cursor: string }[] = bbox
      ? [
          { id: 'nw', x: bbox.x, y: bbox.y, cursor: 'nwse-resize' },
          { id: 'n', x: bbox.x + bbox.width / 2, y: bbox.y, cursor: 'ns-resize' },
          { id: 'ne', x: bbox.x + bbox.width, y: bbox.y, cursor: 'nesw-resize' },
          { id: 'e', x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2, cursor: 'ew-resize' },
          { id: 'se', x: bbox.x + bbox.width, y: bbox.y + bbox.height, cursor: 'nwse-resize' },
          { id: 's', x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height, cursor: 'ns-resize' },
          { id: 'sw', x: bbox.x, y: bbox.y + bbox.height, cursor: 'nesw-resize' },
          { id: 'w', x: bbox.x, y: bbox.y + bbox.height / 2, cursor: 'ew-resize' },
        ]
      : [];

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
        {(pan.x !== 0 || pan.y !== 0 || zoom !== 1.0) && (
          <button
            onClick={handleResetView}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-sky-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition backdrop-blur-sm"
            title="Centrar mesa de trabajo y zoom 100%"
          >
            <Maximize2 size={13} />
            Centrar Hoja Carta (100%)
          </button>
        )}

        <div className="absolute bottom-3 left-4 z-20 flex items-center gap-3 text-[11px] text-slate-400 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-md pointer-events-none backdrop-blur-sm shadow-md">
          <div className="flex items-center gap-1">
            <Move size={12} className="text-sky-400" />
            <span>Tiradores: Estirar libre</span>
          </div>
          <span className="text-slate-600">|</span>
          <span><kbd className="bg-slate-800 px-1 rounded text-sky-300 font-mono text-[10px]">Shift</kbd> Proporcional</span>
          <span className="text-slate-600">|</span>
          <span><kbd className="bg-slate-800 px-1 rounded text-sky-300 font-mono text-[10px]">Alt</kbd> Desde el Centro</span>
        </div>

        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
          className="transition-transform duration-75 ease-out bg-white rounded-md shadow-2xl p-0 border border-slate-400/80 relative"
        >
          {/* HOJA TAMAÑO CARTA: 215.9 mm x 279.4 mm */}
          <svg
            ref={internalSvgRef}
            id="stamp-canvas-svg"
            viewBox="-107.95 -139.7 215.9 279.4"
            className="w-[480px] h-[621px] overflow-visible"
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

              {(layers || [])
                .filter((l): l is CircularTextLayer => l.type === 'circular-text' && l.visible)
                .map((layer) => {
                  const rMm = (layer.radius / 100) * halfStampW;
                  const isBottom = layer.isReversed ?? (layer.position === 'bottom');
                  const pathD = describeTextArc(0, 0, rMm, layer.startAngle, layer.sweepAngle, isBottom);

                  return <path key={`path-${layer.id}`} id={`path-${layer.id}`} d={pathD} fill="none" />;
                })}
            </defs>

            {/* Fondo clickeable de la hoja para deseleccionar al hacer clic afuera */}
            <rect
              x="-107.95"
              y="-139.7"
              width="215.9"
              height="279.4"
              fill="transparent"
              onClick={handleCanvasBackgroundClick}
              className="cursor-default"
            />

            {/* Rejilla milimétrica y marcas de Hoja Carta (21.59 x 27.94 cm) limpia con doble línea 0.25pt */}
            {showGrid && (
              <GridOverlay
                shape={shape}
                widthMm={widthMm}
                heightMm={heightMm}
              />
            )}

            {/* ELEMENTOS DEL SELLO */}
            <g className="stamp-elements-group">
              {(layers || []).map((layer) => {
                if (!layer.visible) return null;
                const isDraggingThis = dragState?.layerId === layer.id;

                switch (layer.type) {
                  case 'frame': {
                    const f = layer as FrameLayer;
                    const strokeWidthMm = (f.strokeWidth || 1.5) * PT_TO_MM;
                    const strokeDasharray =
                      f.style === 'dashed' ? '2.5, 1.5' : f.style === 'dotted' ? '0.8, 1.2' : 'none';

                    if (shape === 'circle') {
                      const rMm = (f.radius / 100) * halfStampW;

                      if (f.style === 'scalloped') {
                        const scallopedD = generateScallopedCircle(0, 0, rMm, f.scallopCount || 36, 1.2);
                        return (
                          <path
                            key={f.id}
                            d={scallopedD}
                            fill="none"
                            stroke={color}
                            strokeWidth={strokeWidthMm}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLayer(f.id);
                            }}
                            className="cursor-pointer"
                          />
                        );
                      }

                      if (f.style === 'double') {
                        const gapMm = (f.doubleGap || 3) * PT_TO_MM;
                        return (
                          <g
                            key={f.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLayer(f.id);
                            }}
                            className="cursor-pointer"
                          >
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLayer(f.id);
                          }}
                          className="cursor-pointer"
                        />
                      );
                    }

                    // Marco Rectangular / Cuadrado en mm
                    const wPct = f.widthPercent || f.radius || 92;
                    const hPct = f.heightPercent || f.radius || 90;
                    const frameWMm = (wPct / 100) * widthMm;
                    const frameHMm = (hPct / 100) * heightMm;
                    const rxMm = (f.cornerRadius !== undefined ? f.cornerRadius : 2) * PT_TO_MM;

                    if (f.style === 'double') {
                      const gapMm = (f.doubleGap || 3) * PT_TO_MM;
                      return (
                        <g
                          key={f.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLayer(f.id);
                          }}
                          className="cursor-pointer"
                        >
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLayer(f.id);
                        }}
                        className="cursor-pointer"
                      />
                    );
                  }

                  case 'circular-text': {
                    const ct = layer as CircularTextLayer;
                    const fontSizeMm = (ct.fontSize || 12) * PT_TO_MM;
                    const letterSpacingMm = (ct.letterSpacing || 0) * PT_TO_MM;

                    return (
                      <text
                        key={ct.id}
                        fill={color}
                        fontFamily={ct.fontFamily}
                        fontSize={`${fontSizeMm.toFixed(3)}px`}
                        fontWeight={ct.isBold ? 'bold' : 'normal'}
                        fontStyle={ct.isItalic ? 'italic' : 'normal'}
                        letterSpacing={`${letterSpacingMm.toFixed(3)}px`}
                        dominantBaseline="central"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLayer(ct.id);
                        }}
                        className="cursor-pointer select-none"
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
                    const posX = ((cnt.offsetX || 0) / 100) * halfStampW;
                    const posY = ((cnt.offsetY || 0) / 100) * halfStampH;
                    const fontSizeMm = (cnt.fontSize || 12) * PT_TO_MM;
                    const letterSpacingMm = (cnt.letterSpacing || 0) * PT_TO_MM;
                    const scaleX = cnt.scaleX || 1;
                    const scaleY = cnt.scaleY || 1;

                    return (
                      <g
                        key={cnt.id}
                        transform={`translate(${posX.toFixed(3)}, ${posY.toFixed(3)}) scale(${scaleX.toFixed(
                          3
                        )}, ${scaleY.toFixed(3)})`}
                        onPointerDown={(e) => handlePointerDown(e, cnt)}
                        className={`transition-opacity cursor-grab active:cursor-grabbing ${
                          isDraggingThis ? 'opacity-70' : ''
                        }`}
                      >
                        <text
                          x="0"
                          y="0"
                          fill={color}
                          textAnchor={textAnchor}
                          fontFamily={cnt.fontFamily}
                          fontSize={`${fontSizeMm.toFixed(3)}px`}
                          fontWeight={cnt.isBold ? 'bold' : 'normal'}
                          fontStyle={cnt.isItalic ? 'italic' : 'normal'}
                          letterSpacing={`${letterSpacingMm.toFixed(3)}px`}
                          className="select-none"
                        >
                          {lines.map((line, idx) => (
                            <tspan
                              key={idx}
                              x="0"
                              dy={idx === 0 ? 0 : `${(fontSizeMm * (cnt.lineHeight || 1.2)).toFixed(3)}px`}
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
                    const posX = ((ic.offsetX || 0) / 100) * halfStampW;
                    const posY = ((ic.offsetY || 0) / 100) * halfStampH;
                    const scale = ((ic.size || 36) / 36) * (widthMm / 40) * 0.28;

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
                        {iconDef.render(color)}
                      </g>
                    );
                  }

                  default:
                    return null;
                }
              })}
            </g>

            {/* CAJA DE SELECCIÓN FINA, SUTIL Y DESPLAZADA HACIA AFUERA (ESTILO ADOBE ILLUSTRATOR) */}
            {bbox && (
              <g className="illustrator-bounding-box pointer-events-auto">
                {/* Rectángulo delimitador fino azul desplazado hacia afuera */}
                <rect
                  x={bbox.x}
                  y={bbox.y}
                  width={bbox.width}
                  height={bbox.height}
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="0.16"
                  opacity="0.85"
                  className="pointer-events-none"
                />

                {/* Punto central del objeto sutil */}
                <circle
                  cx={bbox.x + bbox.width / 2}
                  cy={bbox.y + bbox.height / 2}
                  r="0.4"
                  fill="#0284c7"
                  className="pointer-events-none"
                />

                {/* 8 Tiradores Cuadrados Blancos Finos con Borde Azul */}
                {handles.map((h) => {
                  const hSize = 1.05; // 1.05 mm de tamaño sutil
                  return (
                    <rect
                      key={h.id}
                      x={h.x - hSize / 2}
                      y={h.y - hSize / 2}
                      width={hSize}
                      height={hSize}
                      fill="#ffffff"
                      stroke="#0284c7"
                      strokeWidth="0.2"
                      rx="0.1"
                      style={{ cursor: h.cursor }}
                      onPointerDown={(e) => handleHandlePointerDown(e, h.id, bbox.layer, bbox)}
                      className="hover:fill-sky-200 transition-colors"
                    />
                  );
                })}
              </g>
            )}
          </svg>
        </div>
      </div>
    );
  }
);
