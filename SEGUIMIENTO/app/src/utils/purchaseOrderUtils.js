// Lógica de cálculo para "Registrar Orden de Compra" en Inventario & Precios.
// Separa el cálculo (IVA + reparto de envío) de la interfaz del modal, para
// poder auditar o ajustar la fórmula sin tocar el componente visual.

/**
 * Calcula el costo unitario final (sin IVA + porción de envío) de cada línea
 * de una orden de compra.
 *
 * - El envío se reparte por CANTIDAD DE UNIDADES entre todos los renglones
 *   de la orden (no por valor) — ej. $10 de envío ÷ 20 unidades = $0.50/unidad,
 *   sin importar si esas 20 unidades son de un producto o de varios distintos.
 * - El costo que se guarda como "costo" del producto siempre queda SIN IVA
 *   (igual que el campo "Costo del Sello (Sin IVA)" ya usado en Costos y Precios),
 *   independientemente de si el proveedor facturó con o sin IVA.
 *
 * @param {Array<{productId:string, productName:string, quantity:number, unitPriceEntered:number}>} items
 * @param {{ shippingTotal?: number, ivaMode?: 'con_iva'|'sin_iva', ivaPercent?: number }} options
 * @returns {{ items: Array, totalUnits: number, shippingPerUnit: number, subtotalSinIva: number, grandTotal: number }}
 */
export function calculatePurchaseOrder(items, { shippingTotal = 0, ivaMode = 'sin_iva', ivaPercent = 16 } = {}) {
  const totalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  const shippingPerUnit = totalUnits > 0 ? shippingTotal / totalUnits : 0;

  const computedItems = items.map(it => {
    const quantity = Number(it.quantity) || 0;
    const enteredPrice = Number(it.unitPriceEntered) || 0;
    const unitCostSinIva = ivaMode === 'con_iva' ? enteredPrice / (1 + ivaPercent / 100) : enteredPrice;
    const unitCostFinal = unitCostSinIva + shippingPerUnit;
    const lineTotal = unitCostFinal * quantity;
    return { ...it, quantity, unitCostSinIva, unitCostFinal, lineTotal };
  });

  const subtotalSinIva = computedItems.reduce((sum, it) => sum + (it.unitCostSinIva * it.quantity), 0);
  const grandTotal = computedItems.reduce((sum, it) => sum + it.lineTotal, 0);

  return { items: computedItems, totalUnits, shippingPerUnit, subtotalSinIva, grandTotal };
}
