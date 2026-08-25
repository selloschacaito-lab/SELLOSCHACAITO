import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Copy, CheckCircle2 } from 'lucide-react';
import { compressImageToBase64 } from '../utils/imageUtils';
import { toast } from 'react-hot-toast';
import { GoogleGenAI } from '@google/genai';

// Initialize the Google Gen AI client with the Vite environment variable
const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});

export default function Texto() {
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          await processImage(file);
          break;
        }
      }
    };
    
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processImage = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    setExtractedText('');
    setIsCopied(false);
    
    try {
      const base64 = await compressImageToBase64(file);
      setImagePreview(base64);
      
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });
      const data = await base64Promise;
      
      const imagePart = {
        inlineData: {
          data,
          mimeType: file.type
        }
      };
      
      const prompt = `Actúa como un asistente inteligente de extracción de datos. Lee esta imagen y extrae TODO el texto útil y relevante.
Reglas:
1. Limpia caracteres basura, símbolos extraños o errores visuales.
2. Organiza y estructura la información de forma lógica y legible (si ves nombres, documentos o direcciones, dales un buen formato).
3. Devuelve todo el texto en MAYÚSCULAS.
4. Si encuentras RIF o Cédulas, quítales los puntos y guiones.
5. No me hables ni des explicaciones, devuelve únicamente el texto final listo para copiar y pegar.`;

      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        toast.error("Falta la API Key de Gemini en el archivo .env");
        setIsProcessing(false);
        return;
      }

      const result = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: data,
                  mimeType: file.type
                }
              }
            ]
          }
        ]
      });
      
      const responseText = result.text;
      setExtractedText(responseText.trim());
      
    } catch (error) {
      console.error("Gemini Error:", error);
      let errMsg = "Error de IA: " + (error.message || "Desconocido");
      if (error?.status === 429) errMsg = "Límite de uso alcanzado. Google Gemini está muy ocupado, espera unos segundos e intenta de nuevo.";
      if (error?.status === 503) errMsg = "El servidor de IA está sobrecargado. Intenta de nuevo.";
      toast.error(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processImage(e.target.files[0]);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    toast.success("Texto copiado al portapapeles");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Extraer Texto de Imagen</h2>
        <p style={{ color: 'var(--text-muted)' }}>Sube o pega (Ctrl+V) una imagen para leer su contenido automáticamente.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Lado Izquierdo: Imagen */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }} ref={containerRef}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={18} /> Subir Imagen
          </h3>
          
          {!imagePreview ? (
            <div 
              style={{ 
                border: '2px dashed var(--border-strong)', 
                borderRadius: '0.75rem', 
                flex: 1,
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => document.getElementById('ocr-file-upload').click()}
            >
              <Upload size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>
                Haz clic aquí o presiona Ctrl+V para pegar
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Soporta JPG, PNG, WEBP</p>
              <input 
                type="file" 
                id="ocr-file-upload"
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid var(--border-strong)', borderRadius: '0.75rem', padding: '0.5rem', backgroundColor: '#fff', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '350px' }}>
                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
              </div>
              <button onClick={() => { setImagePreview(null); setExtractedText(''); }} className="btn-secondary" style={{ alignSelf: 'center' }}>
                Subir otra imagen
              </button>
            </div>
          )}
        </div>

        {/* Lado Derecho: Texto */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} /> Texto Extraído
            </h3>
            {isProcessing && <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>Procesando...</span>}
          </div>
          
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value.toUpperCase())}
            style={{ 
              width: '100%', 
              flex: 1, 
              minHeight: '400px', 
              padding: '1rem', 
              borderRadius: '0.75rem', 
              border: '1px solid var(--border-strong)', 
              fontSize: '1rem',
              backgroundColor: 'rgba(255,255,255,0.7)',
              resize: 'none',
              fontFamily: 'monospace'
            }}
            placeholder={isProcessing ? "Leyendo..." : "El texto extraído aparecerá aquí."}
            disabled={isProcessing}
          />

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              className="btn-primary" 
              onClick={handleCopy} 
              disabled={!extractedText || isProcessing}
              style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {isCopied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              {isCopied ? '¡Copiado!' : 'Copiar Texto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
