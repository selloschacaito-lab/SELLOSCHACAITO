import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const AdminLayout = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email?.toLowerCase().trim() !== 'selloschacaito@gmail.com') {
        await signOut(auth);
        setUser(null);
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Close sidebar on navigation
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-secondary)' }}>
        <p style={{ fontWeight: '600', color: 'var(--color-text-secondary)' }}>Verificando credenciales...</p>
      </div>
    );
  }

  // Si no hay usuario y no estamos ya en la ruta de login, redirigir a login
  if (!user && location.pathname !== '/admin/login') {
    return <Navigate to="/admin/login" replace />;
  }

  // Si hay usuario y estamos en la ruta de login, redirigir al dashboard
  if (user && location.pathname === '/admin/login') {
    return <Navigate to="/admin" replace />;
  }

  // Si estamos en la página de login (y no estamos autenticados), solo renderizamos el componente de login (Outlet)
  if (location.pathname === '/admin/login') {
    return <Outlet />;
  }

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin' || location.pathname.includes('/admin/nuevo') || location.pathname.includes('/admin/editar');
    return location.pathname.includes(path);
  };

  // Si el usuario está autenticado, renderizamos el panel con su sidebar
  return (
    <div className="admin-layout">
      {/* Top Header Bar */}
      <div className="admin-top-header">
        <div className="admin-header-left">
          <button 
            className="admin-hamburger-btn"
            onClick={() => setIsSidebarOpen(true)}
            title="Abrir menú"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--color-primary)', margin: 0 }}>Panel Admin</h2>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      <div 
        className={`admin-sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Drawer */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        {/* Encabezado del Sidebar con Logo */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-primary)', margin: 0, lineHeight: 1.2 }}>Sellos Chacaíto</h2>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Panel de Control</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--color-text-main)', padding: '0.25rem' }}
          >
            ✕
          </button>
        </div>

        {/* Tarjeta de Sesión de Usuario */}
        <div style={{ padding: '1rem 1.15rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              backgroundColor: 'rgba(71, 255, 0, 0.15)', border: '1px solid var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0
            }}>
              👑
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }}></span>
                <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Activo</span>
              </div>
              <p 
                title={user.email}
                style={{
                  fontSize: '0.8rem', color: 'var(--color-text-main)', fontWeight: '700',
                  margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}
              >
                {user.email}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.45rem' }}>
            <Link 
              to="/" 
              target="_blank" 
              style={{
                flex: 1, padding: '0.45rem 0.5rem', borderRadius: '8px', textDecoration: 'none',
                color: 'var(--color-text-main)', fontSize: '0.76rem', fontWeight: '700',
                backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              🌐 Ver Tienda
            </Link>

            <button 
              onClick={handleLogout} 
              className="btn" 
              style={{
                padding: '0.45rem 0.65rem', borderRadius: '8px', fontSize: '0.76rem', fontWeight: '700',
                border: '1px solid #fee2e2', color: '#b91c1c', backgroundColor: 'var(--color-bg-card)',
                cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>
        
        {/* Enlaces de Navegación del Panel */}
        <nav style={{ flex: 1, padding: '1.25rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <Link 
            to="/admin" 
            style={{
              padding: '0.75rem 1rem', borderRadius: '10px', textDecoration: 'none',
              color: isActive('/admin') && !location.pathname.includes('/admin/categorias') && !location.pathname.includes('/admin/mayoristas') ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
              fontWeight: '700', fontSize: '0.9rem',
              backgroundColor: isActive('/admin') && !location.pathname.includes('/admin/categorias') && !location.pathname.includes('/admin/mayoristas') ? 'rgba(71, 255, 0, 0.12)' : 'transparent',
              border: isActive('/admin') && !location.pathname.includes('/admin/categorias') && !location.pathname.includes('/admin/mayoristas') ? '1px solid var(--color-primary)' : '1px solid transparent',
              display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s ease'
            }}
          >
            <span>🛒</span> Mis Productos
          </Link>

          <Link 
            to="/admin/categorias" 
            style={{
              padding: '0.75rem 1rem', borderRadius: '10px', textDecoration: 'none',
              color: location.pathname.includes('/admin/categorias') ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
              fontWeight: '700', fontSize: '0.9rem',
              backgroundColor: location.pathname.includes('/admin/categorias') ? 'rgba(71, 255, 0, 0.12)' : 'transparent',
              border: location.pathname.includes('/admin/categorias') ? '1px solid var(--color-primary)' : '1px solid transparent',
              display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s ease'
            }}
          >
            <span>📁</span> Categorías
          </Link>

          <Link 
            to="/admin/mayoristas" 
            style={{
              padding: '0.75rem 1rem', borderRadius: '10px', textDecoration: 'none',
              color: location.pathname.includes('/admin/mayoristas') ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
              fontWeight: '700', fontSize: '0.9rem',
              backgroundColor: location.pathname.includes('/admin/mayoristas') ? 'rgba(71, 255, 0, 0.12)' : 'transparent',
              border: location.pathname.includes('/admin/mayoristas') ? '1px solid var(--color-primary)' : '1px solid transparent',
              display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s ease'
            }}
          >
            <span>👑</span> Mayoristas
          </Link>

          <Link 
            to="/admin/analitica" 
            style={{
              padding: '0.75rem 1rem', borderRadius: '10px', textDecoration: 'none',
              color: location.pathname.includes('/admin/analitica') ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
              fontWeight: '700', fontSize: '0.9rem',
              backgroundColor: location.pathname.includes('/admin/analitica') ? 'rgba(71, 255, 0, 0.12)' : 'transparent',
              border: location.pathname.includes('/admin/analitica') ? '1px solid var(--color-primary)' : '1px solid transparent',
              display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s ease'
            }}
          >
            <span>⚙️</span> Píxels & Analítica
          </Link>

          <Link 
            to="/admin/tablero-analitica" 
            style={{
              padding: '0.75rem 1rem', borderRadius: '10px', textDecoration: 'none',
              color: location.pathname.includes('/admin/tablero-analitica') ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
              fontWeight: '700', fontSize: '0.9rem',
              backgroundColor: location.pathname.includes('/admin/tablero-analitica') ? 'rgba(71, 255, 0, 0.12)' : 'transparent',
              border: location.pathname.includes('/admin/tablero-analitica') ? '1px solid var(--color-primary)' : '1px solid transparent',
              display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s ease'
            }}
          >
            <span>📈</span> Tablero Estadístico
          </Link>

          <Link 
            to="/admin/bot" 
            style={{
              padding: '0.75rem 1rem', borderRadius: '10px', textDecoration: 'none',
              color: location.pathname.includes('/admin/bot') ? 'var(--color-text-main)' : 'var(--color-text-secondary)',
              fontWeight: '700', fontSize: '0.9rem',
              backgroundColor: location.pathname.includes('/admin/bot') ? 'rgba(71, 255, 0, 0.12)' : 'transparent',
              border: location.pathname.includes('/admin/bot') ? '1px solid var(--color-primary)' : '1px solid transparent',
              display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'all 0.2s ease'
            }}
          >
            <span>🤖</span> Asistente Gravy
          </Link>
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="admin-main">
        <Outlet />
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="admin-bottom-nav">
        <Link 
          to="/admin" 
          className={isActive('/admin') && !location.pathname.includes('/admin/categorias') && !location.pathname.includes('/admin/mayoristas') ? 'active' : ''}
        >
          <span className="nav-icon">🛒</span>
          Productos
        </Link>
        <Link 
          to="/admin/categorias" 
          className={location.pathname.includes('/admin/categorias') ? 'active' : ''}
        >
          <span className="nav-icon">📁</span>
          Categorías
        </Link>
        <Link 
          to="/admin/mayoristas" 
          className={location.pathname.includes('/admin/mayoristas') ? 'active' : ''}
        >
          <span className="nav-icon">👑</span>
          Mayoristas
        </Link>
      </nav>
    </div>
  );
};

export default AdminLayout;
