import React, { useState } from 'react';
import { useStore, type TimerMode } from '../store/useStore';
import { Play, Pause, SkipForward, RotateCcw, Plus, Minus, SlidersHorizontal, X, Check } from 'lucide-react';

export const TimerCenter: React.FC = () => {
  const mode = useStore((s) => s.mode);
  const remainingSeconds = useStore((s) => s.remainingSeconds);
  const durationSeconds = useStore((s) => s.durationSeconds);
  const isRunning = useStore((s) => s.isRunning);
  const tasks = useStore((s) => s.tasks);
  const activeTaskId = useStore((s) => s.activeTaskId);
  const timerDurations = useStore((s) => s.timerDurations);
  const setBreakDuration = useStore((s) => s.setBreakDuration);

  const setTimerMode = useStore((s) => s.setTimerMode);
  const startTimer = useStore((s) => s.startTimer);
  const pauseTimer = useStore((s) => s.pauseTimer);
  const resetTimer = useStore((s) => s.resetTimer);
  const adjustTime = useStore((s) => s.adjustTime);
  const skipTimer = useStore((s) => s.skipTimer);
  const setFocusDuration = useStore((s) => s.setFocusDuration);

  const activeTask = tasks.find((t) => t.id === activeTaskId) || tasks[0];
  const focusMins = Math.max(
    1,
    Math.round(
      (mode === 'FOCUS'
        ? (durationSeconds > 0 ? durationSeconds : 25 * 60)
        : (activeTask?.dailyTargetMinutes ? activeTask.dailyTargetMinutes * 60 : timerDurations.FOCUS || 25 * 60)
      ) / 60
    )
  );
  const shortBreakMins = Math.round(timerDurations.SHORT_BREAK / 60);
  const longBreakMins = Math.round(timerDurations.LONG_BREAK / 60);

  // Interval Duration Editing State
  const [isBreakSettingsOpen, setIsBreakSettingsOpen] = useState(false);
  const [tempFocusMins, setTempFocusMins] = useState(focusMins);
  const [tempShortMins, setTempShortMins] = useState(shortBreakMins);
  const [tempLongMins, setTempLongMins] = useState(longBreakMins);

  const openBreakSettings = () => {
    setTempFocusMins(focusMins);
    setTempShortMins(shortBreakMins);
    setTempLongMins(longBreakMins);
    setIsBreakSettingsOpen(true);
  };

  const handleSaveBreakDurations = (e: React.FormEvent) => {
    e.preventDefault();
    setFocusDuration(tempFocusMins);
    setBreakDuration('SHORT_BREAK', tempShortMins);
    setBreakDuration('LONG_BREAK', tempLongMins);
    setIsBreakSettingsOpen(false);
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Circular Gauge Math
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = durationSeconds > 0 ? (durationSeconds - remainingSeconds) / durationSeconds : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const modeThemes: Record<TimerMode, {
    stroke: string;
    bgPill: string;
    label: string;
  }> = {
    FOCUS: {
      stroke: '#3157f6', // Tercelet brand blue
      bgPill: 'text-tercelet-brand bg-tercelet-brandSoft',
      label: 'Focus Block',
    },
    SHORT_BREAK: {
      stroke: '#10b981', // Clean Emerald
      bgPill: 'text-emerald-700 bg-emerald-50',
      label: 'Short Break',
    },
    LONG_BREAK: {
      stroke: '#6366f1', // Indigo
      bgPill: 'text-indigo-700 bg-indigo-50',
      label: 'Extended Rest',
    },
  };

  const currentTheme = modeThemes[mode];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Mode Switcher Pills */}
      <div className="flex items-center flex-wrap justify-center gap-1.5 p-1.5 rounded-2xl bg-black/[0.04] border border-black/[0.06] mb-6">
        <button
          onClick={() => setTimerMode('FOCUS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all ${
            mode === 'FOCUS'
              ? 'bg-white text-[#111318] shadow-sm font-bold'
              : 'text-tercelet-muted hover:text-[#111318]'
          }`}
        >
          Focus ({focusMins}m)
        </button>
        <button
          onClick={() => setTimerMode('SHORT_BREAK')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all ${
            mode === 'SHORT_BREAK'
              ? 'bg-white text-[#111318] shadow-sm font-bold'
              : 'text-tercelet-muted hover:text-[#111318]'
          }`}
        >
          Short Break ({shortBreakMins}m)
        </button>
        <button
          onClick={() => setTimerMode('LONG_BREAK')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-tight transition-all ${
            mode === 'LONG_BREAK'
              ? 'bg-white text-[#111318] shadow-sm font-bold'
              : 'text-tercelet-muted hover:text-[#111318]'
          }`}
        >
          Long Break ({longBreakMins}m)
        </button>

        <button
          onClick={openBreakSettings}
          className="px-2.5 py-2 rounded-xl text-xs font-semibold text-tercelet-muted hover:text-[#111318] hover:bg-white/80 transition-all flex items-center gap-1 border border-transparent hover:border-black/10"
          title="Edit Interval Durations"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="text-[11px]">Intervals</span>
        </button>
      </div>

      {/* Tercelet White Chronometer Card */}
      <div className="w-full max-w-lg rounded-[28px] border border-black/10 bg-white p-7 sm:p-9 shadow-[0_20px_60px_rgba(17,19,24,0.06)] flex flex-col items-center relative overflow-hidden">
        
        {/* Circular SVG Chronometer */}
        <div className="relative flex items-center justify-center w-64 sm:w-72 h-64 sm:h-72 select-none">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 250 250">
            {/* Background Track */}
            <circle
              cx="125"
              cy="125"
              r={radius}
              className="stroke-black/[0.06]"
              strokeWidth="7"
              fill="none"
            />
            {/* Active Gauge Stroke */}
            <circle
              cx="125"
              cy="125"
              r={radius}
              stroke={currentTheme.stroke}
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
                transition: 'stroke-dashoffset 0.3s ease-out, stroke 0.4s ease',
              }}
            />
          </svg>

          {/* Center Digits & Labels */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight ${currentTheme.bgPill}`}>
                {currentTheme.label}
              </span>
              {mode !== 'FOCUS' && (
                <button
                  type="button"
                  onClick={openBreakSettings}
                  className="text-[10px] text-tercelet-muted hover:text-[#111318] underline font-medium cursor-pointer"
                  title="Change break duration"
                >
                  Edit
                </button>
              )}
            </div>

            {/* Prominent Tabular Numerals */}
            <div className="text-5xl sm:text-6xl font-bold tracking-[-0.04em] text-[#111318] font-mono tabular-nums my-1">
              {formattedTime}
            </div>

            {/* Current Target Chip */}
            {activeTask && (
              <div className="mt-2 max-w-[200px] px-3 py-1 rounded-full bg-[#f5f3ee] border border-black/[0.08] flex items-center gap-1.5 truncate">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: activeTask.colorHex || currentTheme.stroke }}
                />
                <span className="text-xs font-semibold text-[#111318] truncate">
                  {activeTask.title}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 mt-7">
          {/* -5 min */}
          <button
            onClick={() => adjustTime(-300)}
            className="h-11 w-11 rounded-xl border border-black/10 bg-[#fcfbf8] hover:bg-white hover:border-black/20 text-[#111318] flex items-center justify-center transition-all hover:-translate-y-0.5 shadow-sm"
            title="Subtract 5 Minutes"
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* Reset */}
          <button
            onClick={resetTimer}
            className="h-11 w-11 rounded-xl border border-black/10 bg-[#fcfbf8] hover:bg-white hover:border-black/20 text-[#111318] flex items-center justify-center transition-all hover:-translate-y-0.5 shadow-sm"
            title="Reset Clock"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Primary Action Button */}
          <button
            onClick={isRunning ? pauseTimer : startTimer}
            className={`h-11 px-6 sm:px-8 rounded-xl font-semibold text-sm tracking-tight flex items-center gap-2 transition-all hover:-translate-y-0.5 shadow-sm ${
              isRunning
                ? 'bg-[#111318] text-white hover:bg-black'
                : 'bg-tercelet-brand text-white hover:bg-tercelet-brandHover shadow-brand-btn'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Start Focus</span>
              </>
            )}
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-white font-mono text-[10px] font-bold">
              Space
            </span>
          </button>

          {/* Skip */}
          <button
            onClick={skipTimer}
            className="h-11 w-11 rounded-xl border border-black/10 bg-[#fcfbf8] hover:bg-white hover:border-black/20 text-[#111318] flex items-center justify-center transition-all hover:-translate-y-0.5 shadow-sm"
            title="Complete / Skip"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          {/* +5 min */}
          <button
            onClick={() => adjustTime(300)}
            className="h-11 w-11 rounded-xl border border-black/10 bg-[#fcfbf8] hover:bg-white hover:border-black/20 text-[#111318] flex items-center justify-center transition-all hover:-translate-y-0.5 shadow-sm"
            title="Add 5 Minutes"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Modal: Interval Settings */}
      {isBreakSettingsOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-[24px] border border-black/10 bg-white p-6 sm:p-7 shadow-[0_28px_80px_rgba(17,19,24,.15)] animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-black/[0.05] text-[#111318] flex items-center justify-center">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111318] tracking-tight">
                    Interval Settings
                  </h3>
                  <p className="text-xs text-tercelet-muted">
                    Customize focus session and break durations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBreakSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#111318] hover:bg-black/[0.05] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBreakDurations} className="space-y-3.5 overflow-y-auto pr-1">
              {/* Focus Duration Setting */}
              <div className="rounded-2xl border border-black/[0.08] p-4 bg-[#fcfbf8]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#111318] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Focus Duration
                  </label>
                  <span className="text-xs font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    {tempFocusMins} mins
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[25, 45, 60, 90].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setTempFocusMins(m)}
                      className={`py-1.5 rounded-xl text-xs font-medium text-center transition-all border ${
                        tempFocusMins === m
                          ? 'bg-[#111318] text-white border-[#111318] font-bold shadow-sm'
                          : 'bg-white text-tercelet-muted border-black/10 hover:border-black/20'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="180"
                    step="5"
                    value={tempFocusMins}
                    onChange={(e) => setTempFocusMins(Number(e.target.value))}
                    className="w-full accent-[#111318] cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={tempFocusMins}
                    onChange={(e) => setTempFocusMins(Math.max(1, Math.min(360, Number(e.target.value) || 1)))}
                    className="w-14 px-2 py-1 bg-white border border-black/15 rounded-lg text-xs font-mono font-bold text-center text-[#111318]"
                  />
                </div>
              </div>

              {/* Short Break Setting */}
              <div className="rounded-2xl border border-black/[0.08] p-4 bg-[#fcfbf8]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#111318] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Short Break Duration
                  </label>
                  <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {tempShortMins} mins
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[3, 5, 10, 15].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setTempShortMins(m)}
                      className={`py-1.5 rounded-xl text-xs font-medium text-center transition-all border ${
                        tempShortMins === m
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                          : 'bg-white text-tercelet-muted border-black/10 hover:border-black/20'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={tempShortMins}
                    onChange={(e) => setTempShortMins(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={tempShortMins}
                    onChange={(e) => setTempShortMins(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                    className="w-14 px-2 py-1 bg-white border border-black/15 rounded-lg text-xs font-mono font-bold text-center text-[#111318]"
                  />
                </div>
              </div>

              {/* Long Break Setting */}
              <div className="rounded-2xl border border-black/[0.08] p-4 bg-[#fcfbf8]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#111318] flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    Long Break Duration
                  </label>
                  <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {tempLongMins} mins
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[10, 15, 20, 30].map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setTempLongMins(m)}
                      className={`py-1.5 rounded-xl text-xs font-medium text-center transition-all border ${
                        tempLongMins === m
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm'
                          : 'bg-white text-tercelet-muted border-black/10 hover:border-black/20'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={tempLongMins}
                    onChange={(e) => setTempLongMins(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={tempLongMins}
                    onChange={(e) => setTempLongMins(Math.max(5, Math.min(60, Number(e.target.value) || 5)))}
                    className="w-14 px-2 py-1 bg-white border border-black/15 rounded-lg text-xs font-mono font-bold text-center text-[#111318]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setIsBreakSettingsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-tercelet-muted hover:text-[#111318]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#111318] px-5 py-2.5 text-xs font-semibold text-white hover:bg-black transition-all shadow-sm"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Intervals</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
