'use client';

import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Testimonials from '../components/Testimonials';
import UpcomingTrips from '../components/UpcomingTrips';
import AboutFounder from '../components/AboutFounder';
import SafetySection from '../components/SafetySection';
import Postcards from '../components/Postcards';
import FAQAccordion from '../components/FAQAccordion';
import ContactForm from '../components/ContactForm';
import Footer from '../components/Footer';
import WhatsAppWidget from '../components/WhatsAppWidget';

export default function Home() {
  return (
    <main className="min-h-screen relative bg-white">
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
        <Testimonials />
      </div>

      <div id="safety">
        <SafetySection />
      </div>

      <div>
        <Postcards />
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
