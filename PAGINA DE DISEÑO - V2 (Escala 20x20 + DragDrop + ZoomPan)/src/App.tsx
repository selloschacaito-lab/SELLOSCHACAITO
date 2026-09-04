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

  const [history, setHistory] = useState<StampProject[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(() => {
    return project.layers?.[0]?.id || null;
  });

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

  const handleToggleVisibility = (layerId: string) => {
    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: (prev.layers || []).map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)),
    }));
  };

  const handleDeleteLayer = (layerId: string) => {
    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: (prev.layers || []).filter((l) => l.id !== layerId),
    }));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  };

  const handleDuplicateLayer = (layerId: string) => {
    const layers = project.layers || [];
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const newLayer: StampLayer = {
      ...layer,
      id: `layer-${Date.now()}`,
      name: `${layer.name} (Copia)`,
    };

    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: [...(prev.layers || []), newLayer],
    }));
    setSelectedLayerId(newLayer.id);
  };

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

  const handleAddLayer = (type: StampLayer['type']) => {
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
          letterSpacing: 2,
          fontFamily: 'Montserrat',
          fontSize: 14,
          isBold: true,
          isItalic: false,
          isReversed: false,
          position: 'top',
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
          fontSize: 14,
          isBold: true,
          isItalic: false,
          alignment: 'center',
          offsetX: 0,
          offsetY: 0,
          letterSpacing: 1,
          lineHeight: 1.2,
        } as CenterTextLayer;
        break;

      case 'icon':
        newLayer = {
          id: `icon-${Date.now()}`,
          type: 'icon',
          name: `Icono Estrella #${currentLayers.length + 1}`,
          visible: true,
          iconKey: 'star',
          size: 32,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
        } as IconLayer;
        break;
    }

    updateProjectWithHistory((prev) => ({
      ...prev,
      layers: [...(prev.layers || []), newLayer],
    }));
    setSelectedLayerId(newLayer.id);
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
        grungeEffect: 0,
        showGrid: true,
        createdAt: Date.now(),
        layers: [
          {
            id: 'frame-1',
            type: 'frame',
            name: 'Marco Exterior',
            visible: true,
            radius: 94,
            widthPercent: 94,
            heightPercent: 92,
            cornerRadius: 4,
            strokeWidth: 3,
            style: 'solid',
          },
          {
            id: 'text-top-1',
            type: 'circular-text',
            name: 'Texto Superior',
            visible: true,
            text: 'NOMBRE DE TU EMPRESA',
            radius: 80,
            startAngle: 0,
            sweepAngle: 180,
            letterSpacing: 2,
            fontFamily: 'Montserrat',
            fontSize: 16,
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
      setSelectedLayerId('text-top-1');
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
    setSelectedLayerId(loadedProject.layers?.[0]?.id || null);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const layers = project.layers || [];
  const selectedLayer = useMemo(() => {
    return layers.find((l) => l.id === selectedLayerId) || null;
  }, [layers, selectedLayerId]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <Header
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onNewStamp={handleNewStamp}
        onAddLayer={handleAddLayer}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <SidebarLeft
          layers={layers}
          selectedLayerId={selectedLayerId}
          onSelectLayer={setSelectedLayerId}
          onToggleVisibility={handleToggleVisibility}
          onDeleteLayer={handleDeleteLayer}
          onDuplicateLayer={handleDuplicateLayer}
          onMoveLayer={handleMoveLayer}
          onAddLayer={handleAddLayer}
        />

        <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-slate-950">
          <StampCanvas
            ref={svgRef}
            project={project}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={handleDirectDragUpdateLayer}
            zoom={zoom}
            onZoomChange={setZoom}
          />
        </main>

        <SidebarRight
          project={project}
          selectedLayer={selectedLayer}
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
