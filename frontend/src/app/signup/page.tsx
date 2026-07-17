'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/Logo';
import { User as UserIcon, Lock, Mail, Phone, Gift, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { register, googleLogin, isAuthenticated, user, loading } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [referredBy, setReferredBy] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/dashboard');
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
            document.getElementById('google-signup-btn'),
            { theme: 'outline', size: 'large', width: '380', shape: 'pill', text: 'signup_with' }
          );
        }
      } catch (err) {
        console.warn('Google Sign-in failed to initialize.', err);
      }
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await googleLogin(response.credential, false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google signup failed. Please try manual registration.');
      setIsSubmitting(false);
    }
  };

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

    if (!isStrongPassword(password)) {
      setErrorMsg('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ name, email, phone, password, referredBy });
      setSuccessMsg('Verification email sent! Please check your inbox (or spam folder) to verify your account before booking.');
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setReferredBy('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please review inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('/images/homepage_banner.jpg')" }}>
      {/* Dark Forest Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-forest-green/80 to-emerald-950/95" />

      {/* Back button */}
      <a href="/" className="absolute top-6 left-6 text-white/70 hover:text-white flex items-center text-xs font-semibold uppercase tracking-wider transition-colors z-10">
        <ChevronLeft className="h-4 w-4 mr-1 text-sunrise-orange" />
        Back to Home
      </a>

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        <div className="glass-card-dark rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center">
          
          {/* Brand Logo */}
          <Logo light={true} className="mb-4" />

          <h2 className="text-xl font-bold font-display text-white text-center mb-6">Create Your Explorer Account</h2>

          {errorMsg && (
            <div className="w-full bg-red-950/45 border border-red-500/30 text-red-200 text-xs px-4 py-3 rounded-xl mb-4 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="w-full bg-emerald-950/45 border border-emerald-500/30 text-emerald-200 text-xs px-4 py-3 rounded-xl mb-4 flex flex-col items-center gap-2.5 text-center">
              <CheckCircle2 className="h-8 w-8 text-sunrise-orange" />
              <span>{successMsg}</span>
              <a href="/login" className="text-sunrise-orange font-bold hover:underline uppercase tracking-wider text-[10px]">
                Proceed to Sign In
              </a>
            </div>
          )}

          {!successMsg && (
            <>
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* Name Field */}
                <div>
                  <label className="block text-[10px] font-bold text-emerald-100/60 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-emerald-100/30 focus:outline-none focus:border-sunrise-orange focus:ring-1 focus:ring-sunrise-orange transition-all"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-[10px] font-bold text-emerald-100/60 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-emerald-100/30 focus:outline-none focus:border-sunrise-orange focus:ring-1 focus:ring-sunrise-orange transition-all"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-[10px] font-bold text-emerald-100/60 uppercase tracking-wider mb-1.5">Mobile Number (E.164 Format)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 9322340365"
                      className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-emerald-100/30 focus:outline-none focus:border-sunrise-orange focus:ring-1 focus:ring-sunrise-orange transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-[10px] font-bold text-emerald-100/60 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 chars (1 upper, 1 special)"
                      className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-emerald-100/30 focus:outline-none focus:border-sunrise-orange focus:ring-1 focus:ring-sunrise-orange transition-all"
                    />
                  </div>
                </div>

                {/* Referral Field */}
                <div>
                  <label className="block text-[10px] font-bold text-emerald-100/60 uppercase tracking-wider mb-1.5">Referral Code (Optional)</label>
                  <div className="relative">
                    <Gift className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-100/40" />
                    <input
                      type="text"
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      placeholder="Enter friend's code"
                      className="w-full bg-emerald-950/40 border border-emerald-800/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-emerald-100/30 focus:outline-none focus:border-sunrise-orange focus:ring-1 focus:ring-sunrise-orange transition-all"
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
                    'Create Hiker Account'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="w-full flex items-center my-5">
                <hr className="w-full border-emerald-900" />
                <span className="text-[10px] uppercase font-bold text-emerald-100/30 px-3">or</span>
                <hr className="w-full border-emerald-900" />
              </div>

              {/* Google Sign-in button wrapper */}
              <div className="w-full flex justify-center mb-2 min-h-[44px]">
                <div id="google-signup-btn" className="w-full max-w-[380px]"></div>
              </div>
            </>
          )}

          {/* Redirect links */}
          <p className="text-xs text-emerald-100/60 mt-4 text-center">
            Already have an account?{' '}
            <a href="/login" className="text-sunrise-orange font-bold hover:underline">
              Log In
            </a>
          </p>

        </div>
      </div>
    </main>
  );
}
