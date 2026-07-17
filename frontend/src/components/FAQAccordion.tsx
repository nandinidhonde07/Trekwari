'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

export default function FAQAccordion() {
  const faqs: FAQItem[] = [
    {
      category: 'Booking & Payments',
      q: 'How do I book a trek with TreckWari?',
      a: 'You can book directly through our website by navigating to the "Treks" page, choosing your preferred upcoming trek, entering participant details, accepting the medical waiver, and completing payment via Razorpay (supporting UPI, cards, and Net Banking).'
    },
    {
      category: 'Booking & Payments',
      q: 'What is your refund and cancellation policy?',
      a: 'Cancellations made 7 days prior to the trek start date are eligible for a 100% refund. Cancellations made 3-6 days prior get a 50% refund. Cancellations within 48 hours of departure receive no refund.'
    },
    {
      category: 'Fitness & Age Limits',
      q: 'Are these treks suitable for beginners?',
      a: 'Yes! We organize treks of varying difficulties. Our "Adrai Jungle Trek" is categorized as "Easy" and is perfect for absolute beginners and families. Our "Kalsubai Summit Trek" is "Moderate" and requires basic walking stamina, but is still beginner-friendly.'
    },
    {
      category: 'Fitness & Age Limits',
      q: 'What is the minimum age to participate?',
      a: 'The minimum age is generally 10 years for Kalsubai and 8 years for the Adrai Jungle Trek. Children below 18 must be accompanied by a parent or guardian who will sign their liability waiver.'
    },
    {
      category: 'Food & Logistics',
      q: 'What kind of food is provided during the trek?',
      a: 'We provide local village-cooked traditional meals. This includes a hot Maharashtrian breakfast (Poha or Misal Pav with tea) and a full lunch (Veg/Non-Veg options, cooked separately in separate utensils).'
    },
    {
      category: 'Safety & Weather',
      q: 'What happens in case of heavy rains or bad weather?',
      a: 'We constantly monitor weather forecasts using real-time openweather wrappers. In case of safety warnings, flash flood alerts, or extreme lightning in the region, the trek will be rescheduled and participants will be given a voucher or full refund.'
    }
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-forest-green">Got questions?</span>
          <h2 className="text-3xl font-extrabold text-forest-green mt-2 font-display">
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* Accordion header toggle */}
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-forest-green hover:text-emerald-800 transition-colors focus:outline-none"
                >
                  <span className="text-sm sm:text-base font-display flex items-center gap-2">
                    <span className="text-xs uppercase text-sunrise-orange bg-sunrise-orange/10 px-2 py-0.5 rounded font-bold font-sans">
                      {faq.category.split(' ')[0]}
                    </span>
                    {faq.q}
                  </span>
                  <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-200/50 flex-shrink-0 ml-3">
                    {isOpen ? <Minus className="h-4 w-4 text-sunrise-orange" /> : <Plus className="h-4 w-4 text-forest-green" />}
                  </div>
                </button>

                {/* Accordion content body */}
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans font-light">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
