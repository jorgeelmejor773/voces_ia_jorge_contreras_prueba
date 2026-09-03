import { GoogleGenAI, Modality } from '@google/genai';
import { base64ToUint8Array, uint8ArrayToBase64 } from './audioUtils';

const STORAGE_KEY = 'VOZSTUDIO_GEMINI_API_KEY';

export function isStaticHosting(): boolean {
  if (typeof window === 'undefined') return false;
  // If running on GitHub Pages (github.io), custom domain without port 3000, or file protocol
  return (
    window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('pages.dev') ||
    window.location.protocol === 'file:' ||
    (window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      window.location.port !== '3000')
  );
}

export function getStoredApiKey(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_KEY) || '';
  }
  return '';
}

export function setStoredApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export function wrapPcmInWavBytes(
  pcmBytes: Uint8Array,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Uint8Array {
  if (
    pcmBytes.length >= 4 &&
    pcmBytes[0] === 0x52 && // R
    pcmBytes[1] === 0x49 && // I
    pcmBytes[2] === 0x46 && // F
    pcmBytes[3] === 0x46 // F
  ) {
    return pcmBytes;
  }

  const dataLength = pcmBytes.length;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = new Uint8Array(44 + dataLength);
  const view = new DataView(buffer.buffer);

  // "RIFF"
  buffer.set([0x52, 0x49, 0x46, 0x46], 0);
  view.setUint32(4, 36 + dataLength, true);
  // "WAVE"
  buffer.set([0x57, 0x41, 0x56, 0x45], 8);
  // "fmt "
  buffer.set([0x66, 0x6d, 0x74, 0x20], 12);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  // "data"
  buffer.set([0x64, 0x61, 0x74, 0x61], 36);
  view.setUint32(40, dataLength, true);

  buffer.set(pcmBytes, 44);
  return buffer;
}

export interface TTSGenerateParams {
  text: string;
  voiceName?: string;
  accent?: string;
  tone?: string;
  customInstruction?: string;
  multiSpeaker?: boolean;
  speakerVoiceConfigs?: Array<{ speaker: string; voiceName: string }>;
  apiKeyOverride?: string;
}

export interface TTSResult {
  audioBase64: string;
  duration: number;
  mimeType: string;
  sampleRate: number;
  bytes: number;
}

// Generate TTS directly via client-side Gemini SDK (when server is not present e.g. GitHub Pages)
export async function generateClientSideTTS(params: TTSGenerateParams): Promise<TTSResult> {
  const apiKey = params.apiKeyOverride || getStoredApiKey();
  if (!apiKey) {
    throw new Error(
      'Configura tu Gemini API Key en el botón "API Key" de la barra superior para generar voz en GitHub Pages.'
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  let promptText = '';
  if (
    params.multiSpeaker &&
    Array.isArray(params.speakerVoiceConfigs) &&
    params.speakerVoiceConfigs.length === 2
  ) {
    promptText = `TTS the following conversation in Spanish with natural pronunciation:\n${params.text}`;
  } else {
    const styleParts: string[] = [];
    if (params.accent) styleParts.push(`acento ${params.accent}`);
    if (params.tone) styleParts.push(`tono ${params.tone}`);
    if (params.customInstruction && params.customInstruction.trim()) {
      styleParts.push(params.customInstruction.trim());
    }

    const styleGuidance = styleParts.length > 0 ? ` con ${styleParts.join(', ')}` : '';
    promptText = `Lee en español${styleGuidance}: ${params.text}`;
  }

  const speechConfig: any = {};
  if (
    params.multiSpeaker &&
    Array.isArray(params.speakerVoiceConfigs) &&
    params.speakerVoiceConfigs.length === 2
  ) {
    speechConfig.multiSpeakerVoiceConfig = {
      speakerVoiceConfigs: [
        {
          speaker: params.speakerVoiceConfigs[0].speaker || 'Locutor 1',
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: params.speakerVoiceConfigs[0].voiceName || 'Kore' },
          },
        },
        {
          speaker: params.speakerVoiceConfigs[1].speaker || 'Locutor 2',
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: params.speakerVoiceConfigs[1].voiceName || 'Puck' },
          },
        },
      ],
    };
  } else {
    speechConfig.voiceConfig = {
      prebuiltVoiceConfig: { voiceName: params.voiceName || 'Kore' },
    };
  }

  const ttsModels = [
    'gemini-2.5-flash-preview-tts',
    'gemini-2.5-pro-preview-tts',
    'gemini-3.1-flash-tts-preview',
  ];

  let lastError: any = null;
  for (const model of ttsModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig,
        },
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.[0];
      const rawBase64 = audioPart?.inlineData?.data;

      if (!rawBase64) {
        continue;
      }

      const rawPcmBytes = base64ToUint8Array(rawBase64);
      const wavBytes = wrapPcmInWavBytes(rawPcmBytes, 24000, 1, 16);
      const wavBase64 = uint8ArrayToBase64(wavBytes);
      const duration = parseFloat((rawPcmBytes.length / (24000 * 2)).toFixed(2));

      return {
        audioBase64: wavBase64,
        duration,
        mimeType: 'audio/wav',
        sampleRate: 24000,
        bytes: wavBytes.length,
      };
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || err || '');
      if (
        msg.includes('API_KEY_INVALID') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('403') ||
        msg.includes('400')
      ) {
        throw new Error(
          'La Gemini API Key ingresada no es válida o no tiene permisos. Revisa la clave en el botón "API Key".'
        );
      }
      // If 404 or 503, try next model in loop
      continue;
    }
  }

  const errStr = String(lastError?.message || lastError || '');
  if (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand')) {
    throw new Error('Los servidores de voz de Gemini están recibiendo alta demanda en este momento. Por favor intenta de nuevo en unos segundos.');
  }
  if (errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('429')) {
    throw new Error('Límite de cuota alcanzado en tu API Key. Espera unos segundos antes de reintentar.');
  }
  throw new Error(lastError?.message || 'No se pudo generar el audio con el modelo de voz.');
}

// Enhance text directly with Gemini 3.7 Flash if server /api/ is unavailable
export async function enhanceClientSideText(text: string, mode = 'fluidez'): Promise<string> {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('Configura tu Gemini API Key en el botón "API Key" para optimizar texto.');
  }

  const ai = new GoogleGenAI({ apiKey });

  let instruction = 'Eres un editor de guiones para locución y locutores profesionales en español.';
  if (mode === 'fluidez') {
    instruction +=
      ' Mejora la puntuación (agrega signos ¿ ?, ¡ !, comas para pausas de respiración naturales, escribe números en palabras completas si mejora la lectura), manteniendo el mensaje exacto intacto.';
  } else if (mode === 'dramatismo') {
    instruction +=
      ' Añade pausas expresivas (puntos suspensivos, exclamaciones bien puestas) para dar mayor dramatismo y emoción al texto sin alterar su significado clave.';
  } else if (mode === 'comercial') {
    instruction +=
      ' Optimiza el texto para un spot comercial dinámico, persuasivo y con excelente ritmo de locución.';
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: `Optimiza este texto para locución en español:\n\n"${text}"\n\nDevuelve ÚNICAMENTE el texto mejorado, sin explicaciones ni comillas extras.`,
    config: {
      systemInstruction: instruction,
      temperature: 0.3,
    },
  });

  return response.text ? response.text.trim() : text;
}

// Unified TTS synthesis: tries backend API first, automatically falls back to client SDK
export async function synthesizeTTS(params: TTSGenerateParams): Promise<TTSResult> {
  // If running on a static host like GitHub Pages, bypass server and generate directly on client
  if (isStaticHosting()) {
    return await generateClientSideTTS(params);
  }

  try {
    const res = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const contentType = res.headers.get('content-type') || '';
    if (res.status === 404 || !contentType.includes('application/json')) {
      return await generateClientSideTTS(params);
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error en el servidor de síntesis.');
    }

    return {
      audioBase64: data.audioBase64,
      duration: data.duration,
      mimeType: data.mimeType || 'audio/wav',
      sampleRate: data.sampleRate || 24000,
      bytes: data.bytes || 0,
    };
  } catch (err: any) {
    // If anything fails on the server request, try client-side generation
    if (
      err.name === 'SyntaxError' ||
      (err.message &&
        (err.message.includes('JSON') ||
          err.message.includes('Failed to fetch') ||
          err.message.includes('NetworkError') ||
          err.message.includes('404')))
    ) {
      return await generateClientSideTTS(params);
    }
    throw err;
  }
}
