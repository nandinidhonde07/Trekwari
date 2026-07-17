'use client';

import React, { useState, useEffect } from 'react';
import { Award, Shield, Compass, MapPin, Users, IndianRupee, Star } from 'lucide-react';

function Counter({ value, suffix = '', duration = 1.2 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 25);

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
  const reasons = [
    {
      icon: <Award className="h-5 w-5 text-white" />,
      title: 'Experienced Trek Leaders',
      desc: 'Certified, first-aid trained leaders with 100+ treks each.'
    },
    {
      icon: <Shield className="h-5 w-5 text-white" />,
      title: 'Safety First',
      desc: 'Route recce, weather monitoring, and full safety kit on every trek.'
    },
    {
      icon: <Compass className="h-5 w-5 text-white" />,
      title: 'Comfortable Travel',
      desc: 'Verified transport, hygienic homestays, hot meals on trail.'
    },
    {
      icon: <MapPin className="h-5 w-5 text-white" />,
      title: 'Verified Routes',
      desc: 'Every route inspected in-season. No surprises. No guesswork.'
    },
    {
      icon: <IndianRupee className="h-5 w-5 text-white" />,
      title: 'Affordable Pricing',
      desc: 'Transparent pricing. No hidden fees. Group discounts on 6+.'
    },
    {
      icon: <Users className="h-5 w-5 text-white" />,
      title: 'Amazing Community',
      desc: 'Join 500+ trekkers who keep coming back. Life-long friendships.'
    }
  ];

  return (
    <section className="bg-white pt-32 pb-0 overflow-hidden font-sans">
      
      {/* 6 Reasons Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="max-w-3xl space-y-3">
          <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-orange-600 block">
            Why TrekWari
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Adventure without <br className="hidden sm:inline" /> the anxiety.
          </h1>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-xl">
            Six reasons India's fastest-growing trekking community trusts us with their weekends.
          </p>
        </div>
        
        {/* Reasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {reasons.map((reason, idx) => (
            <div 
              key={idx}
              className="p-8 bg-white border border-gray-100 rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:scale-[1.01] hover:border-orange-600/20 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Round Orange Icon Bubble */}
                <div className="h-10 w-10 rounded-full bg-orange-600 flex items-center justify-center mb-6 shadow-sm shadow-orange-600/10">
                  {reason.icon}
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2.5">
                  {reason.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {reason.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vibrant Orange Stats Banner Section */}
      <div className="w-full bg-gradient-to-r from-orange-600 to-orange-500 py-12 px-4 shadow-[0_4px_30px_rgba(249,115,22,0.15)] mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
            
            <div className="pt-0">
              <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                <Counter value={500} suffix="+" />
              </p>
              <p className="text-[10px] uppercase tracking-wider text-orange-100 font-bold mt-2">
                Happy Trekkers
              </p>
            </div>

            <div className="pt-6 md:pt-0 md:pl-4">
              <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                <Counter value={50} suffix="+" />
              </p>
              <p className="text-[10px] uppercase tracking-wider text-orange-100 font-bold mt-2">
                Treks Completed
              </p>
            </div>

            <div className="pt-6 md:pt-0 md:pl-4 flex flex-col items-center justify-center">
              <div className="flex items-baseline justify-center text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                <span>4.9</span>
                <Star className="h-6 w-6 fill-white text-white ml-1 self-center" />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-orange-100 font-bold mt-2">
                Average Rating
              </p>
            </div>

            <div className="pt-6 md:pt-0 md:pl-4">
              <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                <Counter value={20} suffix="+" />
              </p>
              <p className="text-[10px] uppercase tracking-wider text-orange-100 font-bold mt-2">
                Destinations
              </p>
            </div>

          </div>
        </div>
      </div>

    </section>
  );
}
