/**
 * Cyberpunk Procedural Audio Synthesizer (Web Audio API)
 * Zero external audio files required. Generates sci-fi mechanical clicks,
 * completion chimes, and deficit telemetry alarms entirely in code.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;
  private alarmInterval: any = null;
  private alarmTimeout: any = null;
  private isAlarmPlaying: boolean = false;
  private activeAlarmOscillators: OscillatorNode[] = [];
  private dismissHandler: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const savedMuted = localStorage.getItem('pomopro_sfx_muted');
      if (savedMuted !== null) {
        this.isMuted = savedMuted === 'true';
      }
      const savedVol = localStorage.getItem('pomopro_sfx_volume');
      if (savedVol !== null) {
        this.volume = parseFloat(savedVol);
      }
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    try {
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch (e) {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      localStorage.setItem('pomopro_sfx_muted', String(muted));
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      localStorage.setItem('pomopro_sfx_volume', String(this.volume));
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public isAlarmActive(): boolean {
    return this.isAlarmPlaying;
  }

  /**
   * Warm Acoustic Chime Alarm (Triggered when focus/break block hits 00:00)
   * Loops a warm acoustic chord cadence for up to 10 seconds.
   */
  public startTimerAlarm() {
    if (this.isMuted) return;
    this.stopTimerAlarm();
    this.isAlarmPlaying = true;

    const playChimeChord = () => {
      const ctx = this.initCtx();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Warm marimba/acoustic chord: E4 (329.63), G#4 (415.30), B4 (493.88), E5 (659.25)
      const notes = [329.63, 415.30, 493.88, 659.25];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Warm harmonic mix: sine with triangle warmth
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(this.volume * 0.35, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.2);

        this.activeAlarmOscillators.push(osc);
      });
    };

    // Play initial cycle immediately
    playChimeChord();

    // Repeat cadence every 2.4s
    this.alarmInterval = setInterval(() => {
      if (!this.isAlarmPlaying || this.isMuted) {
        this.stopTimerAlarm();
        return;
      }
      playChimeChord();
    }, 2400);

    // Auto-stop after 10 seconds max
    this.alarmTimeout = setTimeout(() => {
      this.stopTimerAlarm();
    }, 10000);

    // Global click-to-dismiss handler: clicking anywhere instantly stops the alarm
    if (typeof window !== 'undefined' && window.addEventListener) {
      this.dismissHandler = () => {
        this.stopTimerAlarm();
      };
      window.addEventListener('pointerdown', this.dismissHandler, { capture: true, once: true });
    }
  }

  /**
   * Immediately halts active alarm, silences oscillators, and clears intervals
   */
  public stopTimerAlarm() {
    this.isAlarmPlaying = false;
    if (typeof window !== 'undefined' && window.removeEventListener && this.dismissHandler) {
      window.removeEventListener('pointerdown', this.dismissHandler, { capture: true });
      this.dismissHandler = null;
    }
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.alarmTimeout) {
      clearTimeout(this.alarmTimeout);
      this.alarmTimeout = null;
    }
    this.activeAlarmOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped or not started
      }
    });
    this.activeAlarmOscillators = [];
  }

  /**
   * Sci-Fi Mechanical Switch Click (Triggered on Hot-Switch '1'-'9')
   */
  public playHotSwitchClick() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Futuristic Neon Chime (Triggered when focus/break block completes)
   */
  public playCompletionChime() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 crystalline chord

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(this.volume * 0.35, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.9);
    });
  }

  /**
   * Deficit / Target Warning Alarm (Triggered on budget alerts)
   */
  public playWarningTone() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.setValueAtTime(280, now + 0.1);
    osc.frequency.setValueAtTime(320, now + 0.2);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Subtle Button Tap / Interface Blip
   */
  public playInterfaceBlip() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.02);

    gain.gain.setValueAtTime(this.volume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.02);
  }
}

export const soundEffects = new SoundSynthesizer();

