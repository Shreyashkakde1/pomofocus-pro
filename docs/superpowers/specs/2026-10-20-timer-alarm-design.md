# Timer Completion Alarm Design Specification

**Date:** 2026-10-20  
**Feature:** Light Sound Alarm on Timer Completion  
**Target:** Pomofocus Pro Frontend  

---

## 1. Intent & The "Why"
When users run deep focus sessions or breaks, they frequently wear headphones or focus on code/study material in another window or screen. Currently, when the Pomodoro timer hits `00:00`, the transition is quiet (only a subtle checkmark chime). Users need an unmistakable but gentle cue that time is up, so they don't miss the transition without being startled by harsh buzzer noises.

## 2. Goals, Non-Goals, and Anti-Goals
* **Goals:**
  * Play an audible, pleasant, warm acoustic chime when a focus session or break timer ends.
  * Loop/repeat gently across a 10-second window.
  * Allow effortless dismissal: clicking anywhere on the screen immediately silences the alarm.
  * Automatically stop if unacknowledged after 10 seconds.
  * Zero external audio assets (synthesized via Web Audio API) to ensure instant, reliable playback.
* **Non-Goals (Deferred to V2):**
  * Soundboard / tone selector settings UI (custom selectable wav/mp3 tones will arrive in V2).
  * System desktop push notifications.
* **Anti-Goals:**
  * No aggressive, loud, or shrill buzzer sounds that cause stress or adrenaline spikes.
  * No external asset loading (`.mp3`/`.wav`) that could fail with 404 or introduce network latency.
  * No lingering event listeners that block user interaction or pollute memory.

## 3. Decisions & Specifications
* **Tone Profile:** Warm acoustic chime sequence using soft sine and triangle oscillators with exponential gain decay (resembling warm marimba notes or resonant acoustic bells).
* **Ringing Cadence:** 4 cycles spaced ~2.2 seconds apart (total ~9-10 seconds).
* **Instant Silence on Click:** 
  * When ringing starts, attach a global `pointerdown` listener to `window`.
  * The first user click anywhere immediately calls `stopTimerAlarm()` and removes the event listener.
* **Auto-Stop:** A `setTimeout` of 10,000ms automatically halts the loop if no interaction occurs.
* **Mute Respect:** If `soundEffects.getMuted() === true`, no sound plays and no alarm loop runs.

