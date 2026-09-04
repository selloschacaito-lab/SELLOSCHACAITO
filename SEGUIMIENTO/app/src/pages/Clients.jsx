import React, { useState, useEffect } from 'react';
import { firestoreDB, db } from '../firebase/config';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, limit, getDocs, where, onSnapshot } from 'firebase/firestore';
import { ref, onValue } from 'firebase/database';
import { Users, Search, Plus, Edit2, Trash2, Phone, Star, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { normalizeWhatsApp } from '../utils/formatters';
import ClientDrawer from '../components/ClientDrawer';

function Clients({ isModal = false }) {
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientForDrawer, setSelectedClientForDrawer] = useState(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: '',
    rif: '',
    whatsapp: '',
    correo: '',
    direccion: '',
    tipo: 'normal' // 'normal' | 'mayorista'
  });

  useEffect(() => {
    setLoading(true);
    const q = query(collection(firestoreDB, 'clients'), orderBy('nombre'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching clients:", err);
      toast.error("Error cargando directorio");
      setLoading(false);
    });

    // Listen to orders for live CRM calculations
    const ordersRef = ref(db, 'orders');
    const unsubOrders = onValue(ordersRef, (snap) => {
      if (snap.exists()) {
        setOrders(Object.values(snap.val()));
      } else {
        setOrders([]);
      }
    });

    return () => {
      unsub();
      unsubOrders();
    };
  }, []);

  // Filtrado manejado en el cliente para permitir busqueda parcial (substring)
  const filteredClients = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return clients.slice(0, 100); // Mostrar maximo 100 por defecto para rendimiento
    }
    const q = searchTerm.trim().toLowerCase();
    return clients.filter(c => 
      (c.nombre || '').toLowerCase().includes(q) ||
      (c.rif || '').toLowerCase().includes(q) ||
      (c.whatsapp || '').includes(q)
    ).slice(0, 100);
  }, [clients, searchTerm]);

  function handleOpenModal(client = null) {
    if (client) {
      setEditingClient(client);
      setFormData({
        nombre: client.nombre || '',
        rif: client.rif || '',
        whatsapp: client.whatsapp || '',
        correo: client.correo || '',
        direccion: client.direccion || '',
        tipo: client.tipo || 'normal'
      });
    } else {
      setEditingClient(null);
      setFormData({
        nombre: '',
        rif: '',
        whatsapp: '',
        correo: '',
        direccion: '',
        tipo: 'normal'
      });
    }
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const nombre = formData.nombre || '';
    if (!nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const cleanNombre = nombre.trim().toUpperCase();
    const cleanRif = (formData.rif || '').trim().toUpperCase();

    const isDuplicate = clients.some(c => 
      c.id !== (editingClient?.id || null) && (
        (cleanRif && c.rif && c.rif.toUpperCase() === cleanRif) ||
        (cleanRif && c.cedula && c.cedula.toUpperCase() === cleanRif) ||
        (cleanNombre && (c.nombre || c.name || '').toUpperCase() === cleanNombre)
      )
    );

    if (isDuplicate) {
      toast.error('Ya existe un cliente con este Nombre o RIF/Cédula');
      return;
    }

    try {
      const dataToSave = {
        nombre: (formData.nombre || '').trim().toUpperCase(),
        rif: (formData.rif || '').trim().toUpperCase(),
        whatsapp: normalizeWhatsApp(formData.whatsapp),
        correo: (formData.correo || '').trim().toLowerCase(),
        direccion: (formData.direccion || '').trim().toUpperCase(),
        tipo: formData.tipo
      };

      if (editingClient) {
        await updateDoc(doc(firestoreDB, 'clients', editingClient.id), dataToSave);
        setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...dataToSave } : c));
        toast.success('Cliente actualizado');
      } else {
        const newRef = await addDoc(collection(firestoreDB, 'clients'), {
          ...dataToSave,
          fechaRegistro: new Date().toISOString(),
          totalPedidos: 0
        });
        // Optimistic append to local state
        setClients(prev => [{id: newRef.id, ...dataToSave}, ...prev]);
        toast.success('Cliente creado');
      }
      
      setShowModal(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar cliente');
    }
  }

  async function handleDelete(id) {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente? Solo hazlo si fue un error o nunca ha hecho pedidos.')) {
      try {
        await deleteDoc(doc(firestoreDB, 'clients', id));
        setClients(prev => prev.filter(c => c.id !== id));
        toast.success('Cliente eliminado');
      } catch (error) {
        console.error(error);
        toast.error('Error al eliminar cliente');
      }
    }
  }


  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1050px', margin: '0 auto', padding: isModal ? '0' : '24px 20px 80px', boxSizing: 'border-box' }}>
      {!isModal ? (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '22px 28px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Clientes
            </h1>
            <p style={{ color: '#64748b', margin: '3px 0 0', fontSize: '13px', fontWeight: 500 }}>
              Directorio de clientes frecuentes, mayoristas y fichas CRM
            </p>
          </div>
          <button 
            onClick={() => handleOpenModal()} 
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={16} /> Nuevo Cliente
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button 
            onClick={() => handleOpenModal()} 
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={14} /> Nuevo Cliente
          </button>
        </div>
      )}

      {/* Search box */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '10px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <Search size={18} color="#64748b" style={{ flexShrink: 0 }} />
        <input 
          type="search" 
          placeholder={`Buscar en ${clients.length} clientes por nombre, RIF o WhatsApp...`}
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '14px',
            fontWeight: 600,
            color: '#0f172a',
            background: 'transparent'
          }}
        />
        {searchTerm && (
          <button 
            type="button" 
            onClick={() => setSearchTerm('')}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800 }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{
        background: '#ffffff',
        borderRadius: '1rem',
        border: '1px solid #e2e8f0',
        padding: isMobile ? '0.5rem' : '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1.5rem' }}>⏳</span>
            <p style={{ marginTop: '8px', fontWeight: 700 }}>Cargando clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontWeight: 700, margin: 0 }}>No se encontraron clientes con "{searchTerm}"</p>
          </div>
        ) : isMobile ? (
          /* Mobile Card List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredClients.map(client => (
              <div 
                key={client.id}
                onClick={() => setSelectedClientForDrawer(client)}
                style={{
                  background: '#ffffff',
                  borderRadius: '0.75rem',
                  border: '1px solid #f1f5f9',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                      {client.nombre || client.name || 'Sin nombre'}
                    </div>
                    {client.rif && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>RIF: {client.rif}</div>
                    )}
                  </div>
                  {client.tipo === 'mayorista' && (
                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 850, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Star size={10} /> Mayorista
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                  {client.whatsapp ? (
                    <a 
                      href={`https://wa.me/${normalizeWhatsApp(client.whatsapp)}`} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#16a34a', fontWeight: 750, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <Phone size={13} /> {client.whatsapp}
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sin teléfono</span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClientForDrawer(client);
                      }}
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#16a34a' }}
                      title="Ver Ficha CRM"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenModal(client);
                      }}
                      style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#475569' }}
                      title="Editar"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(client.id);
                      }}
                      style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#dc2626' }}
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop Table */
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-strong)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700', width: '50px' }}>N°</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Nombre del Cliente</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Contacto</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Categoría</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700', textAlign: 'center' }}>Pedidos</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700', textAlign: 'right' }}>Total $</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Última Orden</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700' }}>Prod. Favorito</th>
                  <th style={{ padding: '0.75rem 0.85rem', fontWeight: '700', textAlign: 'center', minWidth: '130px', width: '130px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr 
                    key={client.id} 
                    onClick={() => setSelectedClientForDrawer(client)}
                    style={{ 
                      borderBottom: '1px solid var(--border-strong)', 
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {client.numeroCliente || '-'}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{client.nombre || client.name || 'Sin nombre'}</span>
                        {client.notas && (
                          <span title="Tiene notas de seguimiento" style={{ fontSize: '0.7rem' }}>📝</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {client.whatsapp ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#16a34a', fontSize: '0.875rem' }}>
                          <Phone size={14} /> {client.whatsapp}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin teléfono</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {client.tipo === 'mayorista' ? (
                        <span style={{ 
                          display: 'inline-flex', alignItems: 'center', gap: '0.25rem', 
                          background: '#fef3c7', color: '#b45309', padding: '0.125rem 0.5rem', 
                          borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold' 
                        }}>
                          <Star size={12} /> Mayorista
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Normal</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600 }}>
                      {client.ordenesTotales > 0 ? client.ordenesTotales : '-'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#16a34a', fontWeight: 600 }}>
                      {client.totalGastado > 0 ? `$${client.totalGastado}` : '-'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {client.ultimaOrden || '-'}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {client.productoMasComprado || '-'}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', minWidth: '130px', width: '130px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClientForDrawer(client);
                          }} 
                          style={{ padding: '0.45rem', borderRadius: '0.5rem', border: '1px solid var(--border-strong)', background: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                          title="Ver Ficha CRM 360°"
                        >
                          <Eye size={16} color="var(--primary, #16a34a)" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(client);
                          }} 
                          style={{ padding: '0.45rem', borderRadius: '0.5rem', border: '1px solid var(--border-strong)', background: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                          title="Editar"
                        >
                          <Edit2 size={16} color="var(--text-main)" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(client.id);
                          }} 
                          style={{ padding: '0.45rem', borderRadius: '0.5rem', border: '1px solid #fee2e2', background: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                          title="Eliminar"
                        >
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSave} className="modal-body">
              <div className="input-group">
                <label className="input-label">Nombre o Empresa *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                  placeholder="Ej. JUAN PÉREZ O PAPELERÍA XYZ"
                  autoFocus
                  required 
                />
              </div>

              <div className="input-group">
                <label className="input-label">RIF o CI</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.rif}
                  onChange={(e) => setFormData({ ...formData, rif: e.target.value.toUpperCase() })}
                  placeholder="Ej. J-12345678-9 o V-12345678"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Teléfono / WhatsApp</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="Ej. +584121234567"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Correo Electrónico</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={formData.correo}
                  onChange={(e) => setFormData({ ...formData, correo: e.target.value.toLowerCase() })}
                  placeholder="Ej. cliente@correo.com"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Dirección</label>
                <textarea 
                  className="input-field" 
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value.toUpperCase() })}
                  placeholder="Ej. AV. PRINCIPAL..."
                  rows="2"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Categoría del Cliente</label>
                <select 
                  className="input-field" 
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                >
                  <option value="normal">Cliente Normal (Precio Público)</option>
                  <option value="mayorista">Cliente Mayorista (Precio con Descuento)</option>
                </select>
                {formData.tipo === 'mayorista' && (
                  <p style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.5rem' }}>
                    Al crear pedidos para este cliente, los precios se calcularán automáticamente usando el multiplicador de mayorista (configurado en Configuración).
                  </p>
                )}
              </div>

              <div className="modal-footer" style={{ padding: '1rem 0 0', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ border: 'none' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ margin: 0, width: 'auto' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {selectedClientForDrawer && (
        <ClientDrawer 
          client={selectedClientForDrawer}
          allOrders={orders}
          onClose={() => setSelectedClientForDrawer(null)}
        />
      )}
    </div>
  );
}

export default Clients;
