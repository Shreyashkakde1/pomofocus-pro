import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Check, X, Sparkles, ArrowRight, Pencil } from 'lucide-react';
import type { TaskDto } from '../api/client';

export const TaskDeck: React.FC = () => {
  const tasks = useStore((s) => s.tasks);
  const activeTaskId = useStore((s) => s.activeTaskId);
  const hotSwitchTask = useStore((s) => s.hotSwitchTask);
  const createTask = useStore((s) => s.createTask);
  const updateTask = useStore((s) => s.updateTask);
  const archiveTask = useStore((s) => s.archiveTask);

  const isRunning = useStore((s) => s.isRunning);
  const mode = useStore((s) => s.mode);
  const durationSeconds = useStore((s) => s.durationSeconds);
  const remainingSeconds = useStore((s) => s.remainingSeconds);
  const sessionRemainingAtStart = useStore((s) => s.sessionRemainingAtStart);

  // Dynamic & Customizable Categories State
  const DEFAULT_CATEGORIES = ['Development', 'Algorithms', 'Architecture', 'Research', 'Writing'];
  const [userCategories, setUserCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pomopro_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CATEGORIES;
  });

  const [newCatInput, setNewCatInput] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [editNewCatInput, setEditNewCatInput] = useState('');
  const [isEditAddingNewCat, setIsEditAddingNewCat] = useState(false);

  const saveCategories = (cats: string[]) => {
    setUserCategories(cats);
    try {
      localStorage.setItem('pomopro_custom_categories', JSON.stringify(cats));
    } catch (e) {}
  };

  // Sync existing task categories into userCategories so no existing category is lost
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;
    const taskCats = tasks
      .map((t) => t.category?.trim())
      .filter((c): c is string => Boolean(c) && c !== 'General');
    setUserCategories((prev) => {
      const lowerSet = new Set(prev.map((c) => c.toLowerCase()));
      const toAdd: string[] = [];
      for (const tc of taskCats) {
        if (!lowerSet.has(tc.toLowerCase())) {
          lowerSet.add(tc.toLowerCase());
          toAdd.push(tc);
        }
      }
      if (toAdd.length > 0) {
        const merged = [...prev, ...toAdd];
        try {
          localStorage.setItem('pomopro_custom_categories', JSON.stringify(merged));
        } catch (e) {}
        return merged;
      }
      return prev;
    });
  }, [tasks]);

  const handleAddCategory = (name: string, isForEdit: boolean) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!userCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      saveCategories([...userCategories, trimmed]);
    }
    if (isForEdit) {
      setEditCategory(trimmed);
      setEditNewCatInput('');
      setIsEditAddingNewCat(false);
    } else {
      setCategory(trimmed);
      setNewCatInput('');
      setIsAddingNewCat(false);
    }
  };

  const handleRemoveCategory = (catToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = userCategories.filter((c) => c.toLowerCase() !== catToRemove.toLowerCase());
    saveCategories(updated);
    if (category.toLowerCase() === catToRemove.toLowerCase()) {
      setCategory('');
    }
    if (editCategory.toLowerCase() === catToRemove.toLowerCase()) {
      setEditCategory('');
    }
  };

  // New Target Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Development');
  const [targetMinutes, setTargetMinutes] = useState(60);
  const [colorHex, setColorHex] = useState('#3157f6');

  // Edit Target Form State
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTargetMinutes, setEditTargetMinutes] = useState(60);
  const [editColorHex, setEditColorHex] = useState('#3157f6');

  const PRESET_COLORS = ['#3157f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#111318'];
  const PRESET_MINUTES = [30, 45, 60, 90, 120, 180];
  const PASTEL_TINTS = ['bg-[#f6f9fe]', 'bg-[#fdfaf2]', 'bg-[#f5fbf8]', 'bg-[#fef8f4]'];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const finalCategory = category.trim() || 'General';
    if (
      finalCategory &&
      finalCategory !== 'General' &&
      !userCategories.some((c) => c.toLowerCase() === finalCategory.toLowerCase())
    ) {
      saveCategories([...userCategories, finalCategory]);
    }
    try {
      await createTask(title.trim(), finalCategory, colorHex, Number(targetMinutes));
      setTitle('');
      setCategory(userCategories[0] || 'Development');
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (task: TaskDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTask(task);
    setEditTitle(task.title);
    setEditCategory(task.category);
    setEditTargetMinutes(task.dailyTargetMinutes);
    setEditColorHex(task.colorHex || '#3157f6');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;
    const finalCategory = editCategory.trim() || 'General';
    if (
      finalCategory &&
      finalCategory !== 'General' &&
      !userCategories.some((c) => c.toLowerCase() === finalCategory.toLowerCase())
    ) {
      saveCategories([...userCategories, finalCategory]);
    }
    try {
      await updateTask(
        editingTask.id,
        editTitle.trim(),
        finalCategory,
        editColorHex,
        Number(editTargetMinutes)
      );
      setEditingTask(null);
    } catch (err) {
      console.error(err);
    }
  };

  const totalTargetMinutes = tasks.reduce((sum, t) => sum + t.dailyTargetMinutes, 0);
  const totalActualMinutes = tasks.reduce((sum, t) => sum + t.todayFocusMinutes, 0);

  return (
    <div className="w-full">
      {/* Deck Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold tracking-tight text-[#111318]">
              Target Deck
            </h3>
            <span className="badge-brand text-[10px]">
              Hot-Switch [1-9]
            </span>
          </div>
          <p className="text-xs text-tercelet-muted mt-0.5">
            {tasks.length} targets • {Math.round(totalActualMinutes / 60 * 10) / 10}h of {Math.round(totalTargetMinutes / 60 * 10) / 10}h completed
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-tercelet-brand px-3.5 text-xs font-semibold text-white shadow-brand-btn hover:bg-tercelet-brandHover transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          <span>New Target</span>
        </button>
      </div>

      {/* Tercelet-style Card Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {tasks.map((task, idx) => {
          const isActive = task.id === activeTaskId;
          const shortcutKey = idx < 9 ? `${idx + 1}` : null;
          const isFocusingThis = isActive && isRunning && mode === 'FOCUS';
          const startRem = sessionRemainingAtStart ?? durationSeconds;
          const liveSliceSeconds = isFocusingThis ? Math.max(0, startRem - remainingSeconds) : 0;
          const currentTotalSeconds = (task.todayFocusSeconds || 0) + liveSliceSeconds;
          const displayMins = Math.floor(currentTotalSeconds / 60);
          const progressPct = task.dailyTargetMinutes > 0
            ? Math.min(100, Math.round((currentTotalSeconds / (task.dailyTargetMinutes * 60)) * 1000) / 10)
            : 0;
          const bgTint = PASTEL_TINTS[idx % PASTEL_TINTS.length];

          // Mini Gauge Math (40x40 circle)
          const miniRadius = 16;
          const miniCircumference = 2 * Math.PI * miniRadius;
          const miniOffset = miniCircumference - (Math.min(100, progressPct) / 100) * miniCircumference;

          return (
            <div
              key={task.id}
              onClick={() => hotSwitchTask(task.id)}
              className={`flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'border-[#111318] shadow-card-hover ring-2 ring-[#111318]/10'
                  : 'border-black/[0.08] tercelet-card-hover'
              }`}
            >
              {/* Card Top: Tinted Header */}
              <div className={`flex-1 p-4 ${bgTint}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {shortcutKey ? (
                      <span
                        className={`inline-flex shrink-0 items-center justify-center rounded-lg border font-mono font-bold text-xs h-7 w-7 ${
                          isActive
                            ? 'bg-[#111318] text-white border-[#111318]'
                            : 'bg-white text-tercelet-muted border-black/10'
                        }`}
                      >
                        {shortcutKey}
                      </span>
                    ) : (
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: task.colorHex }}
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-tercelet-muted block truncate">
                        {task.category}
                      </span>
                    </div>
                  </div>

                  {/* Tercelet Mini Progress Gauge */}
                  <div className="relative flex shrink-0 items-center justify-center w-10 h-10">
                    <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r={miniRadius}
                        fill="none"
                        className="stroke-black/[0.08]"
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r={miniRadius}
                        fill="none"
                        stroke={isActive ? '#3157f6' : '#111318'}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: miniCircumference,
                          strokeDashoffset: miniOffset,
                          transition: 'stroke-dashoffset 0.4s ease',
                        }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-[#111318]">
                      {progressPct}%
                    </span>
                  </div>
                </div>

                {/* Target Title */}
                <p className="mt-2 text-sm font-bold leading-snug tracking-tight text-[#111318]">
                  {task.title}
                </p>

                {/* Daily Progress Line */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, progressPct)}%`,
                        backgroundColor: isActive ? '#3157f6' : '#111318',
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-tercelet-muted tabular-nums">
                    {displayMins}m / {task.dailyTargetMinutes}m
                  </span>
                </div>
              </div>

              {/* Card Bottom: White Footer Action Strip */}
              <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] bg-white px-3.5 py-2.5">
                {isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-tercelet-proof px-2 py-1 text-[11px] font-bold text-tercelet-proofInk">
                    <Check className="h-3 w-3" />
                    <span>Active Now</span>
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-tercelet-brand flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Switch</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => openEditModal(task, e)}
                    className="p-1 text-slate-400 hover:text-[#111318] rounded-md transition-colors"
                    title="Edit Target"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Archive target "${task.title}"?`)) {
                        archiveTask(task.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-tercelet-coral rounded-md transition-colors"
                    title="Archive Target"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Target Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[24px] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_28px_80px_rgba(17,19,24,.15)] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-[#111318]">
                  New Focus Target
                </h3>
                <p className="text-xs text-tercelet-muted">
                  Add a task and set daily hours allocation
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#111318] hover:bg-black/[0.05] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111318] mb-1.5">
                  Target Title
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Distributed System Design"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#fcfbf8] border border-black/15 focus:border-tercelet-brand rounded-xl px-3.5 py-2.5 text-sm text-[#111318] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand/20 transition-all font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#111318]">
                    Category
                  </label>
                  {category && (
                    <button
                      type="button"
                      onClick={() => setCategory('')}
                      className="text-[11px] font-medium text-tercelet-muted hover:text-red-500 transition-colors"
                    >
                      Clear Category
                    </button>
                  )}
                </div>

                {/* Text input with quick clear */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Enter or select category..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#fcfbf8] border border-black/15 focus:border-tercelet-brand rounded-xl pl-3.5 pr-8 py-2 text-xs text-[#111318] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand/20 transition-all font-sans"
                  />
                  {category && (
                    <button
                      type="button"
                      onClick={() => setCategory('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-[#111318]"
                      title="Clear"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* If user typed a new category not yet in list, offer quick save button */}
                {category.trim() &&
                  category.trim() !== 'General' &&
                  !userCategories.some((c) => c.toLowerCase() === category.trim().toLowerCase()) && (
                    <div className="mb-2">
                      <button
                        type="button"
                        onClick={() => handleAddCategory(category.trim(), false)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-tercelet-brand/10 text-tercelet-brand border border-tercelet-brand/30 hover:bg-tercelet-brand/20 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Save "{category.trim()}" to category list</span>
                      </button>
                    </div>
                  )}

                {/* Category Pills with selection, toggle, remove button, and inline add */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {userCategories.map((cat) => {
                    const isSelected = category.toLowerCase() === cat.toLowerCase();
                    return (
                      <span
                        key={cat}
                        className={`inline-flex items-center rounded-full text-[11px] font-medium transition-all border pl-2.5 pr-1 py-0.5 ${
                          isSelected
                            ? 'bg-[#111318] text-white border-[#111318] font-bold shadow-sm'
                            : 'bg-[#fcfbf8] text-tercelet-muted border-black/10 hover:border-black/20 hover:text-[#111318]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setCategory(isSelected ? '' : cat)}
                          className="focus:outline-none cursor-pointer"
                        >
                          {cat}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveCategory(cat, e)}
                          title={`Remove "${cat}" category`}
                          className={`ml-1 p-0.5 rounded-full transition-colors ${
                            isSelected
                              ? 'text-white/60 hover:text-white hover:bg-white/20'
                              : 'text-slate-400 hover:text-red-500 hover:bg-black/5'
                          }`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}

                  {/* Inline Add Category Button / Input */}
                  {isAddingNewCat ? (
                    <div className="inline-flex items-center gap-1 bg-white border border-tercelet-brand rounded-full px-2 py-0.5 text-[11px]">
                      <input
                        type="text"
                        autoFocus
                        placeholder="New category..."
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory(newCatInput, false);
                          } else if (e.key === 'Escape') {
                            setIsAddingNewCat(false);
                            setNewCatInput('');
                          }
                        }}
                        className="bg-transparent text-xs text-[#111318] placeholder-slate-400 focus:outline-none w-24 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCategory(newCatInput, false)}
                        className="text-tercelet-brand hover:text-tercelet-brandHover font-bold"
                        title="Save category"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingNewCat(false);
                          setNewCatInput('');
                        }}
                        className="text-slate-400 hover:text-[#111318]"
                        title="Cancel"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-tercelet-brand border border-dashed border-tercelet-brand/40 bg-tercelet-brand/[0.04] hover:bg-tercelet-brand/[0.09] transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      <span>New Category</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111318] mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      type="button"
                      key={hex}
                      onClick={() => setColorHex(hex)}
                      className={`h-7 w-7 rounded-full transition-transform flex items-center justify-center ${
                        colorHex === hex ? 'scale-110 ring-2 ring-offset-2 ring-[#111318]' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {colorHex === hex && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#111318]">
                    Daily Time Budget
                  </label>
                  <span className="text-xs font-bold text-tercelet-brand">
                    {Math.floor(targetMinutes / 60)}h {targetMinutes % 60}m ({targetMinutes} mins)
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5 mb-2">
                  {PRESET_MINUTES.map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setTargetMinutes(m)}
                      className={`py-1.5 rounded-lg text-xs font-medium text-center transition-all border ${
                        targetMinutes === m
                          ? 'bg-tercelet-brand text-white border-tercelet-brand font-bold'
                          : 'bg-[#fcfbf8] text-tercelet-muted border-black/10 hover:border-black/20'
                      }`}
                    >
                      {m < 60 ? `${m}m` : `${m / 60}h`}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="15"
                  max="360"
                  step="15"
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(Number(e.target.value))}
                  className="w-full accent-tercelet-brand cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-tercelet-muted hover:text-[#111318]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-tercelet-brand px-5 py-2.5 text-xs font-semibold text-white shadow-brand-btn hover:bg-tercelet-brandHover transition-all hover:-translate-y-0.5"
                >
                  <Sparkles className="h-3.5 w-3.5 fill-current" />
                  <span>Create Target</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Target Form */}
      {editingTask && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-[24px] border border-black/10 bg-white p-6 sm:p-8 shadow-[0_28px_80px_rgba(17,19,24,.15)] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-[#111318]">
                  Edit Target
                </h3>
                <p className="text-xs text-tercelet-muted">
                  Update target title, category, and daily duration
                </p>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#111318] hover:bg-black/[0.05] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111318] mb-1.5">
                  Target Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Target title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#fcfbf8] border border-black/15 focus:border-tercelet-brand rounded-xl px-3.5 py-2.5 text-sm text-[#111318] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand/20 transition-all font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#111318]">
                    Category
                  </label>
                  {editCategory && (
                    <button
                      type="button"
                      onClick={() => setEditCategory('')}
                      className="text-[11px] font-medium text-tercelet-muted hover:text-red-500 transition-colors"
                    >
                      Clear Category
                    </button>
                  )}
                </div>

                {/* Text input with quick clear */}
                <div className="relative mb-2">
                  <input
                    type="text"
                    placeholder="Enter or select category..."
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-[#fcfbf8] border border-black/15 focus:border-tercelet-brand rounded-xl pl-3.5 pr-8 py-2 text-xs text-[#111318] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand/20 transition-all font-sans"
                  />
                  {editCategory && (
                    <button
                      type="button"
                      onClick={() => setEditCategory('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-[#111318]"
                      title="Clear"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* If user typed a new category not yet in list, offer quick save button */}
                {editCategory.trim() &&
                  editCategory.trim() !== 'General' &&
                  !userCategories.some((c) => c.toLowerCase() === editCategory.trim().toLowerCase()) && (
                    <div className="mb-2">
                      <button
                        type="button"
                        onClick={() => handleAddCategory(editCategory.trim(), true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-tercelet-brand/10 text-tercelet-brand border border-tercelet-brand/30 hover:bg-tercelet-brand/20 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Save "{editCategory.trim()}" to category list</span>
                      </button>
                    </div>
                  )}

                {/* Category Pills with selection, toggle, remove button, and inline add */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {userCategories.map((cat) => {
                    const isSelected = editCategory.toLowerCase() === cat.toLowerCase();
                    return (
                      <span
                        key={cat}
                        className={`inline-flex items-center rounded-full text-[11px] font-medium transition-all border pl-2.5 pr-1 py-0.5 ${
                          isSelected
                            ? 'bg-[#111318] text-white border-[#111318] font-bold shadow-sm'
                            : 'bg-[#fcfbf8] text-tercelet-muted border-black/10 hover:border-black/20 hover:text-[#111318]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setEditCategory(isSelected ? '' : cat)}
                          className="focus:outline-none cursor-pointer"
                        >
                          {cat}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveCategory(cat, e)}
                          title={`Remove "${cat}" category`}
                          className={`ml-1 p-0.5 rounded-full transition-colors ${
                            isSelected
                              ? 'text-white/60 hover:text-white hover:bg-white/20'
                              : 'text-slate-400 hover:text-red-500 hover:bg-black/5'
                          }`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}

                  {/* Inline Add Category Button / Input */}
                  {isEditAddingNewCat ? (
                    <div className="inline-flex items-center gap-1 bg-white border border-tercelet-brand rounded-full px-2 py-0.5 text-[11px]">
                      <input
                        type="text"
                        autoFocus
                        placeholder="New category..."
                        value={editNewCatInput}
                        onChange={(e) => setEditNewCatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory(editNewCatInput, true);
                          } else if (e.key === 'Escape') {
                            setIsEditAddingNewCat(false);
                            setEditNewCatInput('');
                          }
                        }}
                        className="bg-transparent text-xs text-[#111318] placeholder-slate-400 focus:outline-none w-24 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCategory(editNewCatInput, true)}
                        className="text-tercelet-brand hover:text-tercelet-brandHover font-bold"
                        title="Save category"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditAddingNewCat(false);
                          setEditNewCatInput('');
                        }}
                        className="text-slate-400 hover:text-[#111318]"
                        title="Cancel"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditAddingNewCat(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-tercelet-brand border border-dashed border-tercelet-brand/40 bg-tercelet-brand/[0.04] hover:bg-tercelet-brand/[0.09] transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      <span>New Category</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111318] mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      type="button"
                      key={hex}
                      onClick={() => setEditColorHex(hex)}
                      className={`h-7 w-7 rounded-full transition-transform flex items-center justify-center ${
                        editColorHex === hex ? 'scale-110 ring-2 ring-offset-2 ring-[#111318]' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {editColorHex === hex && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#111318]">
                    Daily Time Budget
                  </label>
                  <span className="text-xs font-bold text-tercelet-brand">
                    {Math.floor(editTargetMinutes / 60)}h {editTargetMinutes % 60}m ({editTargetMinutes} mins)
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5 mb-2">
                  {PRESET_MINUTES.map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => setEditTargetMinutes(m)}
                      className={`py-1.5 rounded-lg text-xs font-medium text-center transition-all border ${
                        editTargetMinutes === m
                          ? 'bg-tercelet-brand text-white border-tercelet-brand font-bold'
                          : 'bg-[#fcfbf8] text-tercelet-muted border-black/10 hover:border-black/20'
                      }`}
                    >
                      {m < 60 ? `${m}m` : `${m / 60}h`}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="15"
                  max="360"
                  step="15"
                  value={editTargetMinutes}
                  onChange={(e) => setEditTargetMinutes(Number(e.target.value))}
                  className="w-full accent-tercelet-brand cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-xs font-semibold text-tercelet-muted hover:text-[#111318]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-tercelet-brand px-5 py-2.5 text-xs font-semibold text-white shadow-brand-btn hover:bg-tercelet-brandHover transition-all hover:-translate-y-0.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
