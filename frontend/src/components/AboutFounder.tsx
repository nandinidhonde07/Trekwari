'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, ShieldCheck, Heart, MapPin } from 'lucide-react';
import { api } from '../lib/api';

export default function AboutFounder() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    api.settings.get()
      .then(setSettings)
      .catch(err => console.error('Failed to load settings in AboutFounder:', err));
  }, []);

  const values = [
    {
      icon: <Compass className="h-5 w-5 text-primary-orange" />,
      title: 'Cinematic Adventure',
      desc: 'Exploring untamed ridges, climbing steep heights, and discovering forest pathways in the Sahyadris.'
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-primary-orange" />,
      title: 'Safety First Protocol',
      desc: 'Conducting trips under local guidance, emergency equipment backups, and remote support links.'
    },
    {
      icon: <Heart className="h-5 w-5 text-primary-orange" />,
      title: 'Nature & Community',
      desc: 'Leaving trails cleaner than we found them, supporting local villages, and building lifetime bonds.'
    }
  ];

  return (
    <section className="py-24 bg-white overflow-hidden border-t border-gray-150">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Split Layout Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left: Interactive Media Panel */}
          <div className="lg:col-span-6 relative h-[500px] w-full rounded-[24px] overflow-hidden shadow-sm border border-gray-100">
            {/* Main hiking image */}
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800"
              alt="Trekkers summiting peak above clouds"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Soft Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            
            {/* Floating Location Card */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-gray-150 flex items-center shadow-md">
              <div className="bg-primary-orange p-3 rounded-xl text-white mr-4">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-widest text-gray-400 font-extrabold">Headquarters</p>
                <p className="text-sm font-bold text-dark-charcoal font-display">
                  {settings?.address ? `${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}` : 'Kopargaon, Maharashtra, India'}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Rich Content Panel */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-primary-orange">The {settings?.companyName || 'TrekWari'} Story</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-dark-charcoal font-display leading-tight">
                Who We Are & Why We Explore
              </h2>
            </div>

            <div className="text-gray-500 space-y-4 leading-relaxed font-sans text-xs sm:text-sm font-semibold">
              <p>
                {settings?.companyName || 'TrekWari'} was founded by <strong>{settings?.founderName || 'Atharva Dhawale'}</strong>, a passionate mountaineer and trek leader, with a vision to make premium outdoor exploration safe, accessible, and deeply inspiring for nature enthusiasts across Maharashtra.
              </p>
              <p>
                "Waari" is a traditional pilgrimage of devotion. For us, <strong>TrekWari is a pilgrimage of the mountains</strong>. We don't just conquer summits; we walk in harmony with nature, respect the local village communities that host us, and build support networks of like-minded adventurers.
              </p>
            </div>

            {/* Core Values Roster */}
            <div className="space-y-5 pt-2">
              {values.map((v, idx) => (
                <div key={idx} className="flex items-start bg-gray-50 p-4 rounded-2xl border border-gray-100/50 hover:bg-orange-50/30 transition-all duration-300">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-200/50 mr-4 shadow-sm flex-shrink-0">
                    {v.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-dark-charcoal font-display">{v.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Organization Timeline */}
            <div className="pt-4">
              <h4 className="text-sm font-bold text-dark-charcoal mb-4 font-display">Expedition Timeline</h4>
              <div className="relative border-l border-orange-100 ml-3.5 pl-6 space-y-6">
                {/* Timeline node 1 */}
                <div className="relative">
                  <div className="absolute left-[-31px] top-0.5 bg-primary-orange border-4 border-white h-4 w-4 rounded-full shadow-sm" />
                  <p className="text-xs font-bold text-dark-charcoal font-display">June 2026</p>
                  <p className="text-xs text-gray-500 mt-0.5">Conquered <strong>Kalsubai Peak</strong> (Highest point in Maharashtra, 1646m) with 100+ participants.</p>
                </div>
                {/* Timeline node 2 */}
                <div className="relative">
                  <div className="absolute left-[-31px] top-0.5 bg-primary-orange border-4 border-white h-4 w-4 rounded-full shadow-sm" />
                  <p className="text-xs font-bold text-dark-charcoal font-display">July 2026</p>
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
