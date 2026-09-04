export type StampShape = 'circle' | 'rectangle' | 'square';

export type FrameStyle = 'solid' | 'double' | 'dashed' | 'dotted' | 'scalloped' | 'gear';

export interface BaseLayer {
  id: string;
  name: string;
  visible: boolean;
  locked?: boolean;
  groupId?: string;
}

export interface FrameLayer extends BaseLayer {
  type: 'frame';
  shape?: StampShape;        // 'circle' | 'rectangle' | 'square' (permite marcos de cualquier forma)
  radius: number;            // Para sellos circulares (% de tamaño)
  widthPercent?: number;     // Para sellos rectangulares / cuadrados (% de ancho)
  heightPercent?: number;    // Para sellos rectangulares / cuadrados (% de alto)
  cornerRadius?: number;     // Redondeo de esquinas en px (rx / ry)
  strokeWidth: number;       // Grosor del trazo en px
  style: FrameStyle;
  doubleGap?: number;        // Separación para doble línea
  scallopCount?: number;     // Cantidad de ondas (para circulares)
}

export interface CircularTextLayer extends BaseLayer {
  type: 'circular-text';
  text: string;
  radius: number;          // Radio en %
  startAngle: number;      // 0 a 360 grados
  sweepAngle: number;      // Amplitud del arco
  letterSpacing: number;   // Espaciado entre letras
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  isReversed: boolean;     // Dirección de lectura
  position: 'top' | 'bottom';
  textTransform?: 'uppercase' | 'none' | 'lowercase';
  textDecoration?: 'none' | 'underline' | 'line-through';
}

export interface CenterTextLayer extends BaseLayer {
  type: 'center-text';
  text: string;
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  alignment: 'center' | 'left' | 'right';
  offsetX: number;         // Desplazamiento horizontal (-150 a 150)
  offsetY: number;         // Desplazamiento vertical (-150 a 150)
  letterSpacing: number;
  lineHeight: number;
  scaleX?: number;         // Deformación / estiramiento horizontal % (ej. 100% = 1.0)
  scaleY?: number;         // Deformación / estiramiento vertical % (ej. 100% = 1.0)
  baselineShift?: number;  // Desplazamiento de línea base en pt (ej. 0 pt)
  rotation?: number;       // Rotación de caracteres / texto en grados (ej. 0°)
  textTransform?: 'uppercase' | 'none' | 'lowercase';
  textDecoration?: 'none' | 'underline' | 'line-through';
}

export interface IconLayer extends BaseLayer {
  type: 'icon';
  iconKey: string;         // 'star' | 'shield' | 'check' | 'cross' | 'crown' | 'scale'
  size: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  customSvgData?: string;
}

export type StampLayer = FrameLayer | CircularTextLayer | CenterTextLayer | IconLayer;

export interface StampProject {
  id: string;
  title: string;
  shape: StampShape;
  widthMm: number;         // Ancho físico real en mm (ej. 38, 47, 58, 70)
  heightMm: number;        // Alto físico real en mm (ej. 14, 18, 22, 25)
  sizeMm?: number;         // Compatibilidad (diámetro para circulares)
  color: string;           // Color de tinta
  secondaryColor?: string;
  layers: StampLayer[];
  showGrid: boolean;
  grungeEffect: number;    // 0 a 100
  createdAt: number;
}

export interface StampTemplate {
  id: string;
  name: string;
  category: 'notary' | 'medical' | 'business' | 'vintage' | 'official' | 'rectangular';
  description: string;
  thumbnail?: string;
  project: Omit<StampProject, 'id' | 'createdAt'>;
}
