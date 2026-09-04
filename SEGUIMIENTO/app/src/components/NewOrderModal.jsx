import React, { useState, useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { X, Search, Plus, Trash2, UserPlus, PackageSearch, Image as ImageIcon, CheckCircle, AlertTriangle, Eye, MapPin, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import { firestoreDB as firestore, db } from '../firebase/config';
import { get, ref, onValue } from 'firebase/database';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { saveOrder } from '../services/orderService';
import { normalizeWhatsApp, formatDisplayPhone } from '../utils/formatters';
import { compressImageToBase64 } from '../utils/imageUtils';

const STATUS_CONFIG = {
  design_sent: { name: 'Diseño Enviado', color: '#3b82f6', bg: '#dbeafe' },
  fina: { name: 'Pagado', color: '#ef4444', bg: '#fee2e2' },
  waiting_payment: { name: 'Pagado', color: '#ef4444', bg: '#fee2e2' },
  printing: { name: 'Impresión', color: '#f97316', bg: '#ffedd5' },
  production: { name: 'En Producción', color: '#6366f1', bg: '#e0e7ff' },
  finished: { name: 'Terminado', color: '#22c55e', bg: '#dcfce7' },
  packed: { name: 'Empacado', color: '#d946ef', bg: '#fae8ff' },
  delivered: { name: 'Entregado (Archivado)', color: '#64748b', bg: '#f1f5f9' }
};

function NewOrderModal({ onClose, editOrder = null, orders = {}, onHighlightOrder = null, onSelectOrder = null }) {
  const { activeProfile } = useProfile();
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [matchedClient, setMatchedClient] = useState(null);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [products, setProducts] = useState([]);

  const [searchClient, setSearchClient] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);

  const [searchProduct, setSearchProduct] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const [duplicateOrder, setDuplicateOrder] = useState(null);
  const [duplicateReason, setDuplicateReason] = useState(''); // 'whatsapp' | 'orderNumber'
  const [showDuplicateConfirmModal, setShowDuplicateConfirmModal] = useState(false);
  const [dismissedDuplicate, setDismissedDuplicate] = useState(false);
  const [dbOrders, setDbOrders] = useState(orders || {});

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

  // Asegurar sincronización en tiempo real de órdenes de Firebase
  useEffect(() => {
    if (orders && Object.keys(orders).length > 0) {
      setDbOrders(orders);
    } else {
      const ordersRef = ref(db, 'orders');
      const unsub = onValue(ordersRef, (snapshot) => {
        const val = snapshot.val();
        if (val) setDbOrders(val);
      });
      return () => unsub();
    }
  }, [orders]);

  // Detección de pedido duplicado en tiempo real ultra-flexible
  useEffect(() => {
    if (editOrder) {
      setDuplicateOrder(null);
      setDuplicateReason('');
      setDismissedDuplicate(false);
      return;
    }

    const cleanDigits = (v) => String(v || '').replace(/\D/g, '');
    const cleanAlphaNum = (v) => String(v || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const inputWp = formData.whatsapp || '';
    const wpDigits = cleanDigits(inputWp);
    const normWp = normalizeWhatsApp(inputWp);
    const orderNumClean = cleanAlphaNum(formData.orderNumber);
    const searchDigits = cleanDigits(searchClient);

    const orderList = Object.entries(dbOrders || {}).map(([id, o]) => ({ id, ...o }));
    const candidates = orderList.filter(o => o.id !== editOrder?.id);

    // 1. Detección por WhatsApp (a partir de 6 dígitos)
    if (wpDigits.length >= 6) {
      const matchWp = candidates.find(o => {
        if (o.status === 'delivered') return false;
        const oDigits = cleanDigits(o.whatsapp);
        const oNorm = normalizeWhatsApp(o.whatsapp);
        if (normWp && oNorm && normWp === oNorm) return true;
        if (oDigits.length >= 6 && (oDigits.endsWith(wpDigits) || wpDigits.endsWith(oDigits))) return true;
        return false;
      });
      if (matchWp) {
        setDuplicateOrder(matchWp);
        setDuplicateReason('whatsapp');
        return;
      }
    }

    // 2. Detección por Número de Orden
    if (orderNumClean.length >= 2) {
      const matchNum = candidates.find(o => {
        if (o.status === 'delivered') return false;
        const oNumClean = cleanAlphaNum(o.orderNumber);
        if (oNumClean && oNumClean === orderNumClean) return true;
        return false;
      });
      if (matchNum) {
        setDuplicateOrder(matchNum);
        setDuplicateReason('orderNumber');
        return;
      }
    }

    // 3. Detección si pegó número en el buscador de clientes
    if (searchDigits.length >= 7) {
      const matchSearch = candidates.find(o => {
        if (o.status === 'delivered') return false;
        const oDigits = cleanDigits(o.whatsapp);
        if (oDigits.length >= 7 && (oDigits.endsWith(searchDigits) || searchDigits.endsWith(oDigits))) return true;
        return false;
      });
      if (matchSearch) {
        setDuplicateOrder(matchSearch);
        setDuplicateReason('whatsapp');
        return;
      }
    }

    setDuplicateOrder(null);
    setDuplicateReason('');
    setDismissedDuplicate(false);
  }, [formData.whatsapp, formData.orderNumber, searchClient, dbOrders, editOrder]);

  // Cargar clientes de Firestore para búsqueda rápida y autocompletado instantáneo
  useEffect(() => {
    getDocs(collection(firestore, 'clients'))
      .then(snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllClients(list);
      })
      .catch(err => console.error("Error cargando clientes en NewOrderModal:", err));
  }, []);

  // Función robusta para buscar un cliente por número de teléfono
  const findClientByPhone = (phoneInput) => {
    if (!phoneInput) return null;
    const cleanDigits = (v) => String(v || '').replace(/\D/g, '');
    const wpDigits = cleanDigits(phoneInput);
    if (wpDigits.length < 7) return null;

    const wpLast10 = wpDigits.slice(-10);
    const wpLast7 = wpDigits.slice(-7);

    // 1. Buscar en colección 'clients' de Firestore
    if (allClients && allClients.length > 0) {
      const fromClients = allClients.find(c => {
        const cDigits = cleanDigits(c.whatsapp || c.phone);
        if (!cDigits || cDigits.length < 7) return false;
        const cLast10 = cDigits.slice(-10);
        const cLast7 = cDigits.slice(-7);
        if (wpLast10.length === 10 && cLast10.length === 10 && wpLast10 === cLast10) return true;
        if (wpLast7.length === 7 && cLast7.length === 7 && wpLast7 === cLast7) return true;
        if (wpDigits.endsWith(cDigits) || cDigits.endsWith(wpDigits)) return true;
        return false;
      });

      if (fromClients) {
        return {
          id: fromClients.id,
          nombre: fromClients.nombre || fromClients.name || '',
          rif: fromClients.rif || fromClients.clientRif || '',
          direccion: fromClients.direccion || fromClients.clientAddress || '',
          whatsapp: fromClients.whatsapp || phoneInput,
          mapsLink: fromClients.mapsLink || '',
          source: 'clients'
        };
      }
    }

    // 2. Buscar en pedidos históricos de RTDB (dbOrders) como respaldo
    if (dbOrders && Object.keys(dbOrders).length > 0) {
      const pastOrders = Object.values(dbOrders);
      const matchingOrder = pastOrders.slice().reverse().find(o => {
        if (!o.clientName) return false;
        const oDigits = cleanDigits(o.whatsapp || o.phone);
        if (!oDigits || oDigits.length < 7) return false;
        const oLast10 = oDigits.slice(-10);
        const oLast7 = oDigits.slice(-7);
        if (wpLast10.length === 10 && oLast10.length === 10 && wpLast10 === oLast10) return true;
        if (wpLast7.length === 7 && oLast7.length === 7 && wpLast7 === oLast7) return true;
        if (wpDigits.endsWith(oDigits) || oDigits.endsWith(wpDigits)) return true;
        return false;
      });

      if (matchingOrder) {
        return {
          id: matchingOrder.clientId || null,
          nombre: matchingOrder.clientName || '',
          rif: matchingOrder.clientRif || '',
          direccion: matchingOrder.clientAddress || '',
          whatsapp: matchingOrder.whatsapp || phoneInput,
          mapsLink: matchingOrder.mapsLink || '',
          source: 'orders'
        };
      }
    }

    return null;
  };

  // Auto-completar datos del cliente cuando se escribe o pega el teléfono de WhatsApp
  useEffect(() => {
    if (editOrder) return; // En modo edición no sobreescribir

    const cleanDigits = (v) => String(v || '').replace(/\D/g, '');
    const wpDigits = cleanDigits(formData.whatsapp);

    if (wpDigits.length < 7) {
      setMatchedClient(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPhone(true);
      try {
        let client = findClientByPhone(formData.whatsapp);

        // Si no se encontró en la memoria local, intentar consulta directa a Firestore
        if (!client) {
          try {
            const rawWp = formData.whatsapp.trim();
            const qPhone = query(
              collection(firestore, 'clients'),
              where('whatsapp', '==', rawWp),
              limit(1)
            );
            const snap = await getDocs(qPhone);
            if (!snap.empty) {
              const d = snap.docs[0];
              const data = d.data();
              client = {
                id: d.id,
                nombre: data.nombre || data.name || '',
                rif: data.rif || data.clientRif || '',
                direccion: data.direccion || data.clientAddress || '',
                whatsapp: data.whatsapp || rawWp,
                mapsLink: data.mapsLink || '',
                source: 'clients'
              };
            }
          } catch (qErr) {
            console.warn("Error en búsqueda directa de cliente:", qErr);
          }
        }

        if (client && client.nombre) {
          setMatchedClient(client);
          setSelectedClient(client);
          setSearchClient(client.nombre.toUpperCase());
          setShowClientDetails(true); // Abrir datos del cliente para que se vea toda la información
          setFormData(prev => ({
            ...prev,
            clientName: client.nombre.toUpperCase(),
            clientRif: (client.rif || '').toUpperCase(),
            clientAddress: (client.direccion || '').toUpperCase(),
            mapsLink: client.mapsLink || prev.mapsLink || ''
          }));
        } else {
          setMatchedClient(null);
        }
      } finally {
        setIsSearchingPhone(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.whatsapp, allClients, dbOrders, editOrder]);

  const handlePhoneBlur = () => {
    if (editOrder) return;
    const cleanDigits = (v) => String(v || '').replace(/\D/g, '');
    if (cleanDigits(formData.whatsapp).length < 7) return;

    const client = findClientByPhone(formData.whatsapp);
    if (client && client.nombre) {
      setMatchedClient(client);
      setSelectedClient(client);
      setSearchClient(client.nombre.toUpperCase());
      setShowClientDetails(true);
      setFormData(prev => ({
        ...prev,
        clientName: client.nombre.toUpperCase(),
        clientRif: (client.rif || '').toUpperCase(),
        clientAddress: (client.direccion || '').toUpperCase(),
        mapsLink: client.mapsLink || prev.mapsLink || ''
      }));
    }
  };

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showDuplicateConfirmModal) {
          setShowDuplicateConfirmModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, showDuplicateConfirmModal]);

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
        whatsapp: formatDisplayPhone(editOrder.whatsapp || ''),
        orderNumber: editOrder.orderNumber || '',
        clientName: (editOrder.clientName || '').toUpperCase(),
        clientRif: (editOrder.clientRif || '').toUpperCase(),
        clientAddress: (editOrder.clientAddress || '').toUpperCase(),
        mapsLink: editOrder.mapsLink || '',
        requiresDesign: editOrder.requiresDesign !== false,
        items: editOrder.items || [] // Se conservan por si ya había algo
      });
      setSearchClient((editOrder.clientName || '').toUpperCase());
    }
  }, [editOrder]);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setSearchClient((client.nombre || client.name || '').toUpperCase());
    setShowClientDropdown(false);
    setFormData(prev => ({
      ...prev,
      clientName: (client.nombre || client.name || '').toUpperCase(),
      whatsapp: formatDisplayPhone(client.whatsapp || ''),
      clientRif: (client.rif || client.clientRif || '').toUpperCase(),
      clientAddress: (client.direccion || client.clientAddress || '').toUpperCase(),
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

  // Helper for RIF prefix & number
  const parseRif = (rifStr = '') => {
    const clean = (rifStr || '').trim().toUpperCase();
    const match = clean.match(/^([VEJGCP])[- ]*(.*)$/);
    if (match) {
      return { prefix: match[1], number: match[2] };
    }
    return { prefix: 'V', number: clean };
  };

  const rifData = parseRif(formData.clientRif);

  const handleRifPrefixChange = (newPrefix) => {
    const currentNum = rifData.number;
    const updated = currentNum ? `${newPrefix}${currentNum}` : newPrefix;
    setFormData(prev => ({ ...prev, clientRif: updated }));
  };

  const handleRifNumberChange = (val) => {
    const upper = val.toUpperCase().trim();
    const match = upper.match(/^([VEJGCP])[- ]*(.*)$/);
    if (match) {
      setFormData(prev => ({ ...prev, clientRif: `${match[1]}${match[2]}` }));
    } else {
      const updated = upper ? `${rifData.prefix}${upper}` : '';
      setFormData(prev => ({ ...prev, clientRif: updated }));
    }
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

  const handleSubmit = async (e, forceCreate = false) => {
    if (e && e.preventDefault) e.preventDefault();

    // Verificación de número duplicado (sólo si no ha sido omitido o forzado)
    if (!editOrder && duplicateOrder && !forceCreate && !dismissedDuplicate) {
      setShowDuplicateConfirmModal(true);
      return;
    }

    setIsSubmitting(true);
    setShowDuplicateConfirmModal(false);

    try {
      const cleanWhatsapp = formatDisplayPhone(formData.whatsapp);

      const targetClientId = selectedClient ? selectedClient.id : (matchedClient?.id || null);

      const orderData = {
        clientId: targetClientId,
        createdBy: editOrder?.createdBy || activeProfile?.name || 'Sistema',
        vendedor: editOrder?.vendedor || activeProfile?.name || 'Sistema',
        designer: formData.designer || '',
        whatsapp: cleanWhatsapp || '',
        orderNumber: editOrder?.orderNumber || '',
        clientName: (formData.clientName || '').toUpperCase(),
        clientRif: (formData.clientRif || '').toUpperCase(),
        clientAddress: (formData.clientAddress || '').toUpperCase(),
        mapsLink: formData.mapsLink || '',
        requiresDesign: formData.requiresDesign,
        items: formData.items || [], // Se enviará vacío al inicio
        totalAmount: 0, // Se calcula en RECIBO
        ...(editOrder ? {} : { status: 'design_sent' })
      };

      const clientData = {
        id: targetClientId,
        name: (formData.clientName || '').toUpperCase(),
        whatsapp: cleanWhatsapp || '',
        rif: (formData.clientRif || '').toUpperCase(),
        direccion: (formData.clientAddress || '').toUpperCase(),
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
    <div className="modal-overlay" style={{ zIndex: 100, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', background: '#ffffff', borderRadius: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        <div className="modal-header" style={{ 
          background: '#f8fafc',
          padding: '1.1rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#10b981',
              color: '#ffffff',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
            }}>
              <FileText size={18} />
            </div>
            <h2 className="modal-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {editOrder ? 'Editar Pedido' : 'Nuevo Pedido'}
            </h2>
          </div>
          <button className="modal-close" onClick={onClose} disabled={isSubmitting} style={{ color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '0', maxHeight: '80vh', overflowY: 'auto' }}>
          <form id="orderForm" onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
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
                  placeholder="Ej. 0412-4001716 o +58 412..." 
                  value={formData.whatsapp} 
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))} 
                  onBlur={handlePhoneBlur}
                  required 
                />

                {/* Feedback de cliente registrado */}
                {matchedClient && (
                  <div style={{
                    marginTop: '6px',
                    padding: '8px 12px',
                    background: '#dcfce7',
                    border: '1px solid #86efac',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.78rem',
                    color: '#166534'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={15} color="#16a34a" />
                      <span>
                        Cliente registrado: <strong>{matchedClient.nombre}</strong> {matchedClient.rif ? `• RIF: ${matchedClient.rif}` : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 800 }}>
                      ✓ Datos auto-completados
                    </span>
                  </div>
                )}
                {isSearchingPhone && !matchedClient && (
                  <div style={{ marginTop: '4px', fontSize: '0.72rem', color: '#64748b' }}>
                    🔍 Verificando registro del cliente...
                  </div>
                )}
              </div>

              {editOrder?.orderNumber ? (
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label className="input-label">Número de Recibo / Pedido Registrado</label>
                  <input 
                    className="input-field" 
                    type="text" 
                    value={`#${editOrder.orderNumber}`} 
                    disabled
                    style={{ background: '#f8fafc', color: '#0284c7', fontWeight: 800, cursor: 'not-allowed' }}
                  />
                </div>
              ) : null}

              {/* BANNER DE ADVERTENCIA DE DUPLICADO EN TIEMPO REAL */}
              {duplicateOrder && !dismissedDuplicate && (
                <div className="duplicate-warning-banner">
                  <div className="duplicate-warning-banner-title">
                    <AlertTriangle size={18} /> ¡Aviso! Ya existe un pedido activo con este {duplicateReason === 'whatsapp' ? 'WhatsApp' : 'Número de Pedido'}
                  </div>
                  <div className="duplicate-order-preview">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
                        {duplicateOrder.orderNumber ? `#${duplicateOrder.orderNumber} - ` : ''}
                        {duplicateOrder.clientName || 'Cliente sin nombre'}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        color: STATUS_CONFIG[duplicateOrder.status]?.color || '#475569',
                        background: STATUS_CONFIG[duplicateOrder.status]?.bg || '#f1f5f9'
                      }}>
                        {STATUS_CONFIG[duplicateOrder.status]?.name || duplicateOrder.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {duplicateOrder.whatsapp && <span>📱 {duplicateOrder.whatsapp}</span>}
                      {duplicateOrder.designer && <span>🎨 Diseñador: <strong>{duplicateOrder.designer}</strong></span>}
                      {duplicateOrder.createdAt && <span>📅 {new Date(duplicateOrder.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="duplicate-actions" style={{ flexWrap: 'wrap' }}>
                    <button 
                      type="button" 
                      className="duplicate-btn-locate"
                      onClick={() => {
                        if (onHighlightOrder) onHighlightOrder(duplicateOrder.id);
                      }}
                      title="Cerrar y resaltar en el tablero"
                    >
                      📍 Ubicar en Tablero
                    </button>
                    <button 
                      type="button" 
                      className="duplicate-btn-view"
                      onClick={() => {
                        if (onSelectOrder) onSelectOrder(duplicateOrder);
                      }}
                      title="Abrir detalles de este pedido"
                    >
                      👁️ Ver Detalle
                    </button>
                    <button
                      type="button"
                      onClick={() => setDismissedDuplicate(true)}
                      style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                        borderRadius: '0.4rem',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        padding: '0.45rem 0.6rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                      title="Omitir aviso y continuar con este pedido adicional"
                    >
                      ➕ Crear Pedido Adicional
                    </button>
                  </div>
                </div>
              )}

              {duplicateOrder && dismissedDuplicate && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#166534'
                }}>
                  <span>✅ Registrando como <strong>pedido adicional</strong> para este cliente.</span>
                  <button
                    type="button"
                    onClick={() => setDismissedDuplicate(false)}
                    style={{ background: 'none', border: 'none', color: '#15803d', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}
                  >
                    Ver pedido anterior
                  </button>
                </div>
              )}
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
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <select
                        value={rifData.prefix}
                        onChange={e => handleRifPrefixChange(e.target.value)}
                        style={{
                          width: '60px',
                          padding: '0.65rem 4px',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          borderRadius: '0.5rem',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#1e293b',
                          textAlign: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="V">V</option>
                        <option value="E">E</option>
                        <option value="J">J</option>
                        <option value="G">G</option>
                        <option value="C">C</option>
                        <option value="P">P</option>
                      </select>
                      <input 
                        className="input-field" 
                        type="text" 
                        placeholder="20026915"
                        value={rifData.number} 
                        onChange={(e) => handleRifNumberChange(e.target.value)} 
                        style={{ flex: 1 }}
                      />
                    </div>
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

        <div className="modal-footer" style={{ 
          padding: '1rem 1.5rem',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#64748b',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="orderForm" 
            disabled={isSubmitting}
            style={{ 
              padding: '0.65rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isSubmitting ? 'Guardando...' : (editOrder ? 'Actualizar Pedido' : '✓ Crear Pedido')}
          </button>
        </div>

        {/* DIÁLOGO MODAL DE CONFIRMACIÓN DE DUPLICADO AL INTENTAR GUARDAR */}
        {showDuplicateConfirmModal && duplicateOrder && (
          <div className="modal-overlay" style={{ zIndex: 110, background: 'rgba(15, 23, 42, 0.75)' }} onClick={() => setShowDuplicateConfirmModal(false)}>
            <div 
              className="modal-content animate-fade-in" 
              onClick={e => e.stopPropagation()} 
              style={{ maxWidth: '460px', borderRadius: '1rem', background: 'white', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#fee2e2', color: '#ef4444', padding: '0.6rem', borderRadius: '50%', display: 'flex', flexShrink: 0 }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                    ¡Pedido Duplicado Encontrado!
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Ya existe un pedido activo con este {duplicateReason === 'whatsapp' ? 'número de WhatsApp' : 'número de orden'}:
                  </p>
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                    {duplicateOrder.orderNumber ? `#${duplicateOrder.orderNumber} ` : ''}{duplicateOrder.clientName || 'Cliente'}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    color: STATUS_CONFIG[duplicateOrder.status]?.color || '#475569',
                    background: STATUS_CONFIG[duplicateOrder.status]?.bg || '#f1f5f9'
                  }}>
                    {STATUS_CONFIG[duplicateOrder.status]?.name || duplicateOrder.status}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div>📱 <strong>WhatsApp:</strong> {duplicateOrder.whatsapp || 'Sin WhatsApp'}</div>
                  <div>🎨 <strong>Diseñador:</strong> {duplicateOrder.designer || 'Sin asignar'}</div>
                  <div>📅 <strong>Fecha:</strong> {duplicateOrder.createdAt ? new Date(duplicateOrder.createdAt).toLocaleString() : 'N/A'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (onHighlightOrder) onHighlightOrder(duplicateOrder.id);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#be123c',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    borderRadius: '0.6rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(190, 18, 60, 0.3)'
                  }}
                >
                  📍 Ir y Resaltar en el Tablero
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectOrder) onSelectOrder(duplicateOrder);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    background: '#f1f5f9',
                    color: '#1e293b',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    borderRadius: '0.6rem',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  👁️ Abrir Ficha del Pedido
                </button>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowDuplicateConfirmModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      background: 'transparent',
                      color: '#64748b',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      borderRadius: '0.6rem',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    style={{
                      flex: 1.5,
                      padding: '0.65rem',
                      background: '#16a34a',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      borderRadius: '0.6rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ➕ Crear de todos modos
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default NewOrderModal;
