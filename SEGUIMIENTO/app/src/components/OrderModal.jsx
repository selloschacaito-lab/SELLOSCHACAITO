import React, { useState, useEffect, useRef } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { 
  X, 
  MessageCircle, 
  Calendar, 
  User, 
  AlignLeft, 
  Edit, 
  Trash2, 
  DollarSign, 
  Plus, 
  Truck, 
  Archive, 
  Copy, 
  ShoppingCart, 
  Printer,
  FileText, 
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  RefreshCw,
  Camera,
  Upload,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import ImageViewer from './ImageViewer';
import { compressImageToBase64 } from '../utils/imageUtils';
import { ref, remove, update, get, child } from 'firebase/database';
import { db } from '../firebase/config';
import { createPortal } from 'react-dom';
import POSModal from './POSModal';
import PrintNotaModal from './PrintNotaModal';
import SaleDetailModal from './SaleDetailModal';
import { formatDisplayPhone, normalizeWhatsApp } from '../utils/formatters';
import { toast } from 'react-hot-toast';

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function OrderModal({ order, onClose, onEdit }) {
  const { activeProfile } = useProfile();
  const [activeTab, setActiveTab] = useState('pedido'); // 'pedido' | 'venta' | 'delivery'
  
  // Submodals
  const [showPosModal, setShowPosModal] = useState(false);
  const [showPrintNotaModal, setShowPrintNotaModal] = useState(false);
  const [showSaleDetailModal, setShowSaleDetailModal] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  
  // Image assets
  const [designImage, setDesignImage] = useState(null);
  const [receiptImage, setReceiptImage] = useState(null);
  const [finishedImage, setFinishedImage] = useState(null);
  const [locationImage, setLocationImage] = useState(null);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [imageViewerData, setImageViewerData] = useState({ images: [], initialIndex: 0 });

  // Invoice field edit state (Mayra)
  const [invoiceNumberInput, setInvoiceNumberInput] = useState(order?.invoiceNumber || '');
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  // Delivery Maps Link state
  const [mapsLinkInput, setMapsLinkInput] = useState(order?.mapsLink || '');
  const [isSavingMapsLink, setIsSavingMapsLink] = useState(false);

  // Quick payment register for "Por Pagar"
  const [registeringPaymentMethod, setRegisteringPaymentMethod] = useState('Pago Móvil');
  const [registeringPaymentRef, setRegisteringPaymentRef] = useState('');
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  // Target Workshop Photo Slot Selector ('reference' | 'finishedPhoto')
  const [selectedWorkshopSlot, setSelectedWorkshopSlot] = useState('reference');

  // Load all images for this order
  useEffect(() => {
    let mounted = true;
    const fetchImages = async () => {
      if (!order?.id) return;
      setIsLoadingImages(true);
      try {
        const fetchSlot = async (types) => {
          const typeList = Array.isArray(types) ? types : [types];
          for (const type of typeList) {
            try {
              const snap = await get(child(ref(db), `orderAssets/${type}/${order.id}/fullDataUrl`));
              if (snap.exists() && snap.val()) return snap.val();
            } catch {}
          }
          return null;
        };

        const [design, receipt, finished, location] = await Promise.all([
          fetchSlot('reference'),
          fetchSlot(['fina_receipt', 'paymentPhoto']),
          fetchSlot(['finished_photo', 'finishedPhoto']),
          fetchSlot(['locationPhoto', 'location_photo'])
        ]);

        if (mounted) {
          setDesignImage(design);
          setReceiptImage(receipt);
          setFinishedImage(finished);
          setLocationImage(location);
        }
      } catch (err) {
        console.error("Error cargando imágenes:", err);
      } finally {
        if (mounted) setIsLoadingImages(false);
      }
    };

    fetchImages();
    return () => { mounted = false; };
  }, [order?.id, order?.hasReference, order?.hasFinaReceipt, order?.hasFinishedPhoto, order?.hasLocationPhoto]);

  // Support paste (Ctrl+V) anywhere inside the modal
  useEffect(() => {
    const handlePaste = async (e) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = clipboardItems[i].getAsFile();
          if (!file) return;

          let targetSlot = 'reference';
          if (activeTab === 'venta') targetSlot = 'fina_receipt';
          else if (activeTab === 'delivery') targetSlot = 'locationPhoto';
          else targetSlot = selectedWorkshopSlot; // 'reference' or 'finishedPhoto'

          await handleUploadImage(targetSlot, file);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab, order?.id, selectedWorkshopSlot]);

  if (!order) return null;

  // Handle uploading / updating image in Firebase
  const handleUploadImage = async (slotType, file) => {
    if (!file || !file.type?.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    setUploadingSlot(slotType);
    const loadingToast = toast.loading('Optimizando y guardando imagen...');
    try {
      const base64 = await compressImageToBase64(file);
      const updates = {};
      const dbPath = `orderAssets/${slotType}/${order.id}`;
      const nowISO = new Date().toISOString();

      updates[`${dbPath}/fullDataUrl`] = base64;
      updates[`${dbPath}/contentType`] = 'image/jpeg';
      updates[`${dbPath}/updatedAt`] = nowISO;
      updates[`orders/${order.id}/updatedAt`] = nowISO;

      if (slotType === 'reference') {
        updates[`orderAssets/reference/${order.id}/fullDataUrl`] = base64;
        updates[`orderAssets/reference/${order.id}/contentType`] = 'image/jpeg';
        updates[`orderAssets/reference/${order.id}/updatedAt`] = nowISO;
        updates[`orders/${order.id}/hasReference`] = true;
        setDesignImage(base64);
      } else if (slotType === 'fina_receipt') {
        updates[`orderAssets/fina_receipt/${order.id}/fullDataUrl`] = base64;
        updates[`orderAssets/fina_receipt/${order.id}/contentType`] = 'image/jpeg';
        updates[`orderAssets/fina_receipt/${order.id}/updatedAt`] = nowISO;
        updates[`orders/${order.id}/hasFinaReceipt`] = true;
        updates[`orders/${order.id}/hasPaymentPhoto`] = true;
        updates[`orders/${order.id}/paidAt`] = order.paidAt || nowISO;
        updates[`orders/${order.id}/isPaid`] = true;
        if (order.paymentMethod === 'Por Pagar') {
          updates[`orders/${order.id}/paymentMethod`] = 'Pago Móvil';
        }
        setReceiptImage(base64);
      } else if (slotType === 'finishedPhoto' || slotType === 'finished_photo') {
        updates[`orderAssets/finished_photo/${order.id}/fullDataUrl`] = base64;
        updates[`orderAssets/finished_photo/${order.id}/contentType`] = 'image/jpeg';
        updates[`orderAssets/finished_photo/${order.id}/updatedAt`] = nowISO;
        updates[`orderAssets/finishedPhoto/${order.id}/fullDataUrl`] = base64;
        updates[`orderAssets/finishedPhoto/${order.id}/contentType`] = 'image/jpeg';
        updates[`orderAssets/finishedPhoto/${order.id}/updatedAt`] = nowISO;
        updates[`orders/${order.id}/hasFinishedPhoto`] = true;
        setFinishedImage(base64);
      } else if (slotType === 'locationPhoto' || slotType === 'location_photo') {
        updates[`orderAssets/locationPhoto/${order.id}/fullDataUrl`] = base64;
        updates[`orderAssets/locationPhoto/${order.id}/contentType`] = 'image/jpeg';
        updates[`orderAssets/locationPhoto/${order.id}/updatedAt`] = nowISO;
        updates[`orders/${order.id}/hasLocationPhoto`] = true;
        setLocationImage(base64);
      }

      await update(ref(db), updates);
      toast.dismiss(loadingToast);
      toast.success('¡Imagen guardada con éxito!');
    } catch (err) {
      console.error("Error subiendo imagen:", err);
      toast.dismiss(loadingToast);
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingSlot(null);
    }
  };

  // Handle deleting image
  const handleDeleteImage = async (slotType, slotLabel) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la foto de ${slotLabel}?`)) {
      return;
    }

    const loadingToast = toast.loading('Eliminando imagen...');
    try {
      const updates = {};
      const nowISO = new Date().toISOString();
      updates[`orderAssets/${slotType}/${order.id}`] = null;
      updates[`orders/${order.id}/updatedAt`] = nowISO;

      if (slotType === 'reference') {
        updates[`orders/${order.id}/hasReference`] = false;
        setDesignImage(null);
      } else if (slotType === 'fina_receipt') {
        updates[`orders/${order.id}/hasFinaReceipt`] = false;
        updates[`orders/${order.id}/hasPaymentPhoto`] = false;
        setReceiptImage(null);
      } else if (slotType === 'finishedPhoto' || slotType === 'finished_photo') {
        updates[`orderAssets/finished_photo/${order.id}`] = null;
        updates[`orderAssets/finishedPhoto/${order.id}`] = null;
        updates[`orders/${order.id}/hasFinishedPhoto`] = false;
        setFinishedImage(null);
      } else if (slotType === 'locationPhoto' || slotType === 'location_photo') {
        updates[`orderAssets/locationPhoto/${order.id}`] = null;
        updates[`orders/${order.id}/hasLocationPhoto`] = false;
        setLocationImage(null);
      }

      await update(ref(db), updates);
      toast.dismiss(loadingToast);
      toast.success(`Foto de ${slotLabel} eliminada`);
    } catch (err) {
      console.error("Error al eliminar imagen:", err);
      toast.dismiss(loadingToast);
      toast.error('Error al eliminar la imagen');
    }
  };

  // Delete Entire Order
  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar permanentemente este pedido?')) {
      try {
        await remove(ref(db, `orders/${order.id}`));
        toast.success("Pedido eliminado exitosamente");
        onClose();
      } catch (error) {
        console.error("Error al eliminar pedido:", error);
        toast.error("Error al eliminar el pedido.");
      }
    }
  };

  // Mark order as delivered / archived
  const handleArchive = async () => {
    if (window.confirm('¿Confirmas que este pedido ya fue entregado al cliente? Se moverá a la sección de archivados.')) {
      try {
        await update(ref(db, `orders/${order.id}`), {
          status: 'delivered',
          statusId: 'delivered',
          deliveredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        toast.success("Pedido marcado como entregado");
        onClose();
      } catch (error) {
        console.error("Error al archivar pedido:", error);
        toast.error("Error al archivar el pedido.");
      }
    }
  };

  // Send Delivery data format to WhatsApp
  const handleSendDeliveryData = () => {
    const orderNum = order.orderNumber ? `#${order.orderNumber}` : `#${order.id.slice(-5)}`;
    const clientName = order.clientName || 'Sin Nombre';
    const phone = order.whatsapp || '-';
    const address = order.clientAddress || order.address || order.deliveryAddress || 'Caracas';
    const deliveryLink = `${window.location.origin}/delivery/${order.id}`;
    const maps = (mapsLinkInput || order.mapsLink || '').trim();

    let text = `Pedido: ${orderNum}
Nombre: ${clientName}
Telefono: ${phone}
Direccion: ${address}`;

    if (maps) {
      text += `\nUbicacion: ${maps}`;
    }

    text += `\n\nLink: ${deliveryLink}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
      toast.success('¡Datos copiados al portapapeles!');
    }

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Save Maps location link in RTDB
  const handleSaveMapsLink = async () => {
    setIsSavingMapsLink(true);
    try {
      const nowISO = new Date().toISOString();
      const cleanLink = mapsLinkInput.trim();
      await update(ref(db, `orders/${order.id}`), {
        mapsLink: cleanLink,
        updatedAt: nowISO
      });
      toast.success(cleanLink ? '¡Link de ubicación guardado!' : 'Ubicación eliminada');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la ubicación');
    } finally {
      setIsSavingMapsLink(false);
    }
  };

  // Save fiscal invoice number (Mayra)
  const handleSaveInvoiceNumber = async () => {
    if (!invoiceNumberInput.trim()) {
      toast.error('Ingresa el número de factura fiscal');
      return;
    }
    setIsSavingInvoice(true);
    try {
      const nowISO = new Date().toISOString();
      await update(ref(db, `orders/${order.id}`), {
        isInvoiced: true,
        invoiceNumber: invoiceNumberInput.trim().toUpperCase(),
        invoicedAt: nowISO,
        invoicedBy: activeProfile?.name || 'Mayra',
        updatedAt: nowISO
      });
      toast.success(`¡Factura #${invoiceNumberInput} guardada con éxito!`);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la factura');
    } finally {
      setIsSavingInvoice(false);
    }
  };

  // Mark "Por Pagar" order as Paid
  const handleMarkAsPaid = async () => {
    setIsMarkingPaid(true);
    try {
      const nowISO = new Date().toISOString();
      await update(ref(db, `orders/${order.id}`), {
        isPaid: true,
        paidAt: nowISO,
        paymentMethod: registeringPaymentMethod,
        paymentRef: registeringPaymentRef.trim(),
        hasFinaReceipt: true,
        updatedAt: nowISO
      });
      toast.success('¡Orden marcada como PAGADA con éxito!');
    } catch (err) {
      console.error(err);
      toast.error('Error al registrar el pago');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  // Copy helper
  const copyText = (txt, label) => {
    if (!txt) return;
    navigator.clipboard.writeText(txt);
    toast.success(`¡${label} copiado!`);
  };

  // Is Paid state
  const isPaid = (
    order.isPaid !== false &&
    order.paymentMethod !== 'Por Pagar' &&
    Boolean(order.paidAt || order.hasFinaReceipt || order.status === 'delivered')
  );

  // Render Image Slot component
  const renderImageSlot = ({ label, slotType, imageSrc, helperText, isSelected, onSelect }) => {
    const isThisUploading = uploadingSlot === slotType;

    return (
      <div 
        onClick={() => {
          if (onSelect) onSelect();
        }}
        style={{
          background: isSelected ? '#f0fdf4' : '#ffffff',
          border: isSelected 
            ? '2.5px solid #10b981' 
            : (imageSrc ? '1.5px solid #cbd5e1' : '1.5px dashed #cbd5e1'),
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          position: 'relative',
          boxShadow: isSelected ? '0 0 0 3px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(0,0,0,0.06)' : 'none',
          cursor: onSelect ? 'pointer' : 'default',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: isSelected ? '#065f46' : '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ImageIcon size={13} color={isSelected ? '#10b981' : '#64748b'} /> {label}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isSelected && (
              <span style={{
                fontSize: '9.5px',
                fontWeight: 900,
                background: '#10b981',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '999px',
                letterSpacing: '0.02em'
              }}>
                ✓ ACTIVO PARA PEGAR
              </span>
            )}

            {imageSrc && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage(slotType, label);
                }}
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title="Eliminar esta foto permanentemente"
              >
                <Trash2 size={12} /> Eliminar
              </button>
            )}
          </div>
        </div>

        {imageSrc ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div 
              style={{
                position: 'relative',
                width: '100%',
                height: '140px',
                background: '#0f172a',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'zoom-in',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => setImageViewerData({ images: [{ url: imageSrc, label }], initialIndex: 0 })}
            >
              <img 
                src={imageSrc} 
                alt={label} 
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
              />
              <div style={{
                position: 'absolute',
                bottom: '6px',
                right: '6px',
                background: 'rgba(0,0,0,0.6)',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700
              }}>
                🔍 Click para Zoom
              </div>
            </div>

            {/* Cambiar Foto Button */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontSize: '11px',
              fontWeight: 700,
              cursor: isThisUploading ? 'wait' : 'pointer'
            }}>
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                disabled={isThisUploading}
                onChange={e => {
                  if (e.target.files?.[0]) handleUploadImage(slotType, e.target.files[0]);
                }} 
              />
              <RefreshCw size={12} className={isThisUploading ? 'animate-spin' : ''} />
              {isThisUploading ? 'Subiendo...' : '🔄 Cambiar Foto'}
            </label>
          </div>
        ) : (
          <label style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 12px',
            borderRadius: '8px',
            background: '#f8fafc',
            border: '1px dashed #94a3b8',
            cursor: isThisUploading ? 'wait' : 'pointer',
            textAlign: 'center',
            gap: '6px'
          }}>
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              disabled={isThisUploading}
              onChange={e => {
                if (e.target.files?.[0]) handleUploadImage(slotType, e.target.files[0]);
              }} 
            />
            <div style={{ background: '#e2e8f0', padding: '8px', borderRadius: '50%', color: '#475569' }}>
              <Camera size={18} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
              {isThisUploading ? 'Subiendo imagen...' : 'Subir o Pegar Foto'}
            </span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              {helperText || 'Click para elegir, arrastrar o Ctrl+V'}
            </span>
          </label>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 100 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', width: '95%', maxWidth: '640px' }}>
        
        {/* HEADER MODAL */}
        <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
              #{order.orderNumber || order.id.slice(-5)}
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {order.clientName || 'Sin Nombre'}
              </h2>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · Diseñador: <strong>{order.designer || 'No asignado'}</strong>
              </span>
            </div>
          </div>
          <button 
            type="button"
            className="modal-close" 
            onClick={onClose} 
            style={{ 
              color: '#334155', 
              cursor: 'pointer', 
              background: '#ffffff', 
              border: '1.5px solid #cbd5e1',
              borderRadius: '12px',
              width: '42px',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              touchAction: 'manipulation'
            }}
            title="Cerrar pedido"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* 3 TABS SELECTOR */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          background: '#f1f5f9',
          padding: '6px',
          borderBottom: '1px solid #e2e8f0',
          gap: '6px'
        }}>
          {[
            { id: 'pedido', label: '📦 PEDIDO', sub: 'Taller & Diseños' },
            { id: 'venta', label: '💳 VENTA & FACTURA', sub: isPaid ? '✅ Pagado' : '⏳ Por Pagar' },
            { id: 'delivery', label: '🚚 DELIVERY', sub: 'Despacho' }
          ].map(tab => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 6px',
                  borderRadius: '10px',
                  border: isTabActive ? '1.5px solid #10b981' : '1px solid transparent',
                  background: isTabActive ? '#ffffff' : 'transparent',
                  color: isTabActive ? '#0f172a' : '#64748b',
                  fontWeight: isTabActive ? 900 : 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: isTabActive ? '0 2px 5px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  textAlign: 'center'
                }}
              >
                <div>{tab.label}</div>
                <div style={{ fontSize: '10px', color: isTabActive ? (tab.id === 'venta' && !isPaid ? '#d97706' : '#10b981') : '#94a3b8', fontWeight: 700 }}>
                  {tab.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* MODAL BODY TABS */}
        <div className="modal-body" style={{ padding: '1.25rem', maxHeight: '72vh', overflowY: 'auto' }}>

          {/* ========================================================================= */}
          {/* PESTAÑA 1: PEDIDO (TALLER, PRODUCTOS, DISEÑOS) */}
          {/* ========================================================================= */}
          {activeTab === 'pedido' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Cliente Data Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={13} /> Datos del Cliente
                  </span>
                  <button 
                    onClick={() => setShowClientDetails(!showClientDetails)}
                    style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
                  >
                    {showClientDetails ? 'Ocultar' : 'Ver ficha completa'}
                  </button>
                </div>
                
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  {order.clientName || 'Sin Nombre'}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: '#475569', flexWrap: 'wrap' }}>
                  {order.whatsapp && (
                    <span>📱 WA: <strong>{formatDisplayPhone(order.whatsapp)}</strong></span>
                  )}
                  {order.clientRif && (
                    <span>🪪 RIF: <strong>{order.clientRif}</strong></span>
                  )}
                </div>

                {showClientDetails && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>📍 <strong>Dirección:</strong> {order.clientAddress || order.address || 'Caracas'}</div>
                    {order.mapsLink && <div>🗺️ <strong>Maps:</strong> <a href={order.mapsLink} target="_blank" rel="noreferrer" style={{ color: '#3b82f6' }}>Ver Ubicación</a></div>}
                  </div>
                )}
              </div>

              {/* Productos a Fabricar en Taller */}
              <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '8px' }}>
                  📦 Productos a Fabricar ({order.items?.length || 1})
                </span>

                {order.items && order.items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {order.items.map((it, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                            {it.cantidad || 1}x {it.nombre}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#10b981' }}>
                            ${((it.cantidad || 1) * (it.precioUSD || 0)).toFixed(2)}
                          </span>
                        </div>
                        {it.nota && (
                          <div style={{ marginTop: '4px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '4px 8px', color: '#1e40af', fontSize: '11.5px', fontWeight: 800 }}>
                            📝 NOTA TALLER: {it.nota}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#334155' }}>
                    {order.details || 'Sellos y productos de oficina'}
                  </div>
                )}
              </div>

              {/* Fotos de Producción (Diseño & Sello Terminado) con selector explícito */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ImageIcon size={13} color="#10b981" /> Fotos de Producción & Taller
                  </span>

                  {/* Selector para elegir a cuál foto va el pegado Ctrl+V */}
                  <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '3px', border: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedWorkshopSlot('reference')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: selectedWorkshopSlot === 'reference' ? '1px solid #a7f3d0' : '1px solid transparent',
                        background: selectedWorkshopSlot === 'reference' ? '#10b981' : 'transparent',
                        color: selectedWorkshopSlot === 'reference' ? '#ffffff' : '#64748b',
                        fontWeight: 800,
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      🎨 1. Muestra / Diseño
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedWorkshopSlot('finishedPhoto')}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: selectedWorkshopSlot === 'finishedPhoto' ? '1px solid #a7f3d0' : '1px solid transparent',
                        background: selectedWorkshopSlot === 'finishedPhoto' ? '#10b981' : 'transparent',
                        color: selectedWorkshopSlot === 'finishedPhoto' ? '#ffffff' : '#64748b',
                        fontWeight: 800,
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      🏆 2. Producto Terminado
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {renderImageSlot({
                    label: 'Muestra / Diseño',
                    slotType: 'reference',
                    imageSrc: designImage,
                    helperText: 'Boceto o arte aprobado',
                    isSelected: selectedWorkshopSlot === 'reference',
                    onSelect: () => setSelectedWorkshopSlot('reference')
                  })}

                  {renderImageSlot({
                    label: 'Producto Terminado',
                    slotType: 'finishedPhoto',
                    imageSrc: finishedImage,
                    helperText: 'Foto del sello listo',
                    isSelected: selectedWorkshopSlot === 'finishedPhoto',
                    onSelect: () => setSelectedWorkshopSlot('finishedPhoto')
                  })}
                </div>
              </div>

              {/* Botón Imprimir Comanda de Taller */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowPrintNotaModal(true)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Printer size={16} /> Imprimir Comanda de Taller
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 2: VENTA & FACTURA (MAYRA Y COBRO) */}
          {/* ========================================================================= */}
          {activeTab === 'venta' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Estado de Pago Banner */}
              <div style={{
                background: isPaid ? '#ecfdf5' : '#fffbeb',
                border: isPaid ? '1.5px solid #a7f3d0' : '1.5px solid #fde68a',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    background: isPaid ? '#10b981' : '#f59e0b',
                    color: '#ffffff',
                    padding: '6px',
                    borderRadius: '8px',
                    display: 'flex'
                  }}>
                    {isPaid ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 900, color: isPaid ? '#065f46' : '#92400e' }}>
                      {isPaid ? 'ESTADO: PAGADO' : 'ESTADO: ⏳ POR PAGAR'}
                    </div>
                    <div style={{ fontSize: '11px', color: isPaid ? '#047857' : '#b45309', fontWeight: 700 }}>
                      {order.paymentMethod ? `Método: ${order.paymentMethod}` : 'Cobro pendiente'} {order.paymentRef ? `(Ref: ${order.paymentRef})` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: isPaid ? '#10b981' : '#d97706' }}>
                    ${Number(order.totalAmount || 0).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                    Bs. {order.totalAmountBs ? Number(order.totalAmountBs).toLocaleString('es-VE', { minimumFractionDigits: 2 }) : fmt(Number(order.totalAmount || 0) * (Number(order.tasaBCV) || 1))}
                  </div>
                </div>
              </div>

              {/* Si está "Por Pagar", formulario rápido para registrar el cobro */}
              {!isPaid && (
                <div style={{ background: '#f8fafc', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '12px 14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#92400e', display: 'block', marginBottom: '8px' }}>
                    💳 Registrar Cobro del Cliente:
                  </span>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Método</label>
                      <select 
                        value={registeringPaymentMethod}
                        onChange={e => setRegisteringPaymentMethod(e.target.value)}
                        style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px', fontWeight: 700 }}
                      >
                        <option value="Pago Móvil">Pago Móvil</option>
                        <option value="Efectivo USD">Efectivo USD</option>
                        <option value="Efectivo Bs">Efectivo Bs</option>
                        <option value="Débito">Débito / Punto</option>
                        <option value="Transferencia">Transferencia Banesco</option>
                        <option value="Zelle">Zelle</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Referencia (Opcional)</label>
                      <input 
                        type="text"
                        placeholder="Últimos 6 dígitos"
                        value={registeringPaymentRef}
                        onChange={e => setRegisteringPaymentRef(e.target.value)}
                        style={{ width: '100%', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '12px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isMarkingPaid}
                    onClick={handleMarkAsPaid}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCircle2 size={14} /> Marcar como Pagado
                  </button>
                </div>
              )}

              {/* Comprobante / Foto del Pago */}
              <div>
                {renderImageSlot({
                  label: 'Comprobante / Soporte del Pago',
                  slotType: 'fina_receipt',
                  imageSrc: receiptImage,
                  helperText: 'Foto o captura de Pago Móvil / Transferencia'
                })}
              </div>

              {/* Desglose Fiscal y Facturación de Mayra */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} color="#3b82f6" /> Facturación Fiscal (Mayra)
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: order.isInvoiced ? '#ecfdf5' : '#fffbeb',
                    color: order.isInvoiced ? '#065f46' : '#92400e',
                    border: order.isInvoiced ? '1px solid #a7f3d0' : '1px solid #fde68a'
                  }}>
                    {order.isInvoiced ? `✓ Factura #${order.invoiceNumber}` : '⏳ Por Facturar'}
                  </span>
                </div>

                {/* Input para guardar N° de Factura */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  <input 
                    type="text"
                    placeholder="Ej. 15972"
                    value={invoiceNumberInput}
                    onChange={e => setInvoiceNumberInput(e.target.value)}
                    style={{
                      flex: 1,
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      fontWeight: 800
                    }}
                  />
                  <button
                    type="button"
                    disabled={isSavingInvoice}
                    onClick={handleSaveInvoiceNumber}
                    style={{
                      padding: '0 12px',
                      borderRadius: '8px',
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {isSavingInvoice ? 'Guardando...' : '✓ Guardar Factura'}
                  </button>
                </div>

                {/* Ficha Fiscal del Cliente con botones Copiar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11.5px', color: '#334155' }}>
                  <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span><strong>RIF:</strong> {order.clientRif || 'N/A'}</span>
                    <button onClick={() => copyText(order.clientRif, 'RIF')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Copy size={12} /></button>
                  </div>
                  <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><strong>Nombre:</strong> {order.clientName || 'N/A'}</span>
                    <button onClick={() => copyText(order.clientName, 'Nombre')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Copy size={12} /></button>
                  </div>
                  <div style={{ background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gridColumn: 'span 2' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><strong>Dirección:</strong> {order.clientAddress || order.address || 'Caracas'}</span>
                    <button onClick={() => copyText(order.clientAddress || order.address, 'Dirección')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Copy size={12} /></button>
                  </div>
                </div>
              </div>

              {/* Botón Editar Venta / POS */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowPosModal(true)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <ShoppingCart size={15} /> Editar Venta / POS
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 3: DELIVERY (LOGÍSTICA Y MOTORIZADO) */}
          {/* ========================================================================= */}
          {activeTab === 'delivery' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Tarjeta de Ficha de Despacho Limpia */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #a7f3d0', borderRadius: '12px', padding: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#065f46', display: 'block', marginBottom: '8px' }}>
                  🛵 Mensaje Listo para Enviar al Motorizado
                </span>

                <div style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: '#0f172a',
                  whiteSpace: 'pre-wrap'
                }}>
{`Pedido: #${order.orderNumber || order.id.slice(-5)}
Nombre: ${order.clientName || 'Sin Nombre'}
Telefono: ${order.whatsapp || '-'}
Direccion: ${order.clientAddress || order.address || order.deliveryAddress || 'Caracas'}${mapsLinkInput.trim() ? `\nUbicacion: ${mapsLinkInput.trim()}` : ''}

Link: ${window.location.origin}/delivery/${order.id}`}
                </div>
              </div>

              {/* Campo para ingresar / modificar el Link de Google Maps */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} color="#ef4444" /> Link de Ubicación / Google Maps
                  </span>
                  {mapsLinkInput.trim() && (
                    <a 
                      href={mapsLinkInput.trim()} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 800, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                    >
                      <ExternalLink size={12} /> Abrir Mapa
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <input 
                    type="url"
                    placeholder="Pega aquí el link de Maps (Ej: https://maps.app.goo.gl/...)"
                    value={mapsLinkInput}
                    onChange={e => setMapsLinkInput(e.target.value)}
                    style={{
                      flex: 1,
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: '#ffffff'
                    }}
                  />
                  <button
                    type="button"
                    disabled={isSavingMapsLink}
                    onClick={handleSaveMapsLink}
                    style={{
                      padding: '0 14px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: isSavingMapsLink ? 'wait' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isSavingMapsLink ? 'Guardando...' : '💾 Guardar Link'}
                  </button>
                </div>
              </div>

              {/* Foto de Fachada / Ubicación */}
              <div>
                {renderImageSlot({
                  label: 'Foto de Fachada / Ubicación (Opcional)',
                  slotType: 'locationPhoto',
                  imageSrc: locationImage,
                  helperText: 'Foto del edificio o referencia'
                })}
              </div>

              {/* Botones de Acción Delivery */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSendDeliveryData}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <Truck size={16} /> Enviar al Motorizado por WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const deliveryUrl = `${window.location.origin}/delivery/${order.id}`;
                    navigator.clipboard.writeText(deliveryUrl);
                    toast.success('¡Enlace de delivery copiado!');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Copy size={14} /> Copiar Solo el Enlace de la Orden
                </button>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer" style={{ background: '#f8fafc', padding: '0.85rem 1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {order.whatsapp ? (
            <a 
              href={`https://wa.me/${normalizeWhatsApp(order.whatsapp)}`} 
              target="_blank" 
              rel="noreferrer"
              className="btn-whatsapp modal-btn-wp"
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <MessageCircle size={15} /> Escribir al Cliente
            </a>
          ) : (
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sin WhatsApp</span>
          )}
          
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button 
              title="Editar Pedido"
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '6px', display: 'flex' }} 
              onClick={() => onEdit(order)}
            >
              <Edit size={18} />
            </button>
            <button 
              title="Eliminar Pedido"
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex' }} 
              onClick={handleDelete}
            >
              <Trash2 size={18} />
            </button>
            <button 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                background: '#10b981', 
                color: '#ffffff', 
                padding: '6px 12px', 
                fontSize: '12px', 
                fontWeight: 800,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }} 
              onClick={handleArchive}
            >
              <Archive size={14} /> Marcar Entregado
            </button>
            <button 
              type="button"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                background: '#f1f5f9', 
                color: '#475569', 
                padding: '6px 12px', 
                fontSize: '12px', 
                fontWeight: 800, 
                borderRadius: '8px', 
                border: '1px solid #cbd5e1', 
                cursor: 'pointer' 
              }} 
              onClick={onClose}
            >
              <X size={14} /> Cerrar
            </button>
          </div>
        </div>

      </div>
      
      {/* Submodals */}
      {showPosModal && (
        <POSModal 
          order={order}
          onClose={() => setShowPosModal(false)}
          onSuccess={() => setShowPosModal(false)}
        />
      )}

      {showPrintNotaModal && (
        <PrintNotaModal 
          order={order}
          onClose={() => setShowPrintNotaModal(false)}
        />
      )}

      {showSaleDetailModal && (
        <SaleDetailModal 
          order={order}
          onClose={() => setShowSaleDetailModal(false)}
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
