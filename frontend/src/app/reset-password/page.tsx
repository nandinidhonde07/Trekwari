'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import Logo from '../../components/Logo';
import { Lock, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStrongPassword = (pass: string) => {
    if (pass.length < 8) return false;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasDigit = /\d/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    return hasUpper && hasLower && hasDigit && hasSpecial;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!token) {
      setErrorMsg('Password reset token is missing from the link URL.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    if (!isStrongPassword(password)) {
      setErrorMsg('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.auth.resetPassword(token, password);
      setSuccessMsg(res.message || 'Password has been reset successfully!');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center">
      {/* Brand Logo */}
      <Logo light={true} className="mb-6" />

      <h2 className="text-xl font-bold font-display text-white text-center mb-2">Set New Password</h2>
      <p className="text-xs text-emerald-100/60 text-center mb-6">Choose a strong password containing at least one capital letter, digit, and special character.</p>

      {errorMsg && (
        <div className="w-full bg-red-950/45 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl mb-4 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg ? (
        <div className="w-full bg-emerald-950/45 border border-emerald-500/30 text-emerald-200 text-xs px-4 py-4 rounded-xl mb-4 flex flex-col items-center gap-2.5 text-center">
          <CheckCircle2 className="h-8 w-8 text-sunrise-orange" />
          <span>{successMsg}</span>
          <span className="text-emerald-100/50 text-[10px] mt-2">Redirecting to login page in 3 seconds...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-[10px] font-bold text-emerald-100/60 uppercase tracking-wider mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 chars (1 upper, 1 special)"
                className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-emerald-100/30 focus:outline-none focus:border-sunrise-orange focus:ring-1 focus:ring-sunrise-orange transition-all"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[10px] font-bold text-emerald-100/60 uppercase tracking-wider mb-2">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-emerald-100/30 focus:outline-none focus:border-sunrise-orange focus:ring-1 focus:ring-sunrise-orange transition-all"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-sunrise-orange hover:bg-yellow-500 text-forest-green font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-md w-full transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-forest-green" />
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('/images/homepage_banner.jpg')" }}>
      {/* Dark Forest Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-forest-green/80 to-emerald-950/95" />

      {/* Back button */}
      <a href="/login" className="absolute top-6 left-6 text-white/70 hover:text-white flex items-center text-xs font-semibold uppercase tracking-wider transition-colors z-10">
        <ChevronLeft className="h-4 w-4 mr-1 text-sunrise-orange" />
        Back to Login
      </a>

      <div className="relative z-10 w-full max-w-md px-4">
        <Suspense fallback={
          <div className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sunrise-orange" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
