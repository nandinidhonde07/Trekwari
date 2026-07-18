'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

export default function FAQAccordion() {
  const faqs: FAQItem[] = [
    {
      category: 'Booking & Payments',
      q: 'How do I book a trek with TrekWari?',
      a: 'You can book directly through our website by navigating to the "Treks" page, choosing your preferred upcoming trek, entering participant details, accepting the medical waiver, and completing payment securely via Razorpay (supporting UPI, cards, and Net Banking).'
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
    <section className="py-24 bg-white border-t border-gray-150/40">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        
        {/* Section Title */}
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs uppercase tracking-[0.3em] font-extrabold text-primary-orange block">FAQ</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-dark-charcoal font-display tracking-tight leading-tight">
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
                className="bg-gray-50 border border-gray-100 rounded-[20px] overflow-hidden transition-all duration-300 shadow-sm"
              >
                {/* Accordion header toggle */}
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex items-center justify-between p-6 text-left font-bold text-dark-charcoal hover:text-primary-orange transition-colors focus:outline-none cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-display flex items-center gap-3">
                    <span className="text-[9px] uppercase tracking-wider text-primary-orange bg-orange-50 px-2.5 py-1 rounded-[8px] font-bold font-sans">
                      {faq.category.split(' ')[0]}
                    </span>
                    {faq.q}
                  </span>
                  <motion.div 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex-shrink-0 ml-4"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </motion.div>
                </button>

                {/* Accordion content body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 pt-0 border-t border-gray-100/50 mt-1">
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans pt-4 font-medium">
                          {faq.a}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
