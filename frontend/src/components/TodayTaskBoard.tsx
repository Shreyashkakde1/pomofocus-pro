import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { PriorityTier } from '../api/client';
import { soundEffects } from '../utils/soundEffects';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowUpRight,
  RotateCcw,
  GripVertical,
  Inbox,
  Target,
} from 'lucide-react';

interface TierConfig {
  key: PriorityTier;
  label: string;
  badgeLabel: string;
  dotColor: string;
  badgeClasses: string;
  desc: string;
}

const TIERS: TierConfig[] = [
  {
    key: 'INBOX',
    label: 'No Priority',
    badgeLabel: 'No Priority',
    dotColor: 'bg-slate-400',
    badgeClasses: 'text-slate-700 bg-slate-100 border-slate-200/80',
    desc: 'Tasks with no priority assigned.',
  },
  {
    key: 'MANDATORY',
    label: 'P0',
    badgeLabel: 'P0',
    dotColor: 'bg-red-500',
    badgeClasses: 'text-red-700 bg-red-50 border-red-200/60',
    desc: 'Critical & urgent missions.',
  },
  {
    key: 'PRIORITY',
    label: 'P1',
    badgeLabel: 'P1',
    dotColor: 'bg-amber-500',
    badgeClasses: 'text-amber-700 bg-amber-50 border-amber-200/60',
    desc: 'High impact tasks.',
  },
  {
    key: 'NEED_TO_COMPLETE',
    label: 'P2',
    badgeLabel: 'P2',
    dotColor: 'bg-blue-500',
    badgeClasses: 'text-blue-700 bg-blue-50 border-blue-200/60',
    desc: 'Standard deliverables.',
  },
  {
    key: 'IF_GOT_TIME',
    label: 'P3',
    badgeLabel: 'P3',
    dotColor: 'bg-slate-400',
    badgeClasses: 'text-slate-600 bg-slate-100 border-slate-200/80',
    desc: 'Nice to have if time permits.',
  },
];

export const TodayTaskBoard: React.FC = () => {
  const dailyTasks = useStore((s) => s.dailyTasks);
  const activePlannedDate = useStore((s) => s.activePlannedDate);
  const setActivePlannedDate = useStore((s) => s.setActivePlannedDate);
  const createDailyTask = useStore((s) => s.createDailyTask);
  const updateDailyTask = useStore((s) => s.updateDailyTask);
  const toggleDailyTask = useStore((s) => s.toggleDailyTask);
  const deleteDailyTask = useStore((s) => s.deleteDailyTask);
  const rolloverTasks = useStore((s) => s.rolloverTasks);
  const tasks = useStore((s) => s.tasks);
  const hotSwitchTask = useStore((s) => s.hotSwitchTask);
  const openDailyReview = useStore((s) => s.openDailyReview);

  // Quick-Add Universal Bar State
  const quickInputRef = useRef<HTMLInputElement>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTier, setQuickTier] = useState<PriorityTier>('INBOX');
  const [quickTargetId, setQuickTargetId] = useState<string>('');

  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTier, setDragOverTier] = useState<PriorityTier | null>(null);

  // 1-Click Triage Menu State
  const [activeTriageTaskId, setActiveTriageTaskId] = useState<string | null>(null);

  // Collapsible Tiers State
  const [collapsedTiers, setCollapsedTiers] = useState<Record<string, boolean>>({});

  const toggleTierCollapse = (tierKey: string) => {
    setCollapsedTiers((prev) => ({ ...prev, [tierKey]: !prev[tierKey] }));
  };

  // Date Formatting Helpers
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const isToday = activePlannedDate === getTodayStr();

  const handleShiftDate = (offsetDays: number) => {
    const parts = activePlannedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setActivePlannedDate(`${y}-${m}-${day}`);
  };

  const formatDisplayDate = (dateStr: string) => {
    const parts = dateStr.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isCurrent = d.getTime() === today.getTime();
    const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
    const month = d.toLocaleDateString(undefined, { month: 'short' });
    const dayNum = d.getDate();

    if (isCurrent) return `Today, ${month} ${dayNum}`;
    return `${weekday}, ${month} ${dayNum}`;
  };

  // Universal Quick-Add with Shorthand #p0-#p3 Parsing
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let title = quickTitle.trim();
    if (!title) return;

    let tierToUse = quickTier;

    // Smart Shorthand: #p0, #p1, #p2, #p3
    const tagMatch = title.match(/#(p0|p1|p2|p3|none|inbox)/i);
    if (tagMatch) {
      const tag = tagMatch[1].toLowerCase();
      if (tag === 'p0') tierToUse = 'MANDATORY';
      else if (tag === 'p1') tierToUse = 'PRIORITY';
      else if (tag === 'p2') tierToUse = 'NEED_TO_COMPLETE';
      else if (tag === 'p3') tierToUse = 'IF_GOT_TIME';
      else if (tag === 'none' || tag === 'inbox') tierToUse = 'INBOX';
      title = title.replace(tagMatch[0], '').trim();
    }

    try {
      await createDailyTask(
        title,
        tierToUse,
        0, // No time estimation required for daily tasks
        quickTargetId ? quickTargetId : null
      );
      setQuickTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and Drop Handling
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, tier: PriorityTier) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTier !== tier) {
      setDragOverTier(tier);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverTier(null);
  };

  const handleDrop = async (e: React.DragEvent, targetTier: PriorityTier) => {
    e.preventDefault();
    setDragOverTier(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    const task = dailyTasks.find((t) => t.id === taskId);
    if (!task || task.priorityTier === targetTier) return;

    try {
      soundEffects.playHotSwitchClick();
      await updateDailyTask(taskId, { priorityTier: targetTier });
    } catch (err) {
      console.error(err);
    }
  };

  // 1-Click Triage Menu Handler
  const handleMoveTier = async (taskId: string, targetTier: PriorityTier) => {
    setActiveTriageTaskId(null);
    try {
      soundEffects.playHotSwitchClick();
      await updateDailyTask(taskId, { priorityTier: targetTier });
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations
  const completedTasks = dailyTasks.filter((t) => t.isCompleted);

  // Past date rollover
  const isPastDate = activePlannedDate < getTodayStr();
  const pastIncompleteCount = dailyTasks.filter((t) => !t.isCompleted).length;

  const handleRolloverAll = async () => {
    try {
      await rolloverTasks(activePlannedDate, getTodayStr());
      setActivePlannedDate(getTodayStr());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Board Header: Minimal & Clean */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.08] pb-4">
        {/* Left: Title & Date Navigator */}
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-base font-bold tracking-tight text-[#111318]">
              Today's Plan
            </h3>
            <p className="text-xs text-tercelet-muted mt-0.5">
              {completedTasks.length} of {dailyTasks.length} completed
            </p>
          </div>

          {/* Date Selector Pill */}
          <div className="inline-flex items-center rounded-xl border border-black/10 bg-[#fcfbf8] p-0.5 shadow-sm ml-1">
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-1 rounded-lg text-slate-400 hover:text-[#111318] hover:bg-black/[0.05] transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 text-xs font-semibold text-[#111318] font-mono flex items-center gap-1">
              <Calendar className="h-3 w-3 text-tercelet-brand" />
              <span>{formatDisplayDate(activePlannedDate)}</span>
            </span>
            <button
              onClick={() => handleShiftDate(1)}
              className="p-1 rounded-lg text-slate-400 hover:text-[#111318] hover:bg-black/[0.05] transition-colors"
              title="Next Day"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={() => setActivePlannedDate(getTodayStr())}
              className="text-[11px] font-semibold text-tercelet-brand hover:underline"
            >
              Today
            </button>
          )}
        </div>

        {/* Right: Daily Review Trigger */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={openDailyReview}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#111318] shadow-sm transition-all"
            title="Open End-of-Day Review [R]"
          >
            <Sparkles className="h-3.5 w-3.5 text-tercelet-brand" />
            <span>Daily Review</span>
            <span className="text-[10px] text-tercelet-muted font-mono">[R]</span>
          </button>
        </div>
      </div>

      {/* Universal Quick-Add Bar (No Time required - clean & minimal) */}
      <form
        onSubmit={handleQuickAddSubmit}
        className="rounded-2xl border border-black/10 bg-white p-2 sm:p-2.5 shadow-sm transition-all focus-within:border-black/25 focus-within:ring-2 focus-within:ring-tercelet-brand/20 space-y-2"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
          <input
            id="quick-add-task-input"
            ref={quickInputRef}
            type="text"
            placeholder="Add a task for today... (Press Enter or [T] to focus)"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            className="flex-1 bg-transparent text-xs sm:text-sm text-[#111318] placeholder-slate-400 focus:outline-none font-medium"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="rounded-xl bg-[#111318] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-black transition-all disabled:opacity-40 flex items-center gap-1 shrink-0"
          >
            <span>Add</span>
            <kbd className="text-[10px] opacity-60 font-mono hidden sm:inline">↵</kbd>
          </button>
        </div>

        {/* Quick Add Modifiers: Priority Dropdown & Optional Target Deck Link */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/[0.04] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Selector Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-tercelet-muted font-medium hidden sm:inline">Priority:</span>
              <select
                value={quickTier}
                onChange={(e) => setQuickTier(e.target.value as PriorityTier)}
                className="rounded-lg border border-black/10 bg-[#fcfbf8] px-2 py-1 text-[11px] font-semibold text-[#111318] focus:outline-none hover:border-black/20 transition-colors cursor-pointer"
              >
                <option value="INBOX">No Priority</option>
                <option value="MANDATORY">🔴 P0</option>
                <option value="PRIORITY">🟠 P1</option>
                <option value="NEED_TO_COMPLETE">🔵 P2</option>
                <option value="IF_GOT_TIME">⚪ P3</option>
              </select>
            </div>

            {/* Target Deck Link Dropdown */}
            {tasks.length > 0 && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-tercelet-muted hidden sm:inline" />
                <select
                  value={quickTargetId}
                  onChange={(e) => setQuickTargetId(e.target.value)}
                  className="rounded-lg border border-black/10 bg-[#fcfbf8] px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none hover:border-black/20 transition-colors max-w-[150px] truncate cursor-pointer"
                >
                  <option value="">(No Target)</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Past Date Rollover Banner */}
      {isPastDate && pastIncompleteCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>{pastIncompleteCount}</strong> incomplete task{pastIncompleteCount > 1 ? 's' : ''} from this day.
            </span>
          </div>
          <button
            onClick={handleRolloverAll}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm shrink-0"
          >
            Move to Today
          </button>
        </div>
      )}

      {/* Tiers List: No Priority, P0, P1, P2, P3 */}
      <div className="space-y-3">
        {TIERS.map((tier) => {
          const tierTasks = dailyTasks.filter((t) => t.priorityTier === tier.key);
          const tierCompleted = tierTasks.filter((t) => t.isCompleted).length;
          const isCollapsed = Boolean(collapsedTiers[tier.key]);
          const isOver = dragOverTier === tier.key;

          // If No Priority is empty and not hovered, render an unobtrusive compact row
          if (tier.key === 'INBOX' && tierTasks.length === 0 && !isOver) {
            return (
              <div
                key={tier.key}
                onDragOver={(e) => handleDragOver(e, tier.key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, tier.key)}
                className="rounded-xl border border-dashed border-black/10 px-3 py-1.5 flex items-center justify-between text-xs text-tercelet-muted hover:border-black/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Inbox className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium">No Priority</span>
                  <span className="text-[10px] text-slate-400">(Quick adds land here if unassigned)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">0 tasks</span>
              </div>
            );
          }

          return (
            <div
              key={tier.key}
              onDragOver={(e) => handleDragOver(e, tier.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, tier.key)}
              className={`rounded-xl border transition-all duration-150 p-3 ${
                isOver
                  ? 'border-tercelet-brand bg-tercelet-brandSoft/30 ring-2 ring-tercelet-brand/30 shadow-md'
                  : 'border-black/[0.06] bg-[#fcfbf8]/60 hover:border-black/10'
              }`}
            >
              {/* Tier Header Line */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => toggleTierCollapse(tier.key)}
                  className="flex items-center gap-2 group cursor-pointer focus:outline-none"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                  <span className={`h-2 w-2 rounded-full ${tier.dotColor}`} />
                  <span className="text-xs font-bold text-[#111318]">
                    {tier.label}
                  </span>
                  <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${tier.badgeClasses}`}>
                    {tier.badgeLabel}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  {tierTasks.length > 0 && (
                    <span className="text-[11px] font-mono text-tercelet-muted">
                      {tierCompleted}/{tierTasks.length}
                    </span>
                  )}
                  {tier.key === 'INBOX' && tierTasks.length > 0 && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                      Drag to P0–P3
                    </span>
                  )}
                </div>
              </div>

              {/* Task Items in Tier */}
              {!isCollapsed && (
                <>
                  {tierTasks.length === 0 ? (
                    <div className="py-2 px-2 text-center text-xs text-slate-400 border border-dashed border-black/[0.06] rounded-lg">
                      <span className="text-[11px]">No tasks in {tier.label} yet. Drag or add items here.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {tierTasks.map((task) => {
                        const isDragging = draggedTaskId === task.id;
                        const isTriageOpen = activeTriageTaskId === task.id;

                        return (
                          <div
                            key={task.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                              setDragOverTier(null);
                            }}
                            className={`group relative flex items-center justify-between gap-2.5 rounded-lg border px-2.5 py-2 transition-all cursor-grab active:cursor-grabbing ${
                              isDragging
                                ? 'opacity-30 scale-95 border-dashed border-tercelet-brand'
                                : task.isCompleted
                                ? 'border-black/[0.03] bg-white/40 opacity-60'
                                : 'border-black/[0.06] bg-white hover:border-black/20 shadow-xs hover:shadow-sm'
                            }`}
                          >
                            {/* Left: Drag Handle, Checkbox & Title */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <GripVertical className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />

                              <button
                                type="button"
                                onClick={() => toggleDailyTask(task.id)}
                                className="shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
                              >
                                {task.isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 fill-emerald-50" />
                                ) : (
                                  <Circle className="h-4 w-4 hover:stroke-[#111318]" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-xs font-medium tracking-tight truncate ${
                                    task.isCompleted
                                      ? 'line-through text-slate-400'
                                      : 'text-[#111318]'
                                  }`}
                                >
                                  {task.title}
                                </p>
                              </div>
                            </div>

                            {/* Right: 1-Click Priority Menu, Target Link & Delete (No Time Badge) */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* 1-Click Priority Menu */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTriageTaskId(isTriageOpen ? null : task.id);
                                  }}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold border transition-transform hover:scale-105 ${tier.badgeClasses}`}
                                  title="Click to change priority"
                                >
                                  {tier.badgeLabel} ▾
                                </button>

                                {/* 1-Click Dropdown Menu */}
                                {isTriageOpen && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-black/10 bg-white p-1 shadow-lg animate-in zoom-in-95 duration-150 space-y-0.5"
                                  >
                                    <div className="px-2 py-1 text-[10px] font-bold text-tercelet-muted uppercase tracking-wider">
                                      Set Priority
                                    </div>
                                    {TIERS.map((t) => (
                                      <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => handleMoveTier(task.id, t.key)}
                                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                          t.key === task.priorityTier
                                            ? 'bg-black/[0.05] font-bold text-[#111318]'
                                            : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <span className={`h-2 w-2 rounded-full ${t.dotColor}`} />
                                          <span>{t.label}</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-400">{t.badgeLabel}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Target Deck Link Badge (Clickable to Hot-Switch) */}
                              {task.targetId && (
                                <button
                                  type="button"
                                  onClick={() => hotSwitchTask(task.targetId!)}
                                  className="hidden sm:inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border transition-all hover:scale-105 border-black/10 bg-slate-50 text-[#111318] hover:border-black/20"
                                  title={`Focus target: ${task.targetTitle || 'Target'}`}
                                >
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ backgroundColor: task.targetColorHex || '#3157f6' }}
                                  />
                                  <span className="truncate max-w-[80px]">{task.targetTitle}</span>
                                  <ArrowUpRight className="h-2 w-2 text-slate-400" />
                                </button>
                              )}

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => deleteDailyTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-600 transition-all rounded"
                                title="Delete Task"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Drop zone highlight when dragging over */}
                  {isOver && (
                    <div className="mt-2 rounded-lg border-2 border-dashed border-tercelet-brand/60 bg-tercelet-brandSoft/20 p-2 text-center text-xs font-semibold text-tercelet-brand animate-pulse">
                      Drop to move into {tier.label}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
