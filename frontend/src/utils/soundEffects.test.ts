import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { soundEffects } from './soundEffects';

describe('SoundSynthesizer Timer Alarm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    soundEffects.stopTimerAlarm();
    soundEffects.setMuted(false);
  });

  afterEach(() => {
    soundEffects.stopTimerAlarm();
    vi.useRealTimers();
  });

  it('activates alarm state on startTimerAlarm and deactivates on stopTimerAlarm', () => {
    soundEffects.startTimerAlarm();
    expect(soundEffects.isAlarmActive()).toBe(true);
    soundEffects.stopTimerAlarm();
    expect(soundEffects.isAlarmActive()).toBe(false);
  });

  it('does not activate alarm when muted', () => {
    soundEffects.setMuted(true);
    soundEffects.startTimerAlarm();
    expect(soundEffects.isAlarmActive()).toBe(false);
  });

  it('does not activate alarm when volume is zero or less', () => {
    soundEffects.setVolume(0);
    soundEffects.startTimerAlarm();
    expect(soundEffects.isAlarmActive()).toBe(false);

    soundEffects.setVolume(0.5);
  });

  it('immediately silences active alarm when setMuted(true) is called', () => {
    soundEffects.startTimerAlarm();
    expect(soundEffects.isAlarmActive()).toBe(true);

    soundEffects.setMuted(true);
    expect(soundEffects.isAlarmActive()).toBe(false);
  });

  it('stops alarm after 4 cycles without abrupt truncation', () => {
    soundEffects.startTimerAlarm();
    expect(soundEffects.isAlarmActive()).toBe(true);

    // Initial cycle played (0s)
    // 1st interval (2.4s) -> cycle 2
    // 2nd interval (4.8s) -> cycle 3
    // 3rd interval (7.2s) -> cycle 4
    // 4th interval (9.6s) -> cyclesPlayed >= 4 -> triggers stopTimerAlarm()
    vi.advanceTimersByTime(9600);
    expect(soundEffects.isAlarmActive()).toBe(false);
  });

  it('automatically deactivates after 10 seconds timeout', () => {
    soundEffects.startTimerAlarm();
    expect(soundEffects.isAlarmActive()).toBe(true);

    vi.advanceTimersByTime(10000);
    expect(soundEffects.isAlarmActive()).toBe(false);
  });

  it('silences alarm immediately when pointerdown event occurs', () => {
    const listeners: Record<string, Function> = {};
    const originalWindow = globalThis.window;
    globalThis.window = {
      addEventListener: (type: string, fn: any) => { listeners[type] = fn; },
      removeEventListener: (type: string, _fn: any) => { delete listeners[type]; },
    } as any;

    try {
      soundEffects.startTimerAlarm();
      expect(soundEffects.isAlarmActive()).toBe(true);

      if (listeners['pointerdown']) {
        listeners['pointerdown']();
      }
      expect(soundEffects.isAlarmActive()).toBe(false);
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
