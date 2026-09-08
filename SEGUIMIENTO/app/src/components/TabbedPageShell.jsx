import React from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';

// Barra de pestañas reutilizada por las páginas contenedoras del menú lateral
// (Reportes, Base de Datos, Utilidades, Configuración). Cada pestaña es una
// RUTA HIJA real (ej. /reportes/ventas), no un query param — así no choca con
// el ?tab= que Herramientas.jsx ya usa internamente para sus propias pestañas
// (Costos / Retenciones / Salidas a Taller).
//
// `tabs`: [{ path, label, icon, color, adminOnly? }]
// `adminOnly: true` oculta la pestaña para cualquiera que no sea Álvaro
// (la ruta en sí también debe protegerse aparte con <AdminOnlyRoute> en App.jsx).
export default function TabbedPageShell({ basePath, tabs }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeProfile } = useProfile();
  const isAlvaro = Boolean(activeProfile?.name?.toLowerCase().includes('alvaro'));

  const visibleTabs = tabs.filter(t => !t.adminOnly || isAlvaro);

  return (
    <div style={{ width: '100%', minHeight: '100vh', boxSizing: 'border-box' }}>
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '14px 24px 0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const fullPath = `${basePath}/${tab.path}`;
            const isActive = location.pathname === fullPath;
            return (
              <button
                key={tab.path}
                type="button"
                onClick={() => navigate(fullPath)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '10px 10px 0 0',
                  border: 'none',
                  background: isActive ? '#f8fafc' : 'transparent',
                  color: isActive ? tab.color : '#94a3b8',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <Outlet />
    </div>
  );
}
