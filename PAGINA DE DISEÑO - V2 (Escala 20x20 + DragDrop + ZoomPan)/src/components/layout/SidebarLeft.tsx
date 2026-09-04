import React, { useState } from 'react';
import type {
  StampLayer,
  FrameLayer,
  CircularTextLayer,
  CenterTextLayer,
  IconLayer,
} from '../../types/stamp';
import {
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  CircleDot,
  Type,
  Baseline,
  Star,
  Plus,
} from 'lucide-react';

interface SidebarLeftProps {
  layers: StampLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onAddLayer: (type: StampLayer['type']) => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayer,
  onAddLayer,
}) => {
  const [filter, setFilter] = useState<'all' | 'text' | 'frame' | 'icon'>('all');

  const filteredLayers = layers.filter((layer) => {
    if (filter === 'all') return true;
    if (filter === 'text') return layer.type === 'circular-text' || layer.type === 'center-text';
    if (filter === 'frame') return layer.type === 'frame';
    if (filter === 'icon') return layer.type === 'icon';
    return true;
  });

  const getLayerIcon = (type: StampLayer['type']) => {
    switch (type) {
      case 'frame':
        return <CircleDot size={14} className="text-emerald-400" />;
      case 'circular-text':
        return <Type size={14} className="text-sky-400" />;
      case 'center-text':
        return <Baseline size={14} className="text-indigo-400" />;
      case 'icon':
        return <Star size={14} className="text-amber-400" />;
    }
  };

  const getLayerSubtitle = (layer: StampLayer) => {
    switch (layer.type) {
      case 'frame': {
        const f = layer as FrameLayer;
        return `Radio ${f.radius}% • Trazo ${f.strokeWidth}px`;
      }
      case 'circular-text': {
        const ct = layer as CircularTextLayer;
        return `"${ct.text.slice(0, 18)}${ct.text.length > 18 ? '...' : ''}"`;
      }
      case 'center-text': {
        const cnt = layer as CenterTextLayer;
        return `"${cnt.text.replace(/\n/g, ' ').slice(0, 18)}"`;
      }
      case 'icon': {
        const ic = layer as IconLayer;
        return `Tamaño ${ic.size}px`;
      }
    }
  };

  return (
    <aside className="w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col h-full select-none z-20">
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-sky-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Capas ({layers.length})
          </h2>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onAddLayer('circular-text')}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 transition"
            title="Añadir texto en arco"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 p-2 gap-1 border-b border-slate-800 bg-slate-950/40 text-[11px]">
        {(['all', 'text', 'frame', 'icon'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-1 rounded text-center font-medium capitalize transition ${
              filter === f
                ? 'bg-slate-800 text-sky-400 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {f === 'all' ? 'Todo' : f === 'text' ? 'Texto' : f === 'frame' ? 'Marcos' : 'Iconos'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredLayers.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No hay capas en esta categoría.
          </div>
        ) : (
          filteredLayers.map((layer, index) => {
            const isSelected = layer.id === selectedLayerId;

            return (
              <div
                key={layer.id}
                onClick={() => onSelectLayer(layer.id)}
                className={`group flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                  isSelected
                    ? 'bg-sky-950/40 border-sky-500/80 text-white shadow-sm'
                    : 'bg-slate-800/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="p-1 rounded bg-slate-900/60 shrink-0">
                    {getLayerIcon(layer.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate text-[12px]">{layer.name}</p>
                    <p className="text-[10px] text-slate-400 truncate font-mono">
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
                    title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
                  >
                    {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.id, 'up');
                    }}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-20"
                    title="Mover arriba"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayer(layer.id, 'down');
                    }}
                    disabled={index === filteredLayers.length - 1}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 disabled:opacity-20"
                    title="Mover abajo"
                  >
                    <ChevronDown size={13} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateLayer(layer.id);
                    }}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-sky-400"
                    title="Duplicar capa"
                  >
                    <Copy size={13} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                    title="Eliminar capa"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
