import React, { useRef, useEffect } from 'react';
import { PitchDetectionResult } from '../utils/pitchDetector';
import { useLanguage } from '../context/LanguageContext';

interface AudioVisualizerProps {
  isListening: boolean;
  currentPitch: PitchDetectionResult | null;
  rms: number;
  freqData: Uint8Array | null;
  timeData: Float32Array | null;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isListening,
  currentPitch,
  rms,
  freqData,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { t, isRTL } = useLanguage();
  const pitchHistoryRef = useRef<number[]>([]);

  // Update pitch trail history
  useEffect(() => {
    if (currentPitch && currentPitch.clarity > 0.4) {
      pitchHistoryRef.current.push(currentPitch.midi);
      if (pitchHistoryRef.current.length > 120) {
        pitchHistoryRef.current.shift();
      }
    } else {
      // Add null/placeholder when silent
      pitchHistoryRef.current.push(0);
      if (pitchHistoryRef.current.length > 120) {
        pitchHistoryRef.current.shift();
      }
    }
  }, [currentPitch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear with dark twilight canvas fill
      ctx.clearRect(0, 0, width, height);

      // Draw subtle background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridStep = 30;
      for (let x = 0; x < width; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Frequency Spectrum Bars
      if (isListening && freqData) {
        const barCount = 48;
        const barWidth = (width / barCount) - 3;
        const step = Math.floor(freqData.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i * step] || 0;
          const barHeight = (val / 255) * (height * 0.45);
          const x = i * (barWidth + 3);
          const y = height - barHeight;

          // Gradient from cyan through warm amber to neon magenta
          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)'); // cyan
          grad.addColorStop(0.6, 'rgba(245, 158, 11, 0.85)'); // amber
          grad.addColorStop(1, 'rgba(236, 72, 153, 0.95)'); // magenta

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();

          // Subtle neon glow cap
          if (val > 120) {
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(x, y - 2, barWidth, 2);
            ctx.shadowBlur = 0;
          }
        }
      } else {
        // Idle ambient gentle wave
        const time = Date.now() * 0.002;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x++) {
          const y = height * 0.75 + Math.sin(x * 0.03 + time) * 8 * Math.cos(x * 0.01 + time);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw Pitch Trail (continuous pitch ribbon)
      const history = pitchHistoryRef.current;
      if (history.length > 1) {
        ctx.save();
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < history.length; i++) {
          const midi = history[i];
          if (midi > 0) {
            const x = (i / (history.length - 1)) * width;
            // Map MIDI 48 (C3) to 75 (D#5) across canvas height
            const normalizedMidi = (midi - 48) / (76 - 48);
            const y = height * 0.55 - normalizedMidi * (height * 0.45);

            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          } else {
            started = false;
          }
        }

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isListening, freqData]);

  // Cents needle calculation (-50 to +50 cents)
  const cents = currentPitch ? currentPitch.cents : 0;
  const isQuarter = currentPitch?.isQuarterTone;
  const inTune = Math.abs(cents) <= 5;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden p-6 border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20">
      {/* Dynamic ambient background glow that pulses with vocal RMS */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl transition-transform duration-150"
        style={{ transform: `scale(${1 + rms * 3})` }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-amber-500/15 blur-3xl transition-transform duration-150"
        style={{ transform: `scale(${1 + rms * 2.5})` }}
      />

      {/* Main Pitch HUD */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
        {/* Left: Pitch and Arabic Name Display */}
        <div className="flex items-center gap-5">
          <div
            className={`relative flex flex-col items-center justify-center w-28 h-28 rounded-2xl border transition-all duration-300 ${
              currentPitch
                ? isQuarter
                  ? 'border-amber-400/80 bg-amber-500/15 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/30'
                  : inTune
                  ? 'border-emerald-400/80 bg-emerald-500/15 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/30'
                  : 'border-cyan-400/80 bg-cyan-500/15 shadow-lg shadow-cyan-500/25'
                : 'border-white/10 bg-slate-800/40 text-slate-500'
            }`}
          >
            <span className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
              {currentPitch ? currentPitch.noteName : '—'}
            </span>
            <span className="text-xs font-semibold text-amber-300/90 font-arabic mt-1">
              {currentPitch ? currentPitch.arabicName : 'الصوت غير متصل'}
            </span>

            {/* Quarter-tone Indicator Tag */}
            {isQuarter && (
              <span className="absolute -top-3 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md">
                ½♭ SIKAH
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                {t('currentPitch')}
              </span>
              {currentPitch && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 border border-white/10 text-slate-300">
                  {t('octave')} {currentPitch.octave}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-white tracking-wide mt-1">
              {currentPitch ? (
                <>
                  {currentPitch.frequency.toFixed(1)}{' '}
                  <span className="text-sm font-normal text-slate-400">Hz</span>
                </>
              ) : (
                <span className="text-slate-500 text-lg font-normal">
                  {isListening ? t('micPrompt') : t('startListening')}
                </span>
              )}
            </div>

            {/* Microtone Banner */}
            {isQuarter && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{t('quarterToneDetected')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Precision Cents Needle Gauge */}
        <div className="w-full md:w-64 flex flex-col items-center bg-slate-950/40 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between w-full text-xs text-slate-400 mb-2">
            <span className="text-cyan-400 font-semibold">{t('flat')} (-50¢)</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                inTune
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-300'
              }`}
            >
              {currentPitch ? `${cents > 0 ? '+' : ''}${cents} cents` : '0 cents'}
            </span>
            <span className="text-rose-400 font-semibold">{t('sharp')} (+50¢)</span>
          </div>

          {/* Precision Meter Bar */}
          <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-white/10">
            {/* Center target safe zone */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 bg-emerald-500/30" />
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-emerald-400" />

            {/* Dynamic Needle */}
            {currentPitch && (
              <div
                className={`absolute top-0 bottom-0 w-2.5 -ml-1.25 rounded-full shadow-lg transition-all duration-100 ${
                  inTune
                    ? 'bg-emerald-400 shadow-emerald-400/60'
                    : cents > 0
                    ? 'bg-amber-400 shadow-amber-400/60'
                    : 'bg-cyan-400 shadow-cyan-400/60'
                }`}
                style={{
                  left: `${Math.max(4, Math.min(96, 50 + (cents / 50) * 45))}%`,
                }}
              />
            )}
          </div>

          <div className="mt-2 text-[11px] font-medium text-slate-400 text-center">
            {currentPitch
              ? inTune
                ? `✨ ${t('inTune')}`
                : cents > 0
                ? `${t('sharp')} (+${cents}¢)`
                : `${t('flat')} (${cents}¢)`
              : 'Standby'}
          </div>
        </div>
      </div>

      {/* Real-time Audio Canvas Visualizer (Frequency Bars & Pitch Trajectory) */}
      <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-white/5 bg-slate-950/70">
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className="w-full h-full block"
        />

        {/* Canvas overlay labels */}
        <div className="pointer-events-none absolute bottom-2 left-3 text-[10px] uppercase tracking-wider text-slate-400/60 font-mono">
          YIN F0 Engine • 24-TET Microtonal Tracking
        </div>
        <div className="pointer-events-none absolute top-2 right-3 flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isListening ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
            }`}
          />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {isListening ? 'LIVE AUDIO' : 'IDLE'}
          </span>
        </div>
      </div>
    </div>
  );
};
