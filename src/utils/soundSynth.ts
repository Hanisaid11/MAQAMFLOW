// Web Audio Synthesizer: Oud pluck, Continuous Tanpura Drone, Reference Notes, and Arabic Iqa' Drum Machine

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private droneGain: GainNode | null = null;
  private droneOscillators: OscillatorNode[] = [];
  private isDroneActive = false;
  private iqaInterval: number | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Pluck an Oud string note with wooden resonance and harmonics
  public playOudNote(frequency: number, duration: number = 1.8) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Pluck transient noise burst
    const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.02), this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(frequency * 2, now);
    noiseFilter.Q.setValueAtTime(3, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    // Fundamental and 3 Harmonics for rich nylon/gut string tone
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.4, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Body resonance filter (Oud sound chamber)
    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.setValueAtTime(420, now);
    bodyFilter.gain.setValueAtTime(6, now);
    bodyFilter.Q.setValueAtTime(1.5, now);

    const freqs = [frequency, frequency * 2, frequency * 3.01, frequency * 4];
    const gains = [0.6, 0.35, 0.15, 0.08];

    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      // Use triangle/saw combo for plucked string
      osc.type = idx === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(gains[idx], now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * (1 - idx * 0.15));

      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + duration);
    });

    noiseGain.connect(masterGain);
    masterGain.connect(bodyFilter);
    bodyFilter.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.04);
  }

  // Pure reference pitch tone with subtle vibrato
  public playReferenceTone(frequency: number, duration: number = 1.2) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);

    // Subtle gentle attack and decay
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // Pluck a Qanun zither note (crisp, bright attack, shimmering metallic ring, fast decay)
  public playQanunNote(frequency: number, duration: number = 1.6, tremolo: boolean = false) {
    this.init();
    if (!this.ctx) return;

    const playSinglePluck = (tOffset: number, volScale: number = 1.0) => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime + tOffset;

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.45 * volScale, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Fish-skin bridge filter
      const skinFilter = this.ctx.createBiquadFilter();
      skinFilter.type = 'peaking';
      skinFilter.frequency.setValueAtTime(1900, now);
      skinFilter.gain.setValueAtTime(8, now);
      skinFilter.Q.setValueAtTime(2, now);

      // Harmonics (Qanun strings have bright high overtone spectrum)
      const freqs = [frequency, frequency * 2, frequency * 3, frequency * 4.02, frequency * 5.01];
      const gains = [0.55, 0.4, 0.25, 0.15, 0.08];

      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(f, now);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(gains[idx], now);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * (1 - idx * 0.12));

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + duration);
      });

      masterGain.connect(skinFilter);
      skinFilter.connect(this.ctx.destination);
    };

    if (tremolo) {
      playSinglePluck(0, 1.0);
      playSinglePluck(0.07, 0.85);
      playSinglePluck(0.14, 0.7);
    } else {
      playSinglePluck(0, 1.0);
    }
  }

  // Soulful Ney reed flute (breathy noise burst + warm hollow fundamental with vibrato)
  public playNeyNote(frequency: number, duration: number = 2.0) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Breath / Chiff noise component
    const noiseBuffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * Math.min(duration, 0.8)), this.ctx.sampleRate);
    const noiseOut = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      noiseOut[i] = (Math.random() * 2 - 1) * 0.4;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(frequency * 1.5, now);
    noiseFilter.Q.setValueAtTime(5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, now);
    noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noiseSource.start(now);
    noiseSource.stop(now + duration);

    // Flute Body: Sine + Triangle + 5Hz Vibrato LFO
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.35, now + 0.12); // gentle breath attack
    masterGain.gain.setValueAtTime(0.32, now + duration * 0.7);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // LFO for sweet eastern vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(5.2, now); // 5.2 Hz vibrato
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(4.5, now + 0.35); // vibrato kicks in after attack
    lfo.connect(lfoGain);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);
    lfoGain.connect(osc1.frequency);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(frequency * 2, now); // octave overtone for reediness

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.12, now);

    osc1.connect(masterGain);
    osc2.connect(osc2Gain);
    osc2Gain.connect(masterGain);

    masterGain.connect(this.ctx.destination);

    lfo.start(now);
    osc1.start(now);
    osc2.start(now);
    lfo.stop(now + duration);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  // Acoustic Studio / Grand Piano synthesis with hammer transient, rich harmonics & vocal resonance
  public playPianoNote(frequency: number, duration: number = 2.0, volume: number = 0.5) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(volume * 0.45, now + 0.008); // fast hammer attack
    masterGain.gain.exponentialRampToValueAtTime(volume * 0.28, now + 0.16); // body decay
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    // Felt hammer strike transient
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(frequency * 0.75, now);
    thumpGain.gain.setValueAtTime(0.2, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    thump.connect(thumpGain);
    thumpGain.connect(masterGain);
    thump.start(now);
    thump.stop(now + 0.05);

    // Harmonic overtone spectrum of piano string
    const harmonics = [
      { mult: 1.0, gain: 0.65, type: 'triangle' as OscillatorType },
      { mult: 2.0, gain: 0.32, type: 'sine' as OscillatorType },
      { mult: 3.01, gain: 0.16, type: 'sine' as OscillatorType },
      { mult: 4.02, gain: 0.08, type: 'sine' as OscillatorType },
    ];

    harmonics.forEach((h) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = h.type;
      osc.frequency.setValueAtTime(frequency * h.mult, now);

      oscGain.gain.setValueAtTime(h.gain, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * (1.1 - h.mult * 0.1));

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration);
    });

    // Soundboard filter
    const soundboard = this.ctx.createBiquadFilter();
    soundboard.type = 'lowpass';
    soundboard.frequency.setValueAtTime(Math.min(7500, Math.max(1200, frequency * 5)), now);

    masterGain.connect(soundboard);
    soundboard.connect(this.ctx.destination);
  }

  // Universal Instrument Player
  public playInstrumentNote(
    instrument: 'oud' | 'qanun' | 'ney',
    frequency: number,
    duration: number = 1.4,
    volume: number = 1.0
  ) {
    if (instrument === 'qanun') {
      this.playQanunNote(frequency, duration);
    } else if (instrument === 'ney') {
      this.playNeyNote(frequency, duration);
    } else {
      this.playOudNote(frequency, duration);
    }
  }
  public startContinuousDrone(rootFreq: number, volume: number = 0.25) {
    this.init();
    if (!this.ctx) return;
    this.stopContinuousDrone();

    const now = this.ctx.currentTime;
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.001, now);
    this.droneGain.gain.linearRampToValueAtTime(volume, now + 0.8);
    this.droneGain.connect(this.ctx.destination);

    // Drone notes: Root (octave below), Root, Fifth
    const pitches = [
      rootFreq * 0.5, // low bass
      rootFreq, // tonic
      rootFreq * 1.5, // fifth (solfege Sol/Nawa)
      rootFreq * 2, // octave
    ];

    pitches.forEach((f, idx) => {
      if (!this.ctx || !this.droneGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = idx === 0 ? 'sine' : idx === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now);

      // Subtle detune for rich chorusing acoustic texture
      osc.detune.setValueAtTime((idx - 1.5) * 3, now);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(idx === 0 ? 0.4 : idx === 1 ? 0.3 : 0.15, now);

      osc.connect(oscGain);
      oscGain.connect(this.droneGain);
      osc.start(now);
      this.droneOscillators.push(osc);
    });

    this.isDroneActive = true;
  }

  public setDroneVolume(volume: number) {
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime + 0.1);
    }
  }

  public stopContinuousDrone() {
    if (this.droneGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.droneGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      setTimeout(() => {
        this.droneOscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch (e) {}
        });
        this.droneOscillators = [];
        this.isDroneActive = false;
      }, 450);
    } else {
      this.droneOscillators = [];
      this.isDroneActive = false;
    }
  }

  public getDroneState() {
    return this.isDroneActive;
  }

  // Synthesize percussion hits: DUM (deep resonant bass) & TAK (sharp crisp rim hit)
  public playDum(time?: number) {
    this.init();
    if (!this.ctx) return;
    const t = time ?? this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  public playTak(time?: number) {
    this.init();
    if (!this.ctx) return;
    const t = time ?? this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Arabic Iqa' sequencer: "Maqsum" (4/4: Dum Tak - Tak Dum Tak) or "Malfuf" (2/4)
  public startIqa(pattern: 'maqsum' | 'malfuf' | 'baladi' = 'maqsum', bpm: number = 100, onBeat?: (step: number) => void) {
    this.stopIqa();
    this.init();
    if (!this.ctx) return;

    // Pattern definitions (16 steps or 8 steps)
    // 1 = Dum, 2 = Tak, 0 = Rest
    let steps: number[] = [];
    if (pattern === 'maqsum') {
      // Dum _ Tak _ _ Tak Dum _ Tak _
      steps = [1, 0, 2, 0, 0, 2, 1, 0, 2, 0, 0, 0];
    } else if (pattern === 'malfuf') {
      // Dum _ _ Tak _ _ Tak _
      steps = [1, 0, 0, 2, 0, 0, 2, 0];
    } else {
      // Baladi: Dum Dum _ Tak Dum _ Tak _
      steps = [1, 0, 1, 0, 0, 2, 0, 0, 1, 0, 2, 0];
    }

    const stepDurationMs = (60 / bpm / (pattern === 'malfuf' ? 4 : 4)) * 1000 * 0.5;
    let currentStep = 0;

    this.iqaInterval = window.setInterval(() => {
      const hit = steps[currentStep];
      if (hit === 1) this.playDum();
      if (hit === 2) this.playTak();
      if (onBeat) onBeat(currentStep);

      currentStep = (currentStep + 1) % steps.length;
    }, stepDurationMs);
  }

  public stopIqa() {
    if (this.iqaInterval !== null) {
      clearInterval(this.iqaInterval);
      this.iqaInterval = null;
    }
  }
}

export const soundSynth = new SoundSynthesizer();
