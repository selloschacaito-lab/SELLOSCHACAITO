import React, { useState, useEffect, useMemo } from 'react';
import OrderCard from './OrderCard';
import ImageUploadModal from './ImageUploadModal';
import DeliveryModal from './DeliveryModal';
import CheckoutModal from './CheckoutModal';
import FinishedPhotoModal from './FinishedPhotoModal';
import POSModal from './POSModal';
import { db } from '../firebase/config';
import { ref, update, get, remove } from 'firebase/database';
import { logActivity } from '../services/activityLogger';
import confetti from 'canvas-confetti';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Minimize2, Maximize2, Plus, ChevronRight, LayoutPanelLeft, Palette, Receipt, Printer, Cog, CheckCircle2, Package, CheckCheck } from 'lucide-react';

const STATUSES = [
  { id: "design_sent", name: "Iniciando Pedido", color: "color-blue", icon: Palette },
  { id: "fina", name: "Pagado", color: "color-red", icon: Receipt },
  { id: "printing", name: "Impresión", color: "color-orange", icon: Printer },
  { id: "production", name: "En Producción", color: "color-indigo", icon: Cog },
  { id: "finished", name: "Terminado", color: "color-green", icon: CheckCircle2 },
  { id: "packed", name: "Empacado", color: "color-fuchsia", icon: Package },
  { id: "delivered", name: "Entregado", color: "color-gray", isHidden: true, icon: CheckCheck }
];

function KanbanBoard({ orders, searchTerm = '', showArchived = false, onOrderClick, highlightedOrderId = null }) {
  const [uploadingOrder, setUploadingOrder] = useState(null);
  const [missingTypes, setMissingTypes] = useState([]);
  const [deliveringOrder, setDeliveringOrder] = useState(null);
  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [packedOrder, setPackedOrder] = useState(null);
  const [posOrder, setPosOrder] = useState(null);
  const [uploadTargetStatus, setUploadTargetStatus] = useState(null);

  const [columnLimits, setColumnLimits] = useState({
    design_sent: 50,
    fina: 50,
    printing: 50,
    production: 50,
    finished: 50,
    packed: 50,
    delivered: 50
  });

  const [collapsedCols, setCollapsedCols] = useState(() => {
    try {
      const saved = localStorage.getItem('kanban_collapsed_cols');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Si hay un pedido resaltado en una columna colapsada, descolapsarla para mostrarlo
  useEffect(() => {
    if (highlightedOrderId && orders) {
      const order = orders[highlightedOrderId] || Object.values(orders).find(o => o.id === highlightedOrderId);
      if (order) {
        let rawStatus = order.status || order.statusId || 'design_sent';
        if (rawStatus === 'waiting_payment') rawStatus = 'fina';
        setCollapsedCols(prev => {
          if (prev[rawStatus]) {
            const next = { ...prev, [rawStatus]: false };
            localStorage.setItem('kanban_collapsed_cols', JSON.stringify(next));
            return next;
          }
          return prev;
        });
      }
    }
  }, [highlightedOrderId, orders]);

  const toggleCollapse = (statusId) => {
    setCollapsedCols(prev => {
      const next = { ...prev, [statusId]: !prev[statusId] };
      localStorage.setItem('kanban_collapsed_cols', JSON.stringify(next));
      return next;
    });
  };

  const [countRef1] = useAutoAnimate();
  const [countRef2] = useAutoAnimate();
  const [countRef3] = useAutoAnimate();
  const [countRef4] = useAutoAnimate();
  const [countRef5] = useAutoAnimate();
  const [countRef6] = useAutoAnimate();
  const [countRef7] = useAutoAnimate();
  const [countRef8] = useAutoAnimate();
  
  const countRefs = {
    design_sent: countRef1,
    waiting_payment: countRef2,
    fina: countRef3,
    printing: countRef4,
    production: countRef5,
    finished: countRef6,
    packed: countRef7,
    delivered: countRef8
  };

  const ordersByStatus = useMemo(() => {
    const accStatus = STATUSES.reduce((acc, status) => {
      acc[status.id] = [];
      return acc;
    }, {});

    const term = searchTerm.toLowerCase();

    Object.entries(orders || {}).forEach(([id, order]) => {
      if (!order) return;

      // Excluir pedidos cancelados o eliminados del tablero Kanban
      if (order.status === 'cancelled' || order.statusId === 'cancelled' || order.isCancelled) {
        return;
      }

      if (term) {
        const matchName = order.clientName?.toLowerCase().includes(term);
        const matchDetails = order.details?.toLowerCase().includes(term);
        const matchDesigner = order.designer?.toLowerCase().includes(term);
        if (!matchName && !matchDetails && !matchDesigner) return;
      }

      const legacyStatusMap = {
        "Diseño Enviado": "design_sent",
        "Diseo Enviado": "design_sent",
        "Espera de Pago": "fina",
        "FINA": "fina",
        "RECIBO": "fina",
        "Impresión": "printing",
        "Impresin": "printing",
        "En Producción": "production",
        "En Produccin": "production",
        "Terminado": "finished",
        "Empacado": "packed",
        "Entregado": "delivered"
      };

      let rawStatus = order.status || order.statusId || legacyStatusMap[order.status] || "design_sent";
      if (rawStatus === 'waiting_payment') rawStatus = 'fina';
      
      if (accStatus[rawStatus]) {
        accStatus[rawStatus].push({ id, ...order });
      } else if (rawStatus !== 'cancelled') {
        accStatus["design_sent"].push({ id, ...order });
      }
    });

    Object.keys(accStatus).forEach(status => {
      accStatus[status].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    });

    return accStatus;
  }, [orders, searchTerm]);

  const performAdvanceLogic = (id, nextStatus) => {
    const order = Object.entries(orders || {}).find(([oid]) => oid === id)?.[1];
    if (!order) return;

    const triggerFinaWhatsapp = (o) => {
      if (o.whatsapp) {
        const publicLink = `https://seguimiento-sellos-chacaito.web.app/orden/${o.id}`;
        const message = encodeURIComponent(`¡Hola! Ya estamos trabajando en su pedido. Para ver el estado, diseño y pagos, use este enlace único: 
${publicLink}

Le notificaremos cuando esté listo para retiro o despacho. ¡Saludos!`);
        window.open(`https://wa.me/${o.whatsapp}?text=${message}`, '_blank');
      }
    };

    // 1. Interceptar paso a PAGADO (fina) si no tiene venta/recibo registrada
    if (nextStatus === 'fina') {
      if (!order.hasFinaReceipt) {
        setPosOrder({ ...order, id });
        return false;
      }
    }

    // 2. Interceptar paso a IMPRESIÓN si no tiene diseño aprobado
    if (nextStatus === 'printing') {
      if (order.requiresDesign !== false && !order.hasReference) {
        toast.error('⛔ ¡Falta el diseño! No puedes pasar a Impresión sin haber subido el diseño aprobado.', { duration: 4000 });
        setUploadingOrder({ ...order, id });
        setMissingTypes(['reference']);
        setUploadTargetStatus('printing');
        return false;
      }
    }

    if (nextStatus === 'delivered') {
      setDeliveringOrder({ ...order, id });
      return false; 
    }

    if (nextStatus === 'packed') {
      setPackedOrder({ ...order, id });
      return false;
    }
    
    if (nextStatus === 'finished') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#47FF00', '#1F2329', '#E6E6E6', '#FFFFFF']
      });
    }

    if (nextStatus === 'printing') {
      const alertId = `${id}-${Date.now()}`;
      update(ref(db, `print_alerts/${alertId}`), {
        orderId: id,
        clientName: order?.clientName || "Cliente sin nombre",
        createdAt: new Date().toISOString()
      });
    }

    if (nextStatus === 'production') {
      get(ref(db, 'print_alerts')).then(snapshot => {
        if (snapshot.exists()) {
          const alerts = snapshot.val();
          Object.keys(alerts).forEach(alertId => {
            if (alerts[alertId].orderId === id || alertId.startsWith(id + '-')) {
              remove(ref(db, `print_alerts/${alertId}`));
            }
          });
        }
      }).catch(err => console.error(err));
    }

    const orderRef = ref(db, `orders/${id}`);
    const nowTime = Date.now();
    const nowISO = new Date().toISOString();
    const statusName = STATUSES.find(s => s.id === nextStatus)?.name || nextStatus;
    
    const timestampUpdates = {};
    if (nextStatus === 'fina' && !order?.paidAt) {
      timestampUpdates.paidAt = nowISO;
    }
    if (nextStatus === 'printing' && !order?.printedAt) {
      timestampUpdates.printedAt = nowISO;
    }
    if (nextStatus === 'finished' && !order?.finishedAt) {
      timestampUpdates.finishedAt = nowISO;
    }
    if (nextStatus === 'delivered' && !order?.deliveredAt) {
      timestampUpdates.deliveredAt = nowISO;
    }

    update(orderRef, { 
      status: nextStatus,
      statusId: nextStatus,
      currentStatusStartedAt: nowTime,
      updatedAt: nowISO,
      ...timestampUpdates
    }).then(() => {
      logActivity("Cambio de Estado", `Movió pedido #${order?.orderNumber || id.slice(-5)} a ${statusName}`, id);
      if (nextStatus === 'fina') {
        triggerFinaWhatsapp({ ...order, id });
      }
    }).catch(err => {
      console.error("Error avanzando pedido:", err);
    });

    return true;
  };

  const handleAdvance = (id, currentStatus) => {
    const currentIndex = STATUSES.findIndex(s => s.id === currentStatus);
    if (currentIndex < STATUSES.length - 1) {
      const nextStatus = STATUSES[currentIndex + 1].id;
      performAdvanceLogic(id, nextStatus);
    }
  };

  const handleRegress = (id, currentStatus) => {
    const currentIndex = STATUSES.findIndex(s => s.id === currentStatus);
    if (currentIndex > 0) {
      const prevStatus = STATUSES[currentIndex - 1].id;
      const prevStatusName = STATUSES[currentIndex - 1].name;
      const orderRef = ref(db, `orders/${id}`);
      const nowTime = Date.now();
      const order = orders ? orders[id] : null;

      update(orderRef, { 
        status: prevStatus,
        statusId: prevStatus,
        currentStatusStartedAt: nowTime,
        updatedAt: new Date().toISOString() 
      }).then(() => {
        logActivity("Retroceder Estado", `Retrocedió pedido #${order?.orderNumber || id.slice(-5)} a ${prevStatusName}`, id);
      }).catch(err => {
        console.error("Error retrocediendo pedido:", err);
      });
    }
  };

  const handleUploadComplete = () => {
    if (uploadingOrder && uploadTargetStatus) {
      const orderRef = ref(db, `orders/${uploadingOrder.id}`);
      update(orderRef, { 
        status: uploadTargetStatus,
        statusId: uploadTargetStatus,
        updatedAt: new Date().toISOString() 
      }).then(() => {
        if (uploadTargetStatus === 'fina' && uploadingOrder.whatsapp) {
          const publicLink = `https://seguimiento-sellos-chacaito.web.app/orden/${uploadingOrder.id}`;
          const message = encodeURIComponent(`¡Hola! Ya estamos trabajando en su pedido. Para ver el estado, diseño y pagos, use este enlace único: 
${publicLink}

Le notificaremos cuando esté listo para retiro o despacho. ¡Saludos!`);
          window.open(`https://wa.me/${uploadingOrder.whatsapp}?text=${message}`, '_blank');
        }
      });
    }
    setUploadingOrder(null);
    setMissingTypes([]);
    setUploadTargetStatus(null);
  };

  const handlePackedPhotoComplete = async (result = { skipped: true }) => {
    if (!packedOrder) return;
    const currentPacked = packedOrder;
    const orderId = currentPacked.id;
    setPackedOrder(null);

    // 1. Formatear teléfono para WhatsApp
    const rawPhone = String(currentPacked.whatsapp || '');
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '58' + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith('58') && cleanPhone.length === 10) cleanPhone = '58' + cleanPhone;

    // 2. Construir mensaje de WhatsApp detallado comunicando las opciones de envío o lo registrado
    const clientName = (currentPacked.clientName || 'Cliente').toUpperCase();
    const publicLink = `https://seguimiento-sellos-chacaito.web.app/orden/${orderId}`;
    
    let messageText = `Hola ${clientName}, tu sello en Sellos Chacaito esta LISTO Y EMPACADO.\n\n`;

    if (!result.skipped) {
      messageText += `Foto de tu pedido:\n${publicLink}\n\n`;
    }

    if (currentPacked.hasDelivery && currentPacked.deliveryType && currentPacked.deliveryType !== 'pickup') {
      messageText += `Entrega: Se despachara segun lo acordado.\n`;
    } else {
      messageText += `Retiro en Tienda: CC ARTA Chacaito, Piso 1, Local 1-6 (Lunes a Viernes 8:00 a.m. a 5:00 p.m.).\n`;
    }

    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}` : null;

    // 3. Abrir WhatsApp de inmediato
    if (waUrl) {
      window.open(waUrl, '_blank');
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>✅ ¡Pedido Empacado!</span>
          <button
            onClick={() => {
              window.open(waUrl, '_blank');
              toast.dismiss(t.id);
            }}
            style={{
              background: '#22c55e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '5px 10px',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            💬 Abrir WhatsApp
          </button>
        </div>
      ), { duration: 8000 });
    }

    // 4. Copiar imagen al portapapeles y actualizar BD
    try {
      if (!result.skipped) {
        get(ref(db, `orderAssets/finished_photo/${orderId}`)).then(async (finishedSnap) => {
          if (finishedSnap.exists() && finishedSnap.val()?.fullDataUrl) {
            const base64Data = finishedSnap.val().fullDataUrl;
            const res = await fetch(base64Data);
            const blob = await res.blob();
            if (navigator.clipboard && navigator.clipboard.write) {
              await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
              ]);
            }
          }
        }).catch(e => console.warn("Clipboard photo error:", e));
      }

      await update(ref(db, `orders/${orderId}`), { 
        status: 'packed',
        statusId: 'packed',
        updatedAt: new Date().toISOString() 
      });
    } catch (err) {
      console.error("Error al actualizar a packed:", err);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId !== destination.droppableId) {
      performAdvanceLogic(draggableId, destination.droppableId);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-scroll">
        {STATUSES.map((status, index) => {
          if (showArchived) {
            if (status.id !== 'delivered') return null;
          } else {
            if (status.isHidden) return null;
          }
          const isCollapsed = collapsedCols[status.id];
          
          if (isCollapsed && !showArchived) {
            const StatusIcon = status.icon || LayoutPanelLeft;
            return (
              <div 
                key={status.id} 
                onClick={() => toggleCollapse(status.id)}
                style={{
                  minWidth: '48px',
                  width: '48px',
                  flexShrink: 0,
                  background: 'rgba(241, 245, 249, 0.4)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1rem 0',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
                className="kanban-column-collapsed hover:bg-slate-100"
                title={`Expandir ${status.name}`}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div className={`column-dot ${status.color}`} style={{ margin: 0, marginBottom: '0.5rem' }}></div>
                  <StatusIcon size={20} color="#64748b" />
                  <span style={{
                    background: 'white',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    color: '#64748b',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    {(ordersByStatus[status.id] || []).length}
                  </span>
                </div>
              </div>
            );
          }
          
          return (
            <div key={status.id} className="kanban-column" style={showArchived ? { minWidth: '100%', flex: 1 } : {}}>
              <div className="column-header" style={{ position: 'relative' }}>
                <div className="column-title">
                  <div className={`column-dot ${status.color}`}></div>
                  <h3 className="column-name">{status.name}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="column-count" ref={countRefs[status.id]}>
                    {(ordersByStatus[status.id] || []).length}
                  </span>
                  {!showArchived && (
                    <button 
                      onClick={() => toggleCollapse(status.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.2rem',
                        color: '#94a3b8',
                        borderRadius: '0.25rem'
                      }}
                      title="Ocultar columna"
                      className="hover:bg-slate-200"
                    >
                      <Minimize2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <Droppable droppableId={status.id}>
                {(provided, snapshot) => (
                  <div 
                    className="column-body"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      backgroundColor: snapshot.isDraggingOver ? 'rgba(71, 255, 0, 0.1)' : 'rgba(241, 245, 249, 0.3)',
                      transition: 'background-color 0.2s ease',
                      border: snapshot.isDraggingOver ? '1px dashed var(--primary)' : '1px solid rgba(226, 232, 240, 0.5)'
                    }}
                  >
                    {(ordersByStatus[status.id] || []).slice(0, columnLimits[status.id] || 50).map((order, orderIndex) => (
                      <Draggable key={order.id} draggableId={order.id} index={orderIndex}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.9 : 1,
                              transform: snapshot.isDragging ? `${provided.draggableProps.style.transform} rotate(3deg)` : provided.draggableProps.style.transform,
                              marginBottom: '0.75rem' // Ensure spacing is maintained
                            }}
                          >
                            <OrderCard 
                              order={order} 
                              statusConfig={{ ...status, index, total: STATUSES.length - (showArchived ? 0 : 1) }} 
                              onAdvance={() => handleAdvance(order.id, status.id)}
                              onRegress={() => handleRegress(order.id, status.id)}
                              onClick={() => onOrderClick && onOrderClick(order)}
                              isHighlighted={highlightedOrderId === order.id}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {(ordersByStatus[status.id] || []).length > (columnLimits[status.id] || 50) && (
                      <button
                        onClick={() => setColumnLimits(prev => ({ ...prev, [status.id]: (prev[status.id] || 50) + 50 }))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(255, 255, 255, 0.6)',
                          border: '1px dashed #cbd5e1',
                          borderRadius: '8px',
                          color: '#475569',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          marginTop: '4px'
                        }}
                      >
                        Cargar más ({(ordersByStatus[status.id] || []).length - (columnLimits[status.id] || 50)} restantes)
                      </button>
                    )}
                    {provided.placeholder}
                    {(ordersByStatus[status.id] || []).length === 0 && (
                      <div className="empty-column" style={{ border: 'none' }}>
                        Vacío
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}

        {uploadingOrder && missingTypes.length > 0 && (
          <ImageUploadModal 
            order={uploadingOrder} 
            missingTypes={missingTypes}
            onClose={() => setUploadingOrder(null)}
            onComplete={handleUploadComplete}
          />
        )}

        {deliveringOrder && (
          <DeliveryModal 
            order={deliveringOrder}
            onClose={() => setDeliveringOrder(null)}
            onComplete={() => setDeliveringOrder(null)}
          />
        )}

        {packedOrder && (
          <FinishedPhotoModal 
            order={packedOrder}
            onClose={() => setPackedOrder(null)}
            onComplete={handlePackedPhotoComplete}
          />
        )}

        {posOrder && (
          <POSModal 
            order={posOrder}
            onClose={() => setPosOrder(null)}
            onSuccess={() => setPosOrder(null)}
          />
        )}
      </div>
    </DragDropContext>
  );
}

export default KanbanBoard;
