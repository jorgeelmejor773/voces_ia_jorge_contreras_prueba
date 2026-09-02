import React, { useState } from 'react';
import {
  SpanishVoice,
  SpanishAccent,
  TextSegment,
} from '../types';
import { SPANISH_VOICES, SPANISH_ACCENTS, VOICE_TONES } from '../data/voices';
import {
  Sparkles,
  Play,
  Volume2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Wand2,
  Layers,
  MessageSquare,
  FileText,
  Clock,
  Type,
  Split,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { estimateSpeechDuration } from '../utils/audioUtils';

interface TextWorkspaceProps {
  // Free text mode
  freeText: string;
  setFreeText: (text: string) => void;
  // Selected Voice & Settings
  selectedVoice: SpanishVoice;
  onSelectVoice: (voice: SpanishVoice) => void;
  selectedAccent: SpanishAccent;
  setSelectedAccent: (accent: SpanishAccent) => void;
  selectedTone: string;
  setSelectedTone: (tone: string) => void;
  customInstruction: string;
  setCustomInstruction: (instruction: string) => void;
  // Segments mode
  segments: TextSegment[];
  setSegments: React.Dispatch<React.SetStateAction<TextSegment[]>>;
  // Dialogue multi-speaker
  speaker1VoiceId: string;
  setSpeaker1VoiceId: (id: string) => void;
  speaker2VoiceId: string;
  setSpeaker2VoiceId: (id: string) => void;
  dialogueText: string;
  setDialogueText: (text: string) => void;
  // Actions
  onGenerateFreeText: () => Promise<void>;
  onGenerateSegment: (segmentId: string) => Promise<void>;
  onGenerateAllSegments: () => Promise<void>;
  onGenerateDialogue: () => Promise<void>;
  onEnhanceText: (mode: string) => Promise<void>;
  isGenerating: boolean;
  isEnhancing: boolean;
  generationProgress?: string;
  activeSegmentId?: string | null;
}

export const TextWorkspace: React.FC<TextWorkspaceProps> = ({
  freeText,
  setFreeText,
  selectedVoice,
  onSelectVoice,
  selectedAccent,
  setSelectedAccent,
  selectedTone,
  setSelectedTone,
  customInstruction,
  setCustomInstruction,
  segments,
  setSegments,
  speaker1VoiceId,
  setSpeaker1VoiceId,
  speaker2VoiceId,
  setSpeaker2VoiceId,
  dialogueText,
  setDialogueText,
  onGenerateFreeText,
  onGenerateSegment,
  onGenerateAllSegments,
  onGenerateDialogue,
  onEnhanceText,
  isGenerating,
  isEnhancing,
  generationProgress,
  activeSegmentId,
}) => {
  const [workspaceMode, setWorkspaceMode] = useState<'free' | 'blocks' | 'dialogue'>('free');
  const [showEnhanceMenu, setShowEnhanceMenu] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const getVoiceFlag = (accent: string) => {
    if (accent.includes('Colombia')) return '🇨🇴';
    if (accent.includes('México') || accent.includes('Mexico')) return '🇲🇽';
    if (accent.includes('España')) return '🇪🇸';
    if (accent.includes('Argentina')) return '🇦🇷';
    return '🌎';
  };

  const charCount = freeText.length;
  const wordCount = freeText.trim() ? freeText.trim().split(/\s+/).length : 0;
  const estimatedSeconds = estimateSpeechDuration(freeText);

  // Convert continuous text into segmented blocks
  const handleSplitIntoBlocks = () => {
    if (!freeText.trim()) return;

    // Split by double newlines or single newlines
    const paragraphs = freeText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const newSegments: TextSegment[] = paragraphs.map((para, index) => ({
      id: `seg-${Date.now()}-${index}`,
      text: para,
      speakerName: `Párrafo ${index + 1}`,
      voiceId: selectedVoice.id,
      accent: selectedAccent,
      tone: selectedTone,
      customInstruction: '',
      pauseAfter: 0.6,
      status: 'idle',
    }));

    setSegments(newSegments);
    setWorkspaceMode('blocks');
  };

  // Add new empty block
  const handleAddBlock = () => {
    const newSeg: TextSegment = {
      id: `seg-${Date.now()}`,
      text: '',
      speakerName: `Bloque ${segments.length + 1}`,
      voiceId: selectedVoice.id,
      accent: selectedAccent,
      tone: selectedTone,
      customInstruction: '',
      pauseAfter: 0.5,
      status: 'idle',
    };
    setSegments([...segments, newSeg]);
  };

  // Update block text
  const handleUpdateSegment = (id: string, updates: Partial<TextSegment>) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, ...updates } : seg))
    );
  };

  // Delete block
  const handleDeleteSegment = (id: string) => {
    setSegments((prev) => prev.filter((seg) => seg.id !== id));
  };

  // Move block up
  const handleMoveSegmentUp = (index: number) => {
    if (index === 0) return;
    const updated = [...segments];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSegments(updated);
  };

  // Move block down
  const handleMoveSegmentDown = (index: number) => {
    if (index === segments.length - 1) return;
    const updated = [...segments];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSegments(updated);
  };

  const handleInsertTag = (tag: string) => {
    setFreeText(freeText + tag);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(freeText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const speaker1Voice = SPANISH_VOICES.find((v) => v.id === speaker1VoiceId) || SPANISH_VOICES[0];
  const speaker2Voice = SPANISH_VOICES.find((v) => v.id === speaker2VoiceId) || SPANISH_VOICES[1];

  return (
    <div className="space-y-4">
      {/* Workspace Navigation Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
        {/* Mode Selector Tabs */}
        <div className="flex items-center space-x-1 rounded-xl bg-slate-100 p-1 border border-slate-200/50">
          <button
            id="mode-tab-free"
            onClick={() => setWorkspaceMode('free')}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              workspaceMode === 'free'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Texto Continuo</span>
          </button>

          <button
            id="mode-tab-blocks"
            onClick={() => setWorkspaceMode('blocks')}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              workspaceMode === 'blocks'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Bloques / Guion ({segments.length})</span>
          </button>

          <button
            id="mode-tab-dialogue"
            onClick={() => setWorkspaceMode('dialogue')}
            className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              workspaceMode === 'dialogue'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Diálogo (2 Voces)</span>
          </button>
        </div>

        {/* Quick Voice Selector Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5">
            <span className="text-xs text-slate-400 font-medium">Voz activa:</span>
            <div className="flex items-center space-x-1.5">
              <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${selectedVoice.color}`} />
              <select
                id="select-active-voice"
                value={selectedVoice.id}
                onChange={(e) => {
                  const v = SPANISH_VOICES.find((item) => item.id === e.target.value);
                  if (v) {
                    onSelectVoice(v);
                    setSelectedAccent(v.accent);
                  }
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                {SPANISH_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {getVoiceFlag(v.accent)} {v.name} • {v.regionDetail || v.accent} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            id="btn-toggle-advanced-settings"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className={`flex items-center space-x-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
              showAdvancedSettings
                ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-slate-400" />
            <span>Ajustes</span>
          </button>
        </div>
      </div>

      {/* Advanced Settings Drawer (Accent, Tone, Custom Directives) */}
      {showAdvancedSettings && (
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
          {/* Accent Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              Acento / Región Hispana
            </label>
            <p className="text-[11px] text-slate-400">Guía la cadencia regional de pronunciación</p>
            <select
              id="select-accent-override"
              value={selectedAccent}
              onChange={(e) => setSelectedAccent(e.target.value as SpanishAccent)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              {SPANISH_ACCENTS.map((accent) => (
                <option key={accent} value={accent}>
                  {accent}
                </option>
              ))}
            </select>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              Tono e Intención de Voz
            </label>
            <p className="text-[11px] text-slate-400">Modula la emoción y dinamismo vocal</p>
            <select
              id="select-tone-override"
              value={selectedTone}
              onChange={(e) => setSelectedTone(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              {VOICE_TONES.map((tone) => (
                <option key={tone.id} value={tone.label}>
                  {tone.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Prompt Instruction */}
          <div>
            <label className="block text-xs font-bold text-slate-700">
              Instrucción de Locución Extra
            </label>
            <p className="text-[11px] text-slate-400">Directrices especiales para la IA</p>
            <input
              id="input-custom-instruction"
              type="text"
              placeholder="Ej: con pausas dramáticas y susurro suave..."
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* MODE 1: CONTINUOUS FREE TEXT */}
      {workspaceMode === 'free' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Editor Header Bar with Geometric Window Dots */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Editor de Texto en Español
              </span>
            </div>

            {/* Insertion Quick Helpers & AI Enhancer */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                id="btn-tag-pause"
                onClick={() => handleInsertTag('... ')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                title="Añadir puntos suspensivos para una pausa natural"
              >
                + Pausa (...)
              </button>

              <button
                id="btn-tag-exclamation"
                onClick={() => handleInsertTag(' ¡ !')}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                title="Insertar signos de exclamación"
              >
                + Énfasis (¡!)
              </button>

              <button
                id="btn-split-paragraphs"
                onClick={handleSplitIntoBlocks}
                disabled={!freeText.trim()}
                className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                title="Dividir en bloques por párrafo"
              >
                <Split className="h-3 w-3" />
                <span>Dividir en Bloques</span>
              </button>

              {/* AI Enhancer Button */}
              <div className="relative">
                <button
                  id="btn-toggle-enhance"
                  onClick={() => setShowEnhanceMenu(!showEnhanceMenu)}
                  disabled={isEnhancing || !freeText.trim()}
                  className="flex items-center space-x-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {isEnhancing ? (
                    <Loader2 className="h-3 w-3 animate-spin text-indigo-700" />
                  ) : (
                    <Wand2 className="h-3 w-3 text-indigo-600" />
                  )}
                  <span>{isEnhancing ? 'Optimizando...' : 'Mejorar con IA'}</span>
                </button>

                {showEnhanceMenu && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    <button
                      onClick={() => {
                        setShowEnhanceMenu(false);
                        onEnhanceText('fluidez');
                      }}
                      className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-800 hover:bg-slate-100"
                    >
                      ✨ Puntuación y Fluidez Natural
                    </button>
                    <button
                      onClick={() => {
                        setShowEnhanceMenu(false);
                        onEnhanceText('comercial');
                      }}
                      className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-800 hover:bg-slate-100"
                    >
                      🎯 Optimizar para Spot Comercial
                    </button>
                    <button
                      onClick={() => {
                        setShowEnhanceMenu(false);
                        onEnhanceText('dramatismo');
                      }}
                      className="w-full rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-slate-800 hover:bg-slate-100"
                    >
                      🎭 Añadir Expresividad y Pausas
                    </button>
                  </div>
                )}
              </div>

              <button
                id="btn-copy-text"
                onClick={handleCopyText}
                className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-500 hover:bg-slate-100"
                title="Copiar texto"
              >
                {copiedNotification ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Main Textarea */}
          <div className="relative mt-4">
            <textarea
              id="textarea-free-text"
              rows={8}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Escribe o pega aquí el guion o texto en español que deseas convertir en voz. Puedes incluir diálogos, descripciones o anuncios publicitarios..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans"
            />
          </div>

          {/* Metrics & Generation Action */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
            {/* Counts & Time */}
            <div className="flex items-center space-x-4 text-xs text-slate-400 font-mono">
              <div className="flex items-center space-x-1">
                <Type className="h-3.5 w-3.5 text-slate-400" />
                <span>{charCount} caracteres</span>
              </div>
              <span>•</span>
              <div>
                <span>{wordCount} palabras</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>~{estimatedSeconds}s de locución</span>
              </div>
            </div>

            {/* Synthesize Button */}
            <button
              id="btn-generate-free-speech"
              onClick={onGenerateFreeText}
              disabled={isGenerating || !freeText.trim()}
              className={`flex items-center space-x-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all ${
                isGenerating || !freeText.trim()
                  ? 'cursor-not-allowed bg-slate-200 text-slate-400'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98 shadow-md shadow-indigo-100'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sintetizando Audio HD...</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>Sintetizar Voz en Español</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODE 2: SEGMENTED BLOCKS */}
      {workspaceMode === 'blocks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Organizador por Bloques de Guion
              </h3>
              <p className="text-xs text-slate-400">
                Permite alternar voces, acentos y pausas entre párrafos o personajes independientes.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="btn-add-segment"
                onClick={handleAddBlock}
                className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nuevo Bloque</span>
              </button>

              <button
                id="btn-generate-all-blocks"
                onClick={onGenerateAllSegments}
                disabled={isGenerating || segments.length === 0}
                className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                <span>Sintetizar Todo ({segments.length})</span>
              </button>
            </div>
          </div>

          {/* Segments List */}
          <div className="space-y-3">
            {segments.map((segment, index) => {
              const segVoice =
                SPANISH_VOICES.find((v) => v.id === segment.voiceId) || selectedVoice;
              const isCurrentGenerating = isGenerating && activeSegmentId === segment.id;

              return (
                <div
                  key={segment.id}
                  id={`block-segment-${segment.id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300"
                >
                  {/* Block Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={segment.speakerName}
                        onChange={(e) =>
                          handleUpdateSegment(segment.id, { speakerName: e.target.value })
                        }
                        className="rounded-lg border border-transparent bg-transparent px-1.5 py-0.5 text-xs font-bold text-slate-800 hover:border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Block Settings: Voice, Pause, Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Voice selector for this block */}
                      <select
                        value={segment.voiceId}
                        onChange={(e) =>
                          handleUpdateSegment(segment.id, { voiceId: e.target.value })
                        }
                        className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
                      >
                        {SPANISH_VOICES.map((v) => (
                          <option key={v.id} value={v.id}>
                            {getVoiceFlag(v.accent)} {v.name} • {v.regionDetail || v.accent}
                          </option>
                        ))}
                      </select>

                      {/* Pause selector */}
                      <div className="flex items-center space-x-1 rounded-lg bg-slate-50 border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
                        <span>Pausa:</span>
                        <select
                          value={segment.pauseAfter}
                          onChange={(e) =>
                            handleUpdateSegment(segment.id, {
                              pauseAfter: parseFloat(e.target.value),
                            })
                          }
                          className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                        >
                          <option value={0.2}>0.2s</option>
                          <option value={0.5}>0.5s</option>
                          <option value={1.0}>1.0s</option>
                          <option value={1.5}>1.5s</option>
                          <option value={2.0}>2.0s</option>
                        </select>
                      </div>

                      {/* Move Up/Down/Delete */}
                      <button
                        onClick={() => handleMoveSegmentUp(index)}
                        disabled={index === 0}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                        title="Mover arriba"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMoveSegmentDown(index)}
                        disabled={index === segments.length - 1}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                        title="Mover abajo"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSegment(segment.id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Eliminar bloque"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Block Text Area */}
                  <textarea
                    rows={3}
                    value={segment.text}
                    onChange={(e) =>
                      handleUpdateSegment(segment.id, { text: e.target.value })
                    }
                    placeholder="Escribe el texto correspondiente a este bloque..."
                    className="mt-2.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
                  />

                  {/* Block Footer with Individual Synthesize */}
                  <div className="mt-2 flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-400 font-mono">
                      {segment.text.length} caracteres • ~{estimateSpeechDuration(segment.text)}s
                    </div>

                    <button
                      id={`btn-synth-block-${segment.id}`}
                      onClick={() => onGenerateSegment(segment.id)}
                      disabled={isGenerating || !segment.text.trim()}
                      className="flex items-center space-x-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      {isCurrentGenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                      ) : (
                        <Play className="h-3 w-3 fill-current" />
                      )}
                      <span>Generar solo este</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {segments.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-xs text-slate-500">
                  No hay bloques creados aún. Puedes escribir texto en el modo continuo y hacer clic en "Dividir en Bloques" o agregar uno manualmente.
                </p>
                <button
                  onClick={handleAddBlock}
                  className="mt-3 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Agregar Primer Bloque
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 3: CONVERSATIONAL DIALOGUE (2 SPEAKERS) */}
      {workspaceMode === 'dialogue' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Modo Diálogo Guionado (Multi-Locutor)
            </h3>
            <p className="text-xs text-slate-400">
              Sintetiza una conversación fluida en español asignando dos locutores distintos.
            </p>
          </div>

          {/* Speaker Setup Cards */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Speaker 1 */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950">Locutor 1 (Personaje A)</span>
                <span className="text-[10px] rounded-md bg-indigo-200/60 px-1.5 py-0.5 font-bold text-indigo-800">
                  {speaker1Voice.geminiVoice}
                </span>
              </div>
              <select
                id="select-speaker1-voice"
                value={speaker1VoiceId}
                onChange={(e) => setSpeaker1VoiceId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-indigo-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                {SPANISH_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {getVoiceFlag(v.accent)} {v.name} • {v.regionDetail || v.accent} ({v.gender})
                  </option>
                ))}
              </select>
            </div>

            {/* Speaker 2 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Locutor 2 (Personaje B)</span>
                <span className="text-[10px] rounded-md bg-slate-200 px-1.5 py-0.5 font-bold text-slate-700">
                  {speaker2Voice.geminiVoice}
                </span>
              </div>
              <select
                id="select-speaker2-voice"
                value={speaker2VoiceId}
                onChange={(e) => setSpeaker2VoiceId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-800 focus:outline-none"
              >
                {SPANISH_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {getVoiceFlag(v.accent)} {v.name} • {v.regionDetail || v.accent} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dialogue Script Box */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Guion de Conversación (Usa formato <span className="font-mono text-indigo-600">Persona 1: ...</span> y <span className="font-mono text-indigo-600">Persona 2: ...</span>)
            </label>
            <textarea
              id="textarea-dialogue"
              rows={8}
              value={dialogueText}
              onChange={(e) => setDialogueText(e.target.value)}
              placeholder={`Sofía: ¡Hola Mateo! ¿Ya probaste la nueva herramienta de voz en español?\nMateo: Sí, Sofía, la calidad y la naturalidad son impresionantes.\nSofía: Me encanta cómo maneja los diferentes acentos y emociones.`}
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-mono leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Dialogue Synthesis Action */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-400 font-mono">
              ~{estimateSpeechDuration(dialogueText)}s estimado
            </span>

            <button
              id="btn-synth-dialogue"
              onClick={onGenerateDialogue}
              disabled={isGenerating || !dialogueText.trim()}
              className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sintetizando Conversación...</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>Sintetizar Diálogo Completo</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
