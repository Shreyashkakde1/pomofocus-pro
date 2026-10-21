# Desktop Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide native system desktop notifications when a focus or break block finishes, dismissible and clickable to bring the tab into focus and silence the alarm.

**Architecture:** Create an isolated, SSR-safe notification utility (`frontend/src/utils/notifications.ts`) that interfaces with the HTML5 `Notification` API. Wire completion triggers into `useStore.onTimerComplete`, permission onboarding into `startTimer`, and an in-app toggle bell into `Header.tsx`.

**Tech Stack:** TypeScript, React 19, Zustand, HTML5 Notification API, Vitest

**Spec:** [`docs/superpowers/specs/2026-10-21-desktop-notifications-design.md`](file:///home/shreyash/projects/pomofocus-pro/docs/superpowers/specs/2026-10-21-desktop-notifications-design.md)

## Global Constraints
- Every change MUST be committed to a feature branch (`feat/desktop-notifications`) and merged via Pull Request.
- No direct pushes to `main`.
- No emojis in commit messages or Pull Request descriptions.
- Zero crashes if `Notification` is unsupported (graceful fallback).
- Clicking notification must focus tab and silence the alarm audio.

## Review Focus
1. Unsupported browser / iframe security context: does `isSupported()` cleanly false-out without thrown exceptions?
2. Permission denied by user: does the app cleanly fall back to audio-only without recurring browser prompts?
3. Rapid completions: does each notification close appropriately without creating dangling references?
4. Mute / disabled toggle: does toggling the bell in `Header` persist state to `localStorage`?
5. Click handler memory management: does `onclick` on the notification safely focus the window and silence audio?

---

### Task 1: Desktop Notification Utility (`notifications.ts`)

**Files:**
- Create: `frontend/src/utils/notifications.test.ts`
- Create: `frontend/src/utils/notifications.ts`

**Interfaces:**
- Produces:
  - `notifications.isSupported(): boolean`
  - `notifications.getPermission(): NotificationPermission`
  - `notifications.requestPermission(): Promise<boolean>`
  - `notifications.isEnabled(): boolean`
  - `notifications.setEnabled(enabled: boolean): void`
  - `notifications.sendCompletionNotification(mode: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK', taskTitle?: string): Notification | null`

- [ ] **Step 1: Write failing test in `notifications.test.ts`**
  Assert permission checks, preference persistence in localStorage, and notification creation with click handler.
- [ ] **Step 2: Run test to verify failure**
  Run: `cd frontend && npm test -- src/utils/notifications.test.ts`
  Expected: FAIL
- [ ] **Step 3: Implement `notifications.ts`**
  Implement safe HTML5 Notification API wrapper with click handler:
  `notification.onclick = () => { window.focus(); soundEffects.stopTimerAlarm(); notification.close(); }`
- [ ] **Step 4: Run test to verify pass**
  Run: `cd frontend && npm test -- src/utils/notifications.test.ts`
  Expected: PASS
- [ ] **Step 5: Commit**
  ```bash
  git add frontend/src/utils/notifications.ts frontend/src/utils/notifications.test.ts
  git commit -m "feat(notifications): add system desktop notification engine with click dismissal"
  ```

---

### Task 2: Store & Timer Completion Integration

**Files:**
- Modify: `frontend/src/store/useStore.ts:800-820,1180-1200`

**Interfaces:**
- Consumes: `notifications.sendCompletionNotification()`, `notifications.requestPermission()`, `notifications.getPermission()`, `notifications.isEnabled()`

- [ ] **Step 1: Wire desktop notification into `onTimerComplete`**
  Trigger `notifications.sendCompletionNotification(mode, activeTask?.title)`.
- [ ] **Step 2: Wire permission onboarding into `startTimer`**
  If `notifications.isSupported()` and `notifications.getPermission() === 'default'`, call `notifications.requestPermission()`.
- [ ] **Step 3: Verify tests and TypeScript build**
  Run: `cd frontend && npm test && npm run build`
  Expected: SUCCESS
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/store/useStore.ts
  git commit -m "feat(timer): trigger desktop notification on timer complete and request permission on start"
  ```

---

### Task 3: Header Notification Toggle Control

**Files:**
- Modify: `frontend/src/components/Header.tsx`

**Interfaces:**
- Consumes: `notifications.isEnabled()`, `notifications.setEnabled()`, `notifications.getPermission()`, `notifications.requestPermission()`

- [ ] **Step 1: Add notification bell button to Header**
  Include tooltip showing permission status (`Enabled`, `Permission Required`, `Notifications Blocked`) and toggle handler.
- [ ] **Step 2: Verify tests and frontend build**
  Run: `cd frontend && npm test && npm run build`
  Expected: SUCCESS
- [ ] **Step 3: Commit**
  ```bash
  git add frontend/src/components/Header.tsx
  git commit -m "feat(ui): add desktop notification toggle bell to header"
  ```

---

### Task 4: Full Verification, Code Review & Pull Request

**Files:**
- Review git diff across branch `feat/desktop-notifications`

- [ ] **Step 1: Run full test suite & production build**
  Run: `cd frontend && npm test && npm run build`
- [ ] **Step 2: Subagent Code Review**
  Dispatch code review subagent to inspect diff against requirements, memory leaks, and SSR safety.
- [ ] **Step 3: Push branch and create Pull Request**
  Push `feat/desktop-notifications` to GitHub and open PR with clean description (no emojis).

