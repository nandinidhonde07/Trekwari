'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

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
    
    // Simulate API delay and alert
    setTimeout(() => {
      console.log(`[Contact Form Submit] Form data:`, formData);
      console.log(`[Email Alert] Sending alert to organizer at: atharvadhawale80@gmail.com`);
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
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Split Layout Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(20,83,45,0.04)] border border-gray-100 flex flex-col lg:flex-row">
          
          {/* Left: Dynamic OpenStreetMap & Contact Info */}
          <div className="w-full lg:w-5/12 bg-forest-green text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Background Map patterns */}
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 space-y-8">
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-sunrise-orange font-bold">Find Us</span>
                <h3 className="text-2xl font-extrabold font-display mt-2">TreckWari Headquarters</h3>
                <p className="text-emerald-100/60 text-xs mt-1 font-sans font-light">Stop by or send us a message before booking.</p>
              </div>

              {/* HQ Map Iframe */}
              <div className="h-56 w-full rounded-2xl overflow-hidden border border-emerald-800 shadow-inner">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15002.570776735165!2d74.46979603099951!3d19.892403759972323!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdd007d4b4a3a6b%3A0xe5a3c9e6db5837bd!2sKopargaon%2C%20Maharashtra%20423601!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy"
                  title="TreckWari Headquarters - Kopargaon, Maharashtra"
                />
              </div>

              {/* Direct Details */}
              <div className="space-y-4 text-sm font-sans">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-4 text-sunrise-orange flex-shrink-0" />
                  <span>Kopargaon, Maharashtra, India</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-4 text-sunrise-orange flex-shrink-0" />
                  <a href="tel:+919322340365" className="hover:text-white transition-colors">+91 9322340365</a>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-4 text-sunrise-orange flex-shrink-0" />
                  <a href="mailto:atharvadhawale80@gmail.com" className="hover:text-white transition-colors">atharvadhawale80@gmail.com</a>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-emerald-200/50 mt-12 relative z-10 font-sans">
              Copyright TreckWari. Guided by Atharva Dhawale.
            </p>
          </div>

          {/* Right: Interactive Inquiry Form */}
          <div className="w-full lg:w-7/12 p-8 sm:p-12">
            <h3 className="text-2xl font-extrabold text-forest-green font-display mb-6">Send an Inquiry</h3>
            
            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center space-y-3">
                <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto" />
                <h4 className="text-lg font-bold text-forest-green font-display">Inquiry Sent Successfully</h4>
                <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                  Thank you for contacting TreckWari! Atharva Dhawale will review your details and reach out to you within 24 hours.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-xs font-semibold text-sunrise-orange hover:underline pt-2 focus:outline-none"
                >
                  Submit another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Name & Email Group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Your email address"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green"
                    />
                  </div>
                </div>

                {/* Phone & City Group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Your contact number"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">City</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Your city"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green"
                    />
                  </div>
                </div>

                {/* Trip Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trek / Trip Interested In</label>
                  <select
                    value={formData.trip}
                    onChange={(e) => setFormData({ ...formData, trip: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green"
                  >
                    {tripsList.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Message TextArea */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write details of your query..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-sunrise-orange hover:bg-yellow-500 text-forest-green font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-md w-full transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-forest-green" />
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Inquiry
                    </>
                  )}
                </button>

              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
