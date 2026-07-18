'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Compass, MoveRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <main className="min-h-screen relative bg-white font-sans flex flex-col justify-between">
      <Navbar />

      <div className="max-w-md mx-auto pt-44 pb-20 px-6 text-center space-y-6 flex flex-col items-center">
        
        {/* Animated Compass Icon */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
          className="p-5 bg-orange-50 text-primary-orange rounded-full shadow-sm"
        >
          <Compass className="h-12 w-12" />
        </motion.div>

        {/* 404 Header details */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-primary-orange">Error 404</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark-charcoal font-display">Lost in the Wilderness</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed max-w-sm">
            It looks like you've wandered off the trail. Don't worry, even the most experienced adventurers take a wrong turn sometimes.
          </p>
        </div>

        {/* Go back CTA */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="pt-2 w-full"
        >
          <Link 
            href="/"
            className="w-full bg-primary-orange hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-widest py-4 px-6 rounded-button shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <span>Back to Basecamp</span>
            <MoveRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
