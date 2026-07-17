'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/Logo';
import { Lock, Mail, ChevronLeft, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin, isAuthenticated, user, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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

  // Load Google Identity Services SDK
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Client ID read from Next.js environment variable. Fallback to placeholder if empty.
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '9322340365-demo-client-id.apps.googleusercontent.com';
      
      try {
        if ((window as any).google) {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
            auto_select: false
          });
          
          (window as any).google.accounts.id.renderButton(
            document.getElementById('google-login-btn'),
            { theme: 'outline', size: 'large', width: '380', shape: 'pill', text: 'continue_with' }
          );
        }
      } catch (err) {
        console.warn('Google Sign-in failed to initialize. Client ID might be unconfigured.', err);
      }
    };
  }, [rememberMe]);

  const handleGoogleResponse = async (response: any) => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await googleLogin(response.credential, rememberMe);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Authentication failed. Please try credentials login.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await login({ email, password, rememberMe });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email/mobile number or password.');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('/images/homepage_banner.jpg')" }}>
      {/* Misty forest dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-forest-green/80 to-emerald-950/95" />

      {/* Back button */}
      <Link href="/" className="absolute top-6 left-6 text-white/70 hover:text-white flex items-center text-xs font-semibold uppercase tracking-wider transition-colors z-10">
        <ChevronLeft className="h-4 w-4 mr-1 text-sunrise-orange" />
        Back to Home
      </Link>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <div className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center">
          
          {/* Brand Logo */}
          <Logo light={true} className="mb-6" />

          <h2 className="text-xl font-bold font-display text-white text-center mb-6">Welcome Back Explorer</h2>

          {errorMsg && (
            <div className="w-full bg-red-950/45 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl mb-4 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Email or Phone Field */}
            <div>
              <label className="block text-[10px] font-bold text-emerald-100/60 uppercase tracking-wider mb-2">Email Address or Phone Number</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email or mobile (+91)"
                  className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-emerald-100/30 focus:outline-none focus:border-sunrise-orange focus:ring-1 focus:ring-sunrise-orange transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold text-emerald-100/60 uppercase tracking-wider">Password</label>
                <Link href="/forgot-password" className="text-[10px] font-bold text-sunrise-orange hover:underline">
                  Forgot Password?
                </Link>
              </div>
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

            {/* Remember Me Toggle */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-emerald-800 text-sunrise-orange focus:ring-sunrise-orange bg-emerald-950/40"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-emerald-100/70 cursor-pointer select-none">
                Remember my login on this device
              </label>
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

          {/* Google Sign-in native rendering wrapper */}
          <div className="w-full flex justify-center mb-4 min-h-[44px]">
            <div id="google-login-btn" className="w-full max-w-[380px]"></div>
          </div>

          {/* Redirect links */}
          <p className="text-xs text-emerald-100/60 mt-6 text-center">
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
