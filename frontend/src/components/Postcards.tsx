'use client';

import React from 'react';
import { Instagram } from 'lucide-react';

export default function Postcards() {
  const images = [
    'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=800', // Hiker on ridge
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800', // Green hills
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=800', // Misty hills
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800', // Sunrise clouds
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800', // Forest peak
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?q=80&w=800', // River valley
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800', // Forest path
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800'  // Sunbeams trees
  ];

  return (
    <section className="py-24 bg-white font-sans border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-orange-600">
              <Instagram className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.2em] font-extrabold block">
                @TREKWARI
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight font-display">
              Postcards from the trail.
            </h2>
          </div>
          <a
            href="https://www.instagram.com/trekwari"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-orange-600 hover:text-orange-500 font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
          >
            <span>Follow on Instagram</span>
            <span>&rarr;</span>
          </a>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div 
              key={idx}
              className="relative aspect-square overflow-hidden rounded-3xl group border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300"
            >
              <img 
                src={img} 
                alt="Instagram Hiker Memory" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Instagram className="h-8 w-8 text-white stroke-[1.5]" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
