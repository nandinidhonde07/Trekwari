'use client';

import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { Compass, Users, Map, ShieldCheck, HeartHandshake, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <main className="min-h-screen relative bg-white font-sans flex flex-col justify-between">
      <Navbar />
      <WhatsAppWidget />

      {/* Header Banner */}
      <section className="bg-[#111111] text-white pt-36 pb-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 space-y-3">
          <span className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-primary-orange">Our Journey</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight font-display">About TrekWari</h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto pt-2 leading-relaxed font-semibold">
            Connecting passionate mountain explorers with safe, professional, and eco-friendly Sahyadri expeditions.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 w-full space-y-20">
        
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-primary-orange">The Basecamp Story</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-dark-charcoal font-display">Born in the Sahyadris</h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-semibold">
              TrekWari was founded by Atharva Dhawale with a single purpose: to transform standard trekking outings into highly professional, educational, and secure wilderness expeditions. We believe that Maharashtra's historic hill forts and dense forests hold stories that deserve to be explored responsibly.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Every route we schedule is thoroughly mapped, our leaders are trained in wilderness first aid, and we enforce a strict code of leave-no-trace ecotourism to protect historical sites for generations to come.
            </p>
          </div>
          <div className="relative rounded-[20px] overflow-hidden aspect-video shadow-md border border-gray-100">
            <img 
              src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=1000" 
              alt="Mountain peak expedition" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Animated Statistics Grid */}
        <section className="bg-gray-50 rounded-[24px] border border-gray-150 p-8 sm:p-12">
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-[8px] uppercase tracking-widest font-extrabold text-primary-orange">Track Record</span>
            <h3 className="text-xl font-bold text-dark-charcoal font-display">Expedition Milestones</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-primary-orange font-display">5,000+</p>
              <p className="text-[9px] text-gray-400 uppercase font-extrabold tracking-wider">Happy Hikers</p>
            </div>
            <div className="space-y-1 border-l border-gray-200">
              <p className="text-3xl sm:text-4xl font-black text-primary-orange font-display">120+</p>
              <p className="text-[9px] text-gray-400 uppercase font-extrabold tracking-wider">Departures Completed</p>
            </div>
            <div className="space-y-1 border-l border-gray-200">
              <p className="text-3xl sm:text-4xl font-black text-primary-orange font-display">100%</p>
              <p className="text-[9px] text-gray-400 uppercase font-extrabold tracking-wider">Safety Record</p>
            </div>
            <div className="space-y-1 border-l border-gray-200">
              <p className="text-3xl sm:text-4xl font-black text-primary-orange font-display">50+</p>
              <p className="text-[9px] text-gray-400 uppercase font-extrabold tracking-wider">Leaders</p>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[9px] uppercase tracking-widest font-extrabold text-primary-orange">Our Philosophy</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-dark-charcoal font-display">Wilderness Principles</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Safety */}
            <div className="bg-white border border-gray-150 p-6 rounded-[20px] shadow-sm space-y-3">
              <div className="p-3 bg-orange-50 text-primary-orange rounded-xl w-fit">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-dark-charcoal font-display">Uncompromised Safety</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                From emergency SOS contact configs to coordinates-based weather monitoring, we map and secure every peak before our hiker roster departs.
              </p>
            </div>

            {/* Eco */}
            <div className="bg-white border border-gray-150 p-6 rounded-[20px] shadow-sm space-y-3">
              <div className="p-3 bg-orange-50 text-primary-orange rounded-xl w-fit">
                <Compass className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-dark-charcoal font-display">Environmental Stewardship</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                We advocate for Leave-No-Trace principles. Littering is prohibited, and we partner with local villages to keep forest paths pristine.
              </p>
            </div>

            {/* Community */}
            <div className="bg-white border border-gray-150 p-6 rounded-[20px] shadow-sm space-y-3">
              <div className="p-3 bg-orange-50 text-primary-orange rounded-xl w-fit">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-dark-charcoal font-display">Local Empowerment</h4>
              <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                We employ local guides, camp cooks, and home-stay hosts, channeling tourism revenue directly back into remote Sahyadri villages.
              </p>
            </div>
          </div>
        </div>

      </div>

      <Footer />
    </main>
  );
}
