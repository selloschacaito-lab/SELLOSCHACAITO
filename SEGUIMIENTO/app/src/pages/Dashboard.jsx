import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { Package, Search, Bell, MapPin, PanelLeft, FolderArchive, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import KanbanBoard from '../components/KanbanBoard';
import OrderModal from '../components/OrderModal';
import PrintAlertsModal from '../components/PrintAlertsModal';
import NewOrderModal from '../components/NewOrderModal';
import DeliveryMapModal from '../components/DeliveryMapModal';

function Dashboard() {
  const { toggleSidebar } = useOutletContext();
  const [orders, setOrders] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printAlerts, setPrintAlerts] = useState({});
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const initialLoadRef = useRef(true);

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
    // Al igual que en la versin anterior, saltamos la autenticacin (REQUIRE_AUTH = false)
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

  // Calcular estadsticas
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
            <button className="btn-new-order" onClick={() => setShowNewOrderModal(true)} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', minHeight: '32px' }}>
              <span className="hide-on-mobile">+ Nuevo pedido</span>
              <span className="show-on-mobile" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>+</span>
            </button>
          </div>
        </div>
      </header>

      <main className="glass-card workspace">
        <div className="workspace-header">
          <h2 className="workspace-title">{showArchived ? 'Pedidos Archivados (Entregados)' : 'Panel de Pedidos Activos'}</h2>
        </div>
        <KanbanBoard 
          orders={orders} 
          searchTerm={searchTerm} 
          showArchived={showArchived}
          onOrderClick={setSelectedOrder} 
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
          onClose={() => {
            setShowNewOrderModal(false);
            setOrderToEdit(null);
          }} 
          editOrder={orderToEdit}
        />
      )}

      {isMapOpen && (
        <DeliveryMapModal onClose={() => setIsMapOpen(false)} />
      )}
    </div>
  );
}

export default Dashboard;
