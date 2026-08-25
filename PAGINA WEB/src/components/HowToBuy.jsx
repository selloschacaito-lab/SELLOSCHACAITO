import React from 'react';

const steps = [
  { num: 1, title: 'Envíanos la información', desc: 'Texto, logo o diseño por WhatsApp.' },
  { num: 2, title: 'Preparamos el diseño', desc: 'Verificamos qué modelo conviene.' },
  { num: 3, title: 'Apruebas modelo, diseño y color', desc: 'Verificas que todo esté perfecto.' },
  { num: 4, title: 'Realizas el pago', desc: 'Transferencia, pago móvil o divisas.' },
  { num: 5, title: 'Fabricamos tu sello', desc: 'Con la mejor tecnología y materiales.' },
  { num: 6, title: 'Retiro o delivery', desc: 'En nuestra tienda o directo a ti.' }
];

const HowToBuy = () => {
  return (
    <section id="comocomprar" className="how-to-buy bg-white" style={{ padding: '4rem 0' }}>
      <div className="container">
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '3rem', fontWeight: '700' }}>
          Cómo comprar
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem'
        }}>
          {steps.map((step) => (
            <div key={step.num} style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                backgroundColor: 'var(--color-primary)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: '700', margin: '0 auto 1rem'
              }}>
                {step.num}
              </div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>{step.title}</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{step.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
            Nota: Primero comprobamos que la información cabe en el sello y después se procede al pago y fabricación.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowToBuy;
