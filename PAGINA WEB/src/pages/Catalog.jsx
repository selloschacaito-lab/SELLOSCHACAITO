import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import { getProducts, getCategories } from '../services/db';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const Catalog = ({ isResellerMode = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('categoria');
  const urlView = searchParams.get('view') || 'productos'; // 'productos' o 'categorias'

  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('recomendados'); // 'recomendados', 'precio_asc', 'precio_desc', 'nuevos', 'az'

  useScrollAnimation([products, categories, urlView, urlCategory, searchTerm]);

  useEffect(() => {
    if (isResellerMode) {
      document.body.classList.add('reseller-theme');
    } else {
      document.body.classList.remove('reseller-theme');
    }
    return () => document.body.classList.remove('reseller-theme');
  }, [isResellerMode]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        getProducts(),
        getCategories()
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setLoading(false);
    };
    
    fetchData();
  }, []);

  const handleSetView = (view) => {
    setSearchParams(view === 'productos' ? {} : { view });
  };

  const handleCategoryClick = (catId) => {
    setSearchParams({ categoria: catId });
  };

  const handleBackToCategories = () => {
    setSearchParams({});
  };

  // Filtrado y Ordenamiento de Productos
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.dimensions && p.dimensions.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortOption === 'recomendados') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      }
      if (sortOption === 'az') return a.name.localeCompare(b.name);
      if (sortOption === 'za') return b.name.localeCompare(a.name);
      if (sortOption === 'precio_asc') {
        const pA = isResellerMode ? (a.resellerPrice || Math.round(a.price * 0.8)) : a.price;
        const pB = isResellerMode ? (b.resellerPrice || Math.round(b.price * 0.8)) : b.price;
        return (Number(pA) || 0) - (Number(pB) || 0);
      }
      if (sortOption === 'precio_desc') {
        const pA = isResellerMode ? (a.resellerPrice || Math.round(a.price * 0.8)) : a.price;
        const pB = isResellerMode ? (b.resellerPrice || Math.round(b.price * 0.8)) : b.price;
        return (Number(pB) || 0) - (Number(pA) || 0);
      }
      if (sortOption === 'nuevos') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      return 0;
    });

  if (loading) {
    return (
      <main style={{ padding: '4rem 0', backgroundColor: 'var(--color-bg-secondary)', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2 style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', fontWeight: '600' }}>Cargando catálogo...</h2>
      </main>
    );
  }

  // Vista 1: Productos de una sola categoría
  if (urlCategory) {
    const currentCategory = categories.find(c => c.id === urlCategory);
    const categoryProducts = filteredProducts.filter(p => p.category === urlCategory);
    
    return (
      <main className="catalog-page" style={{ padding: '0', backgroundColor: 'var(--color-bg-secondary)', minHeight: '80vh' }}>
        
        {/* Chips Horizontales Deslizables */}
        <div className="chips-container">
          <button 
            onClick={() => setSearchParams({})}
            className="category-chip"
          >
            ✨ Todo el Catálogo
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`category-chip ${urlCategory === cat.id ? 'active' : ''}`}
            >
              {cat.name || cat.label}
            </button>
          ))}
        </div>

        <div className="catalog-fluid-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button 
              onClick={handleBackToCategories}
              className="btn"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
            >
              ← Volver
            </button>
            
            <button 
              onClick={() => {
                const url = `${window.location.origin}/?categoria=${currentCategory?.id}`;
                if (navigator.share) {
                  navigator.share({
                    title: `Categoría: ${currentCategory?.name} - Sellos Chacaíto`,
                    url: url
                  }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(url);
                }
              }}
              style={{
                backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '8px',
                padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem',
                cursor: 'pointer', color: 'var(--color-text-main)', fontSize: '0.8rem', fontWeight: '600'
              }}
              title="Compartir Categoría"
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Compartir
            </button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            {isResellerMode && (
              <span style={{ backgroundColor: 'rgba(255, 184, 0, 0.15)', color: '#FFB800', border: '1px solid rgba(255, 184, 0, 0.35)', fontSize: '0.7rem', fontWeight: '800', padding: '0.15rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginBottom: '0.25rem' }}>
                👑 MAYORISTAS · -20% APLICADO
              </span>
            )}
            <h1 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0, color: isResellerMode ? '#F5F7FA' : 'var(--color-text-main)' }}>
              {currentCategory?.name || currentCategory?.label || 'Categoría'}
            </h1>
            {currentCategory?.description && (
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem', fontSize: '0.85rem' }}>
                {currentCategory.description}
              </p>
            )}
          </div>

          {/* Buscador y Filtro Compacto en una sola fila sin desborde */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
            <input 
              type="text" 
              placeholder={`🔍 Buscar en ${currentCategory?.name || 'categoría'}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: '1 1 0%', minWidth: 0, padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={{ flex: '0 0 auto', padding: '0.6rem 0.5rem', borderRadius: '10px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)', fontSize: '0.8rem', cursor: 'pointer', maxWidth: '130px', boxSizing: 'border-box' }}
            >
              <option value="recomendados">Recomendados</option>
              <option value="precio_asc">Menor precio</option>
              <option value="precio_desc">Mayor precio</option>
              <option value="nuevos">Más nuevos</option>
              <option value="az">A - Z</option>
            </select>
          </div>

          <div key={urlCategory} className="products-grid content-fade-in">
            {categoryProducts.length > 0 ? (
              categoryProducts.map((product, index) => (
                <div key={product.id} className="fade-in-up" style={{ transitionDelay: `${index * 30}ms` }}>
                  <ProductCard product={product} isResellerMode={isResellerMode} />
                </div>
              ))
            ) : (
              <p style={{ gridColumn: '1 / -1', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>
                No encontramos productos en esta categoría.
              </p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Vista 2: Catálogo General con Chips
  return (
    <main className="catalog-page" style={{ padding: '0', backgroundColor: 'var(--color-bg-secondary)', minHeight: '80vh', width: '100%', overflowX: 'hidden' }}>
      
      {/* Chips Horizontales Deslizables */}
      <div className="chips-container">
        <button 
          onClick={() => { handleSetView('productos'); setSearchParams({}); }}
          className={`category-chip ${urlView === 'productos' ? 'active' : ''}`}
        >
          ✨ Todos los Productos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className="category-chip"
          >
            {cat.name || cat.label}
          </button>
        ))}
      </div>

      <div className="catalog-fluid-container">
        
        {/* Banner Sobrio de Mayoristas (Elegante y sin sobrecargar) */}
        {isResellerMode && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.12) 0%, rgba(18, 22, 30, 0.95) 100%)',
            border: '1px solid rgba(255, 184, 0, 0.35)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.25rem' }}>👑</span>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#FFB800', letterSpacing: '0.3px' }}>
                  MAYORISTAS
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9DA6B5' }}>
                  Tarifa distribuidor · 20% aplicado
                </div>
              </div>
            </div>
            <span style={{ backgroundColor: 'rgba(255, 184, 0, 0.15)', color: '#FFB800', border: '1px solid rgba(255, 184, 0, 0.35)', fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
              ACTIVO
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: isResellerMode ? '#F5F7FA' : 'var(--color-text-main)' }}>
            {isResellerMode ? 'Catálogo Mayorista' : 'Catálogo'}
          </h1>
          
          {/* Selector de Vista (Productos / Categorías) */}
          <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--color-bg-card)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
            <button 
              onClick={() => handleSetView('productos')}
              style={{
                background: urlView === 'productos' ? 'var(--color-primary)' : 'transparent',
                color: urlView === 'productos' ? '#000' : 'var(--color-text-secondary)',
                border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem',
                fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer'
              }}
            >
              Productos
            </button>
            <button 
              onClick={() => handleSetView('categorias')}
              style={{
                background: urlView === 'categorias' ? 'var(--color-primary)' : 'transparent',
                color: urlView === 'categorias' ? '#000' : 'var(--color-text-secondary)',
                border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem',
                fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer'
              }}
            >
              Categorías
            </button>
          </div>
        </div>

        {/* Buscador general y Filtro compacto en una sola fila sin desborde */}
        {urlView === 'productos' && (
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
            <input 
              type="text" 
              placeholder="🔍 Buscar modelo o medida..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: '1 1 0%', minWidth: 0, padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '0.85rem', boxSizing: 'border-box' }}
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={{ flex: '0 0 auto', padding: '0.6rem 0.5rem', borderRadius: '10px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)', fontSize: '0.8rem', cursor: 'pointer', maxWidth: '130px', boxSizing: 'border-box' }}
            >
              <option value="recomendados">Recomendados</option>
              <option value="precio_asc">Menor precio</option>
              <option value="precio_desc">Mayor precio</option>
              <option value="nuevos">Más nuevos</option>
              <option value="az">A - Z</option>
            </select>
          </div>
        )}

        {/* Grilla de Contenido con 2 columnas en móvil y alta densidad */}
        {urlView === 'categorias' ? (
          <div key="grid-categorias" className="products-grid content-fade-in">
            {categories.map((cat, index) => (
              <div key={cat.id} className="fade-in-up" style={{ transitionDelay: `${index * 30}ms` }}>
                <CategoryCard 
                  category={cat} 
                  onClick={() => handleCategoryClick(cat.id)} 
                />
              </div>
            ))}
            {categories.length === 0 && <p style={{ color: 'var(--color-text-secondary)' }}>No hay categorías registradas.</p>}
          </div>
        ) : (
          <div key={`grid-productos-${sortOption}`} className="products-grid content-fade-in">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => (
                <div key={product.id} className="fade-in-up" style={{ transitionDelay: `${index * 25}ms` }}>
                  <ProductCard product={product} isResellerMode={isResellerMode} />
                </div>
              ))
            ) : (
              <p style={{ gridColumn: '1 / -1', color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>
                No encontramos productos que coincidan con tu búsqueda.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default Catalog;
