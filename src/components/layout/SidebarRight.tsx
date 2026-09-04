import React, { useState } from 'react';
import type {
  StampProject,
  StampLayer,
  FrameLayer,
  CircularTextLayer,
  CenterTextLayer,
  IconLayer,
  StampShape,
} from '../../types/stamp';
import { FrameControls } from '../panels/FrameControls';
import { CircularTextControls } from '../panels/CircularTextControls';
import { CenterTextControls } from '../panels/CenterTextControls';
import { IconControls } from '../panels/IconControls';
import { STAMP_COLORS } from '../../utils/svgCalculations';
import {
  Layers,
  Sliders,
  Palette,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Type,
  Baseline,
  Star,
  Circle,
  Square,
  RectangleHorizontal,
  Sparkles,
  Grid,
  PanelRightClose,
  PanelRightOpen,
  FolderPlus,
  FolderMinus,
  Component,
} from 'lucide-react';

interface SidebarRightProps {
  layers: StampLayer[];
  selectedLayerId: string | null;
  selectedLayerIds?: string[];
  selectedLayer: StampLayer | null;
  project: StampProject;
  onSelectLayer: (id: string | null, isShift?: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onDuplicateLayers?: (ids: string[]) => void;
  onGroupLayers?: (ids?: string[]) => void;
  onUngroupLayers?: (ids?: string[]) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onAddLayer: (type: StampLayer['type']) => void;
  onUpdateLayer: (updated: StampLayer) => void;
  onUpdateProject: (updates: Partial<StampProject>) => void;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({
  layers = [],
  selectedLayerId,
  selectedLayerIds = [],
  selectedLayer,
  project,
  onSelectLayer,
  onToggleVisibility,
  onDeleteLayer,
  onDuplicateLayer,
  onDuplicateLayers,
  onGroupLayers,
  onUngroupLayers,
  onMoveLayer,
  onAddLayer,
  onUpdateLayer,
  onUpdateProject,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openCapas, setOpenCapas] = useState(true);
  const [openPropiedades, setOpenPropiedades] = useState(true);
  const [openMedidas, setOpenMedidas] = useState(true);

  const [filter, setFilter] = useState<'all' | 'text' | 'frame' | 'icon'>('all');

  const width = project?.widthMm || project?.sizeMm || 40;
  const height = project?.heightMm || project?.sizeMm || 40;

  // Medidas comerciales estándar
  const rectPresets = [
    { label: '27x10', w: 27, h: 10 },
    { label: '38x14', w: 38, h: 14 },
    { label: '47x18', w: 47, h: 18 },
    { label: '58x22', w: 58, h: 22 },
    { label: '70x25', w: 70, h: 25 },
    { label: '60x40', w: 60, h: 40 },
  ];

  const squarePresets = [
    { label: '20x20', size: 20 },
    { label: '30x30', size: 30 },
    { label: '40x40', size: 40 },
    { label: '50x50', size: 50 },
  ];

  const circlePresets = [
    { label: 'Ø 20mm', size: 20 },
    { label: 'Ø 30mm', size: 30 },
    { label: 'Ø 40mm', size: 40 },
    { label: 'Ø 50mm', size: 50 },
  ];

  const handleShapeChange = (newShape: StampShape) => {
    if (newShape === 'circle') {
      onUpdateProject({ shape: 'circle', widthMm: 40, heightMm: 40, sizeMm: 40 });
    } else if (newShape === 'square') {
      onUpdateProject({ shape: 'square', widthMm: 30, heightMm: 30, sizeMm: 30 });
    } else if (newShape === 'rectangle') {
      onUpdateProject({ shape: 'rectangle', widthMm: 47, heightMm: 18 });
    }
  };

  const safeLayers = layers || [];
  const filteredLayers = safeLayers.filter((layer) => {
    if (!layer) return false;
    if (filter === 'all') return true;
    if (filter === 'text') return layer.type === 'circular-text' || layer.type === 'center-text';
    if (filter === 'frame') return layer.type === 'frame';
    if (filter === 'icon') return layer.type === 'icon';
    return true;
  });

  const getLayerIcon = (type: StampLayer['type']) => {
    switch (type) {
      case 'frame':
        return <CircleDot size={13} className="text-emerald-400" />;
      case 'circular-text':
        return <Type size={13} className="text-sky-400" />;
      case 'center-text':
        return <Baseline size={13} className="text-indigo-400" />;
      case 'icon':
        return <Star size={13} className="text-amber-400" />;
    }
  };

  const getLayerSubtitle = (layer: StampLayer) => {
    switch (layer.type) {
      case 'frame': {
        const f = layer as FrameLayer;
        return `Trazo ${f.strokeWidth}px`;
      }
      case 'circular-text': {
        const ct = layer as CircularTextLayer;
        return `"${ct.text.slice(0, 14)}${ct.text.length > 14 ? '...' : ''}"`;
      }
      case 'center-text': {
        const cnt = layer as CenterTextLayer;
        return `"${cnt.text.replace(/\n/g, ' ').slice(0, 14)}"`;
      }
      case 'icon': {
        const ic = layer as IconLayer;
        return `Tamaño ${ic.size}px`;
      }
    }
  };

  // Abrir y enfocar sección al hacer clic en modo icono
  const handleOpenAndFocusSection = (section: 'capas' | 'propiedades' | 'medidas') => {
    setIsCollapsed(false);
    if (section === 'capas') setOpenCapas(true);
    if (section === 'propiedades') setOpenPropiedades(true);
    if (section === 'medidas') setOpenMedidas(true);
  };

  return (
    <aside
      className={`relative bg-slate-900/95 border-l border-slate-800 flex flex-col h-full select-none z-20 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-14' : 'w-80'
      }`}
    >
      {/* Botón Tirador de Borde para Colapsar/Expandir */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-20 z-30 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-sky-600 hover:border-sky-500 shadow-md flex items-center justify-center transition"
        title={isCollapsed ? 'Expandir panel derecho' : 'Achicar a solo iconos'}
      >
        {isCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      {/* Encabezado Principal de la Barra */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 min-h-[52px]">
        {!isCollapsed ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Panel de Control
            </span>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Achicar a solo iconos"
            >
              <PanelRightClose size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className="mx-auto p-1.5 rounded-lg text-sky-400 hover:bg-slate-800 hover:text-white transition"
            title="Expandir panel derecho"
          >
            <PanelRightOpen size={18} />
          </button>
        )}
      </div>

      {/* Contenido: Si está colapsado, muestra la barra de 3 iconos rápidos */}
      {isCollapsed ? (
        <div className="flex-1 overflow-y-auto p-2 flex flex-col items-center gap-3 pt-4">
          <button
            onClick={() => handleOpenAndFocusSection('capas')}
            className={`p-2.5 rounded-xl border transition flex flex-col items-center gap-1 group ${
              openCapas
                ? 'bg-sky-500/15 border-sky-500/50 text-sky-400'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title={`Capas (${layers.length}) - Clic para expandir`}
          >
            <Layers size={18} className="group-hover:scale-110 transition" />
            <span className="text-[9px] font-bold">{layers.length}</span>
          </button>

          <button
            onClick={() => handleOpenAndFocusSection('propiedades')}
            className={`p-2.5 rounded-xl border transition flex flex-col items-center gap-1 group ${
              openPropiedades && selectedLayer
                ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-400'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title="Propiedades del elemento - Clic para expandir"
          >
            <Sliders size={18} className="group-hover:scale-110 transition" />
          </button>

          <button
            onClick={() => handleOpenAndFocusSection('medidas')}
            className={`p-2.5 rounded-xl border transition flex flex-col items-center gap-1 group ${
              openMedidas
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title="Medidas & Tinta - Clic para expandir"
          >
            <Palette size={18} className="group-hover:scale-110 transition" />
          </button>
        </div>
      ) : (
        /* Vista Expandida con Acordeón Independiente */
        <div className="flex-1 overflow-y-auto space-y-3 p-3 divide-y divide-slate-800">
          
          {/* ============================================================ */}
          {/* 1. SECCIÓN: CAPAS (Layers)                                  */}
          {/* ============================================================ */}
          <section className="space-y-2 pb-2">
            <button
              onClick={() => setOpenCapas(!openCapas)}
              className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 text-left transition group"
            >
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Capas ({layers.length})
                </h3>
              </div>
              <div className="text-slate-400 group-hover:text-white transition">
                {openCapas ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </div>
            </button>

            {openCapas && (
              <div className="space-y-2 pt-1 animate-fadeIn">
                {/* Filtros de capas */}
                <div className="grid grid-cols-4 gap-1 p-1 rounded-md bg-slate-950/60 text-[10px]">
                  {(['all', 'text', 'frame', 'icon'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`py-0.5 rounded text-center font-medium capitalize transition ${
                        filter === f
                          ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f === 'all' ? 'Todo' : f === 'text' ? 'Texto' : f === 'frame' ? 'Marcos' : 'Iconos'}
                    </button>
                  ))}
                </div>

                {/* Barra de Acciones de Selección Múltiple y Agrupación */}
                {selectedLayerIds.length > 1 && (
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-sky-950/50 border border-sky-800/60 text-[11px] animate-fadeIn">
                    <span className="font-semibold text-sky-300 flex items-center gap-1">
                      <Component size={12} /> {selectedLayerIds.length} seleccionados
                    </span>
                    <div className="flex items-center gap-1">
                      {onGroupLayers && (
                        <button
                          onClick={() => onGroupLayers(selectedLayerIds)}
                          className="px-2 py-0.5 rounded bg-sky-700 hover:bg-sky-600 text-white font-medium flex items-center gap-1 transition"
                          title="Agrupar (Ctrl + G)"
                        >
                          <FolderPlus size={11} /> Agrupar
                        </button>
                      )}
                      {onUngroupLayers && selectedLayerIds.some((id) => layers.find((l) => l.id === id)?.groupId) && (
                        <button
                          onClick={() => onUngroupLayers(selectedLayerIds)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1 transition"
                          title="Desagrupar (Ctrl + Shift + G)"
                        >
                          <FolderMinus size={11} /> Desagrupar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Lista de Capas */}
                <div className="max-h-48 overflow-y-auto space-y-1 pr-0.5">
                  {filteredLayers.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-500">
                      No hay capas en esta categoría.
                    </div>
                  ) : (
                    filteredLayers.map((layer, index) => {
                      const isSelected = selectedLayerIds.length > 0
                        ? selectedLayerIds.includes(layer.id)
                        : layer.id === selectedLayerId;

                      const isGrouped = Boolean(layer.groupId);

                      return (
                        <div
                          key={layer.id}
                          onClick={(e) => onSelectLayer(layer.id, e.shiftKey)}
                          className={`group flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                            isSelected
                              ? 'bg-sky-950/40 border-sky-500/80 text-white shadow-sm'
                              : 'bg-slate-800/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <span className="text-slate-400 group-hover:text-slate-200">
                              {getLayerIcon(layer.type)}
                            </span>
                            <div className="truncate">
                              <p className="font-medium truncate text-[11px] leading-tight flex items-center gap-1">
                                {layer.name}
                                {isGrouped && (
                                  <span className="text-[9px] bg-slate-800 text-sky-400 border border-slate-700 px-1 rounded font-mono" title="Parte de un Grupo (Ctrl+G)">
                                    Grupo
                                  </span>
                                )}
                              </p>
                              <p className="text-[9px] text-slate-400 truncate font-mono">
                                {getLayerSubtitle(layer)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleVisibility(layer.id);
                              }}
                              className={`p-1 rounded hover:bg-slate-700 ${
                                layer.visible ? 'text-slate-300' : 'text-slate-600'
                              }`}
                              title={layer.visible ? 'Ocultar' : 'Mostrar'}
                            >
                              {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveLayer(layer.id, 'up');
                              }}
                              disabled={index === 0}
                              className="p-1 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-20"
                              title="Subir"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveLayer(layer.id, 'down');
                              }}
                              disabled={index === filteredLayers.length - 1}
                              className="p-1 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-20"
                              title="Bajar"
                            >
                              <ChevronDown size={12} />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateLayer(layer.id);
                              }}
                              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-sky-400"
                              title="Duplicar"
                            >
                              <Copy size={12} />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLayer(layer.id);
                              }}
                              className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                              title="Eliminar (Supr)"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ============================================================ */}
          {/* 2. SECCIÓN: PROPIEDADES (Properties)                         */}
          {/* ============================================================ */}
          <section className="space-y-2 pt-3">
            <button
              onClick={() => setOpenPropiedades(!openPropiedades)}
              className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 text-left transition group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sliders size={15} className="text-sky-400 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
                  Propiedades
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {selectedLayer && (
                  <span className="text-[9px] bg-slate-800 text-sky-400 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px]">
                    {selectedLayer.name}
                  </span>
                )}
                <div className="text-slate-400 group-hover:text-white transition">
                  {openPropiedades ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </div>
              </div>
            </button>

            {openPropiedades && (
              <div className="pt-1 animate-fadeIn">
                {!selectedLayer ? (
                  <div className="text-center py-5 px-2 bg-slate-950/30 rounded-lg border border-slate-800/60">
                    <p className="text-xs font-semibold text-slate-400">Ningún elemento seleccionado</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Haz clic en una capa o en el lienzo para editar sus propiedades.
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/80">
                    {selectedLayer.type === 'frame' && (
                      <FrameControls
                        layer={selectedLayer as FrameLayer}
                        shape={project.shape}
                        onChange={(updated) => onUpdateLayer(updated)}
                      />
                    )}

                    {selectedLayer.type === 'circular-text' && (
                      <CircularTextControls
                        layer={selectedLayer as CircularTextLayer}
                        onChange={(updated) => onUpdateLayer(updated)}
                      />
                    )}

                    {selectedLayer.type === 'center-text' && (
                      <CenterTextControls
                        layer={selectedLayer as CenterTextLayer}
                        onChange={(updated) => onUpdateLayer(updated)}
                      />
                    )}

                    {selectedLayer.type === 'icon' && (
                      <IconControls
                        layer={selectedLayer as IconLayer}
                        onChange={(updated) => onUpdateLayer(updated)}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ============================================================ */}
          {/* 3. SECCIÓN: MEDIDAS & TINTA (Measurements & Ink)             */}
          {/* ============================================================ */}
          <section className="space-y-2 pt-3">
            <button
              onClick={() => setOpenMedidas(!openMedidas)}
              className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 text-left transition group"
            >
              <div className="flex items-center gap-2">
                <Palette size={15} className="text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Medidas & Tinta
                </h3>
              </div>
              <div className="text-slate-400 group-hover:text-white transition">
                {openMedidas ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </div>
            </button>

            {openMedidas && (
              <div className="space-y-4 pt-1 animate-fadeIn">
                {/* Selector de Forma */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Forma del Sello
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleShapeChange('circle')}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition ${
                        project.shape === 'circle'
                          ? 'bg-sky-600 text-white shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Circle size={13} />
                      Redondo
                    </button>
                    <button
                      onClick={() => handleShapeChange('rectangle')}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition ${
                        project.shape === 'rectangle'
                          ? 'bg-sky-600 text-white shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <RectangleHorizontal size={14} />
                      Rectangular
                    </button>
                    <button
                      onClick={() => handleShapeChange('square')}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition ${
                        project.shape === 'square'
                          ? 'bg-sky-600 text-white shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <Square size={13} />
                      Cuadrado
                    </button>
                  </div>
                </div>

                {/* Medidas Predeterminadas */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <span className="font-semibold">Medidas Estándar</span>
                    <span className="text-sky-400 font-mono font-bold">
                      {width} x {height} mm
                    </span>
                  </div>

                  {project.shape === 'rectangle' && (
                    <div className="grid grid-cols-3 gap-1.5 mb-2">
                      {rectPresets.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => onUpdateProject({ widthMm: p.w, heightMm: p.h })}
                          className={`py-1 rounded text-xs font-mono font-semibold transition ${
                            width === p.w && height === p.h
                              ? 'bg-sky-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {p.label} mm
                        </button>
                      ))}
                    </div>
                  )}

                  {project.shape === 'square' && (
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {squarePresets.map((p) => (
                        <button
                          key={p.label}
                          onClick={() =>
                            onUpdateProject({ widthMm: p.size, heightMm: p.size, sizeMm: p.size })
                          }
                          className={`py-1 rounded text-xs font-mono font-semibold transition ${
                            width === p.size && height === p.size
                              ? 'bg-sky-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {p.label} mm
                        </button>
                      ))}
                    </div>
                  )}

                  {project.shape === 'circle' && (
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {circlePresets.map((p) => (
                        <button
                          key={p.label}
                          onClick={() =>
                            onUpdateProject({ widthMm: p.size, heightMm: p.size, sizeMm: p.size })
                          }
                          className={`py-1 rounded text-xs font-mono font-semibold transition ${
                            width === p.size && height === p.size
                              ? 'bg-sky-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sliders de Ancho y Alto */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Ancho Personalizado</span>
                        <span className="font-mono text-sky-400">{width} mm</span>
                      </div>
                      <input
                        type="range"
                        min="15"
                        max="100"
                        value={width}
                        onChange={(e) => {
                          const newW = Number(e.target.value);
                          if (project.shape === 'circle' || project.shape === 'square') {
                            onUpdateProject({ widthMm: newW, heightMm: newW, sizeMm: newW });
                          } else {
                            onUpdateProject({ widthMm: newW });
                          }
                        }}
                        className="w-full accent-sky-500 cursor-pointer"
                      />
                    </div>

                    {project.shape === 'rectangle' && (
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Alto Personalizado</span>
                          <span className="font-mono text-sky-400">{height} mm</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="80"
                          value={height}
                          onChange={(e) => onUpdateProject({ heightMm: Number(e.target.value) })}
                          className="w-full accent-sky-500 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Color de Tinta Oficial */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Color de Tinta Oficial
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {STAMP_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => onUpdateProject({ color: c.value })}
                        className={`group relative p-1.5 rounded-lg border flex flex-col items-center gap-1 transition ${
                          project.color === c.value
                            ? 'border-sky-500 bg-sky-950/40'
                            : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800'
                        }`}
                        title={c.name}
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
                          style={{ backgroundColor: c.value }}
                        />
                        <span className="text-[8px] text-slate-400 truncate w-full text-center">
                          {c.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
                    <input
                      type="color"
                      value={project.color}
                      onChange={(e) => onUpdateProject({ color: e.target.value })}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={project.color}
                      onChange={(e) => onUpdateProject({ color: e.target.value })}
                      className="flex-1 bg-transparent text-xs font-mono text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Efecto de desgaste / Grunge */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles size={13} className="text-amber-400" />
                      Efecto Tinta Real / Desgaste
                    </span>
                    <span className="text-sky-400 font-mono">{project.grungeEffect}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={project.grungeEffect}
                    onChange={(e) => onUpdateProject({ grungeEffect: Number(e.target.value) })}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                </div>

                {/* Guías y Rejilla */}
                <div className="pt-2">
                  <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 transition">
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Grid size={14} className="text-sky-400" />
                      Mostrar Rejilla Milimétrica
                    </span>
                    <input
                      type="checkbox"
                      checked={project.showGrid}
                      onChange={(e) => onUpdateProject({ showGrid: e.target.checked })}
                      className="rounded bg-slate-800 border-slate-700 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}
          </section>

        </div>
      )}
    </aside>
  );
};
