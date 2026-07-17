'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import { Calendar, User, Mountain, Clock, IndianRupee, AlertCircle } from 'lucide-react';

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
  images: any; // Parsed array
}

// Live Countdown Timer Component
function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) {
    return <span className="text-red-500 font-bold text-xs uppercase tracking-wider">Registrations Closed</span>;
  }

  return (
    <div className="flex space-x-2 justify-center items-center py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-forest-green">
      <Clock className="h-3.5 w-3.5 animate-pulse text-sunrise-orange" />
      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Starts in:</span>
      <span className="text-xs font-extrabold font-display">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    </div>
  );
}

export default function UpcomingTrips() {
  const [trips, setTrips] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrips() {
      try {
        const data = await api.events.list({ status: 'OPEN_REGISTRATION' });
        // Take only upcoming events (filter in case of old seeds)
        const upcomingOnly = data.filter((e: any) => new Date(e.startDate) > new Date());
        setTrips(upcomingOnly);
      } catch (err) {
        console.error('Failed to load upcoming events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTrips();
  }, []);

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-sunrise-orange">Adventure calls</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-green mt-2 font-display">
            Upcoming Trekking Expeditions
          </h2>
          <p className="text-gray-600 mt-4 leading-relaxed">
            Reserve your spot. Limited seating available. Secure payments via Razorpay and complete emergency coverage are standard.
          </p>
        </div>

        {/* Loading Spinner Fallback */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-forest-green" />
          </div>
        ) : trips.length === 0 ? (
          /* Empty State */
          <div className="max-w-md mx-auto text-center bg-white border border-gray-200 p-8 rounded-3xl shadow-sm">
            <AlertCircle className="h-10 w-10 text-sunrise-orange mx-auto mb-4" />
            <h3 className="text-lg font-bold text-forest-green font-display">No Active Bookings Open</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              We are currently planning our next Sahyadri expeditions. Follow our Instagram profile <strong>@trekwari</strong> to get notified first!
            </p>
          </div>
        ) : (
          /* Trips Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip) => {
              const seatsFilled = trip.maxSeats - trip.availableSeats;
              const isAlmostFull = trip.availableSeats > 0 && trip.availableSeats <= 8;
              const imgUrl = Array.isArray(trip.images) ? trip.images[0] : JSON.parse(trip.images || '[]')[0];

              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-[0_10px_35px_rgba(20,83,45,0.03)] border border-gray-100 flex flex-col justify-between group hover:shadow-[0_15px_40px_rgba(20,83,45,0.06)] transition-all duration-300"
                >
                  <div>
                    {/* Header Image */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={imgUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800'}
                        alt={trip.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

                      {/* Seats & Difficulty Badges */}
                      <span className="absolute top-4 left-4 bg-forest-green text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                        {trip.difficulty}
                      </span>

                      {/* Dynamic Seats status badge */}
                      {trip.availableSeats === 0 ? (
                        <span className="absolute top-4 right-4 bg-red-600 text-white text-[10px] uppercase font-extrabold tracking-wider px-3 py-1.5 rounded-lg">
                          Closed / Full
                        </span>
                      ) : isAlmostFull ? (
                        <span className="absolute top-4 right-4 bg-amber-600 text-white text-[10px] uppercase font-extrabold tracking-wider px-3 py-1.5 rounded-lg animate-pulse">
                          Almost Full ({trip.availableSeats} left!)
                        </span>
                      ) : (
                        <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] uppercase font-extrabold tracking-wider px-3 py-1.5 rounded-lg">
                          Seats Open
                        </span>
                      )}

                      {/* Pricing Tag */}
                      <div className="absolute bottom-4 left-4 flex items-center bg-white/95 text-forest-green text-sm font-extrabold px-3 py-1.5 rounded-xl shadow-md border border-emerald-100">
                        <IndianRupee className="h-3.5 w-3.5 mr-0.5 text-sunrise-orange" />
                        <span>{trip.price}</span>
                        <span className="text-[10px] font-semibold text-gray-400 ml-1">/ person</span>
                      </div>
                    </div>

                    {/* Content body */}
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-forest-green font-display hover:text-emerald-800 transition-colors line-clamp-1">
                        {trip.title}
                      </h3>
                      <p className="text-xs font-semibold text-sunrise-orange tracking-wider mt-1">{trip.location}</p>

                      {/* Details Strip */}
                      <div className="flex gap-4 mt-5 py-3 border-t border-b border-gray-100 text-xs text-gray-500 font-medium">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5 text-sunrise-orange" />
                          <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1.5 text-sunrise-orange" />
                          <span>{trip.duration}</span>
                        </div>
                        {trip.altitude && (
                          <div className="flex items-center">
                            <Mountain className="h-4 w-4 mr-1.5 text-sunrise-orange" />
                            <span>{trip.altitude}</span>
                          </div>
                        )}
                      </div>

                      {/* Live Timer */}
                      <div className="mt-5">
                        <Countdown targetDate={trip.startDate} />
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="p-6 pt-0">
                    <Link
                      href={`/treks/${trip.slug}`}
                      className="block w-full text-center bg-forest-green hover:bg-emerald-800 text-white font-bold uppercase tracking-wider py-3.5 rounded-2xl text-xs shadow-md transition-all duration-300 hover:shadow-lg"
                    >
                      Book Your Seat Now
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
