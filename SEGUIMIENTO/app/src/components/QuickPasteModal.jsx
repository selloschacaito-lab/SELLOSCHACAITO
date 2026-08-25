import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { ref, set } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { Sparkles, Clipboard, Check, X, ArrowRight } from 'lucide-react';

export default function QuickPasteModal({ onClose }) {
  const [pastedText, setPastedText] = useState('');
  const [clientName, setClientName] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [details, setDetails] = useState('');
  const [designer, setDesigner] = useState('ALVARO');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-read clipboard on mount
  useEffect(() => {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText()
        .then(text => {
          if (text) {
            parseAndSetText(text);
          }
        })
        .catch(() => {});
    }
  }, []);

  const parseAndSetText = (raw) => {
    setPastedText(raw);
    const cleaned = raw.trim();

    // Try extracting phone number
    const phoneMatch = cleaned.match(/(\+?\d[\d\s\-]{8,15}\d)/);
    if (phoneMatch) {
      const cleanPhone = phoneMatch[0].replace(/[^\d]/g, '');
      setWhatsappPhone(cleanPhone);
    }

    // Try extracting lines
    const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      // First line might be name
      if (!phoneMatch || !lines[0].includes(phoneMatch[0])) {
        setClientName(lines[0].toUpperCase());
      } else {
        setClientName('CLIENTE WHATSAPP');
      }

      // Rest of lines details
      if (lines.length > 1) {
        setDetails(lines.slice(1).join('\n'));
      } else if (!details) {
        setDetails(cleaned);
      }
    } else {
      setDetails(cleaned);
    }
  };

  const handleCreateOrder = async () => {
    const finalName = clientName.trim() || 'CLIENTE WHATSAPP';
    const finalPhone = whatsappPhone.replace(/[^\d]/g, '');
    const finalDetails = details.trim() || 'Pedido registrado desde WhatsApp';

    setIsSaving(true);
    try {
      const orderId = `order_${Date.now()}`;
      const payload = {
        clientName: finalName.toUpperCase(),
        whatsapp: finalPhone,
        details: finalDetails,
        designer: designer,
        status: 'design_sent',
        statusId: 'design_sent',
        requiresDesign: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await set(ref(db, `orders/${orderId}`), payload);
      toast.success(`¡Pedido de ${finalName} creado en Diseño Enviado!`);
      onClose();
    } catch (e) {
      console.error(e);
      toast.error('Error guardando en el sistema');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '520px',
        padding: '1.75rem',
        borderRadius: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        background: 'var(--surface)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#25D366', color: '#fff', padding: '8px', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0 }}>⚡ Pegado Rápido WhatsApp</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Crea una tarjeta en "Diseño Enviado" en 1 segundo</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Textarea for fast paste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Pega aquí el texto/número copiado de WhatsApp (Ctrl + V)
            </label>
            <button 
              type="button"
              onClick={async () => {
                if (navigator.clipboard && navigator.clipboard.readText) {
                  const text = await navigator.clipboard.readText();
                  parseAndSetText(text);
                }
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Clipboard size={14} /> Pegar del Portapapeles
            </button>
          </div>
          <textarea 
            rows={3}
            value={pastedText}
            onChange={(e) => parseAndSetText(e.target.value)}
            placeholder="Pega aquí lo que copiaste de WhatsApp..."
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: '1.5px solid var(--border-strong)',
              background: 'rgba(248, 250, 252, 0.6)',
              fontSize: '0.85rem',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Auto-extracted fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Cliente / Nombre</label>
            <input 
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre del cliente"
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: '0.6rem',
                border: '1px solid var(--border-strong)',
                fontSize: '0.85rem',
                fontWeight: '700'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>WhatsApp / Teléfono</label>
            <input 
              type="text"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="Ej: 584141234567"
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: '0.6rem',
                border: '1px solid var(--border-strong)',
                fontSize: '0.85rem',
                fontWeight: '700'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Detalle del Pedido</label>
          <input 
            type="text"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Descripción del sello..."
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '0.6rem',
              border: '1px solid var(--border-strong)',
              fontSize: '0.85rem'
            }}
          />
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border-strong)', background: 'transparent', fontWeight: '700', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            type="button"
            disabled={isSaving}
            onClick={handleCreateOrder}
            style={{
              flex: 2,
              padding: '0.75rem',
              borderRadius: '0.75rem',
              border: 'none',
              background: '#25D366',
              color: '#fff',
              fontWeight: '800',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)'
            }}
          >
            <Sparkles size={18} />
            {isSaving ? 'Creando...' : '⚡ Crear en Diseño Enviado'}
          </button>
        </div>
      </div>
    </div>
  );
}
