'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// Counter component for animation
function Counter({ value, suffix = '', duration = 1.5 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 20);

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) {
        clearInterval(timer);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}{suffix}</span>;
}

export default function Hero() {
  const stats = [
    { value: 2, suffix: '+', label: 'Completed Treks' },
    { value: 200, suffix: '+', label: 'Participants' },
    { value: 2, suffix: '', label: 'Destinations' },
    { value: 100, suffix: '%', label: 'Safety Record' }
  ];

  return (
    <section className="relative h-screen w-full flex flex-col justify-center items-center overflow-hidden">
      {/* Background Image with Dark Forest Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-10000 scale-105"
        style={{ 
          backgroundImage: "url('/images/homepage_banner.jpg')",
        }}
      />
      {/* Cinematic Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-forest-green/90" />

      {/* Parallax Floating Clouds Mock */}
      <div className="absolute top-20 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-[-10%] w-[50%] h-32 bg-white/10 blur-[90px] rounded-full animate-pulse" />
        <div className="absolute top-1/2 right-[-10%] w-[60%] h-40 bg-white/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center mt-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          {/* Tag Category Badge */}
          <span className="inline-block text-xs uppercase tracking-[0.3em] font-bold text-sunrise-orange bg-sunrise-orange/10 border border-sunrise-orange/30 px-4 py-1.5 rounded-full">
            Not Just A Trek, It's A Waari
          </span>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight font-display">
            Explore Beyond <span className="text-gradient-sunrise">Limits</span>
          </h1>

          <p className="text-base sm:text-xl text-emerald-100/90 max-w-2xl mx-auto font-sans leading-relaxed font-light">
            Adventure begins with every step. Join TreckWari for premium, safety-first trekking expeditions across the Sahyadri mountains of Maharashtra and beyond.
          </p>

          {/* Call-to-Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link
              href="/treks"
              className="bg-sunrise-orange text-forest-green px-8 py-3.5 rounded-full font-bold uppercase tracking-wider hover:bg-yellow-500 hover:scale-105 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] text-sm"
            >
              View Upcoming Treks
            </Link>
            <Link
              href="/signup"
              className="border border-white/40 bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-full font-bold uppercase tracking-wider transition-all text-sm hover:scale-105"
            >
              Join Next Trek
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Statistics Overlay Banner */}
      <div className="absolute bottom-20 left-0 w-full z-10 px-4">
        <div className="max-w-4xl mx-auto glass-card-dark rounded-2xl p-6 sm:p-8 border border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-emerald-800/60">
            {stats.map((stat, idx) => (
              <div key={idx} className={`pt-4 md:pt-0 ${idx === 0 ? 'pt-0' : ''}`}>
                <p className="text-3xl sm:text-4xl font-extrabold text-sunrise-orange font-display">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs uppercase tracking-widest text-emerald-100/70 font-semibold mt-1.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Animated Scroll Down Indicator */}
      <div className="absolute bottom-6 z-10 flex flex-col items-center animate-bounce">
        <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/60 font-semibold mb-1">Scroll Explore</span>
        <ChevronDown className="h-5 w-5 text-sunrise-orange" />
      </div>
    </section>
  );
}
