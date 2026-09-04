import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function ProfileTransitionOverlay({ profile, transitionType, onComplete }) {
  const type = transitionType || profile?.transitionEffect || 'warp';

  useEffect(() => {
    // Si la animación es Confeti, disparar partículas
    if (type === 'confetti') {
      const duration = 1200;
      const end = Date.now() + duration;
      const colors = ['#47FF00', '#3B82F6', '#EC4899', '#F59E0B', '#A855F7', '#06B6D4'];

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.7 },
          colors: colors
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.7 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1300);

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#0a0f1d',
      overflow: 'hidden',
      fontFamily: profile?.fontFamily || 'system-ui, sans-serif'
    }}>
      <style>{`
        @keyframes warpZoom {
          0% { transform: scale(0.1) translateZ(-500px); opacity: 0; filter: blur(8px); }
          50% { opacity: 1; filter: blur(0); }
          100% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes warpLines {
          0% { transform: scale(0.2) rotate(0deg); opacity: 0; }
          60% { opacity: 0.8; }
          100% { transform: scale(2.5) rotate(45deg); opacity: 0; }
        }
        @keyframes confettiPop {
          0% { transform: scale(0.2) rotate(-15deg); opacity: 0; }
          60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
          80% { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1.05) rotate(0deg); opacity: 1; }
        }
        @keyframes portalSpin {
          0% { transform: rotate(0deg) scale(0.3); opacity: 0; filter: hue-rotate(0deg); }
          50% { opacity: 1; }
          100% { transform: rotate(720deg) scale(1.8); opacity: 0.9; filter: hue-rotate(180deg); }
        }
        @keyframes arcadeBlink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.1; }
        }
        @keyframes arcadeGlitch {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 3px); }
          40% { transform: translate(-3px, -3px); }
          60% { transform: translate(3px, 3px); }
          80% { transform: translate(3px, -3px); }
          100% { transform: translate(0); }
        }
        @keyframes lightningFlash {
          0%, 100% { background: #0a0f1d; }
          15%, 25% { background: #ffffff; }
          20%, 30% { background: #1e1b4b; }
          50% { background: #0f172a; }
        }
        @keyframes thunderShake {
          0%, 100% { transform: translate(0, 0) scale(1); }
          10%, 30%, 50%, 70% { transform: translate(-6px, 4px) scale(1.05); }
          20%, 40%, 60%, 80% { transform: translate(6px, -4px) scale(1.05); }
        }
        @keyframes shockwave {
          0% { transform: scale(0.2); opacity: 1; border-width: 12px; }
          100% { transform: scale(2.8); opacity: 0; border-width: 1px; }
        }
      `}</style>

      {/* 1. HIPERESPACIO GALÁCTICO (WARP) */}
      {type === 'warp' && (
        <>
          <div style={{
            position: 'absolute',
            inset: '-50%',
            background: 'radial-gradient(circle at center, transparent 10%, rgba(59,130,246,0.3) 40%, #000 80%)',
            animation: 'warpLines 1.2s cubic-bezier(0.1, 0.9, 0.2, 1) infinite'
          }} />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            animation: 'warpZoom 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '24px',
              backgroundColor: profile?.color || '#47FF00',
              boxShadow: `0 0 50px ${profile?.color || '#47FF00'}, 0 0 100px #3b82f6`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '3.5rem',
              color: '#fff',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile?.avatarIcon || profile?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '2px',
              textShadow: '0 0 20px rgba(255,255,255,0.8)'
            }}>
              {profile?.name}
            </div>
            <div style={{
              fontSize: '1rem',
              color: '#38bdf8',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              marginTop: '8px',
              fontWeight: 700
            }}>
              🚀 ENTRANDO AL SISTEMA...
            </div>
          </div>
        </>
      )}

      {/* 2. FIESTA NEÓN & CONFETI */}
      {type === 'confetti' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
          animation: 'confettiPop 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '28px',
            backgroundColor: profile?.color || '#EC4899',
            boxShadow: `0 0 60px ${profile?.color || '#EC4899'}, 0 0 120px #f43f5e`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '3.5rem',
            color: '#fff',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profile?.avatarIcon || profile?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{
            fontSize: '2.2rem',
            fontWeight: 900,
            color: '#fff',
            textShadow: '0 0 25px rgba(236,72,153,0.8)'
          }}>
            ¡HOLA, {profile?.name?.toUpperCase()}! ✨
          </div>
          <div style={{
            fontSize: '1rem',
            color: '#f472b6',
            fontWeight: 700,
            marginTop: '8px'
          }}>
            🎉 ¡PREPARANDO TU TURNO!
          </div>
        </div>
      )}

      {/* 3. PORTAL MÁGICO */}
      {type === 'portal' && (
        <>
          <div style={{
            position: 'absolute',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: 'conic-gradient(from 0deg, #8b5cf6, #06b6d4, #10b981, #f59e0b, #ec4899, #8b5cf6)',
            animation: 'portalSpin 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
            filter: 'blur(10px)',
            opacity: 0.8
          }} />
          <div style={{
            position: 'absolute',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            border: '4px solid #a855f7',
            animation: 'shockwave 1.3s ease-out infinite'
          }} />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            animation: 'warpZoom 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: profile?.color || '#8B5CF6',
              boxShadow: '0 0 50px #8b5cf6, 0 0 90px #06b6d4',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '3.5rem',
              color: '#fff',
              overflow: 'hidden',
              marginBottom: '1rem',
              border: '3px solid #fff'
            }}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile?.avatarIcon || profile?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{
              fontSize: '2.2rem',
              fontWeight: 900,
              color: '#fff',
              textShadow: '0 0 30px #a855f7'
            }}>
              🌀 PORTAL ABIERTO
            </div>
            <div style={{
              fontSize: '1rem',
              color: '#c084fc',
              letterSpacing: '2px',
              fontWeight: 700,
              marginTop: '6px'
            }}>
              {profile?.name} • SESIÓN INICIADA
            </div>
          </div>
        </>
      )}

      {/* 4. RETRO ARCADE (8-BIT) */}
      {type === 'arcade' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
          animation: 'arcadeGlitch 0.4s infinite'
        }}>
          <div style={{
            fontSize: '1.2rem',
            color: '#4ade80',
            fontFamily: 'monospace',
            letterSpacing: '4px',
            marginBottom: '1rem',
            animation: 'arcadeBlink 0.6s infinite'
          }}>
            ▶ PLAYER 1 READY
          </div>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '12px',
            border: '4px solid #4ade80',
            backgroundColor: profile?.color || '#10B981',
            boxShadow: '0 0 30px #22c55e',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '3.5rem',
            color: '#fff',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profile?.avatarIcon || profile?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{
            fontSize: '2.2rem',
            fontWeight: 900,
            color: '#facc15',
            fontFamily: 'monospace',
            letterSpacing: '2px',
            textShadow: '3px 3px 0 #000, -2px -2px 0 #16a34a'
          }}>
            {profile?.name?.toUpperCase()}
          </div>
          <div style={{
            fontSize: '1rem',
            color: '#4ade80',
            fontFamily: 'monospace',
            marginTop: '8px'
          }}>
            ★★ LEVEL UP ★★
          </div>
        </div>
      )}

      {/* 5. TRUENO DE SUPERHÉROE */}
      {type === 'lightning' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'lightningFlash 1.2s ease-in-out, thunderShake 0.6s 0.2s ease-in-out'
        }}>
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            border: '6px solid #38bdf8',
            animation: 'shockwave 0.8s 0.2s ease-out forwards'
          }} />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            animation: 'warpZoom 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: profile?.color || '#F59E0B',
              boxShadow: '0 0 80px #38bdf8, 0 0 120px #f59e0b',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '3.5rem',
              color: '#fff',
              overflow: 'hidden',
              marginBottom: '1rem',
              border: '4px solid #fff'
            }}>
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile?.avatarIcon || profile?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '2px',
              textShadow: '0 0 35px #38bdf8'
            }}>
              ⚡ {profile?.name?.toUpperCase()}
            </div>
            <div style={{
              fontSize: '1rem',
              color: '#facc15',
              fontWeight: 800,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginTop: '6px'
            }}>
              ¡MODO OPERATIVO ACTIVADO!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
