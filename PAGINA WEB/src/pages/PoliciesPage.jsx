import React from 'react';

const PoliciesPage = () => {
  return (
    <main style={{ padding: '4rem 0', backgroundColor: 'var(--color-bg-card)', minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '2rem' }}>
          Políticas de la Empresa
        </h1>
        
        <div style={{ color: 'var(--color-text-main)', lineHeight: '1.8', fontSize: '1.125rem' }}>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>
            1. Políticas de Diseño y Aprobación
          </h2>
          <p>
            El diseño será enviado al cliente para su revisión y aprobación antes de proceder a la fabricación. 
            El cliente es responsable de verificar minuciosamente que todos los datos, ortografía, números y logos estén correctos. 
            Una vez aprobado el diseño, cualquier error detectado tras la fabricación requerirá el pago de una goma nueva.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>
            2. Facturación
          </h2>
          <p>
            Para procesar facturas solicitamos la siguiente información obligatoria:
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li><strong>Persona natural:</strong> Nombre, Apellido, Cédula de Identidad, Teléfono, Dirección.</li>
            <li><strong>Empresa:</strong> Razón Social, RIF, Dirección Fiscal, Teléfono.</li>
          </ul>

          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>
            3. Pagos y Precios
          </h2>
          <p>
            Los precios expresados en dólares americanos ($) son referenciales. 
            Los pagos en moneda nacional se calcularán a la tasa oficial del Banco Central de Venezuela (BCV) del día en que se procesa el pago. 
            Requerimos el pago del 100% (o un abono acordado) para iniciar el proceso de fabricación.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '2rem', marginBottom: '1rem' }}>
            4. Envíos y Delivery
          </h2>
          <p>
            El servicio de delivery es prestado por terceros. Sellos Chacaíto no se hace responsable por retrasos o inconvenientes originados durante el traslado por parte de las empresas de encomienda (MRW, ZOOM) o los motorizados. 
            El costo del delivery se cancela en efectivo directamente al repartidor, a menos que se indique lo contrario.
          </p>
          
        </div>
      </div>
    </main>
  );
};

export default PoliciesPage;
