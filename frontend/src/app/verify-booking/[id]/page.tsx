'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import Logo from '../../../components/Logo';
import { CheckCircle, XCircle, Calendar, Users, ShieldAlert, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface RosterMember {
  name: string;
  age: number;
  gender: string;
  attendanceStatus: string;
}

interface VerificationResult {
  verified: boolean;
  isValid?: boolean;
  bookingId?: string;
  leadName?: string;
  trekTitle?: string;
  startDate?: string;
  seatCount?: number;
  paymentStatus?: string;
  eventStatus?: string;
  members?: RosterMember[];
  message?: string;
}

export default function VerifyBookingPage() {
  const params = useParams();
  const { id } = params;

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function performVerification() {
      if (!id) return;
      try {
        const data = await api.bookings.verify(String(id));
        setResult(data);
      } catch (err) {
        console.error('Verification query failed:', err);
        setResult({ verified: false, message: 'Verification lookup failed due to network errors.' });
      } finally {
        setLoading(false);
      }
    }
    performVerification();
  }, [id]);

  return (
    <main className="min-h-screen w-full flex flex-col justify-center items-center bg-warm-white relative py-12 px-4">
      {/* Back to Home link */}
      <Link href="/" className="absolute top-6 left-6 text-gray-500 hover:text-primary-orange flex items-center text-xs font-bold uppercase tracking-widest transition-colors">
        <ChevronLeft className="h-4 w-4 mr-1 text-primary-orange" />
        Back to Home
      </Link>

      <div className="w-full max-w-lg">
        {/* Verification Card */}
        <div className="bg-white rounded-[24px] p-8 border border-gray-150 shadow-sm flex flex-col items-center space-y-6">
          
          <Logo className="mb-4" />

          {loading ? (
            <div className="flex flex-col items-center space-y-3 py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-orange" />
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Verifying Booking QR Code...</p>
            </div>
          ) : result && result.verified && result.isValid ? (
            /* SUCCESS VALID TICKET */
            <div className="w-full space-y-6 animate-in fade-in duration-300">
              
              {/* Validation Status Indicator */}
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center space-y-2">
                <CheckCircle className="h-10 w-10 text-emerald-650 mx-auto" />
                <h2 className="text-lg font-bold text-emerald-800 font-display uppercase tracking-wider">Valid Ticket</h2>
                <p className="text-xs text-emerald-700/80 font-semibold">Payment confirmed. Check-in approved.</p>
              </div>

              {/* Ticket metadata */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-150 space-y-3 text-xs text-gray-650 font-semibold">
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-450">Booking ID</span>
                  <span className="font-bold text-dark-charcoal">{result.bookingId}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-450">Trek Expedition</span>
                  <span className="font-bold text-dark-charcoal">{result.trekTitle}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-450">Lead Hiker</span>
                  <span className="font-bold text-dark-charcoal">{result.leadName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-450">Date of Departure</span>
                  <span className="font-bold text-dark-charcoal flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-primary-orange" />
                    {result.startDate}
                  </span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-450">Total Seats</span>
                  <span className="font-bold text-dark-charcoal flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1 text-primary-orange" />
                    {result.seatCount} Seat{result.seatCount && result.seatCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Members check-in roster */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-dark-charcoal font-display uppercase tracking-wider">Passenger Roster</h4>
                <div className="space-y-2">
                  {result.members?.map((member, i) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 border border-gray-150 px-4 py-2.5 rounded-xl text-xs">
                      <span className="font-semibold text-gray-700">{member.name} ({member.age}, {member.gender})</span>
                      {member.attendanceStatus === 'PRESENT' ? (
                        <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded font-extrabold text-[10px] uppercase">Checked In</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded font-extrabold text-[10px] uppercase">Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* INVALID TICKET */
            <div className="w-full space-y-6 text-center py-6 animate-in fade-in duration-300">
              <div className="bg-red-50 border border-red-150 p-6 rounded-2xl space-y-2">
                <XCircle className="h-10 w-10 text-red-650 mx-auto" />
                <h2 className="text-lg font-bold text-red-750 font-display uppercase tracking-wider">Invalid Ticket</h2>
                <p className="text-xs text-red-650/80 font-semibold">
                  {result?.message || 'The QR code does not match any paid booking on our servers.'}
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl text-left text-xs text-amber-900 font-semibold leading-relaxed flex items-start gap-2.5">
                <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Please contact support. Unconfirmed transactions, cancelled seats, or certificates that have not been issued will display as invalid during scans.
                </span>
              </div>
            </div>
          )}

          {/* Direct CTA */}
          <div className="w-full border-t border-gray-150 pt-6 flex justify-center text-xs">
            <span className="text-gray-400 font-semibold uppercase tracking-widest text-[9px]">TrekWari Platform Verification</span>
          </div>

        </div>
      </div>
    </main>
  );
}
