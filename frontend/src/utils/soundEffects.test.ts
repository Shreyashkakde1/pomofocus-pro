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

  it('automatically deactivates after 10 seconds timeout', () => {
    soundEffects.startTimerAlarm();
    expect(soundEffects.isAlarmActive()).toBe(true);

    vi.advanceTimersByTime(10000);
    expect(soundEffects.isAlarmActive()).toBe(false);
  });
});
