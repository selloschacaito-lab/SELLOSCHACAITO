import React from 'react';
import type { FrameLayer, FrameStyle, StampShape } from '../../types/stamp';
import { Circle, Square, RectangleHorizontal } from 'lucide-react';

interface FrameControlsProps {
  layer: FrameLayer;
  shape?: StampShape;
  onChange: (updated: FrameLayer) => void;
}

export const FrameControls: React.FC<FrameControlsProps> = ({ layer, shape = 'circle', onChange }) => {
  const currentShape = layer.shape || shape;
  const isRectOrSquare = currentShape === 'rectangle' || currentShape === 'square';

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
  const strokePresets = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6];

  const handleFrameShapeSelect = (newShape: StampShape) => {
    if (newShape === 'circle') {
      onChange({
        ...layer,
        shape: 'circle',
        radius: layer.radius || 94,
      });
    } else if (newShape === 'rectangle') {
      onChange({
        ...layer,
        shape: 'rectangle',
        widthPercent: layer.widthPercent || 94,
        heightPercent: layer.heightPercent || 80,
      });
    } else if (newShape === 'square') {
      onChange({
        ...layer,
        shape: 'square',
        widthPercent: layer.widthPercent || 90,
        heightPercent: layer.heightPercent || 90,
      });
    }
  };

  return (
    <div className="space-y-4 text-sm">
      {/* Nombre de la capa */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre de Capa</label>
        <input
          type="text"
          value={layer.name}
          onChange={(e) => onChange({ ...layer, name: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-sky-500 text-xs"
        />
      </div>

      {/* Selector de Forma del Marco (Círculo, Rectángulo, Cuadrado) */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Forma del Borde / Marco</label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => handleFrameShapeSelect('circle')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentShape === 'circle'
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Circle size={13} />
            Círculo
          </button>
          <button
            onClick={() => handleFrameShapeSelect('rectangle')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentShape === 'rectangle'
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <RectangleHorizontal size={13} />
            Rectángulo
          </button>
          <button
            onClick={() => handleFrameShapeSelect('square')}
            className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentShape === 'square'
                ? 'bg-sky-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Square size={13} />
            Cuadrado
          </button>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 1. ORDEN SOLICITADO: RADIO DEL CÍRCULO / DIMENSIONES    */}
      {/* ======================================================= */}
      {!isRectOrSquare ? (
        <div>
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span className="font-semibold text-sky-400">Radio del Círculo</span>
            <span className="text-sky-400 font-mono font-bold">{layer.radius}%</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="100"
              value={layer.radius}
              onChange={(e) => onChange({ ...layer, radius: Number(e.target.value) })}
              className="flex-1 accent-sky-500 cursor-pointer"
            />
            <input
              type="number"
              min="10"
              max="100"
              value={layer.radius}
              onChange={(e) => onChange({ ...layer, radius: Number(e.target.value) })}
              className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-xs text-center font-mono"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="font-semibold text-sky-400">Ancho del Marco</span>
              <span className="text-sky-400 font-mono font-bold">{layer.widthPercent || 92}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="20"
                max="99"
                value={layer.widthPercent || 92}
                onChange={(e) => onChange({ ...layer, widthPercent: Number(e.target.value) })}
                className="flex-1 accent-sky-500 cursor-pointer"
              />
              <input
                type="number"
                min="20"
                max="99"
                value={layer.widthPercent || 92}
                onChange={(e) => onChange({ ...layer, widthPercent: Number(e.target.value) })}
                className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-xs text-center font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span className="font-semibold text-sky-400">Alto del Marco</span>
              <span className="text-sky-400 font-mono font-bold">{layer.heightPercent || 90}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="20"
                max="99"
                value={layer.heightPercent || 90}
                onChange={(e) => onChange({ ...layer, heightPercent: Number(e.target.value) })}
                className="flex-1 accent-sky-500 cursor-pointer"
              />
              <input
                type="number"
                min="20"
                max="99"
                value={layer.heightPercent || 90}
                onChange={(e) => onChange({ ...layer, heightPercent: Number(e.target.value) })}
                className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-xs text-center font-mono"
              />
            </div>
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
        </div>
      )}

      {/* ======================================================= */}
      {/* 2. ORDEN SOLICITADO: GROSOR DE LÍNEA                   */}
      {/* ======================================================= */}
      <div>
        <div className="flex justify-between text-xs text-slate-300 mb-1">
          <span className="font-semibold text-sky-400">Grosor de Línea (pt)</span>
          <span className="text-sky-400 font-mono font-bold">{layer.strokeWidth} pt</span>
        </div>
        
        {/* Presets rápidos de puntos pt */}
        <div className="grid grid-cols-5 gap-1 mb-2">
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

        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0.25"
            max="12"
            step="0.25"
            value={layer.strokeWidth}
            onChange={(e) => onChange({ ...layer, strokeWidth: Number(e.target.value) })}
            className="flex-1 accent-sky-500 cursor-pointer"
          />
          <input
            type="number"
            min="0.25"
            max="24"
            step="0.25"
            value={layer.strokeWidth}
            onChange={(e) => onChange({ ...layer, strokeWidth: Number(e.target.value) })}
            className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white text-xs text-center font-mono"
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>0.25 pt (Fino)</span>
          <span>3 pt (Medio)</span>
          <span>12 pt (Extra)</span>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 3. ORDEN SOLICITADO: ESTILO DE BORDE                   */}
      {/* ======================================================= */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Estilo de Borde</label>
        <div className="grid grid-cols-2 gap-1.5">
          {styles.map((s) => (
            <button
              key={s.id}
              onClick={() => onChange({ ...layer, style: s.id })}
              className={`px-2.5 py-2 rounded-lg text-xs text-left transition font-medium ${
                layer.style === s.id
                  ? 'bg-sky-600 text-white font-semibold shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {layer.style === 'double' && (
        <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800">
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Separación Doble Línea (pt)</span>
            <span className="text-sky-400 font-mono font-bold">{layer.doubleGap || 3} pt</span>
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
        <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-800">
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Cantidad de Ondas</span>
            <span className="text-sky-400 font-mono font-bold">{layer.scallopCount || 36}</span>
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
