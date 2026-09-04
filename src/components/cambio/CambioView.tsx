import React, { useState } from 'react';
import {
  Wifi,
  Bluetooth,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Plane,
  Lock,
  Unlock,
  Bell,
  BellOff,
  ArrowUpDown,
  Sparkles,
  ArrowLeft,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { GlassPill } from './GlassPill';

interface CambioViewProps {
  onBackToApp: () => void;
}

export const CambioView: React.FC<CambioViewProps> = ({ onBackToApp }) => {
  const [airplane, setAirplane] = useState(false);
  const [data, setData] = useState(true);
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  const [lock, setLock] = useState(true);
  const [dnd, setDnd] = useState(false);
  const [nightMode, setNightMode] = useState(false);
  const [verticalToggle, setVerticalToggle] = useState(true);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto bg-[#e5e5e5] text-neutral-900 flex flex-col items-center justify-start p-4 sm:p-8 select-none font-sans">
      {/* ------------------------------------------------------------- */}
      {/* BACKGROUND REFRACTION ENGINE (80% Gris, 10% Negro, 5% Verde)  */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* 10% Soft Black Blob */}
        <div className="absolute top-[15%] left-[10%] w-[380px] h-[380px] rounded-full bg-neutral-900/35 blur-[100px] animate-pulse duration-[8000ms]" />

        {/* 5% Pastel Green (Emerald) Blob */}
        <div className="absolute top-[35%] right-[15%] w-[420px] h-[420px] rounded-full bg-[#86efac]/40 blur-[90px]" />

        {/* Soft Contrast Core Blob */}
        <div className="absolute bottom-[10%] left-[30%] w-[500px] h-[350px] rounded-full bg-[#cbd5e1]/70 blur-[110px]" />

        {/* Dynamic Interactive Blob (Sigue los cambios) */}
        <div
          className={`absolute top-[50%] left-[45%] w-[300px] h-[300px] rounded-full transition-all duration-700 blur-[80px] ${
            airplane || data
              ? 'bg-[#a7f3d0]/40 scale-125'
              : 'bg-neutral-800/20 scale-95'
          }`}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TOP BAR / NAV                                                 */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between mb-8">
        <button
          onClick={onBackToApp}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/35 border border-white/50 backdrop-blur-xl shadow-[0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] text-neutral-800 font-medium text-xs sm:text-sm transition active:scale-95"
        >
          <ArrowLeft size={16} />
          Volver a StampForge
        </button>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/40 backdrop-blur-md text-[11px] font-mono font-semibold text-neutral-700 shadow-sm">
          <Sparkles size={13} className="text-emerald-600 animate-spin duration-[4000ms]" />
          <span>SECCIÓN CAMBIO // MODO CRISTAL 3D</span>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN SHOWCASE CONTAINER                                      */}
      {/* ------------------------------------------------------------- */}
      <main className="relative z-10 w-full max-w-4xl flex flex-col gap-8 pb-12">
        {/* Banner Explicativo Glass */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-white/[0.15] border border-white/50 backdrop-blur-[24px] backdrop-saturate-[180%] shadow-[0_20px_40px_rgba(0,0,0,0.08),inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.05)] overflow-hidden">
          {/* Specular overlay */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 flex items-center gap-2.5">
                Glassmorfismo Hiperrealista
                <span className="text-xs bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-full font-mono border border-emerald-300">
                  80% Gris / 10% Negro / 5% Verde
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 max-w-xl leading-relaxed">
                Toca cualquier botón tipo píldora para activar el <strong>Glow Tecnológico Verde Pastel</strong>. 
                Fíjate cómo los bordes biselados refractan las manchas oscuras y verdes que se mueven en el fondo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-neutral-800">Interactivo en Vivo</span>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* GRID DE PÍLDORAS E INTERRUPTORES (Como en tu imagen)        */}
        {/* ----------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Columna 1: Píldoras Horizontales Estándar */}
          <div className="flex flex-col gap-4 p-5 rounded-3xl bg-white/[0.1] border border-white/30 backdrop-blur-xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 px-1 flex items-center gap-1.5">
              <Sliders size={13} /> Conectividad
            </h3>
            
            <GlassPill
              label="Modo Avión"
              subLabel={airplane ? 'Desconectado' : 'Listo'}
              icon={<Plane size={18} />}
              isActive={airplane}
              onToggle={() => setAirplane(!airplane)}
              size="md"
            />

            <GlassPill
              label="Datos Móviles"
              subLabel={data ? '5G LTE Activo' : 'Desactivado'}
              icon={<ArrowUpDown size={18} />}
              isActive={data}
              onToggle={() => setData(!data)}
              size="md"
            />

            <GlassPill
              label="Red Wi-Fi"
              subLabel={wifi ? 'Oficina 5GHz' : 'Apagado'}
              icon={<Wifi size={18} />}
              isActive={wifi}
              onToggle={() => setWifi(!wifi)}
              size="md"
            />

            <GlassPill
              label="Bluetooth"
              subLabel={bluetooth ? 'Conectado' : 'Buscando...'}
              icon={<Bluetooth size={18} />}
              isActive={bluetooth}
              onToggle={() => setBluetooth(!bluetooth)}
              size="md"
            />
          </div>

          {/* Columna 2: Estados Rápidos y Seguridad */}
          <div className="flex flex-col gap-4 p-5 rounded-3xl bg-white/[0.1] border border-white/30 backdrop-blur-xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 px-1 flex items-center gap-1.5">
              <Lock size={13} /> Control y Privacidad
            </h3>

            <GlassPill
              label="Bloqueo de Giro"
              subLabel={lock ? 'Bloqueado' : 'Libre'}
              icon={lock ? <Lock size={18} /> : <Unlock size={18} />}
              isActive={lock}
              onToggle={() => setLock(!lock)}
              size="md"
            />

            <GlassPill
              label="No Molestar"
              subLabel={dnd ? 'Silencio Total' : 'Sonido'}
              icon={dnd ? <BellOff size={18} /> : <Bell size={18} />}
              isActive={dnd}
              onToggle={() => setDnd(!dnd)}
              size="md"
            />

            <GlassPill
              label="Modo Nocturno"
              subLabel={nightMode ? 'Cálido Activo' : 'Luz Día'}
              icon={nightMode ? <Moon size={18} /> : <Sun size={18} />}
              isActive={nightMode}
              onToggle={() => setNightMode(!nightMode)}
              size="md"
            />

            <div className="mt-2 p-3 rounded-2xl bg-white/[0.08] border border-white/20 text-center">
              <span className="text-[11px] text-neutral-600 font-medium">
                💡 Haz clic varias veces para ver la suavidad del brillo interno verde.
              </span>
            </div>
          </div>

          {/* Columna 3: Píldora Vertical Gigante (Tipo Nike / Cápsula del ejemplo) */}
          <div className="flex flex-col items-center gap-4 p-5 rounded-3xl bg-white/[0.1] border border-white/30 backdrop-blur-xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 px-1 self-start flex items-center gap-1.5">
              <Sparkles size={13} /> Cápsula Vertical
            </h3>

            <div className="flex items-center justify-center py-2">
              <GlassPill
                label={verticalToggle ? 'ACTIVO' : 'PAUSA'}
                subLabel="Cápsula 3D"
                icon={<Sun size={20} />}
                activeIcon={<Sparkles size={20} />}
                isActive={verticalToggle}
                onToggle={() => setVerticalToggle(!verticalToggle)}
                orientation="vertical"
                size="lg"
              />
            </div>

            <div className="text-center px-2">
              <p className="text-xs font-semibold text-neutral-800">
                Efecto Cápsula Refractaria
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Simula el interruptor del reproductor de música en la imagen original.
              </p>
            </div>
          </div>

        </div>

        {/* ----------------------------------------------------------- */}
        {/* MINI GUÍA TÉCNICA DEL EFECTO                                */}
        {/* ----------------------------------------------------------- */}
        <div className="rounded-2xl p-5 bg-white/[0.1] border border-white/30 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-800">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900">Fórmula de Estilo Aplicada</p>
              <p className="text-[11px] text-neutral-600 font-mono">
                backdrop-blur(24px) + Inset White Top (0.9) + Inset Dark Bottom (0.1) + Emerald Glow
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setAirplane(true);
              setData(true);
              setWifi(true);
              setBluetooth(true);
              setLock(true);
              setDnd(true);
              setNightMode(true);
              setVerticalToggle(true);
            }}
            className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-medium text-xs hover:bg-neutral-800 transition active:scale-95 shadow-md"
          >
            Encender Todo el Verde
          </button>
        </div>
      </main>
    </div>
  );
};
