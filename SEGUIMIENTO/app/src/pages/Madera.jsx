import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { firestoreDB } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  Boxes, 
  Maximize2, 
  Calculator, 
  Copy, 
  Check, 
  Sparkles, 
  Package, 
  ShoppingBag, 
  Layers, 
  Wrench, 
  ShieldCheck, 
  PanelLeft, 
  TrendingUp, 
  CheckCircle2, 
  Award,
  Clock,
  ArrowRight,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// 📐 MATRIZ OFICIAL DE LAS 12 MEDIDAS DE MADERA
const WOOD_STAMPS = [
  // LÍNEA CUADRADA (6 MEDIDAS)
  {
    id: 'mad_c_05',
    tipo: 'cuadrado',
    nombre: 'Madera 5x5',
    ancho: 5,
    alto: 5,
    area: 25,
    precio: 10,
    idealPara: 'Vasos de café, stickers, tarjetas y etiquetas pequeñas',
    almohadilla: 'pequena', // 11x7cm
    comboPrice: 16
  },
  {
    id: 'mad_c_06',
    tipo: 'cuadrado',
    nombre: 'Madera 6x6',
    ancho: 6,
    alto: 6,
    area: 36,
    precio: 12,
    idealPara: 'Bolsas pequeñas de bisutería y empaques individuales',
    almohadilla: 'pequena', // 11x7cm
    comboPrice: 16
  },
  {
    id: 'mad_c_07',
    tipo: 'cuadrado',
    nombre: 'Madera 7x7',
    ancho: 7,
    alto: 7,
    area: 49,
    precio: 18,
    idealPara: 'Cajas de accesorios, empaques medianos y bolsas estándar',
    almohadilla: 'grande', // 21x15cm
    comboPrice: 30
  },
  {
    id: 'mad_c_09',
    tipo: 'cuadrado',
    nombre: 'Madera 9x9',
    ancho: 9,
    alto: 9,
    area: 81,
    precio: 28,
    idealPara: 'Cajas de hamburguesa, bolsas delivery estándar',
    almohadilla: 'grande', // 21x15cm
    comboPrice: 30
  },
  {
    id: 'mad_c_11',
    tipo: 'cuadrado',
    nombre: 'Madera 11x11',
    ancho: 11,
    alto: 11,
    area: 121,
    precio: 40,
    idealPara: 'Bolsas kraft medianas y cajas de ropa',
    almohadilla: 'grande', // 21x15cm
    comboPrice: 30
  },
  {
    id: 'mad_c_13',
    tipo: 'cuadrado',
    nombre: 'Madera 13x13',
    ancho: 13,
    alto: 13,
    area: 169,
    precio: 55,
    idealPara: 'Cajas grandes, bolsas de compras y combos familiares',
    almohadilla: 'grande', // 21x15cm
    comboPrice: 30
  },

  // LÍNEA RECTANGULAR (6 MEDIDAS)
  {
    id: 'mad_r_10x06',
    tipo: 'rectangular',
    nombre: 'Madera 10x6',
    ancho: 10,
    alto: 6,
    area: 60,
    precio: 22,
    idealPara: 'Logos rectangulares en bolsas pequeñas y sobres',
    almohadilla: 'pequena', // 11x7cm
    comboPrice: 16
  },
  {
    id: 'mad_r_12x08',
    tipo: 'rectangular',
    nombre: 'Madera 12x8',
    ancho: 12,
    alto: 8,
    area: 96,
    precio: 35,
    idealPara: 'Bolsas de delivery, comida rápida y farmacia',
    almohadilla: 'grande', // 21x15cm
    comboPrice: 30
  },
  {
    id: 'mad_r_14x09',
    tipo: 'rectangular',
    nombre: 'Madera 14x9',
    ancho: 14,
    alto: 9,
    area: 126,
    precio: 48,
    idealPara: 'Bolsas medianas kraft y cajas medianas de envíos',
    almohadilla: 'grande', // 21x15cm
    comboPrice: 30
  },
  {
    id: 'mad_r_16x10',
    tipo: 'rectangular',
    nombre: 'Madera 16x10',
    ancho: 16,
    alto: 10,
    area: 160,
    precio: 62,
    idealPara: 'Cajas de calzado, ropa, combos y tiendas',
    almohadilla: 'grande', // 21x15cm
    comboPrice: 30
  },
  {
    id: 'mad_r_18x12',
    tipo: 'rectangular',
    nombre: 'Madera 18x12',
    ancho: 18,
    alto: 12,
    area: 216,
    precio: 80,
    idealPara: 'Cajas grandes de pizza y empaques voluminosos',
    almohadilla: 'grande', // 21x15cm
    comboPrice: 30
  },
  {
    id: 'mad_r_20x13',
    tipo: 'rectangular',
    nombre: 'Madera 20x13',
    ancho: 20,
    alto: 13,
    area: 260,
    precio: 100,
    idealPara: 'Cajas master, sacos de papel y bolsas XL de tienda',
    almohadilla: 'grande', // 21x15cm
    comboPrice: 30
  }
];

export default function Madera({ isEmbedded = false }) {
  const outletCtx = useOutletContext() || {};
  const toggleSidebar = isEmbedded ? null : outletCtx.toggleSidebar;
  const [tasaBCV, setTasaBCV] = useState(0);
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'VES'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'cuadrado' | 'rectangular'
  const [copiedId, setCopiedId] = useState(null);

  // Estados del Calculador Interactivo (Regla de Contenedor)
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [selectedModel, setSelectedModel] = useState(WOOD_STAMPS[0]);
  const [includeCombo, setIncludeCombo] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isWholesale, setIsWholesale] = useState(false);
  const [clientName, setClientName] = useState('');

  // 1. Cargar Tasa BCV Oficial en Tiempo Real
  useEffect(() => {
    const unsubConfig = onSnapshot(doc(firestoreDB, 'config', 'general'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setTasaBCV(Number(d.tasa_actual) || Number(d.tasa) || 0);
      }
    });
    return () => unsubConfig();
  }, []);

  const fmt = (val) => Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 2. Lógica de la Regla de Contenedor para Medidas Irregulares
  const matchedContainer = useMemo(() => {
    const w = parseFloat(customWidth);
    const h = parseFloat(customHeight);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return null;

    const minDim = Math.min(w, h);
    const maxDim = Math.max(w, h);

    // Buscar el sello estándar más pequeño donde quepa el diseño (permitiendo rotación)
    const validCandidates = WOOD_STAMPS.filter(s => {
      const sMin = Math.min(s.ancho, s.alto);
      const sMax = Math.max(s.ancho, s.alto);
      return minDim <= sMin && maxDim <= sMax;
    });

    if (validCandidates.length === 0) {
      return { exceeds: true, maxDim, minDim };
    }

    // Ordenar por precio ascendente para dar el más económico que sirva de contenedor
    validCandidates.sort((a, b) => a.precio - b.precio);
    return validCandidates[0];
  }, [customWidth, customHeight]);

  // Si el usuario ingresa medidas en el buscador de contenedor, auto-seleccionar el modelo
  useEffect(() => {
    if (matchedContainer && !matchedContainer.exceeds) {
      setSelectedModel(matchedContainer);
    }
  }, [matchedContainer]);

  // 3. Cálculos del Cotizador
  const currentStampPrice = selectedModel?.precio || 10;
  const comboAddPrice = selectedModel?.comboPrice || 16;
  const unitPrice = currentStampPrice + (includeCombo ? comboAddPrice : 0);
  const discountMultiplier = isWholesale ? 0.80 : 1.0;
  const subtotalUSD = unitPrice * quantity * discountMultiplier;
  const subtotalBs = tasaBCV > 0 ? (subtotalUSD * tasaBCV) : 0;

  // 4. Copiar Ficha de Cotización para WhatsApp
  const handleCopyQuote = () => {
    const padText = includeCombo 
      ? `\n📦 *Combo Incluido:* Almohadilla ${selectedModel.almohadilla === 'pequena' ? '11x7 cm' : 'Gigante 21x15 cm'} + Frasco de Tinta 28ml (+$${selectedModel.comboPrice})` 
      : '\n🪵 *Incluye:* Sello de Madera con mango y goma grabada';

    const wholesaleText = isWholesale ? '\n🏷️ *Descuento Mayorista Aplicado:* 20% OFF' : '';

    const text = `¡Hola${clientName ? ` ${clientName}` : ''}! 👋 Te comparto la cotización formal de Sellos Chacaíto:

📌 *Modelo:* ${selectedModel.nombre} cm (${selectedModel.ancho} x ${selectedModel.alto} cm)
🎯 *Uso recomendado:* ${selectedModel.idealPara}${padText}${wholesaleText}
🔢 *Cantidad:* ${quantity} unidad(es)

💰 *TOTAL:* $${fmt(subtotalUSD)} USD${subtotalBs > 0 ? ` (Bs. ${fmt(subtotalBs)} a tasa oficial BCV)` : ''}

⏱️ *Tiempo de Entrega:* Elaboración rápida en taller
📍 *Retiro en tienda (Chacaíto)* o *Delivery en Caracas*`;

    navigator.clipboard.writeText(text);
    toast.success('¡Cotización copiada para pegar en WhatsApp!');
  };

  const filteredStamps = activeTab === 'all' 
    ? WOOD_STAMPS 
    : WOOD_STAMPS.filter(s => s.tipo === activeTab);

  return (
    <div className="animate-fade-in" style={{ padding: isEmbedded ? '12px 0 60px' : '24px 20px 80px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header Whitestamp */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '22px 28px',
        marginBottom: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {toggleSidebar && (
            <button 
              onClick={toggleSidebar} 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#64748b',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              title="Abrir menú"
              type="button"
            >
              <PanelLeft size={18} />
            </button>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                🪵 Sellos de Madera & Packaging
              </h1>
              <span style={{
                background: '#fef3c7',
                color: '#d97706',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                12 Medidas Estándar
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0', fontWeight: 500 }}>
              Catálogo estandarizado para bolsas kraft, cajas y embalaje. Sin cortes personalizados arbitrarios.
            </p>
          </div>
        </div>

        {/* Tasa BCV y Selector de Moneda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {tasaBCV > 0 && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              color: '#065f46'
            }}>
              Tasa BCV: Bs. {fmt(tasaBCV)}
            </div>
          )}

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
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                background: currency === 'USD' ? '#ffffff' : 'transparent',
                color: currency === 'USD' ? '#10b981' : '#64748b',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: currency === 'USD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              $ USD
            </button>
            <button
              type="button"
              onClick={() => setCurrency('VES')}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                background: currency === 'VES' ? '#ffffff' : 'transparent',
                color: currency === 'VES' ? '#2563eb' : '#64748b',
                fontSize: '12px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: currency === 'VES' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Bs.
            </button>
          </div>
        </div>
      </div>

      {/* 📊 SECCIÓN DE COMBOS DE ALMOHADILLAS & TINTAS */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '18px',
        padding: '20px 24px',
        marginBottom: '24px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {/* Combo 1 */}
        <div style={{
          background: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Para sellos hasta 6x6 cm (y 10x6)
            </span>
            <h4 style={{ margin: '4px 0 2px', fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>
              Combo Almohadilla 11x7 cm + Tinta 28ml
            </h4>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Precio individual: $20 ($10 + $10) · <strong style={{ color: '#10b981' }}>Ahorras $4</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '12px' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981' }}>+$16</div>
            {tasaBCV > 0 && <div style={{ fontSize: '11px', color: '#64748b' }}>Bs. {fmt(16 * tasaBCV)}</div>}
          </div>
        </div>

        {/* Combo 2 */}
        <div style={{
          background: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Para sellos mayores a 6x6 cm (hasta 20x13)
            </span>
            <h4 style={{ margin: '4px 0 2px', fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>
              Combo Almohadilla Gigante 21x15 cm + Tinta
            </h4>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Precio individual: $35 ($25 + $10) · <strong style={{ color: '#10b981' }}>Ahorras $5</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '12px' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#2563eb' }}>+$30</div>
            {tasaBCV > 0 && <div style={{ fontSize: '11px', color: '#64748b' }}>Bs. {fmt(30 * tasaBCV)}</div>}
          </div>
        </div>
      </div>

      {/* 🎛️ SECCIÓN INTERACTIVA: CALCULADOR DE CONTENEDOR & COTIZADOR RÁPIDO */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '20px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.18)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {/* Lado Izquierdo: Buscador de Regla de Contenedor */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Calculator size={20} color="#60a5fa" />
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900 }}>
              Regla de Contenedor (Medidas Irregulares)
            </h3>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.4 }}>
            Si el cliente pide un logo de medida no estándar (ej. 13x8 cm), introduce el tamaño aquí para ver en qué sello estándar encaja automáticamente:
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Ancho (cm)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ej. 13"
                value={customWidth}
                onChange={e => setCustomWidth(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Alto (cm)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ej. 8"
                value={customHeight}
                onChange={e => setCustomHeight(e.target.value)}
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: '#1e293b',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Resultado de la Regla de Contenedor */}
          {matchedContainer && (
            <div style={{
              background: matchedContainer.exceeds ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              border: matchedContainer.exceeds ? '1px solid #ef4444' : '1px solid #60a5fa',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '13px'
            }}>
              {matchedContainer.exceeds ? (
                <span style={{ color: '#fca5a5' }}>
                  ⚠️ La medida ingresada ({customWidth}x{customHeight} cm) supera el tamaño máximo estándar (20x13 cm).
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ color: '#93c5fd', fontWeight: 800, display: 'block', fontSize: '11px' }}>
                      ENCUDRA EN EL CONTENEDOR:
                    </span>
                    <strong style={{ fontSize: '15px', color: '#ffffff' }}>
                      {matchedContainer.nombre} cm ({matchedContainer.ancho}x{matchedContainer.alto} cm)
                    </strong>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399' }}>
                    ${matchedContainer.precio}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lado Derecho: Generador de Cotización para WhatsApp */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase' }}>
                Cotizador Rápido de Madera
              </span>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#34d399' }}>
                ${fmt(subtotalUSD)} {subtotalBs > 0 ? `(Bs. ${fmt(subtotalBs)})` : ''}
              </span>
            </div>

            {/* Selector de Medida */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Medida Seleccionada
              </label>
              <select
                value={selectedModel?.id || ''}
                onChange={e => setSelectedModel(WOOD_STAMPS.find(s => s.id === e.target.value))}
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  background: '#0f172a',
                  color: '#ffffff',
                  padding: '0 10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              >
                {WOOD_STAMPS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} cm ({s.ancho}x{s.alto} cm) — ${s.precio}
                  </option>
                ))}
              </select>
            </div>

            {/* Opciones adicionales: Combo y Mayorista */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeCombo}
                  onChange={e => setIncludeCombo(e.target.checked)}
                />
                <span>Incluir Combo Almohadilla + Tinta (+${selectedModel?.comboPrice})</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isWholesale}
                  onChange={e => setIsWholesale(e.target.checked)}
                />
                <span>Aplicar 20% Mayorista (Revendedor / +3 uds)</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyQuote}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              marginTop: '10px'
            }}
          >
            <Copy size={16} />
            <span>Copiar Cotización para WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 📑 PESTAÑAS DE FILTRO DE MEDIDAS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === 'all' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
            background: activeTab === 'all' ? '#ecfdf5' : '#ffffff',
            color: activeTab === 'all' ? '#065f46' : '#64748b',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          ✨ Las 12 Medidas (Todas)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cuadrado')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === 'cuadrado' ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
            background: activeTab === 'cuadrado' ? '#eff6ff' : '#ffffff',
            color: activeTab === 'cuadrado' ? '#1d4ed8' : '#64748b',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          🟦 Línea Cuadrada (5x5 a 13x13 cm)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rectangular')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === 'rectangular' ? '1.5px solid #8b5cf6' : '1px solid #e2e8f0',
            background: activeTab === 'rectangular' ? '#f5f3ff' : '#ffffff',
            color: activeTab === 'rectangular' ? '#6d28d9' : '#64748b',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          🟨 Línea Rectangular (10x6 a 20x13 cm)
        </button>
      </div>

      {/* 🎴 GRID DE TARJETAS DE LAS MEDIDAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '18px',
        marginBottom: '32px'
      }}>
        {filteredStamps.map(s => {
          const priceUSD = s.precio;
          const priceBs = tasaBCV > 0 ? (priceUSD * tasaBCV) : 0;
          const isSquare = s.tipo === 'cuadrado';

          return (
            <div
              key={s.id}
              style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '18px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{
                    background: isSquare ? '#eff6ff' : '#f5f3ff',
                    color: isSquare ? '#1e40af' : '#6d28d9',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '20px'
                  }}>
                    {isSquare ? 'Cuadrado' : 'Rectangular'} · {s.area} cm²
                  </span>

                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800 }}>
                    Madera Maciza
                  </span>
                </div>

                <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
                  {s.nombre}
                </h3>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e293b', marginBottom: '3px' }}>
                    📏 {s.ancho} x {s.alto} cm
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', lineHeight: 1.35 }}>
                    {s.idealPara}
                  </div>
                </div>

                <div style={{ fontSize: '11.5px', color: '#475569', marginBottom: '12px' }}>
                  📦 Almohadilla: <strong>{s.almohadilla === 'pequena' ? '11x7 cm (+$16 combo)' : '21x15 cm (+$30 combo)'}</strong>
                </div>
              </div>

              {/* Precios y Botón de Copiar */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>
                      Precio Solo Sello
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

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModel(s);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    style={{
                      background: '#f8fafc',
                      color: '#0f172a',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Cotizar ➔
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🛠️ SECCIÓN 4: GUÍA MAESTRA TÉCNICA PARA EL TALLER */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '20px',
        padding: '24px 28px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Wrench size={22} color="#d97706" />
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
            🛠️ Guía Maestra Técnica para el Taller
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
              🪵 1. Tacos Pre-cortados en Stock
            </strong>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
              Mantener en el estante de 5 a 10 bases de madera de cada una de las 12 medidas ya cortadas, lijadas y con mango fijado.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
              🧽 2. Amortiguador de Foami / EVA
            </strong>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
              Colocar siempre capa intermedia de 2mm a 3mm de foami entre la madera y el fotopolímero para asegurar estampado parejo en bolsas y cartón corrugado.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
              🧪 3. Fotopolímero Líquido
            </strong>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
              Exposición en negativo láser para máxima profundidad de relieve (ideal para tintas al agua en papel y cartón absorbente).
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
              📄 4. Superficies Válidas
            </strong>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
              Papel kraft, cartón corrugado, cajas de pizza, bolsas delivery y madera no tratada. No apto para plástico brillante.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
