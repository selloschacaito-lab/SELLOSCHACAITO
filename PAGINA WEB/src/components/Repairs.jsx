import React from 'react';
import { Link } from 'react-router-dom';

const Repairs = () => {
  return (
    <section id="servicios" className="repairs-section" style={{ padding: '4rem 0', backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="container">
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
            ¿Ya tienes un sello?
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', maxWidth: '600px' }}>
            No necesitas comprar uno nuevo si el mecanismo está en buen estado. Ofrecemos mantenimiento y reparación para alargar su vida útil.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem' }}>
            <span style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '20px', fontWeight: '600' }}>Almohadilla nueva</span>
            <span style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '20px', fontWeight: '600' }}>Cambio de goma</span>
            <span style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '20px', fontWeight: '600' }}>Limpieza profunda</span>
            <span style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '20px', fontWeight: '600' }}>Recarga de tinta</span>
          </div>
          
          <Link to="/servicios" className="btn btn-primary">Ver servicios de reparación</Link>
        </div>
      </div>
    </section>
  );
};

export default Repairs;
