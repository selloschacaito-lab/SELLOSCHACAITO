import { jsPDF } from 'jspdf';
import type {
  StampProject,
  FrameLayer,
  CircularTextLayer,
  CenterTextLayer,
  IconLayer,
} from '../types/stamp';
import { generateScallopedCircle, describeTextArc } from './svgCalculations';
import { cleanAndColorizeSvg } from './stampIcons';

// Factor de conversión exacto: 1 pt = 25.4 / 72 mm = 0.352778 mm
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
 * - Unidades coherentes en milímetros reales (mm)
 * - Trazados curvos en <defs> y <textPath> compatibles con Illustrator Type on Path
 * - Colores y grosores exactos sin distorsiones
 */
export function buildIllustratorCompatibleSvg(project: StampProject): string {
  const widthMm = project.widthMm || project.sizeMm || 40;
  const heightMm = project.heightMm || project.sizeMm || 40;
  const halfW = widthMm / 2;
  const halfH = heightMm / 2;
  const color = project.color || '#1e3a8a';

  let defsSvg = '';
  let elementsSvg = '';

  for (const layer of project.layers) {
    if (!layer.visible) continue;

    switch (layer.type) {
      case 'frame': {
        const f = layer as FrameLayer;
        const strokeWidthMm = (f.strokeWidth || 1.5) * PT_TO_MM;
        const strokeDasharray =
          f.style === 'dashed' ? '2.5, 1.5' : f.style === 'dotted' ? '0.8, 1.2' : '';
        const dashAttr = strokeDasharray ? ` stroke-dasharray="${strokeDasharray}"` : '';
        const isFrameCircle = f.shape ? f.shape === 'circle' : project.shape === 'circle';

        if (isFrameCircle) {
          const r = (f.radius / 100) * halfW;

          if (f.style === 'scalloped') {
            const scallopedD = generateScallopedCircle(0, 0, r, f.scallopCount || 36, 1.2);
            elementsSvg += `  <!-- Borde Ondulado -->\n`;
            elementsSvg += `  <path d="${scallopedD}" fill="none" stroke="${color}" stroke-width="${strokeWidthMm.toFixed(3)}" />\n`;
          } else if (f.style === 'double') {
            const gapMm = (f.doubleGap || 3) * PT_TO_MM;
            elementsSvg += `  <!-- Borde Doble -->\n`;
            elementsSvg += `  <circle cx="0" cy="0" r="${r.toFixed(3)}" fill="none" stroke="${color}" stroke-width="${strokeWidthMm.toFixed(3)}" />\n`;
            elementsSvg += `  <circle cx="0" cy="0" r="${Math.max(1, r - gapMm - strokeWidthMm).toFixed(3)}" fill="none" stroke="${color}" stroke-width="${(strokeWidthMm * 0.75).toFixed(3)}" />\n`;
          } else {
            elementsSvg += `  <!-- Borde Circular: ${f.name} -->\n`;
            elementsSvg += `  <circle cx="0" cy="0" r="${r.toFixed(3)}" fill="none" stroke="${color}" stroke-width="${strokeWidthMm.toFixed(3)}"${dashAttr} />\n`;
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
            elementsSvg += `  <!-- Marco Rectangular Doble -->\n`;
            elementsSvg += `  <rect x="${(-frameW / 2).toFixed(3)}" y="${(-frameH / 2).toFixed(3)}" width="${frameW.toFixed(3)}" height="${frameH.toFixed(3)}" rx="${rx.toFixed(3)}" fill="none" stroke="${color}" stroke-width="${strokeWidthMm.toFixed(3)}" />\n`;
            elementsSvg += `  <rect x="${(-frameW / 2 + gapMm + strokeWidthMm / 2).toFixed(3)}" y="${(-frameH / 2 + gapMm + strokeWidthMm / 2).toFixed(3)}" width="${Math.max(2, frameW - (gapMm + strokeWidthMm / 2) * 2).toFixed(3)}" height="${Math.max(2, frameH - (gapMm + strokeWidthMm / 2) * 2).toFixed(3)}" rx="${Math.max(0, rx - 0.5).toFixed(3)}" fill="none" stroke="${color}" stroke-width="${(strokeWidthMm * 0.75).toFixed(3)}" />\n`;
          } else {
            elementsSvg += `  <!-- Marco Rectangular: ${f.name} -->\n`;
            elementsSvg += `  <rect x="${(-frameW / 2).toFixed(3)}" y="${(-frameH / 2).toFixed(3)}" width="${frameW.toFixed(3)}" height="${frameH.toFixed(3)}" rx="${rx.toFixed(3)}" fill="none" stroke="${color}" stroke-width="${strokeWidthMm.toFixed(3)}"${dashAttr} />\n`;
          }
        }
        break;
      }

      case 'circular-text': {
        const ct = layer as CircularTextLayer;
        const r = (ct.radius / 100) * halfW;
        const isBottom = ct.isReversed ?? (ct.position === 'bottom');
        const fontSizeMm = (ct.fontSize || 12) * PT_TO_MM;
        const letterSpacingMm = (ct.letterSpacing || 0) * PT_TO_MM;
        const fontStyle = ct.isItalic ? 'font-style="italic" ' : '';
        const fontWeight = ct.isBold ? 'font-weight="bold" ' : '';
        const letterSpacingAttr = letterSpacingMm !== 0 ? `letter-spacing="${letterSpacingMm.toFixed(3)}" ` : '';
        const textDecoAttr = ct.textDecoration && ct.textDecoration !== 'none' ? `text-decoration="${ct.textDecoration}" ` : '';

        let displayText = ct.text || '';
        if (ct.textTransform === 'uppercase') displayText = displayText.toUpperCase();
        if (ct.textTransform === 'lowercase') displayText = displayText.toLowerCase();

        // Compensación de línea base para Adobe Illustrator:
        const compensatedRadius = !isBottom
          ? Math.max(1, r - fontSizeMm * 0.35)
          : r + fontSizeMm * 0.35;

        const pathData = describeTextArc(0, 0, compensatedRadius, ct.startAngle, ct.sweepAngle, isBottom);

        defsSvg += `    <path id="path-${ct.id}" d="${pathData}" fill="none" />\n`;

        elementsSvg += `  <!-- Texto en Arco (Illustrator Type on Path): ${ct.name} -->\n`;
        elementsSvg += `  <text fill="${color}" font-family="${ct.fontFamily}, sans-serif" font-size="${fontSizeMm.toFixed(3)}" ${fontWeight}${fontStyle}${letterSpacingAttr}${textDecoAttr}alignment-baseline="central">\n`;
        elementsSvg += `    <textPath xlink:href="#path-${ct.id}" href="#path-${ct.id}" startOffset="50%" text-anchor="middle">${escapeXml(displayText)}</textPath>\n`;
        elementsSvg += `  </text>\n`;
        break;
      }

      case 'center-text': {
        const cnt = layer as CenterTextLayer;
        let lines = cnt.text.split('\n');
        if (cnt.textTransform === 'uppercase') lines = lines.map((l) => l.toUpperCase());
        if (cnt.textTransform === 'lowercase') lines = lines.map((l) => l.toLowerCase());

        const textAnchor =
          cnt.alignment === 'left' ? 'start' : cnt.alignment === 'right' ? 'end' : 'middle';
        const posX = ((cnt.offsetX || 0) / 100) * halfW;
        const posY = ((cnt.offsetY || 0) / 100) * halfH;
        const fontStyle = cnt.isItalic ? 'font-style="italic" ' : '';
        const fontWeight = cnt.isBold ? 'font-weight="bold" ' : '';
        const fontSizeMm = (cnt.fontSize || 12) * PT_TO_MM;
        const letterSpacingMm = (cnt.letterSpacing || 0) * PT_TO_MM;
        const letterSpacingAttr = letterSpacingMm !== 0 ? `letter-spacing="${letterSpacingMm.toFixed(3)}" ` : '';
        const textDecoAttr = cnt.textDecoration && cnt.textDecoration !== 'none' ? `text-decoration="${cnt.textDecoration}" ` : '';
        const scaleX = cnt.scaleX !== undefined ? cnt.scaleX : 1;
        const scaleY = cnt.scaleY !== undefined ? cnt.scaleY : 1;
        const rotation = cnt.rotation || 0;
        const baselineShiftMm = (cnt.baselineShift || 0) * PT_TO_MM;
        const lineSpacingMm = fontSizeMm * (cnt.lineHeight || 1.15);
        const startY = -((lines.length - 1) * lineSpacingMm) / 2 - baselineShiftMm;

        elementsSvg += `  <!-- Texto Central: ${cnt.name} -->\n`;
        elementsSvg += `  <g transform="translate(${posX.toFixed(3)}, ${posY.toFixed(3)}) rotate(${rotation}) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})">\n`;
        elementsSvg += `    <text x="0" y="${startY.toFixed(3)}" fill="${color}" text-anchor="${textAnchor}" font-family="${cnt.fontFamily}, sans-serif" font-size="${fontSizeMm.toFixed(3)}" ${fontWeight}${fontStyle}${letterSpacingAttr}${textDecoAttr}alignment-baseline="central">\n`;

        lines.forEach((line, idx) => {
          const dy = idx === 0 ? 0 : lineSpacingMm;
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

        if (ic.customSvgData) {
          const { innerHtml, viewBox } = cleanAndColorizeSvg(ic.customSvgData, color);
          elementsSvg += `  <!-- Icono Personalizado: ${ic.name} -->\n`;
          elementsSvg += `  <g transform="translate(${posX.toFixed(3)}, ${posY.toFixed(3)}) scale(${scale}) rotate(${ic.rotation})">\n`;
          elementsSvg += `    <svg x="-18" y="-18" width="36" height="36" viewBox="${viewBox}" overflow="visible">\n`;
          elementsSvg += `      ${innerHtml}\n`;
          elementsSvg += `    </svg>\n`;
          elementsSvg += `  </g>\n`;
        } else {
          const iconSvg = getIconSvgString(ic.iconKey, color);
          elementsSvg += `  <!-- Icono: ${ic.name} -->\n`;
          elementsSvg += `  <g transform="translate(${posX.toFixed(3)}, ${posY.toFixed(3)}) scale(${scale}) rotate(${ic.rotation})" fill="${color}">\n`;
          elementsSvg += `    ${iconSvg}\n`;
          elementsSvg += `  </g>\n`;
        }
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
  <defs>
${defsSvg}  </defs>
  <g id="Stamp-Design" fill="${color}">
${elementsSvg}  </g>
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
      return `<g fill="none" stroke="${color}" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round">
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
      return `<path d="M0,-16 Q14,-14 14,0 Q14,14 0,18 Q-14,14 -14,0 Q-14,-14 0,-16 Z" fill="none" stroke="${color}" stroke-width="0.8" />`;
    case 'crown':
      return `<polygon points="-16,-6 -10,12 10,12 16,-6 8,0 0,-12 -8,0" fill="${color}" />`;
    case 'ribbon':
      return `<g fill="${color}">
        <circle cx="0" cy="-4" r="10" fill="none" stroke="${color}" stroke-width="0.8" />
        <polygon points="-5,6 -10,18 0,14 10,18 5,6" />
      </g>`;
    case 'check':
      return `<path d="M-12,0 L-4,8 L14,-10" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />`;
    case 'star':
    default:
      return `<polygon points="0,-18 5.5,-5.5 19,-5.5 8.5,3 12.5,16 0,8.5 -12.5,16 -8.5,3 -19,-5.5 -5.5,-5.5" fill="${color}" />`;
  }
}

// 1. Exportar como SVG Vectorial (100% Compatible con Illustrator / Corel / Láser)
export function exportToSvg(project: StampProject): void {
  const svgString = buildIllustratorCompatibleSvg(project);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const filename = `${sanitizeFilename(project.title || 'sello-vectorial')}.svg`;
  triggerDownload(blob, filename);
}

// 2. Exportar como PNG de Alta Resolución
export async function exportToPng(
  project: StampProject,
  options: { dpi?: number; transparent?: boolean } = {}
): Promise<void> {
  const dpi = options.dpi || 300;
  const transparent = options.transparent !== undefined ? options.transparent : true;
  const widthMm = project.widthMm || project.sizeMm || 40;
  const heightMm = project.heightMm || project.sizeMm || 40;

  const mmToInches = 1 / 25.4;
  const pixelWidth = Math.round(widthMm * mmToInches * dpi);
  const pixelHeight = Math.round(heightMm * mmToInches * dpi);

  const svgString = buildIllustratorCompatibleSvg(project);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto 2D de canvas'));
        return;
      }

      if (!transparent) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pixelWidth, pixelHeight);
      }

      ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
      URL.revokeObjectURL(svgUrl);

      canvas.toBlob((blob) => {
        if (blob) {
          const filename = `${sanitizeFilename(project.title || 'sello')}-${dpi}dpi.png`;
          triggerDownload(blob, filename);
          resolve();
        } else {
          reject(new Error('Error al generar blob PNG'));
        }
      }, 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(svgUrl);
      reject(err);
    };

    img.src = svgUrl;
  });
}

// 3. Exportar como PDF a Escala 1:1
export async function exportToPdf(project: StampProject): Promise<void> {
  const widthMm = project.widthMm || project.sizeMm || 40;
  const heightMm = project.heightMm || project.sizeMm || 40;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const svgString = buildIllustratorCompatibleSvg(project);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 4;
      canvas.width = (widthMm / 25.4) * 300 * scale;
      canvas.height = (heightMm / 25.4) * 300 * scale;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No se pudo crear canvas para PDF'));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);

      const pngDataUrl = canvas.toDataURL('image/png');
      const pageW = 210;
      const pageH = 297;
      const posX = (pageW - widthMm) / 2;
      const posY = (pageH - heightMm) / 2;

      pdf.addImage(pngDataUrl, 'PNG', posX, posY, widthMm, heightMm);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.rect(posX, posY, widthMm, heightMm);

      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Sello: ${project.title} | Medida Real 1:1: ${widthMm}x${heightMm} mm | Fecha: ${new Date().toLocaleDateString()}`,
        pageW / 2,
        posY + heightMm + 6,
        { align: 'center' }
      );

      const filename = `${sanitizeFilename(project.title || 'sello-escala-real')}.pdf`;
      pdf.save(filename);
      resolve();
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(svgUrl);
      reject(err);
    };

    img.src = svgUrl;
  });
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
