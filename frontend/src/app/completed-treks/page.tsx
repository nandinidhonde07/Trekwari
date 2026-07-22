'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { api } from '../../lib/api';
import { Search, MapPin, Calendar, Clock, Star, Users, ArrowUpRight, Image as ImageIcon } from 'lucide-react';
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
  duration: string;
  price: number;
  startDate: string;
  endDate: string;
  location: string;
  images: any;
  status: string;
  maxSeats: number;
}

export default function CompletedTreksPage() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadEvents() {
      try {
        // Fetch COMPLETED events
        const data = await api.events.list({ status: 'COMPLETED' });
        // Double check they are past events and sort by endDate desc
        const now = new Date();
        const completedEvents = (data || [])
          .filter((e: any) => e.status === 'COMPLETED' || new Date(e.endDate || e.startDate) < now)
          .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        setEvents(completedEvents);
      } catch (err) {
        console.error('Failed to fetch completed treks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    return e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           e.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <WhatsAppWidget />

      {/* Header Section */}
      <section className="pt-32 pb-16 bg-gray-50 border-b border-gray-100 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-multiply" />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10 text-center">
          <span className="text-xs font-black uppercase tracking-widest text-primary-orange block mb-3">Past Expeditions</span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-dark-charcoal font-display tracking-tight leading-tight">
            Completed Treks
          </h1>
          <p className="mt-4 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto font-medium">
            A showcase of our successfully completed mountain expeditions. Explore memories, galleries, and hiker reviews.
          </p>

          <div className="mt-10 max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search past treks or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-full py-4 pl-12 pr-6 text-sm font-semibold focus:outline-none focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-[20px] overflow-hidden border border-gray-100 p-4 space-y-4 shadow-sm">
                  <Skeleton className="h-56 w-full rounded-[14px]" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
             <div className="max-w-xl mx-auto">
               <EmptyState 
                 title="No Completed Treks Found"
                 description="Try adjusting your search criteria to find past expeditions."
               />
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((trek) => {
                const coverImage = Array.isArray(trek.images) && trek.images.length > 0 
                  ? trek.images[0] 
                  : 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=600';
                  
                return (
                  <motion.div 
                    key={trek.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-56 overflow-hidden p-2">
                      <div className="w-full h-full rounded-[14px] overflow-hidden relative">
                        <img 
                          src={coverImage} 
                          alt={trek.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-charcoal/80 via-transparent to-transparent opacity-60" />
                        
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-[6px] shadow-sm">
                            Completed
                          </span>
                        </div>
                        
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                          <div className="flex items-center text-white text-[10px] font-bold">
                            <Star className="h-3 w-3 fill-primary-orange text-primary-orange mr-1" />
                            4.9 (24 Reviews)
                          </div>
                          <div className="flex items-center text-white text-[10px] font-bold bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                            <Users className="h-3 w-3 mr-1" />
                            {trek.maxSeats} Trekkers
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-extrabold text-dark-charcoal tracking-tight font-display line-clamp-1">{trek.title}</h3>
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-xs font-semibold mb-4">
                        <MapPin className="h-3 w-3 mr-1 text-primary-orange" />
                        <span className="line-clamp-1">{trek.location}</span>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                        <div className="space-y-1">
                          <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <Calendar className="h-3 w-3 mr-1" />
                            Date
                          </div>
                          <p className="text-xs font-extrabold text-dark-charcoal">
                            {new Date(trek.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="space-y-1 text-right">
                           <div className="flex items-center justify-end text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            <Clock className="h-3 w-3 mr-1" />
                            Duration
                          </div>
                          <p className="text-xs font-extrabold text-dark-charcoal">{trek.duration}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-5">
                        <Link
                          href={`/gallery`}
                          className="flex items-center justify-center gap-1.5 w-full bg-gray-50 hover:bg-gray-100 text-dark-charcoal text-[10px] font-extrabold uppercase tracking-widest py-3 rounded-button transition-colors border border-gray-150"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          Memories
                        </Link>
                        <Link
                          href={`/treks/${trek.slug}`}
                          className="flex items-center justify-center gap-1.5 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-widest py-3 rounded-button transition-colors border border-blue-200"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          View Trek
                        </Link>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
