import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import {
  X,
  Download,
  Target,
  Flame,
  GitCommit,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  BookOpen,
  Sparkles,
  Zap,
  ThumbsUp,
  AlertTriangle,
  ArrowRight,
  Calendar,
} from 'lucide-react';

export const AnalyticsDrawer: React.FC = () => {
  const isAnalyticsOpen = useStore((s) => s.isAnalyticsOpen);
  const closeAnalytics = useStore((s) => s.closeAnalytics);
  const dailyReport = useStore((s) => s.dailyReport);
  const weeklyReport = useStore((s) => s.weeklyReport);
  const isLoading = useStore((s) => s.isLoadingReport);
  const debriefHistory = useStore((s) => s.debriefHistory);
  const fetchDebriefHistory = useStore((s) => s.fetchDebriefHistory);
  const openDailyReview = useStore((s) => s.openDailyReview);

  const [activeTab, setActiveTab] = useState<'METRICS' | 'JOURNAL'>('METRICS');

  useEffect(() => {
    if (isAnalyticsOpen) {
      fetchDebriefHistory();
    }
  }, [isAnalyticsOpen, fetchDebriefHistory]);

  if (!isAnalyticsOpen) return null;

  const handleExportCsv = () => {
    window.open(api.reports.getExportUrl(), '_blank');
  };

  const formatHoursMinutes = (totalMinutes: number) => {
    const hours = Math.floor(Math.abs(totalMinutes) / 60);
    const mins = Math.abs(totalMinutes) % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const formatSecondsToHM = (totalSecs: number) => {
    const mins = Math.round(totalSecs / 60);
    return formatHoursMinutes(mins);
  };

  const ENERGY_LABELS: Record<number, string> = {
    1: 'Exhausted',
    2: 'Sluggish',
    3: 'Steady',
    4: 'High Focus',
    5: 'Peak Flow',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-xl w-full bg-[#f5f3ee] border-l border-black/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-black/[0.08] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-tercelet-brandSoft text-tercelet-brand flex items-center justify-center font-bold">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111318] tracking-tight">
                Focus Statistics & Analytics
              </h2>
              <p className="text-xs text-tercelet-muted">
                Target vs Actual • Hot-switch timeline • Daily Reflections
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="h-9 px-3.5 rounded-xl border border-black/10 hover:border-black/25 text-[#111318] text-xs font-semibold flex items-center gap-1.5 transition-colors bg-white shadow-sm"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={closeAnalytics}
              className="p-2 text-slate-400 hover:text-[#111318] rounded-xl hover:bg-black/5 transition-colors"
              title="Close Drawer [Esc]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 pt-3 bg-white border-b border-black/[0.08] flex items-center gap-4">
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'METRICS'
                ? 'border-tercelet-brand text-tercelet-brand'
                : 'border-transparent text-tercelet-muted hover:text-[#111318]'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Focus Telemetry</span>
          </button>
          <button
            onClick={() => setActiveTab('JOURNAL')}
            className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'JOURNAL'
                ? 'border-tercelet-brand text-tercelet-brand'
                : 'border-transparent text-tercelet-muted hover:text-[#111318]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Reflection Journal</span>
            {debriefHistory.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/[0.06] text-[#111318]">
                {debriefHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'METRICS' ? (
            isLoading && !dailyReport ? (
              <div className="text-center py-16 text-tercelet-muted font-mono text-xs animate-pulse">
                Streaming focus data from PostgreSQL engine...
              </div>
            ) : dailyReport ? (
              <>
                {/* Quick Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-sm">
                    <div className="text-[10px] font-bold text-tercelet-muted uppercase tracking-wider">
                      Target
                    </div>
                    <div className="text-xl font-bold font-mono text-[#111318] mt-1">
                      {formatHoursMinutes(dailyReport.totalTargetMinutes)}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-sm">
                    <div className="text-[10px] font-bold text-tercelet-brand uppercase tracking-wider">
                      Actual Focus
                    </div>
                    <div className="text-xl font-bold font-mono text-tercelet-brand mt-1">
                      {formatHoursMinutes(dailyReport.totalActualMinutes)}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-sm">
                    <div className="text-[10px] font-bold text-tercelet-muted uppercase tracking-wider">
                      Status
                    </div>
                    <div className="mt-1">
                      {dailyReport.totalDeficitOrSurplusMinutes >= 0 ? (
                        <span className="badge-proof">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>+{formatHoursMinutes(dailyReport.totalDeficitOrSurplusMinutes)}</span>
                        </span>
                      ) : (
                        <span className="badge-coral">
                          <AlertCircle className="h-3 w-3" />
                          <span>-{formatHoursMinutes(dailyReport.totalDeficitOrSurplusMinutes)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-sm">
                    <div className="text-[10px] font-bold text-tercelet-muted uppercase tracking-wider">
                      Hot Switches
                    </div>
                    <div className="text-xl font-bold font-mono text-[#111318] mt-1 flex items-center gap-1">
                      <GitCommit className="h-4 w-4 text-tercelet-muted" />
                      <span>{dailyReport.contextSwitchCount}</span>
                    </div>
                  </div>
                </div>

                {/* Overall Completion Dial Bar */}
                <div className="p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#111318]">Total Daily Budget Completion</span>
                    <span className="text-tercelet-brand font-bold">
                      {dailyReport.overallCompletionPercentage}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-black/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-tercelet-brand rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, dailyReport.overallCompletionPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Breakdown by Target Task */}
                <div>
                  <h3 className="text-xs font-bold text-[#111318] tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-tercelet-muted" />
                    <span>Target vs Actual Breakdown</span>
                  </h3>
                  <div className="space-y-2.5">
                    {dailyReport.taskBreakdown.map((item) => (
                      <div
                        key={item.taskId}
                        className="p-3.5 rounded-xl bg-white border border-black/[0.08] space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: item.colorHex }}
                            />
                            <span className="text-xs font-bold text-[#111318]">{item.title}</span>
                          </div>
                          <span className="text-xs font-mono text-tercelet-muted">
                            {item.actualMinutes}m / {item.targetMinutes}m{' '}
                            <span className="text-tercelet-brand font-bold">
                              ({item.completionPercentage}%)
                            </span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-black/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, item.completionPercentage)}%`,
                              backgroundColor: item.colorHex,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 7-Day Consistency Trend */}
                {weeklyReport && (
                  <div>
                    <h3 className="text-xs font-bold text-[#111318] tracking-wider uppercase mb-3 flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-amber-500" />
                      <span>
                        7-Day Consistency:{' '}
                        <span className="text-tercelet-brand font-bold">
                          {weeklyReport.consistencyScore}%
                        </span>
                      </span>
                    </h3>
                    <div className="grid grid-cols-7 gap-2">
                      {weeklyReport.dailyTrends.map((trend) => (
                        <div
                          key={trend.date}
                          className="p-2.5 rounded-xl bg-white border border-black/[0.08] text-center shadow-sm"
                        >
                          <div className="text-[10px] text-tercelet-muted font-mono">
                            {trend.date.slice(5)}
                          </div>
                          <div className="text-xs font-bold text-[#111318] mt-1 font-mono">
                            {trend.actualMinutes}m
                          </div>
                          <div
                            className={`h-1 w-full rounded-full mt-2 ${
                              trend.completionPercentage >= 90
                                ? 'bg-tercelet-proof'
                                : trend.completionPercentage > 0
                                ? 'bg-tercelet-brand'
                                : 'bg-black/[0.08]'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chronological Focus Timeline */}
                <div>
                  <h3 className="text-xs font-bold text-[#111318] tracking-wider uppercase mb-3 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-tercelet-muted" />
                    <span>Session Timeline ({dailyReport.timeline.length} blocks)</span>
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {dailyReport.timeline.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-xl bg-white border border-black/[0.08] flex items-center justify-between text-xs shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: session.taskColorHex || '#64748b' }}
                          />
                          <span className="text-[#111318] font-semibold">{session.taskTitle}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/[0.05] text-tercelet-muted">
                            {session.sessionType}
                          </span>
                        </div>
                        <span className="font-mono text-tercelet-muted">
                          {Math.round(session.durationSeconds / 60)}m ({session.durationSeconds}s)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-tercelet-muted font-mono text-xs">
                No statistics recorded for today yet.
              </div>
            )
          ) : (
            /* Reflection Journal Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#111318] uppercase tracking-wider">
                    Daily Reflection Logs
                  </h3>
                  <p className="text-[11px] text-tercelet-muted">
                    End-of-day reviews, energy trends, and wins
                  </p>
                </div>
                <button
                  onClick={() => {
                    closeAnalytics();
                    openDailyReview();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-tercelet-brand hover:bg-tercelet-brandHover text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Write Review [R]</span>
                </button>
              </div>

              {debriefHistory.length > 0 ? (
                <div className="space-y-4">
                  {debriefHistory.map((debrief) => (
                    <div
                      key={debrief.id}
                      className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-sm space-y-3"
                    >
                      {/* Reflection Header */}
                      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-tercelet-brand" />
                          <span className="text-xs font-bold text-[#111318] font-mono">
                            {debrief.debriefDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/[0.05] text-tercelet-muted">
                            {formatSecondsToHM(debrief.totalFocusSecondsSnapshot)} focused
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {debrief.tasksCompletedCount}/{debrief.tasksTotalCount} tasks
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                            <span>{ENERGY_LABELS[debrief.energyRating] || debrief.energyRating}</span>
                          </span>
                        </div>
                      </div>

                      {/* What went well */}
                      {debrief.whatWentWell && (
                        <div>
                          <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 mb-0.5">
                            <ThumbsUp className="h-3 w-3 text-emerald-600" />
                            <span>What Went Well</span>
                          </div>
                          <p className="text-xs text-slate-700 bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100 whitespace-pre-wrap">
                            {debrief.whatWentWell}
                          </p>
                        </div>
                      )}

                      {/* What went wrong */}
                      {debrief.whatWentWrong && (
                        <div>
                          <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1 mb-0.5">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            <span>What Went Wrong / Blockers</span>
                          </div>
                          <p className="text-xs text-slate-700 bg-amber-50/40 p-2.5 rounded-lg border border-amber-100 whitespace-pre-wrap">
                            {debrief.whatWentWrong}
                          </p>
                        </div>
                      )}

                      {/* Tomorrow's Strategy */}
                      {debrief.tomorrowNotes && (
                        <div>
                          <div className="text-[11px] font-bold text-tercelet-brand flex items-center gap-1 mb-0.5">
                            <ArrowRight className="h-3 w-3 text-tercelet-brand" />
                            <span>Strategy for Tomorrow</span>
                          </div>
                          <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 whitespace-pre-wrap">
                            {debrief.tomorrowNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 rounded-2xl bg-white border border-black/[0.08] shadow-sm">
                  <div className="h-10 w-10 mx-auto rounded-xl bg-tercelet-brandSoft text-tercelet-brand flex items-center justify-center font-bold mb-3">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#111318]">No reflection reviews recorded yet</h4>
                  <p className="text-xs text-tercelet-muted mt-1 max-w-sm mx-auto">
                    At the end of your workday, take 2 minutes to review what went well and what went wrong to build unbreakable momentum.
                  </p>
                  <button
                    onClick={() => {
                      closeAnalytics();
                      openDailyReview();
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-tercelet-brand hover:bg-tercelet-brandHover text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-brand-btn transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Review Today's Work</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
