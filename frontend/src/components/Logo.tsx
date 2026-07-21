import React from 'react';

interface LogoProps {
  className?: string;
  light?: boolean;
  companyName?: string;
}

export default function Logo({ className = '', light = false, companyName = 'TrekWari' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Circle Icon with Mountain */}
      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${light ? 'bg-white' : 'bg-orange-600'} transition-all shadow-sm`}>
        <svg
          className={`h-4.5 w-4.5 ${light ? 'text-orange-600' : 'text-white'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
        </svg>
      </div>
      {/* Brand Name Text */}
      <span
        className={`text-lg font-bold tracking-tight ${
          light ? 'text-white' : 'text-gray-900'
        } transition-colors duration-300`}
      >
        {companyName}
      </span>
    </div>
  );
}
