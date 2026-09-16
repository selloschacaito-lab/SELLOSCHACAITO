import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { ListTodo, Settings, LogOut, ChevronLeft, ChevronRight, FileCheck, Wrench, BarChart3, Database } from 'lucide-react';
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
  const [isDesktopPointer, setIsDesktopPointer] = useState(true);
  const sidebarRef = useRef(null);
  const initialLoadRef = useRef(true);
  const hoverTimeoutRef = useRef(null);

  // Detectar si el dispositivo tiene un puntero fino con hover real (PC de escritorio)
  // vs. una pantalla táctil (teléfono, tablet, o laptop táctil grande) — se trata todo
  // lo táctil igual, sin importar el ancho de pantalla.
  useEffect(() => {
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setIsDesktopPointer(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  const handleEdgeMouseEnter = () => {
    if (!isDesktopPointer) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsSidebarOpen(true);
    }, 200);
  };

  const handleEdgeMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Escuchar órdenes de Firebase para contar ventas por facturar y alertar a María Eugenia.
  // Cuenta tanto ventas ya pagadas como ventas a crédito ("Por Pagar") recién
  // registradas — el mismo criterio amplio que ya usa Facturación para "allPaidSales".
  useEffect(() => {
    const ordersRef = ref(db, 'orders');
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...(val || {}) }));

      const pendingInvoices = list.filter(o => {
        if (!o || o.status === 'cancelled' || o.isDeleted) return false;
        const isRegisteredSale = (
          o.status === 'fina' ||
          o.hasFinaReceipt === true ||
          o.isPaid !== undefined ||
          o.paymentMethod === 'Por Pagar' ||
          Boolean(o.paidAt && (Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0)) ||
          (o.status === 'delivered' && (Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0)) ||
          ((Number(o.totalAmount) > 0 || Number(o.totalAmountBs) > 0) && Boolean(o.paymentMethod) && o.status !== 'design_sent')
        );
        return isRegisteredSale && !o.isInvoiced && !o.isAccumulated;
      });

      const currentCount = pendingInvoices.length;

      // Si es el perfil de María Eugenia y entran nuevas ventas por facturar, alertar en Windows y en pantalla
      const isMariaEugenia = activeProfile?.name?.toLowerCase().includes('eugenia');

      // Actualizar título de la pestaña para que se vea en la barra de tareas de Windows
      if (isMariaEugenia && currentCount > 0) {
        document.title = `🔔 (${currentCount}) Facturas Pendientes - Sellos Chacaíto`;
      } else {
        document.title = 'Sellos Chacaíto - Sistema de Producción';
      }

      if (isMariaEugenia && !initialLoadRef.current && currentCount > pendingInvoiceCount) {
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
                tag: 'nueva-factura-maria-eugenia',
                requireInteraction: true // Mantiene la notificación fija en Windows hasta que María Eugenia la toque
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

  // Escuchar alertas de "a imprimir" para avisarle a Felizai (Windows o su app
  // Android), con notificación nativa + sonido distinto al de facturación.
  // Solo se suscribe si el perfil activo es el de Felizai.
  const printAlertsSeenRef = useRef(null); // null = todavía no se cargó la primera vez
  useEffect(() => {
    const isFelizai = activeProfile?.name?.toLowerCase().includes('felizai');
    if (!isFelizai) return;

    const printAlertsRef = ref(db, 'print_alerts');
    const unsubscribe = onValue(printAlertsRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : {};
      const currentIds = Object.keys(data);

      if (printAlertsSeenRef.current === null) {
        // Primera carga: no alertar por alertas que ya existían antes de entrar, solo memorizarlas.
        printAlertsSeenRef.current = new Set(currentIds);
        return;
      }

      const newIds = currentIds.filter(id => !printAlertsSeenRef.current.has(id));
      printAlertsSeenRef.current = new Set(currentIds);
      if (newIds.length === 0) return;

      const latest = data[newIds[0]];
      const clientName = latest?.clientName || 'Sin nombre';

      // 1. Notificación Nativa (Windows o la app instalada en Android)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          try {
            const notif = new Notification('🖨️ ¡Pedido para Imprimir!', {
              body: `Cliente: ${clientName}\nHay ${newIds.length} pedido(s) nuevo(s) esperando imprimir.`,
              icon: '/favicon.ico',
              tag: 'nuevo-print-alert',
              requireInteraction: true
            });
            notif.onclick = () => {
              window.focus();
              navigate('/');
              notif.close();
            };
          } catch (err) {
            console.warn('Windows notification error (print):', err);
          }
        } else if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }

      // 2. Sonido distinto al de María Eugenia (doble pitido agudo, más penetrante)
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const playBeep = (startTime) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, startTime);
          osc.frequency.setValueAtTime(1200, startTime + 0.1);
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(1, startTime + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, startTime + 0.3);
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.3);
        };
        playBeep(ctx.currentTime);
        playBeep(ctx.currentTime + 0.4);
      } catch (e) {
        console.warn('Audio alert error (print):', e);
      }

      // 3. Toast visual en pantalla
      toast((t) => (
        <div
          onClick={() => { navigate('/'); toast.dismiss(t.id); }}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span style={{ fontSize: '1.4rem' }}>🖨️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>¡Pedido para Imprimir!</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>{clientName} — Toca para ver Pedidos</div>
          </div>
        </div>
      ), {
        duration: 8000,
        style: { background: '#3b82f6', color: '#fff', borderRadius: '12px', padding: '12px 16px', fontWeight: 600 }
      });
    });

    return () => unsubscribe();
  }, [activeProfile, navigate]);

  // Pedir permiso de notificaciones apenas se entra con el perfil de María
  // Eugenia o Felizai (en vez de esperar a que llegue la primera alerta real,
  // que podía perderse si el permiso todavía no estaba concedido).
  useEffect(() => {
    const name = activeProfile?.name?.toLowerCase() || '';
    const needsNotifications = name.includes('eugenia') || name.includes('felizai');
    if (needsNotifications && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [activeProfile]);

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

  // Menú simplificado: Ventas+Estadísticas, Clientes+Inventario, Cambio+
  // Presupuestos+Herramientas+Sellos de Madera, y Configuración+Usuarios
  // ahora viven cada uno dentro de una sola página con pestañas (ver
  // Reportes.jsx, BaseDeDatos.jsx, Utilidades.jsx, Configuracion.jsx).
  // El acceso a las pestañas de Álvaro (Estadísticas/Usuarios) sigue
  // protegido a nivel de ruta en App.jsx, no solo ocultando el ítem.
  const navItems = [
    { name: 'Pedidos',        path: '/',              icon: <ListTodo size={18} /> },
    { name: 'Facturación',    path: '/facturacion',   icon: <FileCheck size={18} />, badge: pendingInvoiceCount > 0 ? pendingInvoiceCount : null },
    { name: 'Reportes',       path: '/reportes',      icon: <BarChart3 size={18} /> },
    { name: 'Base de datos',  path: '/base-de-datos', icon: <Database size={18} /> },
    { name: 'Utilidades',     path: '/utilidades',    icon: <Wrench size={18} /> },
    { name: 'Configuración',  path: '/configuracion', icon: <Settings size={18} /> }
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

      {/* Borde izquierdo: en PC, franja delgada sensible al hover que abre el menú;
          en táctil, pestañita fija con flecha para tocar y abrir */}
      {isDesktopPointer ? (
        <div
          onMouseEnter={handleEdgeMouseEnter}
          onMouseLeave={handleEdgeMouseLeave}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            width: '14px',
            zIndex: 55,
            opacity: isSidebarOpen ? 0 : 1,
            pointerEvents: isSidebarOpen ? 'none' : 'auto',
            transition: 'opacity 0.2s ease',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div style={{
            width: '4px',
            height: '64px',
            marginLeft: '3px',
            borderRadius: '0 4px 4px 0',
            background: '#cbd5e1'
          }} />
        </div>
      ) : (
        <button
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Abrir menú"
          style={{
            position: 'fixed',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 55,
            width: '22px',
            height: '52px',
            borderRadius: '0 10px 10px 0',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderLeft: 'none',
            boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
            display: isSidebarOpen ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            padding: 0,
            cursor: 'pointer'
          }}
        >
          <ChevronRight size={16} />
        </button>
      )}

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
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
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
        <Outlet context={{}} />
      </main>

    </div>
  );
}

export default Layout;
