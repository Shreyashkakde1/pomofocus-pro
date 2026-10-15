/**
 * High-Precision Timer Web Worker
 * Runs in an isolated background thread immune to browser tab throttling.
 * Uses performance.now() delta tracking for microsecond precision.
 */

interface TimerState {
  isRunning: boolean;
  targetEndTime: number;
  remainingSeconds: number;
  durationSeconds: number;
}

let state: TimerState = {
  isRunning: false,
  targetEndTime: 0,
  remainingSeconds: 25 * 60,
  durationSeconds: 25 * 60,
};

let intervalId: number | null = null;

function tick() {
  if (!state.isRunning) return;

  const now = performance.now();
  const msRemaining = state.targetEndTime - now;
  const secsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));

  state.remainingSeconds = secsRemaining;

  self.postMessage({
    type: 'TICK',
    remainingSeconds: secsRemaining,
    elapsedSeconds: state.durationSeconds - secsRemaining,
  });

  if (secsRemaining <= 0) {
    state.isRunning = false;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    self.postMessage({
      type: 'COMPLETE',
    });
  }
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'START': {
      const remainingSecs = payload?.remainingSeconds ?? state.remainingSeconds;
      const durationSecs = payload?.durationSeconds ?? state.durationSeconds;
      state.durationSeconds = durationSecs;
      state.remainingSeconds = remainingSecs;
      state.isRunning = true;
      state.targetEndTime = performance.now() + remainingSecs * 1000;

      if (intervalId !== null) clearInterval(intervalId);
      intervalId = self.setInterval(tick, 100); // 100ms high-resolution check
      break;
    }

    case 'PAUSE': {
      state.isRunning = false;
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      self.postMessage({
        type: 'PAUSED',
        remainingSeconds: state.remainingSeconds,
      });
      break;
    }

    case 'RESET': {
      state.isRunning = false;
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      const dur = payload?.durationSeconds ?? 25 * 60;
      state.durationSeconds = dur;
      state.remainingSeconds = dur;
      self.postMessage({
        type: 'RESET',
        remainingSeconds: dur,
      });
      break;
    }

    case 'SET_TIME': {
      const remaining = payload?.remainingSeconds ?? 25 * 60;
      state.remainingSeconds = remaining;
      state.durationSeconds = payload?.durationSeconds ?? remaining;
      if (state.isRunning) {
        state.targetEndTime = performance.now() + remaining * 1000;
      }
      self.postMessage({
        type: 'TICK',
        remainingSeconds: remaining,
        elapsedSeconds: state.durationSeconds - remaining,
      });
      break;
    }
  }
};

