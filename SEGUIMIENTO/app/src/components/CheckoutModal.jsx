import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Printer, CreditCard } from 'lucide-react';
import { createPortal } from 'react-dom';
import { normalizeWhatsApp } from '../utils/formatters';
import { firestoreDB as firestore, db } from '../firebase/config';
import { collection, getDocs, query, doc, setDoc, updateDoc, getDoc, serverTimestamp, runTransaction, onSnapshot, where, limit } from 'firebase/firestore';
import { ref, update } from 'firebase/database';

function CheckoutModal({ order, onClose, onComplete }) {
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  
  const [searchProduct, setSearchProduct] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [searchClient, setSearchClient] = useState(order?.clientName || '');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);

  const [formData, setFormData] = useState({
    clientName: order?.clientName || '',
    cedula: order?.cedula || '',
    whatsapp: order?.whatsapp || '',
    correo: order?.correo || '',
    direccion: order?.direccion || '',
    paymentMethod: 'Pago Móvil',
    items: order?.items || [],
    isWholesale: order?.isWholesale || false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let unsubProducts;
    const fetchData = async () => {
      try {
        // Productos en tiempo real
        unsubProducts = onSnapshot(collection(firestore, 'products'), (snapshot) => {
          const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          productsData.sort((a, b) => (a.nombre || a.name || '').localeCompare(b.nombre || b.name || ''));
          setProducts(productsData);
        });

        // Remover carga masiva de clientes aquí
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };
    fetchData();

    return () => {
      if (unsubProducts) unsubProducts();
    };
  }, []);

  // Búsqueda asíncrona de clientes (igual que NewOrderModal)
  useEffect(() => {
    let timeoutId;
    async function fetchClients() {
      if (!searchClient.trim()) {
        setClients([]);
        return;
      }
      try {
        const searchUpper = searchClient.trim().toUpperCase();
        const searchExact = searchClient.trim();
        
        const qName = query(
          collection(firestore, 'clients'), 
          where('nombre', '>=', searchUpper),
          where('nombre', '<=', searchUpper + '\uf8ff'),
          limit(10)
        );
        
        const qPhone = query(
          collection(firestore, 'clients'),
          where('whatsapp', '>=', searchExact),
          where('whatsapp', '<=', searchExact + '\uf8ff'),
          limit(10)
        );

        const [snapName, snapPhone] = await Promise.all([getDocs(qName), getDocs(qPhone)]);
        
        const combined = new Map();
        snapName.docs.forEach(d => combined.set(d.id, { id: d.id, ...d.data() }));
        snapPhone.docs.forEach(d => combined.set(d.id, { id: d.id, ...d.data() }));
        
        const result = Array.from(combined.values());
        setClients(result);
      } catch (err) {
        console.error("Error buscando clientes:", err);
      }
    }
    
    // No buscar si acabo de seleccionar o si está auto-llenando y el dropdown no está visible
    if (!showClientDropdown) return;

    timeoutId = setTimeout(() => {
      fetchClients();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchClient, showClientDropdown]);

  // Autorellenar datos del cliente si el pedido ya tiene nombre pero le falta la cédula
  useEffect(() => {
    async function autoFillClientInfo() {
      if (order?.clientName && !formData.cedula) {
        try {
          const q = query(
            collection(firestore, 'clients'), 
            where('nombre', '==', order.clientName.toUpperCase()), 
            limit(1)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const clientData = snap.docs[0].data();
            setFormData(prev => ({
              ...prev,
              cedula: prev.cedula || clientData.cedula || clientData.rif || clientData.idDoc || '',
              whatsapp: prev.whatsapp || clientData.whatsapp || '',
              correo: prev.correo || clientData.correo || '',
              direccion: prev.direccion || clientData.direccion || ''
            }));
            setSelectedClientId(snap.docs[0].id);
          }
        } catch (e) {
          console.error("Error auto-rellenando cliente:", e);
        }
      }
    }
    autoFillClientInfo();
  }, [order]);

  const totalAmount = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = formData.isWholesale ? totalAmount * 0.8 : totalAmount;

  const addItem = (product) => {
    setFormData(prev => {
      const existing = prev.items.find(i => i.productId === product.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        };
      }
      return {
        ...prev,
        items: [...prev.items, { productId: product.id, name: product.name, price: product.price, quantity: 1 }]
      };
    });
    setSearchProduct('');
    setShowProductDropdown(false);
  };

  const updateItemQuantity = (productId, delta) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.productId === productId) {
          const newQ = item.quantity + delta;
          return { ...item, quantity: Math.max(1, newQ) };
        }
        return item;
      })
    }));
  };

  const removeItem = (productId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
  };

  const handleSelectClient = (client) => {
    setSelectedClientId(client.id);
    setSearchClient(client.nombre || client.name || '');
    setShowClientDropdown(false);
    setFormData(prev => ({
      ...prev,
      clientName: client.nombre || client.name || '',
      cedula: client.cedula || client.idDoc || '', // Support both field names from legacy records
      whatsapp: client.whatsapp || '',
      correo: client.correo || '',
      direccion: client.direccion || ''
    }));
  };

  const handleCustomClientName = (e) => {
    setSearchClient(e.target.value);
    setSelectedClientId(null);
    setFormData(prev => ({
      ...prev,
      clientName: e.target.value.toUpperCase()
    }));
  };

  const filteredProducts = products.filter(p => (p.nombre || p.name || '').toLowerCase().includes((searchProduct || '').toLowerCase()));
  const filteredClients = clients; // Ya están filtrados por la base de datos

  const handlePrint = (printData) => {
    // Generate receipt HTML
    let itemsHtml = printData.items.map(item => `
      <tr>
        <td style="padding-top: 0.5rem;">${item.quantity}x ${item.name}</td>
        <td style="text-align: right; padding-top: 0.5rem;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const subtotal = printData.items.reduce((s, i) => s + (i.price * i.quantity), 0);
    const adjustmentHtml = printData.isWholesale ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; color: #16a34a;">
        <span>Ajuste Especial:</span>
        <span>Aplicado</span>
      </div>
    ` : '';

    const printContent = `
      <div style="padding: 1rem; font-family: 'Courier New', Courier, monospace; color: black; background: white; max-width: 300px;">
        <div style="text-align: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 1rem; margin-bottom: 1rem;">
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 800;">SELLOS CHACAITO</h2>
          <p style="margin: 0.25rem 0; font-size: 0.85rem;">El arte de sellar con estilo</p>
          <p style="margin: 0; font-size: 0.85rem;">Fecha: ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="margin-bottom: 1.5rem; font-size: 0.9rem;">
          <p style="margin: 0.25rem 0;"><strong>Cliente:</strong> ${printData.clientName}</p>
          ${printData.cedula ? `<p style="margin: 0.25rem 0;"><strong>CI/RIF:</strong> ${printData.cedula}</p>` : ''}
          ${printData.whatsapp ? `<p style="margin: 0.25rem 0;"><strong>Tlf:</strong> ${printData.whatsapp}</p>` : ''}
          ${printData.direccion ? `<p style="margin: 0.25rem 0;"><strong>Dir:</strong> ${printData.direccion}</p>` : ''}
        </div>
        <table style="width: 100%; margin-bottom: 1.5rem; font-size: 0.9rem; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px dashed #cbd5e1;">
              <th style="text-align: left; padding-bottom: 0.5rem;">Cant. / Artículo</th>
              <th style="text-align: right; padding-bottom: 0.5rem;">Precio</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="border-top: 1px dashed #cbd5e1; padding-top: 1rem; font-size: 0.9rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
            <span>Subtotal (Base):</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          ${adjustmentHtml}
          <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 1.1rem; font-weight: 800;">
            <span>TOTAL:</span>
            <span>$${printData.totalAmount.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; color: #64748b;">
            <span>Método de Pago:</span>
            <span>${printData.paymentMethod}</span>
          </div>
        </div>
        <div style="text-align: center; margin-top: 2rem; font-size: 0.8rem; color: #64748b;">
          <p style="margin: 0;">¡Gracias por tu compra!</p>
          <p style="margin: 0.25rem 0;">Conserve este recibo.</p>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo - Sellos Chacaito</title>
          <style>body { margin: 0; padding: 0; display: flex; justify-content: center; }</style>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Prepare data
      const updatedOrderData = {
        clientName: (formData.clientName || '').toUpperCase(),
        cedula: (formData.cedula || '').toUpperCase(),
        whatsapp: normalizeWhatsApp(formData.whatsapp || ''),
        correo: (formData.correo || '').toLowerCase(),
        direccion: (formData.direccion || '').toUpperCase(),
        paymentMethod: formData.paymentMethod,
        items: formData.items,
        totalAmount: finalTotal,
      };

      // Create a payment record to auto-fulfill the order
      const newPago = {
        id: Date.now().toString(),
        monto: finalTotal,
        metodo: formData.paymentMethod,
        referencia: 'POS',
        fecha: new Date().toISOString()
      };

      const finalOrderUpdate = {
        ...updatedOrderData,
        pagos: [...(order.pagos || []), newPago]
      };

      // 2. Update/Create Client in Firestore
      if (formData.clientName) {
        const clientData = {
          name: formData.clientName,
          cedula: formData.cedula,
          whatsapp: normalizeWhatsApp(formData.whatsapp),
          correo: formData.correo,
          direccion: formData.direccion,
          updatedAt: serverTimestamp()
        };

        if (selectedClientId) {
          // Update existing
          await updateDoc(doc(firestore, 'clients', selectedClientId), clientData);
        } else {
          // Search if exists by cedula to avoid dupes
          const cedulaToCheck = formData.cedula;
          const existingClient = clients.find(c => c.cedula === cedulaToCheck);
          if (existingClient && cedulaToCheck) {
            await updateDoc(doc(firestore, 'clients', existingClient.id), clientData);
          } else {
            // Create new
            await setDoc(doc(collection(firestore, 'clients')), {
              ...clientData,
              createdAt: serverTimestamp()
            });
          }
        }
      }

      // 3. Deduct Inventory (Products) ATOMICALLY using Transactions
      await runTransaction(firestore, async (transaction) => {
        // First phase: reads
        const reads = [];
        for (const item of formData.items) {
          const prodRef = doc(firestore, 'products', item.productId);
          reads.push({
            ref: prodRef,
            snap: await transaction.get(prodRef),
            item
          });
        }

        // Second phase: writes
        for (const { ref, snap, item } of reads) {
          if (snap.exists()) {
            const data = snap.data();
            if (data.tipo === 'Producto') {
              const currentStock = data.cantidad || 0;
              const newStock = currentStock - item.quantity;
              
              // 3.1 Actualizar stock
              transaction.update(ref, { cantidad: newStock });

              // 3.2 Crear movimiento en historial de inventario
              const movRef = doc(collection(firestore, 'inventory_movements'));
              transaction.set(movRef, {
                producto_id: snap.id,
                producto_nombre: data.nombre || data.name || 'Desconocido',
                tipo: 'subtract',
                cantidad: item.quantity,
                stock_anterior: currentStock,
                stock_nuevo: newStock,
                motivo: `VENTA PEDIDO ${order.id || 'N/A'}`,
                fecha: new Date().toISOString()
              });
            }
          }
        }
      });

      // 4. Update Order in Realtime DB
      await update(ref(db, `orders/${order.id}`), finalOrderUpdate);

      // 5. Print
      handlePrint(finalOrderUpdate);

      // 6. Complete and advance
      onComplete();
    } catch (error) {
      console.error("Error al procesar facturación:", error);
      alert("Error procesando facturación.");
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', background: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="modal-header" style={{ background: '#f8fafc' }}>
          <h2 className="modal-title">RECIBO</h2>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '0', overflowY: 'auto' }}>
          <form id="checkoutForm" onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. Datos del Cliente */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem' }}>
                1. Datos Fiscales / Envío
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group" style={{ marginBottom: 0, position: 'relative' }}>
                  <label className="input-label">Nombre o Razón Social *</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.875rem', color: '#94a3b8' }} />
                    <input 
                      className="input-field" 
                      style={{ paddingLeft: '2.5rem' }}
                      type="text" 
                      value={searchClient}
                      onChange={handleCustomClientName}
                      onFocus={() => setShowClientDropdown(true)}
                      onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                      required 
                      placeholder="Buscar o escribir cliente..."
                    />
                  </div>
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem', maxHeight: '150px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                      {filteredClients.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => handleSelectClient(c)}
                          style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{c.name || c.nombre}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{(c.cedula || c.idDoc) ? `CI: ${c.cedula || c.idDoc}` : 'Sin CI'}</span>
                          </div>
                          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{c.whatsapp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Cédula / RIF *</label>
                  <input 
                    className="input-field" 
                    type="text" 
                    value={formData.cedula}
                    onChange={(e) => setFormData(prev => ({ ...prev, cedula: e.target.value.toUpperCase() }))}
                    required 
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Teléfono / WhatsApp *</label>
                  <input 
                    className="input-field" 
                    type="tel" 
                    value={formData.whatsapp}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    required 
                  />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Correo Electrónico</label>
                  <input 
                    className="input-field" 
                    type="email" 
                    value={formData.correo}
                    onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value.toLowerCase() }))}
                  />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                <label className="input-label">Dirección (Opcional)</label>
                <textarea 
                  className="input-field" 
                  value={formData.direccion}
                  onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value.toUpperCase() }))}
                  rows="2"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* 2. Productos */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem' }}>
                2. Confirmar Productos
              </h3>
              
              <div className="input-group" style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.875rem', color: '#94a3b8' }} />
                  <input 
                    className="input-field" 
                    style={{ paddingLeft: '2.5rem' }}
                    type="text" 
                    placeholder="Buscar producto extra para agregar..." 
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    onFocus={() => setShowProductDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                  />
                </div>
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem', maxHeight: '150px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    {filteredProducts.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => addItem({ id: p.id, name: p.nombre, price: p.precio })}
                        style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600 }}>{p.nombre || p.name}</span>
                          {(p.tipo === 'Producto' || p.tipo === 'producto') && (
                            <span style={{ fontSize: '0.75rem', color: p.cantidad > 0 ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                              Stock: {p.cantidad || 0}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>${p.precio.toFixed(2)}</span>
                          <Plus size={16} color="#3b82f6" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {formData.items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  {formData.items.map(item => (
                    <div key={item.productId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{item.name}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>${item.price.toFixed(2)} c/u</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', borderRadius: '0.5rem', padding: '0.25rem' }}>
                          <button type="button" onClick={() => updateItemQuantity(item.productId, -1)} style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}>-</button>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button type="button" onClick={() => updateItemQuantity(item.productId, 1)} style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}>+</button>
                        </div>
                        <span style={{ fontWeight: 700, minWidth: '60px', textAlign: 'right' }}>${(item.price * item.quantity).toFixed(2)}</span>
                        <button type="button" onClick={() => removeItem(item.productId)} style={{ color: '#ef4444', background: 'transparent', padding: '0.25rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', padding: '1rem', background: '#0f172a', color: 'white', borderRadius: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>Total a Pagar</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#47FF00' }}>
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Pago */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={16} /> 3. Método de Pago
              </h3>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <select 
                  className="input-field" 
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Efectivo $">Efectivo $</option>
                  <option value="Zelle">Zelle</option>
                  <option value="Punto de Venta">Punto de Venta</option>
                </select>
              </div>
            </div>

          </form>
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0' }}>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" form="checkoutForm" className="btn-primary" style={{ width: 'auto', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={isSubmitting || formData.items.length === 0}>
            <Printer size={18} />
            {isSubmitting ? 'Guardando...' : 'Guardar e Imprimir'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default CheckoutModal;
