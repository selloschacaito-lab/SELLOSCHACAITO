import React from 'react';
import {
  LayoutTemplate,
  Plus,
  RotateCcw,
  RotateCw,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  CircleDot,
  Type,
  Baseline,
  Star,
} from 'lucide-react';
import type { StampLayer } from '../../types/stamp';

interface HeaderProps {
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onNewStamp: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onOpenCambioView?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTemplates,
  onOpenExport,
  onNewStamp,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onOpenCambioView,
}) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              StampForge
              <span className="text-[10px] bg-sky-500/20 text-sky-400 font-mono px-1.5 py-0.5 rounded">
                PRO 0$
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Diseñador de Sellos Vectorial</p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-2" />

        {onOpenCambioView && (
          <button
            onClick={onOpenCambioView}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm animate-pulse"
          >
            <Sparkles size={14} className="text-emerald-400" />
            Sección CAMBIO (Vidrio 3D)
          </button>
        )}

        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
        >
          <LayoutTemplate size={14} className="text-sky-400" />
          Plantillas
        </button>

        <button
          onClick={onNewStamp}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
        >
          <Plus size={14} />
          Nuevo Sello
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/80">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Deshacer"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="Rehacer"
          >
            <RotateCw size={14} />
          </button>
        </div>

        <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/80">
          <button
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Alejar"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[11px] font-mono px-1.5 text-slate-300 font-semibold min-w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.0, zoom + 0.1))}
            className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Acercar"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => onZoomChange(1.0)}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Restablecer Zoom (100%)"
          >
            <Maximize2 size={12} />
          </button>
        </div>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-lg shadow-sky-500/25 transition transform active:scale-95"
        >
          <Download size={15} />
          Descargar Sello
        </button>
      </div>
    </header>
  );
};
