'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import Logo from './Logo';
import { Mail, Phone, MapPin, Instagram, Youtube, Facebook, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SettingsData {
  organizationName: string;
  phone: string;
  email: string;
  location: string;
  instagram: string;
  youtube: string;
  facebook: string;
}

export default function Footer() {
  const [settings, setSettings] = useState<SettingsData>({
    organizationName: 'TreckWari',
    phone: '+91 9322340365',
    email: 'atharvadhawale80@gmail.com',
    location: 'Kopargaon, Maharashtra, India',
    instagram: 'https://www.instagram.com/trekwari',
    youtube: 'https://youtube.com/@trekwari',
    facebook: 'https://facebook.com/trekwari'
  });

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.settings.get();
        if (data) {
          setSettings({
            organizationName: data.organizationName || 'TreckWari',
            phone: data.phone || '+91 9322340365',
            email: data.email || 'atharvadhawale80@gmail.com',
            location: data.location || 'Kopargaon, Maharashtra, India',
            instagram: data.instagram || 'https://www.instagram.com/trekwari',
            youtube: data.youtube || 'https://youtube.com/@trekwari',
            facebook: data.facebook || 'https://facebook.com/trekwari'
          });
        }
      } catch (err) {
        console.error('Footer settings load error:', err);
      }
    }
    loadSettings();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      console.log(`[Newsletter] New subscription: ${newsletterEmail}`);
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-dark-charcoal text-gray-400 relative overflow-hidden pt-24 pb-8 border-t border-white/5">
      
      {/* Mountain Silhouette SVG Background Decoration */}
      <div className="absolute top-0 left-0 right-0 h-16 pointer-events-none opacity-[0.03]">
        <svg viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full object-cover">
          <path d="M0 200 L150 80 L320 150 L500 50 L680 120 L900 20 L1150 140 L1300 70 L1440 200 Z" fill="#FFFFFF"/>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        
        {/* Top Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand details */}
          <div className="flex flex-col space-y-5">
            <Link href="/" className="self-start">
              <Logo light={true} />
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed font-medium">
              TreckWari conducts professional, safe, and highly aesthetic trekking expeditions and wilderness safaris across Maharashtra. Discover the Sahyadris with us.
            </p>
            {/* Social Links */}
            <div className="flex space-x-3 pt-2">
              {[
                { icon: <Instagram className="h-4 w-4" />, href: settings.instagram },
                { icon: <Youtube className="h-4 w-4" />, href: settings.youtube },
                { icon: <Facebook className="h-4 w-4" />, href: settings.facebook }
              ].map((social, index) => (
                <motion.a 
                  key={index}
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  whileHover={{ scale: 1.1, backgroundColor: '#FF7A00' }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/5 text-white p-2.5 rounded-full transition-colors cursor-pointer"
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-xs uppercase font-extrabold tracking-widest mb-6">Quick Explore</h4>
            <ul className="space-y-3.5 text-xs font-semibold">
              <li>
                <Link href="/treks" className="hover:text-primary-orange transition-colors">
                  Upcoming Expeditions
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-primary-orange transition-colors">
                  Photo & Drone Gallery
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary-orange transition-colors">
                  Adventure Blog & Tips
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary-orange transition-colors">
                  About TrekWari
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary-orange transition-colors">
                  Contact & Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="text-white text-xs uppercase font-extrabold tracking-widest mb-6">Get in Touch</h4>
            <ul className="space-y-4.5 text-xs font-semibold">
              <li className="flex items-start">
                <MapPin className="h-4 w-4 mr-3 text-primary-orange flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-white font-bold">Headquarters:</strong><br />
                  {settings.location}
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-3 text-primary-orange flex-shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-3 text-primary-orange flex-shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors truncate">
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div>
            <h4 className="text-white text-xs uppercase font-extrabold tracking-widest mb-6">Stay Updated</h4>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed font-medium">
              Subscribe to receive alerts about upcoming monsoon treks, camping outings, and special discounts.
            </p>
            {subscribed ? (
              <div className="bg-white/5 text-primary-orange text-[10px] font-bold uppercase tracking-wider px-4 py-3.5 rounded-[14px] border border-white/5">
                🎉 Subscribed to TrekWari Alerts!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex space-x-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email address..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-[14px] px-4 py-3 text-xs text-white placeholder-gray-600 w-full focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange transition-all font-semibold"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-primary-orange text-white p-3.5 rounded-[14px] hover:bg-orange-600 transition-colors flex items-center justify-center cursor-pointer shadow-md"
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </form>
            )}
          </div>

        </div>

        {/* Divider */}
        <hr className="border-white/5 my-8" />

        {/* Bottom Credits */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] uppercase font-bold tracking-widest text-gray-500 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} TrekWari. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
