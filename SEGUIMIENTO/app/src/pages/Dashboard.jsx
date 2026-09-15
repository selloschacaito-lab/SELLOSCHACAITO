import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { Search, Bell, MapPin, FolderArchive, Plus, Sparkles, ChevronDown, FileText, ShoppingCart } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import OrderModal from '../components/OrderModal';
import PrintAlertsModal from '../components/PrintAlertsModal';
import NewOrderModal from '../components/NewOrderModal';
import DeliveryMapModal from '../components/DeliveryMapModal';
import POSModal from '../components/POSModal';

function Dashboard() {
  const [orders, setOrders] = useState({});
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState(null);
  const [printAlerts, setPrintAlerts] = useState({});
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPosModal, setShowPosModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Cerrar dropdown al hacer click afuera
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Al igual que en la versión anterior, saltamos la autenticación (REQUIRE_AUTH = false)
    const ordersRef = ref(db, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      setOrders(data || {});
      setLoadingOrders(false);
    });

    // El sonido + notificación nativa para Felizai ahora vive en Layout.jsx
    // (así le suena sin importar en qué página esté, no solo aquí en Pedidos).
    // Acá solo se guarda la lista para el badge/campanita de esta pantalla.
    const printAlertsRef = ref(db, 'print_alerts');
    const unsubscribeAlerts = onValue(printAlertsRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};
      setPrintAlerts(data);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeAlerts();
    };
  }, []);

  // Calcular estadísticas
  const ordersList = Object.values(orders).filter(o => !o.isDeleted);
  const activeOrders = ordersList.filter(o => o.status !== 'delivered');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const ordersToday = ordersList.filter(o => {
    if (!o.createdAt) return false;
    try {
      const d = new Date(o.createdAt);
      return !isNaN(d) && d.toISOString().startsWith(todayStr);
    } catch (e) { return false; }
  }).length;
  
  const readyOrders = ordersList.filter(o => o.status === 'finished' || o.status === 'packed').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header className="glass app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
          {/* Logo compacto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <img src="/logo-sc.png?v=1" alt="Logo" style={{ width: '1.75rem', height: '1.75rem', objectFit: 'contain', borderRadius: '50%' }} />
            <span className="hide-on-mobile" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Sellos Chacaito</span>
          </div>

          {/* Búsqueda compacta */}
          <div className="search-box" style={{ flex: '0 1 280px', marginTop: 0 }}>
            <Search className="search-icon" size={14} />
            <input 
              type="search" 
              placeholder="Buscar..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ height: '32px', fontSize: '0.8rem', borderRadius: '0.5rem', paddingLeft: '2rem' }}
            />
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Acciones */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button 
              className="btn-secondary" 
              onClick={() => setShowAlertsModal(true)}
              style={{ position: 'relative', padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
            >
              <Bell size={14} /> <span className="hide-on-mobile">Alertas</span>
              {Object.keys(printAlerts).length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {Object.keys(printAlerts).length}
                </span>
              )}
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setIsMapOpen(true)}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
            >
              <MapPin size={14} /> <span className="hide-on-mobile">Mapa</span>
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setShowArchived(!showArchived)}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', backgroundColor: showArchived ? 'var(--surface-hover)' : 'transparent', color: showArchived ? 'var(--text-main)' : 'var(--text-muted)' }}
            >
              <FolderArchive size={14} /> <span className="hide-on-mobile">{showArchived ? 'Ocultar Arch.' : 'Archivados'}</span>
            </button>

            {/* Selector de Nuevo Pedido / Nueva Venta */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)} 
                title="Crear Nuevo Pedido o Venta"
                style={{ 
                  width: '36px',
                  height: '36px',
                  minHeight: '36px',
                  padding: 0,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>

              {showDropdown && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
                  width: '170px',
                  zIndex: 100,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'scalePop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both'
                }}>
                  <button
                    onClick={() => {
                      setShowNewOrderModal(true);
                      setShowDropdown(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'transparent',
                      color: '#0f172a',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <FileText size={16} color="#10b981" />
                    <span>Nuevo Pedido</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowPosModal(true);
                      setShowDropdown(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'transparent',
                      color: '#0f172a',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      textAlign: 'left',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <ShoppingCart size={16} color="#10b981" />
                    <span>Nueva Venta</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="glass-card workspace">
        <div className="workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <h2 className="workspace-title">{showArchived ? 'Pedidos Archivados (Entregados)' : 'Panel de Pedidos Activos'}</h2>
        </div>
        {loadingOrders ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1.5rem' }}>⏳</span>
            <p style={{ marginTop: '8px', fontWeight: 700 }}>Cargando pedidos...</p>
          </div>
        ) : (
          <KanbanBoard
            orders={orders}
            searchTerm={searchTerm}
            showArchived={showArchived}
            highlightedOrderId={highlightedOrderId}
            onOrderClick={(order) => {
              if (highlightedOrderId) setHighlightedOrderId(null);
              setSelectedOrder(order);
            }}
          />
        )}
      </main>

      {selectedOrder && (
        <OrderModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onEdit={(order) => {
            setOrderToEdit(order);
            setShowNewOrderModal(true);
            setSelectedOrder(null);
          }}
        />
      )}

      {showAlertsModal && (
        <PrintAlertsModal 
          alerts={printAlerts} 
          onClose={() => setShowAlertsModal(false)} 
        />
      )}

      {showNewOrderModal && (
        <NewOrderModal 
          orders={orders}
          onClose={() => {
            setShowNewOrderModal(false);
            setOrderToEdit(null);
          }} 
          onHighlightOrder={(orderId) => {
            setHighlightedOrderId(orderId);
            setShowNewOrderModal(false);
            setOrderToEdit(null);
          }}
          onSelectOrder={(order) => {
            setSelectedOrder(order);
            setShowNewOrderModal(false);
            setOrderToEdit(null);
          }}
          editOrder={orderToEdit}
        />
      )}

      {isMapOpen && (
        <DeliveryMapModal onClose={() => setIsMapOpen(false)} />
      )}

      {showPosModal && (
        <POSModal 
          isOpen={showPosModal} 
          onClose={() => setShowPosModal(false)} 
        />
      )}
    </div>
  );
}

export default Dashboard;
