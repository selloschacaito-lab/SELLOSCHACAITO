import React from 'react';
import type { CenterTextLayer } from '../../types/stamp';
import { STAMP_FONTS } from '../../utils/svgCalculations';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Move } from 'lucide-react';

interface CenterTextControlsProps {
  layer: CenterTextLayer;
  onChange: (updated: CenterTextLayer) => void;
}

export const CenterTextControls: React.FC<CenterTextControlsProps> = ({ layer, onChange }) => {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Texto Central (Multilínea)</label>
        <textarea
          rows={3}
          value={layer.text}
          onChange={(e) => onChange({ ...layer, text: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-sky-500 text-xs font-mono"
          placeholder="Escribe el texto central..."
        />
        <p className="text-[10px] text-sky-400 mt-1 flex items-center gap-1">
          <Move size={11} /> Puedes arrastrar este texto directamente en la pantalla con el cursor o el dedo.
        </p>
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
            max="48"
            value={layer.fontSize}
            onChange={(e) => onChange({ ...layer, fontSize: Number(e.target.value) })}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Alineación</label>
          <div className="flex gap-1">
            <button
              onClick={() => onChange({ ...layer, alignment: 'left' })}
              className={`p-1.5 rounded flex-1 flex items-center justify-center text-xs ${
                layer.alignment === 'left' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <AlignLeft size={14} />
            </button>
            <button
              onClick={() => onChange({ ...layer, alignment: 'center' })}
              className={`p-1.5 rounded flex-1 flex items-center justify-center text-xs ${
                layer.alignment === 'center' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <AlignCenter size={14} />
            </button>
            <button
              onClick={() => onChange({ ...layer, alignment: 'right' })}
              className={`p-1.5 rounded flex-1 flex items-center justify-center text-xs ${
                layer.alignment === 'right' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <AlignRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Estilo de Texto</label>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ ...layer, isBold: !layer.isBold })}
            className={`px-3 py-1.5 rounded flex-1 flex items-center justify-center gap-1 text-xs ${
              layer.isBold ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Bold size={14} /> Negrita
          </button>
          <button
            onClick={() => onChange({ ...layer, isItalic: !layer.isItalic })}
            className={`px-3 py-1.5 rounded flex-1 flex items-center justify-center gap-1 text-xs ${
              layer.isItalic ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Italic size={14} /> Cursiva
          </button>
        </div>
      </div>

      {/* Posición Horizontal X */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Posición Horizontal (X)</span>
          <span className="text-sky-400 font-mono">{layer.offsetX || 0} px</span>
        </div>
        <input
          type="range"
          min="-120"
          max="120"
          value={layer.offsetX || 0}
          onChange={(e) => onChange({ ...layer, offsetX: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>

      {/* Posición Vertical Y */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Posición Vertical (Y)</span>
          <span className="text-sky-400 font-mono">{layer.offsetY || 0} px</span>
        </div>
        <input
          type="range"
          min="-100"
          max="100"
          value={layer.offsetY || 0}
          onChange={(e) => onChange({ ...layer, offsetY: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span>Espaciado entre Letras</span>
          <span className="text-sky-400 font-mono">{layer.letterSpacing} px</span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={layer.letterSpacing}
          onChange={(e) => onChange({ ...layer, letterSpacing: Number(e.target.value) })}
          className="w-full accent-sky-500 cursor-pointer"
        />
      </div>
    </div>
  );
};
