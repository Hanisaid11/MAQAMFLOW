// Arabic Maqam, Ajnas, Microtones, and Vocal Pedagogy Database (Pro Edition)

export interface JinsDefinition {
  id: string;
  name: string;
  arabicName: string;
  tonicNote: string;
  ghammazNote: string; // The modulation pivot / dominant note
  intervalCents: number[]; // e.g. [0, 150, 300, 500] for Bayati
  degrees: string[]; // e.g. ['D4', 'E½b4', 'F4', 'G4']
  character: string;
  characterArabic: string;
}

export interface MaqamNote {
  name: string;
  arabicName: string;
  freqOffsetCents: number;
  isQuarterTone: boolean;
  degreeName: string;
}

export interface ModulationRule {
  targetJinsId: string;
  targetJinsName: string;
  targetJinsArabic: string;
  pivotNote: string;
  smoothnessScore: number; // 0-100 typical aesthetic suitability
  description: string;
  descriptionArabic: string;
}

export interface MaqamDefinition {
  id: string;
  name: string;
  arabicName: string;
  transliteration: string;
  family: string;
  rootNote: string;
  rootFreq: number;
  mood: string;
  moodArabic: string;
  description: string;
  descriptionArabic: string;
  scaleDegrees: {
    note: string;
    arabicName: string;
    octave: number;
    centsFromRoot: number;
    isQuarterTone: boolean;
    frequency: number;
    symbol?: string;
  }[];
  tonicJins: string;
  tonicJinsId: string;
  secondaryJins: string;
  secondaryJinsId: string;
  commonModulations: ModulationRule[];
  famousSongs: {
    title: string;
    artist: string;
    description: string;
  }[];
  practiceExercise: {
    title: string;
    titleArabic: string;
    description: string;
    notes: {
      note: string;
      arabicName: string;
      duration: number;
      frequency: number;
      lyric: string;
      ornament?: 'tarjif' | 'tazleeq' | 'mordent' | 'sustained';
      jins?: string;
    }[];
  };
  vocalSampleUrl?: string;
  vocalSampleDescription?: string;
  vocalSampleDescriptionArabic?: string;
}

// 10 Major Classical Arabic Ajnas (أجناس المقامات)
export const AJNAS_DATABASE: JinsDefinition[] = [
  {
    id: 'jins_bayati',
    name: 'Jins Bayati (جنس بياتي)',
    arabicName: 'جنس بياتي',
    tonicNote: 'D4',
    ghammazNote: 'G4',
    intervalCents: [0, 150, 300, 500],
    degrees: ['D4', 'E½b4', 'F4', 'G4'],
    character: 'Soulful, nostalgic, defined by the 150-cent neutral second (Sikah)',
    characterArabic: 'شجن وحنين عميق يتميز بدرجة السيكاه 150 سنت',
  },
  {
    id: 'jins_rast',
    name: 'Jins Rast (جنس راست)',
    arabicName: 'جنس راست',
    tonicNote: 'C4',
    ghammazNote: 'G4',
    intervalCents: [0, 200, 350, 500],
    degrees: ['C4', 'D4', 'E½b4', 'F4'],
    character: 'Noble, grounded, majestic with neutral third (350 cents)',
    characterArabic: 'وقور وفخم مع ثالثة محايدة 350 سنت',
  },
  {
    id: 'jins_hijaz',
    name: 'Jins Hijaz (جنس حجاز)',
    arabicName: 'جنس حجاز',
    tonicNote: 'D4',
    ghammazNote: 'G4',
    intervalCents: [0, 100, 400, 500],
    degrees: ['D4', 'Eb4', 'F#4', 'G4'],
    character: 'Mystical, profound, with characteristic augmented second (300 cents)',
    characterArabic: 'روحاني وعميق ببعد زائد 300 سنت بين الدرجتين 2 و 3',
  },
  {
    id: 'jins_nahawand',
    name: 'Jins Nahawand (جنس نهاوند)',
    arabicName: 'جنس نهاوند',
    tonicNote: 'C4',
    ghammazNote: 'G4',
    intervalCents: [0, 200, 300, 500],
    degrees: ['C4', 'D4', 'Eb4', 'F4'],
    character: 'Gentle, romantic, contemplative Western minor equivalent',
    characterArabic: 'رومانسي عذب وتأملي شبيه بالسلم الصغير',
  },
  {
    id: 'jins_saba',
    name: 'Jins Saba (جنس صبا)',
    arabicName: 'جنس صبا',
    tonicNote: 'D4',
    ghammazNote: 'F4',
    intervalCents: [0, 150, 300, 400],
    degrees: ['D4', 'E½b4', 'F4', 'Gb4'],
    character: 'Heartbreaking, deeply sorrowful with diminished 4th (400 cents)',
    characterArabic: 'باكي وحزين للغاية ببعد رابع منقبض (400 سنت)',
  },
  {
    id: 'jins_sikah',
    name: 'Jins Sikah (جنس سيكاه)',
    arabicName: 'جنس سيكاه',
    tonicNote: 'E½b4',
    ghammazNote: 'G4',
    intervalCents: [0, 150, 350],
    degrees: ['E½b4', 'F4', 'G4'],
    character: 'Rooted on a quarter-tone, mystical and ancient Tarab essence',
    characterArabic: 'يرتكز على ربع تون، صوفي وطربي غارق في الأصالة',
  },
  {
    id: 'jins_kurd',
    name: 'Jins Kurd (جنس كرد)',
    arabicName: 'جنس كرد',
    tonicNote: 'D4',
    ghammazNote: 'G4',
    intervalCents: [0, 100, 300, 500],
    degrees: ['D4', 'Eb4', 'F4', 'G4'],
    character: 'Tender, intimate, modern ballad feel (Phrygian tetrachord)',
    characterArabic: 'رقيق وقريب من القلب شائع في الأغاني الحديثة',
  },
  {
    id: 'jins_ajam',
    name: 'Jins Ajam (جنس عجم)',
    arabicName: 'جنس عجم',
    tonicNote: 'C4',
    ghammazNote: 'G4',
    intervalCents: [0, 200, 400, 500],
    degrees: ['C4', 'D4', 'E4', 'F4'],
    character: 'Bright, joyous, celebratory Western major tetrachord',
    characterArabic: 'مشرق وفرح واحتفالي يشبه السلم الكبير',
  },
];

export const MAQAMAT_DATABASE: MaqamDefinition[] = [
  {
    id: 'bayati',
    name: 'Maqam Bayati',
    arabicName: 'مقام بياتي',
    transliteration: 'Bayātī',
    family: 'Bayati',
    rootNote: 'D4',
    rootFreq: 293.66,
    mood: 'Melancholic, deeply nostalgic, spiritual longing, and heartfelt soulfulness',
    moodArabic: 'شجن، وحنين عميق، وروحانية تأسر القلب وعاطفة حزينة دافئة',
    description: 'The foundation of vocal improvisation (Mawwal). Defined by the neutral second degree (E½♭ Sikah) resting at ~150 cents.',
    descriptionArabic: 'أكثر المقامات شعبية وركيزة الغناء العربي والمواويل. يتميز بدرجة السيكاه (مي نصف بيمول) التي تجمع بين الرقة والشجن.',
    vocalSampleUrl: '/audio/ah-haat/bayati_human_voice.mp3',
    vocalSampleDescription: 'Authentic live human vocal Ah-haat featuring the gentle quarter-tone Sikah glide into Bayati root',
    vocalSampleDescriptionArabic: 'آهات بياتي حية بصوت بشري حقيقي تُبرز سحر ربع التون والشجن الأصيل (كما في التسجيل الصوتي المرفق)',
    tonicJins: 'Jins Bayati on Dukah (D)',
    tonicJinsId: 'jins_bayati',
    secondaryJins: 'Jins Nahawand on Nawa (G)',
    secondaryJinsId: 'jins_nahawand',
    commonModulations: [
      {
        targetJinsId: 'jins_nahawand',
        targetJinsName: 'Jins Nahawand on G',
        targetJinsArabic: 'جنس نهاوند على النوى (صول)',
        pivotNote: 'G4',
        smoothnessScore: 95,
        description: 'The most classical Bayati ascent: moving into poetic romantic minor on degree 4.',
        descriptionArabic: 'الانتقال الأشهر في البياتي: الصعود إلى جنس نهاوند على درجة النوى لإضفاء عذوبة رومانسية.',
      },
      {
        targetJinsId: 'jins_rast',
        targetJinsName: 'Jins Rast on G',
        targetJinsArabic: 'جنس راست على النوى (صول)',
        pivotNote: 'G4',
        smoothnessScore: 92,
        description: 'Creates Maqam Bayati Shuri (Karjighar), introducing high majesty with neutral 7th (B½♭).',
        descriptionArabic: 'يعطي بياتي شوري (كارجغار)، وفيه تنوع طربي فخم باستخدام الأوج.',
      },
      {
        targetJinsId: 'jins_hijaz',
        targetJinsName: 'Jins Hijaz on G',
        targetJinsArabic: 'جنس حجاز على النوى (صول)',
        pivotNote: 'G4',
        smoothnessScore: 89,
        description: 'Introduces dramatic mystical tension (Bayati Shuri variant with Ab and B natural).',
        descriptionArabic: 'يُدخل لمسة وجدانية درامية صوفية آسرة فوق الركوز الأصلي.',
      },
    ],
    famousSongs: [
      { title: 'Nassam Alayna El-Hawa', artist: 'Fairouz (فيروز)', description: 'Classic autumnal longing song in pure Bayati' },
      { title: 'Ala Dal’ona', artist: 'Levantine Folk Heritage (تراث)', description: 'Traditional Levantine festive celebration' },
      { title: 'El Atlal (Introduction)', artist: 'Umm Kulthum (أم كلثوم)', description: 'Monumental Egyptian Tarab masterpiece' },
    ],
    scaleDegrees: [
      { note: 'D4', arabicName: 'دوكاه', octave: 4, centsFromRoot: 0, isQuarterTone: false, frequency: 293.66 },
      { note: 'E½b4', arabicName: 'سيكاه', octave: 4, centsFromRoot: 150, isQuarterTone: true, frequency: 320.24, symbol: '½♭' },
      { note: 'F4', arabicName: 'جهاركاه', octave: 4, centsFromRoot: 300, isQuarterTone: false, frequency: 349.23 },
      { note: 'G4', arabicName: 'نوى', octave: 4, centsFromRoot: 500, isQuarterTone: false, frequency: 392.00 },
      { note: 'A4', arabicName: 'حسيني', octave: 4, centsFromRoot: 700, isQuarterTone: false, frequency: 440.00 },
      { note: 'Bb4', arabicName: 'عجم عشيران', octave: 4, centsFromRoot: 800, isQuarterTone: false, frequency: 466.16 },
      { note: 'C5', arabicName: 'كردان', octave: 5, centsFromRoot: 1000, isQuarterTone: false, frequency: 523.25 },
      { note: 'D5', arabicName: 'جواب دوكاه', octave: 5, centsFromRoot: 1200, isQuarterTone: false, frequency: 587.33 },
    ],
    practiceExercise: {
      title: 'Bayati Sayr & Sikah Intonation with Orab Trills',
      titleArabic: 'سير البياتي وضبط نغمة السيكاه مع العُرَب الصوتية',
      description: 'Master the characteristic descent from G to D, emphasizing the authentic 150-cent neutral second and delicate vocal trills (Orab).',
      notes: [
        { note: 'D4', arabicName: 'دوكاه', duration: 1.2, frequency: 293.66, lyric: 'يَا', jins: 'jins_bayati' },
        { note: 'E½b4', arabicName: 'سيكاه', duration: 1.0, frequency: 320.24, lyric: 'لَيْل', ornament: 'tarjif', jins: 'jins_bayati' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 1.0, frequency: 349.23, lyric: 'يَا', jins: 'jins_bayati' },
        { note: 'G4', arabicName: 'نوى', duration: 1.4, frequency: 392.00, lyric: 'عَيْن', ornament: 'sustained', jins: 'jins_nahawand' },
        { note: 'A4', arabicName: 'حسيني', duration: 1.2, frequency: 440.00, lyric: 'آه', ornament: 'tazleeq', jins: 'jins_nahawand' },
        { note: 'G4', arabicName: 'نوى', duration: 0.8, frequency: 392.00, lyric: 'يَا', jins: 'jins_nahawand' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'حَبِيبِي', jins: 'jins_bayati' },
        { note: 'E½b4', arabicName: 'سيكاه', duration: 1.2, frequency: 320.24, lyric: 'رُوحي', ornament: 'tarjif', jins: 'jins_bayati' },
        { note: 'D4', arabicName: 'دوكاه', duration: 2.0, frequency: 293.66, lyric: 'دَامْ', ornament: 'sustained', jins: 'jins_bayati' },
      ],
    },
  },
  {
    id: 'rast',
    name: 'Maqam Rast',
    arabicName: 'مقام راست',
    transliteration: 'Rāst',
    family: 'Rast',
    rootNote: 'C4',
    rootFreq: 261.63,
    mood: 'Majestic, authoritative, dignified, warm, balanced and joyous',
    moodArabic: 'وقار، وفخامة، واستقرار، وبهجة راقية متزنة، وهو أصل المقامات',
    description: 'The king and father of all Maqamat ("Rast" means straight/true in Persian). Features two neutral quarter tones on degrees 3 (E½♭) and 7 (B½♭).',
    descriptionArabic: 'أبو المقامات وسيدها. يبدأ من درجة الراست (دو) ويتميز بدرجتي السيكاه (مي نصف بيمول) والأوج (سي نصف بيمول).',
    vocalSampleUrl: '/audio/ah-haat/rast_human_voice.mp3',
    vocalSampleDescription: 'Resonant human vocal Ah-haat displaying majestic Rast stability and authentic E½♭ neutral third intonation',
    vocalSampleDescriptionArabic: 'آهات راست بشرية مهيبة تُجسد فخامة الركوز على الدو ورنين السيكاه الأصيل',
    tonicJins: 'Jins Rast on Rast (C)',
    tonicJinsId: 'jins_rast',
    secondaryJins: 'Jins Rast on Nawa (G)',
    secondaryJinsId: 'jins_rast',
    commonModulations: [
      {
        targetJinsId: 'jins_rast',
        targetJinsName: 'Upper Jins Rast on G',
        targetJinsArabic: 'جنس راست على النوى (صول)',
        pivotNote: 'G4',
        smoothnessScore: 98,
        description: 'Complete symmetry: Rast on C ascending directly into Rast on G.',
        descriptionArabic: 'تناغم تام حيث يرتقي الراست الأساسي إلى راست فرعي على النوى.',
      },
      {
        targetJinsId: 'jins_nahawand',
        targetJinsName: 'Jins Nahawand on G',
        targetJinsArabic: 'جنس نهاوند على النوى',
        pivotNote: 'G4',
        smoothnessScore: 91,
        description: 'Produces Maqam Suznak, blending regal authority with deep tenderness.',
        descriptionArabic: 'ينتج مقام سوزناك الفاتن الذي يجمع بين هيبة الراست وشجن النهاوند.',
      },
      {
        targetJinsId: 'jins_hijaz',
        targetJinsName: 'Jins Hijaz on G',
        targetJinsArabic: 'جنس حجاز على النوى',
        pivotNote: 'G4',
        smoothnessScore: 90,
        description: 'Produces Maqam Suzdil / Rast Hijaz, an unforgettable Tarab climax.',
        descriptionArabic: 'ينتج مقام سوزدل الطربي بذروته الروحانية الخالدة.',
      },
    ],
    famousSongs: [
      { title: 'Habibi Yis’ed Awqato', artist: 'Umm Kulthum (أم كلثوم)', description: 'Grand Tarab composed by Zakariya Ahmad' },
      { title: 'Arouj Ila Al Quds', artist: 'Fairouz (فيروز)', description: 'Soulful majestic anthem' },
      { title: 'Ya Shadi El-Alhan', artist: 'Sayed Darwish (سيد درويش)', description: 'Masterclass in Andalusian Muwashshah' },
    ],
    scaleDegrees: [
      { note: 'C4', arabicName: 'راست', octave: 4, centsFromRoot: 0, isQuarterTone: false, frequency: 261.63 },
      { note: 'D4', arabicName: 'دوكاه', octave: 4, centsFromRoot: 200, isQuarterTone: false, frequency: 293.66 },
      { note: 'E½b4', arabicName: 'سيكاه', octave: 4, centsFromRoot: 350, isQuarterTone: true, frequency: 320.24, symbol: '½♭' },
      { note: 'F4', arabicName: 'جهاركاه', octave: 4, centsFromRoot: 500, isQuarterTone: false, frequency: 349.23 },
      { note: 'G4', arabicName: 'نوى', octave: 4, centsFromRoot: 700, isQuarterTone: false, frequency: 392.00 },
      { note: 'A4', arabicName: 'حسيني', octave: 4, centsFromRoot: 900, isQuarterTone: false, frequency: 440.00 },
      { note: 'B½b4', arabicName: 'أوج', octave: 4, centsFromRoot: 1050, isQuarterTone: true, frequency: 479.82, symbol: '½♭' },
      { note: 'C5', arabicName: 'كردان', octave: 5, centsFromRoot: 1200, isQuarterTone: false, frequency: 523.25 },
    ],
    practiceExercise: {
      title: 'Rast Ascending Majesty & Suznak Transition',
      titleArabic: 'صعود الراست الوقور والتحول إلى السوزناك',
      description: 'Practice the neutral third (E½♭ at 350 cents) and neutral seventh (B½♭) in harmony with root C.',
      notes: [
        { note: 'C4', arabicName: 'راست', duration: 1.0, frequency: 261.63, lyric: 'يَا', jins: 'jins_rast' },
        { note: 'D4', arabicName: 'دوكاه', duration: 0.8, frequency: 293.66, lyric: 'شَادِي', jins: 'jins_rast' },
        { note: 'E½b4', arabicName: 'سيكاه', duration: 1.2, frequency: 320.24, lyric: 'الْأَلْـ', ornament: 'tarjif', jins: 'jins_rast' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'ـحَانْ', jins: 'jins_rast' },
        { note: 'G4', arabicName: 'نوى', duration: 1.5, frequency: 392.00, lyric: 'آهْ', ornament: 'sustained', jins: 'jins_rast' },
        { note: 'A4', arabicName: 'حسيني', duration: 1.0, frequency: 440.00, lyric: 'أَسْمِعْـ', jins: 'jins_rast' },
        { note: 'B½b4', arabicName: 'أوج', duration: 1.2, frequency: 479.82, lyric: 'ـنَا', ornament: 'tarjif', jins: 'jins_rast' },
        { note: 'C5', arabicName: 'كردان', duration: 2.0, frequency: 523.25, lyric: 'نَغَمْ', ornament: 'sustained', jins: 'jins_rast' },
      ],
    },
  },
  {
    id: 'hijaz',
    name: 'Maqam Hijaz',
    arabicName: 'مقام حجاز',
    transliteration: 'Ḥijāz',
    family: 'Hijaz',
    rootNote: 'D4',
    rootFreq: 293.66,
    mood: 'Dramatic, mystical, profoundly moving, desert passion, awe and spiritual yearning',
    moodArabic: 'خشوع، وسحر شرقي آخاذ، ورهبة وجدانية، ولوعة الحنين الصحراوي',
    description: 'Instantly recognizable by the augmented second interval (300 cents) between degrees 2 (E♭) and 3 (F♯). Widely used in sacred Adhan and passionate Arabic ballads.',
    descriptionArabic: 'يتميز بالبعد الزائد الساحر بين مي بيمول وفا دييز، مما يمنحه طابعاً روحانياً عميقاً ونفحة صوفية خالدة.',
    vocalSampleUrl: '/audio/ah-haat/hijaz_human_voice.mp3',
    vocalSampleDescription: 'Mystic desert vocal Ah-haat featuring the augmented second interval (Eb to F#) and spiritual passion',
    vocalSampleDescriptionArabic: 'آهات حجاز روحانية آسرة تُبرز البعد الزائد الساحر وتجليات الوجد الصوفي',
    tonicJins: 'Jins Hijaz on Dukah (D)',
    tonicJinsId: 'jins_hijaz',
    secondaryJins: 'Jins Nahawand on Nawa (G)',
    secondaryJinsId: 'jins_nahawand',
    commonModulations: [
      {
        targetJinsId: 'jins_nahawand',
        targetJinsName: 'Jins Nahawand on G',
        targetJinsArabic: 'جنس نهاوند على النوى',
        pivotNote: 'G4',
        smoothnessScore: 94,
        description: 'Standard resolving transition that softens the intensity into melodic reflection.',
        descriptionArabic: 'الانتقال الطبيعي لتهدئة حدة الحجاز والعودة إلى الشجن الرقيق.',
      },
      {
        targetJinsId: 'jins_rast',
        targetJinsName: 'Jins Rast on G',
        targetJinsArabic: 'جنس راست على النوى',
        pivotNote: 'G4',
        smoothnessScore: 88,
        description: 'Forms Maqam Hijazkar Kurd / Zanjaran.',
        descriptionArabic: 'يعطي تدرج زنجران المحبب لدى قراء ومطربي حلب ومصر.',
      },
    ],
    famousSongs: [
      { title: 'Layali El Ouns fi Vienna', artist: 'Asmahan (أسمهان)', description: 'Operatic and Tarab masterpiece by Farid Al-Atrash' },
      { title: 'Zorouni Koulli Sana Marra', artist: 'Sayed Darwish / Fairouz', description: 'Timeless folk melody' },
      { title: 'Fog El Nakhal', artist: 'Nazem Al-Ghazali (ناظم الغزالي)', description: 'Iraqi Maqam icon' },
    ],
    scaleDegrees: [
      { note: 'D4', arabicName: 'دوكاه', octave: 4, centsFromRoot: 0, isQuarterTone: false, frequency: 293.66 },
      { note: 'Eb4', arabicName: 'كردي', octave: 4, centsFromRoot: 100, isQuarterTone: false, frequency: 311.13 },
      { note: 'F#4', arabicName: 'حجاز', octave: 4, centsFromRoot: 400, isQuarterTone: false, frequency: 369.99 },
      { note: 'G4', arabicName: 'نوى', octave: 4, centsFromRoot: 500, isQuarterTone: false, frequency: 392.00 },
      { note: 'A4', arabicName: 'حسيني', octave: 4, centsFromRoot: 700, isQuarterTone: false, frequency: 440.00 },
      { note: 'Bb4', arabicName: 'عجم عشيران', octave: 4, centsFromRoot: 800, isQuarterTone: false, frequency: 466.16 },
      { note: 'C5', arabicName: 'كردان', octave: 5, centsFromRoot: 1000, isQuarterTone: false, frequency: 523.25 },
      { note: 'D5', arabicName: 'جواب دوكاه', octave: 5, centsFromRoot: 1200, isQuarterTone: false, frequency: 587.33 },
    ],
    practiceExercise: {
      title: 'Hijaz Augmented Leap & Melismatic Glissando',
      titleArabic: 'قفزة الحجاز الوجدانية والتزليق الصوتي',
      description: 'Focus on clean intonation between E♭ (lowered minor second) and F♯ (major third).',
      notes: [
        { note: 'D4', arabicName: 'دوكاه', duration: 1.0, frequency: 293.66, lyric: 'زُو', jins: 'jins_hijaz' },
        { note: 'Eb4', arabicName: 'كردي', duration: 0.8, frequency: 311.13, lyric: 'رُو', jins: 'jins_hijaz' },
        { note: 'F#4', arabicName: 'حجاز', duration: 1.4, frequency: 369.99, lyric: 'نِي', ornament: 'tazleeq', jins: 'jins_hijaz' },
        { note: 'G4', arabicName: 'نوى', duration: 1.5, frequency: 392.00, lyric: 'كُلْ', ornament: 'sustained', jins: 'jins_nahawand' },
        { note: 'F#4', arabicName: 'حجاز', duration: 0.8, frequency: 369.99, lyric: 'سَنَة', jins: 'jins_hijaz' },
        { note: 'Eb4', arabicName: 'كردي', duration: 0.8, frequency: 311.13, lyric: 'مَرَّ', jins: 'jins_hijaz' },
        { note: 'D4', arabicName: 'دوكاه', duration: 2.0, frequency: 293.66, lyric: 'ـة', ornament: 'sustained', jins: 'jins_hijaz' },
      ],
    },
  },
  {
    id: 'saba',
    name: 'Maqam Saba',
    arabicName: 'مقام صبا',
    transliteration: 'Ṣabā',
    family: 'Saba',
    rootNote: 'D4',
    rootFreq: 293.66,
    mood: 'Deep sorrow, poignant tearful emotion, solemn grief, sublime longing',
    moodArabic: 'شجن باكي، حزن نبيل، لوعة الفراق والأسى العميق الشفاف',
    description: 'Unique among world scales: does not repeat at octave. Features degree 3 (F4) and a diminished 4th (G♭4), creating an unforgettable aching tension.',
    descriptionArabic: 'مقام فريد لا يتكرر في الأوكتاف بنفس الدرجات، يتميز ببعده الصوتي المنقبض على الدرجة الرابعة (صول بيمول) ليجسد أرق وأصدق مشاعر الحزن.',
    vocalSampleUrl: '/audio/ah-haat/saba_human_voice.mp3',
    vocalSampleDescription: 'Heartbreaking tearful vocal Ah-haat featuring the weeping diminished fourth (Gb) and gentle vocal sigh',
    vocalSampleDescriptionArabic: 'آهات صبا باكية ومؤثرة تُبرز انقباض الدرجة الرابعة ونبرة التنهد واللوعة النبيلة',
    tonicJins: 'Jins Saba on Dukah (D)',
    tonicJinsId: 'jins_saba',
    secondaryJins: 'Jins Hijaz on Jiharkah (F)',
    secondaryJinsId: 'jins_hijaz',
    commonModulations: [
      {
        targetJinsId: 'jins_hijaz',
        targetJinsName: 'Jins Hijaz on F',
        targetJinsArabic: 'جنس حجاز على الجهاركاه (فا)',
        pivotNote: 'F4',
        smoothnessScore: 96,
        description: 'The defining movement of Saba: launching into Hijaz from the 3rd degree (F).',
        descriptionArabic: 'جوهر الصبا حيث يتفرع جنس الحجاز على درجة الفا ليولد صرخة الحزن النبيل.',
      },
      {
        targetJinsId: 'jins_bayati',
        targetJinsName: 'Jins Bayati on D',
        targetJinsArabic: 'جنس بياتي على الدوكاه',
        pivotNote: 'D4',
        smoothnessScore: 90,
        description: 'Resolving from the weeping Saba mood back to the grounded warmth of Bayati.',
        descriptionArabic: 'القفلة الهادئة والعودة من البكاء إلى سكينة البياتي الدافئة.',
      },
    ],
    famousSongs: [
      { title: 'Houwa Sahih El Hawa Ghallab', artist: 'Umm Kulthum (أم كلثوم)', description: 'Heart-wrenching classic composed by Zakariya Ahmad' },
      { title: 'Dah Habibi', artist: 'Abdel Halim Hafez (عبد الحليم)', description: 'Emotionally charged Egyptian Tarab' },
      { title: 'Ya Teir Ya Tayer', artist: 'Folk Traditional', description: 'Levantine longing for the homeland' },
    ],
    scaleDegrees: [
      { note: 'D4', arabicName: 'دوكاه', octave: 4, centsFromRoot: 0, isQuarterTone: false, frequency: 293.66 },
      { note: 'E½b4', arabicName: 'سيكاه', octave: 4, centsFromRoot: 150, isQuarterTone: true, frequency: 320.24, symbol: '½♭' },
      { note: 'F4', arabicName: 'جهاركاه', octave: 4, centsFromRoot: 300, isQuarterTone: false, frequency: 349.23 },
      { note: 'Gb4', arabicName: 'صبا (حجاز)', octave: 4, centsFromRoot: 400, isQuarterTone: false, frequency: 369.99 },
      { note: 'A4', arabicName: 'حسيني', octave: 4, centsFromRoot: 700, isQuarterTone: false, frequency: 440.00 },
      { note: 'Bb4', arabicName: 'عجم عشيران', octave: 4, centsFromRoot: 800, isQuarterTone: false, frequency: 466.16 },
      { note: 'C5', arabicName: 'كردان', octave: 5, centsFromRoot: 1000, isQuarterTone: false, frequency: 523.25 },
      { note: 'Db5', arabicName: 'شahnaz', octave: 5, centsFromRoot: 1100, isQuarterTone: false, frequency: 554.37 },
    ],
    practiceExercise: {
      title: 'Saba Deep Yearning Vocal Path & Diminished 4th',
      titleArabic: 'مسار الحزن النبيل في مقام الصبا والبعد المنقبض',
      description: 'Carefully hit the Sikah neutral 2nd then glide to the diminished 4th (G♭).',
      notes: [
        { note: 'D4', arabicName: 'دوكاه', duration: 1.0, frequency: 293.66, lyric: 'هُوَ', jins: 'jins_saba' },
        { note: 'E½b4', arabicName: 'سيكاه', duration: 1.0, frequency: 320.24, lyric: 'صَحِيحْ', ornament: 'tarjif', jins: 'jins_saba' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'الْـ', jins: 'jins_hijaz' },
        { note: 'Gb4', arabicName: 'صبا', duration: 1.5, frequency: 369.99, lyric: 'ـهَوَى', ornament: 'tazleeq', jins: 'jins_hijaz' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'غَلَّابْ', jins: 'jins_saba' },
        { note: 'E½b4', arabicName: 'سيكاه', duration: 1.2, frequency: 320.24, lyric: 'آهْ', ornament: 'tarjif', jins: 'jins_saba' },
        { note: 'D4', arabicName: 'دوكاه', duration: 2.0, frequency: 293.66, lyric: 'دَامْ', ornament: 'sustained', jins: 'jins_saba' },
      ],
    },
  },
  {
    id: 'nahawand',
    name: 'Maqam Nahawand',
    arabicName: 'مقام نهاوند',
    transliteration: 'Nahāwand',
    family: 'Nahawand',
    rootNote: 'C4',
    rootFreq: 261.63,
    mood: 'Romantic, passionate, cinematic, contemplative, elegant and universal',
    moodArabic: 'رومانسية عذبة، هدوء حالم، جاذبية سينمائية راقية تجمع بين الشرق والغرب',
    description: 'Equivalent to Western harmonic/melodic minor scale, yet sung with Arabic micro-ornaments, vocal sighs, and traditional modulation to Hijaz.',
    descriptionArabic: 'يشبه السلم الصغير الغربي ولكنه يحمل خصوصية التلوين والتطريب الشرقي والتحويلات البديعة إلى جنس الحجاز.',
    vocalSampleUrl: '/audio/ah-haat/nahawand_human_voice.mp3',
    vocalSampleDescription: 'Velvety romantic vocal Ah-haat blending smooth minor third intimacy with Eastern modal lyricism',
    vocalSampleDescriptionArabic: 'آهات نهاوند مخملية حالمة تجمع بين الرقة الرومانسية والشجن الشرقي الساحر',
    tonicJins: 'Jins Nahawand on Rast (C)',
    tonicJinsId: 'jins_nahawand',
    secondaryJins: 'Jins Hijaz on Nawa (G)',
    secondaryJinsId: 'jins_hijaz',
    commonModulations: [
      {
        targetJinsId: 'jins_hijaz',
        targetJinsName: 'Jins Hijaz on G',
        targetJinsArabic: 'جنس حجاز على النوى',
        pivotNote: 'G4',
        smoothnessScore: 97,
        description: 'Creates Maqam Nahawand Murassah, producing an intense dramatic romantic apex.',
        descriptionArabic: 'ينتج نهاوند مرصع وهو قمة التألق العاطفي والدرامي في الموسيقى العربية.',
      },
      {
        targetJinsId: 'jins_kurd',
        targetJinsName: 'Jins Kurd on D',
        targetJinsArabic: 'جنس كرد على الدوكاه',
        pivotNote: 'D4',
        smoothnessScore: 92,
        description: 'Gentle modulation to Kurd for subtle storytelling and intimate warmth.',
        descriptionArabic: 'انتقال رقيق إلى الكرد للمناجاة الهادئة.',
      },
    ],
    famousSongs: [
      { title: 'Lamma Bada Yatathanna', artist: 'Traditional Andalusian Muwashshah', description: 'The most revered Arabic melody in history' },
      { title: 'Gana El Hawa', artist: 'Abdel Halim Hafez (عبد الحليم)', description: 'Upbeat romantic Egyptian classic' },
      { title: 'Alf Leila Wa Leila', artist: 'Umm Kulthum (أم كلثوم)', description: 'Baligh Hamdi’s romantic masterstroke' },
    ],
    scaleDegrees: [
      { note: 'C4', arabicName: 'راست', octave: 4, centsFromRoot: 0, isQuarterTone: false, frequency: 261.63 },
      { note: 'D4', arabicName: 'دوكاه', octave: 4, centsFromRoot: 200, isQuarterTone: false, frequency: 293.66 },
      { note: 'Eb4', arabicName: 'بوسليك', octave: 4, centsFromRoot: 300, isQuarterTone: false, frequency: 311.13 },
      { note: 'F4', arabicName: 'جهاركاه', octave: 4, centsFromRoot: 500, isQuarterTone: false, frequency: 349.23 },
      { note: 'G4', arabicName: 'نوى', octave: 4, centsFromRoot: 700, isQuarterTone: false, frequency: 392.00 },
      { note: 'Ab4', arabicName: 'حصار', octave: 4, centsFromRoot: 800, isQuarterTone: false, frequency: 415.30 },
      { note: 'B4', arabicName: 'ماهور', octave: 4, centsFromRoot: 1100, isQuarterTone: false, frequency: 493.88 },
      { note: 'C5', arabicName: 'كردان', octave: 5, centsFromRoot: 1200, isQuarterTone: false, frequency: 523.25 },
    ],
    practiceExercise: {
      title: 'Lamma Bada Andalusian Lyricism & Melisma',
      titleArabic: 'سحر موشح لما بدا يتثنى والميليسما الأندلسية',
      description: 'Sing with round vibrato and seamless legato from tonic C through minor third to high tonic.',
      notes: [
        { note: 'C4', arabicName: 'راست', duration: 1.0, frequency: 261.63, lyric: 'لَمَّا', jins: 'jins_nahawand' },
        { note: 'D4', arabicName: 'دوكاه', duration: 0.8, frequency: 293.66, lyric: 'بَدَا', jins: 'jins_nahawand' },
        { note: 'Eb4', arabicName: 'بوسليك', duration: 1.2, frequency: 311.13, lyric: 'يَتَـ', ornament: 'tarjif', jins: 'jins_nahawand' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'ـثَنَّى', jins: 'jins_nahawand' },
        { note: 'G4', arabicName: 'نوى', duration: 1.5, frequency: 392.00, lyric: 'حِبِّي', ornament: 'sustained', jins: 'jins_hijaz' },
        { note: 'Ab4', arabicName: 'حصار', duration: 0.8, frequency: 415.30, lyric: 'جَمَا', jins: 'jins_hijaz' },
        { note: 'G4', arabicName: 'نوى', duration: 0.8, frequency: 392.00, lyric: 'لُو', jins: 'jins_hijaz' },
        { note: 'Eb4', arabicName: 'بوسليك', duration: 1.0, frequency: 311.13, lyric: 'فَتَنْ', jins: 'jins_nahawand' },
        { note: 'C4', arabicName: 'راست', duration: 2.0, frequency: 261.63, lyric: 'نِي', ornament: 'sustained', jins: 'jins_nahawand' },
      ],
    },
  },
  {
    id: 'kurd',
    name: 'Maqam Kurd',
    arabicName: 'مقام كرد',
    transliteration: 'Kurd',
    family: 'Kurd',
    rootNote: 'D4',
    rootFreq: 293.66,
    mood: 'Contemporary, tender, melancholic warmth, modern poetic romance',
    moodArabic: 'رقة، وعذوبة عصرية، وشجن هادئ قريب من الوجدان الحديث',
    description: 'Similar to the Phrygian mode with a minor second (E♭) and minor third (F). Highly popular in 20th and 21st-century modern Arabic pop and ballads.',
    descriptionArabic: 'يشبه المقام الفريجي الغربي بوجود نصف بعد في البداية (مي بيمول)، وهو أكثر المقامات انتشاراً في الأغنية العربية المعاصرة.',
    vocalSampleUrl: '/audio/ah-haat/kurd_human_voice.mp3',
    vocalSampleDescription: 'Tender modern vocal Ah-haat featuring the gentle semitone (D to Eb) and warm poetic melancholy',
    vocalSampleDescriptionArabic: 'آهات كرد عصرية دافئة تُبرز رقة الانتقال بنصف التون (ري إلى مي بيمول) والشجن الرومانسي الهادئ',
    tonicJins: 'Jins Kurd on Dukah (D)',
    tonicJinsId: 'jins_kurd',
    secondaryJins: 'Jins Nahawand on Nawa (G)',
    secondaryJinsId: 'jins_nahawand',
    commonModulations: [
      {
        targetJinsId: 'jins_nahawand',
        targetJinsName: 'Jins Nahawand on G',
        targetJinsArabic: 'جنس نهاوند على النوى',
        pivotNote: 'G4',
        smoothnessScore: 95,
        description: 'Standard modern ballad progression.',
        descriptionArabic: 'التدرج العصري الأكثر انسيابية في الأغنية الطربية الحديثة.',
      },
    ],
    famousSongs: [
      { title: 'Enta Omri', artist: 'Umm Kulthum (أم كلثوم)', description: 'Mohamed Abdel Wahab’s legendary composition' },
      { title: 'Bektob Ismak Ya Habibi', artist: 'Fairouz (فيروز)', description: 'Beloved Rahbani classic' },
      { title: 'Batwanes Beek', artist: 'Warda (وردة)', description: 'Sensual Arabic evergreen' },
    ],
    scaleDegrees: [
      { note: 'D4', arabicName: 'دوكاه', octave: 4, centsFromRoot: 0, isQuarterTone: false, frequency: 293.66 },
      { note: 'Eb4', arabicName: 'كردي', octave: 4, centsFromRoot: 100, isQuarterTone: false, frequency: 311.13 },
      { note: 'F4', arabicName: 'جهاركاه', octave: 4, centsFromRoot: 300, isQuarterTone: false, frequency: 349.23 },
      { note: 'G4', arabicName: 'نوى', octave: 4, centsFromRoot: 500, isQuarterTone: false, frequency: 392.00 },
      { note: 'A4', arabicName: 'حسيني', octave: 4, centsFromRoot: 700, isQuarterTone: false, frequency: 440.00 },
      { note: 'Bb4', arabicName: 'عجم عشيران', octave: 4, centsFromRoot: 800, isQuarterTone: false, frequency: 466.16 },
      { note: 'C5', arabicName: 'كردان', octave: 5, centsFromRoot: 1000, isQuarterTone: false, frequency: 523.25 },
      { note: 'D5', arabicName: 'جواب دوكاه', octave: 5, centsFromRoot: 1200, isQuarterTone: false, frequency: 587.33 },
    ],
    practiceExercise: {
      title: 'Kurd Tender Romance & Chest-to-Passaggio Slide',
      titleArabic: 'رقة الكرد الرومانسية والانتقال بين المسارات الصوتية',
      description: 'Notice the immediate half-step from D to E♭, creating a gentle yet wistful emotion.',
      notes: [
        { note: 'D4', arabicName: 'دوكاه', duration: 1.0, frequency: 293.66, lyric: 'إِنْتَ', jins: 'jins_kurd' },
        { note: 'Eb4', arabicName: 'كردي', duration: 1.0, frequency: 311.13, lyric: 'عُمْـ', jins: 'jins_kurd' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 1.2, frequency: 349.23, lyric: 'ـرِي', ornament: 'tarjif', jins: 'jins_kurd' },
        { note: 'G4', arabicName: 'نوى', duration: 1.5, frequency: 392.00, lyric: 'اللِّي', ornament: 'sustained', jins: 'jins_nahawand' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'ابْتَدَى', jins: 'jins_kurd' },
        { note: 'Eb4', arabicName: 'كردي', duration: 0.8, frequency: 311.13, lyric: 'بِنُو', jins: 'jins_kurd' },
        { note: 'D4', arabicName: 'دوكاه', duration: 2.0, frequency: 293.66, lyric: 'رَكْ', ornament: 'sustained', jins: 'jins_kurd' },
      ],
    },
  },
  {
    id: 'sikah',
    name: 'Maqam Sikah',
    arabicName: 'مقام سيكاه',
    transliteration: 'Sīkāh',
    family: 'Sikah',
    rootNote: 'E½b4',
    rootFreq: 320.24,
    mood: 'Hypnotic, mystical, profoundly traditional, ancient Eastern transcendence',
    moodArabic: 'صوفي أصيل، سحر شرقي غارق في القدم، تأمل وتسامي روحي',
    description: 'Unique in world music: tonic root is itself a quarter-tone (E½♭)! The foundation of religious inshad, Azan, and ancient Tarab.',
    descriptionArabic: 'المقام الوحيد الذي يستقر على درجة نصف بيمول (سيكاه) كدرجة أساس، وهو جوهر الإنشاد والتلاوة والتراث الطربي العريق.',
    vocalSampleUrl: '/audio/ah-haat/sikah_human_voice.mp3',
    vocalSampleDescription: 'Mystical ancient Eastern vocal Ah-haat centering firmly on the microtonal E½♭ root with contemplative slides',
    vocalSampleDescriptionArabic: 'آهات سيكاه صوفية عريقة ترتكز على درجة ربع التون الأصيلة بتأمل وتسامٍ روحي فريد',
    tonicJins: 'Jins Sikah on Sikah (E½♭)',
    tonicJinsId: 'jins_sikah',
    secondaryJins: 'Jins Rast on Nawa (G)',
    secondaryJinsId: 'jins_rast',
    commonModulations: [
      {
        targetJinsId: 'jins_rast',
        targetJinsName: 'Jins Rast on G',
        targetJinsArabic: 'جنس راست على النوى',
        pivotNote: 'G4',
        smoothnessScore: 96,
        description: 'Classic ascension from Sikah to Rast.',
        descriptionArabic: 'الصعود الكلاسيكي من السيكاه إلى الراست الطربي.',
      },
    ],
    famousSongs: [
      { title: 'Siret El Hob (Mawwal)', artist: 'Umm Kulthum (أم كلثوم)', description: 'Soulful opening improvisation by Baligh Hamdi' },
      { title: 'Tala’a Al Badru Alayna', artist: 'Islamic Inshad Heritage', description: 'Ancient spiritual hymn' },
    ],
    scaleDegrees: [
      { note: 'E½b4', arabicName: 'سيكاه', octave: 4, centsFromRoot: 0, isQuarterTone: true, frequency: 320.24, symbol: '½♭' },
      { note: 'F4', arabicName: 'جهاركاه', octave: 4, centsFromRoot: 150, isQuarterTone: false, frequency: 349.23 },
      { note: 'G4', arabicName: 'نوى', octave: 4, centsFromRoot: 350, isQuarterTone: false, frequency: 392.00 },
      { note: 'A4', arabicName: 'حسيني', octave: 4, centsFromRoot: 550, isQuarterTone: false, frequency: 440.00 },
      { note: 'B½b4', arabicName: 'أوج', octave: 4, centsFromRoot: 700, isQuarterTone: true, frequency: 479.82, symbol: '½♭' },
      { note: 'C5', arabicName: 'كردان', octave: 5, centsFromRoot: 850, isQuarterTone: false, frequency: 523.25 },
      { note: 'D5', arabicName: 'جواب دوكاه', octave: 5, centsFromRoot: 1050, isQuarterTone: false, frequency: 587.33 },
      { note: 'E½b5', arabicName: 'جواب سيكاه', octave: 5, centsFromRoot: 1200, isQuarterTone: true, frequency: 640.48, symbol: '½♭' },
    ],
    practiceExercise: {
      title: 'Sikah Tonic Stability & Orab Embellishments',
      titleArabic: 'تثبيت ركوز السيكاه والعُرَب الشرقية',
      description: 'Lock your vocal cords onto the neutral third root without straying into Eb or E natural.',
      notes: [
        { note: 'E½b4', arabicName: 'سيكاه', duration: 1.5, frequency: 320.24, lyric: 'طَلَعَ', ornament: 'tarjif', jins: 'jins_sikah' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'الْـ', jins: 'jins_sikah' },
        { note: 'G4', arabicName: 'نوى', duration: 1.5, frequency: 392.00, lyric: 'ـبَدْرُ', ornament: 'sustained', jins: 'jins_rast' },
        { note: 'A4', arabicName: 'حسيني', duration: 1.0, frequency: 440.00, lyric: 'عَلَيْـ', jins: 'jins_rast' },
        { note: 'G4', arabicName: 'نوى', duration: 1.0, frequency: 392.00, lyric: 'ـنَا', jins: 'jins_rast' },
        { note: 'F4', arabicName: 'جهاركاه', duration: 0.8, frequency: 349.23, lyric: 'مِنْ', jins: 'jins_sikah' },
        { note: 'E½b4', arabicName: 'سيكاه', duration: 2.2, frequency: 320.24, lyric: 'ثَنِيَّاتْ', ornament: 'sustained', jins: 'jins_sikah' },
      ],
    },
  },
  {
    id: 'ajam',
    name: 'Maqam Ajam',
    arabicName: 'مقام عجم',
    transliteration: '‘Ajam',
    family: 'Ajam',
    rootNote: 'C4',
    rootFreq: 261.63,
    mood: 'Triumphant, bright, joyful, celebratory, proud and radiant',
    moodArabic: 'بهجة عارمة، فخر واعتزاز، انتصار، صفاء مشرق يفيض بالحياة',
    description: 'Equivalent to the Western Major scale. In Arabic performance, it carries distinctive rhythmic cadences, trills, and lively syncopations.',
    descriptionArabic: 'هو السلم الكبير الغربي، ولكنه يُعزف ويُغنى بروح شرقية وتقاسيم مبهجة ونكهة فرح عارمة.',
    vocalSampleUrl: '/audio/ah-haat/ajam_human_voice.mp3',
    vocalSampleDescription: 'Triumphant celebratory vocal Ah-haat radiating bright major clarity, pride, and exultant vocal projection',
    vocalSampleDescriptionArabic: 'آهات عجم مبهجة ومنتصرة تشع بالفخر والسطوع الميجور والابتهاج الطربي العارم',
    tonicJins: 'Jins Ajam on Rast (C)',
    tonicJinsId: 'jins_ajam',
    secondaryJins: 'Jins Ajam on Nawa (G)',
    secondaryJinsId: 'jins_ajam',
    commonModulations: [
      {
        targetJinsId: 'jins_nahawand',
        targetJinsName: 'Jins Nahawand on D',
        targetJinsArabic: 'جنس نهاوند على الدوكاه',
        pivotNote: 'D4',
        smoothnessScore: 91,
        description: 'Creates a reflective contrast before returning to celebratory Ajam.',
        descriptionArabic: 'تباين شجي رقيق قبل العودة إلى احتفالية العجم.',
      },
    ],
    famousSongs: [
      { title: 'Tala’at Ya Mahla Noureha', artist: 'Sayed Darwish (سيد درويش)', description: 'Iconic Egyptian morning song' },
      { title: 'Zourouni', artist: 'Fairouz', description: 'Celebrated rendition' },
    ],
    scaleDegrees: [
      { note: 'C4', arabicName: 'عجم عشيران (راست)', octave: 4, centsFromRoot: 0, isQuarterTone: false, frequency: 261.63 },
      { note: 'D4', arabicName: 'دوكاه', octave: 4, centsFromRoot: 200, isQuarterTone: false, frequency: 293.66 },
      { note: 'E4', arabicName: 'بوسليك عجم', octave: 4, centsFromRoot: 400, isQuarterTone: false, frequency: 329.63 },
      { note: 'F4', arabicName: 'جهاركاه', octave: 4, centsFromRoot: 500, isQuarterTone: false, frequency: 349.23 },
      { note: 'G4', arabicName: 'نوى', octave: 4, centsFromRoot: 700, isQuarterTone: false, frequency: 392.00 },
      { note: 'A4', arabicName: 'حسيني', octave: 4, centsFromRoot: 900, isQuarterTone: false, frequency: 440.00 },
      { note: 'B4', arabicName: 'ماهور', octave: 4, centsFromRoot: 1100, isQuarterTone: false, frequency: 493.88 },
      { note: 'C5', arabicName: 'كردان', octave: 5, centsFromRoot: 1200, isQuarterTone: false, frequency: 523.25 },
    ],
    practiceExercise: {
      title: 'Ajam Morning Radiance & Open Pharyngeal Resonance',
      titleArabic: 'إشراقة العجم الصباحية والرنين الحلقي المفتوح',
      description: 'Sing with open, bright vowels, full chest resonance, and joyful confidence.',
      notes: [
        { note: 'C4', arabicName: 'راست', duration: 1.0, frequency: 261.63, lyric: 'طَلَعَتْ', jins: 'jins_ajam' },
        { note: 'E4', arabicName: 'بوسليك', duration: 1.0, frequency: 329.63, lyric: 'يَا', jins: 'jins_ajam' },
        { note: 'G4', arabicName: 'نوى', duration: 1.2, frequency: 392.00, lyric: 'مَحْلَا', ornament: 'tazleeq', jins: 'jins_ajam' },
        { note: 'C5', arabicName: 'كردان', duration: 1.5, frequency: 523.25, lyric: 'نُورْهَا', ornament: 'sustained', jins: 'jins_ajam' },
        { note: 'B4', arabicName: 'ماهور', duration: 0.8, frequency: 493.88, lyric: 'شَمْسِ', jins: 'jins_ajam' },
        { note: 'A4', arabicName: 'حسيني', duration: 0.8, frequency: 440.00, lyric: 'الشُّـ', jins: 'jins_ajam' },
        { note: 'G4', arabicName: 'نوى', duration: 1.2, frequency: 392.00, lyric: 'ـمُوسْ', ornament: 'tarjif', jins: 'jins_ajam' },
        { note: 'C4', arabicName: 'راست', duration: 2.0, frequency: 261.63, lyric: 'دَامْ', ornament: 'sustained', jins: 'jins_ajam' },
      ],
    },
  },
];

export const ARABIC_NOTE_NAMES: Record<string, string> = {
  C: 'راست',
  'C#': 'شوري',
  D: 'دوكاه',
  'E½b': 'سيكاه (نصف بيمول)',
  Eb: 'كردي / بوسليك',
  E: 'عجم',
  F: 'جهاركاه',
  'F#': 'حجاز',
  G: 'نوى',
  Ab: 'حصار',
  A: 'حسيني',
  Bb: 'عجم عشيران',
  'B½b': 'أوج (نصف بيمول)',
  B: 'ماهور',
};
