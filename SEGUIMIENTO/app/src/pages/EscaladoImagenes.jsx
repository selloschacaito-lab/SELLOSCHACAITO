import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImagePlus, UploadCloud, Download, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { resizeImageData, loadImageFile, imageDataToBlob } from '../utils/imageScaling';
import '../styles/whitestamp.css';
import './EscaladoImagenes.css';

const VALID_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const SCALES = [4, 8];
const CLASSIC_METHODS = [
  { id: 'nearest', label: 'Nearest Neighbor' },
  { id: 'bicubic', label: 'Bicubic' },
  { id: 'lanczos', label: 'Lanczos' },
];

export default function EscaladoImagenes() {
  const [source, setSource] = useState(null); // { file, img, imageData, width, height }
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [results, setResults] = useState([]); // { method, label, scale, width, height, url, error, composed }
  const [loadError, setLoadError] = useState('');
  const fileInputRef = useRef(null);

  const resultsRef = useRef(results);
  resultsRef.current = results;

  // Limpia las URLs de blob generadas al desmontar o al cargar una imagen nueva
  const revokeResultUrls = useCallback(() => {
    resultsRef.current.forEach(r => { if (r.url) URL.revokeObjectURL(r.url); });
  }, []);

  useEffect(() => () => revokeResultUrls(), [revokeResultUrls]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (!VALID_TYPES.includes(file.type)) {
      setLoadError('Formato no soportado. Usa PNG, JPG/JPEG o WebP.');
      return;
    }
    setLoadError('');
    revokeResultUrls();
    setResults([]);
    try {
      const loaded = await loadImageFile(file);
      setSource({ file, ...loaded });
    } catch (err) {
      console.error(err);
      setLoadError('No se pudo leer la imagen. Intenta con otro archivo.');
    }
  }, [revokeResultUrls]);

  // Pegar (Ctrl+V) en cualquier parte de la página
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleFile(file);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleFile]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  const handleGenerate = async () => {
    if (!source) return;
    setIsProcessing(true);
    revokeResultUrls();
    const newResults = [];

    // --- Nearest / Bicubic / Lanczos: siempre desde el ImageData original ---
    for (const method of CLASSIC_METHODS) {
      for (const scale of SCALES) {
        setProgressLabel(`Generando ${method.label} x${scale}...`);
        // Deja respirar al render antes de cada cálculo pesado
        await new Promise(r => setTimeout(r, 0));
        try {
          const resized = resizeImageData(source.imageData, scale, method.id);
          const blob = await imageDataToBlob(resized);
          const url = URL.createObjectURL(blob);
          newResults.push({
            method: method.id,
            label: method.label,
            scale,
            width: resized.width,
            height: resized.height,
            url,
          });
        } catch (err) {
          console.error(err);
          newResults.push({ method: method.id, label: method.label, scale, error: 'Error al generar esta variante.' });
        }
        setResults([...newResults]);
      }
    }

    // Nota: el método de IA (ESRGAN vía TensorFlow.js) se probó y por ahora
    // produce resultados corruptos (parches en gris/negro) incluso con el
    // tamaño de imagen exacto que espera el modelo — es un problema de la
    // librería en el navegador, no de esta página. Se deja pendiente hasta
    // encontrar un modelo confiable; mientras tanto se puede seguir usando
    // el script de Python (herramientas-upscale/) para esa comparación.

    setProgressLabel('');
    setIsProcessing(false);
  };

  const handleReset = () => {
    revokeResultUrls();
    setSource(null);
    setResults([]);
    setLoadError('');
  };

  return (
    <div className="wsm-wrapper animate-fade-in">
      <div className="ei-container">

        <header className="wsm-header">
          <div className="wsm-title-box">
            <div className="wsm-icon-badge">
              <ImagePlus size={24} />
            </div>
            <div>
              <h1>Ampliar Imágenes</h1>
              <p>Compara Nearest, Bicubic y Lanczos antes de usar Calco de Imagen en Illustrator</p>
            </div>
          </div>
        </header>

        <div className="wsm-card">
          <h3 className="wsm-card-title">
            <span><UploadCloud size={18} color="var(--ws-accent-primary)" /> Imagen original</span>
          </h3>

          {!source ? (
            <div
              className={`ei-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              tabIndex={0}
            >
              <UploadCloud size={32} />
              <p>Arrastra la imagen aquí, pégala (Ctrl+V) o haz clic para seleccionar un archivo</p>
              <span className="ei-dropzone-hint">PNG, JPG/JPEG o WebP</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="ei-source-preview">
              <img src={source.img.src} alt="Original" />
              <div className="ei-source-info">
                <strong>{source.file.name}</strong>
                <span>{source.width} × {source.height} px</span>
                <div className="ei-source-actions">
                  <button type="button" className="wsm-breakdown-toggle" onClick={handleReset} disabled={isProcessing}>
                    <Trash2 size={14} /> Quitar imagen
                  </button>
                  <button type="button" className="ei-generate-btn" onClick={handleGenerate} disabled={isProcessing}>
                    {isProcessing ? <Loader2 size={16} className="ei-spin" /> : null}
                    {isProcessing ? (progressLabel || 'Generando...') : 'Generar variantes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {loadError && (
            <div className="wsm-error-box">
              <AlertTriangle size={18} />
              <span>{loadError}</span>
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="wsm-card">
            <h3 className="wsm-card-title">
              <span>Resultados</span>
            </h3>
            <div className="ei-results-grid">
              {results.map((r, i) => (
                <div key={`${r.method}-${r.scale}-${i}`} className="ei-result-card">
                  {r.error ? (
                    <div className="ei-result-error">
                      <AlertTriangle size={18} />
                      <span>{r.error}</span>
                    </div>
                  ) : (
                    <img src={r.url} alt={`${r.label} x${r.scale}`} />
                  )}
                  <div className="ei-result-meta">
                    <strong>{r.label} — x{r.scale}</strong>
                    {!r.error && <span>{r.width} × {r.height} px</span>}
                  </div>
                  {!r.error && (
                    <a
                      className="ei-download-btn"
                      href={r.url}
                      download={`${source.file.name.replace(/\.[^.]+$/, '')}_${r.method}_x${r.scale}.png`}
                    >
                      <Download size={14} /> Descargar
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
