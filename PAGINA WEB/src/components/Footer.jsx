import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer" style={{ padding: '2.5rem 0 1.5rem 0', backgroundColor: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)' }}>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between' }}>
        
        <div style={{ flex: '1 1 240px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
            Sellos Chacaíto
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.35rem', fontSize: '0.9rem' }}>📍 Chacaíto, Caracas, Venezuela</p>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>⏰ Lunes a viernes · 8:00 AM – 5:00 PM</p>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', alignItems: 'center' }}>
            <a href="https://wa.me/584241345488" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-whatsapp)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </a>
            <a href="https://www.instagram.com/sellos.chacaito/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-main)', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
              Instagram
            </a>
          </div>
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.75rem' }}>Enlaces rápidos</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem' }}>
            <li><Link to="/" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Catálogo</Link></li>
            <li><Link to="/como-comprar" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Cómo comprar</Link></li>
            <li><Link to="/servicios" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Servicios</Link></li>
            <li><Link to="/faq" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Preguntas frecuentes</Link></li>
            <li><Link to="/politicas" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Políticas</Link></li>
            <li><Link to="/contacto" style={{ textDecoration: 'none', color: 'var(--color-text-secondary)' }}>Contacto</Link></li>
          </ul>
        </div>

        {/* Sección Mayoristas & Distribuidores */}
        <div style={{ flex: '1 1 240px', backgroundColor: 'var(--color-bg-card)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>👑</span>
            <h4 style={{ fontSize: '1rem', fontWeight: '800', margin: 0, color: 'var(--color-text-main)' }}>
              Área de Mayoristas
            </h4>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.85rem', lineHeight: '1.4' }}>
            ¿Tienes papelería, imprenta o revendes sellos? Solicita tu pase de distribuidor con precios especiales.
          </p>
          <Link 
            to="/mayoristas"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              backgroundColor: '#11141B', color: '#FFB800', border: '1px solid rgba(255, 184, 0, 0.4)',
              padding: '0.5rem 0.85rem', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '800',
              textDecoration: 'none', transition: 'transform 0.2s, border-color 0.2s'
            }}
          >
            <span>👑</span> Solicitar Pase Mayorista →
          </Link>
        </div>
      </div>
      
      <div className="container" style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
        <p>© 2026 Sellos Chacaíto.</p>
      </div>
    </footer>
  );
};

export default Footer;
