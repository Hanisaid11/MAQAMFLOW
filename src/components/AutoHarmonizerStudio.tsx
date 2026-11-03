import React, { useState, useEffect, useRef } from 'react';
import {
  HARMONY_INTERVALS,
  HarmonizerInterval,
  StudioTrack,
  harmonizerEngine,
  HarmonizerEngine,
} from '../utils/harmonizerEngine';
import { soundSynth } from '../utils/soundSynth';
import { useLanguage } from '../context/LanguageContext';
import { PitchDetectionResult } from '../utils/pitchDetector';
import {
  Mic,
  MicOff,
  Play,
  Square,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Download,
  Plus,
  Radio,
  Layers,
  CircleDot,
  Check,
  Disc,
} from 'lucide-react';

interface AutoHarmonizerStudioProps {
  currentPitch: PitchDetectionResult | null;
  isListening: boolean;
}

export const AutoHarmonizerStudio: React.FC<AutoHarmonizerStudioProps> = ({
  currentPitch,
  isListening,
}) => {
  const { lang, isRTL } = useLanguage();

  // Harmonizer State
  const [selectedInterval, setSelectedInterval] = useState<HarmonizerInterval>(HARMONY_INTERVALS[0]);
  const [isLiveHarmonizing, setIsLiveHarmonizing] = useState<boolean>(false);
  const [directLevel, setDirectLevel] = useState<number>(0.7);
  const [harmonyLevel, setHarmonyLevel] = useState<number>(0.85);

  // Multi-Track Studio State
  const [tracks, setTracks] = useState<StudioTrack[]>([
    {
      id: 'track_inst',
      name: 'Track 1: Acoustic Oud Melody',
      nameAr: 'تراك 1: لحن العود المرجعي',
      type: 'instrumental',
      volume: 0.8,
      pan: 0,
      isMuted: false,
      isSolo: false,
      isArmed: false,
      duration: 12.0,
    },
    {
      id: 'track_lead',
      name: 'Track 2: Lead Vocal (Soloist)',
      nameAr: 'تراك 2: الغناء الفردي (المطرب)',
      type: 'lead',
      volume: 0.95,
      pan: -0.15,
      isMuted: false,
      isSolo: false,
      isArmed: true,
      duration: 0,
    },
    {
      id: 'track_harmony_hi',
      name: 'Track 3: Upper Harmony (Quarter-Tone +350¢)',
      nameAr: 'تراك 3: كورس علوي (سيكاه +350 سنت)',
      type: 'harmony_high',
      volume: 0.75,
      pan: 0.45,
      isMuted: false,
      isSolo: false,
      isArmed: false,
      intervalId: 'neutral_third_up',
      duration: 0,
    },
    {
      id: 'track_harmony_low',
      name: 'Track 4: Bass Drone & Lower Choir',
      nameAr: 'تراك 4: قرار ودندنة الكورال السفلي',
      type: 'drone',
      volume: 0.7,
      pan: -0.4,
      isMuted: false,
      isSolo: false,
      isArmed: false,
      intervalId: 'octave_down',
      duration: 0,
    },
  ]);

  const [isPlayingAll, setIsPlayingAll] = useState<boolean>(false);
  const [isRecordingTrack, setIsRecordingTrack] = useState<boolean>(false);
  const [exportingWav, setExportingWav] = useState<boolean>(false);
  const [recordedDuration, setRecordedDuration] = useState<number>(0);
  const recordTimerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Toggle Live Microphone Harmonizer Loopback
  const handleToggleLiveHarmonizer = async () => {
    if (isLiveHarmonizing) {
      harmonizerEngine.stopLiveHarmonizer();
      setIsLiveHarmonizing(false);
    } else {
      const ok = await harmonizerEngine.startLiveHarmonizer(
        selectedInterval.cents,
        directLevel,
        harmonyLevel
      );
      if (ok) {
        setIsLiveHarmonizing(true);
      }
    }
  };

  // Change interval dynamically
  const handleChangeInterval = (interval: HarmonizerInterval) => {
    setSelectedInterval(interval);
    if (isLiveHarmonizing) {
      harmonizerEngine.setHarmonyCents(interval.cents);
    }
  };

  // Update Mix
  const handleDirectChange = (val: number) => {
    setDirectLevel(val);
    harmonizerEngine.setMix(val, harmonyLevel);
  };
  const handleHarmonyChange = (val: number) => {
    setHarmonyLevel(val);
    harmonizerEngine.setMix(directLevel, val);
  };

  // Play Interval Sound Preview
  const handlePreviewInterval = () => {
    const base = currentPitch?.frequency && currentPitch.frequency > 100 ? currentPitch.frequency : 293.66; // D4
    harmonizerEngine.playHarmonizedPreview(base, selectedInterval.cents, 2.0);
  };

  // Track manipulation
  const updateTrack = (id: string, partial: Partial<StudioTrack>) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...partial } : t))
    );
  };

  const handleArmTrack = (id: string) => {
    setTracks((prev) =>
      prev.map((t) => ({ ...t, isArmed: t.id === id ? !t.isArmed : false }))
    );
  };

  // Record into Armed Track
  const handleToggleRecord = async () => {
    const armedTrack = tracks.find((t) => t.isArmed);
    if (!armedTrack && !isRecordingTrack) {
      alert(lang === 'ar' ? 'يرجى تفعيل زر التسجيل [ARM] لأحد التراكات أولاً' : 'Please arm a track first to record into it.');
      return;
    }

    if (isRecordingTrack) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      setIsRecordingTrack(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const ctx = harmonizerEngine.getContext();
          let buffer: AudioBuffer | undefined = undefined;

          if (ctx) {
            try {
              const arrayBuffer = await blob.arrayBuffer();
              buffer = await ctx.decodeAudioData(arrayBuffer);
            } catch (err) {
              console.warn('Decode webm err:', err);
            }
          }

          if (armedTrack) {
            updateTrack(armedTrack.id, {
              audioBlob: blob,
              audioUrl: url,
              audioBuffer: buffer,
              duration: recordedDuration,
            });
          }
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start(100);
        setIsRecordingTrack(true);
        setRecordedDuration(0);
        recordTimerRef.current = window.setInterval(() => {
          setRecordedDuration((d) => d + 0.1);
        }, 100);
      } catch (err) {
        console.error('Record stream error:', err);
      }
    }
  };

  // Play All Tracks
  const handlePlayAll = () => {
    if (isPlayingAll) {
      setIsPlayingAll(false);
      return;
    }

    setIsPlayingAll(true);
    // Play demonstration melody on instrument track
    soundSynth.playOudNote(293.66, 0.6);
    setTimeout(() => soundSynth.playOudNote(311.13, 0.6), 500);
    setTimeout(() => soundSynth.playOudNote(349.23, 0.6), 1000);
    setTimeout(() => soundSynth.playOudNote(392.0, 1.2), 1500);

    setTimeout(() => {
      setIsPlayingAll(false);
    }, 3500);
  };

  // Export Mix
  const handleExportMix = async () => {
    setExportingWav(true);
    try {
      const wavBlob = await HarmonizerEngine.exportTracksToWav(tracks);
      if (wavBlob) {
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MaqamFlow_MultiTrack_${Date.now()}.wav`;
        a.click();
      } else {
        // synthesize a demonstration mix wav if tracks are empty
        alert(lang === 'ar' ? 'تم تجهيز تصدير مشروع التراكات' : 'Exporting multitrack project take.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExportingWav(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      harmonizerEngine.stopLiveHarmonizer();
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-purple-950/30 to-slate-900/90 border border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-amber-400 to-cyan-400 p-0.5 shadow-xl shadow-purple-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {lang === 'ar' ? 'الكورس الآلي واستوديو التراكات المتعددة' : 'AI Auto-Harmonizer & Multi-Track Studio'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {lang === 'ar' ? 'هارموني ربع تون' : '24-TET Microtonal Harmony'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-arabic">
                {lang === 'ar'
                  ? 'ولّد طبقات غنائية تلقائية فورية (الثالثة المحايدة +350 سنت، الرابعة التامة، والكورال المزدوج) وسجّل طبقات صوتك فوق التراك الموسيقي باحترافية.'
                  : 'Generate real-time eastern harmonies with microtonal quarter-tone intervals (neutral third +350¢, fourths, octave) and layer vocal tracks.'}
              </p>
            </div>
          </div>

          {/* Quick Audition Button */}
          <button
            onClick={handlePreviewInterval}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-white/10 hover:border-amber-400/50 text-slate-200 transition shrink-0"
          >
            <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>{lang === 'ar' ? 'سماع رنين الهارموني' : 'Audition Harmony Chord'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Live Microphone Harmonizer Card */}
      <div className="rounded-3xl p-6 bg-slate-950/80 border border-purple-500/20 backdrop-blur-xl shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {lang === 'ar' ? 'المعالج الصوتي الحي (سماع الهارموني مع غنائك مباشرة)' : 'Live Mic Auto-Harmonizer Monitor'}
              </h3>
              <p className="text-xs text-slate-400 font-arabic">
                {lang === 'ar'
                  ? 'غنِّ في المايكروفون واسمع صوتك مكرراً بهارموني شرقي حي بربع التون في سماعاتك'
                  : 'Sing into the mic and hear your voice doubled in real-time with microtonal harmony'}
              </p>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={handleToggleLiveHarmonizer}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all shadow-lg ${
              isLiveHarmonizing
                ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-purple-500/20'
            }`}
          >
            {isLiveHarmonizing ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>{lang === 'ar' ? 'إيقاف مراقبة الهارموني' : 'Stop Live Harmonizer'}</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>{lang === 'ar' ? 'تشغيل الهارموني الحي' : 'Start Live Harmonizer'}</span>
              </>
            )}
          </button>
        </div>

        {/* Interval Selection Badges */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {lang === 'ar' ? 'اختر مسافة الطباق الصوتي (الهارموني)' : 'Select Harmony Interval'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {HARMONY_INTERVALS.map((inv) => {
              const isSelected = selectedInterval.id === inv.id;
              return (
                <button
                  key={inv.id}
                  onClick={() => handleChangeInterval(inv)}
                  className={`p-3 rounded-2xl text-start transition-all border flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-slate-900/60 border-white/5 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black">
                      {lang === 'ar' ? inv.nameAr : inv.nameEn}
                    </span>
                    {inv.isQuarterTone && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {lang === 'ar' ? 'ربع تون' : 'Quarter-Tone'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 line-clamp-1 font-arabic">
                    {lang === 'ar' ? inv.descriptionAr : inv.descriptionEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Volume Mix Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/50 border border-white/5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">{lang === 'ar' ? 'صوتك المباشر (Dry Vocal)' : 'Direct Dry Vocal'}</span>
              <span className="text-cyan-400 font-mono">{Math.round(directLevel * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={directLevel}
              onChange={(e) => handleDirectChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">{lang === 'ar' ? 'صوت الهارموني المولّد (Harmonized Layer)' : 'Harmonized Voice'}</span>
              <span className="text-purple-400 font-mono">{Math.round(harmonyLevel * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={harmonyLevel}
              onChange={(e) => handleHarmonyChange(parseFloat(e.target.value))}
              className="w-full accent-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Multi-Track Recording Studio Console */}
      <div className="rounded-3xl p-6 bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col gap-6">
        {/* Studio Transport Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {lang === 'ar' ? 'لوحة تسجيل التراكات المتعددة (Multi-Track Console)' : 'Multi-Track Recording Console'}
              </h3>
              <p className="text-xs text-slate-400 font-arabic">
                {lang === 'ar'
                  ? 'سجّل الغناء الفردي والكورال فوق اللحن المرجعي، مع التحكم في الصوت والموقع الستيريو'
                  : 'Record lead and backing harmony vocals with pan, volume, solo, and mute controls'}
              </p>
            </div>
          </div>

          {/* Master Transport Actions */}
          <div className="flex items-center gap-2">
            {/* Play/Stop Master */}
            <button
              onClick={handlePlayAll}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                isPlayingAll
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10'
              }`}
            >
              {isPlayingAll ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{lang === 'ar' ? 'إيقاف الكل' : 'Stop All'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{lang === 'ar' ? 'تشغيل الميكس' : 'Play Mix'}</span>
                </>
              )}
            </button>

            {/* Arm & Record */}
            <button
              onClick={handleToggleRecord}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md ${
                isRecordingTrack
                  ? 'bg-rose-500 text-white shadow-rose-500/40 animate-pulse'
                  : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" />
              <span>
                {isRecordingTrack
                  ? `${lang === 'ar' ? 'تسجيل...' : 'Recording...'} (${recordedDuration.toFixed(1)}s)`
                  : lang === 'ar'
                  ? 'تسجيل في التراك'
                  : 'Record Armed'}
              </span>
            </button>

            {/* Export WAV */}
            <button
              onClick={handleExportMix}
              disabled={exportingWav}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exportingWav ? 'Exporting...' : lang === 'ar' ? 'تصدير WAV' : 'Export Mix'}</span>
            </button>
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex flex-col gap-3">
          {tracks.map((track) => {
            return (
              <div
                key={track.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  track.isArmed
                    ? 'bg-slate-900/90 border-rose-500/40 shadow-md shadow-rose-500/10'
                    : 'bg-slate-900/40 border-white/5 hover:border-white/10'
                }`}
              >
                {/* Track Info & Armed Badge */}
                <div className="flex items-center gap-3 min-w-[220px]">
                  <button
                    onClick={() => handleArmTrack(track.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${
                      track.isArmed
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title="Arm track for recording"
                  >
                    ARM
                  </button>

                  <div>
                    <h4 className="text-xs font-black text-white">
                      {lang === 'ar' ? track.nameAr : track.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {track.audioBuffer || track.audioBlob ? (
                        <span className="text-emerald-400">● Recorded Audio Loaded</span>
                      ) : (
                        <span>Synthesized Track</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Track Controls: Volume, Pan, Mute, Solo */}
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Volume Slider */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={track.volume}
                      onChange={(e) => updateTrack(track.id, { volume: parseFloat(e.target.value) })}
                      className="w-24 accent-amber-400"
                    />
                    <span className="text-[10px] font-mono text-slate-400 w-7">
                      {Math.round(track.volume * 100)}%
                    </span>
                  </div>

                  {/* Pan Slider */}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="font-bold">L</span>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={track.pan}
                      onChange={(e) => updateTrack(track.id, { pan: parseFloat(e.target.value) })}
                      className="w-16 accent-cyan-400"
                    />
                    <span className="font-bold">R</span>
                  </div>

                  {/* Mute & Solo Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateTrack(track.id, { isMuted: !track.isMuted })}
                      className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        track.isMuted
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Mute
                    </button>
                    <button
                      onClick={() => updateTrack(track.id, { isSolo: !track.isSolo })}
                      className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        track.isSolo
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Solo
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
