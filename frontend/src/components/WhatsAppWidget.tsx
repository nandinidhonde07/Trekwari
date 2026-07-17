'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function WhatsAppWidget() {
  const [phoneNumber, setPhoneNumber] = useState('9322340365');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    async function loadPhone() {
      try {
        const data = await api.settings.get();
        if (data && data.whatsapp) {
          // Strip non-numbers
          const cleaned = data.whatsapp.replace(/\D/g, '');
          setPhoneNumber(cleaned.length === 10 ? `91${cleaned}` : cleaned);
        }
      } catch (err) {
        console.error('WhatsApp widget settings load error:', err);
      }
    }
    loadPhone();

    // Trigger tooltip helper after 3 seconds
    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const waUrl = `https://wa.me/${phoneNumber}?text=Hello%20TreckWari!%20I%20am%20interested%20in%20inquiring%20about%20your%20upcoming%20adventure%20trekking%20expeditions.`;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center">
      {/* Dynamic Tooltip */}
      {showTooltip && (
        <div className="relative mr-3 bg-white text-gray-800 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-right-3 duration-300">
          Trek Inquiry? Chat with us!
          <button 
            onClick={() => setShowTooltip(false)} 
            className="absolute -top-1.5 -right-1.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full h-4 w-4 flex items-center justify-center text-[9px] font-bold"
          >
            ×
          </button>
          {/* Arrow */}
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-white" />
        </div>
      )}

      {/* Floating Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 relative group flex items-center justify-center hover:shadow-[0_0_20px_rgba(37,211,102,0.6)]"
        aria-label="Chat with TreckWari on WhatsApp"
        onClick={() => setShowTooltip(false)}
      >
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping group-hover:hidden" />
        
        {/* WhatsApp Icon */}
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 fill-white"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.884-6.97C16.338 2.012 13.9 1.01 12.01 1.01 6.58 1.01 2.156 5.378 2.153 10.81c-.001 1.696.452 3.35 1.309 4.808L2.47 19.957l4.177-1.101z" />
          <path d="M17.153 14.004c-.282-.142-1.669-.824-1.927-.919-.259-.096-.448-.142-.638.142-.19.283-.733.919-.899 1.108-.166.19-.332.213-.614.071-.282-.142-1.193-.44-2.271-1.402-.839-.748-1.405-1.671-1.57-1.954-.166-.283-.018-.435.124-.576.128-.127.283-.33.424-.495.142-.165.19-.283.284-.471.095-.189.047-.354-.024-.495-.071-.141-.638-1.533-.876-2.103-.231-.555-.467-.48-.638-.488-.166-.008-.356-.01-.546-.01s-.5.071-.762.354c-.262.283-1.002.979-1.002 2.385s1.025 2.76 1.168 2.949c.143.19 2.017 3.08 4.887 4.319.683.295 1.216.471 1.632.603.687.218 1.312.187 1.806.114.549-.081 1.669-.681 1.905-1.338.236-.658.236-1.223.166-1.338-.071-.115-.262-.213-.544-.355z" />
        </svg>
      </a>
    </div>
  );
}
