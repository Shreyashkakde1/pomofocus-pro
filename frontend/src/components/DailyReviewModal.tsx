import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  X,
  Sparkles,
  Zap,
  ThumbsUp,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react';

export const DailyReviewModal: React.FC = () => {
  const isDailyReviewOpen = useStore((s) => s.isDailyReviewOpen);
  const closeDailyReview = useStore((s) => s.closeDailyReview);
  const activePlannedDate = useStore((s) => s.activePlannedDate);
  const todayDebrief = useStore((s) => s.todayDebrief);
  const saveDailyDebrief = useStore((s) => s.saveDailyDebrief);
  const dailyTasks = useStore((s) => s.dailyTasks);
  const rolloverTasks = useStore((s) => s.rolloverTasks);

  const [whatWentWell, setWhatWentWell] = useState('');
  const [whatWentWrong, setWhatWentWrong] = useState('');
  const [energyRating, setEnergyRating] = useState<number>(4);
  const [tomorrowNotes, setTomorrowNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasRolledOver, setHasRolledOver] = useState(false);

  // Sync state when modal opens or todayDebrief loads
  useEffect(() => {
    if (isDailyReviewOpen) {
      if (todayDebrief) {
        setWhatWentWell(todayDebrief.whatWentWell || '');
        setWhatWentWrong(todayDebrief.whatWentWrong || '');
        setEnergyRating(todayDebrief.energyRating || 4);
        setTomorrowNotes(todayDebrief.tomorrowNotes || '');
      } else {
        setWhatWentWell('');
        setWhatWentWrong('');
        setEnergyRating(4);
        setTomorrowNotes('');
      }
      setIsSaved(false);
      setHasRolledOver(false);
    }
  }, [isDailyReviewOpen, todayDebrief]);

  if (!isDailyReviewOpen) return null;

  const totalTasks = dailyTasks.length;
  const completedTasks = dailyTasks.filter((t) => t.isCompleted).length;
  const pendingTasks = dailyTasks.filter((t) => !t.isCompleted);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate tomorrow's date string
  const getTomorrowDate = () => {
    const d = new Date(activePlannedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const tomorrowDateStr = getTomorrowDate();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveDailyDebrief({
        debriefDate: activePlannedDate,
        whatWentWell,
        whatWentWrong,
        energyRating,
        tomorrowNotes,
      });
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        closeDailyReview();
      }, 900);
    } catch (err) {
      console.error('Failed to save debrief:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRolloverIncomplete = async () => {
    if (pendingTasks.length === 0) return;
    try {
      await rolloverTasks(
        activePlannedDate,
        tomorrowDateStr,
        pendingTasks.map((t) => t.id)
      );
      setHasRolledOver(true);
    } catch (err) {
      console.error('Failed to rollover tasks:', err);
    }
  };

  const ENERGY_LABELS: Record<number, { label: string; color: string; desc: string }> = {
    1: { label: 'Exhausted', color: 'text-red-600 bg-red-50 border-red-200', desc: 'Frequent distractions or burnout' },
    2: { label: 'Sluggish', color: 'text-amber-600 bg-amber-50 border-amber-200', desc: 'Felt slow, hard to initiate tasks' },
    3: { label: 'Steady', color: 'text-blue-600 bg-blue-50 border-blue-200', desc: 'Consistent pace and stable focus' },
    4: { label: 'High Focus', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: 'Productive sessions with minimal interruptions' },
    5: { label: 'Peak Flow', color: 'text-purple-700 bg-purple-50 border-purple-200', desc: 'Zone state, creative breakthrough' },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#f5f3ee] rounded-2xl shadow-2xl border border-black/10 overflow-hidden my-8 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-black/[0.08] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-tercelet-brandSoft text-tercelet-brand flex items-center justify-center font-bold shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#111318] tracking-tight">
                  End-of-Day Review & Reflection
                </h2>
                <span className="badge-proof text-[10px] py-0 px-2 font-mono">
                  [R]
                </span>
              </div>
              <p className="text-xs text-tercelet-muted flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-3 w-3" />
                <span>Planned Date: {activePlannedDate}</span>
              </p>
            </div>
          </div>
          <button
            onClick={closeDailyReview}
            className="p-2 text-slate-400 hover:text-[#111318] rounded-xl hover:bg-black/5 transition-colors"
            title="Close [Esc]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6">
          {/* Metrics Snapshot Bar */}
          <div className="p-4 rounded-xl bg-white border border-black/[0.08] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-tercelet-muted">
                Today's Task Completion
              </div>
              <div className="text-lg font-bold text-[#111318] flex items-center gap-2 mt-0.5">
                <span>
                  {completedTasks} of {totalTasks} tasks completed
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-tercelet-brandSoft text-tercelet-brand font-mono">
                  {completionRate}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full sm:w-48">
              <div className="h-2.5 w-full bg-black/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-tercelet-brand rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
              <div className="text-[10px] text-tercelet-muted text-right mt-1 font-mono">
                {pendingTasks.length} pending
              </div>
            </div>
          </div>

          {/* Energy & Focus Rating */}
          <div>
            <label className="block text-xs font-bold text-[#111318] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Energy & Focus State</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const isSelected = energyRating === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergyRating(lvl)}
                    className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'border-[#111318] bg-white shadow-sm ring-2 ring-tercelet-brand/40 font-bold scale-[1.02]'
                        : 'border-black/10 bg-white/70 hover:bg-white text-tercelet-muted hover:border-black/20'
                    }`}
                  >
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: lvl }).map((_, i) => (
                        <Zap
                          key={i}
                          className={`h-3 w-3 ${
                            isSelected ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-[10px] mt-1 font-semibold ${
                        isSelected ? 'text-[#111318]' : 'text-tercelet-muted'
                      }`}
                    >
                      {ENERGY_LABELS[lvl]?.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-tercelet-muted mt-1.5 font-sans italic">
              {ENERGY_LABELS[energyRating]?.desc}
            </p>
          </div>

          {/* Prompt 1: What went well */}
          <div>
            <label className="block text-xs font-bold text-[#111318] mb-1.5 flex items-center gap-1.5">
              <ThumbsUp className="h-3.5 w-3.5 text-emerald-600" />
              <span>What went well today? (Wins, Milestones, Flow States)</span>
            </label>
            <textarea
              rows={3}
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              placeholder="e.g. Cleared P0 mandatory task before noon; maintained unbroken deep focus during the 90m block; resisted checking slack..."
              className="w-full text-xs sm:text-sm rounded-xl border border-black/10 p-3 bg-white text-[#111318] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand focus:border-transparent transition-all resize-none shadow-sm"
            />
          </div>

          {/* Prompt 2: What went wrong / Blockers */}
          <div>
            <label className="block text-xs font-bold text-[#111318] mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>What went wrong or felt blocked? (Distractions, Friction, Fatigue)</span>
            </label>
            <textarea
              rows={3}
              value={whatWentWrong}
              onChange={(e) => setWhatWentWrong(e.target.value)}
              placeholder="e.g. Lost 45 minutes down a rabbit hole in docs; skipped the afternoon break and felt sluggish; overestimated speed on P1..."
              className="w-full text-xs sm:text-sm rounded-xl border border-black/10 p-3 bg-white text-[#111318] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand focus:border-transparent transition-all resize-none shadow-sm"
            />
          </div>

          {/* Prompt 3: Tomorrow's Game Plan */}
          <div>
            <label className="block text-xs font-bold text-[#111318] mb-1.5 flex items-center gap-1.5">
              <ArrowRight className="h-3.5 w-3.5 text-tercelet-brand" />
              <span>Strategy & Key Priorities for Tomorrow</span>
            </label>
            <textarea
              rows={2}
              value={tomorrowNotes}
              onChange={(e) => setTomorrowNotes(e.target.value)}
              placeholder="e.g. Start day immediately with P0 mission; silence phone notifications before 10 AM..."
              className="w-full text-xs sm:text-sm rounded-xl border border-black/10 p-3 bg-white text-[#111318] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand focus:border-transparent transition-all resize-none shadow-sm"
            />
          </div>

          {/* Incomplete Task Rollover Assistant */}
          {pendingTasks.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <RotateCcw className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900">
                    {pendingTasks.length} Incomplete Task{pendingTasks.length > 1 ? 's' : ''} Remaining
                  </div>
                  <div className="text-[11px] text-amber-700">
                    Move them automatically to tomorrow ({tomorrowDateStr})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRolloverIncomplete}
                disabled={hasRolledOver}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto ${
                  hasRolledOver
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100 shadow-sm'
                }`}
              >
                {hasRolledOver ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Rolled Over to Tomorrow</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
                    <span>Rollover to Tomorrow</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-black/[0.08] flex items-center justify-between">
            <button
              type="button"
              onClick={closeDailyReview}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-tercelet-muted hover:text-[#111318] hover:bg-black/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-10 px-5 rounded-xl bg-tercelet-brand hover:bg-tercelet-brandHover text-white text-xs font-bold flex items-center gap-2 shadow-brand-btn transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Review Saved!</span>
                </>
              ) : isSaving ? (
                <span>Saving reflection...</span>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

