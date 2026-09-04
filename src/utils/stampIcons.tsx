import React from 'react';

export interface IconCategory {
  id: string;
  name: string;
  folderPath: string;
  icon: string;
}

export interface StampIconItem {
  id: string;
  categoryId: string;
  label: string;
  svgContent: string; // Inner SVG elements or path string
  isCustom?: boolean;
}

export const ICON_CATEGORIES: IconCategory[] = [
  { id: 'all', name: 'Todos los Iconos', folderPath: 'public/iconos/', icon: '✨' },
  { id: 'legal_abogados', name: 'Legal & Abogados', folderPath: 'public/iconos/legal_abogados/', icon: '⚖️' },
  { id: 'medicina_salud', name: 'Medicina & Salud', folderPath: 'public/iconos/medicina_salud/', icon: '🩺' },
  { id: 'escudos_emblemas', name: 'Escudos & Emblemas', folderPath: 'public/iconos/escudos_emblemas/', icon: '🛡️' },
  { id: 'estrellas_orlas', name: 'Estrellas & Orlas', folderPath: 'public/iconos/estrellas_orlas/', icon: '⭐' },
  { id: 'comercio_empresas', name: 'Comercio & Empresas', folderPath: 'public/iconos/comercio_empresas/', icon: '🏢' },
  { id: 'mis_iconos', name: 'Mis Iconos Subidos', folderPath: 'public/iconos/mis_iconos/', icon: '📁' },
];

export const BUILTIN_ICONS: StampIconItem[] = [
  // Legal
  {
    id: 'law',
    categoryId: 'legal_abogados',
    label: 'Balanza de la Justicia',
    svgContent: `<g fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="0" y1="-18" x2="0" y2="18" />
      <line x1="-18" y1="-12" x2="18" y2="-12" />
      <path d="M-22,-4 L-14,-4 L-18,6 Z" fill="currentColor" />
      <path d="M14,-4 L22,-4 L18,6 Z" fill="currentColor" />
      <line x1="-18" y1="-12" x2="-18" y2="-4" />
      <line x1="18" y1="-12" x2="18" y2="-4" />
      <path d="M-10,18 L10,18" stroke-width="3" />
    </g>`,
  },
  {
    id: 'mallet',
    categoryId: 'legal_abogados',
    label: 'Mazo de Juez',
    svgContent: `<g fill="currentColor">
      <rect x="-14" y="-12" width="28" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2.5" />
      <rect x="-3" y="-2" width="6" height="20" rx="1.5" />
      <rect x="-16" y="16" width="32" height="4" rx="2" />
    </g>`,
  },
  // Medicina
  {
    id: 'medical',
    categoryId: 'medicina_salud',
    label: 'Cruz Médica',
    svgContent: `<path d="M-5,-16 L5,-16 L5,-5 L16,-5 L16,5 L5,5 L5,16 L-5,16 L-5,5 L-16,5 L-16,-5 L-5,-5 Z" fill="currentColor" />`,
  },
  {
    id: 'caduceus',
    categoryId: 'medicina_salud',
    label: 'Vara de Esculapio',
    svgContent: `<g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="0" y1="-18" x2="0" y2="18" stroke-width="3" />
      <circle cx="0" cy="-18" r="2.5" fill="currentColor" />
      <path d="M-8,-10 Q0,-4 8,2 Q0,8 -8,14 Q0,16 6,12" />
    </g>`,
  },
  // Escudos
  {
    id: 'shield',
    categoryId: 'escudos_emblemas',
    label: 'Escudo Heráldico',
    svgContent: `<path d="M0,-16 Q14,-14 14,0 Q14,14 0,18 Q-14,14 -14,0 Q-14,-14 0,-16 Z" fill="none" stroke="currentColor" stroke-width="2.5" />`,
  },
  {
    id: 'shield_check',
    categoryId: 'escudos_emblemas',
    label: 'Escudo Verificado',
    svgContent: `<g fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M0,-16 Q14,-14 14,0 Q14,14 0,18 Q-14,14 -14,0 Q-14,-14 0,-16 Z" />
      <path d="M-5,0 L-1,4 L7,-4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
    </g>`,
  },
  // Estrellas
  {
    id: 'star',
    categoryId: 'estrellas_orlas',
    label: 'Estrella Clásica',
    svgContent: `<polygon points="0,-18 5.5,-5.5 19,-5.5 8.5,3 12.5,16 0,8.5 -12.5,16 -8.5,3 -19,-5.5 -5.5,-5.5" fill="currentColor" />`,
  },
  {
    id: 'star_circle',
    categoryId: 'estrellas_orlas',
    label: 'Estrella en Círculo',
    svgContent: `<g fill="currentColor">
      <circle cx="0" cy="0" r="18" fill="none" stroke="currentColor" stroke-width="2.5" />
      <polygon points="0,-12 3.5,-3.5 12,-3.5 5.5,2 8,11 0,5.5 -8,11 -5.5,2 -12,-3.5 -3.5,-3.5" />
    </g>`,
  },
  {
    id: 'crown',
    categoryId: 'escudos_emblemas',
    label: 'Corona Real',
    svgContent: `<polygon points="-16,-6 -10,12 10,12 16,-6 8,0 0,-12 -8,0" fill="currentColor" />`,
  },
  {
    id: 'ribbon',
    categoryId: 'comercio_empresas',
    label: 'Cinta de Certificación',
    svgContent: `<g fill="currentColor">
      <circle cx="0" cy="-4" r="10" fill="none" stroke="currentColor" stroke-width="2.5" />
      <polygon points="-5,6 -10,18 0,14 10,18 5,6" />
    </g>`,
  },
  {
    id: 'check',
    categoryId: 'comercio_empresas',
    label: 'Aprobado / Visto Bueno',
    svgContent: `<path d="M-12,0 L-4,8 L14,-10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />`,
  },
];

// Compatibilidad con código previo
export const STAMP_ICONS: Record<string, { label: string; render: (color: string) => React.ReactNode }> = {
  star: {
    label: 'Estrella Clásica',
    render: (color) => (
      <polygon
        points="0,-18 5.5,-5.5 19,-5.5 8.5,3 12.5,16 0,8.5 -12.5,16 -8.5,3 -19,-5.5 -5.5,-5.5"
        fill={color}
      />
    ),
  },
  law: {
    label: 'Balanza Legal',
    render: (color) => (
      <g fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="0" y1="-18" x2="0" y2="18" />
        <line x1="-18" y1="-12" x2="18" y2="-12" />
        <path d="M-22,-4 L-14,-4 L-18,6 Z" fill={color} />
        <path d="M14,-4 L22,-4 L18,6 Z" fill={color} />
        <line x1="-18" y1="-12" x2="-18" y2="-4" />
        <line x1="18" y1="-12" x2="18" y2="-4" />
        <path d="M-10,18 L10,18" strokeWidth="3" />
      </g>
    ),
  },
  scale: {
    label: 'Balanza Legal',
    render: (color) => (
      <g fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="0" y1="-18" x2="0" y2="18" />
        <line x1="-18" y1="-12" x2="18" y2="-12" />
        <path d="M-22,-4 L-14,-4 L-18,6 Z" fill={color} />
        <path d="M14,-4 L22,-4 L18,6 Z" fill={color} />
        <line x1="-18" y1="-12" x2="-18" y2="-4" />
        <line x1="18" y1="-12" x2="18" y2="-4" />
        <path d="M-10,18 L10,18" strokeWidth="3" />
      </g>
    ),
  },
  medical: {
    label: 'Cruz Médica',
    render: (color) => (
      <path
        d="M-5,-16 L5,-16 L5,-5 L16,-5 L16,5 L5,5 L5,16 L-5,16 L-5,5 L-16,5 L-16,-5 L-5,-5 Z"
        fill={color}
      />
    ),
  },
  cross: {
    label: 'Cruz Médica',
    render: (color) => (
      <path
        d="M-5,-16 L5,-16 L5,-5 L16,-5 L16,5 L5,5 L5,16 L-5,16 L-5,5 L-16,5 L-16,-5 L-5,-5 Z"
        fill={color}
      />
    ),
  },
  shield: {
    label: 'Escudo',
    render: (color) => (
      <path
        d="M0,-16 Q14,-14 14,0 Q14,14 0,18 Q-14,14 -14,0 Q-14,-14 0,-16 Z"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      />
    ),
  },
  crown: {
    label: 'Corona',
    render: (color) => (
      <polygon
        points="-16,-6 -10,12 10,12 16,-6 8,0 0,-12 -8,0"
        fill={color}
      />
    ),
  },
  ribbon: {
    label: 'Cinta',
    render: (color) => (
      <g fill={color}>
        <circle cx="0" cy="-4" r="10" fill="none" stroke={color} strokeWidth="2.5" />
        <polygon points="-5,6 -10,18 0,14 10,18 5,6" />
      </g>
    ),
  },
  check: {
    label: 'Aprobado',
    render: (color) => (
      <path
        d="M-12,0 L-4,8 L14,-10"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
};

/**
 * Limpia y colorea un SVG arbitrario para que herede perfectamente el color de tinta
 */
export function cleanAndColorizeSvg(rawSvg: string, color: string): { innerHtml: string; viewBox: string } {
  if (!rawSvg) return { innerHtml: '', viewBox: '0 0 48 48' };

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    let viewBox = '0 0 48 48';
    if (svgEl) {
      viewBox = svgEl.getAttribute('viewBox') || '0 0 48 48';
      // Remover style tags para evitar clases .cls-1 que sobreescriban
      svgEl.querySelectorAll('style').forEach((s) => s.remove());

      // Aplicar color directamente a todos los elementos gráficos
      svgEl.querySelectorAll('path, polygon, rect, circle, ellipse, line, polyline').forEach((el) => {
        el.removeAttribute('class');
        const fill = el.getAttribute('fill');
        if (!fill || (fill.toLowerCase() !== 'none' && fill.toLowerCase() !== 'white' && fill.toLowerCase() !== '#ffffff' && fill.toLowerCase() !== '#fff')) {
          el.setAttribute('fill', color);
        }
        const stroke = el.getAttribute('stroke');
        if (stroke && stroke.toLowerCase() !== 'none' && stroke.toLowerCase() !== 'white' && stroke.toLowerCase() !== '#ffffff' && stroke.toLowerCase() !== '#fff') {
          el.setAttribute('stroke', color);
        }
      });

      return {
        innerHtml: svgEl.innerHTML,
        viewBox,
      };
    }
  } catch {}

  // Fallback regex
  let clean = rawSvg.replace(/<style[\s\S]*?<\/style>/gi, '');
  clean = clean.replace(/class="[^"]*"/gi, '');
  const viewBoxMatch = rawSvg.match(/viewBox="([^"]*)"/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 48 48';
  clean = clean.replace(/<svg[^>]*>/i, '').replace(/<\/svg>/i, '');

  return {
    innerHtml: clean,
    viewBox,
  };
}
