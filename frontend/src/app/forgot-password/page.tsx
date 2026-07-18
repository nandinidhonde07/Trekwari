'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import Logo from '../../components/Logo';
import { Mail, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <main className="min-h-screen w-full grid grid-cols-1 md:grid-cols-12 bg-warm-white relative overflow-hidden font-sans">
      
      {/* Back button */}
      <Link href="/login" className="absolute top-6 left-6 text-dark-charcoal/70 hover:text-dark-charcoal flex items-center text-xs font-bold uppercase tracking-widest transition-colors z-20">
        <ChevronLeft className="h-4 w-4 mr-1 text-primary-orange" />
        Back to Login
      </Link>

      {/* Left Panel: Scenic Photo (5 col span) */}
      <div className="hidden md:block md:col-span-5 relative h-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=1200" 
          alt="Wilderness path during sunset" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-10 left-10 right-10 text-white z-10 space-y-2">
          <p className="text-xl font-bold font-display leading-tight">"In every walk with nature, one receives far more than he seeks."</p>
          <p className="text-[9px] uppercase tracking-widest font-extrabold text-primary-orange">John Muir</p>
        </div>
      </div>

      {/* Right Panel: White Form Card (7 col span) */}
      <div className="col-span-1 md:col-span-7 flex flex-col justify-center items-center px-6 py-12 bg-warm-white relative">
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm bg-white rounded-[20px] p-8 border border-gray-150 shadow-lg shadow-black/[0.02] flex flex-col items-center"
        >
          {/* Brand Logo */}
          <Logo light={false} className="mb-6" />

          <h2 className="text-xl font-bold font-display text-dark-charcoal text-center mb-2">Recover Password</h2>
          <p className="text-xs text-gray-500 text-center mb-6 font-semibold leading-relaxed">
            Enter your registered email address below and we will dispatch a secure link to reset your account password.
          </p>

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
              <Link href="/login" className="text-primary-orange font-extrabold hover:underline uppercase tracking-widest text-[9px] mt-4">
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registered email address"
                    className="w-full bg-white border border-gray-250 rounded-xl pl-10 pr-4 py-3.5 text-xs text-dark-charcoal placeholder-gray-405 focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Submit Action */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-[14px] shadow-sm w-full transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                ) : (
                  'Send Recovery Link'
                )}
              </motion.button>
            </form>
          )}

        </motion.div>
      </div>

    </main>
  );
}
