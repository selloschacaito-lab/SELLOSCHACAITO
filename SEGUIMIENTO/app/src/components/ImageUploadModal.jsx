import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, CheckCircle2 } from 'lucide-react';
import { ref, update } from 'firebase/database';
import { db } from '../firebase/config';
import { compressImageToBase64 } from '../utils/imageUtils';

function ImageUploadModal({ order, missingTypes, onClose, onComplete }) {
  const [previews, setPreviews] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [focusedBox, setFocusedBox] = useState(missingTypes[0]);
  const [imagesRequired, setImagesRequired] = useState(true);
  const modalRef = useRef(null);

  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          await processFile(file, focusedBox);
          break;
        }
      }
    };
    
    if (modalRef.current) modalRef.current.focus();
    
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [focusedBox]); // Re-bind event listener when focusedBox changes

  const processFile = async (file, type) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const base64 = await compressImageToBase64(file);
      setPreviews(prev => ({ ...prev, [type]: base64 }));
      


      // Auto-focus the next empty box if there is one
      const emptyBox = missingTypes.find(t => t !== type && !previews[t]);
      if (emptyBox) {
        setFocusedBox(emptyBox);
      }
    } catch (error) {
      console.error("Error comprimiendo imagen", error);
      alert("Error al procesar la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e, type) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0], type);
    }
  };

  const saveImages = async () => {
    setIsUploading(true);
    
    try {
      const updates = {};
      const orderUpdates = { updatedAt: new Date().toISOString() };

      for (const type of missingTypes) {
        if (!previews[type]) continue;
        
        const dbPath = type === 'reference' ? `orderAssets/reference/${order.id}` : `orderAssets/fina_receipt/${order.id}`;
        const fieldName = type === 'reference' ? 'hasReference' : 'hasFinaReceipt';

        // Add asset data to updates
        updates[`${dbPath}/fullDataUrl`] = previews[type];
        updates[`${dbPath}/contentType`] = 'image/jpeg';
        updates[`${dbPath}/updatedAt`] = new Date().toISOString();

        // Mark order as having the asset
        orderUpdates[fieldName] = true;
      }



      // Execute updates
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
      
      await update(ref(db, `orders/${order.id}`), orderUpdates);

      onComplete();
    } catch (error) {
      console.error("Error guardando imágenes", error);
      alert("Error al guardar las imágenes en la base de datos.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!order) return null;

  const getTitle = (type) => {
    return type === 'reference' ? 'Diseño' : 'Recibo';
  };

  const someFilled = missingTypes.some(type => previews[type]);
  const canProceed = imagesRequired ? (missingTypes.length > 0 ? someFilled : true) : true;

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="modal-content glass-card" 
        onClick={e => e.stopPropagation()}
        tabIndex="-1"
        ref={modalRef}
        style={{ outline: 'none', maxWidth: missingTypes.length > 1 ? '800px' : '500px' }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Subir Archivos Adjuntos</h2>
          <button className="modal-close" onClick={onClose} disabled={isUploading}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Para avanzar este pedido, por favor sube los archivos necesarios. Haz clic en una caja y presiona <kbd style={{background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px'}}>Ctrl + V</kbd> para pegar directamente.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: imagesRequired ? '#f0fdf4' : '#fefce8', border: `1px solid ${imagesRequired ? '#bbf7d0' : '#fef08a'}`, borderRadius: '0.75rem', marginBottom: '0.5rem', transition: 'all 0.2s' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>Imágenes requeridas</span>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.125rem 0 0' }}>
                {imagesRequired ? 'Debes subir al menos una imagen para continuar' : 'Puedes continuar sin imágenes'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setImagesRequired(!imagesRequired)}
              style={{
                position: 'relative',
                width: '48px',
                height: '26px',
                borderRadius: '13px',
                border: 'none',
                cursor: 'pointer',
                background: imagesRequired ? '#22c55e' : '#cbd5e1',
                transition: 'background 0.2s',
                flexShrink: 0
              }}
              title={imagesRequired ? 'Desactivar obligatoriedad' : 'Activar obligatoriedad'}
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: imagesRequired ? '24px' : '3px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s'
              }} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexDirection: missingTypes.length > 1 ? 'row' : 'column', flexWrap: 'wrap' }}>
            {missingTypes.map((type) => {
              const isFocused = focusedBox === type;
              const hasPreview = !!previews[type];
              
              return (
                <div key={type} style={{ flex: '1', minWidth: '300px' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>
                    {getTitle(type)}
                  </h3>
                  
                  {!hasPreview ? (
                    <div 
                      style={{ 
                        border: `2px dashed ${isFocused ? '#4f46e5' : '#cbd5e1'}`, 
                        borderRadius: '0.75rem', 
                        padding: '1.5rem',
                        textAlign: 'center',
                        backgroundColor: isFocused ? 'rgba(79, 70, 229, 0.05)' : '#f8fafc',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => setFocusedBox(type)}
                    >
                      <Upload size={32} color={isFocused ? '#4f46e5' : '#64748b'} style={{ margin: '0 auto 1rem' }} />
                      <p style={{ fontWeight: 600, color: isFocused ? '#4338ca' : '#475569', fontSize: '0.875rem' }}>
                        {isFocused ? 'Activo (Ctrl+V para pegar)' : 'Haz clic para activar'}
                      </p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); document.getElementById(`file-upload-${type}`).click(); }}
                        style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b', background: 'none', textDecoration: 'underline' }}
                      >
                        o seleccionar archivo
                      </button>
                      <input 
                        type="file" 
                        id={`file-upload-${type}`}
                        style={{ display: 'none' }} 
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, type)}
                      />
                    </div>
                  ) : (
                    <div 
                      style={{ textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '0.5rem', height: '200px', display: 'flex', flexDirection: 'column', background: '#fff' }}
                      onClick={() => setFocusedBox(type)}
                    >
                      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={previews[type]} 
                          alt="Vista previa" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPreviews(prev => ({ ...prev, [type]: null })); setFocusedBox(type); }}
                        style={{ display: 'block', margin: '0.5rem auto 0', color: '#dc2626', background: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                      >
                        Eliminar y cambiar
                      </button>
                    </div>
                  )}


                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
          <button 
            className="btn-primary" 
            style={{ width: 'auto', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: canProceed ? 1 : 0.5 }} 
            onClick={saveImages}
            disabled={!canProceed || isUploading}
          >
            <CheckCircle2 size={18} />
            {isUploading ? 'Guardando...' : (canProceed ? 'Guardar y Continuar' : 'Faltan imágenes')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageUploadModal;
