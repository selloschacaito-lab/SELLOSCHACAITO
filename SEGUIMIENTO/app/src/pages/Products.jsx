import React, { useState, useEffect } from 'react';
import { db, firestoreDB } from '../firebase/config';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Power, PowerOff, Package, Wrench, Search, ArrowRight, ChevronLeft, ChevronRight, Zap, Check } from 'lucide-react';
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
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'ascending' });
  const [quickEditMode, setQuickEditMode] = useState(false);
  const [savingFieldId, setSavingFieldId] = useState(null);
  
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
      prodData.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
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

  const filteredProducts = React.useMemo(() => {
    const list = products.filter(p => {
      const matchesSearch = (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || (p.tipo || '').toLowerCase() === filterType.toLowerCase();
      const matchesCategory = filterCategory === 'all' || (p.categoria || '').toUpperCase() === filterCategory.toUpperCase();
      return matchesSearch && matchesType && matchesCategory;
    });

    if (sortConfig.key !== null) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';

        if (typeof aVal === 'string') {
          return sortConfig.direction === 'ascending' 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal);
        } else {
          return sortConfig.direction === 'ascending' 
            ? aVal - bVal 
            : bVal - aVal;
        }
      });
    }
    return list;
  }, [products, searchTerm, filterType, filterCategory, sortConfig]);

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    }
    return ' ↕';
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const currentIndex = editingItem ? filteredProducts.findIndex(p => p.id === editingItem.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < filteredProducts.length - 1;

  function handleOpenModal(item = null, focusTarget = 'price') {
    if (item) {
      setEditingItem(item);
      setFormData({
        nombre: item.nombre || '',
        tipo: item.tipo || 'Producto',
        categoria: item.categoria || '',
        costo: item.costo ?? '',
        precio: item.precio ?? '',
        cantidad: item.cantidad ?? ''
      });
      setShowModal(true);
      setTimeout(() => {
        if (focusTarget === 'price') {
          const el = document.getElementById('product-price-input');
          if (el) {
            el.focus();
            el.select();
          }
        } else {
          document.getElementById('product-name-input')?.focus();
        }
      }, 70);
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
      setShowModal(true);
      setTimeout(() => {
        document.getElementById('product-name-input')?.focus();
      }, 70);
    }
  }

  function goToPrev() {
    if (hasPrev) {
      handleOpenModal(filteredProducts[currentIndex - 1], 'price');
    }
  }

  function goToNext() {
    if (hasNext) {
      handleOpenModal(filteredProducts[currentIndex + 1], 'price');
    }
  }

  async function handleInlineUpdate(id, field, value) {
    const numVal = parseFloat(value) || 0;
    setSavingFieldId(`${id}_${field}`);
    try {
      await updateDoc(doc(firestoreDB, 'products', id), {
        [field]: numVal
      });
      setTimeout(() => setSavingFieldId(null), 1000);
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar precio');
      setSavingFieldId(null);
    }
  }

  async function handleSave(advanceToNext = false) {
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
        cantidad: formData.tipo === 'Producto' ? (parseInt(formData.cantidad, 10) || 0) : null
      };

      if (editingItem) {
        await updateDoc(doc(firestoreDB, 'products', editingItem.id), dataToSave);
        
        if (advanceToNext) {
          const currentIdx = filteredProducts.findIndex(p => p.id === editingItem.id);
          if (currentIdx !== -1 && currentIdx + 1 < filteredProducts.length) {
            const nextItem = filteredProducts[currentIdx + 1];
            toast.success(`Guardado: ${dataToSave.nombre}`, { duration: 1200 });
            handleOpenModal(nextItem, 'price');
          } else {
            toast.success('¡Has completado toda la lista de productos!');
            setShowModal(false);
          }
        } else {
          toast.success('Actualizado correctamente');
          setShowModal(false);
        }
      } else {
        await addDoc(collection(firestoreDB, 'products'), {
          ...dataToSave,
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


  // Extract unique categories for autocomplete
  const uniqueCategories = Array.from(new Set(products.map(p => p.categoria).filter(c => c && c.trim() !== '')));

  return (
    <div className="animate-fade-in" style={{ width: '100%', padding: '0.25rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Productos y Servicios</h2>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona tu catálogo, precios y costos base.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => setQuickEditMode(!quickEditMode)} 
            style={{ 
              marginTop: 0, 
              width: 'auto', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              padding: '0.5rem 0.85rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: '0.5rem',
              border: quickEditMode ? '1.5px solid #16a34a' : '1px solid var(--border-strong)',
              background: quickEditMode ? '#dcfce7' : 'var(--surface)',
              color: quickEditMode ? '#15803d' : 'var(--text-main)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="Editar precios directamente en la tabla sin abrir la ventana"
          >
            <Zap size={16} color={quickEditMode ? "#15803d" : "var(--primary)"} />
            <span>{quickEditMode ? "Modo Rápido: ACTIVO" : "⚡ Edición Rápida en Tabla"}</span>
          </button>

          <button onClick={() => handleOpenModal()} className="btn-primary" style={{ marginTop: 0, width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
            <Plus size={16} /> Nuevo
          </button>
        </div>
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

          <select 
            className="input-field" 
            style={{ width: 'auto', minWidth: '180px' }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            {uniqueCategories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
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
                  <th 
                    onClick={() => requestSort('nombre')} 
                    style={{ padding: '0.75rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Nombre{getSortIndicator('nombre')}
                  </th>
                  <th 
                    onClick={() => requestSort('tipo')} 
                    style={{ padding: '0.75rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Tipo{getSortIndicator('tipo')}
                  </th>
                  <th 
                    onClick={() => requestSort('categoria')} 
                    style={{ padding: '0.75rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Categoría{getSortIndicator('categoria')}
                  </th>
                  <th 
                    onClick={() => requestSort('cantidad')} 
                    style={{ padding: '0.75rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Stock{getSortIndicator('cantidad')}
                  </th>
                  <th 
                    onClick={() => requestSort('costo')} 
                    style={{ padding: '0.75rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Costo (Interno){getSortIndicator('costo')}
                  </th>
                  <th 
                    onClick={() => requestSort('precio')} 
                    style={{ padding: '0.75rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Precio ($){getSortIndicator('precio')}
                  </th>
                  <th style={{ padding: '0.75rem', fontWeight: '600', textAlign: 'right', userSelect: 'none' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-strong)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '600' }}>
                      {item.nombre}
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
                    <td style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {item.tipo === 'Producto' ? (
                        quickEditMode ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input 
                              type="number" 
                              defaultValue={item.cantidad ?? 0}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val !== item.cantidad) {
                                  handleInlineUpdate(item.id, 'cantidad', val);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.target.blur();
                              }}
                              style={{
                                width: '70px',
                                padding: '4px 6px',
                                fontSize: '0.875rem',
                                borderRadius: '4px',
                                border: '1.5px solid #10b981',
                                background: 'var(--surface)',
                                color: 'var(--text-main)',
                                fontWeight: 'bold',
                                textAlign: 'center'
                              }}
                            />
                            {savingFieldId === `${item.id}_cantidad` && <Check size={14} color="#16a34a" />}
                          </div>
                        ) : (
                          <span style={{ 
                            color: (item.cantidad ?? 0) <= 0 ? '#ef4444' : 'var(--text-main)',
                            background: (item.cantidad ?? 0) <= 0 ? '#fee2e2' : 'transparent',
                            padding: (item.cantidad ?? 0) <= 0 ? '2px 6px' : '0',
                            borderRadius: '4px'
                          }}>
                            {item.cantidad ?? 0}
                          </span>
                        )
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>-</span>
                      )}
                    </td>
                    
                    {/* Columna Costo */}
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {quickEditMode ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>$</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            defaultValue={item.costo || 0}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (val !== item.costo) {
                                handleInlineUpdate(item.id, 'costo', val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                            }}
                            style={{
                              width: '75px',
                              padding: '4px 6px',
                              fontSize: '0.875rem',
                              borderRadius: '4px',
                              border: '1px solid var(--border-strong)',
                              background: 'var(--surface)',
                              color: 'var(--text-main)',
                              fontWeight: 600
                            }}
                          />
                          {savingFieldId === `${item.id}_costo` && <Check size={14} color="#16a34a" />}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>${(item.costo || 0).toFixed(2)}</span>
                      )}
                    </td>

                    {/* Columna Precio */}
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {quickEditMode ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#16a34a' }}>$</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            defaultValue={item.precio || 0}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              if (val !== item.precio) {
                                handleInlineUpdate(item.id, 'precio', val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur();
                            }}
                            style={{
                              width: '85px',
                              padding: '4px 6px',
                              fontSize: '0.9rem',
                              borderRadius: '4px',
                              border: '1.5px solid #16a34a',
                              background: 'var(--surface)',
                              color: 'var(--text-main)',
                              fontWeight: 'bold'
                            }}
                          />
                          {savingFieldId === `${item.id}_precio` && <Check size={14} color="#16a34a" />}
                        </div>
                      ) : (
                        <span style={{ fontWeight: 'bold', color: (item.precio || 0) > 0 ? 'var(--text-main)' : '#ef4444' }}>
                          ${(item.precio || 0).toFixed(2)}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenModal(item, 'price')} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-strong)', background: 'rgba(255,255,255,0.5)', cursor: 'pointer' }} title="Editar">
                          <Edit2 size={16} color="var(--text-main)" />
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
          <div className="modal-content glass-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 className="modal-title" style={{ margin: 0 }}>{editingItem ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                {editingItem && currentIndex !== -1 && (
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '3px 8px', 
                    borderRadius: '12px', 
                    background: 'var(--surface-hover)', 
                    border: '1px solid var(--border-strong)',
                    fontWeight: 700,
                    color: 'var(--text-muted)'
                  }}>
                    {currentIndex + 1} de {filteredProducts.length}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {editingItem && (
                  <div style={{ display: 'flex', gap: '4px', marginRight: '6px' }}>
                    <button 
                      type="button" 
                      onClick={goToPrev} 
                      disabled={!hasPrev}
                      style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-strong)', 
                        background: hasPrev ? 'var(--surface)' : 'rgba(0,0,0,0.05)', 
                        cursor: hasPrev ? 'pointer' : 'not-allowed',
                        opacity: hasPrev ? 1 : 0.4,
                        display: 'flex', alignItems: 'center'
                      }}
                      title="Producto anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      type="button" 
                      onClick={goToNext} 
                      disabled={!hasNext}
                      style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-strong)', 
                        background: hasNext ? 'var(--surface)' : 'rgba(0,0,0,0.05)', 
                        cursor: hasNext ? 'pointer' : 'not-allowed',
                        opacity: hasNext ? 1 : 0.4,
                        display: 'flex', alignItems: 'center'
                      }}
                      title="Siguiente producto"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSave(Boolean(editingItem)); }} className="modal-body">
              <div className="input-group">
                <label className="input-label">Nombre del Producto / Servicio *</label>
                <input 
                  id="product-name-input"
                  type="text" 
                  className="input-field" 
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                  placeholder="Ej. TRODAT 4911"
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

                {formData.tipo === 'Producto' && (
                  <div className="input-group">
                    <label className="input-label">Stock (Cantidad) *</label>
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
                    id="product-cost-input"
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
                  <label className="input-label" style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    Precio Público (USD) *
                  </label>
                  <input 
                    id="product-price-input"
                    type="number" 
                    step="0.01"
                    min="0"
                    className="input-field" 
                    style={{ fontSize: '1.1rem', fontWeight: 'bold', border: '1.5px solid #16a34a' }}
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSave(Boolean(editingItem));
                      }
                    }}
                    placeholder="Ej. 16.00"
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '1rem 0 0', marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-strong)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowModal(false)}
                  style={{ margin: 0, width: 'auto' }}
                >
                  Cerrar
                </button>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => handleSave(false)} 
                    className="btn-secondary" 
                    style={{ margin: 0, width: 'auto', fontWeight: 600 }}
                  >
                    Guardar
                  </button>
                  
                  {editingItem ? (
                    <button 
                      type="button" 
                      onClick={() => handleSave(true)} 
                      className="btn-primary" 
                      style={{ 
                        margin: 0, 
                        width: 'auto', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: 700
                      }}
                      title="Guardar cambios y pasar automáticamente al siguiente producto (Atajo: presionar Enter)"
                    >
                      <span>Guardar y Siguiente</span>
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ margin: 0, width: 'auto' }}
                    >
                      Crear Producto
                    </button>
                  )}
                </div>
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
