'use client';

import React from 'react';

export default function Testimonials() {
  const testimonials = [
    {
      quote: 'Genuinely felt cared for from pickup to drop-off. The sunrise on Kalsubai is burned into memory.',
      initials: 'ND',
      name: 'Nandini Dhonde',
      detail: 'Kalsubai - Jun 2026'
    },
    {
      quote: 'As a solo trekker I worried about safety. TrekWari\'s leaders are the real deal — I\'ve done 2 treks with them now.',
      initials: 'KD',
      name: 'Kalyani Davange',
      detail: 'Konkan Kada - Sep 2025'
    },
    {
      quote: 'Rappelling into Sandhan was the most alive I\'ve felt in years. Every detail was handled beautifully.',
      initials: 'SJ',
      name: 'Sagar Jadhav',
      detail: 'Sandhan Valley - Nov 2025'
    },
    {
      quote: 'Monsoon Rajmachi with TrekWari = 10/10. Chai on the fort at sunrise was pure magic.',
      initials: 'UK',
      name: 'Udit Khade',
      detail: 'Rajmachi - Jul 2026'
    }
  ];

  return (
    <section className="py-24 bg-white font-sans border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="max-w-3xl mb-16 space-y-3">
          <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-orange-600 block">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight font-display">
            Trekkers who keep coming back.
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, idx) => (
            <div 
              key={idx}
              className="p-8 bg-white border border-gray-150 rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.01)] flex flex-col justify-between h-full hover:border-orange-600/20 hover:shadow-md transition-all duration-300"
            >
              <div>
                {/* Orange Left Quote Mark */}
                <span className="text-4xl font-serif font-black text-orange-600 leading-none select-none block mb-4">
                  “
                </span>
                <p className="text-xs text-gray-700 leading-relaxed font-normal">
                  {t.quote}
                </p>
              </div>

              {/* Hiker Profile row */}
              <div className="flex items-center gap-3 mt-8 border-t border-gray-50 pt-5">
                {/* Initials Circle */}
                <div className="h-9 w-9 rounded-full bg-orange-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-sm">
                  {t.initials}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    {t.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {t.detail}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
