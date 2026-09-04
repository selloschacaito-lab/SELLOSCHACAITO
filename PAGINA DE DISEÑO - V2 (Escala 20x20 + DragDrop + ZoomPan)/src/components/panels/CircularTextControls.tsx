import React from 'react';
import type { CircularTextLayer } from '../../types/stamp';
import { STAMP_FONTS } from '../../utils/svgCalculations';
import { Bold, Italic, RotateCw, ArrowDownUp } from 'lucide-react';

interface CircularTextControlsProps {
  layer: CircularTextLayer;
  onChange: (updated: CircularTextLayer) => void;
}

export const CircularTextControls: React.FC<CircularTextControlsProps> = ({ layer, onChange }) => {
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
          <label className="block text-xs font-semibold text-slate-300 mb-1">Fuente</label>
          <select
            value={layer.fontFamily}
            onChange={(e) => onChange({ ...layer, fontFamily: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
          >
            {STAMP_FONTS.map((f) => (
              <option key={f.family} value={f.family}>
                {f.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Tamaño</label>
          <input
            type="number"
            min="6"
            max="36"
            value={layer.fontSize}
            onChange={(e) => onChange({ ...layer, fontSize: Number(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Formato</label>
          <div className="flex gap-1">
            <button
              onClick={() => onChange({ ...layer, isBold: !layer.isBold })}
              className={`p-1.5 rounded flex-1 flex items-center justify-center text-xs ${
                layer.isBold ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title="Negrita"
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => onChange({ ...layer, isItalic: !layer.isItalic })}
              className={`p-1.5 rounded flex-1 flex items-center justify-center text-xs ${
                layer.isItalic ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title="Cursiva"
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() =>
                onChange({
                  ...layer,
                  isReversed: !layer.isReversed,
                })
              }
              className={`p-1.5 rounded flex-1 flex items-center justify-center text-xs ${
                layer.isReversed ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              title="Invertir dirección de lectura"
            >
              <ArrowDownUp size={14} />
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
          <span>Espaciado entre Letras</span>
          <span className="text-sky-400 font-mono">{layer.letterSpacing} px</span>
        </div>
        <input
          type="range"
          min="0"
          max="15"
          step="0.5"
          value={layer.letterSpacing}
          onChange={(e) => onChange({ ...layer, letterSpacing: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>
    </div>
  );
};
