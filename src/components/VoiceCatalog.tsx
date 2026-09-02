import React, { useState } from 'react';
import { SpanishVoice, SpanishAccent, VoiceCategory } from '../types';
import { SPANISH_VOICES, SPANISH_ACCENTS } from '../data/voices';
import { Play, Square, Check, Volume2, Search, Sparkles, User, Globe, Tag } from 'lucide-react';

interface VoiceCatalogProps {
  selectedVoiceId: string;
  onSelectVoice: (voice: SpanishVoice) => void;
  onPreviewVoice: (voice: SpanishVoice, text?: string) => Promise<void>;
  previewingVoiceId: string | null;
  isPlayingPreview: boolean;
}

export const VoiceCatalog: React.FC<VoiceCatalogProps> = ({
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
  previewingVoiceId,
  isPlayingPreview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedAccent, setSelectedAccent] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories: VoiceCategory[] = [
    'Narración & Audiolibro',
    'Comercial & Marketing',
    'Podcast & Charla',
    'Noticiero & Corporativo',
    'Meditación & Calma',
    'Asistente & Tutorial',
  ];

  const filteredVoices = SPANISH_VOICES.filter((voice) => {
    const matchesSearch =
      voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voice.accent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (voice.regionDetail ? voice.regionDetail.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      voice.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGender = selectedGender === 'all' || voice.gender === selectedGender;
    const matchesAccent = selectedAccent === 'all' || voice.accent === selectedAccent;
    const matchesCategory = selectedCategory === 'all' || voice.category === selectedCategory;

    return matchesSearch && matchesGender && matchesAccent && matchesCategory;
  });

  const getAccentFlag = (accent: string) => {
    if (accent.includes('Colombia')) return '🇨🇴';
    if (accent.includes('México') || accent.includes('Mexico')) return '🇲🇽';
    if (accent.includes('España')) return '🇪🇸';
    if (accent.includes('Argentina')) return '🇦🇷';
    if (accent.includes('Chile')) return '🇨🇱';
    if (accent.includes('Perú')) return '🇵🇪';
    if (accent.includes('Venezuela')) return '🇻🇪';
    return '🌎';
  };

  const getAccentCount = (accent: string) => {
    return SPANISH_VOICES.filter((v) => v.accent === accent).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-voices"
              type="text"
              placeholder="Buscar por nombre, acento, uso (ej: audiolibro, México, cálida)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Gender Filter Buttons */}
          <div className="flex items-center space-x-1 rounded-xl bg-slate-100 p-1 border border-slate-200/50">
            <button
              id="filter-gender-all"
              onClick={() => setSelectedGender('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                selectedGender === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todas ({SPANISH_VOICES.length})
            </button>
            <button
              id="filter-gender-femenino"
              onClick={() => setSelectedGender('femenino')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                selectedGender === 'femenino'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Femeninas
            </button>
            <button
              id="filter-gender-masculino"
              onClick={() => setSelectedGender('masculino')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                selectedGender === 'masculino'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/50'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Masculinas
            </button>
          </div>
        </div>

        {/* Categories & Accent Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Categoría:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accent Filter */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Acento / País:
          </span>
          <button
            onClick={() => setSelectedAccent('all')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              selectedAccent === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({SPANISH_VOICES.length})
          </button>
          {SPANISH_ACCENTS.map((accent) => {
            const count = getAccentCount(accent);
            if (count === 0) return null;
            const flag = getAccentFlag(accent);
            const label = accent.replace('Español de ', '').replace('Español ', '');

            return (
              <button
                key={accent}
                onClick={() => setSelectedAccent(accent)}
                className={`flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                  selectedAccent === accent
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{flag}</span>
                <span>{label}</span>
                <span className={`text-[10px] ${selectedAccent === accent ? 'text-indigo-100' : 'text-slate-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voices Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPreviewing = previewingVoiceId === voice.id && isPlayingPreview;
          const flag = getAccentFlag(voice.accent);

          return (
            <div
              key={voice.id}
              id={`voice-card-${voice.id}`}
              className={`relative flex flex-col justify-between rounded-2xl border bg-white p-5 transition-all ${
                isSelected
                  ? 'border-indigo-600 shadow-md ring-2 ring-indigo-500/20 bg-indigo-50/10'
                  : 'border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header of the Card */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${voice.color} text-white font-bold text-lg shadow-sm`}
                    >
                      {voice.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-800">{voice.name}</h3>
                        <span className="text-xs text-slate-400 font-mono">
                          ({voice.geminiVoice})
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                        <span>{flag}</span>
                        <span>{voice.accent.replace('Español de ', '').replace('Español ', '')}</span>
                        <span>•</span>
                        <span className="capitalize">{voice.gender}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="flex items-center space-x-1 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                      <Check className="h-3.5 w-3.5" />
                      <span>Activa</span>
                    </span>
                  )}
                </div>

                {/* Category & Regional Sub-accent */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    {voice.category}
                  </span>
                  {voice.regionDetail && (
                    <span className="inline-block rounded-md bg-indigo-50 border border-indigo-100/60 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                      📍 {voice.regionDetail}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="mt-2.5 text-xs leading-relaxed text-slate-600">
                  {voice.description}
                </p>

                {/* Sample Sentence Quote Box */}
                <div className="mt-3 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <p className="text-[11px] italic text-slate-600 leading-snug">
                    "{voice.previewSentence}"
                  </p>
                </div>

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {voice.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Preview Sample & Select */}
              <div className="mt-5 flex items-center space-x-2 border-t border-slate-100 pt-4">
                <button
                  id={`btn-preview-${voice.id}`}
                  onClick={() => onPreviewVoice(voice)}
                  className={`flex flex-1 items-center justify-center space-x-1.5 rounded-xl border py-2 text-xs font-bold transition-all ${
                    isPreviewing
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isPreviewing ? (
                    <>
                      <Square className="h-3.5 w-3.5 fill-current text-indigo-600" />
                      <span>Detener</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>Muestra</span>
                    </>
                  )}
                </button>

                <button
                  id={`btn-select-${voice.id}`}
                  onClick={() => onSelectVoice(voice)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isSelected ? 'Seleccionada' : 'Usar Voz'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredVoices.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm font-medium text-slate-600">
            No se encontraron voces con los filtros seleccionados.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGender('all');
              setSelectedAccent('all');
              setSelectedCategory('all');
            }}
            className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            Restablecer Filtros
          </button>
        </div>
      )}
    </div>
  );
};
