import { useEffect } from 'react';
import { useStore } from '../store/useStore';

export function useKeyboardShortcuts() {
  const isRunning = useStore((s) => s.isRunning);
  const startTimer = useStore((s) => s.startTimer);
  const pauseTimer = useStore((s) => s.pauseTimer);
  const tasks = useStore((s) => s.tasks);
  const hotSwitchTask = useStore((s) => s.hotSwitchTask);
  const isCheckpointPromptOpen = useStore((s) => s.isCheckpointPromptOpen);
  const closeCheckpointPrompt = useStore((s) => s.closeCheckpointPrompt);
  const isAnalyticsOpen = useStore((s) => s.isAnalyticsOpen);
  const openAnalytics = useStore((s) => s.openAnalytics);
  const closeAnalytics = useStore((s) => s.closeAnalytics);
  const isDailyReviewOpen = useStore((s) => s.isDailyReviewOpen);
  const openDailyReview = useStore((s) => s.openDailyReview);
  const closeDailyReview = useStore((s) => s.closeDailyReview);
  const toggleMute = useStore((s) => s.toggleMute);
  const activeTaskId = useStore((s) => s.activeTaskId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (e.key === 'Escape') {
          target.blur();
          if (isCheckpointPromptOpen) closeCheckpointPrompt();
        }
        return;
      }

      // Space: Toggle Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
        return;
      }

      // Keys 1–9: Hot Switch Tasks
      if (/^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (index < tasks.length) {
          e.preventDefault();
          hotSwitchTask(tasks[index].id);
        }
        return;
      }

      // C: Context Checkpoint
      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (activeTaskId) {
          const currentTask = tasks.find((t) => t.id === activeTaskId);
          useStore.setState({
            isCheckpointPromptOpen: true,
            promptPreviousTask: currentTask ? { id: currentTask.id, title: currentTask.title } : null,
          });
        }
        return;
      }

      // A: Analytics Drawer
      if (e.key.toLowerCase() === 'a' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (isAnalyticsOpen) {
          closeAnalytics();
        } else {
          openAnalytics();
        }
        return;
      }

      // R: Daily Review Modal
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (isDailyReviewOpen) {
          closeDailyReview();
        } else {
          openDailyReview();
        }
        return;
      }

      // T: Focus Quick-Add Today's Task Input
      if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const input = document.getElementById('quick-add-task-input') as HTMLInputElement | null;
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // M: Mute SFX
      if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleMute();
        return;
      }

      // Escape: Close drawers/prompts/modals
      if (e.key === 'Escape') {
        if (isCheckpointPromptOpen) closeCheckpointPrompt();
        if (isAnalyticsOpen) closeAnalytics();
        if (isDailyReviewOpen) closeDailyReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isRunning,
    startTimer,
    pauseTimer,
    tasks,
    hotSwitchTask,
    isCheckpointPromptOpen,
    closeCheckpointPrompt,
    isAnalyticsOpen,
    openAnalytics,
    closeAnalytics,
    isDailyReviewOpen,
    openDailyReview,
    closeDailyReview,
    toggleMute,
    activeTaskId,
  ]);
}

