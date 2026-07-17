'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Link from 'next/link';
import { Clock, Mountain, User, Star, AlertCircle, Loader2 } from 'lucide-react';

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
        // Take only upcoming events
        const upcomingOnly = data.filter((e: any) => new Date(e.startDate) > new Date());
        setTrips(upcomingOnly.slice(0, 3)); // Display up to 3 upcoming departures
      } catch (err) {
        console.error('Failed to load upcoming events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrips();
  }, []);

  return (
    <section className="py-24 bg-white font-sans border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-orange-600 block">
              Upcoming Departures
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
              The mountains are calling.
            </h2>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-xl">
              Handpicked Sahyadri departures. Small groups. Verified routes. Sunrise-catching guaranteed.
            </p>
          </div>
          <Link
            href="/treks"
            className="flex-shrink-0 border border-gray-200 hover:border-gray-900 text-gray-800 font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-full transition-colors flex items-center gap-2"
          >
            <span>View all treks</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
          </div>
        ) : trips.length === 0 ? (
          /* Empty State */
          <div className="max-w-md mx-auto text-center bg-white border border-gray-200 p-8 rounded-3xl shadow-sm">
            <AlertCircle className="h-10 w-10 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">No Active Bookings Open</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              We are currently planning our next Sahyadri expeditions. Follow our Instagram profile <strong className="text-orange-600">@trekwari</strong> to get notified first!
            </p>
          </div>
        ) : (
          /* Trips Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip) => {
              const imgUrl = Array.isArray(trip.images) ? trip.images[0] : JSON.parse(trip.images || '[]')[0];
              
              // Difficulty colors
              const isChallenging = trip.difficulty.toLowerCase().includes('challenging') || trip.difficulty.toLowerCase().includes('hard');
              const difficultyBadgeClass = isChallenging 
                ? 'bg-red-50 text-red-700 border-red-100' 
                : 'bg-orange-50 text-orange-700 border-orange-100';

              return (
                <Link
                  key={trip.id}
                  href={`/treks/${trip.slug}`}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-150 flex flex-col justify-between group hover:shadow-xl hover:shadow-gray-250/20 hover:border-orange-600/20 transition-all duration-300"
                >
                  <div>
                    {/* Header Image with dark gradient and text overlay */}
                    <div className="relative h-64 overflow-hidden rounded-t-3xl">
                      <img
                        src={imgUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800'}
                        alt={trip.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

                      {/* Difficulty Badge */}
                      <span className={`absolute top-4 left-4 border text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-lg ${difficultyBadgeClass}`}>
                        {trip.difficulty}
                      </span>

                      {/* Mock rating badge */}
                      <span className="absolute top-4 right-4 bg-white/95 text-gray-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm border border-gray-100">
                        <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                        <span>4.9</span>
                      </span>

                      {/* Location & Title Overlay */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-gray-300">
                          {trip.location.split(',')[0]}
                        </p>
                        <h3 className="text-xl font-bold tracking-tight mt-0.5">
                          {trip.title}
                        </h3>
                      </div>
                    </div>

                    {/* Stats Strip under image */}
                    <div className="p-6">
                      <div className="grid grid-cols-3 gap-2 py-3 border-b border-gray-100 text-xs text-gray-500 font-bold text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] uppercase tracking-wider text-gray-400">Duration</span>
                          <span className="text-gray-800 mt-1 flex items-center gap-1"><Clock className="h-3 w-3 text-orange-600" /> {trip.duration}</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-r border-gray-100">
                          <span className="text-[9px] uppercase tracking-wider text-gray-400">Altitude</span>
                          <span className="text-gray-800 mt-1 flex items-center gap-1"><Mountain className="h-3 w-3 text-orange-600" /> {trip.altitude || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] uppercase tracking-wider text-gray-400">Availability</span>
                          <span className="text-orange-600 mt-1 flex items-center gap-1"><User className="h-3 w-3 text-orange-600" /> {trip.availableSeats} Left</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing footer */}
                  <div className="px-6 pb-6 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-extrabold">From</p>
                      <p className="text-lg font-extrabold text-gray-900 mt-0.5">INR {trip.price}</p>
                    </div>
                    <span className="bg-orange-600 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full group-hover:bg-orange-500 transition-colors shadow-md">
                      Book Now
                    </span>
                  </div>

                </Link>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
