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
import { Sliders, Palette, Grid, Sparkles, Circle, Square, RectangleHorizontal } from 'lucide-react';

interface SidebarRightProps {
  project: StampProject;
  selectedLayer: StampLayer | null;
  onUpdateLayer: (updated: StampLayer) => void;
  onUpdateProject: (updates: Partial<StampProject>) => void;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({
  project,
  selectedLayer,
  onUpdateLayer,
  onUpdateProject,
}) => {
  const [activeTab, setActiveTab] = useState<'layer' | 'project'>('layer');

  const width = project.widthMm || project.sizeMm || 40;
  const height = project.heightMm || project.sizeMm || 40;

  // Medidas comerciales estándar solicitadas por el usuario
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

  return (
    <aside className="w-80 bg-slate-900/95 border-l border-slate-800 flex flex-col h-full select-none z-20">
      <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('layer')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'layer'
              ? 'bg-slate-800 text-sky-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders size={14} />
          Propiedades
        </button>
        <button
          onClick={() => setActiveTab('project')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'project'
              ? 'bg-slate-800 text-sky-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette size={14} />
          Medidas & Tinta
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'layer' ? (
          <div>
            {!selectedLayer ? (
              <div className="text-center py-12 px-4 text-slate-500">
                <Circle className="mx-auto w-8 h-8 mb-2 opacity-40 text-slate-400 animate-pulse" />
                <p className="text-xs font-semibold text-slate-400">Ningún elemento seleccionado</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Haz clic o arrastra un elemento en el lienzo para ajustar sus propiedades.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-4 pb-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Editando: {selectedLayer.name}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-sky-400 px-2 py-0.5 rounded font-mono">
                    {selectedLayer.type}
                  </span>
                </div>

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
        ) : (
          <div className="space-y-6 text-sm">
            {/* Selector de Forma */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Forma del Sello
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => handleShapeChange('circle')}
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition ${
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
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition ${
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
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold transition ${
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
                <span className="font-semibold">Medidas Comerciales Estándar (mm)</span>
                <span className="text-sky-400 font-mono font-bold">
                  {width} x {height} mm
                </span>
              </div>

              {/* Botones según la forma elegida */}
              {project.shape === 'rectangle' && (
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {rectPresets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => onUpdateProject({ widthMm: p.w, heightMm: p.h })}
                      className={`py-1.5 rounded text-xs font-mono font-semibold transition ${
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
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {squarePresets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() =>
                        onUpdateProject({ widthMm: p.size, heightMm: p.size, sizeMm: p.size })
                      }
                      className={`py-1.5 rounded text-xs font-mono font-semibold transition ${
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
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {circlePresets.map((p) => (
                    <button
                      key={p.label}
                      onClick={() =>
                        onUpdateProject({ widthMm: p.size, heightMm: p.size, sizeMm: p.size })
                      }
                      className={`py-1.5 rounded text-xs font-mono font-semibold transition ${
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

              {/* Sliders para personalización fina */}
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
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Color de Tinta Oficial
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {STAMP_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onUpdateProject({ color: c.value })}
                    className={`group relative p-2 rounded-lg border flex flex-col items-center gap-1 transition ${
                      project.color === c.value
                        ? 'border-sky-500 bg-sky-950/40'
                        : 'border-slate-800 bg-slate-800/60 hover:bg-slate-800'
                    }`}
                    title={c.name}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shadow-inner"
                      style={{ backgroundColor: c.value }}
                    />
                    <span className="text-[9px] text-slate-400 truncate w-full text-center">
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
                <input
                  type="color"
                  value={project.color}
                  onChange={(e) => onUpdateProject({ color: e.target.value })}
                  className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={project.color}
                  onChange={(e) => onUpdateProject({ color: e.target.value })}
                  className="flex-1 bg-transparent text-xs font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Efecto de desgaste / Grunge realista */}
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
              <p className="text-[11px] text-slate-500 mt-1">
                Simula la textura irregular y porosidad del estampado con tinta física.
              </p>
            </div>

            {/* Guías y Rejilla */}
            <div className="pt-2 border-t border-slate-800">
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
      </div>
    </aside>
  );
};
