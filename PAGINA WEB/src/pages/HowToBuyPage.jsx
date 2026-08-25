import React from 'react';

const steps = [
  { 
    num: 1,
    title: 'Envíanos la información', 
    content: 'Envíanos por WhatsApp el texto, logo o imagen que deseas colocar en tu sello.' 
  },
  { 
    num: 2,
    title: 'Elegimos el modelo y tamaño', 
    content: 'Revisamos tu información y te recomendamos el tipo y tamaño de sello que mejor se adapte al diseño.' 
  },
  { 
    num: 3,
    title: 'Preparamos tu diseño', 
    content: 'Realizamos una maqueta digital para que veas exactamente cómo quedará distribuida la información.',
    highlight: '✨ Ves el diseño antes de pagar'
  },
  { 
    num: 4,
    title: 'Apruebas', 
    content: 'Apruebas el diseño final, modelo, tamaño y color del mecanismo.' 
  },
  { 
    num: 5,
    title: 'Realizas el pago', 
    content: 'Una vez aprobado todo, realizas el pago mediante pago móvil, transferencia o efectivo en USD.' 
  },
  { 
    num: 6,
    title: 'Fabricamos', 
    content: 'Fabricamos el sello exactamente según el diseño que aprobaste, cuidando la definición y legibilidad.' 
  },
  { 
    num: 7,
    title: 'Recibes tu sello', 
    content: 'Puedes retirar en Chacaíto, solicitar delivery en Caracas o recibirlo por MRW / Zoom a nivel nacional.' 
  }
];

const HowToBuyPage = () => {
  const handleWhatsApp = () => {
    const text = 'Hola Sellos Chacaíto, quisiera comenzar un pedido de sello.';
    window.open(`https://wa.me/584241345488?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <main style={{ padding: '1.25rem 0 3rem 0', backgroundColor: 'var(--color-bg-secondary)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '640px', padding: '0 1rem' }}>
        
        {/* Encabezado Compacto y Directo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.35rem', color: 'var(--color-text-main)' }}>
            Cómo Comprar
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', fontWeight: '500', maxWidth: '480px', margin: '0 auto', lineHeight: '1.4' }}>
            Antes de pagar, <strong style={{ color: 'var(--color-text-main)' }}>revisas y apruebas</strong> el diseño, modelo, tamaño y color de tu sello.
          </p>
        </div>

        {/* Línea de Proceso Vertical (Timeline) */}
        <div style={{ 
          backgroundColor: 'var(--color-bg-card)', 
          padding: '1.5rem 1.25rem', 
          borderRadius: '20px', 
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          marginBottom: '1.5rem'
        }}>
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <div key={index} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                
                {/* Columna Izquierda: Número y Línea Conectora */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    backgroundColor: step.highlight ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                    color: step.highlight ? '#11141B' : 'var(--color-text-main)',
                    border: `2px solid ${step.highlight ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: '0.85rem', flexShrink: 0,
                    zIndex: 2
                  }}>
                    {step.num}
                  </div>
                  {!isLast && (
                    <div style={{
                      width: '2px', flexGrow: 1, minHeight: '36px',
                      backgroundColor: 'var(--color-border)',
                      margin: '0.25rem 0'
                    }} />
                  )}
                </div>

                {/* Columna Derecha: Contenido del Paso */}
                <div style={{ paddingBottom: isLast ? '0' : '1.5rem', flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text-main)', margin: 0 }}>
                      {step.title}
                    </h3>
                    {step.highlight && (
                      <span style={{
                        backgroundColor: 'rgba(71, 255, 0, 0.15)',
                        color: 'var(--color-primary)',
                        border: '1px solid rgba(71, 255, 0, 0.3)',
                        fontSize: '0.68rem', fontWeight: '800',
                        padding: '0.1rem 0.4rem', borderRadius: '4px'
                      }}>
                        {step.highlight}
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: '1.45', margin: 0 }}>
                    {step.content}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

        {/* CTA de Cierre Comercial */}
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-text-main)', marginBottom: '0.35rem' }}>
            ¿Listo para hacer tu sello?
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Envíanos tu información y preparamos tu maqueta digital sin compromiso.
          </p>
          <button 
            onClick={handleWhatsApp}
            className="btn btn-whatsapp"
            style={{
              width: '100%', maxWidth: '340px', padding: '0.85rem',
              fontSize: '1rem', fontWeight: '700', borderRadius: '10px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              border: 'none', cursor: 'pointer'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            Comenzar pedido por WhatsApp
          </button>
        </div>

      </div>
    </main>
  );
};

export default HowToBuyPage;
