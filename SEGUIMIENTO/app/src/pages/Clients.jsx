import React, { useState, useEffect } from 'react';
import { firestoreDB } from '../firebase/config';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, limit, getDocs, where, onSnapshot } from 'firebase/firestore';
import { Users, Search, Plus, Edit2, Trash2, Phone, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { normalizeWhatsApp } from '../utils/formatters';

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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
    let timeoutId;
    let unsub;

    if (!searchTerm.trim()) {
      setLoading(true);
      const q = query(collection(firestoreDB, 'clients'), orderBy('nombre'), limit(50));
      unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClients(data);
        setLoading(false);
      });
    } else {
      timeoutId = setTimeout(async () => {
        setLoading(true);
        try {
          const searchUpper = searchTerm.trim().toUpperCase();
          const searchExact = searchTerm.trim();
          
          const qName = query(
            collection(firestoreDB, 'clients'), 
            where('nombre', '>=', searchUpper),
            where('nombre', '<=', searchUpper + '\uf8ff'),
            limit(20)
          );
          
          const qPhone = query(
            collection(firestoreDB, 'clients'),
            where('whatsapp', '>=', searchExact),
            where('whatsapp', '<=', searchExact + '\uf8ff'),
            limit(20)
          );

          const [snapName, snapPhone] = await Promise.all([getDocs(qName), getDocs(qPhone)]);
          
          const combined = new Map();
          snapName.docs.forEach(d => combined.set(d.id, { id: d.id, ...d.data() }));
          snapPhone.docs.forEach(d => combined.set(d.id, { id: d.id, ...d.data() }));
          
          const result = Array.from(combined.values());
          result.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
          setClients(result);
        } catch (e) {
          console.error("Error buscando clientes:", e);
          toast.error('Error al buscar');
        } finally {
          setLoading(false);
        }
      }, 400);
    }

    return () => {
      clearTimeout(timeoutId);
      if (unsub) unsub();
    };
  }, [searchTerm]);

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

  // Filtrado manejado por base de datos, mostramos los que trajimos
  const filteredClients = clients;

  // Remove blocking loading screen

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Directorio de Clientes</h2>
          <p style={{ color: 'var(--text-muted)' }}>Administra tus clientes y mayoristas.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary" style={{ marginTop: 0, width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="search-box" style={{ flex: 1, margin: 0 }}>
          <Search className="search-icon" size={16} />
          <input 
            type="search" 
            placeholder="Buscar por nombre o número de WhatsApp..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Cargando clientes...
          </div>
        ) : filteredClients.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron clientes.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-strong)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Nombre del Cliente</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Contacto</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Categoría</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(client => (
                  <tr key={client.id} style={{ borderBottom: '1px solid var(--border-strong)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                      {client.nombre || client.name || 'Sin nombre'}
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
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenModal(client)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-strong)', background: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} title="Editar">
                          <Edit2 size={16} color="var(--text-main)" />
                        </button>
                        <button onClick={() => handleDelete(client.id)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #fee2e2', background: '#fef2f2', cursor: 'pointer' }} title="Eliminar">
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
    </div>
  );
}

export default Clients;
