import { jsPDF } from 'jspdf';
import type {
  StampProject,
  FrameLayer,
  CircularTextLayer,
  CenterTextLayer,
  IconLayer,
} from '../types/stamp';
import { generateScallopedCircle, polarToCartesian } from './svgCalculations';

const PT_TO_MM = 25.4 / 72.0;

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Genera un SVG 100% compatible con Adobe Illustrator, CorelDraw y Máquinas de Grabado Láser
 * - Usa grosores de trazo en puntos (pt) y tamaños de fuente en puntos (pt) idénticos a Illustrator
 * - Convierte texto en arco a caracteres transformados individualmente (evita el fallo de <textPath> en Illustrator)
 * - Elimina cualquier elemento de interfaz, filtros no compatibles o colores rgba()
 * - Aplica medidas físicas exactas en milímetros y viewBox limpio
 */
export function buildIllustratorCompatibleSvg(project: StampProject): string {
  const widthMm = project.widthMm || project.sizeMm || 40;
  const heightMm = project.heightMm || project.sizeMm || 40;
  const halfW = widthMm / 2;
  const halfH = heightMm / 2;
  const color = project.color || '#1e3a8a';

  let elementsSvg = '';

  for (const layer of project.layers) {
    if (!layer.visible) continue;

    switch (layer.type) {
      case 'frame': {
        const f = layer as FrameLayer;
        const strokeDasharray =
          f.style === 'dashed' ? '2.5, 1.5' : f.style === 'dotted' ? '0.8, 1.2' : '';
        const dashAttr = strokeDasharray ? ` stroke-dasharray="${strokeDasharray}"` : '';

        if (project.shape === 'circle') {
          const r = (f.radius / 100) * halfW;

          if (f.style === 'scalloped') {
            const scallopedD = generateScallopedCircle(0, 0, r, f.scallopCount || 36, 1.2);
            elementsSvg += `  <path d="${scallopedD}" fill="none" stroke="${color}" stroke-width="${f.strokeWidth}pt" />\n`;
          } else if (f.style === 'double') {
            const gapMm = (f.doubleGap || 3) * PT_TO_MM;
            const strokeWidthMm = (f.strokeWidth || 1.5) * PT_TO_MM;
            elementsSvg += `  <circle cx="0" cy="0" r="${r.toFixed(3)}" fill="none" stroke="${color}" stroke-width="${f.strokeWidth}pt" />\n`;
            elementsSvg += `  <circle cx="0" cy="0" r="${Math.max(1, r - gapMm - strokeWidthMm).toFixed(3)}" fill="none" stroke="${color}" stroke-width="${(f.strokeWidth * 0.75).toFixed(2)}pt" />\n`;
          } else {
            elementsSvg += `  <circle cx="0" cy="0" r="${r.toFixed(3)}" fill="none" stroke="${color}" stroke-width="${f.strokeWidth}pt"${dashAttr} />\n`;
          }
        } else {
          // Rectangular / Cuadrado
          const wPct = f.widthPercent || f.radius || 92;
          const hPct = f.heightPercent || f.radius || 90;
          const frameW = (wPct / 100) * widthMm;
          const frameH = (hPct / 100) * heightMm;
          const rx = (f.cornerRadius !== undefined ? f.cornerRadius : 2) * PT_TO_MM;

          if (f.style === 'double') {
            const gapMm = (f.doubleGap || 3) * PT_TO_MM;
            const strokeWidthMm = (f.strokeWidth || 1.5) * PT_TO_MM;
            elementsSvg += `  <rect x="${(-frameW / 2).toFixed(3)}" y="${(-frameH / 2).toFixed(3)}" width="${frameW.toFixed(3)}" height="${frameH.toFixed(3)}" rx="${rx.toFixed(3)}" fill="none" stroke="${color}" stroke-width="${f.strokeWidth}pt" />\n`;
            elementsSvg += `  <rect x="${(-frameW / 2 + gapMm + strokeWidthMm / 2).toFixed(3)}" y="${(-frameH / 2 + gapMm + strokeWidthMm / 2).toFixed(3)}" width="${Math.max(2, frameW - (gapMm + strokeWidthMm / 2) * 2).toFixed(3)}" height="${Math.max(2, frameH - (gapMm + strokeWidthMm / 2) * 2).toFixed(3)}" rx="${Math.max(0, rx - 0.5).toFixed(3)}" fill="none" stroke="${color}" stroke-width="${(f.strokeWidth * 0.75).toFixed(2)}pt" />\n`;
          } else {
            elementsSvg += `  <rect x="${(-frameW / 2).toFixed(3)}" y="${(-frameH / 2).toFixed(3)}" width="${frameW.toFixed(3)}" height="${frameH.toFixed(3)}" rx="${rx.toFixed(3)}" fill="none" stroke="${color}" stroke-width="${f.strokeWidth}pt"${dashAttr} />\n`;
          }
        }
        break;
      }

      case 'circular-text': {
        const ct = layer as CircularTextLayer;
        const r = (ct.radius / 100) * halfW;
        const text = ct.text || '';
        const isBottom = ct.isReversed ?? (ct.position === 'bottom');
        const fontStyle = ct.isItalic ? 'font-style="italic" ' : '';
        const fontWeight = ct.isBold ? 'font-weight="bold" ' : '';
        const chars = Array.from(text);
        const count = chars.length;

        if (count === 0) break;

        // Distribución angular precisa de caracteres
        const fontSizeMm = (ct.fontSize || 12) * PT_TO_MM;
        const letterSpacingFactor = (ct.letterSpacing || 0) * PT_TO_MM * 0.8;
        const charWidthEst = fontSizeMm * 0.55 + letterSpacingFactor;
        const perimeter = 2 * Math.PI * r;
        const totalTextLength = charWidthEst * count;
        const autoSweep = Math.min(ct.sweepAngle, (totalTextLength / perimeter) * 360);
        const step = count > 1 ? autoSweep / (count - 1) : 0;
        const startAng = ct.startAngle - autoSweep / 2;

        elementsSvg += `  <!-- Texto Circular: ${ct.name} -->\n`;
        elementsSvg += `  <g id="layer-${ct.id}" fill="${color}" font-family="${ct.fontFamily}, sans-serif" font-size="${ct.fontSize}pt" ${fontWeight}${fontStyle}text-anchor="middle">\n`;

        for (let i = 0; i < count; i++) {
          const char = chars[i];
          if (char === ' ') continue;

          if (!isBottom) {
            // Superior: Letras con base hacia el centro
            const charAngle = count === 1 ? ct.startAngle : startAng + i * step;
            const pos = polarToCartesian(0, 0, r, charAngle);
            const rot = charAngle;
            elementsSvg += `    <text transform="translate(${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}) rotate(${rot.toFixed(2)})" dominant-baseline="central">${escapeXml(char)}</text>\n`;
          } else {
            // Inferior: Letras invertidas 180° para que queden derechas y legibles de izquierda a derecha
            const bottomAngle = ct.startAngle + autoSweep / 2 - i * step;
            const pos = polarToCartesian(0, 0, r, bottomAngle);
            const rot = bottomAngle + 180;
            elementsSvg += `    <text transform="translate(${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}) rotate(${rot.toFixed(2)})" dominant-baseline="central">${escapeXml(char)}</text>\n`;
          }
        }
        elementsSvg += `  </g>\n`;
        break;
      }

      case 'center-text': {
        const cnt = layer as CenterTextLayer;
        const lines = cnt.text.split('\n');
        const textAnchor =
          cnt.alignment === 'left' ? 'start' : cnt.alignment === 'right' ? 'end' : 'middle';
        const posX = ((cnt.offsetX || 0) / 100) * halfW;
        const posY = ((cnt.offsetY || 0) / 100) * halfH;
        const fontStyle = cnt.isItalic ? 'font-style="italic" ' : '';
        const fontWeight = cnt.isBold ? 'font-weight="bold" ' : '';
        const letterSpacing = cnt.letterSpacing ? `letter-spacing="${cnt.letterSpacing}pt" ` : '';
        const fontSizeMm = (cnt.fontSize || 12) * PT_TO_MM;
        const scaleX = cnt.scaleX || 1;
        const scaleY = cnt.scaleY || 1;

        elementsSvg += `  <!-- Texto Central: ${cnt.name} -->\n`;
        elementsSvg += `  <g transform="translate(${posX.toFixed(3)}, ${posY.toFixed(3)}) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})">\n`;
        elementsSvg += `    <text x="0" y="0" fill="${color}" text-anchor="${textAnchor}" font-family="${cnt.fontFamily}, sans-serif" font-size="${cnt.fontSize}pt" ${fontWeight}${fontStyle}${letterSpacing}>\n`;

        lines.forEach((line, idx) => {
          const dy = idx === 0 ? 0 : fontSizeMm * (cnt.lineHeight || 1.2);
          elementsSvg += `      <tspan x="0" dy="${dy.toFixed(3)}">${escapeXml(line)}</tspan>\n`;
        });

        elementsSvg += `    </text>\n`;
        elementsSvg += `  </g>\n`;
        break;
      }

      case 'icon': {
        const ic = layer as IconLayer;
        const posX = ((ic.offsetX || 0) / 100) * halfW;
        const posY = ((ic.offsetY || 0) / 100) * halfH;
        const scale = (((ic.size || 36) / 36) * (widthMm / 40) * 0.28).toFixed(3);
        const iconSvg = getIconSvgString(ic.iconKey, color);

        elementsSvg += `  <!-- Icono: ${ic.name} -->\n`;
        elementsSvg += `  <g transform="translate(${posX.toFixed(3)}, ${posY.toFixed(3)}) scale(${scale}) rotate(${ic.rotation})">\n`;
        elementsSvg += `    ${iconSvg}\n`;
        elementsSvg += `  </g>\n`;
        break;
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     version="1.1"
     width="${widthMm}mm"
     height="${heightMm}mm"
     viewBox="${-halfW} ${-halfH} ${widthMm} ${heightMm}">
<g id="Stamp-Vector-Design">
${elementsSvg}
</g>
</svg>`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getIconSvgString(iconKey: string, color: string): string {
  switch (iconKey) {
    case 'scale':
      return `<g fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="0" y1="-18" x2="0" y2="18" />
        <line x1="-18" y1="-12" x2="18" y2="-12" />
        <path d="M-22,-4 L-14,-4 L-18,6 Z" fill="${color}" />
        <path d="M14,-4 L22,-4 L18,6 Z" fill="${color}" />
        <line x1="-18" y1="-12" x2="-18" y2="-4" />
        <line x1="18" y1="-12" x2="18" y2="-4" />
        <path d="M-10,18 L10,18" />
      </g>`;
    case 'cross':
      return `<path d="M-5,-16 L5,-16 L5,-5 L16,-5 L16,5 L5,5 L5,16 L-5,16 L-5,5 L-16,5 L-16,-5 L-5,-5 Z" fill="${color}" />`;
    case 'shield':
      return `<path d="M0,-16 Q14,-14 14,0 Q14,14 0,18 Q-14,14 -14,0 Q-14,-14 0,-16 Z" fill="none" stroke="${color}" stroke-width="2.5" />`;
    case 'crown':
      return `<polygon points="-16,-6 -10,12 10,12 16,-6 8,0 0,-12 -8,0" fill="${color}" />`;
    case 'ribbon':
      return `<g fill="${color}">
        <circle cx="0" cy="-4" r="10" fill="none" stroke="${color}" stroke-width="2.5" />
        <polygon points="-5,6 -10,18 0,14 10,18 5,6" />
      </g>`;
    case 'check':
      return `<path d="M-12,0 L-4,8 L14,-10" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />`;
    case 'star':
    default:
      return `<polygon points="0,-18 5.5,-5.5 19,-5.5 8.5,3 12.5,16 0,8.5 -12.5,16 -8.5,3 -19,-5.5 -5.5,-5.5" fill="${color}" />`;
  }
}

// 1. Exportar como SVG Vectorial (100% Compatible con Illustrator / Corel / Láser)
export function exportToSvg(project: StampProject) {
  const width = project.widthMm || project.sizeMm || 40;
  const height = project.heightMm || project.sizeMm || 40;
  const svgString = buildIllustratorCompatibleSvg(project);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const filename = `${project.title.toLowerCase().replace(/\s+/g, '-')}-${width}x${height}mm.svg`;
  triggerDownload(blob, filename);
}

// 2. Exportar como PNG de Alta Resolución (300 / 600 DPI)
export async function exportToPng(
  project: StampProject,
  options: { dpi?: number; transparent?: boolean } = {}
): Promise<void> {
  const { dpi = 300, transparent = true } = options;
  const widthMm = project.widthMm || project.sizeMm || 40;
  const heightMm = project.heightMm || project.sizeMm || 40;

  const svgString = buildIllustratorCompatibleSvg(project);
  const pixelWidth = Math.round((widthMm / 25.4) * dpi);
  const pixelHeight = Math.round((heightMm / 25.4) * dpi);

  const canvas = document.createElement('canvas');
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  if (!transparent) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pixelWidth, pixelHeight);
  }

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.crossOrigin = 'anonymous';

  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          const filename = `${project.title.toLowerCase().replace(/\s+/g, '-')}-${widthMm}x${heightMm}mm-${dpi}dpi.png`;
          triggerDownload(blob, filename);
        }
        resolve();
      }, 'image/png');
    };
    img.src = url;
  });
}

// 3. Exportar como PDF a escala real 1:1 para impresión (Hoja Carta / Letter)
export async function exportToPdf(project: StampProject): Promise<void> {
  const widthMm = project.widthMm || project.sizeMm || 40;
  const heightMm = project.heightMm || project.sizeMm || 40;

  const svgString = buildIllustratorCompatibleSvg(project);
  const pixelWidth = Math.round((widthMm / 25.4) * 300);
  const pixelHeight = Math.round((heightMm / 25.4) * 300);

  const canvas = document.createElement('canvas');
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.crossOrigin = 'anonymous';

  return new Promise((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
      URL.revokeObjectURL(url);

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter', // Formato Carta (215.9 x 279.4 mm)
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('HOJA DE PRUEBA Y REVISIÓN DE SELLO (TAMAÑO CARTA)', 20, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Proyecto: ${project.title}`, 20, 32);
      doc.text(`Medida Real de Fabricación: ${widthMm} x ${heightMm} mm (${project.shape})`, 20, 38);
      doc.text(`Fecha de creación: ${new Date().toLocaleDateString()}`, 20, 44);

      // Centrado exacto en hoja carta (ancho 215.9 mm)
      const stampX = (215.9 - widthMm) / 2;
      const stampY = 85;

      doc.setDrawColor(200, 200, 200);
      doc.setLineDashPattern([2, 2], 0);
      doc.rect(stampX - 4, stampY - 4, widthMm + 8, heightMm + 8);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Área de impresión ${widthMm}x${heightMm}mm`, stampX, stampY - 6);

      doc.addImage(imgData, 'PNG', stampX, stampY, widthMm, heightMm);

      doc.setTextColor(100, 100, 100);
      doc.text(
        'Nota: Al imprimir este documento, asegúrese de seleccionar "Tamaño real" o "Escala 100%" en su impresora.',
        20,
        260
      );

      const filename = `${project.title.toLowerCase().replace(/\s+/g, '-')}-${widthMm}x${heightMm}mm-escala-real.pdf`;
      doc.save(filename);
      resolve();
    };
    img.src = url;
  });
}
