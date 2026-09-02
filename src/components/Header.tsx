import React from 'react';
import { Sparkles, AudioWaveform, FileDown, History, BookOpen, Layers, KeyRound } from 'lucide-react';

interface HeaderProps {
  activeTab: 'editor' | 'voices' | 'history';
  setActiveTab: (tab: 'editor' | 'voices' | 'history') => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onOpenApiKey: () => void;
  historyCount: number;
  hasActiveAudio: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenTemplates,
  onOpenExport,
  onOpenApiKey,
  historyCount,
  hasActiveAudio,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-sm shadow-indigo-200">
            V
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-800">VozStudio</h1>
              <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Español
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Estudio TTS con <span className="font-mono font-medium text-slate-600">gemini-3.1-flash-tts-preview</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60">
          <button
            id="nav-tab-editor"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'editor'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeTab === 'editor' ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            />
            <Layers className="h-3.5 w-3.5" />
            <span>Colocar Texto</span>
          </button>

          <button
            id="nav-tab-voices"
            onClick={() => setActiveTab('voices')}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'voices'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeTab === 'voices' ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            />
            <Sparkles className="h-3.5 w-3.5" />
            <span>Biblioteca de Voces</span>
          </button>

          <button
            id="nav-tab-history"
            onClick={() => setActiveTab('history')}
            className={`relative flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeTab === 'history' ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            />
            <History className="h-3.5 w-3.5" />
            <span>Historial</span>
            {historyCount > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-800 px-1 text-[10px] font-bold text-white">
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Quick Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            id="btn-open-api-key"
            onClick={onOpenApiKey}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50"
            title="Configurar Gemini API Key (para GitHub Pages)"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden md:inline">API Key</span>
          </button>

          <button
            id="btn-open-templates"
            onClick={onOpenTemplates}
            className="hidden items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 sm:flex"
            title="Explorar plantillas y guiones de ejemplo"
          >
            <BookOpen className="h-4 w-4 text-slate-400" />
            <span>Plantillas</span>
          </button>

          <button
            id="btn-open-export-header"
            onClick={onOpenExport}
            disabled={!hasActiveAudio}
            className={`flex items-center space-x-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              hasActiveAudio
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-98'
                : 'cursor-not-allowed bg-slate-200 text-slate-400'
            }`}
          >
            <FileDown className="h-4 w-4" />
            <span>Exportar Audio</span>
          </button>
        </div>
      </div>
    </header>
  );
};
