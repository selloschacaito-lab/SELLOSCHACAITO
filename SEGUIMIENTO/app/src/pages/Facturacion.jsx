import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../firebase/config';
import { ref, onValue, update } from 'firebase/database';
import { useProfile } from '../contexts/ProfileContext';
import { 
  FileCheck, 
  Search, 
  Copy, 
  Check, 
  PanelLeft, 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Hash, 
  Building2, 
  Phone, 
  MapPin, 
  Package, 
  ArrowRight, 
  ExternalLink, 
  RotateCcw, 
  Sparkles,
  Bell,
  TrendingUp,
  Wallet,
  Smartphone,
  Banknote,
  CreditCard,
  Layers,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDisplayPhone } from '../utils/formatters';
import SaleDetailModal from '../components/SaleDetailModal';
import './Facturacion.css';

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

function getOrderTotalUSD(order) {
  if (!order) return 0;
  if (Number(order.totalAmount) > 0) return Number(order.totalAmount);
  if (Number(order.totalUSD) > 0) return Number(order.totalUSD);
  if (Array.isArray(order.items) && order.items.length > 0) {
    const itemsSum = order.items.reduce((acc, it) => acc + ((Number(it.cantidad) || 1) * (Number(it.precioUSD) || 0)), 0);
    if (itemsSum > 0) return itemsSum;
  }
  if (Array.isArray(order.paymentBreakdown) && order.paymentBreakdown.length > 0) {
    const paySum = order.paymentBreakdown.reduce((acc, p) => acc + (Number(p.amountUSD) || 0), 0);
    if (paySum > 0) return paySum;
  }
  if (Number(order.totalAmountBs) > 0 && Number(order.tasaBCV) > 0) {
    return Number(order.totalAmountBs) / Number(order.tasaBCV);
  }
  return 0;
}

function getOrderTotalBs(order) {
  if (!order) return 0;
  if (Number(order.totalAmountBs) > 0) return Number(order.totalAmountBs);
  const u = getOrderTotalUSD(order);
  const rate = Number(order.tasaBCV) || 1;
  return u * rate;
}

export default function Facturacion() {
  const { toggleSidebar } = useOutletContext() || {};
  const { activeProfile } = useProfile();
  const [orders, setOrders] = useState({});
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'invoiced' | 'unpaid' | 'all'
  const [timeRange, setTimeRange] = useState('month'); // 'month' | 'today' | 'last30' | 'all'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedFieldId, setCopiedFieldId] = useState(null);
  
  // Modal para ingresar número de factura
  const [invoicingOrder, setInvoicingOrder] = useState(null);
  const [invoiceNumInput, setInvoiceNumInput] = useState('');
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // Group Invoicing States (Por Empresas / Cuentas Acumuladas)
  const [expandedGroupKeys, setExpandedGroupKeys] = useState({});
  const [groupInvoicingClient, setGroupInvoicingClient] = useState(null);
  const [savingGroupInvoice, setSavingGroupInvoice] = useState(false);

  // Modal de detalle completo
  const [selectedSaleForDetail, setSelectedSaleForDetail] = useState(null);

  // Permiso de notificaciones de Windows
  const [notifPermission, setNotifPermission] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const handleEnableOrTestNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones de Windows.');
      return;
    }

    if (Notification.permission !== 'granted') {
      const res = await Notification.requestPermission();
      setNotifPermission(res);
      if (res !== 'granted') {
        toast.error('Debes permitir las notificaciones en el navegador para que Windows te avise.');
        return;
      }
    }

    try {
      const n = new Notification('🌸 ¡Notificaciones de Windows Activas!', {
        body: '¡Hola Mayra! Cada vez que entre una venta para facturar, verás este aviso en tu pantalla aunque estés en otro programa.',
        icon: '/favicon.ico',
        requireInteraction: true
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      toast.success('¡Notificación de prueba enviada a Windows!');
    } catch (e) {
      console.error(e);
      toast.error('Error al emitir la notificación.');
    }
  };

  // Escuchar órdenes de Firebase RTDB
  useEffect(() => {
    const unsub = onValue(ref(db, 'orders'), (snapshot) => {
      setOrders(snapshot.val() || {});
    });
    return () => unsub();
  }, []);

  // Filtrar todas las ventas cobradas o por facturar
  const allPaidSales = useMemo(() => {
    return Object.entries(orders || {}).map(([key, val]) => ({
      id: key,
      ...(val && typeof val === 'object' ? val : {})
    })).filter(o => {
      if (!o || o.status === 'cancelled') return false;
      return (
        o.status === 'fina' || 
        o.hasFinaReceipt === true || 
        o.isPaid !== undefined ||
        o.paymentMethod === 'Por Pagar' ||
        Boolean(o.paidAt && (Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0)) ||
        (o.status === 'delivered' && (Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0)) ||
        ((Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0) && Boolean(o.paymentMethod) && o.status !== 'design_sent')
      );
    }).sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0));
  }, [orders]);

  // Filtrar según Período de Tiempo Seleccionado
  const paidSales = useMemo(() => {
    if (timeRange === 'all') return allPaidSales;

    const todayStr = getLocalDateStr(new Date());
    const currentMonthStr = getLocalMonthStr(new Date());
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    return allPaidSales.filter(o => {
      const d = o.paidAt || o.createdAt;
      if (!d) return false;
      if (timeRange === 'today') {
        return getLocalDateStr(d) === todayStr;
      }
      if (timeRange === 'month') {
        return getLocalMonthStr(d) === currentMonthStr;
      }
      if (timeRange === 'last30') {
        return new Date(d).getTime() >= thirtyDaysAgo;
      }
      return true;
    });
  }, [allPaidSales, timeRange]);

  // Separar listas
  // 1. Facturas diarias pendientes (NO acumuladas, NO facturadas)
  const pendingInvoices = useMemo(() => {
    return paidSales.filter(o => !o.isInvoiced && !o.isAccumulated);
  }, [paidSales]);

  // 2. Órdenes acumuladas en cuentas de clientes/empresas (NO facturadas)
  const accumulatedOrders = useMemo(() => {
    return paidSales.filter(o => !o.isInvoiced && Boolean(o.isAccumulated));
  }, [paidSales]);

  const completedInvoices = useMemo(() => {
    return paidSales.filter(o => o.isInvoiced);
  }, [paidSales]);

  const unpaidOrders = useMemo(() => {
    return paidSales.filter(o => o.isPaid === false || o.paymentMethod === 'Por Pagar');
  }, [paidSales]);

  // Resumen Financiero & Dashboard de Métricas
  const stats = useMemo(() => {
    let totalInvoicedUSD = 0;
    let totalInvoicedBs = 0;
    let totalCollectedUSD = 0;
    let totalUnpaidUSD = 0;
    
    const byMethod = {
      pagoMovil: 0,
      efectivoUSD: 0,
      efectivoBs: 0,
      debito: 0,
      porPagar: 0
    };

    paidSales.forEach(order => {
      const u = getOrderTotalUSD(order);
      const b = getOrderTotalBs(order);
      
      if (order.isInvoiced) {
        totalInvoicedUSD += u;
        totalInvoicedBs += b;
      }

      const isUnpaid = order.isPaid === false || order.paymentMethod === 'Por Pagar';
      if (isUnpaid) {
        totalUnpaidUSD += u;
        byMethod.porPagar += u;
      } else {
        totalCollectedUSD += u;
        const m = (order.paymentMethod || '').toLowerCase();
        if (m.includes('móvil') || m.includes('movil')) byMethod.pagoMovil += u;
        else if (m.includes('efectivo usd') || m.includes('dólar') || m.includes('dolar')) byMethod.efectivoUSD += u;
        else if (m.includes('efectivo bs') || m.includes('bolívar') || m.includes('bolivar')) byMethod.efectivoBs += u;
        else if (m.includes('débito') || m.includes('debito') || m.includes('punto')) byMethod.debito += u;
        else byMethod.pagoMovil += u;
      }
    });

    return {
      totalInvoicedUSD,
      totalInvoicedBs,
      totalCollectedUSD,
      totalUnpaidUSD,
      byMethod
    };
  }, [paidSales]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, timeRange, searchTerm, itemsPerPage]);

  // Lista según pestaña activa y buscador
  const displayedList = useMemo(() => {
    let list = pendingInvoices;
    if (activeTab === 'invoiced') list = completedInvoices;
    else if (activeTab === 'unpaid') list = unpaidOrders;
    else if (activeTab === 'all') list = paidSales;

    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;
    return list.filter(o => (
      o.clientName?.toLowerCase().includes(q) ||
      o.clientRif?.toLowerCase().includes(q) ||
      o.orderNumber?.toString().includes(q) ||
      o.invoiceNumber?.toLowerCase().includes(q) ||
      o.whatsapp?.includes(q)
    ));
  }, [activeTab, pendingInvoices, completedInvoices, unpaidOrders, paidSales, searchTerm]);

  // Paginación rápida
  const totalPages = Math.max(1, Math.ceil(displayedList.length / itemsPerPage));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return displayedList.slice(start, start + itemsPerPage);
  }, [displayedList, currentPage, itemsPerPage]);

  // Agrupar órdenes acumuladas por Cliente / Empresa
  const pendingByClient = useMemo(() => {
    const groups = {};

    accumulatedOrders.forEach(order => {
      const cleanRif = (order.clientRif || order.rif || '').replace(/[-.\s]/g, '').toUpperCase().trim();
      const cleanName = (order.clientName || 'SIN NOMBRE').toUpperCase().trim();
      const groupKey = cleanRif || cleanName || order.whatsapp || order.id;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          key: groupKey,
          clientName: order.clientName || 'Sin Nombre',
          clientRif: order.clientRif || '',
          clientAddress: order.clientAddress || order.address || '',
          whatsapp: order.whatsapp || order.phone || '',
          orders: [],
          totalUSD: 0,
          totalBs: 0,
          subtotalBs: 0,
          ivaBs: 0
        };
      }

      const u = getOrderTotalUSD(order);
      const b = getOrderTotalBs(order);
      const sub = Number(order.subtotalBs) || (b / 1.16);
      const iva = order.ivaBs !== undefined ? Number(order.ivaBs) : (b - sub);

      groups[groupKey].orders.push(order);
      groups[groupKey].totalUSD += u;
      groups[groupKey].totalBs += b;
      groups[groupKey].subtotalBs += sub;
      groups[groupKey].ivaBs += iva;

      // Mantener los datos fiscales más completos
      if (!groups[groupKey].clientRif && order.clientRif) groups[groupKey].clientRif = order.clientRif;
      if (!groups[groupKey].clientAddress && (order.clientAddress || order.address)) groups[groupKey].clientAddress = order.clientAddress || order.address;
      if (!groups[groupKey].whatsapp && (order.whatsapp || order.phone)) groups[groupKey].whatsapp = order.whatsapp || order.phone;
    });

    return Object.values(groups).sort((a, b) => b.orders.length - a.orders.length || b.totalUSD - a.totalUSD);
  }, [accumulatedOrders]);

  const filteredGroupedClients = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return pendingByClient;
    return pendingByClient.filter(g => (
      g.clientName?.toLowerCase().includes(q) ||
      g.clientRif?.toLowerCase().includes(q) ||
      g.whatsapp?.includes(q) ||
      g.orders.some(o => o.orderNumber?.toString().includes(q))
    ));
  }, [pendingByClient, searchTerm]);

  const toggleGroupExpand = (groupKey) => {
    setExpandedGroupKeys(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Mover pedido individual de "Por Facturar" a "Cuentas Acumuladas"
  const handleMoveToAccumulated = async (order) => {
    try {
      const nowISO = new Date().toISOString();
      await update(ref(db, `orders/${order.id}`), {
        isAccumulated: true,
        updatedAt: nowISO
      });
      toast.success(`Pedido #${order.orderNumber || order.id.slice(-5)} (${order.clientName}) movido a Cuentas Acumuladas`, {
        icon: '🏢'
      });
    } catch (err) {
      console.error("Error al mover pedido a acumuladas:", err);
      toast.error('Error al mover el pedido a acumuladas');
    }
  };

  // Devolver pedido de "Cuentas Acumuladas" a la bandeja diaria "Por Facturar"
  const handleReturnToPending = async (order) => {
    try {
      const nowISO = new Date().toISOString();
      await update(ref(db, `orders/${order.id}`), {
        isAccumulated: false,
        updatedAt: nowISO
      });
      toast.success(`Pedido #${order.orderNumber || order.id.slice(-5)} devuelto a la bandeja diaria de Por Facturar`, {
        icon: '↩️'
      });
    } catch (err) {
      console.error("Error al devolver pedido:", err);
      toast.error('Error al devolver el pedido');
    }
  };

  // Copiar resumen fiscal consolidado para máquina / software fiscal
  const handleCopyGroupSummary = (group) => {
    const cleanRif = (group.clientRif || '').replace(/[-.\s]/g, '').toUpperCase().trim();
    const cleanName = (group.clientName || 'SIN NOMBRE').toUpperCase().trim();
    const address = (group.clientAddress || 'Caracas').toUpperCase().trim();
    const phone = group.whatsapp || '';

    let itemsText = '';
    group.orders.forEach(o => {
      const num = o.orderNumber ? `#${o.orderNumber}` : `#${o.id.slice(-5)}`;
      if (Array.isArray(o.items) && o.items.length > 0) {
        o.items.forEach(it => {
          itemsText += `• (${num}) ${it.cantidad || 1}x ${it.nombre} ($${((it.cantidad || 1) * (it.precioUSD || 0)).toFixed(2)})\n`;
        });
      } else {
        itemsText += `• (${num}) ${o.details || 'Sello de goma'} ($${(Number(o.totalAmount) || 0).toFixed(2)})\n`;
      }
    });

    const summary = `DATOS FISCALES:
RIF: ${cleanRif || 'N/A'}
RAZÓN SOCIAL: ${cleanName}
DIRECCIÓN: ${address}
TELÉFONO: ${phone}

PEDIDOS ACUMULADOS (${group.orders.length}):
${itemsText}
TOTAL BASE IMPONIBLE: Bs. ${fmt(group.subtotalBs)}
TOTAL IVA 16%: Bs. ${fmt(group.ivaBs)}
TOTAL A FACTURAR: Bs. ${fmt(group.totalBs)} ($${fmt(group.totalUSD)})`;

    navigator.clipboard.writeText(summary);
    setCopiedFieldId(`group_${group.key}`);
    toast.success(`¡Resumen fiscal de ${cleanName} copiado!`);
  };

  // Enviar Estado de Cuenta por WhatsApp
  const handleSendGroupWhatsApp = (group) => {
    const phoneDigits = (group.whatsapp || '').replace(/\D/g, '');
    if (!phoneDigits) {
      toast.error('Este cliente no tiene número de WhatsApp registrado');
      return;
    }

    let ordersList = '';
    group.orders.forEach(o => {
      const num = o.orderNumber ? `#${o.orderNumber}` : `#${o.id.slice(-5)}`;
      const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' }) : '';
      const totalU = getOrderTotalUSD(o);
      ordersList += `🔹 *Pedido ${num}* (${dateStr}): $${fmt(totalU)}\n`;
    });

    const msg = `Hola estimado(a) *${group.clientName}* 👋

Le enviamos su *Estado de Cuenta Consolidado* de Sellos Chacaíto:

📋 *Pedidos acumulados pendientes (${group.orders.length}):*
${ordersList}
💰 *Total acumulado:* *$${fmt(group.totalUSD)} USD*
🇻🇪 *Equivalente en Bs:* *Bs. ${fmt(group.totalBs)}* (con IVA)

Quedamos a su disposición para la emisión de su factura fiscal. ¡Muchas gracias!`;

    const targetPhone = phoneDigits.startsWith('58') ? phoneDigits : '58' + phoneDigits.replace(/^0/, '');
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Confirmar Facturación de Cuenta Completa
  const handleConfirmGroupInvoice = async () => {
    if (!groupInvoicingClient || !groupInvoicingClient.orders || groupInvoicingClient.orders.length === 0) return;
    setSavingGroupInvoice(true);
    const count = groupInvoicingClient.orders.length;
    const loadingToast = toast.loading(`Facturando ${count} pedidos de ${groupInvoicingClient.clientName}...`);
    try {
      const nowISO = new Date().toISOString();
      const updates = {};
      const invNum = invoiceNumInput.trim() || 'MENSUAL';
      const invBy = activeProfile?.name || 'Mayra';

      groupInvoicingClient.orders.forEach(order => {
        updates[`orders/${order.id}/isInvoiced`] = true;
        updates[`orders/${order.id}/isAccumulated`] = false;
        updates[`orders/${order.id}/invoiceNumber`] = invNum;
        updates[`orders/${order.id}/invoicedAt`] = nowISO;
        updates[`orders/${order.id}/invoicedBy`] = invBy;
        updates[`orders/${order.id}/updatedAt`] = nowISO;
      });

      await update(ref(db), updates);
      toast.dismiss(loadingToast);
      toast.success(`¡${count} pedidos de ${groupInvoicingClient.clientName} marcados como FACTURADOS!`);
      setGroupInvoicingClient(null);
      setInvoiceNumInput('');
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error('Error al procesar la facturación grupal');
    } finally {
      setSavingGroupInvoice(false);
    }
  };

  // Función para marcar todo el lote pendiente como Facturado
  const handleMarkAllAsInvoiced = async () => {
    const count = pendingInvoices.length;
    if (count === 0) {
      toast('No hay facturas pendientes');
      return;
    }
    if (!window.confirm(`¿Estás seguro de que deseas marcar los ${count} pedidos/ventas pendientes como FACTURADOS?\n\nEsto actualizará todo el historial, dejará la bandeja de "Por Facturar" en 0 y podrás empezar a recibir las nuevas ventas en tiempo real.`)) {
      return;
    }
    
    setIsMarkingAll(true);
    const loadingToast = toast.loading(`Marcando ${count} facturas como procesadas...`);
    try {
      const nowISO = new Date().toISOString();
      const updates = {};
      pendingInvoices.forEach(order => {
        updates[`orders/${order.id}/isInvoiced`] = true;
        updates[`orders/${order.id}/invoicedAt`] = nowISO;
        updates[`orders/${order.id}/invoicedBy`] = activeProfile?.name || 'Mayra';
        updates[`orders/${order.id}/invoiceNumber`] = order.invoiceNumber || 'HISTORICA';
      });

      await update(ref(db), updates);
      toast.dismiss(loadingToast);
      toast.success(`¡Se marcaron ${count} ventas como facturadas con éxito!`);
    } catch (err) {
      console.error("Error al marcar todas como facturadas:", err);
      toast.dismiss(loadingToast);
      toast.error('Error al actualizar: ' + err.message);
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Función genérica para copiar campo
  const copyToClipboard = (text, fieldKey, label) => {
    if (!text) {
      toast.error(`No hay ${label} registrado`);
      return;
    }
    navigator.clipboard.writeText(String(text));
    setCopiedFieldId(fieldKey);
    toast.success(`¡Copiado: ${label}!`);
    setTimeout(() => setCopiedFieldId(null), 1800);
  };

  // Copiar Ficha Completa
  const copyFullSheet = (order) => {
    const items = order.items || [];
    const itemsText = items.map(it => `${it.cantidad || 1}x ${it.nombre} ($${fmt(it.precioUSD || 0)})`).join(', ') || order.product || 'Sellos';
    const totalUSD = Number(order.totalAmount) || 0;
    const subtotalBs = Number(order.subtotalBs) || (totalUSD * (Number(order.tasaBCV) || 1));
    const ivaBs = order.ivaBs !== undefined ? Number(order.ivaBs) : (subtotalBs * 0.16);
    const totalBs = Number(order.totalAmountBs) || (subtotalBs + ivaBs);

    const sheet = 
`DATOS DE FACTURACIÓN:
• Razón Social: ${order.clientName || 'Sin Nombre'}
• RIF / C.I.: ${(order.clientRif || '').replace(/[-.\s]/g, '').toUpperCase()}
• Teléfono: ${order.whatsapp || order.phone || '—'}
• Dirección: ${order.clientAddress || order.address || 'Caracas'}
• Concepto: ${itemsText}
• Base Imponible: Bs. ${fmt(subtotalBs)} ($${fmt(totalUSD)})
• IVA (16%): Bs. ${fmt(ivaBs)}
• Total Factura: Bs. ${fmt(totalBs)}`;

    navigator.clipboard.writeText(sheet);
    setCopiedFieldId(`full_${order.id}`);
    toast.success('¡Ficha completa copiada!');
    setTimeout(() => setCopiedFieldId(null), 1800);
  };

  // Confirmar Facturación
  const handleConfirmInvoice = async () => {
    if (!invoicingOrder) return;
    setSavingInvoice(true);
    try {
      const nowISO = new Date().toISOString();
      const userName = activeProfile?.name || 'Mayra';
      const updates = {};
      updates[`orders/${invoicingOrder.id}/isInvoiced`] = true;
      updates[`orders/${invoicingOrder.id}/invoiceNumber`] = invoiceNumInput.trim() || 'S/N';
      updates[`orders/${invoicingOrder.id}/invoicedAt`] = nowISO;
      updates[`orders/${invoicingOrder.id}/invoicedBy`] = userName;
      updates[`orders/${invoicingOrder.id}/updatedAt`] = nowISO;

      await update(ref(db), updates);
      toast.success(`¡Pedido #${invoicingOrder.orderNumber || ''} marcado como Facturado!`);
      setInvoicingOrder(null);
      setInvoiceNumInput('');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la factura');
    } finally {
      setSavingInvoice(false);
    }
  };

  // Desmarcar Facturación si hubo error
  const handleUnmarkInvoice = async (order) => {
    if (!window.confirm(`¿Deseas volver a colocar el pedido #${order.orderNumber || ''} en 'Por Facturar'?`)) return;
    try {
      const nowISO = new Date().toISOString();
      const updates = {};
      updates[`orders/${order.id}/isInvoiced`] = false;
      updates[`orders/${order.id}/invoiceNumber`] = null;
      updates[`orders/${order.id}/invoicedAt`] = null;
      updates[`orders/${order.id}/invoicedBy`] = null;
      updates[`orders/${order.id}/updatedAt`] = nowISO;

      await update(ref(db), updates);
      toast.success('Pedido devuelto a la bandeja por facturar');
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar el pedido');
    }
  };

  // Marcar orden como Pagada
  const handleMarkAsPaid = async (order) => {
    const method = window.prompt('Indica el método de pago (Pago Móvil, Efectivo USD, Efectivo Bs, Débito):', 'Pago Móvil');
    if (!method) return;

    try {
      const nowISO = new Date().toISOString();
      await update(ref(db, `orders/${order.id}`), {
        isPaid: true,
        paidAt: nowISO,
        paymentMethod: method,
        hasFinaReceipt: true,
        updatedAt: nowISO
      });
      toast.success(`¡Pedido #${order.orderNumber} marcado como PAGADO!`);
    } catch (err) {
      console.error(err);
      toast.error('Error al marcar como pagado');
    }
  };

  return (
    <div className="facturacion-wrapper animate-fade-in">
      <div className="facturacion-container">

        {/* HEADER */}
        <header className="facturacion-header">
          <div className="facturacion-header-left">
            {toggleSidebar && (
              <button 
                onClick={toggleSidebar} 
                className="facturacion-sidebar-btn" 
                title="Abrir menú"
                type="button"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <div className="facturacion-title-box">
              <h1>
                <FileCheck size={24} color="#10b981" /> Facturación Fiscal & Caja
              </h1>
              <p>Control de facturas emitidas, datos fiscales y cuadre de métodos de pago</p>
            </div>
          </div>

          {/* Selector de Período y Control de Notificaciones de Windows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* Selector de Período */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '12px', gap: '3px', border: '1px solid #e2e8f0' }}>
              {[
                { id: 'month', label: '📊 Este Mes' },
                { id: 'today', label: '📅 Hoy' },
                { id: 'last30', label: '🗓️ 30 Días' },
                { id: 'all', label: '📚 Todo el Historial' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeRange(t.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: timeRange === t.id ? '#ffffff' : 'transparent',
                    color: timeRange === t.id ? '#0f172a' : '#64748b',
                    fontWeight: timeRange === t.id ? 800 : 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: timeRange === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleEnableOrTestNotification}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '12px',
                border: notifPermission === 'granted' ? '1.5px solid #10b981' : '1.5px solid #f472b6',
                background: notifPermission === 'granted' ? '#ecfdf5' : '#fdf2f8',
                color: notifPermission === 'granted' ? '#065f46' : '#be185d',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
              title="Recibe un aviso en la esquina de la pantalla de Windows cada vez que alguien pague o cree una venta"
            >
              <Bell size={15} />
              <span>{notifPermission === 'granted' ? 'Avisos Activos' : 'Activar Avisos'}</span>
            </button>
          </div>
        </header>

        {/* DASHBOARD DE MÉTRICAS EN TIEMPO REAL (MAYRA) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* Card 1: Facturado */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ background: '#ecfdf5', color: '#10b981', padding: '10px', borderRadius: '10px', display: 'flex' }}>
              <FileCheck size={22} />
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Facturado Fiscal</span>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                ${fmt(stats.totalInvoicedUSD)}
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                Bs. {fmt(stats.totalInvoicedBs)}
              </span>
            </div>
          </div>

          {/* Card 2: Cobrado */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '10px', borderRadius: '10px', display: 'flex' }}>
              <Wallet size={22} />
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Cobrado en Caja/Banco</span>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#3b82f6' }}>
                ${fmt(stats.totalCollectedUSD)}
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                {paidSales.length - unpaidOrders.length} ventas procesadas
              </span>
            </div>
          </div>

          {/* Card 3: Por Pagar */}
          <div style={{
            background: unpaidOrders.length > 0 ? '#fffbeb' : '#ffffff',
            border: unpaidOrders.length > 0 ? '1.5px solid #fde68a' : '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ background: '#fef3c7', color: '#d97706', padding: '10px', borderRadius: '10px', display: 'flex' }}>
              <Clock size={22} />
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#92400e' }}>Por Cobrar (Crédito)</span>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#d97706' }}>
                ${fmt(stats.totalUnpaidUSD)}
              </div>
              <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 700 }}>
                {unpaidOrders.length} pedidos pendientes
              </span>
            </div>
          </div>

          {/* Card 4: Desglose Métodos */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '12px 14px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <span style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>Desglose por Métodos:</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#334155' }}>
              <div>📱 P. Móvil: <strong>${fmt(stats.byMethod.pagoMovil)}</strong></div>
              <div>💵 USD: <strong>${fmt(stats.byMethod.efectivoUSD)}</strong></div>
              <div>🇻🇪 Efec Bs: <strong>${fmt(stats.byMethod.efectivoBs)}</strong></div>
              <div>💳 Débito: <strong>${fmt(stats.byMethod.debito)}</strong></div>
            </div>
          </div>
        </div>

        {/* PESTAÑAS DE FILTRO */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className={`facturacion-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Clock size={16} />
            <span>Por Facturar (Notas)</span>
            <span className="facturacion-tab-badge pending">{pendingInvoices.length}</span>
          </button>

          <button 
            type="button"
            className={`facturacion-tab-btn ${activeTab === 'by_client' ? 'active' : ''}`}
            onClick={() => setActiveTab('by_client')}
            style={{
              borderColor: activeTab === 'by_client' ? '#3b82f6' : '#e2e8f0',
              background: activeTab === 'by_client' ? '#eff6ff' : '#ffffff',
              color: activeTab === 'by_client' ? '#1d4ed8' : '#64748b'
            }}
          >
            <Building2 size={16} color={activeTab === 'by_client' ? '#2563eb' : '#94a3b8'} />
            <span>🏢 Cuentas Acumuladas</span>
            <span className="facturacion-tab-badge" style={{ background: '#3b82f6', color: '#ffffff' }}>
              {accumulatedOrders.length}
            </span>
          </button>

          <button 
            type="button"
            className={`facturacion-tab-btn ${activeTab === 'invoiced' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoiced')}
          >
            <CheckCircle2 size={16} />
            <span>Facturadas</span>
            <span className="facturacion-tab-badge done">{completedInvoices.length}</span>
          </button>

          <button 
            type="button"
            className={`facturacion-tab-btn ${activeTab === 'unpaid' ? 'active' : ''}`}
            onClick={() => setActiveTab('unpaid')}
            style={{
              borderColor: activeTab === 'unpaid' ? '#f59e0b' : '#e2e8f0',
              background: activeTab === 'unpaid' ? '#fffbeb' : '#ffffff',
              color: activeTab === 'unpaid' ? '#92400e' : '#64748b'
            }}
          >
            <AlertCircle size={16} color={activeTab === 'unpaid' ? '#d97706' : '#94a3b8'} />
            <span>⏳ Por Pagar</span>
            <span className="facturacion-tab-badge" style={{ background: '#f59e0b', color: '#ffffff' }}>{unpaidOrders.length}</span>
          </button>

          <button 
            type="button"
            className={`facturacion-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Layers size={16} />
            <span>Todas</span>
            <span className="facturacion-tab-badge" style={{ background: '#64748b', color: '#ffffff' }}>{paidSales.length}</span>
          </button>
        </div>

        {/* BARRA DE BÚSQUEDA */}
        <div className="facturacion-search-bar">
          <Search size={18} color="#94a3b8" />
          <input 
            type="text" 
            className="facturacion-search-input"
            placeholder="Buscar por cliente, RIF, Nº de orden o Nº de factura..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* BARRA DE ACCIÓN MASIVA (PASAR TODO EL HISTORIAL A FACTURADO) */}
        {activeTab === 'pending' && pendingInvoices.length > 0 && (
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '14px 20px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>🌸</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                  Hay {pendingInvoices.length} ventas en espera de factura
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Pasa todo el historial a "Facturadas" para dejar la bandeja en 0 y recibir solo ventas nuevas.
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isMarkingAll}
              onClick={handleMarkAllAsInvoiced}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                background: isMarkingAll ? '#94a3b8' : '#10b981',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: isMarkingAll ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isMarkingAll ? 'none' : '0 2px 6px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <CheckCircle2 size={16} />
              {isMarkingAll ? 'Procesando...' : `Pasar todo (${pendingInvoices.length}) a Facturado`}
            </button>
          </div>
        )}

        {/* LISTA DE TARJETAS DE FACTURACIÓN */}
        {activeTab === 'by_client' ? (
          <div className="facturacion-list">
            {filteredGroupedClients.length === 0 ? (
              <div style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Building2 size={48} color="#cbd5e1" />
                <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
                  ¡No hay empresas con pedidos acumulados por facturar!
                </h3>
                <p style={{ margin: 0, fontSize: '13px', maxWidth: '440px' }}>
                  Cuando entren ventas o notas de clientes corporativos (como Inversolca), se agruparán automáticamente aquí para que Mayra pueda facturar toda la cuenta con un solo clic.
                </p>
              </div>
            ) : (
              filteredGroupedClients.map(group => {
                const isExpanded = Boolean(expandedGroupKeys[group.key]);
                const cleanRif = (group.clientRif || '').replace(/[-.\s]/g, '').toUpperCase().trim();
                const clientName = (group.clientName || 'Sin Nombre').toUpperCase();
                const address = (group.clientAddress || 'Caracas').toUpperCase();
                const phone = group.whatsapp || '';

                return (
                  <article key={group.key} className="factura-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    
                    {/* Fila Superior: Info de la Empresa y Montos Acumulados */}
                    <div className="factura-card-top">
                      <div className="factura-order-info">
                        <div style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          fontWeight: 900,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: '1px solid #bfdbfe'
                        }}>
                          <Building2 size={16} />
                          <span>{group.orders.length} {group.orders.length === 1 ? 'pedido acumulado' : 'pedidos acumulados'}</span>
                        </div>

                        <div>
                          <div className="factura-client-name" style={{ fontSize: '1.05rem', color: '#1e3a8a' }}>
                            {clientName}
                          </div>
                          <div className="factura-date" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                            <span>RIF: <strong>{cleanRif || 'No registrado'}</strong></span>
                            {phone && <span>· 📱 {formatDisplayPhone(phone)}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="factura-amounts" style={{ textAlign: 'right' }}>
                        <div>
                          <div className="factura-usd" style={{ color: '#2563eb' }}>${fmt(group.totalUSD)}</div>
                          <div className="factura-bs" style={{ fontWeight: 800 }}>Bs. {fmt(group.totalBs)} (Total con IVA)</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Base: Bs. {fmt(group.subtotalBs)} + IVA: Bs. {fmt(group.ivaBs)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Grilla de Datos Copiables */}
                    <div className="factura-data-grid">
                      {/* RIF */}
                      <div className="factura-field-box">
                        <div className="factura-field-info">
                          <span className="factura-field-label">RIF / C.I.</span>
                          <span className="factura-field-val" style={{ color: '#0f172a', fontWeight: 800 }}>{cleanRif || 'NO REGISTRADO'}</span>
                        </div>
                        <button 
                          type="button"
                          className={`factura-btn-copy ${copiedFieldId === `rif_${group.key}` ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(cleanRif, `rif_${group.key}`, 'RIF')}
                          title="Copiar RIF"
                        >
                          {copiedFieldId === `rif_${group.key}` ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedFieldId === `rif_${group.key}` ? 'Listo' : 'Copiar'}</span>
                        </button>
                      </div>

                      {/* Razón Social */}
                      <div className="factura-field-box">
                        <div className="factura-field-info">
                          <span className="factura-field-label">Razón Social</span>
                          <span className="factura-field-val">{clientName}</span>
                        </div>
                        <button 
                          type="button"
                          className={`factura-btn-copy ${copiedFieldId === `name_${group.key}` ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(clientName, `name_${group.key}`, 'Razón Social')}
                          title="Copiar Razón Social"
                        >
                          {copiedFieldId === `name_${group.key}` ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedFieldId === `name_${group.key}` ? 'Listo' : 'Copiar'}</span>
                        </button>
                      </div>

                      {/* Dirección Fiscal */}
                      <div className="factura-field-box">
                        <div className="factura-field-info">
                          <span className="factura-field-label">Dirección Fiscal</span>
                          <span className="factura-field-val">{address}</span>
                        </div>
                        <button 
                          type="button"
                          className={`factura-btn-copy ${copiedFieldId === `addr_${group.key}` ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(address, `addr_${group.key}`, 'Dirección')}
                          title="Copiar Dirección"
                        >
                          {copiedFieldId === `addr_${group.key}` ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedFieldId === `addr_${group.key}` ? 'Listo' : 'Copiar'}</span>
                        </button>
                      </div>

                      {/* Teléfono */}
                      <div className="factura-field-box">
                        <div className="factura-field-info">
                          <span className="factura-field-label">Teléfono</span>
                          <span className="factura-field-val">{phone || 'N/A'}</span>
                        </div>
                        <button 
                          type="button"
                          className={`factura-btn-copy ${copiedFieldId === `tel_${group.key}` ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(phone, `tel_${group.key}`, 'Teléfono')}
                          title="Copiar Teléfono"
                        >
                          {copiedFieldId === `tel_${group.key}` ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedFieldId === `tel_${group.key}` ? 'Listo' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Botón Acordeón Desplegable para ver pedidos */}
                    <div style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => toggleGroupExpand(group.key)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: isExpanded ? '#f8fafc' : '#ffffff',
                          color: '#334155',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Package size={14} color="#3b82f6" /> {isExpanded ? 'Ocultar desglose de pedidos' : `Ver detalle de los ${group.orders.length} pedidos incluidos`}
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {/* Detalle Desplegado de Órdenes Individuales */}
                      {isExpanded && (
                        <div style={{
                          marginTop: '6px',
                          padding: '10px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          {group.orders.map(o => {
                            const oUSD = getOrderTotalUSD(o);
                            const oBs = getOrderTotalBs(o);
                            const oDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }) : '';
                            return (
                              <div key={o.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 10px',
                                background: '#ffffff',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '11.5px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 900, color: '#10b981', background: '#ecfdf5', padding: '2px 6px', borderRadius: '4px' }}>
                                    #{o.orderNumber || o.id.slice(-5)}
                                  </span>
                                  <span style={{ color: '#64748b' }}>{oDate}</span>
                                  <span style={{ fontWeight: 700, color: '#1e293b' }}>
                                    {Array.isArray(o.items) && o.items.length > 0 
                                      ? o.items.map(it => `${it.cantidad || 1}x ${it.nombre}`).join(', ') 
                                      : (o.details || 'Sello')}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                                    ${fmt(oUSD)} (Bs. {fmt(oBs)})
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleReturnToPending(o)}
                                    title="Devolver a la bandeja diaria de Por Facturar"
                                    style={{
                                      background: '#fee2e2',
                                      color: '#b91c1c',
                                      border: '1px solid #fca5a5',
                                      borderRadius: '4px',
                                      padding: '2px 6px',
                                      fontSize: '10.5px',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '3px'
                                    }}
                                  >
                                    <RotateCcw size={11} /> Devolver
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Barra Inferior de Acciones */}
                    <div className="factura-actions-row" style={{ marginTop: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="factura-btn-copy"
                          onClick={() => handleCopyGroupSummary(group)}
                          title="Copiar datos fiscales y lista de sellos para la factura"
                          style={{
                            background: copiedFieldId === `group_${group.key}` ? '#ecfdf5' : '#ffffff',
                            color: copiedFieldId === `group_${group.key}` ? '#065f46' : '#334155',
                            borderColor: copiedFieldId === `group_${group.key}` ? '#86efac' : '#cbd5e1'
                          }}
                        >
                          <Copy size={13} />
                          <span>{copiedFieldId === `group_${group.key}` ? '¡Resumen Copiado!' : 'Copiar Resumen Fiscal'}</span>
                        </button>

                        {phone && (
                          <button
                            type="button"
                            className="factura-btn-copy"
                            onClick={() => handleSendGroupWhatsApp(group)}
                            style={{ color: '#15803d', borderColor: '#86efac', background: '#f0fdf4' }}
                            title="Enviar estado de cuenta por WhatsApp al cliente"
                          >
                            <MessageCircle size={13} />
                            <span>Estado de Cuenta WhatsApp</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        className="factura-btn-invoice"
                        onClick={() => {
                          setGroupInvoicingClient(group);
                          setInvoiceNumInput('');
                        }}
                        style={{
                          background: '#2563eb',
                          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                        }}
                      >
                        <FileCheck size={16} />
                        <span>Facturar Cuenta ({group.orders.length} pedidos)</span>
                      </button>
                    </div>

                  </article>
                );
              })
            )}
          </div>
        ) : (
          <div className="facturacion-list">
          {displayedList.length === 0 ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '48px 24px',
              textAlign: 'center',
              color: '#64748b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FileCheck size={48} color="#cbd5e1" />
              <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>
                {activeTab === 'pending' ? '¡Al día! No hay ventas pendientes por facturar' : 'No se encontraron ventas en esta sección'}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', maxWidth: '400px' }}>
                {activeTab === 'pending' 
                  ? 'Cada vez que el mostrador registre una venta o pedido, aparecerá aquí en tiempo real para Mayra.' 
                  : 'Utiliza las pestañas o el buscador para filtrar registros.'}
              </p>
            </div>
          ) : (
            paginatedList.map(order => {
              const cleanRif = (order.clientRif || order.rif || '').replace(/[-.\s]/g, '').toUpperCase();
              const clientName = (order.clientName || 'Sin Nombre').toUpperCase();
              const address = (order.clientAddress || order.address || 'Caracas').toUpperCase();
              const phone = order.whatsapp || order.phone || '';
              const totalUSD = getOrderTotalUSD(order);
              const totalBs = getOrderTotalBs(order);
              const subtotalBs = Number(order.subtotalBs) || (totalBs / 1.16);
              const ivaBs = order.ivaBs !== undefined ? Number(order.ivaBs) : (totalBs - subtotalBs);
              const dateFormatted = new Date(order.paidAt || order.createdAt || 0).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
              const isOrderUnpaid = order.isPaid === false || order.paymentMethod === 'Por Pagar';

              return (
                <article key={order.id} className="factura-card">
                  
                  {/* Fila Superior: Info del Pedido y Montos */}
                  <div className="factura-card-top">
                    <div className="factura-order-info">
                      <span className="factura-order-num">#{order.orderNumber || order.id.slice(-5)}</span>
                      <div>
                        <div className="factura-client-name">{clientName}</div>
                        <div className="factura-date" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>{order.paidAt ? `Cobrado: ${dateFormatted}` : `Creado: ${dateFormatted}`}</span>
                          <span style={{
                            padding: '1px 7px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: isOrderUnpaid ? '#fef3c7' : '#ecfdf5',
                            color: isOrderUnpaid ? '#b45309' : '#065f46',
                            border: isOrderUnpaid ? '1px solid #fde68a' : '1px solid #a7f3d0'
                          }}>
                            {isOrderUnpaid ? '⏳ POR PAGAR' : (order.paymentMethod || 'Pagado')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="factura-amounts">
                      <div>
                        <div className="factura-usd">${fmt(totalUSD)}</div>
                        <div className="factura-bs">Bs. {fmt(totalBs)} (con IVA)</div>
                      </div>
                    </div>
                  </div>

                  {/* Grilla de Datos Copiables para el Software de Facturación */}
                  <div className="factura-data-grid">
                    
                    {/* RIF */}
                    <div className="factura-field-box">
                      <div className="factura-field-info">
                        <span className="factura-field-label">RIF / C.I.</span>
                        <span className="factura-field-val" style={{ color: '#0f172a', fontWeight: 800 }}>{cleanRif || 'NO REGISTRADO'}</span>
                      </div>
                      <button 
                        type="button"
                        className={`factura-btn-copy ${copiedFieldId === `rif_${order.id}` ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(cleanRif, `rif_${order.id}`, 'RIF')}
                        title="Copiar RIF limpio"
                      >
                        {copiedFieldId === `rif_${order.id}` ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedFieldId === `rif_${order.id}` ? 'Listo' : 'Copiar'}</span>
                      </button>
                    </div>

                    {/* Razón Social */}
                    <div className="factura-field-box">
                      <div className="factura-field-info">
                        <span className="factura-field-label">Razón Social</span>
                        <span className="factura-field-val">{clientName}</span>
                      </div>
                      <button 
                        type="button"
                        className={`factura-btn-copy ${copiedFieldId === `name_${order.id}` ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(clientName, `name_${order.id}`, 'Razón Social')}
                        title="Copiar Razón Social"
                      >
                        {copiedFieldId === `name_${order.id}` ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedFieldId === `name_${order.id}` ? 'Listo' : 'Copiar'}</span>
                      </button>
                    </div>

                    {/* Dirección Fiscal */}
                    <div className="factura-field-box">
                      <div className="factura-field-info">
                        <span className="factura-field-label">Dirección Fiscal</span>
                        <span className="factura-field-val">{address}</span>
                      </div>
                      <button 
                        type="button"
                        className={`factura-btn-copy ${copiedFieldId === `addr_${order.id}` ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(address, `addr_${order.id}`, 'Dirección')}
                        title="Copiar Dirección"
                      >
                        {copiedFieldId === `addr_${order.id}` ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedFieldId === `addr_${order.id}` ? 'Listo' : 'Copiar'}</span>
                      </button>
                    </div>

                    {/* Teléfono */}
                    <div className="factura-field-box">
                      <div className="factura-field-info">
                        <span className="factura-field-label">Teléfono</span>
                        <span className="factura-field-val">{formatDisplayPhone(phone) || '—'}</span>
                      </div>
                      <button 
                        type="button"
                        className={`factura-btn-copy ${copiedFieldId === `phone_${order.id}` ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(phone, `phone_${order.id}`, 'Teléfono')}
                        title="Copiar Teléfono"
                      >
                        {copiedFieldId === `phone_${order.id}` ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedFieldId === `phone_${order.id}` ? 'Listo' : 'Copiar'}</span>
                      </button>
                    </div>

                    {/* Base Imponible (Bs) */}
                    <div className="factura-field-box">
                      <div className="factura-field-info">
                        <span className="factura-field-label">Base Imponible (Bs)</span>
                        <span className="factura-field-val">Bs. {fmt(subtotalBs)}</span>
                      </div>
                      <button 
                        type="button"
                        className={`factura-btn-copy ${copiedFieldId === `base_${order.id}` ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(subtotalBs.toFixed(2).replace('.', ','), `base_${order.id}`, 'Base Imponible')}
                        title="Copiar Base Imponible en Bs"
                      >
                        {copiedFieldId === `base_${order.id}` ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedFieldId === `base_${order.id}` ? 'Listo' : 'Copiar'}</span>
                      </button>
                    </div>

                    {/* IVA 16% (Bs) */}
                    <div className="factura-field-box">
                      <div className="factura-field-info">
                        <span className="factura-field-label">IVA 16% (Bs)</span>
                        <span className="factura-field-val">Bs. {fmt(ivaBs)}</span>
                      </div>
                      <button 
                        type="button"
                        className={`factura-btn-copy ${copiedFieldId === `iva_${order.id}` ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(ivaBs.toFixed(2).replace('.', ','), `iva_${order.id}`, 'IVA')}
                        title="Copiar IVA en Bs"
                      >
                        {copiedFieldId === `iva_${order.id}` ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedFieldId === `iva_${order.id}` ? 'Listo' : 'Copiar'}</span>
                      </button>
                    </div>

                  </div>

                  {/* Fila de Acciones: Copiar todo + Botón "Marcar como Facturado" */}
                  <div className="factura-actions-row">
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        type="button"
                        className={`factura-btn-copy ${copiedFieldId === `full_${order.id}` ? 'copied' : ''}`}
                        style={{ padding: '8px 14px', fontSize: '12px' }}
                        onClick={() => copyFullSheet(order)}
                      >
                        {copiedFieldId === `full_${order.id}` ? <Check size={14} /> : <Copy size={14} />}
                        <span>Copiar Ficha Completa</span>
                      </button>

                      <button 
                        type="button"
                        className="factura-btn-copy"
                        style={{ padding: '8px 14px', fontSize: '12px' }}
                        onClick={() => setSelectedSaleForDetail(order)}
                      >
                        <ExternalLink size={14} />
                        <span>Ver Detalle</span>
                      </button>

                      {isOrderUnpaid && (
                        <button
                          type="button"
                          className="factura-btn-copy"
                          style={{ padding: '8px 14px', fontSize: '12px', background: '#ecfdf5', color: '#065f46', borderColor: '#10b981', fontWeight: 800 }}
                          onClick={() => handleMarkAsPaid(order)}
                        >
                          <CheckCircle2 size={14} color="#10b981" />
                          <span>Registrar Pago</span>
                        </button>
                      )}

                      {!order.isInvoiced && !order.isAccumulated && (
                        <button 
                          type="button"
                          className="factura-btn-copy"
                          style={{
                            padding: '8px 14px',
                            fontSize: '12px',
                            background: '#eff6ff',
                            color: '#1e40af',
                            borderColor: '#bfdbfe',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          onClick={() => handleMoveToAccumulated(order)}
                          title="Mover este pedido a Cuentas Acumuladas (desaparece de Por Facturar diario)"
                        >
                          <Building2 size={14} color="#2563eb" />
                          <span>Mover a Acumuladas</span>
                        </button>
                      )}
                    </div>

                    {/* Acción de Facturación */}
                    {!order.isInvoiced ? (
                      <button 
                        type="button"
                        className="factura-btn-invoice"
                        onClick={() => {
                          setInvoicingOrder(order);
                          setInvoiceNumInput('');
                        }}
                      >
                        <CheckCircle2 size={16} />
                        <span>Marcar como Facturado</span>
                      </button>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="factura-invoiced-badge">
                          <CheckCircle2 size={16} color="#10b981" />
                          <span>Factura #{order.invoiceNumber || 'S/N'} · {order.invoicedBy || 'Mayra'} ({new Date(order.invoicedAt || 0).toLocaleDateString('es-VE')})</span>
                        </div>
                        <button 
                          type="button"
                          className="factura-btn-copy"
                          title="Desmarcar factura"
                          onClick={() => handleUnmarkInvoice(order)}
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    )}

                  </div>

                </article>
              );
            })
          )}
        </div>
        )}

        {/* CONTROLES DE PAGINACIÓN */}
        {activeTab !== 'by_client' && displayedList.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid #e2e8f0',
            marginTop: '16px',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              Mostrando <strong style={{ color: '#0f172a' }}>{(currentPage - 1) * itemsPerPage + 1}</strong> a <strong style={{ color: '#0f172a' }}>{Math.min(currentPage * itemsPerPage, displayedList.length)}</strong> de <strong style={{ color: '#10b981' }}>{displayedList.length}</strong> ventas
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: currentPage <= 1 ? '#f8fafc' : '#ffffff',
                  color: currentPage <= 1 ? '#94a3b8' : '#0f172a',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ChevronLeft size={16} /> Anterior
              </button>

              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', padding: '0 8px' }}>
                Página {currentPage} de {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
                  color: currentPage >= totalPages ? '#94a3b8' : '#0f172a',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>
              <span>Por página:</span>
              <select
                value={itemsPerPage}
                onChange={e => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontWeight: 800,
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <option value={20}>20</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PARA MARCAR FACTURADO INDIVIDUAL */}
      {invoicingOrder && (
        <div className="modal-overlay" onClick={() => setInvoicingOrder(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="#10b981" /> Confirmar Facturación
              </h3>
              <button 
                onClick={() => setInvoicingOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 12px 0' }}>
                Registrar como procesado el pedido <strong>#{invoicingOrder.orderNumber}</strong> de <strong>{invoicingOrder.clientName}</strong>.
              </p>
              <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                Número de Factura Fiscal (Opcional)
              </label>
              <input 
                type="text" 
                className="modal-input"
                placeholder="Ej: 00452 o FAC-129"
                value={invoiceNumInput}
                onChange={e => setInvoiceNumInput(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleConfirmInvoice(); }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button 
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 700 }}
                onClick={() => setInvoicingOrder(null)}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="btn-primary"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 800, background: '#10b981' }}
                onClick={handleConfirmInvoice}
                disabled={savingInvoice}
              >
                {savingInvoice ? 'Guardando...' : '✓ Ya Facturé Este Recibo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA MARCAR FACTURACIÓN GRUPAL POR EMPRESA */}
      {groupInvoicingClient && (
        <div className="modal-overlay" onClick={() => setGroupInvoicingClient(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={20} color="#2563eb" /> Facturar Cuenta Completa
              </h3>
              <button 
                onClick={() => setGroupInvoicingClient(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#1e3a8a' }}>
                  {groupInvoicingClient.clientName}
                </div>
                <div style={{ fontSize: '12px', color: '#1e40af', marginTop: '2px' }}>
                  RIF: <strong>{groupInvoicingClient.clientRif || 'N/A'}</strong> · <strong>{groupInvoicingClient.orders.length} pedidos acumulados</strong>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                  Total a Facturar: <span style={{ color: '#2563eb' }}>${fmt(groupInvoicingClient.totalUSD)}</span> (Bs. {fmt(groupInvoicingClient.totalBs)})
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Número de Factura Fiscal Consolidada
                </label>
                <input 
                  type="text" 
                  className="modal-input"
                  placeholder="Ej: FAC-00984 o 00984"
                  value={invoiceNumInput}
                  onChange={e => setInvoiceNumInput(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleConfirmGroupInvoice(); }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Al confirmar, los {groupInvoicingClient.orders.length} pedidos se marcarán simultáneamente como facturados con este número de factura.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button 
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 700 }}
                onClick={() => setGroupInvoicingClient(null)}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="btn-primary"
                style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: 800, background: '#2563eb' }}
                onClick={handleConfirmGroupInvoice}
                disabled={savingGroupInvoice}
              >
                {savingGroupInvoice ? 'Procesando...' : `✓ Facturar los ${groupInvoicingClient.orders.length} Pedidos`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE COMPLETO SI SE DESEA */}
      {selectedSaleForDetail && (
        <SaleDetailModal 
          order={selectedSaleForDetail}
          onClose={() => setSelectedSaleForDetail(null)}
        />
      )}

    </div>
  );
}
