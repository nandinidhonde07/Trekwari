'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Link from 'next/link';
import { Clock, Mountain, User, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from './ui/skeleton';
import { EmptyState } from './ui/empty-state';

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
  maxSeats: number;
  startDate: string;
  location: string;
  images: any;
}

export default function UpcomingTrips() {
  const [trips, setTrips] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      try {
        const data = await api.events.list({ status: 'OPEN_REGISTRATION' });
        const upcomingOnly = data.filter((e: any) => new Date(e.startDate) > new Date());
        setTrips(upcomingOnly.slice(0, 3));
      } catch (err) {
        console.error('Failed to load upcoming events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrips();
  }, []);

  return (
    <section className="py-24 bg-light-gray border-t border-gray-100 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.3em] font-extrabold text-primary-orange block">
              Upcoming Departures
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-dark-charcoal font-display tracking-tight leading-tight">
              The mountains are calling.
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-xl font-medium">
              Handpicked Sahyadri departures. Small groups. Certified safety protocols. Unforgettable sunrise views guaranteed.
            </p>
          </div>
          <Link
            href="/treks"
            className="group flex-shrink-0 border border-gray-200 hover:border-dark-charcoal hover:bg-dark-charcoal hover:text-white text-dark-charcoal font-bold text-xs uppercase tracking-widest px-6 py-4 rounded-full transition-all duration-300 flex items-center gap-2"
          >
            <span>View all treks</span>
            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Skeletons/Empty State/Trips Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-[20px] overflow-hidden border border-gray-100 p-4 space-y-4 shadow-sm">
                <Skeleton className="h-56 w-full rounded-[14px]" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-8 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="max-w-xl mx-auto">
            <EmptyState 
              title="No Departures Open Currently"
              description="We are planning our upcoming mountain treks and monsoon expeditions. Follow us on Instagram @trekwari to get alerts as soon as bookings open!"
              actionLabel="Follow Instagram"
              onAction={() => window.open('https://instagram.com/trekwari', '_blank')}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip, idx) => {
              const imgUrl = Array.isArray(trip.images) ? trip.images[0] : JSON.parse(trip.images || '[]')[0];
              const isChallenging = trip.difficulty.toLowerCase().includes('challenging') || trip.difficulty.toLowerCase().includes('hard');
              
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="bg-white rounded-[20px] overflow-hidden border border-gray-100 flex flex-col justify-between group hover:shadow-xl hover:border-primary-orange/20 transition-all duration-300 shadow-sm"
                >
                  <Link href={`/treks/${trip.slug}`}>
                    <div className="relative h-60 overflow-hidden m-3 rounded-[14px]">
                      <img
                        src={imgUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800'}
                        alt={trip.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25" />

                      {/* Difficulty Badge */}
                      <span className={`absolute top-4 left-4 border text-[8px] uppercase font-extrabold tracking-widest px-3 py-1 rounded-[8px] backdrop-blur-md ${
                        isChallenging 
                          ? 'bg-red-50 text-red-650 border-red-100' 
                          : 'bg-orange-50 text-primary-orange border-orange-100'
                      }`}>
                        {trip.difficulty}
                      </span>

                      {/* Rating badge */}
                      <span className="absolute top-4 right-4 bg-white/95 text-dark-charcoal text-[9px] font-extrabold px-2.5 py-1 rounded-[8px] flex items-center gap-1 shadow-sm border border-gray-100">
                        <Star className="h-3 w-3 fill-primary-orange text-primary-orange" />
                        <span>4.9</span>
                      </span>

                      {/* Location & Title */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="text-[8px] font-extrabold uppercase tracking-widest text-gray-300">
                          {trip.location.split(',')[0]}
                        </p>
                        <h3 className="text-lg font-bold tracking-tight mt-1 font-display">
                          {trip.title}
                        </h3>
                      </div>
                    </div>

                    {/* Stats strip */}
                    <div className="px-6 py-4">
                      <div className="grid grid-cols-3 gap-2 py-3 border-b border-gray-50 text-[10px] text-gray-500 font-bold text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] uppercase tracking-wider text-gray-400">Duration</span>
                          <span className="text-dark-charcoal mt-1 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary-orange" /> {trip.duration}</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-r border-gray-100">
                          <span className="text-[8px] uppercase tracking-wider text-gray-400">Altitude</span>
                          <span className="text-dark-charcoal mt-1 flex items-center gap-1"><Mountain className="h-3.5 w-3.5 text-primary-orange" /> {trip.altitude || '1646m'}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] uppercase tracking-wider text-gray-400">Availability</span>
                          <span className="text-primary-orange mt-1 flex items-center gap-1"><User className="h-3.5 w-3.5" /> {trip.availableSeats} Left</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Pricing footer */}
                  <div className="px-6 pb-6 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-gray-400 font-extrabold">From</p>
                      <p className="text-base font-extrabold text-dark-charcoal mt-0.5">INR {trip.price}</p>
                    </div>
                    <Link
                      href={`/treks/${trip.slug}`}
                      className="bg-primary-orange text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-button hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/10 cursor-pointer"
                    >
                      Book Now
                    </Link>
                  </div>

                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
