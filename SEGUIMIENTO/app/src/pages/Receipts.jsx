import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { Search, Receipt, Calendar, User } from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal';

function Receipts() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const ordersRef = ref(db, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert to array and sort by date descending
        const ordersList = Object.entries(data).map(([id, val]) => ({
          id,
          ...val
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(ordersList);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = orders.filter(o => {
    const search = searchTerm.toLowerCase();
    const clientName = (o.clientName || '').toLowerCase();
    const orderId = (o.id || '').toLowerCase();
    return clientName.includes(search) || orderId.includes(search);
  });

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Historial de Recibos</h2>
          <p style={{ color: 'var(--text-muted)' }}>Busca y reimprime recibos de cualquier pedido histórico.</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="search-box" style={{ flex: 1, margin: 0 }}>
          <Search className="search-icon" size={16} />
          <input 
            type="search" 
            placeholder="Buscar por cliente o ID de pedido..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Cargando historial...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron pedidos.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-strong)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Fecha</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Cliente</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Monto Total</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Estado</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  // Calcular pendiente
                  const totalPagado = (order.pagos || []).reduce((sum, pago) => sum + parseFloat(pago.monto), 0);
                  const pendiente = Math.max(0, (order.totalAmount || 0) - totalPagado);
                  const statusLabel = order.status === 'entregado' ? 'Archivado' : 'Activo';

                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-strong)' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                          <Calendar size={14} />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <User size={14} color="var(--text-muted)" />
                          {order.clientName}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>
                        ${(order.totalAmount || 0).toFixed(2)}
                        {pendiente > 0 && <span style={{ display: 'block', fontSize: '0.75rem', color: '#dc2626', fontWeight: 'normal' }}>Debe: ${pendiente.toFixed(2)}</span>}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '1rem',
                          background: order.status === 'entregado' ? '#f1f5f9' : '#dbeafe',
                          color: order.status === 'entregado' ? '#64748b' : '#1d4ed8',
                          fontWeight: 'bold'
                        }}>
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => setSelectedOrder(order)} 
                          className="btn-secondary" 
                          style={{ margin: 0, padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <Receipt size={16} /> Ver Recibo
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reutilizamos el ReceiptModal */}
      {selectedOrder && (
        <ReceiptModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
}

export default Receipts;
