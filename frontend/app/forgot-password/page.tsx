'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { forgotPasswordApi, verifyResetOtpApi, resetPasswordApi } from '../../services/api';
import { 
  KeyRound, Mail, ShieldCheck, ArrowLeft, ArrowRight, RefreshCw, CheckCircle2, 
  AlertCircle, Lock, Eye, EyeOff, Sparkles, Clock
} from 'lucide-react';
import { useToast } from '../../context/toastContext';
import ThemeToggle from '../../components/ThemeToggle';
import PasswordInput from '../../components/PasswordInput';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Wizard Step: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Status & Timers
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // 5 minutes timer
  const [redirectUrl, setRedirectUrl] = useState<string>('/login');
  const [accountRole, setAccountRole] = useState<string>('user');

  // Pre-fill email if passed via search query
  useEffect(() => {
    const initialEmail = searchParams.get('email');
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [searchParams]);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Handle Submit Email for OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordApi(email);
      if (res.success) {
        showToast(res.message || 'If an account exists, an OTP has been sent.', 'success');
        setStep(2);
        setTimerSeconds(300); // Reset 5-minute timer
      } else {
        showToast(res.message || 'Failed to send OTP code.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to request OTP code', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOTP = async () => {
    if (timerSeconds > 240) {
      showToast('Please wait a minute before requesting a new OTP.', 'info');
      return;
    }
    setResendLoading(true);
    try {
      const res = await forgotPasswordApi(email);
      if (res.success) {
        showToast('A new OTP has been sent to your email.', 'success');
        setTimerSeconds(300);
      } else {
        showToast(res.message || 'Failed to resend OTP code.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to resend OTP', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  // Step 2: Handle Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
      showToast('Please enter a valid 6-digit numeric OTP code.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyResetOtpApi(email, cleanOtp);
      if (res.success && res.resetToken) {
        setResetToken(res.resetToken);
        showToast('OTP verified successfully. Please enter your new password.', 'success');
        setStep(3);
      } else {
        showToast(res.message || 'Invalid or expired OTP code.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'OTP verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordApi(email, resetToken, newPassword, confirmPassword);
      if (res.success) {
        showToast('Password reset successfully!', 'success');
        setAccountRole(res.role || 'user');
        setRedirectUrl(res.redirectUrl || ((res.role === 'admin' || res.role === 'sub_admin') ? '/admin/login' : '/login'));
        setStep(4);
      } else {
        showToast(res.message || 'Failed to reset password.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Password reset failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 6) strength += 25;
    if (pass.length >= 10) strength += 25;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pass)) strength += 25;
    return strength;
  };

  const strength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col justify-between relative transition-colors duration-200">
      {/* Top Header Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[var(--border-app)] bg-[var(--bg-sidebar)]">
        <Link href="/login" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-black overflow-hidden flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-200">
            <img src="/logo.png" alt="21st Tech Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-sm text-[var(--text-primary)]">21st Tech</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-2xl border border-[var(--border-app)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Ambient Header Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

          {/* Progress Indicator */}
          <div className="mb-6 flex items-center justify-between text-xs font-semibold border-b border-[var(--border-app)] pb-4">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-indigo-400 font-bold' : 'text-[var(--text-muted)]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>1</span>
              <span>Email</span>
            </div>
            <div className="h-0.5 w-6 bg-[var(--border-app)]" />
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-indigo-400 font-bold' : 'text-[var(--text-muted)]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>2</span>
              <span>OTP</span>
            </div>
            <div className="h-0.5 w-6 bg-[var(--border-app)]" />
            <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-indigo-400 font-bold' : 'text-[var(--text-muted)]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>3</span>
              <span>Password</span>
            </div>
          </div>

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div className="text-center flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-1">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Forgot Password?</h1>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs">
                  Enter your registered account email address. We'll send a 6-digit verification OTP code to reset your password.
                </p>
              </div>

              <form onSubmit={handleRequestOTP} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Account Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 absolute left-3.5 text-[var(--text-muted)]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@21sttech.com"
                      className="w-full bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 font-medium transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-95 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  Send Verification Code <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center border-t border-[var(--border-app)] pt-4">
                <Link href="/login" className="text-xs text-[var(--text-secondary)] hover:text-indigo-400 font-semibold inline-flex items-center gap-1.5 transition">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: Enter 6-Digit OTP */}
          {step === 2 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div className="text-center flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Enter OTP Verification Code</h1>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs">
                  We sent a 6-digit OTP code to <span className="font-bold text-[var(--text-primary)]">{email}</span>.
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">6-Digit OTP Code</label>
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Expires in {formatTimer(timerSeconds)}
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="482931"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-app)] rounded-xl px-4 py-3 text-center text-xl font-mono tracking-[8px] font-bold text-indigo-400 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-95 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  Verify OTP Code <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center justify-between text-xs border-t border-[var(--border-app)] pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Email
                </button>
                <button
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1 disabled:opacity-50"
                >
                  {resendLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null} Resend OTP
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              <div className="text-center flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-1">
                  <Lock className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Create New Password</h1>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs">
                  Your OTP was verified. Create a strong new password for your account.
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                {/* New Password */}
                <div>
                  <PasswordInput
                    label="NEW PASSWORD"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                  />

                  {/* Strength Bar */}
                  {newPassword && (
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            strength < 50 ? 'bg-red-500' : strength < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${strength}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] text-right">
                        {strength < 50 ? 'Weak' : strength < 75 ? 'Moderate' : 'Strong'} password
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <PasswordInput
                    label="CONFIRM NEW PASSWORD"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-95 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  Reset Password <Sparkles className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: Reset Complete Success View */}
          {step === 4 && (
            <div className="flex flex-col gap-6 text-center animate-in fade-in duration-200 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-bold text-[var(--text-primary)]">Password Reset Successful!</h1>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Your password has been updated. Please log in using your email and new password.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-app)] text-left flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)] font-medium">Account Role:</span>
                <span className="font-bold text-indigo-400 uppercase tracking-wider">{accountRole}</span>
              </div>

              <button
                onClick={() => router.push(redirectUrl)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-95 flex items-center justify-center gap-2"
              >
                Proceed to Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-app)]">
        © 2026 21st Tech. All rights reserved.
      </footer>
    </div>
  );
}
