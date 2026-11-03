import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundSynth } from '../utils/soundSynth';
import { MaqamDefinition } from '../utils/maqamData';
import { useLanguage } from '../context/LanguageContext';
import { PitchDetectionResult } from '../utils/pitchDetector';
import {
  VOCAL_PRESETS,
  VoicePreset,
  VoiceClassificationId,
  SavedVocalRange,
  getSavedVocalRange,
  saveVocalRangeToStorage,
} from '../utils/vocalRangeStorage';
import {
  Music,
  Sparkles,
  Mic,
  MicOff,
  Activity,
  Award,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Check,
  Save,
  Columns,
  Rows,
  Flame,
  Volume2,
  ArrowUpDown,
  LocateFixed,
  X,
  Compass,
} from 'lucide-react';

interface VirtualInstrumentsProps {
  currentMaqam: MaqamDefinition;
  currentPitch?: PitchDetectionResult | null;
  isListening?: boolean;
  onStartListening?: () => void;
  onStopListening?: () => void;
}

export interface PianoKey {
  note: string; // e.g. "C2", "E½b4", "F#3"
  baseNote: string; // e.g. "C", "E½b", "F#"
  arabicName: string;
  octave: number;
  freq: number;
  midi: number;
  isBlack: boolean;
  isQuarter: boolean;
  register: 'chest' | 'passaggio' | 'head';
  quarterLabel?: string;
}

// Generate full 4-octave + C6 vocal range piano keys (C2 to C6)
function generateVocalRangePiano(): PianoKey[] {
  const keys: PianoKey[] = [];

  const octaveDefs = [
    { name: 'C', isBlack: false, isQuarter: false, arabic: 'دو / راست' },
    { name: 'C#', isBlack: true, isQuarter: false, arabic: 'دو دييز' },
    { name: 'D', isBlack: false, isQuarter: false, arabic: 'دوكاه / ري' },
    { name: 'E½b', isBlack: true, isQuarter: true, arabic: 'سيكاه', quarterLabel: '½♭ SIKAH' },
    { name: 'Eb', isBlack: true, isQuarter: false, arabic: 'بيمول' },
    { name: 'E', isBlack: false, isQuarter: false, arabic: 'بوسليك / مي' },
    { name: 'F', isBlack: false, isQuarter: false, arabic: 'جهاركاه / فا' },
    { name: 'F#', isBlack: true, isQuarter: false, arabic: 'حجاز / فا دييز' },
    { name: 'G', isBlack: false, isQuarter: false, arabic: 'نوى / صول' },
    { name: 'Ab', isBlack: true, isQuarter: false, arabic: 'حصار / لا بيمول' },
    { name: 'A', isBlack: false, isQuarter: false, arabic: 'حسيني / لا' },
    { name: 'B½b', isBlack: true, isQuarter: true, arabic: 'أوج', quarterLabel: '½♭ AWJ' },
    { name: 'Bb', isBlack: true, isQuarter: false, arabic: 'عجم / سي بيمول' },
    { name: 'B', isBlack: false, isQuarter: false, arabic: 'ماهور / سي' },
  ];

  // Octaves 2 to 5
  for (let oct = 2; oct <= 5; oct++) {
    octaveDefs.forEach((def) => {
      let semitoneOffset = 0;
      switch (def.name) {
        case 'C': semitoneOffset = 0; break;
        case 'C#': semitoneOffset = 1; break;
        case 'D': semitoneOffset = 2; break;
        case 'E½b': semitoneOffset = 3.5; break;
        case 'Eb': semitoneOffset = 3; break;
        case 'E': semitoneOffset = 4; break;
        case 'F': semitoneOffset = 5; break;
        case 'F#': semitoneOffset = 6; break;
        case 'G': semitoneOffset = 7; break;
        case 'Ab': semitoneOffset = 8; break;
        case 'A': semitoneOffset = 9; break;
        case 'B½b': semitoneOffset = 10.5; break;
        case 'Bb': semitoneOffset = 10; break;
        case 'B': semitoneOffset = 11; break;
      }

      const midi = (oct + 1) * 12 + semitoneOffset;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      let register: 'chest' | 'passaggio' | 'head' = 'chest';
      if (freq < 330) {
        register = 'chest';
      } else if (freq < 392) {
        register = 'passaggio';
      } else {
        register = 'head';
      }

      keys.push({
        note: `${def.name}${oct}`,
        baseNote: def.name,
        arabicName: def.arabic,
        octave: oct,
        freq,
        midi,
        isBlack: def.isBlack,
        isQuarter: def.isQuarter,
        register,
        quarterLabel: def.quarterLabel,
      });
    });
  }

  // Cap with C6 (MIDI 84, 1046.5 Hz - High Soprano / Whistle Register entry)
  keys.push({
    note: 'C6',
    baseNote: 'C',
    arabicName: 'جواب الجواب',
    octave: 6,
    freq: 1046.5,
    midi: 84,
    isBlack: false,
    isQuarter: false,
    register: 'head',
  });

  return keys;
}

const ALL_PIANO_KEYS = generateVocalRangePiano();

export const VirtualInstruments: React.FC<VirtualInstrumentsProps> = ({
  currentMaqam,
  currentPitch,
  isListening = false,
  onStartListening,
  onStopListening,
}) => {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'piano' | 'oud'>('piano');
  const [lastPlayedNote, setLastPlayedNote] = useState<string | null>(null);

  // Fullscreen & Orientation state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pianoOrientation, setPianoOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [keyDensity, setKeyDensity] = useState<'compact' | 'normal' | 'spacious'>('normal');
  const [autoFollowVoice, setAutoFollowVoice] = useState<boolean>(true);

  // Persistent User Saved Vocal Range
  const [savedRange, setSavedRange] = useState<SavedVocalRange>(() => getSavedVocalRange());
  const [selectedVoicePreset, setSelectedVoicePreset] = useState<VoiceClassificationId>(() => getSavedVocalRange().voiceType);
  const [customLowNote, setCustomLowNote] = useState<string>(() => getSavedVocalRange().lowNote);
  const [customHighNote, setCustomHighNote] = useState<string>(() => getSavedVocalRange().highNote);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(() => getSavedVocalRange().isCustom || false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);

  // Visual Highlighting & Filtering Options
  const [dimOutOfRangeKeys, setDimOutOfRangeKeys] = useState<boolean>(true);
  const [showRegistersOverlay, setShowRegistersOverlay] = useState<boolean>(true);
  const [selectedOctaveFilter, setSelectedOctaveFilter] = useState<number | 'all'>('all');
  const [isPlayingWarmup, setIsPlayingWarmup] = useState<boolean>(false);

  // Live microphone session min/max stats
  const [userMinMidi, setUserMinMidi] = useState<number | null>(null);
  const [userMaxMidi, setUserMaxMidi] = useState<number | null>(null);
  const [userMinNote, setUserMinNote] = useState<string | null>(null);
  const [userMaxNote, setUserMaxNote] = useState<string | null>(null);

  const pianoScrollRef = useRef<HTMLDivElement>(null);
  const verticalContainerRef = useRef<HTMLDivElement>(null);
  const activeKeyElementRef = useRef<HTMLDivElement | null>(null);

  // Sync state when saved range changes in storage
  useEffect(() => {
    const current = getSavedVocalRange();
    setSavedRange(current);
    setSelectedVoicePreset(current.voiceType);
    setCustomLowNote(current.lowNote);
    setCustomHighNote(current.highNote);
    setIsCustomMode(!!current.isCustom);
  }, []);

  // Track live pitch from user's voice to capture dynamic vocal range during practice
  useEffect(() => {
    if (isListening && currentPitch && currentPitch.clarity > 0.6 && currentPitch.frequency > 55) {
      const midi = currentPitch.midi;
      const note = currentPitch.noteName;

      setUserMinMidi((prev) => {
        if (prev === null || midi < prev) {
          setUserMinNote(note);
          return Math.round(midi);
        }
        return prev;
      });

      setUserMaxMidi((prev) => {
        if (prev === null || midi > prev) {
          setUserMaxNote(note);
          return Math.round(midi);
        }
        return prev;
      });

      // Auto-follow voice scroll in vertical fullscreen mode
      if (autoFollowVoice && activeKeyElementRef.current && verticalContainerRef.current) {
        activeKeyElementRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [isListening, currentPitch, autoFollowVoice]);

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Toggle Fullscreen Mode with Vertical Rotation
  const toggleFullscreenVerticalMode = () => {
    if (!isFullscreen) {
      // Entering fullscreen: automatically switch to vertical orientation for ergonomics
      setIsFullscreen(true);
      setPianoOrientation('vertical');
      try {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {
        // Fallback to in-app overlay
      }
    } else {
      // Exiting fullscreen
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {
        // Fallback
      }
    }
  };

  // Handle Preset Selection
  const handleSelectPreset = (presetId: VoiceClassificationId) => {
    if (presetId === 'Custom') {
      setIsCustomMode(true);
      setSelectedVoicePreset('Custom');
      return;
    }

    setIsCustomMode(false);
    setSelectedVoicePreset(presetId);
    const preset = VOCAL_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setCustomLowNote(preset.lowNote);
      setCustomHighNote(preset.highNote);
    }
  };

  // Save current vocal range to persistent localStorage
  const handleSaveVocalRange = () => {
    let lowKey = ALL_PIANO_KEYS.find((k) => k.note === customLowNote);
    let highKey = ALL_PIANO_KEYS.find((k) => k.note === customHighNote);

    if (!lowKey || !highKey) {
      lowKey = ALL_PIANO_KEYS[14]; // C3
      highKey = ALL_PIANO_KEYS[42]; // A4
    }

    if (lowKey.midi > highKey.midi) {
      const temp = lowKey;
      lowKey = highKey;
      highKey = temp;
      setCustomLowNote(lowKey.note);
      setCustomHighNote(highKey.note);
    }

    const preset = VOCAL_PRESETS.find((p) => p.id === selectedVoicePreset);

    const newRange: SavedVocalRange = {
      voiceType: isCustomMode ? 'Custom' : selectedVoicePreset,
      labelEn: isCustomMode
        ? `Custom (${lowKey.note} – ${highKey.note})`
        : preset?.nameEn || selectedVoicePreset,
      labelAr: isCustomMode
        ? `مخصص (${lowKey.note} – ${highKey.note})`
        : preset?.nameAr || selectedVoicePreset,
      lowNote: lowKey.note,
      highNote: highKey.note,
      lowMidi: lowKey.midi,
      highMidi: highKey.midi,
      color: preset?.color || 'from-cyan-500 to-amber-500',
      savedAt: new Date().toISOString(),
      isCustom: isCustomMode,
    };

    saveVocalRangeToStorage(newRange);
    setSavedRange(newRange);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 2500);
  };

  // Adopt Microphone Live Measured Range
  const handleAdoptMicRange = () => {
    if (!userMinNote || !userMaxNote) return;
    setCustomLowNote(userMinNote);
    setCustomHighNote(userMaxNote);
    setIsCustomMode(true);
    setSelectedVoicePreset('Custom');
  };

  // Reset tracked vocal range session
  const handleResetUserRange = () => {
    setUserMinMidi(null);
    setUserMaxMidi(null);
    setUserMinNote(null);
    setUserMaxNote(null);
  };

  // 5 Classic Arabic Oud strings
  const oudStrings = [
    { name: 'C2 (القارة)', baseFreq: 130.81, label: 'C2' },
    { name: 'F2 (جهاركاه)', baseFreq: 174.61, label: 'F2' },
    { name: 'A2 (عشيران)', baseFreq: 220.0, label: 'A2' },
    { name: 'D3 (دوكاه)', baseFreq: 293.66, label: 'D3' },
    { name: 'G3 (نوى)', baseFreq: 392.0, label: 'G3' },
    { name: 'C4 (كردان)', baseFreq: 523.25, label: 'C4' },
  ];

  const oudFrets = [
    { name: 'Open (مطلق)', steps: 0, percent: 8, label: '0' },
    { name: 'Sikah (ربع تون)', steps: 1.5, percent: 24, label: '½♭' },
    { name: 'Minor (بيمول)', steps: 2, percent: 32, label: '♭' },
    { name: 'Natural (طبيعي)', steps: 3, percent: 46, label: '♮' },
    { name: 'Hijaz (دييز)', steps: 4, percent: 60, label: '♯' },
    { name: 'Fourth (الرابعة)', steps: 5, percent: 76, label: '4th' },
    { name: 'Fifth (الخامسة)', steps: 7, percent: 92, label: '5th' },
  ];

  const handlePlayOud = (freq: number, noteLabel: string) => {
    soundSynth.playOudNote(freq, 2.0);
    setLastPlayedNote(noteLabel);
    setTimeout(() => setLastPlayedNote((curr) => (curr === noteLabel ? null : curr)), 1200);
  };

  const handlePlayPiano = (freq: number, noteLabel: string) => {
    soundSynth.playPianoNote(freq, 2.2, 0.65);
    setLastPlayedNote(noteLabel);
    setTimeout(() => setLastPlayedNote((curr) => (curr === noteLabel ? null : curr)), 1200);
  };

  // Play an ascending/descending arpeggio of the user's saved vocal range
  const handlePlayRangeAudition = async () => {
    if (isPlayingWarmup) return;
    setIsPlayingWarmup(true);

    const keysInRange = ALL_PIANO_KEYS.filter(
      (k) => k.midi >= savedRange.lowMidi && k.midi <= savedRange.highMidi && !k.isQuarter
    );

    const step = Math.max(1, Math.floor(keysInRange.length / 8));
    const selectedScale = [];
    for (let i = 0; i < keysInRange.length; i += step) {
      selectedScale.push(keysInRange[i]);
    }
    if (selectedScale[selectedScale.length - 1]?.note !== keysInRange[keysInRange.length - 1]?.note) {
      selectedScale.push(keysInRange[keysInRange.length - 1]);
    }

    for (let i = 0; i < selectedScale.length; i++) {
      const k = selectedScale[i];
      if (k) {
        soundSynth.playPianoNote(k.freq, 0.75, 0.65);
        setLastPlayedNote(k.note);
      }
      await new Promise((r) => setTimeout(r, 450));
    }

    setIsPlayingWarmup(false);
  };

  // Check if a note is in the currently selected Maqam
  const isNoteInMaqam = (noteStr: string): boolean => {
    const base = noteStr.replace(/[0-9]/g, '');
    return currentMaqam.scaleDegrees.some(
      (deg) => deg.note.replace(/[0-9]/g, '') === base
    );
  };

  // Check if a note matches the user's live voice pitch
  const isKeySungLive = (keyNote: string): boolean => {
    if (!isListening || !currentPitch || currentPitch.clarity < 0.6) return false;
    return currentPitch.noteName === keyNote;
  };

  // Check if a key is inside the user's saved vocal range
  const isInsideSavedRange = (midi: number): boolean => {
    return midi >= savedRange.lowMidi - 0.2 && midi <= savedRange.highMidi + 0.2;
  };

  // Filter keys according to selected octave view
  const visibleKeys =
    selectedOctaveFilter === 'all'
      ? ALL_PIANO_KEYS
      : ALL_PIANO_KEYS.filter((k) => k.octave === selectedOctaveFilter);

  // In vertical mode: Top is Highest Pitch (C6 Head Voice), Bottom is Lowest Pitch (C2 Chest Voice)
  // Perfectly matching human vocal ergonomics where higher pitch = UP!
  const verticalKeys = [...visibleKeys].reverse();

  // Live singing intonation check against saved vocal range
  const getLiveSingingStatus = () => {
    if (!isListening || !currentPitch || currentPitch.clarity < 0.5) return null;
    const sungMidi = currentPitch.midi;

    if (sungMidi < savedRange.lowMidi - 0.5) {
      return {
        text: lang === 'ar' ? `⚠️ أدنى من مداك المحفوظ (${savedRange.lowNote})` : `⚠️ Below saved range (${savedRange.lowNote})`,
        color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        isInRange: false,
      };
    }
    if (sungMidi > savedRange.highMidi + 0.5) {
      return {
        text: lang === 'ar' ? `⚠️ أعلى من جوابك المحفوظ (${savedRange.highNote})` : `⚠️ Above saved range (${savedRange.highNote})`,
        color: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
        isInRange: false,
      };
    }
    return {
      text: lang === 'ar' ? `✅ متوافق مع مداك الصوتي (${savedRange.voiceType})` : `✅ Inside your vocal range (${savedRange.voiceType})`,
      color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      isInRange: true,
    };
  };

  const liveStatus = getLiveSingingStatus();

  // Scroll to Octave Helper
  const scrollToOctave = (octaveNum: number) => {
    const targetElement = document.getElementById(`vertical-key-C${octaveNum}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div
      className={`w-full flex flex-col gap-5 transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-4 sm:p-6 overflow-hidden bg-[#070913] text-slate-100'
          : 'p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-xl'
      }`}
    >
      {/* FULLSCREEN TOP FLOATING HUD (Visible when in Fullscreen Mode) */}
      {isFullscreen && (
        <header className="shrink-0 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 backdrop-blur-2xl shadow-2xl">
          {/* Brand & Active Vocal Range Info */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-cyan-500 text-slate-950 font-black">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-wide">
                  {lang === 'ar' ? 'البيانو العمودي للمدى الصوتي' : 'Vocal Range Vertical Piano'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {savedRange.voiceType}: {savedRange.lowNote} ➔ {savedRange.highNote}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-arabic">
                {lang === 'ar'
                  ? 'الصوت يتصاعد للأعلى (الجواب فوق والقرار تحت)'
                  : 'Pitch ascends upward: High notes Top ▲ / Low notes Bottom ▼'}
              </p>
            </div>
          </div>

          {/* Center: Live Pitch Intonation Feedback */}
          {liveStatus && (
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${liveStatus.color}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              <span>{liveStatus.text}</span>
              <span className="font-mono opacity-80">
                ({currentPitch?.noteName} • {currentPitch?.frequency.toFixed(1)} Hz)
              </span>
            </div>
          )}

          {/* Right Action Hub: Follow Voice, Audition, Mic & Exit */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Follow Voice Scroll Toggle */}
            <button
              onClick={() => setAutoFollowVoice(!autoFollowVoice)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                autoFollowVoice
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-500 border-white/5'
              }`}
              title="Auto-scroll to your live sung note"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {lang === 'ar' ? 'متابعة صوتي' : 'Follow Voice'}
              </span>
            </button>

            {/* Audition Warmup Scale */}
            <button
              onClick={handlePlayRangeAudition}
              disabled={isPlayingWarmup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-amber-300 transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">
                {isPlayingWarmup ? (lang === 'ar' ? 'جاري العزف...' : 'Playing...') : (lang === 'ar' ? 'عزف سلم مداك' : 'Audition Range')}
              </span>
            </button>

            {/* Mic Toggle */}
            {onStartListening && onStopListening && (
              <button
                onClick={isListening ? onStopListening : onStartListening}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">
                  {isListening ? (lang === 'ar' ? 'إيقاف المايك' : 'Stop Mic') : (lang === 'ar' ? 'تشغيل المايك' : 'Start Mic')}
                </span>
              </button>
            )}

            {/* Exit Fullscreen Button */}
            <button
              onClick={toggleFullscreenVerticalMode}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition shadow-sm"
              title="Exit Fullscreen Mode (Esc)"
            >
              <X className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إغلاق الشاشة' : 'Exit Fullscreen'}</span>
            </button>
          </div>
        </header>
      )}

      {/* NORMAL (IN-CARD) HEADER & CONTROLS (Hidden in Fullscreen) */}
      {!isFullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border border-white/10 text-cyan-300">
              <Music className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-wide">
                  {activeTab === 'piano'
                    ? lang === 'ar'
                      ? 'بيانو المدى الصوتي (24 ربع تون)'
                      : 'Vocal Range Microtonal Piano (24-TET)'
                    : t('virtualOud')}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-cyan-500/20 text-amber-300 border border-amber-500/30">
                  {savedRange.voiceType} ({savedRange.lowNote}–{savedRange.highNote})
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {activeTab === 'piano'
                  ? lang === 'ar'
                    ? 'الطبقات المنخفضة يسار والعالية يمين • حدد واحفظ مداك الصوتي لتظليله أثناء التمرين'
                    : 'Low notes on Left, High on Right • Set & save your personal vocal range to highlight keys during practice'
                  : t('oudDesc')}
              </p>
            </div>
          </div>

          {/* Action & View Switchers */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* FULLSCREEN VERTICAL MODE TOGGLE (PRIMARY USER REQUEST) */}
            {activeTab === 'piano' && (
              <button
                onClick={toggleFullscreenVerticalMode}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/25 transition active:scale-95 group"
                title="Expand piano to fill screen vertically (تدريب عمودي ع قد الشاشة)"
              >
                <Maximize2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>
                  {lang === 'ar' ? 'ملء الشاشة بالوضع العمودي' : 'Fullscreen Vertical Mode'}
                </span>
              </button>
            )}

            {/* In-Card Orientation Switcher */}
            {activeTab === 'piano' && (
              <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-white/10">
                <button
                  onClick={() => setPianoOrientation('horizontal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pianoOrientation === 'horizontal'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Horizontal Piano"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'أفقي' : 'Horizontal'}</span>
                </button>
                <button
                  onClick={() => setPianoOrientation('vertical')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    pianoOrientation === 'vertical'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vertical Piano"
                >
                  <Rows className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'عمودي' : 'Vertical'}</span>
                </button>
              </div>
            )}

            {/* Instrument Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveTab('piano')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'piano'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🎹 {lang === 'ar' ? 'البيانو' : 'Piano'}
              </button>
              <button
                onClick={() => setActiveTab('oud')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'oud'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🪕 {lang === 'ar' ? 'العود' : 'Oud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOCAL RANGE SETTING & SAVING HUB (Card in normal view, expandable) */}
      {activeTab === 'piano' && (
        <div className={`p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/20 shadow-lg flex flex-col gap-4 ${
          isFullscreen ? 'shrink-0' : ''
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold text-white">
                {lang === 'ar' ? 'تحديد وحفظ المدى الصوتي للتدريب:' : 'Set & Save Your Personal Vocal Range:'}
              </h4>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {lang === 'ar' ? '(يتم تظليل مفاتيحك وحفظها تلقائياً)' : '(Keys are visually highlighted & saved)'}
              </span>
            </div>

            {/* Save & Audition Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayRangeAudition}
                disabled={isPlayingWarmup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-amber-300 transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isPlayingWarmup
                    ? lang === 'ar' ? 'جاري العزف...' : 'Auditioning...'
                    : lang === 'ar' ? 'سماع سلم مداك' : 'Audition Range'}
                </span>
              </button>

              <button
                onClick={handleSaveVocalRange}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition active:scale-95"
              >
                {saveSuccessMsg ? <Check className="w-4 h-4 text-emerald-950 stroke-[3]" /> : <Save className="w-3.5 h-3.5" />}
                <span>
                  {saveSuccessMsg
                    ? lang === 'ar' ? 'تم الحفظ بنجاح!' : 'Saved to Profile!'
                    : lang === 'ar' ? 'حفظ المدى الصوتي' : 'Save Vocal Range'}
                </span>
              </button>
            </div>
          </div>

          {/* Vocal Presets Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {VOCAL_PRESETS.map((preset) => {
              const isSelected = !isCustomMode && selectedVoicePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    isSelected
                      ? `bg-gradient-to-r ${preset.color} text-white shadow-lg shadow-amber-500/20 border-white/40 ring-2 ring-amber-400/50 scale-105`
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/5'
                  }`}
                >
                  <span>{lang === 'ar' ? preset.nameAr : preset.nameEn}</span>
                  <span className="text-[10px] font-mono opacity-80">
                    ({preset.lowNote}–{preset.highNote})
                  </span>
                </button>
              );
            })}

            {/* Custom Range Selector Pill */}
            <button
              onClick={() => handleSelectPreset('Custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                isCustomMode
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md border-white/40 ring-2 ring-cyan-400/50 scale-105'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/5'
              }`}
            >
              <span>{lang === 'ar' ? 'مخصص (Custom)' : 'Custom Range'}</span>
            </button>
          </div>

          {/* Custom Range Selectors if in custom mode */}
          {isCustomMode && (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">{lang === 'ar' ? 'أدنى نغمة (قرار):' : 'Lowest Note:'}</span>
                  <select
                    value={customLowNote}
                    onChange={(e) => setCustomLowNote(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-cyan-300 font-mono font-bold"
                  >
                    {ALL_PIANO_KEYS.filter((k) => !k.isQuarter).map((k) => (
                      <option key={`low-${k.note}`} value={k.note}>
                        {k.note} ({k.arabicName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold">{lang === 'ar' ? 'أعلى نغمة (جواب):' : 'Highest Note:'}</span>
                  <select
                    value={customHighNote}
                    onChange={(e) => setCustomHighNote(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1 text-amber-300 font-mono font-bold"
                  >
                    {ALL_PIANO_KEYS.filter((k) => !k.isQuarter).map((k) => (
                      <option key={`high-${k.note}`} value={k.note}>
                        {k.note} ({k.arabicName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {userMinNote && userMaxNote && (
                <button
                  onClick={handleAdoptMicRange}
                  className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'ar'
                      ? `اعتماد قياس المايك (${userMinNote} ➔ ${userMaxNote})`
                      : `Use Mic Range (${userMinNote} ➔ ${userMaxNote})`}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Active Range Status & Visual Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">
                {lang === 'ar' ? 'المدى المحفوظ للتظليل:' : 'Active Highlighted Range:'}
              </span>
              <span className="font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                {savedRange.lowNote} ➔ {savedRange.highNote}
              </span>
              <span className="text-slate-400">
                ({savedRange.labelEn})
              </span>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition">
                <input
                  type="checkbox"
                  checked={dimOutOfRangeKeys}
                  onChange={(e) => setDimOutOfRangeKeys(e.target.checked)}
                  className="rounded border-white/20 bg-slate-950 text-amber-500 focus:ring-0"
                />
                <span className="text-[11px]">
                  {lang === 'ar' ? 'تعتيم المفاتيح خارج المدى' : 'Dim Outside Keys'}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition">
                <input
                  type="checkbox"
                  checked={showRegistersOverlay}
                  onChange={(e) => setShowRegistersOverlay(e.target.checked)}
                  className="rounded border-white/20 bg-slate-950 text-cyan-500 focus:ring-0"
                />
                <span className="text-[11px]">
                  {lang === 'ar' ? 'إظهار مناطق الصوت' : 'Show Registers'}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* LIVE SINGING NOTIFICATION BAR (When not in fullscreen) */}
      {!isFullscreen && liveStatus && (
        <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${liveStatus.color}`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
            <span>{liveStatus.text}</span>
          </div>
          <div className="font-mono">
            {lang === 'ar' ? 'صوتك:' : 'Your Pitch:'} {currentPitch?.noteName} ({currentPitch?.frequency.toFixed(1)} Hz)
          </div>
        </div>
      )}

      {/* QUICK OCTAVE FILTER & ERGONOMIC SHORTCUTS */}
      {activeTab === 'piano' && (
        <div className={`flex flex-wrap items-center justify-between gap-3 text-xs ${isFullscreen ? 'shrink-0' : ''}`}>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-white/10 overflow-x-auto scrollbar-none">
            <span className="text-[10px] text-slate-400 px-2 font-medium">
              {lang === 'ar' ? 'القفز السريع:' : 'Quick Jump:'}
            </span>
            {[
              { id: 'all', label: lang === 'ar' ? 'الكل (C2 - C6)' : 'Full (C2-C6)', oct: null },
              { id: 2, label: lang === 'ar' ? 'قرار عميق C2' : 'Bass C2', oct: 2 },
              { id: 3, label: lang === 'ar' ? 'قرار باريتون C3' : 'Baritone C3', oct: 3 },
              { id: 4, label: lang === 'ar' ? 'عبور وباساجيو C4' : 'Passaggio C4', oct: 4 },
              { id: 5, label: lang === 'ar' ? 'جواب رأسي C5' : 'Head C5', oct: 5 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (pianoOrientation === 'vertical' && item.oct) {
                    scrollToOctave(item.oct);
                  } else {
                    setSelectedOctaveFilter(item.id as any);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                  selectedOctaveFilter === item.id
                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-amber-300 bg-gradient-to-r from-amber-500 to-amber-600 shadow-sm shadow-amber-500/40" />
              <span>{lang === 'ar' ? 'مداك المحفوظ' : 'Saved Range'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-300" />
              <span>{lang === 'ar' ? 'ربع تون شرقي (سيكاه)' : 'Quarter-Tone (½♭)'}</span>
            </div>
          </div>
        </div>
      )}

      {/* PIANO INTERFACES (HORIZONTAL OR VERTICAL) */}
      {activeTab === 'piano' && (
        <div className={`flex flex-col gap-4 ${isFullscreen ? 'flex-1 overflow-hidden' : ''}`}>
          {/* 1. HORIZONTAL MODE: Low notes Left, High notes Right */}
          {pianoOrientation === 'horizontal' && (
            <div
              ref={pianoScrollRef}
              dir="ltr"
              className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-cyan-800 scrollbar-track-slate-950/60"
            >
              <div className="min-w-[1020px] relative flex h-64 bg-slate-950 p-4 rounded-3xl border border-white/10 select-none shadow-2xl">
                {visibleKeys.map((k) => {
                  const inMaqam = isNoteInMaqam(k.note);
                  const isSung = isKeySungLive(k.note);
                  const inSavedRange = isInsideSavedRange(k.midi);
                  const isLowBound = k.note === savedRange.lowNote;
                  const isHighBound = k.note === savedRange.highNote;
                  const isDimmed = dimOutOfRangeKeys && !inSavedRange && !isSung;

                  const registerBorder =
                    k.register === 'chest'
                      ? 'border-b-4 border-blue-500'
                      : k.register === 'passaggio'
                      ? 'border-b-4 border-amber-400'
                      : 'border-b-4 border-purple-500';

                  return (
                    <button
                      key={k.note}
                      onClick={() => handlePlayPiano(k.freq, k.note)}
                      className={`relative flex flex-col justify-end items-center pb-3 rounded-b-2xl border transition-all active:translate-y-1 group ${
                        k.isQuarter
                          ? 'w-11 h-40 -mx-5.5 z-20 bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 text-slate-950 border-amber-300 shadow-xl shadow-amber-500/40 ring-1 ring-amber-400'
                          : k.isBlack
                          ? 'w-10 h-40 -mx-5 z-10 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 hover:from-slate-800 hover:to-slate-900 text-slate-300 border-slate-700 shadow-lg'
                          : 'flex-1 h-56 z-0 bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 hover:from-white hover:to-slate-200 text-slate-900 border-slate-400 shadow-md'
                      } ${
                        showRegistersOverlay ? registerBorder : ''
                      } ${
                        inSavedRange && !k.isQuarter && !k.isBlack
                          ? '!bg-gradient-to-b !from-amber-100/90 !via-cyan-100/80 !to-slate-100 ring-1 ring-amber-400/60 shadow-lg shadow-amber-500/10'
                          : ''
                      } ${
                        inSavedRange && k.isBlack
                          ? '!border-amber-400/80 ring-1 ring-amber-400/50'
                          : ''
                      } ${
                        inMaqam && !k.isQuarter
                          ? 'ring-2 ring-cyan-400/90 shadow-cyan-500/30'
                          : ''
                      } ${
                        isDimmed ? 'opacity-40 grayscale-[25%]' : 'opacity-100'
                      } ${
                        isSung
                          ? '!bg-gradient-to-b !from-amber-300 !to-cyan-400 !text-slate-950 ring-4 ring-amber-400 animate-pulse z-30 scale-105 shadow-2xl shadow-cyan-500/70 !opacity-100'
                          : ''
                      }`}
                    >
                      {inSavedRange && (
                        <span className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-cyan-400 shadow-sm" />
                      )}

                      {isLowBound && (
                        <span className="absolute top-2 px-1 rounded text-[7px] font-black uppercase tracking-tight bg-blue-600 text-white shadow ring-1 ring-blue-300">
                          LOW
                        </span>
                      )}
                      {isHighBound && (
                        <span className="absolute top-2 px-1 rounded text-[7px] font-black uppercase tracking-tight bg-purple-600 text-white shadow ring-1 ring-purple-300">
                          HIGH
                        </span>
                      )}

                      {showRegistersOverlay && !isLowBound && !isHighBound && (
                        <span
                          className={`absolute top-1.5 px-1 rounded-[3px] text-[7px] font-black uppercase tracking-tighter ${
                            k.register === 'chest'
                              ? 'bg-blue-600/30 text-blue-300'
                              : k.register === 'passaggio'
                              ? 'bg-amber-500/30 text-amber-200'
                              : 'bg-purple-600/30 text-purple-200'
                          }`}
                        >
                          {k.register === 'chest' ? 'CHEST' : k.register === 'passaggio' ? 'PASS' : 'HEAD'}
                        </span>
                      )}

                      {k.isQuarter && (
                        <span className="absolute top-6 px-1 rounded text-[8px] font-black uppercase bg-slate-950 text-amber-300 shadow">
                          ½♭
                        </span>
                      )}

                      {isSung && (
                        <span className="absolute top-12 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-rose-500 text-white animate-bounce shadow">
                          VOICE
                        </span>
                      )}

                      <span
                        className={`text-[11px] font-extrabold font-mono tracking-tight leading-none ${
                          isSung
                            ? 'text-slate-950 font-black'
                            : k.isQuarter
                            ? 'text-slate-950'
                            : k.isBlack
                            ? 'text-cyan-300'
                            : 'text-slate-800'
                        }`}
                      >
                        {k.note}
                      </span>

                      <span
                        className={`text-[8px] font-arabic mt-1 opacity-80 ${
                          isSung
                            ? 'text-slate-950 font-bold'
                            : k.isQuarter
                            ? 'text-slate-900'
                            : k.isBlack
                            ? 'text-slate-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {k.arabicName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. VERTICAL ORIENTATION MODE: Fills Screen Vertically with Ergonomic Vocal Ladder */}
          {pianoOrientation === 'vertical' && (
            <div
              ref={verticalContainerRef}
              className={`w-full flex flex-col rounded-3xl bg-slate-950 p-4 border border-white/10 shadow-2xl overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-800 scrollbar-track-slate-950 ${
                isFullscreen ? 'flex-1 h-full' : 'max-h-[640px]'
              }`}
            >
              {/* Vertical Header Guides */}
              <div className="sticky top-0 z-20 flex items-center justify-between pb-3 mb-2 bg-slate-950/95 backdrop-blur-md border-b border-white/10 text-xs text-slate-400 font-bold px-2">
                <span className="text-purple-300 flex items-center gap-1">
                  ▲ {lang === 'ar' ? 'الطبقات العالية (الجواب / الرأسي C6)' : 'High Notes (Head / C6)'}
                </span>
                <span className="text-cyan-400 font-mono text-[11px]">
                  {lang === 'ar' ? 'سلّم الأصوات الصاعد عمودياً' : 'Ascending Vocal Ladder'}
                </span>
                <span className="text-blue-300 flex items-center gap-1">
                  ▼ {lang === 'ar' ? 'الطبقات المنخفضة (القرار C2)' : 'Low Notes (Chest / C2)'}
                </span>
              </div>

              {/* Vertical Keys Stack: High pitch at top, low pitch at bottom */}
              <div className="flex flex-col gap-1.5 pb-6">
                {verticalKeys.map((k) => {
                  const inMaqam = isNoteInMaqam(k.note);
                  const isSung = isKeySungLive(k.note);
                  const inSavedRange = isInsideSavedRange(k.midi);
                  const isLowBound = k.note === savedRange.lowNote;
                  const isHighBound = k.note === savedRange.highNote;
                  const isDimmed = dimOutOfRangeKeys && !inSavedRange && !isSung;

                  return (
                    <div
                      key={`vert-${k.note}`}
                      id={`vertical-key-${k.note}`}
                      ref={isSung ? (el) => { activeKeyElementRef.current = el; } : null}
                      onClick={() => handlePlayPiano(k.freq, k.note)}
                      className={`relative flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all border select-none group active:scale-[0.99] ${
                        k.isQuarter
                          ? 'bg-gradient-to-r from-amber-950/80 via-amber-900/90 to-amber-950 text-amber-200 border-amber-400/60 shadow-lg shadow-amber-500/10'
                          : k.isBlack
                          ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 hover:from-slate-900 hover:to-slate-850 text-slate-300 border-slate-800'
                          : 'bg-gradient-to-r from-slate-900/90 via-slate-850 to-slate-900 hover:from-slate-800 hover:to-slate-850 text-white border-white/10'
                      } ${
                        inSavedRange
                          ? 'ring-2 ring-amber-400/70 !border-amber-400/80 bg-amber-950/20 shadow-md shadow-amber-500/10'
                          : ''
                      } ${
                        isDimmed ? 'opacity-35 grayscale-[35%]' : 'opacity-100'
                      } ${
                        isSung
                          ? '!bg-gradient-to-r !from-amber-400 !via-cyan-400 !to-blue-500 !text-slate-950 ring-4 ring-amber-400 animate-pulse scale-[1.01] shadow-2xl z-30 !opacity-100 font-black'
                          : ''
                      }`}
                    >
                      {/* Left: Note details, Octave & Quarter-tone badge */}
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-base tracking-wide">
                          {k.note}
                        </span>

                        <span className="text-xs font-arabic opacity-80">
                          {k.arabicName}
                        </span>

                        {k.isQuarter && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 shadow-sm">
                            ½♭ سيكاه
                          </span>
                        )}

                        {inMaqam && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {currentMaqam.name.split(' ')[1] || 'Maqam'}
                          </span>
                        )}
                      </div>

                      {/* Center: Saved Vocal Range Tags & Register Pill */}
                      <div className="flex items-center gap-2">
                        {isLowBound && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-blue-600 text-white shadow-md ring-1 ring-blue-300">
                            {lang === 'ar' ? 'أدنى نغمة بمداك (قرار)' : 'LOW BOUND'}
                          </span>
                        )}

                        {isHighBound && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-purple-600 text-white shadow-md ring-1 ring-purple-300">
                            {lang === 'ar' ? 'أعلى نغمة بمداك (جواب)' : 'HIGH BOUND'}
                          </span>
                        )}

                        {inSavedRange && !isLowBound && !isHighBound && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {savedRange.voiceType}
                          </span>
                        )}

                        {showRegistersOverlay && (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              k.register === 'chest'
                                ? 'bg-blue-900/40 text-blue-300'
                                : k.register === 'passaggio'
                                ? 'bg-amber-900/40 text-amber-300'
                                : 'bg-purple-900/40 text-purple-300'
                            }`}
                          >
                            {k.register.toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Right: Frequency & Live Sung indicator */}
                      <div className="flex items-center gap-2.5 font-mono text-xs">
                        {isSung ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 font-black animate-bounce shadow">
                            VOICE ACTIVE
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            {k.freq.toFixed(1)} Hz
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Virtual Arabic Oud Fretboard (when not in fullscreen) */}
      {!isFullscreen && activeTab === 'oud' && (
        <div className="flex flex-col gap-4">
          <div className="relative w-full rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-amber-950/60 border border-amber-500/20 p-5 shadow-2xl overflow-x-auto scrollbar-thin scrollbar-thumb-amber-700/50">
            <div className="min-w-[700px] flex flex-col gap-6">
              <div className="relative w-full h-6 border-b border-white/10">
                {oudFrets.map((fret) => (
                  <span
                    key={fret.name}
                    className="absolute text-[10px] font-mono text-slate-400 -translate-x-1/2"
                    style={{ left: `${fret.percent}%` }}
                  >
                    {fret.name}
                  </span>
                ))}
              </div>

              {oudStrings.map((str) => (
                <div key={str.name} className="relative flex items-center h-10 group">
                  <div
                    onClick={() => handlePlayOud(str.baseFreq, `${str.label} (Open)`)}
                    className="w-24 shrink-0 cursor-pointer pr-3 text-right text-xs font-bold text-amber-200 group-hover:text-amber-400 transition"
                  >
                    {str.name}
                  </div>

                  <div className="relative flex-1 h-1 bg-gradient-to-r from-amber-200/90 via-amber-400 to-amber-200/80 rounded-full shadow-md shadow-amber-500/30">
                    {oudFrets.map((fret) => {
                      const noteFreq = str.baseFreq * Math.pow(2, fret.steps / 12);
                      const isQuarter = fret.steps % 1 !== 0;

                      return (
                        <button
                          key={fret.name}
                          onClick={() => handlePlayOud(noteFreq, `${str.label} + ${fret.name}`)}
                          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all transform hover:scale-125 shadow-lg ${
                            isQuarter
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 ring-2 ring-amber-300 shadow-amber-500/50'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/20'
                          }`}
                          style={{ left: `${fret.percent}%` }}
                          title={`${str.name} - ${fret.name} (${noteFreq.toFixed(1)} Hz)`}
                        >
                          {fret.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 font-medium">
            💡 {t('pluckString')} •{' '}
            {lang === 'ar'
              ? 'العلامات المضيئة باللون الذهبي تمثل أرباع التون (السيكاه)'
              : 'Highlighted golden dots represent authentic Arabic quarter tones (Sikah)'}
          </p>
        </div>
      )}
    </div>
  );
};
