import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    appTitle: 'MaqamFlow',
    appSubtitle: 'Vocal Coach & Arabic Maqam Suite (Pro Edition)',
    tabLive: 'Live Mic & Pitch',
    tabAhhaat: '8 Maqamat Vocal Ah-haat',
    tabTaqaseem: 'Taqaseem & Modulation',
    tabHarmonizer: 'Auto-Harmonizer & Choir',
    tabStems: 'Stem Separation & Karaoke',
    tabDSP: 'Studio DSP & Space',
    tabBreath: 'Breath & Stamina Guide',
    tabJins: 'Jins & Modulation',
    tabDiagnostics: 'Vocal Diagnostics & Orab',
    tabStudio: 'Melody & Backing Studio',
    tabEar: 'Ear-Training & Microtones',
    tabCoach: 'Vocal Coach',
    tabImport: 'Song Analysis',
    tabInstruments: 'Oud & Piano',
    tabDrone: 'Drone & Iqa’',
    startListening: 'Start Live Mic',
    stopListening: 'Stop Mic',
    micActive: 'Listening & Tracking Pitch...',
    micPrompt: 'Sing or hum into your microphone to detect pitch and identify the Maqam',
    currentPitch: 'Current Pitch',
    nearestMaqam: 'Detected Maqam',
    confidence: 'Confidence',
    centsDeviation: 'Cents Deviation',
    quarterToneDetected: 'Arabic Quarter-Tone Detected (Sikah / Half-Flat)',
    inTune: 'In Tune',
    sharp: 'Sharp',
    flat: 'Flat',
    frequency: 'Frequency',
    octave: 'Octave',
    clearHistory: 'Reset Pitch History',
    matchPercentage: 'Match',
    scaleDegrees: 'Scale Degrees',
    famousSongs: 'Signature Repertoire',
    mood: 'Emotional Mood',
    tonicJins: 'Tonic Jins (الأصل)',
    secondaryJins: 'Secondary Jins (الفرع)',
    // Coach
    selectMaqamToPractice: 'Select Maqam Exercise',
    practiceDesc: 'Sing along with the authentic quarter-tone guide melody. Hit the target pitch tunnel to test your intonation!',
    startPractice: 'Start Sing-Along Session',
    stopPractice: 'Finish & Evaluate with AI',
    listeningVoice: 'Recording your voice...',
    playGuideTone: 'Play Guide Scale',
    evaluatingWithAI: 'AI Vocal Master Analyzing Your Pitch & Microtones...',
    overallScore: 'Overall Score',
    pitchAccuracy: 'Pitch Accuracy',
    rhythmPrecision: 'Rhythm & Timing',
    microtoneMastery: 'Quarter-Tone Mastery',
    vocalFeedback: 'Vocal Master Feedback',
    detailedErrors: 'Microtonal & Phrasing Corrections',
    recommendedDrills: 'Recommended Vocal Drills',
    tryAgain: 'Practice Again',
    // Import
    importTitle: 'Audio Import & Song Analysis Hub',
    importDesc: 'Paste a YouTube video link or upload an MP3/WAV/M4A file to extract its Maqam, tempo, Ajnas, and interactive sheet music.',
    youtubePlaceholder: 'Paste YouTube URL (e.g. Fairouz, Umm Kulthum, or any vocal track)...',
    analyzeButton: 'Analyze Song with AI',
    analyzingSong: 'Extracting Maqam Structure & Notation...',
    uploadAudio: 'Upload Audio File',
    orSelectSample: 'Or Select Curated Classic Masterpiece:',
    sheetMusicTitle: 'Interactive Sheet Music & Piano Roll',
    tempoBpm: 'Tempo (BPM)',
    keyRoot: 'Root Key',
    iqaRhythm: 'Rhythm (Iqa’)',
    // Instruments
    virtualOud: 'Virtual Arabic Oud (عود)',
    virtualPiano: 'Microtonal Arabic Piano (بيانو ربع تون)',
    oudDesc: 'Click or touch any string position (Dastan) to play authentic acoustic Oud plucks. Active Maqam notes are highlighted in glowing amber.',
    pianoDesc: 'Interactive 24-TET keyboard with custom quarter-tone half-flat keys (Sikah E½♭, Awj B½♭).',
    pluckString: 'Pluck string to hear harmonic overtone',
    // Drone
    droneTitle: 'Continuous Tanpura Drone & Arabic Iqa’',
    droneDesc: 'Practice vocal intonation against a steady acoustic harmonic drone, accompanied by traditional rhythmic cycles.',
    startDrone: 'Start Acoustic Drone',
    stopDrone: 'Stop Drone',
    droneVolume: 'Drone Volume',
    rootDroneKey: 'Drone Root Tone',
    iqaTitle: 'Arabic Iqa’ Rhythm Machine',
    startIqa: 'Start Rhythmic Cycle',
    stopIqa: 'Stop Cycle',
    installApp: 'Install App (PWA)',
    installed: 'App Installed',
    offlineNotice: 'Offline Mode active — cached data in use',
  },
  ar: {
    appTitle: 'مقام فلو',
    appSubtitle: 'مُدَرِّب الصوت وكاشف المقامات العربية (النسخة الاحترافية)',
    tabLive: 'الكشف المباشر',
    tabAhhaat: 'آهات المقامات الثمانية',
    tabTaqaseem: 'مرشد التقاسيم والانتقالات',
    tabHarmonizer: 'الكورس والهارموني',
    tabStems: 'عزل الصوت والكاريوكي',
    tabDSP: 'مؤثرات الاستوديو والهندسة',
    tabBreath: 'إدارة النَّفَس والموال',
    tabJins: 'الأجناس والانتقالات',
    tabDiagnostics: 'مختبر الصوت والعُرَب',
    tabStudio: 'استوديو التراك واللحن',
    tabEar: 'تدريب الأذن والأرباع',
    tabCoach: 'مُدَرِّب الصوت',
    tabImport: 'تحليل الأغاني',
    tabInstruments: 'العود والبيانو',
    tabDrone: 'الدندنة والإيقاع',
    startListening: 'تشغيل المايكروفون',
    stopListening: 'إيقاف المايك',
    micActive: 'جاري الاستماع وتحليل الصوت...',
    micPrompt: 'غنِّ أو همهم في المايكروفون لكشف درجة صوتك وتحديد المقام تلقائياً',
    currentPitch: 'النغمة الحالية',
    nearestMaqam: 'المقام المُكتشف',
    confidence: 'نسبة التطابق',
    centsDeviation: 'انحراف السنت',
    quarterToneDetected: 'تم رصد ربع تون شرقي (سيكاه / نصف بيمول)',
    inTune: 'نغمة دقيقة',
    sharp: 'مرتفع (دييز)',
    flat: 'منخفض (بيمول)',
    frequency: 'التردد',
    octave: 'الأوكتاف',
    clearHistory: 'إعادة ضبط السجل',
    matchPercentage: 'التطابق',
    scaleDegrees: 'درجات المقام',
    famousSongs: 'أشهر الروائع الغنائية',
    mood: 'الطابع والروح',
    tonicJins: 'جنس الأصل',
    secondaryJins: 'جنس الفرع',
    // Coach
    selectMaqamToPractice: 'اختر تمرين المقام',
    practiceDesc: 'غنِّ مع السلم الصوتي المرجعي بربع التون الأصيل. تابع مسار النغمات لاختبار دقة حنجرتك!',
    startPractice: 'بدء جلسة الغناء',
    stopPractice: 'إنهاء وتقييم الأداء بالذكاء الاصطناعي',
    listeningVoice: 'جاري تسجيل وتحليل صوتك...',
    playGuideTone: 'سماع سلم المقام',
    evaluatingWithAI: 'خبير الصوتيات والذكاء الاصطناعي يحلل نغماتك وأرباع التون...',
    overallScore: 'النتيجة الإجمالية',
    pitchAccuracy: 'دقة النغمات',
    rhythmPrecision: 'الانضباط الإيقاعي',
    microtoneMastery: 'إتقان ربع التون',
    vocalFeedback: 'تقرير أستاذ الصوت',
    detailedErrors: 'تصويبات الأداء ودرجات المقام',
    recommendedDrills: 'تمارين مقترحة للتحسين',
    tryAgain: 'تكرار التمرين',
    // Import
    importTitle: 'مركز استيراد وتحليل الأغاني',
    importDesc: 'الصق رابط يوتيوب أو ارفع ملف صوتي لاستخراج المقام، السرعة، الأجناس، والنوتة الموسيقية التفاعلية.',
    youtubePlaceholder: 'الصق رابط يوتيوب (مثل فيروز، أم كلثوم، أو أي مقطع غنائي)...',
    analyzeButton: 'تحليل الأغنية بالذكاء الاصطناعي',
    analyzingSong: 'جاري استخراج المقام والنوتة الموسيقية...',
    uploadAudio: 'رفع ملف صوتي',
    orSelectSample: 'أو اختر من الروائع الخالدة المختارة:',
    sheetMusicTitle: 'النوتة الموسيقية التفاعلية والبيانو رول',
    tempoBpm: 'السرعة (BPM)',
    keyRoot: 'درجة الركوز',
    iqaRhythm: 'الإيقاع',
    // Instruments
    virtualOud: 'عود شرقي تفاعلي',
    virtualPiano: 'بيانو ربع تون شرقي',
    oudDesc: 'انقر أو المس أي دستان على الأوتار لعزف رنات العود الحقيقية. درجات المقام الحالي تضيء باللون الكهرماني.',
    pianoDesc: 'لوحة مفاتيح تفاعلية بنظام 24 ربع تون تتضمن مفاتيح السيكاه ونصف البيمول.',
    pluckString: 'انقر على الوتر لسماع الرنين الشرقي',
    // Drone
    droneTitle: 'الدندنة الصوتية وميزان الإيقاع الشرقي',
    droneDesc: 'تدرّب على تثبيت النغمات والأرباع فوق نغمة دندنة متصلة مصحوبة بدورات إيقاعية عربية (مقسوم، ملفوف).',
    startDrone: 'تشغيل الدندنة المستمرة',
    stopDrone: 'إيقاف الدندنة',
    droneVolume: 'مستوى الصوت',
    rootDroneKey: 'نغمة الركوز',
    iqaTitle: 'ضابط الإيقاع العربي',
    startIqa: 'بدء دورة الإيقاع',
    stopIqa: 'إيقاف الإيقاع',
    installApp: 'تثبيت التطبيق (PWA)',
    installed: 'التطبيق مُثبت',
    offlineNotice: 'وضع عدم الاتصال مفعل — يتم استخدام البيانات المحفوظة',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  isRTL: false,
  t: (k) => k,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('maqamflow_lang');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });

  const isRTL = lang === 'ar';

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('maqamflow_lang', newLang);
  };

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const t = (key: string): string => {
    return translations[lang][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, isRTL, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
