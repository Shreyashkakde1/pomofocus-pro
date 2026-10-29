import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TaskDto } from '../api/client';

// The store reads localStorage at import time, and Vitest runs in a node environment.
vi.hoisted(() => {
  const data = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    setItem: (k: string, v: string) => data.set(k, String(v)),
    removeItem: (k: string) => data.delete(k),
    clear: () => data.clear(),
  };
});

vi.mock('../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/client')>()),
  api: {
    sessions: { log: vi.fn() },
    tasks: { list: vi.fn() },
    dailyTasks: { list: vi.fn() },
    auth: { me: vi.fn(), demoLogin: vi.fn() },
  },
}));

vi.mock('../utils/soundEffects', () => ({
  soundEffects: new Proxy({}, { get: () => vi.fn() }),
}));

vi.mock('../utils/notifications', () => ({
  notifications: new Proxy({}, { get: () => vi.fn() }),
}));

import { api, ApiError } from '../api/client';
import type { UserDto } from '../api/client';
import { useStore, applyFocusSlice } from './useStore';

const makeTask = (id: string, dailyTargetMinutes: number): TaskDto => ({
  id,
  title: id,
  category: 'General',
  colorHex: '#000000',
  dailyTargetMinutes,
  isArchived: false,
  sortOrder: 0,
  todayFocusSeconds: 0,
  todayFocusMinutes: 0,
  progressPercentage: 0,
  deficitOrSurplusMinutes: -dailyTargetMinutes,
} as unknown as TaskDto);

const logMock = api.sessions.log as unknown as ReturnType<typeof vi.fn>;

const loggedSecondsFor = (taskId: string) =>
  logMock.mock.calls
    .map(([req]) => req)
    .filter((req) => req.taskId === taskId)
    .reduce((sum, req) => sum + req.durationSeconds, 0);

// Simulates the worker counting down while the timer runs.
const tick = (seconds: number) => {
  for (let i = 0; i < seconds; i++) {
    useStore.getState().setRemainingSeconds(useStore.getState().remainingSeconds - 1);
  }
};

const loadDeck = (tasks: TaskDto[], activeTaskId: string) => {
  const active = tasks.find((t) => t.id === activeTaskId)!;
  const secs = active.dailyTargetMinutes * 60;
  useStore.setState({
    isAuthenticated: true,
    tasks,
    activeTaskId,
    mode: 'FOCUS',
    isRunning: false,
    durationSeconds: secs,
    remainingSeconds: secs,
    focusSliceStart: null,
    sessionRemainingAtStart: null,
    focusRemainingByTask: {},
    fetchTasks: vi.fn().mockResolvedValue(undefined),
  });
};

describe('applyFocusSlice', () => {
  it('floors minutes to match the backend', () => {
    const task = makeTask('a', 120);
    expect(applyFocusSlice(task, 7199).todayFocusMinutes).toBe(119);
    expect(applyFocusSlice(task, 7200).todayFocusMinutes).toBe(120);
    expect(applyFocusSlice(task, 7200).progressPercentage).toBe(100);
    expect(applyFocusSlice(task, 7200).deficitOrSurplusMinutes).toBe(0);
  });
});

describe('focus time accounting', () => {
  beforeEach(() => {
    logMock.mockReset();
    logMock.mockResolvedValue({});
  });

  it.each([1, 25, 60, 120, 360])('credits exactly %i minutes for an uninterrupted block', async (minutes) => {
    loadDeck([makeTask('a', minutes)], 'a');
    useStore.getState().startTimer();
    tick(minutes * 60);
    await useStore.getState().onTimerComplete();
    expect(loggedSecondsFor('a')).toBe(minutes * 60);
  });

  it('does not lose seconds that tick while a pause is being logged', async () => {
    loadDeck([makeTask('a', 120)], 'a');

    let releaseLog!: () => void;
    logMock.mockImplementationOnce(() => new Promise<void>((r) => { releaseLog = r; }));

    useStore.getState().startTimer();
    tick(1800);
    const pausing = useStore.getState().pauseTimer();

    // The clock must stop immediately, not after the network call.
    expect(useStore.getState().isRunning).toBe(false);
    // A TICK the worker posted before it saw PAUSE arrives late and must be ignored.
    tick(1);
    expect(useStore.getState().remainingSeconds).toBe(7200 - 1800);

    releaseLog();
    await pausing;

    useStore.getState().startTimer();
    tick(7200 - 1800);
    await useStore.getState().onTimerComplete();

    expect(loggedSecondsFor('a')).toBe(7200);
    expect(useStore.getState().tasks[0].todayFocusMinutes).toBe(120);
  });

  it('credits a full 120-minute deck across pauses, hot-switches and a skip', async () => {
    loadDeck([makeTask('a', 120), makeTask('b', 30)], 'a');
    const s = () => useStore.getState();

    s().startTimer(); tick(1000); await s().pauseTimer();
    s().startTimer(); tick(500);
    await s().hotSwitchTask('b');
    tick(300);
    await s().hotSwitchTask('a');
    tick(2000);
    await s().skipTimer();          // to break, keeps a's remaining time
    await s().skipTimer();          // back to focus on a
    s().startTimer(); tick(7200 - 3500);
    await s().onTimerComplete();

    expect(loggedSecondsFor('a')).toBe(7200);
    expect(loggedSecondsFor('b')).toBe(300);
  });

  it('logs a completed block once even if paused while the log request is in flight', async () => {
    loadDeck([makeTask('a', 25)], 'a');
    useStore.getState().startTimer();
    tick(1500);
    const completing = useStore.getState().onTimerComplete();
    await useStore.getState().pauseTimer();
    await completing;
    expect(loggedSecondsFor('a')).toBe(1500);
  });
});

describe('session restore and user isolation', () => {
  const meMock = api.auth.me as unknown as ReturnType<typeof vi.fn>;
  const demoMock = api.auth.demoLogin as unknown as ReturnType<typeof vi.fn>;
  const tasksMock = api.tasks.list as unknown as ReturnType<typeof vi.fn>;
  const dailyMock = api.dailyTasks.list as unknown as ReturnType<typeof vi.fn>;

  const shreyash = { id: 'user-shreyash', username: 'shreyash_kakde', email: 's@example.com' } as UserDto;
  const other = { id: 'user-other', username: 'someone_else', email: 'o@example.com' } as UserDto;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    tasksMock.mockResolvedValue([]);
    dailyMock.mockResolvedValue([]);
    useStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isAuthModalOpen: false,
      authNotice: null,
      tasks: [],
      dailyTasks: [],
      activeTaskId: null,
      focusRemainingByTask: {},
      fetchTasks: useStore.getInitialState().fetchTasks,
      fetchDailyTasks: useStore.getInitialState().fetchDailyTasks,
    });
  });

  it('restores the stored user without touching the demo login', async () => {
    localStorage.setItem('pomopro_token', 'token-shreyash');
    meMock.mockResolvedValue(shreyash);

    await useStore.getState().loadCurrentUser();

    expect(useStore.getState().user?.username).toBe('shreyash_kakde');
    expect(useStore.getState().isAuthenticated).toBe(true);
    expect(demoMock).not.toHaveBeenCalled();
  });

  it('expires the session instead of switching to the demo user when the token is rejected', async () => {
    localStorage.setItem('pomopro_token', 'token-expired');
    useStore.setState({ tasks: [makeTask('shreyash-target', 120)], activeTaskId: 'shreyash-target' });
    meMock.mockRejectedValue(new ApiError('Forbidden', 403));

    await useStore.getState().loadCurrentUser();

    const s = useStore.getState();
    expect(demoMock).not.toHaveBeenCalled();
    expect(s.user).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(localStorage.getItem('pomopro_token')).toBeNull();
    expect(s.tasks).toEqual([]);
    expect(s.activeTaskId).toBeNull();
    expect(s.isAuthModalOpen).toBe(true);
    expect(s.authNotice).toMatch(/expired/i);
  });

  it('keeps the stored session when /auth/me fails because the network is not back yet', async () => {
    localStorage.setItem('pomopro_token', 'token-shreyash');
    useStore.setState({ token: 'token-shreyash', isAuthenticated: true });
    meMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await useStore.getState().loadCurrentUser();

    expect(demoMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('pomopro_token')).toBe('token-shreyash');
    expect(useStore.getState().isAuthenticated).toBe(true);
  });

  it('does not sign in automatically when there is no stored session', async () => {
    await useStore.getState().loadCurrentUser();

    expect(demoMock).not.toHaveBeenCalled();
    expect(useStore.getState().isAuthenticated).toBe(false);
    expect(useStore.getState().isAuthModalOpen).toBe(true);
  });

  it('clears the previous account data when a different user signs in', () => {
    useStore.setState({
      user: shreyash,
      token: 'token-shreyash',
      isAuthenticated: true,
      tasks: [makeTask('shreyash-target', 120)],
      activeTaskId: 'shreyash-target',
      focusRemainingByTask: { 'shreyash-target': { remainingSeconds: 60, durationSeconds: 7200 } },
    });

    useStore.getState().setAuth(other, 'token-other');

    const s = useStore.getState();
    expect(s.user?.id).toBe('user-other');
    expect(s.activeTaskId).toBeNull();
    expect(s.focusRemainingByTask).toEqual({});
  });

  it('drops a task list that arrives after its session ended', async () => {
    let resolveList!: (tasks: TaskDto[]) => void;
    tasksMock.mockImplementationOnce(() => new Promise((r) => { resolveList = r; }));
    useStore.setState({ user: shreyash, token: 'token-shreyash', isAuthenticated: true });

    const fetching = useStore.getState().fetchTasks();
    useStore.getState().logout();
    useStore.getState().setAuth(other, 'token-other');
    resolveList([makeTask('shreyash-target', 120)]);
    await fetching;

    expect(useStore.getState().tasks.find((t) => t.id === 'shreyash-target')).toBeUndefined();
  });
});
