import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  BadgeDollarSign, 
  RefreshCw, 
  DollarSign, 
  Percent, 
  Plus, 
  ShoppingCart, 
  TrendingUp, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  ArrowRight,
  PanelLeft
} from 'lucide-react';
import '../styles/whitestamp.css';
import './Costos.css';

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
  return Number(n || 0).toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export default function Costos({ isEmbedded = false }) {
  const outletCtx = useOutletContext() || {};
  const toggleSidebar = isEmbedded ? null : outletCtx.toggleSidebar;
  // Rate
  const [bcvRate, setBcvRate] = useState('784,6633');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [isCustomRate, setIsCustomRate] = useState(false);

  // Inputs
  const [currencyInput, setCurrencyInput] = useState('USD'); // 'USD' | 'VES'
  const [baseCostInput, setBaseCostInput] = useState('5,00');
  const [includeIva, setIncludeIva] = useState(true);
  const [ivaPercent, setIvaPercent] = useState('16');

  // Detal Strategy
  const [profitPercentDetal, setProfitPercentDetal] = useState('100');
  const [addDollarDetal, setAddDollarDetal] = useState('2.00');
  const [finalDetalUsdInput, setFinalDetalUsdInput] = useState('');

  // Mayor Strategy
  const [wholesaleDiscountPercent, setWholesaleDiscountPercent] = useState('20');
  const [finalWholesaleUsdInput, setFinalWholesaleUsdInput] = useState('');

  // Source tracking: 'inputs' | 'detal' | 'mayor'
  const [lastSource, setLastSource] = useState('inputs');

  // Catalog / Saved Items
  const [productName, setProductName] = useState('');
  const [savedProducts, setSavedProducts] = useState([]);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Fetch BCV Rate
  const fetchBCV = async () => {
    setIsFetchingRate(true);
    try {
      const r = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      const rate = Number(d.promedio);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error('Tasa inválida');
      
      setBcvRate(fmt(rate, 4));
      localStorage.setItem('sc_bcv', rate.toString());
      setIsCustomRate(false);
      triggerToast('Tasa BCV actualizada en vivo');
    } catch (e) {
      const saved = parseNum(localStorage.getItem('sc_bcv'));
      if (saved > 0) {
        setBcvRate(fmt(saved, 4));
      }
      triggerToast('No se pudo consultar tasa en vivo, usando última guardada');
    } finally {
      setIsFetchingRate(false);
    }
  };

  useEffect(() => {
    const saved = parseNum(localStorage.getItem('sc_bcv'));
    if (saved > 0) {
      setBcvRate(fmt(saved, 4));
    } else {
      fetchBCV();
    }

    const savedProds = JSON.parse(localStorage.getItem('sc_costos_catalog') || '[]');
    if (Array.isArray(savedProds)) {
      setSavedProducts(savedProds);
    }
  }, []);

  // Save to localStorage catalog
  const saveCatalogToStorage = (list) => {
    setSavedProducts(list);
    localStorage.setItem('sc_costos_catalog', JSON.stringify(list));
  };

  // Math Computations
  const rateVal = parseNum(bcvRate) || 1;
  const rawBase = parseNum(baseCostInput);
  const baseUsd = currencyInput === 'VES' ? (rateVal > 0 ? rawBase / rateVal : 0) : rawBase;
  const ivaMult = includeIva ? (1 + parseNum(ivaPercent) / 100) : 1;
  
  // Total Cost
  const totalCostUsd = baseUsd * ivaMult;
  const totalCostVes = totalCostUsd * rateVal;

  // Detal Calculations
  let currentDetalUsd = 0;
  let currentProfitUsd = 0;
  let currentEffectiveProfitPercent = 0;

  if (lastSource === 'detal') {
    currentDetalUsd = parseNum(finalDetalUsdInput);
    currentProfitUsd = currentDetalUsd - totalCostUsd;
    const addDollar = parseNum(addDollarDetal);
    currentEffectiveProfitPercent = totalCostUsd > 0 ? (((currentProfitUsd - addDollar) / totalCostUsd) * 100) : 0;
  } else {
    const profitPct = parseNum(profitPercentDetal) / 100;
    const addDollar = parseNum(addDollarDetal);
    currentProfitUsd = (totalCostUsd * profitPct) + addDollar;
    currentDetalUsd = totalCostUsd + currentProfitUsd;
    currentEffectiveProfitPercent = parseNum(profitPercentDetal);
  }

  const currentDetalVes = currentDetalUsd * rateVal;

  // Mayor Calculations
  let currentWholesaleUsd = 0;
  let currentWholesaleDiscountPercent = 0;

  if (lastSource === 'mayor') {
    currentWholesaleUsd = parseNum(finalWholesaleUsdInput);
    currentWholesaleDiscountPercent = currentDetalUsd > 0 ? (((currentDetalUsd - currentWholesaleUsd) / currentDetalUsd) * 100) : 0;
  } else {
    const discountPct = parseNum(wholesaleDiscountPercent) / 100;
    currentWholesaleUsd = currentDetalUsd * (1 - discountPct);
    currentWholesaleDiscountPercent = parseNum(wholesaleDiscountPercent);
  }

  const currentWholesaleVes = currentWholesaleUsd * rateVal;
  const currentWholesaleProfitUsd = currentWholesaleUsd - totalCostUsd;

  // Change Handlers
  const handleBaseCostChange = (val) => {
    setBaseCostInput(val);
    setLastSource('inputs');
  };

  const handleProfitPercentChange = (val) => {
    setProfitPercentDetal(val);
    setLastSource('inputs');
  };

  const handleAddDollarChange = (val) => {
    setAddDollarDetal(val);
    setLastSource('inputs');
  };

  const handleFinalDetalChange = (val) => {
    setFinalDetalUsdInput(val);
    setLastSource('detal');
  };

  const handleWholesaleDiscountChange = (val) => {
    setWholesaleDiscountPercent(val);
    setLastSource('inputs');
  };

  const handleFinalWholesaleChange = (val) => {
    setFinalWholesaleUsdInput(val);
    setLastSource('mayor');
  };

  // Add Item to Catalog
  const handleAddProduct = () => {
    const name = productName.trim() || 'Nuevo Modelo Sello';
    const newItem = {
      id: Date.now().toString(),
      name,
      totalCostUsd,
      detalUsd: currentDetalUsd,
      wholesaleUsd: currentWholesaleUsd,
      profitUsd: currentProfitUsd,
      effectiveProfitPct: currentEffectiveProfitPercent,
      date: new Date().toLocaleDateString('es-VE')
    };

    const updated = [newItem, ...savedProducts];
    saveCatalogToStorage(updated);
    setProductName('');
    triggerToast(`"${name}" guardado a la lista`);
  };

  const handleDeleteProduct = (id) => {
    const updated = savedProducts.filter(p => p.id !== id);
    saveCatalogToStorage(updated);
    triggerToast('Modelo eliminado de la lista');
  };

  const handleLoadProduct = (item) => {
    setProductName(item.name);
    setFinalDetalUsdInput(fmt(item.detalUsd));
    setFinalWholesaleUsdInput(fmt(item.wholesaleUsd));
    setLastSource('detal');
    triggerToast(`Cargado "${item.name}" a la calculadora`);
  };

  const handleCopyCatalogSummary = () => {
    if (savedProducts.length === 0) {
      triggerToast('No hay modelos guardados en la lista');
      return;
    }

    let text = `*LISTA DE PRECIOS Y COSTOS SELLOS CHACAÍTO*\nTasa BCV: ${bcvRate} Bs/$\n------------------------------------\n`;
    savedProducts.forEach(p => {
      text += `• *${p.name}*: Detal $${fmt(p.detalUsd)} | Mayor $${fmt(p.wholesaleUsd)}\n`;
    });

    navigator.clipboard.writeText(text);
    triggerToast('Resumen copiado al portapapeles');
  };

  return (
    <div className="costos-wrapper">
      <div className="costos-container">

        {/* Header Banner */}
        <header className="costos-header">
          <div className="costos-title-box">
            <div className="costos-header-left">
              {toggleSidebar && (
                <button 
                  onClick={toggleSidebar} 
                  className="costos-sidebar-btn" 
                  title="Abrir menú"
                  type="button"
                >
                  <PanelLeft size={18} />
                </button>
              )}
              <div className="costos-icon-badge">
                <BadgeDollarSign size={24} />
              </div>
            </div>
            <div>
              <h1>Calculadora de Costos y Precios</h1>
              <p>Márgenes flexibles, IVA, precios al Detal y al Mayor</p>
            </div>
          </div>

          <div className="costos-rate-card">
            <div className="costos-rate-info">
              <span className="costos-rate-label">
                Tasa BCV {isCustomRate ? '(Manual)' : '($/Bs)'}
              </span>
              <div className="costos-rate-input-wrap">
                <input 
                  type="text" 
                  className="costos-rate-input" 
                  value={bcvRate} 
                  onChange={(e) => {
                    setBcvRate(e.target.value);
                    setIsCustomRate(true);
                  }}
                  onBlur={() => setBcvRate(fmt(parseNum(bcvRate), 4))}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>Bs</span>
              </div>
            </div>
            <button 
              className="costos-btn-icon" 
              onClick={fetchBCV} 
              disabled={isFetchingRate}
              title="Actualizar tasa BCV automáticamente"
            >
              <RefreshCw size={18} className={isFetchingRate ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Main Grid: Cost Input & Margins */}
        <div className="costos-grid">

          {/* CARD 1: Costo Base e Impuestos */}
          <div className="costos-card">
            <h3 className="costos-card-title">
              <span><DollarSign size={18} color="var(--primary)" /> 1. Costo Base del Proveedor</span>
            </h3>

            {/* Base Input */}
            <div className="costos-field-group">
              <div className="costos-label">
                <span>Costo del Sello (Sin IVA)</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    type="button"
                    className={`costos-toggle-btn ${currencyInput === 'USD' ? 'active' : ''}`}
                    onClick={() => setCurrencyInput('USD')}
                  >
                    USD ($)
                  </button>
                  <button 
                    type="button"
                    className={`costos-toggle-btn ${currencyInput === 'VES' ? 'active' : ''}`}
                    onClick={() => setCurrencyInput('VES')}
                  >
                    VES (Bs)
                  </button>
                </div>
              </div>
              <div className="costos-input-shell">
                <input 
                  type="text"
                  className="costos-input"
                  inputMode="decimal"
                  value={baseCostInput}
                  onChange={(e) => handleBaseCostChange(e.target.value)}
                  onBlur={() => setBaseCostInput(fmt(parseNum(baseCostInput)))}
                  placeholder="0,00"
                />
                <span className="costos-input-suffix">{currencyInput === 'USD' ? '$' : 'Bs'}</span>
              </div>
            </div>

            {/* IVA Row */}
            <div className="costos-row-2">
              <div className="costos-field-group">
                <div className="costos-label">
                  <span>Incluir IVA</span>
                  <input 
                    type="checkbox" 
                    checked={includeIva} 
                    onChange={(e) => {
                      setIncludeIva(e.target.checked);
                      setLastSource('inputs');
                    }}
                    style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </div>
                <div className="costos-input-shell" style={{ opacity: includeIva ? 1 : 0.4 }}>
                  <input 
                    type="text"
                    className="costos-input"
                    disabled={!includeIva}
                    value={ivaPercent}
                    onChange={(e) => {
                      setIvaPercent(e.target.value);
                      setLastSource('inputs');
                    }}
                    style={{ fontSize: '1rem' }}
                  />
                  <span className="costos-input-suffix">%</span>
                </div>
              </div>

              <div className="costos-field-group">
                <div className="costos-label">Equivalente en Bs</div>
                <div className="costos-input-shell" style={{ background: 'transparent', borderStyle: 'dashed' }}>
                  <span style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-muted)' }}>
                    Bs. {fmt(baseUsd * rateVal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Cost Summary Card */}
            <div className="costos-cost-summary">
              <div>
                <div className="costos-label" style={{ margin: 0 }}>Costo Total Unitario ({includeIva ? 'Con IVA' : 'Sin IVA'})</div>
                <div className="costos-cost-sub">Equivalente: Bs. {fmt(totalCostVes)}</div>
              </div>
              <div className="costos-cost-val">
                ${fmt(totalCostUsd)}
              </div>
            </div>
          </div>

          {/* CARD 2: Venta al Detal y al Mayor */}
          <div className="costos-card">
            <h3 className="costos-card-title">
              <span><TrendingUp size={18} color="var(--primary)" /> 2. Margen de Ganancia y Precios</span>
            </h3>

            {/* Detal Strategy Controls */}
            <div className="costos-row-2">
              <div className="costos-field-group">
                <div className="costos-label">% Ganancia Detal</div>
                <div className="costos-input-shell">
                  <input 
                    type="text"
                    className="costos-input"
                    value={lastSource === 'detal' ? fmt(currentEffectiveProfitPercent, 1) : profitPercentDetal}
                    onChange={(e) => handleProfitPercentChange(e.target.value)}
                  />
                  <span className="costos-input-suffix">%</span>
                </div>
              </div>

              <div className="costos-field-group">
                <div className="costos-label">Monto Fijo Extra</div>
                <div className="costos-input-shell">
                  <input 
                    type="text"
                    className="costos-input"
                    value={addDollarDetal}
                    onChange={(e) => handleAddDollarChange(e.target.value)}
                  />
                  <span className="costos-input-suffix">+$</span>
                </div>
              </div>
            </div>

            {/* Detal Final Price Display & Input */}
            <div className="costos-price-box detal">
              <div className="costos-price-header">
                <span className="costos-price-title">Precio Venta Detal</span>
                <span className="costos-profit-badge">
                  Ganancia: +${fmt(currentProfitUsd)} ({fmt(currentEffectiveProfitPercent, 1)}%)
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <div className="costos-big-price">${fmt(currentDetalUsd)}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Bs. {fmt(currentDetalVes)}
                  </div>
                </div>

                <div style={{ width: '130px' }}>
                  <div className="costos-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Editar Precio $</div>
                  <div className="costos-input-shell" style={{ height: '38px', background: 'white' }}>
                    <input 
                      type="text"
                      className="costos-input"
                      style={{ fontSize: '1rem', color: '#078b35' }}
                      value={lastSource === 'detal' ? finalDetalUsdInput : fmt(currentDetalUsd)}
                      onChange={(e) => handleFinalDetalChange(e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                    <span className="costos-input-suffix">$</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wholesale Controls */}
            <div className="costos-price-box mayor">
              <div className="costos-price-header">
                <span className="costos-price-title">Precio Venta al Mayor</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="costos-label" style={{ margin: 0, fontSize: '0.65rem' }}>% Desc. Detal:</span>
                  <input 
                    type="text" 
                    style={{ width: '45px', border: '1px solid var(--border-strong)', borderRadius: '6px', textAlign: 'center', fontWeight: '800', fontSize: '0.75rem', padding: '2px' }}
                    value={lastSource === 'mayor' ? fmt(currentWholesaleDiscountPercent, 1) : wholesaleDiscountPercent}
                    onChange={(e) => handleWholesaleDiscountChange(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>%</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                <div>
                  <div className="costos-big-price" style={{ color: '#3b82f6' }}>${fmt(currentWholesaleUsd)}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Bs. {fmt(currentWholesaleVes)} · Ganancia: +${fmt(currentWholesaleProfitUsd)}
                  </div>
                </div>

                <div style={{ width: '130px' }}>
                  <div className="costos-label" style={{ fontSize: '0.65rem', marginBottom: '2px' }}>Editar Mayor $</div>
                  <div className="costos-input-shell" style={{ height: '38px', background: 'white' }}>
                    <input 
                      type="text"
                      className="costos-input"
                      style={{ fontSize: '1rem', color: '#2563eb' }}
                      value={lastSource === 'mayor' ? finalWholesaleUsdInput : fmt(currentWholesaleUsd)}
                      onChange={(e) => handleFinalWholesaleChange(e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                    <span className="costos-input-suffix">$</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* CARD 3: Tabla de Catálogo Guardado */}
          <div className="costos-card costos-table-card">
            <h3 className="costos-card-title">
              <span><Layers size={18} color="var(--primary)" /> 3. Guardar en Lista de Precios de Sellos</span>
              <button 
                className="costos-toggle-btn"
                onClick={handleCopyCatalogSummary}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Copy size={14} /> Copiar Resumen
              </button>
            </h3>

            <div className="costos-save-bar">
              <div className="costos-input-shell" style={{ flex: 1 }}>
                <input 
                  type="text"
                  className="costos-input"
                  placeholder="Nombre del Modelo (ej: Sello Automático 4911, Sello Madera 5x2...)"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddProduct()}
                />
              </div>
              <button className="costos-btn-add" onClick={handleAddProduct}>
                <Plus size={18} /> Guardar a la Lista
              </button>
            </div>

            {savedProducts.length > 0 ? (
              <div className="costos-table-wrapper">
                <table className="costos-table">
                  <thead>
                    <tr>
                      <th>Modelo de Sello</th>
                      <th>Costo Total ($)</th>
                      <th>Precio Detal ($ / Bs)</th>
                      <th>Precio Mayor ($ / Bs)</th>
                      <th>Ganancia Detal ($)</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedProducts.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: '800' }}>{p.name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>${fmt(p.totalCostUsd)}</td>
                        <td style={{ color: '#078b35', fontWeight: '850' }}>
                          ${fmt(p.detalUsd)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Bs. {fmt(p.detalUsd * rateVal)})</span>
                        </td>
                        <td style={{ color: '#2563eb', fontWeight: '850' }}>
                          ${fmt(p.wholesaleUsd)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Bs. {fmt(p.wholesaleUsd * rateVal)})</span>
                        </td>
                        <td style={{ color: 'var(--primary)', fontWeight: '800' }}>
                          +${fmt(p.profitUsd)} <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({fmt(p.effectiveProfitPct, 1)}%)</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="costos-btn-icon" 
                              onClick={() => handleLoadProduct(p)} 
                              title="Cargar a la calculadora"
                            >
                              <ArrowRight size={16} color="var(--primary)" />
                            </button>
                            <button 
                              className="costos-btn-icon" 
                              onClick={() => handleDeleteProduct(p.id)} 
                              title="Eliminar de la lista"
                            >
                              <Trash2 size={16} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No hay productos en la lista aún. Calcula el precio arriba y guárdalo aquí.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="costos-toast">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
