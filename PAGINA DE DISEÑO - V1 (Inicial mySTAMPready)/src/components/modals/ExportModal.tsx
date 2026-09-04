import React, { useState } from 'react';
import type { StampProject } from '../../types/stamp';
import { exportToSvg, exportToPng, exportToPdf } from '../../utils/exportEngine';
import { X, FileCode, Image, FileText, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: StampProject;
  svgRef?: React.RefObject<SVGSVGElement | null>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [dpi, setDpi] = useState<number>(300);
  const [transparent, setTransparent] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const width = project.widthMm || project.sizeMm || 40;
  const height = project.heightMm || project.sizeMm || 40;

  const handleDownloadSvg = () => {
    exportToSvg(project);
    showSuccessNotice('Vector SVG compatible con Illustrator y Láser descargado');
  };

  const handleDownloadPng = async () => {
    setIsExporting(true);
    try {
      await exportToPng(project, { dpi, transparent });
      showSuccessNotice(`Imagen PNG (${dpi} DPI) descargada`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      await exportToPdf(project);
      showSuccessNotice('Hoja PDF a escala real 1:1 descargada');
    } finally {
      setIsExporting(false);
    }
  };

  const showSuccessNotice = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              Descargar Sello Vectorial
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded">
                Illustrator Ready
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Medida física: {width} x {height} mm ({project.shape}) • 100% compatible con grabado láser
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {downloadSuccess && (
          <div className="bg-emerald-950/80 border-b border-emerald-800/80 px-4 py-2 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 size={16} />
            <span>{downloadSuccess}</span>
          </div>
        )}

        <div className="p-6 space-y-4">
          {/* SVG Vectorial */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between hover:border-sky-500 transition">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-sky-950/60 border border-sky-800/60 text-sky-400">
                <FileCode size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Vector SVG (.svg)
                  <span className="text-[10px] text-sky-400 font-mono flex items-center gap-0.5">
                    <Sparkles size={10} /> Optimizado
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Totalmente compatible con Adobe Illustrator, CorelDraw, RDWorks y corte/grabado láser. Sin cajas negras ni textos aplanados.
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadSvg}
              disabled={isExporting}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shrink-0 ml-3"
            >
              Descargar SVG
            </button>
          </div>

          {/* PNG Alta Resolución */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3 hover:border-sky-500 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-400">
                  <Image size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Imagen PNG Alta Resolución</h3>
                  <p className="text-xs text-slate-400">
                    Para documentos digitales, firmas, membretes o páginas web.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadPng}
                disabled={isExporting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shrink-0 flex items-center gap-1.5 ml-3"
              >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : null}
                Descargar PNG
              </button>
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span>Resolución:</span>
                {[150, 300, 600].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDpi(d)}
                    className={`px-2 py-0.5 rounded font-mono ${
                      dpi === d
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d} DPI
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(e) => setTransparent(e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600 text-indigo-600"
                />
                <span>Fondo Transparente</span>
              </label>
            </div>
          </div>

          {/* PDF Tamaño Real */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between hover:border-sky-500 transition">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-400">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Hoja PDF de Impresión (.pdf)</h3>
                <p className="text-xs text-slate-400">
                  Hoja A4 con el sello centrado a escala 1:1 real ({width}x{height}mm).
                </p>
              </div>
            </div>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shrink-0 ml-3 flex items-center gap-1.5"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : null}
              Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
