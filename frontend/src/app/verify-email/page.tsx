'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import Logo from '../../components/Logo';
import { Mail, CheckCircle2, XCircle, AlertCircle, ChevronLeft, Send } from 'lucide-react';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Resend Verification State
  const [emailToResend, setEmailToResend] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Verification token is missing from the link URL.');
      setLoading(false);
      return;
    }

    async function verify() {
      try {
        const res = await api.auth.verifyEmail(token as string);
        setSuccessMsg(res.message || 'Email verified successfully!');
      } catch (err: any) {
        setErrorMsg(err.message || 'Email verification failed. The link may have expired.');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendSuccess('');
    setResendError('');
    setIsResending(true);

    try {
      await api.auth.resendVerification(emailToResend);
      setResendSuccess('A new verification link has been sent to your email address.');
    } catch (err: any) {
      setResendError(err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center max-w-md w-full">
      {/* Brand Logo */}
      <Logo light={true} className="mb-6" />

      {loading ? (
        <div className="flex flex-col items-center py-8 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sunrise-orange" />
          <p className="text-sm text-emerald-100/60 font-semibold uppercase tracking-wider">Verifying Email Address...</p>
        </div>
      ) : successMsg ? (
        <div className="flex flex-col items-center text-center py-6 space-y-4">
          <CheckCircle2 className="h-16 w-16 text-sunrise-orange animate-bounce" />
          <h3 className="text-xl font-bold text-white font-display">Verification Successful!</h3>
          <p className="text-xs text-emerald-100/70">{successMsg}</p>
          <a
            href="/login"
            className="mt-6 bg-sunrise-orange hover:bg-yellow-500 text-forest-green font-bold text-xs uppercase tracking-wider py-3 px-8 rounded-full shadow-md transition-all duration-300 hover:scale-105"
          >
            Sign In to Account
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full py-4 space-y-4">
          <XCircle className="h-16 w-16 text-red-500" />
          <h3 className="text-xl font-bold text-white font-display text-center">Verification Failed</h3>
          <div className="w-full bg-red-950/45 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5 text-left">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>

          {/* Resend Verification Form */}
          <div className="w-full border-t border-white/10 pt-6 mt-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 text-center">Request New Verification Link</h4>
            
            {resendSuccess && (
              <div className="w-full bg-emerald-950/45 border border-emerald-500/30 text-emerald-200 text-xs px-4 py-2.5 rounded-xl mb-3 text-center">
                {resendSuccess}
              </div>
            )}
            {resendError && (
              <div className="w-full bg-red-950/45 border border-red-500/30 text-red-200 text-xs px-4 py-2.5 rounded-xl mb-3 text-center">
                {resendError}
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
                <input
                  type="email"
                  required
                  value={emailToResend}
                  onChange={(e) => setEmailToResend(e.target.value)}
                  placeholder="Enter registered email address"
                  className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-emerald-100/30 focus:outline-none focus:border-sunrise-orange focus:ring-1 focus:ring-sunrise-orange transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isResending}
                className="bg-sunrise-orange hover:bg-yellow-500 text-forest-green font-bold text-[10px] uppercase tracking-wider py-3 rounded-xl shadow-md w-full transition-all flex items-center justify-center gap-1.5"
              >
                {isResending ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-forest-green" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Resend Verification Link
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('/images/homepage_banner.jpg')" }}>
      {/* Dark Forest Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-forest-green/80 to-emerald-950/95" />

      {/* Back button */}
      <a href="/" className="absolute top-6 left-6 text-white/70 hover:text-white flex items-center text-xs font-semibold uppercase tracking-wider transition-colors z-10">
        <ChevronLeft className="h-4 w-4 mr-1 text-sunrise-orange" />
        Back to Home
      </a>

      <div className="relative z-10 w-full max-w-md px-4">
        <Suspense fallback={
          <div className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sunrise-orange" />
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </main>
  );
}
