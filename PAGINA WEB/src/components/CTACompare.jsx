import React from 'react';
import { Link } from 'react-router-dom';

const CTACompare = () => {
  return (
    <section className="cta-compare" style={{ padding: '4rem 0', backgroundColor: 'var(--color-bg-secondary)', textAlign: 'center' }}>
      <div className="container" style={{ maxWidth: '600px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
          ¿No sabes qué tamaño necesitas?
        </h2>
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Compara nuestros modelos y descubre cuál se adapta mejor a la información que necesitas colocar.
        </p>
        <Link to="/" className="btn btn-primary" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
          Comparar tamaños
        </Link>
      </div>
    </section>
  );
};

export default CTACompare;
