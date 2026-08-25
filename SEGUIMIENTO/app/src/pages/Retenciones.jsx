import React, { useState, useEffect } from 'react';
import { Calculator as CalcIcon, DollarSign, Percent, ArrowRightLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

export default function Retenciones() {
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
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1050px', width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Calculadora de Retenciones</h2>
          <p style={{ color: 'var(--text-muted)' }}>Calcula facturas, retenciones y descifra pagos de clientes.</p>
        </div>
        
        <div style={{ background: '#f0fdf4', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={16} color="#16a34a" />
          <span style={{ fontSize: '0.875rem', color: '#166534', fontWeight: 600 }}>Tasa BCV:</span>
          <input 
            type="text" 
            inputMode="decimal"
            value={bcvRate} 
            onChange={handleBcvChange}
            onBlur={handleBcvBlur}
            onFocus={(e) => e.target.select()}
            placeholder="0,0000"
            style={{ background: 'transparent', border: 'none', width: '85px', fontWeight: 'bold', color: '#166534', outline: 'none' }}
          />
          <span style={{ fontSize: '0.875rem', color: '#166534' }}>Bs/$</span>
        </div>
      </div>

      {/* Selector de Modos */}
      <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#e2e8f0', padding: '0.35rem', borderRadius: '0.75rem', marginBottom: '1.5rem', maxWidth: '580px' }}>
        <button 
          onClick={() => setInputType('gross')}
          style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.85rem', backgroundColor: inputType === 'gross' ? '#fff' : 'transparent', boxShadow: inputType === 'gross' ? 'var(--shadow-sm)' : 'none', color: inputType === 'gross' ? '#0f172a' : '#64748b', transition: 'all 0.2s' }}
        >
          Monto Factura
        </button>
        <button 
          onClick={() => setInputType('net')}
          style={{ flex: 1, padding: '0.6rem 0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.85rem', backgroundColor: inputType === 'net' ? '#fff' : 'transparent', boxShadow: inputType === 'net' ? 'var(--shadow-sm)' : 'none', color: inputType === 'net' ? '#0f172a' : '#64748b', transition: 'all 0.2s' }}
        >
          Monto Pagado
        </button>
        <button 
          onClick={() => setInputType('audit')}
          style={{ flex: 1.2, padding: '0.6rem 0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.85rem', backgroundColor: inputType === 'audit' ? 'var(--primary)' : 'transparent', boxShadow: inputType === 'audit' ? 'var(--shadow-sm)' : 'none', color: inputType === 'audit' ? '#1F2329' : '#64748b', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
        >
          <ArrowRightLeft size={16} /> Descifrar Pago
        </button>
      </div>

      {inputType === 'audit' ? (
        /* VISTA MODO AUDITORÍA / DESCIFRAR PAGO */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
          
          {/* Lado Izquierdo: Formulario de Auditoría */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>Datos de la Operación</h3>
            
            <div>
              <label className="input-label">1. Monto transferido por el cliente (Bs)</label>
              <input 
                type="text"
                inputMode="decimal"
                className="input-field"
                value={auditBsPaid}
                onChange={(e) => setAuditBsPaid(e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder="Ej. 10221.55"
                style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Puedes usar punto o coma para decimales (ej. 10221.55)</span>
            </div>

            <div>
              <label className="input-label">2. Monto acordado en Dólares ($)</label>
              <input 
                type="text"
                inputMode="decimal"
                className="input-field"
                value={auditUsdTarget}
                onChange={(e) => setAuditUsdTarget(e.target.value.replace(/[^\d.,]/g, ''))}
                placeholder="Ej. 168.01"
                style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Precio o presupuesto del trabajo (ej. 168.01)</span>
            </div>

            <button
              onClick={runAuditCalculation}
              style={{
                background: 'var(--primary)',
                color: '#1F2329',
                fontWeight: 800,
                fontSize: '1rem',
                padding: '0.85rem',
                borderRadius: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-md)',
                marginTop: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <CalcIcon size={20} />
              CALCULAR DIAGNÓSTICO
            </button>
          </div>

          {/* Lado Derecho: Resultados del Análisis */}
          <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalcIcon size={20} /> Diagnóstico del Pago
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
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label className="input-label" style={{ marginBottom: '0.5rem' }}>Tipo de cálculo</label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {inputType === 'gross' ? "Ingresa el total de la factura para saber cuánto debe pagarte el cliente tras retenciones." : "Ingresa lo que te pagó el cliente para saber por cuánto hacer la factura."}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 2 }}>
                <label className="input-label">Monto</label>
                <input 
                  type="text"
                  inputMode="decimal"
                  className="input-field"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                  placeholder="Ej. 100"
                  style={{ fontSize: '1.25rem', fontWeight: 'bold' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="input-label">Moneda</label>
                <select className="input-field" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ fontSize: '1.25rem', fontWeight: 'bold', padding: '0.65rem' }}>
                  <option value="Bs">Bs</option>
                  <option value="USD">$</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="input-label">% Retención IVA</label>
                <select className="input-field" value={ivaRetPercent} onChange={(e) => setIvaRetPercent(Number(e.target.value))}>
                  <option value={75}>75%</option>
                  <option value={100}>100%</option>
                  <option value={0}>0% (Sin Retención)</option>
                </select>
              </div>
              <div>
                <label className="input-label">% Retención ISLR</label>
                <select className="input-field" value={islrRetPercent} onChange={(e) => setIslrRetPercent(Number(e.target.value))}>
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
          <div className="glass-card" style={{ padding: '1.5rem', backgroundColor: '#f8fafc' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalcIcon size={20} /> Desglose
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Base Imponible:</span>
                <span style={{ fontWeight: 'bold' }}>{formatMoney(baseImponible)} {currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>IVA (16%):</span>
                <span style={{ fontWeight: 'bold' }}>{formatMoney(iva)} {currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '2px solid #cbd5e1', fontSize: '1.125rem' }}>
                <span style={{ color: '#0f172a', fontWeight: 'bold' }}>TOTAL FACTURA:</span>
                <span style={{ fontWeight: '900', color: '#0f172a' }}>{formatMoney(totalFactura)} {currency}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>(-) Retención IVA ({ivaRetPercent}%):</span>
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>- {formatMoney(retIva)} {currency}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '2px solid #cbd5e1' }}>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>(-) Retención ISLR ({islrRetPercent}%):</span>
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>- {formatMoney(retIslr)} {currency}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', fontSize: '1.25rem' }}>
                <span style={{ color: '#16a34a', fontWeight: 'bold' }}>MONTO A PAGAR:</span>
                <span style={{ fontWeight: '900', color: '#16a34a' }}>{formatMoney(montoNeto)} {currency}</span>
              </div>

              {/* Equivalente en la otra moneda */}
              {amountNum > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e0f2fe', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                  <p style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: 600, marginBottom: '0.5rem' }}>Equivalente en {otherCurrency}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#0c4a6e' }}>Total Factura:</span>
                    <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>{formatMoney(totalFactura * multiplier)} {otherCurrency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#0c4a6e' }}>Monto a Pagar:</span>
                    <span style={{ fontWeight: 'bold', color: '#0c4a6e' }}>{formatMoney(montoNeto * multiplier)} {otherCurrency}</span>
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
