import React, { useState, useEffect, useRef } from 'react';
import {
  studioDSP,
  ACOUSTIC_PRESETS,
  AcousticSpacePreset,
} from '../utils/dspEffects';
import { useLanguage } from '../context/LanguageContext';
import {
  Radio,
  Sliders,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Headphones,
  Sparkles,
  Waves,
  Zap,
  Power,
  ShieldCheck,
  Disc,
} from 'lucide-react';

export const StudioDSPEmulator: React.FC = () => {
  const { lang, isRTL } = useLanguage();
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [isBypassed, setIsBypassed] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<AcousticSpacePreset>(ACOUSTIC_PRESETS[0]);
  const [reverbMix, setReverbMix] = useState<number>(ACOUSTIC_PRESETS[0].reverbMix);
  const [masterVol, setMasterVol] = useState<number>(0.9);
  const [levels, setLevels] = useState<{ inDb: number; outDb: number; reductionDb: number }>({
    inDb: -60,
    outDb: -60,
    reductionDb: 0,
  });

  const meterTimerRef = useRef<number | null>(null);

  // Toggle Live Headphone Monitoring
  const handleToggleMonitoring = async () => {
    if (isMonitoring) {
      studioDSP.stopMonitoring();
      setIsMonitoring(false);
      if (meterTimerRef.current) clearInterval(meterTimerRef.current);
    } else {
      const ok = await studioDSP.startMonitoring();
      if (ok) {
        setIsMonitoring(true);
        // Start polling meter levels
        meterTimerRef.current = window.setInterval(() => {
          setLevels(studioDSP.getLevels());
        }, 80);
      }
    }
  };

  // Change Preset
  const handleSelectPreset = (preset: AcousticSpacePreset) => {
    setSelectedPreset(preset);
    setReverbMix(preset.reverbMix);
    studioDSP.applyPreset(preset);
  };

  // Reverb mix slider
  const handleMixChange = (val: number) => {
    setReverbMix(val);
    studioDSP.setReverbMix(val);
  };

  // Master output
  const handleVolChange = (val: number) => {
    setMasterVol(val);
    studioDSP.setMasterGain(val);
  };

  // Bypass toggle
  const handleToggleBypass = () => {
    const bypassed = studioDSP.toggleBypass();
    setIsBypassed(bypassed);
  };

  useEffect(() => {
    return () => {
      studioDSP.stopMonitoring();
      if (meterTimerRef.current) clearInterval(meterTimerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-emerald-950/30 to-slate-900/90 border border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-amber-500 p-0.5 shadow-xl shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Waves className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {lang === 'ar' ? 'مؤثرات الاستوديو والهندسة الصوتية' : 'Studio DSP & Acoustic Space Emulator'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {lang === 'ar' ? 'معالجة حية للمايك' : 'Real-Time DSP'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-arabic">
                {lang === 'ar'
                  ? 'محاكاة المساحات الصوتية الحية (دار الأوبرا، مجلس العود، القبة الصوفية) مع ضاغط ديناميكي، معادل ثلاثي النطاق، وبوابة عزل الضوضاء.'
                  : 'Real-time microphone node rack featuring Concert Hall / Arabic Reverbs, Dynamic Compressor, 3-Band Parametric EQ, and Noise Gate.'}
              </p>
            </div>
          </div>

          {/* Monitoring Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleBypass}
              disabled={!isMonitoring}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all border ${
                isBypassed
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-900 text-slate-300 border-white/10 hover:border-white/20'
              } ${!isMonitoring ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isBypassed ? (lang === 'ar' ? 'تجاوز المؤثرات (Bypass)' : 'Bypassed') : 'DSP Active'}</span>
            </button>

            <button
              onClick={handleToggleMonitoring}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-lg ${
                isMonitoring
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <Headphones className="w-4 h-4" />
              <span>
                {isMonitoring
                  ? lang === 'ar'
                    ? 'إيقاف مراقبة السماعات'
                    : 'Stop Monitoring'
                  : lang === 'ar'
                  ? 'تشغيل الاستماع الحي بالسماعات'
                  : 'Start Live Monitoring'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Acoustic Environments Selector Cards */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ar' ? 'اختر البيئة الصوتية الحية (Acoustic Space)' : 'Acoustic Space Presets'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACOUSTIC_PRESETS.map((p) => {
            const isSelected = selectedPreset.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-900/90 border-emerald-400/70 shadow-lg shadow-emerald-500/15 scale-[1.02]'
                    : 'bg-slate-900/40 border-white/5 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white font-arabic">
                      {lang === 'ar' ? p.nameAr : p.nameEn}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-emerald-300">
                      {p.reverbDecay}s Decay
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 font-arabic leading-relaxed">
                    {lang === 'ar' ? p.descriptionAr : p.descriptionEn}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Comp: {p.compressorRatio}:1</span>
                  <span className={isSelected ? 'text-emerald-400 font-bold' : ''}>
                    {isSelected ? '● Active' : 'Click to load'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DSP Virtual Hardware Rack Unit */}
      <div className="rounded-3xl p-6 bg-slate-950/90 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {lang === 'ar' ? 'سلسلة المعالجة الرقمية (Hardware Rack Controls)' : 'Studio DSP Rack Controls'}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {isMonitoring ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                DSP Engine Running (Low Latency)
              </span>
            ) : (
              <span>Engine Inactive</span>
            )}
          </span>
        </div>

        {/* Real-time Decibel VU Meter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/5">
          {/* Input Meter */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">Mic In Level</span>
              <span className="text-cyan-400 font-mono">{levels.inDb.toFixed(1)} dB</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-75"
                style={{ width: `${Math.max(0, Math.min(100, ((levels.inDb + 60) / 60) * 100))}%` }}
              />
            </div>
          </div>

          {/* Gain Reduction Meter */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">Compressor GR</span>
              <span className="text-amber-400 font-mono">{levels.reductionDb.toFixed(1)} dB</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${Math.max(0, Math.min(100, Math.abs(levels.reductionDb) * 5))}%` }}
              />
            </div>
          </div>

          {/* Master Output Meter */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-400">Output Monitor</span>
              <span className="text-emerald-400 font-mono">{levels.outDb.toFixed(1)} dB</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-75"
                style={{ width: `${Math.max(0, Math.min(100, ((levels.outDb + 60) / 60) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Rack Knobs & Faders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Reverb Wet/Dry Mix */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col justify-between gap-3">
            <div className="flex justify-between text-xs font-bold text-slate-200">
              <span>{lang === 'ar' ? 'نسبة الصدى (Reverb Mix)' : 'Reverb Wet/Dry'}</span>
              <span className="text-emerald-400 font-mono">{Math.round(reverbMix * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={reverbMix}
              onChange={(e) => handleMixChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
            <span className="text-[10px] text-slate-400">
              {lang === 'ar' ? 'توازن الصوت المباشر مع رنين القاعة' : 'Balance direct vocal with hall acoustics'}
            </span>
          </div>

          {/* 3-Band EQ Readout */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col justify-between gap-3">
            <div className="flex justify-between text-xs font-bold text-slate-200">
              <span>{lang === 'ar' ? 'معادل الترددات (3-Band EQ)' : '3-Band Parametric EQ'}</span>
              <span className="text-cyan-400 font-mono">Active</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span>Low: {selectedPreset.eqLowGain > 0 ? `+${selectedPreset.eqLowGain}` : selectedPreset.eqLowGain}dB</span>
              <span>Mid: {selectedPreset.eqMidGain > 0 ? `+${selectedPreset.eqMidGain}` : selectedPreset.eqMidGain}dB</span>
              <span>Hi: {selectedPreset.eqHighGain > 0 ? `+${selectedPreset.eqHighGain}` : selectedPreset.eqHighGain}dB</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {lang === 'ar' ? 'معاير لطبيعة الغناء الشرقي' : 'Tuned for vocal presence & warmth'}
            </span>
          </div>

          {/* Dynamics Compressor Readout */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col justify-between gap-3">
            <div className="flex justify-between text-xs font-bold text-slate-200">
              <span>{lang === 'ar' ? 'الضاغط الديناميكي' : 'Dynamics Compressor'}</span>
              <span className="text-amber-400 font-mono">{selectedPreset.compressorRatio}:1</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span>Thresh: {selectedPreset.compressorThreshold}dB</span>
              <span>Knee: 12dB</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {lang === 'ar' ? 'يكبح القمم العالية ويثبت مستوى الصوت' : 'Tames volume peaks & evens out tone'}
            </span>
          </div>

          {/* Master Headphone Volume */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 flex flex-col justify-between gap-3">
            <div className="flex justify-between text-xs font-bold text-slate-200">
              <span>{lang === 'ar' ? 'مستوى صوت المراقبة' : 'Master Monitor Volume'}</span>
              <span className="text-purple-400 font-mono">{Math.round(masterVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={masterVol}
              onChange={(e) => handleVolChange(parseFloat(e.target.value))}
              className="w-full accent-purple-400"
            />
            <span className="text-[10px] text-slate-400">
              {lang === 'ar' ? 'تحكم في صوت سماعتك الشخصية' : 'Headphone monitor output gain'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
