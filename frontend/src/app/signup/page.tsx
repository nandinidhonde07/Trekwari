'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/Logo';
import { User as UserIcon, Lock, Mail, Phone, Gift, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
            { theme: 'outline', size: 'large', width: '320', shape: 'pill', text: 'signup_with' }
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
      setSuccessMsg('Verification email sent! Please check your inbox (or spam folder) to verify your account.');
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
    <main className="min-h-screen w-full grid grid-cols-1 md:grid-cols-12 bg-warm-white relative overflow-hidden font-sans">
      
      {/* Back button */}
      <Link href="/" className="absolute top-6 left-6 text-dark-charcoal/70 hover:text-dark-charcoal flex items-center text-xs font-bold uppercase tracking-widest transition-colors z-20">
        <ChevronLeft className="h-4 w-4 mr-1 text-primary-orange" />
        Back to Home
      </Link>

      {/* Left Panel: Scenic Photo (5 col span) */}
      <div className="hidden md:block md:col-span-5 relative h-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1200" 
          alt="Climber walking towards rocky mountain peak" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-10 left-10 right-10 text-white z-10 space-y-2">
          <p className="text-xl font-bold font-display leading-tight">"Great things are done when men and mountains meet."</p>
          <p className="text-[9px] uppercase tracking-widest font-extrabold text-primary-orange">William Blake</p>
        </div>
      </div>

      {/* Right Panel: White Form Card (7 col span) */}
      <div className="col-span-1 md:col-span-7 flex flex-col justify-center items-center px-6 py-12 bg-warm-white relative overflow-y-auto no-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm bg-white rounded-[20px] p-8 border border-gray-150 shadow-lg shadow-black/[0.02] flex flex-col items-center"
        >
          {/* Brand Logo */}
          <Logo light={false} className="mb-4" />

          <h2 className="text-xl font-bold font-display text-dark-charcoal text-center mb-6">Create Your Hiker Account</h2>

          {errorMsg && (
            <div className="w-full bg-red-50 border border-red-100 text-red-800 text-xs px-4 py-3 rounded-xl mb-4 flex items-start gap-2.5">
              <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="w-full bg-white border border-gray-150 text-gray-600 text-xs px-4 py-6 rounded-[20px] mb-4 flex flex-col items-center gap-3 text-center font-semibold">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <span className="leading-relaxed">{successMsg}</span>
              <Link href="/login" className="text-primary-orange font-extrabold hover:underline uppercase tracking-widest text-[9px] mt-4">
                Proceed to Sign In
              </Link>
            </div>
          )}

          {!successMsg && (
            <>
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full bg-white border border-gray-250 rounded-xl pl-10 pr-4 py-3 text-xs text-dark-charcoal placeholder-gray-405 focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full bg-white border border-gray-250 rounded-xl pl-10 pr-4 py-3 text-xs text-dark-charcoal placeholder-gray-405 focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Mobile Number (with +91)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 9322340365"
                      className="w-full bg-white border border-gray-250 rounded-xl pl-10 pr-4 py-3 text-xs text-dark-charcoal placeholder-gray-405 focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Password</label>
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

                {/* Referral Code */}
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Referral Code (Optional)</label>
                  <div className="relative">
                    <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                    <input
                      type="text"
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      placeholder="Enter friend's code"
                      className="w-full bg-white border border-gray-250 rounded-xl pl-10 pr-4 py-3 text-xs text-dark-charcoal placeholder-gray-405 focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all font-semibold"
                    />
                  </div>
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
                    'Create Hiker Account'
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
                <div id="google-signup-btn" className="w-full max-w-[320px] flex justify-center"></div>
              </div>
            </>
          )}

          {/* Redirect links */}
          <p className="text-xs text-gray-500 mt-6 text-center font-medium">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-orange font-extrabold hover:underline">
              Log In
            </Link>
          </p>

        </motion.div>
      </div>

    </main>
  );
}
