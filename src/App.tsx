import React, { useState } from 'react';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { MAQAMAT_DATABASE, MaqamDefinition } from './utils/maqamData';
import { AudioVisualizer } from './components/AudioVisualizer';
import { MaqamRadar } from './components/MaqamRadar';
import { PracticeCoach } from './components/PracticeCoach';
import { AudioImportHub } from './components/AudioImportHub';
import { VirtualInstruments } from './components/VirtualInstruments';
import { DroneMetronome } from './components/DroneMetronome';
import { JinsModulationTracker } from './components/JinsModulationTracker';
import { VocalDiagnostics } from './components/VocalDiagnostics';
import { SmartMelodyStudio } from './components/SmartMelodyStudio';
import { EarTrainingDrill } from './components/EarTrainingDrill';
import { TaqaseemModulationGuide } from './components/TaqaseemModulationGuide';
import { AutoHarmonizerStudio } from './components/AutoHarmonizerStudio';
import { StemSeparationStudio } from './components/StemSeparationStudio';
import { StudioDSPEmulator } from './components/StudioDSPEmulator';
import { BreathStaminaGuide } from './components/BreathStaminaGuide';
import { MaqamVocalAhhaatShowcase } from './components/MaqamVocalAhhaatShowcase';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import {
  Mic,
  MicOff,
  Radio,
  Trophy,
  FileAudio,
  Music,
  Activity,
  Globe,
  Sparkles,
  Compass,
  HeartPulse,
  Disc,
  Ear,
  Wind,
  Sliders,
  Scissors,
  Layers,
  Heart,
} from 'lucide-react';

function MainApp() {
  const { t, lang, setLang, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    | 'live'
    | 'ahhaat'
    | 'taqaseem'
    | 'harmonizer'
    | 'stems'
    | 'dsp'
    | 'breath'
    | 'jins'
    | 'diagnostics'
    | 'studio'
    | 'ear'
    | 'coach'
    | 'import'
    | 'instruments'
    | 'drone'
  >('live');
  const [selectedMaqam, setSelectedMaqam] = useState<MaqamDefinition>(MAQAMAT_DATABASE[0]); // default Bayati

  const {
    isListening,
    error: micError,
    currentPitch,
    maqamMatches,
    jinsMatches,
    modulationHistory,
    fatigueMetrics,
    registerStats,
    orabCount,
    rms,
    freqData,
    timeData,
    startListening,
    stopListening,
    clearHistory,
  } = useAudioAnalyzer();

  return (
    <div className="relative min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Ambient Pulsing Glow Orbs in Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-600/15 blur-[120px] transition-transform duration-300"
          style={{ transform: `scale(${1 + rms * 2.5})` }}
        />
        <div
          className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-amber-500/15 blur-[130px] transition-transform duration-300"
          style={{ transform: `scale(${1 + rms * 2.8})` }}
        />
        <div
          className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-indigo-600/15 blur-[120px] transition-transform duration-300"
          style={{ transform: `scale(${1 + rms * 2})` }}
        />
      </div>

      {/* Offline Status */}
      <OfflineIndicator />

      {/* Top Glassmorphic Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-cyan-400 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="text-xl">🪕</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  MAQAM<span className="text-amber-400">FLOW</span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Vocal Coach & Suite
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-arabic">
                {lang === 'ar' ? 'مقام فلو • مُدَرِّب الصوت والمقامات العربية' : 'Arabic Maqamat & Microtonal Vocal Coach'}
              </p>
            </div>
          </div>

          {/* Right Controls: Mic Quick Toggle, PWA Install & Language */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Live Mic Action */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                isListening
                  ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('stopListening')}</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('startListening')}</span>
                </>
              )}
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-200 transition"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
        {/* Microphone Error Notification */}
        {micError && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
            <span>{micError}</span>
            <button
              onClick={startListening}
              className="px-3 py-1 bg-rose-500 text-white font-bold rounded-lg"
            >
              Retry
            </button>
          </div>
        )}

        {/* Navigation Tabs Hub */}
        <div className="w-full overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-md min-w-max">
            {[
              { id: 'live', label: t('tabLive'), icon: Radio },
              { id: 'taqaseem', label: t('tabTaqaseem'), icon: Compass },
              { id: 'harmonizer', label: t('tabHarmonizer'), icon: Layers },
              { id: 'stems', label: t('tabStems'), icon: Scissors },
              { id: 'dsp', label: t('tabDSP'), icon: Sliders },
              { id: 'breath', label: t('tabBreath'), icon: Wind },
              { id: 'jins', label: t('tabJins'), icon: Activity },
              { id: 'diagnostics', label: t('tabDiagnostics'), icon: HeartPulse },
              { id: 'studio', label: t('tabStudio'), icon: Disc },
              { id: 'ear', label: t('tabEar'), icon: Ear },
              { id: 'coach', label: t('tabCoach'), icon: Trophy },
              { id: 'import', label: t('tabImport'), icon: FileAudio },
              { id: 'instruments', label: t('tabInstruments'), icon: Music },
              { id: 'drone', label: t('tabDrone'), icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: Real-Time Maqam & Pitch Detection */}
        {activeTab === 'live' && (
          <div className="flex flex-col gap-6">
            {/* Live Visualizer HUD */}
            <AudioVisualizer
              isListening={isListening}
              currentPitch={currentPitch}
              rms={rms}
              freqData={freqData}
              timeData={timeData}
            />

            {/* Quick Helper Suggestion */}
            {!isListening && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-950/80 border border-cyan-500/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                  <p className="text-xs text-slate-300">
                    {lang === 'ar'
                      ? 'انقر على "تشغيل المايكروفون" في الأعلى وابدأ بالغناء أو الهمهمة للكشف الفوري عن المقام وربع التون.'
                      : 'Click "Start Live Mic" above and sing or hum to detect your exact pitch and identify the Arabic Maqam.'}
                  </p>
                </div>
                <button
                  onClick={startListening}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition shrink-0"
                >
                  {t('startListening')}
                </button>
              </div>
            )}

            {/* Maqam Identification Radar & Anatomy */}
            <MaqamRadar
              matches={maqamMatches}
              selectedMaqam={selectedMaqam}
              onSelectMaqam={setSelectedMaqam}
              onClearHistory={clearHistory}
            />
          </div>
        )}

        {/* MODULE 1: Cross-Modulation & Taqaseem Guide */}
        {activeTab === 'taqaseem' && (
          <TaqaseemModulationGuide
            currentPitch={currentPitch}
            isListening={isListening}
            selectedMaqamId={selectedMaqam.id}
          />
        )}

        {/* MODULE 2: AI Auto-Harmonizer & Multi-Track Studio */}
        {activeTab === 'harmonizer' && (
          <AutoHarmonizerStudio
            currentPitch={currentPitch}
            isListening={isListening}
          />
        )}

        {/* MODULE 3: AI Stem Separation & Vocal Extractor (Karaoke) */}
        {activeTab === 'stems' && <StemSeparationStudio />}

        {/* MODULE 4: Studio DSP & Acoustic Space Emulator */}
        {activeTab === 'dsp' && <StudioDSPEmulator />}

        {/* MODULE 5: Vocal Stamina & Breath Management Guide */}
        {activeTab === 'breath' && (
          <BreathStaminaGuide
            currentPitch={currentPitch}
            rms={rms}
            isListening={isListening}
            onStartListening={startListening}
            onStopListening={stopListening}
          />
        )}

        {/* TAB: Jins & Modulation Timeline Tracker */}
        {activeTab === 'jins' && (
          <JinsModulationTracker
            currentMaqam={selectedMaqam}
            jinsMatches={jinsMatches}
            modulationHistory={modulationHistory}
            isListening={isListening}
          />
        )}

        {/* TAB 3: Vocal Diagnostics, Registers & Orab */}
        {activeTab === 'diagnostics' && (
          <VocalDiagnostics
            fatigueMetrics={fatigueMetrics}
            registerStats={registerStats}
            orabCount={orabCount}
            currentPitch={currentPitch}
            isListening={isListening}
          />
        )}

        {/* TAB 4: Smart Melody Player & Vocal Backing Track Studio */}
        {activeTab === 'studio' && (
          <SmartMelodyStudio
            isListening={isListening}
            currentPitch={currentPitch}
            onStartListening={startListening}
            onStopListening={stopListening}
          />
        )}

        {/* TAB 5: Microtonal Ear-Training Drill & Sing-It-Back Module */}
        {activeTab === 'ear' && (
          <EarTrainingDrill
            currentPitch={currentPitch}
            isListening={isListening}
            onStartListening={startListening}
            onStopListening={stopListening}
          />
        )}

        {/* TAB 6: Vocal Practice & Performance Evaluation */}
        {activeTab === 'coach' && (
          <PracticeCoach
            currentMaqam={selectedMaqam}
            isListening={isListening}
            currentPitch={currentPitch}
            onStartListening={startListening}
            onStopListening={stopListening}
          />
        )}

        {/* TAB 5: Audio Import & Song Analysis Hub */}
        {activeTab === 'import' && <AudioImportHub />}

        {/* TAB 6: Virtual Arabic Oud & Microtonal Piano with Vocal Range */}
        {activeTab === 'instruments' && (
          <VirtualInstruments
            currentMaqam={selectedMaqam}
            currentPitch={currentPitch}
            isListening={isListening}
            onStartListening={startListening}
            onStopListening={stopListening}
          />
        )}

        {/* TAB 7: Drone & Arabic Iqa' Rhythm Machine */}
        {activeTab === 'drone' && <DroneMetronome />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">MaqamFlow & Vocal Coach</span>
            <span>•</span>
            <span>24-TET Arabic Microtonality & AI Audio Analysis</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>مقام بياتي • راست • حجاز • صبا • سيكاه • نهاوند • كرد • عجم</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
