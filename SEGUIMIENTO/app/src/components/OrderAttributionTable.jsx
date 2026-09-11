import React from 'react';

// Tabla "Etapa / Quién" reutilizada en OrderModal.jsx y SaleDetailModal.jsx
// para mostrar de un vistazo quién hizo cada parte de un pedido (venta,
// producción, facturación, entrega). Las etapas sin dato no se muestran.
export default function OrderAttributionTable({ order }) {
  const rows = [
    { etapa: 'Vendió / Diseñó', quien: order.designer || order.vendedor || order.createdBy, bold: true },
    { etapa: 'Inició producción', quien: order.productionStartedBy, bold: true },
    { etapa: 'Terminó', quien: order.finishedBy, bold: true },
    {
      etapa: 'Facturó',
      quien: order.invoicedBy
        ? `${order.invoicedBy}${order.invoiceNumber ? ` (factura #${order.invoiceNumber})` : ''}`
        : null,
      bold: true
    },
    {
      etapa: 'Entrega',
      quien: order.deliveryInfo?.pickedUpBy === 'client' ? 'Cliente lo retiró (pickup)' : order.deliveredBy,
      bold: false
    }
  ].filter(r => r.quien);

  if (rows.length === 0) return null;

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ textAlign: 'left', padding: '9px 14px', color: '#64748b', fontWeight: 700 }}>Etapa</th>
            <th style={{ textAlign: 'left', padding: '9px 14px', color: '#64748b', fontWeight: 700 }}>Quién</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.etapa} style={{ background: i % 2 === 1 ? '#fafafa' : '#ffffff', borderTop: '1px solid #f1f5f9' }}>
              <td style={{ padding: '8px 14px', color: '#334155' }}>{r.etapa}</td>
              <td style={{ padding: '8px 14px', color: '#0f172a', fontWeight: r.bold ? 700 : 500 }}>{r.quien}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
