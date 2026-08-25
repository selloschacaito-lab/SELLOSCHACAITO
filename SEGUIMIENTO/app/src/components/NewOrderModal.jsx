import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, UserPlus, PackageSearch, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { firestoreDB as firestore } from '../firebase/config';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { saveOrder } from '../services/orderService';
import { normalizeWhatsApp } from '../utils/formatters';
import { compressImageToBase64 } from '../utils/imageUtils';

function NewOrderModal({ onClose, editOrder = null }) {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);

  const [searchClient, setSearchClient] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);

  const [searchProduct, setSearchProduct] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [formData, setFormData] = useState({
    designer: 'ALVARO',
    whatsapp: '',
    orderNumber: '',
    clientName: '',
    clientRif: '',
    clientAddress: '',
    mapsLink: '',
    locationPhotoBase64: '',
    requiresDesign: true,
    items: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Eliminar carga masiva de clientes. Solo productos si hiciera falta.
  useEffect(() => {
    // Si necesitas productos aquí en un futuro, los cargas, pero ahora no se usan.
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Búsqueda asíncrona de clientes
  useEffect(() => {
    let timeoutId;
    async function fetchClients() {
      if (!searchClient.trim()) {
        setClients([]);
        return;
      }
      try {
        const searchUpper = searchClient.trim().toUpperCase();
        const searchExact = searchClient.trim();
        
        const qName = query(
          collection(firestore, 'clients'), 
          where('nombre', '>=', searchUpper),
          where('nombre', '<=', searchUpper + '\uf8ff'),
          limit(10)
        );
        
        const qPhone = query(
          collection(firestore, 'clients'),
          where('whatsapp', '>=', searchExact),
          where('whatsapp', '<=', searchExact + '\uf8ff'),
          limit(10)
        );

        const [snapName, snapPhone] = await Promise.all([getDocs(qName), getDocs(qPhone)]);
        
        const combined = new Map();
        snapName.docs.forEach(d => combined.set(d.id, { id: d.id, ...d.data() }));
        snapPhone.docs.forEach(d => combined.set(d.id, { id: d.id, ...d.data() }));
        
        const result = Array.from(combined.values());
        setClients(result);
      } catch (err) {
        console.error("Error buscando clientes:", err);
      }
    }
    
    // Solo buscar si el dropdown está activo o el usuario está escribiendo manualmente
    if (selectedClient && selectedClient.name === searchClient) {
      return; // No buscar si acabo de seleccionar un cliente
    }

    timeoutId = setTimeout(() => {
      fetchClients();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchClient, selectedClient]);

  useEffect(() => {
    if (editOrder) {
      setFormData({
        designer: editOrder.designer || 'ALVARO',
        whatsapp: editOrder.whatsapp || '',
        orderNumber: editOrder.orderNumber || '',
        clientName: editOrder.clientName || '',
        clientRif: editOrder.clientRif || '',
        clientAddress: editOrder.clientAddress || '',
        mapsLink: editOrder.mapsLink || '',
        requiresDesign: editOrder.requiresDesign !== false,
        items: editOrder.items || [] // Se conservan por si ya había algo
      });
      setSearchClient(editOrder.clientName || '');
    }
  }, [editOrder]);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setSearchClient(client.nombre || client.name);
    setShowClientDropdown(false);
    setFormData(prev => ({
      ...prev,
      clientName: client.nombre || client.name,
      whatsapp: client.whatsapp || '',
      clientRif: client.rif || client.clientRif || '',
      clientAddress: client.direccion || client.clientAddress || '',
      mapsLink: client.mapsLink || ''
    }));
  };

  const handleCustomClientName = (e) => {
    setSearchClient(e.target.value.toUpperCase());
    setSelectedClient(null);
    setFormData(prev => ({
      ...prev,
      clientName: e.target.value.toUpperCase()
    }));
  };


  const handleUploadLocationPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImageToBase64(file);
      setFormData(prev => ({ ...prev, locationPhotoBase64: base64 }));
    } catch (err) {
      console.error("Error al comprimir la imagen de ubicación", err);
      alert("Error al procesar la imagen");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cleanWhatsapp = normalizeWhatsApp(formData.whatsapp);

      const orderData = {
        designer: formData.designer || '',
        whatsapp: cleanWhatsapp || '',
        orderNumber: formData.orderNumber || '',
        clientName: formData.clientName || '',
        clientRif: formData.clientRif || '',
        clientAddress: formData.clientAddress || '',
        mapsLink: formData.mapsLink || '',
        requiresDesign: formData.requiresDesign,
        items: formData.items || [], // Se enviará vacío al inicio
        totalAmount: 0, // Se calcula en RECIBO
        ...(editOrder ? {} : { status: 'design_sent' })
      };

      const clientData = {
        id: selectedClient ? selectedClient.id : null,
        name: formData.clientName || '',
        whatsapp: cleanWhatsapp || '',
        rif: formData.clientRif || '',
        direccion: formData.clientAddress || '',
        mapsLink: formData.mapsLink || ''
      };

      await saveOrder({
        orderId: editOrder?.id,
        orderData,
        clientData,
        isNewOrder: !editOrder,
        locationPhotoBase64: formData.locationPhotoBase64 || null
      });

      onClose();
    } catch (error) {
      console.error("Error al guardar el pedido:", error);
      alert("Error al guardar el pedido. Revisa tu conexión o los datos ingresados.");
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients;

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', background: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <div className="modal-header" style={{ background: '#f8fafc' }}>
          <h2 className="modal-title">{editOrder ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '0', maxHeight: '80vh', overflowY: 'auto' }}>
          <form id="orderForm" onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* 1. Cliente */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={16}/> 1. Información del Cliente
              </h3>
              
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Número de WhatsApp *</label>
                <input 
                  className="input-field" 
                  type="tel" 
                  name="whatsapp" 
                  placeholder="Ej. 04124001716" 
                  value={formData.whatsapp} 
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))} 
                  required 
                />
              </div>

              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label">Número de Orden / Pedido</label>
                <input 
                  className="input-field" 
                  type="text" 
                  placeholder="Ej. 123456" 
                  value={formData.orderNumber} 
                  onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))} 
                />
              </div>
              <div className="input-group" style={{ position: 'relative', marginBottom: 0 }}>
                <label className="input-label">Buscar o ingresar cliente</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '0.875rem', color: '#94a3b8' }} />
                  <input 
                    className="input-field" 
                    style={{ paddingLeft: '2.5rem' }}
                    type="text" 
                    placeholder="Buscar por nombre o WhatsApp..." 
                    value={searchClient}
                    onChange={handleCustomClientName}
                    onFocus={() => setShowClientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                  />
                </div>
                {showClientDropdown && searchClient && filteredClients.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem', maxHeight: '150px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    {filteredClients.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => handleSelectClient(c)}
                        style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                      >
                        <span style={{ fontWeight: 600 }}>{c.nombre || c.name}</span>
                        <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{c.whatsapp}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón para expandir Datos del Cliente */}
              <button 
                type="button"
                onClick={() => setShowClientDetails(!showClientDetails)}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: '0.875rem', textAlign: 'left', cursor: 'pointer', padding: 0, marginTop: '0.5rem' }}
              >
                {showClientDetails ? '- Ocultar datos del cliente' : '+ Ver más datos del cliente (Nombre, RIF, Dirección)'}
              </button>

              {showClientDetails && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Nombre del Cliente</label>
                    <input 
                      className="input-field" 
                      type="text" 
                      value={formData.clientName} 
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, clientName: e.target.value.toUpperCase() }));
                        setSearchClient(e.target.value.toUpperCase());
                      }} 
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">RIF / Cédula</label>
                    <input 
                      className="input-field" 
                      type="text" 
                      value={formData.clientRif} 
                      onChange={(e) => setFormData(prev => ({ ...prev, clientRif: e.target.value.toUpperCase() }))} 
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Dirección</label>
                    <input 
                      className="input-field" 
                      type="text" 
                      value={formData.clientAddress} 
                      onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))} 
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">Link de Ubicación (Maps)</label>
                    <input 
                      className="input-field" 
                      type="url"
                      placeholder="https://maps.app.goo.gl/..."
                      value={formData.mapsLink} 
                      onChange={(e) => setFormData(prev => ({ ...prev, mapsLink: e.target.value }))} 
                    />
                  </div>
                  
                  {/* Foto de ubicación */}
                  <div className="input-group" style={{ marginTop: '1rem', marginBottom: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', padding: '0.5rem', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontWeight: 600, textAlign: 'center', cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadLocationPhoto} />
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <ImageIcon size={16} /> 
                        {formData.locationPhotoBase64 ? 'Cambiar Foto Fachada' : (editOrder?.hasLocationPhoto ? 'Reemplazar Foto (Ya existe)' : 'Subir Foto Fachada (Opcional)')}
                      </span>
                    </label>
                    {(formData.locationPhotoBase64 || editOrder?.hasLocationPhoto) && !formData.locationPhotoBase64 && (
                      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        <CheckCircle size={12} /> Este pedido ya tiene una foto guardada.
                      </div>
                    )}
                    {formData.locationPhotoBase64 && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ border: '1px solid #cbd5e1', borderRadius: '0.5rem', overflow: 'hidden', width: '60px', height: '60px' }}>
                          <img src={formData.locationPhotoBase64} alt="Ubicación" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, locationPhotoBase64: '' }))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          <Trash2 size={12} /> Quitar foto
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Detalles de Operación */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                <div>
                  <h4 style={{ fontWeight: 600, color: '#1e293b', margin: 0 }}>¿Requiere Diseño?</h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Desactiva si es solo venta de producto (tinta, etc)</p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="checkbox" 
                      style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                      checked={formData.requiresDesign}
                      onChange={(e) => setFormData(prev => ({ ...prev, requiresDesign: e.target.checked }))}
                    />
                    <div style={{
                      width: '44px', height: '24px', backgroundColor: formData.requiresDesign ? '#10b981' : '#cbd5e1',
                      borderRadius: '999px', transition: 'background-color 0.2s', display: 'flex', alignItems: 'center', padding: '2px'
                    }}>
                      <div style={{
                        width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%',
                        transform: formData.requiresDesign ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s'
                      }} />
                    </div>
                  </div>
                </label>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Diseñador Asignado *</label>
                <select 
                  className="input-field" 
                  value={formData.designer} 
                  onChange={(e) => setFormData(prev => ({ ...prev, designer: e.target.value }))} 
                  required
                >
                  <option value="ALVARO">Alvaro</option>
                  <option value="KRIZ">Kriz</option>
                </select>
              </div>
            </div>

          </form>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button type="submit" form="orderForm" className="btn-primary" style={{ width: 'auto', marginTop: 0 }} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : (editOrder ? 'Actualizar Pedido' : 'Crear Pedido')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default NewOrderModal;
