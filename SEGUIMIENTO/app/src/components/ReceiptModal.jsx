import React from 'react';
import { X, Printer } from 'lucide-react';
import { createPortal } from 'react-dom';

function ReceiptModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content').innerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo - Sellos Chacaito</title>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              padding: 0; 
              margin: 0; 
              color: black; 
              background: white; 
              width: 100%;
              max-width: 300px; /* Thermal printer width */
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const total = order.totalAmount || 0;
  const pagos = order.pagos || [];
  const totalPagado = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);
  const pendiente = Math.max(0, total - totalPagado);

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 300 }}>
      {/* Modal estandar, la impresion se maneja en ventana aparte */}
      
      <div className="modal-content" style={{ maxWidth: '400px', background: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', flexDirection: 'column' }}>
        
        <div className="modal-header no-print">
          <h2 className="modal-title">Recibo Digital</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          <div id="receipt-content" style={{ padding: '2rem', background: 'white', color: 'black', fontFamily: 'monospace' }}>
            
            {/* Header del recibo */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>SELLOS CHACAITO</h2>
              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>El arte de sellar con estilo</p>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Fecha: {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>

            {/* Datos del Cliente */}
            <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <p style={{ margin: '0.25rem 0' }}><strong>Cliente:</strong> {order.clientName}</p>
              {order.whatsapp && <p style={{ margin: '0.25rem 0' }}><strong>Tlf:</strong> {order.whatsapp}</p>}
            </div>

            {/* Ítems */}
            <table style={{ width: '100%', marginBottom: '1.5rem', fontSize: '0.9rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #cbd5e1' }}>
                  <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>Cant. / Artículo</th>
                  <th style={{ textAlign: 'right', paddingBottom: '0.5rem' }}>Precio</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ paddingTop: '0.5rem' }}>
                      {item.quantity}x {item.name}
                    </td>
                    <td style={{ textAlign: 'right', paddingTop: '0.5rem' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '1rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Subtotal (Base):</span>
                <span>${(order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0).toFixed(2)}</span>
              </div>
              
              {/* Si es mayorista, aplicar lógica oculta de descuento */}
              {order.isWholesale && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#16a34a' }}>
                  <span>Ajuste Especial:</span>
                  <span>Aplicado</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 800 }}>
                <span>TOTAL:</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {totalPagado > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', color: '#64748b' }}>
                  <span>Abonado:</span>
                  <span>${totalPagado.toFixed(2)}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontWeight: 700, color: pendiente === 0 ? '#16a34a' : '#000' }}>
                <span>RESTANTE:</span>
                <span>${pendiente.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem', color: '#64748b' }}>
              <p style={{ margin: 0 }}>¡Gracias por tu compra!</p>
              <p style={{ margin: '0.25rem 0' }}>Conserve este recibo para retiros.</p>
            </div>
          </div>
        </div>

        <div className="modal-footer no-print" style={{ justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={onClose} style={{ width: '48%' }}>Cerrar</button>
          <button className="btn-primary" onClick={handlePrint} style={{ width: '48%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Printer size={16} /> Imprimir Recibo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ReceiptModal;
