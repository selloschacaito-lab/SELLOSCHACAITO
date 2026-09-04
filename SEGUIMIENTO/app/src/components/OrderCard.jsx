import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, MessageCircle, ChevronLeft } from 'lucide-react';
import { db } from '../firebase/config';
import { ref, update } from 'firebase/database';
import { normalizeWhatsApp } from '../utils/formatters';

const WA_MESSAGES = {
  greeting: 'Hola! Comenzando nuevo pedido.',
  approve: 'Hola! Estamos a la espera de que nos apruebes el diseno para poder avanzar con el pago y comenzar a trabajar en tu pedido. Quedamos atentos!',
  payment: 'Hola! Nos encontramos a la espera del comprobante (soporte) de pago para proceder con la elaboracion y despacho de tu pedido. Gracias por tu confianza!'
};

function WhatsAppModal({ whatsapp, onClose }) {
  const openWhatsApp = (message) => {
    const cleanPhone = normalizeWhatsApp(whatsapp);
    if (!cleanPhone) {
      alert("No hay un numero de telefono valido para este cliente.");
      return;
    }
    const base = `https://wa.me/${cleanPhone}`;
    const url = message ? `${base}?text=${encodeURIComponent(message)}` : base;
    window.open(url, '_blank');
    onClose();
  };

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          borderRadius: '1rem',
          padding: '1.25rem',
          width: '90%',
          maxWidth: '340px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          textAlign: 'left'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#1e293b' }}>Opciones de WhatsApp</h3>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>Selecciona como deseas contactar al cliente:</p>
        
        <button 
          type="button"
          onClick={() => openWhatsApp('')}
          style={{ fontSize: '0.9rem', padding: '0.875rem', color: '#1e293b', borderRadius: '0.5rem', display: 'block', background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          Hablar con el cliente (Normal)
        </button>
        
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.5rem', letterSpacing: '0.05em' }}>Respuestas Rapidas</div>
        
        <button 
          type="button"
          onClick={() => openWhatsApp(WA_MESSAGES.greeting)}
          style={{ fontSize: '0.9rem', padding: '0.875rem', color: '#16a34a', borderRadius: '0.5rem', display: 'block', background: '#dcfce7', border: '1px solid #bbf7d0', fontWeight: 600, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          Empezar Pedido (Saludo Inicial)
        </button>
        
        <button 
          type="button"
          onClick={() => openWhatsApp(WA_MESSAGES.approve)}
          style={{ fontSize: '0.9rem', padding: '0.875rem', color: '#1e293b', borderRadius: '0.5rem', display: 'block', background: '#f0fdf4', border: '1px solid #bbf7d0', fontWeight: 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          Aprobacion (Diseno)
        </button>
        
        <button 
          type="button"
          onClick={() => openWhatsApp(WA_MESSAGES.payment)}
          style={{ fontSize: '0.9rem', padding: '0.875rem', color: '#1e293b', borderRadius: '0.5rem', display: 'block', background: '#fefce8', border: '1px solid #fef08a', fontWeight: 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          Pago (Soporte)
        </button>
        
        <button 
          type="button"
          onClick={onClose}
          style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '0.5rem', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
        >
          Cerrar
        </button>
      </div>
    </div>,
    document.body
  );
}

function OrderCard({ order, statusConfig, onAdvance, onRegress, onClick, isHighlighted = false }) {
  const [showWaMenu, setShowWaMenu] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      // Scroll into view with slight delay to ensure tab/column layout is rendered
      const timer = setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  const getDesignerClass = (designer) => {
    if (!designer) return "designer-none";
    const name = designer.toLowerCase();
    if (name.includes('abril') || name.includes('brigethe')) return "designer-brigethe";
    if (name.includes('alvaro')) return "designer-alvaro";
    if (name.includes('kriz')) return "designer-kriz";
    return "designer-none";
  };

  // Follow-up logic for design_sent
  let isStaleDesign = false;
  let timeText = '';
  if (statusConfig.id === 'design_sent' && order.createdAt) {
    const createdDate = new Date(order.createdAt);
    const now = new Date();
    const diffMs = now - createdDate;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours > 3) {
      isStaleDesign = true;
      if (now.getDate() !== createdDate.getDate() || diffHours > 24) {
        timeText = '⏱️ Ayer+';
      } else {
        timeText = `⏱️ ${Math.floor(diffHours)}h`;
      }
    }
  }

  // Heatmap calculation
  const getHeatMapStyle = (startedAtRaw) => {
    if (!startedAtRaw) return { bg: '#ffffff', border: '#e2e8f0', label: '0h', textColor: '#64748b' };
    const startedAt = typeof startedAtRaw === 'number' ? startedAtRaw : new Date(startedAtRaw).getTime();
    if (isNaN(startedAt)) return { bg: '#ffffff', border: '#e2e8f0', label: '0h', textColor: '#64748b' };

    const now = Date.now();
    const diffMs = Math.max(0, now - startedAt);
    const hours = diffMs / (1000 * 60 * 60);

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    let label = '';
    if (totalMinutes < 60) {
      label = `${totalMinutes}m`;
    } else if (totalMinutes < 24 * 60) {
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      label = `${h}h ${m}m`;
    } else {
      const d = Math.floor(totalMinutes / (24 * 60));
      const h = Math.floor((totalMinutes % (24 * 60)) / 60);
      label = `${d}d ${h}h`;
    }

    if (hours < 2) return { bg: '#ffffff', border: '#e2e8f0', label, textColor: '#64748b' };
    if (hours < 6) return { bg: '#fef9c3', border: '#fef08a', label, textColor: '#854d0e' };
    if (hours < 12) return { bg: '#ffedd5', border: '#fed7aa', label, textColor: '#c2410c' };
    return { bg: '#fee2e2', border: '#fca5a5', label, textColor: '#dc2626' };
  };

  const heat = getHeatMapStyle(order.currentStatusStartedAt || order.updatedAt || order.createdAt);

  return (
    <div 
      ref={cardRef}
      className={`order-card group ${isStaleDesign ? 'stale-order' : ''} ${isHighlighted ? 'order-card-highlight-pulse' : ''}`} 
      onClick={onClick} 
      style={{ 
        cursor: 'pointer', 
        background: heat.bg,
        border: `1.5px solid ${heat.border}`,
        transition: 'all 0.3s ease'
      }}
    >
      {isHighlighted && (
        <div className="duplicate-highlight-badge">
          ⚠️ ¡ESTE ES EL PEDIDO REPETIDO! (Toca para ver)
        </div>
      )}
      <div className={`card-indicator ${statusConfig.color}`} />
      
      <div className="card-content">
        <div className="card-top">
          <h4 className="client-name">
            {order.orderNumber ? <span style={{ color: '#0284c7', marginRight: '0.25rem' }}>#{order.orderNumber}</span> : null}
            {order.clientName || 'Sin Nombre'}
          </h4>
          <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <MoreHorizontal size={16} />
          </button>
        </div>

        <div className="card-badges">
          <span className="badge" style={{ background: heat.bg, color: heat.textColor, border: `1px solid ${heat.border}`, fontWeight: 700 }}>
            ⏱️ {heat.label}
          </span>
          {order.designer && (
            <span className={`badge ${getDesignerClass(order.designer)}`}>
              {order.designer}
            </span>
          )}
          {isStaleDesign && (
            <span className="badge" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', fontWeight: 800 }}>
              {timeText}
            </span>
          )}
          {order.requiresDesign === false && (
            <span className="badge" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>📦 Sin Diseño</span>
          )}
          {order.isFina && (
            <span className="badge badge-fina">FINA</span>
          )}
        </div>

        {order.hasReference && order.hasFinaReceipt && (
          <button 
            onClick={(e) => { e.stopPropagation(); onClick(e); }}
            style={{
              width: '100%',
              background: '#eff6ff',
              color: '#2563eb',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              marginBottom: '0.75rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            🔍 VER PEDIDO
          </button>
        )}

        {/* Progress Bar */}
        <div style={{ marginBottom: '0.75rem', padding: '0 0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.25rem' }}>
            <span>Progreso</span>
            <span>{Math.round((statusConfig.index / (statusConfig.total - 1)) * 100)}%</span>
          </div>
          <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              background: 'var(--primary)', 
              width: `${(statusConfig.index / (statusConfig.total - 1)) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Toggle Laser/Normal desde Recibo en adelante */}
        {['fina', 'printing', 'production', 'finished', 'packed', 'delivered'].includes(order.status) && (
          <button 
            style={{
              marginTop: '0.25rem',
              background: order.isLaser ? '#fff1f2' : '#f8fafc',
              border: `1px solid ${order.isLaser ? '#fda4af' : '#e2e8f0'}`,
              borderRadius: '6px',
              padding: '0.25rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: 'fit-content'
            }}
            onClick={(e) => {
              e.stopPropagation();
              const orderRef = ref(db, `orders/${order.id}`);
              update(orderRef, { isLaser: !order.isLaser });
            }}
          >
            <span style={{ 
              fontSize: '0.9rem', 
              filter: order.isLaser ? 'none' : 'grayscale(100%) opacity(40%)',
              transition: 'all 0.2s ease'
            }}>🔥</span>
            <span style={{ 
              fontWeight: 700, 
              fontSize: '0.7rem', 
              color: order.isLaser ? '#e11d48' : '#94a3b8' 
            }}>
              {order.isLaser ? 'LÁSER' : 'NORMAL'}
            </span>
          </button>
        )}

        {/* Botón directo de contacto rápido en Diseño Enviado */}
        {statusConfig.id === 'design_sent' && order.whatsapp && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const message = isStaleDesign 
                ? 'Hola! Queriamos saber si pudiste revisar la informacion o el diseno que te enviamos. Quedamos atentos a tu confirmacion!' 
                : WA_MESSAGES.greeting;
              const cleanPhone = normalizeWhatsApp(order.whatsapp);
              if (!cleanPhone) {
                alert("No hay un numero de telefono valido para este cliente.");
                return;
              }
              const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
              window.open(url, '_blank');
            }}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              fontSize: '0.8rem',
              padding: '0.5rem',
              color: isStaleDesign ? '#b91c1c' : '#16a34a',
              background: isStaleDesign ? '#fee2e2' : '#dcfce7',
              border: `1px solid ${isStaleDesign ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: '0.5rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {isStaleDesign ? 'Hacer Seguimiento' : 'Enviar Saludo Inicial'}
          </button>
        )}

        <div className="card-footer" onClick={e => e.stopPropagation()}>
          {order.whatsapp ? (
            <button 
              type="button"
              className="btn-whatsapp"
              onClick={(e) => { e.stopPropagation(); setShowWaMenu(true); }}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <MessageCircle size={14} /> WhatsApp
            </button>
          ) : (
            <span className="no-wp">Sin WP</span>
          )}
          
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {statusConfig.id !== 'design_sent' && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRegress(); }} 
                style={{ 
                  background: '#e2e8f0', 
                  color: '#475569', 
                  border: 'none', 
                  borderRadius: '0.5rem', 
                  padding: '0 0.375rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer'
                }}
                title="Retroceder Fase"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <button className="btn-advance" onClick={(e) => { e.stopPropagation(); onAdvance(); }}>
              Avanzar
            </button>
          </div>
        </div>
      </div>

      {showWaMenu && <WhatsAppModal whatsapp={order.whatsapp} onClose={() => setShowWaMenu(false)} />}
    </div>
  );
}

export default React.memo(OrderCard);
