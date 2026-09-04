import React from 'react';

interface GlassPillProps {
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  activeIcon?: React.ReactNode;
  isActive: boolean;
  onToggle: () => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
}

export const GlassPill: React.FC<GlassPillProps> = ({
  label,
  subLabel,
  icon,
  activeIcon,
  isActive,
  onToggle,
  orientation = 'horizontal',
  size = 'md',
}) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <button
      onClick={onToggle}
      className={`
        group relative flex items-center justify-between transition-all duration-300 ease-out select-none
        rounded-full cursor-pointer overflow-hidden
        ${isHorizontal ? 'flex-row' : 'flex-col justify-between'}
        ${
          size === 'sm'
            ? isHorizontal ? 'px-4 py-2 gap-3 min-w-[140px]' : 'py-4 px-2.5 gap-3 min-h-[140px]'
            : size === 'lg'
            ? isHorizontal ? 'px-6 py-3.5 gap-5 min-w-[220px]' : 'py-6 px-4 gap-5 min-h-[220px]'
            : isHorizontal ? 'px-5 py-3 gap-4 min-w-[180px]' : 'py-5 px-3 gap-4 min-h-[180px]'
        }
        ${
          isActive
            ? 'bg-emerald-100/[0.18] border-white/60 shadow-[0_12px_28px_rgba(0,0,0,0.15),0_0_24px_rgba(167,243,208,0.5),inset_0_1.5px_2px_rgba(255,255,255,0.9),inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_0_20px_rgba(167,243,208,0.35)]'
            : 'bg-white/[0.12] hover:bg-white/[0.18] border-white/40 shadow-[0_10px_25px_rgba(0,0,0,0.12),inset_0_1.5px_2px_rgba(255,255,255,0.75),inset_0_-1.5px_3px_rgba(0,0,0,0.15),inset_0_0_10px_rgba(255,255,255,0.05)]'
        }
        backdrop-blur-[24px] backdrop-saturate-[180%] border active:scale-[0.97]
      `}
      style={{
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      }}
    >
      {/* Specular curved reflection overlay (Luz ambiental superior) */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 via-white/5 to-transparent pointer-events-none rounded-t-full" />

      {/* Internal Sliding / Indicator Jewel */}
      <div
        className={`
          flex items-center justify-center rounded-full transition-all duration-300 shadow-sm
          ${size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'}
          ${
            isActive
              ? 'bg-gradient-to-br from-emerald-300 to-emerald-500 text-neutral-900 shadow-[0_4px_12px_rgba(167,243,208,0.5),inset_0_1px_1px_rgba(255,255,255,0.8)] scale-105'
              : 'bg-neutral-900/40 text-neutral-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_2px_5px_rgba(0,0,0,0.15)] group-hover:bg-neutral-900/50 group-hover:text-neutral-900'
          }
        `}
      >
        {isActive ? activeIcon || icon : icon}
      </div>

      {/* Content Label */}
      <div className={`flex flex-col ${isHorizontal ? 'text-left' : 'text-center items-center'}`}>
        <span
          className={`font-semibold tracking-tight transition-colors duration-200 ${
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
          } ${isActive ? 'text-neutral-900' : 'text-neutral-800 group-hover:text-neutral-900'}`}
        >
          {label}
        </span>
        {subLabel && (
          <span
            className={`text-[10px] font-medium transition-colors ${
              isActive ? 'text-emerald-700' : 'text-neutral-500'
            }`}
          >
            {subLabel}
          </span>
        )}
      </div>

      {/* Status LED Dot (Pastel Green Glow) */}
      <div className="flex items-center justify-center">
        <div
          className={`rounded-full transition-all duration-300 ${
            size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
          } ${
            isActive
              ? 'bg-emerald-400 shadow-[0_0_10px_#34d399,0_0_4px_#a7f3d0] scale-110'
              : 'bg-neutral-400/40'
          }`}
        />
      </div>
    </button>
  );
};
