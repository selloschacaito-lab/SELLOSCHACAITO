import React, { useState, useEffect } from 'react';
import { useWholesale } from '../context/WholesaleContext';
import Catalog from './Catalog';
import ProductSkeletonGrid from '../components/ProductSkeletonGrid';
import WholesaleRegistrationModal from '../components/WholesaleRegistrationModal';
import WholesaleProfileModal from '../components/WholesaleProfileModal';

const WholesalePortal = () => {
  const { 
    currentUser, 
    profile, 
    loading, 
    isApprovedWholesaler, 
    isPending, 
    isSuspended, 
    reloadProfile, 
    logout 
  } = useWholesale();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showSweep, setShowSweep] = useState(true);

  // Activar el barrido de reflejo dorado al entrar
  useEffect(() => {
    setShowSweep(true);
    const timer = setTimeout(() => setShowSweep(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  const handleConfirmWhatsApp = () => {
    const nombre = profile?.razonSocial || profile?.nombre || 'Mayorista';
    const rif = profile?.rif || 'Sin RIF';
    const text = `Hola Sellos Chacaíto, acabo de registrar mi solicitud de cuenta mayorista para ${nombre} (RIF: ${rif}).`;
    window.open(`https://wa.me/584241345488?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Cargando estado de autenticación
  if (loading) {
    return (
      <div style={{ backgroundColor: '#0B0D12', minHeight: '85vh' }}>
        <ProductSkeletonGrid isResellerMode={true} />
      </div>
    );
  }

  // -------------------------------------------------------------
  // CASO 1: MAYORISTA APROBADO (Acceso Completo al Catálogo VIP)
  // -------------------------------------------------------------
  if (currentUser && isApprovedWholesaler) {
    return (
      <div className="wholesale-portal-approved" style={{ position: 'relative' }}>
        {showSweep && <div className="golden-sweep-overlay" />}

        {/* Barra Superior VIP con Datos del Mayorista */}
        <div style={{
          backgroundColor: '#0E121A',
          borderBottom: '1px solid rgba(255, 184, 0, 0.3)',
          padding: '0.6rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.6rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>👑</span>
            <div>
              <span style={{ color: '#FFB800', fontWeight: '800', fontSize: '0.88rem', letterSpacing: '0.3px' }}>
                {profile?.razonSocial || profile?.nombre || 'Mayorista VIP'}
              </span>
              <span style={{ color: '#9DA6B5', fontSize: '0.72rem', marginLeft: '0.4rem' }}>
                · {profile?.discount || 20}% de Descuento Activo
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              style={{
                padding: '0.35rem 0.75rem', backgroundColor: 'rgba(255, 184, 0, 0.15)',
                border: '1px solid rgba(255, 184, 0, 0.4)', color: '#FFB800',
                borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem'
              }}
            >
              👤 Mi Perfil
            </button>

            <button
              onClick={logout}
              style={{
                padding: '0.35rem 0.65rem', backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)', color: '#9DA6B5',
                borderRadius: '8px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer'
              }}
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Renderiza el Catálogo con Tema Mayorista */}
        <Catalog isResellerMode={true} />

        {/* Modal de Edición de Perfil */}
        <WholesaleProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // CASO 2: SOLICITUD EN REVISIÓN (Pendiente de Aprobación Manual)
  // -------------------------------------------------------------
  if (currentUser && isPending) {
    return (
      <main style={{
        minHeight: '85vh', backgroundColor: '#0B0D12', color: '#F5F7FA',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem'
      }}>
        {showSweep && <div className="golden-sweep-overlay" />}

        <div style={{
          backgroundColor: '#12161E',
          border: '1px solid rgba(255, 184, 0, 0.35)',
          borderRadius: '20px',
          padding: '2rem 1.5rem',
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🟡</div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#FFB800', marginBottom: '0.4rem' }}>
            Solicitud en Revisión
          </h1>
          <p style={{ color: '#9DA6B5', fontSize: '0.9rem', lineHeight: '1.45', marginBottom: '1.5rem' }}>
            Hola <strong style={{ color: '#FFF' }}>{profile?.razonSocial || profile?.nombre}</strong>, estamos validando tus datos comerciales para habilitar tu acceso con tarifa de distribuidor.
          </p>

          {/* Resumen de Datos Registrados */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 184, 0, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'left',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}>
            <div><span style={{ color: '#9DA6B5' }}>RIF:</span> <strong style={{ color: '#FFB800' }}>{profile?.rif}</strong></div>
            <div><span style={{ color: '#9DA6B5' }}>WhatsApp:</span> <strong style={{ color: '#FFF' }}>{profile?.whatsappPrincipal || profile?.telefono}</strong></div>
            <div><span style={{ color: '#9DA6B5' }}>Contacto:</span> <span style={{ color: '#FFF' }}>{profile?.contacto || 'N/A'}</span></div>
            <div><span style={{ color: '#9DA6B5' }}>Estado:</span> <span style={{ backgroundColor: 'rgba(255, 184, 0, 0.15)', color: '#FFB800', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '700', fontSize: '0.75rem' }}>PENDIENTE</span></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleConfirmWhatsApp}
              className="btn btn-whatsapp"
              style={{
                padding: '0.85rem', fontSize: '0.95rem', fontWeight: '700', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                border: 'none', cursor: 'pointer', width: '100%'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              💬 Agilizar Aprobación por WhatsApp
            </button>

            <button
              onClick={reloadProfile}
              style={{
                padding: '0.75rem', backgroundColor: 'transparent',
                border: '1px solid rgba(255, 184, 0, 0.3)', color: '#FFB800',
                borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer'
              }}
            >
              🔄 Comprobar si ya fue aprobada
            </button>

            <button
              onClick={logout}
              style={{
                padding: '0.6rem', backgroundColor: 'transparent',
                border: 'none', color: '#9DA6B5',
                fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline'
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // CASO 3: CUENTA SUSPENDIDA
  // -------------------------------------------------------------
  if (currentUser && isSuspended) {
    return (
      <main style={{
        minHeight: '85vh', backgroundColor: '#0B0D12', color: '#F5F7FA',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem'
      }}>
        <div style={{
          backgroundColor: '#12161E', border: '1px solid rgba(255, 107, 107, 0.4)',
          borderRadius: '20px', padding: '2rem 1.5rem', maxWidth: '480px', width: '100%', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⏸️</div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FF6B6B', marginBottom: '0.4rem' }}>
            Acceso Mayorista Suspendido
          </h1>
          <p style={{ color: '#9DA6B5', fontSize: '0.88rem', lineHeight: '1.45', marginBottom: '1.5rem' }}>
            Tu cuenta mayorista se encuentra temporalmente inactiva. Comunícate con nosotros para más información.
          </p>
          <a
            href="https://wa.me/584241345488"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
            style={{
              padding: '0.8rem', fontSize: '0.95rem', fontWeight: '700', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              textDecoration: 'none', marginBottom: '0.75rem'
            }}
          >
            Contactar Soporte por WhatsApp
          </a>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#9DA6B5', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // CASO 4: VISITANTE / NO AUTENTICADO (Bienvenida al Portal)
  // -------------------------------------------------------------
  return (
    <main style={{
      minHeight: '85vh',
      backgroundColor: '#0B0D12',
      color: '#F5F7FA',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative'
    }}>
      {showSweep && <div className="golden-sweep-overlay" />}

      <div style={{
        backgroundColor: '#12161E',
        border: '1px solid rgba(255, 184, 0, 0.35)',
        borderRadius: '24px',
        padding: '2.5rem 1.5rem',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
      }}>
        
        <span style={{ fontSize: '3rem', display: 'inline-block', marginBottom: '0.5rem' }}>👑</span>
        
        <h1 style={{ fontSize: '1.65rem', fontWeight: '900', color: '#FFB800', marginBottom: '0.4rem', letterSpacing: '0.3px' }}>
          Portal Mayoristas
        </h1>
        
        <p style={{ color: '#9DA6B5', fontSize: '0.9rem', lineHeight: '1.45', marginBottom: '1.5rem' }}>
          Acceso exclusivo para distribuidores, papelerías, revendedores y clientes con tarifa especial de Sellos Chacaíto.
        </p>

        {/* Beneficios Clave */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 184, 0, 0.2)',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          textAlign: 'left',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⭐</span>
            <span><strong style={{ color: '#FFB800' }}>20% de Descuento</strong> en todo el catálogo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.1rem' }}>⚡</span>
            <span><strong>Atención prioritaria</strong></span>
          </div>
        </div>

        {/* Botones Principales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            style={{
              width: '100%', padding: '0.9rem', backgroundColor: '#FFB800', color: '#000',
              fontWeight: '800', fontSize: '0.95rem', borderRadius: '12px',
              border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(255, 184, 0, 0.25)'
            }}
          >
            Solicitar Acceso / Iniciar Sesión
          </button>

          <a
            href="/"
            style={{
              color: '#9DA6B5', fontSize: '0.82rem', textDecoration: 'none', marginTop: '0.5rem'
            }}
          >
            ← Volver al Catálogo Público
          </a>
        </div>

      </div>

      {/* Modal de Registro / Login */}
      <WholesaleRegistrationModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onRegistered={() => reloadProfile()}
      />
    </main>
  );
};

export default WholesalePortal;
