import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAnalyticsSettings, saveAnalyticsSettings } from '../../services/db';

const AnalyticsSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [settings, setSettings] = useState({
    metaPixelId: '',
    metaPixelEnabled: false,
    googleAnalyticsId: '',
    googleAnalyticsEnabled: false,
    lookerStudioUrl: ''
  });

  const [showMetaHelp, setShowMetaHelp] = useState(false);
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const data = await getAnalyticsSettings();
      if (data) {
        setSettings({
          metaPixelId: data.metaPixelId || '',
          metaPixelEnabled: data.metaPixelEnabled || false,
          googleAnalyticsId: data.googleAnalyticsId || '',
          googleAnalyticsEnabled: data.googleAnalyticsEnabled || false,
          lookerStudioUrl: data.lookerStudioUrl || ''
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAnalyticsSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando configuración...</div>;
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <Link to="/admin" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>←</Link>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0 }}>📊 Píxels & Analítica</h1>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Mide tus ventas y rastrea visitas desde anuncios de Instagram, Facebook y Google.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(71, 255, 0, 0.12)', border: '1px solid #47FF00', borderRadius: '12px', color: '#16a34a', fontWeight: '700', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          ✅ ¡Configuración guardada! Los píxels activos rastrearán las visitas y pedidos de WhatsApp automáticamente.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* =========================================================================
            1. META PIXEL (FACEBOOK & INSTAGRAM)
           ========================================================================= */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📱</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Meta Pixel (Facebook e Instagram)</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Rastrea clics desde anuncios y pedidos por WhatsApp</span>
              </div>
            </div>

            <label className="admin-toggle" style={{ margin: 0 }}>
              <input 
                type="checkbox" 
                checked={settings.metaPixelEnabled} 
                onChange={(e) => setSettings({ ...settings, metaPixelEnabled: e.target.checked })} 
              />
              <span className="toggle-label" style={{ fontSize: '0.8rem' }}>
                {settings.metaPixelEnabled ? '🟢 Activo' : '⚪ Inactivo'}
              </span>
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '700' }}>
              Meta Pixel ID
            </label>
            <input 
              type="text" 
              value={settings.metaPixelId} 
              onChange={(e) => setSettings({ ...settings, metaPixelId: e.target.value.trim() })}
              placeholder="Ej: 1234567890123456" 
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '10px',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Help collapsible */}
          <button 
            type="button" 
            onClick={() => setShowMetaHelp(!showMetaHelp)} 
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
          >
            {showMetaHelp ? '▲ Ocultar ayuda de Meta Pixel' : '❓ ¿Dónde encuentro mi ID del Meta Pixel?'}
          </button>

          {showMetaHelp && (
            <div style={{ marginTop: '0.75rem', padding: '0.85rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 0.4rem 0', fontWeight: '700', color: 'var(--color-text-main)' }}>Pasos para obtener tu ID:</p>
              <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                <li>Entra a <strong>Meta Business Suite</strong> (business.facebook.com).</li>
                <li>Ve a <strong>Configuración del negocio</strong> &gt; <strong>Orígenes de datos</strong> &gt; <strong>Conjuntos de datos (Píxeles)</strong>.</li>
                <li>Crea un píxel o selecciona el existente y copia el número de 15 o 16 dígitos que aparece en la parte superior.</li>
              </ol>
            </div>
          )}
        </div>

        {/* =========================================================================
            2. GOOGLE ANALYTICS 4 (GA4)
           ========================================================================= */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📈</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Google Analytics 4 (GA4)</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Mide el tráfico de búsquedas en Google y usuarios en tiempo real</span>
              </div>
            </div>

            <label className="admin-toggle" style={{ margin: 0 }}>
              <input 
                type="checkbox" 
                checked={settings.googleAnalyticsEnabled} 
                onChange={(e) => setSettings({ ...settings, googleAnalyticsEnabled: e.target.checked })} 
              />
              <span className="toggle-label" style={{ fontSize: '0.8rem' }}>
                {settings.googleAnalyticsEnabled ? '🟢 Activo' : '⚪ Inactivo'}
              </span>
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '700' }}>
              Google Measurement ID (ID de Medición)
            </label>
            <input 
              type="text" 
              value={settings.googleAnalyticsId} 
              onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value.trim() })}
              placeholder="Ej: G-XXXXXXXXXX" 
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '10px',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Help collapsible */}
          <button 
            type="button" 
            onClick={() => setShowGoogleHelp(!showGoogleHelp)} 
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
          >
            {showGoogleHelp ? '▲ Ocultar ayuda de Google Analytics' : '❓ ¿Dónde encuentro mi ID de Google Analytics?'}
          </button>

          {showGoogleHelp && (
            <div style={{ marginTop: '0.75rem', padding: '0.85rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 0.4rem 0', fontWeight: '700', color: 'var(--color-text-main)' }}>Pasos para obtener tu ID:</p>
              <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                <li>Entra a <strong>Google Analytics</strong> (analytics.google.com).</li>
                <li>Ve a <strong>Administrar (engranaje)</strong> &gt; <strong>Flujos de datos</strong> &gt; <strong>Web</strong>.</li>
                <li>Copia el <strong>ID de Medición</strong> que empieza por <code>G-</code>.</li>
              </ol>
            </div>
          )}
        </div>

        {/* =========================================================================
            3. LOOKER STUDIO (DASHBOARD ANALÍTICO)
           ========================================================================= */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📊</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Tablero de Google Looker Studio</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Muestra tu reporte de Google Analytics dentro del panel administrativo</span>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '700' }}>
              Enlace de Inserción (Embed URL)
            </label>
            <input 
              type="text" 
              value={settings.lookerStudioUrl} 
              onChange={(e) => setSettings({ ...settings, lookerStudioUrl: e.target.value.trim() })}
              placeholder="Ej: https://lookerstudio.google.com/embed/reporting/xxx/page/xxx" 
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '10px',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ padding: '0.85rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
            <p style={{ margin: '0 0 0.4rem 0', fontWeight: '700', color: 'var(--color-text-main)' }}>¿Cómo obtener este enlace?</p>
            <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
              <li>Entra a <strong>Looker Studio</strong> y abre tu reporte.</li>
              <li>Toca <strong>Compartir</strong> (arriba a la derecha) y elige <strong>Insertar informe (Embed report)</strong>.</li>
              <li>Selecciona <strong>URL de inserción</strong> y copia el link que aparece.</li>
            </ol>
          </div>
        </div>

        {/* =========================================================================
            4. EVENTOS ACTIVOS AUTOMÁTICAMENTE
           ========================================================================= */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: '800' }}>🎯 Eventos rastreados automáticamente:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
            <div style={{ padding: '0.6rem 0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', fontSize: '0.78rem' }}>
              <strong>👁️ ViewContent:</strong> Al ver la ficha de un sello.
            </div>
            <div style={{ padding: '0.6rem 0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', fontSize: '0.78rem' }}>
              <strong>💬 Contact:</strong> Al pulsar "Pedir por WhatsApp".
            </div>
            <div style={{ padding: '0.6rem 0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', fontSize: '0.78rem' }}>
              <strong>👑 Lead:</strong> Al registrarse como mayorista.
            </div>
            <div style={{ padding: '0.6rem 0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', fontSize: '0.78rem' }}>
              <strong>📄 PageView:</strong> Al cambiar entre páginas.
            </div>
          </div>
        </div>

        {/* Submit */}
        <button 
          type="submit" 
          disabled={saving}
          className="btn btn-primary"
          style={{ padding: '1rem', fontSize: '1rem', fontWeight: '800', borderRadius: '12px', minHeight: '52px' }}
        >
          {saving ? 'Guardando configuración...' : '💾 Guardar Configuración de Píxels'}
        </button>

      </form>
    </div>
  );
};

export default AnalyticsSettings;
