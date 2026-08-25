import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct, getCategories, updateProductsOrder, toggleProductVisibility } from '../../services/db';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Reorder mode state
  const [isReordering, setIsReordering] = useState(false);
  const [orderedProducts, setOrderedProducts] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderSavedMessage, setOrderSavedMessage] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [prodsData, catsData] = await Promise.all([
      getProducts(),
      getCategories()
    ]);
    setProducts(prodsData);
    setOrderedProducts(prodsData);
    setCategories(catsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteProduct(id);
        fetchData();
      } catch (error) {
        alert("Error al eliminar el producto.");
      }
    }
  };

  const handleToggleVisibility = async (product) => {
    const newVisibility = product.isVisible === false ? true : false;
    try {
      await toggleProductVisibility(product.id, newVisibility);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isVisible: newVisibility } : p));
      setOrderedProducts(prev => prev.map(p => p.id === product.id ? { ...p, isVisible: newVisibility } : p));
    } catch (error) {
      alert("Error al cambiar la visibilidad.");
    }
  };

  // Reorder handlers
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(orderedProducts);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setOrderedProducts(items);
  };

  const moveProduct = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= orderedProducts.length) return;
    const items = Array.from(orderedProducts);
    const [movedItem] = items.splice(index, 1);
    items.splice(newIndex, 0, movedItem);
    setOrderedProducts(items);
  };

  const moveToTop = (index) => {
    if (index === 0) return;
    const items = Array.from(orderedProducts);
    const [movedItem] = items.splice(index, 1);
    items.unshift(movedItem);
    setOrderedProducts(items);
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    try {
      await updateProductsOrder(orderedProducts);
      setProducts(orderedProducts);
      setOrderSavedMessage(true);
      setTimeout(() => setOrderSavedMessage(false), 3500);
    } catch (error) {
      alert("Error al guardar el nuevo orden.");
    } finally {
      setSavingOrder(false);
    }
  };

  // Filter and search
  let displayProducts = [...products];
  
  if (filterCategory !== 'all') {
    displayProducts = displayProducts.filter(p => p.category === filterCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayProducts = displayProducts.filter(p => p.name.toLowerCase().includes(q));
  }

  const getCategoryName = (catId) => {
    return categories.find(c => c.id === catId)?.name || catId;
  };

  return (
    <div>
      {/* Header with Reorder Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: '0 0 0.25rem 0' }}>Mis Productos</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.85rem' }}>
            {products.length} producto{products.length !== 1 ? 's' : ''} en total ({products.filter(p => p.isVisible !== false).length} activos en tienda)
          </p>
        </div>

        <button 
          onClick={() => {
            setIsReordering(!isReordering);
            if (!isReordering) setOrderedProducts([...products]);
          }}
          className="btn"
          style={{
            padding: '0.6rem 1.1rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: '700',
            backgroundColor: isReordering ? 'var(--color-primary)' : 'var(--color-bg-card)',
            color: isReordering ? '#000' : 'var(--color-text-main)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            cursor: 'pointer'
          }}
        >
          {isReordering ? '👁️ Ver Tarjetas' : '🔀 Ordenar Catálogo'}
        </button>
      </div>

      {/* --- MODO REORDENAR INTERACTIVO --- */}
      {isReordering ? (
        <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '2rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>🔀 Orden de Productos en Tienda</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0 0' }}>
                Arrastra o usa las flechas ⬆️ / ⬇️ para mover los sellos que quieres mostrar primero.
              </p>
            </div>

            <button 
              onClick={handleSaveOrder}
              disabled={savingOrder}
              className="btn btn-primary"
              style={{ padding: '0.7rem 1.4rem', fontWeight: '800', borderRadius: '10px', fontSize: '0.9rem' }}
            >
              {savingOrder ? 'Guardando...' : '💾 Guardar Nuevo Orden'}
            </button>
          </div>

          {orderSavedMessage && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(71, 255, 0, 0.12)', border: '1px solid #47FF00', borderRadius: '10px', color: '#16a34a', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1rem' }}>
              ✅ ¡Orden actualizado correctamente! Los productos ahora se mostrarán en este orden en toda la tienda.
            </div>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="products-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {orderedProducts.map((product, index) => {
                    const firstVariant = product.variants?.[0];
                    const thumbUrl = firstVariant?.imageUrl || firstVariant?.imageUrls?.[0] || product.singleImageUrl || product.singleImageUrls?.[0] || null;

                    return (
                      <Draggable key={product.id} draggableId={product.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem 0.9rem',
                              backgroundColor: snapshot.isDragging ? 'var(--color-bg-card)' : 'var(--color-bg-secondary)',
                              border: product.isVisible === false ? '1px dashed #ef4444' : '1px solid var(--color-border)',
                              borderRadius: '12px',
                              gap: '0.75rem',
                              opacity: product.isVisible === false ? 0.7 : 1,
                              boxShadow: snapshot.isDragging ? '0 8px 25px rgba(0,0,0,0.15)' : 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                              {/* Drag Handle */}
                              <div {...provided.dragHandleProps} style={{ cursor: 'grab', color: 'var(--color-text-secondary)', padding: '0.2rem', fontSize: '1.1rem' }} title="Arrastrar">
                                ⠿
                              </div>

                              {/* Index Position Badge */}
                              <span style={{ 
                                fontWeight: '800', fontSize: '0.75rem', 
                                backgroundColor: index === 0 ? 'var(--color-primary)' : 'var(--color-bg-main)', 
                                color: index === 0 ? '#000' : 'var(--color-text-secondary)',
                                width: '28px', height: '28px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '1px solid var(--color-border)', flexShrink: 0
                              }}>
                                #{index + 1}
                              </span>

                              {/* Thumb */}
                              {thumbUrl ? (
                                <img src={thumbUrl} alt={product.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--color-bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>📦</div>
                              )}

                              {/* Info */}
                              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {product.name}
                                  </h4>
                                  {product.isVisible === false && (
                                    <span style={{ fontSize: '0.65rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: '800' }}>
                                      Oculto
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                  {getCategoryName(product.category)} · ${product.price}
                                </span>
                              </div>
                            </div>

                            {/* Mobile Move Arrows */}
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => moveToTop(index)}
                                disabled={index === 0}
                                title="Poner de primero"
                                style={{
                                  padding: '0.35rem 0.55rem', borderRadius: '6px', border: '1px solid var(--color-border)',
                                  backgroundColor: 'var(--color-bg-main)', cursor: index === 0 ? 'not-allowed' : 'pointer',
                                  opacity: index === 0 ? 0.3 : 1, fontSize: '0.75rem', fontWeight: '700'
                                }}
                              >
                                🔝
                              </button>
                              <button
                                type="button"
                                onClick={() => moveProduct(index, -1)}
                                disabled={index === 0}
                                title="Subir una posición"
                                style={{
                                  padding: '0.35rem 0.55rem', borderRadius: '6px', border: '1px solid var(--color-border)',
                                  backgroundColor: 'var(--color-bg-main)', cursor: index === 0 ? 'not-allowed' : 'pointer',
                                  opacity: index === 0 ? 0.3 : 1, fontSize: '0.75rem', fontWeight: '700'
                                }}
                              >
                                ⬆️
                              </button>
                              <button
                                type="button"
                                onClick={() => moveProduct(index, 1)}
                                disabled={index === orderedProducts.length - 1}
                                title="Bajar una posición"
                                style={{
                                  padding: '0.35rem 0.55rem', borderRadius: '6px', border: '1px solid var(--color-border)',
                                  backgroundColor: 'var(--color-bg-main)', cursor: index === orderedProducts.length - 1 ? 'not-allowed' : 'pointer',
                                  opacity: index === orderedProducts.length - 1 ? 0.3 : 1, fontSize: '0.75rem', fontWeight: '700'
                                }}
                              >
                                ⬇️
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      ) : (
        /* --- VISTA NORMAL DE TARJETAS --- */
        <>
          {/* Search */}
          <div className="admin-search-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text"
              className="admin-search"
              placeholder="Buscar por nombre o modelo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter Chips */}
          <div className="admin-chips">
            <button 
              className={`admin-chip ${filterCategory === 'all' ? 'active' : ''}`}
              onClick={() => setFilterCategory('all')}
            >
              Todos ({products.length})
            </button>
            {categories.filter(c => c.id !== 'todos').map(c => {
              const count = products.filter(p => p.category === c.id).length;
              return (
                <button 
                  key={c.id}
                  className={`admin-chip ${filterCategory === c.id ? 'active' : ''}`}
                  onClick={() => setFilterCategory(c.id)}
                >
                  {c.name || c.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando catálogo...</div>
          ) : displayProducts.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-card)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
              {searchQuery ? `No se encontraron resultados para "${searchQuery}"` : 'Aún no tienes productos registrados.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {displayProducts.map((product) => {
                const firstVariant = product.variants?.[0];
                const thumbUrl = firstVariant?.imageUrl || firstVariant?.imageUrls?.[0] || product.singleImageUrl || product.singleImageUrls?.[0] || null;
                const isHidden = product.isVisible === false;
                const isOutOfStock = product.variants && product.variants.length > 0 && product.variants.every(v => v.available === false);
                
                return (
                  <div 
                    key={product.id} 
                    className="admin-card"
                    style={{
                      border: isHidden ? '1px dashed #ef4444' : '1px solid var(--color-border)',
                      backgroundColor: isHidden ? 'var(--color-bg-secondary)' : 'var(--color-bg-card)',
                      opacity: isHidden ? 0.78 : 1
                    }}
                  >
                    <div className="admin-card-row">
                      {thumbUrl ? (
                        <img src={thumbUrl} alt={product.name} className="admin-card-thumb" />
                      ) : (
                        <div className="admin-card-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--color-text-secondary)' }}>📦</div>
                      )}
                      <div className="admin-card-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <h3>{product.name}</h3>
                          {isHidden && (
                            <span style={{ fontSize: '0.68rem', backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '800' }}>
                              🔴 Oculto
                            </span>
                          )}
                          {isOutOfStock && !isHidden && (
                            <span style={{ fontSize: '0.68rem', backgroundColor: '#fef3c7', color: '#d97706', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '800' }}>
                              ⚠️ Sin stock
                            </span>
                          )}
                        </div>
                        <p className="card-meta">
                          <span>{getCategoryName(product.category)}</span>
                          {product.dimensions && (
                            <>
                              <span>·</span>
                              <span>{product.dimensions}</span>
                            </>
                          )}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <span className="card-price">${product.price}</span>
                          {product.resellerPrice > 0 && (
                            <span className="card-price-wholesale">${product.resellerPrice} may.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Color dots */}
                    {product.variants && product.variants.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {product.variants.map((v, i) => (
                          <div key={i} title={v.colorName} style={{ 
                            width: '18px', height: '18px', borderRadius: '50%', 
                            backgroundColor: v.hex, border: '1px solid #ddd',
                            opacity: v.available ? 1 : 0.3 
                          }} />
                        ))}
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginLeft: '0.2rem' }}>
                          {product.variants.length} color{product.variants.length !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="admin-card-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleToggleVisibility(product)}
                        className="btn"
                        style={{
                          border: isHidden ? '1px solid #fecaca' : '1px solid #bbf7d0',
                          backgroundColor: isHidden ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                          color: isHidden ? '#dc2626' : '#16a34a',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          padding: '0.5rem'
                        }}
                        title={isHidden ? 'Activar y mostrar en tienda' : 'Pausar y ocultar de la tienda'}
                      >
                        {isHidden ? '🔴 Oculto' : '🟢 Visible'}
                      </button>

                      <Link 
                        to={`/admin/editar/${product.id}`} 
                        className="btn" 
                        style={{ textDecoration: 'none', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)', textAlign: 'center', padding: '0.5rem' }}
                      >
                        ✏️ Editar
                      </Link>

                      <button 
                        onClick={() => handleDelete(product.id, product.name)} 
                        className="btn" 
                        style={{ border: '1px solid #fee2e2', color: '#b91c1c', backgroundColor: 'var(--color-bg-card)', padding: '0.5rem 0.65rem' }}
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* FAB - New Product */}
      <Link to="/admin/nuevo-producto" className="admin-fab" title="Nuevo Producto">
        +
      </Link>
    </div>
  );
};

export default Dashboard;
