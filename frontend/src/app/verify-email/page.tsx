'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import Logo from '../../components/Logo';
import { Mail, CheckCircle2, XCircle, AlertCircle, ChevronLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="bg-white rounded-[20px] p-8 border border-gray-150 shadow-lg shadow-black/[0.02] flex flex-col items-center max-w-md w-full text-dark-charcoal">
      {/* Brand Logo */}
      <Logo light={false} className="mb-6" />

      {loading ? (
        <div className="flex flex-col items-center py-8 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-orange" />
          <p className="text-xs text-gray-400 font-extrabold uppercase tracking-widest">Verifying Email Address...</p>
        </div>
      ) : successMsg ? (
        <div className="flex flex-col items-center text-center py-6 space-y-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full shadow-sm">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-dark-charcoal font-display">Verification Successful!</h3>
          <p className="text-xs text-gray-500 font-semibold">{successMsg}</p>
          <a
            href="/login"
            className="mt-6 bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-8 rounded-button shadow-sm transition-all duration-300 hover:scale-105"
          >
            Sign In to Account
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full py-4 space-y-4">
          <XCircle className="h-16 w-16 text-red-500" />
          <h3 className="text-xl font-bold text-dark-charcoal font-display text-center">Verification Failed</h3>
          <div className="w-full bg-red-50 border border-red-100 text-red-800 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5 text-left font-semibold">
            <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>

          {/* Resend Verification Form */}
          <div className="w-full border-t border-gray-100 pt-6 mt-4">
            <h4 className="text-xs font-bold text-dark-charcoal uppercase tracking-wider mb-2 text-center">Request New Link</h4>
            
            {resendSuccess && (
              <div className="w-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-4 py-2.5 rounded-xl mb-3 text-center font-semibold">
                {resendSuccess}
              </div>
            )}
            {resendError && (
              <div className="w-full bg-red-50 border border-red-100 text-red-800 text-xs px-4 py-2.5 rounded-xl mb-3 text-center font-semibold">
                {resendError}
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={emailToResend}
                  onChange={(e) => setEmailToResend(e.target.value)}
                  placeholder="Enter registered email address"
                  className="w-full bg-white border border-gray-250 rounded-xl pl-10 pr-4 py-3 text-xs text-dark-charcoal placeholder-gray-405 focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all font-semibold"
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isResending}
                className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-[10px] uppercase tracking-widest py-3.5 rounded-[14px] shadow-sm w-full transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isResending ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Resend Verification Link
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-warm-white font-sans px-4">
      {/* Back button */}
      <a href="/" className="absolute top-6 left-6 text-dark-charcoal/70 hover:text-dark-charcoal flex items-center text-xs font-bold uppercase tracking-widest transition-colors z-20">
        <ChevronLeft className="h-4 w-4 mr-1 text-primary-orange" />
        Back to Home
      </a>

      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={
          <div className="bg-white rounded-[20px] p-8 border border-gray-150 shadow-lg shadow-black/[0.02] flex flex-col items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-orange" />
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </main>
  );
}
