import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get, child } from 'firebase/database';
import { db } from '../firebase/config';
import { MapPin, Phone, User, Map, Image as ImageIcon, ArrowLeft, Truck } from 'lucide-react';

function DeliveryView() {
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [locationPhotoData, setLocationPhotoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const orderSnapshot = await get(child(ref(db), `orders/${orderId}`));
        if (!orderSnapshot.exists()) {
          setError("No se encontró el pedido.");
          setLoading(false);
          return;
        }

        const data = orderSnapshot.val();
        setOrderData(data);
        const orderNum = data.orderNumber ? `#${data.orderNumber}` : `#${orderId.slice(-5)}`;
        document.title = `Pedido ${orderNum}`;

        if (data.hasLocationPhoto) {
          const locationSnapshot = await get(child(ref(db), `orderAssets/locationPhoto/${orderId}`));
          if (locationSnapshot.exists()) {
            setLocationPhotoData(locationSnapshot.val());
          }
        }
      } catch (err) {
        console.error("Error cargando la orden para delivery:", err);
        setError("Ocurrió un error al cargar la información.");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      fetchData();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTopColor: '#0284c7', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b' }}>Cargando datos de envío...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem' }}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px' }}>
          <Truck size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>No Encontrado</h2>
          <p style={{ color: '#64748b' }}>{error || "No se encontró información para este envío."}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            width: '56px', height: '56px', borderRadius: '50%', background: '#e0f2fe', 
            color: '#0284c7', marginBottom: '1rem'
          }}>
            <Truck size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.25rem' }}>
            Ficha de Envío
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 0.25rem 0' }}>
            Sellos Chacaito
          </p>
          <div style={{ display: 'inline-block', background: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            ORDEN #{orderData.orderNumber || orderId.replace('order_', '').slice(-6)}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
          
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Cliente */}
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <User size={14} /> Cliente
              </span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {orderData.clientName || 'Cliente sin nombre'}
              </p>
            </div>

            {/* Teléfono */}
            {orderData.whatsapp && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  <Phone size={14} /> Teléfono
                </span>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.75rem 0' }}>
                  {orderData.whatsapp}
                </p>
                <a 
                  href={`https://wa.me/${orderData.whatsapp.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}
                >
                  <Phone size={16} /> Escribir por WhatsApp
                </a>
              </div>
            )}

            {/* Dirección */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <MapPin size={14} /> Dirección de Entrega
              </span>
              
              <p style={{ fontSize: '1rem', color: '#334155', margin: orderData.mapsLink ? '0 0 1rem 0' : '0', lineHeight: 1.5 }}>
                {orderData.clientAddress ? orderData.clientAddress : 'No especificada por el operador.'}
              </p>

              {orderData.mapsLink && (
                <a 
                  href={orderData.mapsLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#e0f2fe', color: '#0284c7', padding: '0.75rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600, width: '100%', boxSizing: 'border-box' }}
                >
                  <Map size={18} /> Abrir en Google Maps
                </a>
              )}
            </div>

            {/* Foto Fachada */}
            {locationPhotoData && locationPhotoData.fullDataUrl && (
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  <ImageIcon size={14} /> Foto de Ubicación / Fachada
                </span>
                
                <div 
                  style={{ border: '2px solid #e2e8f0', borderRadius: '1rem', overflow: 'hidden', background: '#f1f5f9', cursor: 'zoom-in', position: 'relative' }}
                  onClick={() => setZoomedImage(locationPhotoData.fullDataUrl)}
                >
                  <img 
                    src={locationPhotoData.fullDataUrl} 
                    alt="Foto de la fachada" 
                    style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '300px' }}
                  />
                  <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                    Tocar para ampliar
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {zoomedImage && (
        <div 
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
          }}
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={zoomedImage} 
            alt="Imagen Ampliada" 
            style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }}
          />
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'white', background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={24} style={{ transform: 'rotate(180deg)' }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default DeliveryView;
