import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, ListTodo, Users, Search, PackageSearch, Tag, PieChart, Settings, LogOut, Sun, Moon, Menu, ChevronLeft, Calculator, FileText, Percent, ClipboardList, MapPin, PanelLeft } from 'lucide-react';

function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking inside the sidebar
      if (sidebarRef.current && sidebarRef.current.contains(event.target)) {
        return;
      }
      
      // Don't close if clicking a toggle button (to let the button's own logic work)
      // We identify toggle buttons by looking for the PanelLeft icon or their specific classes,
      // but the safest way is to check if it's within a button that toggles the sidebar.
      // Since we can't easily identify all toggles, we check if the clicked element is a button
      // or inside a button. If it's the toggle, it'll just stay open or toggle.
      const isButton = event.target.closest('button');
      if (isButton) {
        return;
      }

      if (isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (darkMode) {
      document.body.classList.add('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#1F2329');
    } else {
      document.body.classList.remove('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#E6E6E6');
    }
  }, [darkMode]);

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
    { name: 'Pedidos', path: '/', icon: <ListTodo size={20} /> },
    { name: 'Recibos', path: '/recibos', icon: <PackageSearch size={20} />, hidden: true },
    { name: 'Clientes', path: '/clientes', icon: <Users size={20} />, hidden: true },
    { name: 'Productos', path: '/productos', icon: <Tag size={20} />, hidden: true },
    { name: 'Inventario', path: '/inventario', icon: <Package size={20} />, hidden: true },
    { name: 'Marketing', path: '/marketing', icon: <PieChart size={20} />, hidden: true },
    { name: 'Presupuestos', path: '/presupuestos', icon: <ClipboardList size={20} /> },
    { name: 'Cambio', path: '/cambio', icon: <Calculator size={20} /> },
    { name: 'Texto', path: '/texto', icon: <FileText size={20} />, hidden: true },
    { name: 'Retenciones', path: '/retenciones', icon: <Percent size={20} /> },
    { name: 'Configuración', path: '/configuracion', icon: <Settings size={20} /> },
  ];

  async function handleLogout() {
    await logout();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', width: '100%', padding: '1rem', gap: '1rem', position: 'relative', overflow: 'hidden' }}>
      {/* Collapsed Sidebar Toggle (for non-dashboard pages) */}
      {!isSidebarOpen && location.pathname !== '/' && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          style={{ 
            position: 'absolute',
            top: '1.25rem',
            left: '1.25rem',
            zIndex: 45,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(6px)',
            border: '1px solid var(--border-strong)',
            color: '#475569',
            cursor: 'pointer',
            padding: '0.45rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '0.6rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.2s ease'
          }}
          title="Abrir menú"
          onMouseEnter={(e) => e.currentTarget.style.background = '#ffffff'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'}
        >
          <PanelLeft size={20} />
        </button>
      )}

      {/* Backdrop overlay */}
      <div 
        onClick={() => setIsSidebarOpen(false)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          zIndex: 50,
          backdropFilter: 'blur(3px)',
          opacity: isSidebarOpen ? 1 : 0,
          pointerEvents: isSidebarOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />

      {/* Sidebar with smooth slide animation */}
      <aside 
        ref={sidebarRef}
        className="glass-card sidebar-animated" 
        style={{ 
          width: '260px', 
          padding: '1.5rem', 
          display: 'flex',
          flexDirection: 'column', 
          flexShrink: 0,
          position: 'absolute',
          top: '1rem',
          bottom: '1rem',
          left: '1rem',
          zIndex: 60,
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(calc(-100% - 2rem))',
          boxShadow: isSidebarOpen ? '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)' : 'none',
          pointerEvents: isSidebarOpen ? 'auto' : 'none',
          visibility: isSidebarOpen ? 'visible' : 'hidden',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s'
        }}
      >
        <button 
          onClick={() => setIsSidebarOpen(false)}
          style={{ position: 'absolute', top: '1.5rem', right: '1rem', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <ChevronLeft size={24} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem' }}>
            <img src="/logo-sc.png?v=1" alt="Logo Sellos Chacaito" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
          </div>
          <div>
            <h2 className="brand-title" style={{ fontSize: '1rem' }}>Sellos Chacaito</h2>
            <p className="brand-subtitle" style={{ fontSize: '0.65rem' }}>Operaciones</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto' }}>
          {navItems.filter(item => !item.hidden).map(item => {
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
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  background: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#1F2329' : 'var(--text-main)',
                  fontWeight: isActive ? '800' : '500',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s'
                }}
              >
                {item.icon}
                {item.name}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-strong)', paddingTop: '1.5rem' }}>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', background: 'transparent', padding: '0.5rem', cursor: 'pointer' }}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {darkMode ? 'Modo Claro' : 'Modo Noche'}
          </button>

          <button 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', background: 'transparent', padding: '0.5rem', cursor: 'pointer' }}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content with smooth page transition on route change */}
      <main key={location.pathname} className="page-transition">
        <Outlet context={{ toggleSidebar: () => setIsSidebarOpen(true) }} />
      </main>

    </div>
  );
}

export default Layout;
