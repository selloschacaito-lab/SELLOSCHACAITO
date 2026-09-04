import React, { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { STAMP_ICONS_DATA } from '../data/stampIcons';
import { 
  Search, Copy, Download, Sparkles, Check, 
  PanelLeft, FileCode, Zap, Layers, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const QUICK_SEARCH_CHIPS = [
  { label: '🩺 Odontología', query: 'Odontología' },
  { label: '👶 Pediatría', query: 'Pediatría' },
  { label: '⚖️ Abogacía', query: 'Abogacía penal' },
  { label: '📐 Ingeniería Civil', query: 'Ingeniería Civil' },
  { label: '🎓 Docencia', query: 'Maestra educadora' },
  { label: '🐾 Veterinaria', query: 'Medicina Veterinaria' }
];

export default function IconGenerator({ isEmbedded = false }) {
  const outletCtx = useOutletContext() || {};
  const toggleSidebar = isEmbedded ? null : outletCtx.toggleSidebar;
  
  // Icons List (Static + Saved in LocalStorage)
  const [iconsList, setIconsList] = useState(() => {
    try {
      const saved = localStorage.getItem('sc_saved_ai_icons');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...parsed, ...STAMP_ICONS_DATA];
      }
    } catch (e) {
      console.warn('Error reading saved icons:', e);
    }
    return STAMP_ICONS_DATA;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedIcon, setSelectedIcon] = useState(STAMP_ICONS_DATA[0]);

  // Visualizer Customizer State
  const [stampSizeMm, setStampSizeMm] = useState(32);
  const [isInverted, setIsInverted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Save AI Icons to localStorage
  useEffect(() => {
    try {
      const aiOnly = iconsList.filter(i => i.isAiGenerated);
      localStorage.setItem('sc_saved_ai_icons', JSON.stringify(aiOnly));
    } catch (e) {
      console.warn('Error persisting icons:', e);
    }
  }, [iconsList]);

  // Categories List
  const categories = useMemo(() => {
    const set = new Set(iconsList.map(i => i.category));
    return Array.from(set);
  }, [iconsList]);

  // Filtered List
  const filteredIcons = useMemo(() => {
    return iconsList.filter(item => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        (item.keywords || []).some(k => k.toLowerCase().includes(q));
      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [iconsList, searchTerm, selectedCategory]);

  // Build clean SVG string for export (Only for static SVG library)
  const buildSvgString = (icon, inverted) => {
    const strokeColor = inverted ? '#ffffff' : '#000000';
    const bgColor = inverted ? '#000000' : 'none';
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="600" height="600" fill="${bgColor}" stroke="${strokeColor}" color="${strokeColor}">\n  ${icon.svgContent}\n</svg>`.trim();
  };

  // 1-Click Copy SVG to Clipboard (For SVG only)
  const handleCopySvg = async () => {
    if (!selectedIcon || selectedIcon.imageUrl) {
      toast.error('La copia de código SVG solo aplica a los iconos vectoriales estándar.');
      return;
    }
    const svgCode = buildSvgString(selectedIcon, isInverted);
    try {
      await navigator.clipboard.writeText(svgCode);
      setIsCopied(true);
      toast.success('¡SVG copiado! Listo para pegar en Illustrator', { duration: 3500 });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error(err);
      toast.error('Error al copiar SVG');
    }
  };

  // Download Image for Calco
  const handleDownloadPng600Dpi = (bgWhite = true) => {
    if (!selectedIcon) return;

    if (selectedIcon.imageUrl) {
      // Direct Download for AI Generated Image (already 1024x1024 high res)
      const a = document.createElement('a');
      const cleanName = (selectedIcon.name || 'icono').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      a.download = `sello_${cleanName}_cuadricula.jpg`;
      a.href = selectedIcon.imageUrl;
      a.click();
      toast.success('¡Hoja de Iconos descargada! Arrastra a Illustrator y aplica Calco de Imagen.', { duration: 4500 });
      return;
    }

    // Canvas Download for SVG
    const canvas = document.createElement('canvas');
    const size = 2400; // 600 DPI
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const svgString = buildSvgString(selectedIcon, isInverted);
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      if (bgWhite) {
        ctx.fillStyle = isInverted ? '#000000' : '#ffffff';
        ctx.fillRect(0, 0, size, size);
      }
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      const a = document.createElement('a');
      const cleanName = (selectedIcon.name || 'icono').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      a.download = `sello_${cleanName}_600DPI_calco.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast.success('¡PNG 600 DPI descargado! Listo para Calco', { duration: 4000 });
    };
    img.src = url;
  };

  // Download .SVG File (Only for static library)
  const handleDownloadSvgFile = () => {
    if (!selectedIcon || selectedIcon.imageUrl) {
      toast.error('Descarga de archivo SVG no disponible para hojas generadas por IA.');
      return;
    }
    const svgCode = buildSvgString(selectedIcon, isInverted);
    const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `sello_${selectedIcon.id || 'icono'}.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo .SVG descargado');
  };

  // MASTER DIFFUSION PROMPT: FLUX MODEL FOR GRID SHEET
  const executeGenerate = async (queryText) => {
    const targetQuery = (queryText || aiPrompt).trim();
    if (!targetQuery) {
      toast.error('Escribe para qué especialidad deseas generar la hoja de iconos');
      return;
    }

    setIsGeneratingAi(true);
    const toastId = toast.loading(`🎨 Generando hoja de 12 iconos profesionales para "${targetQuery}"... (Puede tardar de 5 a 15 segundos)`);

    try {
      // English prompt optimized for Flux / DALL-E style grid sheets
      const promptText = `Grid sheet of 12 minimalist rubber stamp icons for ${targetQuery}, solid black silhouettes on pure white background, flat 2d vector icon set, high contrast, clean shapes, professional, no gradients, no gray, no text`;
      
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;

      // Fetch the image to get base64 so it can be stored in localStorage cleanly without re-fetching
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Error al conectar con el motor de difusión de imágenes.');
      
      const blob = await response.blob();
      const base64Url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      const newIcon = {
        id: `ai_${Date.now()}`,
        name: `Hoja de 12 Iconos: ${targetQuery.toUpperCase()}`,
        category: 'Hojas de Iconos IA',
        keywords: [targetQuery.toLowerCase(), 'ia', 'hoja', 'profesional', 'grid'],
        imageUrl: base64Url, // Storing image instead of SVG
        isAiGenerated: true
      };

      setIconsList(prev => [newIcon, ...prev]);
      setSelectedCategory('Hojas de Iconos IA');
      setSelectedIcon(newIcon);
      toast.dismiss(toastId);
      toast.success('¡Impresionante! Hoja de 12 iconos generada con éxito.', { duration: 4000 });
      setAiPrompt('');
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Error al generar la hoja de iconos: ' + (err.message || 'Intenta de nuevo'));
    } finally {
      setIsGeneratingAi(false);
    }
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {toggleSidebar && (
            <button 
              onClick={toggleSidebar} 
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex' }}
              title="Abrir menú"
            >
              <PanelLeft size={20} />
            </button>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Estudio de Generación de Sellos (Difusión)
              </h1>
              <span style={{ fontSize: '12px', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                Calidad DALL-E / Flux
              </span>
            </div>
            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '13px', fontWeight: 500 }}>
              Genera hojas cuadriculadas con 12 diseños profesionales en un solo clic, listos para "Calco de Imagen"
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Gallery) & Right (Visualizer & Settings) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* ===================== COLUMNA IZQUIERDA: CATÁLOGO Y BÚSQUEDA ===================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* AI Generator Input Box */}
          <form 
            onSubmit={(e) => { e.preventDefault(); executeGenerate(); }}
            style={{
              background: '#ffffff',
              border: '1.5px solid #a7f3d0',
              borderRadius: '16px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={18} color="#10b981" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#065f46' }}>
                  Generador de Hojas de Iconos (Difusión)
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px' }}>
                12 Iconos por Hoja
              </span>
            </div>

            {/* Input & Action */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text"
                placeholder="Ej. Odontología, Ingeniero Civil, Abogado..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                disabled={isGeneratingAi}
                style={{
                  flex: 1,
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0f172a',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={isGeneratingAi || !aiPrompt.trim()}
                style={{
                  padding: '0 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isGeneratingAi || !aiPrompt.trim() ? '#94a3b8' : '#10b981',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isGeneratingAi || !aiPrompt.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)'
                }}
              >
                <Zap size={15} /> {isGeneratingAi ? 'Creando Hoja...' : 'Generar Hoja (12)'}
              </button>
            </div>

            {/* Quick Search Chips */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                Hojas Frecuentes:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {QUICK_SEARCH_CHIPS.map(chip => (
                  <button
                    key={chip.label}
                    type="button"
                    disabled={isGeneratingAi}
                    onClick={() => executeGenerate(chip.query)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#334155',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Search bar */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <Search size={18} color="#64748b" style={{ flexShrink: 0 }} />
            <input 
              type="search" 
              placeholder={`Buscar en la biblioteca...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '14px',
                fontWeight: 600,
                color: '#0f172a',
                background: 'transparent'
              }}
            />
          </div>

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'none'
          }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                border: selectedCategory === 'ALL' ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                background: selectedCategory === 'ALL' ? '#ecfdf5' : '#ffffff',
                color: selectedCategory === 'ALL' ? '#065f46' : '#64748b',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Layers size={12} /> Todas ({iconsList.length})
            </button>

            {categories.map(cat => {
              const isSelected = selectedCategory === cat;
              const count = iconsList.filter(i => i.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: isSelected ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                    background: isSelected ? '#ecfdf5' : '#ffffff',
                    color: isSelected ? '#065f46' : '#64748b',
                    fontSize: '12px',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {cat === 'Hojas de Iconos IA' && <ImageIcon size={12} color="#10b981" />}
                  {cat} <span style={{ opacity: 0.7, fontSize: '11px' }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Icon Grid */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: '12px',
            maxHeight: '520px',
            overflowY: 'auto',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}>
            {filteredIcons.map(icon => {
              const isSelected = selectedIcon?.id === icon.id;
              return (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  style={{
                    background: isSelected ? '#ecfdf5' : '#f8fafc',
                    border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '12px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                  }}
                >
                  {icon.imageUrl ? (
                    <img 
                      src={icon.imageUrl} 
                      alt={icon.name}
                      style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '4px', filter: isInverted ? 'invert(1)' : 'none' }}
                    />
                  ) : (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 100 100" 
                      width="44" 
                      height="44" 
                      fill="none" 
                      stroke="currentColor" 
                      color={isSelected ? '#10b981' : '#0f172a'}
                      dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                    />
                  )}
                  
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: isSelected ? '#065f46' : '#475569',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {icon.name}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* ===================== COLUMNA DERECHA: VISUALIZADOR Y EXPORTACIÓN ===================== */}
        {selectedIcon && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            position: 'sticky',
            top: '20px'
          }}>
            
            {/* Header of Visualizer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.04em' }}>
                  {selectedIcon.category}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0' }}>
                  {selectedIcon.name}
                </h2>
              </div>
              {selectedIcon.isAiGenerated && (
                <span style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '999px' }}>
                  ⭐ Difusión IA
                </span>
              )}
            </div>

            {/* Live Stamp Visualizer Box */}
            <div style={{
              background: isInverted ? '#0f172a' : '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '16px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '230px',
              transition: 'all 0.2s ease',
              overflow: 'hidden'
            }}>
              {selectedIcon.imageUrl ? (
                <img 
                  src={selectedIcon.imageUrl} 
                  alt="Vista Previa de la Hoja"
                  style={{ width: '100%', height: 'auto', maxWidth: '300px', objectFit: 'contain', borderRadius: '8px', filter: isInverted ? 'invert(1)' : 'none' }}
                />
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 100 100" 
                  width={stampSizeMm * 4.8} 
                  height={stampSizeMm * 4.8} 
                  fill={isInverted ? '#0f172a' : 'none'} 
                  stroke={isInverted ? '#ffffff' : '#000000'} 
                  color={isInverted ? '#ffffff' : '#000000'}
                  dangerouslySetInnerHTML={{ __html: selectedIcon.svgContent }}
                />
              )}

              <span style={{ fontSize: '11px', fontWeight: 700, color: isInverted ? '#94a3b8' : '#64748b', marginTop: '14px' }}>
                {selectedIcon.imageUrl ? 'Vista Previa (Alta Resolución 1024x1024)' : `Simulación en Sello: ~${stampSizeMm}mm`}
              </span>
            </div>

            {/* Size Scale & Color Invert Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Escala / Tamaño (Sólo visible si NO es imagen) */}
              {!selectedIcon.imageUrl && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                    <span>Escala del Sello</span>
                    <span style={{ color: '#10b981' }}>{stampSizeMm} mm</span>
                  </div>
                  <input 
                    type="range"
                    min="15"
                    max="50"
                    step="1"
                    value={stampSizeMm}
                    onChange={e => setStampSizeMm(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer' }}
                  />
                </div>
              )}

              {/* Toggle Invert Colors */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Invertir Colores (Fondo negro)</span>
                <button
                  type="button"
                  onClick={() => setIsInverted(!isInverted)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: isInverted ? '#0f172a' : '#ffffff',
                    color: isInverted ? '#ffffff' : '#0f172a',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {isInverted ? 'Negativo' : 'Positivo'}
                </button>
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              
              {/* PRIMARY: Download Image for Calco de Imagen */}
              <button
                type="button"
                onClick={() => handleDownloadPng600Dpi(true)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Download size={18} /> {selectedIcon.imageUrl ? 'Descargar Hoja para Calco en Illustrator' : 'Descargar PNG 600 DPI (Para Calco)'}
              </button>

              {/* Secondary Actions Row */}
              {!selectedIcon.imageUrl && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* 1-Click Copy SVG */}
                  <button
                    type="button"
                    onClick={handleCopySvg}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    {isCopied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                    {isCopied ? '¡Copiado!' : 'Copiar SVG'}
                  </button>

                  {/* Download .SVG File */}
                  <button
                    type="button"
                    onClick={handleDownloadSvgFile}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <FileCode size={16} /> Archivo .SVG
                  </button>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
