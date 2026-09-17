// Escalado de imágenes para la página "Ampliar Imágenes" (Utilidades).
// Nearest/Bicubic/Lanczos se calculan a mano sobre ImageData (sin
// dependencias) para reproducir fielmente esos algoritmos clásicos —
// el "imageSmoothingQuality" nativo del canvas NO es un filtro Bicubic
// o Lanczos real, es una heurística propia de cada navegador.
// Ninguna función aquí limpia, binariza, corrige contraste ni aplica
// sharpening: solo cambian el tamaño, siempre partiendo de la imagen
// original (nunca encadenando una salida ya escalada sobre otra).

const clampIndex = (i, n) => Math.min(n - 1, Math.max(0, i));

// Kernel cúbico (Catmull-Rom, a = -0.5) — misma familia que usa Pillow en BICUBIC.
function cubicWeight(x) {
  const a = -0.5;
  x = Math.abs(x);
  if (x <= 1) return (a + 2) * x ** 3 - (a + 3) * x ** 2 + 1;
  if (x < 2) return a * x ** 3 - 5 * a * x ** 2 + 8 * a * x - 4 * a;
  return 0;
}

function sinc(x) {
  if (x === 0) return 1;
  const px = Math.PI * x;
  return Math.sin(px) / px;
}

// Lanczos con soporte de 3 lóbulos (a = 3), el default más común.
function lanczosWeight(x) {
  const a = 3;
  x = Math.abs(x);
  if (x >= a) return 0;
  return sinc(x) * sinc(x / a);
}

// Resize separable (pasada horizontal + pasada vertical) genérico para
// cualquier kernel de interpolación. Solo se usa para ampliar (scale > 1),
// así que no hace falta ensanchar el soporte del filtro como sí se
// requeriría para reducir tamaño (anti-aliasing).
function resizeSeparable(imageData, newW, newH, weightFn, support) {
  const { width: srcW, height: srcH, data: src } = imageData;
  const scaleX = newW / srcW;
  const scaleY = newH / srcH;

  // Pasada horizontal: srcW x srcH -> newW x srcH
  const temp = new Float32Array(newW * srcH * 4);
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < newW; x++) {
      const srcX = (x + 0.5) / scaleX - 0.5;
      const left = Math.floor(srcX - support);
      const right = Math.floor(srcX + support);
      let r = 0, g = 0, b = 0, a = 0, wsum = 0;
      for (let sx = left; sx <= right; sx++) {
        const w = weightFn(srcX - sx);
        if (w === 0) continue;
        const cx = clampIndex(sx, srcW);
        const idx = (y * srcW + cx) * 4;
        r += src[idx] * w;
        g += src[idx + 1] * w;
        b += src[idx + 2] * w;
        a += src[idx + 3] * w;
        wsum += w;
      }
      const outIdx = (y * newW + x) * 4;
      temp[outIdx] = r / wsum;
      temp[outIdx + 1] = g / wsum;
      temp[outIdx + 2] = b / wsum;
      temp[outIdx + 3] = a / wsum;
    }
  }

  // Pasada vertical: newW x srcH -> newW x newH
  const out = new Uint8ClampedArray(newW * newH * 4);
  for (let x = 0; x < newW; x++) {
    for (let y = 0; y < newH; y++) {
      const srcY = (y + 0.5) / scaleY - 0.5;
      const top = Math.floor(srcY - support);
      const bottom = Math.floor(srcY + support);
      let r = 0, g = 0, b = 0, a = 0, wsum = 0;
      for (let sy = top; sy <= bottom; sy++) {
        const w = weightFn(srcY - sy);
        if (w === 0) continue;
        const cy = clampIndex(sy, srcH);
        const idx = (cy * newW + x) * 4;
        r += temp[idx] * w;
        g += temp[idx + 1] * w;
        b += temp[idx + 2] * w;
        a += temp[idx + 3] * w;
        wsum += w;
      }
      const outIdx = (y * newW + x) * 4;
      out[outIdx] = r / wsum;
      out[outIdx + 1] = g / wsum;
      out[outIdx + 2] = b / wsum;
      out[outIdx + 3] = a / wsum;
    }
  }

  return new ImageData(out, newW, newH);
}

// Nearest neighbor exacto: cada pixel de salida toma el pixel más cercano
// del original, sin ningún promedio ni interpolación de grises.
function nearestResize(imageData, newW, newH) {
  const { width: srcW, height: srcH, data: src } = imageData;
  const out = new Uint8ClampedArray(newW * newH * 4);
  for (let y = 0; y < newH; y++) {
    const sy = Math.min(srcH - 1, Math.floor((y + 0.5) * srcH / newH));
    for (let x = 0; x < newW; x++) {
      const sx = Math.min(srcW - 1, Math.floor((x + 0.5) * srcW / newW));
      const srcIdx = (sy * srcW + sx) * 4;
      const dstIdx = (y * newW + x) * 4;
      out[dstIdx] = src[srcIdx];
      out[dstIdx + 1] = src[srcIdx + 1];
      out[dstIdx + 2] = src[srcIdx + 2];
      out[dstIdx + 3] = src[srcIdx + 3];
    }
  }
  return new ImageData(out, newW, newH);
}

/**
 * Escala un ImageData con uno de los 3 métodos clásicos, siempre desde el original.
 * @param {ImageData} imageData
 * @param {number} scale - factor de escala (4 u 8)
 * @param {'nearest'|'bicubic'|'lanczos'} method
 * @returns {ImageData}
 */
export function resizeImageData(imageData, scale, method) {
  const newW = Math.round(imageData.width * scale);
  const newH = Math.round(imageData.height * scale);
  if (method === 'nearest') return nearestResize(imageData, newW, newH);
  if (method === 'bicubic') return resizeSeparable(imageData, newW, newH, cubicWeight, 2);
  if (method === 'lanczos') return resizeSeparable(imageData, newW, newH, lanczosWeight, 3);
  throw new Error(`Método desconocido: ${method}`);
}

/** Carga un File en un <img> y devuelve también su ImageData a resolución original. */
export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve({ img, imageData, width: canvas.width, height: canvas.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

/** Convierte un ImageData a Blob PNG (siempre PNG, sin recompresión con pérdida). */
export function imageDataToBlob(imageData) {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext('2d').putImageData(imageData, 0, 0);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

// Nota: se probó un método de IA (ESRGAN Slim vía TensorFlow.js/UpscalerJS,
// corriendo 100% en el navegador) y se descartó por ahora — producía
// resultados corruptos (parches en gris/negro) incluso con el tamaño de
// imagen exacto que espera el modelo, un problema de la librería en el
// navegador. Mientras tanto, esa comparación se puede seguir haciendo con
// el script de Python aparte (herramientas-upscale/), que usa
// waifu2x-ncnn-vulkan directamente y no tiene este problema.
