import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Copy, 
  Check, 
  Printer, 
  FileText, 
  Trash2,
  Edit3,
  Camera,
  Upload,
  Eye,
  Download,
  Loader2
} from 'lucide-react';
import { ref, update, get, child } from 'firebase/database';
import { db } from '../firebase/config';
import { toast } from 'react-hot-toast';
import PrintNotaModal from './PrintNotaModal';
import { formatDisplayPhone } from '../utils/formatters';
import { compressImageToBase64 } from '../utils/imageUtils';

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function fmtClipboard(n) {
  return Number(n || 0).toFixed(2).replace('.', ',');
}

function CopyRow({ label, value, hint }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(String(value));
    setCopied(true);
    toast.success(`Copiado: ${label}`);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      background: 'var(--surface-hover, #f8fafc)',
      border: '1px solid var(--border-strong, #e2e8f0)',
      borderRadius: '8px',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted, #64748b)' }}>
          {label}
        </span>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main, #0f172a)', wordBreak: 'break-word' }}>
          {value || '—'}
        </span>
        {hint && <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{hint}</span>}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        disabled={!value}
        style={{
          background: copied ? '#dcfce7' : '#ffffff',
          border: `1px solid ${copied ? '#86efac' : '#cbd5e1'}`,
          borderRadius: '6px',
          padding: '6px 10px',
          cursor: value ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: copied ? '#16a34a' : '#334155',
          flexShrink: 0,
          transition: 'all 0.15s ease'
        }}
      >
        {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
        <span>{copied ? 'Copiado' : 'Copiar'}</span>
      </button>
    </div>
  );
}

export default function SaleDetailModal({ order, onClose, onEdit, onDelete }) {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(true);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [showFullReceipt, setShowFullReceipt] = useState(false);
  const [copiedProductIdx, setCopiedProductIdx] = useState(null);
  const [copiedBaseIdx, setCopiedBaseIdx] = useState(null);
  const fileInputRef = useRef(null);

  // Cargar imagen de comprobante si existe
  useEffect(() => {
    let mounted = true;
    const loadReceipt = async () => {
      try {
        if (order?.id) {
          const snap = await get(child(ref(db), `orderAssets/fina_receipt/${order.id}/fullDataUrl`));
          if (snap.exists() && mounted) {
            setReceiptImage(snap.val());
          }
        }
      } catch (e) {
        console.warn("Error cargando comprobante:", e);
      } finally {
        if (mounted) setLoadingReceipt(false);
      }
    };
    loadReceipt();
    return () => { mounted = false; };
  }, [order?.id]);

  // Manejar subir archivo de comprobante
  const handleUploadReceiptFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error("Por favor selecciona o pega una imagen válida");
      return;
    }
    setUploadingReceipt(true);
    try {
      const base64 = await compressImageToBase64(file);
      const nowISO = new Date().toISOString();
      const updates = {};
      updates[`orderAssets/fina_receipt/${order.id}/fullDataUrl`] = base64;
      updates[`orderAssets/fina_receipt/${order.id}/contentType`] = 'image/jpeg';
      updates[`orderAssets/fina_receipt/${order.id}/updatedAt`] = nowISO;
      updates[`orders/${order.id}/hasFinaReceipt`] = true;
      updates[`orders/${order.id}/hasPaymentPhoto`] = true;
      updates[`orders/${order.id}/updatedAt`] = nowISO;

      await update(ref(db), updates);
      setReceiptImage(base64);
      toast.success("¡Comprobante de pago guardado!");
    } catch (err) {
      console.error("Error guardando comprobante:", err);
      toast.error("Error al guardar el comprobante");
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Escuchar Pegar (Ctrl + V) para comprobante en cualquier parte de la ventana
  useEffect(() => {
    const handlePaste = (e) => {
      const clipItems = e.clipboardData?.items;
      if (!clipItems) return;
      for (const item of clipItems) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleUploadReceiptFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [order?.id]);

  if (!order) return null;

  const items = order.items || [];
  const clientName = (order.clientName || 'Sin Nombre').toUpperCase();
  const clientRif = (order.clientRif || order.rif || '').replace(/[-.\s]/g, '').toUpperCase();
  const clientPhone = formatDisplayPhone(order.whatsapp || order.phone || '');
  const clientAddress = (order.clientAddress || order.address || '').toUpperCase();
  const orderNum = order.orderNumber ? `#${order.orderNumber}` : `#${order.id?.slice(-5) || '001'}`;
  
  const totalUSD = order.totalAmount || items.reduce((acc, it) => acc + ((Number(it.cantidad) || 1) * (Number(it.precioUSD) || 0)), 0);
  const subtotalBs = order.subtotalBs || items.reduce((acc, it) => acc + ((Number(it.cantidad) || 1) * (Number(it.precioUSD) || 0) * (Number(it.tasaBCV) || 1)), 0);
  const ivaBs = order.ivaBs !== undefined ? order.ivaBs : (order.incluyeIVA ? subtotalBs * 0.16 : 0);
  const totalBs = order.totalAmountBs || (subtotalBs + ivaBs);

  const saleDate = order.paidAt || order.createdAt;
  const dateFormatted = saleDate 
    ? new Date(saleDate).toLocaleString('es-VE') 
    : '—';

  // Resumen de items para copiado a software administrativo
  const itemsSummaryText = items.map(it => `${it.cantidad || 1}x ${it.nombre} ($${fmt(it.precioUSD || 0)})`).join(', ');

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }} onClick={onClose}>

      {showPrintModal ? (
        <PrintNotaModal order={order} onClose={() => setShowPrintModal(false)} />
      ) : (
        <div 
          className="glass-card animate-fade-in"
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '720px',
            maxHeight: '92vh',
            background: 'var(--surface, #ffffff)',
            borderRadius: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            color: 'var(--text-main, #0f172a)'
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-strong, #e2e8f0)',
            background: 'var(--surface-hover, #f8fafc)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: '#3b82f6',
                color: '#fff',
                borderRadius: '0.65rem',
                padding: '6px',
                display: 'flex'
              }}>
                <FileText size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Detalle de Venta para Facturación {orderNum}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Herramienta rápida de edición, comprobantes y facturación fiscal
                </span>
              </div>
            </div>

            <button 
              onClick={onClose} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* 1. DATOS FISCALES DEL CLIENTE */}
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 850, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                👤 Datos del Cliente
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <CopyRow label="Nombre / Razón Social" value={clientName} />
                <CopyRow label="RIF / Cédula" value={clientRif} />
                <CopyRow label="Teléfono" value={clientPhone} />
                <CopyRow label="Fecha del Pedido" value={dateFormatted} />
                <div style={{ gridColumn: '1 / -1' }}>
                  <CopyRow label="Dirección Fiscal" value={clientAddress} />
                </div>
              </div>
            </div>

            {/* 2. MONTOS Y BASES IMPONIBLES */}
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 850, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                💵 Montos para Facturar en Bs
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <CopyRow 
                  label="Base Imponible (Sin IVA)" 
                  value={fmt(subtotalBs)} 
                  hint="Subtotal en Bs" 
                />
                <CopyRow 
                  label="IVA 16%" 
                  value={fmt(ivaBs)} 
                  hint="Impuesto en Bs" 
                />
                <CopyRow 
                  label="Monto Total Factura (Bs)" 
                  value={fmt(totalBs)} 
                  hint="Total con IVA en Bs" 
                />
              </div>
            </div>

            {/* 3. DETALLE DE PRODUCTOS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 850, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  📦 Artículos de la Venta ({items.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(itemsSummaryText);
                    toast.success('Resumen de productos copiado');
                  }}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Copy size={12} /> Copiar Todos los Ítems
                </button>
              </div>

              <div style={{ border: '1px solid var(--border-strong)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-hover)', borderBottom: '1px solid var(--border-strong)' }}>
                      <th style={{ padding: '8px 10px', width: '45px' }}>Cant</th>
                      <th style={{ padding: '8px 10px' }}>Descripción (Clic para copiar)</th>
                      <th style={{ padding: '8px 10px', width: '75px' }}>Precio ($)</th>
                      <th style={{ padding: '8px 10px', width: '75px' }}>Tasa BCV</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: '155px' }}>Base Imp. Unit. (Bs)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right', width: '105px' }}>Total (Bs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const qty = Number(it.cantidad) || 1;
                      const priceUSD = Number(it.precioUSD) || 0;
                      const rate = Number(it.tasaBCV) || Number(order.tasaBCV) || 1;
                      const unitBsWithIVA = priceUSD * rate;
                      const unitBaseBs = unitBsWithIVA / 1.16;
                      const totalBsWithIVA = qty * unitBsWithIVA;

                      const prodNameUpper = (it.nombre || it.descripcion || 'PRODUCTO').toUpperCase();
                      const isNameCopied = copiedProductIdx === idx;
                      const isBaseCopied = copiedBaseIdx === idx;

                      const handleCopyName = () => {
                        navigator.clipboard.writeText(prodNameUpper);
                        setCopiedProductIdx(idx);
                        toast.success(`Producto copiado: ${prodNameUpper}`);
                        setTimeout(() => setCopiedProductIdx(null), 1800);
                      };

                      const handleCopyBase = () => {
                        const cleanValue = fmtClipboard(unitBaseBs);
                        navigator.clipboard.writeText(cleanValue);
                        setCopiedBaseIdx(idx);
                        toast.success(`Base Imponible copiada: ${cleanValue}`);
                        setTimeout(() => setCopiedBaseIdx(null), 1800);
                      };

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-strong)' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 800 }}>{qty}x</td>
                          <td 
                            style={{ 
                              padding: '8px 10px', 
                              fontWeight: 800, 
                              textTransform: 'uppercase',
                              color: 'var(--text-main)',
                              cursor: 'pointer'
                            }}
                            onClick={handleCopyName}
                            title="Haz clic para copiar el nombre del producto"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{prodNameUpper}</span>
                              {isNameCopied ? (
                                <span style={{ fontSize: '0.68rem', color: '#16a34a', fontWeight: 800, background: '#dcfce7', padding: '1px 5px', borderRadius: '4px' }}>
                                  ✓ Copiado
                                </span>
                              ) : (
                                <Copy size={12} style={{ opacity: 0.35 }} />
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px' }}>${fmt(priceUSD)}</td>
                          <td style={{ padding: '8px 10px', color: '#2563eb', fontWeight: 800 }}>{fmt(rate, 2)}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <span style={{ fontWeight: 850, color: '#0f172a' }}>
                                Bs. {fmt(unitBaseBs)}
                              </span>
                              <button
                                type="button"
                                onClick={handleCopyBase}
                                style={{
                                  background: isBaseCopied ? '#dcfce7' : '#f0fdf4',
                                  border: `1px solid ${isBaseCopied ? '#86efac' : '#bbf7d0'}`,
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  color: isBaseCopied ? '#16a34a' : '#15803d',
                                  transition: 'all 0.15s ease'
                                }}
                                title={`Copiar Base Imponible (${fmtClipboard(unitBaseBs)})`}
                              >
                                {isBaseCopied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                                <span>{isBaseCopied ? 'Copiado' : 'Copiar'}</span>
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#64748b' }}>
                            Bs. {fmt(totalBsWithIVA)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. COMPROBANTE / RECIBO DE PAGO */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 850, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  🧾 Comprobante de Pago Adjuntado
                </span>
                {receiptImage && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingReceipt}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      color: '#334155',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Upload size={12} /> Cambiar Imagen
                  </button>
                )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => {
                  if (e.target.files?.[0]) handleUploadReceiptFile(e.target.files[0]);
                }} 
              />

              {/* Resumen Forma de Pago */}
              <div style={{
                background: 'var(--surface-hover, #f8fafc)',
                border: '1px solid var(--border-strong, #cbd5e1)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Forma de Pago
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 850,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: (order.paymentBreakdown?.length > 1 || order.paymentMethod === 'Pago Mixto') ? '#dcfce7' : '#eff6ff',
                    color: (order.paymentBreakdown?.length > 1 || order.paymentMethod === 'Pago Mixto') ? '#166534' : '#1e40af',
                    border: `1px solid ${(order.paymentBreakdown?.length > 1 || order.paymentMethod === 'Pago Mixto') ? '#86efac' : '#bfdbfe'}`
                  }}>
                    {order.paymentMethod || 'Pago Móvil'}
                  </span>
                </div>

                {order.paymentBreakdown && order.paymentBreakdown.length > 1 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    {order.paymentBreakdown.map((p, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        padding: '4px 8px'
                      }}>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>• {p.method}</span>
                        <span style={{ fontWeight: 700 }}>
                          ${fmt(p.amountUSD)} <span style={{ color: '#16a34a', fontSize: '0.72rem' }}>(Bs. {fmt(p.amountBs)})</span>
                          {p.ref ? <span style={{ color: '#64748b', marginLeft: '6px' }}>Ref: {p.ref}</span> : null}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  order.paymentRef ? (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                      Referencia bancaria: <b>{order.paymentRef}</b>
                    </div>
                  ) : null
                )}
              </div>

              {loadingReceipt ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  Cargando información del comprobante...
                </div>
              ) : receiptImage ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '14px', 
                  padding: '12px 16px', 
                  background: '#f0fdf4', 
                  border: '1.5px solid #86efac', 
                  borderRadius: '10px' 
                }}>
                  <div 
                    onClick={() => setShowFullReceipt(true)}
                    style={{ 
                      width: '72px', 
                      height: '72px', 
                      borderRadius: '8px', 
                      overflow: 'hidden', 
                      cursor: 'pointer', 
                      border: '1.5px solid #bbf7d0',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                    }}
                    title="Clic para ampliar"
                  >
                    <img src={receiptImage} alt="Comprobante" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.9rem' }}>
                      Comprobante Registrado
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '3px' }}>
                      Método: <b>{order.paymentMethod || 'Pago Móvil'}</b> {order.paymentRef ? `• Ref: ${order.paymentRef}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setShowFullReceipt(true)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #86efac',
                          color: '#16a34a',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Eye size={13} /> Ver en grande
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: '#f8fafc',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#16a34a'; e.currentTarget.style.background = '#f0fdf4'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                >
                  {uploadingReceipt ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>
                      <Loader2 size={18} className="animate-spin" /> Guardando comprobante de pago...
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 800, fontSize: '0.85rem' }}>
                        <Camera size={18} color="#16a34a" /> Adjuntar Comprobante de Pago
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Haz clic aquí para seleccionar imagen o <b>pega la captura directamente con Ctrl + V</b>
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Footer con Eliminar, Imprimir, Editar Completo y Listo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-strong)',
            background: 'var(--surface-hover)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            {/* Eliminar Venta */}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(order)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '0.65rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                title="Eliminar esta venta para poder hacer otra"
              >
                <Trash2 size={15} /> Eliminar Venta
              </button>
            ) : <div />}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              {/* Ver / Imprimir Nota */}
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '0.65rem',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} /> Recibo / Nota
              </button>

              {/* Editar Venta Completa en POS */}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(order)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.6rem 1rem',
                    borderRadius: '0.65rem',
                    background: '#eff6ff',
                    border: '1.5px solid #93c5fd',
                    color: '#1d4ed8',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                  title="Editar productos, cantidades, precios o datos del cliente"
                >
                  <Edit3 size={15} /> Editar Venta
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '0.65rem',
                  background: 'var(--primary, #16a34a)',
                  color: '#000',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox para ver comprobante en pantalla completa */}
      {showFullReceipt && receiptImage && (
        <div 
          onClick={(e) => { e.stopPropagation(); setShowFullReceipt(false); }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 100000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{ 
              position: 'relative', 
              maxWidth: '90vw', 
              maxHeight: '85vh', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center' 
            }}
          >
            <div style={{ position: 'absolute', top: '-40px', right: 0, display: 'flex', gap: '10px' }}>
              <a
                href={receiptImage}
                download={`Comprobante-${orderNum}.jpg`}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <Download size={14} /> Descargar
              </a>
              <button
                onClick={() => setShowFullReceipt(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  cursor: 'pointer',
                  display: 'flex'
                }}
              >
                <X size={16} />
              </button>
            </div>
            <img 
              src={receiptImage} 
              alt="Comprobante Completo" 
              style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} 
            />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
