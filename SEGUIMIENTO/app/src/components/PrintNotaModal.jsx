import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Copy, X, Check, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDisplayPhone } from '../utils/formatters';

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export default function PrintNotaModal({ order, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const printAreaRef = useRef(null);

  if (!order) return null;

  const items = order.items || [];
  const clientName = (order.clientName || 'CLIENTE').toUpperCase();
  const clientRif = (order.clientRif || order.rif || '').toUpperCase();
  const clientPhone = formatDisplayPhone(order.whatsapp || order.phone || '');
  const clientAddress = (order.clientAddress || order.address || '').toUpperCase();
  const orderNumber = order.orderNumber ? `#${order.orderNumber}` : `#${order.id?.slice(-5) || '001'}`;
  
  const dateStr = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()
    : new Date().toLocaleDateString('es-VE').toUpperCase();

  // 1. Calculate raw subtotal in Bs
  const rawSubtotalBs = items.reduce((acc, it) => {
    const qty = Number(it.cantidad) || 1;
    const price = Number(it.precioUSD) || 0;
    const rate = Number(it.tasaBCV) || Number(order.tasaBCV) || 1;
    return acc + (qty * price * rate);
  }, 0);

  // 2. Determine final total in Bs (which already includes IVA if order has it)
  const totalBs = Number(order.totalAmountBs) || 
    (order.incluyeIVA ? rawSubtotalBs * 1.16 : rawSubtotalBs) || 
    ((Number(order.totalAmount) || 0) * (Number(order.tasaBCV) || 1));

  // 3. Compute tax multiplier so EVERY product's displayed price already includes its IVA portion!
  const taxMultiplier = (rawSubtotalBs > 0 && totalBs > rawSubtotalBs) 
    ? (totalBs / rawSubtotalBs) 
    : (order.incluyeIVA ? 1.16 : 1);

  const processedItems = items.map((it, idx) => {
    const itQty = Number(it.cantidad) || 1;
    const itPrice = Number(it.precioUSD) || 0;
    const itRate = Number(it.tasaBCV) || Number(order.tasaBCV) || 1;
    
    // Subtotal with IVA included!
    let itSubBsWithIVA = (itQty * itPrice * itRate) * taxMultiplier;

    // If single item, ensure exact match to totalBs
    if (items.length === 1) {
      itSubBsWithIVA = totalBs;
    }

    return {
      qty: itQty,
      nombre: (it.nombre || 'PRODUCTO').toUpperCase(),
      nota: (it.nota || '').trim(),
      subBs: itSubBsWithIVA
    };
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    let text = `*RECIBO - SELLOS CHACAITO*\n`;
    text += `*RECIBO:* ${orderNumber} | *FECHA:* ${dateStr}\n`;
    text += `*CLIENTE:* ${clientName}\n`;
    if (clientRif && clientRif !== 'S/N') text += `*RIF/CI:* ${clientRif}\n`;
    if (clientPhone) text += `*TELEFONO:* ${clientPhone}\n`;
    if (clientAddress) text += `*DIRECCION:* ${clientAddress}\n`;
    text += `------------------------------------\n`;
    text += `*DETALLE DE PRODUCTOS:*\n`;
    if (processedItems.length > 0) {
      processedItems.forEach((it, idx) => {
        text += `${idx + 1}. ${it.nombre} x${it.qty} = *Bs. ${fmt(it.subBs)}*\n`;
      });
    } else {
      text += `1. PEDIDO / SERVICIO = *Bs. ${fmt(totalBs)}*\n`;
    }
    text += `------------------------------------\n`;
    text += `*TOTAL A PAGAR:* *Bs. ${fmt(totalBs)}*\n`;
    if (order.paymentBreakdown && order.paymentBreakdown.length > 1) {
      text += `*FORMA DE PAGO: PAGO MIXTO*\n`;
      order.paymentBreakdown.forEach(p => {
        text += `- ${p.method}: $${fmt(p.amountUSD)} (Bs. ${fmt(p.amountBs)})${p.ref ? ` | Ref: ${p.ref}` : ''}\n`;
      });
    } else if (order.paymentMethod) {
      text += `*FORMA DE PAGO:* ${order.paymentMethod}${order.paymentRef ? ` (Ref: ${order.paymentRef})` : ''}\n`;
    }
    text += `\n`;
    text += `_GRACIAS POR SU COMPRA. ESTE DOCUMENTO ES UN RECIBO DE CONTROL INTERNO, SE LE ENTREGARA SU FACTURA FISCAL AL MOMENTO DE RETIRAR EL PRODUCTO._`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Recibo copiado al portapapeles para WhatsApp');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    let text = `*RECIBO - SELLOS CHACAITO*\n`;
    text += `*RECIBO:* ${orderNumber} | *FECHA:* ${dateStr}\n`;
    text += `*CLIENTE:* ${clientName}\n`;
    if (clientRif && clientRif !== 'S/N') text += `*RIF/CI:* ${clientRif}\n`;
    if (clientPhone) text += `*TELEFONO:* ${clientPhone}\n`;
    if (clientAddress) text += `*DIRECCION:* ${clientAddress}\n`;
    text += `------------------------------------\n`;
    text += `*DETALLE DE PRODUCTOS:*\n`;
    if (processedItems.length > 0) {
      processedItems.forEach((it, idx) => {
        text += `${idx + 1}. ${it.nombre} x${it.qty} = *Bs. ${fmt(it.subBs)}*\n`;
      });
    } else {
      text += `1. PEDIDO / SERVICIO = *Bs. ${fmt(totalBs)}*\n`;
    }
    text += `------------------------------------\n`;
    text += `*TOTAL A PAGAR:* *Bs. ${fmt(totalBs)}*\n`;
    if (order.paymentBreakdown && order.paymentBreakdown.length > 1) {
      text += `*FORMA DE PAGO: PAGO MIXTO*\n`;
      order.paymentBreakdown.forEach(p => {
        text += `- ${p.method}: $${fmt(p.amountUSD)} (Bs. ${fmt(p.amountBs)})${p.ref ? ` | Ref: ${p.ref}` : ''}\n`;
      });
    } else if (order.paymentMethod) {
      text += `*FORMA DE PAGO:* ${order.paymentMethod}${order.paymentRef ? ` (Ref: ${order.paymentRef})` : ''}\n`;
    }
    text += `\n`;
    text += `*LINK DEL PEDIDO (VER DISENOS Y ESTADO):*\n`;
    text += `https://seguimiento-sellos-chacaito.web.app/orden/${order.id || ''}\n\n`;
    text += `_GRACIAS POR SU COMPRA. ESTE DOCUMENTO ES UN RECIBO DE CONTROL INTERNO, SE LE ENTREGARA SU FACTURA FISCAL AL MOMENTO DE RETIRAR EL PRODUCTO._`;

    const encodedText = encodeURIComponent(text);
    // Extraer solo números del teléfono
    let phoneNum = (order.whatsapp || order.phone || '').replace(/\D/g, '');
    if (phoneNum) {
      if (phoneNum.startsWith('04')) {
        phoneNum = '584' + phoneNum.slice(2);
      } else if (phoneNum.startsWith('4') && phoneNum.length === 10) {
        phoneNum = '58' + phoneNum;
      }
      window.open(`https://wa.me/${phoneNum}?text=${encodedText}`, '_blank');
    } else {
      toast.error('El cliente no tiene un número de WhatsApp registrado');
    }
  };

  return createPortal(
    <div 
      id="print-modal-overlay"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }} 
      onClick={onClose}
    >
      <style>{`
        @media print {
          @page {
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          body > *:not(#print-modal-overlay) {
            display: none !important;
          }
          #print-modal-overlay {
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            display: block !important;
            z-index: 99999999 !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          #print-modal-overlay * {
            visibility: visible !important;
          }
          #print-modal-card {
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            display: block !important;
          }
          #print-scroll-area {
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            overflow: visible !important;
            display: block !important;
          }
          #printable-receipt {
            position: relative !important;
            margin: 0 auto !important;
            top: 0 !important;
            width: 100mm !important;
            max-width: 100mm !important;
            padding: 3mm 10mm 4mm 10mm !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            font-size: 8.5pt !important;
            line-height: 1.3 !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div 
        id="print-modal-card" 
        className="glass-card animate-fade-in" 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          background: 'white',
          borderRadius: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Header Actions */}
        <div className="no-print" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
              Recibo {orderNumber}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div 
          id="print-scroll-area"
          style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', justifyContent: 'center', background: '#f8fafc' }}
        >
          <div 
            id="printable-receipt" 
            ref={printAreaRef}
            style={{
              fontFamily: "'Montserrat', 'Roboto', Arial, sans-serif",
              textTransform: 'uppercase',
              color: '#000000',
              background: '#ffffff',
              padding: '16px 14px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              lineHeight: '1.3',
              width: '100%',
              maxWidth: '440px',
              fontSize: '8pt',
              boxSizing: 'border-box'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '1.5px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '11pt', fontWeight: 800, letterSpacing: '0.2px', marginBottom: '3px' }}>
                SELLOS CHACAITO C.A.
              </div>
              <div style={{ fontSize: '7pt', fontWeight: 500, lineHeight: '1.2' }}>
                CHACAÍTO, CENTRO COMERCIAL ARTA, PISO 1, LOCAL 1-6
              </div>
              <div style={{ fontSize: '8pt', fontWeight: 800, marginTop: '3px' }}>
                TELÉFONO: 0424-134-5488
              </div>
              <div style={{ fontSize: '8pt', fontWeight: 500, marginTop: '4px' }}>
                RECIBO {orderNumber}
              </div>
              <div style={{ fontSize: '8pt', fontWeight: 500, marginTop: '1px' }}>
                {dateStr}
              </div>
            </div>

            {/* Client Info */}
            <div style={{ borderBottom: '1.5px dashed #000', paddingBottom: '8px', marginBottom: '8px', lineHeight: '1.45' }}>
              <div style={{ display: 'flex' }}>
                <span style={{ fontSize: '7.5pt', fontWeight: 800, width: '70px' }}>CLIENTE:</span>
                <span style={{ fontSize: '7.5pt', fontWeight: 500, flex: 1 }}>{clientName}</span>
              </div>
              {clientRif && clientRif !== 'S/N' && (
                <div style={{ display: 'flex' }}>
                  <span style={{ fontSize: '7.5pt', fontWeight: 800, width: '70px' }}>RIF / CI:</span>
                  <span style={{ fontSize: '7.5pt', fontWeight: 500, flex: 1 }}>{clientRif}</span>
                </div>
              )}
              {clientPhone && (
                <div style={{ display: 'flex' }}>
                  <span style={{ fontSize: '7.5pt', fontWeight: 800, width: '70px' }}>TELÉFONO:</span>
                  <span style={{ fontSize: '7.5pt', fontWeight: 500, flex: 1 }}>{clientPhone}</span>
                </div>
              )}
              {clientAddress && (
                <div style={{ display: 'flex' }}>
                  <span style={{ fontSize: '7.5pt', fontWeight: 800, width: '70px' }}>DIRECCIÓN:</span>
                  <span style={{ fontSize: '7.5pt', fontWeight: 500, flex: 1 }}>{clientAddress}</span>
                </div>
              )}
            </div>

            {/* Products Table */}
            <div style={{ marginBottom: '8px', borderBottom: '1.5px dashed #000', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', fontSize: '7.5pt', fontWeight: 800, marginBottom: '5px' }}>
                <span style={{ width: '40px' }}>CANT.</span>
                <span style={{ flex: 1 }}>DESCRIPCIÓN</span>
                <span style={{ width: '80px', textAlign: 'right' }}>TOTAL (BS)</span>
              </div>
              
              {processedItems.length > 0 ? (
                processedItems.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', fontSize: '7.5pt', fontWeight: 500, marginBottom: '5px' }}>
                    <span style={{ width: '40px' }}>{it.qty}X</span>
                    <span style={{ flex: 1, paddingRight: '4px' }}>
                      {it.nombre}
                      {it.nota && (
                        <span style={{ display: 'block', fontSize: '6.8pt', fontWeight: 800, color: '#000000', marginTop: '1px' }}>
                          *NOTA: {it.nota.toUpperCase()}*
                        </span>
                      )}
                    </span>
                    <span style={{ width: '80px', textAlign: 'right', fontSize: '8pt', fontWeight: 700 }}>
                      BS. {fmt(it.subBs)}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', fontSize: '7.5pt', fontWeight: 500, marginBottom: '5px' }}>
                  <span style={{ width: '40px' }}>1X</span>
                  <span style={{ flex: 1, paddingRight: '4px' }}>PEDIDO / SERVICIO</span>
                  <span style={{ width: '80px', textAlign: 'right', fontSize: '8pt', fontWeight: 700 }}>
                    BS. {fmt(totalBs)}
                  </span>
                </div>
              )}
            </div>

            {/* Totals */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5pt', fontWeight: 900 }}>
                <span>TOTAL A PAGAR:</span>
                <span>BS. {fmt(totalBs)}</span>
              </div>
            </div>

            {/* Forma de Pago en Nota de Entrega */}
            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '5px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.5pt', fontWeight: 800 }}>
                <span>FORMA DE PAGO:</span>
                <span>{(order.paymentMethod || 'PAGO MÓVIL').toUpperCase()}</span>
              </div>
              {order.paymentBreakdown && order.paymentBreakdown.length > 1 ? (
                <div style={{ marginTop: '3px', fontSize: '6.8pt', color: '#1e293b' }}>
                  {order.paymentBreakdown.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                      <span>• {p.method} {p.ref ? `[Ref: ${p.ref}]` : ''}</span>
                      <span style={{ fontWeight: 700 }}>${fmt(p.amountUSD)} (Bs. {fmt(p.amountBs)})</span>
                    </div>
                  ))}
                </div>
              ) : (
                order.paymentRef ? (
                  <div style={{ fontSize: '6.8pt', color: '#64748b', textAlign: 'right', marginTop: '2px' }}>
                    Ref: {order.paymentRef}
                  </div>
                ) : null
              )}
            </div>

            {/* Footer Notice */}
            <div style={{ textAlign: 'center', lineHeight: '1.35' }}>
              <div style={{ fontSize: '7.5pt', fontWeight: 800, marginBottom: '3px' }}>
                ¡GRACIAS POR SU COMPRA!
              </div>
              <div style={{ fontSize: '6.5pt', fontWeight: 500 }}>
                ESTE DOCUMENTO ES UN RECIBO DE CONTROL INTERNO, SE LE ENTREGARÁ SU FACTURA FISCAL AL MOMENTO DE RETIRAR EL PRODUCTO.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Buttons */}
        <div className="no-print" style={{
          display: 'flex',
          gap: '10px',
          padding: '0.85rem 1.25rem',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <button
            onClick={handleCopyText}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0.65rem 1rem',
              borderRadius: '0.65rem',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>

          <button
            onClick={handleSendWhatsApp}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0.65rem 1rem',
              borderRadius: '0.65rem',
              background: '#22c55e',
              border: 'none',
              color: 'white',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Enviar WhatsApp
          </button>
          
          <button
            onClick={handlePrint}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0.65rem 1rem',
              borderRadius: '0.65rem',
              background: 'var(--primary, #16a34a)',
              border: 'none',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            <Printer size={16} /> Imprimir Recibo
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
