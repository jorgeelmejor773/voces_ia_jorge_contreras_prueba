import React from 'react';
import { GeneratedAudioHistoryItem } from '../types';
import { Play, Download, Trash2, Clock, Volume2, Globe, FileAudio } from 'lucide-react';
import { formatTime, formatFileSize, downloadBase64Wav } from '../utils/audioUtils';

interface HistoryDrawerProps {
  history: GeneratedAudioHistoryItem[];
  onPlayItem: (item: GeneratedAudioHistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
  currentPlayingId?: string | null;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onPlayItem,
  onDeleteItem,
  onClearAll,
  currentPlayingId,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Historial de Audios Generados</h3>
          <p className="text-xs text-slate-400">
            Tus grabaciones recientes se guardan localmente para reproducir o descargar en cualquier momento.
          </p>
        </div>

        {history.length > 0 && (
          <button
            id="btn-clear-history"
            onClick={onClearAll}
            className="flex items-center space-x-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Borrar Todo</span>
          </button>
        )}
      </div>

      {/* History Items List */}
      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FileAudio className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-800">No hay audios en el historial</h4>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Sintetiza cualquier texto o diálogo para comenzar a construir tu biblioteca de locuciones en español.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const isPlaying = currentPlayingId === item.id;

            return (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-4 transition-all sm:flex-row sm:items-center ${
                  isPlaying
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/10'
                    : 'border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                <div className="flex-1 pr-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-800">{item.title}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      {item.voiceName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      • {item.accent}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-600 line-clamp-2 italic">
                    "{item.text}"
                  </p>

                  <div className="mt-2 flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span>•</span>
                    <span>{formatTime(item.duration)}</span>
                    <span>•</span>
                    <span>{formatFileSize(item.byteSize)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center space-x-2 sm:mt-0">
                  <button
                    id={`btn-play-history-${item.id}`}
                    onClick={() => onPlayItem(item)}
                    className="flex items-center space-x-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Cargar & Reproducir</span>
                  </button>

                  <button
                    id={`btn-download-history-${item.id}`}
                    onClick={() => downloadBase64Wav(item.audioBase64, `${item.title.replace(/\s+/g, '_')}.wav`)}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Descargar WAV"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  <button
                    id={`btn-delete-history-${item.id}`}
                    onClick={() => onDeleteItem(item.id)}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Eliminar de historial"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
