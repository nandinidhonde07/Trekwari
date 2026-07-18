'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled route exception:', error);
  }, [error]);

  return (
    <main className="min-h-screen relative bg-warm-white font-sans flex flex-col justify-between">
      <Navbar />

      <div className="max-w-md mx-auto pt-44 pb-20 px-6 text-center space-y-6 flex flex-col items-center">
        
        {/* Animated Warning Icon */}
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="p-5 bg-red-50 text-red-600 rounded-full shadow-sm border border-red-100"
        >
          <ShieldAlert className="h-12 w-12" />
        </motion.div>

        {/* Header details */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-red-650">System Alert</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark-charcoal font-display">Trail Obstacle Encountered</h1>
          <p className="text-xs sm:text-sm text-gray-505 font-medium leading-relaxed max-w-sm">
            An unexpected error occurred while loading this section of the trail. Rest assured, our basecamp team has been notified.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="pt-2 w-full flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => reset()}
            className="flex-1 bg-primary-orange hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-widest py-3.5 px-6 rounded-button shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all border-none outline-none"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry Trail</span>
          </button>
          
          <Link 
            href="/"
            className="flex-1 border border-gray-250 bg-white hover:bg-gray-50 text-dark-charcoal text-xs font-bold uppercase tracking-widest py-3.5 px-6 rounded-button shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Home className="h-4 w-4 text-primary-orange" />
            <span>Basecamp</span>
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
