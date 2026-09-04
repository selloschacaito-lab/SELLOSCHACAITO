import React, { useState } from 'react';
import type { IconLayer } from '../../types/stamp';
import { STAMP_ICONS } from '../../utils/stampIcons';
import { IconLibraryModal } from '../modals/IconLibraryModal';
import { Sparkles, Upload } from 'lucide-react';

interface IconControlsProps {
  layer: IconLayer;
  onChange: (updated: IconLayer) => void;
}

export const IconControls: React.FC<IconControlsProps> = ({ layer, onChange }) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <div className="space-y-4 text-sm">
      {/* Botón para abrir la Biblioteca Completa y Subir SVG */}
      <button
        onClick={() => setIsLibraryOpen(true)}
        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
      >
        <Sparkles size={14} />
        Biblioteca de Iconos y Subir SVG
      </button>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2">Iconos Rápidos</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(STAMP_ICONS).slice(0, 8).map(([key, iconDef]) => (
            <button
              key={key}
              onClick={() =>
                onChange({
                  ...layer,
                  iconKey: key,
                  customSvgData: undefined,
                  name: `Icono ${iconDef.label}`,
                })
              }
              className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition ${
                layer.iconKey === key && !layer.customSvgData
                  ? 'border-sky-500 bg-sky-950/40 text-sky-400 font-bold'
                  : 'border-slate-800 bg-slate-800/60 hover:bg-slate-700/60 text-slate-400'
              }`}
              title={iconDef.label}
            >
              <svg viewBox="-24 -24 48 48" className="w-5 h-5">
                {iconDef.render(layer.iconKey === key ? '#38bdf8' : '#94a3b8')}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* Tamaño */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span className="font-semibold text-sky-400">Tamaño del Icono</span>
          <span className="text-sky-400 font-mono font-bold">{layer.size} px</span>
        </div>
        <input
          type="range"
          min="8"
          max="100"
          value={layer.size}
          onChange={(e) => onChange({ ...layer, size: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>

      {/* Posición Horizontal X */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Posición Horizontal (X)</span>
          <span className="text-sky-400 font-mono">{layer.offsetX} px</span>
        </div>
        <input
          type="range"
          min="-80"
          max="80"
          value={layer.offsetX}
          onChange={(e) => onChange({ ...layer, offsetX: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>

      {/* Posición Vertical Y */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Posición Vertical (Y)</span>
          <span className="text-sky-400 font-mono">{layer.offsetY} px</span>
        </div>
        <input
          type="range"
          min="-80"
          max="80"
          value={layer.offsetY}
          onChange={(e) => onChange({ ...layer, offsetY: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>

      {/* Rotación */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Rotación</span>
          <span className="text-sky-400 font-mono">{layer.rotation}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={layer.rotation}
          onChange={(e) => onChange({ ...layer, rotation: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>

      {/* Modal de la Biblioteca */}
      <IconLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectIcon={(iconKey, customSvgData, label) => {
          onChange({
            ...layer,
            iconKey,
            customSvgData,
            name: `Icono ${label || iconKey}`,
          });
        }}
      />
    </div>
  );
};
