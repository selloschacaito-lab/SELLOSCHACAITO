import React from 'react';
import type { IconLayer } from '../../types/stamp';
import { STAMP_ICONS } from '../../utils/stampIcons';

interface IconControlsProps {
  layer: IconLayer;
  onChange: (updated: IconLayer) => void;
}

export const IconControls: React.FC<IconControlsProps> = ({ layer, onChange }) => {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-2">Seleccionar Icono</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(STAMP_ICONS).map(([key, iconDef]) => (
            <button
              key={key}
              onClick={() => onChange({ ...layer, iconKey: key, name: `Icono ${iconDef.label}` })}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition ${
                layer.iconKey === key
                  ? 'border-sky-500 bg-sky-950/40 text-sky-400'
                  : 'border-slate-800 bg-slate-800/60 hover:bg-slate-700/60 text-slate-400'
              }`}
              title={iconDef.label}
            >
              <svg viewBox="-24 -24 48 48" className="w-6 h-6">
                {iconDef.render(layer.iconKey === key ? '#38bdf8' : '#94a3b8')}
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Tamaño del Icono</span>
          <span className="text-sky-400 font-mono">{layer.size} px</span>
        </div>
        <input
          type="range"
          min="12"
          max="80"
          value={layer.size}
          onChange={(e) => onChange({ ...layer, size: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>

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
    </div>
  );
};
