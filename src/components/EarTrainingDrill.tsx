import React, { useState, useEffect, useRef } from 'react';
import { soundSynth } from '../utils/soundSynth';
import { useLanguage } from '../context/LanguageContext';
import { PitchDetectionResult } from '../utils/pitchDetector';
import {
  Ear,
  Target,
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  Flame,
  Award,
  HelpCircle,
  Play,
  ArrowRight,
  ShieldCheck,
  Music,
} from 'lucide-react';

interface EarTrainingDrillProps {
  currentPitch: PitchDetectionResult | null;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
}

export interface MicrotonalInterval {
  id: string;
  nameEn: string;
  nameAr: string;
  cents: number;
  semitones: number;
  fractionLabel: string;
  maqamContextEn: string;
  maqamContextAr: string;
  difficulty: 'beginner' | 'intermediate' | 'pro';
  rootBase: string; // e.g. "D4"
  targetOffsetSteps: number; // in 24-TET quarter-steps (1 step = 0.5 semitone = 50 cents)
}

const INTERVAL_DATABASE: MicrotonalInterval[] = [
  {
    id: 'neutral-second',
    nameEn: 'Neutral Second (3/4 Tone)',
    nameAr: 'ثانية متوسطة (ثلاثة أرباع التون)',
    cents: 150,
    semitones: 1.5,
    fractionLabel: '¾ Tone',
    maqamContextEn: 'Signature interval of Maqam Bayati & Rast (e.g. D4 to E½b4 Sikah)',
    maqamContextAr: 'جوهر وأساس مقامي البياتي والراست (مثل المسافة من ري إلى مي نصف بيمول سيكاه)',
    difficulty: 'beginner',
    rootBase: 'D4',
    targetOffsetSteps: 3, // 3 quarter-steps = 150 cents
  },
  {
    id: 'half-step',
    nameEn: 'Minor Second / Half Step (1/2 Tone)',
    nameAr: 'ثانية صغيرة / نصف تون',
    cents: 100,
    semitones: 1.0,
    fractionLabel: '½ Tone',
    maqamContextEn: 'Found in Maqam Kurd and Hijaz (e.g. D4 to Eb4)',
    maqamContextAr: 'موجود في مقامي الكرد والحجاز (مثل من ري إلى مي بيمول)',
    difficulty: 'beginner',
    rootBase: 'D4',
    targetOffsetSteps: 2, // 2 quarter-steps = 100 cents
  },
  {
    id: 'whole-step',
    nameEn: 'Major Second / Whole Step (1 Tone)',
    nameAr: 'ثانية كبيرة / تون كامل',
    cents: 200,
    semitones: 2.0,
    fractionLabel: '1 Tone',
    maqamContextEn: 'Found in Maqam Ajam, Nahawand, and Western scales (e.g. C4 to D4)',
    maqamContextAr: 'موجود في مقامي العجم والنهاوند (مثل من دو إلى ري)',
    difficulty: 'beginner',
    rootBase: 'C4',
    targetOffsetSteps: 4, // 4 quarter-steps = 200 cents
  },
  {
    id: 'quarter-tone',
    nameEn: 'Quarter-Tone Shift (1/4 Tone)',
    nameAr: 'ربع تون نقي (50 سنت)',
    cents: 50,
    semitones: 0.5,
    fractionLabel: '¼ Tone',
    maqamContextEn: 'Subtle Arabic micro-ornament (Orab) and comma adjustment',
    maqamContextAr: 'انتقال دقيق جداً يُستخدم في العُرَب وتطريب السيكاه ونصف البيمول',
    difficulty: 'pro',
    rootBase: 'E4',
    targetOffsetSteps: 1, // 1 quarter-step = 50 cents
  },
  {
    id: 'neutral-third',
    nameEn: 'Neutral Third (1 ¾ Tone)',
    nameAr: 'ثالثة متوسطة (تون وثلاثة أرباع)',
    cents: 350,
    semitones: 3.5,
    fractionLabel: '1 ¾ Tone',
    maqamContextEn: 'The defining sonic pillar of Maqam Rast (C4 to E½b4 Sikah)',
    maqamContextAr: 'العماد الروحي لمقام الراست والسيكاه (من دو إلى مي نصف بيمول)',
    difficulty: 'intermediate',
    rootBase: 'C4',
    targetOffsetSteps: 7, // 7 quarter-steps = 350 cents
  },
  {
    id: 'minor-third',
    nameEn: 'Minor Third (1 ½ Tone)',
    nameAr: 'ثالثة صغيرة (تون ونصف)',
    cents: 300,
    semitones: 3.0,
    fractionLabel: '1 ½ Tone',
    maqamContextEn: 'Found in Maqam Nahawand and Kurd (e.g. C4 to Eb4)',
    maqamContextAr: 'موجود في مقام النهاوند والكرد (من دو إلى مي بيمول)',
    difficulty: 'intermediate',
    rootBase: 'C4',
    targetOffsetSteps: 6, // 6 quarter-steps = 300 cents
  },
  {
    id: 'major-third',
    nameEn: 'Major Third (2 Tones)',
    nameAr: 'ثالثة كبيرة (2 تون كامل)',
    cents: 400,
    semitones: 4.0,
    fractionLabel: '2 Tones',
    maqamContextEn: 'Signature sunny third of Maqam Ajam (C4 to E4)',
    maqamContextAr: 'الثالثة الصريحة في مقام العجم والماهور (من دو إلى مي طبيعية)',
    difficulty: 'intermediate',
    rootBase: 'C4',
    targetOffsetSteps: 8, // 8 quarter-steps = 400 cents
  },
  {
    id: 'augmented-second',
    nameEn: 'Augmented Second / Hijaz Leap (300 Cents)',
    nameAr: 'ثانية زائدة / قفزة الحجاز الشجية',
    cents: 300,
    semitones: 3.0,
    fractionLabel: '1 ½ Tone Step',
    maqamContextEn: 'The dramatic leap between degrees 2 and 3 in Maqam Hijaz (Eb4 to F#4)',
    maqamContextAr: 'القفزة الدرامية الشجية المميزة لمقام الحجاز (بين مي بيمول وفا دييز)',
    difficulty: 'intermediate',
    rootBase: 'D4',
    targetOffsetSteps: 6,
  },
  {
    id: 'saba-interval',
    nameEn: 'Sub-Fourth / Saba Degree (450 Cents)',
    nameAr: 'بُعد مقام الصبا الميكروي (450 سنت)',
    cents: 450,
    semitones: 4.5,
    fractionLabel: '2 ¼ Tones',
    maqamContextEn: 'Unique melancholic interval of Maqam Saba (D4 to G½b4)',
    maqamContextAr: 'البعد الحزين الفريد المميز لمقام الصبا (ري إلى صول نصف بيمول)',
    difficulty: 'pro',
    rootBase: 'D4',
    targetOffsetSteps: 9, // 9 quarter-steps = 450 cents
  },
];

const ROOT_NOTES = [
  { note: 'C4', freq: 261.63, midi: 60, nameAr: 'دو / راست' },
  { note: 'D4', freq: 293.66, midi: 62, nameAr: 'دوكاه / ري' },
  { note: 'G4', freq: 392.00, midi: 67, nameAr: 'نوى / صول' },
  { note: 'A4', freq: 440.00, midi: 69, nameAr: 'حسيني / لا' },
];

export const EarTrainingDrill: React.FC<EarTrainingDrillProps> = ({
  currentPitch,
  isListening,
  onStartListening,
  onStopListening,
}) => {
  const { lang } = useLanguage();

  // Mode: 'identify' (guess interval) vs 'sing' (sing it back)
  const [drillMode, setDrillMode] = useState<'identify' | 'sing'>('sing');
  const [difficulty, setDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'pro'>('all');
  const [instrument, setInstrument] = useState<'oud' | 'qanun' | 'piano' | 'sine'>('oud');

  // Active Challenge State
  const [currentInterval, setCurrentInterval] = useState<MicrotonalInterval>(INTERVAL_DATABASE[0]);
  const [rootNoteInfo, setRootNoteInfo] = useState(ROOT_NOTES[1]); // D4 default
  const [targetFreq, setTargetFreq] = useState<number>(320.24); // E½b4 Sikah
  const [targetNoteName, setTargetNoteName] = useState<string>('E½b4');
  const [targetArabicName, setTargetArabicName] = useState<string>('سيكاه');

  // Evaluation & Interactive State
  const [options, setOptions] = useState<MicrotonalInterval[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Sing-It-Back Live Match Stats
  const [singHoldTimeMs, setSingHoldTimeMs] = useState<number>(0);
  const [hasPassedSingChallenge, setHasPassedSingChallenge] = useState<boolean>(false);
  const [singScore, setSingScore] = useState<number | null>(null);

  // Gamification Stats
  const [score, setScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('maqamflow_ear_score') || '0', 10);
  });
  const [streak, setStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem('maqamflow_ear_streak') || '0', 10);
  });
  const [bestStreak, setBestStreak] = useState<number>(() => {
    return parseInt(localStorage.getItem('maqamflow_ear_best_streak') || '0', 10);
  });

  const lastProcessedTimeRef = useRef<number>(Date.now());

  // Generate a new random challenge
  const generateNewChallenge = () => {
    setIsAnswerRevealed(false);
    setSelectedOptionId(null);
    setHasPassedSingChallenge(false);
    setSingScore(null);
    setSingHoldTimeMs(0);

    // Filter intervals by difficulty
    const pool =
      difficulty === 'all'
        ? INTERVAL_DATABASE
        : INTERVAL_DATABASE.filter((i) => i.difficulty === difficulty);

    const randomInterval = pool[Math.floor(Math.random() * pool.length)] || INTERVAL_DATABASE[0];
    const randomRoot = ROOT_NOTES[Math.floor(Math.random() * ROOT_NOTES.length)];

    setCurrentInterval(randomInterval);
    setRootNoteInfo(randomRoot);

    // Calculate target frequency: rootFreq * 2^(targetOffsetSteps / 24)
    // In 24-TET, 1 quarter-step = 1/24 octave
    const calculatedTargetFreq = randomRoot.freq * Math.pow(2, randomInterval.targetOffsetSteps / 24);
    setTargetFreq(calculatedTargetFreq);

    // Approximate target note name
    const targetMidiContinuous = randomRoot.midi + randomInterval.targetOffsetSteps * 0.5;
    const isQuarter = randomInterval.targetOffsetSteps % 2 !== 0;

    let noteName = 'E½b4';
    let arabicName = 'سيكاه';

    if (randomInterval.id === 'neutral-second') {
      noteName = randomRoot.note === 'D4' ? 'E½b4' : 'D½b4';
      arabicName = 'سيكاه (ربع تون)';
    } else if (randomInterval.id === 'neutral-third') {
      noteName = randomRoot.note === 'C4' ? 'E½b4' : 'F½#4';
      arabicName = 'سيكاه الراست';
    } else if (randomInterval.id === 'half-step') {
      noteName = randomRoot.note === 'D4' ? 'Eb4' : 'Db4';
      arabicName = 'مي بيمول (كرد)';
    } else if (randomInterval.id === 'whole-step') {
      noteName = randomRoot.note === 'C4' ? 'D4' : 'E4';
      arabicName = 'دوكاه / ري';
    } else if (randomInterval.id === 'quarter-tone') {
      noteName = 'E½b4';
      arabicName = 'ربع تون سيكاه';
    } else if (randomInterval.id === 'augmented-second') {
      noteName = 'F#4';
      arabicName = 'حجاز فا دييز';
    } else if (randomInterval.id === 'saba-interval') {
      noteName = 'G½b4';
      arabicName = 'صبا نصف بيمول';
    } else {
      noteName = `Micro ${calculatedTargetFreq.toFixed(1)}Hz`;
      arabicName = 'درجة شرقية';
    }

    setTargetNoteName(noteName);
    setTargetArabicName(arabicName);

    // Create 4 distinct multiple choice options
    const otherPool = INTERVAL_DATABASE.filter((i) => i.id !== randomInterval.id);
    const shuffledOthers = [...otherPool].sort(() => 0.5 - Math.random()).slice(0, 3);
    const fourOptions = [randomInterval, ...shuffledOthers].sort(() => 0.5 - Math.random());
    setOptions(fourOptions);

    // Automatically play the challenge audio
    playIntervalAudio(randomRoot.freq, calculatedTargetFreq);
  };

  // Play a note using selected instrument
  const playTone = (freq: number, duration: number = 1.4) => {
    if (instrument === 'oud') {
      soundSynth.playOudNote(freq, duration);
    } else if (instrument === 'qanun') {
      soundSynth.playQanunNote(freq, duration);
    } else if (instrument === 'piano') {
      soundSynth.playPianoNote(freq, duration, 0.65);
    } else {
      soundSynth.playReferenceTone(freq, duration);
    }
  };

  // Play Root Note then Target Note
  const playIntervalAudio = async (rFreq: number = rootNoteInfo.freq, tFreq: number = targetFreq) => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);

    // 1. Play Root Note
    playTone(rFreq, 1.2);
    await new Promise((r) => setTimeout(r, 900));

    // 2. Play Target Note
    playTone(tFreq, 1.5);
    await new Promise((r) => setTimeout(r, 1200));

    setIsPlayingAudio(false);
  };

  // Play Harmonically (Both Together)
  const playTogether = () => {
    playTone(rootNoteInfo.freq, 2.0);
    playTone(targetFreq, 2.0);
  };

  // On initial mount, start first challenge
  useEffect(() => {
    generateNewChallenge();
  }, [difficulty]);

  // Handle Option Guess (Mode: Identify)
  const handleSelectOption = (option: MicrotonalInterval) => {
    if (isAnswerRevealed) return;
    setSelectedOptionId(option.id);
    setIsAnswerRevealed(true);

    const isCorrect = option.id === currentInterval.id;
    if (isCorrect) {
      const newScore = score + 25;
      const newStreak = streak + 1;
      const newBest = Math.max(bestStreak, newStreak);
      setScore(newScore);
      setStreak(newStreak);
      setBestStreak(newBest);
      localStorage.setItem('maqamflow_ear_score', newScore.toString());
      localStorage.setItem('maqamflow_ear_streak', newStreak.toString());
      localStorage.setItem('maqamflow_ear_best_streak', newBest.toString());

      // Play success chime
      setTimeout(() => {
        soundSynth.playReferenceTone(587.33, 0.4); // D5
        setTimeout(() => soundSynth.playReferenceTone(880, 0.6), 180); // A5
      }, 200);
    } else {
      setStreak(0);
      localStorage.setItem('maqamflow_ear_streak', '0');
    }
  };

  // Handle Real-Time Sing-It-Back Evaluation
  useEffect(() => {
    if (drillMode !== 'sing' || hasPassedSingChallenge) return;

    const now = Date.now();
    const dt = now - lastProcessedTimeRef.current;
    lastProcessedTimeRef.current = now;

    if (isListening && currentPitch && currentPitch.clarity > 0.65 && currentPitch.frequency > 60) {
      // Calculate cents deviation from target frequency:
      // cents = 1200 * log2(sungFreq / targetFreq)
      const centsDiff = 1200 * Math.log2(currentPitch.frequency / targetFreq);
      const absCents = Math.abs(centsDiff);

      // Tolerance window: within ±25 cents (quarter-tone precision!)
      if (absCents <= 25) {
        setSingHoldTimeMs((prev) => {
          const next = prev + Math.min(dt, 200);
          // If held accurately for 750ms: SUCCESS!
          if (next >= 750 && !hasPassedSingChallenge) {
            setHasPassedSingChallenge(true);
            const calculatedAccuracy = Math.max(70, Math.round(100 - absCents * 1.2));
            setSingScore(calculatedAccuracy);

            const newScore = score + 50;
            const newStreak = streak + 1;
            const newBest = Math.max(bestStreak, newStreak);
            setScore(newScore);
            setStreak(newStreak);
            setBestStreak(newBest);
            localStorage.setItem('maqamflow_ear_score', newScore.toString());
            localStorage.setItem('maqamflow_ear_streak', newStreak.toString());
            localStorage.setItem('maqamflow_ear_best_streak', newBest.toString());

            // Success fanfare
            setTimeout(() => {
              soundSynth.playOudNote(targetFreq * 2, 0.8);
            }, 100);
          }
          return next;
        });
      } else {
        // Slowly decay hold time if user wanders off pitch
        setSingHoldTimeMs((prev) => Math.max(0, prev - 40));
      }
    } else {
      setSingHoldTimeMs((prev) => Math.max(0, prev - 30));
    }
  }, [drillMode, isListening, currentPitch, targetFreq, hasPassedSingChallenge, score, streak, bestStreak]);

  // Compute live cents offset for the visual meter
  const currentLiveCentsOffset =
    currentPitch && currentPitch.frequency > 50
      ? Math.round(1200 * Math.log2(currentPitch.frequency / targetFreq))
      : null;

  return (
    <div className="w-full flex flex-col gap-6 p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-xl">
      {/* Module Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-white/10 text-amber-300">
            <Ear className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white tracking-wide">
                {lang === 'ar' ? 'تمرين تدريب الأذن والميكروتون' : 'Microtonal Ear-Training Drill'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                24-TET Arabic Ears
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? 'استمع للأبعاد الشرقية وأرباع التون (السيكاه، البياتي، الراست) ورددها بصوتك أو خمّن البُعد'
                : 'Listen to Arabic microtonal intervals (Sikah, Bayati, Rast) and sing them back or identify the interval'}
            </p>
          </div>
        </div>

        {/* Gamification Trophy HUD */}
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-white/10 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
            <Flame className="w-4 h-4 fill-current text-amber-400 animate-pulse" />
            <span>{streak} {lang === 'ar' ? 'متتالي' : 'Streak'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <span>{score} XP</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Mode, Instrument, Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/5 text-xs">
        {/* Mode Selector */}
        <div className="flex items-center justify-between p-1 rounded-xl bg-slate-900 border border-white/10">
          <button
            onClick={() => { setDrillMode('sing'); setHasPassedSingChallenge(false); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition ${
              drillMode === 'sing'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'ردد بصوتك (Sing Back)' : 'Sing It Back'}</span>
          </button>
          <button
            onClick={() => setDrillMode('identify')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold transition ${
              drillMode === 'identify'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تخمين البُعد (Identify)' : 'Identify Interval'}</span>
          </button>
        </div>

        {/* Instrument Selector */}
        <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-slate-900 border border-white/10">
          <span className="text-[10px] text-slate-400 px-2 font-medium">
            {lang === 'ar' ? 'الآلة:' : 'Instrument:'}
          </span>
          {[
            { id: 'oud', label: lang === 'ar' ? '🪕 عود' : '🪕 Oud' },
            { id: 'qanun', label: lang === 'ar' ? '🎼 قانون' : '🎼 Qanun' },
            { id: 'piano', label: lang === 'ar' ? '🎹 بيانو' : '🎹 Piano' },
            { id: 'sine', label: lang === 'ar' ? '〰 نغمة' : '〰 Sine' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setInstrument(item.id as any)}
              className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition ${
                instrument === item.id
                  ? 'bg-slate-800 text-amber-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-slate-900 border border-white/10">
          <span className="text-[10px] text-slate-400 px-2 font-medium">
            {lang === 'ar' ? 'المستوى:' : 'Level:'}
          </span>
          {[
            { id: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
            { id: 'beginner', label: lang === 'ar' ? 'مبتدئ' : 'Easy' },
            { id: 'intermediate', label: lang === 'ar' ? 'متوسط' : 'Medium' },
            { id: 'pro', label: lang === 'ar' ? 'محترف' : 'Pro' },
          ].map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setDifficulty(lvl.id as any)}
              className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition ${
                difficulty === lvl.id
                  ? 'bg-slate-800 text-cyan-300 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lvl.label}
            </button>
          ))}
        </div>
      </div>

      {/* CURRENT AUDIO CHALLENGE STAGE */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-amber-500/25 shadow-2xl flex flex-col items-center gap-6 text-center relative overflow-hidden">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />

        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          <span>{lang === 'ar' ? 'تمرين الميكروتون والاستماع الشرقي' : 'Active Microtonal Drill'}</span>
        </div>

        {/* Interval Notes Display Card */}
        <div className="flex items-center justify-center gap-6 sm:gap-12 w-full max-w-lg py-3">
          {/* 1. Root Note */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'ar' ? '1. نغمة الأساس (القرار)' : '1. Root Reference'}
            </span>
            <div
              onClick={() => playTone(rootNoteInfo.freq, 1.4)}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 border-slate-700 hover:border-cyan-400 flex flex-col items-center justify-center gap-1 cursor-pointer transition transform hover:scale-105 shadow-xl group"
            >
              <span className="text-xl sm:text-2xl font-black font-mono text-cyan-300 group-hover:text-cyan-200">
                {rootNoteInfo.note}
              </span>
              <span className="text-[10px] text-slate-400 font-arabic">
                {rootNoteInfo.nameAr}
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                {rootNoteInfo.freq.toFixed(1)} Hz
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1">
            <ArrowRight className="w-6 h-6 text-slate-500" />
            <span className="text-[10px] font-mono text-amber-400 font-black">
              {drillMode === 'sing' || isAnswerRevealed ? currentInterval.fractionLabel : '???'}
            </span>
          </div>

          {/* 2. Target Microtonal Note */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'ar' ? '2. النغمة الهدف (الميكروتون)' : '2. Target Microtone'}
            </span>
            <div
              onClick={() => playTone(targetFreq, 1.5)}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition transform hover:scale-105 shadow-xl border-2 ${
                drillMode === 'sing' || isAnswerRevealed
                  ? 'bg-gradient-to-br from-amber-950/60 to-slate-900 border-amber-400/80 shadow-amber-500/20'
                  : 'bg-slate-900 border-dashed border-white/20'
              }`}
            >
              {drillMode === 'sing' || isAnswerRevealed ? (
                <>
                  <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                    {targetNoteName}
                  </span>
                  <span className="text-[10px] text-amber-200 font-arabic">
                    {targetArabicName}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {targetFreq.toFixed(1)} Hz
                  </span>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <HelpCircle className="w-6 h-6 text-slate-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-bold">
                    {lang === 'ar' ? 'استمع وخمّن' : 'Listen & Guess'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Audio Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => playIntervalAudio()}
            disabled={isPlayingAudio}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {isPlayingAudio
                ? lang === 'ar' ? 'جاري العزف...' : 'Playing...'
                : lang === 'ar' ? 'إعادة عزف البُعد' : 'Replay Interval'}
            </span>
          </button>

          <button
            onClick={playTogether}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold transition"
            title="Play harmonic interval together"
          >
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>{lang === 'ar' ? 'عزف النغمتين معاً' : 'Play Harmonics'}</span>
          </button>

          <button
            onClick={generateNewChallenge}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-xs font-bold transition"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>{lang === 'ar' ? 'سؤال جديد' : 'Next Interval'}</span>
          </button>
        </div>

        {/* MODE A: SING IT BACK INTERACTIVE TUNNEL & GAUGE */}
        {drillMode === 'sing' && (
          <div className="w-full max-w-xl p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">
                  {lang === 'ar' ? 'غنِّ النغمة الهدف في المايكروفون:' : 'Sing The Target Note into Mic:'}
                </span>
                <span className="text-xs font-mono font-black text-amber-300">
                  {targetNoteName} ({targetFreq.toFixed(1)} Hz)
                </span>
              </div>

              {/* Mic Toggle Button */}
              {onStartListening && onStopListening && (
                <button
                  onClick={isListening ? onStopListening : onStartListening}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition shadow-sm ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isListening ? (lang === 'ar' ? 'إيقاف المايك' : 'Stop Mic') : (lang === 'ar' ? 'تشغيل المايك' : 'Start Mic')}</span>
                </button>
              )}
            </div>

            {/* Real-time Pitch Target Visualizer & Hold Progress Bar */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>-50 Cents (Flat)</span>
                <span className="text-amber-300 font-bold">🎯 Target: 0 Cents ({targetNoteName})</span>
                <span>+50 Cents (Sharp)</span>
              </div>

              {/* Cents Deviation Gauge */}
              <div className="relative w-full h-8 bg-slate-900 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
                {/* Center target tolerance zone (±25 cents) */}
                <div className="absolute top-0 bottom-0 w-24 bg-emerald-500/20 border-x border-emerald-500/40" />

                {/* Center Target Needle */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10" />

                {/* Live Pitch Indicator Pointer */}
                {currentLiveCentsOffset !== null && isListening ? (
                  <div
                    className="absolute top-1 bottom-1 w-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-500/80 transition-all duration-75 transform -translate-x-1/2 z-20"
                    style={{
                      left: `${Math.min(95, Math.max(5, 50 + (currentLiveCentsOffset / 50) * 45))}%`,
                    }}
                  />
                ) : (
                  <span className="text-[10px] text-slate-500">
                    {lang === 'ar' ? 'شغّل المايك وغنِّ النغمة' : 'Sing target note into mic'}
                  </span>
                )}
              </div>

              {/* Hold Progress Bar for Stability */}
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-slate-400">
                  {lang === 'ar' ? 'تثبيت النغمة بثبات (750ms):' : 'Pitch Stability Lock (750ms):'}
                </span>
                <span className="font-mono text-cyan-300">
                  {Math.min(100, Math.round((singHoldTimeMs / 750) * 100))}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, (singHoldTimeMs / 750) * 100)}%` }}
                />
              </div>
            </div>

            {/* Success Celebration Box */}
            {hasPassedSingChallenge && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50 flex items-center justify-between animate-bounce shadow-xl">
                <div className="flex items-center gap-3 text-left">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div>
                    <h5 className="font-black text-sm text-white">
                      {lang === 'ar' ? 'أحسنت! إتقان ميكروتون باهر (+50 XP)' : 'Brilliant Microtone Precision! (+50 XP)'}
                    </h5>
                    <p className="text-xs text-emerald-300">
                      {lang === 'ar'
                        ? `أصبت درجة ${targetArabicName} بدقة ${singScore}%`
                        : `You hit ${targetNoteName} with ${singScore}% intonation accuracy!`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={generateNewChallenge}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition shrink-0"
                >
                  {lang === 'ar' ? 'السؤال التالي ➔' : 'Next Drill ➔'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE B: IDENTIFY THE INTERVAL (MULTIPLE CHOICE) */}
        {drillMode === 'identify' && (
          <div className="w-full max-w-xl flex flex-col gap-3 mt-2">
            <span className="text-xs font-bold text-slate-300">
              {lang === 'ar' ? 'أيّ بُعد ميكروتون سمعته للتو؟' : 'Which microtonal interval did you just hear?'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                const isCorrect = opt.id === currentInterval.id;

                let btnStyle = 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-white/10';
                if (isAnswerRevealed) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/80 text-emerald-200 border-emerald-400 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/50';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/80 text-rose-200 border-rose-400 shadow-lg shadow-rose-500/20';
                  } else {
                    btnStyle = 'bg-slate-950/50 text-slate-500 border-white/5 opacity-50';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-4 rounded-2xl border flex flex-col gap-1.5 text-left transition transform active:scale-95 ${btnStyle}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-xs text-white">
                        {lang === 'ar' ? opt.nameAr : opt.nameEn}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-amber-300 font-extrabold">
                        {opt.cents} Cents
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      {lang === 'ar' ? opt.maqamContextAr : opt.maqamContextEn}
                    </p>

                    {isAnswerRevealed && isCorrect && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'إجابة صحيحة! (+25 XP)' : 'Correct Interval! (+25 XP)'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post-Answer Explanation Card */}
            {isAnswerRevealed && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                <div className="text-left text-xs">
                  <h6 className="font-bold text-white mb-0.5">
                    {lang === 'ar' ? currentInterval.nameAr : currentInterval.nameEn} ({currentInterval.cents} Cents)
                  </h6>
                  <p className="text-slate-400">
                    {lang === 'ar' ? currentInterval.maqamContextAr : currentInterval.maqamContextEn}
                  </p>
                </div>
                <button
                  onClick={generateNewChallenge}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shrink-0 transition"
                >
                  {lang === 'ar' ? 'السؤال التالي ➔' : 'Next Drill ➔'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Microtonal Intervals Reference Chart */}
      <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>{lang === 'ar' ? 'دليل الأبعاد والمقامات الشرقية المرجعي (24-TET):' : 'Arabic 24-TET Intervals Reference:'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-0.5">
            <span className="font-bold text-amber-300">ثانية متوسطة (150c)</span>
            <span className="text-[10px] text-slate-400">3/4 تون • أساس البياتي والراست</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-0.5">
            <span className="font-bold text-cyan-300">ثالثة متوسطة (350c)</span>
            <span className="text-[10px] text-slate-400">1 ¾ تون • عماد الراست والسيكاه</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-0.5">
            <span className="font-bold text-rose-300">ثانية زائدة (300c)</span>
            <span className="text-[10px] text-slate-400">قفزة الحجاز بين 2 و3</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-white/5 flex flex-col gap-0.5">
            <span className="font-bold text-purple-300">بُعد الصبا (450c)</span>
            <span className="text-[10px] text-slate-400">شجن وانكسار مقام الصبا</span>
          </div>
        </div>
      </div>
    </div>
  );
};
