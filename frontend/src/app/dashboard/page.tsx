'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { 
  User as UserIcon, Calendar, Compass, ShieldAlert, Award, FileText, 
  Settings as SettingsIcon, Bell, Star, Heart, CheckCircle2, ChevronRight, LogOut 
} from 'lucide-react';

interface BookingData {
  id: string;
  bookingId: string;
  totalAmount: number;
  seatCount: number;
  paymentStatus: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    slug: string;
    location: string;
    startDate: string;
    status: string;
  };
  certificate?: {
    id: string;
    pdfUrl: string;
  };
}

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, logout, refreshUser, updateUserLocal } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState('bookings'); // bookings, profile, notifications
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  // Profile Form States
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Load User details into Form
  useEffect(() => {
    if (user) {
      setName(user.name);
      setBloodGroup(user.bloodGroup || '');
      setAllergies(user.allergies || '');
      setMedicalNotes(user.medicalNotes || '');
    }
  }, [user]);

  // Load User Bookings
  useEffect(() => {
    async function loadBookings() {
      if (!isAuthenticated) return;
      try {
        const data = await api.bookings.myBookings();
        setBookings(data);
      } catch (err) {
        console.error('Failed to load user bookings:', err);
      } finally {
        setLoadingBookings(false);
      }
    }
    loadBookings();
  }, [isAuthenticated]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest-green" />
      </div>
    );
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    try {
      const data = await api.auth.updateProfile({
        name,
        bloodGroup,
        allergies,
        medicalNotes
      });
      setProfileSuccess(data.message);
      updateUserLocal({ name, bloodGroup, allergies, medicalNotes });
      refreshUser();
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    }
  };

  const getBadgeIcon = (level: string) => {
    switch (level) {
      case 'SUMMIT_LEGEND':
        return '🏔️';
      case 'GOLD_MOUNTAIN_WARRIOR':
        return '🥇';
      case 'SILVER_ADVENTURER':
        return '🥈';
      default:
        return '🥉';
    }
  };

  const getBadgeName = (level: string) => {
    return level.replace(/_/g, ' ');
  };

  return (
    <main className="min-h-screen relative bg-gray-50">
      <Navbar />
      <WhatsAppWidget />

      <section className="pt-28 pb-16 bg-forest-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-emerald-900 border border-emerald-800 p-4 rounded-3xl text-3xl">
              {getBadgeIcon(user.badgeLevel)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display">{user.name}</h1>
              <p className="text-xs text-sunrise-orange font-bold uppercase tracking-wider mt-0.5">
                Badge: {getBadgeName(user.badgeLevel)}
              </p>
            </div>
          </div>

          <div className="flex gap-6 text-center">
            <div className="bg-emerald-950/40 px-5 py-3 rounded-2xl border border-emerald-800">
              <p className="text-xl font-extrabold text-sunrise-orange">{user.rewardPoints}</p>
              <p className="text-[10px] text-emerald-200/60 uppercase font-bold tracking-wider mt-0.5">Reward Points</p>
            </div>
            <div className="bg-emerald-950/40 px-5 py-3 rounded-2xl border border-emerald-800">
              <p className="text-xl font-extrabold text-sunrise-orange">{bookings.length}</p>
              <p className="text-[10px] text-emerald-200/60 uppercase font-bold tracking-wider mt-0.5">Total Treks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Contents */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit space-y-2">
            <button
              onClick={() => setActiveSubTab('bookings')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-xs uppercase font-bold tracking-wider transition-colors ${
                activeSubTab === 'bookings' 
                  ? 'bg-forest-green text-white' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-forest-green'
              }`}
            >
              <span className="flex items-center gap-2">
                <Compass className="h-4 w-4" />
                My Bookings
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setActiveSubTab('profile')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-xs uppercase font-bold tracking-wider transition-colors ${
                activeSubTab === 'profile' 
                  ? 'bg-forest-green text-white' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-forest-green'
              }`}
            >
              <span className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Hiker Profile
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <hr className="border-gray-100 my-2" />

            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-left text-xs uppercase font-bold tracking-wider text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3">
            
            {/* Bookings Tab */}
            {activeSubTab === 'bookings' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-forest-green font-display border-b border-gray-50 pb-3">My Expeditions</h3>
                
                {loadingBookings ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-forest-green" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Compass className="h-8 w-8 text-sunrise-orange mx-auto mb-2" />
                    <p className="text-xs">You have not booked any adventure treks yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bookings.map((booking) => (
                      <div 
                        key={booking.id}
                        className="bg-gray-50 border border-gray-150 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-emerald-600/30 transition-colors"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-sunrise-orange bg-sunrise-orange/10 px-2 py-0.5 rounded">
                            {booking.event.status}
                          </span>
                          <h4 className="text-base font-bold text-forest-green font-display">{booking.event.title}</h4>
                          <p className="text-xs text-gray-400">
                            Date: {new Date(booking.event.startDate).toLocaleDateString()} | Booking ID: {booking.bookingId}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 w-full sm:w-auto">
                          <button
                            onClick={() => {
                              alert(`Downloading Ticket PDF for booking ID: ${booking.bookingId}`);
                            }}
                            className="bg-forest-green hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex-1 sm:flex-none flex items-center gap-1 justify-center"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Ticket
                          </button>

                          {/* Certificate download (if completed) */}
                          {booking.event.status === 'COMPLETED' ? (
                            <button
                              onClick={() => {
                                alert(`Downloading Participation Certificate PDF for trek: ${booking.event.title}`);
                              }}
                              className="bg-sunrise-orange hover:bg-yellow-500 text-forest-green text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex-1 sm:flex-none flex items-center gap-1 justify-center"
                            >
                              <Award className="h-3.5 w-3.5" />
                              Certificate
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeSubTab === 'profile' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-forest-green font-display border-b border-gray-50 pb-3">Emergency Hiker Details</h3>
                <p className="text-xs text-gray-400">Please populate these fields. This is utilized for rescue operations and medical preparedness during treks.</p>

                {profileSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
                    {profileSuccess}
                  </div>
                )}
                {profileError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-xl">
                    {profileError}
                  </div>
                )}

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Name field */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Display Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-forest-green"
                    />
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  {/* Drug Allergies */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Drug / Food Allergies</label>
                    <input
                      type="text"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="e.g. Dust, Peanuts, penicillin (or leave blank if none)"
                      className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Medical Conditions */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Important Medical Conditions</label>
                    <textarea
                      rows={3}
                      value={medicalNotes}
                      onChange={(e) => setMedicalNotes(e.target.value)}
                      placeholder="e.g. Asthma, history of heart condition, knee surgeries..."
                      className="w-full border border-gray-250 rounded-xl p-3 text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-forest-green hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl transition-all shadow-md"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
