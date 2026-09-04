import React from 'react';
import { useUpdate } from '../contexts/UpdateContext';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  Zap, 
  Clock, 
  ShieldCheck, 
  Download,
  AlertCircle
} from 'lucide-react';

export default function UpdateModal() {
  const { 
    isUpdateModalOpen, 
    closeUpdateModal, 
    pendingUpdates, 
    allVersionsHistory,
    hasUpdate, 
    localVersionCode,
    localVersionName, 
    latestVersionName, 
    isInstalling, 
    installProgress, 
    installStageText, 
    applyUpdate 
  } = useUpdate();

  if (!isUpdateModalOpen) return null;

  const updatesToShow = pendingUpdates.length > 0 ? pendingUpdates : allVersionsHistory.slice(0, 3);

  return (
    <div 
      className="modal-overlay animate-fade-in" 
      onClick={closeUpdateModal}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px'
      }}
    >
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Encabezado con degradado sutil */}
        <div style={{
          background: hasUpdate ? 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' : 'linear-gradient(135deg, #065f46 0%, #0f172a 100%)',
          padding: '20px 24px',
          color: '#ffffff',
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: hasUpdate ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)',
              border: hasUpdate ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid rgba(52, 211, 153, 0.4)',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              <Sparkles size={13} color={hasUpdate ? '#93c5fd' : '#6ee7b7'} />
              <span>{hasUpdate ? `Actualización Disponible (${pendingUpdates.length} acumulada${pendingUpdates.length === 1 ? '' : 's'})` : 'Sistema al Día'}</span>
            </div>

            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Centro de Actualización</span>
            </h2>

            {/* Versiones */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12.5px', color: '#cbd5e1' }}>
              <span>Instalada: <strong style={{ color: '#ffffff' }}>v{localVersionName}</strong></span>
              <ArrowRight size={13} color="#94a3b8" />
              <span>Nueva: <strong style={{ color: hasUpdate ? '#60a5fa' : '#34d399' }}>v{latestVersionName}</strong></span>
            </div>
          </div>

          {!isInstalling && (
            <button 
              onClick={closeUpdateModal}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Cuerpo del Modal: Vista de Instalación o Lista de Novedades */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {isInstalling ? (
            /* VISTA DE INSTALACIÓN CON BARRA DE PROGRESO */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 12px',
              textAlign: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
              }}>
                <RefreshCw size={32} className="animate-spin" />
              </div>

              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Instalando Actualización v{latestVersionName}...
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', minHeight: '20px' }}>
                  {installStageText}
                </p>
              </div>

              {/* Barra de Progreso */}
              <div style={{ width: '100%', maxWidth: '420px', marginTop: '8px' }}>
                <div style={{
                  width: '100%',
                  height: '14px',
                  borderRadius: '10px',
                  background: '#e2e8f0',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${installProgress}%`,
                    height: '100%',
                    borderRadius: '10px',
                    background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                    transition: 'width 0.4s ease',
                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#64748b', marginTop: '6px' }}>
                  <span>Progreso de instalación</span>
                  <span style={{ color: '#0f172a' }}>{installProgress}%</span>
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '11.5px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px'
              }}>
                <ShieldCheck size={16} color="#10b981" />
                <span>No es necesario presionar Ctrl+F5. El sistema limpiará la caché y se reiniciará automáticamente.</span>
              </div>
            </div>
          ) : (
            /* VISTA DE NOTAS Y CHANGELOG ACUMULADO */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} color="#3b82f6" /> {hasUpdate ? 'Novedades acumuladas para instalar:' : 'Historial de versiones recientes:'}
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {updatesToShow.length} versión{updatesToShow.length === 1 ? '' : 'es'}
                </span>
              </div>

              {/* Lista de Versiones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {updatesToShow.map((up, idx) => {
                  const dateStr = up.date ? new Date(up.date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
                  const isPendingThis = up.versionCode > localVersionCode;

                  return (
                    <div 
                      key={up.key || idx} 
                      style={{
                        border: isPendingThis ? '1.5px solid #bfdbfe' : '1px solid #e2e8f0',
                        borderRadius: '14px',
                        background: isPendingThis ? '#f8fafc' : '#ffffff',
                        padding: '14px',
                        boxShadow: isPendingThis ? '0 2px 8px rgba(37, 99, 235, 0.08)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              background: isPendingThis ? '#2563eb' : '#64748b',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 900,
                              padding: '2px 7px',
                              borderRadius: '6px'
                            }}>
                              v{up.version}
                            </span>
                            <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                              {up.title}
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      {/* Bullets de Mejoras */}
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {up.highlights && up.highlights.map((h, hIdx) => (
                          <li key={hIdx} style={{ lineHeight: 1.4 }}>
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {!hasUpdate && (
                <div style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <CheckCircle2 size={20} color="#10b981" />
                  <div style={{ fontSize: '12px', color: '#065f46' }}>
                    <strong>Tu sistema está al día con la última versión v{localVersionName}.</strong> Si experimentas lentitud o problemas de visualización, puedes reinstalar y refrescar la memoria caché con el botón de abajo.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie de Modal con Botones */}
        {!isInstalling && (
          <div style={{
            padding: '14px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            <button
              type="button"
              onClick={closeUpdateModal}
              style={{
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={applyUpdate}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                background: hasUpdate ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : '#10b981',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: hasUpdate ? '0 4px 12px rgba(37, 99, 235, 0.3)' : '0 4px 12px rgba(16, 185, 129, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              <Download size={16} />
              <span>{hasUpdate ? '🚀 Actualizar e Instalar Ahora' : '🔄 Forzar Recarga de Caché'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
