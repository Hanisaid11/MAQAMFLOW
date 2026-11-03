import React from 'react';
import { MaqamMatch } from '../utils/pitchDetector';
import { MaqamDefinition } from '../utils/maqamData';
import { soundSynth } from '../utils/soundSynth';
import { useLanguage } from '../context/LanguageContext';
import { Play, Volume2, Sparkles, BookOpen, Music, Mic, Square } from 'lucide-react';

interface MaqamRadarProps {
  matches: MaqamMatch[];
  selectedMaqam: MaqamDefinition;
  onSelectMaqam: (maqam: MaqamDefinition) => void;
  onClearHistory: () => void;
}

export const MaqamRadar: React.FC<MaqamRadarProps> = ({
  matches,
  selectedMaqam,
  onSelectMaqam,
  onClearHistory,
}) => {
  const { t, lang, isRTL } = useLanguage();
  const [isPlayingVocal, setIsPlayingVocal] = React.useState(false);
  const vocalAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const playVocalAhhaat = (maqam: MaqamDefinition) => {
    if (isPlayingVocal && vocalAudioRef.current) {
      vocalAudioRef.current.pause();
      vocalAudioRef.current.currentTime = 0;
      setIsPlayingVocal(false);
      return;
    }

    const url = maqam.vocalSampleUrl || '/audio/ah-haat/bayati_human_voice.mp3';
    const audio = new Audio(url);
    vocalAudioRef.current = audio;

    audio.onended = () => {
      setIsPlayingVocal(false);
    };

    audio.play().catch(console.error);
    setIsPlayingVocal(true);
  };

  React.useEffect(() => {
    return () => {
      if (vocalAudioRef.current) {
        vocalAudioRef.current.pause();
      }
    };
  }, []);

  const playScaleAudio = (maqam: MaqamDefinition) => {
    let delay = 0;
    // Ascend
    maqam.scaleDegrees.forEach((deg) => {
      setTimeout(() => {
        soundSynth.playOudNote(deg.frequency, 1.2);
      }, delay);
      delay += 350;
    });
    // Brief pause then descend top 3
    delay += 200;
    [...maqam.scaleDegrees].reverse().slice(1, 4).forEach((deg) => {
      setTimeout(() => {
        soundSynth.playOudNote(deg.frequency, 1.2);
      }, delay);
      delay += 350;
    });
  };

  const topMatch = matches[0]?.maqam || selectedMaqam;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Left Column: Live Ranked Detection Meter */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              {t('nearestMaqam')}
            </h3>
          </div>
          <button
            onClick={onClearHistory}
            className="text-xs font-medium text-slate-400 hover:text-cyan-300 transition px-2.5 py-1 rounded-lg bg-slate-800/60 border border-white/5"
          >
            {t('clearHistory')}
          </button>
        </div>

        {/* List of candidate Maqamat */}
        <div className="flex flex-col gap-3">
          {matches.slice(0, 5).map((match, idx) => {
            const isSelected = match.maqam.id === selectedMaqam.id;
            const isTop = idx === 0;

            return (
              <div
                key={match.maqam.id}
                onClick={() => onSelectMaqam(match.maqam)}
                className={`group relative cursor-pointer p-4 rounded-2xl border transition-all duration-300 ${
                  isSelected
                    ? 'border-amber-400/80 bg-gradient-to-r from-amber-500/15 to-slate-900/90 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
                    : 'border-white/10 bg-slate-900/50 hover:bg-slate-850 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    {isTop && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                    <span className="font-bold text-base text-white group-hover:text-amber-300 transition">
                      {lang === 'ar' ? match.maqam.arabicName : match.maqam.name}
                    </span>
                    <span className="text-xs text-slate-400 font-arabic">
                      {lang === 'ar' ? match.maqam.name : match.maqam.arabicName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-extrabold font-mono ${
                        match.confidence > 75
                          ? 'text-amber-400'
                          : match.confidence > 50
                          ? 'text-cyan-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {match.confidence}%
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playScaleAudio(match.maqam);
                      }}
                      title="Play Scale"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-amber-300 transition"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Match bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      match.confidence > 75
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : match.confidence > 50
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-400'
                        : 'bg-slate-600'
                    }`}
                    style={{ width: `${match.confidence}%` }}
                  />
                </div>

                {/* Scale degree badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {match.maqam.scaleDegrees.map((deg) => {
                    const isMatched = match.matchedDegrees.includes(deg.note);
                    return (
                      <span
                        key={deg.note}
                        className={`text-[11px] px-2 py-0.5 rounded-md font-mono transition-colors ${
                          deg.isQuarterTone
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold'
                            : isMatched
                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/30'
                            : 'bg-slate-800/70 text-slate-400 border border-white/5'
                        }`}
                      >
                        {deg.note}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Detailed Maqam Anatomy Card */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-xl flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white tracking-wide">
                  {lang === 'ar' ? selectedMaqam.arabicName : selectedMaqam.name}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-400/40 text-amber-300">
                  {selectedMaqam.rootNote}
                </span>
              </div>
              <p className="text-sm text-cyan-300 mt-1 font-arabic">
                {lang === 'ar' ? selectedMaqam.name : selectedMaqam.arabicName} • {selectedMaqam.transliteration}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => playVocalAhhaat(selectedMaqam)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isPlayingVocal
                    ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                    : 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 shadow-cyan-500/20'
                }`}
              >
                {isPlayingVocal ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    <span>{lang === 'ar' ? 'إيقاف الآهات' : 'Stop Vocal'}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'آهات بشرية' : 'Vocal Ah-haat'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => playScaleAudio(selectedMaqam)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{t('playGuideTone')}</span>
              </button>
            </div>
          </div>

          {/* Description & Mood */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {t('mood')}
            </span>
            <p className="text-base font-medium text-amber-200 mt-1">
              {lang === 'ar' ? selectedMaqam.moodArabic : selectedMaqam.mood}
            </p>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {lang === 'ar' ? selectedMaqam.descriptionArabic : selectedMaqam.description}
            </p>
          </div>

          {/* Ajnas Anatomy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                {t('tonicJins')}
              </span>
              <p className="text-sm font-semibold text-white mt-1">
                {selectedMaqam.tonicJins}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {t('secondaryJins')}
              </span>
              <p className="text-sm font-semibold text-white mt-1">
                {selectedMaqam.secondaryJins}
              </p>
            </div>
          </div>

          {/* Scale Degrees Detailed Breakdown */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-3">
              {t('scaleDegrees')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {selectedMaqam.scaleDegrees.map((deg, i) => (
                <div
                  key={deg.note}
                  onClick={() => soundSynth.playOudNote(deg.frequency, 1.4)}
                  className={`cursor-pointer p-3 rounded-xl border transition-all text-center group hover:scale-[1.03] ${
                    deg.isQuarterTone
                      ? 'border-amber-400/60 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'border-white/10 bg-slate-950/40 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Degree {i + 1}</span>
                    {deg.isQuarterTone && (
                      <span className="text-amber-400 font-bold">½♭</span>
                    )}
                  </div>
                  <div className="text-lg font-extrabold text-white group-hover:text-amber-300">
                    {deg.note}
                  </div>
                  <div className="text-xs text-amber-200/90 font-arabic mt-0.5">
                    {deg.arabicName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {deg.frequency.toFixed(1)} Hz
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Famous Songs Repertoire */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-2">
              {t('famousSongs')}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {selectedMaqam.famousSongs.map((song) => (
                <div
                  key={song.title}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{song.title}</span>
                    </div>
                    <div className="text-xs text-amber-400/90 font-semibold mt-1">
                      {song.artist}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                    {song.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
