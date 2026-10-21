import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notifications } from './notifications';
import { soundEffects } from './soundEffects';

describe('Desktop Notification Engine', () => {
  let mockNotificationConstructor: any;
  let mockInstances: any[] = [];
  let originalNotification: any;
  let originalWindow: any;

  beforeEach(() => {
    mockInstances = [];
    mockNotificationConstructor = vi.fn(function (this: any, title: string, options: any) {
      this.title = title;
      this.options = options;
      this.onclick = null;
      this.close = vi.fn();
      mockInstances.push(this);
    });
    mockNotificationConstructor.permission = 'granted';
    mockNotificationConstructor.requestPermission = vi.fn().mockResolvedValue('granted');

    originalNotification = (globalThis as any).Notification;
    (globalThis as any).Notification = mockNotificationConstructor;

    originalWindow = globalThis.window;
    globalThis.window = {
      Notification: mockNotificationConstructor,
      focus: vi.fn(),
      localStorage: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
      },
    } as any;

    notifications.setEnabled(true);
  });

  afterEach(() => {
    (globalThis as any).Notification = originalNotification;
    globalThis.window = originalWindow;
    vi.restoreAllMocks();
  });

  it('checks if Notification is supported', () => {
    expect(notifications.isSupported()).toBe(true);
  });

  it('reports current permission level', () => {
    expect(notifications.getPermission()).toBe('granted');
    mockNotificationConstructor.permission = 'denied';
    expect(notifications.getPermission()).toBe('denied');
  });

  it('requests permission and updates state', async () => {
    const result = await notifications.requestPermission();
    expect(mockNotificationConstructor.requestPermission).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('sends focus completion notification with task title, renotify and svg icon', () => {
    const notif = notifications.sendCompletionNotification('FOCUS', 'Deep Work DSA');
    expect(notif).not.toBeNull();
    expect(notif?.title).toBe('Time\'s up! Focus session complete');
    expect((notif as any)?.options?.body).toContain('Deep Work DSA');
    expect((notif as any)?.options?.icon).toBe('/favicon.svg');
    expect((notif as any)?.options?.renotify).toBe(true);
  });

  it('sends break completion notification', () => {
    const notif = notifications.sendCompletionNotification('SHORT_BREAK');
    expect(notif).not.toBeNull();
    expect(notif?.title).toBe('Break is over!');
  });

  it('clicking notification focuses window, silences alarm, and closes notification', () => {
    const stopAlarmSpy = vi.spyOn(soundEffects, 'stopTimerAlarm');
    const notif = notifications.sendCompletionNotification('FOCUS', 'Test Task');
    expect(notif).not.toBeNull();

    // Trigger click handler
    if (notif && notif.onclick) {
      notif.onclick.call(notif, new Event('click'));
    }
    expect(globalThis.window.focus).toHaveBeenCalled();
    expect(stopAlarmSpy).toHaveBeenCalled();
    expect(notif!.close).toHaveBeenCalled();
  });

  it('persists enabled preference to localStorage and alerts subscribers', () => {
    const listener = vi.fn();
    const unsub = notifications.subscribe(listener);

    notifications.setEnabled(false);
    expect(globalThis.window.localStorage.setItem).toHaveBeenCalledWith('pomopro_notifications_enabled', 'false');
    expect(listener).toHaveBeenCalled();

    unsub();
  });

  it('handles unsupported environment gracefully', () => {
    delete (globalThis.window as any).Notification;
    expect(notifications.isSupported()).toBe(false);
    expect(notifications.getPermission()).toBe('denied');
    expect(notifications.sendCompletionNotification('FOCUS')).toBeNull();
  });

  it('does not send notification when disabled or permission is denied', () => {
    notifications.setEnabled(false);
    expect(notifications.sendCompletionNotification('FOCUS')).toBeNull();

    notifications.setEnabled(true);
    mockNotificationConstructor.permission = 'denied';
    expect(notifications.sendCompletionNotification('FOCUS')).toBeNull();
  });
});
