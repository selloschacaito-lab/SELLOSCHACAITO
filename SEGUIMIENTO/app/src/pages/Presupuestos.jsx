import React, { useState, useEffect, useRef } from 'react';
import { Download, FileText, Plus, Trash2, Calculator, Settings } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import './Presupuestos.css';

export default function Presupuestos() {
  const [bcvRate, setBcvRate] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [quoteNumber, setQuoteNumber] = useState('');
  
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

  useEffect(() => {
    fetchBCV();
    initQuoteNumber();
  }, []);

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
    setItems([...items, { desc: '', qty: 1, price: '' }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === 'price') {
      newItems[index][field] = value.replace(/[^\d.,]/g, '');
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

  const fillRows = () => {
    const rows = [];
    for (let i = 0; i < 10; i++) {
      const item = items[i];
      if (item) {
        // Asumimos que el precio ingresado es CON IVA, así que le extraemos la base imponible
        const inputPrice = parseNum(item.price);
        const basePrice = inputPrice > 0 ? (inputPrice / 1.16) : 0;
        const itemTotalBase = parseNum(item.qty) * basePrice;
        
        rows.push(
          <tr key={i}>
            <td className="col-num">{i + 1}</td>
            <td className="col-desc">{item.desc}</td>
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

  // Recalcular totales asumiendo que los items ingresados son CON IVA
  const getTotalConIva = () => {
    return items.reduce((acc, item) => {
      return acc + (parseNum(item.qty) * parseNum(item.price));
    }, 0);
  };

  const total = getTotalConIva();
  const subtotal = total / 1.16;
  const iva = total - subtotal;

  const bcvNum = parseNum(bcvRate) || 1;
  const totalUSD = total / bcvNum;

  const exportJPG = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    const link = document.createElement('a');
    link.download = `Presupuesto-${quoteNumber}.jpg`;
    link.href = imgData;
    link.click();
    toast.success("Imagen descargada");
  };

  const exportPDF = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    
    // El presupuesto tiene proporción vertical (A4 aprox)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Presupuesto-${quoteNumber}.pdf`);
    toast.success("PDF descargado");
  };

  return (
    <div className="animate-fade-in pres-container">
      
      {/* Controles */}
      <div className="pres-controls glass-card">
        <h2 className="controls-title">Generador de Presupuestos</h2>
        
        <div className="pres-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <label className="input-label">N° Presupuesto</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{quoteNumber}</span>
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
                style={{ width: '100px', fontWeight: 'bold' }} 
              />
            </div>
          </div>
        </div>

        <div className="pres-section">
          <h3 className="section-title">Calculadora Inversa (Base Imponible)</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Total con IVA (Ej. 35)</label>
              <input type="text" value={invTotal} onChange={handleInvChange} className="input-field" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="input-label">Base Imponible (4 dec.)</label>
              <input type="text" readOnly value={fmt(invBase, 4)} className="input-field" style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#0f172a' }} />
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(fmt(invBase, 4).replace('.', ''));
                toast.success("Base imponible copiada");
              }}
              className="btn-secondary"
            >
              Copiar
            </button>
          </div>
        </div>

        <div className="pres-section">
          <h3 className="section-title">Datos del Cliente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input type="text" placeholder="CLIENTE" className="input-field" value={client.name} onChange={(e) => setClient({...client, name: e.target.value.toUpperCase()})} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input type="text" placeholder="RIF / C.I." className="input-field" value={client.rif} onChange={(e) => setClient({...client, rif: e.target.value.toUpperCase()})} />
              <input type="text" placeholder="TELÉFONOS" className="input-field" value={client.phone} onChange={(e) => setClient({...client, phone: e.target.value.toUpperCase()})} />
            </div>
            <input type="text" placeholder="DIRECCIÓN" className="input-field" value={client.address} onChange={(e) => setClient({...client, address: e.target.value.toUpperCase()})} />
            <input type="text" placeholder="EMAIL" className="input-field" value={client.email} onChange={(e) => setClient({...client, email: e.target.value.toUpperCase()})} />
          </div>
        </div>

        <div className="pres-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Productos ({items.length}/10)</h3>
            <button onClick={addItem} className="btn-primary" style={{ padding: '0.25rem 0.5rem', width: 'auto', display: 'flex', gap: '0.25rem', fontSize: '0.85rem' }} disabled={items.length >= 10}>
              <Plus size={16} /> Agregar
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ padding: '0.5rem', fontWeight: 'bold', color: '#64748b' }}>{idx+1}</span>
                <input type="text" placeholder="Descripción" className="input-field" value={item.desc} onChange={(e) => updateItem(idx, 'desc', e.target.value)} style={{ flex: 3 }} />
                <input type="number" placeholder="Cant." className="input-field" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} style={{ flex: 1 }} />
                <input type="text" placeholder="Precio" className="input-field" value={item.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} style={{ flex: 1.5 }} />
                <button onClick={() => removeItem(idx)} style={{ padding: '0.5rem', color: '#ef4444', background: 'transparent' }}>
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen flotante */}
        <div style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Total Bs:</span>
            <span>{fmt(total)} Bs</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1' }}>
            <span>Equiv. USD:</span>
            <span>{fmt(totalUSD)} $</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={exportJPG} className="btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <Download size={18} /> JPG
          </button>
          <button onClick={exportPDF} className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> PDF
          </button>
        </div>

      </div>

      {/* Vista Previa (El Documento) */}
      <div className="pres-preview-wrapper">
        <div className="pres-document" ref={previewRef}>
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
  );
}
