import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase/config';
import { 
  CheckCircle2, Clock, Paintbrush, Receipt, Package, Truck, 
  Download, ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, 
  MapPin, ExternalLink, Image as ImageIcon, Sparkles, Building2
} from 'lucide-react';

// Mapeo de estados internos a las 5 fases visuales del cliente
const STAGES = [
  { id: 'design', label: '1. Orden & Diseño', desc: 'Diseño elaborado y validado' },
  { id: 'production', label: '2. En Elaboración', desc: 'Fabricación láser y armado' },
  { id: 'ready', label: '3. Listo / Foto', desc: 'Sello terminado y probado' },
  { id: 'dispatch', label: '4. En Despacho', desc: 'Listo para retiro o en camino' },
  { id: 'delivered', label: '5. Entregado', desc: 'Pedido finalizado con éxito' }
];

function getStageIndex(status) {
  switch (status) {
    case 'design_sent':
    case 'fina':
      return 0; // Orden & Diseño
    case 'printing':
    case 'production':
      return 1; // En Elaboración
    case 'finished':
      return 2; // Listo
    case 'packed':
      return 3; // En Despacho
    case 'delivered':
      return 4; // Entregado
    default:
      return 0;
  }
}

// Función para reproducir un chime agradable sin archivos externos (Web Audio API)
function playChimeSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Nota 1 (Mi / E5 - 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.5);

    // Nota 2 (Sol# / G#5 - 830.61 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.7);

    // Nota 3 (Si / B5 - 987.77 Hz)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(987.77, ctx.currentTime + 0.24);
    gain3.gain.setValueAtTime(0.2, ctx.currentTime + 0.24);
    gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(ctx.currentTime + 0.24);
    osc3.stop(ctx.currentTime + 1.2);
  } catch (e) {
    console.warn("No se pudo reproducir audio:", e);
  }
}

export default function VerOrden() {
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [orderData, setOrderData] = useState(null);
  const [referenceData, setReferenceData] = useState(null);
  const [finaReceiptData, setFinaReceiptData] = useState(null);
  const [finishedPhotoData, setFinishedPhotoData] = useState(null);
  const [shippingGuideData, setShippingGuideData] = useState(null);

  const [zoomedImage, setZoomedImage] = useState(null);
  const [openSections, setOpenSections] = useState({
    finished: true,
    design: true,
    receipt: false,
    shipping: true
  });

  // Notificación flotante de cambio de estado
  const [statusToast, setStatusToast] = useState(null);
  const prevStatusRef = React.useRef(null);
  const isFirstLoadRef = React.useRef(true);

  // Estado de expiración (48h post-entrega)
  const [isExpired, setIsExpired] = useState(false);
  const [hoursLeft, setHoursLeft] = useState(null);

  useEffect(() => {
    document.title = "Sellos Chacaíto - Seguimiento de tu Pedido";
    if (!orderId) return;

    // 1. Escuchar cambios de la orden en TIEMPO REAL (onValue)
    const orderRef = ref(db, `orders/${orderId}`);
    const unsubscribeOrder = onValue(orderRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        
        // Si el estado cambió después de la carga inicial, reproducir sonido y mostrar toast
        if (!isFirstLoadRef.current && prevStatusRef.current && prevStatusRef.current !== data.status) {
          const newStage = STAGES[getStageIndex(data.status)];
          playChimeSound();
          setStatusToast({
            title: `¡Tu pedido ha avanzado!`,
            message: `Nuevo estado: ${newStage.label.replace(/^\d+\.\s*/, '')}`
          });
          setTimeout(() => setStatusToast(null), 6000);
        }

        prevStatusRef.current = data.status;
        isFirstLoadRef.current = false;
        setOrderData(data);

        // Verificar expiración de 48 horas si está entregado
        if (data.status === 'delivered' && data.updatedAt) {
          const deliveredTime = new Date(data.updatedAt).getTime();
          const now = Date.now();
          const diffHours = (now - deliveredTime) / (1000 * 60 * 60);
          
          if (diffHours >= 48) {
            setIsExpired(true);
          } else {
            setHoursLeft(Math.max(1, Math.round(48 - diffHours)));
          }
        }
      } else {
        setError("El pedido no existe o fue archivado.");
      }
      setLoading(false);
    }, (err) => {
      console.error("Error en tiempo real:", err);
      setError("Error de conexión al cargar la orden.");
      setLoading(false);
    });

    // 2. Escuchar Assets en tiempo real
    const refUnsub = onValue(ref(db, `orderAssets/reference/${orderId}`), (s) => {
      if (s.exists()) setReferenceData(s.val());
    });
    const finaUnsub = onValue(ref(db, `orderAssets/fina_receipt/${orderId}`), (s) => {
      if (s.exists()) setFinaReceiptData(s.val());
    });
    const finishedUnsub = onValue(ref(db, `orderAssets/finished_photo/${orderId}`), (s) => {
      if (s.exists()) setFinishedPhotoData(s.val());
    });
    const guideUnsub = onValue(ref(db, `orderAssets/shipping_guide/${orderId}`), (s) => {
      if (s.exists()) setShippingGuideData(s.val());
    });

    return () => {
      unsubscribeOrder();
      refUnsub();
      finaUnsub();
      finishedUnsub();
      guideUnsub();
    };
  }, [orderId]);

  const toggleSection = (sec) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const downloadImage = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAll = () => {
    if (finishedPhotoData?.fullDataUrl) downloadImage(finishedPhotoData.fullDataUrl, `Sello_Terminado_${orderId}.jpg`);
    if (referenceData?.fullDataUrl) setTimeout(() => downloadImage(referenceData.fullDataUrl, `Diseno_Sello_${orderId}.jpg`), 300);
    if (finaReceiptData?.fullDataUrl) setTimeout(() => downloadImage(finaReceiptData.fullDataUrl, `Recibo_Pago_${orderId}.jpg`), 600);
    if (shippingGuideData?.fullDataUrl) setTimeout(() => downloadImage(shippingGuideData.fullDataUrl, `Guia_Envio_${orderId}.jpg`), 900);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6E6E6' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '45px', height: '45px', border: '4px solid #cbd5e1', borderTopColor: '#47FF00', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#1F2329', fontWeight: 700, fontSize: '1.1rem' }}>Conectando con tu pedido...</p>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6E6E6', padding: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(31, 35, 41, 0.15)', padding: '3rem 2rem', borderRadius: '1.5rem', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxWidth: '440px', width: '100%' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1rem', overflow: 'hidden' }}>
            <img src="/logo-sc.png?v=1" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1F2329', marginBottom: '0.75rem' }}>Enlace Expirado</h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Este pedido ya fue entregado y su enlace temporal de seguimiento de 48 horas ha expirado.
          </p>
          <div style={{ background: 'rgba(71, 255, 0, 0.12)', border: '1px solid #47FF00', padding: '0.85rem', borderRadius: '0.75rem', color: '#166534', fontSize: '0.85rem', fontWeight: 700 }}>
            ¡Gracias por preferir a Sellos Chacaíto!
          </div>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6E6E6', padding: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', padding: '3rem 2rem', borderRadius: '1.5rem', textAlign: 'center', maxWidth: '450px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem', overflow: 'hidden' }}>
            <img src="/logo-sc.png?v=1" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1F2329', marginBottom: '0.5rem' }}>Pedido No Encontrado</h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem' }}>{error || "No se encontró información para este pedido."}</p>
        </div>
      </div>
    );
  }

  const currentStageIdx = getStageIndex(orderData.status);
  const isDelivered = orderData.status === 'delivered';
  const hasMultipleFiles = Boolean(finishedPhotoData || referenceData || finaReceiptData || shippingGuideData);

  return (
    <div style={{ minHeight: '100vh', background: '#E6E6E6', padding: '1.5rem 1rem 3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      
      {/* Toast Notificación Flotante con Campana */}
      {statusToast && (
        <div 
          className="animate-fade-in"
          style={{
            position: 'fixed',
            top: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            background: '#1F2329',
            color: '#ffffff',
            border: '2px solid #47FF00',
            borderRadius: '1rem',
            padding: '0.85rem 1.25rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 0 15px rgba(71,255,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            maxWidth: '90vw',
            width: '380px'
          }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(71,255,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={20} color="#47FF00" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#47FF00' }}>{statusToast.title}</div>
            <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 600 }}>{statusToast.message}</div>
          </div>
          <button 
            onClick={() => setStatusToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem' }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ maxWidth: '560px', width: '100%' }}>
        
        {/* Encabezado con Logo Oficial */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '70px', height: '70px', borderRadius: '50%', background: '#1F2329', padding: '4px', boxShadow: '0 8px 18px rgba(0,180,45,0.25)', marginBottom: '0.75rem' }}>
            <img src="/logo-sc.png?v=1" alt="Logo Sellos Chacaito" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1F2329', margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}>
            Seguimiento de tu Pedido
          </h1>
          <p style={{ color: 'rgba(31, 35, 41, 0.75)', fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>
            {orderData.clientName || 'Cliente'} • Orden #{orderData.orderNumber || orderId.substring(orderId.length - 5)}
          </p>
        </div>

        {/* Banner de Aviso de Expiración (Si ya fue entregado) */}
        {isDelivered && hoursLeft && (
          <div className="animate-fade-in" style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1.5px solid #f59e0b', borderRadius: '1rem', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.4 }}>
              <strong>⚠️ Pedido Entregado:</strong> Tienes aproximadamente <strong>{hoursLeft} horas</strong> para descargar tus fotos y comprobantes antes de que este enlace expire.
            </div>
          </div>
        )}

        {/* STEPPER / LÍNEA DE TIEMPO INTERACTIVA EN VIVO */}
        <div style={{ background: 'rgba(255, 255, 255, 0.88)', backdropFilter: 'blur(12px)', borderRadius: '1.25rem', border: '1px solid rgba(31, 35, 41, 0.12)', padding: '1.25rem 1rem', marginBottom: '1.25rem', boxShadow: '0 10px 15px -3px rgba(31, 35, 41, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1F2329', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={16} color="#078B35" /> Estado Actual en Vivo:
            </span>
            <span style={{ fontSize: '0.75rem', background: '#1F2329', color: '#47FF00', padding: '0.25rem 0.65rem', borderRadius: '0.5rem', fontWeight: 800 }}>
              {STAGES[currentStageIdx].label.split('. ')[1]}
            </span>
          </div>

          {/* Barra de progreso */}
          <div style={{ position: 'relative', height: '6px', background: '#e2e8f0', borderRadius: '3px', margin: '1.25rem 0.5rem 1.5rem 0.5rem' }}>
            <div 
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                height: '100%', 
                width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%`, 
                background: '#47FF00', 
                borderRadius: '3px',
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }} 
            />
          </div>

          {/* Pasos */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.2rem' }}>
            {STAGES.map((st, idx) => {
              const isCompleted = idx < currentStageIdx;
              const isCurrent = idx === currentStageIdx;
              return (
                <div key={st.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: isCurrent ? '#47FF00' : isCompleted ? '#1F2329' : '#e2e8f0',
                    color: isCurrent ? '#1F2329' : isCompleted ? '#47FF00' : '#94a3b8',
                    boxShadow: isCurrent ? '0 0 10px rgba(71,255,0,0.6)' : 'none',
                    marginBottom: '0.35rem',
                    transition: 'all 0.3s'
                  }}>
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: isCurrent ? 800 : 600, 
                    color: isCurrent ? '#1F2329' : isCompleted ? '#475569' : '#94a3b8',
                    lineHeight: 1.2
                  }}>
                    {st.label.replace(/^\d+\.\s*/, '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTÓN DESCARGAR TODAS LAS FOTOS */}
        {hasMultipleFiles && (
          <div style={{ marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={downloadAll}
              style={{
                width: '100%',
                padding: '0.85rem',
                background: '#1F2329',
                color: '#47FF00',
                border: 'none',
                borderRadius: '0.85rem',
                fontSize: '0.9rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Download size={18} />
              Descargar Todas las Imágenes y Comprobantes
            </button>
          </div>
        )}

        {/* ACORDEÓN / SECCIONES DESPLEGABLES DE ARCHIVOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* 1. SELLO TERMINADO (DESTACADO) */}
          {finishedPhotoData && finishedPhotoData.fullDataUrl && (
            <div className="animate-fade-in" style={{ background: 'white', borderRadius: '1rem', border: '2px solid #47FF00', overflow: 'hidden', boxShadow: '0 8px 18px rgba(0,180,45,0.12)' }}>
              <div 
                onClick={() => toggleSection('finished')}
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'rgba(71, 255, 0, 0.1)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} color="#078B35" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 850, color: '#1F2329' }}>Foto del Producto Terminado</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', background: '#47FF00', color: '#1F2329', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontWeight: 800 }}>
                    Listo
                  </span>
                  {openSections.finished ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {openSections.finished && (
                <div style={{ padding: '1rem', borderTop: '1px solid #bbf7d0' }}>
                  <div 
                    style={{ borderRadius: '0.75rem', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'zoom-in', position: 'relative' }}
                    onClick={() => setZoomedImage(finishedPhotoData.fullDataUrl)}
                  >
                    <img 
                      src={finishedPhotoData.fullDataUrl} 
                      alt="Producto Terminado" 
                      style={{ width: '100%', display: 'block', maxHeight: '340px', objectFit: 'contain' }}
                    />
                    <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(31,35,41,0.85)', color: '#47FF00', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.72rem', fontWeight: 700 }}>
                      🔍 Tocar para ampliar
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => downloadImage(finishedPhotoData.fullDataUrl, `Sello_Terminado_${orderId}.jpg`)}
                    style={{ marginTop: '0.75rem', width: '100%', padding: '0.6rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', color: '#166534', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer' }}
                  >
                    <Download size={15} /> Guardar esta foto
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. DISEÑO DEL SELLO (APROBADO) */}
          {referenceData && referenceData.fullDataUrl && (
            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              <div 
                onClick={() => toggleSection('design')}
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Paintbrush size={18} color="#0284c7" />
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>Diseño de Referencia / Aprobado</span>
                </div>
                {openSections.design ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {openSections.design && (
                <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <div 
                    style={{ borderRadius: '0.75rem', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'zoom-in', position: 'relative' }}
                    onClick={() => setZoomedImage(referenceData.fullDataUrl)}
                  >
                    <img 
                      src={referenceData.fullDataUrl} 
                      alt="Diseño" 
                      style={{ width: '100%', display: 'block', maxHeight: '280px', objectFit: 'contain' }}
                    />
                    <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.65)', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.72rem', fontWeight: 600 }}>
                      🔍 Ampliar
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => downloadImage(referenceData.fullDataUrl, `Diseno_${orderId}.jpg`)}
                    style={{ marginTop: '0.75rem', width: '100%', padding: '0.6rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#475569', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer' }}
                  >
                    <Download size={15} /> Descargar Diseño
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. RECIBO DE PAGO */}
          {finaReceiptData && finaReceiptData.fullDataUrl && (
            <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              <div 
                onClick={() => toggleSection('receipt')}
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Receipt size={18} color="#16a34a" />
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>Recibo de Pago Validado</span>
                </div>
                {openSections.receipt ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {openSections.receipt && (
                <div style={{ padding: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <div 
                    style={{ borderRadius: '0.75rem', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'zoom-in', position: 'relative' }}
                    onClick={() => setZoomedImage(finaReceiptData.fullDataUrl)}
                  >
                    <img 
                      src={finaReceiptData.fullDataUrl} 
                      alt="Recibo" 
                      style={{ width: '100%', display: 'block', maxHeight: '280px', objectFit: 'contain' }}
                    />
                    <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.65)', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.72rem', fontWeight: 600 }}>
                      🔍 Ampliar
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => downloadImage(finaReceiptData.fullDataUrl, `Recibo_${orderId}.jpg`)}
                    style={{ marginTop: '0.75rem', width: '100%', padding: '0.6rem', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '0.5rem', color: '#475569', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer' }}
                  >
                    <Download size={15} /> Descargar Recibo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. GUÍA DE ENVÍO / DETALLES DE DESPACHO */}
          {shippingGuideData && shippingGuideData.fullDataUrl && (
            <div className="animate-fade-in" style={{ background: 'white', borderRadius: '1rem', border: '1.5px solid #0284c7', overflow: 'hidden' }}>
              <div 
                onClick={() => toggleSection('shipping')}
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: '#f0f9ff' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={18} color="#0284c7" />
                  <span style={{ fontSize: '0.92rem', fontWeight: 850, color: '#0369a1' }}>Guía de Envío (MRW / ZOOM)</span>
                </div>
                {openSections.shipping ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {openSections.shipping && (
                <div style={{ padding: '1rem', borderTop: '1px solid #bae6fd' }}>
                  <div 
                    style={{ borderRadius: '0.75rem', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'zoom-in', position: 'relative' }}
                    onClick={() => setZoomedImage(shippingGuideData.fullDataUrl)}
                  >
                    <img 
                      src={shippingGuideData.fullDataUrl} 
                      alt="Guía de Envío" 
                      style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'contain' }}
                    />
                    <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.65)', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.72rem', fontWeight: 600 }}>
                      🔍 Ampliar Guía
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => downloadImage(shippingGuideData.fullDataUrl, `Guia_Envio_${orderId}.jpg`)}
                    style={{ marginTop: '0.75rem', width: '100%', padding: '0.6rem', background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '0.5rem', color: '#0369a1', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer' }}
                  >
                    <Download size={15} /> Descargar Guía de Envío
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. TARJETA DE HORARIO Y SEDE */}
          <div style={{ background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(8px)', borderRadius: '1rem', border: '1px solid rgba(31, 35, 41, 0.1)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
            <div style={{ fontWeight: 800, color: '#1F2329', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="#078B35" /> Horario de Atención y Retiro:
            </div>
            <div>Lunes a Viernes de 8:00 a. m. a 5:00 p. m.</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📍 Sede Chacaíto, Caracas</div>
          </div>

        </div>

      </div>

      {/* Visor de imagen en pantalla completa */}
      {zoomedImage && (
        <div 
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '1rem'
          }}
          onClick={() => setZoomedImage(null)}
        >
          <img 
            src={zoomedImage} 
            alt="Imagen Ampliada" 
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '0.5rem' }}
          />
          <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: '#47FF00', background: 'rgba(31,35,41,0.85)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, fontSize: '0.85rem' }}>
            ✕ Cerrar
          </div>
        </div>
      )}
    </div>
  );
}
