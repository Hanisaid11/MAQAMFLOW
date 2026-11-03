import React from 'react';
import { VocalFatigueMetrics, PitchDetectionResult } from '../utils/pitchDetector';
import { soundSynth } from '../utils/soundSynth';
import { useLanguage } from '../context/LanguageContext';
import {
  Activity,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Sparkles,
  Zap,
  Volume2,
  HeartPulse,
} from 'lucide-react';

interface VocalDiagnosticsProps {
  fatigueMetrics: VocalFatigueMetrics;
  registerStats: { chest: number; passaggio: number; head: number };
  orabCount: number;
  currentPitch: PitchDetectionResult | null;
  isListening: boolean;
}

export const VocalDiagnostics: React.FC<VocalDiagnosticsProps> = ({
  fatigueMetrics,
  registerStats,
  orabCount,
  currentPitch,
  isListening,
}) => {
  const { t, lang, isRTL } = useLanguage();

  // Play guided vocal warm-up / cool-down drill note
  const playDrillScale = (startFreq: number, steps: number[]) => {
    let delay = 0;
    steps.forEach((step) => {
      setTimeout(() => {
        const freq = startFreq * Math.pow(2, step / 12);
        soundSynth.playReferenceTone(freq, 0.7);
      }, delay);
      delay += 300;
    });
  };

  const isFatigued = fatigueMetrics.strainLevel === 'fatigued';
  const isModerate = fatigueMetrics.strainLevel === 'moderate';

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Diagnostics Header & Health Status Card */}
      <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Vocal Health & Register Heatmap (مختبر الصوت والعُرَب)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {lang === 'ar' ? 'تشخيص الأحبال الصوتية والعُرَب الشرقية' : 'Vocal Registers, Orab & Fatigue Diagnostics'}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              {lang === 'ar'
                ? 'تحليل حقيقي لتوزيع الصوت بين القرار (الصدري) ومنطقة العبور (الباساجيو) والجواب (الرأسي)، مع رصد مجهري لزخارف العُرَب ورنين الأحبال الصوتية لمنع الإجهاد.'
                : 'Real-time biomechanical vocal monitoring: track Chest, Passaggio, and Head voice distribution, detect traditional Arabic Orab ornaments, and prevent vocal fold strain.'}
            </p>
          </div>

          {/* Real-time Health Badge */}
          <div
            className={`px-4 py-2.5 rounded-2xl flex items-center gap-2.5 border font-bold text-xs shadow-lg ${
              isFatigued
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                : isModerate
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {isFatigued ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
            ) : isModerate ? (
              <Flame className="w-4 h-4 text-amber-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>
              {isFatigued
                ? lang === 'ar'
                  ? 'إجهاد صوتي ملحوظ!'
                  : 'Vocal Strain Warning!'
                : isModerate
                ? lang === 'ar'
                  ? 'ضغط متوسط على الحنجرة'
                  : 'Moderate Laryngeal Tension'
                : lang === 'ar'
                ? 'الأحبال الصوتية في حالة ممتازة'
                : 'Vocal Folds Healthy & Balanced'}
            </span>
          </div>
        </div>

        {/* 1. Register Heatmap Cards (Chest, Passaggio, Head) */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>{lang === 'ar' ? 'خريطة الطبقات الصوتية' : 'Vocal Register Heatmap'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chest Voice */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-cyan-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-cyan-400">
                    {lang === 'ar' ? 'القرار (الصوت الصدري)' : 'Chest Voice (القرار)'}
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">{registerStats.chest}%</span>
                </div>
                <div className="text-xl font-black text-white mt-2">&lt; 330 Hz (C2 - E4)</div>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'ar'
                    ? 'الطبقة الأساسية للاستقرار والركوز الوقور في مقامات الراست والبياتي.'
                    : 'Provides foundational resonance and grounding for tonic degrees.'}
                </p>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 mt-4 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${registerStats.chest}%` }}
                />
              </div>
            </div>

            {/* Passaggio / Transition Zone */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-amber-400">
                    {lang === 'ar' ? 'منطقة العبور (الباساجيو)' : 'Passaggio Zone (العبور)'}
                  </span>
                  <span className="font-mono text-amber-300 font-bold">
                    {registerStats.passaggio}%
                  </span>
                </div>
                <div className="text-xl font-black text-white mt-2">330 - 392 Hz (E4 - G4)</div>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'ar'
                    ? 'المنطقة الأكثر حساسية حيث تقع درجة السيكاه (مي نصف بيمول) وتتطلب استرخاء البلعوم.'
                    : 'Critical zone hosting the Sikah neutral 3rd; requires pharyngeal space.'}
                </p>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 mt-4 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${registerStats.passaggio}%` }}
                />
              </div>
            </div>

            {/* Head Voice / Falsetto */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-violet-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-violet-400">
                    {lang === 'ar' ? 'الجواب (الصوت الرأسي)' : 'Head Voice (الجواب)'}
                  </span>
                  <span className="font-mono text-violet-300 font-bold">{registerStats.head}%</span>
                </div>
                <div className="text-xl font-black text-white mt-2">&gt; 392 Hz (G4 - C6)</div>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'ar'
                    ? 'طبقة الذروة والتطريب العالي حيث تُبدع العُرَب والقفزات الغنائية.'
                    : 'High Tarab apex where melismatic ornaments and emotional peaks soar.'}
                </p>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 mt-4 overflow-hidden">
                <div
                  className="h-full bg-violet-400 rounded-full transition-all duration-500"
                  style={{ width: `${registerStats.head}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Arab Vocal Ornamentation ("العُرَب والتزليق") Tracker */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-950 to-slate-900 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/30">
              عُ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black text-white">
                  {lang === 'ar' ? 'محلل العُرَب والتزليق الشرقي (Orab Counter)' : 'Arabo-Vocal Ornamentation Analyzer'}
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">
                  Active Tarjif Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {lang === 'ar'
                  ? 'يقيس سرعة ودقة الترجيف الصوتي (Micro-trills) والتزليق الرشيق على أرباع التون دون الخروج عن ميزان المقام.'
                  : 'Tracks rapid melismatic micro-trills (Tarjif) and quarter-tone slides (Tazleeq) preserving authentic Arabic Tarab aesthetics.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-black text-amber-400 font-mono">{orabCount}</div>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {lang === 'ar' ? 'عربة مرصودة' : 'Orab Detected'}
              </span>
            </div>

            <div className="text-center border-l border-white/10 pl-6">
              <div className="text-xl font-black text-cyan-300 font-mono">
                {currentPitch?.isOrabDetected ? 'TRILLED!' : 'STEADY'}
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {lang === 'ar' ? 'الحالة الحالية' : 'Live Texture'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Vocal Fatigue Alert & Formant Metrics */}
        {(isFatigued || isModerate) && (
          <div className="p-5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-bold text-rose-200">
                  {fatigueMetrics.fatigueWarning}
                </h5>
                <p className="text-xs text-rose-300/80 mt-1">
                  💡 <strong>Recommended Cool-down:</strong> {fatigueMetrics.coolDownDrill}
                </p>
              </div>
            </div>

            <button
              onClick={() => playDrillScale(293.66, [0, -2, -4, -5, -7])}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white transition shrink-0"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'سماع تمرين التهدئة' : 'Play Cool-Down Tone'}</span>
            </button>
          </div>
        )}

        {/* 4. Tailored Vocal Drills based on Detected Boundaries */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            {lang === 'ar' ? 'تمارين التثبيت والإحماء الموجهة' : 'Custom Biomechanical Warm-Ups & Drills'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 flex flex-col justify-between gap-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">
                    {lang === 'ar' ? 'تمرين تحرير الباساجيو على السيكاه' : 'Sikah Passaggio Expansion'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">E½♭ - G4</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {lang === 'ar'
                    ? 'تدرّج خفيف بصوت "أوو" (Oo) بين الدوكاه والسيكاه لتقليل الضغط الحنجري أثناء الصعود.'
                    : 'Gently glide on "Oo" vowel between D and E½b to widen pharyngeal space.'}
                </p>
              </div>
              <button
                onClick={() => playDrillScale(293.66, [0, 1.5, 3, 5])}
                className="self-start text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 mt-2"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'استمع إلى النغمات' : 'Listen Guide'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5 flex flex-col justify-between gap-2">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">
                    {lang === 'ar' ? 'تمرين العُرَب الرشيقة (Tarjif Drill)' : 'Rapid Arab Melisma Drill'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">150¢ Trill</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {lang === 'ar'
                    ? 'تدريب الحنجرة على الترجيف السريع فوق كلمة "يا ليل" بربع تون متأرجح بدقة.'
                    : 'Train vocal cords on rapid 5Hz micro-vibrato on "Ya Layl" with quarter-tone oscillations.'}
                </p>
              </div>
              <button
                onClick={() => playDrillScale(320.24, [0, 0.5, 0, 0.5, 0])}
                className="self-start text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 mt-2"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'استمع إلى النغمات' : 'Listen Guide'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
