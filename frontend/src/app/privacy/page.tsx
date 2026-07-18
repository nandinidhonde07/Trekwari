'use client';

import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen relative bg-white font-sans flex flex-col justify-between">
      <Navbar />
      <WhatsAppWidget />

      <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-32 pb-20 w-full">
        
        {/* Header Title */}
        <div className="border-b border-gray-150 pb-8 mb-10 space-y-4">
          <div className="p-3 bg-orange-50 text-primary-orange rounded-full w-fit">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-dark-charcoal font-display">Privacy Policy</h1>
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Last updated: July 2026</p>
        </div>

        {/* Document Body */}
        <div className="text-xs sm:text-sm text-gray-650 leading-relaxed space-y-6 font-medium">
          <p>
            Welcome to TrekWari. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal info, please contact us.
          </p>

          <h3 className="text-base sm:text-lg font-bold text-dark-charcoal font-display pt-4">1. Information We Collect</h3>
          <p>
            We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining info about us or our products and services, or when you participate in activities on the site.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Credentials:</strong> Names, phone numbers, email addresses, mailing addresses, date of birth, and genders.</li>
            <li><strong>Medical Disclosures:</strong> Emergency contact information, blood groups, allergies, and specific fitness readiness warnings needed for high-altitude trekking logistics.</li>
            <li><strong>Payment Info:</strong> Transactions are routed securely via Razorpay payment gateway API integration. We do not store plaintext credit card details on our local database.</li>
          </ul>

          <h3 className="text-base sm:text-lg font-bold text-dark-charcoal font-display pt-4">2. How We Use Your Information</h3>
          <p>
            We process your information for purposes based on legitimate business interests, the fulfillment of our contract with you, compliance with our legal obligations, and emergency medical response coordinates.
          </p>

          <h3 className="text-base sm:text-lg font-bold text-dark-charcoal font-display pt-4">3. Sharing Your Information</h3>
          <p>
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations with local rescue units, forest checkpoint authorities, and trek leaders.
          </p>

          <h3 className="text-base sm:text-lg font-bold text-dark-charcoal font-display pt-4">4. Security of Credentials</h3>
          <p>
            We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
          </p>
        </div>

      </div>

      <Footer />
    </main>
  );
}
