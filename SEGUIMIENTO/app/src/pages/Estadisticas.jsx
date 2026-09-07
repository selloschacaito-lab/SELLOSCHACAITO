import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db, firestoreDB } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from 'recharts';
import {
  PanelLeft, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Users, Package, DollarSign, ShoppingBag, Search, LayoutGrid, Boxes
} from 'lucide-react';
import { computeClientMetrics } from '../utils/crmUtils';
import { getPeriodBounds, isWithin, compareMetric, PERIOD_OPTIONS } from '../utils/periodUtils';

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const CANCEL_REASON_LABELS = {
  no_compro: 'Cliente no compró',
  sin_respuesta: 'Cliente no dijo nada',
  dejar_seguir: 'Dejar de seguir'
};

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

// Colores reconocidos en el nombre del producto (ej. "TRODAT CLASSIC 4911 AZUL CIELO").
// Se busca la primera coincidencia y se agrupa por el color base (ignora
// modificadores como "pastel"/"neón"/"cielo" para no fragmentar demasiado).
const COLOR_WORDS = [
  { match: /AZUL/, label: 'Azul' },
  { match: /VERDE/, label: 'Verde' },
  { match: /ROJO/, label: 'Rojo' },
  { match: /NEGRO/, label: 'Negro' },
  { match: /BLANCO/, label: 'Blanco' },
  { match: /GRIS/, label: 'Gris' },
  { match: /AMARILLO/, label: 'Amarillo' },
  { match: /NARANJA/, label: 'Naranja' },
  { match: /VIOLETA/, label: 'Violeta' },
  { match: /MORADO/, label: 'Morado' },
  { match: /LILA/, label: 'Lila' },
  { match: /FUCSIA/, label: 'Fucsia' },
  { match: /DORADO/, label: 'Dorado' },
  { match: /PLATEADO/, label: 'Plateado' },
  { match: /TURQUESA/, label: 'Turquesa' },
  { match: /AGUAMARINA/, label: 'Aguamarina' },
  { match: /CREMA/, label: 'Crema' },
  { match: /ROSA(DO)?/, label: 'Rosado' }
];

function extractColor(nombre) {
  const n = (nombre || '').toUpperCase();
  for (const c of COLOR_WORDS) {
    if (c.match.test(n)) return c.label;
  }
  return null;
}

// Mismo criterio que usan Ventas.jsx / AuditOrdersModal.jsx para saber si un
// pedido ya se convirtió en venta (no se reinventa, se replica la fórmula).
function isPaidOrder(o) {
  const isCancelled = o.status === 'cancelled' || o.isCancelled;
  if (isCancelled) return false;
  return (
    o.status === 'fina' ||
    o.hasFinaReceipt === true ||
    Boolean(o.paidAt && Number(o.totalAmount || 0) > 0) ||
    (o.status === 'delivered' && Number(o.totalAmount || 0) > 0) ||
    (Number(o.totalAmount || 0) > 0 && Boolean(o.paymentMethod) && o.status !== 'design_sent')
  );
}

function isCancelledOrder(o) {
  return o.status === 'cancelled' || o.isCancelled;
}

// Coincide con el clasificador ya usado en Ventas.jsx:232-241 (Álvaro vs Kriz)
function matchAdvisor(order, advisorKey) {
  const v = (order.vendedor || order.createdBy || order.designer || '').toUpperCase().trim();
  if (advisorKey === 'ALVARO') {
    return v.includes('ALVARO') || v.includes('ACEVEDO') || (!v.includes('KRIZ') && v !== 'BRIGETHE' && v !== 'ABRIL');
  }
  if (advisorKey === 'KRIZ') {
    return v.includes('KRIZ');
  }
  return false;
}

// Tarjeta de estadística con comparación contra el período anterior
function StatCard({ label, value, comparison, icon: Icon, color = '#10b981', suffix = '' }) {
  const showTrend = comparison && comparison.direction !== null;
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px',
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '160px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {Icon && <div style={{ background: `${color}18`, color, borderRadius: '8px', padding: '6px', display: 'flex' }}><Icon size={16} /></div>}
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>{value}{suffix}</div>
      {showTrend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700, color: comparison.direction === 'up' ? '#10b981' : comparison.direction === 'down' ? '#ef4444' : '#94a3b8' }}>
          {comparison.direction === 'up' ? <TrendingUp size={13} /> : comparison.direction === 'down' ? <TrendingDown size={13} /> : <Minus size={13} />}
          {comparison.pctChange !== null ? `${Math.abs(comparison.pctChange).toFixed(0)}% vs. período anterior` : ''}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px 22px', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', margin: '0 0 14px' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function Estadisticas() {
  const { toggleSidebar } = useOutletContext() || {};
  const [ordersMap, setOrdersMap] = useState({});
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [periodKey, setPeriodKey] = useState('mes');
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'productos'
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [compareProductId, setCompareProductId] = useState('');

  useEffect(() => {
    const unsub = onValue(ref(db, 'orders'), (snap) => setOrdersMap(snap.val() || {}));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestoreDB, 'clients'), (snap) => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestoreDB, 'products'), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.tipo === 'Producto' || !p.tipo));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestoreDB, 'inventory_movements'), (snap) => {
      setMovements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const allOrdersList = useMemo(() => Object.entries(ordersMap).map(([id, o]) => ({ id, ...o })), [ordersMap]);

  const { currentStart, currentEnd, previousStart, previousEnd, label } = useMemo(
    () => getPeriodBounds(periodKey),
    [periodKey]
  );

  const ordersInPeriod = useMemo(
    () => allOrdersList.filter(o => isWithin(o.createdAt, currentStart, currentEnd)),
    [allOrdersList, currentStart, currentEnd]
  );
  const ordersInPrevPeriod = useMemo(
    () => (previousStart ? allOrdersList.filter(o => isWithin(o.createdAt, previousStart, previousEnd)) : []),
    [allOrdersList, previousStart, previousEnd]
  );

  // ===================== VENTAS Y CONVERSIÓN =====================
  const ventasConversion = useMemo(() => {
    const initiated = ordersInPeriod.length;
    const paid = ordersInPeriod.filter(isPaidOrder).length;
    const cancelled = ordersInPeriod.filter(isCancelledOrder);
    const conversionRate = initiated > 0 ? (paid / initiated) * 100 : 0;

    const prevInitiated = ordersInPrevPeriod.length;
    const prevPaid = ordersInPrevPeriod.filter(isPaidOrder).length;
    const prevConversionRate = previousStart ? (prevInitiated > 0 ? (prevPaid / prevInitiated) * 100 : 0) : null;

    const reasonCounts = {};
    cancelled.forEach(o => {
      const label = o.cancelReasonLabel || CANCEL_REASON_LABELS[o.cancelReason] || 'Sin motivo';
      reasonCounts[label] = (reasonCounts[label] || 0) + 1;
    });

    const donutData = [
      { name: 'Compraron', value: paid },
      ...Object.entries(reasonCounts).map(([name, value]) => ({ name, value }))
    ].filter(d => d.value > 0);

    // Tendencia de conversión: por día si es semana/mes, por mes si es año/todo
    const buckets = {};
    const useMonthlyBuckets = periodKey === 'anio' || periodKey === 'todo';
    ordersInPeriod.forEach(o => {
      const d = new Date(o.createdAt);
      if (isNaN(d.getTime())) return;
      const key = useMonthlyBuckets
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${d.getMonth() + 1}/${d.getDate()}`;
      if (!buckets[key]) buckets[key] = { key, initiated: 0, paid: 0, sortVal: d.getTime() };
      buckets[key].initiated++;
      if (isPaidOrder(o)) buckets[key].paid++;
    });
    const trendData = Object.values(buckets)
      .sort((a, b) => a.sortVal - b.sortVal)
      .map(b => ({ name: b.key, conversion: b.initiated > 0 ? Math.round((b.paid / b.initiated) * 100) : 0 }));

    return {
      initiated, paid, conversionRate,
      conversionComparison: compareMetric(conversionRate, prevConversionRate),
      donutData, trendData
    };
  }, [ordersInPeriod, ordersInPrevPeriod, previousStart, periodKey]);

  // ===================== PERSONAL =====================
  const personal = useMemo(() => {
    const buildAdvisorStat = (key, name, color) => {
      const cur = ordersInPeriod.filter(o => matchAdvisor(o, key));
      const curPaid = cur.filter(isPaidOrder);
      const prev = ordersInPrevPeriod.filter(o => matchAdvisor(o, key));
      const prevPaid = prev.filter(isPaidOrder);
      const usd = curPaid.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
      const prevUsd = prevPaid.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
      const conversionRate = cur.length > 0 ? Math.round((curPaid.length / cur.length) * 100) : 0;
      return { name, color, usd, ventas: curPaid.length, conversionRate, usdComparison: compareMetric(usd, previousStart ? prevUsd : null) };
    };

    const alvaro = buildAdvisorStat('ALVARO', 'Álvaro', '#10b981');
    const kriz = buildAdvisorStat('KRIZ', 'Kriz', '#8b5cf6');

    // Mayra: facturación (paidAt -> invoicedAt)
    const invoicedInPeriod = ordersInPeriod.filter(o => o.isInvoiced && isWithin(o.invoicedAt, currentStart, currentEnd));
    let totalInvoiceMs = 0, countInvoice = 0;
    invoicedInPeriod.forEach(o => {
      if (o.paidAt && o.invoicedAt) {
        const p = new Date(o.paidAt).getTime(), i = new Date(o.invoicedAt).getTime();
        if (i >= p) { totalInvoiceMs += (i - p); countInvoice++; }
      }
    });
    const avgInvoiceHours = countInvoice > 0 ? (totalInvoiceMs / countInvoice) / (1000 * 60 * 60) : null;

    // Felizai: velocidad de producción (printedAt -> finishedAt), ahora filtrado
    // por quién realmente hizo la transición (campo finishedBy, agregado hoy).
    // Los pedidos terminados ANTES de este cambio no tienen finishedBy y no
    // cuentan para nadie en particular — es lo correcto, no se puede inventar
    // ese dato retroactivamente.
    const finishedByFelizai = ordersInPeriod.filter(o =>
      o.finishedAt && isWithin(o.finishedAt, currentStart, currentEnd) &&
      (o.finishedBy || '').toLowerCase().includes('feliz')
    );
    let totalProdMs = 0, countProd = 0;
    finishedByFelizai.forEach(o => {
      if (o.printedAt && o.finishedAt) {
        const p = new Date(o.printedAt).getTime(), f = new Date(o.finishedAt).getTime();
        if (f >= p) { totalProdMs += (f - p); countProd++; }
      }
    });
    const avgProdHours = countProd > 0 ? (totalProdMs / countProd) / (1000 * 60 * 60) : null;

    return {
      barData: [
        { name: 'Álvaro', ventas: alvaro.usd, conversion: alvaro.conversionRate },
        { name: 'Kriz', ventas: kriz.usd, conversion: kriz.conversionRate }
      ],
      alvaro, kriz,
      mayra: { facturas: invoicedInPeriod.length, avgHours: avgInvoiceHours },
      felizai: { terminados: finishedByFelizai.length, avgHours: avgProdHours }
    };
  }, [ordersInPeriod, ordersInPrevPeriod, previousStart, currentStart, currentEnd]);

  // ===================== CLIENTES =====================
  const clientesStats = useMemo(() => {
    const metricsPerClient = clients.map(c => ({ client: c, metrics: computeClientMetrics(c, allOrdersList) })).filter(x => x.metrics);

    const tagCounts = {};
    metricsPerClient.forEach(({ metrics }) => {
      const label = metrics.tag.label;
      tagCounts[label] = (tagCounts[label] || 0) + 1;
    });
    const tagDonutData = Object.entries(tagCounts).map(([name, value]) => ({ name, value }));

    let nuevos = 0, recurrentes = 0;
    metricsPerClient.forEach(({ metrics }) => {
      const salesInPeriod = metrics.salesOrders.filter(o => isWithin(o.paidAt || o.createdAt, currentStart, currentEnd));
      if (salesInPeriod.length === 0) return;
      const hadSaleBefore = metrics.salesOrders.some(o => {
        const d = o.paidAt || o.createdAt;
        return d && new Date(d).getTime() < currentStart.getTime();
      });
      if (hadSaleBefore) recurrentes++;
      else nuevos++;
    });

    const topClientes = [...metricsPerClient]
      .sort((a, b) => b.metrics.totalUSD - a.metrics.totalUSD)
      .slice(0, 5)
      .map(({ client, metrics }) => ({ nombre: client.nombre || client.name || 'Sin nombre', totalUSD: metrics.totalUSD }));

    return { tagDonutData, nuevos, recurrentes, topClientes };
  }, [clients, allOrdersList, currentStart, currentEnd]);

  // ===================== INVENTARIO =====================
  const inventarioStats = useMemo(() => {
    const totalValue = products.reduce((acc, p) => acc + (Number(p.costo) || 0) * (Number(p.cantidad) || 0), 0);
    const lowStock = products.filter(p => Number(p.cantidad ?? 0) <= Number(p.minStock ?? 5));
    const tallerMovs = movements.filter(m => m.tipo === 'salida_taller' && isWithin(m.fecha, currentStart, currentEnd));
    const tallerUnits = tallerMovs.reduce((acc, m) => acc + (Number(m.cantidad) || 0), 0);
    return { totalValue, lowStockCount: lowStock.length, lowStock, tallerUnits };
  }, [products, movements, currentStart, currentEnd]);

  // ===================== ANÁLISIS DE PRODUCTOS =====================
  const productCategories = useMemo(() => {
    const set = new Set();
    products.forEach(p => set.add((p.categoria || 'SIN CATEGORÍA').trim().toUpperCase()));
    return Array.from(set).sort();
  }, [products]);

  const productAnalysis = useMemo(() => {
    // Solo ventas ya pagadas dentro del período, con sus items
    const paidInPeriod = ordersInPeriod.filter(isPaidOrder);

    // Acumuladores por producto
    const perProduct = {}; // key: productId || nombre
    const perColor = {};
    const perProductAdvisor = {}; // key: productKey -> { alvaro, kriz }

    paidInPeriod.forEach(o => {
      const isWholesaleOrder = o.clientType === 'mayorista';
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach(it => {
        const nombre = (it.nombre || it.name || 'Sin nombre').trim().toUpperCase();
        const key = it.productId && it.productId !== 'custom' ? it.productId : nombre;
        const qty = Number(it.cantidad || it.quantity || 1);
        const precio = Number(it.precioUSD ?? it.precio ?? 0);

        if (!perProduct[key]) {
          perProduct[key] = { key, nombre, unidades: 0, revenue: 0, unidadesDetal: 0, unidadesMayorista: 0 };
        }
        perProduct[key].unidades += qty;
        perProduct[key].revenue += qty * precio;
        if (isWholesaleOrder) perProduct[key].unidadesMayorista += qty;
        else perProduct[key].unidadesDetal += qty;

        const color = extractColor(nombre);
        if (color) perColor[color] = (perColor[color] || 0) + qty;

        if (!perProductAdvisor[key]) perProductAdvisor[key] = { nombre, alvaro: 0, kriz: 0 };
        if (matchAdvisor(o, 'ALVARO')) perProductAdvisor[key].alvaro += qty;
        else if (matchAdvisor(o, 'KRIZ')) perProductAdvisor[key].kriz += qty;
      });
    });

    // Filtrar por categoría/búsqueda usando el catálogo de productos (para costo y para
    // incluir productos con 0 ventas en el período, importante para "menos vendidos").
    const catalogFiltered = products.filter(p => {
      if (productCategoryFilter !== 'ALL' && (p.categoria || 'SIN CATEGORÍA').trim().toUpperCase() !== productCategoryFilter) return false;
      if (productSearch.trim() && !(p.nombre || '').toUpperCase().includes(productSearch.trim().toUpperCase())) return false;
      return true;
    });

    const merged = catalogFiltered.map(p => {
      const key = p.id;
      const nombreUp = (p.nombre || '').toUpperCase();
      const sold = perProduct[key] || perProduct[nombreUp] || { unidades: 0, revenue: 0, unidadesDetal: 0, unidadesMayorista: 0 };
      const costo = Number(p.costo) || 0;
      const costoTotal = costo * sold.unidades;
      const ganancia = sold.revenue - costoTotal;
      return {
        id: p.id,
        nombre: p.nombre,
        unidades: sold.unidades,
        revenue: sold.revenue,
        costoTotal,
        ganancia,
        unidadesDetal: sold.unidadesDetal,
        unidadesMayorista: sold.unidadesMayorista
      };
    });

    const topVendidos = [...merged].sort((a, b) => b.unidades - a.unidades).slice(0, 10);
    const menosVendidos = [...merged].sort((a, b) => a.unidades - b.unidades).slice(0, 10);
    const topGanancia = [...merged].sort((a, b) => b.ganancia - a.ganancia).slice(0, 10);

    const colorData = Object.entries(perColor)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const mayoristaVsDetal = merged.reduce((acc, p) => {
      acc.detal += p.unidadesDetal;
      acc.mayorista += p.unidadesMayorista;
      return acc;
    }, { detal: 0, mayorista: 0 });

    // Quiebres de stock: veces que un producto llegó a 0 en el período (desde inventory_movements)
    const stockoutCounts = {};
    movements.forEach(m => {
      if (Number(m.stock_nuevo) === 0 && isWithin(m.fecha, currentStart, currentEnd)) {
        stockoutCounts[m.producto_id] = (stockoutCounts[m.producto_id] || 0) + 1;
      }
    });
    const stockoutsTop = Object.entries(stockoutCounts)
      .map(([productId, count]) => {
        const p = products.find(pr => pr.id === productId);
        return { nombre: p?.nombre || 'Producto eliminado', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { topVendidos, menosVendidos, topGanancia, colorData, mayoristaVsDetal, stockoutsTop, merged };
  }, [ordersInPeriod, products, movements, currentStart, currentEnd, productCategoryFilter, productSearch]);

  const compareProductData = useMemo(() => {
    if (!compareProductId) return null;
    const paidInPeriod = ordersInPeriod.filter(isPaidOrder);
    const product = products.find(p => p.id === compareProductId);
    if (!product) return null;
    const nombreUp = (product.nombre || '').toUpperCase();
    let alvaro = 0, kriz = 0;
    paidInPeriod.forEach(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach(it => {
        const itNombre = (it.nombre || it.name || '').trim().toUpperCase();
        if (it.productId !== compareProductId && itNombre !== nombreUp) return;
        const qty = Number(it.cantidad || it.quantity || 1);
        if (matchAdvisor(o, 'ALVARO')) alvaro += qty;
        else if (matchAdvisor(o, 'KRIZ')) kriz += qty;
      });
    });
    return [{ name: product.nombre, Álvaro: alvaro, Kriz: kriz }];
  }, [compareProductId, ordersInPeriod, products]);

  // Última venta de cada producto (con TODO el historial, no solo el período
  // seleccionado), para detectar productos "estancados" sin importar el filtro.
  const STAGNANT_DAYS_THRESHOLD = 60;
  const stagnantProductsCount = useMemo(() => {
    const lastSoldMs = {};
    allOrdersList.filter(isPaidOrder).forEach(o => {
      const items = Array.isArray(o.items) ? o.items : [];
      const t = new Date(o.paidAt || o.createdAt).getTime();
      if (isNaN(t)) return;
      items.forEach(it => {
        const key = it.productId && it.productId !== 'custom' ? it.productId : (it.nombre || '').trim().toUpperCase();
        if (!lastSoldMs[key] || t > lastSoldMs[key]) lastSoldMs[key] = t;
      });
    });
    const now = Date.now();
    return products.filter(p => {
      if (Number(p.cantidad ?? 0) <= 0) return false; // sin stock, no aplica
      const last = lastSoldMs[p.id] || lastSoldMs[(p.nombre || '').toUpperCase()];
      if (!last) return true; // nunca se ha vendido y tiene stock
      const days = (now - last) / (1000 * 60 * 60 * 24);
      return days > STAGNANT_DAYS_THRESHOLD;
    }).length;
  }, [allOrdersList, products]);

  // ===================== ALERTAS =====================
  const alerts = useMemo(() => {
    const list = [];
    if (inventarioStats.lowStockCount > 0) {
      list.push({ text: `${inventarioStats.lowStockCount} producto(s) por agotarse`, color: '#ef4444' });
    }
    if (previousStart && ventasConversion.conversionComparison.direction === 'down' && Math.abs(ventasConversion.conversionComparison.pctChange || 0) >= 10) {
      list.push({ text: `La conversión bajó ${Math.abs(ventasConversion.conversionComparison.pctChange).toFixed(0)}% vs. el período anterior`, color: '#f59e0b' });
    }
    if (personal.mayra.avgHours !== null && personal.mayra.avgHours > 24) {
      list.push({ text: `La facturación está tardando más de 24h en promedio`, color: '#f59e0b' });
    }
    if (stagnantProductsCount > 0) {
      list.push({ text: `${stagnantProductsCount} producto(s) con stock llevan más de ${STAGNANT_DAYS_THRESHOLD} días sin venderse`, color: '#f59e0b' });
    }
    return list;
  }, [inventarioStats, ventasConversion, personal, previousStart, stagnantProductsCount]);

  return (
    <div className="animate-fade-in" style={{ width: '100%', padding: '20px 20px 80px', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px 24px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {toggleSidebar && (
            <button onClick={toggleSidebar} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex' }} title="Abrir menú" type="button">
              <PanelLeft size={18} />
            </button>
          )}
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Estadísticas</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '13px' }}>Panel general en tiempo real · {label}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setPeriodKey(opt.key)}
              style={{
                padding: '7px 14px', borderRadius: '999px',
                border: periodKey === opt.key ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                background: periodKey === opt.key ? '#ecfdf5' : '#ffffff',
                color: periodKey === opt.key ? '#065f46' : '#64748b',
                fontSize: '12.5px', fontWeight: 800, cursor: 'pointer'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '16px', padding: '14px 18px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: a.color }}>
              <AlertTriangle size={15} /> {a.text}
            </div>
          ))}
        </div>
      )}

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px',
            border: activeTab === 'general' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
            background: activeTab === 'general' ? '#ecfdf5' : '#ffffff',
            color: activeTab === 'general' ? '#065f46' : '#64748b',
            fontSize: '13px', fontWeight: activeTab === 'general' ? 800 : 700, cursor: 'pointer'
          }}
        >
          <LayoutGrid size={15} /> General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('productos')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px',
            border: activeTab === 'productos' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
            background: activeTab === 'productos' ? '#ecfdf5' : '#ffffff',
            color: activeTab === 'productos' ? '#065f46' : '#64748b',
            fontSize: '13px', fontWeight: activeTab === 'productos' ? 800 : 700, cursor: 'pointer'
          }}
        >
          <Boxes size={15} /> Análisis de Productos
        </button>
      </div>

      {activeTab === 'general' && (
      <>
      {/* VENTAS Y CONVERSIÓN */}
      <SectionCard title="Ventas y Conversión">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <StatCard label="Iniciados" value={ventasConversion.initiated} icon={ShoppingBag} color="#3b82f6" />
          <StatCard label="Compraron" value={ventasConversion.paid} icon={DollarSign} color="#10b981" />
          <StatCard label="% Conversión" value={ventasConversion.conversionRate.toFixed(0)} suffix="%" comparison={ventasConversion.conversionComparison} icon={TrendingUp} color="#8b5cf6" />
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ventasConversion.donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {ventasConversion.donutData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: '2 1 380px', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ventasConversion.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} unit="%" />
                <Tooltip />
                <Line type="monotone" dataKey="conversion" name="% Conversión" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>

      {/* PERSONAL */}
      <SectionCard title="Personal">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div style={{ flex: '1 1 320px', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personal.barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="ventas" name="Ventas ($)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
            <StatCard label="Álvaro" value={`$${fmt(personal.alvaro.usd)}`} comparison={personal.alvaro.usdComparison} icon={Users} color="#10b981" />
            <StatCard label="Kriz" value={`$${fmt(personal.kriz.usd)}`} comparison={personal.kriz.usdComparison} icon={Users} color="#8b5cf6" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <StatCard label="Mayra · Facturas emitidas" value={personal.mayra.facturas} icon={DollarSign} color="#f59e0b" />
          <StatCard label="Mayra · Tiempo prom. facturar" value={personal.mayra.avgHours !== null ? personal.mayra.avgHours.toFixed(1) : '-'} suffix={personal.mayra.avgHours !== null ? 'h' : ''} icon={TrendingUp} color="#f59e0b" />
          <StatCard label="Felizai · Pedidos terminados" value={personal.felizai.terminados} icon={Package} color="#3b82f6" />
          <StatCard label="Felizai · Tiempo prom. producción" value={personal.felizai.avgHours !== null ? personal.felizai.avgHours.toFixed(1) : '-'} suffix={personal.felizai.avgHours !== null ? 'h' : ''} icon={TrendingUp} color="#3b82f6" />
        </div>
      </SectionCard>

      {/* CLIENTES */}
      <SectionCard title="Clientes">
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div style={{ flex: '1 1 260px', height: '230px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={clientesStats.tagDonutData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                  {clientesStats.tagDonutData.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: '1 1 200px', height: '230px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: label, Nuevos: clientesStats.nuevos, Recurrentes: clientesStats.recurrentes }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Nuevos" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Recurrentes" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: '1 1 220px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Top Clientes por Gasto</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {clientesStats.topClientes.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>{c.nombre}</span>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>${fmt(c.totalUSD)}</span>
                </div>
              ))}
              {clientesStats.topClientes.length === 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sin datos aún</span>}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* INVENTARIO */}
      <SectionCard title="Inventario">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <StatCard label="Valor Total en Stock" value={`$${fmt(inventarioStats.totalValue)}`} icon={DollarSign} color="#10b981" />
          <StatCard label="Productos por Agotarse" value={inventarioStats.lowStockCount} icon={AlertTriangle} color="#ef4444" />
          <StatCard label="Unidades a Taller (período)" value={inventarioStats.tallerUnits} icon={Package} color="#f59e0b" />
        </div>
      </SectionCard>
      </>
      )}

      {activeTab === 'productos' && (
      <>
        {/* Filtros: búsqueda + categoría */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="search"
              placeholder="Buscar producto por nombre..."
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              style={{ width: '100%', height: '38px', padding: '0 12px 0 34px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>
          <select
            value={productCategoryFilter}
            onChange={e => setProductCategoryFilter(e.target.value)}
            style={{ height: '38px', padding: '0 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 700, color: '#334155' }}
          >
            <option value="ALL">Todas las categorías</option>
            {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Más vendidos / Menos vendidos */}
        <SectionCard title="Productos Más Vendidos (Top 10, por unidades)">
          <div style={{ height: `${productAnalysis.topVendidos.length * 34 + 20}px`, minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productAnalysis.topVendidos} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" fontSize={11} />
                <YAxis type="category" dataKey="nombre" width={180} fontSize={10.5} />
                <Tooltip />
                <Bar dataKey="unidades" name="Unidades vendidas" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Productos Menos Vendidos (Bottom 10, incluye los que nunca se han vendido)">
          <div style={{ height: `${productAnalysis.menosVendidos.length * 34 + 20}px`, minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productAnalysis.menosVendidos} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="nombre" width={180} fontSize={10.5} />
                <Tooltip />
                <Bar dataKey="unidades" name="Unidades vendidas" fill="#ef4444" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Color más/menos vendido */}
        <SectionCard title="Ventas por Color (solo productos con color en el nombre)">
          {productAnalysis.colorData.length > 0 ? (
            <div style={{ height: `${productAnalysis.colorData.length * 30 + 20}px`, minHeight: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productAnalysis.colorData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={90} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" name="Unidades" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Sin ventas con color identificable en este período/filtro.</span>
          )}
        </SectionCard>

        {/* Costo vs Venta / Ganancia */}
        <SectionCard title="Costo vs. Venta — Top 10 por Ganancia">
          <div style={{ height: `${productAnalysis.topGanancia.length * 34 + 20}px`, minHeight: '200px', marginBottom: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productAnalysis.topGanancia} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" fontSize={11} unit="$" />
                <YAxis type="category" dataKey="nombre" width={180} fontSize={10.5} />
                <Tooltip formatter={(v) => `$${fmt(v)}`} />
                <Legend />
                <Bar dataKey="costoTotal" name="Costo ($)" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                <Bar dataKey="revenue" name="Venta ($)" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Mayorista vs Detal */}
        <SectionCard title="Detal vs. Mayorista (unidades vendidas)">
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <StatCard label="Detal" value={productAnalysis.mayoristaVsDetal.detal} icon={ShoppingBag} color="#10b981" />
            <StatCard label="Mayorista" value={productAnalysis.mayoristaVsDetal.mayorista} icon={Users} color="#f59e0b" />
          </div>
        </SectionCard>

        {/* Comparar Kriz vs Álvaro por producto */}
        <SectionCard title="Comparar un Producto: Álvaro vs. Kriz">
          <select
            value={compareProductId}
            onChange={e => setCompareProductId(e.target.value)}
            style={{ height: '38px', padding: '0 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '14px', maxWidth: '360px', width: '100%' }}
          >
            <option value="">Selecciona un producto...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          {compareProductData && (
            <div style={{ height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareProductData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Álvaro" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Kriz" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* Quiebres de stock */}
        <SectionCard title="Quiebres de Stock (veces que llegó a 0 en el período)">
          {productAnalysis.stockoutsTop.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {productAnalysis.stockoutsTop.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#334155' }}>{s.nombre}</span>
                  <span style={{ fontWeight: 800, color: '#ef4444' }}>{s.count} vez(ces)</span>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Ningún producto llegó a 0 unidades en este período.</span>
          )}
        </SectionCard>
      </>
      )}
    </div>
  );
}
