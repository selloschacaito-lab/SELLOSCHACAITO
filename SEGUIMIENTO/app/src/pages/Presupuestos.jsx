import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, FileText, Plus, Trash2, Calculator, Settings, PanelLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import '../styles/whitestamp.css';
import './Presupuestos.css';

export default function Presupuestos() {
  const { toggleSidebar } = useOutletContext() || {};
  const [bcvRate, setBcvRate] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  
  const [client, setClient] = useState({
    name: '',
    rif: '',
    address: '',
    phone: '',
    email: ''
  });

  const [items, setItems] = useState([]);
  
  // Calculadora Inversa
  const [invTotal, setInvTotal] = useState('');
  const [invBase, setInvBase] = useState(0);

  const previewRef = useRef(null);
  const viewportRef = useRef(null);

  // Zoom / Scale State
  const [zoomMode, setZoomMode] = useState('fit'); // 'fit' | '100' | '75'
  const [computedScale, setComputedScale] = useState(0.75);

  useEffect(() => {
    fetchBCV();
    initQuoteNumber();
  }, []);

  // Compute scale dynamically so preview fits available space without cutting off
  useEffect(() => {
    function updateScale() {
      if (!viewportRef.current) return;
      if (zoomMode === 'fit') {
        const availableW = viewportRef.current.clientWidth - 40;
        const docW = 794; // A4 standard width in px
        const s = Math.min(1.0, Math.max(0.35, availableW / docW));
        setComputedScale(s);
      } else {
        setComputedScale(Number(zoomMode) / 100);
      }
    }

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [zoomMode]);

  const fetchBCV = async () => {
    try {
      const savedRate = localStorage.getItem('sc_bcv');
      if (savedRate) setBcvRate(savedRate.replace('.', ','));
      
      const r = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        const rate = Number(d.promedio);
        if (Number.isFinite(rate) && rate > 0) {
          setBcvRate(rate.toLocaleString('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
          localStorage.setItem('sc_bcv', rate.toString());
        }
      }
    } catch (e) {
      console.warn("No se pudo actualizar la tasa BCV", e);
    }
  };

  const initQuoteNumber = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    const dateCode = `${dd}${mm}${yy}`;
    
    // Formato de visualización: DD/MM/YYYY
    setDateStr(`${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`);

    const savedDate = localStorage.getItem('sc_quote_date');
    let count = parseInt(localStorage.getItem('sc_quote_count') || '0', 10);

    if (savedDate !== dateCode) {
      count = 1;
      localStorage.setItem('sc_quote_date', dateCode);
      localStorage.setItem('sc_quote_count', '1');
    }

    setQuoteNumber(`${dateCode}${String(count).padStart(2, '0')}`);
  };

  const incrementQuoteNumber = () => {
    const dateCode = localStorage.getItem('sc_quote_date');
    let count = parseInt(localStorage.getItem('sc_quote_count') || '1', 10);
    count++;
    localStorage.setItem('sc_quote_count', count.toString());
    setQuoteNumber(`${dateCode}${String(count).padStart(2, '0')}`);
    toast.success(`Presupuesto avanzado al N° ${dateCode}${String(count).padStart(2, '0')}`);
  };

  const handleInvChange = (e) => {
    const val = e.target.value.replace(/[^\d.,]/g, '');
    setInvTotal(val);
    
    const num = parseFloat(val.replace(/,/g, '.')) || 0;
    if (num > 0) {
      setInvBase(num / 1.16);
    } else {
      setInvBase(0);
    }
  };

  const addItem = () => {
    if (items.length >= 10) {
      toast.error("Máximo 10 productos por presupuesto");
      return;
    }
    setItems([...items, { desc: '', qty: 1, price: '', discount: '' }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'price') {
      newItems[index][field] = value.replace(/[^\d.,]/g, '');
    } else if (field === 'discount') {
      newItems[index][field] = value.replace(/[^\d.,%]/g, '');
    } else {
      newItems[index][field] = value.toUpperCase();
    }
    setItems(newItems);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const parseNum = (str) => parseFloat(String(str).replace(/,/g, '.')) || 0;
  const fmt = (n, dec = 2) => Number(n).toLocaleString('es-VE', { minimumFractionDigits: dec, maximumFractionDigits: dec });

  const calculateItemFinalPrice = (item) => {
    const rawPrice = parseNum(item.price);
    let discVal = 0;
    const discStr = String(item.discount || '').trim();
    if (discStr.endsWith('%')) {
      const pct = parseNum(discStr.replace('%', ''));
      discVal = rawPrice * (pct / 100);
    } else {
      discVal = parseNum(discStr);
    }
    return Math.max(0, rawPrice - discVal);
  };

  const fillRows = () => {
    const rows = [];
    for (let i = 0; i < 10; i++) {
      const item = items[i];
      if (item) {
        // Asumimos que el precio ingresado es CON IVA, aplicamos descuento y extraemos base imponible
        const finalPriceConIva = calculateItemFinalPrice(item);
        const basePrice = finalPriceConIva > 0 ? (finalPriceConIva / 1.16) : 0;
        const itemTotalBase = parseNum(item.qty) * basePrice;
        
        rows.push(
          <tr key={i}>
            <td className="col-num">{i + 1}</td>
            <td className="col-desc">
              <div>{item.desc}</div>
              {item.discount && parseNum(item.discount) > 0 && (
                <div style={{ fontSize: '9px', color: '#64748b', fontStyle: 'italic' }}>
                  (Incluye descuento de {item.discount})
                </div>
              )}
            </td>
            <td className="col-qty">{item.qty}</td>
            <td className="col-price">{basePrice > 0 ? fmt(basePrice) : ''}</td>
            <td className="col-total">{itemTotalBase > 0 ? fmt(itemTotalBase) : ''}</td>
          </tr>
        );
      } else {
        rows.push(
          <tr key={i}>
            <td className="col-num">{i + 1}</td>
            <td className="col-desc"></td>
            <td className="col-qty"></td>
            <td className="col-price">-</td>
            <td className="col-total">-</td>
          </tr>
        );
      }
    }
    return rows;
  };

  // Recalcular totales asumiendo que los items ingresados son CON IVA con su descuento aplicado
  const getTotalConIva = () => {
    return items.reduce((acc, item) => {
      const finalPrice = calculateItemFinalPrice(item);
      return acc + (parseNum(item.qty) * finalPrice);
    }, 0);
  };

  const total = getTotalConIva();
  const subtotal = total / 1.16;
  const iva = total - subtotal;

  const bcvNum = parseNum(bcvRate) || 1;
  const totalUSD = total / bcvNum;

  const exportJPG = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);
    const el = previewRef.current;
    const prevTransform = el.style.transform;
    const prevMargin = el.style.marginBottom;
    el.style.transform = 'none';
    el.style.marginBottom = '0';
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `Presupuesto-${quoteNumber}.jpg`;
      link.href = imgData;
      link.click();
      toast.success("Imagen descargada con éxito");
    } catch (err) {
      console.error("Error al exportar JPG:", err);
      toast.error("Error al exportar imagen");
    } finally {
      el.style.transform = prevTransform;
      el.style.marginBottom = prevMargin;
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);
    const el = previewRef.current;
    const prevTransform = el.style.transform;
    const prevMargin = el.style.marginBottom;
    el.style.transform = 'none';
    el.style.marginBottom = '0';
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Presupuesto-${quoteNumber}.pdf`);
      toast.success("PDF descargado con éxito");
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      toast.error("Error al exportar PDF");
    } finally {
      el.style.transform = prevTransform;
      el.style.marginBottom = prevMargin;
      setIsExporting(false);
    }
  };

  return (
    <div className="animate-fade-in pres-container">
      
      {/* Controles / Formulario con Scroll Interno */}
      <div className="pres-controls">
        <div className="pres-header-top">
          {toggleSidebar && (
            <button 
              onClick={toggleSidebar} 
              className="pres-sidebar-btn" 
              title="Abrir menú"
              type="button"
            >
              <PanelLeft size={18} />
            </button>
          )}
          <h2 className="controls-title">Presupuestos</h2>
        </div>
        
        <div className="pres-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div>
              <label className="input-label">N° Presupuesto</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)' }}>{quoteNumber}</span>
                <button onClick={incrementQuoteNumber} className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>+1 (Avanzar)</button>
              </div>
            </div>
            <div>
              <label className="input-label">Tasa BCV</label>
              <input 
                type="text" 
                value={bcvRate} 
                onChange={(e) => setBcvRate(e.target.value.replace(/[^\d.,]/g, ''))} 
                className="input-field" 
                style={{ width: '105px', fontWeight: 'bold' }} 
              />
            </div>
          </div>
        </div>

        <div className="pres-section">
          <h3 className="section-title">Calculadora Inversa (Base Imponible)</h3>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Total con IVA (Ej. 35)</label>
              <input type="text" value={invTotal} onChange={handleInvChange} className="input-field" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="input-label">Base Imponible</label>
              <input type="text" readOnly value={fmt(invBase, 4)} className="input-field" style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#0f172a' }} />
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(fmt(invBase, 4).replace('.', ''));
                toast.success("Base imponible copiada");
              }}
              className="btn-secondary"
              style={{ height: '38px' }}
            >
              Copiar
            </button>
          </div>
        </div>

        <div className="pres-section">
          <h3 className="section-title">Datos del Cliente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <input type="text" placeholder="CLIENTE" className="input-field" value={client.name} onChange={(e) => setClient({...client, name: e.target.value.toUpperCase()})} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" placeholder="RIF / C.I." className="input-field" value={client.rif} onChange={(e) => setClient({...client, rif: e.target.value.toUpperCase()})} />
              <input type="text" placeholder="TELÉFONOS" className="input-field" value={client.phone} onChange={(e) => setClient({...client, phone: e.target.value.toUpperCase()})} />
            </div>
            <input type="text" placeholder="DIRECCIÓN" className="input-field" value={client.address} onChange={(e) => setClient({...client, address: e.target.value.toUpperCase()})} />
            <input type="text" placeholder="EMAIL" className="input-field" value={client.email} onChange={(e) => setClient({...client, email: e.target.value.toUpperCase()})} />
          </div>
        </div>

        <div className="pres-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 className="section-title" style={{ margin: 0, border: 'none' }}>Productos ({items.length}/10)</h3>
            <button onClick={addItem} className="btn-primary" style={{ padding: '0.3rem 0.6rem', width: 'auto', display: 'flex', gap: '0.25rem', fontSize: '0.8rem', marginTop: 0 }} disabled={items.length >= 10}>
              <Plus size={15} /> Agregar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {items.map((item, idx) => {
              const rawPrice = parseNum(item.price);
              let discVal = 0;
              const discStr = String(item.discount || '').trim();
              if (discStr.endsWith('%')) {
                const pct = parseNum(discStr.replace('%', ''));
                discVal = rawPrice * (pct / 100);
              } else {
                discVal = parseNum(discStr);
              }
              const finalPrice = Math.max(0, rawPrice - discVal);

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#f8fafc', padding: '6px 8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-muted)', width: '16px' }}>{idx+1}</span>
                    <input 
                      type="text" 
                      placeholder="Descripción" 
                      className="input-field" 
                      value={item.desc} 
                      onChange={(e) => updateItem(idx, 'desc', e.target.value)} 
                      style={{ flex: 3, height: '34px', fontSize: '12px' }} 
                    />
                    <input 
                      type="number" 
                      placeholder="Cant." 
                      className="input-field" 
                      value={item.qty} 
                      onChange={(e) => updateItem(idx, 'qty', e.target.value)} 
                      style={{ flex: 1, minWidth: '40px', height: '34px', fontSize: '12px', textAlign: 'center' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Precio" 
                      className="input-field" 
                      value={item.price} 
                      onChange={(e) => updateItem(idx, 'price', e.target.value)} 
                      style={{ flex: 1.3, minWidth: '55px', height: '34px', fontSize: '12px', fontWeight: 'bold' }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Desc. (ej: 10% o 50)" 
                      title="Descuento por cada sello: escribe monto fijo o porcentaje (ej: 10% ó 50)" 
                      className="input-field" 
                      value={item.discount || ''} 
                      onChange={(e) => updateItem(idx, 'discount', e.target.value)} 
                      style={{ 
                        flex: 1.2, 
                        minWidth: '55px', 
                        height: '34px', 
                        fontSize: '11px', 
                        color: discVal > 0 ? '#15803d' : '#64748b', 
                        background: discVal > 0 ? '#ecfdf5' : '#ffffff',
                        borderColor: discVal > 0 ? '#86efac' : '#cbd5e1',
                        fontWeight: discVal > 0 ? 800 : 500
                      }} 
                    />
                    <button 
                      onClick={() => removeItem(idx)} 
                      style={{ padding: '0.2rem', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }} 
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Detalle pequeño si tiene descuento */}
                  {discVal > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '0 4px', color: '#15803d', fontWeight: 700 }}>
                      <span>Descuento: -{fmt(discVal)} c/u</span>
                      <span>Neto unitario: {fmt(finalPrice)} Bs</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen Totales */}
        <div style={{ background: '#e0f2fe', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1.5px solid #bae6fd', marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
            <span>Total Bs:</span>
            <span>{fmt(total)} Bs</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7', fontWeight: 700, fontSize: '0.9rem', marginTop: '0.25rem' }}>
            <span>Equiv. USD:</span>
            <span>{fmt(totalUSD)} $</span>
          </div>
        </div>

        {/* Botones de Descarga */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportJPG} disabled={isExporting} className="btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', opacity: isExporting ? 0.6 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }}>
            <Download size={16} /> {isExporting ? 'Generando...' : 'Descargar JPG'}
          </button>
          <button onClick={exportPDF} disabled={isExporting} className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', marginTop: 0, opacity: isExporting ? 0.6 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }}>
            <FileText size={16} /> {isExporting ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>

      </div>

      {/* Panel Derecho: Vista Previa Adaptable con Auto-Fit */}
      <div className="pres-preview-wrapper">
        <div className="pres-preview-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)' }}>Vista Previa A4:</span>
            <button 
              onClick={() => setZoomMode('fit')} 
              className="btn-secondary" 
              style={{ 
                padding: '0.2rem 0.65rem', 
                fontSize: '0.72rem', 
                background: zoomMode === 'fit' ? 'var(--green-neon-20)' : 'transparent', 
                borderColor: zoomMode === 'fit' ? 'var(--green-neon)' : 'var(--border)' 
              }}
            >
              Ajustar al ancho
            </button>
            <button 
              onClick={() => setZoomMode('100')} 
              className="btn-secondary" 
              style={{ 
                padding: '0.2rem 0.65rem', 
                fontSize: '0.72rem', 
                background: zoomMode === '100' ? 'var(--green-neon-20)' : 'transparent', 
                borderColor: zoomMode === '100' ? 'var(--green-neon)' : 'var(--border)' 
              }}
            >
              100%
            </button>
            <button 
              onClick={() => setZoomMode('75')} 
              className="btn-secondary" 
              style={{ 
                padding: '0.2rem 0.65rem', 
                fontSize: '0.72rem', 
                background: zoomMode === '75' ? 'var(--green-neon-20)' : 'transparent', 
                borderColor: zoomMode === '75' ? 'var(--green-neon)' : 'var(--border)' 
              }}
            >
              75%
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Zoom: {Math.round(computedScale * 100)}%
          </div>
        </div>

        <div className="pres-preview-viewport" ref={viewportRef}>
          <div 
            className="pres-document" 
            ref={previewRef}
            style={{
              transform: `scale(${computedScale})`,
              transformOrigin: 'top center',
              marginBottom: computedScale < 1 ? `-${Math.round(1123 * (1 - computedScale))}px` : '20px',
              transition: 'transform 0.18s ease-out'
            }}
          >
            {/* Logo y Encabezado */}
            <div className="pres-header">
              <div className="pres-logo">
                <img src="/logo-pauta.png?v=3" alt="Logo" style={{ width: '110px', height: '110px', objectFit: 'contain' }} />
              </div>
              <div className="pres-company-name">Pauta Publicitaria C.A.</div>
              <div className="pres-company-rif">Rif: J-31570568-0</div>
            </div>

            <div className="pres-title-row">
              <div className="pres-date">{dateStr}</div>
              <div className="pres-title">PRESUPUESTO</div>
              <div className="pres-number">N° {quoteNumber}</div>
            </div>

            <div className="pres-client-info">
              <div className="pres-row"><span className="pres-label">Cliente:</span> <span className="pres-val">{client.name}</span></div>
              <div className="pres-row"><span className="pres-label">RIF / C.I.:</span> <span className="pres-val">{client.rif}</span></div>
              <div className="pres-row" style={{ alignItems: 'flex-start' }}>
                <span className="pres-label">Dirección:</span> 
                <span className="pres-val" style={{ lineHeight: '1.2' }}>{client.address}</span>
              </div>
              <div className="pres-row"><span className="pres-label">Teléfonos:</span> <span className="pres-val">{client.phone}</span></div>
              <div className="pres-row"><span className="pres-label">Email:</span> <span className="pres-val">{client.email}</span></div>
            </div>

            <table className="pres-table">
              <thead>
                <tr>
                  <th colSpan="2" style={{ width: '60%' }}>DESCRIPCIÓN</th>
                  <th style={{ width: '10%' }}>CANTIDAD</th>
                  <th style={{ width: '15%' }}>PRECIO</th>
                  <th style={{ width: '15%' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {fillRows()}
              </tbody>
            </table>

            <div className="pres-totals-container">
              <div className="pres-notes">
                <div>ESTE PRESUPUESTO INCLUYE IVA</div>
                <div>CAMBIO BCV {bcvRate}</div>
              </div>
              <div className="pres-totals">
                <div className="pres-total-row">
                  <span className="pres-total-label">Subtotal:</span>
                  <span className="pres-total-val">{fmt(subtotal)}</span>
                </div>
                <div className="pres-total-row">
                  <span className="pres-total-label">I.V.A 16%:</span>
                  <span className="pres-total-val">{fmt(iva)}</span>
                </div>
                <div className="pres-total-row pres-total-final">
                  <span className="pres-total-label">Total:</span>
                  <span className="pres-total-val">{fmt(total)}</span>
                </div>
              </div>
            </div>

            <div className="pres-footer">
              Centro Comercial ARTA, primer piso, oficina 1-6, Chacaito, frente a BECO.<br/>
              Teléfonos: 0212-953-5551 / 0424-134-5488 // @sellos.chacaito // selloschacaito@gmail.com
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
