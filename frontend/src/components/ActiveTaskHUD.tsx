import React from 'react';
import { useStore } from '../store/useStore';
import { Bookmark, Clock, Target, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';

export const ActiveTaskHUD: React.FC = () => {
  const tasks = useStore((s) => s.tasks);
  const activeTaskId = useStore((s) => s.activeTaskId);

  const isRunning = useStore((s) => s.isRunning);
  const mode = useStore((s) => s.mode);
  const durationSeconds = useStore((s) => s.durationSeconds);
  const remainingSeconds = useStore((s) => s.remainingSeconds);
  const sessionRemainingAtStart = useStore((s) => s.sessionRemainingAtStart);

  const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null;

  if (!activeTask) {
    return (
      <div className="w-full tercelet-card p-6 text-center text-xs">
        {tasks.length > 0 ? (
          <div>
            <p className="font-semibold text-[#111318] mb-1">Generic Focus Session (Untracked)</p>
            <p className="text-tercelet-muted">Select or switch to a target in the Target Deck below to assign your focus session.</p>
          </div>
        ) : (
          <p className="font-mono text-tercelet-muted">No active target selected. Add one in the target deck.</p>
        )}
      </div>
    );
  }

  const targetMins = activeTask.dailyTargetMinutes;
  const isFocusingThis = isRunning && mode === 'FOCUS' && activeTaskId === activeTask.id;
  const startRem = sessionRemainingAtStart ?? durationSeconds;
  const liveSliceSeconds = isFocusingThis ? Math.max(0, startRem - remainingSeconds) : 0;
  const currentTotalSeconds = (activeTask.todayFocusSeconds || 0) + liveSliceSeconds;
  const actualMins = Math.floor(currentTotalSeconds / 60);
  const progressPct = targetMins > 0
    ? Math.min(100, Math.round((currentTotalSeconds / (targetMins * 60)) * 1000) / 10)
    : 0;
  const deficitOrSurplus = actualMins - targetMins;
  const isSurplus = deficitOrSurplus >= 0;

  const formatHoursMinutes = (totalMinutes: number) => {
    const hours = Math.floor(Math.abs(totalMinutes) / 60);
    const mins = Math.abs(totalMinutes) % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="w-full tercelet-card overflow-hidden">
      {/* Top Banner (Tercelet soft pastel header) */}
      <div className="p-4 sm:p-5 bg-[#f6f9fe] border-b border-black/[0.06]">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: activeTask.colorHex || '#3157f6' }}
            />
            <span className="text-xs font-bold text-tercelet-muted uppercase tracking-wider">
              Active Mission
            </span>
            <span className="rounded-md bg-white border border-black/10 px-2 py-0.5 text-[11px] font-semibold text-[#111318]">
              {activeTask.category}
            </span>
          </div>

          {/* Status Badge */}
          <div>
            {isSurplus ? (
              <span className="badge-proof">
                <CheckCircle2 className="h-3 w-3" />
                <span>+{formatHoursMinutes(deficitOrSurplus)} Surplus</span>
              </span>
            ) : (
              <span className="badge-coral">
                <AlertCircle className="h-3 w-3" />
                <span>-{formatHoursMinutes(deficitOrSurplus)} Deficit</span>
              </span>
            )}
          </div>
        </div>

        {/* Task Title with Editorial Flair */}
        <h2 className="text-xl sm:text-2xl font-bold tracking-[-0.03em] text-[#111318]">
          {activeTask.title}
        </h2>
      </div>

      {/* Main Body */}
      <div className="p-5 sm:p-6 space-y-5 bg-white">
        {/* Progress Bar & Telemetry */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-tercelet-muted mb-2">
            <span className="flex items-center gap-1.5 text-[#111318] font-semibold">
              <Target className="h-3.5 w-3.5 text-tercelet-brand" />
              <span>Daily Target:</span>
              <span className="text-tercelet-brand font-bold">{progressPct}%</span>
            </span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="h-3.5 w-3.5 text-tercelet-faint" />
              <span className="font-bold text-[#111318]">{formatHoursMinutes(actualMins)}</span>
              <span className="text-tercelet-faint">/</span>
              <span>{formatHoursMinutes(targetMins)}</span>
            </span>
          </div>

          {/* Segmented / Smooth Progress Bar */}
          <div className="h-2 w-full bg-black/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-tercelet-brand"
              style={{
                width: `${Math.min(100, progressPct)}%`,
              }}
            />
          </div>
        </div>

        {/* "Where I Left Off" Bookmark Card */}
        <div className="rounded-xl border border-black/[0.08] bg-[#fcfbf8] p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5 text-amber-600 fill-amber-500/20" />
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                Where I Left Off
              </span>
            </div>
            <button
              onClick={() =>
                useStore.setState({
                  isCheckpointPromptOpen: true,
                  promptPreviousTask: { id: activeTask.id, title: activeTask.title },
                })
              }
              className="text-[11px] font-semibold text-tercelet-brand hover:text-tercelet-brandHover flex items-center gap-1 transition-colors"
            >
              <Edit3 className="h-3 w-3" />
              <span>Update Note [C]</span>
            </button>
          </div>

          <p className="text-sm font-editorial italic text-tercelet-muted leading-relaxed pl-3 border-l-2 border-amber-400">
            "{activeTask.latestCheckpointNote || 'No bookmark recorded yet. Press C to leave a note before hot-switching.'}"
          </p>
        </div>
      </div>
    </div>
  );
};
