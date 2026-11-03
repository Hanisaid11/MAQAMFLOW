import React, { useState, useRef, useEffect } from 'react';
import { MAQAMAT_DATABASE, MaqamDefinition } from '../utils/maqamData';
import { useLanguage } from '../context/LanguageContext';
import { PitchDetectionResult } from '../utils/pitchDetector';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Mic,
  Award,
  Layers,
  CheckCircle2,
  Music,
  Heart,
  Radio,
  FileAudio,
} from 'lucide-react';

interface MaqamVocalAhhaatShowcaseProps {
  currentPitch?: PitchDetectionResult | null;
  isListening?: boolean;
  onSelectMaqam?: (maqam: MaqamDefinition) => void;
}

export const MaqamVocalAhhaatShowcase: React.FC<MaqamVocalAhhaatShowcaseProps> = ({
  currentPitch,
  isListening,
  onSelectMaqam,
}) => {
  const { lang, isRTL } = useLanguage();
  const [playingMaqamId, setPlayingMaqamId] = useState<string | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mnemonic Mapping ("صُنع بسحرك")
  const MNEMONIC_MAP: Record<string, { letter: string; phrase: string }> = {
    saba: { letter: 'ص', phrase: 'صَـ (صبا)' },
    nahawand: { letter: 'ن', phrase: 'نُـ (نهاوند)' },
    ajam: { letter: 'ع', phrase: 'عَـ (عجم)' },
    bayati: { letter: 'ب', phrase: 'بِـ (بياتي)' },
    sikah: { letter: 'س', phrase: 'سِـ (سيكاه)' },
    hijaz: { letter: 'ح', phrase: 'حِـ (حجاز)' },
    rast: { letter: 'ر', phrase: 'رَ (راست)' },
    kurd: { letter: 'ك', phrase: 'كَـ (كرد)' },
  };

  const handlePlayVocalAhhaat = (maqam: MaqamDefinition) => {
    if (playingMaqamId === maqam.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingMaqamId(null);
      setPlaybackProgress(0);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audioUrl = maqam.vocalSampleUrl || '/audio/ah-haat/bayati_human_voice.mp3';
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setPlaybackProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setPlayingMaqamId(null);
      setPlaybackProgress(0);
    };

    audio.play().catch((err) => {
      console.error('Audio play error:', err);
    });

    setPlayingMaqamId(maqam.id);
    if (onSelectMaqam) {
      onSelectMaqam(maqam);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-amber-950/30 to-slate-900/90 border border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-rose-500 p-0.5 shadow-xl shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Music className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {lang === 'ar' ? 'آهات المقامات الثمانية بصوت بشري حقيقي' : 'The 8 Maqamat Vocal Ah-haat Hub'}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {lang === 'ar' ? 'مجموعة صُـنِـعَ بِـسِـحْـرِكَ' : 'All 8 Arabic Modes'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl font-arabic leading-relaxed">
                {lang === 'ar'
                  ? 'نعم! التطبيق يشمل جميع المقامات الأساسية الثمانية مجموعة في عبارة (صُنع بسحرك). استمع هنا إلى النغمة المميزة لكل مقام بأداء بشري حقيقي بصوت "الآهات" ليظهر طابع المقام وشجنه وروحه بوضوح، بدءاً من تسجيل البياتي المرفق ووصولاً لجميع المقامات.'
                  : 'Yes! The app encompasses all 8 fundamental Arabic Maqamat (Mnemonic: SUN’A BI-SIHRIK). Audition authentic human voice vocal Ah-haat demonstrating the distinct soul, quarter-tones, and mood of each Maqam.'}
              </p>
            </div>
          </div>

          {/* User Sample Badge */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-amber-500/30 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <FileAudio className="w-5 h-5" />
            </div>
            <div className="text-xs font-arabic">
              <span className="text-slate-400 block text-[10px]">
                {lang === 'ar' ? 'التسجيل الصوتي المرفق للمستخدم' : 'User Reference Voice'}
              </span>
              <span className="font-bold text-amber-300">
                {lang === 'ar' ? 'آهات بياتي أصلية (7.8 ثانية)' : 'Authentic Bayati Vocal'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mnemonic Ribbon ("صُـنِـعَ بِـسِـحْـرِكَ") */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 backdrop-blur-md flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{lang === 'ar' ? 'جملة حصر المقامات:' : 'Mnemonic Formula:'}</span>
        </span>

        <div className="flex items-center gap-2">
          {['saba', 'nahawand', 'ajam', 'bayati', 'sikah', 'hijaz', 'rast', 'kurd'].map((id) => {
            const m = MAQAMAT_DATABASE.find((item) => item.id === id);
            const mnemonic = MNEMONIC_MAP[id];
            const isPlaying = playingMaqamId === id;
            if (!m) return null;

            return (
              <button
                key={id}
                onClick={() => handlePlayVocalAhhaat(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isPlaying
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/5'
                }`}
              >
                <span className="font-mono text-amber-400 font-black">{mnemonic.letter}</span>
                <span>{lang === 'ar' ? m.arabicName.replace('مقام ', '') : m.name.replace('Maqam ', '')}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 8 Maqamat Vocal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MAQAMAT_DATABASE.map((maqam) => {
          const isPlaying = playingMaqamId === maqam.id;
          const mnemonic = MNEMONIC_MAP[maqam.id] || { letter: '', phrase: '' };
          const isUserSample = maqam.id === 'bayati';

          return (
            <div
              key={maqam.id}
              className={`rounded-3xl p-5 border transition-all flex flex-col justify-between gap-4 ${
                isPlaying
                  ? 'bg-slate-900/95 border-amber-400/80 shadow-2xl shadow-amber-500/20 scale-[1.02]'
                  : 'bg-slate-950/80 border-white/10 hover:border-white/20'
              }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-xs flex items-center justify-center">
                      {mnemonic.letter}
                    </span>
                    <span className="text-sm font-black text-white">
                      {lang === 'ar' ? maqam.arabicName : maqam.name}
                    </span>
                  </div>

                  {isUserSample && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {lang === 'ar' ? 'صوتك المرفق' : 'User Audio'}
                    </span>
                  )}
                </div>

                {/* Root & Mood */}
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className="text-slate-400">{lang === 'ar' ? 'الركوز:' : 'Tonic:'}</span>
                  <span className="font-mono font-bold text-amber-300">{maqam.rootNote}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[11px] text-slate-400 font-arabic truncate">
                    {lang === 'ar' ? maqam.family : `${maqam.family} family`}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed font-arabic line-clamp-2">
                  {lang === 'ar' ? maqam.moodArabic : maqam.mood}
                </p>

                {/* Vocal Description */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-amber-300/90 font-arabic leading-snug">
                  {lang === 'ar'
                    ? maqam.vocalSampleDescriptionArabic
                    : maqam.vocalSampleDescription}
                </div>
              </div>

              {/* Card Bottom: Vocal Player Button & Progress */}
              <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                <button
                  onClick={() => handlePlayVocalAhhaat(maqam)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md ${
                    isPlaying
                      ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>{lang === 'ar' ? 'إيقاف الآهات' : 'Stop Vocal'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{lang === 'ar' ? 'سماع آهات المقام' : 'Play Vocal Ah-haat'}</span>
                    </>
                  )}
                </button>

                {/* Progress bar if playing */}
                {isPlaying && (
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-100"
                      style={{ width: `${playbackProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
