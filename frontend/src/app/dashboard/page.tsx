'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { 
  User as UserIcon, Calendar, Compass, ShieldAlert, Award, FileText, 
  Settings as SettingsIcon, LogOut, Phone, Shield, Upload, Trash2, 
  MapPin, Heart, Activity, AlertCircle, CheckCircle2, ChevronRight, Laptop, Mail
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

interface SessionData {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export default function UserDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, logout, logoutAll, refreshUser, updateUserLocal, uploadAvatar } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState('bookings'); // bookings, profile, sessions
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Sessions States
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  
  // Profile Form States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [trekExperience, setTrekExperience] = useState('Beginner');
  const [fitnessLevel, setFitnessLevel] = useState('Average');

  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Profile Upload Avatar States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

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
      setPhone(user.phone || '');
      setBloodGroup(user.bloodGroup || '');
      setAllergies(user.allergies || '');
      setMedicalNotes(user.medicalNotes || '');
      setEmergencyContact(user.emergencyContact || '');
      setEmergencyPhone(user.emergencyPhone || '');
      setEmergencyRelationship(user.emergencyRelationship || '');
      if (user.dateOfBirth) {
        setDateOfBirth(new Date(user.dateOfBirth).toISOString().substring(0, 10));
      } else {
        setDateOfBirth('');
      }
      setGender(user.gender || '');
      setAddress(user.address || '');
      setTrekExperience(user.trekExperience || 'Beginner');
      setFitnessLevel(user.fitnessLevel || 'Average');
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

  // Load Sessions
  const loadSessionsList = async () => {
    setLoadingSessions(true);
    try {
      const data = await api.auth.getSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load user sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'sessions' && isAuthenticated) {
      loadSessionsList();
    }
  }, [activeSubTab, isAuthenticated]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600" />
      </div>
    );
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await api.auth.updateProfile({
        name,
        phone,
        bloodGroup,
        allergies,
        medicalNotes,
        emergencyContact,
        emergencyPhone,
        emergencyRelationship,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        gender,
        address,
        trekExperience,
        fitnessLevel
      });
      
      setProfileSuccess(res.message || 'Profile details updated successfully.');
      updateUserLocal({
        name,
        phone,
        bloodGroup,
        allergies,
        medicalNotes,
        emergencyContact,
        emergencyPhone,
        emergencyRelationship,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        gender,
        address,
        trekExperience,
        fitnessLevel
      });
      refreshUser();
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    }
  };

  // Cloudinary Avatar Upload triggers
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verify limit 5MB
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size must be smaller than 5MB.');
      return;
    }

    setPhotoError('');
    setIsUploadingPhoto(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await uploadAvatar(base64);
        setProfileSuccess('Profile picture updated successfully!');
        refreshUser();
      } catch (err: any) {
        setPhotoError(err.message || 'Failed to upload image to Cloudinary.');
      } finally {
        setIsUploadingPhoto(false);
      }
    };
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to log out of this device?')) return;
    try {
      await api.auth.revokeSession(sessionId);
      // Refresh list
      loadSessionsList();
    } catch (err) {
      console.error('Revoke session error:', err);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm('Are you sure you want to log out of all devices? This will close your current session as well.')) return;
    try {
      await logoutAll();
      router.push('/login');
    } catch (err) {
      console.error('Logout all devices error:', err);
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

  // Sort Bookings
  const activeBookings = bookings.filter(b => b.paymentStatus === 'PAID' && new Date(b.event.startDate) > new Date() && b.event.status !== 'CANCELLED');
  const completedBookings = bookings.filter(b => b.event.status === 'COMPLETED');

  return (
    <main className="min-h-screen relative bg-gray-50">
      <Navbar />
      <WhatsAppWidget />

      {/* Header */}
      <section className="pt-28 pb-16 bg-forest-green text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar section with hover upload */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-20 w-20 rounded-full border-2 border-orange-500 overflow-hidden bg-emerald-950 flex items-center justify-center font-bold text-white text-3xl">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Hiker profile photo" className="h-full w-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-white font-bold transition-all">
                <Upload className="h-4 w-4 text-orange-500 mb-0.5" />
                <span>Upload</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handlePhotoSelect} 
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display">{user.name}</h1>
                <span className="bg-orange-500 text-white font-extrabold text-[8px] uppercase px-2 py-0.5 rounded-full tracking-wider mt-1.5">
                  {getBadgeIcon(user.badgeLevel)} {getBadgeName(user.badgeLevel)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-emerald-100/70">
                <p className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-orange-500" /> {user.email}</p>
                {user.phone && <p className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-orange-500" /> {user.phone}</p>}
                
                {/* Email Verification status flag */}
                {user.emailVerified ? (
                  <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                    Email Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2.5 py-0.5 rounded-full border border-red-400/20">
                    Email Unverified
                  </span>
                )}
              </div>
              {photoError && <p className="text-[10px] text-red-300 mt-2">{photoError}</p>}
              {isUploadingPhoto && <p className="text-[10px] text-orange-400 mt-2 animate-pulse">Uploading profile picture...</p>}
            </div>
          </div>

          <div className="flex gap-6 text-center">
            <div className="bg-emerald-950/40 px-5 py-3 rounded-2xl border border-emerald-800">
              <p className="text-xl font-extrabold text-orange-500">{user.rewardPoints}</p>
              <p className="text-[10px] text-emerald-200/60 uppercase font-bold tracking-wider mt-0.5">Reward Points</p>
            </div>
            <div className="bg-emerald-950/40 px-5 py-3 rounded-2xl border border-emerald-800">
              <p className="text-xl font-extrabold text-orange-500">{bookings.length}</p>
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
                My Bookings & History
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
                Hiker Profile Settings
              </span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setActiveSubTab('sessions')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-xs uppercase font-bold tracking-wider transition-colors ${
                activeSubTab === 'sessions' 
                  ? 'bg-forest-green text-white' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-forest-green'
              }`}
            >
              <span className="flex items-center gap-2">
                <Laptop className="h-4 w-4" />
                Active Device Sessions
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
              <div className="space-y-6">
                
                {/* Active Bookings */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-bold text-forest-green font-display border-b border-gray-50 pb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-500" />
                    Upcoming Expeditions
                  </h3>
                  
                  {loadingBookings ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600" />
                    </div>
                  ) : activeBookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Compass className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-xs">You have no upcoming treks booked. Ready for a new adventure?</p>
                      <a href="/treks" className="mt-3 inline-block bg-orange-600 text-white text-[10px] uppercase font-bold tracking-wider px-5 py-2.5 rounded-full">Explore Treks</a>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeBookings.map((booking) => (
                        <div 
                          key={booking.id}
                          className="bg-gray-50 border border-gray-150 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-orange-500/30 transition-colors"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded">
                              {booking.event.status}
                            </span>
                            <h4 className="text-base font-bold text-forest-green font-display">{booking.event.title}</h4>
                            <p className="text-xs text-gray-400">
                              Date: {new Date(booking.event.startDate).toLocaleDateString()} | Booking ID: {booking.bookingId} | Seats: {booking.seatCount}
                            </p>
                          </div>
                          <button
                            onClick={() => alert(`Ticket PDF: ${booking.bookingId}`)}
                            className="bg-forest-green hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1 justify-center self-stretch sm:self-auto"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Download Ticket
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Trek History (Completed) */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-bold text-forest-green font-display border-b border-gray-50 pb-3 flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-500" />
                    Completed Summits (Trek History)
                  </h3>
                  
                  {loadingBookings ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600" />
                    </div>
                  ) : completedBookings.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Award className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <p className="text-xs">No completed summits recorded. Finish a trek to earn certificate!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedBookings.map((booking) => (
                        <div 
                          key={booking.id}
                          className="bg-gray-50 border border-gray-150 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded">
                              Summited
                            </span>
                            <h4 className="text-base font-bold text-forest-green font-display">{booking.event.title}</h4>
                            <p className="text-xs text-gray-400">
                              Completed: {new Date(booking.event.startDate).toLocaleDateString()} | Booking ID: {booking.bookingId}
                            </p>
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto">
                            {booking.certificate?.pdfUrl ? (
                              <a
                                href={booking.certificate.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 justify-center flex-1 sm:flex-none"
                              >
                                <Award className="h-3.5 w-3.5" />
                                Certificate
                              </a>
                            ) : (
                              <button
                                onClick={() => alert('Participation Certificate download initiated.')}
                                className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 justify-center flex-1 sm:flex-none"
                              >
                                <Award className="h-3.5 w-3.5" />
                                Certificate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeSubTab === 'profile' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-forest-green font-display border-b border-gray-50 pb-3 flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-orange-500" />
                    Hiker Details & Emergency Medicals
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Please populate these fields. This is utilized for medical preparedness, rescue operations, and custom certificate logs.</p>
                </div>

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
                  {/* General Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Display Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number (E.164)</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 9322340365"
                        className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Medical Details */}
                  <div className="border-t border-gray-50 pt-5">
                    <h4 className="text-xs font-extrabold text-orange-500 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Heart className="h-4 w-4" /> Medical Diagnostics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Drug / Food Allergies</label>
                        <input
                          type="text"
                          value={allergies}
                          onChange={(e) => setAllergies(e.target.value)}
                          placeholder="e.g. Dust, Penicillin, Peanuts (leave blank if none)"
                          className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Important Medical Conditions / Chronic Illness</label>
                        <textarea
                          rows={2}
                          value={medicalNotes}
                          onChange={(e) => setMedicalNotes(e.target.value)}
                          placeholder="e.g. Asthma, High Blood Pressure, Cardiac history, Knee surgeries (or leave blank)"
                          className="w-full border border-gray-250 rounded-xl p-3 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="border-t border-gray-50 pt-5">
                    <h4 className="text-xs font-extrabold text-orange-500 uppercase tracking-wider mb-4 flex items-center gap-1.5"><Shield className="h-4 w-4" /> Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Name</label>
                        <input
                          type="text"
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="e.g. Sunita Shinde"
                          className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Mobile</label>
                        <input
                          type="text"
                          value={emergencyPhone}
                          onChange={(e) => setEmergencyPhone(e.target.value)}
                          placeholder="e.g. +91 9999988888"
                          className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Relationship</label>
                        <input
                          type="text"
                          value={emergencyRelationship}
                          onChange={(e) => setEmergencyRelationship(e.target.value)}
                          placeholder="e.g. Mother / Father"
                          className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Experience & Address */}
                  <div className="border-t border-gray-50 pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trek Experience Level</label>
                        <select
                          value={trekExperience}
                          onChange={(e) => setTrekExperience(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                        >
                          <option value="Beginner">Beginner (0-2 treks completed)</option>
                          <option value="Intermediate">Intermediate (3-8 treks completed)</option>
                          <option value="Advanced">Advanced (8+ treks completed)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Fitness Level</label>
                        <select
                          value={fitnessLevel}
                          onChange={(e) => setFitnessLevel(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                        >
                          <option value="Poor">Poor (Cannot walk continuously for 30 mins)</option>
                          <option value="Average">Average (Reasonable, walks regularly)</option>
                          <option value="Good">Good (Exercises/jogs 3 times a week)</option>
                          <option value="Excellent">Excellent (Marathoner, highly active)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Residential Address (Optional)</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House no., Street, Area, City, Pin Code"
                        className="w-full border border-gray-250 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-8 rounded-xl transition-all shadow-md"
                  >
                    Save Hiker Profile
                  </button>
                </form>
              </div>
            )}

            {/* Sessions Tab */}
            {activeSubTab === 'sessions' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-50 pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-forest-green font-display flex items-center gap-2">
                      <Laptop className="h-5 w-5 text-orange-500" />
                      Active Device Sessions
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Review active browser logins. You can revoke older sessions on lost devices to maintain account integrity.</p>
                  </div>
                  
                  <button
                    onClick={handleLogoutAllDevices}
                    className="text-[10px] font-bold text-red-600 border border-red-200 hover:bg-red-50 uppercase tracking-wider px-4 py-2 rounded-xl"
                  >
                    Revoke All Sessions
                  </button>
                </div>

                {loadingSessions ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((s) => (
                      <div 
                        key={s.id}
                        className={`p-4 border rounded-2xl flex items-center justify-between gap-4 transition-colors ${
                          s.isCurrent ? 'bg-orange-50/20 border-orange-100' : 'bg-gray-50 border-gray-150'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl ${s.isCurrent ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                            <Laptop className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-forest-green max-w-[200px] sm:max-w-md truncate">{s.deviceInfo}</p>
                              {s.isCurrent && (
                                <span className="bg-orange-500 text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              IP Address: {s.ipAddress} | Logged In: {new Date(s.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {!s.isCurrent && (
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Revoke session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
