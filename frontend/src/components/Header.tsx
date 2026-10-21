import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Volume2, VolumeX, BarChart2, LogOut, Sparkles, Bell, BellOff } from 'lucide-react';
import { notifications } from '../utils/notifications';

export const Header: React.FC = () => {
  const user = useStore((s) => s.user);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const openAuthModal = useStore((s) => s.openAuthModal);
  const logout = useStore((s) => s.logout);
  const isMuted = useStore((s) => s.isMuted);
  const toggleMute = useStore((s) => s.toggleMute);
  const isAnalyticsOpen = useStore((s) => s.isAnalyticsOpen);
  const openAnalytics = useStore((s) => s.openAnalytics);
  const closeAnalytics = useStore((s) => s.closeAnalytics);
  const isDailyReviewOpen = useStore((s) => s.isDailyReviewOpen);
  const openDailyReview = useStore((s) => s.openDailyReview);
  const closeDailyReview = useStore((s) => s.closeDailyReview);
  const mode = useStore((s) => s.mode);
  const isRunning = useStore((s) => s.isRunning);

  const [notifEnabled, setNotifEnabled] = useState(() => notifications.isEnabled());
  const [permission, setPermission] = useState<NotificationPermission>(() => notifications.getPermission());

  useEffect(() => {
    const syncState = () => {
      setNotifEnabled(notifications.isEnabled());
      setPermission(notifications.getPermission());
    };
    syncState();
    const unsubscribe = notifications.subscribe(syncState);
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', syncState);
    }
    return () => {
      unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', syncState);
      }
    };
  }, []);

  const handleToggleNotifications = async () => {
    if (!notifications.isSupported() || permission === 'denied') return;

    if (permission === 'default') {
      const granted = await notifications.requestPermission();
      setPermission(notifications.getPermission());
      if (granted) {
        notifications.setEnabled(true);
        setNotifEnabled(true);
      }
      return;
    }

    const next = !notifEnabled;
    notifications.setEnabled(next);
    setNotifEnabled(next);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.08] bg-[#f5f3ee]/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        
        {/* Tercelet-style Brand Mark */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2.5 group">
            <span
              aria-hidden="true"
              className="relative inline-flex shrink-0 items-center justify-center rounded-lg font-bold bg-[#111318] text-white h-8 w-8 text-sm shadow-sm"
            >
              P
              <span className="absolute inset-y-1.5 right-1 w-0.5 rounded-full bg-tercelet-proof"></span>
            </span>
            <span className="text-lg font-bold tracking-[-0.04em] text-[#111318]">
              Pomofocus<span className="font-editorial font-normal italic ml-0.5 text-tercelet-brand">Pro</span>
            </span>
          </a>

          {/* Status Indicator */}
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-black/[0.05] px-2.5 py-0.5 text-xs font-medium text-tercelet-muted">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isRunning ? 'bg-tercelet-brand animate-ping' : 'bg-slate-400'
              }`}
            />
            <span className="font-mono text-[11px]">
              {mode === 'FOCUS' ? 'Focus Mode' : mode === 'SHORT_BREAK' ? 'Short Break' : 'Long Break'}
            </span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Synthesizer Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`h-9 px-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isMuted
                ? 'border-black/10 text-tercelet-faint bg-white hover:text-[#111318]'
                : 'border-tercelet-brand/30 bg-tercelet-brandSoft text-tercelet-brand'
            }`}
            title="Toggle SFX [M]"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <span className="hidden md:inline font-mono text-[11px]">[M]</span>
          </button>

          {/* Desktop Notifications Toggle */}
          {notifications.isSupported() && (
            <button
              onClick={handleToggleNotifications}
              disabled={permission === 'denied'}
              aria-label={
                permission === 'denied'
                  ? 'Notifications blocked in browser settings'
                  : permission === 'default'
                  ? 'Enable desktop notifications'
                  : notifEnabled
                  ? 'Pause desktop notifications'
                  : 'Resume desktop notifications'
              }
              className={`h-9 px-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                permission === 'denied'
                  ? 'border-black/10 text-tercelet-faint bg-black/[0.03] opacity-60 cursor-not-allowed'
                  : notifEnabled && permission === 'granted'
                  ? 'border-tercelet-brand/30 bg-tercelet-brandSoft text-tercelet-brand'
                  : 'border-black/10 text-tercelet-faint bg-white hover:text-[#111318]'
              }`}
              title={
                permission === 'denied'
                  ? 'Notifications blocked in browser settings'
                  : permission === 'default'
                  ? 'Click to enable desktop notifications'
                  : notifEnabled
                  ? 'Desktop notifications enabled'
                  : 'Desktop notifications paused'
              }
            >
              {notifEnabled && permission === 'granted' ? (
                <Bell className="h-4 w-4" />
              ) : (
                <BellOff className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Statistics Button with Proof Badge */}
          <button
            onClick={() => (isAnalyticsOpen ? closeAnalytics() : openAnalytics())}
            className={`h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isAnalyticsOpen
                ? 'border-[#111318] bg-[#111318] text-white shadow-sm'
                : 'border-black/10 bg-white text-[#111318] hover:border-black/20 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Statistics</span>
            <span className="badge-proof text-[10px] py-0 px-1.5 ml-0.5">[A]</span>
          </button>

          {/* Daily Review Button with Proof Badge */}
          <button
            onClick={() => (isDailyReviewOpen ? closeDailyReview() : openDailyReview())}
            className={`h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isDailyReviewOpen
                ? 'border-[#111318] bg-[#111318] text-white shadow-sm'
                : 'border-black/10 bg-white text-[#111318] hover:border-black/20 hover:bg-slate-50'
            }`}
            title="Daily Review & Reflection [R]"
          >
            <Sparkles className="h-3.5 w-3.5 text-tercelet-brand" />
            <span>Daily Review</span>
            <span className="badge-proof text-[10px] py-0 px-1.5 ml-0.5">[R]</span>
          </button>

          {/* User Account / Auth */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-black/10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-black/10 shadow-sm">
                <span className="h-6 w-6 rounded-md bg-[#111318] text-white text-xs font-bold flex items-center justify-center font-mono">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-bold text-[#111318] hidden sm:inline">{user.username}</span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-tercelet-faint hover:text-tercelet-coral hover:bg-tercelet-coralSoft rounded-xl transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal('LOGIN')}
                className="h-9 px-3.5 rounded-xl border border-black/10 bg-white text-xs font-semibold text-[#111318] hover:border-black/25 hover:bg-slate-50 transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => openAuthModal('LOGIN')}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-tercelet-brand px-3.5 text-xs font-semibold text-white shadow-brand-btn hover:bg-tercelet-brandHover transition-all hover:-translate-y-0.5"
              >
                <Sparkles className="h-3.5 w-3.5 fill-current" />
                <span>Demo Launch</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
