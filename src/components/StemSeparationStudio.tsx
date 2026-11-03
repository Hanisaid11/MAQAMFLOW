import React, { useState, useRef, useEffect } from 'react';
import { stemSeparator, StemTrack } from '../utils/stemSeparator';
import { useLanguage } from '../context/LanguageContext';
import {
  FileAudio,
  Upload,
  Play,
  Square,
  Volume2,
  VolumeX,
  Mic,
  Music,
  Activity,
  Disc,
  Sparkles,
  Scissors,
  Check,
  RefreshCw,
  Radio,
} from 'lucide-react';

export const StemSeparationStudio: React.FC = () => {
  const { lang, isRTL } = useLanguage();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [progressStage, setProgressStage] = useState<string>('');
  const [stems, setStems] = useState<Record<string, StemTrack>>(stemSeparator.getStems());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isKaraokeActive, setIsKaraokeActive] = useState<boolean>(false);
  const [selectedDemo, setSelectedDemo] = useState<string>('fairouz');
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Curated Classics for demo
  const DEMO_SONGS = [
    {
      id: 'fairouz',
      title: 'أعطني الناي وغنِّ (فيروز)',
      maqam: 'مقام نهاوند على الدو',
      bpm: 96,
      desc: 'سولو الناي والموال الشجي مع تخت أندلسي',
    },
    {
      id: 'abdelhalim',
      title: 'أول مرة تحب يا قلبي (عبد الحليم حافظ)',
      maqam: 'مقام راست على الدو',
      bpm: 108,
      desc: 'إيقاع مقسوم مع ربع تون أصيل وكورال غنائي',
    },
    {
      id: 'kulthum',
      title: 'أنت عمري (أم كلثوم - محمد عبد الوهاب)',
      maqam: 'مقام كرد على الدوكاه',
      bpm: 88,
      desc: 'صولو الجيتار والعود مع بحة الست الخالدة',
    },
  ];

  // Synthesize or decode demo audio into buffer
  const handleProcessSong = async () => {
    setIsProcessing(true);
    setProgressPct(0);

    // Create a rich synthetic multi-element audio buffer representing the song
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const sampleRate = ctx.sampleRate;
    const songDuration = 18; // 18 seconds demo clip
    const buffer = ctx.createBuffer(2, sampleRate * songDuration, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // Synthesize vocal formants in center, instruments in stereo, bass in low, percussion in transients
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;

      // Vocal melody line (centered with slight vibrato)
      const vocalFreq = 293.66 * (1 + 0.015 * Math.sin(2 * Math.PI * 5.5 * t));
      const vocal = Math.sin(2 * Math.PI * vocalFreq * t) * 0.35 * (Math.sin(t * 1.5) > 0 ? 1 : 0.1);

      // Instrument harmony (stereo panning)
      const instL = Math.sin(2 * Math.PI * 392.0 * t) * 0.22;
      const instR = Math.sin(2 * Math.PI * 440.0 * t) * 0.22;

      // Bass Qarar (low)
      const bass = Math.sin(2 * Math.PI * 73.42 * t) * 0.4;

      // Drum beat (Dum-Tak)
      const beatPhase = (t * 2) % 1;
      const kick = beatPhase < 0.1 ? Math.sin(2 * Math.PI * 65 * beatPhase * 10) * 0.45 : 0;
      const snare = (beatPhase > 0.45 && beatPhase < 0.55) ? (Math.random() * 2 - 1) * 0.25 : 0;

      left[i] = vocal + instL + bass + kick + snare;
      right[i] = vocal + instR + bass + kick + snare;
    }

    const ok = await stemSeparator.decomposeAudio(buffer, (pct, stage) => {
      setProgressPct(pct);
      setProgressStage(stage);
    });

    if (ok) {
      setStems({ ...stemSeparator.getStems() });
      setDuration(stemSeparator.getDuration());
      setIsProcessing(false);
    }
  };

  // Upload local audio file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProgressPct(10);
    setProgressStage('Reading uploaded audio file...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      setProgressPct(30);
      setProgressStage('Decoding audio stream...');
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);

      await stemSeparator.decomposeAudio(decodedBuffer, (pct, stage) => {
        setProgressPct(pct);
        setProgressStage(stage);
      });

      setStems({ ...stemSeparator.getStems() });
      setDuration(stemSeparator.getDuration());
      setIsProcessing(false);
    } catch (err) {
      console.error('File decode error:', err);
      setIsProcessing(false);
      alert('Could not decode audio file.');
    }
  };

  // Play / Pause Stems
  const handleTogglePlay = () => {
    if (isPlaying) {
      stemSeparator.pause();
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      stemSeparator.play(currentTime);
      setIsPlaying(true);
      timerRef.current = window.setInterval(() => {
        const cur = stemSeparator.getCurrentTime();
        setCurrentTime(cur);
        if (cur >= stemSeparator.getDuration() && stemSeparator.getDuration() > 0) {
          setIsPlaying(false);
          setCurrentTime(0);
          stemSeparator.stop();
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }, 100);
    }
  };

  // One-Click Karaoke Mode Toggle
  const handleToggleKaraoke = () => {
    if (isKaraokeActive) {
      stemSeparator.resetAllStems();
      setIsKaraokeActive(false);
    } else {
      stemSeparator.enableKaraokeMode();
      setIsKaraokeActive(true);
    }
    setStems({ ...stemSeparator.getStems() });
  };

  const handleVolumeChange = (stemId: 'vocals' | 'instruments' | 'bass' | 'drums', val: number) => {
    stemSeparator.setStemVolume(stemId, val);
    setStems({ ...stemSeparator.getStems() });
  };

  const handleToggleMute = (stemId: 'vocals' | 'instruments' | 'bass' | 'drums') => {
    stemSeparator.toggleMute(stemId);
    setStems({ ...stemSeparator.getStems() });
  };

  const handleToggleSolo = (stemId: 'vocals' | 'instruments' | 'bass' | 'drums') => {
    stemSeparator.toggleSolo(stemId);
    setStems({ ...stemSeparator.getStems() });
  };

  useEffect(() => {
    return () => {
      stemSeparator.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const isLoaded = stemSeparator.isTrackLoaded();

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-cyan-950/30 to-slate-900/90 border border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-teal-500 to-amber-500 p-0.5 shadow-xl shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Scissors className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {lang === 'ar' ? 'عزل الصوت والآلات واستوديو الكاريوكي' : 'AI Stem Separation & Vocal Extractor'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {lang === 'ar' ? 'عزل 4 قنوات' : '4-Stem DSP Engine'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-arabic">
                {lang === 'ar'
                  ? 'اعزل صوت المطرب عن الموسيقى والآلات والإيقاع بدقة، واخفت صوت المطرب الأصلي للغناء بدلاً منه في وضع الكاريوكي.'
                  : 'Decompose any song into separate Vocals, Instruments, Bass, and Percussion with independent volume faders for karaoke sing-along.'}
              </p>
            </div>
          </div>

          {/* Quick File Upload Trigger */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-white/10 hover:border-cyan-400/50 text-slate-200 transition shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'ar' ? 'رفع ملف MP3/WAV مخصص' : 'Upload Audio File'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Song Selection / Extraction Hub */}
      {!isLoaded && !isProcessing && (
        <div className="rounded-3xl p-6 bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-5">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{lang === 'ar' ? 'اختر أغنية لعزل مساراتها والتدرب عليها' : 'Select Masterpiece to Decompose'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEMO_SONGS.map((song) => {
              const isSelected = selectedDemo === song.id;
              return (
                <div
                  key={song.id}
                  onClick={() => setSelectedDemo(song.id)}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-900/90 border-cyan-400/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-900/40 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div>
                    <h4 className="text-sm font-black text-white font-arabic">{song.title}</h4>
                    <span className="text-xs font-bold text-amber-400 block mt-1 font-arabic">
                      {song.maqam}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-2 font-arabic">{song.desc}</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/5">
                    <span>{song.bpm} BPM</span>
                    <span className="text-cyan-400 font-bold">{isSelected ? '✓ Selected' : 'Click to select'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleProcessSong}
            className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 via-teal-500 to-amber-500 hover:from-cyan-400 hover:to-amber-400 text-slate-950 shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Scissors className="w-4 h-4" />
            <span>{lang === 'ar' ? 'بدء المعالجة وعزل المسارات الأربعة بالذكاء الاصطناعي' : 'Decompose & Separate 4 Stems'}</span>
          </button>
        </div>
      )}

      {/* Processing Animation */}
      {isProcessing && (
        <div className="rounded-3xl p-8 bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl shadow-xl flex flex-col items-center justify-center gap-4 text-center">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin" />
          <h3 className="text-base font-black text-white">{progressStage}</h3>
          <div className="w-full max-w-md bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-cyan-300">{progressPct}% Complete</span>
        </div>
      )}

      {/* 4-Stem Mixing Console Deck */}
      {isLoaded && !isProcessing && (
        <div className="rounded-3xl p-6 bg-slate-950/85 border border-white/10 backdrop-blur-xl shadow-2xl flex flex-col gap-6">
          {/* Deck Master Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePlay}
                className={`p-3 rounded-2xl text-slate-950 font-black transition shadow-lg ${
                  isPlaying
                    ? 'bg-amber-400 shadow-amber-400/30'
                    : 'bg-cyan-400 shadow-cyan-400/30 hover:bg-cyan-300'
                }`}
              >
                {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>

              <div>
                <h3 className="text-sm font-black text-white">
                  {lang === 'ar' ? 'لوحة تحكم المسارات المنفصلة' : 'Decomposed Stems Deck'}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {Math.floor(currentTime)}s / {Math.floor(duration)}s
                </span>
              </div>
            </div>

            {/* Karaoke Mode Quick Toggle */}
            <button
              onClick={handleToggleKaraoke}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-lg ${
                isKaraokeActive
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 animate-pulse'
                  : 'bg-slate-900 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>
                {isKaraokeActive
                  ? lang === 'ar'
                    ? 'وضع الكاريوكي مفعل (المغني صامت)'
                    : 'Karaoke Mode Active (Vocals Muted)'
                  : lang === 'ar'
                  ? 'تفعيل وضع الكاريوكي (عزل صوت المغني للغناء بدلاً منه)'
                  : 'Enable Karaoke Sing-Along'}
              </span>
            </button>
          </div>

          {/* 4 Faders Vertical / Horizontal Deck */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Vocals */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-md flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                  <Mic className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'صوت المغني' : 'Lead Vocals'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleMute('vocals')}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      stems.vocals.isMuted
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Mute
                  </button>
                  <button
                    onClick={() => handleToggleSolo('vocals')}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      stems.vocals.isSolo
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Solo
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={stems.vocals.volume}
                  onChange={(e) => handleVolumeChange('vocals', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Level</span>
                  <span className="text-cyan-300 font-bold">{Math.round(stems.vocals.volume * 100)}%</span>
                </div>
              </div>
            </div>

            {/* 2. Instruments */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-amber-500/20 backdrop-blur-md flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Music className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'الآلات والتخت' : 'Instruments'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleMute('instruments')}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      stems.instruments.isMuted
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Mute
                  </button>
                  <button
                    onClick={() => handleToggleSolo('instruments')}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      stems.instruments.isSolo
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Solo
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={stems.instruments.volume}
                  onChange={(e) => handleVolumeChange('instruments', parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Level</span>
                  <span className="text-amber-300 font-bold">{Math.round(stems.instruments.volume * 100)}%</span>
                </div>
              </div>
            </div>

            {/* 3. Bass */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-md flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <Activity className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'القرار والباص' : 'Bass / Low'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleMute('bass')}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      stems.bass.isMuted
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Mute
                  </button>
                  <button
                    onClick={() => handleToggleSolo('bass')}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      stems.bass.isSolo
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Solo
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={stems.bass.volume}
                  onChange={(e) => handleVolumeChange('bass', parseFloat(e.target.value))}
                  className="w-full accent-purple-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Level</span>
                  <span className="text-purple-300 font-bold">{Math.round(stems.bass.volume * 100)}%</span>
                </div>
              </div>
            </div>

            {/* 4. Drums / Iqa' */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-emerald-500/20 backdrop-blur-md flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <Disc className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'الإيقاع والرق' : 'Percussion'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleMute('drums')}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      stems.drums.isMuted
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Mute
                  </button>
                  <button
                    onClick={() => handleToggleSolo('drums')}
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      stems.drums.isSolo
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Solo
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={stems.drums.volume}
                  onChange={(e) => handleVolumeChange('drums', parseFloat(e.target.value))}
                  className="w-full accent-emerald-400"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Level</span>
                  <span className="text-emerald-300 font-bold">{Math.round(stems.drums.volume * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
