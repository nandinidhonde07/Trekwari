'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import Logo from './Logo';
import { Mail, Phone, MapPin, Instagram, Youtube, Facebook, ArrowRight } from 'lucide-react';

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
    <footer className="bg-gray-950 text-gray-400 pt-16 pb-8 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top 4-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand details */}
          <div className="flex flex-col space-y-4">
            <Link href="/" className="self-start">
              <Logo light={true} />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed pt-2">
              TreckWari conducts professional, safe, and highly aesthetic trekking expeditions and wilderness safaris across Maharashtra. Discover the Sahyadris with us.
            </p>
            {/* Social Links */}
            <div className="flex space-x-4 pt-2">
              <a 
                href={settings.instagram} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-900 hover:bg-orange-600 text-white p-2 rounded-full transition-all duration-300"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a 
                href={settings.youtube} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-900 hover:bg-orange-600 text-white p-2 rounded-full transition-all duration-300"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a 
                href={settings.facebook} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-gray-900 hover:bg-orange-600 text-white p-2 rounded-full transition-all duration-300"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-5">Quick Explore</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/treks" className="hover:text-orange-600 transition-colors">
                  Upcoming Expeditions
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-orange-600 transition-colors">
                  Photo & Drone Gallery
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-orange-600 transition-colors">
                  Adventure Blog & Tips
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-orange-600 transition-colors">
                  Contact & Inquiries
                </Link>
              </li>
            </ul>
          </div>

          {/* Headquarters / Contacts */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-5">Get in Touch</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-3 text-orange-600 flex-shrink-0" />
                <span className="leading-tight">
                  <strong>Headquarters:</strong><br />
                  {settings.location}
                </span>
              </li>
              <li className="flex items-center">
                <Phone className="h-4 w-4 mr-3 text-orange-600 flex-shrink-0" />
                <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-3 text-orange-600 flex-shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors truncate">
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-5">Stay Updated</h4>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Subscribe to recieve alerts about upcoming monsoon treks, camping outings, and special discounts.
            </p>
            {subscribed ? (
              <div className="bg-gray-905/40 text-orange-500 text-xs px-3 py-2.5 rounded-lg border border-gray-800">
                🎉 Thank you for subscribing to TrekWari!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex">
                <input
                  type="email"
                  required
                  placeholder="Enter email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-l-lg px-3 py-2 text-sm text-white placeholder-gray-600 w-full focus:outline-none focus:border-orange-600"
                />
                <button
                  type="submit"
                  className="bg-orange-600 text-white px-3 rounded-r-lg hover:bg-orange-500 transition-colors flex items-center justify-center"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Divider */}
        <hr className="border-gray-900 my-8" />

        {/* Bottom Credits */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 space-y-4 sm:space-y-0">
          <p>© {new Date().getFullYear()} TrekWari Adventure Platform. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
