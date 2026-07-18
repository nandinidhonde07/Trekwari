'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/Logo';
import { Lock, Mail, ChevronLeft, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
            { theme: 'outline', size: 'large', width: '320', shape: 'pill', text: 'continue_with' }
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
    <main className="min-h-screen w-full grid grid-cols-1 md:grid-cols-12 bg-warm-white relative overflow-hidden font-sans">
      
      {/* Back button */}
      <Link href="/" className="absolute top-6 left-6 text-dark-charcoal/70 hover:text-dark-charcoal flex items-center text-xs font-bold uppercase tracking-widest transition-colors z-20">
        <ChevronLeft className="h-4 w-4 mr-1 text-primary-orange" />
        Back to Home
      </Link>

      {/* Left Panel: Scenic Photo (5 col span) */}
      <div className="hidden md:block md:col-span-5 relative h-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200" 
          alt="Explorer overlooking mountain valley" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Soft layout gradient mapping */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        
        {/* Brand Caption overlay */}
        <div className="absolute bottom-10 left-10 right-10 text-white z-10 space-y-2">
          <p className="text-xl font-bold font-display leading-tight">"The mountains are calling, and I must go."</p>
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

          <h2 className="text-xl font-bold font-display text-dark-charcoal text-center mb-6">Welcome Back Explorer</h2>

          {errorMsg && (
            <div className="w-full bg-red-50 border border-red-100 text-red-800 text-xs px-4 py-3 rounded-xl mb-4 flex items-start gap-2.5">
              <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Email or Phone</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email or mobile (+91)"
                  className="w-full bg-white border border-gray-250 rounded-xl pl-10 pr-4 py-3 text-xs text-dark-charcoal placeholder-gray-405 focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Password</label>
                <Link href="/forgot-password" className="text-[9px] font-bold text-primary-orange hover:underline uppercase tracking-wider">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-white border border-gray-250 rounded-xl pl-10 pr-4 py-3 text-xs text-dark-charcoal placeholder-gray-405 focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all font-semibold"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-250 text-primary-orange focus:ring-primary-orange bg-white cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-500 font-semibold cursor-pointer select-none">
                Remember my login details
              </label>
            </div>

            {/* Submit Action */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting || loading}
              className="bg-primary-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-[14px] shadow-sm w-full transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
              ) : (
                'Sign In to Dashboard'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center my-5">
            <hr className="w-full border-gray-100" />
            <span className="text-[9px] uppercase font-bold text-gray-450 px-3 tracking-widest">or</span>
            <hr className="w-full border-gray-100" />
          </div>

          {/* Google Sign-in */}
          <div className="w-full flex justify-center mb-2 min-h-[44px]">
            <div id="google-login-btn" className="w-full max-w-[320px] flex justify-center"></div>
          </div>

          {/* Redirect links */}
          <p className="text-xs text-gray-500 mt-6 text-center font-medium">
            New to TrekWari?{' '}
            <Link href="/signup" className="text-primary-orange font-extrabold hover:underline">
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>

    </main>
  );
}
