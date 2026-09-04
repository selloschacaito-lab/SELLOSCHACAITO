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
import { STAMP_ICONS, cleanAndColorizeSvg } from '../../utils/stampIcons';
import { GridOverlay } from './GridOverlay';
import { Move, Maximize2, Type, Sparkles } from 'lucide-react';

interface StampCanvasProps {
  project: StampProject;
  selectedLayerId: string | null;
  selectedLayerIds?: string[];
  onSelectLayer: (id: string | null, isShift?: boolean) => void;
  onSelectMultipleLayers?: (ids: string[]) => void;
  onUpdateLayer?: (layer: StampLayer) => void;
  onBatchUpdateLayers?: (layers: StampLayer[]) => void;
  onDuplicateLayers?: (ids: string[]) => void;
  zoom: number;
  onZoomChange?: (newZoom: number) => void;
}

// 1 pt = 1/72 pulgada = 25.4 / 72 mm = 0.352778 mm
const PT_TO_MM = 25.4 / 72.0;

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragStateItem {
  id: string;
  type: StampLayer['type'];
  initOffsetX: number;
  initOffsetY: number;
}

export const StampCanvas = forwardRef<SVGSVGElement, StampCanvasProps>(
  (
    {
      project,
      selectedLayerId,
      selectedLayerIds = [],
      onSelectLayer,
      onSelectMultipleLayers,
      onUpdateLayer,
      onBatchUpdateLayers,
      onDuplicateLayers,
      zoom,
      onZoomChange,
    },
    ref
  ) => {
    const { color, layers = [], showGrid, grungeEffect, shape } = project;
    const internalSvgRef = useRef<SVGSVGElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => internalSvgRef.current as SVGSVGElement);

    const effectiveSelectedIds =
      selectedLayerIds.length > 0 ? selectedLayerIds : selectedLayerId ? [selectedLayerId] : [];

    // Medidas físicas en milímetros
    const widthMm = project.widthMm || project.sizeMm || 40;
    const heightMm = project.heightMm || project.sizeMm || 40;
    const halfStampW = widthMm / 2;
    const halfStampH = heightMm / 2;

    // Límite de seguridad del diseño (1 mm hacia adentro del borde físico)
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

    // Estado de Guías Inteligentes (Smart Guides Magenta de Illustrator)
    const [smartGuides, setSmartGuides] = useState<{
      x?: number;
      y?: number;
      label?: string;
    } | null>(null);

    // Estado de Selección por Cuadro de Arrastre (Marquee Selection)
    const [selectionBox, setSelectionBox] = useState<{
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
      isShift: boolean;
    } | null>(null);

    // Estado de Arrastre Multicapa
    const [dragState, setDragState] = useState<{
      isDragging: boolean;
      startX: number;
      startY: number;
      items: DragStateItem[];
    } | null>(null);

    // Estado de Edición de Texto en Pantalla (Doble Clic)
    const [inlineEditingLayerId, setInlineEditingLayerId] = useState<string | null>(null);
    const [inlineEditingText, setInlineEditingText] = useState<string>('');

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

    // Calcular Bounding Box de cualquier capa individual al ras (sin padding excesivo)
    const getLayerBoundingBox = (layer: StampLayer) => {
      if (!layer || !layer.visible) return null;

      switch (layer.type) {
        case 'frame': {
          const f = layer as FrameLayer;
          const strokeMm = (f.strokeWidth || 1.5) * PT_TO_MM;
          const isCircle = f.shape ? f.shape === 'circle' : shape === 'circle';
          if (isCircle) {
            const r = (f.radius / 100) * halfStampW + strokeMm / 2;
            return {
              x: -r,
              y: -r,
              width: r * 2,
              height: r * 2,
              layer,
            };
          } else {
            const w = ((f.widthPercent || 92) / 100) * widthMm + strokeMm;
            const h = ((f.heightPercent || 90) / 100) * heightMm + strokeMm;
            return {
              x: -w / 2,
              y: -h / 2,
              width: w,
              height: h,
              layer,
            };
          }
        }
        case 'circular-text': {
          const ct = layer as CircularTextLayer;
          const fontSizeMm = (ct.fontSize || 12) * PT_TO_MM;
          const r = (ct.radius / 100) * halfStampW + fontSizeMm * 0.5;
          return {
            x: -r,
            y: -r,
            width: r * 2,
            height: r * 2,
            layer,
          };
        }
        case 'center-text': {
          const cnt = layer as CenterTextLayer;
          const posX = ((cnt.offsetX || 0) / 100) * halfStampW;
          const posY = ((cnt.offsetY || 0) / 100) * halfStampH;
          const scaleX = cnt.scaleX !== undefined ? cnt.scaleX : 1;
          const scaleY = cnt.scaleY !== undefined ? cnt.scaleY : 1;

          // 1. Medición nativa DOM ultra precisa (idéntica a Illustrator al ras del contorno)
          const textEl = internalSvgRef.current?.querySelector(`#stamp-text-${cnt.id}`) as SVGGraphicsElement | null;
          if (textEl && typeof textEl.getBBox === 'function') {
            try {
              const b = textEl.getBBox();
              if (b && b.width > 0 && b.height > 0) {
                return {
                  x: posX + b.x * scaleX,
                  y: posY + b.y * scaleY,
                  width: b.width * scaleX,
                  height: b.height * scaleY,
                  layer,
                };
              }
            } catch {}
          }

          // 2. Fallback matemático exacto con ascenso tipográfico
          const lines = cnt.text.split('\n');
          const fontSizeMm = (cnt.fontSize || 12) * PT_TO_MM;
          const maxLineLen = Math.max(...lines.map((l) => l.length), 1);
          const letterSpacingMm = (cnt.letterSpacing || 0) * PT_TO_MM;
          const charFactor = cnt.fontFamily === 'Oswald' ? 0.44 : cnt.fontFamily.includes('Mono') ? 0.65 : 0.58;
          const estWidthMm = (maxLineLen * (fontSizeMm * charFactor) + (maxLineLen - 1) * letterSpacingMm) * scaleX;
          const lineSpacingMm = fontSizeMm * (cnt.lineHeight || 1.15);
          const totalTextHeightMm = ((lines.length - 1) * lineSpacingMm + fontSizeMm * 0.85) * scaleY;
          const startY = -((lines.length - 1) * lineSpacingMm) / 2 - (cnt.baselineShift || 0) * PT_TO_MM;
          const topY = posY + (startY - fontSizeMm * 0.72) * scaleY;

          return {
            x: posX - estWidthMm / 2,
            y: topY,
            width: estWidthMm,
            height: totalTextHeightMm,
            layer,
          };
        }
        case 'icon': {
          const ic = layer as IconLayer;
          const posX = ((ic.offsetX || 0) / 100) * halfStampW;
          const posY = ((ic.offsetY || 0) / 100) * halfStampH;
          const iconSizeMm = ((ic.size || 36) / 36) * (widthMm / 40) * 0.28 * 36;
          return {
            x: posX - iconSizeMm / 2,
            y: posY - iconSizeMm / 2,
            width: iconSizeMm,
            height: iconSizeMm,
            layer,
          };
        }
      }
    };

    // Iniciar arrastre o Marquee Selection en el lienzo
    const handleCanvasPointerDown = (e: React.PointerEvent) => {
      isDragMovedRef.current = false;
      if (e.button === 1 || (e.altKey && e.button !== 0)) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          initPanX: pan.x,
          initPanY: pan.y,
        };
        return;
      }

      // Marquee Selection con clic izquierdo en fondo
      if (e.button === 0) {
        const svgCoords = getSvgCoordinates(e);
        try {
          (e.target as Element).setPointerCapture(e.pointerId);
        } catch (_) {}

        setSelectionBox({
          startX: svgCoords.x,
          startY: svgCoords.y,
          currentX: svgCoords.x,
          currentY: svgCoords.y,
          isShift: e.shiftKey,
        });
      }
    };

    // Clic / PointerDown sobre un elemento específico (Soporte Grupo + Alt+Arrastre)
    const handlePointerDown = (e: React.PointerEvent, layer: StampLayer) => {
      if (e.button === 1) return;

      e.stopPropagation();
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch (_) {}

      const isShift = e.shiftKey;
      const isAlt = e.altKey;
      let newSelectedIds: string[] = [];

      // Selección con soporte de Grupos (Ctrl+G)
      if (layer.groupId && !isShift) {
        const groupLayerIds = layers.filter((l) => l.groupId === layer.groupId).map((l) => l.id);
        newSelectedIds = groupLayerIds;
        if (onSelectMultipleLayers) {
          onSelectMultipleLayers(groupLayerIds);
        } else {
          onSelectLayer(layer.id, false);
        }
      } else if (isShift) {
        onSelectLayer(layer.id, true);
        if (effectiveSelectedIds.includes(layer.id)) {
          newSelectedIds = effectiveSelectedIds.filter((id) => id !== layer.id);
        } else {
          newSelectedIds = [...effectiveSelectedIds, layer.id];
        }
      } else {
        if (!effectiveSelectedIds.includes(layer.id)) {
          onSelectLayer(layer.id, false);
          newSelectedIds = [layer.id];
        } else {
          newSelectedIds = effectiveSelectedIds;
        }
      }

      // Duplicación Rápida con Alt + Arrastre (Estilo Illustrator)
      if (isAlt && onDuplicateLayers && newSelectedIds.length > 0) {
        onDuplicateLayers(newSelectedIds);
        return;
      }

      // Preparar arrastre para todas las capas seleccionadas
      const svgCoords = getSvgCoordinates(e);
      const layersToDrag = layers.filter((l) => newSelectedIds.includes(l.id));

      const items: DragStateItem[] = layersToDrag.map((l) => {
        if (l.type === 'center-text') {
          const cnt = l as CenterTextLayer;
          return { id: l.id, type: 'center-text', initOffsetX: cnt.offsetX || 0, initOffsetY: cnt.offsetY || 0 };
        } else if (l.type === 'icon') {
          const ic = l as IconLayer;
          return { id: l.id, type: 'icon', initOffsetX: ic.offsetX || 0, initOffsetY: ic.offsetY || 0 };
        } else {
          return { id: l.id, type: l.type, initOffsetX: 0, initOffsetY: 0 };
        }
      });

      setDragState({
        isDragging: true,
        startX: svgCoords.x,
        startY: svgCoords.y,
        items,
      });
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

      // Actualizar caja de selección (Marquee)
      if (selectionBox) {
        setSelectionBox((prev) => (prev ? { ...prev, currentX: svgCoords.x, currentY: svgCoords.y } : null));
        return;
      }

      // Redimensionamiento con Tiradores
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
            const deltaDist = (handle.includes('e') || handle.includes('s') ? 1 : -1) * (Math.abs(dx) > Math.abs(dy) ? dx : dy);
            const deltaFont = (deltaDist / 1.5) * mult;
            const maxAllowedFont = Math.min(48, Math.max(4, (safetyLimitH / 1.5) / PT_TO_MM));
            const newFont = Math.min(maxAllowedFont, Math.max(4, Number((cnt.fontSize + deltaFont).toFixed(1))));
            onUpdateLayer({ ...cnt, fontSize: newFont });
          } else {
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
            } else if (handle === 'se') {
              newScaleX = Math.max(0.2, initScaleX + (dx / (initBoxW / 2)) * mult);
              newScaleY = Math.max(0.2, initScaleY + (dy / (initBoxH / 2)) * mult);
            } else if (handle === 'nw') {
              newScaleX = Math.max(0.2, initScaleX - (dx / (initBoxW / 2)) * mult);
              newScaleY = Math.max(0.2, initScaleY - (dy / (initBoxH / 2)) * mult);
            } else if (handle === 'ne') {
              newScaleX = Math.max(0.2, initScaleX + (dx / (initBoxW / 2)) * mult);
              newScaleY = Math.max(0.2, initScaleY - (dy / (initBoxH / 2)) * mult);
            } else if (handle === 'sw') {
              newScaleX = Math.max(0.2, initScaleX - (dx / (initBoxW / 2)) * mult);
              newScaleY = Math.max(0.2, initScaleY + (dy / (initBoxH / 2)) * mult);
            }

            onUpdateLayer({
              ...cnt,
              scaleX: Number(newScaleX.toFixed(3)),
              scaleY: Number(newScaleY.toFixed(3)),
            });
          }
        } else if (init.type === 'circular-text' || init.type === 'frame') {
          const deltaDist = (handle.includes('e') || handle.includes('s') ? 1 : -1) * (Math.abs(dx) > Math.abs(dy) ? dx : dy);
          const deltaPercent = (deltaDist / (halfStampW / 100)) * mult;

          if (init.type === 'circular-text') {
            const ct = init as CircularTextLayer;
            const newRadius = Math.min(100, Math.max(10, Math.round(ct.radius + deltaPercent)));
            onUpdateLayer({ ...ct, radius: newRadius });
          } else {
            const f = init as FrameLayer;
            const isCircle = f.shape ? f.shape === 'circle' : shape === 'circle';
            if (isCircle) {
              const newRadius = Math.min(100, Math.max(10, Math.round(f.radius + deltaPercent)));
              onUpdateLayer({ ...f, radius: newRadius });
            } else {
              const newW = Math.min(100, Math.max(10, Math.round((f.widthPercent || 92) + (dx / (widthMm / 100)) * mult)));
              const newH = Math.min(100, Math.max(10, Math.round((f.heightPercent || 90) + (dy / (heightMm / 100)) * mult)));
              onUpdateLayer({ ...f, widthPercent: newW, heightPercent: newH });
            }
          }
        } else if (init.type === 'icon') {
          const ic = init as IconLayer;
          const deltaDist = (handle.includes('e') || handle.includes('s') ? 1 : -1) * (Math.abs(dx) > Math.abs(dy) ? dx : dy);
          const newSize = Math.min(100, Math.max(8, Math.round(ic.size + deltaDist * mult)));
          onUpdateLayer({ ...ic, size: newSize });
        }
        return;
      }

      // Arrastre libre con Guías Inteligentes (Smart Guides & Auto-Snap)
      if (dragState && dragState.isDragging && dragState.items.length > 0) {
        const dx = svgCoords.x - dragState.startX;
        const dy = svgCoords.y - dragState.startY;
        const dPercentX = (dx / halfStampW) * 100;
        const dPercentY = (dy / halfStampH) * 100;

        let activeGuideX: number | undefined = undefined;
        let activeGuideY: number | undefined = undefined;

        const updatedLayers: StampLayer[] = [];

        dragState.items.forEach((item, itemIdx) => {
          const currentLayer = layers.find((l) => l.id === item.id);
          if (!currentLayer) return;

          if (item.type === 'center-text' || item.type === 'icon') {
            let targetX = Math.round(item.initOffsetX + dPercentX);
            let targetY = Math.round(item.initOffsetY + dPercentY);

            // Auto-Imantado al Centro (Snap to Center X=0 / Y=0) con tolerancia de ±2%
            if (itemIdx === 0) {
              if (Math.abs(targetX) <= 2) {
                targetX = 0;
                activeGuideX = 0;
              }
              if (Math.abs(targetY) <= 2) {
                targetY = 0;
                activeGuideY = 0;
              }
            }

            const clampedX = Math.min(80, Math.max(-80, targetX));
            const clampedY = Math.min(80, Math.max(-80, targetY));

            if (item.type === 'center-text') {
              updatedLayers.push({
                ...(currentLayer as CenterTextLayer),
                offsetX: clampedX,
                offsetY: clampedY,
              });
            } else {
              updatedLayers.push({
                ...(currentLayer as IconLayer),
                offsetX: clampedX,
                offsetY: clampedY,
              });
            }
          }
        });

        // Actualizar Guías Inteligentes Visuales (Magenta)
        if (activeGuideX !== undefined || activeGuideY !== undefined) {
          setSmartGuides({
            x: activeGuideX,
            y: activeGuideY,
            label: activeGuideX === 0 && activeGuideY === 0 ? 'Centro (0, 0)' : activeGuideX === 0 ? 'Centro X' : 'Centro Y',
          });
        } else {
          setSmartGuides(null);
        }

        if (updatedLayers.length > 0) {
          if (onBatchUpdateLayers) {
            onBatchUpdateLayers(updatedLayers);
          } else if (onUpdateLayer && updatedLayers[0]) {
            onUpdateLayer(updatedLayers[0]);
          }
        }
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      setSmartGuides(null);

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

      // Finalizar Marquee Box Selection
      if (selectionBox) {
        const minX = Math.min(selectionBox.startX, selectionBox.currentX);
        const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
        const minY = Math.min(selectionBox.startY, selectionBox.currentY);
        const maxY = Math.max(selectionBox.startY, selectionBox.currentY);
        const w = maxX - minX;
        const h = maxY - minY;

        if (w > 2 || h > 2) {
          // Detectar todas las capas intersectadas
          const matchedIds: string[] = [];
          layers.forEach((l) => {
            const box = getLayerBoundingBox(l);
            if (box) {
              const intersects = !(
                box.x + box.width < minX ||
                box.x > maxX ||
                box.y + box.height < minY ||
                box.y > maxY
              );
              if (intersects) {
                matchedIds.push(l.id);
              }
            }
          });

          if (selectionBox.isShift && onSelectMultipleLayers) {
            const merged = Array.from(new Set([...effectiveSelectedIds, ...matchedIds]));
            onSelectMultipleLayers(merged);
          } else if (onSelectMultipleLayers) {
            onSelectMultipleLayers(matchedIds);
          }
        } else {
          // Clic simple en el fondo vacío
          if (!selectionBox.isShift) {
            onSelectLayer(null);
          }
        }

        try {
          (e.target as Element).releasePointerCapture(e.pointerId);
        } catch (_) {}
        setSelectionBox(null);
      }
    };

    const handleResetView = () => {
      setPan({ x: 0, y: 0 });
      if (onZoomChange) onZoomChange(1.0);
    };

    // Obtener Bounding Boxes de todas las capas seleccionadas
    const selectedBoxes = effectiveSelectedIds
      .map((id) => {
        const layer = layers.find((l) => l.id === id);
        return layer ? getLayerBoundingBox(layer) : null;
      })
      .filter((b): b is NonNullable<typeof b> => b !== null);

    const primaryBox = selectedBoxes[0] || null;

    const handles: { id: HandlePosition; x: number; y: number; cursor: string }[] = primaryBox
      ? [
          { id: 'nw', x: primaryBox.x, y: primaryBox.y, cursor: 'nwse-resize' },
          { id: 'n', x: primaryBox.x + primaryBox.width / 2, y: primaryBox.y, cursor: 'ns-resize' },
          { id: 'ne', x: primaryBox.x + primaryBox.width, y: primaryBox.y, cursor: 'nesw-resize' },
          { id: 'e', x: primaryBox.x + primaryBox.width, y: primaryBox.y + primaryBox.height / 2, cursor: 'ew-resize' },
          { id: 'se', x: primaryBox.x + primaryBox.width, y: primaryBox.y + primaryBox.height, cursor: 'nwse-resize' },
          { id: 's', x: primaryBox.x + primaryBox.width / 2, y: primaryBox.y + primaryBox.height, cursor: 'ns-resize' },
          { id: 'sw', x: primaryBox.x, y: primaryBox.y + primaryBox.height, cursor: 'nesw-resize' },
          { id: 'w', x: primaryBox.x, y: primaryBox.y + primaryBox.height / 2, cursor: 'ew-resize' },
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

        {/* Barra de atajos rápidos e indicadores */}
        <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2.5 text-[11px] text-slate-400 bg-slate-950/85 border border-slate-800 px-3 py-1.5 rounded-lg pointer-events-none backdrop-blur-sm shadow-md">
          <div className="flex items-center gap-1">
            <Sparkles size={12} className="text-pink-400" />
            <span className="text-pink-300 font-semibold">Smart Guides Activas</span>
          </div>
          <span className="text-slate-700">|</span>
          <span><kbd className="bg-slate-800 px-1 rounded text-sky-300 font-mono text-[10px]">Alt + Arrastre</kbd> Duplicar</span>
          <span className="text-slate-700">|</span>
          <span><kbd className="bg-slate-800 px-1 rounded text-sky-300 font-mono text-[10px]">Ctrl + G</kbd> Agrupar</span>
          <span className="text-slate-700">|</span>
          <span><kbd className="bg-slate-800 px-1 rounded text-sky-300 font-mono text-[10px]">Shift</kbd> Multi-selección</span>
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

              {layers
                .filter((l): l is CircularTextLayer => l.type === 'circular-text' && l.visible)
                .map((layer) => {
                  const rMm = (layer.radius / 100) * halfStampW;
                  const isBottom = layer.isReversed ?? (layer.position === 'bottom');
                  const pathData = describeTextArc(0, 0, rMm, layer.startAngle, layer.sweepAngle, isBottom);
                  return <path key={layer.id} id={`path-${layer.id}`} d={pathData} fill="none" />;
                })}
            </defs>

            {/* Rejilla milimétrica */}
            {showGrid && (
              <GridOverlay
                shape={shape}
                widthMm={widthMm}
                heightMm={heightMm}
              />
            )}

            {/* ELEMENTOS DEL SELLO */}
            <g className="stamp-elements-group">
              {layers.map((layer) => {
                if (!layer.visible) return null;
                const isDraggingThis = dragState?.items.some((it) => it.id === layer.id);

                switch (layer.type) {
                  case 'frame': {
                    const f = layer as FrameLayer;
                    const strokeWidthMm = (f.strokeWidth || 1.5) * PT_TO_MM;
                    const strokeDasharray =
                      f.style === 'dashed' ? '2.5, 1.5' : f.style === 'dotted' ? '0.8, 1.2' : 'none';

                    const effectiveFrameShape = f.shape || shape;

                    if (effectiveFrameShape === 'circle') {
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
                            onPointerDown={(e) => handlePointerDown(e, f)}
                            className="cursor-pointer"
                          />
                        );
                      }

                      if (f.style === 'double') {
                        const gapMm = (f.doubleGap || 3) * PT_TO_MM;
                        return (
                          <g
                            key={f.id}
                            onPointerDown={(e) => handlePointerDown(e, f)}
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
                          onPointerDown={(e) => handlePointerDown(e, f)}
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
                          onPointerDown={(e) => handlePointerDown(e, f)}
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
                        onPointerDown={(e) => handlePointerDown(e, f)}
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
                        style={{
                          textTransform: ct.textTransform || 'none',
                          textDecoration: ct.textDecoration || 'none',
                        }}
                        onPointerDown={(e) => handlePointerDown(e, ct)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setInlineEditingLayerId(ct.id);
                          setInlineEditingText(ct.text);
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
                    const scaleX = cnt.scaleX !== undefined ? cnt.scaleX : 1;
                    const scaleY = cnt.scaleY !== undefined ? cnt.scaleY : 1;
                    const rotation = cnt.rotation || 0;
                    const baselineShiftMm = (cnt.baselineShift || 0) * PT_TO_MM;
                    const lineSpacingMm = fontSizeMm * (cnt.lineHeight || 1.15);
                    const startY = -((lines.length - 1) * lineSpacingMm) / 2 - baselineShiftMm;

                    return (
                      <g
                        key={cnt.id}
                        transform={`translate(${posX.toFixed(3)}, ${posY.toFixed(3)}) rotate(${rotation}) scale(${scaleX.toFixed(
                          3
                        )}, ${scaleY.toFixed(3)})`}
                        onPointerDown={(e) => handlePointerDown(e, cnt)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setInlineEditingLayerId(cnt.id);
                          setInlineEditingText(cnt.text);
                        }}
                        className={`transition-opacity cursor-grab active:cursor-grabbing ${
                          isDraggingThis ? 'opacity-70' : ''
                        }`}
                      >
                        <text
                          id={`stamp-text-${cnt.id}`}
                          x="0"
                          y={startY.toFixed(3)}
                          fill={color}
                          textAnchor={textAnchor}
                          fontFamily={cnt.fontFamily}
                          fontSize={`${fontSizeMm.toFixed(3)}px`}
                          fontWeight={cnt.isBold ? 'bold' : 'normal'}
                          fontStyle={cnt.isItalic ? 'italic' : 'normal'}
                          letterSpacing={`${letterSpacingMm.toFixed(3)}px`}
                          style={{
                            textTransform: cnt.textTransform || 'none',
                            textDecoration: cnt.textDecoration || 'none',
                          }}
                          className="select-none"
                        >
                          {lines.map((line, idx) => (
                            <tspan
                              key={idx}
                              x="0"
                              dy={idx === 0 ? 0 : `${lineSpacingMm.toFixed(3)}px`}
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

                    if (ic.customSvgData) {
                      const { innerHtml, viewBox } = cleanAndColorizeSvg(ic.customSvgData, color);
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
                          <svg
                            x="-18"
                            y="-18"
                            width="36"
                            height="36"
                            viewBox={viewBox}
                            className="overflow-visible"
                            dangerouslySetInnerHTML={{ __html: innerHtml }}
                          />
                        </g>
                      );
                    }

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
                        fill={color}
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

            {/* GUÍAS INTELIGENTES MAGENTA (SMART GUIDES ESTILO ILLUSTRATOR) */}
            {smartGuides && (
              <g className="smart-guides-group pointer-events-none">
                {smartGuides.x !== undefined && (
                  <line
                    x1={smartGuides.x}
                    y1={-halfStampH - 6}
                    x2={smartGuides.x}
                    y2={halfStampH + 6}
                    stroke="#ec4899"
                    strokeWidth="0.25"
                    strokeDasharray="1.2, 0.8"
                  />
                )}
                {smartGuides.y !== undefined && (
                  <line
                    x1={-halfStampW - 6}
                    y1={smartGuides.y}
                    x2={halfStampW + 6}
                    y2={smartGuides.y}
                    stroke="#ec4899"
                    strokeWidth="0.25"
                    strokeDasharray="1.2, 0.8"
                  />
                )}
                {smartGuides.x === 0 && smartGuides.y === 0 && (
                  <circle cx="0" cy="0" r="0.6" fill="#ec4899" stroke="#ffffff" strokeWidth="0.15" />
                )}
              </g>
            )}

            {/* MARQUEE SELECTION BOX (CAJA DE ARRASTRE AZUL SEMITRANSPARENTE) */}
            {selectionBox && (() => {
              const minX = Math.min(selectionBox.startX, selectionBox.currentX);
              const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
              const minY = Math.min(selectionBox.startY, selectionBox.currentY);
              const maxY = Math.max(selectionBox.startY, selectionBox.currentY);
              const w = maxX - minX;
              const h = maxY - minY;

              if (w <= 1 && h <= 1) return null;

              return (
                <rect
                  x={minX}
                  y={minY}
                  width={w}
                  height={h}
                  fill="#0284c7"
                  fillOpacity="0.14"
                  stroke="#0284c7"
                  strokeWidth="0.25"
                  strokeDasharray="1.2, 0.8"
                  className="pointer-events-none"
                />
              );
            })()}

            {/* CAJAS DE SELECCIÓN PARA TODAS LAS CAPAS SELECCIONADAS */}
            {selectedBoxes.map((box, bIdx) => {
              const isPrimary = bIdx === 0;

              return (
                <g key={box.layer.id} className="illustrator-bounding-box pointer-events-auto">
                  {/* Rectángulo delimitador ultra fino al ras (estilo Illustrator) */}
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="0.08"
                    strokeDasharray={selectedBoxes.length > 1 ? '0.8, 0.6' : 'none'}
                    opacity="0.95"
                    className="pointer-events-none"
                  />

                  {/* Tiradores Cuadrados Sutiles Finos */}
                  {isPrimary &&
                    handles.map((h) => {
                      const hSize = 0.70;
                      return (
                        <rect
                          key={h.id}
                          x={h.x - hSize / 2}
                          y={h.y - hSize / 2}
                          width={hSize}
                          height={hSize}
                          fill="#ffffff"
                          stroke="#0284c7"
                          strokeWidth="0.10"
                          rx="0.06"
                          style={{ cursor: h.cursor }}
                          onPointerDown={(e) => handleHandlePointerDown(e, h.id, box.layer, box)}
                          className="hover:fill-sky-200 transition-colors"
                        />
                      );
                    })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Modal / Editor Rápido Flotante al dar Doble Clic en un Texto */}
        {inlineEditingLayerId && (() => {
          const editingLayer = layers.find((l) => l.id === inlineEditingLayerId) as
            | CircularTextLayer
            | CenterTextLayer
            | undefined;
          if (!editingLayer) return null;

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
              onClick={() => setInlineEditingLayerId(null)}
            >
              <div
                className="bg-slate-900 border-2 border-sky-500 rounded-2xl p-5 shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Type size={15} /> Editando Texto en Pantalla
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                    Enter = Guardar • Esc = Salir
                  </span>
                </div>

                <textarea
                  autoFocus
                  rows={editingLayer.type === 'center-text' ? 3 : 2}
                  value={inlineEditingText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInlineEditingText(val);
                    if (onUpdateLayer) {
                      onUpdateLayer({ ...editingLayer, text: val });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && editingLayer.type === 'circular-text') {
                      e.preventDefault();
                      setInlineEditingLayerId(null);
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setInlineEditingLayerId(null);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-medium text-sm focus:outline-none focus:border-sky-500 shadow-inner"
                  placeholder="Escribe el texto aquí..."
                />

                <div className="flex items-center justify-between mt-3.5">
                  <span className="text-[11px] text-slate-400">
                    {editingLayer.name} ({editingLayer.type === 'circular-text' ? 'Arco' : 'Central'})
                  </span>
                  <button
                    onClick={() => setInlineEditingLayerId(null)}
                    className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md active:scale-95"
                  >
                    Listo / Guardar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }
);
