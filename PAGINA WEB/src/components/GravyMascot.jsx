import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getBotSettings, getProducts } from '../services/db';
import { queryGeminiAI, DEFAULT_SUGGESTIONS } from '../services/gravyService';
import { trackContact } from '../services/analytics';

const GravyAvatarSVG = ({ isTalking = false, size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 10px rgba(71, 255, 0, 0.35))' }}>
    {/* Sello - Tapa / Mango Superior */}
    <rect x="25" y="8" width="50" height="22" rx="8" fill="#1E293B" stroke="#47FF00" strokeWidth="3" />
    <path d="M35 15H65" stroke="#47FF00" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Cuerpo Principal del Sello */}
    <rect x="18" y="26" width="64" height="48" rx="10" fill="#0F172A" stroke="#47FF00" strokeWidth="3.5" />
    
    {/* Visor Transparente con Logo */}
    <rect x="26" y="32" width="48" height="20" rx="6" fill="#1E293B" />
    <text x="50" y="46" fill="#47FF00" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.5">CHACAÍTO</text>
    
    {/* Ojos Animados */}
    <circle cx="36" cy="60" r="4.5" fill="#47FF00">
      <animate attributeName="ry" values="4.5;4.5;0.5;4.5" dur="3.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="64" cy="60" r="4.5" fill="#47FF00">
      <animate attributeName="ry" values="4.5;4.5;0.5;4.5" dur="3.5s" repeatCount="indefinite" />
    </circle>
    
    {/* Brillo en los ojos */}
    <circle cx="37.5" cy="58.5" r="1.5" fill="#FFFFFF" />
    <circle cx="65.5" cy="58.5" r="1.5" fill="#FFFFFF" />

    {/* Sonrisa / Boquita */}
    {isTalking ? (
      <ellipse cx="50" cy="65" rx="5" ry="4" fill="#47FF00">
        <animate attributeName="ry" values="2;5;2" dur="0.3s" repeatCount="indefinite" />
      </ellipse>
    ) : (
      <path d="M43 63C46 66.5 54 66.5 57 63" stroke="#47FF00" strokeWidth="2.5" strokeLinecap="round" />
    )}

    {/* Base del Sello (Almohadilla) */}
    <rect x="14" y="74" width="72" height="16" rx="5" fill="#1E293B" stroke="#47FF00" strokeWidth="3" />
    <line x1="20" y1="82" x2="80" y2="82" stroke="#47FF00" strokeWidth="2" strokeDasharray="3 3" />
  </svg>
);

const GravyMascot = () => {
  const location = useLocation();
  const [botSettings, setBotSettings] = useState({
    enabled: true,
    botName: 'Gravy',
    botTitle: 'Asesor Virtual de Sellos Chacaíto',
    welcomeMessage: '¡Hola! 👋 Soy Gravy, tu asesor de sellos personalizados. ¿En qué te puedo ayudar hoy?',
    geminiApiKey: ''
  });
  
  const [allProducts, setAllProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // No mostrar en panel administrativo
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    const fetchInit = async () => {
      const [settings, prods] = await Promise.all([
        getBotSettings(),
        getProducts()
      ]);
      if (settings) setBotSettings(settings);
      if (prods) setAllProducts(prods);

      // Mensaje de bienvenida inicial
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: settings?.welcomeMessage || '¡Hola! 👋 Soy Gravy, tu asesor de sellos personalizados. ¿En qué te puedo ayudar hoy?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    };
    fetchInit();

    // Mostrar globito de saludo tras 2.5s
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll al final del chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  if (isAdminRoute || botSettings.enabled === false) {
    return null;
  }

  const handleSendMessage = async (textToSend) => {
    const messageText = (textToSend || inputValue).trim();
    if (!messageText || isTyping) return;

    setShowTooltip(false);
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await queryGeminiAI(messageText, messages, botSettings, allProducts);
      
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.text,
        suggestedProducts: response.suggestedProducts || [],
        actionPrompt: response.actionPrompt,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Disculpa, tuve un pequeño contratiempo. Pero puedes escribirnos directamente a nuestro WhatsApp para asesorarte al instante.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickWhatsApp = (product) => {
    trackContact(product, false);
    let text = `Hola, estaba chateando con ${botSettings.botName} en la web y me interesa el sello:\n\n*${product.name}*\nPrecio: $${product.price}\n\n¿Podrían darme más información?`;
    const url = `https://wa.me/584241345488?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleGeneralWhatsApp = () => {
    trackContact(null, false);
    const text = `Hola, estaba en la web de Sellos Chacaíto y quisiera hacer una consulta personalizada.`;
    const url = `https://wa.me/584241345488?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* =========================================================================
          1. BOTÓN FLOTANTE DE LA MASCOTA (ESQUINA INFERIOR IZQUIERDA)
         ========================================================================= */}
      <div 
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '16px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}
      >
        {/* Globito de Saludo (Tooltip flotante) */}
        {showTooltip && !isOpen && (
          <div 
            style={{
              marginBottom: '10px',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-main)',
              border: '1px solid var(--color-primary)',
              borderRadius: '16px',
              borderBottomLeftRadius: '4px',
              padding: '0.65rem 0.9rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              maxWidth: '220px',
              fontSize: '0.8rem',
              fontWeight: '600',
              animation: 'bounceIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => { setIsOpen(true); setShowTooltip(false); }}
          >
            <span>💬 ¡Hola! Soy <strong>{botSettings.botName}</strong> ¿Te ayudo con tu sello?</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
              style={{
                background: 'none', border: 'none', color: 'var(--color-text-secondary)',
                fontSize: '0.9rem', cursor: 'pointer', padding: '0 0 0 4px', lineHeight: 1
              }}
              title="Cerrar saludo"
            >
              ✕
            </button>
          </div>
        )}

        {/* Mascota Botón Redondo */}
        <button
          onClick={() => { setIsOpen(!isOpen); setShowTooltip(false); }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#0F172A',
            border: '2.5px solid #47FF00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(71, 255, 0, 0.4)',
            cursor: 'pointer',
            padding: 0,
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s',
            transform: isOpen ? 'scale(0.92)' : 'scale(1)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = isOpen ? 'scale(0.92)' : 'scale(1)'}
          title={`Pregúntale a ${botSettings.botName}`}
        >
          <GravyAvatarSVG size={42} isTalking={isTyping} />
        </button>
      </div>

      {/* =========================================================================
          2. VENTANA DE CHAT MODAL INTERACTIVA
         ========================================================================= */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '86px',
            left: '16px',
            width: 'calc(100vw - 32px)',
            maxWidth: '380px',
            height: '520px',
            maxHeight: 'calc(100vh - 120px)',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '20px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header del Chat */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--color-bg-secondary)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ position: 'relative' }}>
                <GravyAvatarSVG size={36} />
                <span 
                  style={{
                    position: 'absolute', bottom: '0', right: '0',
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: '#10B981', border: '2px solid var(--color-bg-secondary)'
                  }}
                />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--color-text-main)' }}>
                  {botSettings.botName}
                </h3>
                <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '700' }}>
                  ● En línea · Asesor Inteligente
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={handleGeneralWhatsApp}
                style={{
                  background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px',
                  padding: '0.3rem 0.5rem', fontSize: '0.75rem', fontWeight: '700',
                  color: 'var(--color-whatsapp)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                }}
                title="Hablar con un humano por WhatsApp"
              >
                💬 WhatsApp
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none', border: 'none', fontSize: '1.2rem',
                  color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0.2rem'
                }}
                title="Minimizar chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              backgroundColor: 'var(--color-bg-main)'
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: '0.35rem'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '16px',
                    borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
                    borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                    backgroundColor: msg.sender === 'user' ? 'var(--color-primary)' : 'var(--color-bg-card)',
                    color: msg.sender === 'user' ? '#000' : 'var(--color-text-main)',
                    border: msg.sender === 'bot' ? '1px solid var(--color-border)' : 'none',
                    fontSize: '0.84rem',
                    lineHeight: '1.45',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {msg.text}
                </div>

                {/* Tarjetas de Productos Sugeridos */}
                {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', maxWidth: '90%', marginTop: '0.25rem' }}>
                    {msg.suggestedProducts.map((prod) => {
                      const thumb = prod.variants?.[0]?.imageUrl || prod.singleImageUrl || prod.singleImageUrls?.[0] || '/logo.png';
                      return (
                        <div
                          key={prod.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.55rem 0.75rem',
                            backgroundColor: 'var(--color-bg-card)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '12px',
                            gap: '0.6rem'
                          }}
                        >
                          <img src={thumb} alt={prod.name} style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '800', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {prod.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>
                              {prod.dimensions ? `${prod.dimensions} · ` : ''}<strong>${prod.price}</strong>
                            </div>
                          </div>
                          <button
                            onClick={() => handleQuickWhatsApp(prod)}
                            className="btn"
                            style={{
                              padding: '0.35rem 0.6rem',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              backgroundColor: 'var(--color-whatsapp)',
                              color: '#fff',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                          >
                            Pedir 📲
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', padding: '0 0.3rem' }}>
                  {msg.time}
                </span>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start' }}>
                <div
                  style={{
                    padding: '0.6rem 0.85rem',
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '14px',
                    borderTopLeftRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', animation: 'bounce 1s infinite 0.1s' }} />
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }} />
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', animation: 'bounce 1s infinite 0.3s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias Rápidas de 1 Toque */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--color-bg-secondary)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {DEFAULT_SUGGESTIONS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSendMessage(item.query)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  borderRadius: '20px',
                  backgroundColor: 'var(--color-bg-card)',
                  color: 'var(--color-text-main)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Barra de Entrada de Texto */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{
              padding: '0.65rem 0.75rem',
              backgroundColor: 'var(--color-bg-card)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu pregunta a Gravy..."
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-main)',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: inputValue.trim() ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                color: inputValue.trim() ? '#000' : 'var(--color-text-secondary)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                fontWeight: '900',
                fontSize: '1rem'
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default GravyMascot;
