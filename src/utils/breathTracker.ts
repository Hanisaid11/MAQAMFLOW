// Vocal Stamina & Breath Management Engine
// Tracks real-time vocal phrase lengths, lung capacity consumption, pitch droop warnings, and breath intake markers

export interface PhraseRecord {
  id: string;
  startTime: number;
  duration: number; // in seconds
  avgPitch: string;
  avgRms: number;
  pitchDroopDetected: boolean;
  breathConsumptionPct: number;
  rating: 'Superb' | 'Good' | 'Needs Breath';
}

export interface BreathMetrics {
  currentPhraseDuration: number;
  breathRemainingPct: number; // 0 to 100
  isSinging: boolean;
  pitchDroopWarning: boolean;
  highAirflowAlert: boolean;
  phraseCount: number;
  longestPhrase: number;
  averagePhraseDuration: number;
  breathMarkNeeded: boolean;
  recentPhrases: PhraseRecord[];
}

export class BreathTracker {
  private isSinging = false;
  private phraseStartTime = 0;
  private silenceFrames = 0;
  private lastPitchCents = 0;
  private pitchSamples: number[] = [];
  private rmsSamples: number[] = [];

  private phraseCount = 0;
  private longestPhrase = 0;
  private totalPhraseDuration = 0;
  private recentPhrases: PhraseRecord[] = [];

  // Thresholds
  private silenceThreshold = 0.015; // RMS below this considered silence / breath intake
  private maxPhraseSeconds = 12.0; // Typical max comfortable single-breath phrase in seconds
  private lastPhraseRecord: PhraseRecord | null = null;

  public processFrame(
    rms: number,
    cents: number,
    noteName: string,
    timestamp: number = Date.now()
  ): BreathMetrics {
    const isPhonating = rms > this.silenceThreshold;
    let pitchDroopWarning = false;
    let highAirflowAlert = false;
    let breathMarkNeeded = false;

    if (isPhonating) {
      this.silenceFrames = 0;
      if (!this.isSinging) {
        // Phrase Started
        this.isSinging = true;
        this.phraseStartTime = timestamp;
        this.pitchSamples = [];
        this.rmsSamples = [];
      }

      this.pitchSamples.push(cents);
      this.rmsSamples.push(rms);

      // Excessive loudness / air dump warning (too loud = burns breath fast)
      if (rms > 0.45) {
        highAirflowAlert = true;
      }

      // Check for Pitch Droop (trailing pitch drop > 25 cents combined with drop in RMS)
      if (this.pitchSamples.length > 8) {
        const recentPitches = this.pitchSamples.slice(-8);
        const pitchDelta = recentPitches[recentPitches.length - 1] - recentPitches[0];
        const recentRms = this.rmsSamples.slice(-8);
        const rmsDelta = recentRms[recentRms.length - 1] - recentRms[0];

        if (pitchDelta < -25 && rmsDelta < -0.05) {
          pitchDroopWarning = true;
        }
      }
    } else {
      // Below silence threshold
      if (this.isSinging) {
        this.silenceFrames++;
        // If silence holds for ~350ms (assuming ~20-30 fps, ~8-10 frames)
        if (this.silenceFrames > 8) {
          // Phrase Ended
          this.isSinging = false;
          const phraseDuration = (timestamp - this.phraseStartTime) / 1000;

          if (phraseDuration > 0.6) {
            // Valid phrase
            this.phraseCount++;
            this.totalPhraseDuration += phraseDuration;
            if (phraseDuration > this.longestPhrase) {
              this.longestPhrase = phraseDuration;
            }

            const consumption = Math.min(100, (phraseDuration / this.maxPhraseSeconds) * 100);
            const droop = pitchDroopWarning || (this.pitchSamples.length > 5 && this.pitchSamples[this.pitchSamples.length - 1] < this.pitchSamples[0] - 30);

            const rating: 'Superb' | 'Good' | 'Needs Breath' =
              droop || consumption > 85 ? 'Needs Breath' : consumption > 50 ? 'Superb' : 'Good';

            const record: PhraseRecord = {
              id: `phrase_${Date.now()}`,
              startTime: this.phraseStartTime,
              duration: parseFloat(phraseDuration.toFixed(1)),
              avgPitch: noteName || '—',
              avgRms: parseFloat((this.rmsSamples.reduce((a, b) => a + b, 0) / Math.max(1, this.rmsSamples.length)).toFixed(2)),
              pitchDroopDetected: droop,
              breathConsumptionPct: Math.round(consumption),
              rating,
            };

            this.lastPhraseRecord = record;
            this.recentPhrases = [record, ...this.recentPhrases.slice(0, 9)];
            breathMarkNeeded = true;
          }
        }
      }
    }

    const currentDuration = this.isSinging ? (timestamp - this.phraseStartTime) / 1000 : 0;
    const consumed = (currentDuration / this.maxPhraseSeconds) * 100;
    const breathRemainingPct = Math.max(0, Math.min(100, Math.round(100 - consumed)));

    const averagePhraseDuration =
      this.phraseCount > 0 ? parseFloat((this.totalPhraseDuration / this.phraseCount).toFixed(1)) : 0;

    return {
      currentPhraseDuration: parseFloat(currentDuration.toFixed(1)),
      breathRemainingPct,
      isSinging: this.isSinging,
      pitchDroopWarning: pitchDroopWarning || breathRemainingPct < 15,
      highAirflowAlert,
      phraseCount: this.phraseCount,
      longestPhrase: parseFloat(this.longestPhrase.toFixed(1)),
      averagePhraseDuration,
      breathMarkNeeded,
      recentPhrases: this.recentPhrases,
    };
  }

  public reset() {
    this.isSinging = false;
    this.phraseStartTime = 0;
    this.silenceFrames = 0;
    this.phraseCount = 0;
    this.longestPhrase = 0;
    this.totalPhraseDuration = 0;
    this.recentPhrases = [];
    this.pitchSamples = [];
    this.rmsSamples = [];
  }
}

export const breathTracker = new BreathTracker();
