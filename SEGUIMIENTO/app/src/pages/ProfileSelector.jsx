import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { ref, onValue } from 'firebase/database';
import { useProfile } from '../contexts/ProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Pencil, Sparkles } from 'lucide-react';
import ProfileCustomizerModal from '../components/ProfileCustomizerModal';
import ProfileTransitionOverlay from '../components/ProfileTransitionOverlay';

const DEFAULT_PROFILES = [
  { id: 'p1', name: 'Mayra', color: '#EC4899', active: true, avatarIcon: '🌸', transitionEffect: 'confetti' },
  { id: 'p2', name: 'Kriz', color: '#06B6D4', active: true, avatarIcon: '⚡', transitionEffect: 'lightning' },
  { id: 'p3', name: 'Alvaro', color: '#47FF00', active: true, avatarIcon: '🚀', transitionEffect: 'warp' },
  { id: 'p4', name: 'Felizai', color: '#F59E0B', active: true, avatarIcon: '👑', transitionEffect: 'portal' },
];

function ProfileSelector() {
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [editingProfile, setEditingProfile] = useState(null);
  const [enteringProfile, setEnteringProfile] = useState(null);
  const { setProfile } = useProfile();
  const { logout } = useAuth();

  useEffect(() => {
    const profilesRef = ref(db, 'profiles');
    const unsub = onValue(profilesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const arr = Object.values(data).filter(p => p.active !== false);
        if (arr.length > 0) setProfiles(arr);
      }
    }, (err) => {
      console.warn('Error fetching profiles, using defaults', err);
    });
    return () => unsub();
  }, []);

  const handleSelectProfile = (profile) => {
    setEnteringProfile(profile);
  };

  const handleTransitionComplete = () => {
    if (enteringProfile) {
      setProfile(enteringProfile);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box',
      padding: '1.5rem 1rem'
    }}>
      
      {/* Header Centrado */}
      <div style={{
        textAlign: 'center',
        marginTop: 'auto',
        marginBottom: '2.5rem'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '4px 14px',
          borderRadius: '9999px',
          fontSize: '0.8rem',
          fontWeight: 800,
          marginBottom: '0.75rem',
          letterSpacing: '0.5px'
        }}>
          <Sparkles size={14} color="#10b981" /> SELLOS CHACAÍTO
        </div>
        <h1 style={{
          fontSize: 'clamp(1.75rem, 6vw, 2.5rem)',
          fontWeight: 900,
          margin: 0,
          letterSpacing: '-0.03em',
          color: '#0f172a',
          lineHeight: 1.2
        }}>
          ¿Quién está usando el sistema?
        </h1>
        <p style={{
          color: '#64748b',
          fontSize: '0.92rem',
          margin: '0.5rem 0 0',
          fontWeight: 600
        }}>
          Selecciona tu perfil o toca el lápiz ✏️ para personalizarlo
        </p>
      </div>

      {/* Grid de Perfiles 2x2 en móvil / línea en desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(135px, 165px))',
        justifyContent: 'center',
        gap: '1.25rem',
        width: '100%',
        maxWidth: '700px',
        margin: '0 auto',
        padding: '0 0.5rem'
      }}>
        {profiles.map(p => {
          const cardColor = p.color || '#10b981';
          return (
            <div
              key={p.id}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '24px',
                padding: '1.5rem 0.75rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              onClick={() => handleSelectProfile(p)}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = cardColor;
                e.currentTarget.style.boxShadow = `0 12px 24px -6px rgba(0,0,0,0.08)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)';
              }}
            >
              {/* Botón Lápiz para Personalizar */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingProfile(p);
                }}
                title="Personalizar avatar, color y animación"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}
              >
                <Pencil size={13} />
              </button>

              {/* Avatar Box */}
              <div style={{
                width: '84px',
                height: '84px',
                borderRadius: '20px',
                backgroundColor: cardColor,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '2.5rem',
                color: '#fff',
                marginBottom: '0.85rem',
                boxShadow: `0 8px 16px -4px ${cardColor}44`,
                overflow: 'hidden'
              }}>
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  p.avatarIcon || p.name?.charAt(0).toUpperCase()
                )}
              </div>

              {/* Nombre de Perfil con su tipografía */}
              <span style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#0f172a',
                fontFamily: p.fontFamily || 'inherit',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '130px',
                letterSpacing: '-0.01em'
              }}>
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Seguro: Cerrar Sesión Maestra */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '2rem',
        display: 'flex',
        justifyContent: 'center',
        width: '100%'
      }}>
        <button 
          onClick={() => logout()}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            padding: '0.65rem 1.25rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.borderColor = '#fecaca';
            e.currentTarget.style.background = '#fef2f2';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = '#ffffff';
          }}
        >
          <LogOut size={16} /> Cerrar Sesión Maestra
        </button>
      </div>

      {/* Modal de Personalización */}
      {editingProfile && (
        <ProfileCustomizerModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onUpdated={(updated) => {
            setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
          }}
        />
      )}

      {/* Overlay de Transición Mágica al Entrar */}
      {enteringProfile && (
        <ProfileTransitionOverlay
          profile={enteringProfile}
          onComplete={handleTransitionComplete}
        />
      )}

    </div>
  );
}

export default ProfileSelector;
