// Real-Time Harmonizer Engine & Multi-Track Studio Processor
// Supports authentic Arabic microtonal intervals (e.g. 350-cent neutral thirds) and multi-track audio layering

export interface HarmonizerInterval {
  id: string;
  nameEn: string;
  nameAr: string;
  cents: number;
  ratio: number;
  isQuarterTone: boolean;
  descriptionEn: string;
  descriptionAr: string;
}

export const HARMONY_INTERVALS: HarmonizerInterval[] = [
  {
    id: 'neutral_third_up',
    nameEn: 'Arabic Neutral Third (+350¢)',
    nameAr: 'ثالثة محايدة شرقية (سيكاه +350)',
    cents: 350,
    ratio: Math.pow(2, 350 / 1200),
    isQuarterTone: true,
    descriptionEn: 'The quintessential Arabic microtonal harmony: half-flat third above the melody.',
    descriptionAr: 'الطباق الصوتي الشرقي الأصيل؛ ثلث ربع تون يعطي الرنين الطربي الفريد.',
  },
  {
    id: 'fourth_up',
    nameEn: 'Perfect Fourth (+500¢)',
    nameAr: 'رابعة تامة (+500 سنت)',
    cents: 500,
    ratio: 4 / 3,
    isQuarterTone: false,
    descriptionEn: 'Ancient Byzantine & Andalusian parallel organum harmony; deeply spiritual.',
    descriptionAr: 'تناغم كنسي وأندلسي قديم يعطي إحساساً بالعمق والقداسة الروحية.',
  },
  {
    id: 'fifth_up',
    nameEn: 'Perfect Fifth (+700¢)',
    nameAr: 'خامسة تامة (+700 سنت)',
    cents: 700,
    ratio: 1.5,
    isQuarterTone: false,
    descriptionEn: 'Open, hollow acoustic fifth; standard choral backing foundation.',
    descriptionAr: 'هارموني مفتوح وفخم يشكل أساس الكورال الجماعي.',
  },
  {
    id: 'minor_third_up',
    nameEn: 'Minor Third (+300¢)',
    nameAr: 'ثالثة صغيرة (+300 سنت)',
    cents: 300,
    ratio: Math.pow(2, 300 / 1200),
    isQuarterTone: false,
    descriptionEn: 'Rich, melancholic Western/Eastern minor harmony (Nahawand / Kurd).',
    descriptionAr: 'تناغم شجي ودافئ يناسب المقامات المينور مثل النهاوند والكرد.',
  },
  {
    id: 'octave_up',
    nameEn: 'High Octave / Jawab (+1200¢)',
    nameAr: 'جواب أوكتاف أعلى (+1200)',
    cents: 1200,
    ratio: 2.0,
    isQuarterTone: false,
    descriptionEn: 'Bright soprano/tenor doubling on the upper octave.',
    descriptionAr: 'مضاعفة صوتية في الطبقة الحادة لإضافة سطوع وبريق.',
  },
  {
    id: 'octave_down',
    nameEn: 'Bass Sub-Octave / Qarar (-1200¢)',
    nameAr: 'قرار أوكتاف أدنى (-1200)',
    cents: -1200,
    ratio: 0.5,
    isQuarterTone: false,
    descriptionEn: 'Deep chest bass anchoring the vocal melody below.',
    descriptionAr: 'طبقة باص رخيمة من قاع الصدر لتثبيت اللحن الأساسي.',
  },
  {
    id: 'neutral_third_down',
    nameEn: 'Arabic Neutral Third Down (-350¢)',
    nameAr: 'ثالثة محايدة هابطة (-350)',
    cents: -350,
    ratio: Math.pow(2, -350 / 1200),
    isQuarterTone: true,
    descriptionEn: 'Lower counter-melody with authentic Arabic microtonal inflection.',
    descriptionAr: 'لحن موازٍ منخفض بنكهة ربع التون الشرقية الأصيلة.',
  },
];

export interface StudioTrack {
  id: string;
  name: string;
  nameAr: string;
  type: 'instrumental' | 'lead' | 'harmony_high' | 'harmony_low' | 'drone';
  volume: number; // 0 to 1
  pan: number; // -1 to 1
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  intervalId?: string;
  audioBlob?: Blob;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  duration: number;
}

export class HarmonizerEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private isMonitoring = false;

  // Harmonizer Nodes
  private inputGain: GainNode | null = null;
  private directGain: GainNode | null = null;
  private harmonyGain: GainNode | null = null;
  private delayNode1: DelayNode | null = null;
  private delayNode2: DelayNode | null = null;
  private modOsc: OscillatorNode | null = null;
  private modGain: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;

  // Pitch Shift simulation using pitch-synchronous granular / delay-line crossfading
  private currentCents = 350;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getContext(): AudioContext | null {
    this.init();
    return this.ctx;
  }

  // Start live microphone harmonizer loopback (sing and hear real-time harmony)
  public async startLiveHarmonizer(
    cents: number = 350,
    directMix: number = 0.7,
    harmonyMix: number = 0.8
  ): Promise<boolean> {
    try {
      this.init();
      if (!this.ctx) return false;

      this.currentCents = cents;
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.micSource = this.ctx.createMediaStreamSource(this.micStream);

      this.inputGain = this.ctx.createGain();
      this.inputGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.directGain = this.ctx.createGain();
      this.directGain.gain.setValueAtTime(directMix, this.ctx.currentTime);

      this.harmonyGain = this.ctx.createGain();
      this.harmonyGain.gain.setValueAtTime(harmonyMix, this.ctx.currentTime);

      // Pitch shift via dual ramp modulated delays (granular pitch-shifter)
      const ratio = Math.pow(2, cents / 1200);
      const modFreq = (ratio - 1) * 35; // frequency shift rate

      this.delayNode1 = this.ctx.createDelay(0.1);
      this.delayNode2 = this.ctx.createDelay(0.1);
      this.delayNode1.delayTime.setValueAtTime(0.03, this.ctx.currentTime);
      this.delayNode2.delayTime.setValueAtTime(0.05, this.ctx.currentTime);

      // Bandpass shaping to smooth vowel formants of the harmony voice
      const formantFilter = this.ctx.createBiquadFilter();
      formantFilter.type = 'bandpass';
      formantFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      formantFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.modOsc = this.ctx.createOscillator();
      this.modGain = this.ctx.createGain();
      this.modOsc.frequency.setValueAtTime(Math.max(1, Math.abs(modFreq)), this.ctx.currentTime);
      this.modGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      this.modOsc.connect(this.modGain);
      this.modGain.connect(this.delayNode1.delayTime);

      // Connect Direct signal
      this.micSource.connect(this.inputGain);
      this.inputGain.connect(this.directGain);
      this.directGain.connect(this.ctx.destination);

      // Connect Harmony path
      this.inputGain.connect(this.delayNode1);
      this.delayNode1.connect(formantFilter);
      formantFilter.connect(this.harmonyGain);

      if (this.ctx.createStereoPanner) {
        this.pannerNode = this.ctx.createStereoPanner();
        this.pannerNode.pan.setValueAtTime(0.35, this.ctx.currentTime); // pan harmony slightly right
        this.harmonyGain.connect(this.pannerNode);
        this.pannerNode.connect(this.ctx.destination);
      } else {
        this.harmonyGain.connect(this.ctx.destination);
      }

      this.modOsc.start();
      this.isMonitoring = true;
      return true;
    } catch (err) {
      console.error('Harmonizer init error:', err);
      return false;
    }
  }

  public setHarmonyCents(cents: number) {
    this.currentCents = cents;
    if (this.modOsc && this.ctx) {
      const ratio = Math.pow(2, cents / 1200);
      const modFreq = (ratio - 1) * 35;
      this.modOsc.frequency.setValueAtTime(Math.max(1, Math.abs(modFreq)), this.ctx.currentTime);
    }
  }

  public setMix(direct: number, harmony: number) {
    if (this.directGain && this.harmonyGain && this.ctx) {
      this.directGain.gain.setValueAtTime(direct, this.ctx.currentTime);
      this.harmonyGain.gain.setValueAtTime(harmony, this.ctx.currentTime);
    }
  }

  public stopLiveHarmonizer() {
    if (this.modOsc) {
      try {
        this.modOsc.stop();
        this.modOsc.disconnect();
      } catch (e) {
        // ignore
      }
      this.modOsc = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    this.isMonitoring = false;
  }

  public isLiveMonitoring(): boolean {
    return this.isMonitoring;
  }

  // Synthesize harmony interval preview on a musical note
  public playHarmonizedPreview(baseFreq: number, cents: number, duration: number = 1.8) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const harmonyFreq = baseFreq * Math.pow(2, cents / 1200);

    // Lead Tone (Warm Oud / Sine blend)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Harmony Tone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(harmonyFreq, now);
    gain2.gain.setValueAtTime(0.22, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Stereo spread
    let pan1: AudioNode = gain1;
    let pan2: AudioNode = gain2;

    if (this.ctx.createStereoPanner) {
      const p1 = this.ctx.createStereoPanner();
      const p2 = this.ctx.createStereoPanner();
      p1.pan.setValueAtTime(-0.35, now);
      p2.pan.setValueAtTime(0.35, now);
      gain1.connect(p1);
      gain2.connect(p2);
      pan1 = p1;
      pan2 = p2;
    }

    pan1.connect(this.ctx.destination);
    pan2.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  // Render multi-track mix into a downloadable WAV file
  public static async exportTracksToWav(tracks: StudioTrack[]): Promise<Blob | null> {
    const activeTracks = tracks.filter((t) => t.audioBuffer && !t.isMuted);
    if (activeTracks.length === 0) return null;

    const sampleRate = 44100;
    const maxDuration = Math.max(...activeTracks.map((t) => t.audioBuffer!.duration));
    const totalSamples = Math.ceil(maxDuration * sampleRate);

    const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

    for (const track of activeTracks) {
      if (!track.audioBuffer) continue;
      const source = offlineCtx.createBufferSource();
      source.buffer = track.audioBuffer;

      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(track.volume, 0);

      const panner = offlineCtx.createStereoPanner();
      panner.pan.setValueAtTime(track.pan, 0);

      source.connect(gain);
      gain.connect(panner);
      panner.connect(offlineCtx.destination);
      source.start(0);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return HarmonizerEngine.audioBufferToWav(renderedBuffer);
  }

  // Convert AudioBuffer to WAV format binary Blob
  private static audioBufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    const channels: Float32Array[] = [];
    let sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function setUint16(data: number) {
      out.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data: number) {
      out.setUint32(pos, data, true);
      pos += 4;
    }

    // RIFF identifier
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // fmt sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // subchunk1size (16 for PCM)
    setUint16(1); // PCM format
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample

    // data sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset] || 0));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
  }
}

export const harmonizerEngine = new HarmonizerEngine();
