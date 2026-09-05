import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { firestoreDB } from '../firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';
import { Wrench, PanelLeft } from 'lucide-react';

// Historial de salidas de inventario para el taller de reparaciones.
// Lee la colección `inventory_movements` (escrita desde Inventory.jsx al registrar
// una salida a taller) y filtra/ordena en el cliente para no depender de un índice
// compuesto de Firestore — el volumen de esta colección es bajo.
export default function SalidasTaller({ isEmbedded = false }) {
  const { toggleSidebar } = useOutletContext() || {};
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(firestoreDB, 'inventory_movements'), (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(m => m.tipo === 'salida_taller');
      data.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
      setMovements(data);
      setLoading(false);
    }, (error) => {
      console.error('Error cargando salidas a taller:', error);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalUnidades = useMemo(
    () => movements.reduce((sum, m) => sum + (Number(m.cantidad) || 0), 0),
    [movements]
  );

  return (
    <div className="animate-fade-in" style={{ width: '100%', padding: isEmbedded ? '0' : '20px 24px 80px', boxSizing: 'border-box' }}>
      {!isEmbedded && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '22px 28px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}>
          {toggleSidebar && (
            <button onClick={toggleSidebar} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Abrir menú" type="button">
              <PanelLeft size={18} />
            </button>
          )}
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Salidas a Taller
            </h1>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '13px', fontWeight: 500 }}>
              Historial de insumos que salieron del inventario para reparaciones
            </p>
          </div>
        </div>
      )}

      <div style={{
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        borderRadius: '14px',
        padding: '14px 18px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Wrench size={18} color="#c2410c" />
        <span style={{ fontWeight: 800, color: '#9a3412', fontSize: '14px' }}>
          {movements.length} salidas registradas · {totalUnidades} unidades en total
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1.5rem' }}>⏳</span>
            <p style={{ marginTop: '8px', fontWeight: 700 }}>Cargando historial...</p>
          </div>
        ) : movements.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <p style={{ fontWeight: 700, margin: 0 }}>Aún no se han registrado salidas a taller</p>
          </div>
        ) : (
          movements.map(m => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '14px',
                border: '1px solid #f1f5f9',
                background: '#ffffff',
                gap: '14px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                  {m.producto_nombre}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  {m.motivo}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                  {m.fecha ? new Date(m.fecha).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                </div>
              </div>
              <div style={{
                background: '#fff7ed',
                color: '#c2410c',
                padding: '6px 12px',
                borderRadius: '999px',
                fontWeight: 800,
                fontSize: '0.9rem',
                flexShrink: 0
              }}>
                -{m.cantidad}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
