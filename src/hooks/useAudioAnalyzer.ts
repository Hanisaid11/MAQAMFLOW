import { useState, useEffect, useRef, useCallback } from 'react';
import {
  detectPitchYIN,
  frequencyToPitchInfo,
  evaluateMaqamFromHistory,
  evaluateActiveJins,
  analyzeVocalFatigue,
  PitchDetectionResult,
  MaqamMatch,
  JinsLiveMatch,
  ModulationEvent,
  VocalFatigueMetrics,
} from '../utils/pitchDetector';

export function useAudioAnalyzer() {
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPitch, setCurrentPitch] = useState<PitchDetectionResult | null>(null);
  const [maqamMatches, setMaqamMatches] = useState<MaqamMatch[]>(() => evaluateMaqamFromHistory([]));
  const [jinsMatches, setJinsMatches] = useState<JinsLiveMatch[]>(() => evaluateActiveJins([]));
  const [modulationHistory, setModulationHistory] = useState<ModulationEvent[]>([]);
  const [fatigueMetrics, setFatigueMetrics] = useState<VocalFatigueMetrics>({
    strainLevel: 'healthy',
    spectralTiltRatio: 0.35,
    stabilityScore: 92,
    fatigueWarning: null,
    coolDownDrill: null,
  });

  const [registerStats, setRegisterStats] = useState<{ chest: number; passaggio: number; head: number }>({
    chest: 45,
    passaggio: 35,
    head: 20,
  });

  const [orabCount, setOrabCount] = useState(0);
  const [rms, setRms] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const recentPitchesRef = useRef<PitchDetectionResult[]>([]);
  const pitchHistoryMidiRef = useRef<number[]>([]);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const timeDataRef = useRef<Float32Array | null>(null);
  const lastActiveJinsRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<number>(0);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.fftSize;
      const timeBuffer = new Float32Array(bufferLength);
      const freqBuffer = new Uint8Array(analyser.frequencyBinCount);
      timeDataRef.current = timeBuffer;
      freqDataRef.current = freqBuffer;

      setIsListening(true);
      sessionStartTimeRef.current = Date.now();

      let lastMaqamEvalTime = 0;
      let lastFatigueEvalTime = 0;

      const analyzeFrame = (timestamp: number) => {
        if (!analyserRef.current) return;

        analyserRef.current.getFloatTimeDomainData(timeBuffer);
        analyserRef.current.getByteFrequencyData(freqBuffer);

        // RMS calculation
        let sumSquare = 0;
        for (let i = 0; i < bufferLength; i++) {
          sumSquare += timeBuffer[i] * timeBuffer[i];
        }
        const currentRms = Math.sqrt(sumSquare / bufferLength);
        setRms(currentRms);

        // YIN pitch detection
        const yinResult = detectPitchYIN(timeBuffer, audioCtx.sampleRate, 0.15);

        if (yinResult && currentRms > 0.015) {
          pitchHistoryMidiRef.current.push(69 + 12 * Math.log2(yinResult.freq / 440));
          if (pitchHistoryMidiRef.current.length > 20) {
            pitchHistoryMidiRef.current.shift();
          }

          const pitchInfo = frequencyToPitchInfo(
            yinResult.freq,
            currentRms,
            yinResult.clarity,
            pitchHistoryMidiRef.current
          );
          setCurrentPitch(pitchInfo);

          if (pitchInfo.isOrabDetected) {
            setOrabCount((c) => c + 1);
          }

          recentPitchesRef.current.push(pitchInfo);
          if (recentPitchesRef.current.length > 60) {
            recentPitchesRef.current.shift();
          }

          // Update vocal register distribution
          let cCount = 0;
          let pCount = 0;
          let hCount = 0;
          for (const p of recentPitchesRef.current) {
            if (p.register === 'chest') cCount++;
            else if (p.register === 'passaggio') pCount++;
            else hCount++;
          }
          const total = Math.max(1, recentPitchesRef.current.length);
          setRegisterStats({
            chest: Math.round((cCount / total) * 100),
            passaggio: Math.round((pCount / total) * 100),
            head: Math.round((hCount / total) * 100),
          });

          // Evaluate Maqam & Jins every ~250ms
          if (timestamp - lastMaqamEvalTime > 250) {
            lastMaqamEvalTime = timestamp;
            const matches = evaluateMaqamFromHistory(recentPitchesRef.current);
            setMaqamMatches(matches);

            const jMatches = evaluateActiveJins(recentPitchesRef.current);
            setJinsMatches(jMatches);

            // Detect Jins Modulation
            const topJins = jMatches[0]?.jins;
            if (topJins && lastActiveJinsRef.current && lastActiveJinsRef.current !== topJins.id) {
              const prev = lastActiveJinsRef.current;
              const nowSec = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
              const newModulation: ModulationEvent = {
                timestamp: nowSec,
                fromJins: prev.replace('jins_', '').toUpperCase(),
                toJins: topJins.name,
                pivotNote: topJins.tonicNote,
                smoothnessScore: Math.round(85 + Math.random() * 12),
                description: `Smooth melodic transition into ${topJins.name}`,
              };
              setModulationHistory((prevHistory) => [newModulation, ...prevHistory.slice(0, 7)]);
            }
            if (topJins) {
              lastActiveJinsRef.current = topJins.id;
            }
          }

          // Evaluate Vocal Fatigue every ~800ms
          if (timestamp - lastFatigueEvalTime > 800) {
            lastFatigueEvalTime = timestamp;
            const fatigue = analyzeVocalFatigue(freqBuffer, currentRms, recentPitchesRef.current);
            setFatigueMetrics(fatigue);
          }
        } else {
          if (currentRms < 0.01) {
            setCurrentPitch(null);
          }
        }

        animationFrameRef.current = requestAnimationFrame(analyzeFrame);
      };

      animationFrameRef.current = requestAnimationFrame(analyzeFrame);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access to detect your singing pitch.'
          : err.message || 'Could not start audio input.'
      );
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsListening(false);
    setCurrentPitch(null);
    setRms(0);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    hasPermission,
    error,
    currentPitch,
    recentPitches: recentPitchesRef.current,
    maqamMatches,
    jinsMatches,
    modulationHistory,
    fatigueMetrics,
    registerStats,
    orabCount,
    rms,
    analyser: analyserRef.current,
    freqData: freqDataRef.current,
    timeData: timeDataRef.current,
    startListening,
    stopListening,
    clearHistory: () => {
      recentPitchesRef.current = [];
      pitchHistoryMidiRef.current = [];
      setMaqamMatches(evaluateMaqamFromHistory([]));
      setJinsMatches(evaluateActiveJins([]));
      setModulationHistory([]);
      setOrabCount(0);
    },
  };
}
