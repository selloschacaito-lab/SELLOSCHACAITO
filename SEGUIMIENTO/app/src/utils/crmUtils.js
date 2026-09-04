import { doc, updateDoc } from 'firebase/firestore';

/**
 * Normalizes phone number to last 8 digits for flexible matching
 */
function cleanPhoneDigits(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(-8) : digits;
}

/**
 * Calculates CRM Tag based on rules:
 * - VIP: >$100 total USD or >=5 orders
 * - FRECUENTE: >$30 total USD or 2-4 orders
 * - INACTIVO: >0 orders and >45 days without purchases
 * - NUEVO: 0 orders
 */
export function calculateClientTag(totalUSD, totalOrders, daysSinceLastOrder) {
  if (!totalOrders || totalOrders === 0) {
    return {
      id: 'nuevo',
      label: 'NUEVO',
      color: '#3b82f6', // blue
      bg: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.3)'
    };
  }

  // Check Inactivo first if it has been more than 45 days
  if (daysSinceLastOrder !== null && daysSinceLastOrder > 45) {
    return {
      id: 'inactivo',
      label: 'INACTIVO',
      color: '#94a3b8', // slate/gray
      bg: 'rgba(148, 163, 184, 0.15)',
      border: 'rgba(148, 163, 184, 0.3)'
    };
  }

  if (totalUSD >= 100 || totalOrders >= 5) {
    return {
      id: 'vip',
      label: 'VIP',
      color: '#f59e0b', // amber/gold
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.35)'
    };
  }

  if (totalUSD >= 30 || (totalOrders >= 2 && totalOrders <= 4)) {
    return {
      id: 'frecuente',
      label: 'FRECUENTE',
      color: 'var(--primary, #47FF00)', // brand neon green
      bg: 'rgba(71, 255, 0, 0.12)',
      border: 'rgba(71, 255, 0, 0.3)'
    };
  }

  return {
    id: 'activo',
    label: 'ACTIVO',
    color: '#10b981', // emerald
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)'
  };
}

/**
 * Computes all metrics for a given client across all RTDB orders
 */
export function computeClientMetrics(client, allOrdersList = []) {
  if (!client) return null;

  const clientName = (client.nombre || client.name || '').trim().toUpperCase();
  const clientRif = (client.rif || client.cedula || '').trim().toUpperCase();
  const clientPhone = cleanPhoneDigits(client.whatsapp || client.phone || client.telefono);

  // 1. Find all orders belonging to this client
  const clientOrders = allOrdersList.filter(o => {
    if (!o) return false;
    if (o.clientId && o.clientId === client.id) return true;
    if (clientName && o.clientName && o.clientName.trim().toUpperCase() === clientName) return true;
    if (clientRif && o.clientRif && o.clientRif.trim().toUpperCase() === clientRif) return true;
    if (clientPhone && o.whatsapp && cleanPhoneDigits(o.whatsapp) === clientPhone) return true;
    return false;
  }).sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0));

  // 2. Filter completed/paid sales
  const salesOrders = clientOrders.filter(o => 
    o.status === 'fina' || 
    o.status === 'delivered' || 
    o.hasFinaReceipt === true ||
    Boolean(o.paidAt && Number(o.totalAmount || 0) > 0) ||
    (Number(o.totalAmount || 0) > 0 && o.status !== 'design_sent')
  );

  const totalUSD = salesOrders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  const totalBs = salesOrders.reduce((acc, o) => acc + (Number(o.totalAmountBs) || Number(o.subtotalBs) || 0), 0);
  const totalOrders = salesOrders.length;

  // 3. Determine last order date & days since last order
  let lastOrderDateStr = '-';
  let daysSinceLastOrder = null;

  if (salesOrders.length > 0) {
    const latest = salesOrders[0];
    const rawDate = latest.paidAt || latest.createdAt;
    if (rawDate) {
      const dateObj = new Date(rawDate);
      lastOrderDateStr = dateObj.toLocaleDateString('es-VE');
      const diffMs = Date.now() - dateObj.getTime();
      daysSinceLastOrder = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  // 4. Determine favorite product
  const productCounts = {};
  salesOrders.forEach(o => {
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach(it => {
        const name = (it.nombre || it.name || '').trim().toUpperCase();
        if (name) {
          const qty = Number(it.cantidad || it.quantity || 1);
          productCounts[name] = (productCounts[name] || 0) + qty;
        }
      });
    }
  });

  let favoriteProduct = '-';
  let maxCount = 0;
  Object.entries(productCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteProduct = name;
    }
  });

  // 5. Calculate CRM Tag
  const tag = calculateClientTag(totalUSD, totalOrders, daysSinceLastOrder);

  return {
    totalUSD: Number(totalUSD.toFixed(2)),
    totalBs: Number(totalBs.toFixed(2)),
    totalOrders,
    lastOrderDate: lastOrderDateStr,
    daysSinceLastOrder,
    favoriteProduct,
    tag,
    allOrders: clientOrders,
    salesOrders
  };
}

/**
 * Re-computes metrics and updates the Firestore client document in the background
 */
export async function syncClientStatsToFirestore(client, allOrdersList, firestoreDB) {
  if (!client?.id || !firestoreDB) return null;

  const metrics = computeClientMetrics(client, allOrdersList);
  if (!metrics) return null;

  try {
    const clientRef = doc(firestoreDB, 'clients', client.id);
    await updateDoc(clientRef, {
      totalGastado: metrics.totalUSD,
      totalGastadoBs: metrics.totalBs,
      ordenesTotales: metrics.totalOrders,
      ultimaOrden: metrics.lastOrderDate,
      productoMasComprado: metrics.favoriteProduct,
      crmTag: metrics.tag.id,
      statsUpdatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("CRM: non-blocking client stats sync error:", err);
  }

  return metrics;
}
