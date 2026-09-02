import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Repeat,
  Sparkles,
  Sliders,
  Check,
  Music,
} from 'lucide-react';
import { formatTime, downloadBase64Wav } from '../utils/audioUtils';

interface AudioStudioPlayerProps {
  audioBase64: string | null;
  duration?: number;
  title?: string;
  voiceInfo?: string;
  onOpenExport?: () => void;
}

export const AudioStudioPlayer: React.FC<AudioStudioPlayerProps> = ({
  audioBase64,
  duration = 0,
  title = 'Audio Sintetizado',
  voiceInfo,
  onOpenExport,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Audio source setup
  useEffect(() => {
    if (!audioBase64) {
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = `data:audio/wav;base64,${audioBase64}`;
      audioRef.current.load();
      setIsPlaying(false);
    }
  }, [audioBase64]);

  useEffect(() => {
    if (duration > 0) {
      setTotalDuration(duration);
    }
  }, [duration]);

  // Visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const numBars = 48;
      const barWidth = width / numBars - 2;
      const centerY = height / 2;

      for (let i = 0; i < numBars; i++) {
        let barHeight = 4;
        if (isPlaying) {
          // Dynamic sine wave calculation based on current playback
          const progress = totalDuration > 0 ? currentTime / totalDuration : 0;
          const distFromProgress = Math.abs(i / numBars - progress);
          const activeFactor = Math.max(0.2, 1 - distFromProgress * 2);

          const sinVal = Math.sin(phase + i * 0.25) * Math.cos(phase * 0.8 + i * 0.1);
          barHeight = 6 + Math.abs(sinVal) * (height * 0.4) * activeFactor;
        } else {
          barHeight = 4 + (Math.sin(i * 0.3) + 1) * 3;
        }

        const x = i * (barWidth + 2);
        const y = centerY - barHeight / 2;

        const isPassed = totalDuration > 0 ? i / numBars <= currentTime / totalDuration : false;

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPassed) {
          grad.addColorStop(0, '#6366f1'); // indigo-500
          grad.addColorStop(1, '#4f46e5'); // indigo-600
        } else {
          grad.addColorStop(0, '#e2e8f0'); // slate-200
          grad.addColorStop(1, '#cbd5e1'); // slate-300
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, Math.max(2, barWidth), barHeight, 4);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.15;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, totalDuration]);

  const togglePlay = () => {
    if (!audioRef.current || !audioBase64) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Error al reproducir audio:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setTotalDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
    }
  };

  const handleEnded = () => {
    if (!isLooping) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleQuickDownload = () => {
    if (!audioBase64) return;
    const sanitizedTitle = (title || 'vozstudio_audio').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadBase64Wav(audioBase64, `${sanitizedTitle}.wav`);
  };

  const handleCopyBase64 = () => {
    if (!audioBase64) return;
    navigator.clipboard.writeText(`data:audio/wav;base64,${audioBase64}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!audioBase64) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 text-indigo-600">
          <Music className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-slate-800">Reproductor y Visualizador de Estudio</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
          Escribe o selecciona un texto y haz clic en "Sintetizar Voz" para escuchar y visualizar el audio generado con precisión geométrica.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
      />

      {/* Track Info Header with geometric accents */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-800 truncate max-w-sm sm:max-w-md">
              {title}
            </h3>
          </div>
          {voiceInfo && (
            <p className="mt-0.5 text-xs text-slate-400">
              Voz: <span className="font-semibold text-slate-700">{voiceInfo}</span> • 24 kHz HD Master Lossless
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-copy-audio-data"
            onClick={handleCopyBase64}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            title="Copiar Data URI de audio"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600">¡Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Copiar URI</span>
              </>
            )}
          </button>

          <button
            id="btn-quick-download-wav"
            onClick={handleQuickDownload}
            className="flex items-center space-x-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-98"
            title="Descargar archivo WAV sin pérdidas"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Descargar WAV</span>
          </button>
        </div>
      </div>

      {/* Waveform Visualizer Section */}
      <div className="mt-4 rounded-xl bg-slate-50/70 border border-slate-100 p-4">
        <div className="flex justify-between items-center mb-2 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Visualización de Onda</span>
          <span className="text-indigo-600 font-mono font-semibold text-xs">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>

        <div className="relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={64}
            className="h-16 w-full rounded-lg"
          />

          {/* Custom Overlay Seek Slider */}
          <input
            id="audio-seek-slider"
            type="range"
            min={0}
            max={totalDuration || 1}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-player-restart"
            onClick={handleRestart}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Reiniciar desde el principio"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            id="btn-player-play-pause"
            onClick={togglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            id="btn-player-loop"
            onClick={toggleLoop}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              isLooping
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={isLooping ? 'Repetición activada' : 'Activar repetición'}
          >
            <Repeat className="h-4 w-4" />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center space-x-1 rounded-xl bg-slate-100 p-1 border border-slate-200/50">
          {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
            <button
              key={speed}
              id={`btn-speed-${speed}`}
              onClick={() => handleSpeedChange(speed)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                playbackRate === speed
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Volume Controls */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-toggle-mute"
            onClick={toggleMute}
            className="text-slate-400 hover:text-slate-700"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4 text-red-500" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            id="slider-volume"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1.5 w-20 cursor-pointer accent-indigo-600 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};
