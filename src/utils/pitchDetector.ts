import {
  MAQAMAT_DATABASE,
  MaqamDefinition,
  AJNAS_DATABASE,
  JinsDefinition,
  ARABIC_NOTE_NAMES,
} from './maqamData';

export type VocalRegister = 'chest' | 'passaggio' | 'head';

export interface PitchDetectionResult {
  frequency: number; // Hz
  midi: number; // continuous MIDI
  noteName: string; // e.g. "E½b4", "D4"
  baseNote: string; // e.g. "E½b", "D"
  arabicName: string; // e.g. "سيكاه"
  octave: number;
  cents: number; // deviation from nearest 24-TET note (-25 to +25 cents)
  centsFrom12TET: number;
  isQuarterTone: boolean;
  clarity: number; // 0 to 1
  rms: number; // signal power
  register: VocalRegister;
  isOrabDetected: boolean; // Traditional Arab ornamentation (micro-trill / Tarjif)
  isGlissandoDetected: boolean; // Tazleeq slide
}

export interface MaqamMatch {
  maqam: MaqamDefinition;
  confidence: number;
  matchedDegrees: string[];
  missingDegrees: string[];
}

export interface JinsLiveMatch {
  jins: JinsDefinition;
  confidence: number;
  isTonic: boolean;
}

export interface ModulationEvent {
  timestamp: number; // seconds
  fromJins: string;
  toJins: string;
  pivotNote: string;
  smoothnessScore: number; // 0-100
  description: string;
}

export interface VocalFatigueMetrics {
  strainLevel: 'healthy' | 'moderate' | 'fatigued';
  spectralTiltRatio: number; // high freq to low freq energy
  stabilityScore: number; // jitter/shimmer consistency 0-100
  fatigueWarning: string | null;
  coolDownDrill: string | null;
}

// 24-TET note names starting at C
const NOTE_STRINGS_24TET = [
  'C',
  'C½#',
  'C#',
  'D½b',
  'D',
  'D½#',
  'Eb',
  'E½b',
  'E',
  'E½#',
  'F',
  'F½#',
  'F#',
  'G½b',
  'G',
  'G½#',
  'G#',
  'A½b',
  'A',
  'A½#',
  'Bb',
  'B½b',
  'B',
  'B½#',
];

// YIN Pitch Detection Algorithm with Parabolic Interpolation
export function detectPitchYIN(
  buffer: Float32Array,
  sampleRate: number,
  threshold: number = 0.12
): { freq: number; clarity: number } | null {
  const bufferSize = buffer.length;
  const halfBufferSize = Math.floor(bufferSize / 2);

  // Compute RMS
  let sumSquare = 0;
  for (let i = 0; i < bufferSize; i++) {
    sumSquare += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(sumSquare / bufferSize);
  if (rms < 0.015) {
    return null;
  }

  // Step 1 & 2: Difference function
  const yinBuffer = new Float32Array(halfBufferSize);
  yinBuffer[0] = 1;
  let runningSum = 0;

  for (let tau = 1; tau < halfBufferSize; tau++) {
    let diffSum = 0;
    for (let i = 0; i < halfBufferSize; i++) {
      const delta = buffer[i] - buffer[i + tau];
      diffSum += delta * delta;
    }
    yinBuffer[tau] = diffSum;

    // Step 3: Cumulative mean normalized difference
    runningSum += diffSum;
    yinBuffer[tau] = runningSum === 0 ? 1 : (yinBuffer[tau] * tau) / runningSum;
  }

  // Step 4: Absolute threshold
  let tauEstimate = -1;
  for (let tau = 2; tau < halfBufferSize; tau++) {
    if (yinBuffer[tau] < threshold) {
      while (tau + 1 < halfBufferSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) {
    let minVal = 1;
    let minTau = -1;
    for (let tau = 2; tau < halfBufferSize; tau++) {
      if (yinBuffer[tau] < minVal) {
        minVal = yinBuffer[tau];
        minTau = tau;
      }
    }
    if (minVal < 0.35 && minTau !== -1) {
      tauEstimate = minTau;
    } else {
      return null;
    }
  }

  // Step 5: Parabolic interpolation
  let betterTau = tauEstimate;
  if (tauEstimate > 0 && tauEstimate < halfBufferSize - 1) {
    const s0 = yinBuffer[tauEstimate - 1];
    const s1 = yinBuffer[tauEstimate];
    const s2 = yinBuffer[tauEstimate + 1];
    const denominator = 2 * (s0 - 2 * s1 + s2);
    if (Math.abs(denominator) > 1e-6) {
      const delta = (s0 - s2) / denominator;
      betterTau = tauEstimate + delta;
    }
  }

  const pitch = sampleRate / betterTau;
  if (pitch < 65 || pitch > 1150) {
    return null;
  }

  const clarity = 1 - Math.min(1, yinBuffer[tauEstimate]);
  return { freq: pitch, clarity };
}

// Convert frequency to full 24-TET pitch and vocal register
export function frequencyToPitchInfo(
  frequency: number,
  rms: number = 0.5,
  clarity: number = 1.0,
  pitchHistory: number[] = []
): PitchDetectionResult {
  const midiContinuous = 69 + 12 * Math.log2(frequency / 440);

  const midi12 = Math.round(midiContinuous);
  const centsFrom12TET = Math.round((midiContinuous - midi12) * 100);

  const quarterToneStepsFromC0 = Math.round((midiContinuous - 12) * 2);
  const noteIndex24 = ((quarterToneStepsFromC0 % 24) + 24) % 24;
  const octave = Math.floor(quarterToneStepsFromC0 / 24);

  const isQuarterTone = noteIndex24 % 2 !== 0;

  const nearest24Midi = 12 + quarterToneStepsFromC0 * 0.5;
  const cents = Math.round((midiContinuous - nearest24Midi) * 100);

  let rawName = NOTE_STRINGS_24TET[noteIndex24];
  if (rawName === 'Eb' && isQuarterTone) rawName = 'E½b';
  if (rawName === 'Bb' && isQuarterTone) rawName = 'B½b';

  const noteName = `${rawName}${octave}`;
  const baseNote = rawName.replace(/[0-9]/g, '');
  const arabicName = ARABIC_NOTE_NAMES[baseNote] || baseNote;

  // Determine vocal register
  let register: VocalRegister = 'chest';
  if (frequency < 330) {
    register = 'chest'; // القرار / الصدري
  } else if (frequency < 392) {
    register = 'passaggio'; // منطقة العبور (E4 to G4)
  } else {
    register = 'head'; // الجواب / الرأسي
  }

  // Detect traditional Arab Orab / Tarjif trills (rapid micro-pitch oscillations)
  let isOrabDetected = false;
  let isGlissandoDetected = false;

  if (pitchHistory.length >= 6) {
    const recent = pitchHistory.slice(-6);
    let alternations = 0;
    for (let i = 1; i < recent.length - 1; i++) {
      const d1 = recent[i] - recent[i - 1];
      const d2 = recent[i + 1] - recent[i];
      if (d1 * d2 < 0 && Math.abs(d1) > 0.3 && Math.abs(d1) < 2.0) {
        alternations++;
      }
    }
    if (alternations >= 2) {
      isOrabDetected = true; // rapid melismatic trill / Orab
    }

    // Check smooth sliding glissando
    const overallSlide = recent[recent.length - 1] - recent[0];
    if (Math.abs(overallSlide) >= 1.5 && Math.abs(overallSlide) <= 3.5) {
      isGlissandoDetected = true; // Tazleeq slide
    }
  }

  return {
    frequency,
    midi: midiContinuous,
    noteName,
    baseNote,
    arabicName,
    octave,
    cents,
    centsFrom12TET,
    isQuarterTone,
    clarity,
    rms,
    register,
    isOrabDetected,
    isGlissandoDetected,
  };
}

// Real-Time Jins Tracker & Modulation Detector
export function evaluateActiveJins(recentPitches: PitchDetectionResult[]): JinsLiveMatch[] {
  if (!recentPitches || recentPitches.length < 4) {
    return AJNAS_DATABASE.slice(0, 4).map((j, i) => ({
      jins: j,
      confidence: i === 0 ? 85 : Math.max(30, 70 - i * 15),
      isTonic: i === 0,
    }));
  }

  const pitchCounts: Record<string, number> = {};
  for (const p of recentPitches) {
    pitchCounts[p.baseNote] = (pitchCounts[p.baseNote] || 0) + 1;
  }

  const results: JinsLiveMatch[] = [];

  for (const jins of AJNAS_DATABASE) {
    let score = 0;
    const tonicBase = jins.tonicNote.replace(/[0-9]/g, '');
    const ghammazBase = jins.ghammazNote.replace(/[0-9]/g, '');

    if (pitchCounts[tonicBase]) score += 30;
    if (pitchCounts[ghammazBase]) score += 20;

    for (const deg of jins.degrees) {
      const base = deg.replace(/[0-9]/g, '');
      if (pitchCounts[base]) {
        score += deg.includes('½') ? 25 : 15;
      }
    }

    const confidence = Math.min(99, Math.max(10, Math.round(score * 1.05)));
    results.push({
      jins,
      confidence,
      isTonic: jins.id.includes('bayati') || jins.id.includes('rast'),
    });
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

// Evaluate Vocal Fatigue & Formant Balance
export function analyzeVocalFatigue(
  freqData: Uint8Array | null,
  rms: number,
  pitchHistory: PitchDetectionResult[]
): VocalFatigueMetrics {
  if (!freqData || freqData.length < 64 || rms < 0.02) {
    return {
      strainLevel: 'healthy',
      spectralTiltRatio: 0.35,
      stabilityScore: 92,
      fatigueWarning: null,
      coolDownDrill: null,
    };
  }

  // Calculate energy below 1000 Hz vs energy above 3000 Hz (spectral tilt & tension)
  let lowEnergy = 0;
  let highEnergy = 0;

  for (let i = 0; i < 20; i++) {
    lowEnergy += freqData[i];
  }
  for (let i = 60; i < 120 && i < freqData.length; i++) {
    highEnergy += freqData[i];
  }

  const tiltRatio = highEnergy / Math.max(1, lowEnergy);

  // Pitch jitter metric (frame-to-frame frequency stability)
  let jitterSum = 0;
  let validCount = 0;
  for (let i = 1; i < pitchHistory.length; i++) {
    if (pitchHistory[i].clarity > 0.5 && pitchHistory[i - 1].clarity > 0.5) {
      const diff = Math.abs(pitchHistory[i].cents - pitchHistory[i - 1].cents);
      jitterSum += diff;
      validCount++;
    }
  }
  const avgJitter = validCount > 0 ? jitterSum / validCount : 10;
  const stability = Math.max(40, Math.min(98, Math.round(100 - avgJitter * 2.2)));

  let strain: 'healthy' | 'moderate' | 'fatigued' = 'healthy';
  let warning: string | null = null;
  let coolDown: string | null = null;

  if (tiltRatio > 0.95 || stability < 62) {
    strain = 'fatigued';
    warning = 'High vocal fold constriction detected! Increased spectral tension and pitch jitter.';
    coolDown = 'Perform gentle lip trills (brrr) on descending fifths and hydrate immediately.';
  } else if (tiltRatio > 0.7 || stability < 75) {
    strain = 'moderate';
    warning = 'Approaching vocal fatigue. Slight throat tension in the passaggio zone.';
    coolDown = 'Practice resonant hums ("Mmm") focusing on mask placement rather than throat push.';
  }

  return {
    strainLevel: strain,
    spectralTiltRatio: parseFloat(tiltRatio.toFixed(2)),
    stabilityScore: stability,
    fatigueWarning: warning,
    coolDownDrill: coolDown,
  };
}

// Match pitch history histogram against Maqamat
export function evaluateMaqamFromHistory(recentPitches: PitchDetectionResult[]): MaqamMatch[] {
  if (!recentPitches || recentPitches.length < 5) {
    return MAQAMAT_DATABASE.slice(0, 4).map((maqam, i) => ({
      maqam,
      confidence: i === 0 ? 82 : Math.max(20, 70 - i * 15),
      matchedDegrees: maqam.scaleDegrees.slice(0, 4).map((d) => d.note),
      missingDegrees: maqam.scaleDegrees.slice(4).map((d) => d.note),
    }));
  }

  const pitchCounts: Record<string, number> = {};
  for (const p of recentPitches) {
    if (p.clarity > 0.4) {
      pitchCounts[p.baseNote] = (pitchCounts[p.baseNote] || 0) + 1;
    }
  }

  const results: MaqamMatch[] = [];

  for (const maqam of MAQAMAT_DATABASE) {
    let score = 0;
    const matched: string[] = [];
    const missing: string[] = [];

    const rootBase = maqam.rootNote.replace(/[0-9]/g, '');

    if (pitchCounts[rootBase]) {
      score += 25 * Math.min(1, pitchCounts[rootBase] / 3);
    }

    for (const deg of maqam.scaleDegrees) {
      const base = deg.note.replace(/[0-9]/g, '');
      const count = pitchCounts[base] || 0;

      if (count > 0) {
        matched.push(deg.note);
        score += deg.isQuarterTone ? 22 : 12;
      } else {
        missing.push(deg.note);
      }
    }

    if (maqam.id === 'bayati' && pitchCounts['F#']) score -= 15;
    if (maqam.id === 'hijaz' && pitchCounts['F'] && !pitchCounts['F#']) score -= 15;
    if (maqam.id === 'nahawand' && pitchCounts['E½b']) score -= 12;

    const normalizedConfidence = Math.min(98, Math.max(12, Math.round(score * 1.1)));
    results.push({
      maqam,
      confidence: normalizedConfidence,
      matchedDegrees: matched,
      missingDegrees: missing,
    });
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}
