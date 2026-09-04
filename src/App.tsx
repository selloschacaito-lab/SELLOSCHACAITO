import { useState, useRef, useEffect, useMemo } from 'react';
import type {
  StampProject,
  StampLayer,
  FrameLayer,
  CircularTextLayer,
  CenterTextLayer,
  IconLayer,
  StampTemplate,
} from './types/stamp';
import { DEFAULT_TEMPLATES } from './utils/defaultTemplates';
import { Header } from './components/layout/Header';
import { SidebarLeft } from './components/layout/SidebarLeft';
import { SidebarRight } from './components/layout/SidebarRight';
import { StampCanvas } from './components/canvas/StampCanvas';
import { TemplateModal } from './components/modals/TemplateModal';
import { ExportModal } from './components/modals/ExportModal';
import { CambioView } from './components/cambio/CambioView';

const STORAGE_KEY = 'stampforge_active_project';

const getInitialProject = (): StampProject => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.layers) && parsed.layers.length > 0) {
        return {
          id: parsed.id || 'default-stamp',
          title: parsed.title || 'Mi Sello',
          shape: parsed.shape || 'circle',
          widthMm: parsed.widthMm || parsed.sizeMm || 42,
          heightMm: parsed.heightMm || parsed.sizeMm || 42,
          color: parsed.color || '#1e3a8a',
          grungeEffect: typeof parsed.grungeEffect === 'number' ? parsed.grungeEffect : 0,
          showGrid: parsed.showGrid !== undefined ? parsed.showGrid : true,
          createdAt: parsed.createdAt || Date.now(),
          layers: parsed.layers,
        };
      }
    }
  } catch (e) {
    console.warn('Error reading from localStorage', e);
  }
  return {
    id: 'default-stamp',
    createdAt: Date.now(),
    ...DEFAULT_TEMPLATES[0].project,
  };
};

export function App() {
  const [project, setProject] = useState<StampProject>(getInitialProject);
  const [activeView, setActiveView] = useState<'editor' | 'cambio'>('editor');

  const [history, setHistory] = useState<StampProject[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(() => {
    return project.layers?.[0]?.id ? [project.layers[0].id] : [];
  });

  const selectedLayerId = selectedLayerIds[selectedLayerIds.length - 1] || null;

  const [zoom, setZoom] = useState<number>(1.0);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.warn('Error saving to localStorage', e);
    }
  }, [project]);

  const updateProjectWithHistory = (updater: (prev: StampProject) => StampProject) => {
    setProject((prev) => {
      const next = updater(prev);
      setHistory((h) => [...h.slice(0, historyIndex + 1), prev]);
      setHistoryIndex((idx) => idx + 1);
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndex >= 0) {
      const prev = history[historyIndex];
      setHistoryIndex((idx) => idx - 1);
      setProject(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex((idx) => idx + 1);
      setProject(next);
    }
  };

  const handleUpdateProject = (updates: Partial<StampProject>) => {
    updateProjectWithHistory((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleSelectLayer = (id: string | null, isShift: boolean = false) => {
    if (!id) {
      setSelectedLayerIds([]);
      return;
    }
    if (isShift) {
      setSelectedLayerIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      setSelectedLayerIds([id]);
    }
  };

  const handleSelectMultipleLayers = (ids: string[]) => {
    setSelectedLayerIds(ids);
  };

  const handleUpdateLayer = (updatedLayer: StampLayer) => {
    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: (prev.layers || []).map((l) => (l.id === updatedLayer.id ? updatedLayer : l)),
    }));
  };

  const handleDirectDragUpdateLayer = (updatedLayer: StampLayer) => {
    setProject((prev) => ({
      ...prev,
      layers: (prev.layers || []).map((l) => (l.id === updatedLayer.id ? updatedLayer : l)),
    }));
  };

  const handleBatchUpdateLayers = (updatedLayers: StampLayer[]) => {
    const map = new Map(updatedLayers.map((l) => [l.id, l]));
    setProject((prev) => ({
      ...prev,
      layers: (prev.layers || []).map((l) => map.get(l.id) || l),
    }));
  };

  const handleToggleVisibility = (layerId: string) => {
    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: (prev.layers || []).map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)),
    }));
  };

  const handleDeleteLayers = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: (prev.layers || []).filter((l) => !ids.includes(l.id)),
    }));
    setSelectedLayerIds((prev) => prev.filter((id) => !ids.includes(id)));
  };

  const handleDeleteLayer = (layerId: string) => {
    handleDeleteLayers([layerId]);
  };

  const [clipboardLayers, setClipboardLayers] = useState<StampLayer[]>([]);

  const handleDuplicateLayers = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const layers = project.layers || [];
    const toDuplicate = layers.filter((l) => ids.includes(l.id));
    if (toDuplicate.length === 0) return;

    const newClones: StampLayer[] = toDuplicate.map((layer, idx) => {
      const cloned = JSON.parse(JSON.stringify(layer)) as StampLayer;
      cloned.id = `layer-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      cloned.name = `${layer.name} (Copia)`;
      if (cloned.type === 'center-text' || cloned.type === 'icon') {
        cloned.offsetX = Math.min(80, (cloned.offsetX || 0) + 4);
        cloned.offsetY = Math.min(80, (cloned.offsetY || 0) + 4);
      }
      return cloned;
    });

    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: [...(prev.layers || []), ...newClones],
    }));
    setSelectedLayerIds(newClones.map((l) => l.id));
  };

  const handleDuplicateLayer = (layerId: string) => {
    handleDuplicateLayers([layerId]);
  };

  const handleGroupLayers = (ids?: string[]) => {
    const targetIds = ids && ids.length > 0 ? ids : selectedLayerIds;
    if (targetIds.length < 2) return;

    const newGroupId = `group-${Date.now()}`;
    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: (prev.layers || []).map((l) =>
        targetIds.includes(l.id) ? { ...l, groupId: newGroupId } : l
      ),
    }));
    setSelectedLayerIds(targetIds);
  };

  const handleUngroupLayers = (ids?: string[]) => {
    const targetIds = ids && ids.length > 0 ? ids : selectedLayerIds;
    if (targetIds.length === 0) return;

    const targetLayers = (project.layers || []).filter((l) => targetIds.includes(l.id));
    const groupIdsToClear = new Set(targetLayers.map((l) => l.groupId).filter(Boolean));

    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: (prev.layers || []).map((l) =>
        l.groupId && groupIdsToClear.has(l.groupId) ? { ...l, groupId: undefined } : l
      ),
    }));
  };

  // Atajos de teclado profesionales (Suprimir, Ctrl+Z, Ctrl+Y, Ctrl+D, Ctrl+G, Ctrl+Shift+G, Ctrl+C, Ctrl+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isInput) return;

      // Tecla Suprimir o Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          handleDeleteLayers(selectedLayerIds);
        }
      }

      // Atajo Ctrl+Z (Deshacer)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Atajo Ctrl+Y o Ctrl+Shift+Z (Rehacer)
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        handleRedo();
      }

      // Atajo Ctrl+D (Duplicar capas seleccionadas)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          handleDuplicateLayers(selectedLayerIds);
        }
      }

      // Atajo Ctrl+G (Agrupar capas)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && !e.shiftKey) {
        if (selectedLayerIds.length >= 2) {
          e.preventDefault();
          handleGroupLayers(selectedLayerIds);
        }
      }

      // Atajo Ctrl+Shift+G (Desagrupar capas)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && e.shiftKey) {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          handleUngroupLayers(selectedLayerIds);
        }
      }

      // Atajo Ctrl+C (Copiar)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selectedLayerIds.length > 0) {
          e.preventDefault();
          const toCopy = (project.layers || []).filter((l) => selectedLayerIds.includes(l.id));
          setClipboardLayers(toCopy);
        }
      }

      // Atajo Ctrl+V (Pegar)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboardLayers.length > 0) {
          e.preventDefault();
          const newClones: StampLayer[] = clipboardLayers.map((layer, idx) => {
            const cloned = JSON.parse(JSON.stringify(layer)) as StampLayer;
            cloned.id = `layer-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
            cloned.name = `${layer.name} (Pegado)`;
            if (cloned.type === 'center-text' || cloned.type === 'icon') {
              cloned.offsetX = Math.min(80, (cloned.offsetX || 0) + 4);
              cloned.offsetY = Math.min(80, (cloned.offsetY || 0) + 4);
            }
            return cloned;
          });

          updateProjectWithHistory((prev) => ({
            ...prev,
            layers: [...(prev.layers || []), ...newClones],
          }));
          setSelectedLayerIds(newClones.map((l) => l.id));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLayerIds, selectedLayerId, project.layers, historyIndex, clipboardLayers]);

  const handleMoveLayer = (layerId: string, direction: 'up' | 'down') => {
    const layers = project.layers || [];
    const index = layers.findIndex((l) => l.id === layerId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    const reordered = [...layers];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: reordered,
    }));
  };

  const handleAddLayer = (type: StampLayer['type'], customProps?: Partial<StampLayer>) => {
    const currentLayers = project.layers || [];
    let newLayer: StampLayer;

    switch (type) {
      case 'frame':
        newLayer = {
          id: `frame-${Date.now()}`,
          type: 'frame',
          name: `Borde #${currentLayers.length + 1}`,
          visible: true,
          radius: 75,
          widthPercent: 92,
          heightPercent: 90,
          cornerRadius: 4,
          strokeWidth: 2,
          style: 'solid',
          ...(customProps as any),
        } as FrameLayer;
        break;

      case 'circular-text':
        newLayer = {
          id: `circtext-${Date.now()}`,
          type: 'circular-text',
          name: `Texto en Arco #${currentLayers.length + 1}`,
          visible: true,
          text: 'NUEVO TEXTO CIRCULAR',
          radius: 80,
          startAngle: 0,
          sweepAngle: 180,
          letterSpacing: 0,
          fontFamily: 'Montserrat',
          fontSize: 7,
          isBold: true,
          isItalic: false,
          isReversed: false,
          position: 'top',
          ...(customProps as any),
        } as CircularTextLayer;
        break;

      case 'center-text':
        newLayer = {
          id: `centext-${Date.now()}`,
          type: 'center-text',
          name: `Texto Central #${currentLayers.length + 1}`,
          visible: true,
          text: 'TEXTO PERSONALIZADO',
          fontFamily: 'Montserrat',
          fontSize: 7,
          isBold: true,
          isItalic: false,
          alignment: 'center',
          offsetX: 0,
          offsetY: 0,
          letterSpacing: 0,
          lineHeight: 1.2,
          ...(customProps as any),
        } as CenterTextLayer;
        break;

      case 'icon':
        newLayer = {
          id: `icon-${Date.now()}`,
          type: 'icon',
          name: `Icono #${currentLayers.length + 1}`,
          visible: true,
          iconKey: 'star',
          size: 32,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          ...(customProps as any),
        } as IconLayer;
        break;
    }

    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: [...(prev.layers || []), newLayer],
    }));
    setSelectedLayerIds([newLayer.id]);
  };

  const handleNewStamp = () => {
    if (window.confirm('¿Deseas iniciar un nuevo sello en blanco?')) {
      const blank: StampProject = {
        id: `stamp-${Date.now()}`,
        title: 'Mi Nuevo Sello',
        shape: 'circle',
        widthMm: 40,
        heightMm: 40,
        sizeMm: 40,
        color: '#1e3a8a',
        showGrid: true,
        grungeEffect: 0,
        createdAt: Date.now(),
        layers: [
          {
            id: 'frame-1',
            type: 'frame',
            name: 'Borde Exterior',
            visible: true,
            radius: 94,
            strokeWidth: 2,
            style: 'solid',
          },
          {
            id: 'text-top-1',
            type: 'circular-text',
            name: 'Texto Superior',
            visible: true,
            text: 'REPÚBLICA BOLIVARIANA DE VENEZUELA',
            radius: 80,
            startAngle: 0,
            sweepAngle: 180,
            letterSpacing: 2,
            fontFamily: 'Montserrat',
            fontSize: 12,
            isBold: true,
            isItalic: false,
            isReversed: false,
            position: 'top',
          },
          {
            id: 'text-center-1',
            type: 'center-text',
            name: 'Texto Central',
            visible: true,
            text: 'SELLO OFICIAL',
            fontFamily: 'Oswald',
            fontSize: 20,
            isBold: true,
            isItalic: false,
            alignment: 'center',
            offsetX: 0,
            offsetY: 0,
            letterSpacing: 2,
            lineHeight: 1.2,
          },
        ],
      };
      setProject(blank);
      setSelectedLayerIds(['text-top-1']);
      setHistory([]);
      setHistoryIndex(-1);
    }
  };

  const handleSelectTemplate = (template: StampTemplate) => {
    const loadedProject: StampProject = {
      id: `template-${Date.now()}`,
      createdAt: Date.now(),
      ...template.project,
    };
    setProject(loadedProject);
    setSelectedLayerIds(loadedProject.layers?.[0]?.id ? [loadedProject.layers[0].id] : []);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const layers = project.layers || [];
  const selectedLayer = useMemo(() => {
    return layers.find((l) => l.id === selectedLayerId) || null;
  }, [layers, selectedLayerId]);

  if (activeView === 'cambio') {
    return <CambioView onBackToApp={() => setActiveView('editor')} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <Header
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onNewStamp={handleNewStamp}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        onOpenCambioView={() => setActiveView('cambio')}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <SidebarLeft onAddLayer={handleAddLayer} />

        <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-slate-950">
          <StampCanvas
            ref={svgRef}
            project={project}
            selectedLayerId={selectedLayerId}
            selectedLayerIds={selectedLayerIds}
            onSelectLayer={handleSelectLayer}
            onSelectMultipleLayers={handleSelectMultipleLayers}
            onUpdateLayer={handleDirectDragUpdateLayer}
            onBatchUpdateLayers={handleBatchUpdateLayers}
            onDuplicateLayers={handleDuplicateLayers}
            zoom={zoom}
            onZoomChange={setZoom}
          />
        </main>

        <SidebarRight
          layers={layers}
          selectedLayerId={selectedLayerId}
          selectedLayerIds={selectedLayerIds}
          selectedLayer={selectedLayer}
          project={project}
          onSelectLayer={handleSelectLayer}
          onToggleVisibility={handleToggleVisibility}
          onDeleteLayer={handleDeleteLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onDuplicateLayers={handleDuplicateLayers}
          onGroupLayers={handleGroupLayers}
          onUngroupLayers={handleUngroupLayers}
          onMoveLayer={handleMoveLayer}
          onAddLayer={handleAddLayer}
          onUpdateLayer={handleUpdateLayer}
          onUpdateProject={handleUpdateProject}
        />
      </div>

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        svgRef={svgRef}
      />
    </div>
  );
}

export default App;
