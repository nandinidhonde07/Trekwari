'use client';

import React from 'react';
import { ShieldAlert, Activity, CloudSun, CheckSquare, HeartHandshake } from 'lucide-react';

export default function SafetySection() {
  const safetyCards = [
    {
      icon: <Activity className="h-6 w-6 text-sunrise-orange" />,
      title: 'Wilderness First Aid',
      desc: 'All trek leaders are certified first responders, trained in emergency management and wilderness injury treatment.'
    },
    {
      icon: <CloudSun className="h-6 w-6 text-sunrise-orange" />,
      title: 'Live Weather Checks',
      desc: 'Real-time weather monitoring using satellite metrics. Bookings are shifted if extreme monsoons or thunderstorms are forecasted.'
    },
    {
      icon: <CheckSquare className="h-6 w-6 text-sunrise-orange" />,
      title: 'Rigorous Gear Audits',
      desc: 'Frequent inspection of ropes, harness systems, and medical kits (including oximeters and oxygen backups) before trail starts.'
    },
    {
      icon: <HeartHandshake className="h-6 w-6 text-sunrise-orange" />,
      title: 'Local Support Networks',
      desc: 'Continuous tie-ups with village councils (Bari, Malshej) for rapid emergency search, rescue, and local evacuation support.'
    }
  ];

  return (
    <section className="py-24 bg-forest-green text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Title */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-sunrise-orange">Professional Standard</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display">
            Our Uncompromising Safety Commitment
          </h2>
          <p className="text-emerald-100/70 text-sm leading-relaxed">
            In adventure expeditions, safety is not an option—it is the foundation. At TreckWari, we maintain 100% emergency response compliance so you can explore with complete confidence.
          </p>
        </div>

        {/* Safety Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {safetyCards.map((card, idx) => (
            <div 
              key={idx}
              className="bg-emerald-950/40 backdrop-blur-sm border border-emerald-800/80 p-6 rounded-3xl flex flex-col justify-between hover:border-sunrise-orange/50 transition-all duration-300 group hover:scale-[1.02]"
            >
              <div>
                {/* Icon wrapper */}
                <div className="bg-emerald-900/60 p-3 rounded-2xl border border-emerald-800 self-start mb-5 group-hover:bg-sunrise-orange/15 transition-colors">
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold font-display mb-2 text-white">
                  {card.title}
                </h3>
                <p className="text-xs text-emerald-100/60 leading-relaxed font-sans font-light">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* SOS Alert Bar */}
        <div className="mt-16 bg-emerald-950/60 border border-emerald-900 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto text-center md:text-left">
          <div className="flex items-center gap-3.5">
            <div className="bg-red-500/10 p-2 rounded-xl text-red-400 border border-red-500/20">
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold font-display">Need Live Emergency Support?</p>
              <p className="text-xs text-emerald-200/60 font-sans mt-0.5">Trek leaders can trigger instant SOS alerts directly to our Kopargaon command center.</p>
            </div>
          </div>
          <a 
            href="tel:+919322340365" 
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all flex-shrink-0"
          >
            Call HQ Emergency Line
          </a>
        </div>

      </div>
    </section>
  );
}
