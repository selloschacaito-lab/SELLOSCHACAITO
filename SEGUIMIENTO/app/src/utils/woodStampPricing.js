// Lógica de precios para la Calculadora de Sellos de Madera.
// Toda la matemática de precios vive aquí, separada de la interfaz, para poder
// ajustar los parámetros comerciales (config) sin tocar componentes visuales,
// y para poder reutilizar exactamente el mismo cálculo en la calculadora
// individual, la tabla de precios y el simulador de fórmula.

/**
 * Parámetros comerciales de la calculadora. Todos son ajustables — no hay
 * ningún número mágico repetido en otro lugar del código. El "Simulador de
 * fórmula" arma una copia temporal de este objeto en memoria (no lo muta).
 */
export const woodStampPricingConfig = {
  referencePrice: 12,          // USD — precio en el área de referencia
  referenceArea: 25,           // cm² — equivale a un sello de 5×5
  exponent: 0.80,              // curva de crecimiento del precio según el área
  minimumPrice: 12,            // USD — nunca se muestra un PVP menor a esto
  wholesaleDiscount: 0.20,     // 20% de descuento mayorista sobre el PVP redondeado
  quantityDiscount: 0.05,      // 5% — capa comercial, no forma parte de la fórmula de tamaño
  quantityDiscountMinQty: null, // cantidad mínima para activar el descuento (aún sin definir)
  roundingIncrement: 0.50,     // redondeo hacia arriba, múltiplos de $0.50
  maxLongSide: 20,             // cm — lado mayor permitido
  maxShortSide: 14             // cm — lado menor permitido
};

/**
 * Redondea un precio hacia arriba al siguiente múltiplo de `increment`.
 * Limpia el resultado con toFixed/parseFloat para evitar artefactos de
 * precisión de punto flotante (ej. 18.500000000000004).
 */
export function roundUpToIncrement(price, increment = woodStampPricingConfig.roundingIncrement) {
  if (!Number.isFinite(price) || !Number.isFinite(increment) || increment <= 0) return price;
  const rounded = Math.ceil(price / increment) * increment;
  return parseFloat(rounded.toFixed(2));
}

/**
 * Redondea a 2 decimales (para montos que no necesitan redondeo comercial,
 * como el precio mayorista, pero sí limpieza de precisión flotante).
 */
function round2(n) {
  return parseFloat(Number(n || 0).toFixed(2));
}

/**
 * Calcula el precio de un sello de madera a partir de su ancho y alto en cm.
 * Devuelve un objeto estructurado, nunca lanza excepciones — las medidas
 * inválidas se reportan en `valid`/`validationMessage`.
 *
 * @param {number} width  Ancho en cm (entero positivo)
 * @param {number} height Alto en cm (entero positivo)
 * @param {object} config Configuración de precios (por defecto, woodStampPricingConfig)
 * @returns {{
 *   width: number, height: number, area: number|null,
 *   rawPrice: number|null, retailPrice: number|null, wholesalePrice: number|null,
 *   valid: boolean, validationMessage: string|null
 * }}
 */
export function calculateWoodStampPrice(width, height, config = woodStampPricingConfig) {
  const base = { width, height, area: null, rawPrice: null, retailPrice: null, wholesalePrice: null };

  // 1. Validación de tipo/rango: solo enteros positivos.
  const isValidNumber = (n) => typeof n === 'number' && Number.isFinite(n);
  if (!isValidNumber(width) || !isValidNumber(height) || width <= 0 || height <= 0) {
    return { ...base, valid: false, validationMessage: 'Las medidas deben ser números positivos.' };
  }
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    return { ...base, valid: false, validationMessage: 'Las medidas deben ser números enteros (sin decimales).' };
  }

  // 2. Validación de tamaño máximo, normalizando orientación (20×14 y 14×20
  //    deben comportarse exactamente igual).
  const ladoMayor = Math.max(width, height);
  const ladoMenor = Math.min(width, height);
  if (ladoMayor > config.maxLongSide || ladoMenor > config.maxShortSide) {
    return {
      ...base,
      valid: false,
      validationMessage: `Esta medida supera el tamaño máximo disponible de ${config.maxLongSide} × ${config.maxShortSide} cm.`
    };
  }

  // 3. Fórmula de precio por área.
  const area = width * height;
  const rawPrice = config.referencePrice * Math.pow(area / config.referenceArea, config.exponent);
  const retailPrice = Math.max(config.minimumPrice, roundUpToIncrement(rawPrice, config.roundingIncrement));
  const wholesalePrice = round2(retailPrice * (1 - config.wholesaleDiscount));

  return {
    width,
    height,
    area,
    rawPrice,
    retailPrice,
    wholesalePrice,
    valid: true,
    validationMessage: null
  };
}

/**
 * Capa comercial de descuento por cantidad, separada de la fórmula de
 * tamaño (se aplica DESPUÉS del PVP, nunca se mezcla con el cálculo de área).
 * Hoy no hace nada porque `quantityDiscountMinQty` todavía no está definido
 * (ver woodStampPricingConfig) — queda preparada para cuando se defina la
 * regla de activación, sin tener que rehacer la calculadora.
 *
 * @param {number} basePrice Precio unitario (retailPrice o wholesalePrice)
 * @param {{ quantity?: number, config?: object }} options
 * @returns {{ finalPrice: number, discountApplied: boolean }}
 */
export function applyCommercialDiscounts(basePrice, { quantity = 1, config = woodStampPricingConfig } = {}) {
  const minQty = config.quantityDiscountMinQty;
  const shouldApply = typeof minQty === 'number' && quantity >= minQty;
  if (!shouldApply) {
    return { finalPrice: round2(basePrice), discountApplied: false };
  }
  return { finalPrice: round2(basePrice * (1 - config.quantityDiscount)), discountApplied: true };
}
