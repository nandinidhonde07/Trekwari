'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { 
  Calendar, Users, UserCheck, ShieldAlert, ArrowRight, 
  MapPin, Check, X, Search, ChevronRight, AlertCircle, Sparkles, BookOpen
} from 'lucide-react';

interface LeaderEvent {
  id: string;
  title: string;
  slug: string;
  startDate: string;
  location: string;
  availableSeats: number;
  maxSeats: number;
}

interface RosterMember {
  id: string;
  name: string;
  age: number;
  gender: string;
  attendanceStatus: string;
}

interface BookingRoster {
  id: string;
  bookingId: string;
  emergencyContact: string;
  medicalDetails: string | null;
  user: {
    name: string;
    email: string;
    bloodGroup: string | null;
    allergies: string | null;
    medicalNotes: string | null;
  };
  members: RosterMember[];
}

export default function LeaderDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  const [events, setEvents] = useState<LeaderEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [roster, setRoster] = useState<BookingRoster[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [qrCodeInput, setQrCodeInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Redirect if not staff/leader
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!loading && user) {
      const isLeader = 
        user.role === 'TREK_LEADER' || 
        user.role === 'VOLUNTEER' || 
        user.role === 'ADMIN' || 
        user.role === 'SUPER_ADMIN';
      if (!isLeader) {
        router.push('/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  // Live Camera Scanner Hook
  useEffect(() => {
    let scanner: any = null;
    if (isScanning) {
      // Dynamic import to prevent SSR bundling failures in Next.js
      const { Html5QrcodeScanner } = require('html5-qrcode');
      scanner = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        async (decodedText: string) => {
          setQrCodeInput(decodedText);
          setIsScanning(false);
          scanner.clear();
          try {
            const data = await api.bookings.verify(decodedText);
            if (data.verified && data.isValid) {
              setScanResult(data);
              if (selectedEventId) {
                const rosterData = await api.leader.getRoster(selectedEventId);
                setRoster(rosterData);
              }
            } else {
              setScanError(data.message || 'Verification failed. Invalid ticket.');
            }
          } catch (err: any) {
            setScanError(err.message || 'Error processing QR scan.');
          }
        },
        (error: any) => {
          // ignore scan matching errors (occurs continuously during camera frame checks)
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((e: any) => console.error('Scanner cleanup error:', e));
      }
    };
  }, [isScanning, selectedEventId]);

  // Load Leader Events
  useEffect(() => {
    async function fetchMyEvents() {
      if (!isAuthenticated) return;
      try {
        const data = await api.leader.getMyEvents();
        setEvents(data);
        if (data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load leader assignments:', err);
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchMyEvents();
  }, [isAuthenticated]);

  // Load Roster when Event changes
  useEffect(() => {
    async function fetchRoster() {
      if (!selectedEventId) return;
      setLoadingRoster(true);
      try {
        const data = await api.leader.getRoster(selectedEventId);
        setRoster(data);
      } catch (err) {
        console.error('Failed to load roster:', err);
      } finally {
        setLoadingRoster(false);
      }
    }
    fetchRoster();
  }, [selectedEventId]);

  const handleMarkAttendance = async (memberId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT';
    try {
      await api.leader.markAttendance(memberId, nextStatus);
      // Update local state roster list
      setRoster(prevRoster => 
        prevRoster.map(booking => ({
          ...booking,
          members: booking.members.map(m => 
            m.id === memberId ? { ...m, attendanceStatus: nextStatus } : m
          )
        }))
      );
    } catch (err) {
      console.error('Failed to update attendance:', err);
    }
  };

  const handleQRCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanError('');
    setScanResult(null);
    if (!qrCodeInput.trim()) return;

    try {
      const data = await api.bookings.verify(qrCodeInput);
      if (data.verified && data.isValid) {
        setScanResult(data);
        // Refresh roster list
        if (selectedEventId) {
          const rosterData = await api.leader.getRoster(selectedEventId);
          setRoster(rosterData);
        }
      } else {
        setScanError(data.message || 'Verification failed. Invalid ticket.');
      }
    } catch (err: any) {
      setScanError(err.message || 'Error executing QR scanner check.');
    }
  };

  if (loading || loadingEvents) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest-green" />
      </div>
    );
  }

  return (
    <main className="min-h-screen relative bg-gray-50">
      <Navbar />
      <WhatsAppWidget />

      <section className="pt-28 pb-12 bg-forest-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] uppercase font-bold text-sunrise-orange tracking-widest">Trek Leader Console</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display mt-1">Expedition Dispatch Control</h1>
        </div>
      </section>

      {/* Main Roster Panel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Events Selector Sidebar & QR Scan Input */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* assigned events */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs uppercase font-bold text-forest-green tracking-wider border-b border-gray-50 pb-2">Assigned Treks</h3>
              
              {events.length === 0 ? (
                <p className="text-xs text-gray-400">No treks assigned currently.</p>
              ) : (
                <div className="space-y-2">
                  {events.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEventId(e.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                        selectedEventId === e.id
                          ? 'border-forest-green bg-emerald-50/30'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-bold text-forest-green font-display">{e.title}</span>
                      <span className="text-gray-400 mt-1 flex items-center font-sans">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-sunrise-orange" />
                        {new Date(e.startDate).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* QR Scan Check-In Input */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-xs uppercase font-bold text-forest-green tracking-wider border-b border-gray-50 pb-2">Roster QR Check-In</h3>
              {scanError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-[11px] px-3.5 py-2.5 rounded-xl flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span>{scanError}</span>
                </div>
              )}
              {scanResult && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-3.5 rounded-xl space-y-1">
                  <p className="font-bold">✓ Ticket Verified!</p>
                  <p><strong>Name:</strong> {scanResult.leadName}</p>
                  <p><strong>Seats:</strong> {scanResult.seatCount} | Status: PAID</p>
                </div>
              )}

              {isScanning ? (
                <div className="space-y-2">
                  <div id="reader" className="w-full overflow-hidden rounded-xl border border-gray-250 bg-black"></div>
                  <button
                    type="button"
                    onClick={() => setIsScanning(false)}
                    className="w-full bg-red-650 hover:bg-red-700 text-white font-bold text-[10px] uppercase tracking-wider py-2 rounded-xl transition-colors"
                  >
                    Cancel Camera Scan
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setScanError('');
                      setScanResult(null);
                      setIsScanning(true);
                    }}
                    className="w-full bg-forest-green hover:bg-emerald-800 text-white font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-xl transition-colors flex justify-center items-center gap-1.5"
                  >
                    <Search className="h-4 w-4" /> Start Camera Scan
                  </button>

                  <form onSubmit={handleQRCheckIn} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Or enter booking reference..."
                      value={qrCodeInput}
                      onChange={(e) => setQrCodeInput(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-forest-green"
                    />
                    <button type="submit" className="bg-forest-green text-white p-2 rounded-xl">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>

          {/* Right: Participant Check-In List */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-forest-green font-display border-b border-gray-50 pb-3">Trekkers Roster</h3>

            {loadingRoster ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-forest-green" />
              </div>
            ) : roster.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-12">No paid participants registered for this trek yet.</p>
            ) : (
              <div className="space-y-6">
                {roster.map((booking) => (
                  <div key={booking.id} className="border border-gray-200/80 rounded-2xl p-5 space-y-4 hover:border-emerald-600/30 transition-colors">
                    {/* Hiker Booking Details Header */}
                    <div className="flex justify-between items-start gap-4 border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-forest-green font-display">{booking.user.name}</h4>
                        <p className="text-[10px] text-gray-400">ID: {booking.bookingId}  |  Emergency Contact: {booking.emergencyContact}</p>
                      </div>
                      {/* Emergency Badge */}
                      {(booking.user.bloodGroup || booking.user.allergies) && (
                        <div className="bg-red-50 text-red-700 text-[10px] font-bold px-3 py-1 rounded-lg border border-red-100">
                          Blood: {booking.user.bloodGroup || 'O+'} {booking.user.allergies ? `| Allergy: ${booking.user.allergies}` : ''}
                        </div>
                      )}
                    </div>

                    {/* Member checklist */}
                    <div className="space-y-2">
                      {booking.members.map((member) => (
                        <div 
                          key={member.id}
                          className="flex justify-between items-center bg-gray-50 border border-gray-100 px-4 py-2.5 rounded-xl"
                        >
                          <span className="text-xs font-semibold text-gray-700">{member.name} ({member.age}, {member.gender})</span>
                          
                          <button
                            onClick={() => handleMarkAttendance(member.id, member.attendanceStatus)}
                            className={`text-[10px] uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 focus:outline-none ${
                              member.attendanceStatus === 'PRESENT'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-gray-200 text-gray-500 hover:bg-emerald-50 hover:text-forest-green'
                            }`}
                          >
                            {member.attendanceStatus === 'PRESENT' ? <Check className="h-3 w-3" /> : null}
                            {member.attendanceStatus === 'PRESENT' ? 'Checked In' : 'Check In'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
