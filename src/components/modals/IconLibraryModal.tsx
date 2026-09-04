import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  Folder,
  Search,
  Check,
  Sparkles,
  Copy,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  ICON_CATEGORIES,
  BUILTIN_ICONS,
  type StampIconItem,
} from '../../utils/stampIcons';

interface IconLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconKey: string, customSvgData?: string, label?: string) => void;
}

// Limpiar y preparar SVG para que tome el color del sello (currentColor)
export function sanitizeAndNormalizeSvg(rawSvg: string): { svgContent: string; viewBox: string } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvg, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');

    if (!svgEl) {
      return { svgContent: rawSvg, viewBox: '0 0 48 48' };
    }

    const viewBox = svgEl.getAttribute('viewBox') || '0 0 48 48';

    // Eliminar estilos fijos de color negro/oscuro para que tomen currentColor
    svgEl.querySelectorAll('*').forEach((el) => {
      const fill = el.getAttribute('fill');
      if (fill && fill.toLowerCase() !== 'none' && fill.toLowerCase() !== 'white' && fill.toLowerCase() !== '#ffffff' && fill.toLowerCase() !== '#fff') {
        el.setAttribute('fill', 'currentColor');
      }
      const stroke = el.getAttribute('stroke');
      if (stroke && stroke.toLowerCase() !== 'none' && stroke.toLowerCase() !== 'white' && stroke.toLowerCase() !== '#ffffff' && stroke.toLowerCase() !== '#fff') {
        el.setAttribute('stroke', 'currentColor');
      }
    });

    // Remover style tags que fuercen color
    svgEl.querySelectorAll('style').forEach((st) => {
      st.textContent = (st.textContent || '').replace(/fill:\s*#[0-9a-fA-F]+/g, 'fill: currentColor;');
    });

    return {
      svgContent: svgEl.innerHTML,
      viewBox,
    };
  } catch {
    return { svgContent: rawSvg, viewBox: '0 0 48 48' };
  }
}

export const IconLibraryModal: React.FC<IconLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [folderIcons, setFolderIcons] = useState<StampIconItem[]>([]);
  const [isLoadingFolder, setIsLoadingFolder] = useState<boolean>(false);

  const [customIcons, setCustomIcons] = useState<StampIconItem[]>(() => {
    try {
      const saved = localStorage.getItem('stampforge_custom_icons');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [copiedPath, setCopiedPath] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar dinámicamente todos los iconos desde la carpeta public/iconos
  const fetchFolderIcons = useCallback(async () => {
    setIsLoadingFolder(true);
    try {
      const res = await fetch('/api/icons');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const processed: StampIconItem[] = data.map((item) => {
            const { svgContent, viewBox } = sanitizeAndNormalizeSvg(item.svgContent);
            return {
              id: item.id,
              categoryId: item.categoryId || 'mis_iconos',
              label: item.label,
              svgContent: `<svg viewBox="${viewBox}" class="w-full h-full" fill="currentColor">${svgContent}</svg>`,
              isCustom: true,
            };
          });
          setFolderIcons(processed);
        }
      }
    } catch (e) {
      console.warn('Error fetching /api/icons:', e);
    } finally {
      setIsLoadingFolder(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchFolderIcons();
    }
  }, [isOpen, fetchFolderIcons]);

  // Guardar iconos subidos por el usuario en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('stampforge_custom_icons', JSON.stringify(customIcons));
    } catch {}
  }, [customIcons]);

  if (!isOpen) return null;

  // Combinar: built-in + escaneados de carpetas de Windows + subidos en navegador
  const idSet = new Set<string>();
  const combinedIcons: StampIconItem[] = [];

  [...folderIcons, ...customIcons, ...BUILTIN_ICONS].forEach((item) => {
    if (!idSet.has(item.id)) {
      idSet.add(item.id);
      combinedIcons.push(item);
    }
  });

  // Filtrar por categoría y búsqueda
  const filteredIcons = combinedIcons.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'mis_iconos'
        ? item.categoryId === 'mis_iconos' || item.isCustom
        : item.categoryId === selectedCategory;

    const matchesSearch =
      searchQuery.trim() === '' ||
      item.label.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Contar iconos por categoría
  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return combinedIcons.length;
    if (catId === 'mis_iconos') {
      return combinedIcons.filter((i) => i.categoryId === 'mis_iconos' || i.isCustom).length;
    }
    return combinedIcons.filter((i) => i.categoryId === catId).length;
  };

  // Procesar archivo SVG subido manualmente
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
        alert('Por favor selecciona un archivo en formato .svg');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        const { svgContent, viewBox } = sanitizeAndNormalizeSvg(text);
        const cleanName = file.name.replace(/\.svg$/i, '').replace(/[-_]/g, ' ');

        const newIcon: StampIconItem = {
          id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          categoryId: selectedCategory === 'all' ? 'mis_iconos' : selectedCategory,
          label: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          svgContent: `<svg viewBox="${viewBox}" class="w-full h-full" fill="currentColor">${svgContent}</svg>`,
          isCustom: true,
        };

        setCustomIcons((prev) => [newIcon, ...prev]);
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteCustomIcon = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomIcons((prev) => prev.filter((item) => item.id !== id));
    setFolderIcons((prev) => prev.filter((item) => item.id !== id));
  };

  const windowsPath = `C:\\Users\\User\\Documents\\PAGINA DE DISEÑO\\public\\iconos\\`;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(windowsPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* ENCABEZADO */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Biblioteca de Iconos SVG
                <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded-full font-mono">
                  {filteredIcons.length} disponibles
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pega archivos en la carpeta de Windows o súbelos directamente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* BARRA DE ACCIÓN RÁPIDA: SUBIDA + CARPETA DE WINDOWS + REFRESCAR */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Subir archivo */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow transition active:scale-95"
            >
              <Upload size={14} />
              Subir Archivos .SVG
            </button>

            <button
              onClick={fetchFolderIcons}
              disabled={isLoadingFolder}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 shadow transition active:scale-95 disabled:opacity-50"
              title="Volver a escanear archivos en la carpeta public/iconos"
            >
              <RefreshCw size={13} className={isLoadingFolder ? 'animate-spin text-sky-400' : ''} />
              {isLoadingFolder ? 'Buscando...' : 'Refrescar Carpeta'}
            </button>
          </div>

          {/* Ruta en Windows */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-lg">
            <Folder size={13} className="text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-300 font-mono truncate max-w-[240px]">
              ...\public\iconos\
            </span>
            <button
              onClick={handleCopyPath}
              className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 ml-1 transition"
              title="Copiar ruta para pegar en el explorador de Windows"
            >
              {copiedPath ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copiedPath ? '¡Copiado!' : 'Copiar Ruta'}
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: CATEGORÍAS + GRID */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Pestañas de Carpetas/Categorías (Izquierda) */}
          <div className="w-56 border-r border-slate-800 bg-slate-950/30 p-2 overflow-y-auto space-y-1 shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 py-1 block">
              Carpetas / Categorías
            </span>

            {ICON_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = getCategoryCount(cat.id);

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-left transition ${
                    isSelected
                      ? 'bg-sky-600/20 text-sky-300 border border-sky-500/40 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-full font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Área de Visualización y Búsqueda (Derecha) */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50">
            {/* Buscador */}
            <div className="p-3 border-b border-slate-800 flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar icono por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Grid de Iconos */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredIcons.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="p-3 rounded-2xl bg-slate-800/80 text-slate-400 mb-2">
                    <Folder size={28} />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">No hay iconos en esta categoría</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Pega archivos en la carpeta de Windows y pulsa <strong>"Refrescar Carpeta"</strong> o sube archivos .SVG con el botón superior.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {filteredIcons.map((icon) => (
                    <div
                      key={icon.id}
                      onClick={() => {
                        onSelectIcon(icon.id, icon.svgContent, icon.label);
                        onClose();
                      }}
                      className="group relative flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-sky-500 cursor-pointer transition shadow-sm hover:shadow-lg hover:scale-105"
                      title={`Insertar ${icon.label}`}
                    >
                      {/* Vista previa SVG */}
                      <div className="w-12 h-12 flex items-center justify-center text-sky-400 group-hover:text-white transition overflow-hidden">
                        {icon.svgContent.includes('<svg') ? (
                          <div
                            className="w-10 h-10 flex items-center justify-center fill-current"
                            dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                          />
                        ) : (
                          <svg
                            viewBox="-24 -24 48 48"
                            className="w-10 h-10 overflow-visible fill-current"
                            dangerouslySetInnerHTML={{ __html: icon.svgContent }}
                          />
                        )}
                      </div>

                      {/* Nombre */}
                      <span className="text-[11px] font-medium text-slate-300 group-hover:text-white text-center truncate w-full mt-2">
                        {icon.label}
                      </span>

                      {/* Botón eliminar si es personalizado */}
                      {icon.isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomIcon(icon.id, e)}
                          className="absolute top-1 right-1 p-1 rounded bg-rose-950/80 text-rose-400 hover:bg-rose-900 opacity-0 group-hover:opacity-100 transition"
                          title="Eliminar icono"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
