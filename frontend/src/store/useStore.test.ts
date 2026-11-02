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
    timerStates: { list: vi.fn(), save: vi.fn(), remove: vi.fn() },
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
import { clearPendingTimerOps, loadPendingTimerOps, queueTimerOp } from './timerSync';

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
    (api.timerStates.list as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
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

describe('cross-device timer sync', () => {
  const user = { id: 'u1', email: 'u@test', username: 'u' } as unknown as UserDto;
  const listStates = api.timerStates.list as unknown as ReturnType<typeof vi.fn>;
  const saveState = api.timerStates.save as unknown as ReturnType<typeof vi.fn>;
  const removeState = api.timerStates.remove as unknown as ReturnType<typeof vi.fn>;
  const listTasks = api.tasks.list as unknown as ReturnType<typeof vi.fn>;
  const NOW = '2026-11-02T10:00:00.000Z';
  const stateFor = (taskId: string, remainingSeconds: number, durationSeconds: number, updatedAt = NOW) => ({
    taskId, remainingSeconds, durationSeconds, updatedAt,
  });

  // A browser that has never run this account's timer.
  const freshBrowser = (tasks: TaskDto[]) => {
    listTasks.mockResolvedValue(tasks);
    useStore.setState({
      user,
      token: 't',
      isAuthenticated: true,
      activeTaskId: null,
      mode: 'FOCUS',
      isRunning: false,
      durationSeconds: 1500,
      remainingSeconds: 1500,
      focusSliceStart: null,
      sessionRemainingAtStart: null,
      focusRemainingByTask: {},
      fetchTasks: realFetchTasks,
    });
  };
  const realFetchTasks = useStore.getState().fetchTasks;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    clearPendingTimerOps();
    logMock.mockResolvedValue({});
    listStates.mockResolvedValue([]);
    saveState.mockResolvedValue(undefined);
    removeState.mockResolvedValue(undefined);
    // Accounts in these tests are not upgrading from local-only timers unless a test says so.
    localStorage.setItem('pomopro_timer_states_uploaded_u1', '1');
  });

  it('shows the remaining time saved on another device instead of the full target', async () => {
    freshBrowser([makeTask('side-hustle', 180)]);
    listStates.mockResolvedValue([stateFor('side-hustle', 8400, 10800)]);

    await useStore.getState().fetchTasks();

    const s = useStore.getState();
    expect(s.activeTaskId).toBe('side-hustle');
    expect(s.remainingSeconds).toBe(8400);
    expect(s.durationSeconds).toBe(10800);
  });

  it('opens the target most recently saved on another device', async () => {
    freshBrowser([makeTask('a', 60), makeTask('b', 60)]);
    listStates.mockResolvedValue([
      stateFor('a', 100, 3600, '2026-11-02T09:00:00.000Z'),
      stateFor('b', 200, 3600, '2026-11-02T10:00:00.000Z'),
    ]);

    await useStore.getState().fetchTasks();

    expect(useStore.getState().activeTaskId).toBe('b');
    expect(useStore.getState().remainingSeconds).toBe(200);
  });

  it('uses the full target when no device has saved progress', async () => {
    freshBrowser([makeTask('a', 60)]);

    await useStore.getState().fetchTasks();

    expect(useStore.getState().remainingSeconds).toBe(3600);
  });

  it('picks up progress from another device when an idle browser refreshes', async () => {
    freshBrowser([makeTask('a', 60)]);
    useStore.setState({ activeTaskId: 'a', remainingSeconds: 3000, durationSeconds: 3600, focusRemainingByTask: { a: { remainingSeconds: 3000, durationSeconds: 3600 } } });
    listStates.mockResolvedValue([stateFor('a', 1200, 3600)]);

    await useStore.getState().fetchTasks();

    expect(useStore.getState().remainingSeconds).toBe(1200);
  });

  it('returns to the full target after another device reset it', async () => {
    freshBrowser([makeTask('a', 60)]);
    useStore.setState({ activeTaskId: 'a', remainingSeconds: 3000, durationSeconds: 3600, focusRemainingByTask: { a: { remainingSeconds: 3000, durationSeconds: 3600 } } });

    await useStore.getState().fetchTasks();

    expect(useStore.getState().remainingSeconds).toBe(3600);
    expect(useStore.getState().focusRemainingByTask.a).toBeUndefined();
  });

  it('does not touch a running clock', async () => {
    freshBrowser([makeTask('a', 60)]);
    useStore.setState({ activeTaskId: 'a', isRunning: true, remainingSeconds: 3000, durationSeconds: 3600 });
    listStates.mockResolvedValue([stateFor('a', 1200, 3600)]);

    await useStore.getState().fetchTasks();

    expect(useStore.getState().remainingSeconds).toBe(3000);
    expect(useStore.getState().isRunning).toBe(true);
  });

  it('keeps the old local state when the server cannot be reached', async () => {
    freshBrowser([makeTask('a', 60)]);
    useStore.setState({ activeTaskId: 'a', remainingSeconds: 3000, durationSeconds: 3600, focusRemainingByTask: { a: { remainingSeconds: 3000, durationSeconds: 3600 } } });
    listStates.mockRejectedValue(new TypeError('offline'));

    await useStore.getState().fetchTasks();

    expect(useStore.getState().remainingSeconds).toBe(3000);
  });

  it('saves on pause, once, with the paused values', async () => {
    loadDeck([makeTask('a', 180)], 'a');
    useStore.setState({ user, token: 't' });
    useStore.getState().startTimer();
    tick(2400);

    await useStore.getState().pauseTimer();

    expect(saveState).toHaveBeenCalledTimes(1);
    expect(saveState).toHaveBeenCalledWith('a', { remainingSeconds: 8400, durationSeconds: 10800 });
  });

  it('does not save when pausing a timer that is not running, or on every tick', async () => {
    loadDeck([makeTask('a', 180)], 'a');
    useStore.setState({ user, token: 't' });
    await useStore.getState().pauseTimer();
    expect(saveState).not.toHaveBeenCalled();

    useStore.getState().startTimer();
    tick(60);
    expect(saveState).not.toHaveBeenCalled();
  });

  it('saves the outgoing target on a running hot-switch', async () => {
    loadDeck([makeTask('a', 60), makeTask('b', 30)], 'a');
    useStore.setState({ user, token: 't' });
    useStore.getState().startTimer();
    tick(600);

    await useStore.getState().hotSwitchTask('b');

    expect(saveState).toHaveBeenCalledWith('a', { remainingSeconds: 3000, durationSeconds: 3600 });
  });

  it('deletes the saved state on reset', async () => {
    loadDeck([makeTask('a', 1)], 'a');
    useStore.setState({ user, token: 't' });

    useStore.getState().resetTimer();

    await vi.waitFor(() => expect(removeState).toHaveBeenCalledWith('a'));
  });

  it('deletes the saved state when a block completes', async () => {
    loadDeck([makeTask('a', 1)], 'a');
    useStore.setState({ user, token: 't' });
    useStore.getState().startTimer();
    tick(60);

    await useStore.getState().onTimerComplete();

    await vi.waitFor(() => expect(removeState).toHaveBeenCalledWith('a'));
  });

  it('keeps an unsent change over the server and sends it on the next refresh', async () => {
    loadDeck([makeTask('a', 60)], 'a');
    useStore.setState({ user, token: 't' });
    saveState.mockRejectedValueOnce(new TypeError('offline'));
    useStore.getState().startTimer();
    tick(600);
    await useStore.getState().pauseTimer();
    await vi.waitFor(() => expect(saveState).toHaveBeenCalledTimes(1));

    useStore.setState({ fetchTasks: realFetchTasks });
    listTasks.mockResolvedValue([makeTask('a', 60)]);
    listStates.mockResolvedValue([stateFor('a', 3500, 3600, '2020-01-01T00:00:00.000Z')]);
    await vi.waitFor(() => expect(loadPendingTimerOps('u1').a).toBeDefined());
    await useStore.getState().fetchTasks();

    expect(useStore.getState().remainingSeconds).toBe(3000);
    expect(saveState).toHaveBeenLastCalledWith('a', { remainingSeconds: 3000, durationSeconds: 3600 });
    expect(loadPendingTimerOps('u1').a).toBeUndefined();
  });

  it('drops a change rejected by the server instead of retrying forever', async () => {
    loadDeck([makeTask('a', 60)], 'a');
    useStore.setState({ user, token: 't' });
    saveState.mockRejectedValueOnce(new ApiError('gone', 404));
    useStore.getState().startTimer();
    tick(60);
    await useStore.getState().pauseTimer();

    await vi.waitFor(() => expect(loadPendingTimerOps('u1').a).toBeUndefined());
  });

  it('never applies or sends another account\'s unsent changes', async () => {
    queueTimerOp('someone-else', 'a', { remainingSeconds: 5, durationSeconds: 10 });
    freshBrowser([makeTask('a', 60)]);

    await useStore.getState().fetchTasks();

    expect(useStore.getState().remainingSeconds).toBe(3600);
    expect(saveState).not.toHaveBeenCalled();
  });

  it('clears unsent changes on logout', () => {
    queueTimerOp('u1', 'a', { remainingSeconds: 5, durationSeconds: 10 });
    useStore.getState().logout();
    expect(loadPendingTimerOps('u1')).toEqual({});
  });

  it('uploads local-only progress once for a browser upgrading to server sync', async () => {
    localStorage.removeItem('pomopro_timer_states_uploaded_u1');
    freshBrowser([makeTask('a', 60), makeTask('b', 60)]);
    useStore.setState({
      activeTaskId: 'a',
      focusRemainingByTask: {
        a: { remainingSeconds: 3000, durationSeconds: 3600 },
        b: { remainingSeconds: 1000, durationSeconds: 3600 },
      },
    });
    listStates.mockResolvedValue([stateFor('b', 500, 3600)]);

    await useStore.getState().fetchTasks();

    expect(saveState).toHaveBeenCalledTimes(1);
    expect(saveState).toHaveBeenCalledWith('a', { remainingSeconds: 3000, durationSeconds: 3600 });
    expect(useStore.getState().remainingSeconds).toBe(3000);
    expect(useStore.getState().focusRemainingByTask.b.remainingSeconds).toBe(500);

    saveState.mockClear();
    listStates.mockResolvedValue([stateFor('b', 500, 3600)]);
    useStore.setState({ focusRemainingByTask: { a: { remainingSeconds: 3000, durationSeconds: 3600 } } });
    await useStore.getState().fetchTasks();
    expect(saveState).not.toHaveBeenCalled();
  });

  it('keeps timer progress when only the title changes, and resets it for a new budget', async () => {
    loadDeck([makeTask('a', 60)], 'a');
    (api.tasks as any).update = vi.fn().mockImplementation(async (_id, body) => ({ ...makeTask('a', body.dailyTargetMinutes), title: body.title }));
    useStore.setState({ user, token: 't', remainingSeconds: 3000, durationSeconds: 3600, focusRemainingByTask: { a: { remainingSeconds: 3000, durationSeconds: 3600 } } });

    await useStore.getState().updateTask('a', 'renamed', 'General', '#000', 60);
    expect(useStore.getState().remainingSeconds).toBe(3000);
    expect(removeState).not.toHaveBeenCalled();

    await useStore.getState().updateTask('a', 'renamed', 'General', '#000', 90);
    expect(useStore.getState().remainingSeconds).toBe(5400);
    await vi.waitFor(() => expect(removeState).toHaveBeenCalledWith('a'));
  });

  describe('reload or tab close', () => {
    const runFor = (seconds: number) => {
      loadDeck([makeTask('a', 180)], 'a');
      useStore.setState({ user, token: 't', remainingSeconds: 8400, durationSeconds: 10800 });
      useStore.getState().startTimer();
      tick(seconds);
    };

    it('sends the timer state and the slice with keepalive, and stays paused', () => {
      runFor(600);

      useStore.getState().pauseForUnload();

      expect(saveState).toHaveBeenCalledWith('a', { remainingSeconds: 7800, durationSeconds: 10800 }, { keepalive: true });
      expect(logMock).toHaveBeenCalledTimes(1);
      expect(logMock.mock.calls[0][0]).toMatchObject({ taskId: 'a', durationSeconds: 600, completed: false });
      expect(logMock.mock.calls[0][1]).toEqual({ keepalive: true });
      expect(useStore.getState().isRunning).toBe(false);
      expect(useStore.getState().tasks[0].todayFocusSeconds).toBe(600);
    });

    it('sends nothing more on a repeated pagehide', () => {
      runFor(600);
      useStore.getState().pauseForUnload();
      useStore.getState().pauseForUnload();
      expect(saveState).toHaveBeenCalledTimes(1);
      expect(logMock).toHaveBeenCalledTimes(1);
    });

    it('sends nothing when paused or on a break', () => {
      loadDeck([makeTask('a', 180)], 'a');
      useStore.setState({ user, token: 't' });
      useStore.getState().pauseForUnload();

      useStore.setState({ mode: 'SHORT_BREAK', isRunning: true });
      useStore.getState().pauseForUnload();

      expect(saveState).not.toHaveBeenCalled();
      expect(logMock).not.toHaveBeenCalled();
    });

    it('re-sends a lost timer state on the next load, and local beats the older server value', async () => {
      runFor(600);
      saveState.mockRejectedValueOnce(new TypeError('page closed'));
      useStore.getState().pauseForUnload();
      await vi.waitFor(() => expect(saveState).toHaveBeenCalledTimes(1));
      logMock.mockClear();

      useStore.setState({ fetchTasks: realFetchTasks });
      listTasks.mockResolvedValue([makeTask('a', 180)]);
      listStates.mockResolvedValue([stateFor('a', 8400, 10800, '2020-01-01T00:00:00.000Z')]);
      await useStore.getState().fetchTasks();

      expect(useStore.getState().remainingSeconds).toBe(7800);
      expect(useStore.getState().isRunning).toBe(false);
      expect(saveState).toHaveBeenCalledTimes(2);
      expect(saveState).toHaveBeenLastCalledWith('a', { remainingSeconds: 7800, durationSeconds: 10800 });
      expect(logMock).not.toHaveBeenCalled();
    });

    it('does not overwrite newer progress from another device with a write that was already delivered', async () => {
      runFor(600);
      useStore.getState().pauseForUnload();
      // The page died before the response, so the write is still queued on reopen.
      queueTimerOp('u1', 'a', { remainingSeconds: 7800, durationSeconds: 10800 });
      saveState.mockClear();

      useStore.setState({ fetchTasks: realFetchTasks });
      listTasks.mockResolvedValue([makeTask('a', 180)]);
      listStates.mockResolvedValue([stateFor('a', 6000, 10800, new Date(Date.now() + 60000).toISOString())]);
      await useStore.getState().fetchTasks();

      expect(saveState).not.toHaveBeenCalled();
      expect(useStore.getState().remainingSeconds).toBe(6000);
      expect(loadPendingTimerOps('u1')).toEqual({});
    });
  });
});
