import React from 'react';
import { JinsLiveMatch, ModulationEvent } from '../utils/pitchDetector';
import { MaqamDefinition } from '../utils/maqamData';
import { soundSynth } from '../utils/soundSynth';
import { useLanguage } from '../context/LanguageContext';
import { GitCommit, Sparkles, Volume2, ArrowRight, Activity, Compass, Layers } from 'lucide-react';

interface JinsModulationTrackerProps {
  currentMaqam: MaqamDefinition;
  jinsMatches: JinsLiveMatch[];
  modulationHistory: ModulationEvent[];
  isListening: boolean;
}

export const JinsModulationTracker: React.FC<JinsModulationTrackerProps> = ({
  currentMaqam,
  jinsMatches,
  modulationHistory,
  isListening,
}) => {
  const { t, lang, isRTL } = useLanguage();
  const topJins = jinsMatches[0]?.jins;

  // Play modulation demonstration (tonic Jins notes -> pivot note -> target Jins notes)
  const playModulationAudio = (pivotFreq: number = 392.0) => {
    // Play root Jins notes
    soundSynth.playOudNote(293.66, 0.8); // D
    setTimeout(() => soundSynth.playOudNote(320.24, 0.8), 350); // E½b
    setTimeout(() => soundSynth.playOudNote(349.23, 0.8), 700); // F
    setTimeout(() => soundSynth.playOudNote(392.00, 1.2), 1050); // G (Pivot Ghammaz)
    // Pivot into secondary Jins (Nahawand on G)
    setTimeout(() => soundSynth.playOudNote(440.00, 0.8), 1600); // A
    setTimeout(() => soundSynth.playOudNote(466.16, 0.8), 1950); // Bb
    setTimeout(() => soundSynth.playOudNote(523.25, 1.4), 2300); // C
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Banner & Active Jins HUD */}
      <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Jins & Modulation Engine (محلل الأجناس والانتقالات)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {lang === 'ar' ? 'مسار الأجناس والانتقالات المقامية' : 'Modal Modulation & Jins Timeline'}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              {lang === 'ar'
                ? 'رصد فوري لجنس الأصل وأجناس الفرع، مع خريطة زمنية تسجل لحظات الانتقال وتمنحك تقييماً لانسيابية التحويل المقامي.'
                : 'Real-time tracking of tonic and secondary Ajnas, with an interactive timeline scoring modal modulation smoothness and harmonic transitions.'}
            </p>
          </div>

          <button
            onClick={() => playModulationAudio()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition shadow-lg"
          >
            <Volume2 className="w-4 h-4" />
            <span>{lang === 'ar' ? 'سماع انتقال نموذجي' : 'Listen to Sample Transition'}</span>
          </button>
        </div>

        {/* Live Active Jins Spotlight Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Tonic Jins Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950/80 to-slate-900/90 border border-cyan-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400">
                  {lang === 'ar' ? 'جنس الأصل (الركوز)' : 'Active Tonic Jins'}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-white">
                {currentMaqam.tonicJins}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Root Tonic: <span className="text-amber-400 font-bold">{currentMaqam.rootNote}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-1 mt-4">
              {currentMaqam.scaleDegrees.slice(0, 4).map((d) => (
                <span
                  key={d.note}
                  className={`text-[11px] px-2 py-0.5 rounded font-mono font-bold ${
                    d.isQuarterTone
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {d.note}
                </span>
              ))}
            </div>
          </div>

          {/* Current Detected Jins in Singing */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950/80 to-slate-900/90 border border-amber-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                  {lang === 'ar' ? 'الجنس الحالي في صوتك' : 'Detected Vocal Jins'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300">
                  {jinsMatches[0]?.confidence || 85}% Match
                </span>
              </div>
              <h3 className="text-xl font-black text-white">
                {topJins ? (lang === 'ar' ? topJins.arabicName : topJins.name) : 'Awaiting Input'}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-snug">
                {topJins ? (lang === 'ar' ? topJins.characterArabic : topJins.character) : ''}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Pivot Ghammaz:</span>
              <span className="font-bold text-cyan-400 font-mono">
                {topJins?.ghammazNote || 'G4 (Nawa)'}
              </span>
            </div>
          </div>

          {/* Secondary Jins / Branch Target */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950/80 to-slate-900/90 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {lang === 'ar' ? 'جنس الفرع المعتاد' : 'Canonical Secondary Jins'}
                </span>
                <Layers className="w-4 h-4 text-slate-500" />
              </div>
              <h3 className="text-xl font-black text-white">
                {currentMaqam.secondaryJins}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Frequent modulation degree 4 or 5
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Harmonic resolution: High</span>
            </div>
          </div>
        </div>

        {/* Live Modulation Timeline Map */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                {lang === 'ar' ? 'خريطة الانتقالات المقامية المباشرة' : 'Live Modulation Timeline Log'}
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              {isListening ? 'Recording transitions live...' : 'Standby for singing'}
            </span>
          </div>

          {modulationHistory.length > 0 ? (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-cyan-500/30 flex flex-col gap-4">
              {modulationHistory.map((mod, idx) => (
                <div
                  key={idx}
                  className="relative p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group hover:border-cyan-400/30 transition"
                >
                  {/* Timeline point indicator */}
                  <span className="absolute -left-[31px] sm:-left-[39px] top-5 w-4 h-4 rounded-full bg-slate-950 border-2 border-cyan-400 group-hover:scale-125 transition-transform" />

                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-slate-800 text-cyan-300">
                      {mod.timestamp}s
                    </span>

                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <span className="text-slate-400">{mod.fromJins}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-300">{mod.toJins}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">
                      Pivot: <strong className="text-white font-mono">{mod.pivotNote}</strong>
                    </span>

                    {/* Smoothness score */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                      <span>Smoothness: {mod.smoothnessScore}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-white/5 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <Compass className="w-6 h-6 text-slate-600 animate-spin" />
              <span>
                {lang === 'ar'
                  ? 'ابدأ بالغناء والانتقال بين درجات الركوز والنوى، وسيتم تسجيل لحظات التحويل المقامي هنا تلقائياً مع تقييم الانسيابية.'
                  : 'Start singing and modulate between tonic and dominant degrees to log live transitions and smoothness scores here.'}
              </span>
            </div>
          )}
        </div>

        {/* Theoretical Canonical Modulation Paths for this Maqam */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            {lang === 'ar' ? 'الانتقالات المقامية القياسية لهذا المقام' : 'Canonical Modulation Pathways for this Maqam'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentMaqam.commonModulations.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">
                      {lang === 'ar' ? rule.targetJinsArabic : rule.targetJinsName}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">
                      Pivot {rule.pivotNote}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {lang === 'ar' ? rule.descriptionArabic : rule.description}
                  </p>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                  Expected Flow: {rule.smoothnessScore}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
