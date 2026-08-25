import React, { useState } from 'react';

const faqList = [
  { 
    q: '¿Qué sello o modelo necesito?', 
    a: 'No te preocupes si no conoces los modelos. Solo envíanos por WhatsApp el texto, logo o información que llevará tu sello y te asesoramos recomendándote el tamaño y tipo de mecanismo ideal.' 
  },
  { 
    q: '¿Pueden hacer el diseño de mi sello?', 
    a: 'Sí. Preparamos la maqueta digital con la distribución de tu información sin costo adicional. Si envías un logo, verificamos que sea apto para el grabado.' 
  },
  { 
    q: '¿Puedo enviar una foto o logo?', 
    a: 'Sí, aceptamos archivos en JPG, PNG, PDF o enlaces de Canva. Revisamos tu archivo y te avisamos si la resolución es óptima para el grabado.' 
  },
  { 
    q: '¿Cuántos cambios puedo hacer al diseño?', 
    a: 'Realizamos los ajustes razonables que necesites en la maqueta digital hasta que apruebes el diseño final antes de fabricar.' 
  },
  { 
    q: '¿Qué pasa si me equivoco en un dato después de aprobar el diseño?', 
    a: 'Como los sellos se fabrican inmediatamente después de tu aprobación, una corrección posterior a la fabricación requiere elaborar una goma nueva de reemplazo con un costo preferencial.' 
  },
  { 
    q: '¿Cuánto tarda la fabricación?', 
    a: 'Tu sello está listo entre 24 a 48 horas hábiles tras la confirmación del pago y la aprobación del diseño final.' 
  },
  { 
    q: '¿Hacen delivery en Caracas?', 
    a: 'Sí, contamos con servicio de delivery externo en moto para Caracas. El costo del flete se cancela directamente al motorizado al momento de la entrega.' 
  },
  { 
    q: '¿Hacen envíos nacionales?', 
    a: 'Sí, realizamos envíos a toda Venezuela a través de MRW o ZOOM bajo la modalidad de cobro en destino.' 
  }
];

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleWhatsApp = () => {
    const text = 'Hola Sellos Chacaíto, tengo una consulta sobre sus sellos.';
    window.open(`https://wa.me/584241345488?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <main style={{ padding: '1.25rem 0 3rem 0', backgroundColor: 'var(--color-bg-secondary)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '640px', padding: '0 1rem' }}>
        
        {/* Encabezado Compacto */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.35rem', color: 'var(--color-text-main)' }}>
            Preguntas Frecuentes
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', fontWeight: '500', margin: '0 auto', maxWidth: '420px' }}>
            Resolvemos tus dudas sobre modelos, diseño, tiempos y entregas.
          </p>
        </div>

        {/* Lista de Acordeón */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem' }}>
          {faqList.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                style={{
                  border: `1px solid ${isOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: '14px',
                  backgroundColor: 'var(--color-bg-card)',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: isOpen ? '0 4px 15px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                {/* Botón de Pregunta */}
                <button
                  onClick={() => toggleAccordion(index)}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    gap: '0.75rem'
                  }}
                >
                  <span style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: '700', 
                    color: isOpen ? 'var(--color-primary)' : 'var(--color-text-main)',
                    lineHeight: '1.3'
                  }}>
                    {item.q}
                  </span>
                  
                  {/* Ícono de Estado + / - */}
                  <span style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: isOpen ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                    color: isOpen ? '#11141B' : 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: '800',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {/* Respuesta Desplegable */}
                {isOpen && (
                  <div 
                    className="content-fade-in"
                    style={{
                      padding: '0 1.1rem 1rem 1.1rem',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.88rem',
                      lineHeight: '1.5',
                      borderTop: '1px solid var(--color-border)',
                      paddingTop: '0.75rem'
                    }}
                  >
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA de Consulta a WhatsApp */}
        <div style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--color-text-main)', marginBottom: '0.3rem' }}>
            ¿Tienes alguna otra duda?
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Escríbenos directamente y te asesoramos con tu pedido al instante.
          </p>
          <button 
            onClick={handleWhatsApp}
            className="btn btn-whatsapp"
            style={{
              width: '100%', maxWidth: '320px', padding: '0.8rem',
              fontSize: '0.95rem', fontWeight: '700', borderRadius: '10px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              border: 'none', cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            Preguntar por WhatsApp
          </button>
        </div>

      </div>
    </main>
  );
};

export default FAQPage;
