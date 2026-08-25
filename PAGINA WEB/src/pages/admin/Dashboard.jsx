import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct, getCategories } from '../../services/db';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    const [prodsData, catsData] = await Promise.all([
      getProducts(),
      getCategories()
    ]);
    setProducts(prodsData);
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
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: '0 0 0.25rem 0' }}>Mis Productos</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.85rem' }}>
          {products.length} producto{products.length !== 1 ? 's' : ''} en el catálogo
        </p>
      </div>

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
            const thumbUrl = firstVariant?.imageUrl || firstVariant?.imageUrls?.[0] || null;
            
            return (
              <div key={product.id} className="admin-card">
                <div className="admin-card-row">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt={product.name} className="admin-card-thumb" />
                  ) : (
                    <div className="admin-card-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--color-text-secondary)' }}>📦</div>
                  )}
                  <div className="admin-card-info">
                    <h3>{product.name}</h3>
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
                <div className="admin-card-actions">
                  <Link 
                    to={`/admin/editar/${product.id}`} 
                    className="btn" 
                    style={{ textDecoration: 'none', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)' }}
                  >
                    ✏️ Editar
                  </Link>
                  <button 
                    onClick={() => handleDelete(product.id, product.name)} 
                    className="btn" 
                    style={{ border: '1px solid #fee2e2', color: '#b91c1c', backgroundColor: 'var(--color-bg-card)' }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB - New Product */}
      <Link to="/admin/nuevo-producto" className="admin-fab" title="Nuevo Producto">
        +
      </Link>
    </div>
  );
};

export default Dashboard;
