'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import Logo from '../../components/Logo';
import { Lock, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="w-full max-w-sm bg-white rounded-[20px] p-8 border border-gray-150 shadow-lg shadow-black/[0.02] flex flex-col items-center">
      {/* Brand Logo */}
      <Logo light={false} className="mb-6" />

      <h2 className="text-xl font-bold font-display text-dark-charcoal text-center mb-2">Set New Password</h2>
      <p className="text-xs text-gray-500 text-center mb-6 font-semibold">Choose a strong password containing at least one capital letter, digit, and special character.</p>

      {errorMsg && (
        <div className="w-full bg-red-50 border border-red-100 text-red-800 text-xs px-4 py-3 rounded-xl mb-4 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg ? (
        <div className="w-full bg-white border border-gray-150 text-gray-600 text-xs px-4 py-6 rounded-[20px] mb-4 flex flex-col items-center gap-3 text-center font-semibold">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <span className="leading-relaxed">{successMsg}</span>
          <span className="text-gray-400 text-[9px] uppercase tracking-wider mt-4">Redirecting in 3 seconds...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 chars (1 upper, 1 special)"
                className="w-full bg-white border border-gray-250 rounded-xl pl-10 pr-4 py-3 text-xs text-dark-charcoal placeholder-gray-405 focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all font-semibold"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-white border border-gray-250 rounded-xl pl-10 pr-4 py-3 text-xs text-dark-charcoal placeholder-gray-405 focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all font-semibold"
              />
            </div>
          </div>

          {/* Submit Action */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-[14px] shadow-sm w-full transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
            ) : (
              'Reset Password'
            )}
          </motion.button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen w-full grid grid-cols-1 md:grid-cols-12 bg-warm-white relative overflow-hidden font-sans">
      
      {/* Back button */}
      <a href="/login" className="absolute top-6 left-6 text-dark-charcoal/70 hover:text-dark-charcoal flex items-center text-xs font-bold uppercase tracking-widest transition-colors z-10">
        <ChevronLeft className="h-4 w-4 mr-1 text-primary-orange" />
        Back to Login
      </a>

      {/* Left Panel: Scenic Photo (5 col span) */}
      <div className="hidden md:block md:col-span-5 relative h-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1533240332313-0db49b439ad3?q=80&w=1200" 
          alt="Climber stand at summit during clear blue sky" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-10 left-10 right-10 text-white z-10 space-y-2">
          <p className="text-xl font-bold font-display leading-tight">"It is not the mountain we conquer, but ourselves."</p>
          <p className="text-[9px] uppercase tracking-widest font-extrabold text-primary-orange">Sir Edmund Hillary</p>
        </div>
      </div>

      {/* Right Panel: White Form Card (7 col span) */}
      <div className="col-span-1 md:col-span-7 flex flex-col justify-center items-center px-6 py-12 bg-warm-white relative">
        <Suspense fallback={
          <div className="w-full max-w-sm bg-white rounded-[20px] p-8 border border-gray-150 shadow-lg shadow-black/[0.02] flex flex-col items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-orange" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>

    </main>
  );
}
