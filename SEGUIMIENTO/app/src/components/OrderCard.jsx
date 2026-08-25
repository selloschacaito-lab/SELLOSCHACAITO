import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, MessageCircle, ChevronLeft } from 'lucide-react';
import { db } from '../firebase/config';
import { ref, update } from 'firebase/database';

const WA_MESSAGES = {
  greeting: '¡Hola! Comenzando nuevo pedido.',
  approve: '¡Hola! Estamos a la espera de que nos apruebes el diseño para poder avanzar con el pago y comenzar a trabajar en tu pedido. ¡Quedamos atentos!',
  payment: '¡Hola! Nos encontramos a la espera del comprobante (soporte) de pago para proceder con la elaboración y despacho de tu pedido. ¡Gracias por tu confianza!'
};

function WhatsAppModal({ whatsapp, onClose }) {
  const openWhatsApp = (message) => {
    const base = `https://wa.me/${whatsapp}`;
    const url = message ? `${base}?text=${encodeURIComponent(message)}` : base;
    window.location.href = url;
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
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#1e293b' }}>📱 Opciones de WhatsApp</h3>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>Selecciona cómo deseas contactar al cliente:</p>
        
        <button 
          type="button"
          onClick={() => openWhatsApp('')}
          style={{ fontSize: '0.9rem', padding: '0.875rem', color: '#1e293b', borderRadius: '0.5rem', display: 'block', background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          💬 Hablar con el cliente (Normal)
        </button>
        
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginTop: '0.5rem', letterSpacing: '0.05em' }}>Respuestas Rápidas</div>
        
        <button 
          type="button"
          onClick={() => openWhatsApp(WA_MESSAGES.greeting)}
          style={{ fontSize: '0.9rem', padding: '0.875rem', color: '#16a34a', borderRadius: '0.5rem', display: 'block', background: '#dcfce7', border: '1px solid #bbf7d0', fontWeight: 600, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          👋 Empezar Pedido (Saludo Inicial)
        </button>
        
        <button 
          type="button"
          onClick={() => openWhatsApp(WA_MESSAGES.approve)}
          style={{ fontSize: '0.9rem', padding: '0.875rem', color: '#1e293b', borderRadius: '0.5rem', display: 'block', background: '#f0fdf4', border: '1px solid #bbf7d0', fontWeight: 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          ✏️ APROBACIÓN (Diseño)
        </button>
        
        <button 
          type="button"
          onClick={() => openWhatsApp(WA_MESSAGES.payment)}
          style={{ fontSize: '0.9rem', padding: '0.875rem', color: '#1e293b', borderRadius: '0.5rem', display: 'block', background: '#fefce8', border: '1px solid #fef08a', fontWeight: 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          💳 PAGO (Soporte)
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

function OrderCard({ order, statusConfig, onAdvance, onRegress, onClick }) {
  const [showWaMenu, setShowWaMenu] = useState(false);

  const getDesignerClass = (designer) => {
    if (!designer) return "designer-none";
    const name = designer.toLowerCase();
    if (name.includes('abril') || name.includes('brigethe')) return "designer-brigethe";
    if (name.includes('alvaro')) return "designer-alvaro";
    if (name.includes('kriz')) return "designer-kriz";
    return "designer-none";
  };

  return (
    <div className="order-card group" onClick={onClick} style={{ cursor: 'pointer' }}>
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
          {order.designer && (
            <span className={`badge ${getDesignerClass(order.designer)}`}>
              {order.designer}
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

        {/* Botón directo de Saludo Inicial para nuevos pedidos */}
        {statusConfig.id === 'design_sent' && order.whatsapp && (
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const url = `https://wa.me/${order.whatsapp}?text=${encodeURIComponent(WA_MESSAGES.greeting)}`;
              window.open(url, '_blank');
            }}
            style={{
              marginTop: '0.5rem',
              width: '100%',
              fontSize: '0.8rem',
              padding: '0.5rem',
              color: '#16a34a',
              background: '#dcfce7',
              border: '1px solid #bbf7d0',
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
            👋 Enviar Saludo Inicial
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

export default OrderCard;
