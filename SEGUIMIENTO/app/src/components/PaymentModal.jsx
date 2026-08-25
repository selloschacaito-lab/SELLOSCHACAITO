import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase/config';
import { createPortal } from 'react-dom';

function PaymentModal({ order, onClose }) {
  const total = order.totalAmount || 0;
  const pagos = order.pagos || [];
  const totalPagado = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);
  const pendiente = Math.max(0, total - totalPagado);

  const [formData, setFormData] = useState({
    monto: pendiente > 0 ? pendiente.toString() : '',
    metodo: 'Pago Móvil',
    referencia: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const monto = parseFloat(formData.monto);
    if (isNaN(monto) || monto <= 0) {
      alert("Ingrese un monto válido mayor a 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const nuevoPago = {
        monto: monto,
        metodo: formData.metodo,
        referencia: formData.referencia,
        fecha: new Date().toISOString()
      };

      const nuevosPagos = [...pagos, nuevoPago];

      await update(ref(db, `orders/${order.id}`), {
        pagos: nuevosPagos,
        updatedAt: new Date().toISOString()
      });

      onClose();
    } catch (error) {
      console.error("Error al registrar pago:", error);
      alert("Error al registrar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 200 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', background: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div className="modal-header">
          <h2 className="modal-title">Registrar Pago</h2>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total del Pedido</span>
                <span style={{ fontWeight: 600 }}>${total.toFixed(2)}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Restante por pagar</span>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>${pendiente.toFixed(2)}</span>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Monto Abonado ($) *</label>
              <div style={{ position: 'relative' }}>
                <DollarSign size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.875rem', color: '#94a3b8' }} />
                <input 
                  className="input-field" 
                  style={{ paddingLeft: '2rem' }}
                  type="number" 
                  step="0.01"
                  min="0.01"
                  max={pendiente > 0 ? pendiente : undefined}
                  value={formData.monto} 
                  onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value }))} 
                  required 
                  autoFocus
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Método de Pago *</label>
              <select 
                className="input-field" 
                value={formData.metodo} 
                onChange={(e) => setFormData(prev => ({ ...prev, metodo: e.target.value }))} 
                required
              >
                <option value="Pago Móvil">Pago Móvil</option>
                <option value="Zelle">Zelle</option>
                <option value="Efectivo">Efectivo ($)</option>
                <option value="Transferencia">Transferencia (Bs)</option>
                <option value="Binance">Binance</option>
                <option value="Punto de Venta">Punto de Venta</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Referencia (Opcional)</label>
              <input 
                className="input-field" 
                type="text" 
                placeholder="Ej. 1234 o nombre del titular" 
                value={formData.referencia} 
                onChange={(e) => setFormData(prev => ({ ...prev, referencia: e.target.value.toUpperCase() }))} 
              />
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose} 
              disabled={isSubmitting}
              style={{ border: 'none' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: 'auto', margin: 0 }} 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : 'Confirmar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default PaymentModal;
