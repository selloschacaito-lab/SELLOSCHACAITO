import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { firestoreDB } from '../firebase/config';
import { collection, doc, writeBatch, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { X, Search, Plus, Trash2, Truck, ShoppingCart, History } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProfile } from '../contexts/ProfileContext';
import { calculatePurchaseOrder } from '../utils/purchaseOrderUtils';

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Modal para registrar una compra de inventario (uno o varios productos a la
// vez), calculando el IVA y repartiendo el costo del envío entre todas las
// unidades compradas. Al guardar: sube el stock de cada producto (igual que
// el flujo "Compra nueva" que ya existe) y actualiza su costo con el valor
// ya calculado (sin IVA + porción de envío). También deja historial en
// `purchase_orders` para poder revisar compras anteriores.
export default function PurchaseOrderModal({ products, onClose }) {
  const { activeProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('nueva'); // 'nueva' | 'historial'

  // --- Datos de la orden de compra ---
  const [proveedor, setProveedor] = useState('');
  const [ivaMode, setIvaMode] = useState('sin_iva'); // 'sin_iva' | 'con_iva'
  const [ivaPercent, setIvaPercent] = useState('16');
  const [shippingTotal, setShippingTotal] = useState('');
  const [items, setItems] = useState([]); // { productId, productName, quantity, unitPriceEntered }
  const [productSearch, setProductSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- Historial ---
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (activeTab !== 'historial') return;
    const q = query(collection(firestoreDB, 'purchase_orders'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingHistory(false);
    }, (err) => {
      console.error(err);
      setLoadingHistory(false);
    });
    return () => unsub();
  }, [activeTab]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return [];
    return products
      .filter(p => (p.nombre || '').toLowerCase().includes(q))
      .filter(p => !items.some(it => it.productId === p.id))
      .slice(0, 8);
  }, [products, productSearch, items]);

  const addItem = (product) => {
    setItems(prev => [...prev, { productId: product.id, productName: product.nombre, quantity: 1, unitPriceEntered: '' }]);
    setProductSearch('');
  };

  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const computed = useMemo(
    () => calculatePurchaseOrder(items, {
      shippingTotal: Number(shippingTotal) || 0,
      ivaMode,
      ivaPercent: Number(ivaPercent) || 16
    }),
    [items, shippingTotal, ivaMode, ivaPercent]
  );

  const canSave = items.length > 0 &&
    items.every(it => Number(it.quantity) > 0 && Number(it.unitPriceEntered) > 0);

  const handleSave = async () => {
    if (!canSave) {
      toast.error('Agrega al menos un producto con cantidad y precio válidos');
      return;
    }
    setIsSaving(true);
    try {
      const batch = writeBatch(firestoreDB);
      const nowISO = new Date().toISOString();
      const orderRef = doc(collection(firestoreDB, 'purchase_orders'));

      batch.set(orderRef, {
        proveedor: proveedor.trim() || null,
        ivaMode,
        ivaPercent: Number(ivaPercent) || 16,
        shippingTotal: Number(shippingTotal) || 0,
        totalUnits: computed.totalUnits,
        subtotalSinIva: computed.subtotalSinIva,
        grandTotal: computed.grandTotal,
        items: computed.items.map(it => ({
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          unitPriceEntered: Number(it.unitPriceEntered) || 0,
          unitCostSinIva: it.unitCostSinIva,
          unitCostFinal: it.unitCostFinal,
          lineTotal: it.lineTotal
        })),
        createdAt: nowISO,
        createdBy: activeProfile?.name || 'Desconocido'
      });

      for (const it of computed.items) {
        const product = products.find(p => p.id === it.productId);
        if (!product) continue;
        const currentQty = product.cantidad ?? 0;
        const newQty = currentQty + it.quantity;

        const prodRef = doc(firestoreDB, 'products', it.productId);
        batch.update(prodRef, { cantidad: newQty, costo: it.unitCostFinal });

        const movRef = doc(collection(firestoreDB, 'inventory_movements'));
        batch.set(movRef, {
          producto_id: it.productId,
          producto_nombre: it.productName,
          tipo: 'add',
          cantidad: it.quantity,
          stock_anterior: currentQty,
          stock_nuevo: newQty,
          motivo: 'Compra nueva',
          motivoEntrada: 'Compra nueva',
          ordenCompraId: orderRef.id,
          costoUnitario: it.unitCostFinal,
          fecha: nowISO
        });
      }

      await batch.commit();
      toast.success('Compra registrada: stock y costos actualizados');
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error al registrar la compra');
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
    <div style={{
      background: '#ffffff', width: '100%', maxWidth: '820px', height: '90vh', maxHeight: '820px',
      borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
      boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 22px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#ecfdf5', color: '#10b981', borderRadius: '10px', padding: '8px', display: 'flex' }}>
            <ShoppingCart size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>Orden de Compra</h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>IVA, envío y actualización de costos en un solo lugar</p>
          </div>
        </div>
        <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', padding: '14px 22px 0' }}>
        <button
          type="button"
          onClick={() => setActiveTab('nueva')}
          style={tabBtnStyle(activeTab === 'nueva')}
        >
          <Plus size={15} /> Nueva Compra
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('historial')}
          style={tabBtnStyle(activeTab === 'historial')}
        >
          <History size={15} /> Historial
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
        {activeTab === 'nueva' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Datos generales */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={labelStyle}>Proveedor (opcional)</label>
                <input
                  type="text"
                  value={proveedor}
                  onChange={e => setProveedor(e.target.value)}
                  placeholder="Nombre del proveedor"
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: '0 0 200px' }}>
                <label style={labelStyle}>El precio que voy a ingresar es:</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => setIvaMode('sin_iva')} style={toggleBtnStyle(ivaMode === 'sin_iva')}>Sin IVA</button>
                  <button type="button" onClick={() => setIvaMode('con_iva')} style={toggleBtnStyle(ivaMode === 'con_iva')}>Con IVA</button>
                </div>
              </div>
              {ivaMode === 'con_iva' && (
                <div style={{ flex: '0 0 90px' }}>
                  <label style={labelStyle}>IVA %</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={ivaPercent}
                    onChange={e => setIvaPercent(e.target.value.replace(/[^\d.]/g, ''))}
                    style={inputStyle}
                  />
                </div>
              )}
              <div style={{ flex: '0 0 140px' }}>
                <label style={labelStyle}><Truck size={12} style={{ verticalAlign: '-2px' }} /> Envío total ($)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={shippingTotal}
                  onChange={e => setShippingTotal(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Buscador de productos */}
            <div style={{ position: 'relative' }}>
              <label style={labelStyle}>Agregar producto</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0 12px', height: '42px' }}>
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Buscar producto por nombre..."
                  style={{ border: 'none', outline: 'none', flex: 1, marginLeft: '8px', fontSize: '13.5px' }}
                />
              </div>
              {filteredProducts.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px',
                  marginTop: '4px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', maxHeight: '220px', overflowY: 'auto'
                }}>
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addItem(p)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', width: '100%',
                        padding: '10px 14px', border: 'none', background: 'transparent',
                        cursor: 'pointer', fontSize: '13px', textAlign: 'left', borderBottom: '1px solid #f1f5f9'
                      }}
                    >
                      <span>{p.nombre}</span>
                      <span style={{ color: '#94a3b8' }}>Stock: {p.cantidad ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabla de renglones */}
            {computed.items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px', border: '1px dashed #e2e8f0', borderRadius: '10px' }}>
                Busca y agrega los productos que llegaron en esta compra.
              </div>
            ) : (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={thStyle}>Producto</th>
                      <th style={thStyle}>Cant.</th>
                      <th style={thStyle}>Precio unit. ({ivaMode === 'con_iva' ? 'con IVA' : 'sin IVA'})</th>
                      <th style={thStyle}>Envío/u.</th>
                      <th style={thStyle}>Costo final</th>
                      <th style={thStyle}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {computed.items.map((it, index) => (
                      <tr key={it.productId} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={tdStyle}>{it.productName}</td>
                        <td style={tdStyle}>
                          <input
                            type="text" inputMode="numeric"
                            value={items[index].quantity}
                            onChange={e => updateItem(index, 'quantity', e.target.value.replace(/[^\d]/g, ''))}
                            style={miniInputStyle}
                          />
                        </td>
                        <td style={tdStyle}>
                          <input
                            type="text" inputMode="decimal"
                            value={items[index].unitPriceEntered}
                            onChange={e => updateItem(index, 'unitPriceEntered', e.target.value.replace(/[^\d.]/g, ''))}
                            placeholder="0.00"
                            style={miniInputStyle}
                          />
                        </td>
                        <td style={tdStyle}>${fmt(it.unitCostFinal - it.unitCostSinIva)}</td>
                        <td style={{ ...tdStyle, fontWeight: 800, color: '#0f172a' }}>${fmt(it.unitCostFinal)}</td>
                        <td style={tdStyle}>
                          <button type="button" onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {computed.items.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', padding: '10px 4px', fontSize: '13px', color: '#334155' }}>
                <span>Unidades totales: <strong>{computed.totalUnits}</strong></span>
                <span>Total de la compra: <strong>${fmt(computed.grandTotal)}</strong></span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loadingHistory ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Cargando historial...</p>
            ) : history.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Todavía no has registrado ninguna compra.</p>
            ) : (
              history.map(order => (
                <div key={order.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(prev => prev === order.id ? null : order.id)}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', background: '#f8fafc', border: 'none', cursor: 'pointer', textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                        {order.proveedor || 'Proveedor no especificado'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleString('es-VE') : ''} · {(order.items || []).length} producto(s) · {order.createdBy}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>${fmt(order.grandTotal)}</div>
                  </button>
                  {expandedOrderId === order.id && (
                    <div style={{ padding: '10px 16px', fontSize: '12.5px' }}>
                      <div style={{ marginBottom: '8px', color: '#64748b' }}>
                        IVA: {order.ivaMode === 'con_iva' ? `Con IVA (${order.ivaPercent}%)` : 'Sin IVA'} · Envío total: ${fmt(order.shippingTotal)}
                      </div>
                      {(order.items || []).map((it, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                          <span>{it.productName} × {it.quantity}</span>
                          <span>${fmt(it.unitCostFinal)}/u.</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {activeTab === 'nueva' && (
        <div style={{ padding: '16px 22px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={secondaryBtnStyle}>Cancelar</button>
          <button onClick={handleSave} disabled={!canSave || isSaving} style={primaryBtnStyle(!canSave || isSaving)}>
            {isSaving ? 'Guardando...' : 'Guardar Compra'}
          </button>
        </div>
      )}
    </div>
    </div>,
    document.body
  );
}

const closeBtnStyle = {
  background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '34px', height: '34px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
};

const tabBtnStyle = (active) => ({
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 14px', borderRadius: '9px 9px 0 0', border: 'none',
  background: active ? '#ffffff' : 'transparent',
  color: active ? '#0f172a' : '#94a3b8',
  fontWeight: 800, fontSize: '12.5px', cursor: 'pointer',
  borderBottom: active ? '2px solid #10b981' : '2px solid transparent'
});

const labelStyle = { display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#64748b', marginBottom: '4px' };

const inputStyle = {
  width: '100%', height: '42px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
  padding: '0 12px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box'
};

const miniInputStyle = {
  width: '70px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '8px',
  padding: '0 8px', fontSize: '12.5px', outline: 'none'
};

const toggleBtnStyle = (active) => ({
  flex: 1, padding: '10px 8px', borderRadius: '8px', border: '1px solid #e2e8f0',
  background: active ? '#10b981' : '#ffffff', color: active ? '#ffffff' : '#64748b',
  fontWeight: 700, fontSize: '12px', cursor: 'pointer'
});

const thStyle = { textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 700 };
const tdStyle = { padding: '8px 12px', color: '#334155' };

const secondaryBtnStyle = {
  padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff',
  color: '#334155', fontWeight: 800, fontSize: '13px', cursor: 'pointer'
};

const primaryBtnStyle = (disabled) => ({
  padding: '10px 20px', borderRadius: '10px', border: 'none',
  background: disabled ? '#a7f3d0' : '#10b981', color: '#ffffff',
  fontWeight: 800, fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer'
});
