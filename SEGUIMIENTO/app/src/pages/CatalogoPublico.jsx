import React, { useState, useEffect, useMemo } from 'react';
import { firestoreDB } from '../firebase/config';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { 
  Search, 
  MessageCircle, 
  Sparkles, 
  ShoppingBag, 
  Check, 
  Layers, 
  Maximize2, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  ExternalLink,
  Filter,
  Award,
  ChevronRight
} from 'lucide-react';
import logoSvg from '../assets/logo.svg';

const WHATSAPP_PHONE = '584142491500'; // Sellos Chacaíto WhatsApp de Atención

// Categorías amigables para el cliente
const CATEGORIES = [
  { id: 'all', name: 'Todos los Modelos', icon: '✨' },
  { id: 'automatico', name: 'Automáticos (Shiny / Trodat)', icon: '⚡' },
  { id: 'fechador', name: 'Fechadores & Numeradores', icon: '📅' },
  { id: 'bolsillo', name: 'Sellos de Bolsillo / Portátiles', icon: '👔' },
  { id: 'madera', name: 'Madera & Tradicionales', icon: '🪵' },
  { id: 'tinta', name: 'Tintas & Almohadillas', icon: '💧' },
  { id: 'seco', name: 'Sellos Secos & Notaría', icon: '🛡️' }
];

// Helper para inferir medidas y categorías de nombres conocidos
function inferDetails(prod) {
  const name = (prod.nombre || prod.name || '').toUpperCase();
  let medidas = prod.medidas || prod.dimensiones || '';
  let lineas = prod.lineas || '';
  let categoriaInferida = prod.categoria ? prod.categoria.toLowerCase() : 'automatico';

  if (!medidas) {
    if (name.includes('842') || name.includes('4911')) { medidas = '38 x 14 mm'; lineas = '3 a 4 líneas'; }
    else if (name.includes('843') || name.includes('4912')) { medidas = '47 x 18 mm'; lineas = '4 a 5 líneas'; }
    else if (name.includes('844') || name.includes('4913')) { medidas = '58 x 22 mm'; lineas = '5 a 6 líneas'; }
    else if (name.includes('845') || name.includes('4915')) { medidas = '70 x 25 mm'; lineas = '6 a 7 líneas'; }
    else if (name.includes('841') || name.includes('4910')) { medidas = '26 x 9 mm'; lineas = '2 a 3 líneas'; }
    else if (name.includes('846')) { medidas = '65 x 30 mm'; lineas = 'Grandes formatos'; }
    else if (name.includes('R-542') || name.includes('4642')) { medidas = 'Ø 42 mm (Redondo)'; lineas = 'Logos y Sellos Circulares'; }
    else if (name.includes('R-532') || name.includes('4630')) { medidas = 'Ø 30 mm (Redondo)'; lineas = 'Redondo Mediano'; }
    else if (name.includes('R-524')) { medidas = 'Ø 24 mm (Redondo)'; lineas = 'Firma / Visto Bueno'; }
    else if (name.includes('S-827') || name.includes('S-828') || name.includes('S-829') || name.includes('BOLSILLO') || name.includes('POCKET')) {
      medidas = 'Portátil';
      lineas = 'Especial para Médicos y Abogados';
      categoriaInferida = 'bolsillo';
    } else if (name.includes('FECHADOR') || name.includes('NUMERADOR') || name.includes('DATER') || name.includes('S-400') || name.includes('S-300')) {
      medidas = 'Con Fechador Central';
      lineas = 'Fecha ajustable + Texto';
      categoriaInferida = 'fechador';
    } else if (name.includes('MADERA') || name.includes('MANGO')) {
      medidas = 'Medida a convenir';
      lineas = 'Tradicional para almohadilla';
      categoriaInferida = 'madera';
    } else if (name.includes('TINTA') || name.includes('ALMOHADILLA') || name.includes('RECARGA') || name.includes('PAD')) {
      medidas = 'Frascos 28ml / Repuestos';
      lineas = 'Colores: Negro, Azul, Rojo, Verde, Violeta';
      categoriaInferida = 'tinta';
    } else if (name.includes('SECO') || name.includes('NOTARIAL') || name.includes('EMBOSS')) {
      medidas = 'Relieve en papel';
      lineas = 'Seguridad y Notaría';
      categoriaInferida = 'seco';
    } else {
      medidas = 'Estándar';
      lineas = 'Personalizado a tu gusto';
    }
  }

  return { medidas, lineas, categoriaInferida };
}

export default function CatalogoPublico() {
  const [products, setProducts] = useState([]);
  const [tasaBCV, setTasaBCV] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'VES'
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Cargar Tasa Oficial BCV y Productos en Vivo
  useEffect(() => {
    // Configuración general
    const unsubConfig = onSnapshot(doc(firestoreDB, 'config', 'general'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setTasaBCV(Number(d.tasa_actual) || Number(d.tasa) || 0);
      }
    });

    // Catálogo de Productos
    const unsubProds = onSnapshot(collection(firestoreDB, 'products'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filtrar productos activos y con precio > 0
      const valid = list.filter(p => p.activo !== false && (Number(p.precio) > 0 || Number(p.price) > 0));
      valid.sort((a, b) => (Number(a.precio || 0)) - (Number(b.precio || 0)));
      setProducts(valid);
      setLoading(false);
    }, (err) => {
      console.error('Error cargando catálogo:', err);
      setLoading(false);
    });

    return () => {
      unsubConfig();
      unsubProds();
    };
  }, []);

  // 2. Filtrado Inteligente
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const name = (p.nombre || p.name || '').toLowerCase();
      const code = (p.codigo || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();
      const { categoriaInferida } = inferDetails(p);

      const matchesSearch = !query || name.includes(query) || code.includes(query);
      
      let matchesCat = true;
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'automatico') matchesCat = categoriaInferida === 'automatico' || name.includes('SHINY') || name.includes('TRODAT') || name.includes('AUTO');
        else if (selectedCategory === 'fechador') matchesCat = categoriaInferida === 'fechador' || name.includes('FECHADOR') || name.includes('NUMERADOR');
        else if (selectedCategory === 'bolsillo') matchesCat = categoriaInferida === 'bolsillo' || name.includes('BOLSILLO') || name.includes('POCKET');
        else if (selectedCategory === 'madera') matchesCat = categoriaInferida === 'madera' || name.includes('MADERA');
        else if (selectedCategory === 'tinta') matchesCat = categoriaInferida === 'tinta' || name.includes('TINTA') || name.includes('ALMOHADILLA');
        else if (selectedCategory === 'seco') matchesCat = categoriaInferida === 'seco' || name.includes('SECO');
      }

      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // 3. Formateador de Precios
  const fmt = (val) => Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 4. Generador de Enlace a WhatsApp
  const handleOrderWhatsApp = (prod) => {
    const name = prod.nombre || prod.name || 'Sello';
    const priceUSD = Number(prod.precio || 0);
    const priceBs = tasaBCV > 0 ? (priceUSD * tasaBCV) : 0;
    const { medidas } = inferDetails(prod);

    const msg = `¡Hola Sellos Chacaíto! 👋\n\nMe interesa encargar el modelo: *${name}*\n📏 Medida: ${medidas}\n💰 Precio: $${fmt(priceUSD)}${priceBs > 0 ? ` (Bs. ${fmt(priceBs)})` : ''}\n\n¿Me indican qué datos necesitan para el diseño y el tiempo de entrega? ¡Gracias!`;

    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* 🌟 ENCABEZADO PRINCIPAL */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Barra superior de anuncio */}
        <div style={{
          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          padding: '6px 16px',
          fontSize: '11.5px',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} />
            <span>Fábrica de Sellos de Goma en Caracas · Entregas en Tiempo Récord</span>
          </div>

          {tasaBCV > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800
            }}>
              Tasa Oficial BCV: Bs. {fmt(tasaBCV)}
            </div>
          )}
        </div>

        {/* Logo, Título y Selector de Moneda */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}>
              <img src={logoSvg} alt="Sellos Chacaíto" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Sellos Chacaíto
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                Catálogo Oficial de Modelos & Precios
              </p>
            </div>
          </div>

          {/* Selector de Moneda: $ USD vs Bs. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  background: currency === 'USD' ? '#ffffff' : 'transparent',
                  color: currency === 'USD' ? '#10b981' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: currency === 'USD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                💵 Dólares ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('VES')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  border: 'none',
                  background: currency === 'VES' ? '#ffffff' : 'transparent',
                  color: currency === 'VES' ? '#2563eb' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: currency === 'VES' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                🇻🇪 Bolívares (Bs.)
              </button>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent('Hola Sellos Chacaíto 👋 Quisiera consultar sobre un pedido de sellos.')}`}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#25D366',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
              }}
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 🔍 BARRA DE BÚSQUEDA Y CATEGORÍAS */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 14px' }}>
          {/* Input Buscador */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por modelo (ej. S-842, 4911, Fechador, Madera, Bolsillo)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: '46px',
                padding: '0 16px 0 42px',
                borderRadius: '12px',
                border: '1.5px solid #cbd5e1',
                background: '#f8fafc',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Chips de Categorías Horizontales con Scroll Suave */}
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none'
          }}>
            {CATEGORIES.map(cat => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: active ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                    background: active ? '#ecfdf5' : '#ffffff',
                    color: active ? '#065f46' : '#475569',
                    fontSize: '12px',
                    fontWeight: active ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: active ? '0 2px 6px rgba(16, 185, 129, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 📦 CONTENIDO DEL CATÁLOGO */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px 80px' }}>
        
        {/* Banner de Garantía y Envío */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '10px', borderRadius: '10px' }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Entrega Rápida en Horas</div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>Elaboración en tiempo récord</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '10px' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Goma Vulcanizada / Láser</div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>Máxima nitidez y durabilidad</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '10px', borderRadius: '10px' }}>
              <MapPin size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Chacaíto & Delivery</div>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>Retiro en tienda o envío en Caracas</div>
            </div>
          </div>
        </div>

        {/* Contador de Resultados */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155' }}>
            Mostrando {filteredProducts.length} modelo{filteredProducts.length === 1 ? '' : 's'} disponibles:
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Precios incluyen el aparato + goma grabada + almohadilla
          </div>
        </div>

        {/* 🎴 GRID DE PRODUCTOS */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
            <div style={{ fontWeight: 700 }}>Cargando catálogo en tiempo real...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔍</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>No encontramos ese modelo</h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '400px', margin: '0 auto 16px' }}>
              Si necesitas un sello con medidas especiales o un diseño corporativo, escríbenos directamente por WhatsApp.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent('Hola Sellos Chacaíto, busco un modelo especial de sello que no vi en el catálogo.')}`}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#25D366',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <MessageCircle size={16} /> Consultar por WhatsApp
            </a>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '18px'
          }}>
            {filteredProducts.map(prod => {
              const priceUSD = Number(prod.precio || 0);
              const priceBs = tasaBCV > 0 ? (priceUSD * tasaBCV) : 0;
              const { medidas, lineas } = inferDetails(prod);

              return (
                <div
                  key={prod.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    border: '1px solid #e2e8f0',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div>
                    {/* Badge de Disponibilidad y Tipo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{
                        background: '#ecfdf5',
                        color: '#065f46',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Check size={12} color="#10b981" /> Entrega Inmediata
                      </span>

                      <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
                        {prod.codigo ? `#${prod.codigo}` : 'Original'}
                      </span>
                    </div>

                    {/* Nombre del Producto */}
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 900,
                      color: '#0f172a',
                      margin: '0 0 8px',
                      lineHeight: 1.25
                    }}>
                      {prod.nombre || prod.name}
                    </h3>

                    {/* Especificaciones de Medidas */}
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #f1f5f9',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      marginBottom: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>
                        <Maximize2 size={13} color="#2563eb" />
                        <span>Medidas: <strong>{medidas}</strong></span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {lineas}
                      </div>
                    </div>
                  </div>

                  {/* Precios y Botón de Pedido por WhatsApp */}
                  <div>
                    <div style={{
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '12px',
                      marginBottom: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end'
                    }}>
                      <div>
                        <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                          Precio Completo
                        </span>
                        {currency === 'USD' ? (
                          <div>
                            <span style={{ fontSize: '22px', fontWeight: 900, color: '#10b981' }}>
                              ${fmt(priceUSD)}
                            </span>
                            {priceBs > 0 && (
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: 600 }}>
                                Bs. {fmt(priceBs)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontSize: '20px', fontWeight: 900, color: '#2563eb' }}>
                              Bs. {fmt(priceBs)}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', fontWeight: 600 }}>
                              (${fmt(priceUSD)} USD)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOrderWhatsApp(prod)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#25D366',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 3px 10px rgba(37, 211, 102, 0.25)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <MessageCircle size={16} />
                      <span>Pedir por WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 📱 BOTÓN FLOTANTE DE WHATSAPP PARA DUDAS */}
      <a
        href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent('Hola Sellos Chacaíto 👋 Tengo una duda sobre los modelos de sellos.')}`}
        target="_blank"
        rel="noreferrer"
        title="¿Dudas? Chatea con nosotros"
        style={{
          position: 'fixed',
          bottom: isMobile ? '16px' : '24px',
          right: isMobile ? '16px' : '24px',
          background: '#25D366',
          color: '#ffffff',
          borderRadius: '50px',
          padding: isMobile ? '14px' : '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13.5px',
          fontWeight: 800,
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4)',
          zIndex: 999
        }}
      >
        <MessageCircle size={20} />
        {!isMobile && <span>¿Dudas? Chatea con nosotros</span>}
      </a>
    </div>
  );
}
