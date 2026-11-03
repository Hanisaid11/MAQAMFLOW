import React, { useState } from 'react';
import { TAQASEEM_GUIDE_DATA, MaqamTaqaseemProfile, ModulationPathway } from '../utils/taqaseemData';
import { soundSynth } from '../utils/soundSynth';
import { useLanguage } from '../context/LanguageContext';
import { PitchDetectionResult } from '../utils/pitchDetector';
import {
  Compass,
  ArrowRight,
  Play,
  Volume2,
  Sparkles,
  Info,
  ShieldCheck,
  Zap,
  Music,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface TaqaseemModulationGuideProps {
  currentPitch: PitchDetectionResult | null;
  isListening: boolean;
  selectedMaqamId?: string;
}

export const TaqaseemModulationGuide: React.FC<TaqaseemModulationGuideProps> = ({
  currentPitch,
  isListening,
  selectedMaqamId = 'bayati',
}) => {
  const { lang, isRTL } = useLanguage();
  const [activeMaqamId, setActiveMaqamId] = useState<string>(selectedMaqamId);
  const [playingPathwayIdx, setPlayingPathwayIdx] = useState<number | null>(null);

  const profile: MaqamTaqaseemProfile =
    TAQASEEM_GUIDE_DATA[activeMaqamId] || TAQASEEM_GUIDE_DATA.bayati;

  // Play a single resting note tone
  const handlePlayRestingNote = (freq: number) => {
    soundSynth.playOudNote(freq, 2.2);
  };

  // Play audio simulation of a modulation pathway
  const handlePlayPathway = (pathway: ModulationPathway, idx: number) => {
    if (playingPathwayIdx !== null) return;
    setPlayingPathwayIdx(idx);

    // Approximate frequencies for sequence
    const noteFreqMap: Record<string, number> = {
      C4: 261.63,
      'C#4': 277.18,
      'D♭4': 277.18,
      D4: 293.66,
      'E½♭4': 311.13,
      'E♭4': 311.13,
      E4: 329.63,
      F4: 349.23,
      'F#4': 369.99,
      'G♭4': 369.99,
      G4: 392.0,
      'A♭4': 415.3,
      A4: 440.0,
      'B½♭4': 466.16,
      'B♭4': 466.16,
      B4: 493.88,
      C5: 523.25,
      D5: 587.33,
      'E½♭5': 622.25,
    };

    pathway.pathwayNotes.forEach((n, stepIdx) => {
      const f = noteFreqMap[n] || 300;
      setTimeout(() => {
        soundSynth.playOudNote(f, 0.9);
        if (stepIdx === pathway.pathwayNotes.length - 1) {
          setTimeout(() => setPlayingPathwayIdx(null), 900);
        }
      }, stepIdx * 450);
    });
  };

  // Determine if current sung note is a resting or pivot note
  const currentNoteName = currentPitch?.noteName || '';
  const isQarar = currentNoteName.startsWith(profile.restingNotes.qarar.note.replace(/\d/, ''));
  const isNawa = currentNoteName.startsWith(profile.restingNotes.nawa.note.replace(/\d/, ''));
  const isJawab = currentNoteName.startsWith(profile.restingNotes.jawab.note.replace(/\d/, ''));

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-cyan-500 p-0.5 shadow-xl shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Compass className="w-7 h-7 text-amber-400 animate-spin-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {lang === 'ar' ? 'مرشد الارتجال والانتقالات المقامية' : 'Cross-Modulation & Taqaseem Guide'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {lang === 'ar' ? 'أصول التقاسيم' : 'Taqaseem Master'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-arabic">
                {lang === 'ar'
                  ? 'دليلك الحي للتنقل السلس بين المقامات دون الخروج عن التون، مع درجات الاستقرار الثلاثية (القرار، النوى، الجواب) ومفاتيح الانتقال المقابلة.'
                  : 'Live companion for smooth modal transitions, safe resting cadences (Qarar, Nawa, Jawab), and seamless pivot note improvisations.'}
              </p>
            </div>
          </div>

          {/* Maqam Selector Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.keys(TAQASEEM_GUIDE_DATA).map((key) => {
              const m = TAQASEEM_GUIDE_DATA[key];
              const isSelected = activeMaqamId === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveMaqamId(key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 scale-105'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/5'
                  }`}
                >
                  {lang === 'ar' ? m.arabicName : m.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Mic Improvisation Companion Status */}
      {isListening && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950/80 via-slate-900/80 to-slate-950/80 border border-cyan-500/30 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping absolute" />
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-400" />
            </div>
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                {lang === 'ar' ? 'رصد نغمتك الحية' : 'Live Voice Status'}:
              </span>
              <span className="mx-2 text-base font-black text-amber-300">
                {currentPitch?.noteName || '—'} ({currentPitch?.frequency ? `${currentPitch.frequency} Hz` : '—'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isQarar && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'مرتكز على القرار (نغمة أمان)' : 'On Tonic Qarar (Safe Anchor)'}
              </span>
            )}
            {isNawa && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Zap className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'على نغمة النوى (مفتاح التحويل)' : 'On Nawa Pivot (Ready to Modulate)'}
              </span>
            )}
            {isJawab && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'في ذروة الجواب (أوكتاف القمة)' : 'Peak Jawab Octave'}
              </span>
            )}
            {!isQarar && !isNawa && !isJawab && currentPitch && (
              <span className="text-xs text-slate-400 italic">
                {lang === 'ar' ? 'نغمة حرة في سياق السلم' : 'Passing Melodic Step'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 4 Pillars of Stability: Resting Notes Grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>{lang === 'ar' ? 'درجات الاستقرار الثلاثية والارتكاز (قرار • وسط • نوى • جواب)' : 'The 4 Pillars of Improvisation Cadence'}</span>
          </h3>
          <span className="text-xs text-slate-400">
            {lang === 'ar' ? 'انقر على النغمة لسماع رنين العود' : 'Click note card to audition tone'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Qarar */}
          <div
            onClick={() => handlePlayRestingNote(profile.restingNotes.qarar.freq)}
            className="group cursor-pointer rounded-2xl p-4 bg-slate-950/70 hover:bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/60 backdrop-blur-xl transition-all shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
                  {lang === 'ar' ? 'القرار الأساسي' : 'Qarar / Tonic'}
                </span>
                <Volume2 className="w-4 h-4 text-emerald-400 group-hover:scale-125 transition-transform" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
                  {profile.restingNotes.qarar.note}
                </div>
                <div className="text-xs font-bold text-emerald-400 font-arabic">
                  {profile.restingNotes.qarar.arabicName}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed font-arabic">
              {profile.restingNotes.qarar.description}
            </p>
          </div>

          {/* Wasat */}
          <div
            onClick={() => handlePlayRestingNote(profile.restingNotes.wasat.freq)}
            className="group cursor-pointer rounded-2xl p-4 bg-slate-950/70 hover:bg-slate-900/90 border border-amber-500/30 hover:border-amber-400/60 backdrop-blur-xl transition-all shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300">
                  {lang === 'ar' ? 'الدرجة الثالثة' : 'Wasat / 3rd'}
                </span>
                <Volume2 className="w-4 h-4 text-amber-400 group-hover:scale-125 transition-transform" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                  {profile.restingNotes.wasat.note}
                </div>
                <div className="text-xs font-bold text-amber-400 font-arabic">
                  {profile.restingNotes.wasat.arabicName}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed font-arabic">
              {profile.restingNotes.wasat.description}
            </p>
          </div>

          {/* Nawa */}
          <div
            onClick={() => handlePlayRestingNote(profile.restingNotes.nawa.freq)}
            className="group cursor-pointer rounded-2xl p-4 bg-slate-950/70 hover:bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400/60 backdrop-blur-xl transition-all shadow-lg hover:shadow-cyan-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300">
                  {lang === 'ar' ? 'النوى (مفتاح التحويل)' : 'Nawa / Pivot'}
                </span>
                <Volume2 className="w-4 h-4 text-cyan-400 group-hover:scale-125 transition-transform" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
                  {profile.restingNotes.nawa.note}
                </div>
                <div className="text-xs font-bold text-cyan-400 font-arabic">
                  {profile.restingNotes.nawa.arabicName}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed font-arabic">
              {profile.restingNotes.nawa.description}
            </p>
          </div>

          {/* Jawab */}
          <div
            onClick={() => handlePlayRestingNote(profile.restingNotes.jawab.freq)}
            className="group cursor-pointer rounded-2xl p-4 bg-slate-950/70 hover:bg-slate-900/90 border border-purple-500/30 hover:border-purple-400/60 backdrop-blur-xl transition-all shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300">
                  {lang === 'ar' ? 'جواب الأوكتاف' : 'Jawab / Peak'}
                </span>
                <Volume2 className="w-4 h-4 text-purple-400 group-hover:scale-125 transition-transform" />
              </div>
              <div className="mt-3">
                <div className="text-2xl font-black text-white group-hover:text-purple-300 transition-colors">
                  {profile.restingNotes.jawab.note}
                </div>
                <div className="text-xs font-bold text-purple-400 font-arabic">
                  {profile.restingNotes.jawab.arabicName}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-slate-400 leading-relaxed font-arabic">
              {profile.restingNotes.jawab.description}
            </p>
          </div>
        </div>
      </div>

      {/* Improvisation Wisdom Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-slate-950/70 border border-amber-500/20 backdrop-blur-md flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
            {lang === 'ar' ? 'وصية أستاذ التقاسيم' : 'Taqaseem Master Guidance'}
          </h4>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed font-arabic">
            {lang === 'ar' ? profile.improvisationAdviceAr : profile.improvisationAdviceEn}
          </p>
        </div>
      </div>

      {/* Modulation Pathways List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>
              {lang === 'ar'
                ? `مسارات الانتقال المقابلة من مقام ${profile.arabicName}`
                : `Compatible Modulation Pathways from Maqam ${profile.name}`}
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            {profile.modulationPathways.length} {lang === 'ar' ? 'انتقالات نموذجية' : 'paths available'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile.modulationPathways.map((pathway, idx) => {
            const isPlayingThis = playingPathwayIdx === idx;
            return (
              <div
                key={pathway.targetMaqamId}
                className="rounded-2xl p-5 bg-slate-950/80 border border-white/10 hover:border-cyan-500/40 backdrop-blur-xl transition-all shadow-lg flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Top Target & Difficulty */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white">
                        {lang === 'ar' ? pathway.targetMaqamArabic : pathway.targetMaqamName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          pathway.difficulty === 'Beginner'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : pathway.difficulty === 'Intermediate'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {pathway.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-white/5">
                        {pathway.transitionType}
                      </span>
                    </div>
                  </div>

                  {/* Pivot Note Badge */}
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-bold">
                      {lang === 'ar' ? 'مفتاح التحويل (نغمة الانتقال):' : 'Pivot Note / Bridge:'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                      {lang === 'ar' ? pathway.pivotNoteArabic : pathway.pivotNote} ({pathway.pivotDegree})
                    </span>
                  </div>

                  {/* Transition instructions */}
                  <p className="mt-3 text-xs text-slate-300 leading-relaxed font-arabic">
                    {lang === 'ar' ? pathway.descriptionAr : pathway.descriptionEn}
                  </p>

                  {/* Emotional Shift */}
                  <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-amber-300/90 font-arabic italic">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                    <span>{lang === 'ar' ? pathway.emotionalShiftAr : pathway.emotionalShiftEn}</span>
                  </div>
                </div>

                {/* Bottom Sequence & Audition Button */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                  {/* Note Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                    {pathway.pathwayNotes.map((n, nIdx) => (
                      <span
                        key={nIdx}
                        className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-900 border border-white/10 text-slate-300 shrink-0"
                      >
                        {n}
                      </span>
                    ))}
                  </div>

                  {/* Audition Pathway Button */}
                  <button
                    onClick={() => handlePlayPathway(pathway, idx)}
                    disabled={isPlayingThis}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      isPlayingThis
                        ? 'bg-cyan-500 text-slate-950 animate-pulse'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    }`}
                  >
                    <Play className={`w-3.5 h-3.5 ${isPlayingThis ? 'fill-current' : ''}`} />
                    <span>
                      {isPlayingThis
                        ? lang === 'ar'
                          ? 'جاري عزف الانتقال...'
                          : 'Playing...'
                        : lang === 'ar'
                        ? 'سماع الانتقال'
                        : 'Audition Pathway'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
