import React, { useState, useEffect, useRef } from 'react';
import { soundSynth } from '../utils/soundSynth';
import { ScoreViewer, SheetNote } from './ScoreViewer';
import { useLanguage } from '../context/LanguageContext';
import { PitchDetectionResult } from '../utils/pitchDetector';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Save,
  Bookmark,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Music,
  Trash2,
  Download,
  Share2,
  Sliders,
  CheckCircle,
  Wind,
} from 'lucide-react';

export interface BackingMelodyTrack {
  id: string;
  songTitle: string;
  artist: string;
  maqam: string;
  maqamArabic: string;
  rootNote: string;
  bpm: number;
  iqaPattern: string;
  instrument: 'oud' | 'qanun' | 'ney';
  description?: string;
  createdAt: string;
  melodyNotes: {
    note: string;
    arabicName?: string;
    duration: number;
    frequency: number;
    lyric?: string;
    ornament?: string;
  }[];
  vocalSingAlongCues?: string[];
}

interface SmartMelodyStudioProps {
  isListening: boolean;
  currentPitch: PitchDetectionResult | null;
  onStartListening: () => void;
  onStopListening: () => void;
}

export const SmartMelodyStudio: React.FC<SmartMelodyStudioProps> = ({
  isListening,
  currentPitch,
  onStartListening,
  onStopListening,
}) => {
  const { t, lang, isRTL } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState<'oud' | 'qanun' | 'ney'>('oud');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNoteIdx, setActiveNoteIdx] = useState(-1);
  const [backingVolume, setBackingVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Dual-Track Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Current Loaded Track
  const [currentTrack, setCurrentTrack] = useState<BackingMelodyTrack>(() => {
    // Initial classic: Fairouz - Aatini Al-Naya Wa Ghanni
    return {
      id: 'default_aatini',
      songTitle: 'Aatini Al-Naya Wa Ghanni (أعطني الناي وغنِّ)',
      artist: 'Fairouz & Gibran Khalil Gibran',
      maqam: 'Maqam Nahawand',
      maqamArabic: 'مقام نهاوند',
      rootNote: 'C4 (Rast)',
      bpm: 92,
      iqaPattern: 'Wahda 4/4 (Dum - - Tak - -)',
      instrument: 'ney',
      description: 'Timeless spiritual song inspired by Gibran Khalil Gibran’s poem, composed in sweet soulful Maqam Nahawand.',
      createdAt: new Date().toLocaleDateString(),
      melodyNotes: [
        { note: 'C4', arabicName: 'راست', duration: 1.2, frequency: 261.63, lyric: 'أَعْـ' },
        { note: 'D4', arabicName: 'دوكاه', duration: 0.8, frequency: 293.66, lyric: 'ـطِـ' },
        { note: 'Eb4', arabicName: 'بوسليك', duration: 1.2, frequency: 311.13, lyric: 'ـنِي' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'النَّايَ' },
        { note: 'G4', arabicName: 'نوى', duration: 1.6, frequency: 392.00, lyric: 'وَغَنِّ' },
        { note: 'Ab4', arabicName: 'حصار', duration: 1.0, frequency: 415.30, lyric: 'فَالْـ' },
        { note: 'G4', arabicName: 'نوى', duration: 0.8, frequency: 392.00, lyric: 'ـغِنَا' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'سِرُّ' },
        { note: 'Eb4', arabicName: 'بوسليك', duration: 1.2, frequency: 311.13, lyric: 'الْوُ' },
        { note: 'D4', arabicName: 'دوكاه', duration: 0.8, frequency: 293.66, lyric: 'جُودْ' },
        { note: 'C4', arabicName: 'راست', duration: 2.2, frequency: 261.63, lyric: 'آهْ' },
      ],
      vocalSingAlongCues: [
        'Enter gently on the third beat with an open "Aah" vowel.',
        'Use airy breath tone to match the breathy Ney reed overtones.',
        'Hold the root tonic C with smooth non-vibrato then gentle terminal pulse.',
      ],
    };
  });

  // Saved Tracks Library (Session Saver)
  const [savedTracks, setSavedTracks] = useState<BackingMelodyTrack[]>(() => {
    try {
      const stored = localStorage.getItem('maqamflow_saved_tracks');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [showSavedDrawer, setShowSavedDrawer] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Playback timers
  const playTimeoutsRef = useRef<number[]>([]);

  // Famous Pre-set Songs for Request-to-Play
  const famousPresets = [
    { name: 'Tabki El-Toyour (تبكي الطيور)', artist: 'Wael Kfoury', maqam: 'Maqam Kurd', inst: 'oud' as const },
    { name: 'Enta Omri (إنت عمري)', artist: 'Umm Kulthum', maqam: 'Maqam Kurd', inst: 'qanun' as const },
    { name: 'Aatini Al-Naya (أعطني الناي وغنِّ)', artist: 'Fairouz', maqam: 'Maqam Nahawand', inst: 'ney' as const },
    { name: 'Awwal Marra (أول مرة تحب يا قلبي)', artist: 'Abdel Halim', maqam: 'Maqam Rast', inst: 'oud' as const },
    { name: 'Lamma Bada Yatathanna (لما بدا يتثنى)', artist: 'Andalusian Muwashshah', maqam: 'Maqam Nahawand', inst: 'qanun' as const },
    { name: 'Zorouni Koulli Sana Marra (زوروني)', artist: 'Sayed Darwish', maqam: 'Maqam Hijaz', inst: 'oud' as const },
  ];

  // Stop playback cleanly
  const stopPlayback = () => {
    playTimeoutsRef.current.forEach((t) => clearTimeout(t));
    playTimeoutsRef.current = [];
    setIsPlaying(false);
    setActiveNoteIdx(-1);
  };

  // Play backing melody notes with synchronized cursor
  const startPlayback = () => {
    stopPlayback();
    if (!currentTrack.melodyNotes || currentTrack.melodyNotes.length === 0) return;

    setIsPlaying(true);
    let accumulatedMs = 0;

    currentTrack.melodyNotes.forEach((n, idx) => {
      const tId = window.setTimeout(() => {
        setActiveNoteIdx(idx);
        if (!isMuted) {
          soundSynth.playInstrumentNote(
            currentTrack.instrument || selectedInstrument,
            n.frequency,
            (n.duration || 1.2) * 1.1,
            backingVolume
          );
        }
      }, accumulatedMs);

      playTimeoutsRef.current.push(tId);
      accumulatedMs += (n.duration || 1.2) * 1000;
    });

    // End of track timeout
    const endTId = window.setTimeout(() => {
      setIsPlaying(false);
      setActiveNoteIdx(-1);
    }, accumulatedMs);
    playTimeoutsRef.current.push(endTId);
  };

  // Start Dual-Track Recording (Backing Track + User Mic simultaneously)
  const startDualTrackRecording = async () => {
    try {
      setRecordedAudioUrl(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecordingVoice(true);

      // Start the backing track playback at the same instant!
      startPlayback();
    } catch (err) {
      console.error('Microphone error in backing studio:', err);
    }
  };

  const stopDualTrackRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecordingVoice(false);
    stopPlayback();
  };

  // Request-to-Play Engine: generate melody via Gemini AI
  const handleGenerateMelody = async (songName?: string, inst?: 'oud' | 'qanun' | 'ney') => {
    stopPlayback();
    setIsGenerating(true);
    const query = songName || searchQuery || 'Arabic Vocal Masterpiece';
    const instrument = inst || selectedInstrument;

    try {
      const res = await fetch('/api/generate-backing-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songQuery: query,
          preferredInstrument: instrument,
          bpm: 96,
        }),
      });

      const data = await res.json();
      if (data.success && data.track) {
        const newTrack: BackingMelodyTrack = {
          ...data.track,
          id: `track_${Date.now()}`,
          createdAt: new Date().toLocaleDateString(),
          instrument,
        };
        setCurrentTrack(newTrack);
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err) {
      console.warn('AI generation error, using fallback melody:', err);
      // Fallback curated track
      const fallbackTrack: BackingMelodyTrack = {
        id: `track_${Date.now()}`,
        songTitle: query,
        artist: 'Master Arabic Composer',
        maqam: 'Maqam Bayati',
        maqamArabic: 'مقام بياتي',
        rootNote: 'D4 (Dukah)',
        bpm: 104,
        iqaPattern: 'Maqsum 4/4',
        instrument,
        description: 'Rich melodic backing track with authentic quarter-tones and acoustic resonance.',
        createdAt: new Date().toLocaleDateString(),
        melodyNotes: [
          { note: 'D4', arabicName: 'دوكاه', duration: 1.0, frequency: 293.66, lyric: 'يَا' },
          { note: 'E½b4', arabicName: 'سيكاه', duration: 1.0, frequency: 320.24, lyric: 'لَيْل' },
          { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'يَا' },
          { note: 'G4', arabicName: 'نوى', duration: 1.4, frequency: 392.00, lyric: 'عَيْن' },
          { note: 'A4', arabicName: 'حسيني', duration: 1.2, frequency: 440.00, lyric: 'آه' },
          { note: 'G4', arabicName: 'نوى', duration: 0.8, frequency: 392.00, lyric: 'حَبِيبِي' },
          { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'رُوحي' },
          { note: 'E½b4', arabicName: 'سيكاه', duration: 1.2, frequency: 320.24, lyric: 'طَابْ' },
          { note: 'D4', arabicName: 'دوكاه', duration: 2.0, frequency: 293.66, lyric: 'دَامْ' },
        ],
        vocalSingAlongCues: [
          'Listen for the opening 2 beats of the Oud before vocalizing.',
          'Sustain the neutral second (Sikah) with light diaphragm vibrato.',
        ],
      };
      setCurrentTrack(fallbackTrack);
    } finally {
      setIsGenerating(false);
    }
  };

  // Session Saver: Save Track to Local Library
  const handleSaveTrack = () => {
    if (!currentTrack) return;
    const exists = savedTracks.some((t) => t.id === currentTrack.id);
    let updated: BackingMelodyTrack[];
    if (exists) {
      updated = savedTracks.map((t) => (t.id === currentTrack.id ? currentTrack : t));
    } else {
      updated = [currentTrack, ...savedTracks];
    }
    setSavedTracks(updated);
    try {
      localStorage.setItem('maqamflow_saved_tracks', JSON.stringify(updated));
    } catch (e) {}

    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  // Delete Track from Library
  const handleDeleteTrack = (id: string) => {
    const updated = savedTracks.filter((t) => t.id !== id);
    setSavedTracks(updated);
    try {
      localStorage.setItem('maqamflow_saved_tracks', JSON.stringify(updated));
    } catch (e) {}
  };

  // Convert melody notes for ScoreViewer
  const sheetNotes: SheetNote[] = currentTrack.melodyNotes.map((n, i) => ({
    note: n.note,
    arabicName: n.arabicName,
    duration: n.duration,
    timestamp: i * 1.2,
    frequency: n.frequency,
    lyric: n.lyric,
  }));

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Studio Banner & Request Engine */}
      <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-cyan-500/20 text-amber-300 border border-amber-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Melody Player & Vocal Backing Track Studio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
              {lang === 'ar' ? 'استوديو اللحن الذكي والتراك الصوتي التفاعلي' : 'AI Backing Track & Virtual Instrument Studio'}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              {lang === 'ar'
                ? 'اطلب أي أغنية عربية أو موشح، وسيقوم الذكاء الاصطناعي بتوليد اللحن الموسيقي الكامل بالعود أو القانون أو الناي. سجّل صوتك فوق التراك وتحكم بالمستوى كاستوديو حقيقي.'
                : 'Request any Arabic classic or song. AI generates a full-length instrumental backing track (Oud, Qanun, or Ney) with interactive cursor synchronization and dual-track vocal recording.'}
            </p>
          </div>

          {/* Library & Save Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSaveTrack}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{saveSuccessNotice ? (lang === 'ar' ? 'تم الحفظ!' : 'Saved!') : (lang === 'ar' ? 'حفظ التراك' : 'Save Track')}</span>
            </button>

            <button
              onClick={() => setShowSavedDrawer(!showSavedDrawer)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-white/10 transition"
            >
              <Bookmark className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'ar' ? 'مكتبة التراكات' : 'Track Library'} ({savedTracks.length})</span>
            </button>
          </div>
        </div>

        {/* Request-to-Play Input Hub */}
        <div className="flex flex-col md:flex-row items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-white/10">
          {/* Instrument Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10 shrink-0">
            {(
              [
                { id: 'oud', name: 'Oud (عود)' },
                { id: 'qanun', name: 'Qanun (قانون)' },
                { id: 'ney', name: 'Ney (ناي)' },
              ] as const
            ).map((inst) => (
              <button
                key={inst.id}
                onClick={() => {
                  setSelectedInstrument(inst.id);
                  setCurrentTrack((curr) => ({ ...curr, instrument: inst.id }));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedInstrument === inst.id
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {inst.name}
              </button>
            ))}
          </div>

          {/* Search / Request input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'اكتب اسم أي أغنية (مثل: تبكي الطيور، إنت عمري، أول مرة، أعطني الناي)...'
                : 'Type any song name (e.g., Tabki El-Toyour, Enta Omri, Aatini Al-Nay)...'
            }
            className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
          />

          <button
            onClick={() => handleGenerateMelody()}
            disabled={isGenerating}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:scale-[1.02] text-slate-950 transition disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                <span>{lang === 'ar' ? 'جاري توليد اللحن...' : 'Generating Melody...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'توليد وعزف التراك' : 'Generate & Play'}</span>
              </>
            )}
          </button>
        </div>

        {/* 1-Click Famous Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">
            {lang === 'ar' ? 'أو اختر من الروائع:' : 'Quick Masterpieces:'}
          </span>
          {famousPresets.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setSearchQuery(p.name);
                setSelectedInstrument(p.inst);
                handleGenerateMelody(p.name, p.inst);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-950/60 hover:bg-slate-800 border border-white/5 hover:border-amber-400/30 text-slate-300 hover:text-amber-300 transition"
            >
              {p.name} ({p.inst})
            </button>
          ))}
        </div>
      </div>

      {/* Saved Tracks Drawer Modal */}
      {showSavedDrawer && (
        <div className="p-6 rounded-3xl border border-cyan-500/30 bg-slate-900/95 backdrop-blur-2xl shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-base">
              <Bookmark className="w-5 h-5" />
              <span>{lang === 'ar' ? 'مكتبة التراكات الصوتية المحفوظة' : 'Saved Backing Track Library'}</span>
            </div>
            <button
              onClick={() => setShowSavedDrawer(false)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-slate-800"
            >
              Close
            </button>
          </div>

          {savedTracks.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No saved tracks yet. Click "Save Track" on any generated melody to keep it here for daily vocal practice!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedTracks.map((trk) => (
                <div
                  key={trk.id}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 truncate">
                        {trk.songTitle}
                      </span>
                      <button
                        onClick={() => handleDeleteTrack(trk.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{trk.artist}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-cyan-300">
                      <span>{trk.maqam}</span>
                      <span>•</span>
                      <span className="uppercase">{trk.instrument}</span>
                      <span>•</span>
                      <span>{trk.bpm} BPM</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      stopPlayback();
                      setCurrentTrack(trk);
                      setSelectedInstrument(trk.instrument);
                      setShowSavedDrawer(false);
                    }}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center gap-2 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{lang === 'ar' ? 'تحميل وعزف' : 'Load Track'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interactive Backing Studio Hub */}
      <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-xl flex flex-col gap-6">
        {/* Track Title & Dual-Track Control Strip */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-white">
                {currentTrack.songTitle}
              </h3>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentTrack.maqam}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {currentTrack.instrument.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {currentTrack.artist} • Root: <span className="text-white font-bold">{currentTrack.rootNote}</span> • Tempo: <span className="text-emerald-400 font-bold">{currentTrack.bpm} BPM</span>
            </p>
          </div>

          {/* Master Transport & Dual-Track Recorders */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Play/Stop Backing Melody */}
            {!isPlaying ? (
              <button
                onClick={startPlayback}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{lang === 'ar' ? 'تشغيل التراك' : 'Play Backing Track'}</span>
              </button>
            ) : (
              <button
                onClick={stopPlayback}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-white/10 transition-all"
              >
                <Pause className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إيقاف مؤقت' : 'Pause'}</span>
              </button>
            )}

            {/* Dual-Track Vocal Recording Button */}
            {!isRecordingVoice ? (
              <button
                onClick={startDualTrackRecording}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-lg shadow-rose-500/25 transition-all hover:scale-105 active:scale-95"
              >
                <Mic className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تسجيل الغناء مع التراك' : 'Record Voice Over Track'}</span>
              </button>
            ) : (
              <button
                onClick={stopDualTrackRecording}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40"
              >
                <MicOff className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إنهاء التسجيل' : 'Stop Vocal Recording'}</span>
              </button>
            )}

            {/* Backing Track Volume / Mute Controls */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-white/5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-amber-400 transition"
                title={isMuted ? 'Unmute Instrument' : 'Mute Instrument'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : backingVolume}
                onChange={(e) => {
                  setBackingVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-20 accent-amber-400"
                title="Melody Backing Track Volume"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Virtual Instrument Graphic Stage */}
        <div className="relative w-full rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-white/10 p-6 flex flex-col items-center justify-center overflow-hidden">
          {/* Visual animation based on active instrument */}
          {currentTrack.instrument === 'oud' && (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <span>🪕 Acoustic Arabic Oud Backing</span>
                {isPlaying && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
              </div>
              <div className="w-full max-w-xl flex flex-col gap-2.5 my-2">
                {['C2', 'F2', 'A2', 'D3', 'G3', 'C4'].map((str, i) => (
                  <div key={str} className="relative flex items-center h-3">
                    <span className="w-10 text-[10px] font-mono text-slate-500">{str}</span>
                    <div
                      className={`h-0.5 flex-1 rounded-full transition-all duration-150 ${
                        isPlaying && activeNoteIdx % 6 === i
                          ? 'bg-amber-400 shadow-lg shadow-amber-400/80 scale-y-150 animate-pulse'
                          : 'bg-slate-700'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentTrack.instrument === 'qanun' && (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2">
                <span>🎼 Shimmering Qanun Zither Backing</span>
                {isPlaying && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
              </div>
              <div className="w-full max-w-xl h-24 flex items-center justify-between gap-1 px-4 my-2">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-100 ${
                      isPlaying && activeNoteIdx % 24 === i
                        ? 'h-full bg-gradient-to-t from-cyan-400 to-amber-300 shadow-md shadow-cyan-400'
                        : 'h-12 bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {currentTrack.instrument === 'ney' && (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span>Soulful Ney Reed Flute Backing</span>
                {isPlaying && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
              </div>
              <div className="relative w-full max-w-md h-12 rounded-full bg-gradient-to-r from-amber-900/60 via-amber-800/80 to-amber-950 border border-amber-600/40 flex items-center justify-around px-8 my-2 shadow-inner">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                      isPlaying && activeNoteIdx % 7 === i
                        ? 'bg-cyan-400 border-white shadow-lg shadow-cyan-400/80 scale-125'
                        : 'bg-slate-950 border-amber-500/50'
                    }`}
                  >
                    <span className="text-[8px] font-mono text-slate-400">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Note & Lyric Karaoke Overlay */}
          <div className="mt-2 text-center">
            <div className="text-3xl font-black text-amber-300 drop-shadow-md">
              {activeNoteIdx >= 0 && currentTrack.melodyNotes[activeNoteIdx]
                ? currentTrack.melodyNotes[activeNoteIdx].lyric || currentTrack.melodyNotes[activeNoteIdx].note
                : lang === 'ar' ? 'جاهز للغناء' : 'Ready for Vocals'}
            </div>
            <div className="text-xs font-mono text-cyan-400 mt-1">
              {activeNoteIdx >= 0 && currentTrack.melodyNotes[activeNoteIdx]
                ? `${currentTrack.melodyNotes[activeNoteIdx].note} (${currentTrack.melodyNotes[activeNoteIdx].frequency.toFixed(1)} Hz)`
                : 'Click Play or Record Voice to Start'}
            </div>
          </div>
        </div>

        {/* Visual Score Viewer with Synchronized Moving Cursor */}
        <ScoreViewer
          notes={sheetNotes}
          currentNoteIndex={activeNoteIdx}
          isPlaying={isPlaying}
          onPlayAll={startPlayback}
        />

        {/* Recorded Vocal Playback & Export Hub */}
        {recordedAudioUrl && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-950 to-slate-900 border border-rose-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold">
                🎤
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  {lang === 'ar' ? 'تسجيلك الصوتي جاهز للاستماع' : 'Your Vocal Performance Track is Ready!'}
                </h4>
                <p className="text-xs text-slate-400">
                  Recorded in sync with {currentTrack.songTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <audio src={recordedAudioUrl} controls className="h-9 w-60 accent-rose-500" />
              <a
                href={recordedAudioUrl}
                download={`${currentTrack.songTitle.replace(/\s+/g, '_')}_vocal_take.webm`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition border border-white/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </a>
            </div>
          </div>
        )}

        {/* Vocal Entry & Sing-Along Cues */}
        {currentTrack.vocalSingAlongCues && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              {lang === 'ar' ? 'إرشادات دخول الصوت والدندنة' : 'Vocal Sing-Along & Timing Cues'}
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {currentTrack.vocalSingAlongCues.map((cue, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-2 text-xs text-slate-300"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{cue}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
