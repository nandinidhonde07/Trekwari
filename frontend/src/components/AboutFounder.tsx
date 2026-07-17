'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Compass, ShieldCheck, Heart, MapPin, CheckCircle2 } from 'lucide-react';

export default function AboutFounder() {
  const values = [
    {
      icon: <Compass className="h-5 w-5 text-sunrise-orange" />,
      title: 'Cinematic Adventure',
      desc: 'Exploring untamed ridges, climbing steep heights, and discovering forest pathways in the Sahyadris.'
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-sunrise-orange" />,
      title: 'Safety First Protocol',
      desc: 'Conducting trips under certified local guidance, emergency equipment backups, and remote support links.'
    },
    {
      icon: <Heart className="h-5 w-5 text-sunrise-orange" />,
      title: 'Nature & Community',
      desc: 'Leaving trails cleaner than we found them, supporting local villages, and building lifetime bonds.'
    }
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Split Layout Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left: Interactive Media Panel */}
          <div className="lg:col-span-6 relative h-[500px] w-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(20,83,45,0.08)]">
            {/* Main hiking image */}
            <img
              src="/images/kalsubai_2.jpg"
              alt="Trekkers summiting Kalsubai Peak above clouds"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Forest Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-forest-green/80 via-black/20 to-transparent" />
            
            {/* Floating Location Card */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-gray-100 flex items-center shadow-lg">
              <div className="bg-forest-green p-3 rounded-xl text-white mr-4">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Headquarters</p>
                <p className="text-sm font-extrabold text-forest-green font-display">Kopargaon, Maharashtra, India</p>
              </div>
            </div>
          </div>

          {/* Right: Rich Content Panel */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-[0.25em] font-bold text-sunrise-orange">The TreckWari Story</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-green font-display">
                Who We Are & Why We Explore
              </h2>
            </div>

            <div className="text-gray-600 space-y-4 leading-relaxed font-sans text-sm">
              <p>
                TreckWari was founded by <strong>Atharva Dhawale</strong>, a passionate mountaineer and trek leader, with a vision to make premium outdoor exploration safe, accessible, and deeply inspiring for nature enthusiasts across Maharashtra.
              </p>
              <p>
                "Waari" is a traditional pilgrimage of devotion. For us, <strong>TreckWari is a pilgrimage of the mountains</strong>. We don't just conquer summits; we walk in harmony with nature, respect the local village communities that host us, and build support networks of like-minded adventurers.
              </p>
            </div>

            {/* Core Values Roster */}
            <div className="space-y-5 pt-2">
              {values.map((v, idx) => (
                <div key={idx} className="flex items-start bg-gray-50 p-4 rounded-2xl border border-gray-100/50 hover:bg-emerald-50/30 transition-all duration-300">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200/50 mr-4 shadow-sm flex-shrink-0">
                    {v.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-forest-green font-display">{v.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Organization Timeline */}
            <div className="pt-4">
              <h4 className="text-sm font-bold text-forest-green mb-4 font-display">Expedition Timeline</h4>
              <div className="relative border-l border-emerald-200/80 ml-3.5 pl-6 space-y-6">
                {/* Timeline node 1 */}
                <div className="relative">
                  <div className="absolute left-[-31px] top-0.5 bg-sunrise-orange border-4 border-white h-4 w-4 rounded-full shadow-sm" />
                  <p className="text-xs font-bold text-forest-green font-display">June 2026</p>
                  <p className="text-xs text-gray-500 mt-0.5">Conquered <strong>Kalsubai Peak</strong> (Highest point in Maharashtra, 1646m) with 100+ participants.</p>
                </div>
                {/* Timeline node 2 */}
                <div className="relative">
                  <div className="absolute left-[-31px] top-0.5 bg-sunrise-orange border-4 border-white h-4 w-4 rounded-full shadow-sm" />
                  <p className="text-xs font-bold text-forest-green font-display">July 2026</p>
                  <p className="text-xs text-gray-500 mt-0.5">Guided 80+ trekkers through dense forest stream crossings at the <strong>Adrai Jungle Trail</strong>.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
