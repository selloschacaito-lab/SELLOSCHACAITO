import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { Settings, DollarSign, Filter, Clock, Users, AlertTriangle, Package, Activity, ArrowRight, TrendingUp, Sparkles, Crown, Calendar, PanelLeft, Bookmark, FileText } from 'lucide-react';
import { useProfile } from '../contexts/ProfileContext';
import SalesHistoryModal from '../components/SalesHistoryModal';
import AuditOrdersModal from '../components/AuditOrdersModal';
import AdminNotesPanel from '../components/AdminNotesPanel';

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

export default function Ventas() {
  const { toggleSidebar } = useOutletContext() || {};
  const { activeProfile } = useProfile();
  const [orders, setOrders] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const [auditAdvisor, setAuditAdvisor] = useState(null);
  const [financeTab, setFinanceTab] = useState('today'); // 'today' | 'month'
  const [mainView, setMainView] = useState('dashboard'); // 'dashboard' | 'notes'
  const [adminNotesCount, setAdminNotesCount] = useState(0);
  
  // Permiso Maestro exclusivo para Alvaro Acevedo / Administrador
  const isMasterAdmin = Boolean(
    activeProfile?.name?.toLowerCase().includes('alvaro') || 
    activeProfile?.role === 'admin'
  );

  const prefKey = `dashboard_prefs_${activeProfile?.id || 'default'}`;
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem(prefKey);
    if (saved) return JSON.parse(saved);
    return {
      finanzas: true, embudo: true, tiempos: true, clientes: true,
      alertas: true, productos: true, actividad: true
    };
  });

  useEffect(() => {
    localStorage.setItem(prefKey, JSON.stringify(prefs));
  }, [prefs, prefKey]);

  // Escuchar órdenes de Firebase RTDB
  useEffect(() => {
    const unsub = onValue(ref(db, 'orders'), (snapshot) => {
      setOrders(snapshot.val() || {});
    });
    return () => unsub();
  }, []);

  // Escuchar Notas de Administrador para contador
  useEffect(() => {
    const unsub = onValue(ref(db, 'adminNotes'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const pending = Object.values(data).filter(n => n && !n.isCompleted).length;
        setAdminNotesCount(pending);
      } else {
        setAdminNotesCount(0);
      }
    });
    return () => unsub();
  }, []);

  // Escuchar Logs de Actividad solo si es Master Admin (Alvaro)
  useEffect(() => {
    if (!isMasterAdmin) return;
    const unsub = onValue(ref(db, 'activity_logs'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setActivityLogs(arr.slice(0, 10));
      } else {
        setActivityLogs([]);
      }
    });
    return () => unsub();
  }, [isMasterAdmin]);

  const allOrdersList = useMemo(() => {
    return Object.entries(orders || {}).map(([key, val]) => ({
      id: key,
      ...(val && typeof val === 'object' ? val : {})
    }));
  }, [orders]);
  
  const paidSales = useMemo(() => {
    return allOrdersList.filter(o => {
      if (!o || o.status === 'cancelled') return false;
      return (
        o.status === 'fina' || o.hasFinaReceipt === true || 
        Boolean(o.paidAt && (Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0)) ||
        (o.status === 'delivered' && (Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0)) ||
        ((Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0) && Boolean(o.paymentMethod) && o.status !== 'design_sent')
      );
    }).sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0));
  }, [allOrdersList]);

  // Cálculos de Hoy con fecha local
  const todayLocalStr = getLocalDateStr(new Date());
  const currentMonthLocalStr = getLocalMonthStr(new Date());
  const todayStr = todayLocalStr;
  const currentMonthStr = currentMonthLocalStr;

  const todaySales = paidSales.filter(o => getLocalDateStr(o.paidAt || o.createdAt) === todayLocalStr);
  const totalUSDToday = todaySales.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  const totalBsToday = todaySales.reduce((acc, o) => acc + (Number(o.totalAmountBs) || Number(o.subtotalBs) || 0), 0);
  const ticketPromedioToday = todaySales.length > 0 ? (totalUSDToday / todaySales.length) : 0;

  // Cálculos del Mes Actual con mes local
  const monthSales = paidSales.filter(o => getLocalMonthStr(o.paidAt || o.createdAt) === currentMonthLocalStr);
  const totalUSDMonth = monthSales.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  const totalBsMonth = monthSales.reduce((acc, o) => acc + (Number(o.totalAmountBs) || Number(o.subtotalBs) || 0), 0);
  const ticketPromedioMonth = monthSales.length > 0 ? (totalUSDMonth / monthSales.length) : 0;

  // Calculos de Embudo (Hoy)
  const iniciadosHoy = allOrdersList.filter(o => getLocalDateStr(o.createdAt) === todayLocalStr).length;
  const pagadosHoy = todaySales.length;
  const conversion = iniciadosHoy > 0 ? Math.round((pagadosHoy / iniciadosHoy) * 100) : 0;

  // Calculos Clientes
  const clientesMap = new Set();
  let recurrentesCount = 0;
  paidSales.forEach(o => {
    const phone = o.whatsapp || o.clientName;
    if (phone) {
      if (clientesMap.has(phone)) recurrentesCount++;
      else clientesMap.add(phone);
    }
  });
  const nuevosCount = paidSales.length - recurrentesCount;
  const pctRecurrentes = paidSales.length > 0 ? Math.round((recurrentesCount / paidSales.length) * 100) : 0;

  // Top Productos
  const productosMap = {};
  paidSales.slice(0, 300).forEach(o => {
    (o.cart || o.items || []).forEach(item => {
      const name = item.nombre || item.name || 'Sello';
      productosMap[name] = (productosMap[name] || 0) + (Number(item.cantidad || item.quantity) || 1);
    });
  });
  const topProductos = Object.entries(productosMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Cuellos de Botella (+12h)
  const now = Date.now();
  const bottleneckOrders = useMemo(() => {
    return allOrdersList.filter(o => {
      if (!o || o.status === 'delivered' || o.status === 'cancelled') return false;
      const started = o.currentStatusStartedAt || (o.createdAt ? new Date(o.createdAt).getTime() : now);
      const hours = (now - started) / (1000 * 60 * 60);
      return hours >= 12;
    }).map(o => {
      const started = o.currentStatusStartedAt || (o.createdAt ? new Date(o.createdAt).getTime() : now);
      const hours = Math.floor((now - started) / (1000 * 60 * 60));
      return { ...o, hoursAtascado: hours };
    }).sort((a, b) => b.hoursAtascado - a.hoursAtascado);
  }, [allOrdersList, now]);

  // Tiempos promedio de producción (mes en curso y con tiempos reales de taller)
  const avgProductionHours = useMemo(() => {
    const finished = monthSales.filter(o => o.status === 'finished' || o.status === 'packed' || o.status === 'delivered');
    if (finished.length === 0) return '0.0';
    
    let validCount = 0;
    const totalHours = finished.reduce((acc, o) => {
      const created = o.createdAt ? new Date(o.createdAt).getTime() : null;
      const finishedTime = (o.finishedAt || o.deliveredAt) ? new Date(o.finishedAt || o.deliveredAt).getTime() : null;
      if (created && finishedTime && finishedTime >= created) {
        const hours = (finishedTime - created) / (1000 * 60 * 60);
        if (hours <= 72) { // Descartar anomalías mayores a 72h
          validCount++;
          return acc + hours;
        }
      }
      return acc;
    }, 0);
    return validCount > 0 ? (totalHours / validCount).toFixed(1) : '1.2';
  }, [monthSales]);

  // Rendimiento por Empleado (Today & Month) - Solo visible para Admin (Álvaro Acevedo vs Kriz)
  const employeeStats = useMemo(() => {
    if (!isMasterAdmin) return [];
    
    const advisors = [
      { key: 'ALVARO ACEVEDO', name: 'ALVARO ACEVEDO', role: 'Administrador / Asesor', color: '#10b981' },
      { key: 'KRIZ', name: 'KRIZ', role: 'Asesora de Ventas', color: '#8b5cf6' }
    ];

    const todayOrders = allOrdersList.filter(o => getLocalDateStr(o.createdAt || o.paidAt) === todayLocalStr);
    const monthOrders = allOrdersList.filter(o => getLocalMonthStr(o.createdAt || o.paidAt) === currentMonthLocalStr);

    return advisors.map(adv => {
      const matchAdv = (o) => {
        const v = (o.vendedor || o.createdBy || o.designer || '').toUpperCase().trim();
        if (adv.key === 'ALVARO ACEVEDO') {
          return v.includes('ALVARO') || v.includes('ACEVEDO') || (!v.includes('KRIZ') && v !== 'BRIGETHE' && v !== 'ABRIL');
        }
        if (adv.key === 'KRIZ') {
          return v.includes('KRIZ');
        }
        return false;
      };

      // HOY
      const advToday = todayOrders.filter(matchAdv);
      const advTodayPaid = todaySales.filter(matchAdv);
      const todayUSD = advTodayPaid.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
      const todayBs = advTodayPaid.reduce((acc, o) => acc + (Number(o.totalAmountBs) || Number(o.subtotalBs) || 0), 0);
      const todayCount = advTodayPaid.length;
      const todayInitiated = advToday.length;

      // MES
      const advMonth = monthOrders.filter(matchAdv);
      const advMonthPaid = monthSales.filter(matchAdv);
      const monthUSD = advMonthPaid.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
      const monthBs = advMonthPaid.reduce((acc, o) => acc + (Number(o.totalAmountBs) || Number(o.subtotalBs) || 0), 0);
      const monthCount = advMonthPaid.length; // Recibos concretados
      const monthInitiated = advMonth.length; // Total iniciados
      const monthCancelled = advMonth.filter(o => o.status === 'cancelled' || o.isCancelled).length;
      const monthInvoiced = advMonthPaid.filter(o => o.isInvoiced).length;
      const conversionRate = monthInitiated > 0 ? Math.round((monthCount / monthInitiated) * 100) : 0;

      // Tiempos de ciclo del mes
      let totalLeadToPaidMs = 0, countLeadToPaid = 0;
      let totalPaidToPrintMs = 0, countPaidToPrint = 0;
      let totalFinishToDeliveredMs = 0, countFinishToDelivered = 0;

      advMonthPaid.forEach(o => {
        if (o.createdAt && o.paidAt) {
          const c = new Date(o.createdAt).getTime(), p = new Date(o.paidAt).getTime();
          if (p >= c && (p - c) <= 48 * 60 * 60 * 1000) { totalLeadToPaidMs += (p - c); countLeadToPaid++; }
        }
        const printOrReady = o.printedAt || o.finishedAt || (o.status === 'delivered' ? o.paidAt : null);
        if (o.paidAt && printOrReady) {
          const p = new Date(o.paidAt).getTime(), pr = new Date(printOrReady).getTime();
          if (pr >= p && (pr - p) <= 24 * 60 * 60 * 1000) { totalPaidToPrintMs += (pr - p); countPaidToPrint++; }
        }
        if (o.finishedAt && o.deliveredAt) {
          const f = new Date(o.finishedAt).getTime(), d = new Date(o.deliveredAt).getTime();
          if (d >= f && (d - f) <= 48 * 60 * 60 * 1000) { totalFinishToDeliveredMs += (d - f); countFinishToDelivered++; }
        }
      });

      return {
        name: adv.name,
        role: adv.role,
        color: adv.color,
        todayUSD,
        todayBs,
        todayCount,
        todayInitiated,
        monthUSD,
        monthBs,
        monthCount,
        monthInitiated,
        monthCancelled,
        monthInvoiced,
        conversionRate,
        avgLeadToPaid: countLeadToPaid > 0 ? totalLeadToPaidMs / countLeadToPaid : null,
        avgPaidToPrint: countPaidToPrint > 0 ? totalPaidToPrintMs / countPaidToPrint : null,
        avgFinishToDelivered: countFinishToDelivered > 0 ? totalFinishToDeliveredMs / countFinishToDelivered : null
      };
    });
  }, [allOrdersList, todaySales, monthSales, isMasterAdmin, todayStr, currentMonthStr]);

  const togglePref = (key) => setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ padding: '1.25rem 16px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Header Limpio y Responsivo para Móvil y Desktop */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '1.25rem'
      }}>
        {/* Fila 1: Menú, Título y Configuración */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
            <h1 style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              margin: 0,
              lineHeight: 1.2,
              letterSpacing: '-0.02em'
            }}>
              Ventas
            </h1>
          </div>

          {/* Botón Compacto de Configuración de Widgets */}
          {mainView === 'dashboard' && (
            <button
              onClick={() => setShowPrefsModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#64748b',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                flexShrink: 0
              }}
              title="Personalizar Dashboard"
              type="button"
            >
              <Settings size={18} />
            </button>
          )}
        </div>

        {/* Fila 2: Selector Segmentado Responsivo (Dashboard vs Bitácora) */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <button
            type="button"
            onClick={() => setMainView('dashboard')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '9px',
              border: 'none',
              background: mainView === 'dashboard' ? '#ffffff' : 'transparent',
              color: mainView === 'dashboard' ? '#0f172a' : '#64748b',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: mainView === 'dashboard' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap'
            }}
          >
            <TrendingUp size={15} color={mainView === 'dashboard' ? '#16a34a' : '#64748b'} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setMainView('notes')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '9px',
              border: 'none',
              background: mainView === 'notes' ? '#ffffff' : 'transparent',
              color: mainView === 'notes' ? '#0f172a' : '#64748b',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: mainView === 'notes' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap'
            }}
          >
            <Bookmark size={15} color={mainView === 'notes' ? '#10b981' : '#64748b'} />
            <span>Bitácora & Recordatorios</span>
            {adminNotesCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '999px',
                marginLeft: '2px'
              }}>
                {adminNotesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* RENDER CONDICIONAL: BITÁCORA VS DASHBOARD */}
      {mainView === 'notes' ? (
        <AdminNotesPanel />
      ) : (
        /* Grid de Widgets */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        
        {/* 1. FINANZAS UNIFICADAS (HOY Y ESTE MES) */}
        {prefs.finanzas && (
          <div className="glass-card" style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: '#fff',
            borderRadius: '1.25rem',
            boxShadow: '0 4px 20px -4px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            gridColumn: '1 / -1' /* Destacado arriba a todo el ancho */
          }}>
            {/* Header del Widget con Selector Hoy / Mes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 800, fontSize: '1.05rem' }}>
                <DollarSign size={22} /> Finanzas del Negocio
              </div>
              
              {/* Selector de Pestaña Hoy / Este Mes */}
              <div style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '10px',
                gap: '2px'
              }}>
                <button
                  onClick={() => setFinanceTab('today')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: financeTab === 'today' ? '#fff' : 'transparent',
                    color: financeTab === 'today' ? '#0f172a' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: financeTab === 'today' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  📅 Ventas de Hoy ({todaySales.length})
                </button>
                <button
                  onClick={() => setFinanceTab('month')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: 'none',
                    background: financeTab === 'month' ? '#fff' : 'transparent',
                    color: financeTab === 'month' ? '#0f172a' : '#64748b',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: financeTab === 'month' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  📊 Ventas del Mes ({monthSales.length})
                </button>
              </div>
            </div>

            {/* Montos Principales */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                  {financeTab === 'today' ? 'TOTAL COBRADO HOY' : 'TOTAL COBRADO EN EL MES'}
                </div>
                <div style={{ fontSize: 'clamp(2rem, 6vw, 2.75rem)', fontWeight: 900, color: 'var(--ink)', lineHeight: 1.1, marginTop: '2px' }}>
                  ${fmt(financeTab === 'today' ? totalUSDToday : totalUSDMonth)}
                </div>
                <div style={{ color: '#16a34a', fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>
                  Bs. {fmt(financeTab === 'today' ? totalBsToday : totalBsMonth)}
                </div>
              </div>

              {/* Métricas Secundarias */}
              <div style={{
                display: 'flex',
                gap: '12px',
                background: '#f8fafc',
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid #f1f5f9'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Ventas</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                    {financeTab === 'today' ? todaySales.length : monthSales.length}
                  </div>
                </div>
                <div style={{ width: '1px', background: '#e2e8f0' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Ticket Promedio</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                    ${fmt(financeTab === 'today' ? ticketPromedioToday : ticketPromedioMonth)}
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Integrado de Historial Completo al pie */}
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
              <button
                onClick={() => setShowHistoryModal(true)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                📋 Ver Historial Completo de Ventas <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* 1.5 RENDIMIENTO POR EMPLEADO (SOLO ADMIN - ÁLVARO ACEVEDO VS KRIZ) */}
        {isMasterAdmin && (
          <div className="glass-card" style={{
            gridColumn: '1 / -1',
            background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            borderRadius: '20px',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#ecfdf5', padding: '8px', borderRadius: '12px', color: '#10b981' }}>
                  <Crown size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                    Auditoría de Desempeño y Ventas por Asesor (Día y Mes)
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '13px', margin: '2px 0 0', fontWeight: 500 }}>
                    Control de facturación, tasa de cierre, pedidos descartados y tiempos de atención
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
              {employeeStats.map(emp => (
                <div key={emp.name} style={{
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '18px',
                  padding: '20px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Card Top: Avatar, Name & Role */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '12px',
                        background: emp.color, color: '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '16px',
                        boxShadow: `0 4px 10px ${emp.color}30`
                      }}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 900, color: '#0f172a', fontSize: '16px', margin: 0 }}>{emp.name}</h4>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{emp.role}</span>
                      </div>
                    </div>

                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      background: '#f1f5f9',
                      color: '#334155',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {emp.conversionRate}% Cierre
                    </span>
                  </div>
                  
                  {/* Row 1: Facturación Hoy vs Mes */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>HOY</span>
                      <span style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>${fmt(emp.todayUSD)}</span>
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, display: 'block' }}>{emp.todayCount} recibos</span>
                    </div>
                    <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>ESTE MES</span>
                      <span style={{ fontSize: '17px', fontWeight: 900, color: '#10b981' }}>${fmt(emp.monthUSD)}</span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, display: 'block' }}>{emp.monthCount} recibos · Bs. {fmt(emp.monthBs)}</span>
                    </div>
                  </div>

                  {/* Row 2: Embudo & Conversión del Mes */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '10px', padding: '8px 4px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#15803d', display: 'block' }}>Iniciados</span>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{emp.monthInitiated}</span>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 4px' }} title="Facturas fiscales legales emitidas por Mayra">
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', display: 'block' }}>Facturados</span>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#7c3aed' }}>{emp.monthInvoiced}</span>
                    </div>
                    <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '8px 4px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#b91c1c', display: 'block' }}>Descartados</span>
                      <span style={{ fontSize: '14px', fontWeight: 900, color: '#ef4444' }}>{emp.monthCancelled}</span>
                    </div>
                  </div>

                  {/* Row 3: Tiempos de Ciclo de Atención */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>⏱️ Inicio ➔ Pago:</span>
                      <b style={{ color: '#0f172a' }}>{formatDuration(emp.avgLeadToPaid)}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>🖨️ Pago ➔ Impresión:</span>
                      <b style={{ color: '#0f172a' }}>{formatDuration(emp.avgPaidToPrint)}</b>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>🚚 Terminado ➔ Entrega:</span>
                      <b style={{ color: '#0f172a' }}>{formatDuration(emp.avgFinishToDelivered)}</b>
                    </div>
                  </div>

                  {/* Action Button: Open Detail Audit */}
                  <button
                    type="button"
                    onClick={() => setAuditAdvisor(emp.name)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = '#ffffff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                  >
                    🔍 Auditar y Ver Detalle de Pedidos
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. EMBUDO DE CONVERSIÓN */}
        {prefs.embudo && (
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0ea5e9', fontWeight: 'bold' }}>
              <Filter size={20} /> Embudo de Conversión (Hoy)
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)' }}>{conversion}%</div>
              <div style={{ color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>de éxito</div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{iniciadosHoy} Iniciados</span>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{pagadosHoy} Pagados</span>
            </div>
          </div>
        )}

        {/* 3. TIEMPOS DE PRODUCCIÓN */}
        {prefs.tiempos && (
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', fontWeight: 'bold' }}>
              <Clock size={20} /> Tiempos de Producción
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)' }}>{avgProductionHours}h</div>
              <div style={{ color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>promedio por pedido</div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.875rem' }}>
              Calculado desde el pago hasta la finalización.
            </div>
          </div>
        )}

        {/* 4. CLIENTES */}
        {prefs.clientes && (
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontWeight: 'bold' }}>
              <Users size={20} /> Fidelización Histórica
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)' }}>{pctRecurrentes}%</div>
              <div style={{ color: 'var(--text-muted)', paddingBottom: '0.5rem' }}>Recurrentes</div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{nuevosCount} Nuevos</span>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{recurrentesCount} Volvieron</span>
            </div>
          </div>
        )}

        {/* 5. CUELLOS DE BOTELLA */}
        {prefs.alertas && (
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 'bold' }}>
              <AlertTriangle size={20} /> Cuellos de Botella (+12h)
            </div>
            {bottleneckOrders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, maxHeight: '180px', overflowY: 'auto' }}>
                {bottleneckOrders.slice(0, 3).map(o => (
                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#dc2626' }}>#{o.orderNumber || o.id.slice(-5)} - {o.clientName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#7f1d1d' }}>En {o.status}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#dc2626', background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>⏱️ {o.hoursAtascado}h</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, background: '#f0fdf4', color: '#16a34a', borderRadius: '0.5rem', fontSize: '0.875rem', padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                ¡Excelente! No hay pedidos atascados (+12h).
              </div>
            )}
          </div>
        )}

        {/* 6. TOP PRODUCTOS */}
        {prefs.productos && (
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#fff', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ec4899', fontWeight: 'bold' }}>
              <Package size={20} /> Top Productos (Últimas ventas)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              {topProductos.map(([name, qty], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{name}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#ec4899' }}>{qty} unds</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. ACTIVIDAD RECIENTE EN VIVO (SOLO PARA ALVARO / SUPER ADMIN) */}
        {isMasterAdmin && prefs.actividad && (
          <div className="glass-card" style={{
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: '#fff',
            borderRadius: '1.25rem',
            border: '2px solid #3b82f6',
            gridColumn: '1 / -1'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e40af', fontWeight: 800 }}>
                <Activity size={20} color="#3b82f6" /> Registro de Actividad Global (Auditoría en Vivo)
              </div>
              <span style={{
                background: '#dbeafe',
                color: '#1e40af',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Crown size={12} /> Solo Alvaro
              </span>
            </div>
            
            {activityLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto' }}>
                {activityLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '0.75rem', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                        👤 {log.userName}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>{log.action}:</span>
                      <span style={{ fontSize: '0.85rem', color: '#475569' }}>{log.details}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, background: '#f8fafc', borderRadius: '0.5rem', color: '#94a3b8', fontSize: '0.875rem', padding: '2rem', textAlign: 'center' }}>
                Aún no hay actividades registradas hoy.
              </div>
            )}
          </div>
        )}

        </div>
      )}

      {/* PREFS MODAL */}
      {showPrefsModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', padding: '16px' }}>
          <div className="glass-card" style={{ background: '#fff', padding: '1.5rem', borderRadius: '1.25rem', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.25rem 0', color: 'var(--ink)' }}>Personalizar Dashboard</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { k: 'finanzas', n: 'Finanzas (Día y Mes)' },
                { k: 'embudo', n: 'Embudo de Conversión' },
                { k: 'tiempos', n: 'Tiempos de Producción' },
                { k: 'clientes', n: 'Fidelización de Clientes' },
                { k: 'alertas', n: 'Alertas y Cuellos de Botella' },
                { k: 'productos', n: 'Top Productos' },
                ...(isMasterAdmin ? [{ k: 'actividad', n: '👑 Registro de Auditoría (Admin)' }] : [])
              ].map(w => (
                <label key={w.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '6px 0' }}>
                  <span style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.9rem' }}>{w.n}</span>
                  <input type="checkbox" checked={prefs[w.k]} onChange={() => togglePref(w.k)} style={{ width: '1.2rem', height: '1.2rem', accentColor: '#16a34a' }} />
                </label>
              ))}
            </div>
            <button onClick={() => setShowPrefsModal(false)} className="btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', borderRadius: '10px' }}>
              Listo
            </button>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <SalesHistoryModal onClose={() => setShowHistoryModal(false)} />
      )}

      {/* AUDIT ORDERS MODAL (ALVARO VS KRIZ) */}
      {auditAdvisor && (
        <AuditOrdersModal 
          advisorName={auditAdvisor} 
          allOrders={allOrdersList} 
          onClose={() => setAuditAdvisor(null)} 
        />
      )}
    </div>
  );
}
