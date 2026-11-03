import React from 'react';
import { soundSynth } from '../utils/soundSynth';
import { useLanguage } from '../context/LanguageContext';
import { Play, Volume2 } from 'lucide-react';

export interface SheetNote {
  note: string; // e.g. "D4", "E½b4", "F4", "G4"
  arabicName?: string;
  duration?: number;
  timestamp?: number;
  frequency: number;
  lyric?: string;
}

interface ScoreViewerProps {
  notes: SheetNote[];
  currentNoteIndex?: number;
  isPlaying?: boolean;
  onPlayAll?: () => void;
}

export const ScoreViewer: React.FC<ScoreViewerProps> = ({
  notes,
  currentNoteIndex = -1,
  isPlaying = false,
  onPlayAll,
}) => {
  const { t, isRTL } = useLanguage();

  const playSingle = (n: SheetNote) => {
    soundSynth.playOudNote(n.frequency, (n.duration || 1) * 1.2);
  };

  // Convert note name to staff vertical offset
  // Treble clef lines from bottom: E4 (line 1), G4 (line 2), B4 (line 3), D5 (line 4), F5 (line 5)
  // Spaces: F4, A4, C5, E5. Below line: D4, C4 (ledger line)
  const getStaffY = (noteStr: string): number => {
    const clean = noteStr.replace('½', '').replace('b', '').replace('#', '');
    const pitch = clean.slice(0, 1);
    const octave = parseInt(clean.slice(1)) || 4;

    const basePositions: Record<string, number> = {
      C: 0,
      D: 1,
      E: 2,
      F: 3,
      G: 4,
      A: 5,
      B: 6,
    };

    const step = (octave - 4) * 7 + (basePositions[pitch] ?? 1);
    // Reference: D4 (step 1) -> Y = 130; each step is 10px higher (lower Y)
    // 5 staff lines at Y = 120 (E4), 100 (G4), 80 (B4), 60 (D5), 40 (F5)
    return 140 - step * 10;
  };

  return (
    <div className="w-full flex flex-col gap-4 p-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            🎼
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {t('sheetMusicTitle')}
            </h3>
            <p className="text-xs text-slate-400">
              Traditional Arabic Maqam notation with 24-TET half-flat accidentals (½♭)
            </p>
          </div>
        </div>

        {onPlayAll && (
          <button
            onClick={onPlayAll}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPlaying ? 'Playing...' : 'Play Sequence'}</span>
          </button>
        )}
      </div>

      {/* SVG Musical Staff */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="min-w-[650px] relative bg-slate-950/80 rounded-2xl p-4 border border-white/5">
          <svg viewBox="0 0 700 180" className="w-full h-44 overflow-visible">
            {/* 5 Staff lines */}
            {[40, 60, 80, 100, 120].map((y) => (
              <line
                key={y}
                x1="20"
                y1={y}
                x2="680"
                y2={y}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1.5"
              />
            ))}

            {/* Treble Clef Graphic */}
            <text
              x="30"
              y="115"
              fontSize="85"
              fontFamily="serif"
              fill="#06b6d4"
              className="select-none"
            >
              𝄞
            </text>

            {/* Time signature: 4/4 */}
            <text x="75" y="75" fontSize="24" fontWeight="bold" fill="#94a3b8">
              4
            </text>
            <text x="75" y="115" fontSize="24" fontWeight="bold" fill="#94a3b8">
              4
            </text>

            {/* Render Notes */}
            {notes.map((noteItem, idx) => {
              const x = 120 + idx * 56;
              const y = getStaffY(noteItem.note);
              const isQuarter = noteItem.note.includes('½');
              const isCurrent = currentNoteIndex === idx;

              return (
                <g
                  key={idx}
                  onClick={() => playSingle(noteItem)}
                  className="cursor-pointer group"
                >
                  {/* Ledger lines if below or above staff (e.g. C4 at Y=140) */}
                  {y >= 140 && (
                    <line
                      x1={x - 14}
                      y1={140}
                      x2={x + 14}
                      y2={140}
                      stroke="rgba(255, 255, 255, 0.4)"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Highlight pill for active playhead */}
                  {isCurrent && (
                    <rect
                      x={x - 20}
                      y={15}
                      width={40}
                      height={145}
                      rx={8}
                      fill="rgba(245, 158, 11, 0.15)"
                      stroke="rgba(245, 158, 11, 0.8)"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Accidental: Arabic Half Flat (Mirrored flat or slashed flat) */}
                  {isQuarter ? (
                    <text
                      x={x - 22}
                      y={y + 5}
                      fontSize="18"
                      fontWeight="bold"
                      fill="#f59e0b"
                      fontFamily="sans-serif"
                    >
                      ½♭
                    </text>
                  ) : noteItem.note.includes('b') ? (
                    <text
                      x={x - 16}
                      y={y + 5}
                      fontSize="18"
                      fill="#38bdf8"
                      fontFamily="serif"
                    >
                      ♭
                    </text>
                  ) : noteItem.note.includes('#') ? (
                    <text
                      x={x - 16}
                      y={y + 5}
                      fontSize="18"
                      fill="#ec4899"
                      fontFamily="serif"
                    >
                      ♯
                    </text>
                  ) : null}

                  {/* Note head (oval tilted) */}
                  <ellipse
                    cx={x}
                    cy={y}
                    rx="8"
                    ry="6"
                    transform={`rotate(-25 ${x} ${y})`}
                    fill={isCurrent ? '#f59e0b' : isQuarter ? '#fbbf24' : '#ffffff'}
                    stroke={isCurrent ? '#fef08a' : isQuarter ? '#d97706' : '#38bdf8'}
                    strokeWidth="2"
                    className="group-hover:scale-125 transition-transform origin-center"
                  />

                  {/* Note stem (upwards) */}
                  <line
                    x1={x + 6}
                    y1={y - 2}
                    x2={x + 6}
                    y2={y - 35}
                    stroke={isCurrent ? '#f59e0b' : '#cbd5e1'}
                    strokeWidth="2"
                  />

                  {/* Note Name Label */}
                  <text
                    x={x}
                    y="160"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill={isQuarter ? '#f59e0b' : '#94a3b8'}
                    fontFamily="monospace"
                  >
                    {noteItem.note}
                  </text>

                  {/* Lyric Label if present */}
                  {noteItem.lyric && (
                    <text
                      x={x}
                      y="178"
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#38bdf8"
                      fontFamily="'Cairo', sans-serif"
                    >
                      {noteItem.lyric}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
