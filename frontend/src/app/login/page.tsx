'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/Logo';
import { Lock, Mail, ChevronLeft, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else if (user.role === 'TREK_LEADER' || user.role === 'VOLUNTEER') {
        router.push('/leader');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const profile = await login({ email, password });
      // Redirect handled by useEffect
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('/images/homepage_banner.jpg')" }}>
      {/* Dark Forest Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-forest-green/80 to-emerald-950/95" />

      {/* Back button */}
      <Link href="/" className="absolute top-6 left-6 text-white/70 hover:text-white flex items-center text-xs font-semibold uppercase tracking-wider transition-colors z-10">
        <ChevronLeft className="h-4 w-4 mr-1 text-sunrise-orange" />
        Back to Home
      </Link>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center">
          
          {/* Brand Logo */}
          <Logo light={true} className="mb-8" />

          <h2 className="text-xl font-bold font-display text-white text-center mb-6">Welcome Back Explorer</h2>

          {errorMsg && (
            <div className="w-full bg-red-950/45 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl mb-4 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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
                  placeholder="Enter email address"
                  className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-emerald-100/30 focus:outline-none focus:border-sunrise-orange focus:ring-1 focus:ring-sunrise-orange transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-bold text-emerald-100/60 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-emerald-100/30 focus:outline-none focus:border-sunrise-orange focus:ring-1 focus:ring-sunrise-orange transition-all"
                />
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="bg-sunrise-orange hover:bg-yellow-500 text-forest-green font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-md w-full transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-forest-green" />
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center my-6">
            <hr className="w-full border-emerald-900" />
            <span className="text-[10px] uppercase font-bold text-emerald-100/30 px-3">or</span>
            <hr className="w-full border-emerald-900" />
          </div>

          {/* Google Login Mock */}
          <button
            onClick={() => {
              // Simulate Google OAuth
              setEmail('user@treckwari.com');
              setPassword('user123');
              // Let user click Login afterwards or automatically trigger login
            }}
            className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.89 5.89 0 018.1 12.63a5.89 5.89 0 015.89-5.88c1.628 0 3.12.66 4.226 1.727l3.197-3.197C19.347 3.328 16.85 2 13.99 2 8.47 2 4 6.47 4 12s4.47 10 9.99 10c5.38 0 9.91-3.87 9.91-9.99 0-.67-.06-1.3-.16-1.725h-11.5z" />
            </svg>
            Continue with Google
          </button>

          {/* Redirect links */}
          <p className="text-xs text-emerald-100/60 mt-8 text-center">
            New to TreckWari?{' '}
            <Link href="/signup" className="text-sunrise-orange font-bold hover:underline">
              Create an Account
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
}
