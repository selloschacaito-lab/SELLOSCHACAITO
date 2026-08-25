import React, { useState, useEffect } from 'react';
import { db, firestoreDB } from '../firebase/config';
import { collection, onSnapshot, doc, updateDoc, addDoc, writeBatch } from 'firebase/firestore';
import { Package, Search, ArrowUpCircle, ArrowDownCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';

function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [actionType, setActionType] = useState('add'); // 'add' | 'subtract'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const unsubProd = onSnapshot(collection(firestoreDB, 'products'), (snapshot) => {
      const prodData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(p => p.tipo === 'Producto' && p.activo); // Solo productos activos (ignorar servicios)
      
      prodData.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setProducts(prodData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error('Error al cargar inventario');
      setLoading(false);
    });

    return () => unsubProd();
  }, []);

  function handleOpenModal(product, type) {
    setSelectedProduct(product);
    setActionType(type);
    setQuantity('');
    setReason('');
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    
    if (isNaN(qty) || qty <= 0) {
      toast.error('Ingresa una cantidad válida mayor a 0');
      return;
    }

    try {
      const prodRef = doc(firestoreDB, 'products', selectedProduct.id);
      
      const currentQty = selectedProduct.cantidad || 0;
      let newQty = currentQty;

      if (actionType === 'add') {
        newQty = currentQty + qty;
      } else if (actionType === 'subtract') {
        if (currentQty < qty) {
          toast.error('No hay suficiente stock para restar esa cantidad');
          return;
        }
        newQty = currentQty - qty;
      }

      // Optimistic UI close
      setShowModal(false);

      const batch = writeBatch(firestoreDB);
      
      // 1. Actualizar producto
      batch.update(prodRef, { cantidad: newQty });

      // 2. Registrar movimiento en historial
      const movRef = doc(collection(firestoreDB, 'inventory_movements'));
      batch.set(movRef, {
        producto_id: selectedProduct.id,
        producto_nombre: selectedProduct.nombre,
        tipo: actionType,
        cantidad: qty,
        stock_anterior: currentQty,
        stock_nuevo: newQty,
        motivo: reason.trim() || 'Ajuste manual',
        fecha: new Date().toISOString()
      });

      await batch.commit();
      toast.success('Inventario actualizado exitosamente');
    } catch (error) {
      console.error(error);
      toast.error(`Error: ${error.message || 'Error inesperado'}`);
    }
  }

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Remove blocking loading screen

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Control de Inventario</h2>
        <p style={{ color: 'var(--text-muted)' }}>Visualiza el stock actual y registra entradas o salidas.</p>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="search-box" style={{ flex: 1, margin: 0 }}>
          <Search className="search-icon" size={16} />
          <input 
            type="search" 
            placeholder="Buscar producto..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Cargando inventario...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron productos en inventario.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-strong)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Producto</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', textAlign: 'center' }}>Stock Actual</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', textAlign: 'right' }}>Ajustar Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(item => {
                  const isLowStock = item.cantidad < 5;
                  
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-strong)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {item.nombre}
                          {isLowStock && (
                            <span title="Stock bajo" style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                              <AlertTriangle size={14} />
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <span style={{ 
                          fontWeight: 'bold', 
                          fontSize: '1.25rem',
                          color: isLowStock ? '#ef4444' : 'var(--text-main)',
                          background: isLowStock ? '#fef2f2' : 'rgba(255,255,255,0.5)',
                          padding: '0.25rem 1rem',
                          borderRadius: '0.5rem',
                          border: isLowStock ? '1px solid #fee2e2' : '1px solid var(--border)'
                        }}>
                          {item.cantidad || 0}
                        </span>
                      </td>
                      
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleOpenModal(item, 'add')} 
                            className="btn-secondary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a' }}
                            title="Registrar Entrada"
                          >
                            <ArrowUpCircle size={16} /> Entrada
                          </button>
                          <button 
                            onClick={() => handleOpenModal(item, 'subtract')} 
                            className="btn-secondary" 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#dc2626' }}
                            title="Registrar Salida"
                          >
                            <ArrowDownCircle size={16} /> Salida
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selectedProduct && createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {actionType === 'add' ? 'Registrar Entrada' : 'Registrar Salida'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--border-strong)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Producto</p>
                <p style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>{selectedProduct.nombre}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-strong)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Stock actual:</span>
                  <span style={{ fontWeight: 'bold' }}>{selectedProduct.cantidad || 0}</span>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Cantidad a {actionType === 'add' ? 'agregar' : 'restar'} *</label>
                <input 
                  type="number" 
                  min="1"
                  className="input-field" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ej. 10"
                  autoFocus
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">Motivo (Opcional)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={reason}
                  onChange={(e) => setReason(e.target.value.toUpperCase())}
                  placeholder={actionType === 'add' ? "EJ. COMPRA A PROVEEDOR" : "EJ. PRODUCTO DAÑADO"}
                />
              </div>

              <div className="modal-footer" style={{ padding: '1rem 0 0', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ border: 'none' }}>Cancelar</button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ margin: 0, width: 'auto', background: actionType === 'add' ? '#16a34a' : '#dc2626' }}
                >
                  Confirmar {actionType === 'add' ? 'Entrada' : 'Salida'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Inventory;
