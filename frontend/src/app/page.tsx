'use client';

import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import CompletedTreks from '../components/CompletedTreks';
import UpcomingTrips from '../components/UpcomingTrips';
import AboutFounder from '../components/AboutFounder';
import SafetySection from '../components/SafetySection';
import FAQAccordion from '../components/FAQAccordion';
import ContactForm from '../components/ContactForm';
import Footer from '../components/Footer';
import WhatsAppWidget from '../components/WhatsAppWidget';

export default function Home() {
  return (
    <main className="min-h-screen relative bg-gray-50">
      {/* Sticky Navigation Bar */}
      <Navbar />

      {/* Floating WhatsApp Widget */}
      <WhatsAppWidget />

      {/* Main Sections */}
      <Hero />
      
      <div id="about">
        <AboutFounder />
      </div>

      <div id="treks">
        <UpcomingTrips />
      </div>

      <div>
        <CompletedTreks />
      </div>

      <div id="safety">
        <SafetySection />
      </div>

      <div id="faqs">
        <FAQAccordion />
      </div>

      <div id="contact">
        <ContactForm />
      </div>

      {/* Footer bar */}
      <Footer />
    </main>
  );
}
