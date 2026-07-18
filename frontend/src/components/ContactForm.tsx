'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    trip: 'Kalsubai Summit Trek',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const tripsList = [
    'Kalsubai Summit Trek',
    'Adrai Jungle Trek',
    'Monsoon Night Camp',
    'General Inquiry'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      console.log(`[Contact Form Submit] Form data:`, formData);
      setLoading(false);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        city: '',
        trip: 'Kalsubai Summit Trek',
        message: ''
      });
    }, 1200);
  };

  return (
    <section className="py-24 bg-warm-white border-t border-gray-150 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Split Layout Card */}
        <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-gray-150 flex flex-col lg:flex-row">
          
          {/* Left: Dynamic OpenStreetMap & Contact Info */}
          <div className="w-full lg:w-5/12 bg-gray-50 text-dark-charcoal p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden border-r border-gray-150">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div className="relative z-10 space-y-8">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-primary-orange font-extrabold">Find Us</span>
                <h3 className="text-2xl font-extrabold font-display mt-2 text-dark-charcoal">TrekWari Basecamp</h3>
                <p className="text-gray-500 text-xs mt-1 font-semibold leading-relaxed">Stop by or send us a message before booking.</p>
              </div>

              {/* HQ Map Iframe */}
              <div className="h-56 w-full rounded-2xl overflow-hidden border border-gray-200/80 shadow-sm bg-white">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15002.570776735165!2d74.46979603099951!3d19.892403759972323!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdd007d4b4a3a6b%3A0xe5a3c9e6db5837bd!2sKopargaon%2C%20Maharashtra%20423601!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy"
                  title="TrekWari Headquarters - Kopargaon, Maharashtra"
                />
              </div>

              {/* Direct Details */}
              <div className="space-y-4 text-xs sm:text-sm font-sans font-semibold text-gray-650">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-4 text-primary-orange flex-shrink-0" />
                  <span>Kopargaon, Maharashtra, India</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-4 text-primary-orange flex-shrink-0" />
                  <a href="tel:+919322340365" className="hover:text-primary-orange transition-colors">+91 9322340365</a>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-4 text-primary-orange flex-shrink-0" />
                  <a href="mailto:atharvadhawale80@gmail.com" className="hover:text-primary-orange transition-colors truncate">atharvadhawale80@gmail.com</a>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-gray-400 mt-12 relative z-10 font-extrabold uppercase tracking-wider">
              TrekWari HQ © 2026. Atharva Dhawale.
            </p>
          </div>

          {/* Right: Interactive Inquiry Form */}
          <div className="w-full lg:w-7/12 p-8 sm:p-12">
            <h3 className="text-2xl font-extrabold text-dark-charcoal font-display mb-6">Send an Inquiry</h3>
            
            {submitted ? (
              <div className="bg-white border border-gray-150 p-8 rounded-[20px] text-center space-y-4 shadow-sm max-w-sm mx-auto my-12">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full w-fit mx-auto shadow-sm">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h4 className="text-base font-bold text-dark-charcoal font-display">Message Dispatched</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  Thank you for contacting TrekWari! Atharva Dhawale will review your details and reach out to you within 24 hours.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-[9px] font-extrabold text-primary-orange uppercase tracking-widest hover:underline pt-2 focus:outline-none cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Name & Email Group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold text-dark-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Your email address"
                      className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold text-dark-charcoal"
                    />
                  </div>
                </div>

                {/* Phone & City Group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Your contact number"
                      className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold text-dark-charcoal"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">City</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Your city"
                      className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold text-dark-charcoal"
                    />
                  </div>
                </div>

                {/* Trip Dropdown */}
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Trek interested In</label>
                  <select
                    value={formData.trip}
                    onChange={(e) => setFormData({ ...formData, trip: e.target.value })}
                    className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold text-dark-charcoal"
                  >
                    {tripsList.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Message TextArea */}
                <div>
                  <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Message Body</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write details of your query..."
                    className="w-full border border-gray-250 bg-white rounded-xl p-4 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold text-dark-charcoal"
                  />
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={loading}
                  className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-button shadow-sm w-full transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </motion.button>

              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
