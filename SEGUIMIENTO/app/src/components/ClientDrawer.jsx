import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Phone, 
  MessageCircle, 
  FileText, 
  Calendar, 
  Tag, 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  Award, 
  Save, 
  Printer, 
  ExternalLink,
  MapPin,
  Mail,
  User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { firestoreDB } from '../firebase/config';
import { computeClientMetrics, syncClientStatsToFirestore } from '../utils/crmUtils';
import PrintNotaModal from './PrintNotaModal';

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

const STATUS_CONFIG = {
  design_sent: { name: 'Iniciando Pedido', color: '#2563eb', bg: '#eff6ff' },
  fina: { name: 'Pagado', color: '#16a34a', bg: '#dcfce7' },
  printing: { name: 'Impresión', color: '#d97706', bg: '#fef3c7' },
  production: { name: 'En Producción', color: '#4f46e5', bg: '#e0e7ff' },
  finished: { name: 'Terminado', color: '#059669', bg: '#ecfdf5' },
  packed: { name: 'Empacado', color: '#c026d3', bg: '#fae8ff' },
  delivered: { name: 'Entregado', color: '#64748b', bg: '#f1f5f9' }
};

export default function ClientDrawer({ client, allOrders = [], onClose }) {
  const [notes, setNotes] = useState(client?.notas || client?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState(null);

  // Compute live CRM metrics
  const metrics = React.useMemo(() => {
    return computeClientMetrics(client, allOrders) || {
      totalUSD: 0,
      totalBs: 0,
      totalOrders: 0,
      lastOrderDate: '-',
      daysSinceLastOrder: null,
      favoriteProduct: '-',
      tag: { label: 'NUEVO', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' },
      allOrders: []
    };
  }, [client, allOrders]);

  // Sync computed stats to Firestore in background
  useEffect(() => {
    if (client?.id && allOrders.length > 0) {
      syncClientStatsToFirestore(client, allOrders, firestoreDB);
    }
  }, [client?.id, allOrders.length]);

  if (!client) return null;

  const clientName = (client.nombre || client.name || 'Cliente sin nombre').toUpperCase();
  const clientRif = (client.rif || client.cedula || '').toUpperCase();
  const rawPhone = client.whatsapp || client.phone || client.telefono || '';
  const cleanPhone = String(rawPhone).replace(/\D/g, '');
  const clientAddress = (client.direccion || '').toUpperCase();
  const clientEmail = (client.correo || '').toLowerCase();

  const handleSaveNotes = async () => {
    if (!client.id) return;
    setIsSavingNotes(true);
    try {
      await updateDoc(doc(firestoreDB, 'clients', client.id), {
        notas: notes,
        updatedAt: new Date().toISOString()
      });
      client.notas = notes;
      toast.success('Notas de seguimiento guardadas');
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error('No se pudieron guardar las notas');
    } finally {
      setIsSavingNotes(false);
    }
  };

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 99990,
        display: 'flex',
        justifyContent: 'flex-end',
        transition: 'all 0.3s ease'
      }}
      onClick={onClose}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          height: '100%',
          background: 'var(--surface-solid, #ffffff)',
          color: 'var(--text-main, #1F2329)',
          boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* 1. Header with Brand Style */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-strong, #e2e8f0)',
          background: 'var(--surface-hover, #f8fafc)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 900,
                letterSpacing: '0.5px',
                padding: '3px 9px',
                borderRadius: '999px',
                color: metrics.tag.color,
                background: metrics.tag.bg,
                border: `1px solid ${metrics.tag.border}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Award size={13} /> {metrics.tag.label}
              </span>

              {client.tipo === 'mayorista' && (
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a'
                }}>
                  ⭐ MAYORISTA
                </span>
              )}
            </div>

            <h2 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-main, #0f172a)',
              wordBreak: 'break-word',
              lineHeight: 1.25
            }}>
              {clientName}
            </h2>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', marginTop: '4px' }}>
              {clientRif ? `RIF / CI: ${clientRif}` : 'Sin documento registrado'}
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. Scrollable Body Content */}
        <div style={{
          padding: '1.25rem 1.5rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {/* Contact Fast Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {cleanPhone ? (
              <>
                <a 
                  href={`https://wa.me/${cleanPhone}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '0.65rem',
                    background: '#25D366',
                    color: '#ffffff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <MessageCircle size={16} /> WhatsApp ({rawPhone})
                </a>

                <a 
                  href={`tel:${cleanPhone}`}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '0.65rem',
                    background: 'var(--surface-hover, #f1f5f9)',
                    border: '1px solid var(--border-strong, #cbd5e1)',
                    color: 'var(--text-main, #334155)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none'
                  }}
                  title="Llamar"
                >
                  <Phone size={16} />
                </a>
              </>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', fontStyle: 'italic' }}>
                Sin número de teléfono registrado
              </span>
            )}
          </div>

          {/* Quick Client Details Info */}
          {(clientAddress || clientEmail) && (
            <div style={{
              background: 'var(--surface-hover, #f8fafc)',
              borderRadius: '0.75rem',
              padding: '10px 14px',
              border: '1px solid var(--border-strong, #e2e8f0)',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {clientAddress && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={15} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ color: 'var(--text-main, #334155)', wordBreak: 'break-all' }}>{clientAddress}</span>
                </div>
              )}
              {clientEmail && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} color="#64748b" style={{ flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-main, #334155)', wordBreak: 'break-all' }}>{clientEmail}</span>
                </div>
              )}
            </div>
          )}

          {/* 3. CRM Metrics 2x2 Grid */}
          <div>
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: 'var(--text-muted, #64748b)'
            }}>
              Métricas del Cliente (CRM)
            </h4>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              {/* Total Comprado */}
              <div style={{
                background: 'var(--surface-hover, #f8fafc)',
                padding: '12px',
                borderRadius: '0.85rem',
                border: '1px solid var(--border-strong, #e2e8f0)'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', display: 'block' }}>
                  TOTAL COMPRADO
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary, #16a34a)', marginTop: '2px' }}>
                  ${fmt(metrics.totalUSD)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  Bs. {fmt(metrics.totalBs)}
                </div>
              </div>

              {/* Pedidos Totales */}
              <div style={{
                background: 'var(--surface-hover, #f8fafc)',
                padding: '12px',
                borderRadius: '0.85rem',
                border: '1px solid var(--border-strong, #e2e8f0)'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', display: 'block' }}>
                  PEDIDOS REALIZADOS
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main, #1e293b)', marginTop: '2px' }}>
                  {metrics.totalOrders}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                  {metrics.totalOrders === 1 ? '1 orden completada' : `${metrics.totalOrders} órdenes`}
                </div>
              </div>

              {/* Última Compra */}
              <div style={{
                background: 'var(--surface-hover, #f8fafc)',
                padding: '12px',
                borderRadius: '0.85rem',
                border: '1px solid var(--border-strong, #e2e8f0)'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', display: 'block' }}>
                  ÚLTIMA COMPRA
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main, #1e293b)', marginTop: '4px' }}>
                  {metrics.lastOrderDate}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {metrics.daysSinceLastOrder !== null 
                    ? `Hace ${metrics.daysSinceLastOrder} días`
                    : 'Sin compras previas'}
                </div>
              </div>

              {/* Producto Favorito */}
              <div style={{
                background: 'var(--surface-hover, #f8fafc)',
                padding: '12px',
                borderRadius: '0.85rem',
                border: '1px solid var(--border-strong, #e2e8f0)'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', display: 'block' }}>
                  PRODUCTO FAVORITO
                </span>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: 'var(--text-main, #1e293b)',
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }} title={metrics.favoriteProduct}>
                  {metrics.favoriteProduct}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Mayor recurrencia
                </div>
              </div>
            </div>
          </div>

          {/* 4. Editable Follow-up Notes */}
          <div style={{
            background: 'var(--surface-hover, #f8fafc)',
            padding: '14px',
            borderRadius: '0.85rem',
            border: '1px solid var(--border-strong, #e2e8f0)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                color: 'var(--text-muted, #64748b)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FileText size={14} /> Notas de Seguimiento
              </span>

              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
                style={{
                  background: 'var(--primary, #47FF00)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '4px 10px',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: isSavingNotes ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'opacity 0.2s'
                }}
              >
                <Save size={13} /> {isSavingNotes ? 'Guardando...' : 'Guardar'}
              </button>
            </div>

            <textarea 
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Escribe notas sobre preferencias, detalles de facturación o acuerdos con este cliente..."
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '0.82rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-strong, #cbd5e1)',
                background: 'var(--surface, #ffffff)',
                color: 'var(--text-main, #0f172a)',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* 5. Complete Orders Timeline / History */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--text-muted, #64748b)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShoppingBag size={14} /> Historial de Pedidos ({metrics.allOrders.length})
              </span>
            </div>

            {metrics.allOrders.length === 0 ? (
              <div style={{
                padding: '1.5rem',
                textAlign: 'center',
                background: 'var(--surface-hover, #f8fafc)',
                borderRadius: '0.75rem',
                border: '1px dashed var(--border-strong, #cbd5e1)',
                color: 'var(--text-muted, #94a3b8)',
                fontSize: '0.82rem'
              }}>
                Este cliente no tiene pedidos registrados en el sistema.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {metrics.allOrders.map(ord => {
                  const st = STATUS_CONFIG[ord.status] || { name: ord.status || 'Pendiente', color: '#64748b', bg: '#f1f5f9' };
                  const orderDate = ord.paidAt || ord.createdAt;
                  const formattedDate = orderDate ? new Date(orderDate).toLocaleDateString('es-VE') : '-';
                  const orderNum = ord.orderNumber ? `#${ord.orderNumber}` : `#${ord.id?.slice(-5)}`;
                  const itemsCount = ord.items?.length || 0;

                  return (
                    <div 
                      key={ord.id}
                      style={{
                        background: 'var(--surface-hover, #f8fafc)',
                        border: '1px solid var(--border-strong, #e2e8f0)',
                        borderRadius: '0.75rem',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main, #0f172a)' }}>
                            {orderNum}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            color: st.color,
                            background: st.bg
                          }}>
                            {st.name}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                          {formattedDate}
                        </span>
                      </div>

                      {/* Items Brief */}
                      {ord.items && ord.items.length > 0 && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#475569',
                          background: 'rgba(255,255,255,0.7)',
                          padding: '4px 8px',
                          borderRadius: '6px'
                        }}>
                          {ord.items.map(it => `${it.cantidad || 1}x ${it.nombre}`).join(', ')}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800 }}>
                          ${fmt(ord.totalAmount || 0)} 
                          {ord.totalAmountBs ? (
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginLeft: '6px' }}>
                              (Bs. {fmt(ord.totalAmountBs)})
                            </span>
                          ) : null}
                        </div>

                        {ord.hasFinaReceipt && (
                          <button
                            type="button"
                            onClick={() => setOrderToPrint(ord)}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: '#1e293b',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Printer size={12} /> Recibo
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {orderToPrint && (
        <PrintNotaModal 
          order={orderToPrint} 
          onClose={() => setOrderToPrint(null)} 
        />
      )}
    </div>,
    document.body
  );
}
