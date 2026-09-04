import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../firebase/config';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { useProfile } from '../contexts/ProfileContext';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Tag, 
  Search, 
  Check, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Bookmark, 
  FileText,
  Volume2,
  X,
  Edit3
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Web Audio API Chime Synth
function playChimeSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    
    // First high chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    // Second resonant chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now + 0.1);
    gain2.gain.setValueAtTime(0.25, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 1.2);
  } catch (e) {
    console.error("Audio chime error:", e);
  }
}

const PRIORITIES = [
  { id: 'urgente', label: '🚨 Urgente', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
  { id: 'llamada', label: '📞 Llamar', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'finanzas', label: '💵 Finanzas', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  { id: 'taller', label: '📦 Taller/Compras', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { id: 'idea', label: '💡 Idea/Nota', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' }
];

export default function AdminNotesPanel() {
  const { activeProfile } = useProfile();
  const [notes, setNotes] = useState({});
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isSettingNewPin, setIsSettingNewPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [filterTab, setFilterTab] = useState('pending'); // 'pending' | 'reminders' | 'completed' | 'all'
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [text, setText] = useState('');
  const [noteType, setNoteType] = useState('task'); // 'task' | 'reminder' | 'note'
  const [priority, setPriority] = useState('urgente');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Note Modal
  const [editingNote, setEditingNote] = useState(null);
  const [editText, setEditText] = useState('');

  // Load Saved PIN
  const currentPin = localStorage.getItem('admin_notes_pin') || '0000';

  // Listen to Firebase RTDB adminNotes
  useEffect(() => {
    const unsub = onValue(ref(db, 'adminNotes'), (snapshot) => {
      setNotes(snapshot.val() || {});
    });
    return () => unsub();
  }, []);

  // Background Alarm Checker
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      Object.entries(notes || {}).forEach(([id, note]) => {
        if (!note || note.isCompleted || note.alarmTriggered || !note.dueDate) return;
        const due = new Date(note.dueDate);
        if (due <= now) {
          // Trigger Alarm
          playChimeSound();
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ ¡Recordatorio Pendiente!', {
              body: note.text || 'Tienes una tarea programada por atender.',
              icon: '/favicon.ico'
            });
          }
          // Mark as triggered in RTDB so it doesn't loop
          update(ref(db, `adminNotes/${id}`), { alarmTriggered: true });
          toast((t) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>⏰</span>
              <div>
                <strong>¡Alarma de Recordatorio!</strong>
                <div style={{ fontSize: '12px' }}>{note.text}</div>
              </div>
            </div>
          ), { duration: 8000 });
        }
      });
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, [notes]);

  // Handle PIN Unlock
  const handleUnlock = (e) => {
    e?.preventDefault();
    if (pinInput === currentPin) {
      setIsUnlocked(true);
      setPinInput('');
      toast.success('¡Bitácora desbloqueada!');
    } else {
      toast.error('PIN incorrecto');
      setPinInput('');
    }
  };

  // Handle PIN Change
  const handleChangePin = (e) => {
    e?.preventDefault();
    if (newPinInput.length !== 4 || isNaN(newPinInput)) {
      toast.error('El PIN debe ser de 4 números exactos');
      return;
    }
    localStorage.setItem('admin_notes_pin', newPinInput);
    setIsSettingNewPin(false);
    setNewPinInput('');
    toast.success('¡Nuevo PIN guardado exitosamente!');
  };

  // Add Note / Task / Reminder
  const handleAddNote = async (e) => {
    e?.preventDefault();
    if (!text.trim()) {
      toast.error('Escribe el contenido de la nota o tarea');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRef = push(ref(db, 'adminNotes'));
      const nowISO = new Date().toISOString();
      const payload = {
        id: newRef.key,
        text: text.trim(),
        type: noteType,
        priority: priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        isCompleted: false,
        alarmTriggered: false,
        createdAt: nowISO,
        author: activeProfile?.name || 'Alvaro'
      };

      await set(newRef, payload);
      setText('');
      setDueDate('');
      toast.success('¡Apunte registrado exitosamente!');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la nota');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Complete
  const handleToggleComplete = async (note) => {
    try {
      await update(ref(db, `adminNotes/${note.id}`), {
        isCompleted: !note.isCompleted,
        completedAt: !note.isCompleted ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      });
      toast.success(note.isCompleted ? 'Tarea reactivada' : '¡Tarea completada! 🎉');
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar');
    }
  };

  // Postpone 15 mins
  const handlePostpone = async (note) => {
    try {
      const newTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await update(ref(db, `adminNotes/${note.id}`), {
        dueDate: newTime,
        alarmTriggered: false,
        updatedAt: new Date().toISOString()
      });
      toast.success('¡Alarma pospuesta 15 minutos!');
    } catch (err) {
      console.error(err);
      toast.error('Error al posponer');
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este apunte?')) return;
    try {
      await remove(ref(db, `adminNotes/${noteId}`));
      toast.success('Apunte eliminado');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar');
    }
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingNote || !editText.trim()) return;
    try {
      await update(ref(db, `adminNotes/${editingNote.id}`), {
        text: editText.trim(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Nota editada');
      setEditingNote(null);
      setEditText('');
    } catch (err) {
      console.error(err);
      toast.error('Error al editar');
    }
  };

  // Filtered Notes List
  const notesList = useMemo(() => {
    const arr = Object.values(notes || {}).filter(Boolean);
    return arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [notes]);

  const pendingCount = notesList.filter(n => !n.isCompleted).length;
  const remindersCount = notesList.filter(n => !n.isCompleted && n.type === 'reminder').length;

  const displayedNotes = useMemo(() => {
    let list = notesList;
    if (filterTab === 'pending') list = list.filter(n => !n.isCompleted);
    else if (filterTab === 'reminders') list = list.filter(n => !n.isCompleted && n.type === 'reminder');
    else if (filterTab === 'completed') list = list.filter(n => n.isCompleted);

    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;
    return list.filter(n => n.text?.toLowerCase().includes(q) || n.priority?.toLowerCase().includes(q));
  }, [notesList, filterTab, searchTerm]);

  // If locked, render PIN lock screen
  if (!isUnlocked) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '20px',
        padding: '48px 24px',
        maxWidth: '420px',
        margin: '30px auto',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fef2f2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Lock size={32} />
        </div>

        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
          Bitácora Privada del Administrador
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px' }}>
          Ingresa tu PIN de 4 dígitos para acceder a tus notas y recordatorios confidenciales.
        </p>

        <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <input 
            type="password"
            maxLength={4}
            autoFocus
            placeholder="••••"
            value={pinInput}
            onChange={e => setPinInput(e.target.value.replace(/\D/g, ''))}
            style={{
              textAlign: 'center',
              letterSpacing: '12px',
              fontSize: '28px',
              fontWeight: 900,
              padding: '12px',
              borderRadius: '12px',
              border: '2px solid #cbd5e1',
              outline: 'none',
              background: '#f8fafc',
              color: '#0f172a'
            }}
          />

          <button
            type="submit"
            style={{
              padding: '12px',
              borderRadius: '12px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Unlock size={16} /> Desbloquear Bitácora
          </button>
        </form>

        <div style={{ marginTop: '16px', fontSize: '11px', color: '#94a3b8' }}>
          PIN inicial por defecto: <strong>0000</strong>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER BITÁCORA */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#ecfdf5', color: '#10b981', padding: '10px', borderRadius: '12px', display: 'flex' }}>
            <Bookmark size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Mi Bitácora & Recordatorios
              <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '999px', border: '1px solid #a7f3d0' }}>
                🔒 Privado
              </span>
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
              Notas personales, pendientes del taller y alarmas con notificación activa.
            </p>
          </div>
        </div>

        {/* Botones de Seguridad */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsSettingNewPin(!isSettingNewPin)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <KeyRound size={14} /> Cambiar PIN
          </button>

          <button
            type="button"
            onClick={() => setIsUnlocked(false)}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: '#fee2e2',
              color: '#dc2626',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Bloquear la bitácora para que nadie más la vea"
          >
            <Lock size={14} /> Bloquear
          </button>
        </div>
      </div>

      {/* FORMULARIO DE CAMBIO DE PIN SI SE ABRIÓ */}
      {isSettingNewPin && (
        <form onSubmit={handleChangePin} style={{
          background: '#fffbeb',
          border: '1.5px solid #fde68a',
          borderRadius: '14px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#92400e' }}>
            Ingresa tu nuevo PIN de 4 dígitos:
          </span>
          <input 
            type="password"
            maxLength={4}
            placeholder="Ej: 1234"
            value={newPinInput}
            onChange={e => setNewPinInput(e.target.value.replace(/\D/g, ''))}
            style={{
              width: '90px',
              height: '36px',
              padding: '0 10px',
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '16px',
              letterSpacing: '4px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Guardar Nuevo PIN
          </button>
          <button
            type="button"
            onClick={() => setIsSettingNewPin(false)}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '12px', cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </form>
      )}

      {/* FORMULARIO DE NUEVO APUNTE / NOTA / TAREA */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '16px',
        padding: '18px 20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Sparkles size={14} color="#10b981" /> Nuevo Apunte o Recordatorio
        </span>

        <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <textarea 
            rows={2}
            placeholder="Escribe lo que ocurrió, tarea pendiente, o qué debes recordar..."
            value={text}
            onChange={e => setText(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Tipo de Apunte */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'task', label: '✅ Tarea To-Do' },
                { id: 'reminder', label: '⏰ Alarma' },
                { id: 'note', label: '📝 Nota' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNoteType(t.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: noteType === t.id ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                    background: noteType === t.id ? '#ecfdf5' : '#f8fafc',
                    color: noteType === t.id ? '#065f46' : '#64748b',
                    fontWeight: 800,
                    fontSize: '11.5px',
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Prioridad / Etiqueta */}
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Etiqueta:</span>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  background: '#ffffff'
                }}
              >
                {PRIORITIES.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Fecha y Hora si es Alarma / Recordatorio */}
            {noteType === 'reminder' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 800 }}>⏰ Hora:</span>
                <input 
                  type="datetime-local"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '11.5px',
                    fontWeight: 700
                  }}
                />
              </div>
            )}

            {/* Botón Guardar */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginLeft: 'auto',
                padding: '8px 18px',
                borderRadius: '10px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: 900,
                fontSize: '12.5px',
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Plus size={15} /> Guardar Apunte
            </button>

          </div>
        </form>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'pending', label: '📌 Pendientes', count: pendingCount },
            { id: 'reminders', label: '⏰ Alarmas', count: remindersCount },
            { id: 'completed', label: '✅ Completadas', count: notesList.length - pendingCount },
            { id: 'all', label: 'Todas', count: notesList.length }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterTab(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: filterTab === f.id ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                background: filterTab === f.id ? '#ffffff' : '#f8fafc',
                color: filterTab === f.id ? '#0f172a' : '#64748b',
                fontWeight: filterTab === f.id ? 900 : 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{f.label}</span>
              <span style={{
                background: filterTab === f.id ? '#10b981' : '#e2e8f0',
                color: filterTab === f.id ? '#ffffff' : '#64748b',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '10px'
              }}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px 10px' }}>
          <Search size={14} color="#94a3b8" />
          <input 
            type="text"
            placeholder="Buscar en mis notas..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: '12px', width: '150px' }}
          />
        </div>
      </div>

      {/* LISTA DE NOTAS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {displayedNotes.length === 0 ? (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '36px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <Bookmark size={36} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
            <h4 style={{ margin: 0, color: '#0f172a', fontWeight: 800 }}>No hay notas en esta sección</h4>
            <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Usa el formulario superior para apuntar tareas, acuerdos o recordatorios.</p>
          </div>
        ) : (
          displayedNotes.map(note => {
            const prio = PRIORITIES.find(p => p.id === note.priority) || PRIORITIES[0];
            const isDueSoon = note.dueDate && new Date(note.dueDate) <= new Date();

            return (
              <div 
                key={note.id}
                style={{
                  background: note.isCompleted ? '#f8fafc' : '#ffffff',
                  border: isDueSoon && !note.isCompleted ? '1.5px solid #fca5a5' : '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  opacity: note.isCompleted ? 0.65 : 1,
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Botón Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleComplete(note)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    color: note.isCompleted ? '#10b981' : '#94a3b8',
                    marginTop: '2px'
                  }}
                  title={note.isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                >
                  {note.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>

                {/* Contenido de la Nota */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      background: prio.bg,
                      color: prio.color,
                      border: `1px solid ${prio.border}`
                    }}>
                      {prio.label}
                    </span>

                    {note.dueDate && (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        background: isDueSoon && !note.isCompleted ? '#fef2f2' : '#f1f5f9',
                        color: isDueSoon && !note.isCompleted ? '#ef4444' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Clock size={11} /> {new Date(note.dueDate).toLocaleString('es-VE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}

                    <span style={{ fontSize: '10.5px', color: '#94a3b8', marginLeft: 'auto' }}>
                      {new Date(note.createdAt || 0).toLocaleDateString('es-VE')}
                    </span>
                  </div>

                  <div style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: note.isCompleted ? '#64748b' : '#0f172a',
                    textDecoration: note.isCompleted ? 'line-through' : 'none',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.4'
                  }}>
                    {note.text}
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {note.dueDate && !note.isCompleted && (
                    <button
                      type="button"
                      onClick={() => handlePostpone(note)}
                      style={{ background: 'none', border: 'none', color: '#d97706', cursor: 'pointer', padding: '4px', fontSize: '11px', fontWeight: 800 }}
                      title="Posponer 15 minutos"
                    >
                      +15m
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNote(note);
                      setEditText(note.text);
                    }}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                    title="Editar nota"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteNote(note.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    title="Eliminar apunte"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL DE EDICIÓN */}
      {editingNote && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }} onClick={() => setEditingNote(null)}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '20px',
            width: '90%',
            maxWidth: '450px'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.05rem', fontWeight: 800 }}>Editar Apunte</h3>
            <textarea 
              rows={3}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingNote(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
              <button onClick={handleSaveEdit} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#ffffff', cursor: 'pointer', fontWeight: 800 }}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
