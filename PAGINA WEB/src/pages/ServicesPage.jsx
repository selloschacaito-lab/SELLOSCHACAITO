import React from 'react';

const services = [
  { 
    title: 'Cambio de almohadilla', 
    desc: 'Reemplazamos la almohadilla interna desgastada para que tu sello vuelva a imprimir con tinta fresca y uniforme.',
    price: '$5'
  },
  { 
    title: 'Goma nueva', 
    desc: 'Si cambiaste de cargo, dirección o empresa, podemos fabricar una goma nueva para tu mecanismo actual.',
    price: '$8'
  },
  { 
    title: 'Limpieza profunda', 
    desc: 'Desarmamos el sello y limpiamos restos de tinta seca y polvo del mecanismo interno.',
    price: '$3'
  },
  { 
    title: 'Recarga de tinta', 
    desc: 'Aplicamos la cantidad correcta de tinta original Trodat/Shiny a tu almohadilla actual.',
    price: '$2'
  },
  { 
    title: 'Reparación completa', 
    desc: 'Incluye limpieza profunda, lubricación del mecanismo, recarga de tinta y ajuste general.',
    price: '$7'
  }
];

const ServicesPage = () => {
  return (
    <main style={{ padding: '4rem 0', backgroundColor: 'var(--color-bg-secondary)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '2rem', textAlign: 'center' }}>
          Reparación de Sellos
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', textAlign: 'center', marginBottom: '3rem' }}>
          Dale una segunda vida a tu mecanismo. No necesitas comprar uno nuevo si está en buenas condiciones.
        </p>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {services.map((svc, index) => (
            <div key={index} style={{ 
              backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: '12px', 
              border: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                  {svc.title}
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', margin: 0, maxWidth: '500px' }}>
                  {svc.desc}
                </p>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                {svc.price}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <a href="https://wa.me/584241345488" target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
            Solicitar reparación
          </a>
        </div>
      </div>
    </main>
  );
};

export default ServicesPage;
