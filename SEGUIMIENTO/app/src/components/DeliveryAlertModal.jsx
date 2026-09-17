import React from 'react';
import { createPortal } from 'react-dom';
import { Bike, Truck, Store } from 'lucide-react';

// Aviso obligatorio que se muestra al pasar un pedido a "Empacado": hay que
// cerrarlo sí o sí para poder continuar, así queda claro de una vez si el
// pedido tiene Delivery o es Retiro en Tienda, sin tener que adivinar ni
// abrir el pedido para revisarlo.
function getDeliveryInfo(order) {
  if (order.hasDelivery && order.deliveryType && order.deliveryType !== 'pickup') {
    const typeLabel = {
      motorizado: 'Motorizado',
      mrw: 'MRW',
      zoom: 'Zoom'
    }[order.deliveryType] || 'Envío';
    const Icon = order.deliveryType === 'motorizado' ? Bike : Truck;
    return {
      hasDelivery: true,
      Icon,
      title: '🚚 Este pedido tiene Delivery',
      subtitle: `Tipo: ${typeLabel}`,
      bg: '#eff6ff',
      border: '#93c5fd',
      color: '#1e40af'
    };
  }
  return {
    hasDelivery: false,
    Icon: Store,
    title: '🏬 Este pedido es Retiro en Tienda',
    subtitle: 'El cliente lo retira en Chacaíto (no lleva delivery)',
    bg: '#f8fafc',
    border: '#cbd5e1',
    color: '#334155'
  };
}

export default function DeliveryAlertModal({ order, onAcknowledge }) {
  if (!order) return null;
  const info = getDeliveryInfo(order);
  const Icon = info.Icon;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: '#ffffff', width: '100%', maxWidth: '380px', borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', overflow: 'hidden', textAlign: 'center'
      }}>
        <div style={{ padding: '2rem 1.5rem 1.25rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 1rem',
            background: info.bg, border: `1.5px solid ${info.border}`, color: info.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon size={30} />
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
            {info.title}
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
            {info.subtitle}
          </p>
          <p style={{ margin: '10px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Pedido {order.orderNumber ? `#${order.orderNumber}` : ''} — {order.clientName || 'Sin Nombre'}
          </p>
          {info.hasDelivery && order.deliveryAddress && (
            <p style={{ margin: '10px 0 0', padding: '8px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.8rem', color: '#92400e', fontWeight: 700 }}>
              📝 {order.deliveryAddress}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onAcknowledge}
          style={{
            width: '100%', padding: '1rem', border: 'none', background: '#10b981', color: '#ffffff',
            fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer'
          }}
        >
          Entendido, Continuar
        </button>
      </div>
    </div>,
    document.body
  );
}
