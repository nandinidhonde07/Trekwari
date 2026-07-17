'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Mountain, Calendar, ArrowUpRight, Camera } from 'lucide-react';
import { api } from '../lib/api';

interface TrekCardData {
  id: string;
  title: string;
  slug: string;
  image: string;
  location: string;
  difficulty: string;
  altitude: string;
  duration: string;
  summary: string;
  sequence: string;
}

export default function CompletedTreks() {
  const [completedTreks, setCompletedTreks] = useState<TrekCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompleted() {
      try {
        const data = await api.events.list({ status: 'COMPLETED' });
        // Format the database records for completed cards
        const formatted = data.map((trek: any, idx: number) => {
          let sequenceStr = `${idx + 1}th Expedition`;
          if (idx === 0) sequenceStr = '1st Expedition';
          if (idx === 1) sequenceStr = '2nd Expedition';
          if (idx === 2) sequenceStr = '3rd Expedition';

          // parse images array safely
          let image = '/images/homepage_banner.jpg';
          if (trek.images) {
            try {
              const parsed = typeof trek.images === 'string' ? JSON.parse(trek.images) : trek.images;
              if (Array.isArray(parsed) && parsed.length > 0) {
                image = parsed[0];
              }
            } catch (e) {
              if (Array.isArray(trek.images) && trek.images.length > 0) {
                image = trek.images[0];
              }
            }
          }

          return {
            id: trek.id,
            title: trek.title,
            slug: trek.slug,
            image,
            location: trek.location,
            difficulty: trek.difficulty,
            altitude: trek.altitude || '750m',
            duration: trek.duration,
            summary: trek.description,
            sequence: sequenceStr
          };
        });
        setCompletedTreks(formatted);
      } catch (err) {
        console.error('Failed to load completed treks:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompleted();
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-forest-green">Completed Milestones</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-green mt-2 font-display">
            Our Historic Expeditions
          </h2>
          <p className="text-gray-600 mt-4 leading-relaxed font-sans">
            TreckWari is proud to have successfully guided over 200+ nature enthusiasts across some of Maharashtra's most challenging and beautiful terrains.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-forest-green" />
          </div>
        ) : completedTreks.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No completed expeditions recorded in the database yet.</p>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {completedTreks.map((trek, idx) => (
              <motion.div
                key={trek.slug}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                whileHover={{ y: -8 }}
                className="bg-gray-50 rounded-3xl overflow-hidden shadow-[0_10px_35px_rgba(20,83,45,0.04)] border border-gray-100 flex flex-col sm:flex-row h-full group"
              >
                {/* Image Section */}
                <div className="relative w-full sm:w-1/2 h-64 sm:h-auto min-h-[260px] overflow-hidden">
                  <img
                    src={trek.image}
                    alt={trek.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                  
                  {/* Badge Sequence */}
                  <span className="absolute top-4 left-4 bg-forest-green text-white text-[10px] uppercase font-bold tracking-widest px-3.5 py-1.5 rounded-full shadow-md">
                    {trek.sequence}
                  </span>
                  
                  {/* Status stamp */}
                  <span className="absolute bottom-4 left-4 flex items-center bg-white/95 text-forest-green text-xs font-bold px-3 py-1 rounded-lg shadow-sm border border-emerald-100">
                    <ShieldCheck className="h-4 w-4 mr-1.5 fill-forest-green/10" />
                    Successfully Completed
                  </span>
                </div>

                {/* Content Section */}
                <div className="w-full sm:w-1/2 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-forest-green group-hover:text-emerald-800 transition-colors font-display">
                      {trek.title}
                    </h3>
                    <p className="text-xs font-semibold text-sunrise-orange tracking-wider mt-1">{trek.location}</p>
                    
                    {/* Summary */}
                    <p className="text-sm text-gray-600 mt-4 leading-relaxed line-clamp-3 sm:line-clamp-4">
                      {trek.summary}
                    </p>

                    {/* Trek Details Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-6 border-t border-b border-gray-200/50 py-3 text-center">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Difficulty</p>
                        <p className="text-xs font-bold text-forest-green mt-0.5">{trek.difficulty}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Altitude</p>
                        <p className="text-xs font-bold text-forest-green mt-0.5">
                          <Mountain className="inline h-3.5 w-3.5 mr-0.5 text-sunrise-orange" />
                          {trek.altitude}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Duration</p>
                        <p className="text-xs font-bold text-forest-green mt-0.5">
                          <Calendar className="inline h-3.5 w-3.5 mr-0.5 text-sunrise-orange" />
                          {trek.duration}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex gap-4 pt-6 mt-4 border-t border-gray-100">
                    <Link
                      href={`/treks/${trek.slug}`}
                      className="flex-1 text-center bg-forest-green text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl hover:bg-emerald-800 transition-colors flex items-center justify-center gap-1.5"
                    >
                      View Details
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/gallery"
                      className="border border-gray-300 hover:bg-gray-100 p-2.5 rounded-xl transition-colors flex items-center justify-center"
                      title="View Expedition Gallery"
                    >
                      <Camera className="h-4 w-4 text-forest-green" />
                    </Link>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
