import { api, ApiError, isAuthRejection } from '../api/client';
import type { TaskDto, TimerStateDto } from '../api/client';

export interface TimerProgress {
  remainingSeconds: number;
  durationSeconds: number;
}

export type FocusRemainingMap = Record<string, TimerProgress>;

// A write the server has not confirmed. `progress: null` means delete the target's state.
export interface PendingTimerOp {
  progress: TimerProgress | null;
  queuedAt: number;
}

type PendingTimerOps = Record<string, PendingTimerOp>;

const PENDING_KEY = 'pomopro_pending_timer_states';
const UPLOADED_KEY_PREFIX = 'pomopro_timer_states_uploaded_';

// Kept in memory as well, because storage can be unavailable (private mode).
let memoryPending: { userId: string; ops: PendingTimerOps } | null = null;
let opVersion = 0;
let flushInFlight: Promise<void> | null = null;

const readPending = (): { userId: string; ops: PendingTimerOps } | null => {
  if (memoryPending) return memoryPending;
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (raw) memoryPending = JSON.parse(raw);
  } catch {
    // Unreadable storage is treated as having nothing pending.
  }
  return memoryPending;
};

const writePending = (userId: string, ops: PendingTimerOps) => {
  memoryPending = { userId, ops };
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(memoryPending));
  } catch {
    // The in-memory copy still retries until this page closes.
  }
};

export const loadPendingTimerOps = (userId: string): PendingTimerOps => {
  const pending = readPending();
  return pending && pending.userId === userId ? pending.ops : {};
};

export const clearPendingTimerOps = () => {
  memoryPending = null;
  opVersion++;
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing more to clear when storage is unavailable.
  }
};

export const getTimerOpVersion = () => opVersion;

export const queueTimerOp = (userId: string, taskId: string, progress: TimerProgress | null) => {
  const { [taskId]: _replaced, ...others } = loadPendingTimerOps(userId);
  // Re-inserted last so writes reach the server in the order they were made.
  writePending(userId, { ...others, [taskId]: { progress, queuedAt: Date.now() } });
  opVersion++;
};

export const clearTimerOp = (userId: string, taskId: string, sent: PendingTimerOp) => {
  const ops = loadPendingTimerOps(userId);
  // A newer write made while this one was in flight must still be sent.
  if (JSON.stringify(ops[taskId]) !== JSON.stringify(sent)) return;
  const { [taskId]: _removed, ...others } = ops;
  writePending(userId, others);
};

const sendPendingTimerOps = async (userId: string) => {
  for (;;) {
    const next = Object.entries(loadPendingTimerOps(userId))[0];
    if (!next) return;
    const [taskId, op] = next;
    try {
      if (op.progress) {
        await api.timerStates.save(taskId, op.progress);
      } else {
        await api.timerStates.remove(taskId);
      }
    } catch (err) {
      // Keep the write on a network or server failure. The server will never accept a
      // rejected one (for example an archived target), so retrying it cannot help.
      const rejected = err instanceof ApiError && err.status >= 400 && err.status < 500;
      if (!rejected || isAuthRejection(err)) return;
    }
    clearTimerOp(userId, taskId, op);
  }
};

export const flushPendingTimerOps = (userId: string): Promise<void> => {
  if (!flushInFlight) {
    flushInFlight = sendPendingTimerOps(userId).finally(() => {
      flushInFlight = null;
    });
  }
  return flushInFlight;
};

// Last write wins. A write older than the server's row is either already delivered (its
// keepalive request arrived but the page closed first) or was superseded by another
// device; sending it again would overwrite that device's newer progress.
export const dropSupersededTimerOps = (userId: string, states: TimerStateDto[]) => {
  const updatedAtByTask = new Map(states.map((s) => [s.taskId, new Date(s.updatedAt).getTime()]));
  const ops = loadPendingTimerOps(userId);
  const kept = Object.fromEntries(
    Object.entries(ops).filter(([taskId, op]) => (updatedAtByTask.get(taskId) ?? 0) <= op.queuedAt)
  );
  if (Object.keys(kept).length !== Object.keys(ops).length) writePending(userId, kept);
};

export const mergeFocusRemaining = (states: TimerStateDto[], ops: PendingTimerOps): FocusRemainingMap => {
  const merged: FocusRemainingMap = {};
  for (const { taskId, remainingSeconds, durationSeconds } of states) {
    merged[taskId] = { remainingSeconds, durationSeconds };
  }
  for (const [taskId, op] of Object.entries(ops)) {
    if (op.progress) {
      merged[taskId] = op.progress;
    } else {
      delete merged[taskId];
    }
  }
  return merged;
};

export const pickActiveTaskId = (tasks: TaskDto[], currentId: string | null, states: TimerStateDto[]): string | null => {
  if (currentId && tasks.some((t) => t.id === currentId)) return currentId;
  const newest = [...states]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .find((s) => tasks.some((t) => t.id === s.taskId));
  return newest?.taskId ?? tasks[0]?.id ?? null;
};

export const resolveTaskProgress = (task: TaskDto, focusRemaining: FocusRemainingMap): TimerProgress => {
  const targetSecs = (task.dailyTargetMinutes || 25) * 60;
  const saved = focusRemaining[task.id];
  return {
    remainingSeconds: saved && saved.remainingSeconds > 0 ? saved.remainingSeconds : targetSecs,
    durationSeconds: saved && saved.durationSeconds > 0 ? saved.durationSeconds : targetSecs,
  };
};

// Browsers that ran a timer before server sync hold progress only locally. Returns true
// once per user, and only if the marker is stored: repeating the upload later would bring
// back a state that another device has since reset.
export const claimLocalProgressUpload = (userId: string): boolean => {
  const key = `${UPLOADED_KEY_PREFIX}${userId}`;
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, '1');
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};
