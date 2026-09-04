import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBotSettings, saveBotSettings } from '../../services/db';

const BotSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [settings, setSettings] = useState({
    enabled: true,
    botName: 'Gravy',
    botTitle: 'Asesor Virtual de Sellos Chacaíto',
    welcomeMessage: '¡Hola! 👋 Soy Gravy, tu asesor de sellos personalizados. ¿En qué te puedo ayudar hoy?',
    geminiApiKey: ''
  });

  const [showApiKeyHelp, setShowApiKeyHelp] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const data = await getBotSettings();
      if (data) {
        setSettings({
          enabled: data.enabled !== false,
          botName: data.botName || 'Gravy',
          botTitle: data.botTitle || 'Asesor Virtual de Sellos Chacaíto',
          welcomeMessage: data.welcomeMessage || '¡Hola! 👋 Soy Gravy, tu asesor de sellos personalizados. ¿En qué te puedo ayudar hoy?',
          geminiApiKey: data.geminiApiKey || ''
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
      await saveBotSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (error) {
      alert('Error al guardar la configuración del bot');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Cargando configuración del bot...</div>;
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <Link to="/admin" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>←</Link>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: '800', margin: 0 }}>🤖 Asistente Virtual (Gravy)</h1>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
            Personaliza el nombre, saludo y motor de inteligencia artificial de tu mascota virtual.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(71, 255, 0, 0.12)', border: '1px solid #47FF00', borderRadius: '12px', color: '#16a34a', fontWeight: '700', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          ✅ ¡Configuración guardada con éxito! La mascota en la tienda ya está actualizada.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* === TOGGLE PRINCIPAL: ENCENDER / APAGAR === */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.15rem 1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🤖</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Mascota Asistente en la Tienda</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>Muestra el sello animado flotante en la esquina de la web</span>
              </div>
            </div>

            <label className="admin-toggle" style={{ margin: 0 }}>
              <input 
                type="checkbox" 
                checked={settings.enabled} 
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} 
              />
              <span className="toggle-label" style={{ fontSize: '0.85rem' }}>
                {settings.enabled ? '🟢 Activo' : '⚪ Inactivo'}
              </span>
            </label>
          </div>
        </div>

        {/* === DATOS DEL BOT === */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '700' }}>
              Nombre de la Mascota / Bot *
            </label>
            <input 
              type="text" 
              value={settings.botName} 
              onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
              required
              placeholder="Ej: Gravy" 
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '10px',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '700' }}>
              Título o Subtítulo del Asistente
            </label>
            <input 
              type="text" 
              value={settings.botTitle} 
              onChange={(e) => setSettings({ ...settings, botTitle: e.target.value })}
              placeholder="Ej: Asesor Virtual de Sellos Chacaíto" 
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '10px',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '700' }}>
              Mensaje Inicial de Bienvenida *
            </label>
            <textarea 
              value={settings.welcomeMessage} 
              onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
              required
              rows={3}
              placeholder="Escribe el primer mensaje que verá el cliente..." 
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '10px',
                border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-main)', fontSize: '0.9rem', boxSizing: 'border-box',
                resize: 'vertical', fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* === MOTOR GEMINI AI (OPCIONAL) === */}
        <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🧠</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800' }}>Google Gemini AI (Opcional)</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                {settings.geminiApiKey ? '✅ Motor Gemini AI conectado' : '⚡ Usando motor inteligente con base de conocimiento integrada'}
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '0 0 0.85rem 0', lineHeight: 1.45 }}>
            El bot ya cuenta con una <strong>base de conocimiento experta integrada</strong> (requisitos médicos, abogados, empresas, medidas y catálogo en vivo). Si deseas que responda cualquier pregunta compleja con lenguaje ultra natural, puedes pegar tu clave de Google AI Studio.
          </p>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '700' }}>
              Gemini API Key (Google AI Studio)
            </label>
            <input 
              type="password" 
              value={settings.geminiApiKey} 
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value.trim() })}
              placeholder="AIzaSy..." 
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
            onClick={() => setShowApiKeyHelp(!showApiKeyHelp)} 
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
          >
            {showApiKeyHelp ? '▲ Ocultar ayuda de Gemini API' : '❓ ¿Cómo obtener una clave de Gemini gratuita en 1 minuto?'}
          </button>

          {showApiKeyHelp && (
            <div style={{ marginTop: '0.75rem', padding: '0.85rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 0.4rem 0', fontWeight: '700', color: 'var(--color-text-main)' }}>Pasos simples:</p>
              <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                <li>Entra a <strong><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>Google AI Studio (aistudio.google.com)</a></strong> con tu cuenta de Google.</li>
                <li>Haz clic en el botón azul <strong>"Create API key"</strong>.</li>
                <li>Copia la clave generada y pégala en el campo de arriba. ¡Es 100% gratuita!</li>
              </ol>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={saving}
          className="btn btn-primary"
          style={{ padding: '1rem', fontSize: '1rem', fontWeight: '800', borderRadius: '12px', minHeight: '52px' }}
        >
          {saving ? 'Guardando...' : '💾 Guardar Configuración de Gravy'}
        </button>

      </form>
    </div>
  );
};

export default BotSettings;
