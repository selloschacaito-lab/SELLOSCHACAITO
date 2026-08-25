import React from 'react';
import { useSelection } from '../context/SelectionContext';

const FloatingOrderBar = () => {
  const { selectedItems } = useSelection();

  if (selectedItems.length === 0) return null;

  const handleSendOrder = () => {
    const isResellerMode = window.location.pathname.includes('/mayoristas');
    let text = isResellerMode ? `*--- PEDIDO DE MAYORISTA ---*\n\nHola, estoy interesado en los siguientes productos:\n\n` : `Hola, estoy interesado en los siguientes productos:\n\n`;
    
    let total = 0;
    selectedItems.forEach((item, index) => {
      const itemPrice = isResellerMode ? (item.resellerPrice || Math.round(item.price * 0.8)) : item.price;
      total += (Number(itemPrice) || 0);

      text += `${index + 1}. ${item.name}\n`;
      if (item.selectedVariant) {
        text += `   Color: ${item.selectedVariant}\n`;
      }
      text += `   Precio: $${itemPrice}\n\n`;
    });

    text += `*Total estimado: $${total}*\n\nQuisiera realizar este pedido.`;

    const url = `https://wa.me/584241345488?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const isResellerMode = window.location.pathname.includes('/mayoristas');
  const regularTotal = selectedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const wholesaleTotal = selectedItems.reduce((sum, item) => sum + (Number(item.resellerPrice || Math.round(item.price * 0.8)) || 0), 0);
  const totalSavings = regularTotal - wholesaleTotal;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '92%',
      maxWidth: '620px',
      backgroundColor: isResellerMode ? '#11141C' : 'var(--color-bg-card)',
      border: isResellerMode ? '2px solid #FFB800' : '2px solid var(--color-primary)',
      borderRadius: '16px',
      boxShadow: isResellerMode ? '0 10px 40px rgba(255, 184, 0, 0.25)' : '0 8px 30px rgba(0, 0, 0, 0.2)',
      padding: '0.85rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 1000,
      animation: 'fadeInUp 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1rem', color: isResellerMode ? '#F5F7FA' : 'var(--color-text-main)' }}>
            {selectedItems.length} {selectedItems.length === 1 ? 'Producto' : 'Productos'}
          </span>
          {isResellerMode && (
            <span style={{ backgroundColor: '#FFB800', color: '#000', fontSize: '0.65rem', fontWeight: '900', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
              VIP
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: isResellerMode ? '#FFB800' : 'var(--color-text-main)' }}>
            Total: ${isResellerMode ? wholesaleTotal : regularTotal}
          </span>
          {isResellerMode && totalSavings > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: '700', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
              Ahorras ${totalSavings}
            </span>
          )}
        </div>
      </div>

      <button 
        onClick={handleSendOrder}
        className={isResellerMode ? "btn" : "btn btn-whatsapp btn-breathe"}
        style={{
          padding: '0.75rem 1.25rem',
          fontSize: '0.95rem',
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: isResellerMode ? '#FFB800' : undefined,
          color: isResellerMode ? '#000' : undefined,
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          boxShadow: isResellerMode ? '0 4px 15px rgba(255, 184, 0, 0.4)' : undefined
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.333.158 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.332 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
        {isResellerMode ? 'Pedir Mayorista' : 'Enviar Pedido'}
      </button>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};

export default FloatingOrderBar;
