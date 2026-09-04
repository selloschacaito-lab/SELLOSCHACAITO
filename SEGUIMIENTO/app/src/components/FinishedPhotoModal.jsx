import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, CheckCircle2, SkipForward } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase/config';
import { compressImageToBase64 } from '../utils/imageUtils';

function FinishedPhotoModal({ order, onClose, onComplete }) {
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const modalRef = useRef(null);
  const saveBtnRef = useRef(null);

  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          await processFile(file);
          break;
        }
      }
    };
    
    if (modalRef.current) modalRef.current.focus();
    
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Acceso directo con tecla ENTER al botón de Guardar y Avanzar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (preview && !isUploading) {
          saveImage();
        } else if (!preview && !isUploading) {
          onComplete({ skipped: true });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preview, isUploading]);

  // Auto-focus en el botón cuando esté listo
  useEffect(() => {
    if (preview && saveBtnRef.current) {
      saveBtnRef.current.focus();
    }
  }, [preview]);

  const processFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const base64 = await compressImageToBase64(file);
      setPreview(base64);
    } catch (error) {
      console.error("Error comprimiendo imagen", error);
      alert("Error al procesar la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const saveImage = async () => {
    if (!preview) return;
    setIsUploading(true);
    
    try {
      const updates = {};
      const dbPath = `orderAssets/finished_photo/${order.id}`;

      updates[`${dbPath}/fullDataUrl`] = preview;
      updates[`${dbPath}/contentType`] = 'image/jpeg';
      updates[`${dbPath}/updatedAt`] = new Date().toISOString();

      await update(ref(db), updates);
      
      await update(ref(db, `orders/${order.id}`), {
        hasFinishedPhoto: true,
        updatedAt: new Date().toISOString()
      });

      onComplete({ skipped: false });
    } catch (error) {
      console.error("Error guardando imagen", error);
      alert("Error al guardar la imagen en la base de datos.");
      setIsUploading(false);
    }
  };

  if (!order) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="modal-content glass-card" 
        onClick={e => e.stopPropagation()}
        tabIndex="-1"
        ref={modalRef}
        style={{ outline: 'none', maxWidth: '500px' }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Foto del Sello Terminado</h2>
          <button className="modal-close" onClick={onClose} disabled={isUploading}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            Puedes adjuntar una foto del producto terminado antes de empacarlo. Esto es opcional.
          </p>

          {!preview ? (
            <div 
              style={{ 
                border: `2px dashed #cbd5e1`, 
                borderRadius: '0.75rem', 
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s',
                height: '250px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => document.getElementById(`file-upload-finished`).click()}
            >
              <Upload size={32} color={'#64748b'} style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                Haz clic o Ctrl+V para pegar
              </p>
              <input 
                type="file" 
                id={`file-upload-finished`}
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div 
              style={{ textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.5rem', height: '250px', display: 'flex', flexDirection: 'column', background: '#fff' }}
            >
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={preview} 
                  alt="Vista previa" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                />
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setPreview(null); }}
                style={{ display: 'block', margin: '0.5rem auto 0', color: '#dc2626', background: 'none', fontWeight: 600, fontSize: '0.75rem' }}
              >
                Eliminar y cambiar
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button 
            className="btn-secondary" 
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
            onClick={() => onComplete({ skipped: true })}
            disabled={isUploading}
          >
            <SkipForward size={18} />
            Omitir
          </button>
          
          <button 
            ref={saveBtnRef}
            className="btn-primary" 
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: preview ? 1 : 0.5 }} 
            onClick={saveImage}
            disabled={!preview || isUploading}
          >
            <CheckCircle2 size={18} />
            {isUploading ? 'Guardando...' : 'Guardar y Avanzar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FinishedPhotoModal;
