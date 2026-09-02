import React, { useState, useEffect } from 'react';
import { KeyRound, X, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../utils/geminiClient';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getStoredApiKey());
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setStoredApiKey('');
    setApiKey('');
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Configurar Gemini API Key</h2>
              <p className="text-xs text-slate-400">Para uso en GitHub Pages o modo cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tu Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1.5 flex items-center text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-600 shrink-0" />
              Se guarda únicamente en el localStorage de tu navegador.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600">
            ¿No tienes una clave? Consigue una gratis en{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center font-semibold text-indigo-600 hover:underline"
            >
              Google AI Studio
              <ExternalLink className="ml-0.5 h-3 w-3" />
            </a>
          </div>

          <div className="flex items-center justify-between pt-2">
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:underline"
              >
                Eliminar clave
              </button>
            )}
            <div className="ml-auto flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700"
              >
                {saved ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>¡Guardado!</span>
                  </>
                ) : (
                  <span>Guardar</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
