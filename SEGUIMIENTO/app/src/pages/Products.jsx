import React, { useState, useEffect } from 'react';
import { db, firestoreDB } from '../firebase/config';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Power, PowerOff, Package, Wrench, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'producto', 'servicio'
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Producto', // 'Producto' o 'Servicio'
    categoria: '',
    costo: '',
    precio: '',
    cantidad: ''
  });

  useEffect(() => {
    // Suscripción a productos
    const unsubProd = onSnapshot(collection(firestoreDB, 'products'), (snapshot) => {
      const prodData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      prodData.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setProducts(prodData);
      setLoading(false);
    }, (error) => {
      console.error(error);
      toast.error('Error al cargar productos');
      setLoading(false);
    });

    return () => {
      unsubProd();
    };
  }, []);

  function handleOpenModal(item = null) {
    if (item) {
      setEditingItem(item);
      setFormData({
        nombre: item.nombre,
        tipo: item.tipo,
        categoria: item.categoria || '',
        costo: item.costo,
        precio: item.precio
      });
    } else {
      setEditingItem(null);
      setFormData({
        nombre: '',
        tipo: 'Producto',
        categoria: '',
        costo: '',
        precio: '',
        cantidad: ''
      });
    }
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    const cleanNombre = formData.nombre.trim().toLowerCase();
    const isDuplicate = products.some(p => 
      p.id !== (editingItem?.id || null) && 
      (p.nombre || p.name || '').trim().toLowerCase() === cleanNombre
    );

    if (isDuplicate) {
      toast.error('Ya existe un producto o servicio con este nombre exacto');
      return;
    }

    try {
      const dataToSave = {
        nombre: formData.nombre.trim().toUpperCase(),
        tipo: formData.tipo,
        categoria: formData.categoria.trim().toUpperCase(),
        costo: parseFloat(formData.costo) || 0,
        precio: parseFloat(formData.precio) || 0,
      };

      if (editingItem) {
        await updateDoc(doc(firestoreDB, 'products', editingItem.id), dataToSave);
        toast.success('Actualizado correctamente');
        setShowModal(false);
      } else {
        await addDoc(collection(firestoreDB, 'products'), {
          ...dataToSave,
          cantidad: formData.tipo === 'Producto' ? (parseInt(formData.cantidad, 10) || 0) : null,
          activo: true
        });
        toast.success('Creado correctamente');
        // Limpiar el formulario pero no cerrar el modal
        setFormData({
          nombre: '',
          tipo: 'Producto',
          categoria: formData.categoria, // Mantener la categoría para agilizar
          costo: '',
          precio: '',
          cantidad: ''
        });
        // Enfocar el input de nombre si es posible
        document.getElementById('product-name-input')?.focus();
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar el producto');
    }
  }

  async function toggleActive(id, currentStatus) {
    try {
      await updateDoc(doc(firestoreDB, 'products', id), {
        activo: !currentStatus
      });
      toast.success(currentStatus ? 'Desactivado' : 'Activado');
    } catch (error) {
      console.error(error);
      toast.error('Error al cambiar el estado');
    }
  }

  async function handleDelete(id) {
    if (window.confirm('¿Estás seguro de que deseas eliminar esto permanentemente? Se recomienda desactivarlo en lugar de eliminarlo si ya tiene historial de ventas.')) {
      try {
        await deleteDoc(doc(firestoreDB, 'products', id));
        toast.success('Eliminado permanentemente');
      } catch (error) {
        console.error(error);
        toast.error('Error al eliminar');
      }
    }
  }


  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || p.tipo.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  // Extract unique categories for autocomplete
  const uniqueCategories = Array.from(new Set(products.map(p => p.categoria).filter(c => c && c.trim() !== '')));

  // Remove blocking loading screen

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Productos y Servicios</h2>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona tu catálogo, precios y costos base.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary" style={{ marginTop: 0, width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '250px', marginTop: 0 }}>
            <Search className="search-icon" size={16} />
            <input 
              type="search" 
              placeholder="Buscar por nombre..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="input-field" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Todos los tipos</option>
            <option value="producto">Solo Productos</option>
            <option value="servicio">Solo Servicios</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Cargando productos...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron resultados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-strong)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Nombre</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Tipo</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Categoría</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Costo (Uso Interno)</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600' }}>Precio ($)</th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-strong)', opacity: item.activo ? 1 : 0.5 }}>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                      {item.nombre}
                      {!item.activo && <span className="badge" style={{ marginLeft: '0.5rem', backgroundColor: '#f1f5f9', color: '#64748b' }}>Inactivo</span>}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
                        {item.tipo === 'Producto' ? <Package size={14} /> : <Wrench size={14} />}
                        {item.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {item.categoria || 'Sin categoría'}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>${item.costo?.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>${item.precio?.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenModal(item)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-strong)', background: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} title="Editar">
                          <Edit2 size={16} color="var(--text-main)" />
                        </button>
                        <button onClick={() => toggleActive(item.id, item.activo)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-strong)', background: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} title={item.activo ? "Desactivar" : "Activar"}>
                          {item.activo ? <PowerOff size={16} color="#f59e0b" /> : <Power size={16} color="var(--primary)" />}
                        </button>
                        <button onClick={() => handleDelete(item.id)} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #fee2e2', background: '#fef2f2', cursor: 'pointer' }} title="Eliminar permanentemente">
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
          <div className="modal-content glass-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingItem ? 'Editar' : 'Nuevo'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSave} className="modal-body">
              <div className="input-group">
                <label className="input-label">Nombre del Producto / Servicio *</label>
                <input 
                  id="product-name-input"
                  type="text" 
                  className="input-field" 
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                  placeholder="Ej. TRODAT 4911"
                  autoFocus
                  required 
                />
              </div>

              <div className="modal-grid">
                <div className="input-group">
                  <label className="input-label">Tipo *</label>
                  <select 
                    className="input-field" 
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    required
                  >
                    <option value="Producto">Producto (Controla Stock)</option>
                    <option value="Servicio">Servicio (Sin Stock)</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Categoría (Opcional)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    list="category-list"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value.toUpperCase() })}
                    placeholder="Ej. AUTOMATICO RECTANGULAR"
                  />
                  <datalist id="category-list">
                    {uniqueCategories.map((cat, idx) => (
                      <option key={idx} value={cat} />
                    ))}
                  </datalist>
                </div>

                {formData.tipo === 'Producto' && !editingItem && (
                  <div className="input-group">
                    <label className="input-label">Cantidad Inicial (Stock) *</label>
                    <input 
                      type="number" 
                      min="0"
                      className="input-field" 
                      value={formData.cantidad}
                      onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                      placeholder="Ej. 10"
                      required 
                    />
                  </div>
                )}
              </div>

              <div className="modal-grid">
                <div className="input-group">
                  <label className="input-label">Costo Interno (USD) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="input-field" 
                    value={formData.costo}
                    onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                    placeholder="Ej. 8.00"
                    required 
                  />
                  <small style={{ color: 'var(--text-muted)' }}>No visible para el cliente.</small>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Precio Público (USD) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    className="input-field" 
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="Ej. 16.00"
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1rem 0 0', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
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

export default Products;
