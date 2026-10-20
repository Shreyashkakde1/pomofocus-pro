# Timer Completion Alarm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an ambient, warm acoustic chime alarm that plays for up to 10 seconds when a focus or break block finishes, dismissible immediately by clicking anywhere.

**Architecture:** Extend procedural Web Audio synthesizer `soundEffects.ts` with an active alarm loop (`startTimerAlarm` / `stopTimerAlarm`). Hook alarm trigger into `useStore.onTimerComplete` and wire a lightweight, self-cleaning global click listener that stops audio upon first interaction.

**Tech Stack:** TypeScript, React 19, Zustand, Web Audio API, Vitest (for unit testing)

**Spec:** [`docs/superpowers/specs/2026-10-20-timer-alarm-design.md`](file:///home/shreyash/projects/pomofocus-pro/docs/superpowers/specs/2026-10-20-timer-alarm-design.md)

## Global Constraints
- Every change MUST be committed to a feature branch (`feat/timer-alarm`) and merged via Pull Request.
- No direct pushes to `main`.
- Web Audio synthesis only—no external `.mp3` or `.wav` assets.
- Must honor `soundEffects.getMuted()`.
- Global click listener must detach immediately upon click or 10-second timeout to avoid memory leaks.

## Review Focus
1. User clicks somewhere immediately after alarm rings: does the sound stop instantly without breaking the click's target action?
2. User is away from desk: does the alarm automatically silence at 10 seconds without lingering intervals?
3. User has muted sound effects: does `startTimerAlarm()` cleanly no-op without creating dangling timers?
4. Rapid double completion / reset: does triggering a new state or reset cancel any running alarm cleanly?
5. AudioContext suspension policy: does browser autoplay policy handle user gesture resume cleanly?

---

### Task 1: Test Infrastructure Setup (Vitest)

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`

**Interfaces:**
- Produces: `npm test` command executing unit tests across `frontend/src/**/*.test.ts`

- [ ] **Step 1: Install `vitest` in frontend**
  Run: `cd frontend && npm install -D vitest`
- [ ] **Step 2: Add test script to package.json**
  Add `"test": "vitest run"` to scripts.
- [ ] **Step 3: Verify test runner works**
  Run: `npm test` in `frontend/` (expect 0 tests or empty pass).
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/package.json frontend/package-lock.json
  git commit -m "chore: add vitest runner to frontend"
  ```

---

### Task 2: Procedural Alarm Synthesizer (`soundEffects.ts`)

**Files:**
- Create: `frontend/src/utils/soundEffects.test.ts`
- Modify: `frontend/src/utils/soundEffects.ts`

**Interfaces:**
- Produces:
  - `soundEffects.startTimerAlarm(): void`
  - `soundEffects.stopTimerAlarm(): void`
  - `soundEffects.isAlarmActive(): boolean`

- [ ] **Step 1: Write failing test in `soundEffects.test.ts`**
  ```typescript
  import { describe, it, expect, vi, beforeEach } from 'vitest';
  import { soundEffects } from './soundEffects';

  describe('SoundSynthesizer Timer Alarm', () => {
    beforeEach(() => {
      soundEffects.stopTimerAlarm();
      soundEffects.setMuted(false);
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
  });
  ```
- [ ] **Step 2: Run test to verify failure**
  Run: `cd frontend && npm test -- src/utils/soundEffects.test.ts`
  Expected: FAIL (methods undefined).
- [ ] **Step 3: Implement `startTimerAlarm`, `stopTimerAlarm`, and `isAlarmActive`**
  In `soundEffects.ts`:
  - Add `private alarmInterval: any = null;`
  - Add `private alarmTimeout: any = null;`
  - Add `private activeAlarmOscillators: OscillatorNode[] = [];`
  - Implement warm acoustic chime chords (E4, G#4, B4, E5 with soft exponential gain decay).
  - Loop chord cadence every ~2.2s for up to 10s max.
  - Implement cleanup in `stopTimerAlarm()`.
- [ ] **Step 4: Run test to verify pass**
  Run: `cd frontend && npm test -- src/utils/soundEffects.test.ts`
  Expected: PASS
- [ ] **Step 5: Commit**
  ```bash
  git add frontend/src/utils/soundEffects.ts frontend/src/utils/soundEffects.test.ts
  git commit -m "feat(audio): add procedural warm acoustic timer alarm with 10s timeout"
  ```

---

### Task 3: Store & Dismissal Integration (`useStore.ts` & `TimerCenter.tsx`)

**Files:**
- Modify: `frontend/src/store/useStore.ts:1174-1265`
- Modify: `frontend/src/components/TimerCenter.tsx`

**Interfaces:**
- Consumes: `soundEffects.startTimerAlarm()`, `soundEffects.stopTimerAlarm()`, `soundEffects.isAlarmActive()`

- [ ] **Step 1: Trigger alarm in `useStore.onTimerComplete`**
  - Replace `soundEffects.playCompletionChime()` with `soundEffects.startTimerAlarm()` when a timer block expires.
- [ ] **Step 2: Attach global click dismissal listener**
  - In `TimerCenter.tsx` (or top-level store hook), attach a window `pointerdown` listener when alarm is active.
  - First click triggers `soundEffects.stopTimerAlarm()` and immediately removes the listener.
  - Also ensure clicking "Start", "Reset", or "Skip" calls `soundEffects.stopTimerAlarm()`.
- [ ] **Step 3: Verify TypeScript compilation & frontend build**
  Run: `cd frontend && npm run build`
  Expected: SUCCESS (exit code 0).
- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/store/useStore.ts frontend/src/components/TimerCenter.tsx
  git commit -m "feat(timer): trigger acoustic alarm on completion and dismiss on click"
  ```

---

### Task 4: Full Verification, Code Review & Pull Request

**Files:**
- Review git diff across branch `feat/timer-alarm`

- [ ] **Step 1: Run frontend test suite & build check**
  Run: `cd frontend && npm test && npm run build`
- [ ] **Step 2: Subagent Code Review**
  Dispatch code review check to verify diff quality, listener detachment, and safety.
- [ ] **Step 3: Push branch and create Pull Request**
  Push `feat/timer-alarm` to GitHub and open PR with descriptive summary.

