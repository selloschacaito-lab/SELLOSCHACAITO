import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { Package, Search, Bell, MapPin, PanelLeft, FolderArchive, Plus, Sparkles, ChevronDown, FileText, ShoppingCart, Users, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import KanbanBoard from '../components/KanbanBoard';
import OrderModal from '../components/OrderModal';
import PrintAlertsModal from '../components/PrintAlertsModal';
import NewOrderModal from '../components/NewOrderModal';
import DeliveryMapModal from '../components/DeliveryMapModal';
import POSModal from '../components/POSModal';
import Clients from './Clients';
import Inventory from './Inventory';

function Dashboard() {
  const { toggleSidebar } = useOutletContext();
  const [orders, setOrders] = useState({});
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
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const initialLoadRef = useRef(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (startTime) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'square'; // Onda cuadrada para que suene más fuerte/penetrante
        osc.frequency.setValueAtTime(880, startTime);
        osc.frequency.setValueAtTime(1200, startTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(1, startTime + 0.05); // Volúmen al máximo
        gainNode.gain.linearRampToValueAtTime(0, startTime + 0.3);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      };

      // Doble pitido
      playBeep(ctx.currentTime);
      playBeep(ctx.currentTime + 0.4);
    } catch (e) {
      console.error(e);
    }
  };

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
    });

    const printAlertsRef = ref(db, 'print_alerts');
    const unsubscribeAlerts = onValue(printAlertsRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};
      
      const isInitial = initialLoadRef.current;
      initialLoadRef.current = false;
      
      setPrintAlerts(prev => {
        if (!isInitial) {
          const prevIds = Object.keys(prev);
          const newIds = Object.keys(data).filter(id => !prevIds.includes(id));
          if (newIds.length > 0) {
            playAlertSound();
            newIds.forEach(id => {
              toast((t) => (
                <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🖨️</span>
                    <span style={{ whiteSpace: 'pre-line' }}>{`¡A imprimir!\nPedido de: ${data[id].clientName || 'Sin nombre'}`}</span>
                  </div>
                  <button 
                    onClick={() => toast.dismiss(t.id)}
                    style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem', padding: '4px', opacity: 0.8 }}
                    title="Cerrar"
                  >
                    ✕
                  </button>
                </div>
              ), {
                duration: 6000,
                style: { background: '#3b82f6', color: '#fff', borderRadius: '12px', padding: '12px 16px' }
              });
            });
          }
        }
        return data;
      });
    });

    return () => {
      unsubscribeOrders();
      unsubscribeAlerts();
    };
  }, []);

  // Calcular estadísticas
  const ordersList = Object.values(orders);
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
          {/* Sidebar toggle + Logo compacto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button 
              onClick={toggleSidebar}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}
              title="Abrir menú"
            >
              <PanelLeft size={18} />
            </button>
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
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-secondary"
              onClick={() => setShowClientsModal(true)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Users size={16} /> CLIENTES
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setShowInventoryModal(true)}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
            >
              <Package size={16} /> INVENTARIO
            </button>
          </div>
        </div>
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

      {showClientsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isMobile ? '#ffffff' : 'rgba(15, 23, 42, 0.45)',
          backdropFilter: isMobile ? 'none' : 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? 0 : '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '1200px',
            height: isMobile ? '100dvh' : '92vh',
            maxHeight: isMobile ? '100dvh' : '900px',
            borderRadius: isMobile ? 0 : '1.5rem',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isMobile ? 'none' : '0 20px 50px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                <div style={{ background: 'var(--primary, #47FF00)', color: '#1F2329', borderRadius: '8px', padding: '6px', display: 'flex' }}>
                  <Users size={18} />
                </div>
                CLIENTES
              </h3>
              <button 
                onClick={() => setShowClientsModal(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={20} color="#0f172a" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem' : '1.25rem' }}>
              <Clients isModal={true} />
            </div>
          </div>
        </div>
      )}

      {showInventoryModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: isMobile ? '#ffffff' : 'rgba(15, 23, 42, 0.45)',
          backdropFilter: isMobile ? 'none' : 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? 0 : '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '1200px',
            height: isMobile ? '100dvh' : '92vh',
            maxHeight: isMobile ? '100dvh' : '900px',
            borderRadius: isMobile ? 0 : '1.5rem',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isMobile ? 'none' : '0 20px 50px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                <div style={{ background: 'var(--primary, #47FF00)', color: '#1F2329', borderRadius: '8px', padding: '6px', display: 'flex' }}>
                  <Package size={18} />
                </div>
                INVENTARIO
              </h3>
              <button 
                onClick={() => setShowInventoryModal(false)} 
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={20} color="#0f172a" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0.75rem' : '1.25rem' }}>
              <Inventory isModal={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
