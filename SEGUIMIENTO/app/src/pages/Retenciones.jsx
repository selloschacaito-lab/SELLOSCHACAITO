import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calculator as CalcIcon, DollarSign, Percent, ArrowRightLeft, PanelLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import '../styles/whitestamp.css';

// Función robusta para parsear números donde la coma o el punto pueden ser decimales
function parseFlexNum(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  let s = String(v ?? '').trim().replace(/\s/g, '');
  if (!s) return 0;
  
  // Si contiene coma y punto (ej: 10.221,55 o 10,221.55)
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // 10.221,55 -> 10221.55
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // 10,221.55 -> 10221.55
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    // 10221,55 -> 10221.55
    s = s.replace(',', '.');
  }
  // Si solo tiene punto (ej: 10221.55 o 168.01), ya es válido
  const n = Number(s.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function Retenciones({ isEmbedded = false }) {
  const outletCtx = useOutletContext() || {};
  const toggleSidebar = isEmbedded ? null : outletCtx.toggleSidebar;
  const [bcvRate, setBcvRate] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [inputType, setInputType] = useState('gross'); // 'gross', 'net', 'audit'
  const [ivaRetPercent, setIvaRetPercent] = useState(75); // 75% o 100%
  const [islrRetPercent, setIslrRetPercent] = useState(2); // Usualmente 2%
  const [currency, setCurrency] = useState('Bs'); // 'Bs' o 'USD'

  // Estados específicos para el modo Auditoría / Descifrar Pago
  const [auditBsPaid, setAuditBsPaid] = useState('');
  const [auditUsdTarget, setAuditUsdTarget] = useState('');
  const [calculatedAudit, setCalculatedAudit] = useState(null);

  useEffect(() => {
    fetchBCV();
  }, []);

  const fetchBCV = async () => {
    try {
      const savedRate = localStorage.getItem('sc_bcv');
      if (savedRate) {
        setBcvRate(savedRate.replace('.', ','));
      }
      
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

  const handleBcvChange = (e) => {
    const val = e.target.value.replace(/[^\d.,]/g, '');
    setBcvRate(val);
  };

  const handleBcvBlur = () => {
    let n = parseFlexNum(bcvRate);
    if (n > 0) {
      setBcvRate(n.toLocaleString('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 }));
      localStorage.setItem('sc_bcv', n.toString());
    }
  };

  const getBcvNumber = () => {
    let n = parseFlexNum(bcvRate);
    return n > 0 ? n : 1;
  };

  const currentRate = getBcvNumber();
  const formatMoney = (val) => Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatRate = (val) => Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

  // Cálculos modo normal
  const amountNum = parseFlexNum(inputAmount);
  let baseImponible = 0;
  let iva = 0;
  let retIva = 0;
  let retIslr = 0;
  let totalFactura = 0;
  let montoNeto = 0;

  const ivaRate = 0.16;
  const ivaRetRate = ivaRetPercent / 100;
  const islrRetRate = islrRetPercent / 100;

  if (amountNum > 0 && inputType !== 'audit') {
    if (inputType === 'gross') {
      totalFactura = amountNum;
      baseImponible = totalFactura / (1 + ivaRate);
      iva = baseImponible * ivaRate;
      retIva = iva * ivaRetRate;
      retIslr = baseImponible * islrRetRate;
      montoNeto = totalFactura - retIva - retIslr;
    } else {
      montoNeto = amountNum;
      const factor = (1 + ivaRate) - (ivaRate * ivaRetRate) - islrRetRate;
      baseImponible = montoNeto / factor;
      iva = baseImponible * ivaRate;
      retIva = iva * ivaRetRate;
      retIslr = baseImponible * islrRetRate;
      totalFactura = baseImponible + iva;
    }
  }

  const multiplier = currency === 'Bs' ? (1 / currentRate) : currentRate;
  const otherCurrency = currency === 'Bs' ? '$' : 'Bs';

  // Función explícita para calcular auditoría con botón
  const runAuditCalculation = () => {
    const paidBs = parseFlexNum(auditBsPaid);
    const targetUsd = parseFlexNum(auditUsdTarget);

    if (paidBs <= 0 || targetUsd <= 0) {
      toast.error('Por favor ingresa montos válidos en Bs y en $');
      return;
    }

    const implicitRate = paidBs / targetUsd;
    const totalFacturaBs = targetUsd * currentRate;
    const baseOficial = totalFacturaBs / 1.16;
    const ivaOficial = baseOficial * 0.16;

    const net75_2 = totalFacturaBs - (ivaOficial * 0.75) - (baseOficial * 0.02);
    const net100_2 = totalFacturaBs - (ivaOficial * 1.00) - (baseOficial * 0.02);
    const net75_0 = totalFacturaBs - (ivaOficial * 0.75);
    const net0_0 = totalFacturaBs;

    let scenario = null;
    const tolerance = 5.0; // tolerancia en Bs

    if (Math.abs(paidBs - net75_2) <= tolerance) {
      scenario = { 
        type: 'match_75_2',
        title: '✅ Retención 75% IVA + 2% ISLR (Tasa BCV del día)',
        match: true,
        retIva: ivaOficial * 0.75,
        retIslr: baseOficial * 0.02
      };
    } else if (Math.abs(paidBs - net100_2) <= tolerance) {
      scenario = { 
        type: 'match_100_2',
        title: '✅ Retención 100% IVA + 2% ISLR (Tasa BCV del día)',
        match: true,
        retIva: ivaOficial * 1.00,
        retIslr: baseOficial * 0.02
      };
    } else if (Math.abs(paidBs - net75_0) <= tolerance) {
      scenario = { 
        type: 'match_75_0',
        title: '✅ Retención 75% IVA (Sin ISLR a Tasa BCV)',
        match: true,
        retIva: ivaOficial * 0.75,
        retIslr: 0
      };
    } else if (Math.abs(paidBs - net0_0) <= tolerance) {
      scenario = { 
        type: 'match_0_0',
        title: '✅ Pago Completo 100% (Sin retenciones a tasa BCV)',
        match: true,
        retIva: 0,
        retIslr: 0
      };
    } else {
      // Tasa que usó asumiendo 75% IVA + 2% ISLR:
      // paidBs = targetUsd * tasa * ( (1/1.16) * (1.16 - 0.16*0.75 - 0.02) ) = targetUsd * tasa * (1.02 / 1.16)
      const inferredRateIf75_2 = paidBs / (targetUsd * (1.02 / 1.16));
      const diffBsVsExpected = paidBs - net75_2;

      scenario = {
        type: 'custom',
        title: '⚠️ Monto no coincide con las retenciones a tasa BCV de hoy',
        match: false,
        diffBs: diffBsVsExpected,
        inferredRate75_2: inferredRateIf75_2,
        estimatedRetIva: (paidBs / (1.02 / 1.16) / 1.16) * 0.16 * 0.75,
        estimatedRetIslr: (paidBs / (1.02 / 1.16) / 1.16) * 0.02
      };
    }

    setCalculatedAudit({
      paidBs,
      targetUsd,
      implicitRate,
      totalFacturaBs,
      net75_2,
      net100_2,
      net0_0,
      scenario
    });
  };

  return (
    <div className="animate-fade-in" style={{ padding: '24px', maxWidth: '1050px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Header Whitestamp */}
      <div style={{
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {toggleSidebar && (
            <button 
              onClick={toggleSidebar} 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                flexShrink: 0
              }}
              title="Abrir menú"
              type="button"
            >
              <PanelLeft size={18} />
            </button>
          )}
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-0.01em' }}>Calculadora de Retenciones</h2>
            <p style={{ color: '#64748b', margin: '3px 0 0 0', fontSize: '0.85rem' }}>Calcula facturas, retenciones y descifra pagos de clientes.</p>
          </div>
        </div>
        
        <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={16} color="#10b981" />
          <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 700 }}>Tasa BCV:</span>
          <input 
            type="text" 
            inputMode="decimal"
            value={bcvRate} 
            onChange={handleBcvChange}
            onBlur={handleBcvBlur}
            onFocus={(e) => e.target.select()}
            placeholder="0,0000"
            style={{ background: 'transparent', border: 'none', width: '85px', fontWeight: 800, color: '#065f46', outline: 'none' }}
          />
          <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Bs/$</span>
        </div>
      </div>

      {/* Selector de Modos */}
      <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#f1f5f9', padding: '0.35rem', borderRadius: '12px', marginBottom: '1.5rem', maxWidth: '580px', border: '1px solid #e2e8f0' }}>
        <button 
          onClick={() => setInputType('gross')}
          style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', backgroundColor: inputType === 'gross' ? '#ffffff' : 'transparent', boxShadow: inputType === 'gross' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: inputType === 'gross' ? '#0f172a' : '#64748b', transition: 'all 0.15s ease', border: 'none', cursor: 'pointer' }}
        >
          Monto Factura
        </button>
        <button 
          onClick={() => setInputType('net')}
          style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', backgroundColor: inputType === 'net' ? '#ffffff' : 'transparent', boxShadow: inputType === 'net' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: inputType === 'net' ? '#0f172a' : '#64748b', transition: 'all 0.15s ease', border: 'none', cursor: 'pointer' }}
        >
          Monto Pagado
        </button>
        <button 
          onClick={() => setInputType('audit')}
          style={{ flex: 1.2, padding: '0.6rem 0.75rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', backgroundColor: inputType === 'audit' ? '#10b981' : 'transparent', boxShadow: inputType === 'audit' ? '0 2px 4px rgba(16,185,129,0.25)' : 'none', color: inputType === 'audit' ? '#ffffff' : '#64748b', transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', border: 'none', cursor: 'pointer' }}
        >
          <ArrowRightLeft size={16} /> Descifrar Pago
        </button>
      </div>

      {inputType === 'audit' ? (
        /* VISTA MODO AUDITORÍA / DESCIFRAR PAGO */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Lado Izquierdo: Formulario Auditor */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#0f172a' }}>Descifrar Pago Incompleto</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                El cliente pagó en Bolívares pero no sabes qué retenciones aplicó ni qué tasa usó.
              </p>
            </div>

            <div>
              <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '4px' }}>Bolívares Transferidos por el Cliente</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="Ej: 3.958,33" 
                  className="input-field" 
                  value={auditBsPaid}
                  onChange={(e) => setAuditBsPaid(e.target.value.replace(/[^\d.,]/g, ''))}
                  style={{ fontSize: '1.2rem', fontWeight: 800, paddingRight: '2.5rem', width: '100%', height: '44px', padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748b' }}>Bs</span>
              </div>
            </div>

            <div>
              <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '4px' }}>Total de la Venta Esperada ($ Dólares)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="Ej: 5,80" 
                  className="input-field" 
                  value={auditUsdTarget}
                  onChange={(e) => setAuditUsdTarget(e.target.value.replace(/[^\d.,]/g, ''))}
                  style={{ fontSize: '1.2rem', fontWeight: 800, paddingRight: '2.5rem', width: '100%', height: '44px', padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                />
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#64748b' }}>$</span>
              </div>
            </div>

            <button 
              onClick={runAuditCalculation}
              className="btn-primary"
              style={{ padding: '0.85rem', width: '100%', borderRadius: '12px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.25)' }}
            >
              <CalcIcon size={18} /> CALCULAR DIAGNÓSTICO
            </button>
          </div>

          {/* Lado Derecho: Resultados Auditoría */}
          <div style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <ArrowRightLeft size={18} color="#10b981" /> Diagnóstico de Pago
            </h3>

            {calculatedAudit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Tasa directa vs Tasa BCV */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: 'white', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Tasa directa del pago:</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0284c7' }}>
                      {formatRate(calculatedAudit.implicitRate)} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Bs/$</span>
                    </div>
                  </div>

                  <div style={{ background: 'white', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Tasa BCV del día:</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#16a34a' }}>
                      {formatRate(currentRate)} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Bs/$</span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta de diagnóstico */}
                <div style={{ 
                  padding: '1.1rem', 
                  borderRadius: '0.75rem', 
                  border: calculatedAudit.scenario.match ? '1px solid #86efac' : '1px solid #fca5a5',
                  background: calculatedAudit.scenario.match ? '#f0fdf4' : '#fef2f2'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: calculatedAudit.scenario.match ? '#15803d' : '#b91c1c' }}>
                      {calculatedAudit.scenario.title}
                    </span>
                  </div>

                  {calculatedAudit.scenario.match ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: '#166534', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>(-) Retención IVA:</span>
                        <b>Bs. {formatMoney(calculatedAudit.scenario.retIva)}</b>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>(-) Retención ISLR:</span>
                        <b>Bs. {formatMoney(calculatedAudit.scenario.retIslr)}</b>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #86efac', paddingTop: '0.4rem', marginTop: '0.25rem', fontSize: '0.95rem' }}>
                        <span>Total que te retuvo el cliente:</span>
                        <b>Bs. {formatMoney(calculatedAudit.scenario.retIva + calculatedAudit.scenario.retIslr)}</b>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: '#991b1b', marginTop: '0.5rem', lineHeight: 1.5 }}>
                      <p style={{ marginBottom: '0.5rem' }}>
                        Si el cliente aplicó <strong>75% IVA + 2% ISLR</strong>, la tasa que utilizó para calcular fue de: <strong>{formatRate(calculatedAudit.scenario.inferredRate75_2)} Bs/$</strong>.
                      </p>
                      <div style={{ background: 'white', padding: '0.6rem', borderRadius: '0.35rem', border: '1px solid #fecaca' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span>Estimado Retención IVA (75%):</span>
                          <b>Bs. {formatMoney(calculatedAudit.scenario.estimatedRetIva)}</b>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Estimado Retención ISLR (2%):</span>
                          <b>Bs. {formatMoney(calculatedAudit.scenario.estimatedRetIslr)}</b>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Guía de montos esperados */}
                <div style={{ background: 'white', borderRadius: '0.75rem', border: '1px solid #e2e8f0', padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem' }}>
                    Guía de montos para ${calculatedAudit.targetUsd} a tasa BCV ({formatRate(currentRate)}):
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Total Factura (Sin retención):</span>
                      <span style={{ fontWeight: 700 }}>Bs. {formatMoney(calculatedAudit.totalFacturaBs)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#64748b' }}>Con 75% IVA + 2% ISLR:</span>
                      <span style={{ fontWeight: 700, color: '#0284c7' }}>Bs. {formatMoney(calculatedAudit.net75_2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0' }}>
                      <span style={{ color: '#64748b' }}>Con 100% IVA + 2% ISLR:</span>
                      <span style={{ fontWeight: 700, color: '#0284c7' }}>Bs. {formatMoney(calculatedAudit.net100_2)}</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', color: '#94a3b8', textAlign: 'center', gap: '0.75rem' }}>
                <CalcIcon size={40} style={{ opacity: 0.4 }} />
                <p style={{ fontSize: '0.9rem', maxWidth: '300px' }}>
                  Ingresa los datos a la izquierda y presiona <strong>"CALCULAR DIAGNÓSTICO"</strong>.
                </p>
              </div>
            )}

          </div>

        </div>
      ) : (
        /* VISTA MODO ESTÁNDAR (MONTO FACTURA / MONTO PAGADO) */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Lado Izquierdo: Controles */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div>
              <label className="input-label" style={{ marginBottom: '0.5rem', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>Tipo de cálculo</label>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                {inputType === 'gross' ? "Ingresa el total de la factura para saber cuánto debe pagarte el cliente tras retenciones." : "Ingresa lo que te pagó el cliente para saber por cuánto hacer la factura."}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 2 }}>
                <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '4px' }}>Monto</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  className="input-field"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="Ej. 100"
                  style={{ fontSize: '1.2rem', fontWeight: '800', width: '100%', height: '44px', padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '4px' }}>Moneda</label>
                <select className="input-field" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ fontSize: '1.1rem', fontWeight: '800', height: '44px', width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', outline: 'none', padding: '0 10px', boxSizing: 'border-box' }}>
                  <option value="Bs">Bs</option>
                  <option value="USD">$</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '4px' }}>% Retención IVA</label>
                <select className="input-field" value={ivaRetPercent} onChange={(e) => setIvaRetPercent(Number(e.target.value))} style={{ height: '42px', width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', outline: 'none', padding: '0 10px', fontWeight: 700, boxSizing: 'border-box' }}>
                  <option value={75}>75%</option>
                  <option value={100}>100%</option>
                  <option value={0}>0% (Sin Retención)</option>
                </select>
              </div>
              <div>
                <label className="input-label" style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '4px' }}>% Retención ISLR</label>
                <select className="input-field" value={islrRetPercent} onChange={(e) => setIslrRetPercent(Number(e.target.value))} style={{ height: '42px', width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', outline: 'none', padding: '0 10px', fontWeight: 700, boxSizing: 'border-box' }}>
                  <option value={2}>2%</option>
                  <option value={1}>1%</option>
                  <option value={3}>3%</option>
                  <option value={5}>5%</option>
                  <option value={0}>0% (Sin Retención)</option>
                </select>
              </div>
            </div>
            
          </div>

          {/* Lado Derecho: Resultados */}
          <div style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <CalcIcon size={18} color="#10b981" /> Desglose de Factura
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Base Imponible:</span>
                <span style={{ fontWeight: '800', color: '#0f172a' }}>{formatMoney(baseImponible)} {currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>IVA (16%):</span>
                <span style={{ fontWeight: '800', color: '#0f172a' }}>{formatMoney(iva)} {currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '2px solid #e2e8f0', fontSize: '1.05rem' }}>
                <span style={{ color: '#0f172a', fontWeight: 800 }}>TOTAL FACTURA:</span>
                <span style={{ fontWeight: '900', color: '#0f172a' }}>{formatMoney(totalFactura)} {currency}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', marginTop: '0.25rem' }}>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>(-) Retención IVA ({ivaRetPercent}%):</span>
                <span style={{ fontWeight: '800', color: '#ef4444' }}>- {formatMoney(retIva)} {currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '2px solid #e2e8f0' }}>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>(-) Retención ISLR ({islrRetPercent}%):</span>
                <span style={{ fontWeight: '800', color: '#ef4444' }}>- {formatMoney(retIslr)} {currency}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', fontSize: '1.25rem' }}>
                <span style={{ color: '#059669', fontWeight: 800 }}>MONTO A PAGAR:</span>
                <span style={{ fontWeight: '900', color: '#059669' }}>{formatMoney(montoNeto)} {currency}</span>
              </div>

              {/* Equivalente en la otra moneda */}
              {amountNum > 0 && (
                <div style={{ marginTop: '0.75rem', padding: '14px', backgroundColor: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                  <p style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: 700, margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>Equivalente en {otherCurrency}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#065f46' }}>Total Factura:</span>
                    <span style={{ fontWeight: '800', color: '#065f46' }}>{formatMoney(totalFactura * multiplier)} {otherCurrency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#065f46' }}>Monto a Pagar:</span>
                    <span style={{ fontWeight: '800', color: '#065f46' }}>{formatMoney(montoNeto * multiplier)} {otherCurrency}</span>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
