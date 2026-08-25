import React from 'react';
import { X, Check } from 'lucide-react';
import { ref, remove } from 'firebase/database';
import { db } from '../firebase/config';
import { createPortal } from 'react-dom';

function PrintAlertsModal({ alerts, onClose }) {
  const dismissAlert = async (alertId) => {
    try {
      await remove(ref(db, `print_alerts/${alertId}`));
    } catch (error) {
      console.error("Error al borrar la alerta:", error);
    }
  };

  const clearAll = async () => {
    for (const alertId of Object.keys(alerts)) {
      await dismissAlert(alertId);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div className="modal-header">
          <h2 className="modal-title">Nuevos Pedidos en Impresión</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {Object.keys(alerts).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
              No hay pedidos pendientes de impresión.
            </div>
          ) : (
            Object.entries(alerts).map(([id, alert]) => (
              <div 
                key={id} 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <p style={{ fontWeight: '700', color: '#1e293b', marginBottom: '0.25rem' }}>
                    {alert.clientName}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {new Date(alert.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                
                <button 
                  onClick={() => dismissAlert(id)}
                  style={{
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Marcar como visto"
                >
                  <Check size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {Object.keys(alerts).length > 0 && (
          <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={clearAll} style={{ color: '#dc2626' }}>
              Limpiar Todas
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default PrintAlertsModal;
