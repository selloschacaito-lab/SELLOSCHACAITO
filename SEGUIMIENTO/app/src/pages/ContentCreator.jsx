import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Sparkles, Copy, Check, MessageCircle, 
  PanelLeft, Hash, Zap, Share2, ShieldCheck, HeartHandshake, Flame
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateWithGemini } from '../utils/aiHelper';

const PRODUCT_PRESETS = [
  { id: 'medicos', name: '🩺 Sellos para Médicos y Salud', desc: 'Médicos, Pediatras, Odontólogos, Psicólogos, Enfermeros' },
  { id: 'abogados', name: '⚖️ Sellos Legales y Contables', desc: 'Abogados, Contadores Públicos, Administradores' },
  { id: 'ingenieros', name: '📐 Sellos para Ingenieros y Arquitectos', desc: 'Con número de CIV, planos y firmas técnicas' },
  { id: 'bolsillo', name: '💼 Sellos de Bolsillo / Portátiles', desc: 'Modelos compactos para llevar en la bata o maletín' },
  { id: 'escolares', name: '🎨 Sellos Docentes y Escolares', desc: 'Sellos para maestras, caritas felices, revisado, motivación' },
  { id: 'express', name: '⚡ Servicio Express: ¡Listo en 1 Hora!', desc: 'Elaboración inmediata en nuestro taller de Chacaíto' },
  { id: 'fechadores', name: '📅 Fechadores y Sellos de Oficina', desc: 'PAGADO, ANULADO, RECIBIDO, fechadores automáticos' },
  { id: 'envios', name: '📦 Envíos a Nivel Nacional', desc: 'Despachos por MRW / ZOOM y delivery en Caracas' },
  { id: 'mayoristas', name: '⭐ Promoción para Mayoristas', desc: 'Precios especiales con 20% de descuento para revendedores' }
];

const TONE_OPTIONS = [
  { id: 'profesional', label: '👔 Profesional & Confiable', icon: <ShieldCheck size={14} /> },
  { id: 'vendedor', label: '🚀 Vendedor & Dinámico', icon: <Zap size={14} /> },
  { id: 'urgencia', label: '🔥 Urgencia & Oferta', icon: <Flame size={14} /> },
  { id: 'cercano', label: '🤝 Cercano & Amigable', icon: <HeartHandshake size={14} /> }
];

export default function ContentCreator({ isEmbedded = false }) {
  const outletCtx = useOutletContext() || {};
  const toggleSidebar = isEmbedded ? null : outletCtx.toggleSidebar;
  
  // Selection States
  const [selectedProduct, setSelectedProduct] = useState(PRODUCT_PRESETS[0].name);
  const [selectedTone, setSelectedTone] = useState('vendedor');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');
  const [customDetails, setCustomDetails] = useState('');
  
  // Generation & Result State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariants, setGeneratedVariants] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Generate Captions via Google Gemini IA
  const handleGenerateContent = async (e) => {
    e?.preventDefault();
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      toast.error('Falta la API Key de Gemini en el archivo .env');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('Creando 3 opciones de contenido con IA...');

    try {
      const prompt = `Actúa como el mejor copywriter y estratega de redes sociales para "SELLOS CHACAÍTO", la fábrica líder de sellos automáticos, fechadores y de madera en Caracas, Venezuela (ubicados en Chacaíto).

DATOS PARA LA PUBLICACIÓN:
- Producto/Tema: ${selectedProduct}
- Tono: ${selectedTone}
- Plataforma: ${selectedPlatform === 'instagram' ? 'Instagram (Post / Reel / Carrusel)' : 'WhatsApp (Estados / Mensaje de difusión directo)'}
- Detalles adicionales u oferta: ${customDetails || 'Sin detalles extra (usa los beneficios clave del producto)'}

REGLAS DE FORMATO:
1. Genera exactamente 3 VARIANTES DIFERENTES (Opción 1: Enfoque en Beneficio, Opción 2: Enfoque en Gancho/Curiosidad, Opción 3: Enfoque Directo/Oferta).
2. Cada variante debe tener:
   - title: Nombre corto de la propuesta (ej. Enfoque Práctico, Oferta Express).
   - hook: Una primera línea corta y atractiva con emojis.
   - body: El mensaje persuasivo y claro.
   - cta: Invitación a escribir al WhatsApp o visitar la tienda en Chacaíto.
   - hashtags: 8-12 hashtags relevantes con enfoque en Caracas y Venezuela.
3. Devuelve la respuesta en formato JSON estructurado válido:
{
  "variants": [
    {
      "title": "...",
      "hook": "...",
      "body": "...",
      "cta": "...",
      "hashtags": "#SellosChacaito #SellosCaracas ..."
    }
  ]
}`;

      const result = await generateWithGemini({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = result.text.trim();
      const data = JSON.parse(responseText);

      if (data.variants && Array.isArray(data.variants)) {
        setGeneratedVariants(data.variants);
        toast.dismiss(toastId);
        toast.success('¡3 Captions listos para publicar!');
      } else {
        throw new Error('Formato de respuesta inesperado');
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Error generando contenido: ' + (err.message || 'Intenta de nuevo'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy Complete Caption
  const handleCopyCaption = (variant, index) => {
    const fullText = `${variant.hook}\n\n${variant.body}\n\n${variant.cta}\n\n${variant.hashtags}`.trim();
    navigator.clipboard.writeText(fullText);
    setCopiedIndex(index);
    toast.success('¡Caption copiado al portapapeles!');
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // Copy Only Hashtags
  const handleCopyHashtags = (hashtags) => {
    navigator.clipboard.writeText(hashtags);
    toast.success('Hashtags copiados');
  };

  // Share Direct to WhatsApp Web
  const handleShareToWhatsapp = (variant) => {
    const fullText = `${variant.hook}\n\n${variant.body}\n\n${variant.cta}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px 20px 80px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Header Whitestamp */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '22px 28px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {toggleSidebar && (
            <button 
              onClick={toggleSidebar} 
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex' }}
              title="Abrir menú"
            >
              <PanelLeft size={20} />
            </button>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Creador de Contenido & Captions IA
              </h1>
              <span style={{ fontSize: '12px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                Instagram & WhatsApp
              </span>
            </div>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '13px', fontWeight: 500 }}>
              Genera copys persuasivos, ganchos llamativos y hashtags locales para tus publicaciones en 1 clic
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left & Results Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* ===================== FORMULARIO DE GENERACIÓN ===================== */}
        <form 
          onSubmit={handleGenerateContent}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          {/* Selector de Plataforma */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              1. Selecciona la Red Social
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedPlatform('instagram')}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  border: selectedPlatform === 'instagram' ? '2px solid #e1306c' : '1px solid #e2e8f0',
                  background: selectedPlatform === 'instagram' ? '#fdf2f8' : '#f8fafc',
                  color: selectedPlatform === 'instagram' ? '#be185d' : '#475569',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={selectedPlatform === 'instagram' ? '#e1306c' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg> Instagram (Post/Reel)
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('whatsapp')}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  border: selectedPlatform === 'whatsapp' ? '2px solid #25D366' : '1px solid #e2e8f0',
                  background: selectedPlatform === 'whatsapp' ? '#f0fdf4' : '#f8fafc',
                  color: selectedPlatform === 'whatsapp' ? '#15803d' : '#475569',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <MessageCircle size={18} color={selectedPlatform === 'whatsapp' ? '#25D366' : '#64748b'} /> Estados de WhatsApp
              </button>
            </div>
          </div>

          {/* Selector de Producto / Tema */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              2. ¿Qué producto o servicio quieres promocionar?
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
              {PRODUCT_PRESETS.map(preset => {
                const isSelected = selectedProduct === preset.name;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedProduct(preset.name)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                      background: isSelected ? '#ecfdf5' : '#ffffff',
                      color: isSelected ? '#065f46' : '#0f172a',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 800 }}>{preset.name}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{preset.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector de Tono */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
              3. Tono del Mensaje
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {TONE_OPTIONS.map(tone => {
                const isSelected = selectedTone === tone.id;
                return (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => setSelectedTone(tone.id)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: isSelected ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                      background: isSelected ? '#ecfdf5' : '#f8fafc',
                      color: isSelected ? '#065f46' : '#475569',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {tone.icon} {tone.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detalles adicionales / Oferta especial */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
              4. Detalles de la Oferta o Precio (Opcional)
            </label>
            <input 
              type="text"
              placeholder="Ej. Precio especial $18, incluye tinta gratis, delivery gratis en Chacao..."
              value={customDetails}
              onChange={e => setCustomDetails(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '13px',
                fontWeight: 600,
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Botón de Generar */}
          <button
            type="submit"
            disabled={isGenerating}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: isGenerating ? '#94a3b8' : '#10b981',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              cursor: isGenerating ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: isGenerating ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.25)',
              marginTop: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Sparkles size={18} />
            {isGenerating ? 'Generando 3 opciones...' : 'Generar Captions con IA'}
          </button>
        </form>

        {/* ===================== RESULTADOS DE GENERACIÓN ===================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {generatedVariants.length === 0 ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '48px 24px',
              textAlign: 'center',
              color: '#64748b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}>
              <div style={{ background: '#ecfdf5', color: '#10b981', padding: '14px', borderRadius: '50%', display: 'grid', placeItems: 'center' }}>
                <Sparkles size={28} />
              </div>
              <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 800, fontSize: '16px' }}>
                Listo para crear contenido ganador
              </h3>
              <p style={{ margin: 0, fontSize: '13px', maxWidth: '360px', lineHeight: 1.5 }}>
                Selecciona un producto a la izquierda y presiona <b>Generar Captions con IA</b> para obtener 3 variantes listas para publicar.
              </p>
            </div>
          ) : (
            generatedVariants.map((variant, index) => {
              const isThisCopied = copiedIndex === index;
              return (
                <div 
                  key={index}
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '20px',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Option Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px' }}>
                      OPCIÓN {index + 1}: {variant.title || 'Propuesta'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 800 }}>
                      ⚡ Lista para usar
                    </span>
                  </div>

                  {/* Hook / Gancho */}
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', lineHeight: 1.4 }}>
                    {variant.hook}
                  </div>

                  {/* Cuerpo */}
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {variant.body}
                  </div>

                  {/* CTA */}
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#065f46', background: '#ecfdf5', padding: '8px 12px', borderRadius: '8px' }}>
                    👉 {variant.cta}
                  </div>

                  {/* Hashtags */}
                  {variant.hashtags && (
                    <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600, wordBreak: 'break-word', background: '#eff6ff', padding: '8px 12px', borderRadius: '8px' }}>
                      {variant.hashtags}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyCaption(variant, index)}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isThisCopied ? '#059669' : '#10b981',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      {isThisCopied ? <Check size={16} /> : <Copy size={16} />}
                      {isThisCopied ? '¡Copiado!' : 'Copiar Caption Completo'}
                    </button>

                    {variant.hashtags && (
                      <button
                        type="button"
                        onClick={() => handleCopyHashtags(variant.hashtags)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          color: '#475569',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Copiar solo hashtags"
                      >
                        <Hash size={14} /> Solo Hashtags
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleShareToWhatsapp(variant)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#25D366',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      title="Enviar a WhatsApp"
                    >
                      <Share2 size={15} /> WhatsApp
                    </button>
                  </div>

                </div>
              );
            })
          )}

        </div>

      </div>

    </div>
  );
}
