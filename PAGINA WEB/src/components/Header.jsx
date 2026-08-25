import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import { useSelection } from '../context/SelectionContext';

const Header = () => {
  const navigate = useNavigate();
  const { selectedItems, toggleSidebar } = useSelection();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // --- LOGO: ACCESO A PANEL ADMINISTRATIVO (3 clicks en PC o 3s presionado en teléfono) ---
  const [adminClickCount, setAdminClickCount] = useState(0);
  const adminClickTimeoutRef = useRef(null);
  const adminPressTimeoutRef = useRef(null);
  const [adminLongPressTriggered, setAdminLongPressTriggered] = useState(false);

  const handleLogoClick = (e) => {
    if (adminLongPressTriggered) {
      e.preventDefault();
      setAdminLongPressTriggered(false);
      return;
    }
    const newCount = adminClickCount + 1;
    setAdminClickCount(newCount);

    if (newCount === 3) {
      e.preventDefault();
      navigate('/admin');
      setAdminClickCount(0);
      if (adminClickTimeoutRef.current) clearTimeout(adminClickTimeoutRef.current);
      return;
    }

    if (adminClickTimeoutRef.current) clearTimeout(adminClickTimeoutRef.current);
    adminClickTimeoutRef.current = setTimeout(() => {
      setAdminClickCount(0);
    }, 800);
  };

  const handleLogoTouchStart = () => {
    setAdminLongPressTriggered(false);
    adminPressTimeoutRef.current = setTimeout(() => {
      setAdminLongPressTriggered(true);
      navigate('/admin');
    }, 3000); // 3 segundos
  };

  const handleLogoTouchEnd = () => {
    if (adminPressTimeoutRef.current) clearTimeout(adminPressTimeoutRef.current);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="header" style={{ 
      width: '100%', 
      position: 'sticky', 
      top: 0, 
      zIndex: 1000, 
      backgroundColor: 'var(--color-bg-card)', 
      borderBottom: '1px solid var(--color-border)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
    }}>
      <div className="container" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '56px' }}>
        
        {/* Botón de Hamburguesa a la izquierda y Menú desplegable */}
        <div style={{ position: 'absolute', left: '0', top: '50%', transform: 'translateY(-50%)', zIndex: 1001 }} ref={menuRef}>
          <button 
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              background: 'transparent', border: '1px solid var(--color-border)', 
              borderRadius: '8px', width: '36px', height: '36px', 
              fontSize: '1.1rem', cursor: 'pointer', color: 'var(--color-text-main)'
            }} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            title="Menú de navegación"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>

          {/* Navegación desplegable compacta */}
          {isMenuOpen && (
            <nav style={{
              display: 'flex', flexDirection: 'column', position: 'absolute',
              top: '44px', left: '0', width: '250px',
              background: 'var(--color-bg-card)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--color-border)', borderRadius: '14px',
              boxShadow: '0 12px 35px rgba(0,0,0,0.22)', zIndex: 1002, overflow: 'hidden',
              padding: '0.45rem', gap: '0.2rem', animation: 'fadeIn 0.2s ease-out'
            }}>
              <Link to="/" onClick={closeMenu} className="menu-item" style={{ padding: '0.6rem 0.8rem', fontSize: '0.88rem' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                Catálogo Principal
              </Link>
              <Link to="/servicios" onClick={closeMenu} className="menu-item" style={{ padding: '0.6rem 0.8rem', fontSize: '0.88rem' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Servicios
              </Link>
              <Link to="/como-comprar" onClick={closeMenu} className="menu-item" style={{ padding: '0.6rem 0.8rem', fontSize: '0.88rem' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                Cómo comprar
              </Link>
              <Link to="/faq" onClick={closeMenu} className="menu-item" style={{ padding: '0.6rem 0.8rem', fontSize: '0.88rem' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Preguntas frecuentes
              </Link>

              {/* PASE MAYORISTAS VIP (Black & Gold Card) */}
              <div style={{ marginTop: '0.35rem', paddingTop: '0.45rem', borderTop: '1px solid var(--color-border)' }}>
                <Link 
                  to="/mayoristas" 
                  onClick={closeMenu}
                  className="vip-pass-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>👑</span>
                      <span style={{ fontSize: '0.84rem', fontWeight: '900', color: '#FFB800', letterSpacing: '0.4px' }}>
                        PASE MAYORISTAS
                      </span>
                    </div>
                    <span style={{ color: '#FFB800', fontSize: '0.9rem', fontWeight: '800' }}>→</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#9DA6B5', lineHeight: '1.3' }}>
                    Tarifas distribuidor · 20% OFF
                  </p>
                </Link>
              </div>

              {/* Modo Oscuro */}
              <div style={{ padding: '0.45rem 0.8rem 0.2rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', marginTop: '0.35rem' }}>
                <span style={{ fontWeight: '600', fontSize: '0.82rem', color: 'var(--color-text-main)' }}>Modo Oscuro</span>
                <DarkModeToggle />
              </div>
            </nav>
          )}
        </div>

        {/* Contenedor Central: Logo + Nombre Limpio */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Link 
            to="/" 
            onClick={(e) => { 
              handleLogoClick(e); 
              closeMenu(); 
              if (window.location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onTouchStart={handleLogoTouchStart}
            onTouchEnd={handleLogoTouchEnd}
            onTouchCancel={handleLogoTouchEnd}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
            title="Inicio · Sellos Chacaíto"
          >
            <img src="/logo.png" alt="Sellos Chacaito Logo" style={{ height: '30px', width: 'auto', pointerEvents: 'none' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-text-main)' }}>
              Sellos<span style={{ color: 'var(--color-primary)' }}>Chacaíto</span>
            </div>
          </Link>

          {window.location.pathname.includes('/mayoristas') && (
            <span style={{ 
              fontSize: '0.62rem', 
              fontWeight: '900', 
              backgroundColor: '#FFB800', 
              color: '#000', 
              padding: '0.15rem 0.45rem', 
              borderRadius: '20px', 
              marginLeft: '0.2rem',
              letterSpacing: '0.4px'
            }}>
              MAYORISTAS
            </span>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
