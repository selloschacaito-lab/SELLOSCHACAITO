import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  DollarSign, 
  User, 
  Layers, 
  TrendingUp, 
  ArrowRight,
  Printer,
  ExternalLink,
  Ban
} from 'lucide-react';
import '../styles/whitestamp.css';

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function getLocalMonthStr(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatDuration(ms) {
  if (!ms || isNaN(ms) || ms <= 0) return '-';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  }
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins} min`;
}

const STATUS_LABELS = {
  design_sent: { name: 'Iniciado', bg: '#eff6ff', color: '#1d4ed8' },
  waiting_payment: { name: 'Por Cobrar', bg: '#fef3c7', color: '#b45309' },
  fina: { name: 'Pagado', bg: '#dcfce7', color: '#15803d' },
  printing: { name: 'Impresión', bg: '#ffedd5', color: '#c2410c' },
  production: { name: 'Producción', bg: '#e0e7ff', color: '#4338ca' },
  finished: { name: 'Terminado', bg: '#ecfdf5', color: '#047857' },
  packed: { name: 'Empacado', bg: '#fae8ff', color: '#a21caf' },
  delivered: { name: 'Entregado', bg: '#f1f5f9', color: '#475569' },
  cancelled: { name: 'Descartado', bg: '#fee2e2', color: '#b91c1c' }
};

export default function AuditOrdersModal({ advisorName, allOrders = [], onClose }) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'PAID', 'IN_PROGRESS', 'INVOICED', 'CANCELLED'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Available months list
  const monthsList = useMemo(() => {
    const set = new Set();
    allOrders.forEach(o => {
      const d = getLocalMonthStr(o.createdAt || o.paidAt);
      if (d && d.length === 7) set.add(d);
    });
    const arr = Array.from(set).sort().reverse();
    const currentMonth = getLocalMonthStr(new Date());
    if (!arr.includes(currentMonth)) arr.unshift(currentMonth);
    return arr;
  }, [allOrders]);

  const [selectedMonth, setSelectedMonth] = useState(monthsList[0] || getLocalMonthStr(new Date()));

  // Filter orders matching advisor and selected month
  const advisorOrders = useMemo(() => {
    const advTarget = (advisorName || '').toUpperCase().trim();
    
    return allOrders.filter(o => {
      if (!o) return false;
      const orderDate = getLocalMonthStr(o.createdAt || o.paidAt);
      if (selectedMonth !== 'ALL_TIME' && orderDate !== selectedMonth) return false;

      const v = (o.vendedor || o.createdBy || o.designer || '').toUpperCase().trim();
      if (advTarget.includes('ACEVEDO') || advTarget.includes('ALVARO')) {
        return v.includes('ALVARO') || v.includes('ACEVEDO') || (!v.includes('KRIZ') && v !== 'BRIGETHE' && v !== 'ABRIL');
      }
      if (advTarget.includes('KRIZ')) {
        return v.includes('KRIZ');
      }
      return v === advTarget;
    }).sort((a, b) => new Date(b.createdAt || b.paidAt || 0) - new Date(a.createdAt || a.paidAt || 0));
  }, [allOrders, advisorName, selectedMonth]);

  // Advisor KPIs
  const kpis = useMemo(() => {
    let totalUSD = 0;
    let totalBs = 0;
    let paidCount = 0;
    let initiatedCount = advisorOrders.length;
    let invoicedCount = 0;
    let cancelledCount = 0;

    let totalLeadToPaidMs = 0;
    let countLeadToPaid = 0;

    let totalPaidToPrintMs = 0;
    let countPaidToPrint = 0;

    let totalFinishToDeliveredMs = 0;
    let countFinishToDelivered = 0;

    advisorOrders.forEach(o => {
      const isCancelled = o.status === 'cancelled' || o.isCancelled;
      if (isCancelled) {
        cancelledCount++;
      }

      const isPaid = (
        o.status === 'fina' || 
        o.hasFinaReceipt === true || 
        Boolean(o.paidAt && Number(o.totalAmount || 0) > 0) ||
        (o.status === 'delivered' && Number(o.totalAmount || 0) > 0) ||
        (Number(o.totalAmount || 0) > 0 && Boolean(o.paymentMethod) && o.status !== 'design_sent' && !isCancelled)
      );

      if (isPaid && !isCancelled) {
        paidCount++;
        totalUSD += Number(o.totalAmount) || 0;
        totalBs += Number(o.totalAmountBs) || Number(o.subtotalBs) || 0;

        if (o.isInvoiced) invoicedCount++;

        // Time 1: Lead created -> Paid
        if (o.createdAt && o.paidAt) {
          const cTime = new Date(o.createdAt).getTime();
          const pTime = new Date(o.paidAt).getTime();
          if (pTime >= cTime) {
            totalLeadToPaidMs += (pTime - cTime);
            countLeadToPaid++;
          }
        }

        // Time 2: Paid -> Printing
        if (o.paidAt && o.printedAt) {
          const pTime = new Date(o.paidAt).getTime();
          const prTime = new Date(o.printedAt).getTime();
          if (prTime >= pTime) {
            totalPaidToPrintMs += (prTime - pTime);
            countPaidToPrint++;
          }
        }

        // Time 3: Finished -> Delivered
        if (o.finishedAt && o.deliveredAt) {
          const fTime = new Date(o.finishedAt).getTime();
          const dTime = new Date(o.deliveredAt).getTime();
          if (dTime >= fTime) {
            totalFinishToDeliveredMs += (dTime - fTime);
            countFinishToDelivered++;
          }
        }
      }
    });

    const conversionRate = initiatedCount > 0 ? Math.round((paidCount / initiatedCount) * 100) : 0;

    return {
      totalUSD,
      totalBs,
      paidCount,
      initiatedCount,
      invoicedCount,
      cancelledCount,
      conversionRate,
      avgLeadToPaid: countLeadToPaid > 0 ? totalLeadToPaidMs / countLeadToPaid : null,
      avgPaidToPrint: countPaidToPrint > 0 ? totalPaidToPrintMs / countPaidToPrint : null,
      avgFinishToDelivered: countFinishToDelivered > 0 ? totalFinishToDeliveredMs / countFinishToDelivered : null
    };
  }, [advisorOrders]);

  // Tab Filtered Orders
  const filteredList = useMemo(() => {
    return advisorOrders.filter(o => {
      const isCancelled = o.status === 'cancelled' || o.isCancelled;
      const isPaid = (
        o.status === 'fina' || 
        o.hasFinaReceipt === true || 
        Boolean(o.paidAt && Number(o.totalAmount || 0) > 0) ||
        (o.status === 'delivered' && Number(o.totalAmount || 0) > 0) ||
        (Number(o.totalAmount || 0) > 0 && Boolean(o.paymentMethod) && o.status !== 'design_sent' && !isCancelled)
      );

      if (filterType === 'PAID' && (!isPaid || isCancelled)) return false;
      if (filterType === 'IN_PROGRESS' && (isPaid || isCancelled)) return false;
      if (filterType === 'INVOICED' && !o.isInvoiced) return false;
      if (filterType === 'CANCELLED' && !isCancelled) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesClient = (o.clientName || '').toLowerCase().includes(q);
        const matchesNum = (o.orderNumber || o.id || '').toLowerCase().includes(q);
        const matchesPhone = (o.whatsapp || '').includes(q);
        if (!matchesClient && !matchesNum && !matchesPhone) return false;
      }

      return true;
    });
  }, [advisorOrders, filterType, searchTerm]);

  return createPortal(
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
      >
        
        {/* Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 900
            }}>
              {advisorName.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                  Auditoría de Ventas: {advisorName}
                </h2>
                <span style={{ fontSize: '11px', fontWeight: 800, background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
                  Auditoría Mensual
                </span>
              </div>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0', fontWeight: 500 }}>
                Control detallado de órdenes, facturación fiscal, cancelaciones y tiempos de atención
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Month Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '4px 10px' }}>
              <Calendar size={15} color="#64748b" />
              <select 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 700, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL_TIME">Todo el Historial</option>
                {monthsList.map(m => (
                  <option key={m} value={m}>Mes: {m}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={onClose}
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Top Summary KPI Cards */}
        <div style={{
          padding: '16px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          background: '#ffffff',
          borderBottom: '1px solid #f1f5f9'
        }}>
          
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Facturado</span>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981', margin: '2px 0 0' }}>
              ${fmt(kpis.totalUSD)}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Bs. {fmt(kpis.totalBs)}</span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Recibos Pagados</span>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: '2px 0 0' }}>
              {kpis.paidCount} ventas
            </div>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{kpis.conversionRate}% conversión</span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Iniciados / Leads</span>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#2563eb', margin: '2px 0 0' }}>
              {kpis.initiatedCount} clientes
            </div>
            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>{kpis.cancelledCount} descartados</span>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Factura Fiscal SENIAT</span>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#8b5cf6', margin: '2px 0 0' }}>
              {kpis.invoicedCount} facturados
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{kpis.paidCount - kpis.invoicedCount} sin factura</span>
          </div>

          {/* Time KPIs */}
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '14px', padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>⏱️ Tiempos Promedio</span>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginTop: '4px', lineHeight: 1.4 }}>
              <div>Inicio ➔ Pago: <b>{formatDuration(kpis.avgLeadToPaid)}</b></div>
              <div>Pago ➔ Impresión: <b>{formatDuration(kpis.avgPaidToPrint)}</b></div>
            </div>
          </div>

        </div>

        {/* Filter Pills & Search */}
        <div style={{
          padding: '14px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[
              { id: 'ALL', label: `Todos (${advisorOrders.length})` },
              { id: 'PAID', label: `Pagados (${kpis.paidCount})` },
              { id: 'IN_PROGRESS', label: `En Proceso (${kpis.initiatedCount - kpis.paidCount - kpis.cancelledCount})` },
              { id: 'INVOICED', label: `Facturados SENIAT (${kpis.invoicedCount})` },
              { id: 'CANCELLED', label: `Descartados (${kpis.cancelledCount})` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: filterType === tab.id ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                  background: filterType === tab.id ? '#ecfdf5' : '#ffffff',
                  color: filterType === tab.id ? '#065f46' : '#64748b',
                  fontSize: '12px',
                  fontWeight: filterType === tab.id ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input 
              type="search"
              placeholder="Buscar por cliente o recibo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                padding: '0 10px 0 32px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                fontWeight: 600,
                outline: 'none',
                background: '#ffffff'
              }}
            />
          </div>

        </div>

        {/* Orders Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 28px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 8px' }}># Recibo</th>
                <th style={{ padding: '14px 8px' }}>Cliente</th>
                <th style={{ padding: '14px 8px' }}>Monto ($ / Bs)</th>
                <th style={{ padding: '14px 8px' }}>Estado</th>
                <th style={{ padding: '14px 8px' }}>Factura Fiscal</th>
                <th style={{ padding: '14px 8px' }}>Fecha Inicio</th>
                <th style={{ padding: '14px 8px' }}>Tiempo Atención</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(order => {
                const isCancelled = order.status === 'cancelled' || order.isCancelled;
                const statusInfo = isCancelled ? STATUS_LABELS.cancelled : (STATUS_LABELS[order.status] || { name: order.status, bg: '#f1f5f9', color: '#475569' });
                
                // Lead to paid time
                let attentionTime = '-';
                if (order.createdAt && order.paidAt) {
                  const c = new Date(order.createdAt).getTime();
                  const p = new Date(order.paidAt).getTime();
                  if (p >= c) attentionTime = formatDuration(p - c);
                }

                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 8px', fontWeight: 800, color: '#0f172a' }}>
                      #{order.orderNumber || order.id.slice(-5)}
                    </td>
                    
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontWeight: 800, color: '#1e293b' }}>{order.clientName || 'Cliente sin nombre'}</div>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{order.whatsapp || '-'}</span>
                    </td>

                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontWeight: 800, color: Number(order.totalAmount) > 0 ? '#10b981' : '#64748b' }}>
                        ${fmt(order.totalAmount || 0)}
                      </div>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Bs. {fmt(order.totalAmountBs || 0)}</span>
                    </td>

                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        background: statusInfo.bg,
                        color: statusInfo.color,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800
                      }}>
                        {statusInfo.name}
                      </span>
                    </td>

                    <td style={{ padding: '12px 8px' }}>
                      {order.isInvoiced ? (
                        <span style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FileCheck size={12} /> Facturado
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>Sin factura</span>
                      )}
                    </td>

                    <td style={{ padding: '12px 8px', color: '#64748b', fontSize: '12px' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>

                    <td style={{ padding: '12px 8px', fontWeight: 700, color: '#334155' }}>
                      {attentionTime}
                    </td>
                  </tr>
                );
              })}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                    No se encontraron órdenes para este filtro y periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 28px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
            Mostrando <b>{filteredList.length}</b> de <b>{advisorOrders.length}</b> registros de {advisorName}
          </span>
          <button 
            type="button" 
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '10px',
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Cerrar Auditoría
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
