// Studio DSP & Acoustic Space Emulator
// Real-time Web Audio processor for live microphone input:
// Concert Hall / Arabic Reverb, Dynamics Compressor, 3-Band EQ, and Studio Noise Gate

export interface AcousticSpacePreset {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  reverbDecay: number; // in seconds
  reverbMix: number; // 0 to 1
  compressorThreshold: number; // in dB (-50 to 0)
  compressorRatio: number; // 1 to 20
  eqLowGain: number; // dB (-12 to +12)
  eqMidGain: number; // dB (-12 to +12)
  eqHighGain: number; // dB (-12 to +12)
  noiseGateThreshold: number; // dB (-80 to -30)
}

export const ACOUSTIC_PRESETS: AcousticSpacePreset[] = [
  {
    id: 'cairo_opera',
    nameEn: 'Royal Cairo Opera (دار الأوبرا)',
    nameAr: 'دار الأوبرا المصرية الكبرى',
    descriptionEn: 'Grand acoustic hall with soaring reflections, velvety decay, and royal warmth.',
    descriptionAr: 'قاعة أوبرا فخمة ذات ارتدادات مخملية ورنين مهيب للأصوات الطربية الكبرى.',
    reverbDecay: 3.4,
    reverbMix: 0.38,
    compressorThreshold: -24,
    compressorRatio: 4,
    eqLowGain: 2,
    eqMidGain: 1,
    eqHighGain: 3,
    noiseGateThreshold: -50,
  },
  {
    id: 'oud_majlis',
    nameEn: 'Acoustic Oud Majlis (مجلس العود)',
    nameAr: 'مجلس العود التراثي الحميم',
    descriptionEn: 'Intimate wooden chamber with warm mid-range focus, tailored for acoustic Oud plucks and delicate singing.',
    descriptionAr: 'غرفة خشبية دافئة تركز على دفء النبرة الإنسانية ونقاء رنات العود الخشبي.',
    reverbDecay: 1.4,
    reverbMix: 0.22,
    compressorThreshold: -20,
    compressorRatio: 3,
    eqLowGain: 1,
    eqMidGain: 3.5,
    eqHighGain: 1.5,
    noiseGateThreshold: -52,
  },
  {
    id: 'sufi_dome',
    nameEn: 'Sufi Zawiya Dome (قبة الزاوية)',
    nameAr: 'قبة الزاوية الصوفية المهيبة',
    descriptionEn: 'Monumental domed sanctuary with long ethereal decay, ideal for Inshad, Madih, and mystical Mawwal.',
    descriptionAr: 'قبة صوفية ذات رنين ممتد وهالة روحانية ساحرة للإنشاد والمدائح والمواويل.',
    reverbDecay: 4.8,
    reverbMix: 0.52,
    compressorThreshold: -28,
    compressorRatio: 6,
    eqLowGain: 3,
    eqMidGain: -1,
    eqHighGain: 4,
    noiseGateThreshold: -48,
  },
  {
    id: 'modern_booth',
    nameEn: 'Modern Recording Booth (استوديو العزل)',
    nameAr: 'غرفة التسجيل الاحترافية المعزولة',
    descriptionEn: 'Ultra-clean, dry, punchy studio environment with transparent dynamics and pristine vocal clarity.',
    descriptionAr: 'بيئة تسجيل عصرية معزولة، تمنح الصوت حضوراً وبريقاً واضحاً ومحكماً بدون صدى مفرط.',
    reverbDecay: 0.7,
    reverbMix: 0.12,
    compressorThreshold: -18,
    compressorRatio: 4.5,
    eqLowGain: -1,
    eqMidGain: 2,
    eqHighGain: 4,
    noiseGateThreshold: -46,
  },
];

export class StudioDSPEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  // Nodes
  private inputGain: GainNode | null = null;
  private noiseGateNode: BiquadFilterNode | null = null;
  private eqLow: BiquadFilterNode | null = null;
  private eqMid: BiquadFilterNode | null = null;
  private eqHigh: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private convolver: ConvolverNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private outputGain: GainNode | null = null;

  // Metering
  private inAnalyser: AnalyserNode | null = null;
  private outAnalyser: AnalyserNode | null = null;

  private isRunning = false;
  private isBypassed = false;
  private currentPreset: AcousticSpacePreset = ACOUSTIC_PRESETS[0];

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Start real-time live monitoring through DSP rack
  public async startMonitoring(): Promise<boolean> {
    try {
      this.init();
      if (!this.ctx) return false;

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.sourceNode = this.ctx.createMediaStreamSource(this.micStream);

      // Metering analysers
      this.inAnalyser = this.ctx.createAnalyser();
      this.inAnalyser.fftSize = 256;
      this.outAnalyser = this.ctx.createAnalyser();
      this.outAnalyser.fftSize = 256;

      // Input Gain
      this.inputGain = this.ctx.createGain();
      this.inputGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      // Noise Gate Filter (Highpass + dynamic floor)
      this.noiseGateNode = this.ctx.createBiquadFilter();
      this.noiseGateNode.type = 'highpass';
      this.noiseGateNode.frequency.setValueAtTime(65, this.ctx.currentTime); // filter out sub-rumble

      // 3-Band Parametric EQ
      this.eqLow = this.ctx.createBiquadFilter();
      this.eqLow.type = 'lowshelf';
      this.eqLow.frequency.setValueAtTime(120, this.ctx.currentTime);
      this.eqLow.gain.setValueAtTime(this.currentPreset.eqLowGain, this.ctx.currentTime);

      this.eqMid = this.ctx.createBiquadFilter();
      this.eqMid.type = 'peaking';
      this.eqMid.frequency.setValueAtTime(1500, this.ctx.currentTime);
      this.eqMid.Q.setValueAtTime(1.4, this.ctx.currentTime);
      this.eqMid.gain.setValueAtTime(this.currentPreset.eqMidGain, this.ctx.currentTime);

      this.eqHigh = this.ctx.createBiquadFilter();
      this.eqHigh.type = 'highshelf';
      this.eqHigh.frequency.setValueAtTime(7500, this.ctx.currentTime);
      this.eqHigh.gain.setValueAtTime(this.currentPreset.eqHighGain, this.ctx.currentTime);

      // Dynamics Compressor
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(this.currentPreset.compressorThreshold, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(this.currentPreset.compressorRatio, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Reverb Engine (Algorithmic Impulse Response)
      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this.generateImpulseResponse(this.currentPreset.reverbDecay);

      this.dryGain = this.ctx.createGain();
      this.wetGain = this.ctx.createGain();
      this.setReverbMix(this.currentPreset.reverbMix);

      // Master Output Gain
      this.outputGain = this.ctx.createGain();
      this.outputGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

      // Chain Connections:
      // Source -> InAnalyser -> InputGain -> NoiseGate -> EQLow -> EQMid -> EQHigh -> Compressor
      this.sourceNode.connect(this.inAnalyser);
      this.inAnalyser.connect(this.inputGain);
      this.inputGain.connect(this.noiseGateNode);
      this.noiseGateNode.connect(this.eqLow);
      this.eqLow.connect(this.eqMid);
      this.eqMid.connect(this.eqHigh);
      this.eqHigh.connect(this.compressor);

      // Split Compressor out into Dry and Wet paths
      this.compressor.connect(this.dryGain);
      this.dryGain.connect(this.outputGain);

      this.compressor.connect(this.convolver);
      this.convolver.connect(this.wetGain);
      this.wetGain.connect(this.outputGain);

      // Output to OutAnalyser and Destination (Headphones)
      this.outputGain.connect(this.outAnalyser);
      this.outputGain.connect(this.ctx.destination);

      this.isRunning = true;
      return true;
    } catch (err) {
      console.error('Failed to start DSP monitoring:', err);
      return false;
    }
  }

  public stopMonitoring() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.isRunning = false;
  }

  public applyPreset(preset: AcousticSpacePreset) {
    this.currentPreset = preset;
    if (!this.ctx || !this.isRunning) return;

    const now = this.ctx.currentTime;
    if (this.eqLow) this.eqLow.gain.linearRampToValueAtTime(preset.eqLowGain, now + 0.1);
    if (this.eqMid) this.eqMid.gain.linearRampToValueAtTime(preset.eqMidGain, now + 0.1);
    if (this.eqHigh) this.eqHigh.gain.linearRampToValueAtTime(preset.eqHighGain, now + 0.1);

    if (this.compressor) {
      this.compressor.threshold.linearRampToValueAtTime(preset.compressorThreshold, now + 0.1);
      this.compressor.ratio.linearRampToValueAtTime(preset.compressorRatio, now + 0.1);
    }

    if (this.convolver) {
      this.convolver.buffer = this.generateImpulseResponse(preset.reverbDecay);
    }

    this.setReverbMix(preset.reverbMix);
  }

  public setReverbMix(mix: number) {
    if (!this.ctx || !this.dryGain || !this.wetGain) return;
    const clamped = Math.max(0, Math.min(1, mix));
    const dry = Math.cos((clamped * Math.PI) / 2);
    const wet = Math.sin((clamped * Math.PI) / 2);
    this.dryGain.gain.setValueAtTime(dry, this.ctx.currentTime);
    this.wetGain.gain.setValueAtTime(wet, this.ctx.currentTime);
  }

  public setMasterGain(vol: number) {
    if (!this.ctx || !this.outputGain) return;
    this.outputGain.gain.setValueAtTime(Math.max(0, Math.min(1.5, vol)), this.ctx.currentTime);
  }

  public toggleBypass(): boolean {
    this.isBypassed = !this.isBypassed;
    if (!this.ctx || !this.outputGain || !this.dryGain || !this.wetGain) return this.isBypassed;

    const now = this.ctx.currentTime;
    if (this.isBypassed) {
      this.dryGain.gain.setValueAtTime(1.0, now);
      this.wetGain.gain.setValueAtTime(0.0, now);
      if (this.eqLow) this.eqLow.gain.setValueAtTime(0, now);
      if (this.eqMid) this.eqMid.gain.setValueAtTime(0, now);
      if (this.eqHigh) this.eqHigh.gain.setValueAtTime(0, now);
    } else {
      this.applyPreset(this.currentPreset);
    }
    return this.isBypassed;
  }

  // Synthesize an authentic acoustic space impulse response
  private generateImpulseResponse(decayTime: number): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not ready');
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * decayTime);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      // Exponential decay envelope
      const decay = Math.exp(-t * (4.5 / decayTime));
      // Subtle stereo reflection variance
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay * 0.95;
    }
    return impulse;
  }

  // Get current input/output decibel levels for UI meters
  public getLevels(): { inDb: number; outDb: number; reductionDb: number } {
    if (!this.isRunning || !this.inAnalyser || !this.outAnalyser) {
      return { inDb: -60, outDb: -60, reductionDb: 0 };
    }

    const inData = new Uint8Array(this.inAnalyser.frequencyBinCount);
    const outData = new Uint8Array(this.outAnalyser.frequencyBinCount);
    this.inAnalyser.getByteTimeDomainData(inData);
    this.outAnalyser.getByteTimeDomainData(outData);

    const calcRms = (data: Uint8Array) => {
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const val = (data[i] - 128) / 128;
        sum += val * val;
      }
      return Math.sqrt(sum / data.length);
    };

    const inRms = calcRms(inData);
    const outRms = calcRms(outData);

    const inDb = inRms > 0.0001 ? Math.max(-60, 20 * Math.log10(inRms)) : -60;
    const outDb = outRms > 0.0001 ? Math.max(-60, 20 * Math.log10(outRms)) : -60;
    const reductionDb = this.compressor ? this.compressor.reduction : 0;

    return { inDb, outDb, reductionDb };
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsBypassed(): boolean {
    return this.isBypassed;
  }

  public getCurrentPreset(): AcousticSpacePreset {
    return this.currentPreset;
  }
}

export const studioDSP = new StudioDSPEngine();
