import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, deleteCategory } from '../../services/db';

const CategoryDashboard = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    const data = await getCategories();
    // Excluir 'todos' si está en el fallback
    setCategories(data.filter(c => c.id !== 'todos'));
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Eliminar la categoría "${name}"?`)) {
      try {
        await deleteCategory(id);
        fetchCategories();
      } catch (error) {
        alert("Error al eliminar la categoría.");
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-text-main)', margin: '0 0 0.25rem 0' }}>Categorías</h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.85rem' }}>
          {categories.length} categoría{categories.length !== 1 ? 's' : ''} en tu catálogo
        </p>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando categorías...</div>
      ) : categories.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-card)', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
          No tienes categorías. Toca el botón + para crear una.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {categories.map((cat) => (
            <div key={cat.id} className="admin-card">
              <div className="admin-card-row">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="admin-card-thumb" />
                ) : (
                  <div className="admin-card-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: 'var(--color-text-secondary)' }}>📁</div>
                )}
                <div className="admin-card-info">
                  <h3>{cat.name || cat.label}</h3>
                  <p className="card-meta">
                    <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{cat.id}</span>
                  </p>
                  {cat.description && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '0.2rem 0 0 0' }}>{cat.description}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="admin-card-actions">
                <Link 
                  to={`/admin/categorias/editar/${cat.id}`} 
                  className="btn" 
                  style={{ textDecoration: 'none', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-main)' }}
                >
                  ✏️ Editar
                </Link>
                <button 
                  onClick={() => handleDelete(cat.id, cat.name || cat.label)} 
                  className="btn" 
                  style={{ border: '1px solid #fee2e2', color: '#b91c1c', backgroundColor: 'var(--color-bg-card)' }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB - New Category */}
      <Link to="/admin/categorias/nueva" className="admin-fab" title="Nueva Categoría">
        +
      </Link>
    </div>
  );
};

export default CategoryDashboard;
