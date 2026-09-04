import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ref, update, get, child } from 'firebase/database';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, firestoreDB as firestore } from '../firebase/config';
import { compressImageToBase64 } from '../utils/imageUtils';
import { Copy, Upload, CheckCircle, Smartphone, User, FileText, Send, Check, Building2, UserCircle, Truck, MapPin, AlertCircle, Map as MapIcon, Search, Navigation, Package } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Icono personalizado para Leaflet
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Componente para capturar clics en el mapa y mover el PIN
function LocationMarker({ position, setPosition, onPositionChange }) {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      if (onPositionChange) onPositionChange(newPos);
    }
  });

  return position ? (
    <Marker 
      position={position} 
      icon={customMarkerIcon} 
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          const newPos = [pos.lat, pos.lng];
          setPosition(newPos);
          if (onPositionChange) onPositionChange(newPos);
        }
      }}
    />
  ) : null;
}

export default function PaymentView() {
  const [searchParams] = useSearchParams();
  const rawMonto = searchParams.get('monto');
  const paymentSessionId = searchParams.get('id') || '';
  
  // Format monto to 2 decimals if it exists
  const monto = rawMonto ? parseFloat(rawMonto).toFixed(2).replace('.', ',') : '0,00';
  const usdAmountNum = rawMonto ? parseFloat(rawMonto) : 0;

  const [bcvRate, setBcvRate] = useState(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [isLinkVoided, setIsLinkVoided] = useState(false);
  const [checkingVoid, setCheckingVoid] = useState(true);

  // Tipo de facturación: 'personal' o 'empresa'
  const [clientType, setClientType] = useState('personal');

  // Tipo de entrega / envío: 'none' (retiro en tienda), 'delivery' (motorizado), 'shipping' (nacional)
  const [shippingMethod, setShippingMethod] = useState('none'); // 'none' | 'delivery' | 'shipping'

  // Datos de formulario
  const [formData, setFormData] = useState({
    nombre: '', 
    rif: '',    
    telefono: '',
    direccion: '', 
    // Delivery motorizado
    deliveryMapLink: '',
    deliveryCoords: null, // { lat, lng }
    // Envío Nacional (MRW / ZOOM)
    courierCompany: 'MRW', // 'MRW' | 'ZOOM'
    courierAgencyAddress: ''
  });

  const [mapPosition, setMapPosition] = useState([10.491, -66.858]); // Caracas por defecto
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedItem, setCopiedItem] = useState(null);

  // Hardcoded bank details
  const BANK_DETAILS = {
    banco: 'BANESCO',
    telefono: '04143256743',
    cuenta: '01340277912771092630'
  };

  // Verificar si el enlace ya fue anulado / usado
  useEffect(() => {
    async function checkVoidStatus() {
      if (paymentSessionId) {
        try {
          const snap = await get(child(ref(db), `voidedPaymentLinks/${paymentSessionId}`));
          if (snap.exists() && snap.val()?.voided) {
            setIsLinkVoided(true);
          }
        } catch (e) {
          console.error("Error verificando estado del link:", e);
        }
      }
      setCheckingVoid(false);
    }
    checkVoidStatus();
  }, [paymentSessionId]);

  useEffect(() => {
    fetch('https://ve.dolarapi.com/v1/dolares/oficial')
      .then(res => res.json())
      .then(data => {
        if (data && data.promedio) {
          setBcvRate(data.promedio);
        }
      })
      .catch(err => console.error('Error fetching BCV:', err))
      .finally(() => setLoadingRate(false));
  }, []);

  const totalBs = bcvRate ? (usdAmountNum * bcvRate).toFixed(2).replace('.', ',') : '...';

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => {
      setCopiedItem(null);
    }, 2000);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingReceipt(true);
      const base64 = await compressImageToBase64(file);
      setReceiptImage(base64);
      
      const receiptId = `receipt_${Date.now()}`;
      const dbPath = `tempReceipts/${receiptId}`;
      const generatedUrl = `${window.location.origin}/ver-recibo?id=${receiptId}`;
      setReceiptUrl(generatedUrl);

      update(ref(db), {
        [`${dbPath}/fullDataUrl`]: base64,
        [`${dbPath}/createdAt`]: new Date().toISOString()
      }).catch(err => console.error('Error subiendo recibo en background:', err))
        .finally(() => setUploadingReceipt(false));

    } catch (err) {
      console.error('Error procesando imagen', err);
      alert('Hubo un error al procesar la imagen.');
      setUploadingReceipt(false);
    }
  };

  // Obtener ubicación GPS con un clic
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setMapPosition([lat, lng]);
        setFormData(prev => ({
          ...prev,
          deliveryCoords: { lat, lng },
          deliveryMapLink: prev.deliveryMapLink || googleMapsUrl
        }));
        alert("¡Ubicación GPS actual detectada con éxito!");
      },
      (err) => {
        console.warn("Error obteniendo ubicación:", err);
        alert("No se pudo obtener la ubicación GPS automáticamente. Puedes buscar en el mapa o pegar el link de Google Maps.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Buscar dirección por texto en OpenStreetMap / Nominatim
  const handleSearchAddress = async () => {
    if (!addressSearchQuery.trim()) return;
    setIsSearchingAddress(true);
    try {
      const q = encodeURIComponent(addressSearchQuery + ', Caracas, Venezuela');
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const newPos = [lat, lng];
        setMapPosition(newPos);
        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setFormData(prev => ({
          ...prev,
          deliveryCoords: { lat, lng },
          deliveryMapLink: googleMapsUrl
        }));
        setShowInteractiveMap(true);
      } else {
        alert("No se encontraron resultados exactos. Puedes tocar directamente sobre el mapa para colocar el PIN.");
        setShowInteractiveMap(true);
      }
    } catch (e) {
      console.error("Error buscando dirección:", e);
      alert("Error al buscar. Puedes colocar el PIN manualmente en el mapa.");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handlePositionFromMap = (pos) => {
    const lat = pos[0];
    const lng = pos[1];
    const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    setFormData(prev => ({
      ...prev,
      deliveryCoords: { lat, lng },
      deliveryMapLink: googleMapsUrl
    }));
  };

  const handleSubmit = async () => {
    const nameLabel = clientType === 'empresa' ? 'Razón Social' : 'Nombre y Apellido';
    const rifLabel = clientType === 'empresa' ? 'RIF' : 'Cédula o RIF';

    if (!formData.nombre || !formData.rif || !formData.telefono) {
      alert(`Por favor completa al menos ${nameLabel}, ${rifLabel} y Teléfono.`);
      return;
    }

    if (shippingMethod === 'shipping' && !formData.courierAgencyAddress.trim()) {
      alert(`Por favor indica la dirección o código de la agencia ${formData.courierCompany}.`);
      return;
    }
    
    setIsSubmitting(true);

    // Anular el link en Firebase si tiene ID
    if (paymentSessionId) {
      try {
        await update(ref(db), {
          [`voidedPaymentLinks/${paymentSessionId}`]: {
            voided: true,
            usedAt: new Date().toISOString(),
            clientName: formData.nombre
          }
        });
      } catch (e) {
        console.error("Error anulando link:", e);
      }
    }

    // Build WhatsApp message
    let msg = `DATOS PARA FACTURACION (${clientType === 'empresa' ? 'EMPRESA' : 'PERSONAL'}):\n\n`;
    msg += `* ${nameLabel.toUpperCase()}: ${formData.nombre}\n`;
    msg += `* ${rifLabel.toUpperCase()}: ${formData.rif}\n`;
    msg += `* TELEFONO: ${formData.telefono}\n`;
    msg += `* ${clientType === 'empresa' ? 'DIRECCION FISCAL' : 'DIRECCION'}: ${formData.direccion || 'N/A'}\n\n`;

    if (shippingMethod === 'delivery') {
      msg += `SERVICIO DE DELIVERY (CARACAS):\n`;
      if (formData.deliveryMapLink) {
        msg += `- Link Ubicacion: ${formData.deliveryMapLink}\n`;
      }
      if (formData.deliveryCoords) {
        msg += `- Coordenadas PIN: ${formData.deliveryCoords.lat.toFixed(6)}, ${formData.deliveryCoords.lng.toFixed(6)}\n`;
      }
      msg += `(El costo del delivery se cancela directamente al motorizado al recibir)\n\n`;
    } else if (shippingMethod === 'shipping') {
      msg += `ENVIO NACIONAL:\n`;
      msg += `- EMPRESA DE ENVIO: ${formData.courierCompany}\n`;
      msg += `- AGENCIA / DIRECCION: ${formData.courierAgencyAddress}\n\n`;
    }

    if (receiptUrl) {
      msg += `COMPROBANTE DE PAGO: ${receiptUrl}\n`;
    } else if (receiptImage) {
      msg += `(El cliente selecciono comprobante en la web)\n`;
    } else {
      msg += `(El cliente no adjunto comprobante en la web)\n`;
    }

    // Save client to Firestore in background
    try {
      const clientRef = doc(collection(firestore, 'clients'), `web_${Date.now()}`);
      setDoc(clientRef, {
        name: formData.nombre,
        whatsapp: formData.telefono,
        rif: formData.rif,
        direccion: formData.direccion || '',
        clientType: clientType,
        shippingMethod: shippingMethod,
        courierCompany: shippingMethod === 'shipping' ? formData.courierCompany : '',
        courierAgencyAddress: shippingMethod === 'shipping' ? formData.courierAgencyAddress : '',
        deliveryRequested: shippingMethod === 'delivery',
        deliveryLink: shippingMethod === 'delivery' ? (formData.deliveryMapLink || '') : '',
        createdAt: serverTimestamp(),
        source: 'payment_form'
      }, { merge: true }).catch(e => console.error('Error guardando cliente en background:', e));
    } catch (e) {
      console.error('Error preparando cliente:', e);
    }

    // Open WhatsApp immediately
    const waPhone = '584241345488';
    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;

    setSubmitted(true);
    window.location.href = waUrl;
  };

  if (checkingVoid) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6E6E6' }}>
        <p style={{ color: '#1F2329', fontWeight: 600 }}>Cargando formulario...</p>
      </div>
    );
  }

  if (isLinkVoided) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6E6E6', padding: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(31, 35, 41, 0.15)', padding: '2.5rem', borderRadius: '1.5rem', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxWidth: '420px', width: '100%' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem', overflow: 'hidden' }}>
            <img src="/logo-sc.png?v=1" alt="Logo Sellos Chacaito" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1F2329', marginBottom: '0.75rem' }}>Enlace Ya Utilizado</h2>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            Este enlace de pago y facturación ya fue completado y enviado anteriormente.
          </p>
          <div style={{ background: 'rgba(71, 255, 0, 0.1)', border: '1px solid #47FF00', padding: '0.85rem', borderRadius: '0.75rem', color: '#166534', fontSize: '0.85rem', fontWeight: 600 }}>
            Si necesitas reportar otro pago o realizar cambios, por favor solicita un nuevo enlace por WhatsApp.
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E6E6E6', padding: '1rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(31, 35, 41, 0.15)', padding: '3rem', borderRadius: '1.5rem', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1rem', overflow: 'hidden' }}>
            <img src="/logo-sc.png?v=1" alt="Logo Sellos Chacaito" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1F2329', marginBottom: '0.75rem' }}>¡Datos Enviados!</h2>
          <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5 }}>Se está abriendo WhatsApp para terminar de enviar la información...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#E6E6E6', padding: '1.25rem 1rem', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        
        {/* Header con Logo Oficial de Sellos Chacaíto */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '68px', height: '68px', borderRadius: '50%', background: '#1F2329', padding: '4px', boxShadow: '0 8px 18px rgba(0,180,45,0.25)', marginBottom: '0.75rem' }}>
            <img src="/logo-sc.png?v=1" alt="Logo Sellos Chacaito" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 850, color: '#1F2329', margin: '0 0 0.25rem 0', letterSpacing: '-0.02em' }}>Sellos Chacaíto</h1>
          <p style={{ color: 'rgba(31, 35, 41, 0.7)', margin: 0, fontSize: '0.92rem', fontWeight: 600 }}>Datos para Facturar y Envío</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* 1. Datos del Cliente */}
          <div style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(31, 35, 41, 0.12)', borderRadius: '1.25rem', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(31, 35, 41, 0.08)' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1F2329', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={19} color="#16a34a" /> 1. Datos de Facturación
            </h2>

            {/* Selector Personal / Empresa con acento Verde Sellos Chacaíto */}
            <div style={{ display: 'flex', gap: '0.5rem', background: '#e2e8f0', padding: '0.35rem', borderRadius: '0.75rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setClientType('personal')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '0.5rem',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  background: clientType === 'personal' ? '#47FF00' : 'transparent',
                  color: clientType === 'personal' ? '#1F2329' : '#64748b',
                  boxShadow: clientType === 'personal' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <UserCircle size={18} /> Personal
              </button>

              <button
                type="button"
                onClick={() => setClientType('empresa')}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '0.5rem',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  background: clientType === 'empresa' ? '#47FF00' : 'transparent',
                  color: clientType === 'empresa' ? '#1F2329' : '#64748b',
                  boxShadow: clientType === 'empresa' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Building2 size={18} /> Empresa
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  {clientType === 'empresa' ? 'Nombre o Razón Social de la Empresa *' : 'Nombre y Apellido *'}
                </label>
                <input 
                  type="text" 
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value.toUpperCase()})}
                  placeholder={clientType === 'empresa' ? 'EJ. INVERSIONES ABC C.A.' : 'EJ. JUAN PÉREZ'}
                  style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '0.65rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: 'rgba(255,255,255,0.7)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  {clientType === 'empresa' ? 'RIF de la Empresa *' : 'Cédula o RIF *'}
                </label>
                <input 
                  type="text" 
                  value={formData.rif}
                  onChange={e => setFormData({...formData, rif: e.target.value.toUpperCase()})}
                  placeholder={clientType === 'empresa' ? 'EJ. J-12345678-9' : 'EJ. V-12345678 O V12345678'}
                  style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '0.65rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: 'rgba(255,255,255,0.7)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Teléfono de Contacto *
                </label>
                <input 
                  type="tel" 
                  value={formData.telefono}
                  onChange={e => setFormData({...formData, telefono: e.target.value.toUpperCase()})}
                  placeholder="EJ. 0414 1234567"
                  style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '0.65rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: 'rgba(255,255,255,0.7)', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  {clientType === 'empresa' ? 'Dirección Fiscal (Opcional)' : 'Dirección (Opcional)'}
                </label>
                <input 
                  type="text" 
                  value={formData.direccion}
                  onChange={e => setFormData({...formData, direccion: e.target.value.toUpperCase()})}
                  placeholder="EJ. CHACAO, CARACAS"
                  style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '0.65rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: 'rgba(255,255,255,0.7)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* SECCIÓN DE TIPO DE ENTREGA / ENVÍO */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed #cbd5e1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 800, color: '#1F2329', marginBottom: '0.6rem' }}>
                Método de Entrega / Envío:
              </label>

              {/* Botones Selector de Tipo de Envío */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShippingMethod('none')}
                  style={{
                    padding: '0.6rem 0.3rem',
                    borderRadius: '0.5rem',
                    border: shippingMethod === 'none' ? '2px solid #47FF00' : '1px solid #cbd5e1',
                    background: shippingMethod === 'none' ? 'rgba(71, 255, 0, 0.15)' : 'white',
                    color: shippingMethod === 'none' ? '#1F2329' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Building2 size={16} color={shippingMethod === 'none' ? '#078B35' : '#64748b'} />
                  Retiro en Tienda
                </button>

                <button
                  type="button"
                  onClick={() => setShippingMethod('delivery')}
                  style={{
                    padding: '0.6rem 0.3rem',
                    borderRadius: '0.5rem',
                    border: shippingMethod === 'delivery' ? '2px solid #47FF00' : '1px solid #cbd5e1',
                    background: shippingMethod === 'delivery' ? 'rgba(71, 255, 0, 0.15)' : 'white',
                    color: shippingMethod === 'delivery' ? '#1F2329' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Truck size={16} color={shippingMethod === 'delivery' ? '#078B35' : '#64748b'} />
                  Delivery (Ccs)
                </button>

                <button
                  type="button"
                  onClick={() => setShippingMethod('shipping')}
                  style={{
                    padding: '0.6rem 0.3rem',
                    borderRadius: '0.5rem',
                    border: shippingMethod === 'shipping' ? '2px solid #47FF00' : '1px solid #cbd5e1',
                    background: shippingMethod === 'shipping' ? 'rgba(71, 255, 0, 0.15)' : 'white',
                    color: shippingMethod === 'shipping' ? '#1F2329' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Package size={16} color={shippingMethod === 'shipping' ? '#078B35' : '#64748b'} />
                  Envío Nacional
                </button>
              </div>

              {/* OPCIÓN 1: DELIVERY MOTORIZADO */}
              {shippingMethod === 'delivery' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  
                  {/* Nota informativa de cobro de delivery */}
                  <div style={{ background: 'rgba(255, 51, 71, 0.08)', padding: '0.75rem 0.9rem', borderRadius: '0.65rem', border: '1px solid #ff9aa5', fontSize: '0.82rem', color: '#c51224', lineHeight: 1.4, fontWeight: 600 }}>
                    ⚠️ <strong>Información importante:</strong> El delivery es un servicio adicional y se le cancela directamente al motorizado al momento de la entrega.
                  </div>

                  {/* Pegar link de Google Maps */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                      Opción A: Pegar Link de Google Maps (Opcional)
                    </label>
                    <input 
                      type="text"
                      value={formData.deliveryMapLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, deliveryMapLink: e.target.value }))}
                      placeholder="https://maps.app.goo.gl/..."
                      style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'rgba(255,255,255,0.7)', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Botones de acción GPS y Mapa */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      style={{
                        padding: '0.65rem',
                        background: 'rgba(71, 255, 0, 0.15)',
                        border: '1px solid #47FF00',
                        borderRadius: '0.5rem',
                        color: '#078B35',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Navigation size={15} /> 
                      GPS Actual
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowInteractiveMap(!showInteractiveMap)}
                      style={{
                        padding: '0.65rem',
                        background: showInteractiveMap ? '#1F2329' : 'rgba(255,255,255,0.7)',
                        border: '1px solid #cbd5e1',
                        borderRadius: '0.5rem',
                        color: showInteractiveMap ? '#47FF00' : '#1F2329',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                    >
                      <MapIcon size={15} /> 
                      {showInteractiveMap ? 'Cerrar Mapa' : 'Buscar en Mapa'}
                    </button>
                  </div>

                  {/* MAPA INTERACTIVO CON BUSCADOR DE DIRECCIÓN */}
                  {showInteractiveMap && (
                    <div className="animate-fade-in" style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                        Toca o arrastra el PIN en el mapa para marcar tu casa o destino:
                      </div>

                      {/* Buscador de zona / calle */}
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input 
                          type="text"
                          value={addressSearchQuery}
                          onChange={(e) => setAddressSearchQuery(e.target.value)}
                          placeholder="Buscar sector, edificio o calle..."
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearchAddress(); } }}
                          style={{ flex: 1, padding: '0.5rem 0.65rem', borderRadius: '0.4rem', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                        />
                        <button
                          type="button"
                          onClick={handleSearchAddress}
                          disabled={isSearchingAddress}
                          style={{ background: '#1F2329', color: '#47FF00', border: 'none', padding: '0.5rem 0.75rem', borderRadius: '0.4rem', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Search size={14} /> {isSearchingAddress ? '...' : 'Buscar'}
                        </button>
                      </div>

                      {/* Contenedor del Mapa Leaflet */}
                      <div style={{ height: '220px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #cbd5e1', position: 'relative' }}>
                        <MapContainer 
                          center={mapPosition} 
                          zoom={14} 
                          scrollWheelZoom={true} 
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <LocationMarker 
                            position={mapPosition} 
                            setPosition={setMapPosition} 
                            onPositionChange={handlePositionFromMap} 
                          />
                        </MapContainer>
                      </div>

                      {formData.deliveryCoords && (
                        <div style={{ fontSize: '0.75rem', color: '#078B35', background: 'rgba(71, 255, 0, 0.15)', border: '1px solid #47FF00', padding: '0.4rem 0.6rem', borderRadius: '0.35rem', textAlign: 'center', fontWeight: 700 }}>
                          ✓ PIN marcado en: {formData.deliveryCoords.lat.toFixed(5)}, {formData.deliveryCoords.lng.toFixed(5)}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* OPCIÓN 2: ENVÍO NACIONAL (MRW / ZOOM) */}
              {shippingMethod === 'shipping' && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      Seleccione la Empresa de Envíos:
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {['MRW', 'ZOOM'].map((company) => (
                        <button
                          key={company}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, courierCompany: company }))}
                          style={{
                            flex: 1,
                            padding: '0.65rem',
                            borderRadius: '0.5rem',
                            border: formData.courierCompany === company ? '2px solid #47FF00' : '1px solid #cbd5e1',
                            background: formData.courierCompany === company ? '#1F2329' : 'white',
                            color: formData.courierCompany === company ? '#47FF00' : '#475569',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {company}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      Dirección o Código de la Agencia {formData.courierCompany} *
                    </label>
                    <input 
                      type="text"
                      value={formData.courierAgencyAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, courierAgencyAddress: e.target.value.toUpperCase() }))}
                      placeholder={`EJ. AGENCIA ${formData.courierCompany} CC SAMBIL, VALENCIA O CÓDIGO DE AGENCIA`}
                      style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '0.65rem', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'rgba(255,255,255,0.7)', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ background: 'rgba(71, 255, 0, 0.1)', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #47FF00', fontSize: '0.78rem', color: '#166534', lineHeight: 1.4 }}>
                    ℹ️ Los envíos nacionales se realizan con cobro en destino a nombre del titular indicado arriba.
                  </div>

                </div>
              )}

            </div>

          </div>

          {/* 2. Monto a Pagar */}
          <div style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(31, 35, 41, 0.12)', borderRadius: '1.25rem', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(31, 35, 41, 0.08)' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1F2329', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Smartphone size={19} color="#16a34a" /> 2. Monto a Pagar
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 700 }}>TOTAL EN DÓLARES</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1F2329' }}>${monto}</span>
            </div>
            
            <div style={{ background: 'rgba(71, 255, 0, 0.1)', border: '1px solid #47FF00', borderRadius: '0.85rem', padding: '1rem', transition: 'all 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#078B35', fontSize: '0.875rem', fontWeight: 800 }}>Total en Bolívares (BCV)</span>
                {loadingRate ? (
                  <span style={{ color: '#078B35' }}>Cargando...</span>
                ) : (
                  <span style={{ color: '#078B35', fontSize: '0.78rem', fontWeight: 700 }}>Tasa: {bcvRate?.toFixed(2).replace('.', ',')}</span>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ flex: 1, background: 'white', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '1.35rem', fontWeight: 900, color: '#078B35', border: '1px solid #bbf7d0' }}>
                  Bs. {totalBs}
                </div>
                <button 
                  type="button"
                  onClick={() => handleCopy(totalBs, 'Monto en Bs')}
                  style={{ 
                    background: copiedItem === 'Monto en Bs' ? '#15803d' : '#47FF00', 
                    color: copiedItem === 'Monto en Bs' ? 'white' : '#1F2329', 
                    border: 'none', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '0.5rem', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    transform: copiedItem === 'Monto en Bs' ? 'scale(0.95)' : 'scale(1)'
                  }}
                  title="Copiar monto"
                >
                  {copiedItem === 'Monto en Bs' ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* 3. Datos de Pago */}
          <div style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(31, 35, 41, 0.12)', borderRadius: '1.25rem', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(31, 35, 41, 0.08)' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1F2329', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={19} color="#16a34a" /> 3. Datos de Pago
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'BANCO', value: BANK_DETAILS.banco },
                { label: 'TELÉFONO', value: BANK_DETAILS.telefono },
                { label: 'RIF / CI', value: '315705680', display: 'J 315705680' },
                { label: 'CUENTA BANCARIA', value: BANK_DETAILS.cuenta }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: idx < 3 ? '1px solid #f1f5f9' : 'none' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, marginBottom: '0.25rem' }}>{item.label}</div>
                    <div style={{ fontSize: '1.15rem', color: '#1F2329', fontWeight: 800 }}>{item.display || item.value}</div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleCopy(item.value, item.label)}
                    style={{ 
                      background: copiedItem === item.label ? '#47FF00' : '#f1f5f9', 
                      color: '#1F2329', 
                      border: 'none', 
                      padding: '0.55rem', 
                      borderRadius: '0.5rem', 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      transform: copiedItem === item.label ? 'scale(0.95)' : 'scale(1)'
                    }}
                  >
                    {copiedItem === item.label ? <Check size={18} color="#078B35" /> : <Copy size={18} />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Subir Comprobante */}
          <div style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(31, 35, 41, 0.12)', borderRadius: '1.25rem', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(31, 35, 41, 0.08)', marginBottom: '0.5rem' }}>
            <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 800, color: '#1F2329', marginBottom: '1rem' }}>
              4. Subir Comprobante
            </label>
            
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', border: '2px dashed #cbd5e1', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
              
              {receiptImage ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden', border: '2px solid #47FF00' }}>
                    <img src={receiptImage} alt="Comprobante" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ color: '#078B35', fontSize: '0.875rem', fontWeight: 700 }}>Cambiar comprobante</span>
                </div>
              ) : (
                <>
                  <Upload size={24} color="#64748b" style={{ marginBottom: '0.5rem' }} />
                  <span style={{ color: '#475569', fontSize: '0.875rem', fontWeight: 700 }}>Subir foto o captura del recibo (Opcional)</span>
                </>
              )}
            </label>
          </div>

          {/* Botón Principal con Estilo Verde Sellos Chacaíto */}
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ 
              width: '100%', 
              padding: '1.1rem', 
              background: '#47FF00', 
              color: '#1F2329', 
              border: 'none', 
              borderRadius: '0.75rem', 
              fontSize: '1.05rem', 
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: isSubmitting ? 'wait' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              marginBottom: '2rem',
              minHeight: '3.5rem',
              boxShadow: '0 8px 18px rgba(0,180,45,0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Send size={19} />
            {isSubmitting ? 'Enviando...' : 'Enviar Datos por WhatsApp'}
          </button>

        </div>
      </div>
    </div>
  );
}
