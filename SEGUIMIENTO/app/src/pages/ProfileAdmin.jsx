import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { db } from '../firebase/config';
import { ref, onValue, set, push, remove } from 'firebase/database';
import { Plus, Trash2, Power, X, Check, Users, ShieldCheck, PanelLeft, Pencil, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ProfileCustomizerModal from '../components/ProfileCustomizerModal';
import '../styles/whitestamp.css';
import './ProfileAdmin.css';

function ProfileAdmin() {
  const { toggleSidebar } = useOutletContext() || {};
  const [profiles, setProfiles] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#10b981');

  useEffect(() => {
    const profilesRef = ref(db, 'profiles');
    const unsub = onValue(profilesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProfiles(Object.values(data));
      } else {
        setProfiles([]);
      }
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e) => {
    if (e) e.preventDefault();
    if (!newName.trim()) {
      toast.error('Ingresa un nombre para el usuario');
      return;
    }
    try {
      const profilesRef = ref(db, 'profiles');
      const newRef = push(profilesRef);
      await set(newRef, {
        id: newRef.key,
        name: newName.trim(),
        color: newColor,
        active: true,
        createdAt: Date.now()
      });
      setNewName('');
      setIsAdding(false);
      toast.success('Usuario agregado con éxito');
    } catch (err) {
      console.error(err);
      toast.error('Error al agregar usuario');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al usuario "${name}"?`)) return;
    try {
      await remove(ref(db, `profiles/${id}`));
      toast.success('Usuario eliminado');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  const toggleActive = async (profile) => {
    try {
      await set(ref(db, `profiles/${profile.id}/active`), !profile.active);
      toast.success(profile.active ? 'Usuario desactivado' : 'Usuario activado');
    } catch (err) {
      console.error(err);
      toast.error('Error al cambiar estado');
    }
  };

  const activeCount = profiles.filter(p => p.active).length;

  return (
    <div className="profile-admin-wrapper">
      <div className="profile-admin-container">
        
        {/* Cabecera Principal */}
        <header className="profile-header">
          <div className="header-info">
            <div className="header-top-row">
              {toggleSidebar && (
                <button 
                  onClick={toggleSidebar} 
                  className="sidebar-toggle-btn"
                  title="Abrir menú lateral"
                  type="button"
                >
                  <PanelLeft size={18} />
                </button>
              )}
              <div className="header-badge">
                <ShieldCheck size={14} />
                <span>Control de Accesos</span>
              </div>
            </div>
            <h1 className="header-title">Usuarios y Perfiles</h1>
            <p className="header-sub">
              Administra los miembros del equipo que pueden operar el sistema y registrar ventas.
            </p>
          </div>
          
          <button 
            onClick={() => setIsAdding(!isAdding)} 
            className="ws-btn-primary add-user-btn"
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            <span>{isAdding ? 'Cancelar' : 'Nuevo Usuario'}</span>
          </button>
        </header>

        {/* Formulario de Agregar Usuario */}
        {isAdding && (
          <form onSubmit={handleAdd} className="ws-card add-profile-form">
            <div className="form-header">
              <h3>Crear Nuevo Perfil de Usuario</h3>
              <p>El usuario aparecerá en la selección de cajeros y responsables de órdenes.</p>
            </div>
            
            <div className="form-body">
              <div className="form-group flex-2">
                <label>Nombre Completo / Apodo</label>
                <div className="ws-input-container input-box">
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    className="ws-input" 
                    placeholder="Ej. Mayra, Carlos, Recepción..." 
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-group flex-1">
                <label>Color Identificador</label>
                <div className="color-picker-wrap">
                  <input 
                    type="color" 
                    value={newColor} 
                    onChange={e => setNewColor(e.target.value)} 
                    className="color-input"
                  />
                  <span className="color-hex">{newColor.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)} 
                className="ws-btn-secondary"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="ws-btn-primary"
              >
                <Check size={18} /> Guardar Usuario
              </button>
            </div>
          </form>
        )}

        {/* Resumen & Métricas Rápidas */}
        <div className="users-stats-bar">
          <div className="stat-pill">
            <Users size={16} />
            <span>Total usuarios: <b>{profiles.length}</b></span>
          </div>
          <div className="stat-pill success">
            <span className="stat-dot"></span>
            <span>Activos: <b>{activeCount}</b></span>
          </div>
        </div>

        {/* Grilla de Usuarios */}
        {profiles.length === 0 ? (
          <div className="ws-card empty-state">
            <Users size={48} strokeWidth={1.5} className="empty-icon" />
            <h3>No hay usuarios registrados</h3>
            <p>Comienza agregando el primer perfil para el equipo de trabajo.</p>
            <button onClick={() => setIsAdding(true)} className="ws-btn-primary">
              <Plus size={18} /> Agregar Primer Usuario
            </button>
          </div>
        ) : (
          <div className="profiles-grid">
            {profiles.map(p => (
              <div 
                key={p.id} 
                className={`ws-card user-card ${!p.active ? 'inactive' : ''}`}
              >
                <div className="user-card-content">
                  {/* Avatar con foto, icono o inicial */}
                  <div 
                    className="user-avatar" 
                    style={{ 
                      backgroundColor: p.color || '#10b981',
                      boxShadow: `0 4px 12px ${p.color ? p.color + '40' : 'rgba(16,185,129,0.25)'}`,
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      p.avatarIcon || p.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Info Usuario */}
                  <div className="user-details">
                    <h3 className="user-name" style={{ fontFamily: p.fontFamily || 'inherit' }}>
                      {p.name}
                    </h3>
                    <div className="user-badge-wrap">
                      <span className={`status-badge ${p.active ? 'active' : 'inactive'}`}>
                        <span className="badge-dot"></span>
                        {p.active ? 'Activo' : 'Desactivado'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones de la tarjeta */}
                <div className="user-card-actions">
                  <button 
                    onClick={() => setEditingProfile(p)}
                    className="action-icon-btn btn-edit"
                    title="Editar y Personalizar Perfil"
                  >
                    <Pencil size={15} />
                    <span>Personalizar</span>
                  </button>

                  <button 
                    onClick={() => toggleActive(p)} 
                    className={`action-icon-btn ${p.active ? 'btn-deactivate' : 'btn-activate'}`}
                    title={p.active ? 'Desactivar usuario' : 'Activar usuario'}
                  >
                    <Power size={15} />
                    <span>{p.active ? 'Pausar' : 'Activar'}</span>
                  </button>

                  <button 
                    onClick={() => handleDelete(p.id, p.name)} 
                    className="action-icon-btn btn-delete"
                    title="Eliminar permanentemente"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Modal Completo de Personalización & Edición */}
      {editingProfile && (
        <ProfileCustomizerModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onUpdated={(updated) => {
            setProfiles(prev => prev.map(pr => pr.id === updated.id ? updated : pr));
          }}
        />
      )}
    </div>
  );
}

export default ProfileAdmin;
