import React, { useState, useEffect, useRef } from 'react';
import { breathTracker, BreathMetrics, PhraseRecord } from '../utils/breathTracker';
import { useLanguage } from '../context/LanguageContext';
import { PitchDetectionResult } from '../utils/pitchDetector';
import {
  Wind,
  Activity,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Clock,
  Gauge,
  Flame,
  Award,
  RotateCcw,
  Volume2,
} from 'lucide-react';

interface BreathStaminaGuideProps {
  currentPitch: PitchDetectionResult | null;
  rms: number;
  isListening: boolean;
  onStartListening?: () => void;
  onStopListening?: () => void;
}

export const BreathStaminaGuide: React.FC<BreathStaminaGuideProps> = ({
  currentPitch,
  rms,
  isListening,
  onStartListening,
  onStopListening,
}) => {
  const { lang, isRTL } = useLanguage();

  const [metrics, setMetrics] = useState<BreathMetrics>({
    currentPhraseDuration: 0,
    breathRemainingPct: 100,
    isSinging: false,
    pitchDroopWarning: false,
    highAirflowAlert: false,
    phraseCount: 0,
    longestPhrase: 0,
    averagePhraseDuration: 0,
    breathMarkNeeded: false,
    recentPhrases: [],
  });

  // Sustained Breath Test State
  const [isTestingStamina, setIsTestingStamina] = useState<boolean>(false);
  const [staminaDuration, setStaminaDuration] = useState<number>(0);
  const [staminaBest, setStaminaBest] = useState<number>(() => {
    return parseFloat(localStorage.getItem('maqamflow_stamina_best') || '0');
  });
  const [staminaScore, setStaminaScore] = useState<string | null>(null);
  const staminaTimerRef = useRef<number | null>(null);

  // Update metrics on every audio frame
  useEffect(() => {
    if (isListening) {
      const cents = currentPitch?.cents || 0;
      const note = currentPitch?.noteName || '';
      const updated = breathTracker.processFrame(rms, cents, note);
      setMetrics(updated);

      // Handle Stamina Test if active
      if (isTestingStamina) {
        if (updated.isSinging) {
          setStaminaDuration(updated.currentPhraseDuration);
        } else if (staminaDuration > 1.0) {
          // Finished phrase
          finishStaminaTest(staminaDuration);
        }
      }
    }
  }, [rms, currentPitch, isListening, isTestingStamina, staminaDuration]);

  const handleStartStaminaTest = () => {
    if (!isListening && onStartListening) {
      onStartListening();
    }
    breathTracker.reset();
    setIsTestingStamina(true);
    setStaminaDuration(0);
    setStaminaScore(null);
  };

  const finishStaminaTest = (durationSec: number) => {
    setIsTestingStamina(false);
    if (durationSec > staminaBest) {
      setStaminaBest(durationSec);
      localStorage.setItem('maqamflow_stamina_best', durationSec.toFixed(1));
    }

    if (durationSec >= 16) {
      setStaminaScore(lang === 'ar' ? 'أسطورة الموال العربي (Mawwal Virtuoso)' : 'Mawwal Virtuoso (Elite Arabic Stamina)');
    } else if (durationSec >= 11) {
      setStaminaScore(lang === 'ar' ? 'مطرب محترف ذو نفس عميق (Pro Arabic Singer)' : 'Pro Singer (Solid Breath Control)');
    } else if (durationSec >= 7) {
      setStaminaScore(lang === 'ar' ? 'مستوى واعد — يحتاج تدريب الحجاب الحاجز' : 'Promising — Train Diaphragmatic Support');
    } else {
      setStaminaScore(lang === 'ar' ? 'نَفَس قصير — تجنب التوتر وافتح القفص الصدري' : 'Short Breath — Relax throat & expand ribs');
    }
  };

  const handleResetMetrics = () => {
    breathTracker.reset();
    setMetrics({
      currentPhraseDuration: 0,
      breathRemainingPct: 100,
      isSinging: false,
      pitchDroopWarning: false,
      highAirflowAlert: false,
      phraseCount: 0,
      longestPhrase: 0,
      averagePhraseDuration: 0,
      breathMarkNeeded: false,
      recentPhrases: [],
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-sky-950/30 to-slate-900/90 border border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 via-cyan-500 to-amber-500 p-0.5 shadow-xl shadow-sky-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Wind className="w-7 h-7 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {lang === 'ar' ? 'مساعد التنفس وإدارة الهواء وإطالة النَفَس' : 'Vocal Stamina & Breath Management Guide'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  {lang === 'ar' ? 'إدارة الهواء والموال' : 'Airflow & Stamina'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-arabic">
                {lang === 'ar'
                  ? 'رصد ذكي لطول الجمل اللحنية ومؤشر هبوط النغمة (Pitch Droop) عند نفاد النفس، مع تحديد علامات التنفس واختبار قوة الحجاب الحاجز.'
                  : 'Real-time phrase length tracking, breath markers, pitch droop warnings at phrase tails, and lung capacity stamina trainer.'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetMetrics}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-white/5 transition"
              title="Reset metrics"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleStartStaminaTest}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 shadow-lg shadow-sky-500/20 transition"
            >
              <Flame className="w-4 h-4" />
              <span>{lang === 'ar' ? 'اختبار النَفَس الطويل' : 'Test Lung Stamina'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Live Warning Banners */}
      {metrics.pitchDroopWarning && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 backdrop-blur-xl flex items-center gap-3 text-rose-200 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-xs">
            <span className="font-black uppercase tracking-wider">
              {lang === 'ar' ? 'تحذير هبوط النغمة (Pitch Droop):' : 'Pitch Droop Warning:'}
            </span>{' '}
            <span className="font-arabic">
              {lang === 'ar'
                ? 'نغمتك تهبط في ختام الجملة بسبب نفاد مخزون الهواء! خذ نفساً مريحاً من الحجاب الحاجز قبل إكمال الموال.'
                : 'Pitch is falling at phrase ending due to depleted lung reserve! Inhale from diaphragm before next phrase.'}
            </span>
          </div>
        </div>
      )}

      {metrics.highAirflowAlert && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 backdrop-blur-xl flex items-center gap-3 text-amber-200">
          <Wind className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <span className="font-black uppercase tracking-wider">
              {lang === 'ar' ? 'استهلاك هواء مرتفع (High Airflow):' : 'High Airflow Consumption:'}
            </span>{' '}
            <span className="font-arabic">
              {lang === 'ar'
                ? 'أنت تفرّغ كمية هواء زائدة في بداية الغناء. خفف الضغط واعتمد على الرنين الرأسي لتوفير النفس.'
                : 'Too much breath escaping at attack. Soften vocal onset to preserve breath for extended phrases.'}
            </span>
          </div>
        </div>
      )}

      {/* Main Real-Time Breath & Stamina HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gauge 1: Current Phrase Stopwatch & Air Reserve Ring */}
        <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>{lang === 'ar' ? 'طول الجملة الحالية' : 'Current Phrase'}</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                metrics.isSinging
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {metrics.isSinging ? (lang === 'ar' ? 'غناء مستمر' : 'Phonating') : (lang === 'ar' ? 'وقفة تنفس' : 'Breath Pause')}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center my-2">
            <div className="text-5xl font-black text-white font-mono tracking-tight">
              {metrics.currentPhraseDuration.toFixed(1)}
              <span className="text-lg text-slate-400 font-sans ml-1">s</span>
            </div>
            <span className="text-xs text-sky-400 font-bold mt-1">
              {lang === 'ar' ? 'مدة النَّفَس المستمر' : 'Single breath duration'}
            </span>
          </div>

          {/* Breath Capacity Progress Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">{lang === 'ar' ? 'مخزون الهواء المقدر' : 'Lung Air Reserve'}</span>
              <span
                className={`font-bold ${
                  metrics.breathRemainingPct > 50
                    ? 'text-emerald-400'
                    : metrics.breathRemainingPct > 20
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {metrics.breathRemainingPct}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-900 overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-150 ${
                  metrics.breathRemainingPct > 50
                    ? 'bg-emerald-400'
                    : metrics.breathRemainingPct > 20
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${metrics.breathRemainingPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Gauge 2: Stamina Statistics Summary */}
        <div className="p-6 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span>{lang === 'ar' ? 'إحصائيات استقرار النَّفَس' : 'Stamina Metrics'}</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {metrics.phraseCount} {lang === 'ar' ? 'جمل مسجلة' : 'phrases'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 my-auto">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                {lang === 'ar' ? 'أطول نَفَس' : 'Longest Phrase'}
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {metrics.longestPhrase}s
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                {lang === 'ar' ? 'المعدل العام' : 'Average Phrase'}
              </span>
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {metrics.averagePhraseDuration}s
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">{lang === 'ar' ? 'أفضل رقم شخصي في الموال' : 'Personal Best'}</span>
            <span className="font-black text-emerald-400 font-mono">{staminaBest.toFixed(1)}s</span>
          </div>
        </div>

        {/* Gauge 3: Sustained Breath Test Card */}
        <div className="p-6 rounded-3xl bg-slate-950/80 border border-sky-500/20 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-purple-400" />
              <span>{lang === 'ar' ? 'اختبار ثبات الحجاب الحاجز' : 'Diaphragm Test'}</span>
            </span>
            {isTestingStamina && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                Recording Sustained Tone
              </span>
            )}
          </div>

          <div className="flex flex-col items-center justify-center my-auto text-center">
            {staminaScore ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-black text-white font-mono">{staminaDuration.toFixed(1)}s</span>
                <span className="text-xs font-bold text-emerald-300 mt-1 font-arabic">{staminaScore}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-300 font-arabic leading-relaxed">
                {lang === 'ar'
                  ? 'اضغط الزر وغنِّ نغمة مستمرة واحدة على قرار مقامك لأطول فترة ممكنة بدون اهتزاز.'
                  : 'Hold a single continuous sustained note on your tonic root for as long as possible.'}
              </p>
            )}
          </div>

          <button
            onClick={isTestingStamina ? () => finishStaminaTest(staminaDuration) : handleStartStaminaTest}
            className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              isTestingStamina
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-900 border border-sky-400/40 hover:border-sky-400 text-sky-200'
            }`}
          >
            {isTestingStamina
              ? lang === 'ar'
                ? 'إنهاء وحساب النتيجة'
                : 'Finish & Score'
              : lang === 'ar'
              ? 'بدء اختبار استدامة النغمة'
              : 'Start Sustained Tone Test'}
          </button>
        </div>
      </div>

      {/* Visual Breath Markers Timeline & History */}
      <div className="rounded-3xl p-6 bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Wind className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {lang === 'ar' ? 'سجل علامات التنفس (Breath Markers) وتوزيع القفلات' : 'Phrasing & Breath Markers Timeline'}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-arabic">
            {lang === 'ar' ? 'علامة التنفس ( \’ ) تشير إلى موضع أخذ الهواء المثالي' : 'Marker ( \’ ) indicates optimal breath intake'}
          </span>
        </div>

        {metrics.recentPhrases.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-arabic">
            {lang === 'ar'
              ? 'ابدأ بالغناء عبر المايكروفون لرسم جملك الغنائية وعلامات التنفس تلقائياً هنا.'
              : 'Sing phrases into your mic to automatically analyze breath durations and insert breath intake markers.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.recentPhrases.map((phrase, idx) => (
              <div
                key={phrase.id}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-sky-400">
                    #{metrics.recentPhrases.length - idx}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white font-mono">{phrase.duration}s</span>
                      <span className="text-[10px] text-slate-400">({phrase.avgPitch})</span>
                      {/* Breath Intake Marker */}
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-sky-500/20 text-sky-300 font-mono" title="Breath Intake Point">
                        \’ Breath
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Air Used: {phrase.breathConsumptionPct}%
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    phrase.rating === 'Superb'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : phrase.rating === 'Good'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {phrase.rating}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pedagogical Breathing Advice */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-500/10 via-slate-900/60 to-slate-950/80 border border-sky-500/20 backdrop-blur-md flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider">
            {lang === 'ar' ? 'قواعد أستاذ الصوت للتنفس في المواويل الشرقية' : 'Master Vocalist Breathing Rules'}
          </h4>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed font-arabic">
            {lang === 'ar'
              ? 'في الغناء العربي والمواويل الطويلة، لا تملأ رئتيك بحبس الهواء في الصدر العلوي أو رفع الأكتاف؛ بل تنفس عميقاً من الحجاب الحاجز والبطن لتوسيع القفص الصدري سفلياً. ادعم ختام الجملة بضغط بطني مرن لتفادي هبوط النغمة (Pitch Droop) على نغمة القرار.'
              : 'In Arabic Mawwal singing, never raise shoulders or lock your upper chest. Breathe low into the diaphragm and lower ribs. Support phrase endings with flexible abdominal engagement to eliminate pitch droop on the tonic cadence.'}
          </p>
        </div>
      </div>
    </div>
  );
};
