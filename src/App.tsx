import React, { useState, useEffect, useRef } from 'react';
import {
  SpanishVoice,
  SpanishAccent,
  TextSegment,
  GeneratedAudioHistoryItem,
  TextTemplate,
} from './types';
import { SPANISH_VOICES, SPANISH_ACCENTS, VOICE_TONES } from './data/voices';
import { Header } from './components/Header';
import { VoiceCatalog } from './components/VoiceCatalog';
import { TextWorkspace } from './components/TextWorkspace';
import { AudioStudioPlayer } from './components/AudioStudioPlayer';
import { TemplatesModal } from './components/TemplatesModal';
import { ExportModal } from './components/ExportModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ApiKeyModal } from './components/ApiKeyModal';
import { concatenateWavBuffers, base64ToUint8Array } from './utils/audioUtils';
import {
  synthesizeTTS,
  enhanceClientSideText,
  getStoredApiKey,
  isStaticHosting,
} from './utils/geminiClient';
import { AlertCircle, CheckCircle2, Sparkles, X, KeyRound } from 'lucide-react';

const STORAGE_KEY_HISTORY = 'vozstudio_history_v1';
const STORAGE_KEY_LAST_TEXT = 'vozstudio_last_text_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'editor' | 'voices' | 'history'>('editor');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Text & Speech Configuration
  const [freeText, setFreeText] = useState<string>(() => {
    return (
      localStorage.getItem(STORAGE_KEY_LAST_TEXT) ||
      'Bienvenidos a VozStudio Español. Este estudio te permite colocar cualquier texto, guion o diálogo, elegir entre una variedad de voces organizadas por acento y emoción, y exportar tus audios con la máxima calidad.'
    );
  });

  const [selectedVoice, setSelectedVoice] = useState<SpanishVoice>(SPANISH_VOICES[0]);
  const [selectedAccent, setSelectedAccent] = useState<SpanishAccent>(SPANISH_VOICES[0].accent);
  const [selectedTone, setSelectedTone] = useState<string>(SPANISH_VOICES[0].recommendedTone);
  const [customInstruction, setCustomInstruction] = useState<string>('');

  // Segments Mode
  const [segments, setSegments] = useState<TextSegment[]>([
    {
      id: 'seg-1',
      text: 'Bienvenidos al primer bloque de narración. Aquí puedes definir un tono cálido y pausado.',
      speakerName: 'Párrafo 1 (Narrador)',
      voiceId: 'kore-sofia',
      accent: 'Español Neutro',
      tone: 'Cálido y envolvente',
      customInstruction: '',
      pauseAfter: 0.6,
      status: 'idle',
    },
    {
      id: 'seg-2',
      text: '¡Y en este segundo bloque podemos cambiar a una voz con acento colombiano o mexicano para dar mayor dinamismo!',
      speakerName: 'Párrafo 2 (Comercial)',
      voiceId: 'puck-mateo-mexico',
      accent: 'Español de México',
      tone: 'Entusiasta y comercial',
      customInstruction: '',
      pauseAfter: 0.5,
      status: 'idle',
    },
  ]);

  // Dialogue Mode
  const [speaker1VoiceId, setSpeaker1VoiceId] = useState<string>('kore-sofia');
  const [speaker2VoiceId, setSpeaker2VoiceId] = useState<string>('puck-mateo-mexico');
  const [dialogueText, setDialogueText] = useState<string>(
    'Sofía: ¡Hola Mateo! Qué bueno verte por el estudio de grabación.\nMateo: ¡Hola Sofía! Estaba revisando las nuevas voces de Colombia y México y suenan increíblemente naturales.\nSofía: Así es, podemos ajustar el acento regional y la emoción para cada proyecto.'
  );

  // Active Audio State
  const [activeAudioBase64, setActiveAudioBase64] = useState<string | null>(null);
  const [activeAudioDuration, setActiveAudioDuration] = useState<number>(0);
  const [activeTrackTitle, setActiveTrackTitle] = useState<string>('Locución de Bienvenida');

  // History State
  const [history, setHistory] = useState<GeneratedAudioHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Modals & Notifications
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Loading States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // Voice Preview State
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Error saving history to localStorage:', e);
    }
  }, [history]);

  // Save text to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LAST_TEXT, freeText);
  }, [freeText]);

  const showSuccess = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  // Helper to add audio to history
  const addToHistory = (
    title: string,
    audioBase64: string,
    duration: number,
    text: string,
    voiceName: string,
    accent: string,
    tone: string
  ) => {
    const bytes = base64ToUint8Array(audioBase64);
    const newItem: GeneratedAudioHistoryItem = {
      id: `item-${Date.now()}`,
      title,
      createdAt: Date.now(),
      audioBase64,
      duration,
      text,
      voiceName,
      accent,
      tone,
      byteSize: bytes.length,
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 24)]);
  };

  // 1. Synthesize Free Text
  const handleGenerateFreeText = async () => {
    if (!freeText.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const data = await synthesizeTTS({
        text: freeText,
        voiceName: selectedVoice.geminiVoice,
        accent: selectedAccent,
        tone: selectedTone,
        customInstruction: customInstruction,
      });

      setActiveAudioBase64(data.audioBase64);
      setActiveAudioDuration(data.duration);
      const title = `${selectedVoice.name} - ${freeText.slice(0, 30).trim()}...`;
      setActiveTrackTitle(title);

      addToHistory(
        title,
        data.audioBase64,
        data.duration,
        freeText,
        selectedVoice.name,
        selectedAccent,
        selectedTone
      );

      showSuccess('¡Audio en español sintetizado con éxito!');
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('API Key')) {
        setIsApiKeyModalOpen(true);
      }
      showError(err.message || 'Error al conectar con el servicio de voz.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Synthesize a single segment block
  const handleGenerateSegment = async (segmentId: string) => {
    const seg = segments.find((s) => s.id === segmentId);
    if (!seg || !seg.text.trim()) return;

    setIsGenerating(true);
    setActiveSegmentId(segmentId);
    setErrorMessage(null);

    const voice = SPANISH_VOICES.find((v) => v.id === seg.voiceId) || selectedVoice;

    try {
      const data = await synthesizeTTS({
        text: seg.text,
        voiceName: voice.geminiVoice,
        accent: seg.accent,
        tone: seg.tone,
        customInstruction: seg.customInstruction,
      });

      // Update segment with audio
      setSegments((prev) =>
        prev.map((s) =>
          s.id === segmentId
            ? {
                ...s,
                status: 'ready',
                audioBase64: data.audioBase64,
                audioDuration: data.duration,
              }
            : s
        )
      );

      setActiveAudioBase64(data.audioBase64);
      setActiveAudioDuration(data.duration);
      setActiveTrackTitle(`${seg.speakerName} - ${voice.name}`);

      showSuccess(`¡Bloque "${seg.speakerName}" generado!`);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('API Key')) {
        setIsApiKeyModalOpen(true);
      }
      showError(err.message || 'Error en bloque.');
    } finally {
      setIsGenerating(false);
      setActiveSegmentId(null);
    }
  };

  // 3. Synthesize ALL segment blocks & Merge
  const handleGenerateAllSegments = async () => {
    if (segments.length === 0) return;

    setIsGenerating(true);
    setErrorMessage(null);

    const audioChunks: string[] = [];
    let totalDur = 0;

    try {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (!seg.text.trim()) continue;

        setActiveSegmentId(seg.id);
        const voice = SPANISH_VOICES.find((v) => v.id === seg.voiceId) || selectedVoice;

        const data = await synthesizeTTS({
          text: seg.text,
          voiceName: voice.geminiVoice,
          accent: seg.accent,
          tone: seg.tone,
          customInstruction: seg.customInstruction,
        });

        audioChunks.push(data.audioBase64);
        totalDur += data.duration + (seg.pauseAfter || 0.5);

        // Update segment state
        setSegments((prev) =>
          prev.map((s) =>
            s.id === seg.id
              ? {
                  ...s,
                  status: 'ready',
                  audioBase64: data.audioBase64,
                  audioDuration: data.duration,
                }
              : s
          )
        );
      }

      if (audioChunks.length > 0) {
        // Concatenate all WAV buffers
        const mergedWavBase64 = concatenateWavBuffers(audioChunks, 0.5);
        setActiveAudioBase64(mergedWavBase64);
        setActiveAudioDuration(totalDur);
        const masterTitle = `Guion Completo (${segments.length} bloques)`;
        setActiveTrackTitle(masterTitle);

        addToHistory(
          masterTitle,
          mergedWavBase64,
          totalDur,
          segments.map((s) => `[${s.speakerName}]: ${s.text}`).join('\n\n'),
          'Multi-Voz',
          'Varios Acentos',
          'Producción de Guion'
        );

        showSuccess('¡Todos los bloques fueron sintetizados y unidos con éxito!');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('API Key')) {
        setIsApiKeyModalOpen(true);
      }
      showError(err.message || 'Error al procesar todos los bloques.');
    } finally {
      setIsGenerating(false);
      setActiveSegmentId(null);
    }
  };

  // 4. Synthesize 2-Speaker Dialogue
  const handleGenerateDialogue = async () => {
    if (!dialogueText.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);

    const spk1 = SPANISH_VOICES.find((v) => v.id === speaker1VoiceId) || SPANISH_VOICES[0];
    const spk2 = SPANISH_VOICES.find((v) => v.id === speaker2VoiceId) || SPANISH_VOICES[1];

    try {
      const data = await synthesizeTTS({
        text: dialogueText,
        multiSpeaker: true,
        speakerVoiceConfigs: [
          { speaker: spk1.name, voiceName: spk1.geminiVoice },
          { speaker: spk2.name, voiceName: spk2.geminiVoice },
        ],
      });

      setActiveAudioBase64(data.audioBase64);
      setActiveAudioDuration(data.duration);
      const title = `Diálogo: ${spk1.name} & ${spk2.name}`;
      setActiveTrackTitle(title);

      addToHistory(
        title,
        data.audioBase64,
        data.duration,
        dialogueText,
        `${spk1.name} + ${spk2.name}`,
        'Español Multi-Locutor',
        'Conversación Guionada'
      );

      showSuccess('¡Diálogo entre locutores sintetizado con éxito!');
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('API Key')) {
        setIsApiKeyModalOpen(true);
      }
      showError(err.message || 'Error al generar diálogo.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. Enhance text using AI for Spanish natural pauses & phonetics
  const handleEnhanceText = async (mode: string) => {
    if (!freeText.trim()) return;

    setIsEnhancing(true);
    try {
      if (!isStaticHosting()) {
        try {
          const res = await fetch('/api/tts/enhance-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: freeText, mode }),
          });
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const data = await res.json();
            if (data.success && data.enhancedText) {
              setFreeText(data.enhancedText);
              showSuccess('¡Texto optimizado para locución en español!');
              return;
            }
          }
        } catch {
          // fallback to client side
        }
      }

      const enhancedText = await enhanceClientSideText(freeText, mode);
      setFreeText(enhancedText);
      showSuccess('¡Texto optimizado para locución en español!');
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('API Key')) {
        setIsApiKeyModalOpen(true);
      }
      showError(err.message || 'No se pudo optimizar el texto.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // 6. Voice preview sound
  const handlePreviewVoice = async (voice: SpanishVoice, sampleText?: string) => {
    if (previewingVoiceId === voice.id && isPlayingPreview) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setIsPlayingPreview(false);
      setPreviewingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(voice.id);
    setIsPlayingPreview(true);

    try {
      const textToSpeak = sampleText || voice.previewSentence;
      const data = await synthesizeTTS({
        text: textToSpeak,
        voiceName: voice.geminiVoice,
        accent: voice.accent,
        tone: voice.recommendedTone,
      });

      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio();
      }

      previewAudioRef.current.src = `data:audio/wav;base64,${data.audioBase64}`;
      previewAudioRef.current.onended = () => {
        setIsPlayingPreview(false);
        setPreviewingVoiceId(null);
      };
      await previewAudioRef.current.play();
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('API Key')) {
        setIsApiKeyModalOpen(true);
      }
      showError(err.message || 'Error al obtener muestra de voz');
      setIsPlayingPreview(false);
      setPreviewingVoiceId(null);
    }
  };

  // Select template
  const handleSelectTemplate = (template: TextTemplate) => {
    setFreeText(template.content);
    const v = SPANISH_VOICES.find((item) => item.id === template.defaultVoiceId);
    if (v) {
      setSelectedVoice(v);
      setSelectedAccent(template.accent);
      setSelectedTone(template.tone);
    }
    setActiveTab('editor');
    showSuccess(`Plantilla "${template.title}" cargada.`);
  };

  // Replay from history
  const handlePlayHistoryItem = (item: GeneratedAudioHistoryItem) => {
    setActiveAudioBase64(item.audioBase64);
    setActiveAudioDuration(item.duration);
    setActiveTrackTitle(item.title);
    setFreeText(item.text);
    setActiveTab('editor');
    showSuccess(`Cargado "${item.title}"`);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 font-sans antialiased selection:bg-indigo-200">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTemplates={() => setIsTemplatesModalOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenApiKey={() => setIsApiKeyModalOpen(true)}
        historyCount={history.length}
        hasActiveAudio={!!activeAudioBase64}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Notifications */}
        {successToast && (
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-md">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)}>
              <X className="h-4 w-4 opacity-80 hover:opacity-100" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)}>
              <X className="h-4 w-4 opacity-80 hover:opacity-100" />
            </button>
          </div>
        )}

        {/* Tab 1: Text Placement & Studio Editor */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* Audio Studio Player */}
            <AudioStudioPlayer
              audioBase64={activeAudioBase64}
              duration={activeAudioDuration}
              title={activeTrackTitle}
              voiceInfo={`${selectedVoice.name} (${selectedAccent})`}
              onOpenExport={() => setIsExportModalOpen(true)}
            />

            {/* Central Text Placement Workspace */}
            <TextWorkspace
              freeText={freeText}
              setFreeText={setFreeText}
              selectedVoice={selectedVoice}
              onSelectVoice={(v) => {
                setSelectedVoice(v);
                setSelectedAccent(v.accent);
                setSelectedTone(v.recommendedTone);
              }}
              selectedAccent={selectedAccent}
              setSelectedAccent={setSelectedAccent}
              selectedTone={selectedTone}
              setSelectedTone={setSelectedTone}
              customInstruction={customInstruction}
              setCustomInstruction={setCustomInstruction}
              segments={segments}
              setSegments={setSegments}
              speaker1VoiceId={speaker1VoiceId}
              setSpeaker1VoiceId={setSpeaker1VoiceId}
              speaker2VoiceId={speaker2VoiceId}
              setSpeaker2VoiceId={setSpeaker2VoiceId}
              dialogueText={dialogueText}
              setDialogueText={setDialogueText}
              onGenerateFreeText={handleGenerateFreeText}
              onGenerateSegment={handleGenerateSegment}
              onGenerateAllSegments={handleGenerateAllSegments}
              onGenerateDialogue={handleGenerateDialogue}
              onEnhanceText={handleEnhanceText}
              isGenerating={isGenerating}
              isEnhancing={isEnhancing}
              activeSegmentId={activeSegmentId}
            />
          </div>
        )}

        {/* Tab 2: Organized Spanish Voices Catalog */}
        {activeTab === 'voices' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Catálogo de Voces en Español Organizadas
                  </h2>
                  <p className="text-xs text-slate-400">
                    Explora y escucha muestras de cada voz antes de sintetizar tus guiones. Clasificadas por región, género y propósito.
                  </p>
                </div>
              </div>
            </div>

            <VoiceCatalog
              selectedVoiceId={selectedVoice.id}
              onSelectVoice={(v) => {
                setSelectedVoice(v);
                setSelectedAccent(v.accent);
                setSelectedTone(v.recommendedTone);
                setActiveTab('editor');
                showSuccess(`Voz seleccionada: ${v.name} (${v.accent})`);
              }}
              onPreviewVoice={handlePreviewVoice}
              previewingVoiceId={previewingVoiceId}
              isPlayingPreview={isPlayingPreview}
            />
          </div>
        )}

        {/* Tab 3: History & Saved Clips */}
        {activeTab === 'history' && (
          <HistoryDrawer
            history={history}
            onPlayItem={handlePlayHistoryItem}
            onDeleteItem={(id) => {
              setHistory((prev) => prev.filter((item) => item.id !== id));
              showSuccess('Audio eliminado del historial.');
            }}
            onClearAll={() => {
              setHistory([]);
              showSuccess('Historial vaciado.');
            }}
          />
        )}
      </main>

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Export Hub Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        audioBase64={activeAudioBase64}
        duration={activeAudioDuration}
        currentText={freeText}
        activeVoiceName={selectedVoice.name}
        activeAccent={selectedAccent}
        activeTone={selectedTone}
        segments={segments}
      />

      {/* Gemini API Key Configuration Modal for GitHub Pages */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
}
