import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/db';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCats = async () => {
      const data = await getCategories();
      // Filtramos 'todos' para que no salga como una tarjeta aquí
      setCategories(data.filter(c => c.id !== 'todos'));
      setLoading(false);
    };
    fetchCats();
  }, []);

  return (
    <section id="catalogo" className="categories-section bg-white" style={{ padding: '4rem 0' }}>
      <div className="container">
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem', fontWeight: '700' }}>
          Categorías
        </h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando categorías...</div>
        ) : (
          <div className="categories-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            {categories.map((cat) => (
              <Link to={`/?categoria=${cat.id}`} key={cat.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="category-card" style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, boxShadow 0.2s',
                  backgroundColor: 'var(--color-bg-secondary)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  {cat.imageUrl ? (
                    <img 
                      src={cat.imageUrl} 
                      alt={cat.name} 
                      style={{ height: '150px', width: '100%', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} 
                    />
                  ) : (
                    <div className="cat-image-placeholder" style={{ height: '150px', backgroundColor: 'var(--color-border)', borderRadius: '8px', marginBottom: '1rem' }}></div>
                  )}
                  
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{cat.name}</h3>
                  <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', flexGrow: 1 }}>{cat.description}</p>
                  
                  <div className="btn" style={{ width: '100%', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}>
                    Ver modelos
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;
