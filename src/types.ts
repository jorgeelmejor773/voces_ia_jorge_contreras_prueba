export type VoiceGender = 'femenino' | 'masculino' | 'neutro';

export type VoiceCategory =
  | 'Narración & Audiolibro'
  | 'Comercial & Marketing'
  | 'Podcast & Charla'
  | 'Noticiero & Corporativo'
  | 'Meditación & Calma'
  | 'Asistente & Tutorial';

export type SpanishAccent =
  | 'Español Neutro'
  | 'Español de Colombia'
  | 'Español de México'
  | 'Español de España'
  | 'Español de Argentina'
  | 'Español de Chile'
  | 'Español de Perú'
  | 'Español de Venezuela';

export interface SpanishVoice {
  id: string;
  name: string;
  avatarName: string;
  geminiVoice: 'Kore' | 'Puck' | 'Fenrir' | 'Aoede' | 'Charon' | 'Zephyr';
  gender: VoiceGender;
  accent: SpanishAccent;
  regionDetail?: string;
  category: VoiceCategory;
  description: string;
  previewSentence: string;
  tags: string[];
  recommendedTone: string;
  color: string;
}

export interface TextSegment {
  id: string;
  text: string;
  speakerName: string;
  voiceId: string;
  accent: SpanishAccent;
  tone: string;
  customInstruction: string;
  pauseAfter: number; // in seconds
  status: 'idle' | 'generating' | 'ready' | 'error';
  audioBase64?: string;
  audioDuration?: number;
  errorMessage?: string;
}

export interface GeneratedAudioHistoryItem {
  id: string;
  title: string;
  createdAt: number;
  audioBase64: string;
  duration: number;
  text: string;
  voiceName: string;
  accent: string;
  tone: string;
  byteSize: number;
}

export interface TextTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  defaultVoiceId: string;
  accent: SpanishAccent;
  tone: string;
  content: string;
}
