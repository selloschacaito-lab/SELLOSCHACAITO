import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Copy, CheckCircle2 } from 'lucide-react';
import { compressImageToBase64 } from '../utils/imageUtils';
import { toast } from 'react-hot-toast';
import { generateWithGemini } from '../utils/aiHelper';

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

      const result = await generateWithGemini({
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
    <div className="animate-fade-in" style={{ padding: '24px 20px 80px', maxWidth: '1200px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
      
      {/* Header Whitestamp */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '22px 28px',
        marginBottom: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Extraer Texto de Imagen (OCR IA)
        </h1>
        <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontWeight: 500 }}>
          Sube o pega (Ctrl+V) una imagen o comprobante para leer y extraer todo su contenido automáticamente.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Lado Izquierdo: Imagen */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }} ref={containerRef}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#10b981" /> Subir Imagen
          </h3>
          
          {!imagePreview ? (
            <div 
              style={{ 
                border: '2px dashed #cbd5e1', 
                borderRadius: '12px', 
                flex: 1,
                minHeight: '360px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: '20px',
                textAlign: 'center'
              }}
              onClick={() => document.getElementById('ocr-file-upload').click()}
            >
              <Upload size={44} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px', margin: 0 }}>
                Haz clic aquí o presiona Ctrl+V para pegar
              </p>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Soporta JPG, PNG, WEBP</p>
              <input 
                type="file" 
                id="ocr-file-upload"
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', backgroundColor: '#f8fafc', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '320px' }}>
                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }} />
              </div>
              <button 
                onClick={() => { setImagePreview(null); setExtractedText(''); }} 
                style={{
                  alignSelf: 'center',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#64748b',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Subir otra imagen
              </button>
            </div>
          )}
        </div>

        {/* Lado Derecho: Texto */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FileText size={18} color="#10b981" /> Texto Extraído
            </h3>
            {isProcessing && <span style={{ color: '#10b981', fontWeight: 800, fontSize: '13px' }}>Procesando con IA...</span>}
          </div>
          
          <textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value.toUpperCase())}
            style={{ 
              width: '100%', 
              flex: 1, 
              minHeight: '360px', 
              padding: '14px', 
              borderRadius: '12px', 
              border: '1.5px solid #e2e8f0', 
              fontSize: '14px',
              backgroundColor: '#f8fafc',
              color: '#0f172a',
              resize: 'none',
              fontFamily: 'monospace',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            placeholder={isProcessing ? "Leyendo..." : "El texto extraído aparecerá aquí."}
            disabled={isProcessing}
          />

          <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleCopy} 
              disabled={!extractedText || isProcessing}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                background: !extractedText || isProcessing ? '#cbd5e1' : '#10b981',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: !extractedText || isProcessing ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: !extractedText || isProcessing ? 'none' : '0 2px 6px rgba(16, 185, 129, 0.25)'
              }}
            >
              {isCopied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              {isCopied ? '¡Copiado!' : 'Copiar Texto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
