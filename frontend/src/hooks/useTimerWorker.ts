import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';

export function useTimerWorker() {
  const workerRef = useRef<Worker | null>(null);

  const isRunning = useStore((s) => s.isRunning);
  const remainingSeconds = useStore((s) => s.remainingSeconds);
  const durationSeconds = useStore((s) => s.durationSeconds);
  const mode = useStore((s) => s.mode);
  const setRemainingSeconds = useStore((s) => s.setRemainingSeconds);
  const onTimerComplete = useStore((s) => s.onTimerComplete);

  // Initialize Web Worker once
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/timer.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e) => {
      const { type, remainingSeconds: secs } = e.data;
      if (type === 'TICK' && typeof secs === 'number') {
        setRemainingSeconds(secs);
      } else if (type === 'COMPLETE') {
        onTimerComplete();
      }
    };

    workerRef.current = worker;

    const handleTimerSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ remainingSeconds: number; durationSeconds: number }>;
      if (workerRef.current && customEvent.detail) {
        workerRef.current.postMessage({
          type: 'SET_TIME',
          payload: {
            remainingSeconds: customEvent.detail.remainingSeconds,
            durationSeconds: customEvent.detail.durationSeconds,
          },
        });
      }
    };

    window.addEventListener('pomopro_timer_sync', handleTimerSync);

    return () => {
      window.removeEventListener('pomopro_timer_sync', handleTimerSync);
      worker.terminate();
    };
  }, [setRemainingSeconds, onTimerComplete]);

  // Sync running state changes with worker
  useEffect(() => {
    if (!workerRef.current) return;

    if (isRunning) {
      workerRef.current.postMessage({
        type: 'START',
        payload: {
          remainingSeconds,
          durationSeconds,
        },
      });
    } else {
      workerRef.current.postMessage({
        type: 'PAUSE',
      });
    }
  }, [isRunning]);

  // Sync mode duration resets with worker
  useEffect(() => {
    if (!workerRef.current) return;
    if (!isRunning) {
      workerRef.current.postMessage({
        type: 'SET_TIME',
        payload: {
          remainingSeconds,
          durationSeconds,
        },
      });
    }
  }, [remainingSeconds, durationSeconds, isRunning]);

  // Update dynamic document title
  useEffect(() => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const modeLabel = mode === 'FOCUS' ? 'Focus' : mode === 'SHORT_BREAK' ? 'Short Break' : 'Long Break';
    document.title = `${isRunning ? '▶ ' : '❚❚ '}[${formatted}] ${modeLabel} // Pomofocus Pro`;
  }, [remainingSeconds, isRunning, mode]);
}

