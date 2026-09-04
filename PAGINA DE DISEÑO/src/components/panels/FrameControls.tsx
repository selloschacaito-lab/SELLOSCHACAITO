import React from 'react';
import type { FrameLayer, FrameStyle, StampShape } from '../../types/stamp';

interface FrameControlsProps {
  layer: FrameLayer;
  shape?: StampShape;
  onChange: (updated: FrameLayer) => void;
}

export const FrameControls: React.FC<FrameControlsProps> = ({ layer, shape = 'circle', onChange }) => {
  const isRectOrSquare = shape === 'rectangle' || shape === 'square';

  const styles: { id: FrameStyle; label: string }[] = isRectOrSquare
    ? [
        { id: 'solid', label: 'Línea Sólida' },
        { id: 'double', label: 'Doble Línea' },
        { id: 'dashed', label: 'Discontinua' },
        { id: 'dotted', label: 'Punteada' },
      ]
    : [
        { id: 'solid', label: 'Línea Sólida' },
        { id: 'double', label: 'Doble Línea' },
        { id: 'dashed', label: 'Discontinua' },
        { id: 'dotted', label: 'Punteada' },
        { id: 'scalloped', label: 'Ondulada / Festón' },
      ];

  // Presets de grosores de trazo en puntos (pt) estándar de Illustrator
  const strokePresets = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6];

  return (
    <div className="space-y-4 text-sm">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de Capa</label>
        <input
          type="text"
          value={layer.name}
          onChange={(e) => onChange({ ...layer, name: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-sky-500 text-xs"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Estilo de Borde</label>
        <div className="grid grid-cols-2 gap-1.5">
          {styles.map((s) => (
            <button
              key={s.id}
              onClick={() => onChange({ ...layer, style: s.id })}
              className={`px-2 py-1.5 rounded text-xs text-left transition ${
                layer.style === s.id
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grosor del Trazo en Puntos (pt) como en Adobe Illustrator */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span className="font-semibold text-sky-400">Grosor de Línea (pt)</span>
          <span className="text-sky-400 font-mono font-bold">{layer.strokeWidth} pt</span>
        </div>
        
        {/* Presets rápidos de puntos pt */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          {strokePresets.map((pt) => (
            <button
              key={pt}
              onClick={() => onChange({ ...layer, strokeWidth: pt })}
              className={`py-1 text-[11px] font-mono rounded transition ${
                layer.strokeWidth === pt
                  ? 'bg-sky-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {pt} pt
            </button>
          ))}
        </div>

        <input
          type="range"
          min="0.25"
          max="12"
          step="0.25"
          value={layer.strokeWidth}
          onChange={(e) => onChange({ ...layer, strokeWidth: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
          <span>0.25 pt (Fino)</span>
          <span>6 pt (Grueso)</span>
          <span>12 pt (Extra)</span>
        </div>
      </div>

      {!isRectOrSquare ? (
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Radio del Círculo</span>
            <span className="text-sky-400 font-mono">{layer.radius}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={layer.radius}
            onChange={(e) => onChange({ ...layer, radius: Number(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>
      ) : (
        <>
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Ancho del Marco</span>
              <span className="text-sky-400 font-mono">{layer.widthPercent || 92}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="99"
              value={layer.widthPercent || 92}
              onChange={(e) => onChange({ ...layer, widthPercent: Number(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Alto del Marco</span>
              <span className="text-sky-400 font-mono">{layer.heightPercent || 90}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="99"
              value={layer.heightPercent || 90}
              onChange={(e) => onChange({ ...layer, heightPercent: Number(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Redondeo de Esquinas (pt)</span>
              <span className="text-sky-400 font-mono">{layer.cornerRadius || 0} pt</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={layer.cornerRadius || 0}
              onChange={(e) => onChange({ ...layer, cornerRadius: Number(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>
        </>
      )}

      {layer.style === 'double' && (
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Separación Doble Línea (pt)</span>
            <span className="text-sky-400 font-mono">{layer.doubleGap || 3} pt</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            step="0.5"
            value={layer.doubleGap || 3}
            onChange={(e) => onChange({ ...layer, doubleGap: Number(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>
      )}

      {layer.style === 'scalloped' && !isRectOrSquare && (
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Cantidad de Ondas</span>
            <span className="text-sky-400 font-mono">{layer.scallopCount || 36}</span>
          </div>
          <input
            type="range"
            min="12"
            max="60"
            step="2"
            value={layer.scallopCount || 36}
            onChange={(e) => onChange({ ...layer, scallopCount: Number(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
};
