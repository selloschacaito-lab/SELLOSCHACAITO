import React, { useState } from 'react';
import type { StampLayer } from '../../types/stamp';
import {
  Type,
  Baseline,
  CircleDot,
  Square,
  Star,
  Shield,
  Award,
  Stethoscope,
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
  Hash,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import { IconLibraryModal } from '../modals/IconLibraryModal';

interface SidebarLeftProps {
  onAddLayer: (type: StampLayer['type'], customProps?: Partial<StampLayer>) => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({ onAddLayer }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <aside
      className={`relative bg-slate-900/95 border-r border-slate-800 flex flex-col h-full select-none z-20 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-14' : 'w-64'
      }`}
    >
      {/* Botón Tirador de Borde para Colapsar/Expandir */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-30 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-sky-600 hover:border-sky-500 shadow-md flex items-center justify-center transition"
        title={isCollapsed ? 'Expandir barra de herramientas' : 'Achicar a solo iconos'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Encabezado */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 min-h-[52px]">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <Sparkles size={16} className="text-sky-400 shrink-0" />
            <div className="truncate">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 truncate">
                Herramientas
              </h2>
              <p className="text-[10px] text-slate-400 truncate">Crear objetos y textos</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className="mx-auto p-1.5 rounded-lg text-sky-400 hover:bg-slate-800 hover:text-white transition"
            title="Expandir barra de herramientas"
          >
            <PanelLeftOpen size={18} />
          </button>
        )}

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Achicar a solo iconos"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* Lista de Herramientas Scrolleable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        
        {/* GRUPO 1: TEXTOS */}
        <div>
          {!isCollapsed ? (
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2 block flex items-center gap-1">
              <Type size={13} className="text-sky-400" /> Textos y Tipografía
            </span>
          ) : (
            <div className="w-full h-px bg-slate-800 my-2" />
          )}

          <div className="grid grid-cols-1 gap-1.5">
            {/* Arco Superior */}
            <button
              onClick={() =>
                onAddLayer('circular-text', {
                  name: 'Texto Arco Superior',
                  position: 'top',
                  startAngle: 0,
                  sweepAngle: 180,
                  isReversed: false,
                  radius: 80,
                  fontSize: 7,
                  letterSpacing: 0,
                })
              }
              className={`flex items-center rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition group ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'
              }`}
              title="Texto en Arco Superior (Curvado arriba)"
            >
              <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 group-hover:scale-110 transition">
                <ArrowUpCircle size={16} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">Arco Superior</p>
                  <p className="text-[10px] text-slate-400 truncate">Curvado hacia arriba (7pt)</p>
                </div>
              )}
            </button>

            {/* Arco Inferior */}
            <button
              onClick={() =>
                onAddLayer('circular-text', {
                  name: 'Texto Arco Inferior',
                  position: 'bottom',
                  startAngle: 180,
                  sweepAngle: 180,
                  isReversed: true,
                  radius: 80,
                  fontSize: 7,
                  letterSpacing: 0,
                })
              }
              className={`flex items-center rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 text-left transition group ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'
              }`}
              title="Texto en Arco Inferior (Curvado abajo)"
            >
              <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 group-hover:scale-110 transition">
                <ArrowDownCircle size={16} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">Arco Inferior</p>
                  <p className="text-[10px] text-slate-400 truncate">Curvado hacia abajo (7pt)</p>
                </div>
              )}
            </button>

            {/* Texto Central */}
            <button
              onClick={() =>
                onAddLayer('center-text', {
                  name: 'Texto Principal',
                  text: 'EMPRESA PRINCIPAL',
                  fontSize: 7,
                  letterSpacing: 0,
                  isBold: true,
                })
              }
              className={`flex items-center rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 text-left transition group ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'
              }`}
              title="Texto Central (Horizontal)"
            >
              <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-110 transition">
                <Baseline size={16} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">Texto Central</p>
                  <p className="text-[10px] text-slate-400 truncate">Línea horizontal recta (7pt)</p>
                </div>
              )}
            </button>

            {/* Texto Secundario Pequeño */}
            <button
              onClick={() =>
                onAddLayer('center-text', {
                  name: 'Texto Secundario',
                  text: 'RIF: J-00000000-0',
                  fontSize: 7,
                  letterSpacing: 0,
                  isBold: false,
                  offsetY: 25,
                })
              }
              className={`flex items-center rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 text-left transition group ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'
              }`}
              title="Rif / Datos Pequeños (Texto secundario fino)"
            >
              <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-110 transition">
                <Hash size={16} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">Rif / Datos Pequeños</p>
                  <p className="text-[10px] text-slate-400 truncate">Texto secundario fino</p>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* GRUPO 2: MARCOS Y BORDES */}
        <div>
          {!isCollapsed ? (
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2 block flex items-center gap-1">
              <CircleDot size={13} className="text-emerald-400" /> Bordes y Marcos
            </span>
          ) : (
            <div className="w-full h-px bg-slate-800 my-2" />
          )}

          <div className="grid grid-cols-1 gap-1.5">
            {/* Círculo */}
            <button
              onClick={() =>
                onAddLayer('frame', {
                  name: 'Círculo Exterior',
                  radius: 94,
                  strokeWidth: 3,
                  style: 'solid',
                })
              }
              className={`flex items-center rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-left transition group ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'
              }`}
              title="Borde Círculo (Aro exterior)"
            >
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition">
                <CircleDot size={16} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">Borde Círculo</p>
                  <p className="text-[10px] text-slate-400 truncate">Aro exterior estándar</p>
                </div>
              )}
            </button>

            {/* Marco Rectangular */}
            <button
              onClick={() =>
                onAddLayer('frame', {
                  name: 'Marco Rectangular',
                  widthPercent: 94,
                  heightPercent: 90,
                  strokeWidth: 2,
                  cornerRadius: 4,
                  style: 'solid',
                })
              }
              className={`flex items-center rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-left transition group ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'
              }`}
              title="Marco Rectangular"
            >
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition">
                <Square size={16} />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">Marco Rectangular</p>
                  <p className="text-[10px] text-slate-400 truncate">Para sellos rectangulares</p>
                </div>
              )}
            </button>

            {/* Aro Interior Fino */}
            <button
              onClick={() =>
                onAddLayer('frame', {
                  name: 'Aro Interior Fino',
                  radius: 70,
                  strokeWidth: 1,
                  style: 'solid',
                })
              }
              className={`flex items-center rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/50 text-left transition group ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-2.5 p-2'
              }`}
              title="Aro Interior Fino"
            >
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition">
                <CircleDot size={16} className="scale-75" />
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">Aro Interior Fino</p>
                  <p className="text-[10px] text-slate-400 truncate">Línea delgada ornamental</p>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* GRUPO 3: ICONOS Y ESCUDOS */}
        <div>
          {!isCollapsed ? (
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-2 block flex items-center gap-1">
              <Star size={13} className="text-amber-400" /> Iconos y Emblemas
            </span>
          ) : (
            <div className="w-full h-px bg-slate-800 my-2" />
          )}

          <div className={isCollapsed ? 'grid grid-cols-1 gap-1.5' : 'grid grid-cols-2 gap-1.5'}>
            <button
              onClick={() =>
                onAddLayer('icon', {
                  name: 'Estrella',
                  iconKey: 'star',
                  size: 28,
                })
              }
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-center transition group"
              title="Icono Estrella"
            >
              <Star size={16} className="text-amber-400 mb-0.5 group-hover:scale-110 transition" />
              {!isCollapsed && <span className="text-[11px] font-medium text-slate-200 truncate w-full">Estrella</span>}
            </button>

            <button
              onClick={() =>
                onAddLayer('icon', {
                  name: 'Escudo',
                  iconKey: 'shield',
                  size: 32,
                })
              }
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-center transition group"
              title="Icono Escudo"
            >
              <Shield size={16} className="text-amber-400 mb-0.5 group-hover:scale-110 transition" />
              {!isCollapsed && <span className="text-[11px] font-medium text-slate-200 truncate w-full">Escudo</span>}
            </button>

            <button
              onClick={() =>
                onAddLayer('icon', {
                  name: 'Sello Médico',
                  iconKey: 'medical',
                  size: 30,
                })
              }
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-center transition group"
              title="Icono Médico"
            >
              <Stethoscope size={16} className="text-rose-400 mb-0.5 group-hover:scale-110 transition" />
              {!isCollapsed && <span className="text-[11px] font-medium text-slate-200 truncate w-full">Médico</span>}
            </button>

            <button
              onClick={() =>
                onAddLayer('icon', {
                  name: 'Abogado / Leyes',
                  iconKey: 'law',
                  size: 30,
                })
              }
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-center transition group"
              title="Icono Legal / Balanza"
            >
              <Award size={16} className="text-blue-400 mb-0.5 group-hover:scale-110 transition" />
              {!isCollapsed && <span className="text-[11px] font-medium text-slate-200 truncate w-full">Legal</span>}
            </button>
          </div>

          {/* Botón Ver Más Iconos / Subir SVG */}
          <button
            onClick={() => setIsLibraryOpen(true)}
            className={`w-full mt-2 rounded-lg bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/60 text-sky-400 hover:text-white flex items-center justify-center transition font-semibold ${
              isCollapsed ? 'p-2' : 'gap-1.5 py-1.5 px-2 text-xs'
            }`}
            title="Abrir Biblioteca de Iconos y Subir archivos .SVG"
          >
            <Sparkles size={14} className="text-sky-400" />
            {!isCollapsed && <span>Biblioteca / Subir SVG</span>}
          </button>
        </div>

      </div>

      <IconLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectIcon={(iconKey, customSvgData, label) => {
          onAddLayer('icon', {
            name: `Icono ${label || iconKey}`,
            iconKey,
            customSvgData,
            size: 32,
          });
        }}
      />
    </aside>
  );
};
