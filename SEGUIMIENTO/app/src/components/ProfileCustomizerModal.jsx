import React, { useState } from 'react';
import { db } from '../firebase/config';
import { ref, update } from 'firebase/database';
import { X, Upload, Trash2, Sparkles, Check, Play, Palette, Type, Smile } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ProfileTransitionOverlay from './ProfileTransitionOverlay';

const PRESET_AVATARS = [
  // Animales
  { id: 'fox', icon: '🦊', label: 'Zorro Astuto' },
  { id: 'panda', icon: '🐼', label: 'Oso Panda' },
  { id: 'lion', icon: '🦁', label: 'León Rey' },
  { id: 'cat', icon: '🐱', label: 'Gatito' },
  { id: 'owl', icon: '🦉', label: 'Búho Sabio' },
  { id: 'dino', icon: '🦖', label: 'T-Rex' },
  // Sellos y Taller
  { id: 'stamp', icon: '🖋️', label: 'Sello Pro' },
  { id: 'coffee', icon: '☕', label: 'Café Doble' },
  { id: 'box', icon: '📦', label: 'Paquete Flash' },
  { id: 'palette', icon: '🎨', label: 'Diseño' },
  { id: 'diamond', icon: '💎', label: 'Diamante VIP' },
  { id: 'bolt', icon: '⚡', label: 'Rayo Neón' },
  // Retro, Gamer & Fun
  { id: 'alien', icon: '👾', label: 'Alien 8-Bit' },
  { id: 'joystick', icon: '🕹️', label: 'Arcade Gamer' },
  { id: 'rocket', icon: '🚀', label: 'Cohete' },
  { id: 'crown', icon: '👑', label: 'Corona' },
  { id: 'wizard', icon: '🧙‍♂️', label: 'Mago' },
  { id: 'robot', icon: '🤖', label: 'Cyber Robot' },
  { id: 'pizza', icon: '🍕', label: 'Pizza Power' },
  { id: 'avocado', icon: '🥑', label: 'Aguacate' }
];

const PRESET_COLORS = [
  '#47FF00', // Verde Neón Sellos Chacaíto
  '#3B82F6', // Azul Eléctrico
  '#EC4899', // Rosa Intenso
  '#F59E0B', // Ámbar Cálido
  '#8B5CF6', // Violeta Cósmico
  '#06B6D4', // Cian Neón
  '#EF4444', // Rojo Rubí
  '#10B981'  // Esmeralda
];

const FONTS = [
  { id: 'sans', name: 'Moderna / Sans', family: "system-ui, -apple-system, sans-serif" },
  { id: 'arcade', name: 'Retro / Arcade', family: "'Courier New', monospace" },
  { id: 'fun', name: 'Divertida / Cómic', family: "'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif" },
  { id: 'serif', name: 'Elegante / Serif', family: "'Georgia', serif" },
  { id: 'mono', name: 'Tecno / Código', family: "'Lucida Console', Monaco, monospace" }
];

const TRANSITIONS = [
  { id: 'warp', name: '🚀 Hiperspacio Galáctico', desc: 'Túnel cósmico a hipervelocidad' },
  { id: 'confetti', name: '🎉 Fiesta Neón & Confeti', desc: 'Explosión de partículas de colores' },
  { id: 'portal', name: '🌀 Portal Mágico', desc: 'Vórtice místico con ondas de energía' },
  { id: 'arcade', name: '🎮 Retro Arcade (8-Bit)', desc: 'Level Up retro con glitch y destellos' },
  { id: 'lightning', name: '⚡ Trueno de Superhéroe', desc: 'Relámpago eléctrico y sacudida épica' }
];

export default function ProfileCustomizerModal({ profile, onClose, onUpdated }) {
  const [name, setName] = useState(profile?.name || '');
  const [color, setColor] = useState(profile?.color || '#47FF00');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || null);
  const [avatarIcon, setAvatarIcon] = useState(profile?.avatarIcon || null);
  const [fontFamily, setFontFamily] = useState(profile?.fontFamily || "system-ui, -apple-system, sans-serif");
  const [transitionEffect, setTransitionEffect] = useState(profile?.transitionEffect || 'warp');
  const [isSaving, setIsSaving] = useState(false);
  const [testingTransition, setTestingTransition] = useState(null);

  // Comprimir y procesar foto subida
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarUrl(dataUrl);
        setAvatarIcon(null); // Deselecciona icono prediseñado si se subió foto
        toast.success('¡Foto cargada exitosamente!');
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectIcon = (icon) => {
    setAvatarIcon(icon);
    setAvatarUrl(null); // Deselecciona foto propia si elige icono
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    setIsSaving(true);
    try {
      const updates = {
        name: name.trim(),
        color,
        avatarUrl: avatarUrl || null,
        avatarIcon: avatarIcon || null,
        fontFamily,
        transitionEffect,
        updatedAt: Date.now()
      };

      await update(ref(db, `profiles/${profile.id}`), updates);
      toast.success('¡Perfil personalizado guardado!');
      if (onUpdated) onUpdated({ ...profile, ...updates });
      onClose();
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      toast.error('Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px'
      }}>
        <div style={{
          background: '#1e293b',
          color: '#fff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          border: '1px solid #334155',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#0f172a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#47FF00" />
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Personalizar Perfil</h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: '#334155',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Scrollable */}
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Preview Card */}
            <div style={{
              background: '#0f172a',
              borderRadius: '16px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              border: '1px solid #334155'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '16px',
                backgroundColor: color,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '2.5rem',
                color: '#fff',
                overflow: 'hidden',
                boxShadow: `0 0 20px ${color}55`,
                flexShrink: 0
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  avatarIcon || (name.charAt(0).toUpperCase() || '?')
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                  VISTA PREVIA
                </div>
                <div style={{
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  color: '#fff',
                  fontFamily: fontFamily,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '2px'
                }}>
                  {name || 'Tu Nombre'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Efecto:</span>
                  <b>{TRANSITIONS.find(t => t.id === transitionEffect)?.name}</b>
                </div>
              </div>
            </div>

            {/* 1. Nombre */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                NOMBRE
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nombre"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 2. Foto o Icono */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Smile size={16} color="#47FF00" /> AVATAR: FOTO PROPIA O ICONO
              </label>

              {/* Botones de Foto */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <label style={{
                  flex: 1,
                  background: '#334155',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}>
                  <Upload size={16} /> Subir Foto desde Móvil
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>

                {avatarUrl && (
                  <button
                    onClick={() => setAvatarUrl(null)}
                    style={{
                      background: '#ef444422',
                      border: '1px solid #ef4444',
                      color: '#ef4444',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <Trash2 size={16} /> Quitar Foto
                  </button>
                )}
              </div>

              {/* Banco de 20 Iconos */}
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>
                O elige un icono prediseñado (20 disponibles):
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                background: '#0f172a',
                padding: '10px',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                {PRESET_AVATARS.map(av => {
                  const isSelected = !avatarUrl && avatarIcon === av.icon;
                  return (
                    <button
                      key={av.id}
                      onClick={() => handleSelectIcon(av.icon)}
                      title={av.label}
                      style={{
                        background: isSelected ? '#47FF0022' : '#1e293b',
                        border: isSelected ? '2px solid #47FF00' : '1px solid #334155',
                        borderRadius: '10px',
                        padding: '8px 4px',
                        fontSize: '1.6rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.1s'
                      }}
                    >
                      <span>{av.icon}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Color */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Palette size={16} color="#38bdf8" /> COLOR DE FONDO
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: color === c ? '3px solid #fff' : '2px solid transparent',
                      boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {color === c && <Check size={16} color="#fff" strokeWidth={3} />}
                  </button>
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  style={{
                    width: '38px',
                    height: '38px',
                    padding: '0',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    background: 'transparent'
                  }}
                  title="Elegir color personalizado"
                />
              </div>
            </div>

            {/* 4. Tipografía */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Type size={16} color="#f59e0b" /> ESTILO DE TIPOGRAFÍA
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {FONTS.map(f => {
                  const isSelected = fontFamily === f.family;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFontFamily(f.family)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isSelected ? '#334155' : '#0f172a',
                        border: isSelected ? '2px solid #47FF00' : '1px solid #334155',
                        color: '#fff',
                        fontFamily: f.family,
                        fontSize: '1rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{f.name} — {name || 'Tu Nombre'}</span>
                      {isSelected && <Check size={16} color="#47FF00" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Transiciones Mágicas de Entrada */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Sparkles size={16} color="#a855f7" /> ANIMACIÓN MÁGICA DE ENTRADA (5 OPCIONES)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {TRANSITIONS.map(tr => {
                  const isSelected = transitionEffect === tr.id;
                  return (
                    <div
                      key={tr.id}
                      onClick={() => setTransitionEffect(tr.id)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: isSelected ? '#334155' : '#0f172a',
                        border: isSelected ? '2px solid #a855f7' : '1px solid #334155',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: isSelected ? '#c084fc' : '#fff', fontSize: '0.9rem' }}>
                          {tr.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {tr.desc}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTransitionEffect(tr.id);
                            setTestingTransition(tr.id);
                          }}
                          style={{
                            background: '#a855f722',
                            border: '1px solid #a855f7',
                            color: '#c084fc',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <Play size={12} fill="#c084fc" /> Probar
                        </button>
                        {isSelected && <Check size={18} color="#47FF00" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer Sticky */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid #334155',
            display: 'flex',
            gap: '10px',
            background: '#0f172a'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid #334155',
                background: 'transparent',
                color: '#94a3b8',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: '#47FF00',
                color: '#000',
                fontWeight: 800,
                cursor: isSaving ? 'wait' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(71, 255, 0, 0.4)'
              }}
            >
              <Check size={18} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      {/* Vista previa temporal de transición */}
      {testingTransition && (
        <ProfileTransitionOverlay
          profile={{
            name,
            color,
            avatarUrl,
            avatarIcon,
            fontFamily,
            transitionEffect: testingTransition
          }}
          transitionType={testingTransition}
          onComplete={() => setTestingTransition(null)}
        />
      )}
    </>
  );
}
