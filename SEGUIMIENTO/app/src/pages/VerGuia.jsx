import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../firebase/config';
import { Package, Truck, Calendar, ArrowLeft } from 'lucide-react';

function VerGuia() {
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guideData, setGuideData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const orderSnap = await get(ref(db, `orders/${orderId}`));
        if (!orderSnap.exists()) {
          setError("El pedido no existe o fue eliminado.");
          setLoading(false);
          return;
        }
        setOrderData(orderSnap.val());

        const guideSnap = await get(ref(db, `orderAssets/shipping_guide/${orderId}`));
        if (guideSnap.exists()) {
          setGuideData(guideSnap.val());
        }
      } catch (err) {
        console.error("Error cargando la guía:", err);
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
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTopColor: '#10b981', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#64748b' }}>Cargando comprobante...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem' }}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px' }}>
          <Package size={48} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>No Encontrado</h2>
          <p style={{ color: '#64748b' }}>{error || "No se encontró información para este pedido."}</p>
        </div>
      </div>
    );
  }

  const shippingInfo = orderData.deliveryInfo || {};
  const company = shippingInfo.company || 'Agencia de Envíos';
  const trackingNumber = shippingInfo.trackingNumber || 'No especificado';

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            width: '64px', height: '64px', borderRadius: '50%', background: '#d1fae5', 
            color: '#10b981', marginBottom: '1rem'
          }}>
            <Truck size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
            Tu pedido ha sido enviado
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
            Gracias por comprar en Sellos Chacaito
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.875rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Agencia</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '999px', marginTop: '0.25rem' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{company}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Número de Guía / Cupón</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4f46e5', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                {trackingNumber}
              </p>
            </div>
          </div>

          <div style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#64748b" /> Comprobante de Envío
            </h3>
            
            {guideData && guideData.fullDataUrl ? (
              <>
                <div 
                  style={{ border: '2px solid #e2e8f0', borderRadius: '1rem', overflow: 'hidden', background: '#f8fafc', cursor: 'zoom-in', position: 'relative' }}
                  onClick={() => setIsZoomed(true)}
                >
                  <img 
                    src={guideData.fullDataUrl} 
                    alt="Guía de Envío" 
                    style={{ width: '100%', display: 'block', objectFit: 'contain' }}
                  />
                  <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                    Tocar para ampliar
                  </div>
                </div>

                {isZoomed && (
                  <div 
                    style={{
                      position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.9)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
                    }}
                    onClick={() => setIsZoomed(false)}
                  >
                    <img 
                      src={guideData.fullDataUrl} 
                      alt="Guía de Envío Ampliada" 
                      style={{ maxWidth: '100vw', maxHeight: '100vh', objectFit: 'contain' }}
                    />
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'white', background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowLeft size={24} style={{ transform: 'rotate(180deg)' }} />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '3rem', border: '2px dashed #e2e8f0', borderRadius: '1rem', textAlign: 'center', background: '#f8fafc' }}>
                <p style={{ color: '#94a3b8' }}>La foto de la guía no está disponible.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default VerGuia;
