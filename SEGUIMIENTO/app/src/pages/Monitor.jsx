import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { AlertTriangle, Clock, Layers } from 'lucide-react';
import { STATUSES } from '../utils/orderStatuses';
import { PERIOD_OPTIONS, getPeriodBounds, isWithin } from '../utils/periodUtils';
import './Monitor.css';

// Transiciones de tiempo que se pueden medir con los timestamps que el
// Kanban ya guarda en cada pedido (ver KanbanBoard.jsx -> performAdvanceLogic).
const TRANSITIONS = [
  { id: 'pago_impresion', label: 'Pagado → Impresión', from: 'paidAt', to: 'printedAt' },
  { id: 'impresion_produccion', label: 'Impresión → Producción', from: 'printedAt', to: 'productionStartedAt' },
  { id: 'produccion_terminado', label: 'Producción → Terminado', from: 'productionStartedAt', to: 'finishedAt' },
  { id: 'terminado_empacado', label: 'Terminado → Empacado', from: 'finishedAt', to: 'packedAt' },
  { id: 'empacado_entregado', label: 'Empacado → Entregado', from: 'packedAt', to: 'deliveredAt' }
];

function fmtHours(hours) {
  if (hours === null || hours === undefined || isNaN(hours)) return '—';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export default function Monitor() {
  const [orders, setOrders] = useState({});
  const [periodKey, setPeriodKey] = useState('mes');

  useEffect(() => {
    const unsub = onValue(ref(db, 'orders'), (snapshot) => {
      setOrders(snapshot.val() || {});
    });
    return () => unsub();
  }, []);

  const { currentStart, currentEnd, label } = useMemo(() => getPeriodBounds(periodKey), [periodKey]);

  const allOrdersList = useMemo(() => {
    return Object.entries(orders || {}).map(([id, val]) => ({ id, ...val })).filter(o => o && !o.isDeleted);
  }, [orders]);

  const visibleStatuses = useMemo(() => STATUSES.filter(s => !s.isHidden), []);

  // Pedidos activos ahora mismo (mismo criterio que el Kanban: se excluyen
  // las etapas ocultas como "Entregado" y los cancelados).
  const activeOrders = useMemo(() => {
    const visibleIds = new Set(visibleStatuses.map(s => s.id));
    return allOrdersList.filter(o => visibleIds.has(o.status));
  }, [allOrdersList, visibleStatuses]);

  const stageCounts = useMemo(() => {
    const counts = {};
    for (const s of visibleStatuses) counts[s.id] = 0;
    for (const o of activeOrders) counts[o.status] = (counts[o.status] || 0) + 1;
    return counts;
  }, [activeOrders, visibleStatuses]);

  const maxStageId = useMemo(() => {
    let max = null;
    for (const s of visibleStatuses) {
      if (stageCounts[s.id] > 0 && (max === null || stageCounts[s.id] > stageCounts[max])) max = s.id;
    }
    return max;
  }, [stageCounts, visibleStatuses]);

  const transitionStats = useMemo(() => {
    return TRANSITIONS.map(t => {
      let totalMs = 0, count = 0;
      for (const o of allOrdersList) {
        const fromVal = o[t.from];
        const toVal = o[t.to];
        if (!fromVal || !toVal) continue;
        if (!isWithin(toVal, currentStart, currentEnd)) continue;
        const f = new Date(fromVal).getTime();
        const to = new Date(toVal).getTime();
        if (to >= f) { totalMs += (to - f); count++; }
      }
      const avgHours = count > 0 ? (totalMs / count) / (1000 * 60 * 60) : null;
      return { ...t, avgHours, count };
    });
  }, [allOrdersList, currentStart, currentEnd]);

  const slowestTransitionId = useMemo(() => {
    let max = null;
    for (const t of transitionStats) {
      if (t.avgHours !== null && (max === null || t.avgHours > max.avgHours)) max = t;
    }
    return max?.id || null;
  }, [transitionStats]);

  return (
    <div className="monitor-wrapper">
      <div className="monitor-header">
        <div>
          <h1>Monitor de Producción</h1>
          <p>Cuellos de botella y tiempos por etapa · {label}</p>
        </div>
        <div className="monitor-period-selector">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              className={periodKey === opt.key ? 'active' : ''}
              onClick={() => setPeriodKey(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <section className="monitor-section">
        <h3><Layers size={16} /> Pedidos activos por etapa</h3>
        <div className="monitor-stage-grid">
          {visibleStatuses.map(s => (
            <div key={s.id} className={`monitor-stage-card ${s.id === maxStageId ? 'bottleneck' : ''}`}>
              <span className="monitor-stage-name">{s.name}</span>
              <span className="monitor-stage-count">{stageCounts[s.id]}</span>
              {s.id === maxStageId && (
                <span className="monitor-bottleneck-tag"><AlertTriangle size={11} /> Más acumulado</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="monitor-section">
        <h3><Clock size={16} /> Tiempo promedio por transición</h3>
        <div className="monitor-transitions">
          {transitionStats.map(t => (
            <div key={t.id} className={`monitor-transition-row ${t.id === slowestTransitionId ? 'bottleneck' : ''}`}>
              <span className="monitor-transition-label">{t.label}</span>
              <span className="monitor-transition-time">{fmtHours(t.avgHours)}</span>
              <span className="monitor-transition-count">{t.count} pedido{t.count !== 1 ? 's' : ''}</span>
              {t.id === slowestTransitionId && (
                <span className="monitor-bottleneck-tag"><AlertTriangle size={11} /> Más lento</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
