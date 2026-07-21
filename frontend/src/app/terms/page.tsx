'use client';

import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="min-h-screen relative bg-white font-sans flex flex-col justify-between">
      <Navbar />
      <WhatsAppWidget />

      <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-32 pb-20 w-full">
        
        {/* Header Title */}
        <div className="border-b border-gray-150 pb-8 mb-10 space-y-4">
          <div className="p-3 bg-orange-50 text-primary-orange rounded-full w-fit">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark-charcoal font-display">Terms of Service</h1>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Last updated: July 2026</p>
        </div>

        {/* Document Body */}
        <div className="text-xs sm:text-sm text-gray-650 leading-relaxed space-y-6 font-medium">
          <p>
            By accessing and booking a spot on our platform, you agree to comply with and be bound by the following terms and conditions. Please read them carefully before making reservations.
          </p>

          <h3 className="text-base sm:text-lg font-bold text-dark-charcoal font-display pt-4">1. Trek Registration & Bookings</h3>
          <p>
            All participants must provide accurate personal credentials, active contact information, and mandatory emergency contact details. Your reservation is only confirmed once full payment is successfully verified.
          </p>

          <h3 className="text-base sm:text-lg font-bold text-dark-charcoal font-display pt-4">2. Wilderness Conduct & Safety Code</h3>
          <p>
            Trekking involves inherent physical challenges and environmental risks. By booking, you agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Strictly follow all safety instructions and trail guidelines provided by trek leaders.</li>
            <li>Maintain zero tolerance for littering, single-use plastics, or chemical dumping in nature reserves.</li>
            <li>Abide by the strict zero-tolerance code on alcohol, drugs, or toxic consumption during the entire trek itinerary.</li>
          </ul>

          <h3 className="text-base sm:text-lg font-bold text-dark-charcoal font-display pt-4">3. Cancellation & Refunds</h3>
          <p>
            Standard cancellation timelines apply to bookings:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Cancellations made 7+ days prior to departure: 100% refund (minus payment processing gateway fee).</li>
            <li>Cancellations made 3-6 days prior to departure: 50% refund.</li>
            <li>Cancellations made less than 3 days prior: No refunds.</li>
            <li>Weather Cancellations: If a trek is suspended due to natural hazards, landslides, or forest fires, TrekWari will issue a 100% voucher credit valid for any upcoming trail.</li>
          </ul>

          <h3 className="text-base sm:text-lg font-bold text-dark-charcoal font-display pt-4">4. Liability Waiver</h3>
          <p>
            Each participant assumes full responsibility for their physical fitness level. TrekWari and its volunteers shall not be held liable for personal injuries, illnesses, or properties lost during adventure routes.
          </p>
        </div>

      </div>

      <Footer />
    </main>
  );
}
