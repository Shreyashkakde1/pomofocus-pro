import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useTimerWorker } from './hooks/useTimerWorker';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Header } from './components/Header';
import { TimerCenter } from './components/TimerCenter';
import { ActiveTaskHUD } from './components/ActiveTaskHUD';
import { TaskDeck } from './components/TaskDeck';
import { TodayTaskBoard } from './components/TodayTaskBoard';
import { DailyReviewModal } from './components/DailyReviewModal';
import { ContextCheckpointPrompt } from './components/ContextCheckpointPrompt';
import { AnalyticsDrawer } from './components/AnalyticsDrawer';
import { AuthModal } from './components/AuthModal';

export const App: React.FC = () => {
  const loadCurrentUser = useStore((s) => s.loadCurrentUser);

  useTimerWorker();
  useKeyboardShortcuts();

  useEffect(() => {
    loadCurrentUser();

    // Persist exact timer state right before page refresh or unload
    const handleBeforeUnload = () => {
      const s = useStore.getState();
      try {
        localStorage.setItem(
          'pomopro_active_timer',
          JSON.stringify({
            mode: s.mode,
            remainingSeconds: s.remainingSeconds,
            durationSeconds: s.durationSeconds,
            activeTaskId: s.activeTaskId,
            focusRemainingByTask: s.focusRemainingByTask,
            savedAt: Date.now(),
          })
        );
      } catch (e) {}
    };

    // After waking from sleep the first /auth/me can fail before the network is back;
    // retry the stored session once connectivity returns instead of dropping it.
    const handleOnline = () => {
      const s = useStore.getState();
      if (s.token && !s.user) loadCurrentUser();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleOnline);
    };
  }, [loadCurrentUser]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ee] text-[#111318]">
      {/* Top Header */}
      <Header />

      {/* Main Workspace */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Editorial Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-[#111318]">
            Focus on what matters,{' '}
            <span className="font-editorial font-normal italic text-tercelet-brand">
              one session at a time.
            </span>
          </h1>
          <p className="mt-2 text-sm text-tercelet-muted leading-relaxed">
            Daily time budgets per target, instant hot-switching with keys <span className="font-mono font-semibold text-[#111318]">[1-9]</span>, and daily task matrix below.
          </p>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Chronometer & Active Mission Telemetry */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-6">
            <TimerCenter />
            <ActiveTaskHUD />
          </div>

          {/* Right Column: Target Deck (Top) & Today's Plan (Below) */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            {/* 1. Target Deck (Top - Primary focus budgets & hot-switching) */}
            <div className="tercelet-card p-6 sm:p-7 bg-white">
              <TaskDeck />
            </div>

            {/* 2. Today's Plan (Below Target Deck - Minimal daily matrix & review) */}
            <div className="tercelet-card p-6 sm:p-7 bg-white">
              <TodayTaskBoard />
            </div>
          </div>
        </div>
      </main>

      {/* Editorial Footer */}
      <footer className="w-full border-t border-black/[0.08] bg-[#f5f3ee] py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-tercelet-muted">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex shrink-0 items-center justify-center rounded-md font-bold bg-[#111318] text-white h-5 w-5 text-[10px]">
              P
              <span className="absolute inset-y-1 right-0.5 w-0.5 rounded-full bg-tercelet-proof"></span>
            </span>
            <span className="font-semibold text-[#111318]">Pomofocus Pro</span>
            <span>— Precision focus statistics</span>
          </div>

          {/* Hotkey Chips */}
          <div className="flex items-center flex-wrap justify-center gap-1.5 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded-md bg-white border border-black/10 text-slate-700">
              <kbd className="font-bold text-[#111318]">[Space]</kbd> Play/Pause
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-black/10 text-slate-700">
              <kbd className="font-bold text-[#111318]">[1-9]</kbd> Hot-Switch
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-black/10 text-slate-700">
              <kbd className="font-bold text-amber-700">[C]</kbd> Bookmark Note
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-black/10 text-slate-700">
              <kbd className="font-bold text-tercelet-brand">[A]</kbd> Statistics
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-black/10 text-slate-700">
              <kbd className="font-bold text-emerald-700">[T]</kbd> Quick Add
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-black/10 text-slate-700">
              <kbd className="font-bold text-purple-700">[R]</kbd> Daily Review
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-black/10 text-slate-700">
              <kbd className="font-bold text-slate-600">[M]</kbd> SFX
            </span>
          </div>
        </div>
      </footer>

      {/* Overlays */}
      <ContextCheckpointPrompt />
      <AnalyticsDrawer />
      <DailyReviewModal />
      <AuthModal />
    </div>
  );
};

export default App;
