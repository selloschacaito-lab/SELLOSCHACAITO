import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase/config';
import { ref, onValue, remove } from 'firebase/database';
import { X, Search, Copy, Printer, Edit3, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Calendar, CreditCard, Filter, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import POSModal from './POSModal';
import SaleDetailModal from './SaleDetailModal';
import PrintNotaModal from './PrintNotaModal';
import { formatDisplayPhone } from '../utils/formatters';

function fmt(n, decimals = 2) {
  return Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const STATUS_LABELS = {
  fina: 'Pagado',
  printing: 'Impresion',
  production: 'Produccion',
  finished: 'Finalizado',
  packed: 'Empacado',
  delivered: 'Entregado',
  design_sent: 'Diseno Enviado',
  waiting_payment: 'Esperando Pago'
};

const PAYMENT_METHODS = ['Pago Movil', 'Efectivo Bs', 'Efectivo USD', 'Debito / Punto', 'Pago Mixto'];

export default function SalesHistoryModal({ onClose }) {
  const [orders, setOrders] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPosModal, setShowPosModal] = useState(false);
  const [posOrderToEdit, setPosOrderToEdit] = useState(null);
  const [selectedSaleForDetail, setSelectedSaleForDetail] = useState(null);
  const [selectedSaleForPrint, setSelectedSaleForPrint] = useState(null);

  useEffect(() => {
    const unsub = onValue(ref(db, 'orders'), (snapshot) => {
      setOrders(snapshot.val() || {});
    });
    return () => unsub();
  }, []);

  const paidSales = useMemo(() => {
    return Object.entries(orders || {}).map(([key, val]) => ({
      id: key,
      ...(val && typeof val === 'object' ? val : {})
    })).filter(o => {
      if (!o || o.status === 'cancelled') return false;
      return (
        o.status === 'fina' || 
        o.hasFinaReceipt === true || 
        Boolean(o.paidAt && (Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0)) ||
        (o.status === 'delivered' && (Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0)) ||
        ((Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0) && Boolean(o.paymentMethod) && o.status !== 'design_sent')
      );
    });
  }, [orders]);

  const filteredSales = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    let results = paidSales.filter(o => {
      if (dateFrom || dateTo) {
        const d = (o.paidAt || o.createdAt || '').split('T')[0];
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
      }
      if (statusFilter !== 'all') {
        if (statusFilter === 'pagado' && o.status === 'delivered') return false;
        if (statusFilter === 'entregado' && o.status !== 'delivered') return false;
      }
      if (paymentFilter !== 'all') {
        if (!o.paymentMethod?.toLowerCase().includes(paymentFilter.toLowerCase())) return false;
      }
      if (q) {
        if (!(
          o.clientName?.toLowerCase().includes(q) ||
          o.clientRif?.toLowerCase().includes(q) ||
          o.orderNumber?.toString().includes(q) ||
          o.whatsapp?.includes(q)
        )) return false;
      }
      return true;
    });
    results.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'total':
          valA = Number(a.totalAmount) || 0;
          valB = Number(b.totalAmount) || 0;
          break;
        case 'orderNumber':
          valA = parseInt(a.orderNumber, 10) || 0;
          valB = parseInt(b.orderNumber, 10) || 0;
          break;
        default:
          valA = new Date(a.paidAt || a.createdAt || 0).getTime();
          valB = new Date(b.paidAt || b.createdAt || 0).getTime();
          break;
      }
      return sortDir === 'desc' ? valB - valA : valA - valB;
    });
    return results;
  }, [paidSales, searchTerm, dateFrom, dateTo, statusFilter, paymentFilter, sortBy, sortDir]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(prev => prev === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />;
  };

  const handleDeleteSale = async (sale) => {
    if (window.confirm('Seguro que deseas eliminar el pedido #' + (sale.orderNumber || sale.id.slice(-5)) + ' de ' + (sale.clientName || 'Cliente') + '?')) {
      try {
        await remove(ref(db, 'orders/' + sale.id));
        toast.success('Venta eliminada');
        if (selectedOrder?.id === sale.id) setSelectedOrder(null);
      } catch(err) { toast.error('Error al eliminar'); }
    }
  };

  const activeFiltersCount = [dateFrom, dateTo, statusFilter !== 'all' ? statusFilter : '', paymentFilter !== 'all' ? paymentFilter : ''].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm(''); setDateFrom(''); setDateTo('');
    setStatusFilter('all'); setPaymentFilter('all');
    setSortBy('date'); setSortDir('desc');
  };

  const thS = { padding: '10px 14px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', userSelect: 'none' };
  const tdS = { padding: '10px 14px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' };
  const actBtn = { padding: '4px 6px', fontSize: '0.7rem', borderRadius: '6px', display: 'flex', alignItems: 'center', cursor: 'pointer' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', background: 'rgba(0,0,0,0.5)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
        
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Historial de Ventas</h2>
            <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '2px 0 0' }}>{filteredSales.length} de {paidSales.length} ventas</p>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', color: '#475569', display: 'flex' }}><X size={22}/></button>
        </div>

        <div style={{ padding: '12px 24px', display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '400px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
            <input type="text" placeholder="Buscar por nombre, RIF, #orden o telefono..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', outline: 'none' }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '8px', cursor: 'pointer', background: showFilters || activeFiltersCount > 0 ? '#dcfce7' : '#fff', border: '1px solid ' + (showFilters || activeFiltersCount > 0 ? '#16a34a' : '#cbd5e1'), color: showFilters || activeFiltersCount > 0 ? '#16a34a' : '#475569' }}>
            <Filter size={14} /> Filtros {activeFiltersCount > 0 && <span style={{ background: '#16a34a', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{activeFiltersCount}</span>}
          </button>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[{ field: 'date', label: 'Fecha' }, { field: 'total', label: 'Monto' }, { field: 'orderNumber', label: 'N Orden' }].map(s => (
              <button key={s.field} onClick={() => handleSort(s.field)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', background: sortBy === s.field ? '#1e293b' : '#fff', border: '1px solid ' + (sortBy === s.field ? '#1e293b' : '#cbd5e1'), color: sortBy === s.field ? '#fff' : '#475569' }}>
                {s.label} <SortIcon field={s.field} />
              </button>
            ))}
          </div>
          {activeFiltersCount > 0 && <button onClick={clearFilters} style={{ padding: '6px 10px', fontSize: '0.75rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>Limpiar</button>}
        </div>

        {showFilters && (
          <div style={{ padding: '12px 24px', display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', background: '#f0fdf4', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} style={{ color: '#64748b' }} />
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Desde:</span>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Hasta:</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Hash size={14} style={{ color: '#64748b' }} />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}>
                <option value="all">Todos los estados</option>
                <option value="pagado">Pagado</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={14} style={{ color: '#64748b' }} />
              <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} style={{ padding: '5px 8px', fontSize: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}>
                <option value="all">Todos los metodos</option>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 2 }}>
                  <th style={thS}>N Orden</th>
                  <th style={thS}>Cliente / RIF</th>
                  <th style={thS}>Fecha</th>
                  <th style={{ ...thS, cursor: 'pointer' }} onClick={() => handleSort('total')}>Total ($) <SortIcon field="total" /></th>
                  <th style={thS}>Total (Bs)</th>
                  <th style={thS}>Metodo</th>
                  <th style={thS}>Estado</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.slice(0, visibleCount).map(sale => {
                  const totalUSD = Number(sale.totalAmount) || 0;
                  const totalBs = Number(sale.totalAmountBs) || Number(sale.subtotalBs) || 0;
                  const theDate = new Date(sale.paidAt || sale.createdAt || 0);
                  const isSelected = selectedOrder?.id === sale.id;
                  return (
                    <tr key={sale.id} onClick={() => setSelectedOrder(isSelected ? null : sale)}
                      style={{ cursor: 'pointer', background: isSelected ? '#f0fdf4' : 'transparent', borderLeft: isSelected ? '3px solid #16a34a' : '3px solid transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? '#f0fdf4' : 'transparent'; }}>
                      <td style={tdS}><span style={{ fontWeight: 700, color: '#1e293b' }}>#{sale.orderNumber || ''}</span></td>
                      <td style={tdS}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>{sale.clientName?.toUpperCase()}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{sale.clientRif} {sale.whatsapp ? ' - ' + formatDisplayPhone(sale.whatsapp) : ''}</div>
                      </td>
                      <td style={{ ...tdS, fontSize: '0.8rem', color: '#64748b' }}>{theDate.toLocaleDateString('es-VE')}</td>
                      <td style={{ ...tdS, fontWeight: 700, color: '#16a34a' }}>${fmt(totalUSD)}</td>
                      <td style={{ ...tdS, fontSize: '0.8rem', color: '#64748b' }}>Bs. {fmt(totalBs)}</td>
                      <td style={{ ...tdS, fontSize: '0.75rem', color: '#64748b' }}>{sale.paymentMethod || ''}</td>
                      <td style={tdS}>
                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '10px', fontWeight: 600, background: sale.status === 'delivered' ? '#f1f5f9' : '#dcfce7', color: sale.status === 'delivered' ? '#475569' : '#16a34a' }}>
                          {STATUS_LABELS[sale.status] || sale.status}
                        </span>
                      </td>
                      <td style={{ ...tdS, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                          <button onClick={() => setSelectedSaleForDetail(sale)} className="btn-secondary" style={actBtn} title="Ver Detalle"><Copy size={12}/></button>
                          <button onClick={() => { setPosOrderToEdit(sale); setShowPosModal(true); }} className="btn-secondary" style={actBtn} title="Editar"><Edit3 size={12}/></button>
                          <button onClick={() => setSelectedSaleForPrint(sale)} className="btn-secondary" style={actBtn} title="Imprimir"><Printer size={12}/></button>
                          <button onClick={() => handleDeleteSale(sale)} style={{ ...actBtn, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }} title="Eliminar"><Trash2 size={12}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSales.length === 0 && (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No se encontraron ventas con estos filtros.</td></tr>
                )}
              </tbody>
            </table>
            {filteredSales.length > visibleCount && (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <button onClick={() => setVisibleCount(prev => prev + 50)} className="btn-secondary" style={{ padding: '8px 24px', fontSize: '0.85rem', fontWeight: 600 }}>
                  Cargar mas ({filteredSales.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>

          {selectedOrder && (
            <div style={{ width: '360px', flexShrink: 0, borderLeft: '1px solid #e2e8f0', background: '#fafffe', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Pedido #{selectedOrder.orderNumber || ''}</h3>
                <button onClick={() => setSelectedOrder(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><X size={18}/></button>
              </div>
              <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Cliente</div>
                <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{selectedOrder.clientName}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{selectedOrder.clientRif}</div>
                {selectedOrder.whatsapp && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDisplayPhone(selectedOrder.whatsapp)}</div>}
              </div>
              <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Productos</div>
                {(selectedOrder.items || selectedOrder.cart || []).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(selectedOrder.items || selectedOrder.cart || []).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre || item.name || 'Producto'}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>x{item.cantidad || item.quantity || 1}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>${fmt(item.precioUSD || item.price || 0)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin productos detallados</div>
                )}
              </div>
              <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Pago</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Metodo:</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedOrder.paymentMethod || ''}</span>
                  </div>
                  {selectedOrder.paymentRef && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Referencia:</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedOrder.paymentRef}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>Total USD:</span>
                    <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '1.1rem' }}>${fmt(selectedOrder.totalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Total Bs:</span>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Bs. {fmt(selectedOrder.totalAmountBs || selectedOrder.subtotalBs)}</span>
                  </div>
                  {selectedOrder.tasaBCV && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: '#94a3b8' }}>Tasa BCV:</span>
                      <span style={{ color: '#94a3b8' }}>{fmt(selectedOrder.tasaBCV, 4)}</span>
                    </div>
                  )}
                </div>
              </div>
              {selectedOrder.hasDelivery && (
                <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Envio</div>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                    {selectedOrder.deliveryType === 'motorizado' ? 'Motorizado' : selectedOrder.deliveryType === 'mrw' ? 'MRW' : selectedOrder.deliveryType === 'zoom' ? 'ZOOM' : selectedOrder.deliveryType}
                  </div>
                  {selectedOrder.deliveryAddress && <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{selectedOrder.deliveryAddress}</div>}
                </div>
              )}
              <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Fechas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.8rem', color: '#64748b' }}>
                  {selectedOrder.paidAt && <div>Pagado: {new Date(selectedOrder.paidAt).toLocaleString('es-VE')}</div>}
                  {selectedOrder.createdAt && <div>Creado: {new Date(selectedOrder.createdAt).toLocaleString('es-VE')}</div>}
                </div>
              </div>
              <div style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => { setPosOrderToEdit(selectedOrder); setShowPosModal(true); }} className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Edit3 size={14} /> Editar
                </button>
                <button onClick={() => setSelectedSaleForPrint(selectedOrder)} className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Printer size={14} /> Imprimir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPosModal && <POSModal order={posOrderToEdit} onClose={() => { setShowPosModal(false); setPosOrderToEdit(null); }} onSuccess={() => { setShowPosModal(false); setPosOrderToEdit(null); }} />}
      {selectedSaleForDetail && <SaleDetailModal order={selectedSaleForDetail} onClose={() => setSelectedSaleForDetail(null)} onEdit={(sale) => { setSelectedSaleForDetail(null); setPosOrderToEdit(sale); setShowPosModal(true); }} onDelete={handleDeleteSale} />}
      {selectedSaleForPrint && <PrintNotaModal order={selectedSaleForPrint} onClose={() => setSelectedSaleForPrint(null)} />}
    </div>
  );
}
