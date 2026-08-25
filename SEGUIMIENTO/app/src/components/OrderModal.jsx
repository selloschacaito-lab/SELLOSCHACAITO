import React from 'react';
import { X, MessageCircle, Calendar, User, AlignLeft, Edit, Trash2, DollarSign, Plus, Truck, Archive, Copy } from 'lucide-react';
import ImageViewer from './ImageViewer';
import { compressImageToBase64 } from '../utils/imageUtils';
import { ref, remove, update } from 'firebase/database';
import { db } from '../firebase/config';
import { createPortal } from 'react-dom';
import PaymentModal from './PaymentModal';
import ReceiptModal from './ReceiptModal';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { get, child } from 'firebase/database';

function OrderModal({ order, onClose, onEdit }) {
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [showClientDetails, setShowClientDetails] = React.useState(false);
  
  const [designImage, setDesignImage] = React.useState(null);
  const [receiptImage, setReceiptImage] = React.useState(null);
  const [locationImage, setLocationImage] = React.useState(null);
  const [isLoadingImages, setIsLoadingImages] = React.useState(true);
  const [isUploadingLocation, setIsUploadingLocation] = React.useState(false);
  const [imageViewerData, setImageViewerData] = React.useState({ images: [], initialIndex: 0 });

  React.useEffect(() => {
    let mounted = true;
    const fetchImages = async () => {
      try {
        if (order?.hasReference) {
          const snapshot = await get(child(ref(db), `orderAssets/reference/${order.id}/fullDataUrl`));
          if (snapshot.exists() && mounted) setDesignImage(snapshot.val());
        }
        if (order?.hasFinaReceipt) {
          const snapshot = await get(child(ref(db), `orderAssets/fina_receipt/${order.id}/fullDataUrl`));
          if (snapshot.exists() && mounted) setReceiptImage(snapshot.val());
        }
        if (order?.hasLocationPhoto) {
          const snapshot = await get(child(ref(db), `orderAssets/locationPhoto/${order.id}/fullDataUrl`));
          if (snapshot.exists() && mounted) setLocationImage(snapshot.val());
        }
      } catch (err) {
        console.error("Error cargando imagenes", err);
      } finally {
        if (mounted) setIsLoadingImages(false);
      }
    };
    if (order) fetchImages();
    return () => { mounted = false; };
  }, [order?.id, order?.hasReference, order?.hasFinaReceipt, order?.hasLocationPhoto]);

  if (!order) return null;

  const handleUploadLocationPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingLocation(true);
    try {
      const base64 = await compressImageToBase64(file);
      
      const updates = {};
      const dbPath = `orderAssets/locationPhoto/${order.id}`;
      
      updates[`${dbPath}/fullDataUrl`] = base64;
      updates[`${dbPath}/contentType`] = 'image/jpeg';
      updates[`${dbPath}/updatedAt`] = new Date().toISOString();
      updates[`orders/${order.id}/hasLocationPhoto`] = true;
      updates[`orders/${order.id}/updatedAt`] = new Date().toISOString();
      
      await update(ref(db), updates);
      setLocationImage(base64);
    } catch (err) {
      console.error("Error subiendo foto de ubicacion", err);
      alert("Error al subir la imagen");
    } finally {
      setIsUploadingLocation(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.')) {
      try {
        await remove(ref(db, `orders/${order.id}`));
        onClose();
      } catch (error) {
        console.error("Error al eliminar pedido:", error);
        alert("Error al eliminar el pedido.");
      }
    }
  };

  const handleArchive = async () => {
    if (window.confirm('¿Confirmas que este pedido ya fue entregado al cliente? Se moverá a la sección de archivados.')) {
      try {
        await update(ref(db, `orders/${order.id}`), {
          status: 'delivered',
          updatedAt: new Date().toISOString()
        });
        onClose();
      } catch (error) {
        console.error("Error al archivar pedido:", error);
        alert("Error al archivar el pedido.");
      }
    }
  };

  const handleUpdateLogistics = async (field, value) => {
    try {
      await update(ref(db, `orders/${order.id}`), {
        [field]: value,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error al actualizar logística:", error);
    }
  };

  const total = order.totalAmount || 0;
  const pagos = order.pagos || [];
  const totalPagado = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto), 0);
  const pendiente = Math.max(0, total - totalPagado);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {order.orderNumber ? <span style={{ color: '#0284c7', marginRight: '0.25rem' }}>#{order.orderNumber}</span> : null}
            {order.clientName || 'Sin Nombre'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span className="field-label"><User size={14} /> Cliente</span>
              <button 
                onClick={() => setShowClientDetails(!showClientDetails)}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
              >
                {showClientDetails ? 'Ocultar detalles' : 'Ver más detalles'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p className="field-value text-large" style={{ margin: 0 }}>{order.clientName || 'Sin Nombre'}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.clientName || ''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.2rem', marginLeft: '0.25rem', display: 'flex' }}
                title="Copiar"
              >
                <Copy size={14} />
              </button>
            </div>
            {showClientDetails && (
              <div style={{ marginTop: '0.75rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><span style={{ fontSize: '0.75rem', color: '#64748b' }}>WhatsApp:</span> <strong style={{ fontSize: '0.875rem', display: 'block' }}>{order.whatsapp || 'N/A'}</strong></div>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.whatsapp || ''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Copy size={14} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><span style={{ fontSize: '0.75rem', color: '#64748b' }}>RIF / C.I.:</span> <strong style={{ fontSize: '0.875rem', display: 'block' }}>{order.clientRif || 'N/A'}</strong></div>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.clientRif || ''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Copy size={14} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Dirección:</span> <strong style={{ fontSize: '0.875rem', display: 'block' }}>{order.clientAddress || 'N/A'}</strong></div>
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.clientAddress || ''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Copy size={14} /></button>
                </div>
                {order.mapsLink && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div><span style={{ fontSize: '0.75rem', color: '#64748b' }}>Maps:</span> <a href={order.mapsLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.875rem', display: 'block', color: '#3b82f6', textDecoration: 'none' }}>Abrir Link</a></div>
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(order.mapsLink || ''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Copy size={14} /></button>
                  </div>
                )}
                
                {/* Delivery actions */}
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const deliveryUrl = `${window.location.origin}/delivery/${order.id}`;
                      navigator.clipboard.writeText(deliveryUrl);
                      alert('¡Link de Delivery copiado al portapapeles!');
                    }}
                    style={{ width: '100%', padding: '0.5rem', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                  >
                    <Truck size={16} /> Copiar Link para Motorizado
                  </button>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <label style={{ flex: 1, padding: '0.5rem', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: isUploadingLocation ? 'wait' : 'pointer', fontSize: '0.8rem' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadLocationPhoto} disabled={isUploadingLocation} />
                      <ImageIcon size={14} /> {isUploadingLocation ? 'Subiendo...' : (order.hasLocationPhoto ? 'Cambiar Foto Fachada' : 'Subir Foto Fachada')}
                    </label>
                  </div>
                </div>

              </div>
            )}
          </div>

          {order.details && (
            <div className="modal-field">
              <span className="field-label"><AlignLeft size={14} /> Detalles de Producción</span>
              <div className="field-box" style={{ whiteSpace: 'pre-wrap' }}>
                {order.details}
              </div>
            </div>
          )}

          <div className="modal-grid">
            <div className="modal-field">
              <span className="field-label"><Calendar size={14} /> Fecha</span>
              <p className="field-value">
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Desconocida'}
              </p>
            </div>
            
            <div className="modal-field">
              <span className="field-label">DISEÑADOR</span>
              <p className="field-value">
                {order.designer || 'No asignado'}
              </p>
            </div>
          </div>

          {order.isFina && (
            <div className="modal-field">
              <span className="field-label">Etiquetas Especiales</span>
              <div className="card-badges">
                <span className="badge badge-fina">FINA</span>
              </div>
            </div>
          )}

          {(order.hasReference || order.hasFinaReceipt) && (
            <div className="modal-field" style={{ marginTop: '1.5rem' }}>
              <span className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ImageIcon size={14} /> Archivos Adjuntos
              </span>
              {isLoadingImages ? (
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Cargando imgenes...</p>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {(() => {
                    const availableImages = [];
                    if (designImage) availableImages.push({ url: designImage, label: 'Diseño' });
                    if (receiptImage) availableImages.push({ url: receiptImage, label: 'Recibo' });

                    return availableImages.map((img, idx) => (
                      <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.25rem', minWidth: '150px' }}>
                        <p style={{ fontSize: '0.7rem', color: '#475569', textAlign: 'center', marginBottom: '0.25rem', fontWeight: 'bold' }}>{img.label}</p>
                        <img 
                          src={img.url} 
                          alt={img.label} 
                          style={{ width: '150px', height: '150px', objectFit: 'contain', borderRadius: '0.25rem', cursor: 'zoom-in' }} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageViewerData({ images: availableImages, initialIndex: idx });
                          }}
                        />
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {/* SECCIONES DE FINANZAS Y LOGÍSTICA OCULTAS TEMPORALMENTE */}

        </div>

        <div className="modal-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
          {order.whatsapp ? (
            <a 
              href={`https://wa.me/${order.whatsapp}`} 
              target="_blank" 
              rel="noreferrer"
              className="btn-whatsapp modal-btn-wp"
            >
              <MessageCircle size={18} /> Escribir al cliente
            </a>
          ) : (
            <span className="no-wp">Sin nmero de contacto</span>
          )}
          
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <button 
              title="Editar Pedido"
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={() => onEdit(order)}
            >
              <Edit size={20} />
            </button>
            <button 
              title="Eliminar Pedido"
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={handleDelete}
            >
              <Trash2 size={20} />
            </button>
            <button 
              className="btn-primary" 
              style={{ width: 'auto', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#0f172a', color: 'white', padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '0.5rem' }} 
              onClick={handleArchive}
            >
              <Archive size={14} /> Marcar como Entregado
            </button>
          </div>
        </div>
      </div>
      
      {showPaymentModal && (
        <PaymentModal 
          order={order} 
          onClose={() => setShowPaymentModal(false)} 
        />
      )}

      {showReceiptModal && (
        <ReceiptModal 
          order={order} 
          onClose={() => setShowReceiptModal(false)} 
        />
      )}

      {imageViewerData.images.length > 0 && (
        <ImageViewer 
          images={imageViewerData.images} 
          initialIndex={imageViewerData.initialIndex}
          onClose={() => setImageViewerData({ images: [], initialIndex: 0 })} 
        />
      )}
    </div>,
    document.body
  );
}

export default OrderModal;
