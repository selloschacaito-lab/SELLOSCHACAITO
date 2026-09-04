import React, { useState } from 'react';
import type { StampTemplate } from '../../types/stamp';
import { DEFAULT_TEMPLATES } from '../../utils/defaultTemplates';
import { X, Sparkles, Check } from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: StampTemplate) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'notary', label: 'Notaría & Legal' },
    { id: 'medical', label: 'Médicos & Salud' },
    { id: 'business', label: 'Empresas & Pagado' },
    { id: 'vintage', label: 'Vintage & Gourmet' },
  ];

  const filtered =
    selectedCat === 'all'
      ? DEFAULT_TEMPLATES
      : DEFAULT_TEMPLATES.filter((t) => t.category === selectedCat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-sky-400 w-5 h-5" />
            <h2 className="text-base font-bold text-white">Galería de Plantillas Pre-diseñadas</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex px-4 py-2 gap-1.5 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCat === c.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-slate-800/60 border border-slate-700/70 hover:border-sky-500 rounded-xl p-4 flex flex-col justify-between transition hover:shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition">
                    {t.name}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                    Ø {t.project.sizeMm}mm
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">{t.description}</p>
              </div>

              <button
                onClick={() => {
                  onSelectTemplate(t);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white py-2 rounded-lg text-xs font-bold transition shadow-sm"
              >
                <Check size={14} /> Usar esta Plantilla
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
