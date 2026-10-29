import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import { Sparkles, ShieldCheck, Mail, Lock, User as UserIcon, X, AlertCircle, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const isAuthModalOpen = useStore((s) => s.isAuthModalOpen);
  const authModalMode = useStore((s) => s.authModalMode);
  const pendingEmail = useStore((s) => s.pendingEmail);
  const closeAuthModal = useStore((s) => s.closeAuthModal);
  const openAuthModal = useStore((s) => s.openAuthModal);
  const setAuth = useStore((s) => s.setAuth);
  const authNotice = useStore((s) => s.authNotice);

  const [email, setEmail] = useState(pendingEmail || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleDemoLogin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.auth.demoLogin();
      if (res.token && res.user) {
        setAuth(res.user, res.token);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.auth.login({ email, password });
      if (res.token && res.user) {
        setAuth(res.user, res.token);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('not been verified')) {
        openAuthModal('OTP', email);
        setInfoMessage('Enter the 6-digit OTP code sent to your email.');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.auth.signup({ email, username, password });
      setInfoMessage(res.message || 'Verification passcode dispatched via email.');
      openAuthModal('OTP', email);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.auth.verifyEmail({ email: pendingEmail || email, otp });
      if (res.token && res.user) {
        setAuth(res.user, res.token);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.auth.resendCode({ email: pendingEmail || email });
      setInfoMessage(res.message || 'Fresh OTP code sent.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-[28px] border border-black/10 bg-white p-7 sm:p-9 shadow-[0_28px_80px_rgba(17,19,24,0.14)] animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-slate-400 hover:text-[#111318] p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors"
          title="Close [Esc]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-tercelet-brandSoft text-tercelet-brand flex items-center justify-center mx-auto mb-3.5 border border-tercelet-brand/10 shadow-sm">
            {authModalMode === 'OTP' ? <ShieldCheck className="w-6 h-6" /> : <Sparkles className="w-6 h-6 fill-current" />}
          </div>
          <h2 className="text-xl font-bold text-[#111318] tracking-tight">
            {authModalMode === 'LOGIN' && 'Sign in to Pomofocus Pro'}
            {authModalMode === 'SIGNUP' && 'Create your account'}
            {authModalMode === 'OTP' && 'Verify Email Passcode'}
          </h2>
          <p className="text-xs text-tercelet-muted mt-1 leading-relaxed">
            {authModalMode === 'LOGIN' && 'Sign in with your credentials or launch the instant demo bypass'}
            {authModalMode === 'SIGNUP' && 'Set up your profile to sync daily focus telemetry across sessions'}
            {authModalMode === 'OTP' && `Enter the 6-digit passcode sent to ${pendingEmail || email}`}
          </p>
        </div>

        {/* Error or Info Alerts */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
        {authNotice && !error && !infoMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{authNotice}</span>
          </div>
        )}
        {infoMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-tercelet-brandSoft border border-tercelet-brand/20 text-tercelet-brand text-xs flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-tercelet-brand fill-current" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* MODE 1: LOGIN */}
        {authModalMode === 'LOGIN' && (
          <div>
            {/* Quick Demo Bypass */}
            <button
              onClick={handleDemoLogin}
              disabled={isSubmitting}
              className="w-full mb-5 py-3 rounded-xl bg-tercelet-brand text-white hover:bg-tercelet-brandHover font-semibold text-xs tracking-wide flex items-center justify-center gap-2 shadow-brand-btn transition-all hover:-translate-y-0.5 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>1-Click Demo Operator Launch</span>
            </button>

            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-black/10 w-full" />
              <span className="bg-white px-3 text-[10px] font-semibold text-tercelet-muted uppercase tracking-widest absolute">
                OR SIGN IN WITH EMAIL
              </span>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111318] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-[#fcfbf8] border border-black/15 focus:border-tercelet-brand rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#111318] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand/20 transition-all font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111318] mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#fcfbf8] border border-black/15 focus:border-tercelet-brand rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#111318] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand/20 transition-all font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl border border-black/10 hover:border-black/25 text-[#111318] bg-white hover:bg-slate-50 font-semibold text-xs tracking-tight transition-all shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="text-center mt-5">
              <button
                onClick={() => {
                  setError(null);
                  openAuthModal('SIGNUP');
                }}
                className="text-xs text-tercelet-muted hover:text-[#111318] transition-colors"
              >
                Need an account? <span className="underline font-bold text-tercelet-brand">Register new account</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: SIGNUP */}
        {authModalMode === 'SIGNUP' && (
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#111318] mb-1.5">Username / Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alex_dev"
                  className="w-full bg-[#fcfbf8] border border-black/15 focus:border-tercelet-brand rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#111318] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand/20 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111318] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-[#fcfbf8] border border-black/15 focus:border-tercelet-brand rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#111318] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand/20 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111318] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#fcfbf8] border border-black/15 focus:border-tercelet-brand rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#111318] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tercelet-brand/20 transition-all font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-tercelet-brand text-white hover:bg-tercelet-brandHover font-semibold text-xs tracking-wide shadow-brand-btn transition-all hover:-translate-y-0.5 disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              <span>{isSubmitting ? 'Dispatching OTP...' : 'Create Account & Send Code'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  openAuthModal('LOGIN');
                }}
                className="text-xs text-tercelet-muted hover:text-[#111318] transition-colors"
              >
                Already have an account? <span className="underline font-bold text-tercelet-brand">Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: OTP VERIFICATION */}
        {authModalMode === 'OTP' && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#111318] text-center mb-2.5">
                Enter 6-Digit Passcode
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center tracking-[12px] text-2xl font-mono font-bold py-3.5 bg-[#fcfbf8] border-2 border-black/15 focus:border-tercelet-brand rounded-2xl text-[#111318] focus:outline-none focus:ring-2 focus:ring-tercelet-brand/20"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otp.length !== 6}
              className="w-full py-3 rounded-xl bg-tercelet-brand text-white hover:bg-tercelet-brandHover font-semibold text-xs tracking-wide shadow-brand-btn transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying...' : 'Confirm Code & Unlock'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting}
                className="text-tercelet-brand font-semibold hover:underline"
              >
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('LOGIN')}
                className="text-tercelet-muted hover:text-[#111318]"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

