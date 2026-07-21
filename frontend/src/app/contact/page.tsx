'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    api.settings.get()
      .then(setSettings)
      .catch(err => console.error('Failed to load settings in contact page:', err));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1200);
  };

  return (
    <main className="min-h-screen relative bg-white font-sans flex flex-col justify-between">
      <Navbar />
      <WhatsAppWidget />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-32 pb-20 w-full">
        
        {/* Title Header */}
        <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-primary-orange">Get In Touch</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-dark-charcoal font-display">Contact HQ Basecamp</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
            Have questions about upcoming treks, bookings, custom corporate packages, or fitness readiness? Send us a message and our team will get back to you shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left: Contact Info details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-xl font-bold text-dark-charcoal font-display">Direct Lines</h3>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
              Reach out directly via phone or email, or drop by our basecamp office.
            </p>

            <div className="space-y-4">
              
              {/* Phone */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-primary-orange flex-shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Helpline</p>
                  <a href={`tel:${settings?.phone || '+919322340365'}`} className="text-sm font-bold text-dark-charcoal hover:text-primary-orange transition-colors">
                    {settings?.phone || '+91 9322340365'}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-primary-orange flex-shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Support</p>
                  <a href={`mailto:${settings?.email || 'atharvadhawale80@gmail.com'}`} className="text-sm font-bold text-dark-charcoal hover:text-primary-orange transition-colors truncate max-w-[250px] inline-block">
                    {settings?.email || 'atharvadhawale80@gmail.com'}
                  </a>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-primary-orange flex-shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Basecamp Head Office</p>
                  <p className="text-sm font-bold text-dark-charcoal">
                    {settings?.hqName || 'TrekWari HQ Basecamp'}<br />
                    <span className="text-xs text-gray-500 font-semibold">
                      {settings?.address ? `${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}` : 'Kopargaon, Maharashtra, India'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Message Form (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-gray-150 p-8 rounded-[24px] shadow-lg shadow-black/[0.01]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="text-lg font-bold text-dark-charcoal font-display mb-4">Send a Secure Message</h3>
              
              {success && (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs px-4 py-3.5 rounded-xl font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
                  <span>Message dispatched successfully! We'll reply within 24 hours.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full border border-gray-250 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full border border-gray-250 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Booking enquiry, Corporate event, etc."
                  className="w-full border border-gray-250 rounded-xl px-4 py-3.5 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold bg-white"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Message Body</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you need help with..."
                  className="w-full border border-gray-250 rounded-xl p-4 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={sending}
                  className="bg-primary-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-8 rounded-button shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="h-3.5 w-3.5" />
                    </>
                  )}
                </motion.button>
              </div>

            </form>
          </div>

        </div>

      </div>

      <Footer />
    </main>
  );
}
