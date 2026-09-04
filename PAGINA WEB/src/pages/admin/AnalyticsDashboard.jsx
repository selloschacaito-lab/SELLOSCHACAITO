import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAnalyticsSettings } from '../../services/db';

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [lookerStudioUrl, setLookerStudioUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const data = await getAnalyticsSettings();
      if (data && data.lookerStudioUrl) {
        setLookerStudioUrl(data.lookerStudioUrl);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando tablero estadístico...</div>;
  }

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexShrink: 0 }}>
        <Link to="/admin" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>←</Link>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0 }}>📈 Tablero Estadístico</h1>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Visitas, interacción y conversiones de tu página web.
            </p>
          </div>
          <button 
            onClick={() => navigate('/admin/analitica')}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', borderRadius: '8px' }}
          >
            ⚙️ Configurar
          </button>
        </div>
      </div>

      {lookerStudioUrl ? (
        <div style={{ flex: 1, backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
          <iframe 
            src={lookerStudioUrl} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            style={{ border: 0 }} 
            allowFullScreen 
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            title="Tablero de Estadísticas de Looker Studio"
          ></iframe>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg-card)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '2rem', textAlign: 'center' }}>
          <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</span>
          <h2 style={{ margin: '0 0 0.5rem 0', fontWeight: '800' }}>Tablero no configurado</h2>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '400px', marginBottom: '1.5rem', lineHeight: '1.5' }}>
            Para ver tus estadísticas aquí, necesitas pegar el <strong>Enlace de Inserción</strong> de tu reporte de Looker Studio.
          </p>
          <button 
            onClick={() => navigate('/admin/analitica')}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 'bold' }}
          >
            Configurar Enlace
          </button>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
