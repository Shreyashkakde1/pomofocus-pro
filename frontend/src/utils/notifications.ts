/**
 * Desktop Notification Engine (HTML5 Notification API)
 * Dispatches system notifications upon timer completion.
 * Clicking a notification brings the app window to focus and silences active alarms.
 */
import { soundEffects } from './soundEffects';

class NotificationEngine {
  private enabled: boolean = true;
  private listeners: Set<() => void> = new Set();

  constructor() {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        const saved = window.localStorage.getItem('pomopro_notifications_enabled');
        if (saved !== null) {
          this.enabled = saved === 'true';
        }
      }
    } catch {
      // Graceful fallback for restricted storage environments
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // Safe dispatch
      }
    });
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && Boolean(window.Notification);
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return window.Notification.permission;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await window.Notification.requestPermission();
      this.notify();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem('pomopro_notifications_enabled', String(enabled));
      }
    } catch {
      // Graceful fallback for restricted storage environments
    }
    this.notify();
  }

  public sendCompletionNotification(
    mode: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK',
    taskTitle?: string
  ): Notification | null {
    if (!this.isSupported() || !this.enabled || this.getPermission() !== 'granted') {
      return null;
    }

    try {
      let title = "Time's up! Focus session complete";
      let body = taskTitle
        ? `Great focus on "${taskTitle}". Time to take a break!`
        : 'Focus interval complete. Time to take a break!';

      if (mode === 'SHORT_BREAK' || mode === 'LONG_BREAK') {
        title = 'Break is over!';
        body = taskTitle
          ? `Ready to resume focus on "${taskTitle}"?`
          : 'Ready to start your next focus block?';
      }

      const notif = new window.Notification(title, {
        body,
        icon: '/favicon.svg',
        tag: 'pomopro-timer-completion',
        renotify: true,
      } as NotificationOptions);

      notif.onclick = () => {
        if (typeof window !== 'undefined' && window.focus) {
          window.focus();
        }
        soundEffects.stopTimerAlarm();
        notif.close();
      };

      return notif;
    } catch {
      return null;
    }
  }
}

export const notifications = new NotificationEngine();
