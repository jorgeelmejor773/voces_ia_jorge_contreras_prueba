import React from 'react';
import { TextTemplate, SpanishVoice } from '../types';
import { SPANISH_TEMPLATES } from '../data/templates';
import { SPANISH_VOICES } from '../data/voices';
import { X, BookOpen, Check, ArrowRight, Sparkles } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TextTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Plantillas y Guiones en Español
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona una plantilla prediseñada para probar rápidamente estilos y entonaciones.
              </p>
            </div>
          </div>

          <button
            id="btn-close-templates-modal"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {SPANISH_TEMPLATES.map((tmpl) => {
            const recommendedVoice =
              SPANISH_VOICES.find((v) => v.id === tmpl.defaultVoiceId) || SPANISH_VOICES[0];

            return (
              <div
                key={tmpl.id}
                id={`template-card-${tmpl.id}`}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-indigo-400 hover:bg-indigo-50/20 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      {tmpl.category}
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700">
                      {recommendedVoice.name} ({tmpl.accent.replace('Español ', '')})
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-slate-800">{tmpl.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{tmpl.description}</p>

                  <div className="mt-3 rounded-xl bg-white p-2.5 border border-slate-200/70 text-xs text-slate-700 italic line-clamp-3">
                    "{tmpl.content}"
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-200/50 pt-3">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Tono: {tmpl.tone}
                  </span>

                  <button
                    id={`btn-use-template-${tmpl.id}`}
                    onClick={() => {
                      onSelectTemplate(tmpl);
                      onClose();
                    }}
                    className="flex items-center space-x-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    <span>Cargar Guion</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
