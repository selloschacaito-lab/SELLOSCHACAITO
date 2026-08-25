import React from 'react';

const faqList = [
  { q: '¿Pueden hacer el diseño?', a: 'Sí, contamos con servicio de diseño.' },
  { q: '¿Puedo enviar una foto o logo?', a: 'Sí, aunque la calidad del archivo condiciona cuánto puede aprovecharse (preferiblemente vectores, PDF o PNG alta resolución).' },
  { q: '¿Cuántos cambios puedo hacer?', a: 'Podemos realizar ajustes razonables antes de aprobar el diseño final.' },
  { q: '¿Hacen delivery?', a: 'Sí, mediante un servicio externo. El costo depende de la zona.' },
  { q: '¿Hacen envíos nacionales?', a: 'Sí, a través de MRW o ZOOM (Cobro en destino).' }
];

const FAQ = () => {
  return (
    <section id="faq" className="faq-section bg-white" style={{ padding: '4rem 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '3rem', fontWeight: '700' }}>
          Preguntas frecuentes
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqList.map((item, index) => (
            <div key={index} style={{
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '1.25rem',
              backgroundColor: 'var(--color-bg-secondary)'
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>{item.q}</h3>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>{item.a}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button className="btn" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            Ver todas las preguntas
          </button>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
