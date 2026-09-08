import { describe, it, expect } from 'vitest';
import { calculateWoodStampPrice, roundUpToIncrement, woodStampPricingConfig } from './woodStampPricing';

describe('roundUpToIncrement', () => {
  it('redondea hacia arriba al siguiente múltiplo de 0.50', () => {
    expect(roundUpToIncrement(18.01, 0.5)).toBe(18.5);
    expect(roundUpToIncrement(18.24, 0.5)).toBe(18.5);
    expect(roundUpToIncrement(18.50, 0.5)).toBe(18.5);
    expect(roundUpToIncrement(18.51, 0.5)).toBe(19.0);
    expect(roundUpToIncrement(19.00, 0.5)).toBe(19.0);
  });
});

describe('calculateWoodStampPrice — medidas de referencia (sección 14 del pedido)', () => {
  // Nota: estos valores son referencias de control (según el propio pedido),
  // no precios hardcodeados de la fórmula. Se verifica cada uno contra el
  // resultado real de calculateWoodStampPrice.
  const casos = [
    { w: 5, h: 5 },
    { w: 10, h: 5 },
    { w: 10, h: 10 },
    { w: 15, h: 10 },
    { w: 15, h: 12 },
    { w: 18, h: 14 },
    { w: 20, h: 14 }
  ];

  it.each(casos)('$w×$h cm da un resultado válido y coherente con la fórmula', ({ w, h }) => {
    const r = calculateWoodStampPrice(w, h);
    expect(r.valid).toBe(true);
    expect(r.area).toBe(w * h);

    const rawPriceEsperado = woodStampPricingConfig.referencePrice *
      Math.pow((w * h) / woodStampPricingConfig.referenceArea, woodStampPricingConfig.exponent);
    expect(r.rawPrice).toBeCloseTo(rawPriceEsperado, 6);

    const retailEsperado = Math.max(
      woodStampPricingConfig.minimumPrice,
      roundUpToIncrement(rawPriceEsperado, woodStampPricingConfig.roundingIncrement)
    );
    expect(r.retailPrice).toBeCloseTo(retailEsperado, 2);

    const wholesaleEsperado = parseFloat((retailEsperado * (1 - woodStampPricingConfig.wholesaleDiscount)).toFixed(2));
    expect(r.wholesalePrice).toBeCloseTo(wholesaleEsperado, 2);
  });

  it('5×5 da exactamente el precio mínimo ($12)', () => {
    const r = calculateWoodStampPrice(5, 5);
    expect(r.retailPrice).toBe(12);
  });
});

describe('calculateWoodStampPrice — reglas de negocio', () => {
  it('nunca devuelve un PVP menor al precio mínimo configurado', () => {
    for (let area = 1; area <= 20 * 14; area++) {
      // recorre varias combinaciones válidas de ancho/alto pequeñas
      const w = Math.max(1, Math.min(20, Math.round(Math.sqrt(area))));
      const h = Math.max(1, Math.min(14, Math.round(area / w)));
      if (w * h === 0) continue;
      const r = calculateWoodStampPrice(w, h);
      if (r.valid) {
        expect(r.retailPrice).toBeGreaterThanOrEqual(woodStampPricingConfig.minimumPrice);
      }
    }
  });

  it('el precio aumenta progresivamente cuando aumenta el área (sin saltos hacia abajo)', () => {
    const anchos = [5, 6, 8, 10, 12, 15, 18, 20];
    let anterior = -Infinity;
    for (const w of anchos) {
      const r = calculateWoodStampPrice(w, 5);
      expect(r.valid).toBe(true);
      expect(r.rawPrice).toBeGreaterThan(anterior);
      anterior = r.rawPrice;
    }
  });

  it('el precio mayorista siempre se calcula sobre el PVP ya redondeado, no sobre el precio crudo', () => {
    const r = calculateWoodStampPrice(15, 12);
    const esperado = parseFloat((r.retailPrice * (1 - woodStampPricingConfig.wholesaleDiscount)).toFixed(2));
    expect(r.wholesalePrice).toBe(esperado);
    // Confirma que NO se calculó sobre rawPrice (serían números distintos salvo coincidencia)
    const sobreCrudo = parseFloat((r.rawPrice * (1 - woodStampPricingConfig.wholesaleDiscount)).toFixed(2));
    expect(r.wholesalePrice).not.toBe(sobreCrudo);
  });

  it('20×14 y 14×20 (misma medida, orientación invertida) dan exactamente el mismo resultado', () => {
    const a = calculateWoodStampPrice(20, 14);
    const b = calculateWoodStampPrice(14, 20);
    expect(a.valid).toBe(true);
    expect(b.valid).toBe(true);
    expect(a.area).toBe(b.area);
    expect(a.rawPrice).toBe(b.rawPrice);
    expect(a.retailPrice).toBe(b.retailPrice);
    expect(a.wholesalePrice).toBe(b.wholesalePrice);
  });
});

describe('calculateWoodStampPrice — validaciones', () => {
  it('rechaza un tamaño inferior a 5×5 con un precio mínimo, no con una fórmula especial', () => {
    // El pedido dice: si el área es menor a 25 cm², no crear fórmula especial;
    // la fórmula normal + el piso de $12 ya lo resuelve.
    const r = calculateWoodStampPrice(3, 3);
    expect(r.valid).toBe(true);
    expect(r.retailPrice).toBe(12);
  });

  it('rechaza dimensiones decimales', () => {
    const r = calculateWoodStampPrice(10.5, 8);
    expect(r.valid).toBe(false);
    expect(r.validationMessage).toMatch(/enteros/i);
  });

  it('rechaza dimensiones negativas', () => {
    const r = calculateWoodStampPrice(-5, 5);
    expect(r.valid).toBe(false);
    expect(r.validationMessage).toMatch(/positivos/i);
  });

  it('rechaza cero', () => {
    const r = calculateWoodStampPrice(0, 5);
    expect(r.valid).toBe(false);
    expect(r.validationMessage).toMatch(/positivos/i);
  });

  it('rechaza una medida superior a 20×14 (en cualquier orientación)', () => {
    const r1 = calculateWoodStampPrice(21, 10);
    expect(r1.valid).toBe(false);
    expect(r1.validationMessage).toMatch(/20 × 14/);

    const r2 = calculateWoodStampPrice(20, 15);
    expect(r2.valid).toBe(false);

    const r3 = calculateWoodStampPrice(10, 21); // invertido
    expect(r3.valid).toBe(false);
  });

  it('rechaza 15×15 por superar el lado menor máximo de 14 cm (confirmado con Álvaro: no es una medida válida)', () => {
    const r = calculateWoodStampPrice(15, 15);
    expect(r.valid).toBe(false);
    expect(r.validationMessage).toMatch(/20 × 14/);
  });
});
