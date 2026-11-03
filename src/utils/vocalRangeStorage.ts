/**
 * Persistent Vocal Range Storage & Preset Models
 */

export type VoiceClassificationId =
  | 'Bass'
  | 'Baritone'
  | 'Tenor'
  | 'Countertenor'
  | 'Contralto' // Alto
  | 'Mezzo-Soprano'
  | 'Soprano'
  | 'Custom';

export interface VoicePreset {
  id: VoiceClassificationId;
  nameEn: string;
  nameAr: string;
  category: 'male' | 'female' | 'universal';
  lowNote: string;
  highNote: string;
  lowMidi: number;
  highMidi: number;
  color: string;
  accentBg: string;
  borderColor: string;
  descriptionEn: string;
  descriptionAr: string;
}

export const VOCAL_PRESETS: VoicePreset[] = [
  {
    id: 'Bass',
    nameEn: 'Bass (باص)',
    nameAr: 'باص (قرار عميق)',
    category: 'male',
    lowNote: 'E2',
    highNote: 'E4',
    lowMidi: 40,
    highMidi: 64,
    color: 'from-blue-600 to-indigo-800',
    accentBg: 'bg-blue-500/20',
    borderColor: 'border-blue-500/40',
    descriptionEn: 'Deep male resonance (E2–E4). Rich low chest resonance for grounded Arabic Tarab.',
    descriptionAr: 'طبقة القرار الرجالي العميقة (E2–E4). رنين صدري منخفض قوي يرسخ مقامات البياتي والرست.',
  },
  {
    id: 'Baritone',
    nameEn: 'Baritone (باريتون)',
    nameAr: 'باريتون (قرار متوسط)',
    category: 'male',
    lowNote: 'A2',
    highNote: 'F4',
    lowMidi: 45,
    highMidi: 65,
    color: 'from-cyan-600 to-blue-700',
    accentBg: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/40',
    descriptionEn: 'Warm, versatile male vocal range (A2–F4). Most prevalent male vocal classification.',
    descriptionAr: 'طبقة الصوت الرجالي الأكثر انتشاراً (A2–F4). تجمع دفء القرار وسلاسة العبور.',
  },
  {
    id: 'Tenor',
    nameEn: 'Tenor (تينور)',
    nameAr: 'تينور (جواب رجالي)',
    category: 'male',
    lowNote: 'C3',
    highNote: 'A4',
    lowMidi: 48,
    highMidi: 69,
    color: 'from-amber-500 to-orange-600',
    accentBg: 'bg-amber-500/20',
    borderColor: 'border-amber-500/40',
    descriptionEn: 'High, radiant male voice (C3–A4). Clear projection in the Passaggio and head register.',
    descriptionAr: 'أعلى طبقة صوت رجالي طبيعية (C3–A4). رنين لامع في الجواب وانتقالات سلسة.',
  },
  {
    id: 'Countertenor',
    nameEn: 'Countertenor (كاونترتينور)',
    nameAr: 'كاونترتينور (رأسي رجالي عالي)',
    category: 'male',
    lowNote: 'E3',
    highNote: 'E5',
    lowMidi: 52,
    highMidi: 76,
    color: 'from-emerald-500 to-teal-700',
    accentBg: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/40',
    descriptionEn: 'Rare high male voice using head voice/falsetto (E3–E5), overlapping with Alto.',
    descriptionAr: 'طبقة رجالية عليا نادرة تعتمد الصوت الرأسي (E3–E5)، تتقاطع مع طبقة الألتو.',
  },
  {
    id: 'Contralto',
    nameEn: 'Contralto / Alto (كونترالتو / ألتو)',
    nameAr: 'ألتو / كونترالتو (قرار نسائي)',
    category: 'female',
    lowNote: 'F3',
    highNote: 'D5',
    lowMidi: 53,
    highMidi: 74,
    color: 'from-teal-500 to-cyan-700',
    accentBg: 'bg-teal-500/20',
    borderColor: 'border-teal-500/40',
    descriptionEn: 'Deepest female voice (F3–D5). Velvety, rich low chest tones with soulful warmth.',
    descriptionAr: 'أعمق وأدفأ طبقة صوت نسائي (F3–D5). نغمات صدرية مخملية عميقة وطابع شجي.',
  },
  {
    id: 'Mezzo-Soprano',
    nameEn: 'Mezzo-Soprano (ميزو سوبرانو)',
    nameAr: 'ميزو سوبرانو (وسط نسائي)',
    category: 'female',
    lowNote: 'A3',
    highNote: 'F#5',
    lowMidi: 57,
    highMidi: 78,
    color: 'from-fuchsia-500 to-purple-700',
    accentBg: 'bg-fuchsia-500/20',
    borderColor: 'border-fuchsia-500/40',
    descriptionEn: 'Middle female voice (A3–F#5). Balanced blend between chest power and high agility.',
    descriptionAr: 'الطبقة النسائية الوسطى (A3–F#5). توازن رشيق بين قوة الصدر ولمعان الجواب.',
  },
  {
    id: 'Soprano',
    nameEn: 'Soprano (سوبرانو)',
    nameAr: 'سوبرانو (جواب حاد)',
    category: 'female',
    lowNote: 'C4',
    highNote: 'C6',
    lowMidi: 60,
    highMidi: 84,
    color: 'from-pink-500 to-rose-700',
    accentBg: 'bg-pink-500/20',
    borderColor: 'border-pink-500/40',
    descriptionEn: 'Highest female vocal range (C4–C6). Brilliant head register, ornamentation, and Tarab agility.',
    descriptionAr: 'أعلى الطبقات الصوتية النسائية (C4–C6). صوت رأسي نقي وقدرة استثنائية على التطريب والعُرَب.',
  },
];

export interface SavedVocalRange {
  voiceType: VoiceClassificationId;
  labelEn: string;
  labelAr: string;
  lowNote: string;
  highNote: string;
  lowMidi: number;
  highMidi: number;
  color: string;
  savedAt: string;
  isCustom?: boolean;
}

export const STORAGE_KEY_VOCAL_RANGE = 'maqamflow_saved_vocal_range';

export const DEFAULT_SAVED_RANGE: SavedVocalRange = {
  voiceType: 'Tenor',
  labelEn: 'Tenor (C3 – A4)',
  labelAr: 'تينور (C3 – A4)',
  lowNote: 'C3',
  highNote: 'A4',
  lowMidi: 48,
  highMidi: 69,
  color: 'from-amber-500 to-orange-600',
  savedAt: new Date().toISOString(),
};

export function getSavedVocalRange(): SavedVocalRange {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VOCAL_RANGE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading saved vocal range from localStorage:', e);
  }
  return DEFAULT_SAVED_RANGE;
}

export function saveVocalRangeToStorage(range: SavedVocalRange): void {
  try {
    localStorage.setItem(STORAGE_KEY_VOCAL_RANGE, JSON.stringify(range));
  } catch (e) {
    console.error('Error saving vocal range to localStorage:', e);
  }
}
