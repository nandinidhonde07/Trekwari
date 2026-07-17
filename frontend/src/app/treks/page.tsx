'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { api } from '../../lib/api';
import { Search, SlidersHorizontal, ArrowUpRight, IndianRupee } from 'lucide-react';
import Link from 'next/link';

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
}

export default function TreksPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [priceRange, setPriceRange] = useState(2000);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await api.events.list();
        // Exclude completed ones from booking listings
        const activeEvents = data.filter((e: any) => e.status !== 'COMPLETED');
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
    <main className="min-h-screen relative bg-gray-50">
      <Navbar />
      <WhatsAppWidget />

      {/* Header Banner */}
      <section className="bg-forest-green pt-32 pb-16 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] font-bold text-sunrise-orange">Adventure awaits</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">Sahyadri Expeditions</h1>
          <p className="text-sm text-emerald-100/70 max-w-lg mx-auto pt-2 leading-relaxed font-sans">
            Choose your challenge. From dense forest walks to steep rocky summits, explore Maharashtra with professional leaders.
          </p>
        </div>
      </section>

      {/* Filters & Listing Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left: Filters Sidebar */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit space-y-6">
            <div className="flex items-center gap-2 text-forest-green font-bold border-b border-gray-100 pb-3">
              <SlidersHorizontal className="h-4.5 w-4.5 text-sunrise-orange" />
              <h3 className="text-sm font-display uppercase tracking-wider">Search Filters</h3>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Search Destination</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. Kalsubai, Malshej"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-forest-green"
                />
              </div>
            </div>

            {/* Difficulty Selector */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-forest-green bg-white"
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MODERATE">Moderate</option>
                <option value="DIFFICULT">Difficult</option>
              </select>
            </div>

            {/* Price Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Max Price</label>
                <span className="text-xs font-bold text-forest-green">INR {priceRange}</span>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-forest-green"
              />
            </div>
          </div>

          {/* Right: Treks Listing Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-forest-green" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white border border-gray-150 text-center py-16 px-4 rounded-3xl shadow-sm">
                <p className="text-sm font-bold text-forest-green font-display">No Expeditions Match Your Criteria</p>
                <p className="text-xs text-gray-400 mt-1">Try resetting your filters or modifying search keywords.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredEvents.map((trek) => {
                  const imgUrl = Array.isArray(trek.images) ? trek.images[0] : JSON.parse(trek.images || '[]')[0];
                  return (
                    <div 
                      key={trek.id}
                      className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Trek Header Image */}
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={imgUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800'}
                            alt={trek.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                          <span className="absolute top-4 left-4 bg-forest-green text-white text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded">
                            {trek.difficulty}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-5 space-y-2">
                          <h3 className="text-base font-bold text-forest-green font-display line-clamp-1">{trek.title}</h3>
                          <p className="text-[11px] font-semibold text-sunrise-orange tracking-wider">{trek.location}</p>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 pt-2 border-t border-gray-100/50">
                            Date: {new Date(trek.startDate).toLocaleDateString()} | Duration: {trek.duration}
                          </p>
                        </div>
                      </div>

                      {/* Pricing Action */}
                      <div className="px-5 pb-5 pt-0 flex items-center justify-between gap-4 border-t border-gray-50 mt-4">
                        <div className="flex items-center text-forest-green font-bold text-sm">
                          <IndianRupee className="h-3.5 w-3.5 mr-0.5 text-sunrise-orange" />
                          <span>{trek.price}</span>
                        </div>
                        <Link
                          href={`/treks/${trek.slug}`}
                          className="bg-forest-green hover:bg-emerald-800 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl flex items-center gap-1 transition-colors"
                        >
                          Book Now
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
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
