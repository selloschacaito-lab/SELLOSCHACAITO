import * as XLSX from 'xlsx';

// Fila por producto para la hoja de Excel de inventario.
// includeCountColumns agrega 'Contado' y 'Nuevo en Conteo', relevantes cuando hay
// (o hubo) un conteo físico en curso — ver Inventory.jsx (modo de conteo).
export function buildInventorySheet(products, { includeCountColumns = false } = {}) {
  return products.map(p => {
    const costo = Number(p.costo || 0);
    const cantidad = Number(p.cantidad || 0);

    const row = {
      'Código': p.codigo || '',
      'Producto': (p.nombre || p.name || '').toUpperCase(),
      'Categoría': (p.categoria || 'GENERAL').toUpperCase(),
      'Cantidad': cantidad,
      'Cantidad 2': '',
      'Costo USD ($)': costo,
      'Precio Detal USD ($)': Number(p.precio || p.precioVenta || 0),
      'Precio Mayorista USD ($)': Number(p.precioMayorista || 0),
      'Stock Mínimo': Number(p.minStock || 5),
      'Activo en Mostrador': p.activo !== false ? 'SÍ' : 'NO',
      'Valor Total (Costo x Cantidad)': Number((costo * cantidad).toFixed(2))
    };

    if (includeCountColumns) {
      row['Contado'] = p.contadoEnConteoActual ? 'SÍ' : 'NO';
      row['Nuevo en Conteo'] = p.esNuevoEnConteo ? 'SÍ' : 'NO';
    }

    return row;
  });
}

export function downloadInventoryExcel(products, filename, options) {
  const wb = XLSX.utils.book_new();
  const rows = buildInventorySheet(products, options);
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario y Precios');
  XLSX.writeFile(wb, filename);
}
