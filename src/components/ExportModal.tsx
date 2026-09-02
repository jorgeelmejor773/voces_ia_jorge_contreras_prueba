import React, { useState } from 'react';
import {
  X,
  Download,
  FileAudio,
  FileText,
  FileCode,
  Share2,
  Check,
  Layers,
  Sparkles,
  Volume2,
} from 'lucide-react';
import {
  downloadBase64Wav,
  downloadBlob,
  generateSrtContent,
  generateVttContent,
  formatFileSize,
  formatTime,
  base64ToUint8Array,
} from '../utils/audioUtils';
import { TextSegment } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioBase64: string | null;
  duration: number;
  currentText: string;
  activeVoiceName: string;
  activeAccent: string;
  activeTone: string;
  segments: TextSegment[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  audioBase64,
  duration,
  currentText,
  activeVoiceName,
  activeAccent,
  activeTone,
  segments,
}) => {
  const [fileName, setFileName] = useState('vozstudio_locucion_es');
  const [copiedDataUri, setCopiedDataUri] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const audioBytes = audioBase64 ? base64ToUint8Array(audioBase64) : null;
  const fileSizeString = audioBytes ? formatFileSize(audioBytes.length) : '0 KB';

  const triggerSuccess = (label: string) => {
    setDownloadSuccess(label);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 1. Download Master WAV
  const handleDownloadWav = () => {
    if (!audioBase64) return;
    downloadBase64Wav(audioBase64, `${fileName}.wav`);
    triggerSuccess('¡Audio WAV descargado!');
  };

  // 2. Download SRT Subtitles
  const handleDownloadSrt = () => {
    const data =
      segments.length > 0
        ? segments.map((s) => ({ text: s.text, speakerName: s.speakerName }))
        : [{ text: currentText, duration: duration }];

    const srt = generateSrtContent(data);
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${fileName}.srt`);
    triggerSuccess('¡Subtítulos SRT descargados!');
  };

  // 3. Download VTT Subtitles
  const handleDownloadVtt = () => {
    const data =
      segments.length > 0
        ? segments.map((s) => ({ text: s.text, speakerName: s.speakerName }))
        : [{ text: currentText, duration: duration }];

    const vtt = generateVttContent(data);
    const blob = new Blob([vtt], { type: 'text/vtt;charset=utf-8' });
    downloadBlob(blob, `${fileName}.vtt`);
    triggerSuccess('¡Subtítulos VTT descargados!');
  };

  // 4. Download Plain Text / Transcript
  const handleDownloadTxt = () => {
    let content = `VOZSTUDIO ESPAÑOL - GUION Y METADATOS\n`;
    content += `Fecha: ${new Date().toLocaleString()}\n`;
    content += `Voz: ${activeVoiceName} (${activeAccent})\n`;
    content += `Tono: ${activeTone}\n`;
    content += `Duración: ${formatTime(duration)}\n`;
    content += `==========================================\n\n`;
    content += currentText;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${fileName}_guion.txt`);
    triggerSuccess('¡Guion TXT descargado!');
  };

  // 5. Download Project JSON
  const handleDownloadJson = () => {
    const projectData = {
      generator: 'VozStudio Español',
      timestamp: Date.now(),
      dateString: new Date().toISOString(),
      metadata: {
        voice: activeVoiceName,
        accent: activeAccent,
        tone: activeTone,
        durationSeconds: duration,
      },
      text: currentText,
      segments: segments,
      audioBase64: audioBase64,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `${fileName}_proyecto.json`);
    triggerSuccess('¡Proyecto JSON descargado!');
  };

  // 6. Download individual segments if available
  const handleDownloadIndividualSegments = () => {
    const readySegments = segments.filter((s) => s.audioBase64);
    if (readySegments.length === 0) return;

    readySegments.forEach((seg, index) => {
      if (seg.audioBase64) {
        setTimeout(() => {
          downloadBase64Wav(
            seg.audioBase64!,
            `${fileName}_segmento_${index + 1}_${seg.speakerName.replace(/\s+/g, '_')}.wav`
          );
        }, index * 250);
      }
    });

    triggerSuccess(`¡Descargando ${readySegments.length} pistas separadas!`);
  };

  // 7. Copy Data URI
  const handleCopyDataUri = () => {
    if (!audioBase64) return;
    navigator.clipboard.writeText(`data:audio/wav;base64,${audioBase64}`);
    setCopiedDataUri(true);
    setTimeout(() => setCopiedDataUri(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Centro de Exportación Rápida
              </h2>
              <p className="text-xs text-slate-400">
                Descarga el audio master en alta calidad, subtítulos sincronizados o código de proyecto.
              </p>
            </div>
          </div>

          <button
            id="btn-close-export-modal"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* File Name Configuration */}
        <div className="mt-5 rounded-2xl bg-slate-50/70 p-4 border border-slate-200">
          <label className="block text-xs font-bold text-slate-700">
            Nombre del Archivo de Exportación
          </label>
          <div className="mt-1.5 flex items-center space-x-2">
            <input
              id="input-export-filename"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="text-xs font-mono text-slate-400">.wav / .srt</span>
          </div>

          {/* Metadata chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-medium">
              Voz: {activeVoiceName}
            </span>
            <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-medium">
              Acento: {activeAccent}
            </span>
            <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-medium">
              Duración: {formatTime(duration)}
            </span>
            <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 font-medium font-mono">
              Tamaño: {fileSizeString}
            </span>
          </div>
        </div>

        {/* Success Alert Banner */}
        {downloadSuccess && (
          <div className="mt-4 flex items-center space-x-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Export Options Grid */}
        <div className="mt-5 space-y-3">
          {/* Main Option: WAV Audio Master */}
          <div className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4 transition-all hover:bg-indigo-50/70 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <FileAudio className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Audio Master WAV (24 kHz HD Studio)
                </h4>
                <p className="text-xs text-slate-500">
                  Formato de audio profesional sin compresión, listo para edición, video o podcast.
                </p>
              </div>
            </div>

            <button
              id="btn-export-master-wav"
              onClick={handleDownloadWav}
              disabled={!audioBase64}
              className="flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Descargar WAV</span>
            </button>
          </div>

          {/* Subtitles: SRT & VTT */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* SRT */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Subtítulos SRT</h5>
                  <p className="text-[11px] text-slate-400">Para YouTube, Premiere, etc.</p>
                </div>
              </div>

              <button
                id="btn-export-srt"
                onClick={handleDownloadSrt}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Descargar .SRT
              </button>
            </div>

            {/* VTT */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Subtítulos VTT</h5>
                  <p className="text-[11px] text-slate-400">WebVTT para reproductores web</p>
                </div>
              </div>

              <button
                id="btn-export-vtt"
                onClick={handleDownloadVtt}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Descargar .VTT
              </button>
            </div>
          </div>

          {/* Secondary Options: TXT, JSON, Base64 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Plain Text */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Guion TXT</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Texto con marcas y metadatos</p>
              </div>
              <button
                id="btn-export-txt"
                onClick={handleDownloadTxt}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Guardar .TXT
              </button>
            </div>

            {/* Project JSON */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Proyecto JSON</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Guarda guion y configuraciones</p>
              </div>
              <button
                id="btn-export-json"
                onClick={handleDownloadJson}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Guardar .JSON
              </button>
            </div>

            {/* Base64 Data URI */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <div>
                <h5 className="text-xs font-bold text-slate-800">Data URI / Base64</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">Para desarrolladores y web</p>
              </div>
              <button
                id="btn-export-copy-data-uri"
                onClick={handleCopyDataUri}
                disabled={!audioBase64}
                className="mt-3 flex items-center justify-center space-x-1 w-full rounded-lg border border-slate-200 bg-slate-50 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {copiedDataUri ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-600">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3 w-3" />
                    <span>Copiar URI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Multi-track export if segments exist */}
          {segments.length > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center space-x-2.5">
                <Layers className="h-5 w-5 text-slate-600" />
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    Exportar {segments.length} Pistas Separadas
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    Descarga cada bloque o personaje como un archivo individual de audio.
                  </p>
                </div>
              </div>

              <button
                id="btn-export-individual-tracks"
                onClick={handleDownloadIndividualSegments}
                className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                Descargar Pistas
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
