import React from 'react';
import { useSelection } from '../context/SelectionContext';
import { Link } from 'react-router-dom';

const ComparePage = () => {
  const { selectedItems, removeItem } = useSelection();

  if (selectedItems.length === 0) {
    return (
      <main style={{ padding: '4rem 2rem', minHeight: '80vh', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--color-text-main)' }}>Comparar Modelos</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          No has seleccionado ningún modelo para comparar.
        </p>
        <Link to="/" className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: 'var(--border-radius-md)' }}>
          Ir al Catálogo
        </Link>
      </main>
    );
  }

  return (
    <main style={{ padding: '4rem 1rem', minHeight: '80vh' }}>
      <div className="container">
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--color-text-main)', textAlign: 'center' }}>Comparativa de Sellos</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '3rem', textAlign: 'center' }}>
          Analiza las diferencias entre los modelos que has seleccionado para encontrar el ideal para ti.
        </p>

        <div style={{ overflowX: 'auto', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ padding: '1.5rem', textAlign: 'left', borderBottom: '1px solid var(--color-border)', width: '200px' }}>
                  Característica
                </th>
                {selectedItems.map(item => (
                  <th key={item.id} style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      {item.variants && item.variants[0] ? (
                        <img src={item.variants[0].imageUrl} alt={item.name} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)' }} />
                      ) : (
                        <div style={{ width: '100px', height: '100px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)' }}>Sin foto</div>
                      )}
                      <div>
                        <div style={{ fontSize: '1.25rem', color: 'var(--color-text-main)' }}>{item.name}</div>
                        <div style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginTop: '0.25rem' }}>${item.price}</div>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', border: '1px solid #ef4444', color: '#ef4444', backgroundColor: 'transparent' }}>
                        Quitar
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '1.5rem', fontWeight: '600', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>Dimensiones</td>
                {selectedItems.map(item => (
                  <td key={item.id} style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }}>
                    {item.dimensions || '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: '1.5rem', fontWeight: '600', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>Capacidad Aprox.</td>
                {selectedItems.map(item => (
                  <td key={item.id} style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }}>
                    {item.capacity && item.capacity.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {item.capacity.map((cap, i) => (
                          <li key={i} style={{ fontSize: '0.875rem' }}>{cap}</li>
                        ))}
                      </ul>
                    ) : '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: '1.5rem', fontWeight: '600', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)' }}>Colores Disponibles</td>
                {selectedItems.map(item => (
                  <td key={item.id} style={{ padding: '1.5rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)', borderLeft: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {item.variants && item.variants.map((v, i) => (
                        <div key={i} title={v.colorName} style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: v.hex, border: '1px solid var(--color-border)', opacity: v.available ? 1 : 0.3 }} />
                      ))}
                      {(!item.variants || item.variants.length === 0) && '-'}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: '1.5rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Descripción</td>
                {selectedItems.map(item => (
                  <td key={item.id} style={{ padding: '1.5rem', textAlign: 'center', borderLeft: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                    {item.shortDescription || '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default ComparePage;
