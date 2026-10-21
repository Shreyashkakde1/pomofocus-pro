# Desktop Notifications Design Specification

**Date:** 2026-10-21  
**Feature:** System Desktop Notification on Timer Completion  
**Target:** Pomofocus Pro Frontend  

---

## 1. Intent & The "Why"
When users run a Pomodoro focus block or break, they often work in another application (IDE, terminal, reading document, or design tool) with their browser minimized or placed in a background tab. While the audio alarm alerts them audibly, a native system desktop notification (Windows Action Center, macOS Notification Center, Linux desktop notify) provides immediate visual context and a 1-click gateway back to the app to log their session or start their break.

## 2. Goals, Non-Goals, and Anti-Goals
* **Goals:**
  * Display a native system notification via the HTML5 `Notification` API when a focus block or break timer hits `00:00`.
  * Context-aware title and message including the active target's name.
  * Clicking the notification immediately focuses the browser tab (`window.focus()`) and silences the 10-second alarm audio (`soundEffects.stopTimerAlarm()`).
  * Seamless permission onboarding: request permission upon the user's first click on "Start Focus" (natural user gesture compliant with browser autoplay/notification security policies).
  * In-app toggle: A subtle bell icon in the header allowing users to enable/disable desktop notifications and see current permission status (`granted`, `denied`, `default`).
  * SSR/Test safe: Full guards for headless/Node environments and Vitest tests.
* **Non-Goals:**
  * Server-side push notifications (WebPush / VAPID). This is an entirely client-side desktop alert tied to the live browser tab.
* **Anti-Goals:**
  * No intrusive auto-prompting on initial page load (avoids browser permission spam penalties).
  * No crashing if `Notification` is unsupported (e.g. older mobile Safari or strict iframe contexts).

## 3. Decisions & Specifications
* **Utility Module:** `frontend/src/utils/notifications.ts`
  * `isNotificationSupported(): boolean`
  * `getNotificationPermission(): NotificationPermission`
  * `requestNotificationPermission(): Promise<boolean>`
  * `isNotificationEnabled(): boolean`
  * `setNotificationEnabled(enabled: boolean): void`
  * `sendTimerCompletionNotification(mode: TimerMode, taskTitle?: string): void`
* **Trigger Integration:**
  * `startTimer`: If `getNotificationPermission() === 'default'` and enabled, request permission without blocking timer start.
  * `onTimerComplete`: Call `sendTimerCompletionNotification(mode, activeTask?.title)`.
* **Click Action:**
  * `notification.onclick = () => { window.focus(); soundEffects.stopTimerAlarm(); notification.close(); }`

