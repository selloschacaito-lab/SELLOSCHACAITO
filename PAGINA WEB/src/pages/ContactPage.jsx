import React from 'react';

const ContactPage = () => {
  return (
    <main style={{ padding: '4rem 0', backgroundColor: 'var(--color-bg-secondary)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '2rem' }}>
          Contacto
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>
          Estamos aquí para ayudarte a elegir el sello perfecto.
        </p>

        <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '3rem', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Escríbenos por WhatsApp</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Es nuestro canal principal y la forma más rápida de obtener tu presupuesto y diseño.</p>
            <a href="https://wa.me/584241345488" target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
              +58 424-1345488
            </a>
          </div>

          <hr style={{ borderTop: '1px solid var(--color-border)', borderBottom: 'none' }} />

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Horario de Atención</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.125rem' }}>Lunes a Viernes<br/>8:00 AM - 5:00 PM</p>
          </div>

          <hr style={{ borderTop: '1px solid var(--color-border)', borderBottom: 'none' }} />

          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Instagram</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Síguenos para ver nuestros trabajos recientes.</p>
            <a href="https://www.instagram.com/sellos.chacaito/" target="_blank" rel="noopener noreferrer" className="btn" style={{ border: '1px solid var(--color-border)', textDecoration: 'none', color: 'var(--color-text-main)' }}>
              @SellosChacaito
            </a>
          </div>

        </div>
      </div>
    </main>
  );
};

export default ContactPage;
