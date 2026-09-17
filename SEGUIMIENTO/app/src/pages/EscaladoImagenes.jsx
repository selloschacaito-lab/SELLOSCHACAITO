import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImagePlus, UploadCloud, Download, AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { resizeImageData, loadImageFile, imageDataToBlob } from '../utils/imageScaling';
import '../styles/whitestamp.css';
import './EscaladoImagenes.css';

const VALID_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const SCALES = [2, 4, 8];
const CLASSIC_METHODS = [
  { id: 'nearest', label: 'Nearest Neighbor' },
  { id: 'bicubic', label: 'Bicubic' },
  { id: 'lanczos', label: 'Lanczos' },
];

export default function EscaladoImagenes() {
  const [source, setSource] = useState(null); // { file, img, imageData, width, height }
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('nearest');
  const [selectedScale, setSelectedScale] = useState(4);
  const [result, setResult] = useState(null); // { method, label, scale, width, height, url, error }
  const [loadError, setLoadError] = useState('');
  const fileInputRef = useRef(null);

  const resultRef = useRef(result);
  resultRef.current = result;

  // Limpia la URL de blob generada al desmontar o al cargar una imagen nueva
  const revokeResultUrls = useCallback(() => {
    if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url);
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
    setResult(null);
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
    setResult(null);
    // Deja respirar al render antes del cálculo pesado
    await new Promise(r => setTimeout(r, 0));

    const methodInfo = CLASSIC_METHODS.find(m => m.id === selectedMethod);
    try {
      const resized = resizeImageData(source.imageData, selectedScale, selectedMethod);
      const blob = await imageDataToBlob(resized);
      const url = URL.createObjectURL(blob);
      setResult({
        method: selectedMethod,
        label: methodInfo.label,
        scale: selectedScale,
        width: resized.width,
        height: resized.height,
        url,
      });
    } catch (err) {
      console.error(err);
      setResult({ method: selectedMethod, label: methodInfo.label, scale: selectedScale, error: 'Error al generar esta variante.' });
    }
    setIsProcessing(false);
  };

  const handleReset = () => {
    revokeResultUrls();
    setSource(null);
    setResult(null);
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
                <button type="button" className="wsm-breakdown-toggle" onClick={handleReset} disabled={isProcessing}>
                  <Trash2 size={14} /> Quitar imagen
                </button>
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

        {source && (
          <div className="wsm-card">
            <h3 className="wsm-card-title">
              <span>Elige método y escala</span>
            </h3>

            <div className="ei-choice-group">
              <span className="wsm-label">Método</span>
              <div className="ei-choice-row">
                {CLASSIC_METHODS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className={`ei-choice-btn ${selectedMethod === m.id ? 'active' : ''}`}
                    onClick={() => setSelectedMethod(m.id)}
                    disabled={isProcessing}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ei-choice-group">
              <span className="wsm-label">Escala</span>
              <div className="ei-choice-row">
                {SCALES.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`ei-choice-btn ${selectedScale === s ? 'active' : ''}`}
                    onClick={() => setSelectedScale(s)}
                    disabled={isProcessing}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="ei-generate-btn" onClick={handleGenerate} disabled={isProcessing}>
              {isProcessing ? <Loader2 size={16} className="ei-spin" /> : null}
              {isProcessing ? 'Generando...' : `Generar ${CLASSIC_METHODS.find(m => m.id === selectedMethod)?.label} x${selectedScale}`}
            </button>
          </div>
        )}

        {result && (
          <div className="wsm-card">
            <h3 className="wsm-card-title">
              <span>Resultado</span>
            </h3>
            <div className="ei-results-grid">
              <div className="ei-result-card">
                {result.error ? (
                  <div className="ei-result-error">
                    <AlertTriangle size={18} />
                    <span>{result.error}</span>
                  </div>
                ) : (
                  <img src={result.url} alt={`${result.label} x${result.scale}`} />
                )}
                <div className="ei-result-meta">
                  <strong>{result.label} — x{result.scale}</strong>
                  {!result.error && <span>{result.width} × {result.height} px</span>}
                </div>
                {!result.error && (
                  <a
                    className="ei-download-btn"
                    href={result.url}
                    download={`${source.file.name.replace(/\.[^.]+$/, '')}_${result.method}_x${result.scale}.png`}
                  >
                    <Download size={14} /> Descargar
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
