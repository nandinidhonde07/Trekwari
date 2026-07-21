'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { api } from '../../lib/api';
import { Search, SlidersHorizontal, ArrowUpRight, IndianRupee, MapPin, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/ui/empty-state';

interface EventData {
  id: string;
  title: string;
  slug: string;
  type: string;
  difficulty: string;
  altitude: string;
  duration: string;
  price: number;
  availableSeats: number;
  startDate: string;
  location: string;
  images: any;
  status: string;
  maxSeats: number;
}

export default function TreksPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [priceRange, setPriceRange] = useState(2500);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await api.events.list({ status: 'OPEN_REGISTRATION' });
        const now = new Date();
        const activeEvents = (data || [])
          .filter((e: any) => new Date(e.startDate) >= now && e.status === 'OPEN_REGISTRATION' && !e.isDeleted)
          .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setEvents(activeEvents);
      } catch (err) {
        console.error('Failed to fetch treks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    const matchesSearch = 
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDifficulty = 
      selectedDifficulty === 'ALL' || 
      e.difficulty.toUpperCase() === selectedDifficulty;

    const matchesPrice = e.price <= priceRange;

    return matchesSearch && matchesDifficulty && matchesPrice;
  });

  return (
    <main className="min-h-screen relative bg-white font-sans">
      <Navbar />
      <WhatsAppWidget />

      {/* Header Banner */}
      <section className="bg-[#111111] text-white pt-36 pb-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 space-y-3">
          <span className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-primary-orange">Explore Sahyadri</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight font-display">Adventure Expeditions</h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto pt-2 leading-relaxed font-semibold">
            Choose your challenge. From dense forest trails to steep rocky summits, explore Maharashtra with experienced guides.
          </p>
        </div>
      </section>

      {/* Filters & Listing Area */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Filters Sidebar (3 cols) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-[20px] border border-gray-150 shadow-sm h-fit space-y-6">
            <div className="flex items-center gap-2 text-dark-charcoal font-bold border-b border-gray-50 pb-4">
              <SlidersHorizontal className="h-4.5 w-4.5 text-primary-orange" />
              <h3 className="text-xs font-display uppercase tracking-widest font-extrabold">Search Filters</h3>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Search Destination</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. Kalsubai, Adrai"
                  className="w-full border border-gray-250 bg-white rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold"
                />
              </div>
            </div>

            {/* Difficulty Selector */}
            <div>
              <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
              >
                <option value="ALL">All Levels</option>
                <option value="EASY">Easy Walk</option>
                <option value="MODERATE">Moderate Climb</option>
                <option value="DIFFICULT">Difficult Ascent</option>
              </select>
            </div>

            {/* Price Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Max Budget</label>
                <span className="text-xs font-black text-primary-orange font-display">INR {priceRange}</span>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-150 rounded-lg appearance-none cursor-pointer accent-primary-orange"
              />
            </div>
          </div>

          {/* Right: Treks Listing Grid (9 cols) */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white border border-gray-150 rounded-[20px] p-4 space-y-4 shadow-sm">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <EmptyState
                title="No Expeditions Found"
                description="Try adjusting difficulty settings, resetting the filters, or typing a different peak name."
                actionLabel="Reset Filters"
                onAction={() => {
                  setSearchTerm('');
                  setSelectedDifficulty('ALL');
                  setPriceRange(3000);
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredEvents.map((trek) => {
                  const imgUrl = Array.isArray(trek.images) ? trek.images[0] : JSON.parse(trek.images || '[]')[0];
                  
                  const isChallenging = trek.difficulty.toLowerCase().includes('challenging') || trek.difficulty.toLowerCase().includes('hard') || trek.difficulty.toLowerCase().includes('difficult');
                  const difficultyBadgeClass = isChallenging 
                    ? 'bg-red-50 text-red-600 border-red-100' 
                    : 'bg-orange-50 text-primary-orange border-orange-100';

                  const getStatusBadge = (status: string, availableSeats: number) => {
                    if (status === 'DRAFT') return { text: 'Draft', className: 'bg-gray-50 text-gray-500 border-gray-200' };
                    if (status === 'CANCELLED') return { text: 'Cancelled', className: 'bg-red-50 text-red-650 border-red-100' };
                    if (status === 'COMPLETED') return { text: 'Completed', className: 'bg-blue-50 text-blue-600 border-blue-100' };
                    if (status === 'ONGOING') return { text: 'Live', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
                    if (status === 'REGISTRATION_CLOSED') return { text: 'Closed', className: 'bg-gray-100 text-gray-600 border-gray-200' };
                    if (status === 'UPCOMING') return { text: 'Upcoming', className: 'bg-amber-50 text-amber-600 border-amber-100' };
                    
                    if (status === 'OPEN_REGISTRATION') {
                      if (availableSeats === 0) return { text: 'Sold Out', className: 'bg-red-50 text-red-700 border-red-150' };
                      if (availableSeats > 0 && availableSeats <= 5) return { text: 'Few Seats Left', className: 'bg-amber-50 text-amber-700 border-amber-150' };
                      return { text: 'Open for Booking', className: 'bg-emerald-50 text-emerald-800 border-emerald-150' };
                    }
                    return null;
                  };

                  const badge = getStatusBadge(trek.status, trek.availableSeats);

                  return (
                    <motion.div 
                      key={trek.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="bg-white border border-gray-150 rounded-[20px] overflow-hidden shadow-sm hover:shadow-md hover:border-primary-orange/20 transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Trek Header Image */}
                        <div className="relative h-52 overflow-hidden">
                          <img
                            src={imgUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800'}
                            alt={trek.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />
                          <span className={`absolute top-4 left-4 border text-[8px] uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-[8px] ${difficultyBadgeClass}`}>
                            {trek.difficulty}
                          </span>
                          {badge && (
                            <span className={`absolute top-4 right-4 border text-[8px] uppercase font-black tracking-widest px-2.5 py-1 rounded-[8px] ${badge.className}`}>
                              {badge.text}
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-6 space-y-3.5">
                          <h3 className="text-base sm:text-lg font-bold text-dark-charcoal group-hover:text-primary-orange transition-colors font-display line-clamp-1">{trek.title}</h3>
                          <div className="space-y-1.5 text-xs text-gray-550 font-semibold leading-relaxed">
                            <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary-orange flex-shrink-0" /> {trek.location}</p>
                            <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary-orange flex-shrink-0" /> {new Date(trek.startDate).toLocaleDateString()}</p>
                            <p className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary-orange flex-shrink-0" /> {trek.duration}</p>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Action */}
                      <div className="px-6 pb-6 pt-0 flex items-center justify-between gap-4 border-t border-gray-50 mt-4">
                        <div className="flex items-baseline text-dark-charcoal font-black text-lg mt-4 font-display">
                          <IndianRupee className="h-4 w-4 text-primary-orange mr-0.5" />
                          <span>{trek.price}</span>
                        </div>
                        <Link
                          href={`/treks/${trek.slug}`}
                          className="bg-primary-orange hover:bg-orange-600 text-white text-[9px] font-bold uppercase tracking-widest px-5 py-3 rounded-button flex items-center gap-1 shadow-sm mt-4 cursor-pointer transition-colors"
                        >
                          <span>Reserve Spot</span>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
