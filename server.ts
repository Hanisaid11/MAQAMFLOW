import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI client with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction for Arabic and Western Musicology
const MUSICOLOGY_SYSTEM_INSTRUCTION = `You are a world-renowned master musicologist, Arabic Maqam theorist, and vocal performance coach with deep mastery of both Arabic Maqamat (Bayati, Rast, Hijaz, Saba, Sikah, Nahawand, Kurd, Ajam, Nawa Athar, etc.), microtonality (quarter-tones, half-flats Sikah/Awj, 24-TET and just intonation comma nuances), rhythmic Iqa'at (Maqsum, Baladi, Samai, Wahda, Malfuf), and Western vocal technique (pitch intonation, vibrato, resonance, breath support). Provide highly accurate, authentic, and inspiring evaluations. Always support both English and Arabic context.`;

// API: Analyze Song or YouTube Track
app.post('/api/analyze-song', async (req: Request, res: Response) => {
  try {
    const { url, title, artist, audioFeatures, language } = req.body;

    const prompt = `Analyze this musical piece for Arabic Maqam, musical key, rhythm Iqa', and vocal characteristics:
Title/Query: ${title || 'Vocal Maqam Exploration'}
Artist: ${artist || 'Traditional / Contemporary'}
Reference URL or Link: ${url || 'N/A'}
User Audio Features: ${JSON.stringify(audioFeatures || {})}
Language Requested: ${language || 'en'}

Please provide a structured musical analysis containing:
1. songTitle and artistName
2. primaryMaqam (e.g. "Maqam Bayati", "Maqam Rast", "Maqam Hijaz", "Maqam Nahawand", "Maqam Saba", "Maqam Kurd", "Maqam Ajam", "Maqam Sikah")
3. primaryMaqamArabic (e.g. "مقام بياتي")
4. rootNote (e.g. "D4 (Dukah)", "C4 (Rast)", "E½♭4 (Sikah)")
5. bpm (tempo number)
6. iqaRhythm (e.g. "Maqsum 4/4", "Wahda Kabira 4/4", "Samai Thaqil 10/8", "Malfuf 2/4", "Taqsim Free Meter")
7. ajnasBreakdown: tonic jins (Jins al-Asl) and secondary jins (Jins al-Far')
8. microtonalNotes: specific quarter-tone degrees (e.g. "E½♭ (Sikah) at ~350 cents", "B½♭ (Awj)")
9. emotionalMood (e.g. "Deep longing, spiritual warmth, traditional Tarab feeling")
10. sheetNotes: an array of 8-16 sequential melody note objects to render on staff and piano roll:
    Each note: { note: string (e.g. "D4", "E½b4", "F4", "G4", "A4"), duration: number (in beats, e.g. 1, 0.5, 2), timestamp: number (in seconds), frequency: number (in Hz), lyric: string }
11. vocalCoachingTips: array of 3-4 specific vocal advice points for singing this Maqam properly.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: MUSICOLOGY_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            songTitle: { type: Type.STRING },
            artistName: { type: Type.STRING },
            primaryMaqam: { type: Type.STRING },
            primaryMaqamArabic: { type: Type.STRING },
            rootNote: { type: Type.STRING },
            bpm: { type: Type.INTEGER },
            iqaRhythm: { type: Type.STRING },
            iqaRhythmArabic: { type: Type.STRING },
            tonicJins: { type: Type.STRING },
            secondaryJins: { type: Type.STRING },
            microtonalNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            emotionalMood: { type: Type.STRING },
            description: { type: Type.STRING },
            descriptionArabic: { type: Type.STRING },
            sheetNotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  note: { type: Type.STRING },
                  arabicName: { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  timestamp: { type: Type.NUMBER },
                  frequency: { type: Type.NUMBER },
                  lyric: { type: Type.STRING },
                },
                required: ['note', 'timestamp', 'frequency'],
              },
            },
            vocalCoachingTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            vocalCoachingTipsArabic: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'songTitle',
            'primaryMaqam',
            'primaryMaqamArabic',
            'rootNote',
            'bpm',
            'sheetNotes',
            'vocalCoachingTips',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error analyzing song:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze song with Gemini AI',
    });
  }
});

// API: Generate Complete Instrumental Backing Track & Melody
app.post('/api/generate-backing-track', async (req: Request, res: Response) => {
  try {
    const { songQuery, preferredInstrument, preferredMaqam, bpm } = req.body;

    const prompt = `Generate a complete, high-fidelity Arabic instrumental backing track and melody for the requested song/theme:
Song Query: ${songQuery || 'Aatini Al-Naya Wa Ghanni (أعطني الناي وغنِّ)'}
Preferred Instrument: ${preferredInstrument || 'oud'} (options: oud, qanun, ney)
Preferred Maqam: ${preferredMaqam || 'Maqam Nahawand'}
Tempo Request: ${bpm || 96} BPM

Generate the complete musical sequence so a vocalist can practice and sing along. Include:
1. songTitle and artist
2. maqam and maqamArabic
3. rootNote (e.g. "C4", "D4", "E½♭4")
4. bpm
5. iqaPattern (e.g. "Maqsum 4/4", "Wahda 4/4", "Malfuf 2/4")
6. instrument ('oud' | 'qanun' | 'ney')
7. description: brief aesthetic and history of this backing melody
8. melodyNotes: a sequence of 14-24 sequential musical notes:
   Each note MUST include:
   - note: string (e.g. "D4", "E½b4", "F4", "G4", "A4", "Bb4", "C5")
   - arabicName: string (e.g. "دوكاه", "سيكاه", "جهاركاه")
   - duration: number (seconds, e.g. 0.8, 1.2, 1.5, 2.0)
   - frequency: number (accurate Hz, e.g. 293.66, 320.24, 349.23, 392.00)
   - lyric: string (Arabic lyrics or vocal solfege syllable)
   - ornament: "tarjif" | "tazleeq" | "sustained" | "none"
9. vocalSingAlongCues: array of 3 timing advice tips for the vocalist to enter and sing properly with the backing track.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: MUSICOLOGY_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            songTitle: { type: Type.STRING },
            artist: { type: Type.STRING },
            maqam: { type: Type.STRING },
            maqamArabic: { type: Type.STRING },
            rootNote: { type: Type.STRING },
            bpm: { type: Type.INTEGER },
            iqaPattern: { type: Type.STRING },
            instrument: { type: Type.STRING },
            description: { type: Type.STRING },
            melodyNotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  note: { type: Type.STRING },
                  arabicName: { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  frequency: { type: Type.NUMBER },
                  lyric: { type: Type.STRING },
                  ornament: { type: Type.STRING },
                },
                required: ['note', 'duration', 'frequency'],
              },
            },
            vocalSingAlongCues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'songTitle',
            'artist',
            'maqam',
            'maqamArabic',
            'rootNote',
            'bpm',
            'instrument',
            'melodyNotes',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, track: parsed });
  } catch (error: any) {
    console.error('Error generating backing track:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate backing track with Gemini AI',
    });
  }
});

// API: Vocal Performance Evaluation
app.post('/api/evaluate-vocal', async (req: Request, res: Response) => {
  try {
    const {
      maqamName,
      referenceNotes,
      recordedPitches,
      audioMetrics,
      duration,
    } = req.body;

    const prompt = `Evaluate this vocal singing session for Maqam and vocal precision:
Target Maqam: ${maqamName || 'Maqam Bayati'}
Session Duration: ${duration || 10} seconds
Audio Metrics Detected:
- Average Pitch Accuracy (raw): ${audioMetrics?.rawAccuracy || 80}%
- Mean Cents Deviation: ${audioMetrics?.meanCentsDeviation || 18} cents
- Detected Quarter-Tone Stability: ${audioMetrics?.quarterToneScore || 75}%
- Vibrato / Stability Rate: ${audioMetrics?.stability || 'Moderate vibrato, steady airflow'}
- Note Hit Count: ${audioMetrics?.notesHit || 12} / ${referenceNotes?.length || 14}
- Detected Pitch Log Sample: ${JSON.stringify(recordedPitches?.slice(0, 30) || [])}

Provide an authentic vocal coaching assessment with:
1. overallScore (0-100)
2. pitchAccuracyScore (0-100)
3. rhythmScore (0-100)
4. microtoneScore (0-100) - specifically for neutral thirds/half-flats (Sikah, Awj, etc.)
5. modulationSmoothnessScore (0-100) - evaluates Jins and scale transitions
6. ornamentationEleganceScore (0-100) - evaluates Arabo-vocal trills ("Orab" and Tazleeq)
7. performanceLevel: ("Maestro / مطرب", "Advanced / متقدم", "Intermediate / متمرس", "Developing / واعد")
8. summaryFeedback (English, encouraging and musical)
9. summaryFeedbackArabic (Arabic, warm and authentic)
10. specificErrors: array of 3 timestamped precise feedback items
11. strengths: array of 2-3 aspects done well (English & Arabic)
12. drillsToImprove: 2 specific vocal exercises to master this Maqam.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: MUSICOLOGY_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER },
            pitchAccuracyScore: { type: Type.INTEGER },
            rhythmScore: { type: Type.INTEGER },
            microtoneScore: { type: Type.INTEGER },
            modulationSmoothnessScore: { type: Type.INTEGER },
            ornamentationEleganceScore: { type: Type.INTEGER },
            performanceLevel: { type: Type.STRING },
            summaryFeedback: { type: Type.STRING },
            summaryFeedbackArabic: { type: Type.STRING },
            specificErrors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  note: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  issueArabic: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                },
                required: ['timestamp', 'note', 'issue', 'suggestion'],
              },
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            strengthsArabic: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            drillsToImprove: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  titleArabic: { type: Type.STRING },
                  description: { type: Type.STRING },
                  vocalVowel: { type: Type.STRING },
                },
                required: ['title', 'description'],
              },
            },
          },
          required: [
            'overallScore',
            'pitchAccuracyScore',
            'rhythmScore',
            'microtoneScore',
            'modulationSmoothnessScore',
            'ornamentationEleganceScore',
            'performanceLevel',
            'summaryFeedback',
            'summaryFeedbackArabic',
            'specificErrors',
            'drillsToImprove',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, evaluation: parsed });
  } catch (error: any) {
    console.error('Error evaluating vocal performance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to evaluate vocal performance',
    });
  }
});

// Vite Middleware integration for development or static serving for production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`MaqamFlow server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
