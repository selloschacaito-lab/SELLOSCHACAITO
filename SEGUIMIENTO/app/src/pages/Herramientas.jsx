import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import {
  Wrench,
  BadgeDollarSign,
  Percent,
  PanelLeft,
  Boxes
} from 'lucide-react';
import Costos from './Costos';
import Retenciones from './Retenciones';
import Madera from './Madera';
import SalidasTaller from './SalidasTaller';
import '../styles/whitestamp.css';

const TABS = [
  {
    id: 'madera',
    label: 'Madera & Bolsas',
    desc: '12 medidas estándar, regla de contenedor y cotizador de packaging',
    icon: Boxes,
    color: '#d97706'
  },
  {
    id: 'costos',
    label: 'Costos y Precios',
    desc: 'Márgenes, IVA y precios Detal/Mayor',
    icon: BadgeDollarSign,
    color: '#10b981'
  },
  {
    id: 'retenciones',
    label: 'Retenciones SENIAT',
    desc: 'Cálculo fiscal (IVA 75%/100% e ISLR)',
    icon: Percent,
    color: '#3b82f6'
  },
  {
    id: 'taller',
    label: 'Salidas a Taller',
    desc: 'Historial de insumos usados en reparaciones',
    icon: Wrench,
    color: '#dc2626'
  }
];

export default function Herramientas() {
  const { toggleSidebar } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'madera';
  
  const [activeTab, setActiveTab] = useState(() => {
    const found = TABS.find(t => t.id === initialTab);
    return found ? found.id : 'madera';
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const currentTabObj = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div className="animate-fade-in" style={{ width: '100%', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* Master Top Header with Tab Switcher */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px 0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          
          {/* Title Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {toggleSidebar && (
                <button 
                  onClick={toggleSidebar} 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#64748b',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  title="Abrir menú"
                  type="button"
                >
                  <PanelLeft size={18} />
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${currentTabObj.color}15`,
                  color: currentTabObj.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Wrench size={18} />
                </div>
                <div>
                  <h1 style={{
                    fontSize: '18px',
                    fontWeight: 900,
                    color: '#0f172a',
                    margin: 0,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2
                  }}>
                    Herramientas Administrativas
                  </h1>
                  <p style={{
                    fontSize: '12px',
                    color: '#64748b',
                    margin: 0,
                    fontWeight: 500
                  }}>
                    {currentTabObj.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '10px',
            scrollbarWidth: 'none'
          }}>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: isActive ? `1.5px solid ${tab.color}` : '1px solid #e2e8f0',
                    background: isActive ? `${tab.color}10` : '#ffffff',
                    color: isActive ? tab.color : '#64748b',
                    fontSize: '13px',
                    fontWeight: isActive ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? `0 2px 8px ${tab.color}20` : 'none'
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
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: isActive ? `${tab.color}15` : '#f1f5f9',
                    color: isActive ? tab.color : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={14} />
                  </div>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* Tab Content Rendering */}
      <div style={{ width: '100%', padding: '0 8px' }}>
        {activeTab === 'madera' && <Madera isEmbedded={true} />}
        {activeTab === 'costos' && <Costos isEmbedded={true} />}
        {activeTab === 'retenciones' && <Retenciones isEmbedded={true} />}
        {activeTab === 'taller' && <SalidasTaller isEmbedded={true} />}
      </div>

    </div>
  );
}
