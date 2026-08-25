import React, { useState } from 'react';
import { X, UserCheck, Users, Bike, Package } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase/config';

function DeliveryModal({ order, onClose, onComplete }) {
  const [deliveryType, setDeliveryType] = useState(null); // 'client' | 'third_party' | 'delivery_man' | 'shipping'
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    phone: '',
    deliveryName: 'Alexander González',
    deliveryPhone: '04241478523',
    company: 'MRW',
    trackingNumber: ''
  });
  const [guideImageBase64, setGuideImageBase64] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e, instantType = null) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    
    const activeType = instantType || deliveryType;

    try {
      const orderRef = ref(db, `orders/${order.id}`);
      
      const updates = {
        status: 'delivered',
        updatedAt: new Date().toISOString()
      };

      if (activeType === 'third_party') {
        updates.deliveryInfo = {
          pickedUpBy: 'third_party',
          ...formData
        };

        if (order.whatsapp) {
          const message = encodeURIComponent(`Hola! Te notificamos que tu pedido de Sellos Chacaito ha sido retirado exitosamente por:

${formData.name}
C.I. ${formData.idNumber}.
Teléfono de contacto: ${formData.phone}.

¡Gracias por preferirnos!`);
          window.open(`https://wa.me/${order.whatsapp}?text=${message}`, '_blank');
        }
      } else if (activeType === 'delivery_man') {
        updates.deliveryInfo = {
          pickedUpBy: 'delivery_man',
          name: formData.deliveryName,
          phone: formData.deliveryPhone
        };

        if (order.whatsapp) {
          const message = encodeURIComponent(`Hola! Te notificamos que tu pedido ya lo tiene nuestro motorizado ${formData.deliveryName}. Este es su número ${formData.deliveryPhone}

Se puede comunicar con el por WhatsApp para saber el estatus de su entrega.

¡Gracias por preferirnos!`);
          window.open(`https://wa.me/${order.whatsapp}?text=${message}`, '_blank');
        }
      } else if (activeType === 'shipping') {
        updates.deliveryInfo = {
          pickedUpBy: 'shipping',
          company: formData.company,
          trackingNumber: formData.trackingNumber
        };

        if (guideImageBase64) {
          const guideUpdates = {};
          guideUpdates[`orderAssets/shipping_guide/${order.id}/fullDataUrl`] = guideImageBase64;
          guideUpdates[`orderAssets/shipping_guide/${order.id}/contentType`] = 'image/jpeg';
          guideUpdates[`orderAssets/shipping_guide/${order.id}/updatedAt`] = new Date().toISOString();
          await update(ref(db), guideUpdates);
        }

        if (order.whatsapp) {
          const publicLink = `https://seguimiento-sellos-chacaito.web.app/guia/${order.id}`;
          const message = encodeURIComponent(`Hola! Tu pedido ha sido enviado por ${formData.company}.
Tu número de guía / cupón es: ${formData.trackingNumber}.

Puedes ver la foto de tu comprobante de envío haciendo clic en este enlace:
${publicLink}

¡Gracias por preferirnos!`);
          window.open(`https://wa.me/${order.whatsapp}?text=${message}`, '_blank');
        }
      } else {
        updates.deliveryInfo = {
          pickedUpBy: 'client'
        };
      }

      await update(orderRef, updates);
      onComplete();
    } catch (error) {
      console.error("Error al registrar entrega:", error);
      alert("Error al registrar la entrega.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', background: 'white' }}>
        <div className="modal-header">
          <h2 className="modal-title">Registrar Entrega</h2>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        {!deliveryType ? (
          <div className="modal-body">
            <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1e293b' }}>
              ¿Quién está retirando el pedido?
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <button 
                className="btn-secondary"
                style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '2px solid #cbd5e1', padding: '0.5rem' }}
                onClick={() => setDeliveryType('client')}
              >
                <UserCheck size={32} color="#10b981" />
                <span style={{ fontWeight: '600', fontSize: '0.85rem', textAlign: 'center' }}>Retira el Cliente</span>
              </button>
              
              <button 
                className="btn-secondary"
                style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '2px solid #cbd5e1', padding: '0.5rem' }}
                onClick={() => setDeliveryType('third_party')}
              >
                <Users size={32} color="#4f46e5" />
                <span style={{ fontWeight: '600', fontSize: '0.85rem', textAlign: 'center' }}>Retira un Tercero</span>
              </button>

              <button 
                className="btn-secondary"
                style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '2px solid #cbd5e1', padding: '0.5rem' }}
                onClick={() => setDeliveryType('delivery_man')}
              >
                <Bike size={32} color="#f59e0b" />
                <span style={{ fontWeight: '600', fontSize: '0.85rem', textAlign: 'center' }}>Enviar por Delivery</span>
              </button>

              <button 
                className="btn-secondary"
                style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', border: '2px solid #cbd5e1', padding: '0.5rem', gridColumn: 'span 3' }}
                onClick={() => setDeliveryType('shipping')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Package size={24} color="#ef4444" />
                </div>
                <span style={{ fontWeight: '600', fontSize: '0.9rem', textAlign: 'center' }}>Envío Nacional (MRW, Zoom, etc)</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {deliveryType === 'delivery_man' ? (
                <>
                  <button 
                    type="button"
                    onClick={() => setDeliveryType(null)}
                    style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.875rem' }}
                  >
                    Volver atrás
                  </button>
                  <p style={{ marginBottom: '1rem', color: '#475569', fontSize: '0.875rem' }}>
                    Confirma los datos del motorizado. Se enviará un mensaje a <b>{order.whatsapp}</b>.
                  </p>
                  
                  <div className="input-group">
                    <label className="input-label">Nombre del Motorizado *</label>
                    <input 
                      className="input-field" 
                      required 
                      value={formData.deliveryName}
                      onChange={e => setFormData(prev => ({ ...prev, deliveryName: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Teléfono *</label>
                    <input 
                      className="input-field" 
                      type="tel"
                      required 
                      value={formData.deliveryPhone}
                      onChange={e => setFormData(prev => ({ ...prev, deliveryPhone: e.target.value }))}
                    />
                  </div>
                </>
              ) : deliveryType === 'shipping' ? (
                <>
                  <button 
                    type="button"
                    onClick={() => setDeliveryType(null)}
                    style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.875rem' }}
                  >
                    Volver atrás
                  </button>
                  
                  <div className="input-group">
                    <label className="input-label">Agencia de Envío *</label>
                    <select 
                      className="input-field"
                      required
                      value={formData.company}
                      onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    >
                      <option value="MRW">MRW</option>
                      <option value="Zoom">Zoom</option>
                      <option value="Tealca">Tealca</option>
                      <option value="Domesa">Domesa</option>
                      <option value="Liberty Express">Liberty Express</option>
                    </select>
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Número de Guía o Cupón *</label>
                    <input 
                      className="input-field" 
                      required 
                      value={formData.trackingNumber}
                      onChange={e => setFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Foto de la Guía *</label>
                    {!guideImageBase64 ? (
                      <div 
                        style={{ border: '2px dashed #cbd5e1', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}
                        onClick={() => document.getElementById('shipping-guide-upload').click()}
                        onPaste={async (e) => {
                          const items = e.clipboardData?.items;
                          if (!items) return;
                          for (let i = 0; i < items.length; i++) {
                            if (items[i].type.indexOf('image') !== -1) {
                              e.preventDefault();
                              const file = items[i].getAsFile();
                              if (file) {
                                const { compressImageToBase64 } = await import('../utils/imageUtils');
                                const base64 = await compressImageToBase64(file);
                                setGuideImageBase64(base64);
                              }
                              break;
                            }
                          }
                        }}
                        tabIndex="0"
                      >
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>Haz clic o pega (Ctrl+V) la imagen aquí</p>
                        <button type="button" style={{ background: '#e2e8f0', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', cursor: 'pointer' }}>Seleccionar archivo</button>
                        <input 
                          id="shipping-guide-upload"
                          type="file" 
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              const { compressImageToBase64 } = await import('../utils/imageUtils');
                              const base64 = await compressImageToBase64(e.target.files[0]);
                              setGuideImageBase64(base64);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{ position: 'relative', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '0.25rem' }}>
                        <img src={guideImageBase64} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                        <button 
                          type="button"
                          onClick={() => setGuideImageBase64(null)}
                          style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                        >
                          <X size={14} color="#dc2626" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : deliveryType === 'third_party' ? (
                <>
                  <button 
                    type="button"
                    onClick={() => setDeliveryType(null)}
                    style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', marginBottom: '1rem', fontSize: '0.875rem' }}
                  >
                    Volver atrás
                  </button>
                  <p style={{ marginBottom: '1rem', color: '#475569', fontSize: '0.875rem' }}>
                    Ingresa los datos de la persona que retira. Se enviará un mensaje a <b>{order.whatsapp}</b> notificando la entrega.
                  </p>
                  
                  <div className="input-group">
                    <label className="input-label">Nombre Completo *</label>
                    <input 
                      className="input-field" 
                      required 
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Cédula de Identidad *</label>
                    <input 
                      className="input-field" 
                      required 
                      value={formData.idNumber}
                      onChange={e => setFormData(prev => ({ ...prev, idNumber: e.target.value.toUpperCase() }))}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Teléfono *</label>
                    <input 
                      className="input-field" 
                      type="tel"
                      required 
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <UserCheck size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
                  <p style={{ fontSize: '1.125rem', color: '#1e293b' }}>
                    Confirmar entrega directa al cliente.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              {deliveryType === 'client' && (
                <button type="button" className="btn-secondary" style={{ width: 'auto' }} onClick={() => setDeliveryType(null)}>
                  Atrás
                </button>
              )}
              <button type="submit" className="btn-primary" style={{ width: 'auto', marginLeft: 'auto' }} disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Confirmar Entrega'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default DeliveryModal;
