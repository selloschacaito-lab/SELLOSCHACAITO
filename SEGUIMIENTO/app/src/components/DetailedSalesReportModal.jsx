import React, { useState, useMemo, useCallback } from 'react';
import { X, Copy, Download, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function getLocalDateStr(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fmtDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function fmtDateTime(dateInput) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmtDurationHours(hours) {
  if (hours === null || hours === undefined || isNaN(hours)) return '-';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function includesFeliz(name) {
  return (name || '').toLowerCase().includes('feliz');
}

const STATUS_LABELS = {
  fina: 'Pagado',
  printing: 'Impresión',
  production: 'Producción',
  finished: 'Finalizado',
  packed: 'Empacado',
  delivered: 'Entregado',
  design_sent: 'Diseño Enviado',
  waiting_payment: 'Esperando Pago'
};

// Reporte detallado de ventas, totalmente aparte del "Reporte a Rafael"
// (ese es un resumen corto para WhatsApp; este es el desglose completo
// para uso interno de Álvaro): totales, por diseñador, por método de
// pago, por tipo de entrega, productos más vendidos, y el detalle de
// cada venta — para un día puntual o un rango de fechas.
export default function DetailedSalesReportModal({ paidSales, allOrdersList, onClose }) {
  const [mode, setMode] = useState('day'); // 'day' | 'range'
  const [dayValue, setDayValue] = useState(getLocalDateStr(new Date()));
  const [rangeFrom, setRangeFrom] = useState(getLocalDateStr(new Date()));
  const [rangeTo, setRangeTo] = useState(getLocalDateStr(new Date()));

  const isInPeriod = useCallback((dateInput) => {
    const d = getLocalDateStr(dateInput);
    if (!d) return false;
    if (mode === 'day') return d === dayValue;
    if (!rangeFrom || !rangeTo) return false;
    return d >= rangeFrom && d <= rangeTo;
  }, [mode, dayValue, rangeFrom, rangeTo]);

  const filteredSales = useMemo(() => {
    return paidSales.filter(o => isInPeriod(o.paidAt || o.createdAt))
      .sort((a, b) => new Date(a.paidAt || a.createdAt) - new Date(b.paidAt || b.createdAt));
  }, [paidSales, isInPeriod]);

  // Producción de Felizai: se mide por evento (quién hizo la transición y
  // cuándo), no por venta — un pedido puede quedar "terminado" un día
  // distinto al que se pagó, así que se filtra por su propia fecha, igual
  // que ya hace Estadísticas con finishedBy.
  const felizai = useMemo(() => {
    const list = allOrdersList || [];
    const printedOrders = list.filter(o => o.printedAt && isInPeriod(o.printedAt) && includesFeliz(o.printedBy));
    const productionOrders = list.filter(o => o.productionStartedAt && isInPeriod(o.productionStartedAt) && includesFeliz(o.productionStartedBy));
    const finishedOrders = list.filter(o => o.finishedAt && isInPeriod(o.finishedAt) && includesFeliz(o.finishedBy))
      .sort((a, b) => new Date(a.finishedAt) - new Date(b.finishedAt));

    let laserCount = 0, normalCount = 0;
    let totalProdMs = 0, countProd = 0;
    let totalFullMs = 0, countFull = 0;

    const detailRows = finishedOrders.map(o => {
      if (o.isLaser) laserCount++; else normalCount++;

      let prodHours = null;
      if (o.printedAt) {
        const p = new Date(o.printedAt).getTime(), f = new Date(o.finishedAt).getTime();
        if (f >= p) { prodHours = (f - p) / (1000 * 60 * 60); totalProdMs += (f - p); countProd++; }
      }
      let fullHours = null;
      if (o.paidAt) {
        const pa = new Date(o.paidAt).getTime(), f = new Date(o.finishedAt).getTime();
        if (f >= pa) { fullHours = (f - pa) / (1000 * 60 * 60); totalFullMs += (f - pa); countFull++; }
      }

      return {
        orderNumber: o.orderNumber || o.id,
        clientName: o.clientName || 'Sin Nombre',
        printedAt: o.printedAt,
        finishedAt: o.finishedAt,
        prodHours,
        fullHours,
        isLaser: Boolean(o.isLaser)
      };
    });

    return {
      printedCount: printedOrders.length,
      productionCount: productionOrders.length,
      finishedCount: finishedOrders.length,
      laserCount,
      normalCount,
      avgProdHours: countProd > 0 ? totalProdMs / countProd / (1000 * 60 * 60) : null,
      avgFullHours: countFull > 0 ? totalFullMs / countFull / (1000 * 60 * 60) : null,
      detailRows
    };
  }, [allOrdersList, isInPeriod]);

  const report = useMemo(() => {
    let totalUSD = 0, totalBs = 0;
    const byDesigner = {};
    const byMethod = {};
    const byDelivery = {};
    const productCounts = {};

    for (const o of filteredSales) {
      totalUSD += Number(o.totalAmount) || 0;
      totalBs += Number(o.totalAmountBs) || Number(o.subtotalBs) || 0;

      const designer = o.designer || 'Sin asignar';
      byDesigner[designer] = byDesigner[designer] || { count: 0, usd: 0 };
      byDesigner[designer].count++;
      byDesigner[designer].usd += Number(o.totalAmount) || 0;

      const method = o.paymentMethod || 'Sin especificar';
      byMethod[method] = byMethod[method] || { count: 0, usd: 0 };
      byMethod[method].count++;
      byMethod[method].usd += Number(o.totalAmount) || 0;

      const delivery = o.hasDelivery ? (o.deliveryType || 'delivery') : 'pickup';
      byDelivery[delivery] = (byDelivery[delivery] || 0) + 1;

      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items) {
        const name = it.nombre || it.name || 'Producto sin nombre';
        productCounts[name] = (productCounts[name] || 0) + (Number(it.cantidad) || 1);
      }
    }

    const porPagar = byMethod['Por Pagar'] || { count: 0, usd: 0 };
    const ticketProm = filteredSales.length > 0 ? totalUSD / filteredSales.length : 0;
    const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]);

    return { totalUSD, totalBs, ticketProm, byDesigner, byMethod, byDelivery, porPagar, topProducts };
  }, [filteredSales]);

  const periodLabel = mode === 'day'
    ? fmtDateDisplay(dayValue)
    : `${fmtDateDisplay(rangeFrom)} — ${fmtDateDisplay(rangeTo)}`;

  const buildReportText = () => {
    let t = `REPORTE DETALLADO DE VENTAS\nSellos Chacaíto — ${periodLabel}\n`;
    t += '='.repeat(40) + '\n\n';

    if (filteredSales.length === 0) {
      t += 'No hay ventas registradas en este período.\n';
    } else {
      t += `TOTALES\n`;
      t += `Ventas: ${filteredSales.length}\n`;
      t += `Total USD: $${fmt(report.totalUSD)}\n`;
      t += `Total Bs: Bs. ${fmt(report.totalBs)}\n`;
      t += `Ticket promedio: $${fmt(report.ticketProm)}\n`;
      if (report.porPagar.count > 0) {
        t += `Por Pagar (crédito, no cobrado aún): ${report.porPagar.count} ventas — $${fmt(report.porPagar.usd)}\n`;
      }

      t += `\nPOR DISEÑADOR\n`;
      for (const [name, v] of Object.entries(report.byDesigner)) {
        t += `- ${name}: ${v.count} ventas — $${fmt(v.usd)}\n`;
      }

      t += `\nPOR MÉTODO DE PAGO\n`;
      for (const [name, v] of Object.entries(report.byMethod)) {
        t += `- ${name}: ${v.count} ventas — $${fmt(v.usd)}\n`;
      }

      t += `\nENTREGA\n`;
      for (const [name, count] of Object.entries(report.byDelivery)) {
        t += `- ${name}: ${count}\n`;
      }

      if (report.topProducts.length > 0) {
        t += `\nPRODUCTOS VENDIDOS\n`;
        for (const [name, qty] of report.topProducts) {
          t += `- ${name}: ${qty}\n`;
        }
      }

      t += `\nDETALLE DE CADA VENTA\n`;
      for (const o of filteredSales) {
        const estado = STATUS_LABELS[o.status] || o.status || '-';
        t += `#${o.orderNumber || o.id} | ${o.clientName || 'Sin Nombre'} | $${fmt(o.totalAmount)} | ${o.paymentMethod || '-'} | ${estado}\n`;
      }
    }

    t += `\nFELIZAI — PRODUCCIÓN\n`;
    t += `Pasó a Producción: ${felizai.productionCount}\n`;
    t += `Marcó Impreso: ${felizai.printedCount}\n`;
    t += `Terminó: ${felizai.finishedCount} (Láser: ${felizai.laserCount} · Normal: ${felizai.normalCount})\n`;
    t += `Tiempo prom. de producción (Impreso → Terminado): ${fmtDurationHours(felizai.avgProdHours)}\n`;
    t += `Tiempo prom. total (Pagado → Terminado): ${fmtDurationHours(felizai.avgFullHours)}\n`;
    if (felizai.detailRows.length > 0) {
      t += `\nDetalle de lo que terminó Felizai:\n`;
      for (const r of felizai.detailRows) {
        t += `#${r.orderNumber} | ${r.clientName} | ${fmtDateTime(r.printedAt)} → ${fmtDateTime(r.finishedAt)} | ${fmtDurationHours(r.prodHours)} | ${r.isLaser ? 'Láser' : 'Normal'}\n`;
      }
    }

    t += `\nGenerado desde el sistema.\n`;
    return t;
  };

  const handleCopy = async () => {
    const text = buildReportText();
    try {
      await navigator.clipboard.writeText(text);
      toast.success('¡Reporte copiado al portapapeles!');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo copiar el reporte.');
    }
  };

  const handleDownload = () => {
    const text = buildReportText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const suffix = mode === 'day' ? dayValue : `${rangeFrom}_a_${rangeTo}`;
    a.href = url;
    a.download = `reporte_ventas_${suffix}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>

        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={22} color="#3b82f6" />
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Reporte Detallado de Ventas</h2>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '2px 0 0' }}>{filteredSales.length} venta{filteredSales.length !== 1 ? 's' : ''} — {periodLabel}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#475569', display: 'flex' }}><X size={22} /></button>
        </div>

        {/* Selector de período */}
        <div style={{ padding: '12px 24px', display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setMode('day')}
              style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', background: mode === 'day' ? '#1e293b' : '#fff', border: '1px solid ' + (mode === 'day' ? '#1e293b' : '#cbd5e1'), color: mode === 'day' ? '#fff' : '#475569' }}
            >
              Un día
            </button>
            <button
              type="button"
              onClick={() => setMode('range')}
              style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '6px', cursor: 'pointer', background: mode === 'range' ? '#1e293b' : '#fff', border: '1px solid ' + (mode === 'range' ? '#1e293b' : '#cbd5e1'), color: mode === 'range' ? '#fff' : '#475569' }}
            >
              Rango de fechas
            </button>
          </div>

          {mode === 'day' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} style={{ color: '#64748b' }} />
              <input type="date" value={dayValue} onChange={e => setDayValue(e.target.value)} style={{ padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }} />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Desde:</span>
                <input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} style={{ padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Hasta:</span>
                <input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)} style={{ padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }} />
              </div>
            </>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopy}
              disabled={filteredSales.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', cursor: filteredSales.length === 0 ? 'not-allowed' : 'pointer', background: '#fff', border: '1px solid #cbd5e1', color: '#475569', opacity: filteredSales.length === 0 ? 0.5 : 1 }}
            >
              <Copy size={14} /> Copiar
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={filteredSales.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', cursor: filteredSales.length === 0 ? 'not-allowed' : 'pointer', background: '#1e293b', border: 'none', color: '#fff', opacity: filteredSales.length === 0 ? 0.5 : 1 }}
            >
              <Download size={14} /> Descargar
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>

          {filteredSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
              No hay ventas registradas en este período.
            </div>
          ) : (
            <>

              {/* Totales */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <StatBox label="Ventas" value={filteredSales.length} />
                <StatBox label="Total USD" value={`$${fmt(report.totalUSD)}`} highlight />
                <StatBox label="Total Bs" value={`Bs ${fmt(report.totalBs)}`} />
                <StatBox label="Ticket promedio" value={`$${fmt(report.ticketProm)}`} />
                {report.porPagar.count > 0 && (
                  <StatBox label="Por Pagar (crédito)" value={`${report.porPagar.count} · $${fmt(report.porPagar.usd)}`} warn />
                )}
              </div>

              <Section title="Por diseñador">
                <SimpleTable
                  rows={Object.entries(report.byDesigner).map(([name, v]) => [name, v.count, `$${fmt(v.usd)}`])}
                  headers={['Diseñador', 'Ventas', 'Monto']}
                />
              </Section>

              <Section title="Por método de pago">
                <SimpleTable
                  rows={Object.entries(report.byMethod).map(([name, v]) => [name, v.count, `$${fmt(v.usd)}`])}
                  headers={['Método', 'Ventas', 'Monto']}
                />
              </Section>

              <Section title="Entrega">
                <SimpleTable
                  rows={Object.entries(report.byDelivery).map(([name, count]) => [name, count])}
                  headers={['Tipo', 'Cantidad']}
                />
              </Section>

              {report.topProducts.length > 0 && (
                <Section title="Productos vendidos">
                  <SimpleTable
                    rows={report.topProducts.map(([name, qty]) => [name, qty])}
                    headers={['Producto', 'Cantidad']}
                  />
                </Section>
              )}

              <Section title="Detalle de cada venta">
                <SimpleTable
                  rows={filteredSales.map(o => [
                    o.orderNumber || o.id,
                    o.clientName || 'Sin Nombre',
                    `$${fmt(o.totalAmount)}`,
                    o.paymentMethod || '-',
                    STATUS_LABELS[o.status] || o.status || '-'
                  ])}
                  headers={['# Pedido', 'Cliente', 'Monto', 'Método', 'Estado']}
                />
              </Section>

            </>
          )}

          {/* Producción de Felizai — siempre visible, aunque sea 0, para que
              quede claro cuando no hubo actividad de ella en el período */}
          <Section title="Felizai · Producción">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <StatBox label="Pasó a Producción" value={felizai.productionCount} />
              <StatBox label="Marcó Impreso" value={felizai.printedCount} />
              <StatBox label="Terminó" value={felizai.finishedCount} highlight />
              <StatBox label="Láser / Normal" value={`${felizai.laserCount} / ${felizai.normalCount}`} />
              <StatBox label="Tiempo prom. producción" value={fmtDurationHours(felizai.avgProdHours)} />
              <StatBox label="Tiempo prom. total (pago→fin)" value={fmtDurationHours(felizai.avgFullHours)} />
            </div>
            <SimpleTable
              rows={felizai.detailRows.map(r => [
                r.orderNumber,
                r.clientName,
                fmtDateTime(r.printedAt),
                fmtDateTime(r.finishedAt),
                fmtDurationHours(r.prodHours),
                r.isLaser ? 'Láser' : 'Normal'
              ])}
              headers={['# Pedido', 'Cliente', 'Impreso', 'Terminado', 'Duración', 'Tipo']}
            />
          </Section>

          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight, warn }) {
  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: '10px',
      background: warn ? '#fffbeb' : highlight ? '#eff6ff' : '#f8fafc',
      border: `1px solid ${warn ? '#fde68a' : highlight ? '#bfdbfe' : '#e2e8f0'}`
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 800, color: warn ? '#92400e' : highlight ? '#1e40af' : '#0f172a', marginTop: '2px' }}>{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#334155', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{title}</h3>
      {children}
    </div>
  );
}

function SimpleTable({ headers, rows }) {
  if (rows.length === 0) {
    return <div style={{ fontSize: '12.5px', color: '#94a3b8', padding: '8px 0' }}>Sin datos.</div>;
  }
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#64748b', fontWeight: 700, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '8px 10px', color: '#334155' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
