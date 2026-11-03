import React, { useState, useEffect } from 'react';
import { soundSynth } from '../utils/soundSynth';
import { useLanguage } from '../context/LanguageContext';
import { Volume2, VolumeX, Play, Square, Activity, Disc } from 'lucide-react';

export const DroneMetronome: React.FC = () => {
  const { t, lang, isRTL } = useLanguage();

  // Drone State
  const [isDroneOn, setIsDroneOn] = useState(false);
  const [droneRoot, setDroneRoot] = useState<'C' | 'D' | 'E½b' | 'F' | 'G' | 'A'>('D');
  const [droneVol, setDroneVol] = useState(0.25);

  // Iqa' Metronome State
  const [isIqaOn, setIsIqaOn] = useState(false);
  const [iqaPattern, setIqaPattern] = useState<'maqsum' | 'malfuf' | 'baladi'>('maqsum');
  const [bpm, setBpm] = useState(104);
  const [activeStep, setActiveStep] = useState(-1);

  const rootFrequencies: Record<string, number> = {
    C: 261.63,
    D: 293.66,
    'E½b': 320.24,
    F: 349.23,
    G: 392.00,
    A: 440.00,
  };

  const toggleDrone = () => {
    if (isDroneOn) {
      soundSynth.stopContinuousDrone();
      setIsDroneOn(false);
    } else {
      soundSynth.startContinuousDrone(rootFrequencies[droneRoot], droneVol);
      setIsDroneOn(true);
    }
  };

  const changeRoot = (rootKey: 'C' | 'D' | 'E½b' | 'F' | 'G' | 'A') => {
    setDroneRoot(rootKey);
    if (isDroneOn) {
      soundSynth.startContinuousDrone(rootFrequencies[rootKey], droneVol);
    }
  };

  const handleDroneVol = (val: number) => {
    setDroneVol(val);
    soundSynth.setDroneVolume(val);
  };

  const toggleIqa = () => {
    if (isIqaOn) {
      soundSynth.stopIqa();
      setIsIqaOn(false);
      setActiveStep(-1);
    } else {
      soundSynth.startIqa(iqaPattern, bpm, (step) => {
        setActiveStep(step);
      });
      setIsIqaOn(true);
    }
  };

  // Update Iqa tempo or pattern live
  useEffect(() => {
    if (isIqaOn) {
      soundSynth.startIqa(iqaPattern, bpm, (step) => {
        setActiveStep(step);
      });
    }
  }, [iqaPattern, bpm, isIqaOn]);

  useEffect(() => {
    return () => {
      soundSynth.stopContinuousDrone();
      soundSynth.stopIqa();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {/* DRONE CARD */}
      <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-xl flex flex-col justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Harmonic Resonance Tanpura</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide">
            {t('droneTitle')}
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {t('droneDesc')}
          </p>
        </div>

        {/* Root selection */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            {t('rootDroneKey')}
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(['C', 'D', 'E½b', 'F', 'G', 'A'] as const).map((r) => (
              <button
                key={r}
                onClick={() => changeRoot(r)}
                className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                  droneRoot === r
                    ? 'border-amber-400 bg-amber-500/25 text-amber-300 shadow-lg shadow-amber-500/20'
                    : 'border-white/10 bg-slate-950/40 hover:bg-slate-800 text-slate-400'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Volume Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t('droneVolume')}</span>
            <span className="font-mono">{Math.round(droneVol * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.8}
            step={0.02}
            value={droneVol}
            onChange={(e) => handleDroneVol(parseFloat(e.target.value))}
            className="w-full accent-amber-400"
          />
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleDrone}
          className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-xl ${
            isDroneOn
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-pulse'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/25'
          }`}
        >
          {isDroneOn ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>{t('stopDrone')}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{t('startDrone')} ({droneRoot})</span>
            </>
          )}
        </button>
      </div>

      {/* IQA' METRONOME CARD */}
      <div className="p-6 md:p-8 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-xl flex flex-col justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-2">
            <Disc className="w-3.5 h-3.5" />
            <span>Arabic Rhythm Cycles</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide">
            {t('iqaTitle')}
          </h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {lang === 'ar'
              ? 'ضابط إيقاع شرقي بأصوات الدم (Dum) والتك (Tak) الحية لدعم دقة التوقيت.'
              : 'Authentic Arabic percussion sequencer generating Dum & Tak accents for vocal cadence.'}
          </p>
        </div>

        {/* Rhythm Pattern Selection */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'maqsum', name: 'Maqsum (مقسوم)', time: '4/4' },
            { id: 'malfuf', name: 'Malfuf (ملفوف)', time: '2/4' },
            { id: 'baladi', name: 'Baladi (بلدي)', time: '4/4' },
          ].map((pat) => (
            <button
              key={pat.id}
              onClick={() => setIqaPattern(pat.id as any)}
              className={`p-2.5 rounded-xl text-center border transition-all ${
                iqaPattern === pat.id
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'border-white/10 bg-slate-950/40 hover:bg-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold">{pat.name}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{pat.time}</div>
            </button>
          ))}
        </div>

        {/* Tempo Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{t('tempoBpm')}</span>
            <span className="font-mono text-cyan-300 font-bold">{bpm} BPM</span>
          </div>
          <input
            type="range"
            min={60}
            max={180}
            step={2}
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-full accent-cyan-400"
          />
        </div>

        {/* Step Beat Visualizer */}
        <div className="flex items-center justify-between gap-1.5 p-3 rounded-2xl bg-slate-950/70 border border-white/5">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div
              key={idx}
              className={`flex-1 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                activeStep === idx
                  ? 'bg-cyan-400 text-slate-950 scale-110 shadow-lg shadow-cyan-400/50'
                  : 'bg-slate-800/80 text-slate-600'
              }`}
            >
              {idx % 4 === 0 ? '•' : ''}
            </div>
          ))}
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleIqa}
          className={`flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-xl ${
            isIqaOn
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-pulse'
              : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 shadow-cyan-500/25'
          }`}
        >
          {isIqaOn ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>{t('stopIqa')}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{t('startIqa')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
