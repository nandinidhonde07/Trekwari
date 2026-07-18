'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Award, Shield, Compass, MapPin, Users, IndianRupee, Star, ChevronDown } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

function Counter({ value, suffix = '', duration = 1.5 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMilliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMilliseconds / end), 20);

    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMilliseconds / incrementTime));
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration, hasStarted]);

  return <span ref={elementRef}>{count}{suffix}</span>;
}

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 800], [0, 250]);
  const opacityText = useTransform(scrollY, [0, 500], [1, 0]);

  const reasons = [
    {
      icon: <Award className="h-5 w-5 text-primary-orange" />,
      title: 'Experienced Trek Leaders',
      desc: 'Certified, first-aid trained mountain leaders with 100+ summits each.'
    },
    {
      icon: <Shield className="h-5 w-5 text-primary-orange" />,
      title: 'Safety First Protocol',
      desc: 'Route check, real-time weather monitoring, and wilderness medical kits.'
    },
    {
      icon: <Compass className="h-5 w-5 text-primary-orange" />,
      title: 'Verified Transport & Food',
      desc: 'Comfortable private transport, hygienic homestays, and hot trail meals.'
    },
    {
      icon: <MapPin className="h-5 w-5 text-primary-orange" />,
      title: 'Monsoon Route Recce',
      desc: 'Every trail pre-inspected in-season. No unwanted surprises.'
    },
    {
      icon: <IndianRupee className="h-5 w-5 text-primary-orange" />,
      title: 'Transparent Flat Pricing',
      desc: 'Zero hidden taxes. Fair refunds. Corporate and group discounts.'
    },
    {
      icon: <Users className="h-5 w-5 text-primary-orange" />,
      title: 'Vibrant Hiker Community',
      desc: 'Join over 5,000 adventurers who love returning back to the wild with us.'
    }
  ];

  return (
    <div ref={heroRef} className="relative bg-warm-white overflow-hidden">
      
      {/* 1. Cinematic Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax Ken Burns Background */}
        <motion.div 
          style={{ y: yBg }}
          className="absolute inset-0 w-full h-[120%] animate-ken-burns origin-center pointer-events-none"
        >
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600')"
            }}
          />
        </motion.div>
        
        {/* Light Overlay to keep mountains visible (25%) */}
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_100%)] pointer-events-none" />

        {/* Mist / Fog Layer fading to Warm White (#FAFAF8) */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-warm-white to-transparent opacity-95 pointer-events-none" />

        {/* Hero Content */}
        <motion.div 
          style={{ opacity: opacityText }}
          className="relative z-20 max-w-4xl mx-auto px-6 text-center text-white space-y-6"
        >
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[9px] uppercase tracking-[0.4em] font-extrabold text-white bg-white/10 border border-white/20 px-4 py-1.5 rounded-full inline-block backdrop-blur-md"
          >
            Sahyadri Expeditions
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-7xl font-extrabold tracking-tight font-display leading-[1.1] text-white"
          >
            ASCEND <br />
            <span className="text-white">
              YOUR LIMITS.
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xs sm:text-sm text-white/90 font-semibold max-w-xl mx-auto leading-relaxed"
          >
            Discover the untouched beauty of Maharashtra with curated treks and unforgettable adventures led by certified mountaineers.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a 
              href="#treks"
              className="w-full sm:w-auto bg-primary-orange hover:bg-orange-600 hover:scale-[1.03] active:scale-[0.97] text-white text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-button shadow-lg shadow-orange-500/20 transition-all cursor-pointer text-center"
            >
              Explore Treks
            </a>
            <a 
              href="#about"
              className="w-full sm:w-auto bg-white/15 hover:bg-white/25 hover:scale-[1.03] active:scale-[0.97] text-white text-xs font-bold uppercase tracking-widest px-8 py-4 rounded-button border border-white/20 backdrop-blur-md transition-all cursor-pointer text-center"
            >
              Watch Video
            </a>
          </motion.div>
        </motion.div>

        {/* Floating Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 z-20 flex flex-col items-center gap-1.5 cursor-pointer"
          onClick={() => {
            const el = document.getElementById('about');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-white/70">Scroll</span>
          <ChevronDown className="h-4 w-4 text-white/70" />
        </motion.div>
      </section>

      {/* 2. Stats Banner Section: Light Background with Soft Shadow */}
      <section className="relative z-30 bg-white py-12 border-y border-gray-150 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
            
            <div className="pt-0">
              <p className="text-3xl sm:text-4xl font-black text-dark-charcoal tracking-tight font-display">
                <Counter value={125} suffix="+" />
              </p>
              <p className="text-[9px] uppercase tracking-widest text-gray-400 font-extrabold mt-1">
                Active Trails
              </p>
            </div>

            <div className="pt-6 md:pt-0 md:pl-4">
              <p className="text-3xl sm:text-4xl font-black text-dark-charcoal tracking-tight font-display">
                <Counter value={5500} suffix="+" />
              </p>
              <p className="text-[9px] uppercase tracking-widest text-gray-400 font-extrabold mt-1">
                Happy Trekkers
              </p>
            </div>

            <div className="pt-6 md:pt-0 md:pl-4 flex flex-col items-center justify-center">
              <div className="flex items-baseline justify-center text-3xl sm:text-4xl font-black text-dark-charcoal tracking-tight font-display">
                <span>12</span>
              </div>
              <p className="text-[9px] uppercase tracking-widest text-gray-400 font-extrabold mt-1">
                Expert Guides
              </p>
            </div>

            <div className="pt-6 md:pt-0 md:pl-4 flex flex-col items-center justify-center">
              <div className="flex items-baseline justify-center text-3xl sm:text-4xl font-black text-dark-charcoal tracking-tight font-display">
                <span>4.9</span>
                <Star className="h-4.5 w-4.5 fill-primary-orange text-primary-orange ml-1.5 self-center" />
              </div>
              <p className="text-[9px] uppercase tracking-widest text-gray-400 font-extrabold mt-1">
                Google Rating
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Why TrekWari Section: Warm White Background */}
      <section className="relative z-30 bg-warm-white py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-3xl space-y-4 mb-16">
            <span className="text-xs uppercase tracking-[0.3em] font-extrabold text-primary-orange block">
              The TrekWari Standard
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-dark-charcoal font-display leading-[1.15]">
              Adventure without the anxiety.
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
              We design premium weekend treks in Maharashtra where safety protocols, hygienic food, and like-minded hikers come together.
            </p>
          </div>
          
          {/* Reasons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reasons.map((reason, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-8 bg-white border border-gray-150 rounded-[20px] shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-orange-500/20 transition-all duration-300 flex flex-col"
              >
                <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center mb-6">
                  {reason.icon}
                </div>
                <h3 className="text-sm font-bold text-dark-charcoal mb-2 font-display">
                  {reason.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  {reason.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
