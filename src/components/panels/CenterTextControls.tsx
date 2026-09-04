import React, { useState } from 'react';
import type { CenterTextLayer } from '../../types/stamp';
import { STAMP_FONTS } from '../../utils/svgCalculations';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  RotateCw,
  Move,
  ArrowUpDown,
  ArrowLeftRight,
} from 'lucide-react';

interface CenterTextControlsProps {
  layer: CenterTextLayer;
  onChange: (updated: CenterTextLayer) => void;
}

export const CenterTextControls: React.FC<CenterTextControlsProps> = ({ layer, onChange }) => {
  const [activeTab, setActiveTab] = useState<'character' | 'paragraph'>('character');

  const scaleXPercent = Math.round((layer.scaleX !== undefined ? layer.scaleX : 1) * 100);
  const scaleYPercent = Math.round((layer.scaleY !== undefined ? layer.scaleY : 1) * 100);
  const lineHeightPt = Number(((layer.lineHeight || 1.2) * (layer.fontSize || 12)).toFixed(1));

  return (
    <div className="space-y-3 text-xs bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-xl">
      {/* TEXTAREA PRINCIPAL */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          Texto Central
        </label>
        <textarea
          rows={3}
          value={layer.text}
          onChange={(e) => onChange({ ...layer, text: e.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-sky-500 font-mono text-xs"
          placeholder="Escribe el texto central..."
        />
        <p className="text-[10px] text-sky-400 mt-1 flex items-center gap-1">
          <Move size={11} /> Puedes arrastrar el texto directamente en la hoja de diseño.
        </p>
      </div>

      {/* PESTAÑAS ESTILO ADOBE ILLUSTRATOR: [ CARÁCTER ] | [ PÁRRAFO ] */}
      <div className="flex border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('character')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'character'
              ? 'border-sky-500 text-sky-400 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔤</span> Carácter
        </button>
        <button
          onClick={() => setActiveTab('paragraph')}
          className={`px-3 py-1.5 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'paragraph'
              ? 'border-sky-500 text-sky-400 font-bold bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📄</span> Párrafo & Posición
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. PANEL CARÁCTER (ADOBE ILLUSTRATOR CHARACTER PANEL)     */}
      {/* ========================================================= */}
      {activeTab === 'character' && (
        <div className="space-y-3 pt-1 animate-fadeIn">
          {/* Tipografía y Peso */}
          <div className="space-y-1.5">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">Familia Tipográfica</label>
              <select
                value={layer.fontFamily}
                onChange={(e) => onChange({ ...layer, fontFamily: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-sky-500 font-medium"
              >
                {STAMP_FONTS.map((f) => (
                  <option key={f.family} value={f.family}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Estilo / Variación */}
            <div className="flex gap-1">
              <button
                onClick={() => onChange({ ...layer, isBold: !layer.isBold })}
                className={`flex-1 py-1 px-2 rounded border flex items-center justify-center gap-1 text-xs font-semibold transition ${
                  layer.isBold
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Bold size={13} /> Negrita (Bold)
              </button>
              <button
                onClick={() => onChange({ ...layer, isItalic: !layer.isItalic })}
                className={`flex-1 py-1 px-2 rounded border flex items-center justify-center gap-1 text-xs font-semibold transition ${
                  layer.isItalic
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Italic size={13} /> Cursiva (Italic)
              </button>
            </div>
          </div>

          {/* MATRIZ DE PARÁMETROS ILLUSTRATOR (2 COLUMNAS) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl">
            
            {/* [ TT ] Tamaño de Letra (pt) */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-bold flex items-center gap-1 text-slate-300">
                  <span className="font-serif text-[11px] font-black">T<span className="text-[9px]">T</span></span> Tamaño (pt)
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5">
                <input
                  type="number"
                  min="3"
                  max="72"
                  step="0.5"
                  value={layer.fontSize}
                  onChange={(e) => onChange({ ...layer, fontSize: Number(e.target.value) })}
                  className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono">pt</span>
              </div>
            </div>

            {/* [ A/A ] Interlineado / Leading (pt) */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-bold flex items-center gap-1 text-slate-300">
                  <ArrowUpDown size={11} className="text-sky-400" /> Interlineado
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5">
                <input
                  type="number"
                  min="4"
                  max="80"
                  step="0.5"
                  value={lineHeightPt}
                  onChange={(e) => {
                    const newPt = Number(e.target.value);
                    const newRatio = newPt / (layer.fontSize || 12);
                    onChange({ ...layer, lineHeight: Number(newRatio.toFixed(2)) });
                  }}
                  className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono">pt</span>
              </div>
            </div>

            {/* [ VA ] Tracking / Espaciado de Letras (pt) */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-bold flex items-center gap-1 text-slate-300">
                  <ArrowLeftRight size={11} className="text-sky-400" /> Tracking (pt)
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5">
                <input
                  type="number"
                  min="-2"
                  max="20"
                  step="0.25"
                  value={layer.letterSpacing}
                  onChange={(e) => onChange({ ...layer, letterSpacing: Number(e.target.value) })}
                  className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono">pt</span>
              </div>
            </div>

            {/* [ (T)° ] Rotación de Caracteres / Ángulo */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-bold flex items-center gap-1 text-slate-300">
                  <RotateCw size={11} className="text-sky-400" /> Rotación (°)
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5">
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="1"
                  value={layer.rotation || 0}
                  onChange={(e) => onChange({ ...layer, rotation: Number(e.target.value) })}
                  className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono">°</span>
              </div>
            </div>

            {/* [ IT ] Escala Vertical (%) */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-bold flex items-center gap-1 text-slate-300">
                  <span>↕</span> Escala Vertical
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5">
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="1"
                  value={scaleYPercent}
                  onChange={(e) => onChange({ ...layer, scaleY: Number(e.target.value) / 100 })}
                  className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono">%</span>
              </div>
            </div>

            {/* [ T↔ ] Escala Horizontal (%) */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-bold flex items-center gap-1 text-slate-300">
                  <span>↔</span> Escala Horizontal
                </span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-md px-1.5 py-0.5">
                <input
                  type="number"
                  min="30"
                  max="300"
                  step="1"
                  value={scaleXPercent}
                  onChange={(e) => onChange({ ...layer, scaleX: Number(e.target.value) / 100 })}
                  className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-mono">%</span>
              </div>
            </div>

            {/* [ Aª ] Desplazamiento de Línea Base (pt) */}
            <div className="col-span-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                <span className="font-bold flex items-center gap-1 text-slate-300">
                  <span>Aª</span> Desplazamiento Línea Base
                </span>
                <span className="text-sky-400 font-mono">{layer.baselineShift || 0} pt</span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="0.5"
                value={layer.baselineShift || 0}
                onChange={(e) => onChange({ ...layer, baselineShift: Number(e.target.value) })}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

          </div>

          {/* BOTONES DE ESTILO RÁPIDO: [ TT ] MAYÚSCULAS, SUBRAYADO, TACHADO */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() =>
                onChange({
                  ...layer,
                  textTransform: layer.textTransform === 'uppercase' ? 'none' : 'uppercase',
                })
              }
              className={`flex-1 py-1 rounded text-center text-xs font-bold transition ${
                layer.textTransform === 'uppercase'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Todo Mayúsculas (All Caps)"
            >
              TT
            </button>
            <button
              onClick={() =>
                onChange({
                  ...layer,
                  textTransform: layer.textTransform === 'lowercase' ? 'none' : 'lowercase',
                })
              }
              className={`flex-1 py-1 rounded text-center text-xs font-bold transition ${
                layer.textTransform === 'lowercase'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Todo Minúsculas"
            >
              tt
            </button>
            <button
              onClick={() =>
                onChange({
                  ...layer,
                  textDecoration: layer.textDecoration === 'underline' ? 'none' : 'underline',
                })
              }
              className={`flex-1 py-1 rounded text-center text-xs font-bold transition flex items-center justify-center ${
                layer.textDecoration === 'underline'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Subrayado"
            >
              <Underline size={13} />
            </button>
            <button
              onClick={() =>
                onChange({
                  ...layer,
                  textDecoration: layer.textDecoration === 'line-through' ? 'none' : 'line-through',
                })
              }
              className={`flex-1 py-1 rounded text-center text-xs font-bold transition flex items-center justify-center ${
                layer.textDecoration === 'line-through'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Tachado"
            >
              <Strikethrough size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. PANEL PÁRRAFO (PARAGRAPH & POSITION PANEL)             */}
      {/* ========================================================= */}
      {activeTab === 'paragraph' && (
        <div className="space-y-3 pt-1 animate-fadeIn">
          {/* Alineación */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Alineación de Párrafo
            </label>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => onChange({ ...layer, alignment: 'left' })}
                className={`p-1.5 rounded flex-1 flex items-center justify-center text-xs transition ${
                  layer.alignment === 'left' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Alinear a la Izquierda"
              >
                <AlignLeft size={15} />
              </button>
              <button
                onClick={() => onChange({ ...layer, alignment: 'center' })}
                className={`p-1.5 rounded flex-1 flex items-center justify-center text-xs transition ${
                  layer.alignment === 'center' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Centrar"
              >
                <AlignCenter size={15} />
              </button>
              <button
                onClick={() => onChange({ ...layer, alignment: 'right' })}
                className={`p-1.5 rounded flex-1 flex items-center justify-center text-xs transition ${
                  layer.alignment === 'right' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Alinear a la Derecha"
              >
                <AlignRight size={15} />
              </button>
            </div>
          </div>

          {/* Posición Horizontal X */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="font-semibold text-slate-300">Posición Horizontal (X)</span>
              <span className="text-sky-400 font-mono font-bold">{layer.offsetX || 0} %</span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={layer.offsetX || 0}
              onChange={(e) => onChange({ ...layer, offsetX: Number(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Posición Vertical Y */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="font-semibold text-slate-300">Posición Vertical (Y)</span>
              <span className="text-sky-400 font-mono font-bold">{layer.offsetY || 0} %</span>
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
        </div>
      )}
    </div>
  );
};
