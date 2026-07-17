'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import Logo from '../../components/Logo';
import { Mail, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const res = await api.auth.forgotPassword(email);
      setSuccessMsg(res.message || 'If that email exists in our records, a reset link was sent.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('/images/homepage_banner.jpg')" }}>
      {/* Dark Forest Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-forest-green/80 to-emerald-950/95" />

      {/* Back button */}
      <Link href="/login" className="absolute top-6 left-6 text-white/70 hover:text-white flex items-center text-xs font-semibold uppercase tracking-wider transition-colors z-10">
        <ChevronLeft className="h-4 w-4 mr-1 text-sunrise-orange" />
        Back to Login
      </Link>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center">
          
          {/* Brand Logo */}
          <Logo light={true} className="mb-6" />

          <h2 className="text-xl font-bold font-display text-white text-center mb-2">Recover Password</h2>
          <p className="text-xs text-emerald-100/60 text-center mb-6">Enter your registered email address below, and we will send you a secure link to reset your account password.</p>

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
              <Link href="/login" className="text-sunrise-orange font-bold hover:underline uppercase tracking-wider text-[10px] mt-2">
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-[10px] font-bold text-emerald-100/60 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registered email address"
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
                  'Send Recovery Link'
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </main>
  );
}
