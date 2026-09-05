import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { Package, ListTodo, Users, Settings, LogOut, ChevronLeft, ClipboardList, PanelLeft, ShoppingBag, UserCircle, FileCheck, Wrench, DollarSign } from 'lucide-react';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { toast } from 'react-hot-toast';
import logoSvg from '../assets/logo.svg';

function Layout() {
  const { logout } = useAuth();
  const { activeProfile, logoutProfile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingInvoiceCount, setPendingInvoiceCount] = useState(0);
  const sidebarRef = useRef(null);
  const initialLoadRef = useRef(true);

  // Escuchar órdenes de Firebase para contar facturas pendientes y alertar a Mayra
  useEffect(() => {
    const ordersRef = ref(db, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...(val || {}) }));
      
      const pendingInvoices = list.filter(o => {
        if (!o || o.status === 'cancelled') return false;
        const isPaid = (
          o.status === 'fina' || 
          o.hasFinaReceipt === true || 
          Boolean(o.paidAt && (Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0)) ||
          (o.status === 'delivered' && (Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0)) ||
          ((Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0) && Boolean(o.paymentMethod) && o.status !== 'design_sent')
        );
        return isPaid && !o.isInvoiced && !o.isAccumulated;
      });

      const currentCount = pendingInvoices.length;

      // Si es el perfil de Mayra y entran nuevas ventas por facturar, alertar en Windows y en pantalla
      const isMayra = activeProfile?.name?.toLowerCase().includes('mayra');
      
      // Actualizar título de la pestaña para que se vea en la barra de tareas de Windows
      if (isMayra && currentCount > 0) {
        document.title = `🔔 (${currentCount}) Facturas Pendientes - Sellos Chacaíto`;
      } else {
        document.title = 'Sellos Chacaíto - Sistema de Producción';
      }

      if (isMayra && !initialLoadRef.current && currentCount > pendingInvoiceCount) {
        // 1. Notificación Nativa de Windows (Aparece en la esquina inferior derecha de Windows)
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            try {
              const latest = pendingInvoices[0];
              const clientName = latest?.clientName || 'Cliente';
              const amount = latest?.totalAmount ? `$${latest.totalAmount}` : '';
              const notif = new Notification('🌸 ¡Nueva venta para Facturar!', {
                body: `Cliente: ${clientName} ${amount ? `(${amount})` : ''}\nHay ${currentCount} factura(s) pendiente(s). Toca aquí para ver.`,
                icon: '/favicon.ico',
                tag: 'nueva-factura-mayra',
                requireInteraction: true // Mantiene la notificación fija en Windows hasta que Mayra la toque
              });
              notif.onclick = () => {
                window.focus();
                navigate('/facturacion');
                notif.close();
              };
            } catch (err) {
              console.warn('Windows notification error:', err);
            }
          } else if (Notification.permission === 'default') {
            Notification.requestPermission();
          }
        }

        // 2. Tono de audio suave (por si tiene audífonos conectados)
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch (e) {
          console.warn('Audio alert error:', e);
        }

        // 3. Toast visual en pantalla
        toast((t) => (
          <div 
            onClick={() => { navigate('/facturacion'); toast.dismiss(t.id); }}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <span style={{ fontSize: '1.4rem' }}>🌸</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>¡Nueva venta para facturar!</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Toca aquí para ver los datos de facturación</div>
            </div>
          </div>
        ), {
          duration: 8000,
          style: { background: '#ec4899', color: '#fff', borderRadius: '12px', padding: '12px 16px', fontWeight: 600 }
        });
      }

      initialLoadRef.current = false;
      setPendingInvoiceCount(currentCount);
    });

    return () => unsubscribe();
  }, [activeProfile, pendingInvoiceCount, navigate]);

  // Mouse tracking for background blob
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-close sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Pedidos',              path: '/',              icon: <ListTodo size={18} /> },
    { name: 'Facturación',          path: '/facturacion',   icon: <FileCheck size={18} />, badge: pendingInvoiceCount > 0 ? pendingInvoiceCount : null },
    { name: 'Ventas',               path: '/ventas',        icon: <ShoppingBag size={18} /> },
    { name: 'Clientes',             path: '/clientes',      icon: <Users size={18} /> },
    { name: 'Presupuestos',         path: '/presupuestos',  icon: <ClipboardList size={18} /> },
    { name: 'Cambio',               path: '/cambio',        icon: <DollarSign size={18} /> },
    { name: 'Herramientas',         path: '/herramientas',  icon: <Wrench size={18} /> },
    { name: 'Inventario & Precios', path: '/inventario',    icon: <Package size={18} /> },
    { name: 'Configuración',        path: '/configuracion', icon: <Settings size={18} /> },
    { name: 'Usuarios',             path: '/usuarios',      icon: <UserCircle size={18} /> },
  ];

  async function handleLogout() {
    await logout();
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row', 
      height: '100vh', 
      width: '100%', 
      padding: 0, 
      gap: 0, 
      position: 'relative', 
      overflow: 'hidden',
      backgroundColor: '#f8fafc'
    }}>

      {/* Backdrop overlay */}
      <div
        onClick={() => setIsSidebarOpen(false)}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(17, 24, 39, 0.35)',
          zIndex: 50,
          backdropFilter: 'blur(3px)',
          opacity: isSidebarOpen ? 1 : 0,
          pointerEvents: isSidebarOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* SIDEBAR WHITESTAMP */}
      <aside
        ref={sidebarRef}
        className="sidebar-animated"
        style={{
          width: '280px',
          maxWidth: '85vw',
          padding: '1.5rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          height: '100dvh',
          zIndex: 60,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          boxShadow: isSidebarOpen ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : 'none',
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          pointerEvents: isSidebarOpen ? 'auto' : 'none',
          visibility: isSidebarOpen ? 'visible' : 'hidden',
          transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), visibility 0.3s, box-shadow 0.3s',
          boxSizing: 'border-box'
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1rem',
            background: '#f1f5f9',
            color: '#64748b',
            cursor: 'pointer',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e2e8f0',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Brand — Logo + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.75rem', paddingRight: '2rem' }}>
          <div style={{
            width: '2.8rem',
            height: '2.8rem',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            flexShrink: 0,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'grid',
            placeItems: 'center'
          }}>
            <img src={logoSvg} alt="Sellos Chacaíto" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
          </div>
          <div>
            <h2 style={{
              fontFamily: 'inherit',
              fontSize: '1rem',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              margin: 0
            }}>
              Sellos Chacaíto
            </h2>
            <p style={{
              fontFamily: 'inherit',
              fontSize: '0.7rem',
              color: '#64748b',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              margin: '2px 0 0 0'
            }}>
              Operaciones
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, overflowY: 'auto' }}>
          {navItems.filter(item => !item.hidden).map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setIsSidebarOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '10px',
                  background: isActive ? 'var(--ws-accent-primary-light)' : 'transparent',
                  color: isActive ? 'var(--ws-accent-primary-text)' : '#64748b',
                  fontFamily: 'inherit',
                  fontWeight: isActive ? '700' : '600',
                  fontSize: '0.875rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--ws-accent-primary-border)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.color = '#0f172a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#64748b';
                  }
                }}
              >
                <span style={{ color: isActive ? 'var(--ws-accent-primary)' : '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>{item.name}</span>
                {item.badge && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    lineHeight: 1
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          borderTop: '1px solid #e2e8f0',
          paddingTop: '1.25rem'
        }}>
          <button
            onClick={() => {
              logoutProfile();
              setIsSidebarOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#0f172a',
              background: '#f8fafc',
              padding: '0.55rem 0.75rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: '1px solid #e2e8f0',
              width: '100%',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              backgroundColor: activeProfile?.color || '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
              color: '#fff',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: `0 2px 6px ${activeProfile?.color ? activeProfile.color + '40' : 'rgba(16,185,129,0.25)'}`
            }}>
              {activeProfile?.avatarUrl ? (
                <img src={activeProfile.avatarUrl} alt={activeProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                activeProfile?.avatarIcon || activeProfile?.name?.charAt(0).toUpperCase() || '👤'
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Cambiar Usuario</span>
              <span style={{ fontWeight: 700, fontFamily: activeProfile?.fontFamily || 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#0f172a' }}>
                {activeProfile?.name || 'Usuario'}
              </span>
            </div>
          </button>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#ef4444',
              background: 'transparent',
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        key={location.pathname} 
        className={location.pathname === '/cambio' ? '' : 'page-transition'}
        style={{
          overflowY: (location.pathname === '/' || location.pathname === '/presupuestos') ? 'hidden' : 'auto',
          height: '100%',
          flex: 1,
          width: '100%'
        }}
      >
        <Outlet context={{ toggleSidebar: () => setIsSidebarOpen(true) }} />
      </main>

    </div>
  );
}

export default Layout;
