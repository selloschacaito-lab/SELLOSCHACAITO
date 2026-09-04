import React from 'react';
import type { CircularTextLayer } from '../../types/stamp';
import { STAMP_FONTS } from '../../utils/svgCalculations';
import { Bold, Italic, RotateCw, ArrowDownUp } from 'lucide-react';

interface CircularTextControlsProps {
  layer: CircularTextLayer;
  onChange: (updated: CircularTextLayer) => void;
}

export const CircularTextControls: React.FC<CircularTextControlsProps> = ({ layer, onChange }) => {
  // Presets de tamaño de fuente en puntos (pt) estándar de Illustrator
  const fontPresets = [8, 9, 10, 11, 12, 14, 16, 18];

  return (
    <div className="space-y-4 text-sm">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Texto en Arco</label>
        <input
          type="text"
          value={layer.text}
          onChange={(e) => onChange({ ...layer, text: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-sky-500 text-sm font-semibold"
          placeholder="Escribe el texto circular..."
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1">Tipografía</label>
          <select
            value={layer.fontFamily}
            onChange={(e) => onChange({ ...layer, fontFamily: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500 font-medium"
          >
            {STAMP_FONTS.map((f) => (
              <option key={f.family} value={f.family}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tamaño en Puntos (pt) como en Adobe Illustrator */}
        <div className="col-span-2">
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span className="font-semibold text-sky-400">Tamaño de Letra (pt)</span>
            <span className="text-sky-400 font-mono font-bold">{layer.fontSize} pt</span>
          </div>

          {/* Botones de selección rápida de puntos pt */}
          <div className="grid grid-cols-4 gap-1 mb-2">
            {fontPresets.map((pt) => (
              <button
                key={pt}
                onClick={() => onChange({ ...layer, fontSize: pt })}
                className={`py-1 text-[11px] font-mono rounded transition ${
                  layer.fontSize === pt
                    ? 'bg-sky-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {pt} pt
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="4"
              max="36"
              step="0.5"
              value={layer.fontSize}
              onChange={(e) => onChange({ ...layer, fontSize: Number(e.target.value) })}
              className="flex-1 accent-sky-500 cursor-pointer"
            />
            <input
              type="number"
              min="4"
              max="48"
              step="0.5"
              value={layer.fontSize}
              onChange={(e) => onChange({ ...layer, fontSize: Number(e.target.value) })}
              className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-xs text-center font-mono"
            />
          </div>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1">Formato</label>
          <div className="flex gap-1.5">
            <button
              onClick={() => onChange({ ...layer, isBold: !layer.isBold })}
              className={`p-1.5 rounded flex-1 flex items-center justify-center gap-1 text-xs font-medium ${
                layer.isBold ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title="Negrita"
            >
              <Bold size={14} /> Negrita
            </button>
            <button
              onClick={() => onChange({ ...layer, isItalic: !layer.isItalic })}
              className={`p-1.5 rounded flex-1 flex items-center justify-center gap-1 text-xs font-medium ${
                layer.isItalic ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title="Cursiva"
            >
              <Italic size={14} /> Cursiva
            </button>
            <button
              onClick={() =>
                onChange({
                  ...layer,
                  isReversed: !layer.isReversed,
                })
              }
              className={`p-1.5 rounded flex-1 flex items-center justify-center gap-1 text-xs font-medium ${
                layer.isReversed ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title="Invertir dirección de lectura"
            >
              <ArrowDownUp size={14} /> Invertir
            </button>
          </div>
        </div>
      </div>

      {/* Presets rápidos Arriba / Abajo */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Posición Rápida</label>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() =>
              onChange({
                ...layer,
                startAngle: 0,
                sweepAngle: 180,
                isReversed: false,
                position: 'top',
              })
            }
            className={`px-2 py-2 rounded text-xs font-semibold text-center transition ${
              !layer.isReversed && (layer.startAngle === 0 || layer.startAngle === 360)
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Arco Superior (Arriba)
          </button>
          <button
            onClick={() =>
              onChange({
                ...layer,
                startAngle: 180,
                sweepAngle: 180,
                isReversed: true,
                position: 'bottom',
              })
            }
            className={`px-2 py-2 rounded text-xs font-semibold text-center transition ${
              layer.isReversed && layer.startAngle === 180
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Arco Inferior (Abajo)
          </button>
        </div>
      </div>

      {/* Radio del texto */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Radio del Arco</span>
          <span className="text-sky-400 font-mono">{layer.radius}%</span>
        </div>
        <input
          type="range"
          min="20"
          max="95"
          value={layer.radius}
          onChange={(e) => onChange({ ...layer, radius: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>

      {/* Ángulo central / Rotación */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span className="flex items-center gap-1">
            <RotateCw size={12} /> Rotación / Ángulo Central
          </span>
          <span className="text-sky-400 font-mono">{layer.startAngle}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={layer.startAngle}
          onChange={(e) => onChange({ ...layer, startAngle: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>0° (Arriba)</span>
          <span>90° (Derecha)</span>
          <span>180° (Abajo)</span>
          <span>270° (Izquierda)</span>
        </div>
      </div>

      {/* Amplitud de arco */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Amplitud del Arco</span>
          <span className="text-sky-400 font-mono">{layer.sweepAngle}°</span>
        </div>
        <input
          type="range"
          min="40"
          max="320"
          value={layer.sweepAngle}
          onChange={(e) => onChange({ ...layer, sweepAngle: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>

      {/* Espaciado de letras */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Espaciado / Tracking (pt)</span>
          <span className="text-sky-400 font-mono">{layer.letterSpacing} pt</span>
        </div>
        <input
          type="range"
          min="0"
          max="12"
          step="0.25"
          value={layer.letterSpacing}
          onChange={(e) => onChange({ ...layer, letterSpacing: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>
    </div>
  );
};
