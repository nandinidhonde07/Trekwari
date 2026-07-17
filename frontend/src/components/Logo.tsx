import React from 'react';

interface LogoProps {
  className?: string;
  light?: boolean;
}

export default function Logo({ className = '', light = false }: LogoProps) {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Mountain Icon Vector */}
      <svg
        className={`h-7 w-auto ${light ? 'fill-white stroke-white' : 'fill-forest-green stroke-forest-green'} transition-colors duration-300`}
        viewBox="0 0 100 45"
      >
        {/* Main large peak */}
        <polygon points="50,5 20,40 80,40" strokeWidth="2" strokeLinejoin="round" />
        {/* Smaller accent peak */}
        <polygon 
          points="35,15 10,40 60,40" 
          fill={light ? '#E5E7EB' : '#166534'} 
          stroke={light ? '#E5E7EB' : '#166534'} 
          strokeWidth="1" 
          strokeLinejoin="round" 
        />
        {/* Sunrise Orange circle (represents rising sun/summit energy) */}
        <circle cx="65" cy="18" r="5" fill="#F59E0B" />
        {/* Mountain ridge line */}
        <polyline 
          points="50,5 53,15 48,22 55,30 49,40" 
          fill="none" 
          stroke={light ? '#10B981' : '#F59E0B'} 
          strokeWidth="1.5" 
        />
      </svg>
      {/* Brand Name Text */}
      <span
        className={`text-xs font-extrabold tracking-[0.25em] font-display mt-0.5 ${
          light ? 'text-white' : 'text-forest-green'
        } transition-colors duration-300`}
      >
        TRECKWARI
      </span>
    </div>
  );
}
