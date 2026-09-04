import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  DollarSign, 
  RefreshCcw, 
  Coins, 
  Download, 
  Copy, 
  Send, 
  PanelLeft, 
  TrendingUp, 
  Receipt, 
  Percent, 
  ExternalLink,
  History,
  Truck
} from 'lucide-react';
import BcvHistoryModal from '../components/BcvHistoryModal';
import { firestoreDB } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import './Calculator.css';

function parseNum(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  let s = String(v ?? '').trim().replace(/\s/g, '');
  if (!s) return 0;
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function Calculator({ isEmbedded = false }) {
  const outletCtx = useOutletContext() || {};
  const toggleSidebar = isEmbedded ? null : outletCtx.toggleSidebar;
  const [usdTotal, setUsdTotal] = useState('16,00');
  const [bcvRate, setBcvRate] = useState('784,6633');
  const [bcvEuroRate, setBcvEuroRate] = useState('850,2540');
  const [euroDeliveryAmount, setEuroDeliveryAmount] = useState('5,00');
  const [bsInput, setBsInput] = useState('');
  const [discountBase, setDiscountBase] = useState('16,00');
  const [prices, setPrices] = useState(['12,00', '3,50', '', '', '', '']);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const dateStr = new Date().toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const savedUsd = parseNum(localStorage.getItem('sc_usd'));
    if (savedUsd > 0) {
      setUsdTotal(fmt(savedUsd));
      setDiscountBase(fmt(savedUsd));
    }
    const savedEuro = parseNum(localStorage.getItem('sc_euro_delivery'));
    if (savedEuro > 0) {
      setEuroDeliveryAmount(fmt(savedEuro));
    }
    const savedPrices = JSON.parse(localStorage.getItem('sc_prices') || 'null');
    if (Array.isArray(savedPrices)) {
      setPrices(prev => prev.map((p, i) => savedPrices[i] !== undefined ? savedPrices[i] : p));
    }
    fetchBCV();
  }, []);

  const fetchBCV = async () => {
    setIsFetchingRate(true);
    try {
      // 1. Dólar Oficial
      try {
        const r = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
        if (r.ok) {
          const d = await r.json();
          const rate = Number(d.promedio);
          if (Number.isFinite(rate) && rate > 0) {
            setBcvRate(fmt(rate, 4));
            localStorage.setItem('sc_bcv', rate.toString());
            try {
              await setDoc(doc(firestoreDB, 'config', 'general'), { tasa_actual: rate, updatedAt: new Date().toISOString() }, { merge: true });
            } catch (syncErr) {
              console.warn('Error syncing rate to Firestore config:', syncErr);
            }
          }
        }
      } catch (errUsd) {
        console.warn('Error fetching USD rate:', errUsd);
      }

      // 2. Euro Oficial
      try {
        const rEur = await fetch('https://ve.dolarapi.com/v1/euros/oficial', { cache: 'no-store' });
        if (rEur.ok) {
          const dEur = await rEur.json();
          const rateEur = Number(dEur.promedio);
          if (Number.isFinite(rateEur) && rateEur > 0) {
            setBcvEuroRate(fmt(rateEur, 4));
            localStorage.setItem('sc_bcv_euro', rateEur.toString());
          }
        }
      } catch (errEur) {
        console.warn('Error fetching EUR rate:', errEur);
      }

      triggerToast('Tasas oficiales BCV actualizadas');
    } catch (e) {
      console.warn('Error general:', e);
    } finally {
      const saved = parseNum(localStorage.getItem('sc_bcv'));
      if (saved > 0) setBcvRate(fmt(saved, 4));
      const savedEur = parseNum(localStorage.getItem('sc_bcv_euro'));
      if (savedEur > 0) setBcvEuroRate(fmt(savedEur, 4));
      setIsFetchingRate(false);
    }
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  const handleUsdChange = (val) => {
    setUsdTotal(val);
    setDiscountBase(val);
    localStorage.setItem('sc_usd', parseNum(val).toString());
  };

  const handleBsChange = (val) => {
    setBsInput(val);
    const bsNum = parseNum(val);
    const rate = parseNum(bcvRate);
    if (rate > 0 && bsNum > 0) {
      const usdEquiv = bsNum / rate;
      setUsdTotal(fmt(usdEquiv));
      setDiscountBase(fmt(usdEquiv));
      localStorage.setItem('sc_usd', usdEquiv.toString());
    }
  };

  const handleEuroChange = (val) => {
    setEuroDeliveryAmount(val);
    localStorage.setItem('sc_euro_delivery', parseNum(val).toString());
  };

  const updatePrice = (index, val) => {
    const newPrices = [...prices];
    newPrices[index] = val;
    setPrices(newPrices);
    localStorage.setItem('sc_prices', JSON.stringify(newPrices));
  };

  const pricesTotalNum = prices.reduce((acc, p) => acc + parseNum(p), 0);
  const usdNum = parseNum(usdTotal);
  const rateNum = parseNum(bcvRate);
  const vesTotalNum = usdNum * rateNum;

  // Cálculos Euro Delivery (Alexander)
  const euroNum = parseNum(euroDeliveryAmount);
  const euroRateNum = parseNum(bcvEuroRate);
  const deliveryBsTotalNum = euroNum * euroRateNum;

  // IVA y Totales
  const ivaUsd = usdNum * 0.16;
  const totalConIvaUsd = usdNum + ivaUsd;
  const totalConIvaBs = totalConIvaUsd * rateNum;

  // Descuento 20%
  const discountAmountNum = parseNum(discountBase) * 0.20;
  const discountFinalNum = parseNum(discountBase) * 0.80;

  const usePricesTotal = () => {
    setUsdTotal(fmt(pricesTotalNum));
    setDiscountBase(fmt(pricesTotalNum));
    localStorage.setItem('sc_usd', pricesTotalNum.toString());
    triggerToast('Total de lista colocado');
  };

  const useDiscountTotal = () => {
    setUsdTotal(fmt(discountFinalNum));
    setDiscountBase(fmt(discountFinalNum));
    localStorage.setItem('sc_usd', discountFinalNum.toString());
    triggerToast('Total con 20% aplicado');
  };

  // Generar Cotización Combo Completo
  const getFullQuoteMessage = () => {
    return `*SELLOS CHACAÍTO - COTIZACIÓN DE PAGO*
📅 Fecha: ${dateStr}
💵 Total $: ${fmt(usdNum)} $ (Tasa BCV: ${bcvRate} Bs/$)
🇻🇪 Total a transferir: *Bs. ${fmt(vesTotalNum)}*

🏦 *BANESCO (Pago Móvil / Transferencia)*
• Teléfono: 04143256743
• RIF: J 315705680
• Cuenta: 01340277912771092630
_Horario de recepción de pagos hasta las 5:00 PM_

📝 *Para su Factura, por favor enviar:*
Nombre:
RIF / CI:
Teléfono:
Dirección:`;
  };

  // Copiar Cotización Completa
  const handleCopySummary = () => {
    const text = getFullQuoteMessage();
    navigator.clipboard.writeText(text);
    triggerToast('Cotización completa copiada');
  };

  // Enviar WhatsApp
  const handleSendWhatsApp = () => {
    const text = getFullQuoteMessage();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Copiar Datos de Delivery (Alexander)
  const handleCopyDeliveryEuro = () => {
    const text = `Monto del Delivery: ${fmt(euroNum)} € (Bs. ${fmt(deliveryBsTotalNum)})\nTasa BCV Euro: ${bcvEuroRate} Bs.\n\nPago Móvil:\nBanco: Banco de Venezuela (0102)\nC.I: 13.739.158\nTelf: 04241478523\nTitular: Alexander`;

    navigator.clipboard.writeText(text);
    triggerToast('Datos de Delivery copiados');
  };

  // Enviar Datos de Delivery por WhatsApp
  const handleSendDeliveryEuroWhatsApp = () => {
    const text = `Monto del Delivery: ${fmt(euroNum)} € (Bs. ${fmt(deliveryBsTotalNum)})\nTasa BCV Euro: ${bcvEuroRate} Bs.\n\nPago Móvil:\nBanco: Banco de Venezuela (0102)\nC.I: 13.739.158\nTelf: 04241478523\nTitular: Alexander`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="calculator-wrapper animate-fade-in">
      <div className="calc-main-container">

        {/* HEADER WHITESTAMP */}
        <header className="calc-header">
          <div className="calc-header-left">
            {toggleSidebar && (
              <button 
                onClick={toggleSidebar} 
                className="calc-sidebar-btn" 
                title="Abrir menú"
                type="button"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <div className="calc-title-box">
              <h1>
                <DollarSign size={24} color="#10b981" /> Calculadora de Cambio
              </h1>
              <p>Conversión instantánea en Bolívares y Dólares según tasa oficial BCV</p>
            </div>
          </div>

          {/* Tasas Oficiales BCV (USD & EUR) */}
          <div className="calc-rate-badge" style={{ gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                BCV Dólar
              </span>
              <span className="calc-rate-num" style={{ fontSize: '15px' }}>{bcvRate} <span style={{ fontSize: '11px', fontWeight: 700 }}>Bs/$</span></span>
            </div>

            <div style={{ width: '1px', background: '#e2e8f0', height: '28px' }} />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#047857' }}>
                BCV Euro
              </span>
              <span className="calc-rate-num" style={{ fontSize: '15px', color: '#047857' }}>{bcvEuroRate} <span style={{ fontSize: '11px', fontWeight: 700 }}>Bs/€</span></span>
            </div>

            <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
              <button 
                type="button"
                className="calc-btn-secondary"
                style={{ padding: '6px 10px', fontSize: '12px' }}
                onClick={fetchBCV}
                disabled={isFetchingRate}
                title="Actualizar tasas oficiales"
              >
                <RefreshCcw size={14} className={isFetchingRate ? 'animate-spin' : ''} />
              </button>
              <button 
                type="button"
                className="calc-btn-secondary"
                style={{ padding: '6px 10px', fontSize: '12px' }}
                onClick={() => setShowHistoryModal(true)}
                title="Ver historial de tasas"
              >
                <History size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* GRILLA DE CONVERSIÓN */}
        <div className="calc-grid">
          
          {/* Lado Izquierdo: Conversor Principal & Delivery Motorizado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <article className="calc-card">
              <div className="calc-card-title">
                <span>Conversión Principal ($ USD)</span>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{dateStr}</span>
              </div>

              {/* Input Dólares */}
              <div className="calc-input-group">
                <label className="calc-input-label">Monto en Dólares ($)</label>
                <div className="calc-input-shell">
                  <input 
                    type="text" 
                    className="calc-big-input"
                    inputMode="decimal"
                    value={usdTotal}
                    onChange={e => handleUsdChange(e.target.value)}
                    onBlur={() => setUsdTotal(fmt(parseNum(usdTotal)))}
                    onFocus={e => e.target.select()}
                  />
                  <span className="calc-suffix">$</span>
                </div>
              </div>

              {/* Input Bolívares Inverso */}
              <div className="calc-input-group">
                <label className="calc-input-label">Monto en Bolívares (Bs - Conversor Inverso)</label>
                <div className="calc-input-shell">
                  <input 
                    type="text" 
                    className="calc-big-input"
                    inputMode="decimal"
                    placeholder={fmt(vesTotalNum)}
                    value={bsInput}
                    onChange={e => handleBsChange(e.target.value)}
                    onFocus={e => e.target.select()}
                  />
                  <span className="calc-suffix">Bs</span>
                </div>
              </div>

              {/* Resultado Total en Bolívares */}
              <div className="calc-result-box">
                <span className="calc-result-label">Total a Transferir</span>
                <div className="calc-result-val">
                  Bs. {fmt(vesTotalNum)}
                </div>
              </div>

              {/* Desglose con IVA 16% */}
              <div className="calc-iva-box">
                <div className="calc-iva-row">
                  <span>Base Imponible:</span>
                  <b>${fmt(usdNum)} (Bs. {fmt(vesTotalNum)})</b>
                </div>
                <div className="calc-iva-row">
                  <span>IVA (16%):</span>
                  <b>+${fmt(ivaUsd)} (Bs. {fmt(ivaUsd * rateNum)})</b>
                </div>
                <div className="calc-iva-row total">
                  <span>Total Factura Fiscal:</span>
                  <span style={{ color: '#10b981' }}>${fmt(totalConIvaUsd)} / Bs. {fmt(totalConIvaBs)}</span>
                </div>
              </div>

              {/* Datos de Cuenta Banesco */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#334155',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}>
                <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>🏦 Banesco (Pago Móvil / Transferencia):</span>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 800 }}>Sellos Chacaíto</span>
                </div>
                <div>• <strong>Teléfono:</strong> 04143256743</div>
                <div>• <strong>RIF:</strong> J 315705680</div>
                <div>• <strong>Cuenta:</strong> 01340277912771092630</div>
              </div>

              {/* Botones de Acción */}
              <div className="calc-actions-grid">
                <button 
                  type="button"
                  className="calc-btn-whatsapp"
                  onClick={handleSendWhatsApp}
                >
                  <Send size={16} /> Enviar Combo por WA
                </button>

                <button 
                  type="button"
                  className="calc-btn-primary"
                  onClick={handleCopySummary}
                >
                  <Copy size={16} /> Copiar Cotización Completa
                </button>
              </div>

            </article>

            {/* SECCIÓN DELIVERY MOTORIZADO (EUROS / ALEXANDER) */}
            <article className="calc-card" style={{ border: '1.5px solid #a7f3d0', background: '#ffffff' }}>
              <div className="calc-card-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: '#ecfdf5', color: '#10b981', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                    <Truck size={18} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>Cobro de Delivery (Euros)</span>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Motorizado: Alexander</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Tasa Euro BCV</span>
                  <div style={{ fontSize: '13px', fontWeight: 900, color: '#047857' }}>{bcvEuroRate} <span style={{ fontSize: '10px' }}>Bs/€</span></div>
                </div>
              </div>

              {/* Botones rápidos de montos en Euros */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {['3,00', '4,00', '5,00', '6,00', '8,00', '10,00'].map(amt => {
                  const isSelected = parseNum(euroDeliveryAmount) === parseNum(amt);
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleEuroChange(amt)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: isSelected ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                        background: isSelected ? '#ecfdf5' : '#f8fafc',
                        color: isSelected ? '#065f46' : '#475569',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {amt.split(',')[0]} €
                    </button>
                  );
                })}
              </div>

              {/* Input Euros */}
              <div className="calc-input-group">
                <label className="calc-input-label">Monto del Delivery en Euros (€)</label>
                <div className="calc-input-shell" style={{ borderColor: '#a7f3d0' }}>
                  <input 
                    type="text" 
                    className="calc-big-input"
                    inputMode="decimal"
                    value={euroDeliveryAmount}
                    onChange={e => handleEuroChange(e.target.value)}
                    onBlur={() => setEuroDeliveryAmount(fmt(parseNum(euroDeliveryAmount)))}
                    onFocus={e => e.target.select()}
                  />
                  <span className="calc-suffix" style={{ color: '#10b981' }}>€</span>
                </div>
              </div>

              {/* Total Delivery en Bolívares */}
              <div className="calc-result-box" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', padding: '12px 14px' }}>
                <span className="calc-result-label" style={{ color: '#065f46' }}>Total Delivery a Transferir</span>
                <div className="calc-result-val" style={{ color: '#047857', fontSize: '22px' }}>
                  Bs. {fmt(deliveryBsTotalNum)}
                </div>
              </div>

              {/* Datos de Pago Móvil de Alexander */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                fontSize: '12.5px',
                color: '#334155'
              }}>
                <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span>Datos de Pago Móvil (Alexander):</span>
                  <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0284c7', fontWeight: 800, padding: '2px 8px', borderRadius: '999px' }}>Motorizado</span>
                </div>
                <div>🏦 <strong>Banco:</strong> BANCO DE VENEZUELA (0102)</div>
                <div>🪪 <strong>C.I.:</strong> 13.739.158</div>
                <div>📱 <strong>Teléfono:</strong> 04241478523</div>
                <div>👤 <strong>Titular:</strong> Alexander</div>
              </div>

              {/* Botones de Acción Delivery */}
              <div className="calc-actions-grid" style={{ marginTop: '8px' }}>
                <button 
                  type="button"
                  className="calc-btn-whatsapp"
                  onClick={handleSendDeliveryEuroWhatsApp}
                >
                  <Send size={16} /> Enviar a Cliente por WA
                </button>

                <button 
                  type="button"
                  className="calc-btn-primary"
                  onClick={handleCopyDeliveryEuro}
                >
                  <Copy size={16} /> Copiar Datos de Delivery
                </button>
              </div>

            </article>

          </div>

          {/* Lado Derecho: Lista de Precios y Descuento 20% */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Lista Rápida de Precios */}
            <article className="calc-card">
              <div className="calc-card-title">
                <span>Lista Rápida de Precios</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>6 casillas</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {prices.map((p, i) => (
                  <div key={i} className="calc-price-row">
                    <span className="calc-price-num">{i + 1}</span>
                    <div className="calc-price-input-shell">
                      <input 
                        type="text" 
                        className="calc-price-input"
                        inputMode="decimal"
                        value={p}
                        onChange={e => updatePrice(i, e.target.value)}
                        onBlur={() => {
                          const np = [...prices];
                          np[i] = fmt(parseNum(np[i]));
                          setPrices(np);
                          localStorage.setItem('sc_prices', JSON.stringify(np));
                        }}
                        onFocus={e => e.target.select()}
                        placeholder="0,00"
                      />
                      <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 700 }}>$</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--ws-border-subtle)', paddingTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Lista</span>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>${fmt(pricesTotalNum)}</div>
                </div>

                <button 
                  type="button"
                  className="calc-btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                  onClick={usePricesTotal}
                >
                  Usar Total
                </button>
              </div>
            </article>

            {/* Descuento 20% */}
            <article className="calc-card">
              <div className="calc-card-title">
                <span>Calcular 20% Descuento</span>
                <Percent size={16} color="#10b981" />
              </div>

              <div className="calc-input-group">
                <label className="calc-input-label">Monto Base ($)</label>
                <div className="calc-input-shell" style={{ height: '44px' }}>
                  <input 
                    type="text" 
                    className="calc-big-input"
                    style={{ fontSize: '16px' }}
                    inputMode="decimal"
                    value={discountBase}
                    onChange={e => setDiscountBase(e.target.value)}
                    onBlur={() => setDiscountBase(fmt(parseNum(discountBase)))}
                    onFocus={e => e.target.select()}
                  />
                  <span className="calc-suffix" style={{ fontSize: '14px' }}>$</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ws-bg-canvas)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--ws-border-subtle)' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Ahorro 20%:</span>
                <b style={{ color: '#dc2626', fontSize: '14px' }}>-${fmt(discountAmountNum)}</b>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--ws-border-subtle)', paddingTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total con Descuento</span>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981' }}>${fmt(discountFinalNum)}</div>
                </div>

                <button 
                  type="button"
                  className="calc-btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                  onClick={useDiscountTotal}
                >
                  Usar Total
                </button>
              </div>
            </article>

          </div>

        </div>

      </div>

      {/* Toast */}
      {showToast && (
        <div className="calc-toast">
          {toastMsg}
        </div>
      )}

      {/* Modal Historial */}
      {showHistoryModal && (
        <BcvHistoryModal 
          onClose={() => setShowHistoryModal(false)}
          currentBcvRate={bcvRate}
        />
      )}
    </div>
  );
}
