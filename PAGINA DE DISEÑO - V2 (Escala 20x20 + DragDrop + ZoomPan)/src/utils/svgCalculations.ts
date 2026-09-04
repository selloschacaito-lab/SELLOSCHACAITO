/**
 * Utilidades matemáticas y generador de rutas SVG para elementos de sellos
 */

// Convierte coordenadas polares (grados respecto a 12:00) a cartesianas (X, Y)
export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  // 0° = 12:00 (arriba), 90° = 3:00 (derecha), 180° = 6:00 (abajo), 270° = 9:00 (izquierda)
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Genera la trayectoria del arco SVG para texto circular con orientación perfecta (Arriba o Abajo)
export function describeTextArc(
  cx: number,
  cy: number,
  radius: number,
  centerAngle: number,  // Ángulo central del texto (0° = Arriba, 180° = Abajo)
  sweepAngle: number,   // Amplitud del arco (ej. 160°)
  isBottom: boolean     // true para arco inferior (invierte el sentido para que las letras no queden al revés)
): string {
  if (!isBottom) {
    // Arco Superior: De izquierda a derecha en sentido horario por la parte superior
    const startAngle = centerAngle - sweepAngle / 2;
    const endAngle = centerAngle + sweepAngle / 2;
    const pStart = polarToCartesian(cx, cy, radius, startAngle);
    const pEnd = polarToCartesian(cx, cy, radius, endAngle);
    const largeArc = sweepAngle > 180 ? 1 : 0;
    return `M ${pStart.x} ${pStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${pEnd.x} ${pEnd.y}`;
  } else {
    // Arco Inferior: De izquierda a derecha en sentido antihorario por la parte inferior
    const startAngle = centerAngle + sweepAngle / 2;
    const endAngle = centerAngle - sweepAngle / 2;
    const pStart = polarToCartesian(cx, cy, radius, startAngle);
    const pEnd = polarToCartesian(cx, cy, radius, endAngle);
    const largeArc = sweepAngle > 180 ? 1 : 0;
    return `M ${pStart.x} ${pStart.y} A ${radius} ${radius} 0 ${largeArc} 0 ${pEnd.x} ${pEnd.y}`;
  }
}

// Genera un borde con ondas o festones (Scalloped edge)
export function generateScallopedCircle(
  cx: number,
  cy: number,
  r: number,
  count = 36,
  depth = 6
): string {
  let path = '';
  const step = (Math.PI * 2) / count;

  for (let i = 0; i <= count; i++) {
    const angle = i * step;
    const nextAngle = (i + 1) * step;
    const midAngle = angle + step / 2;

    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);

    const xc = cx + (r + depth) * Math.cos(midAngle);
    const yc = cy + (r + depth) * Math.sin(midAngle);

    const x2 = cx + r * Math.cos(nextAngle);
    const y2 = cy + r * Math.sin(nextAngle);

    if (i === 0) {
      path += `M ${x1} ${y1} `;
    }
    path += `Q ${xc} ${yc} ${x2} ${y2} `;
  }

  return path;
}

// Lista de fuentes populares de Google Fonts adecuadas para sellos
export const STAMP_FONTS = [
  { name: 'Montserrat (Moderno)', family: 'Montserrat', category: 'sans-serif' },
  { name: 'Cinzel (Elegante/Notarial)', family: 'Cinzel', category: 'serif' },
  { name: 'Playfair Display (Clásico)', family: 'Playfair Display', category: 'serif' },
  { name: 'Inter (Limpio/Oficial)', family: 'Inter', category: 'sans-serif' },
  { name: 'Oswald (Condensado/Industria)', family: 'Oswald', category: 'sans-serif' },
  { name: 'Roboto (Estándar)', family: 'Roboto', category: 'sans-serif' },
  { name: 'Courier Prime (Máquina de escribir)', family: 'Courier Prime', category: 'monospace' },
  { name: 'Arial (Universal)', family: 'Arial', category: 'sans-serif' },
  { name: 'Times New Roman (Formal)', family: 'Times New Roman', category: 'serif' },
];

// Colores clásicos de tinta de sellos
export const STAMP_COLORS = [
  { name: 'Azul Sello Clásico', value: '#1e3a8a' },
  { name: 'Azul Real Intenso', value: '#1d4ed8' },
  { name: 'Rojo Lacrado / Urgente', value: '#b91c1c' },
  { name: 'Rojo Carmesí', value: '#dc2626' },
  { name: 'Negro Tinta', value: '#0f172a' },
  { name: 'Verde Oficial', value: '#15803d' },
  { name: 'Púrpura / Violeta Notarial', value: '#6b21a8' },
  { name: 'Marrón Sepia Vintage', value: '#78350f' },
];
