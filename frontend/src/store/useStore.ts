import { create } from 'zustand';
import { api } from '../api/client';
import type {
  TaskDto,
  UserDto,
  DailyReportDto,
  WeeklyReportDto,
  DailyTaskDto,
  DailyDebriefDto,
  PriorityTier,
  CreateDailyTaskRequest,
  SaveDailyDebriefRequest,
} from '../api/client';
import { soundEffects } from '../utils/soundEffects';

export type TimerMode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

interface StoreState {
  // Auth
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'LOGIN' | 'SIGNUP' | 'OTP';
  pendingEmail: string;

  setAuth: (user: UserDto, token: string) => void;
  logout: () => void;
  openAuthModal: (mode?: 'LOGIN' | 'SIGNUP' | 'OTP', email?: string) => void;
  closeAuthModal: () => void;
  loadCurrentUser: () => Promise<void>;

  // Tasks (Target Deck)
  tasks: TaskDto[];
  activeTaskId: string | null;
  isLoadingTasks: boolean;
  fetchTasks: () => Promise<void>;
  setActiveTaskId: (id: string | null) => void;
  createTask: (title: string, category: string, colorHex: string, targetMinutes: number) => Promise<void>;
  updateTask: (id: string, title: string, category: string, colorHex: string, targetMinutes: number) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;

  // Daily Task Matrix (Today's Plan)
  dailyTasks: DailyTaskDto[];
  isLoadingDailyTasks: boolean;
  activePlannedDate: string;
  workspaceLayoutMode: 'STACKED' | 'TABBED';
  activeWorkspaceTab: 'TARGET_DECK' | 'TODAYS_PLAN';

  fetchDailyTasks: (date?: string) => Promise<void>;
  createDailyTask: (title: string, priorityTier?: PriorityTier, estimatedMinutes?: number, targetId?: string | null) => Promise<void>;
  updateDailyTask: (id: string, updates: Partial<CreateDailyTaskRequest>) => Promise<void>;
  toggleDailyTask: (id: string) => Promise<void>;
  deleteDailyTask: (id: string) => Promise<void>;
  rolloverTasks: (fromDate: string, toDate: string, taskIds?: string[]) => Promise<void>;
  setActivePlannedDate: (date: string) => void;
  setWorkspaceLayoutMode: (mode: 'STACKED' | 'TABBED') => void;
  setActiveWorkspaceTab: (tab: 'TARGET_DECK' | 'TODAYS_PLAN') => void;

  // Daily Review / Debrief
  isDailyReviewOpen: boolean;
  todayDebrief: DailyDebriefDto | null;
  debriefHistory: DailyDebriefDto[];
  isLoadingDebrief: boolean;

  openDailyReview: () => void;
  closeDailyReview: () => void;
  fetchDailyDebrief: (date?: string) => Promise<void>;
  saveDailyDebrief: (body: SaveDailyDebriefRequest) => Promise<void>;
  fetchDebriefHistory: () => Promise<void>;

  // Timer
  mode: TimerMode;
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  focusSliceStart: string | null;
  sessionRemainingAtStart: number | null;
  timerDurations: { FOCUS: number; SHORT_BREAK: number; LONG_BREAK: number };
  focusRemainingByTask: Record<string, { remainingSeconds: number; durationSeconds: number }>;

  setTimerMode: (mode: TimerMode) => void;
  setFocusDuration: (minutes: number) => void;
  setBreakDuration: (mode: 'SHORT_BREAK' | 'LONG_BREAK', minutes: number) => void;
  setIsRunning: (running: boolean) => void;
  setRemainingSeconds: (sec: number) => void;
  startTimer: () => void;
  pauseTimer: () => Promise<void>;
  resetTimer: () => void;
  adjustTime: (deltaSeconds: number) => void;
  hotSwitchTask: (newTaskId: string) => Promise<void>;
  skipTimer: () => Promise<void>;
  onTimerComplete: () => Promise<void>;

  // Context Checkpoints
  isCheckpointPromptOpen: boolean;
  promptPreviousTask: { id: string; title: string } | null;
  closeCheckpointPrompt: () => void;
  submitCheckpointNote: (note: string) => Promise<void>;

  // Analytics Drawer
  isAnalyticsOpen: boolean;
  dailyReport: DailyReportDto | null;
  weeklyReport: WeeklyReportDto | null;
  isLoadingReport: boolean;
  openAnalytics: () => void;
  closeAnalytics: () => void;
  fetchDailyReport: (date?: string) => Promise<void>;
  fetchWeeklyReport: (start?: string, end?: string) => Promise<void>;

  // Audio SFX
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (vol: number) => void;
}

const DEFAULT_DURATIONS = {
  FOCUS: 25 * 60,
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,
};

const loadSavedDurations = (): { FOCUS: number; SHORT_BREAK: number; LONG_BREAK: number } => {
  try {
    const saved = localStorage.getItem('pomopro_timer_durations');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        FOCUS: parsed.FOCUS || DEFAULT_DURATIONS.FOCUS,
        SHORT_BREAK: parsed.SHORT_BREAK || DEFAULT_DURATIONS.SHORT_BREAK,
        LONG_BREAK: parsed.LONG_BREAK || DEFAULT_DURATIONS.LONG_BREAK,
      };
    }
  } catch (e) {}
  return DEFAULT_DURATIONS;
};

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadSavedLayoutMode = (): 'STACKED' | 'TABBED' => {
  try {
    const saved = localStorage.getItem('pomopro_workspace_layout');
    if (saved === 'TABBED' || saved === 'STACKED') return saved;
  } catch (e) {}
  return 'STACKED';
};

const initialDurations = loadSavedDurations();

const loadSavedTimerState = () => {
  try {
    const raw = localStorage.getItem('pomopro_active_timer');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
};

const savedTimerState = loadSavedTimerState();

export const persistTimerState = (state: {
  mode: TimerMode;
  remainingSeconds: number;
  durationSeconds: number;
  activeTaskId: string | null;
  focusRemainingByTask: Record<string, { remainingSeconds: number; durationSeconds: number }>;
}) => {
  try {
    localStorage.setItem(
      'pomopro_active_timer',
      JSON.stringify({
        mode: state.mode,
        remainingSeconds: state.remainingSeconds,
        durationSeconds: state.durationSeconds,
        activeTaskId: state.activeTaskId,
        focusRemainingByTask: state.focusRemainingByTask,
        savedAt: Date.now(),
      })
    );
  } catch (e) {}
};

const normalizeDailyTask = (task: any): DailyTaskDto => ({
  ...task,
  isCompleted: Boolean(task?.isCompleted ?? task?.completed ?? false),
});

export const useStore = create<StoreState>((set, get) => ({
  // Auth Initial State
  user: null,
  token: localStorage.getItem('pomopro_token'),
  isAuthenticated: !!localStorage.getItem('pomopro_token'),
  isAuthModalOpen: false,
  authModalMode: 'LOGIN',
  pendingEmail: '',

  setAuth: (user, token) => {
    localStorage.setItem('pomopro_token', token);
    set({ user, token, isAuthenticated: true, isAuthModalOpen: false });
    get().fetchTasks();
    get().fetchDailyTasks();
  },

  logout: () => {
    localStorage.removeItem('pomopro_token');
    set({ user: null, token: null, isAuthenticated: false, tasks: [], activeTaskId: null, dailyTasks: [] });
    get().openAuthModal('LOGIN');
  },

  openAuthModal: (mode = 'LOGIN', email = '') => {
    set({ isAuthModalOpen: true, authModalMode: mode, pendingEmail: email });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false });
  },

  loadCurrentUser: async () => {
    const token = localStorage.getItem('pomopro_token');
    if (!token) {
      try {
        const res = await api.auth.demoLogin();
        if (res.token && res.user) {
          get().setAuth(res.user, res.token);
          return;
        }
      } catch {
        set({ isAuthenticated: false, isAuthModalOpen: false });
        return;
      }
    }
    try {
      const user = await api.auth.me();
      set({ user, isAuthenticated: true });
      await get().fetchTasks();
      await get().fetchDailyTasks();
    } catch {
      localStorage.removeItem('pomopro_token');
      try {
        const res = await api.auth.demoLogin();
        if (res.token && res.user) {
          get().setAuth(res.user, res.token);
        }
      } catch {
        set({ user: null, token: null, isAuthenticated: false, isAuthModalOpen: false });
      }
    }
  },

  // Tasks
  tasks: [],
  activeTaskId: savedTimerState?.activeTaskId || null,
  isLoadingTasks: false,

  fetchTasks: async () => {
    if (!get().isAuthenticated) return;
    set({ isLoadingTasks: true });
    try {
      const tasks = await api.tasks.list();
      set({ tasks });
      if (tasks.length > 0) {
        const currentActive = get().activeTaskId ? tasks.find((t) => t.id === get().activeTaskId) : null;
        if (!get().isRunning && !currentActive) {
          const activeTask = tasks[0];
          const targetSecs = (activeTask.dailyTargetMinutes || 25) * 60;

          const savedFocus = get().focusRemainingByTask[activeTask.id];
          const remaining = (savedFocus && savedFocus.remainingSeconds > 0)
            ? savedFocus.remainingSeconds
            : targetSecs;
          const dur = (savedFocus && savedFocus.durationSeconds > 0)
            ? savedFocus.durationSeconds
            : targetSecs;

          set({
            activeTaskId: activeTask.id,
            ...(get().mode === 'FOCUS'
              ? {
                  durationSeconds: dur,
                  remainingSeconds: remaining,
                  timerDurations: {
                    ...get().timerDurations,
                    FOCUS: dur,
                  },
                }
              : {}),
          });

          if (get().mode === 'FOCUS') {
            persistTimerState({
              mode: 'FOCUS',
              durationSeconds: dur,
              remainingSeconds: remaining,
              activeTaskId: activeTask.id,
              focusRemainingByTask: get().focusRemainingByTask,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      set({ isLoadingTasks: false });
    }
  },

  setActiveTaskId: (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) {
      set({ activeTaskId: id });
      return;
    }
    const targetSecs = (task.dailyTargetMinutes || 25) * 60;
    const savedFocus = id ? get().focusRemainingByTask[id] : null;
    const remaining = (savedFocus && savedFocus.remainingSeconds > 0) ? savedFocus.remainingSeconds : targetSecs;
    const dur = (savedFocus && savedFocus.durationSeconds > 0) ? savedFocus.durationSeconds : targetSecs;

    set({
      activeTaskId: id,
      ...(get().mode === 'FOCUS' && !get().isRunning
        ? {
            durationSeconds: dur,
            remainingSeconds: remaining,
            timerDurations: {
              ...get().timerDurations,
              FOCUS: dur,
            },
          }
        : {}),
    });

    if (get().mode === 'FOCUS') {
      persistTimerState({
        mode: 'FOCUS',
        durationSeconds: dur,
        remainingSeconds: remaining,
        activeTaskId: id,
        focusRemainingByTask: get().focusRemainingByTask,
      });
    }
  },

  createTask: async (title, category, colorHex, targetMinutes) => {
    try {
      const newTask = await api.tasks.create({
        title,
        category,
        colorHex,
        dailyTargetMinutes: targetMinutes,
      });
      const tasks = [...get().tasks, newTask];
      const targetSecs = targetMinutes * 60;
      const isRunning = get().isRunning;
      const currentActiveId = get().activeTaskId;

      if (isRunning) {
        // When timer is actively running, never disrupt or hijack the running session!
        // The new target is added to the deck with 0 progress and full daily target budget.
        set({ tasks });
      } else {
        // When timer is idle: activate this task if no task was active
        const shouldActivate = !currentActiveId;
        const newActiveId = shouldActivate ? newTask.id : currentActiveId;

        set({
          tasks,
          activeTaskId: newActiveId,
          ...(shouldActivate && get().mode === 'FOCUS'
            ? {
                durationSeconds: targetSecs,
                remainingSeconds: targetSecs,
                timerDurations: {
                  ...get().timerDurations,
                  FOCUS: targetSecs,
                },
              }
            : {}),
        });

        if (shouldActivate && get().mode === 'FOCUS') {
          persistTimerState({
            mode: 'FOCUS',
            durationSeconds: targetSecs,
            remainingSeconds: targetSecs,
            activeTaskId: newActiveId,
            focusRemainingByTask: get().focusRemainingByTask,
          });
        }
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      throw err;
    }
  },

  updateTask: async (id, title, category, colorHex, targetMinutes) => {
    try {
      const updated = await api.tasks.update(id, {
        title,
        category,
        colorHex,
        dailyTargetMinutes: targetMinutes,
      });
      const tasks = get().tasks.map((t) => (t.id === id ? updated : t));
      const targetSecs = targetMinutes * 60;
      const isTargetActive = get().activeTaskId === id;
      set({
        tasks,
        ...(isTargetActive && get().mode === 'FOCUS' && !get().isRunning
          ? {
              durationSeconds: targetSecs,
              remainingSeconds: targetSecs,
              timerDurations: {
                ...get().timerDurations,
                FOCUS: targetSecs,
              },
            }
          : {}),
      });
    } catch (err) {
      console.error('Failed to update task:', err);
      throw err;
    }
  },

  archiveTask: async (id) => {
    try {
      await api.tasks.archive(id);
      const tasks = get().tasks.filter((t) => t.id !== id);
      const newActive = tasks.length > 0 ? tasks[0].id : null;
      let targetSecs = DEFAULT_DURATIONS.FOCUS;
      if (newActive) {
        const nextTask = tasks.find((t) => t.id === newActive);
        if (nextTask) targetSecs = nextTask.dailyTargetMinutes * 60;
      }
      set({
        tasks,
        activeTaskId: newActive,
        ...(get().mode === 'FOCUS' && !get().isRunning
          ? {
              durationSeconds: targetSecs,
              remainingSeconds: targetSecs,
              timerDurations: {
                ...get().timerDurations,
                FOCUS: targetSecs,
              },
            }
          : {}),
      });
    } catch (err) {
      console.error('Failed to archive task:', err);
      throw err;
    }
  },

  // Daily Tasks Initial State & Actions
  dailyTasks: [],
  isLoadingDailyTasks: false,
  activePlannedDate: getTodayDateString(),
  workspaceLayoutMode: loadSavedLayoutMode(),
  activeWorkspaceTab: 'TARGET_DECK',

  setWorkspaceLayoutMode: (mode) => {
    try {
      localStorage.setItem('pomopro_workspace_layout', mode);
    } catch (e) {}
    set({ workspaceLayoutMode: mode });
  },

  setActiveWorkspaceTab: (tab) => set({ activeWorkspaceTab: tab }),

  setActivePlannedDate: (date) => {
    set({ activePlannedDate: date });
    get().fetchDailyTasks(date);
    get().fetchDailyDebrief(date);
  },

  fetchDailyTasks: async (date) => {
    if (!get().isAuthenticated) return;
    const targetDate = date || get().activePlannedDate;
    set({ isLoadingDailyTasks: true });
    try {
      const dailyTasks = await api.dailyTasks.list(targetDate);
      set({ dailyTasks: Array.isArray(dailyTasks) ? dailyTasks.map(normalizeDailyTask) : [] });
    } catch (err) {
      console.error('Failed to fetch daily tasks:', err);
    } finally {
      set({ isLoadingDailyTasks: false });
    }
  },

  createDailyTask: async (title, priorityTier = 'INBOX', estimatedMinutes = 25, targetId = null) => {
    try {
      soundEffects.playInterfaceBlip();
      const newTask = await api.dailyTasks.create({
        title,
        priorityTier,
        plannedDate: get().activePlannedDate,
        estimatedMinutes,
        targetId,
      });
      set({ dailyTasks: [...get().dailyTasks, normalizeDailyTask(newTask)] });
    } catch (err) {
      console.error('Failed to create daily task:', err);
      throw err;
    }
  },

  updateDailyTask: async (id, updates) => {
    try {
      // Optimistic update for buttery-smooth drag-and-drop & triage
      set({
        dailyTasks: get().dailyTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      });
      const updated = await api.dailyTasks.update(id, updates);
      set({
        dailyTasks: get().dailyTasks.map((t) => (t.id === id ? normalizeDailyTask(updated) : t)),
      });
    } catch (err) {
      console.error('Failed to update daily task:', err);
      get().fetchDailyTasks(get().activePlannedDate);
      throw err;
    }
  },

  toggleDailyTask: async (id) => {
    const previousTasks = get().dailyTasks;
    const task = previousTasks.find((t) => t.id === id);
    if (!task) return;

    const nextCompleted = !(task.isCompleted ?? (task as any).completed);
    soundEffects.playCompletionChime();

    // Optimistic UI update: instant checkmark flip without network lag
    set({
      dailyTasks: previousTasks.map((t) =>
        t.id === id ? { ...t, isCompleted: nextCompleted } : t
      ),
    });

    try {
      const updated = await api.dailyTasks.toggle(id);
      const normalized = normalizeDailyTask(updated);
      set({
        dailyTasks: get().dailyTasks.map((t) => (t.id === id ? normalized : t)),
      });
    } catch (err) {
      // Rollback on network failure
      set({ dailyTasks: previousTasks });
      console.error('Failed to toggle daily task:', err);
      throw err;
    }
  },

  deleteDailyTask: async (id) => {
    try {
      soundEffects.playInterfaceBlip();
      await api.dailyTasks.delete(id);
      set({
        dailyTasks: get().dailyTasks.filter((t) => t.id !== id),
      });
    } catch (err) {
      console.error('Failed to delete daily task:', err);
      throw err;
    }
  },

  rolloverTasks: async (fromDate, toDate, taskIds) => {
    try {
      soundEffects.playHotSwitchClick();
      await api.dailyTasks.rollover({ fromDate, toDate, taskIds });
      if (get().activePlannedDate === toDate) {
        get().fetchDailyTasks(toDate);
      } else {
        get().fetchDailyTasks(get().activePlannedDate);
      }
    } catch (err) {
      console.error('Failed to rollover tasks:', err);
      throw err;
    }
  },

  // Daily Review / Debrief State & Actions
  isDailyReviewOpen: false,
  todayDebrief: null,
  debriefHistory: [],
  isLoadingDebrief: false,

  openDailyReview: () => {
    set({ isDailyReviewOpen: true });
    get().fetchDailyDebrief(get().activePlannedDate);
  },

  closeDailyReview: () => set({ isDailyReviewOpen: false }),

  fetchDailyDebrief: async (date) => {
    if (!get().isAuthenticated) return;
    const targetDate = date || get().activePlannedDate;
    set({ isLoadingDebrief: true });
    try {
      const todayDebrief = await api.dailyDebriefs.get(targetDate);
      set({ todayDebrief });
    } catch (err) {
      console.error('Failed to fetch daily debrief:', err);
    } finally {
      set({ isLoadingDebrief: false });
    }
  },

  saveDailyDebrief: async (body) => {
    try {
      soundEffects.playCompletionChime();
      const todayDebrief = await api.dailyDebriefs.save(body);
      set({ todayDebrief });
      get().fetchDebriefHistory();
    } catch (err) {
      console.error('Failed to save daily debrief:', err);
      throw err;
    }
  },

  fetchDebriefHistory: async () => {
    if (!get().isAuthenticated) return;
    try {
      const debriefHistory = await api.dailyDebriefs.history();
      set({ debriefHistory });
    } catch (err) {
      console.error('Failed to fetch debrief history:', err);
    }
  },

  // Timer State (Initialized from persistent local storage)
  mode: (savedTimerState?.mode as TimerMode) || 'FOCUS',
  durationSeconds: savedTimerState?.durationSeconds || initialDurations.FOCUS,
  remainingSeconds: savedTimerState?.remainingSeconds || initialDurations.FOCUS,
  isRunning: false,
  focusSliceStart: null,
  sessionRemainingAtStart: null,
  timerDurations: initialDurations,
  focusRemainingByTask: savedTimerState?.focusRemainingByTask || {},

  setFocusDuration: (minutes) => {
    const durationSeconds = Math.max(1, Math.min(360, minutes)) * 60;
    const currentDurations = get().timerDurations;
    const updatedDurations = {
      ...currentDurations,
      FOCUS: durationSeconds,
    };
    try {
      localStorage.setItem('pomopro_timer_durations', JSON.stringify(updatedDurations));
    } catch (e) {}

    const updates: Partial<StoreState> = {
      timerDurations: updatedDurations,
    };
    if (get().mode === 'FOCUS' && !get().isRunning) {
      updates.durationSeconds = durationSeconds;
      updates.remainingSeconds = durationSeconds;
      if (get().activeTaskId) {
        updates.focusRemainingByTask = {
          ...get().focusRemainingByTask,
          [get().activeTaskId!]: {
            remainingSeconds: durationSeconds,
            durationSeconds,
          },
        };
      }
      persistTimerState({
        mode: 'FOCUS',
        durationSeconds,
        remainingSeconds: durationSeconds,
        activeTaskId: get().activeTaskId,
        focusRemainingByTask: updates.focusRemainingByTask || get().focusRemainingByTask,
      });
    }
    set(updates);
  },

  setBreakDuration: (mode, minutes) => {
    const durationSeconds = Math.max(1, Math.min(120, minutes)) * 60;
    const currentDurations = get().timerDurations;
    const updatedDurations = {
      ...currentDurations,
      [mode]: durationSeconds,
    };
    try {
      localStorage.setItem('pomopro_timer_durations', JSON.stringify(updatedDurations));
    } catch (e) {}

    const updates: Partial<StoreState> = {
      timerDurations: updatedDurations,
    };
    if (get().mode === mode && !get().isRunning) {
      updates.durationSeconds = durationSeconds;
      updates.remainingSeconds = durationSeconds;
      persistTimerState({
        mode: get().mode,
        durationSeconds,
        remainingSeconds: durationSeconds,
        activeTaskId: get().activeTaskId,
        focusRemainingByTask: get().focusRemainingByTask,
      });
    }
    set(updates);
  },

  setTimerMode: (newMode) => {
    const prevMode = get().mode;
    const activeTaskId = get().activeTaskId;

    // When leaving FOCUS mode, remember the current remaining & duration for this task!
    let updatedFocusRemaining = { ...get().focusRemainingByTask };
    if (prevMode === 'FOCUS' && activeTaskId && get().remainingSeconds > 0) {
      updatedFocusRemaining[activeTaskId] = {
        remainingSeconds: get().remainingSeconds,
        durationSeconds: get().durationSeconds,
      };
    }

    let dur = get().timerDurations[newMode];
    let rem = dur;

    if (newMode === 'FOCUS') {
      const activeTask = get().tasks.find((t) => t.id === get().activeTaskId);
      const targetSecs = activeTask && activeTask.dailyTargetMinutes > 0
        ? activeTask.dailyTargetMinutes * 60
        : (get().timerDurations.FOCUS || 25 * 60);

      // Check if there is preserved focus progress for this task!
      const saved = activeTaskId ? updatedFocusRemaining[activeTaskId] : null;
      if (saved && saved.remainingSeconds > 0) {
        dur = saved.durationSeconds;
        rem = saved.remainingSeconds;
      } else {
        dur = targetSecs;
        rem = targetSecs;
      }
    }

    set({
      mode: newMode,
      durationSeconds: dur,
      remainingSeconds: rem,
      isRunning: false,
      focusSliceStart: null,
      sessionRemainingAtStart: null,
      focusRemainingByTask: updatedFocusRemaining,
      timerDurations: {
        ...get().timerDurations,
        [newMode]: dur,
      },
    });

    persistTimerState({
      mode: newMode,
      durationSeconds: dur,
      remainingSeconds: rem,
      activeTaskId: get().activeTaskId,
      focusRemainingByTask: updatedFocusRemaining,
    });
  },

  setIsRunning: (running) => set({ isRunning: running }),

  setRemainingSeconds: (sec) => {
    const { mode, activeTaskId, durationSeconds, focusRemainingByTask } = get();
    let updatedFocusRemaining = focusRemainingByTask;
    if (mode === 'FOCUS' && activeTaskId) {
      updatedFocusRemaining = {
        ...focusRemainingByTask,
        [activeTaskId]: {
          remainingSeconds: sec,
          durationSeconds,
        },
      };
    }
    set({
      remainingSeconds: sec,
      focusRemainingByTask: updatedFocusRemaining,
    });
    persistTimerState({
      mode,
      remainingSeconds: sec,
      durationSeconds,
      activeTaskId,
      focusRemainingByTask: updatedFocusRemaining,
    });
  },

  startTimer: () => {
    soundEffects.playInterfaceBlip();
    set({
      isRunning: true,
      focusSliceStart: new Date().toISOString(),
      sessionRemainingAtStart: get().remainingSeconds,
    });
  },

  pauseTimer: async () => {
    soundEffects.playInterfaceBlip();
    const { isRunning, focusSliceStart, sessionRemainingAtStart, remainingSeconds, durationSeconds, activeTaskId, mode, tasks, focusRemainingByTask } = get();

    // Calculate actual elapsed seconds in this focus slice
    const startRem = sessionRemainingAtStart ?? durationSeconds;
    const timerElapsed = Math.max(0, startRem - remainingSeconds);
    const wallElapsed = focusSliceStart ? Math.max(0, Math.round((Date.now() - new Date(focusSliceStart).getTime()) / 1000)) : 0;
    const sliceDuration = timerElapsed > 0 ? timerElapsed : wallElapsed;

    let updatedFocusRemaining = focusRemainingByTask;
    if (mode === 'FOCUS' && activeTaskId) {
      updatedFocusRemaining = {
        ...focusRemainingByTask,
        [activeTaskId]: {
          remainingSeconds,
          durationSeconds,
        },
      };
    }

    if (isRunning && sliceDuration > 0 && mode === 'FOCUS') {
      const startTime = focusSliceStart || new Date(Date.now() - sliceDuration * 1000).toISOString();
      const endTime = new Date().toISOString();

      if (activeTaskId) {
        const updatedTasks = tasks.map((t) => {
          if (t.id === activeTaskId) {
            const newSecs = t.todayFocusSeconds + sliceDuration;
            const newMins = Math.round(newSecs / 60);
            const progress = t.dailyTargetMinutes > 0
              ? Math.min(100, Math.round((newSecs / (t.dailyTargetMinutes * 60)) * 1000) / 10)
              : 0;
            return {
              ...t,
              todayFocusSeconds: newSecs,
              todayFocusMinutes: newMins,
              progressPercentage: progress,
              deficitOrSurplusMinutes: newMins - t.dailyTargetMinutes,
            };
          }
          return t;
        });
        set({ tasks: updatedTasks });

        try {
          await api.sessions.log({
            taskId: activeTaskId,
            sessionType: mode,
            startTime,
            endTime,
            durationSeconds: sliceDuration,
            completed: false,
          });
          await get().fetchTasks();
        } catch (err) {
          console.error('Failed to log paused session:', err);
        }
      } else {
        try {
          await api.sessions.log({
            taskId: null as any,
            sessionType: mode,
            startTime,
            endTime,
            durationSeconds: sliceDuration,
            completed: false,
          });
        } catch (err) {
          console.error('Failed to log untracked session:', err);
        }
      }
    }

    set({
      isRunning: false,
      focusSliceStart: null,
      sessionRemainingAtStart: null,
      focusRemainingByTask: updatedFocusRemaining,
    });

    persistTimerState({
      mode,
      durationSeconds,
      remainingSeconds,
      activeTaskId,
      focusRemainingByTask: updatedFocusRemaining,
    });
  },

  resetTimer: () => {
    soundEffects.playInterfaceBlip();
    const mode = get().mode;
    const activeTaskId = get().activeTaskId;
    let dur = get().timerDurations[mode];

    let updatedFocusRemaining = { ...get().focusRemainingByTask };
    if (mode === 'FOCUS') {
      const activeTask = get().tasks.find((t) => t.id === activeTaskId);
      if (activeTask && activeTask.dailyTargetMinutes > 0) {
        dur = activeTask.dailyTargetMinutes * 60;
      }
      if (activeTaskId) {
        delete updatedFocusRemaining[activeTaskId];
      }
    }

    set({
      isRunning: false,
      remainingSeconds: dur,
      durationSeconds: dur,
      focusSliceStart: null,
      sessionRemainingAtStart: null,
      focusRemainingByTask: updatedFocusRemaining,
    });

    persistTimerState({
      mode,
      durationSeconds: dur,
      remainingSeconds: dur,
      activeTaskId,
      focusRemainingByTask: updatedFocusRemaining,
    });
  },

  adjustTime: (deltaSeconds) => {
    soundEffects.playInterfaceBlip();
    const current = get().remainingSeconds;
    const next = Math.max(60, current + deltaSeconds);
    const dur = Math.max(next, get().durationSeconds);

    let updatedFocusRemaining = get().focusRemainingByTask;
    if (get().mode === 'FOCUS' && get().activeTaskId) {
      updatedFocusRemaining = {
        ...updatedFocusRemaining,
        [get().activeTaskId!]: {
          remainingSeconds: next,
          durationSeconds: dur,
        },
      };
    }

    set({
      remainingSeconds: next,
      durationSeconds: dur,
      focusRemainingByTask: updatedFocusRemaining,
    });

    persistTimerState({
      mode: get().mode,
      remainingSeconds: next,
      durationSeconds: dur,
      activeTaskId: get().activeTaskId,
      focusRemainingByTask: updatedFocusRemaining,
    });

    if (get().isRunning && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pomopro_timer_sync', {
          detail: { remainingSeconds: next, durationSeconds: dur },
        })
      );
    }
  },

  hotSwitchTask: async (newTaskId) => {
    const { activeTaskId, tasks, isRunning, focusSliceStart, sessionRemainingAtStart, remainingSeconds, mode } = get();
    if (activeTaskId === newTaskId) return;

    soundEffects.playHotSwitchClick();

    const prevTask = tasks.find((t) => t.id === activeTaskId);
    const nextTask = tasks.find((t) => t.id === newTaskId);

    if (isRunning && mode === 'FOCUS' && activeTaskId) {
      const startRem = sessionRemainingAtStart ?? get().durationSeconds;
      const sliceDuration = Math.max(0, startRem - remainingSeconds);

      if (sliceDuration > 0) {
        const updatedTasks = tasks.map((t) => {
          if (t.id === activeTaskId) {
            const newSecs = t.todayFocusSeconds + sliceDuration;
            const newMins = Math.round(newSecs / 60);
            const progress = t.dailyTargetMinutes > 0
              ? Math.min(100, Math.round((newSecs / (t.dailyTargetMinutes * 60)) * 1000) / 10)
              : 0;
            return {
              ...t,
              todayFocusSeconds: newSecs,
              todayFocusMinutes: newMins,
              progressPercentage: progress,
              deficitOrSurplusMinutes: newMins - t.dailyTargetMinutes,
            };
          }
          return t;
        });
        set({ tasks: updatedTasks });

        const startTime = focusSliceStart || new Date(Date.now() - sliceDuration * 1000).toISOString();
        const endTime = new Date().toISOString();

        try {
          await api.sessions.log({
            taskId: activeTaskId,
            sessionType: mode,
            startTime,
            endTime,
            durationSeconds: sliceDuration,
            completed: false,
          });
          get().fetchTasks();
        } catch (err) {
          console.error('Failed to log hot-switched session slice:', err);
        }
      }
    }

    // Save previous task's focus remaining
    let updatedFocusRemaining = { ...get().focusRemainingByTask };
    if (activeTaskId && mode === 'FOCUS') {
      updatedFocusRemaining[activeTaskId] = {
        remainingSeconds: get().remainingSeconds,
        durationSeconds: get().durationSeconds,
      };
    }

    // Restore next task's focus remaining or use its daily budget
    const savedNext = newTaskId ? updatedFocusRemaining[newTaskId] : null;
    const nextTargetSecs = nextTask && nextTask.dailyTargetMinutes > 0
      ? nextTask.dailyTargetMinutes * 60
      : get().durationSeconds;

    const nextRem = (savedNext && savedNext.remainingSeconds > 0) ? savedNext.remainingSeconds : nextTargetSecs;
    const nextDur = (savedNext && savedNext.durationSeconds > 0) ? savedNext.durationSeconds : nextTargetSecs;

    set({
      activeTaskId: newTaskId,
      durationSeconds: nextDur,
      remainingSeconds: nextRem,
      focusSliceStart: isRunning ? new Date().toISOString() : null,
      sessionRemainingAtStart: isRunning ? nextRem : null,
      focusRemainingByTask: updatedFocusRemaining,
      isCheckpointPromptOpen: true,
      promptPreviousTask: prevTask ? { id: prevTask.id, title: prevTask.title } : null,
      timerDurations: {
        ...get().timerDurations,
        ...(mode === 'FOCUS' ? { FOCUS: nextDur } : {}),
      },
    });

    persistTimerState({
      mode: get().mode,
      durationSeconds: nextDur,
      remainingSeconds: nextRem,
      activeTaskId: newTaskId,
      focusRemainingByTask: updatedFocusRemaining,
    });

    if (isRunning && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pomopro_timer_sync', {
          detail: { remainingSeconds: nextRem, durationSeconds: nextDur },
        })
      );
    }
  },

  skipTimer: async () => {
    soundEffects.playCompletionChime();
    const { isRunning, focusSliceStart, sessionRemainingAtStart, remainingSeconds, durationSeconds, activeTaskId, mode, tasks } = get();

    if (isRunning && mode === 'FOCUS' && activeTaskId) {
      const startRem = sessionRemainingAtStart ?? durationSeconds;
      const sliceDuration = Math.max(0, startRem - remainingSeconds);
      if (sliceDuration > 0) {
        const updatedTasks = tasks.map((t) => {
          if (t.id === activeTaskId) {
            const newSecs = t.todayFocusSeconds + sliceDuration;
            const newMins = Math.round(newSecs / 60);
            const progress = t.dailyTargetMinutes > 0
              ? Math.min(100, Math.round((newSecs / (t.dailyTargetMinutes * 60)) * 1000) / 10)
              : 0;
            return {
              ...t,
              todayFocusSeconds: newSecs,
              todayFocusMinutes: newMins,
              progressPercentage: progress,
              deficitOrSurplusMinutes: newMins - t.dailyTargetMinutes,
            };
          }
          return t;
        });
        set({ tasks: updatedTasks });

        const startTime = focusSliceStart || new Date(Date.now() - sliceDuration * 1000).toISOString();
        const endTime = new Date().toISOString();

        try {
          await api.sessions.log({
            taskId: activeTaskId,
            sessionType: mode,
            startTime,
            endTime,
            durationSeconds: sliceDuration,
            completed: false,
          });
          await get().fetchTasks();
        } catch (err) {
          console.error('Failed to log skipped session slice:', err);
        }
      }
    }

    // Preserve Focus Timer Progress when transitioning to break
    let updatedFocusRemaining = { ...get().focusRemainingByTask };
    if (mode === 'FOCUS' && activeTaskId && remainingSeconds > 0) {
      updatedFocusRemaining[activeTaskId] = {
        remainingSeconds,
        durationSeconds,
      };
    }

    // Switch cleanly to next mode
    const nextMode: TimerMode = mode === 'FOCUS' ? 'SHORT_BREAK' : 'FOCUS';
    let nextDur = get().timerDurations[nextMode];
    let nextRem = nextDur;

    // When returning to FOCUS mode, restore previous progress!
    if (nextMode === 'FOCUS') {
      const activeTask = get().tasks.find((t) => t.id === get().activeTaskId);
      const targetSecs = activeTask && activeTask.dailyTargetMinutes > 0
        ? activeTask.dailyTargetMinutes * 60
        : (get().timerDurations.FOCUS || 25 * 60);

      const saved = activeTaskId ? updatedFocusRemaining[activeTaskId] : null;
      if (saved && saved.remainingSeconds > 0) {
        nextDur = saved.durationSeconds;
        nextRem = saved.remainingSeconds;
      } else {
        nextDur = targetSecs;
        nextRem = targetSecs;
      }
    }

    set({
      mode: nextMode,
      durationSeconds: nextDur,
      remainingSeconds: nextRem,
      isRunning: false,
      focusSliceStart: null,
      sessionRemainingAtStart: null,
      focusRemainingByTask: updatedFocusRemaining,
      timerDurations: {
        ...get().timerDurations,
        [nextMode]: nextDur,
      },
    });

    persistTimerState({
      mode: nextMode,
      durationSeconds: nextDur,
      remainingSeconds: nextRem,
      activeTaskId: get().activeTaskId,
      focusRemainingByTask: updatedFocusRemaining,
    });
  },

  onTimerComplete: async () => {
    soundEffects.playCompletionChime();

    const { activeTaskId, mode, focusSliceStart, sessionRemainingAtStart, durationSeconds, tasks } = get();
    const startRem = sessionRemainingAtStart ?? durationSeconds;
    const sliceDuration = Math.max(1, startRem);
    const endTime = new Date().toISOString();
    const startTime = focusSliceStart || new Date(Date.now() - sliceDuration * 1000).toISOString();

    let updatedFocusRemaining = { ...get().focusRemainingByTask };

    if (mode === 'FOCUS' && activeTaskId) {
      // Completed full focus block! Clear saved focus progress for this task so next block starts full
      delete updatedFocusRemaining[activeTaskId];

      const updatedTasks = tasks.map((t) => {
        if (t.id === activeTaskId) {
          const newSecs = t.todayFocusSeconds + sliceDuration;
          const newMins = Math.round(newSecs / 60);
          const progress = t.dailyTargetMinutes > 0
            ? Math.min(100, Math.round((newSecs / (t.dailyTargetMinutes * 60)) * 1000) / 10)
            : 0;
          return {
            ...t,
            todayFocusSeconds: newSecs,
            todayFocusMinutes: newMins,
            progressPercentage: progress,
            deficitOrSurplusMinutes: newMins - t.dailyTargetMinutes,
          };
        }
        return t;
      });
      set({ tasks: updatedTasks });

      try {
        await api.sessions.log({
          taskId: activeTaskId,
          sessionType: mode,
          startTime,
          endTime,
          durationSeconds: sliceDuration,
          completed: true,
        });
        await get().fetchTasks();
      } catch (err) {
        console.error('Failed to log completed session:', err);
      }
    }

    const nextMode: TimerMode = mode === 'FOCUS' ? 'SHORT_BREAK' : 'FOCUS';
    let nextDur = get().timerDurations[nextMode];
    let nextRem = nextDur;

    // When returning to FOCUS mode after break completes, restore previous progress!
    if (nextMode === 'FOCUS') {
      const activeTask = get().tasks.find((t) => t.id === get().activeTaskId);
      const targetSecs = activeTask && activeTask.dailyTargetMinutes > 0
        ? activeTask.dailyTargetMinutes * 60
        : (get().timerDurations.FOCUS || 25 * 60);

      const saved = activeTaskId ? updatedFocusRemaining[activeTaskId] : null;
      if (saved && saved.remainingSeconds > 0) {
        nextDur = saved.durationSeconds;
        nextRem = saved.remainingSeconds;
      } else {
        nextDur = targetSecs;
        nextRem = targetSecs;
      }
    }

    set({
      mode: nextMode,
      durationSeconds: nextDur,
      remainingSeconds: nextRem,
      isRunning: false,
      focusSliceStart: null,
      sessionRemainingAtStart: null,
      focusRemainingByTask: updatedFocusRemaining,
      timerDurations: {
        ...get().timerDurations,
        [nextMode]: nextDur,
      },
    });

    persistTimerState({
      mode: nextMode,
      durationSeconds: nextDur,
      remainingSeconds: nextRem,
      activeTaskId: get().activeTaskId,
      focusRemainingByTask: updatedFocusRemaining,
    });
  },

  // Context Checkpoints
  isCheckpointPromptOpen: false,
  promptPreviousTask: null,

  closeCheckpointPrompt: () => {
    set({ isCheckpointPromptOpen: false, promptPreviousTask: null });
  },

  submitCheckpointNote: async (note) => {
    const { promptPreviousTask } = get();
    if (!promptPreviousTask || !note.trim()) {
      set({ isCheckpointPromptOpen: false, promptPreviousTask: null });
      return;
    }

    try {
      await api.checkpoints.save({
        taskId: promptPreviousTask.id,
        checkpointNote: note.trim(),
      });
      get().fetchTasks();
    } catch (err) {
      console.error('Failed to save context bookmark:', err);
    } finally {
      set({ isCheckpointPromptOpen: false, promptPreviousTask: null });
    }
  },

  // Analytics Drawer
  isAnalyticsOpen: false,
  dailyReport: null,
  weeklyReport: null,
  isLoadingReport: false,

  openAnalytics: () => {
    set({ isAnalyticsOpen: true });
    get().fetchDailyReport();
    get().fetchWeeklyReport();
  },

  closeAnalytics: () => set({ isAnalyticsOpen: false }),

  fetchDailyReport: async (date) => {
    set({ isLoadingReport: true });
    try {
      const dailyReport = await api.reports.daily(date);
      set({ dailyReport });
    } catch (err) {
      console.error('Failed to fetch daily report:', err);
    } finally {
      set({ isLoadingReport: false });
    }
  },

  fetchWeeklyReport: async (start, end) => {
    try {
      const weeklyReport = await api.reports.weekly(start, end);
      set({ weeklyReport });
    } catch (err) {
      console.error('Failed to fetch weekly report:', err);
    }
  },

  // Audio SFX Settings
  isMuted: soundEffects.getMuted(),
  volume: soundEffects.getVolume(),

  toggleMute: () => {
    const next = !get().isMuted;
    soundEffects.setMuted(next);
    set({ isMuted: next });
  },

  setVolume: (vol) => {
    soundEffects.setVolume(vol);
    set({ volume: vol });
  },
}));
