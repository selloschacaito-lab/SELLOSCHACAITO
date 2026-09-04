// =========================================================================
// DTF SEMITONO STUDIO - MOTOR PROFESIONAL ESTILO HALFTONE MAKER
// Cuadrículas Hexagonal y Cuadrada, Suavizado Previo, Sujetar (Clamp),
// Fusión Sólida de Sombras, Formas Variadas, Exportación SVG y PNG 300 DPI.
// =========================================================================

// 1. BLINDAJE GLOBAL CONTRA NAVEGACIÓN EN CHROME AL ARRASTRAR ARCHIVOS
function cancelGlobalDrag(e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }
}

['dragenter', 'dragover'].forEach(evt => {
  window.addEventListener(evt, (e) => {
    cancelGlobalDrag(e);
    const ov = document.getElementById('dropOverlay');
    if (ov) ov.classList.add('active');
  }, false);
  document.addEventListener(evt, cancelGlobalDrag, false);
});

window.addEventListener('dragleave', (e) => {
  cancelGlobalDrag(e);
  if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
    const ov = document.getElementById('dropOverlay');
    if (ov) ov.classList.remove('active');
  }
}, false);

function onGlobalFileDrop(e) {
  cancelGlobalDrag(e);
  const ov = document.getElementById('dropOverlay');
  if (ov) ov.classList.remove('active');

  const dt = e.dataTransfer;
  if (!dt) return;

  let file = null;
  if (dt.files && dt.files.length > 0) {
    file = dt.files[0];
  } else if (dt.items && dt.items.length > 0) {
    for (let i = 0; i < dt.items.length; i++) {
      if (dt.items[i].kind === 'file') {
        file = dt.items[i].getAsFile();
        break;
      }
    }
  }

  if (file && window.app) {
    window.app.loadFile(file);
  }
}

window.addEventListener('drop', onGlobalFileDrop, false);
document.addEventListener('drop', onGlobalFileDrop, false);

// Banner de error en pantalla
window.onerror = function(msg, url, line) {
  console.error(`Error JS: ${msg} en ${url}:${line}`);
};

// 2. PALETAS RETRO VINTAGE
const PALETTES = [
  // 0: Toucan Pop
  (t) => {
    if (t < 0.33) return mixRgb([20, 30, 70], [215, 45, 55], t / 0.33);
    if (t < 0.66) return mixRgb([215, 45, 55], [245, 130, 25], (t - 0.33) / 0.33);
    return mixRgb([245, 130, 25], [250, 225, 90], (t - 0.66) / 0.34);
  },
  // 1: Retro 70s Sunset
  (t) => {
    if (t < 0.33) return mixRgb([60, 20, 60], [205, 30, 90], t / 0.33);
    if (t < 0.66) return mixRgb([205, 30, 90], [240, 110, 40], (t - 0.33) / 0.33);
    return mixRgb([240, 110, 40], [250, 215, 60], (t - 0.66) / 0.34);
  },
  // 2: Cyber Neon 80s
  (t) => {
    if (t < 0.5) return mixRgb([10, 15, 45], [0, 235, 245], t / 0.5);
    return mixRgb([0, 235, 245], [255, 20, 148], (t - 0.5) / 0.5);
  },
  // 3: Vintage Comic Book
  (t) => {
    if (t < 0.45) return mixRgb([25, 40, 100], [215, 30, 30], t / 0.45);
    return mixRgb([215, 30, 30], [245, 238, 210], (t - 0.45) / 0.55);
  },
  // 4: Golden Bronze
  (t) => mixRgb([30, 20, 10], [242, 190, 76], t)
];

function mixRgb(c1, c2, t) {
  t = Math.max(0, Math.min(1, t));
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t)
  ];
}

function adjustSaturation(r, g, b, satBoost) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  s = Math.max(0, Math.min(1, s * satBoost));

  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255)
  ];
}

// Generador pseudo-aleatorio para Stippling uniforme
function pseudoRandom(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
}

// =========================================================================
// 3. CLASE PRINCIPAL HALFTONE STUDIO (MOTOR PRO)
// =========================================================================
class HalftoneStudio {
  constructor() {
    this.canvas = document.getElementById('mainCanvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.srcCanvas = document.createElement('canvas');
    this.srcCtx = this.srcCanvas.getContext('2d', { willReadFrequently: true });
    this.srcImageData = null;

    // Buffer con desenfoque suave (el secreto de Halftone Maker para bordes y colores planos)
    this.blurCanvas = document.createElement('canvas');
    this.blurCtx = this.blurCanvas.getContext('2d', { willReadFrequently: true });
    this.blurImageData = null;

    this.currentWidth = 0;
    this.currentHeight = 0;
    this.currentFileName = 'DTF_Semitono';

    // Zoom y Paneo
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;

    // Parámetros por defecto (Inspirados en Halftone Maker)
    this.params = {
      gridLayout: 'hex',       // 'hex' (Hexagonal Panal) o 'square' (Cuadrada)
      patternType: 0,          // 0: Círculos, 1: Onduladas, 3: Rectas, 4: Diamantes, 5: Anillos, 6: Punteado
      scale: 70,               // Frecuencia LPI / Espaciado
      angle: 45,               // Ángulo de rotación
      waveFreq: 15,            // Frecuencia de onda
      waveAmp: 0.20,           // Amplitud de onda
      preBlur: 4,              // Desenfoque CSS (por defecto en 4px para degradados suaves inmediatos)
      gamma: 1.0,              // Curva Gamma
      contrast: 1.10,          // Contraste
      clampMax: 0.90,          // Sujetar Sombras: al 90% las sombras oscuras se fusionan en 100% negro sólido
      clampMin: 0.04,          // Sujetar Luces: corta al 4% para eliminar puntos residuales en blanco
      maxDotSize: 135,         // Tamaño máximo de punto (135% garantiza fusión sólida sin huecos)
      colorMode: 3,            // 3: Monocromo K (por defecto, como Halftone Maker), 0: Full Color, 1: Paletas, 2: Dúo Tono
      paletteId: 0,
      customInk: '#050608',
      customPaper: '#ffffff',
      saturation: 1.25,
      knockoutMode: 0,         // 0: Fondo Blanco, 1: Knockout Black, 2: Knockout White, 3: Solo Tinta
      knockoutThresh: 0.15,
      invert: false
    };

    this.setupUI();
    this.setupTopShapeBar();
    this.setupFileInput();
    this.setupTextileSwatches();
    this.loadDefaultDemoGraphic();
  }

  // Carga una fuente de imagen
  loadSource(drawable, name = 'Imagen') {
    const w = drawable.naturalWidth || drawable.width;
    const h = drawable.naturalHeight || drawable.height;

    this.currentWidth = w;
    this.currentHeight = h;
    this.currentFileName = name.replace(/\.[^/.]+$/, '');

    this.srcCanvas.width = w;
    this.srcCanvas.height = h;
    this.srcCtx.clearRect(0, 0, w, h);
    this.srcCtx.drawImage(drawable, 0, 0, w, h);
    this.srcImageData = this.srcCtx.getImageData(0, 0, w, h);

    this.updateBlurBuffer();

    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    const hudDim = document.getElementById('imgDimensions');
    if (hudDim) hudDim.textContent = `${w} × ${h} px`;

    this.fitToWindow();
    this.render();
  }

  // Actualiza el buffer con Desenfoque CSS
  updateBlurBuffer() {
    if (!this.srcCanvas.width || !this.srcCanvas.height) return;
    const w = this.currentWidth;
    const h = this.currentHeight;

    this.blurCanvas.width = w;
    this.blurCanvas.height = h;

    if (this.params.preBlur > 0) {
      this.blurCtx.clearRect(0, 0, w, h);
      this.blurCtx.filter = `blur(${this.params.preBlur}px)`;
      this.blurCtx.drawImage(this.srcCanvas, 0, 0, w, h);
      this.blurCtx.filter = 'none';
      this.blurImageData = this.blurCtx.getImageData(0, 0, w, h);
    } else {
      this.blurImageData = this.srcImageData;
    }
  }

  // =========================================================================
  // MOTOR DE CÁLCULO DE MEDIOS TONOS (ALGORITMO HALFTONE MAKER)
  // =========================================================================
  render() {
    if (!this.srcImageData) return;

    const w = this.currentWidth;
    const h = this.currentHeight;
    const ctx = this.ctx;
    const origData = this.srcImageData.data;
    const toneData = (this.blurImageData || this.srcImageData).data;

    ctx.clearRect(0, 0, w, h);

    const {
      gridLayout, patternType, scale, angle, waveFreq, waveAmp,
      gamma, contrast, clampMax, clampMin, maxDotSize,
      colorMode, paletteId, customInk, customPaper,
      saturation, knockoutMode, knockoutThresh, invert
    } = this.params;

    // Pintar fondo sólido si Knockout está desactivado (0)
    if (knockoutMode === 0) {
      if (colorMode === 1) {
        const bg = PALETTES[paletteId](invert ? 0.05 : 0.95);
        ctx.fillStyle = `rgb(${bg[0]}, ${bg[1]}, ${bg[2]})`;
      } else if (colorMode === 2) {
        ctx.fillStyle = customPaper;
      } else {
        ctx.fillStyle = '#ffffff';
      }
      ctx.fillRect(0, 0, w, h);
    }

    // Tamaño base de la celda de la cuadrícula
    const cellSize = Math.max(3, Math.round(1800 / scale));
    const cellRadius = cellSize * 0.5;
    const radAngle = (angle * Math.PI) / 180;
    const cosA = Math.cos(radAngle);
    const sinA = Math.sin(radAngle);

    const cx = w / 2;
    const cy = h / 2;

    const diag = Math.sqrt(w * w + h * h);
    const startOffset = -diag / 2 - cellSize * 2;
    const endOffset = diag / 2 + cellSize * 2;

    // Factor de tamaño máximo de punto (135% = 1.35)
    const normMax = maxDotSize / 100.0;
    const isHex = (gridLayout === 'hex');
    const rowStep = isHex ? (cellSize * 0.866025) : cellSize; // sqrt(3)/2 para panal hexagonal
    const paletteFn = PALETTES[paletteId];

    let rowIndex = 0;

    // Recorrido de celdas
    for (let gy = startOffset; gy < endOffset; gy += rowStep, rowIndex++) {
      // Desplazamiento de medio paso en filas alternas para panal hexagonal
      const hexShift = (isHex && (rowIndex % 2 !== 0)) ? (cellSize * 0.5) : 0;

      for (let gx = startOffset + hexShift; gx < endOffset; gx += cellSize) {
        const cellCenterX = gx + cellSize / 2;
        const cellCenterY = gy + rowStep / 2;

        // Des-rotar para muestrear la posición en la imagen original
        const imgX = Math.round(cx + (cellCenterX * cosA - cellCenterY * sinA));
        const imgY = Math.round(cy + (cellCenterX * sinA + cellCenterY * cosA));

        if (imgX < 0 || imgX >= w || imgY < 0 || imgY >= h) continue;

        const idx = (imgY * w + imgX) * 4;
        const origAlpha = origData[idx + 3];
        if (origAlpha < 10) continue; // Respetar transparencia alfa original

        let r = origData[idx];
        let g = origData[idx + 1];
        let b = origData[idx + 2];

        // Muestreo de luminancia en la capa suavizada
        const tr = toneData[idx];
        const tg = toneData[idx + 1];
        const tb = toneData[idx + 2];
        let rawLum = (tr * 0.299 + tg * 0.587 + tb * 0.114) / 255.0;

        // Aplicar contraste
        let lumAdj = (rawLum - 0.5) * contrast + 0.5;
        lumAdj = Math.max(0, Math.min(1, lumAdj));

        // Densidad de tinta física (1.0 = negro/sombra total, 0.0 = blanco/luz total)
        let rawDensity = invert ? lumAdj : (1.0 - lumAdj);

        // Knockout Textil:
        // 1: Knockout Black (prendas oscuras): si la densidad es alta (sombra negra), no se imprime tinta (la camiseta es la sombra)
        if (knockoutMode === 1 && rawDensity > (1.0 - knockoutThresh)) {
          continue;
        }
        // 2: Knockout White (prendas claras): si la densidad es baja (luz blanca), no se imprime tinta
        if (knockoutMode === 2 && rawDensity < knockoutThresh) {
          continue;
        }

        // Si la prenda es oscura (Knockout 1), la tinta blanca/color imprime en las luces:
        let inkDensity = (knockoutMode === 1) ? (1.0 - rawDensity) : rawDensity;

        // Sujetar (Clamp) - Corte de Luces y Fusión de Sombras (Algoritmo Halftone Maker)
        if (inkDensity <= clampMin) continue; // Corte limpio en luces

        let t = (inkDensity - clampMin) / Math.max(0.01, (clampMax - clampMin));
        t = Math.max(0, Math.min(1, t)); // Sujetado

        // Aplicar Curva Gamma a los medios tonos
        let tGamma = Math.pow(t, 1.0 / Math.max(0.01, gamma));

        // Color del punto/tinta
        let dotColor;
        if (colorMode === 3) {
          // Monocromo Tinta Pura K (como en Halftone Maker)
          dotColor = invert ? '#ffffff' : '#000000';
        } else if (colorMode === 0) {
          // Full Color Pop (original con saturación)
          if (saturation !== 1.0) {
            const sat = adjustSaturation(r, g, b, saturation);
            r = sat[0]; g = sat[1]; b = sat[2];
          }
          dotColor = `rgb(${r}, ${g}, ${b})`;
        } else if (colorMode === 1) {
          const col = paletteFn(1.0 - tGamma);
          dotColor = `rgb(${col[0]}, ${col[1]}, ${col[2]})`;
        } else if (colorMode === 2) {
          dotColor = customInk;
        }

        ctx.fillStyle = dotColor;
        ctx.strokeStyle = dotColor;

        // Transformación y dibujo en el espacio rotado
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(radAngle);

        // ==========================================
        // DIBUJADO DE LAS FORMAS
        // ==========================================
        if (patternType === 0) {
          // 0: PUNTOS / CÍRCULOS EUCLIDIANOS
          // El radio crece proporcional a la raíz cuadrada de tGamma para que el área de tinta sea exacta.
          // Al alcanzar tGamma = 1.0 (sombras), rDot = cellRadius * normMax.
          // Con normMax = 1.35, los círculos adyacentes se solapan por completo, formando 100% negro sólido!
          const rDot = cellRadius * normMax * Math.sqrt(tGamma);
          if (rDot > 0.25) {
            ctx.beginPath();
            ctx.arc(cellCenterX, cellCenterY, rDot, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (patternType === 1) {
          // 1: LÍNEAS ONDULADAS (WAVY LINES / LÍQUIDO)
          const wave = Math.sin(cellCenterX * (waveFreq * 0.035)) * (cellSize * waveAmp * 3.0);
          const thickness = cellSize * normMax * tGamma;
          if (thickness > 0.2) {
            ctx.fillRect(cellCenterX - cellSize / 2, cellCenterY + wave - thickness / 2, cellSize + 0.5, thickness);
          }
        } else if (patternType === 3) {
          // 3: LÍNEAS RECTAS PARALELAS
          const thickness = cellSize * normMax * tGamma;
          if (thickness > 0.2) {
            ctx.fillRect(cellCenterX - cellSize / 2, cellCenterY - thickness / 2, cellSize + 0.5, thickness);
          }
        } else if (patternType === 4) {
          // 4: DIAMANTES / ROMBOS
          const maxD = cellRadius * normMax * Math.sqrt(tGamma);
          if (maxD > 0.25) {
            ctx.beginPath();
            ctx.moveTo(cellCenterX, cellCenterY - maxD);
            ctx.lineTo(cellCenterX + maxD, cellCenterY);
            ctx.lineTo(cellCenterX, cellCenterY + maxD);
            ctx.lineTo(cellCenterX - maxD, cellCenterY);
            ctx.closePath();
            ctx.fill();
          }
        } else if (patternType === 5) {
          // 5: ANILLOS CONCÉNTRICOS (RING)
          const dist = Math.hypot(cellCenterX, cellCenterY);
          const ringPeriod = cellSize * 2;
          const ringPhase = dist % ringPeriod;
          const ringThickness = ringPeriod * 0.5 * tGamma;
          if (Math.abs(ringPhase - ringPeriod * 0.5) < ringThickness / 2) {
            ctx.beginPath();
            ctx.arc(cellCenterX, cellCenterY, cellRadius * 0.8 * Math.sqrt(tGamma), 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (patternType === 6) {
          // 6: PUNTEADO (STIPPLING / DOTWORK)
          // Genera puntos con dispersión pseudo-aleatoria orgánica
          const jitterX = (pseudoRandom(cellCenterX, cellCenterY) - 0.5) * cellSize * 0.6;
          const jitterY = (pseudoRandom(cellCenterY, cellCenterX) - 0.5) * cellSize * 0.6;
          const rDot = cellRadius * 0.8 * Math.sqrt(tGamma);
          if (rDot > 0.2) {
            ctx.beginPath();
            ctx.arc(cellCenterX + jitterX, cellCenterY + jitterY, rDot, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }
    }
  }

  // =========================================================================
  // EXPORTACIÓN A SVG VECTORIAL (ILLUSTRATOR / CORELDRAW)
  // =========================================================================
  exportSVG() {
    if (!this.srcImageData) return;

    this.showToast('Generando archivo SVG vectorial con trazados limpios...');

    const w = this.currentWidth;
    const h = this.currentHeight;
    const origData = this.srcImageData.data;
    const toneData = (this.blurImageData || this.srcImageData).data;

    const {
      gridLayout, patternType, scale, angle,
      gamma, contrast, clampMax, clampMin, maxDotSize,
      colorMode, paletteId, customInk, customPaper,
      saturation, knockoutMode, knockoutThresh, invert
    } = this.params;

    const cellSize = Math.max(3, Math.round(1800 / scale));
    const cellRadius = cellSize * 0.5;
    const radAngle = (angle * Math.PI) / 180;
    const cosA = Math.cos(radAngle);
    const sinA = Math.sin(radAngle);

    const cx = w / 2;
    const cy = h / 2;
    const diag = Math.sqrt(w * w + h * h);
    const startOffset = -diag / 2 - cellSize * 2;
    const endOffset = diag / 2 + cellSize * 2;

    const normMax = maxDotSize / 100.0;
    const isHex = (gridLayout === 'hex');
    const rowStep = isHex ? (cellSize * 0.866025) : cellSize;
    const paletteFn = PALETTES[paletteId];

    let svgElements = [];
    let rowIndex = 0;

    for (let gy = startOffset; gy < endOffset; gy += rowStep, rowIndex++) {
      const hexShift = (isHex && (rowIndex % 2 !== 0)) ? (cellSize * 0.5) : 0;

      for (let gx = startOffset + hexShift; gx < endOffset; gx += cellSize) {
        const cellCenterX = gx + cellSize / 2;
        const cellCenterY = gy + rowStep / 2;

        const imgX = Math.round(cx + (cellCenterX * cosA - cellCenterY * sinA));
        const imgY = Math.round(cy + (cellCenterX * sinA + cellCenterY * cosA));

        if (imgX < 0 || imgX >= w || imgY < 0 || imgY >= h) continue;

        const idx = (imgY * w + imgX) * 4;
        if (origData[idx + 3] < 10) continue;

        let r = origData[idx];
        let g = origData[idx + 1];
        let b = origData[idx + 2];

        const tr = toneData[idx];
        const tg = toneData[idx + 1];
        const tb = toneData[idx + 2];
        let rawLum = (tr * 0.299 + tg * 0.587 + tb * 0.114) / 255.0;

        let lumAdj = (rawLum - 0.5) * contrast + 0.5;
        lumAdj = Math.max(0, Math.min(1, lumAdj));
        let rawDensity = invert ? lumAdj : (1.0 - lumAdj);

        if (knockoutMode === 1 && rawDensity > (1.0 - knockoutThresh)) continue;
        if (knockoutMode === 2 && rawDensity < knockoutThresh) continue;

        let inkDensity = (knockoutMode === 1) ? (1.0 - rawDensity) : rawDensity;
        if (inkDensity <= clampMin) continue;

        let t = (inkDensity - clampMin) / Math.max(0.01, (clampMax - clampMin));
        t = Math.max(0, Math.min(1, t));
        let tGamma = Math.pow(t, 1.0 / Math.max(0.01, gamma));

        let dotColor;
        if (colorMode === 3) {
          dotColor = invert ? '#ffffff' : '#000000';
        } else if (colorMode === 0) {
          if (saturation !== 1.0) {
            const sat = adjustSaturation(r, g, b, saturation);
            r = sat[0]; g = sat[1]; b = sat[2];
          }
          dotColor = `rgb(${r},${g},${b})`;
        } else if (colorMode === 1) {
          const col = paletteFn(1.0 - tGamma);
          dotColor = `rgb(${col[0]},${col[1]},${col[2]})`;
        } else if (colorMode === 2) {
          dotColor = customInk;
        }

        const finalX = (cx + (cellCenterX * cosA - cellCenterY * sinA)).toFixed(1);
        const finalY = (cy + (cellCenterX * sinA + cellCenterY * cosA)).toFixed(1);
        const rDot = (cellRadius * normMax * Math.sqrt(tGamma)).toFixed(1);

        if (rDot > 0.25) {
          svgElements.push(`<circle cx="${finalX}" cy="${finalY}" r="${rDot}" fill="${dotColor}" />`);
        }
      }
    }

    const bgRect = (knockoutMode === 0) ? `<rect width="${w}" height="${h}" fill="${customPaper}"/>\n` : '';
    const fullSvg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n${bgRect}` + svgElements.join('\n') + `\n</svg>`;

    const blob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.currentFileName}_Semitono.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast('¡Archivo SVG vectorial descargado con éxito!');
  }

  // =========================================================================
  // EXPORTACIÓN A PNG 300 DPI
  // =========================================================================
  exportHighResPNG() {
    if (!this.srcImageData) return;

    this.showToast('Generando PNG transparente en 300 DPI...');
    this.render();

    this.canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentFileName}_Semitono_300DPI.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast('¡Descarga completada! Listo para ripear en DTF.');
    }, 'image/png');
  }

  // Copiar al portapapeles
  async copyPNGToClipboard() {
    if (!this.srcImageData) return;

    try {
      this.render();
      this.canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && navigator.clipboard.write) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          this.showToast('¡Copiado al portapapeles! Puedes pegarlo con Ctrl+V en Illustrator o Photoshop.');
        } else {
          this.showToast('Portapapeles no soportado en este navegador.');
        }
      }, 'image/png');
    } catch (err) {
      console.warn(err);
      this.showToast('No se pudo copiar al portapapeles.');
    }
  }

  // =========================================================================
  // CONFIGURACIÓN DE CONTROLES & FORMAS DE LA BARRA SUPERIOR
  // =========================================================================
  setupTopShapeBar() {
    const shapeButtons = document.querySelectorAll('.shape-btn[data-grid]');
    const wavyBlock = document.getElementById('wavyControlsBlock');

    shapeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        shapeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const grid = btn.dataset.grid;
        const pattern = parseInt(btn.dataset.pattern);

        this.params.gridLayout = grid;
        this.params.patternType = pattern;

        const gridSelect = document.getElementById('gridLayoutSelect');
        if (gridSelect) gridSelect.value = grid;

        if (wavyBlock) {
          wavyBlock.style.display = (pattern === 1) ? 'flex' : 'none';
        }

        this.render();
      });
    });

    // Toggle rápido B&W vs Full Color
    const btnQuickBW = document.getElementById('btnQuickBW');
    const btnQuickColor = document.getElementById('btnQuickColor');
    const colorSelect = document.getElementById('colorModeSelect');
    const satGroup = document.getElementById('saturationGroup');

    if (btnQuickBW && btnQuickColor) {
      btnQuickBW.addEventListener('click', () => {
        btnQuickBW.classList.add('active');
        btnQuickColor.classList.remove('active');
        this.params.colorMode = 3;
        if (colorSelect) colorSelect.value = '3';
        if (satGroup) satGroup.style.display = 'none';
        this.showToast('Modo Monocromo Tinta Pura (Negro K) activado');
        this.render();
      });

      btnQuickColor.addEventListener('click', () => {
        btnQuickColor.classList.add('active');
        btnQuickBW.classList.remove('active');
        this.params.colorMode = 0;
        if (colorSelect) colorSelect.value = '0';
        if (satGroup) satGroup.style.display = 'block';
        this.showToast('Modo Full Color Pop activado');
        this.render();
      });
    }

    // Botón de knockout rápido en la barra superior
    const btnQuickKnockout = document.getElementById('btnQuickKnockout');
    if (btnQuickKnockout) {
      btnQuickKnockout.addEventListener('click', () => {
        const nextMode = (this.params.knockoutMode === 1) ? 0 : 1;
        this.params.knockoutMode = nextMode;
        document.getElementById('knockoutSelect').value = nextMode.toString();
        btnQuickKnockout.classList.toggle('active', nextMode === 1);
        this.showToast(nextMode === 1 ? 'Knockout Black Activado (Prendas Negras)' : 'Knockout Desactivado (Fondo Papel)');
        this.render();
      });
    }

    const btnResetAll = document.getElementById('btnResetAll');
    if (btnResetAll) {
      btnResetAll.addEventListener('click', () => {
        this.resetParameters();
        this.showToast('Parámetros restablecidos a valores originales');
      });
    }
  }

  setupUI() {
    // 1. Lienzo y Ajustes (Halftone Maker Controls)
    this.bindRange('preBlur', 'valPreBlur', (v) => {
      this.params.preBlur = v;
      this.updateBlurBuffer();
    }, (v) => `${v} px`);

    this.bindRange('gamma', 'valGamma', (v) => { this.params.gamma = v; }, (v) => v.toFixed(2));
    this.bindRange('contrast', 'valContrast', (v) => { this.params.contrast = v; }, (v) => `${v.toFixed(2)}x`);
    this.bindRange('clampMax', 'valClampMax', (v) => { this.params.clampMax = v / 100.0; }, (v) => `${v}%`);
    this.bindRange('clampMin', 'valClampMin', (v) => { this.params.clampMin = v / 100.0; }, (v) => `${v}%`);

    // 2. Cuadrícula
    document.getElementById('gridLayoutSelect').addEventListener('change', (e) => {
      this.params.gridLayout = e.target.value;
      const hexBtn = document.getElementById('shapeHex');
      const squareBtn = document.getElementById('shapeSquare');
      if (hexBtn && squareBtn) {
        hexBtn.classList.toggle('active', e.target.value === 'hex');
        squareBtn.classList.toggle('active', e.target.value === 'square');
      }
      this.render();
    });

    this.bindRange('scale', 'valScale', (v) => { this.params.scale = v; }, (v) => v);
    this.bindRange('angle', 'valAngle', (v) => { this.params.angle = v; }, (v) => `${v}°`);
    this.bindRange('maxDotSize', 'valMaxDotSize', (v) => { this.params.maxDotSize = v; }, (v) => `${v}%`);
    this.bindRange('waveFreq', 'valWaveFreq', (v) => { this.params.waveFreq = v; }, (v) => v);
    this.bindRange('waveAmp', 'valWaveAmp', (v) => { this.params.waveAmp = v; }, (v) => v.toFixed(2));

    // 3. Color & DTF
    const colorSelect = document.getElementById('colorModeSelect');
    const paletteGroup = document.getElementById('paletteSelectGroup');
    const duotoneGroup = document.getElementById('duotoneSelectGroup');
    const saturationGroup = document.getElementById('saturationGroup');

    colorSelect.addEventListener('change', (e) => {
      const mode = parseInt(e.target.value);
      this.params.colorMode = mode;
      paletteGroup.style.display = (mode === 1) ? 'block' : 'none';
      duotoneGroup.style.display = (mode === 2) ? 'block' : 'none';
      saturationGroup.style.display = (mode === 0) ? 'block' : 'none';
      this.render();
    });

    document.getElementById('paletteIdSelect').addEventListener('change', (e) => {
      this.params.paletteId = parseInt(e.target.value);
      this.render();
    });

    document.getElementById('customInkPicker').addEventListener('input', (e) => {
      this.params.customInk = e.target.value;
      this.render();
    });
    document.getElementById('customPaperPicker').addEventListener('input', (e) => {
      this.params.customPaper = e.target.value;
      this.render();
    });

    this.bindRange('saturationSlider', 'valSaturation', (v) => { this.params.saturation = v; }, (v) => `${v.toFixed(2)}x`);

    // Knockout
    const knockoutSelect = document.getElementById('knockoutSelect');
    const knockoutThreshRow = document.getElementById('knockoutThresholdRow');
    knockoutSelect.addEventListener('change', (e) => {
      this.params.knockoutMode = parseInt(e.target.value);
      knockoutThreshRow.style.display = (this.params.knockoutMode === 1 || this.params.knockoutMode === 2) ? 'block' : 'none';
      const quickBtn = document.getElementById('btnQuickKnockout');
      if (quickBtn) quickBtn.classList.toggle('active', this.params.knockoutMode === 1);
      this.render();
    });

    this.bindRange('knockoutThreshSlider', 'valKnockoutThresh', (v) => { this.params.knockoutThresh = v; }, (v) => v.toFixed(2));

    document.getElementById('invertCheckbox').addEventListener('change', (e) => {
      this.params.invert = e.target.checked;
      this.render();
    });

    // Botones de exportación (Barra Superior y Barra Flotante)
    ['btnExportPNG', 'btnBarDownloadPNG'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.exportHighResPNG());
    });

    ['btnExportSVG', 'btnBarDownloadSVG'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.exportSVG());
    });

    ['btnCopyClipboard', 'btnBarCopy'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.copyPNGToClipboard());
    });

    // Zoom y Paneo
    document.getElementById('btnZoomIn').addEventListener('click', () => this.setZoom(this.zoom * 1.25));
    document.getElementById('btnZoomOut').addEventListener('click', () => this.setZoom(this.zoom / 1.25));
    document.getElementById('btnFit').addEventListener('click', () => this.fitToWindow());

    // Botones de Gráficos de Muestra
    document.getElementById('btnSampleToucan').addEventListener('click', () => {
      this.loadDefaultDemoGraphic();
      this.showToast('¡Gráfico Tucán multicolor cargado!');
    });

    document.getElementById('btnSampleSkull').addEventListener('click', () => {
      this.loadSkullDemoGraphic();
      this.showToast('¡Gráfico Calavera cargado (Prueba Fusión de Sombras)!');
    });

    document.getElementById('btnSampleSunset').addEventListener('click', () => {
      this.loadRetroSunsetGraphic();
      this.showToast('¡Gráfico Retro Sunset cargado (Prueba Ondas)!');
    });

    // Rueda del ratón para Zoom
    const container = document.getElementById('viewportContainer');
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.85;
      this.setZoom(this.zoom * factor);
    }, { passive: false });

    // Paneo con el ratón
    container.addEventListener('mousedown', (e) => {
      if (e.target === container || e.target === this.canvas) {
        this.isDragging = true;
        this.startX = e.clientX - this.panX;
        this.startY = e.clientY - this.panY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        this.updateTransform();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Pegado directo con Ctrl+V
    window.addEventListener('paste', (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type && items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile();
            if (file) {
              this.loadFile(file);
              this.showToast('¡Imagen pegada desde el portapapeles!');
              return;
            }
          }
        }
      }
    });
  }

  setupFileInput() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput) return;

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        this.loadFile(fileInput.files[0]);
      }
      setTimeout(() => { fileInput.value = ''; }, 1000);
    });
  }

  loadFile(file) {
    if (!file) return;

    this.showToast(`Cargando ${file.name || 'imagen'}...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.loadSource(img, file.name);
        this.showToast(`¡Listo! ${file.name} (${img.naturalWidth}×${img.naturalHeight} px)`);
      };
      img.onerror = () => {
        alert('No se pudo decodificar el archivo como imagen válida.');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      alert('Error leyendo el archivo del disco.');
    };
    reader.readAsDataURL(file);
  }

  bindRange(id, valId, setter, formatter) {
    const input = document.getElementById(id);
    const label = document.getElementById(valId);
    if (!input || !label) return;
    input.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      setter(val);
      label.textContent = formatter(val);
      this.render();
    });
  }

  setupTextileSwatches() {
    const container = document.getElementById('viewportContainer');
    const swatches = document.querySelectorAll('.textile-btn');
    swatches.forEach(btn => {
      btn.addEventListener('click', () => {
        swatches.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const color = btn.dataset.color;
        if (color === 'checker') {
          container.style.backgroundColor = '';
          container.classList.add('checker-bg');
        } else {
          container.classList.remove('checker-bg');
          container.style.backgroundColor = color;
        }
      });
    });
  }

  setZoom(newZoom) {
    this.zoom = Math.max(0.05, Math.min(newZoom, 8.0));
    const zLevel = document.getElementById('zoomLevel');
    if (zLevel) zLevel.textContent = `${Math.round(this.zoom * 100)}%`;
    this.updateTransform();
  }

  fitToWindow() {
    const container = document.getElementById('viewportContainer');
    if (!container || !this.currentWidth || !this.currentHeight) return;

    const padding = 80;
    const availW = Math.max(container.clientWidth - padding, 200);
    const availH = Math.max(container.clientHeight - padding, 200);
    const scale = Math.min(availW / this.currentWidth, availH / this.currentHeight);

    this.zoom = Math.max(0.05, Math.min(scale, 1.2));
    this.panX = 0;
    this.panY = 0;
    const zLevel = document.getElementById('zoomLevel');
    if (zLevel) zLevel.textContent = `${Math.round(this.zoom * 100)}%`;
    this.updateTransform();
  }

  updateTransform() {
    const wrapper = document.getElementById('canvasWrapper');
    if (wrapper) {
      wrapper.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }
  }

  resetParameters() {
    this.params = {
      gridLayout: 'hex',
      patternType: 0,
      scale: 70,
      angle: 45,
      waveFreq: 15,
      waveAmp: 0.20,
      preBlur: 4,
      gamma: 1.0,
      contrast: 1.10,
      clampMax: 0.90,
      clampMin: 0.04,
      maxDotSize: 135,
      colorMode: 3,
      paletteId: 0,
      customInk: '#050608',
      customPaper: '#ffffff',
      saturation: 1.25,
      knockoutMode: 0,
      knockoutThresh: 0.15,
      invert: false
    };

    document.getElementById('preBlur').value = '4';
    document.getElementById('valPreBlur').textContent = '4 px';
    document.getElementById('gamma').value = '1.0';
    document.getElementById('valGamma').textContent = '1.00';
    document.getElementById('contrast').value = '1.10';
    document.getElementById('valContrast').textContent = '1.10x';
    document.getElementById('clampMax').value = '90';
    document.getElementById('valClampMax').textContent = '90%';
    document.getElementById('clampMin').value = '4';
    document.getElementById('valClampMin').textContent = '4%';

    document.getElementById('gridLayoutSelect').value = 'hex';
    document.getElementById('scale').value = '70';
    document.getElementById('valScale').textContent = '70';
    document.getElementById('angle').value = '45';
    document.getElementById('valAngle').textContent = '45°';
    document.getElementById('maxDotSize').value = '135';
    document.getElementById('valMaxDotSize').textContent = '135%';

    document.getElementById('colorModeSelect').value = '3';
    document.getElementById('paletteSelectGroup').style.display = 'none';
    document.getElementById('duotoneSelectGroup').style.display = 'none';
    document.getElementById('saturationGroup').style.display = 'none';

    document.getElementById('knockoutSelect').value = '0';
    document.getElementById('knockoutThresholdRow').style.display = 'none';
    document.getElementById('invertCheckbox').checked = false;

    // Resetear botones superiores
    const shapeButtons = document.querySelectorAll('.shape-btn');
    shapeButtons.forEach(b => b.classList.remove('active'));
    const hexBtn = document.getElementById('shapeHex');
    if (hexBtn) hexBtn.classList.add('active');

    this.updateBlurBuffer();
    this.render();
  }

  showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // =========================================================================
  // GRÁFICOS DE PRUEBA
  // =========================================================================
  loadDefaultDemoGraphic() {
    const size = 1200;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.font = '900 80px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4d6d';
    ctx.fillText('COLORPOP', size / 2, 160);
    ctx.font = '800 36px -apple-system, sans-serif';
    ctx.fillStyle = '#ffb703';
    ctx.fillText('DTF HALFTONES & KNOCKOUT', size / 2, 220);
    ctx.restore();

    const centerX = size / 2;
    const centerY = size / 2 + 70;

    ctx.save();
    const bodyGrad = ctx.createRadialGradient(centerX - 30, centerY + 80, 50, centerX, centerY + 80, 240);
    bodyGrad.addColorStop(0, '#1c2438');
    bodyGrad.addColorStop(0.5, '#0f1422');
    bodyGrad.addColorStop(1, '#05070c');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 100, 180, 240, -0.1, 0, Math.PI * 2);
    ctx.fill();

    const chestGrad = ctx.createRadialGradient(centerX - 60, centerY + 20, 20, centerX - 40, centerY + 40, 150);
    chestGrad.addColorStop(0, '#ffffff');
    chestGrad.addColorStop(0.4, '#fff3b0');
    chestGrad.addColorStop(0.8, '#ffaa00');
    chestGrad.addColorStop(1, '#e85d04');
    ctx.fillStyle = chestGrad;
    ctx.beginPath();
    ctx.ellipse(centerX - 50, centerY + 30, 110, 130, 0.2, 0, Math.PI * 2);
    ctx.fill();

    const beakGrad = ctx.createLinearGradient(centerX - 50, centerY - 120, centerX + 280, centerY + 20);
    beakGrad.addColorStop(0, '#ffee38');
    beakGrad.addColorStop(0.35, '#ff8800');
    beakGrad.addColorStop(0.7, '#d90429');
    beakGrad.addColorStop(1, '#7209b7');

    ctx.fillStyle = beakGrad;
    ctx.beginPath();
    ctx.moveTo(centerX - 90, centerY - 60);
    ctx.bezierCurveTo(centerX + 30, centerY - 160, centerX + 240, centerY - 80, centerX + 280, centerY + 40);
    ctx.bezierCurveTo(centerX + 260, centerY + 90, centerX + 180, centerY + 60, centerX + 100, centerY + 30);
    ctx.bezierCurveTo(centerX + 20, centerY + 20, centerX - 50, centerY + 10, centerX - 90, centerY - 60);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#00b4d8';
    ctx.beginPath();
    ctx.arc(centerX - 75, centerY - 45, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#03045e';
    ctx.beginPath();
    ctx.arc(centerX - 75, centerY - 45, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX - 82, centerY - 52, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3d1a08';
    ctx.fillRect(150, centerY + 280, 900, 38);

    ctx.fillStyle = '#06d6a0';
    ctx.beginPath();
    ctx.ellipse(centerX - 240, centerY + 200, 70, 180, -0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#118ab2';
    ctx.beginPath();
    ctx.ellipse(centerX + 240, centerY + 230, 80, 190, 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    this.loadSource(c, 'Tucán Tropical');
  }

  loadSkullDemoGraphic() {
    const size = 1200;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    ctx.save();
    ctx.fillStyle = '#f4f1de';
    ctx.beginPath();
    ctx.arc(cx, cy - 60, 190, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(cx - 100, cy + 50, 200, 140, 20);
    ctx.fill();

    ctx.fillStyle = '#050608';
    ctx.beginPath();
    ctx.ellipse(cx - 70, cy - 50, 48, 65, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx + 70, cy - 50, 48, 65, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx - 20, cy + 30);
    ctx.lineTo(cx + 20, cy + 30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#050608';
    for (let i = -3; i <= 3; i++) {
      ctx.fillRect(cx + i * 26 - 4, cy + 100, 8, 55);
    }

    ctx.font = '900 65px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e63946';
    ctx.fillText('VINTAGE SKULL', cx, 140);
    ctx.font = '700 30px -apple-system, sans-serif';
    ctx.fillStyle = '#a8dadc';
    ctx.fillText('KNOCKOUT BLACK TEST', cx, 200);

    ctx.restore();

    this.loadSource(c, 'Calavera Vintage');
  }

  loadRetroSunsetGraphic() {
    const size = 1200;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 0, size);
    bg.addColorStop(0, '#0d0221');
    bg.addColorStop(0.6, '#240046');
    bg.addColorStop(1, '#050014');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2 - 30;

    const sunGrad = ctx.createLinearGradient(0, cy - 220, 0, cy + 220);
    sunGrad.addColorStop(0, '#ffee38');
    sunGrad.addColorStop(0.5, '#f72585');
    sunGrad.addColorStop(1, '#7209b7');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 220, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#240046';
    for (let i = 0; i < 8; i++) {
      const y = cy + 30 + i * 24;
      const h = 4 + i * 2.5;
      ctx.fillRect(cx - 230, y, 460, h);
    }

    ctx.fillStyle = '#0d0221';
    ctx.beginPath();
    ctx.moveTo(cx + 80, cy + 240);
    ctx.quadraticCurveTo(cx + 90, cy + 50, cx + 130, cy - 40);
    ctx.quadraticCurveTo(cx + 105, cy + 50, cx + 95, cy + 240);
    ctx.fill();

    for (let a = -1.2; a <= 0.8; a += 0.35) {
      ctx.save();
      ctx.translate(cx + 130, cy - 40);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(60, 0, 80, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.font = '900 70px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4cc9f0';
    ctx.fillText('SYNTHWAVE 1984', cx, 140);

    this.loadSource(c, 'Retro Sunset');
  }
}

// Inicialización automática
window.addEventListener('DOMContentLoaded', () => {
  window.app = new HalftoneStudio();
});
