'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { 
  User as UserIcon, Calendar, Compass, Award, 
  Settings as SettingsIcon, LogOut, Phone, Shield, Upload, 
  MapPin, AlertCircle, CheckCircle2, ChevronRight, Laptop, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/ui/empty-state';
import { useToast } from '../../components/ui/toast';

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
  const { toast } = useToast();
  
  const [activeSubTab, setActiveSubTab] = useState('bookings');
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
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-orange" />
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-400">Loading Dashboard...</span>
        </div>
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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        setPhotoError(err.message || 'Failed to upload image.');
      } finally {
        setIsUploadingPhoto(false);
      }
    };
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to log out of this device?')) return;
    try {
      await api.auth.revokeSession(sessionId);
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
    return level.split('_').join(' ');
  };

  const activeBookings = bookings.filter(function(b) {
    return b.paymentStatus === 'PAID' && new Date(b.event.startDate) > new Date() && b.event.status !== 'CANCELLED';
  });
  const completedBookings = bookings.filter(function(b) {
    return b.event.status === 'COMPLETED';
  });

  return (
    <div className="min-h-screen relative bg-white font-sans">
      <Navbar />
      <WhatsAppWidget />

      {/* Header Profile Dashboard */}
      <section className="pt-32 pb-16 bg-white text-dark-charcoal border-b border-gray-150 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            
            {/* Avatar block with upload trigger */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-20 w-20 rounded-full border-2 border-primary-orange overflow-hidden bg-gray-50 flex items-center justify-center font-bold text-dark-charcoal text-3xl shadow-sm">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
              <div className="absolute inset-0 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] uppercase tracking-wider text-white font-bold transition-all">
                <Upload className="h-4 w-4 text-primary-orange mb-1" />
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

            <div className="space-y-1.5">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-dark-charcoal">{user.name}</h1>
                <span className="bg-primary-orange text-white font-extrabold text-[8px] uppercase px-2.5 py-0.5 rounded-full tracking-widest mt-1.5 sm:mt-0 shadow-sm">
                  {getBadgeIcon(user.badgeLevel)} {getBadgeName(user.badgeLevel)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1.5 text-xs text-gray-500 font-semibold">
                <p className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-primary-orange" /> {user.email}</p>
                {user.phone && <p className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary-orange" /> {user.phone}</p>}
                
                {user.emailVerified ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary-orange bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                    Verified
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100">
                    Unverified
                  </span>
                )}
              </div>
              {photoError && <p className="text-[10px] text-red-500 font-semibold">{photoError}</p>}
              {isUploadingPhoto && <p className="text-[10px] text-primary-orange font-semibold animate-pulse">Uploading photo...</p>}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-gray-50 px-6 py-4 rounded-[20px] border border-gray-150 text-center shadow-sm">
              <p className="text-2xl font-black text-primary-orange font-display">{user.rewardPoints}</p>
              <p className="text-[8px] text-gray-400 uppercase font-extrabold tracking-widest mt-1">Reward Points</p>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-[20px] border border-gray-150 text-center shadow-sm">
              <p className="text-2xl font-black text-primary-orange font-display">{bookings.length}</p>
              <p className="text-[8px] text-gray-400 uppercase font-extrabold tracking-widest mt-1">Total Treks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Navigation Tabs (3 cols) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm h-fit space-y-1.5">
            {[
              { id: 'bookings', label: 'My Bookings & History', icon: <Compass className="h-4 w-4" /> },
              { id: 'profile', label: 'Hiker Profile Settings', icon: <SettingsIcon className="h-4 w-4" /> },
              { id: 'sessions', label: 'Active Device Sessions', icon: <Laptop className="h-4 w-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id);
                  setProfileSuccess('');
                  setProfileError('');
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-dark-charcoal'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {tab.icon}
                  {tab.label}
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </button>
            ))}

            <hr className="border-gray-100 my-4" />

            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Right Content Tab Container (9 cols) */}
          <div className="lg:col-span-9">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSubTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                
                {/* 1. Bookings & History Tab */}
                {activeSubTab === 'bookings' && (
                  <div className="space-y-12">
                    
                    {/* Active bookings */}
                    <div className="space-y-5">
                      <h3 className="text-lg font-bold text-dark-charcoal font-display">Active Bookings</h3>
                      {loadingBookings ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2].map((n) => <Skeleton key={n} className="h-32 rounded-[20px]" />)}
                        </div>
                      ) : activeBookings.length === 0 ? (
                        <EmptyState 
                          title="No Active Bookings"
                          description="You don't have any upcoming departures booked. Browse our open registrations and catch the next summit run!"
                          actionLabel="Browse Treks"
                          onAction={() => router.push('/treks')}
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {activeBookings.map((b) => (
                            <div key={b.id} className="bg-white p-6 rounded-[20px] border border-gray-150 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-primary-orange/20 transition-all duration-300">
                              <div className="space-y-3.5">
                                <div className="flex justify-between items-start">
                                  <span className="text-[8px] uppercase tracking-widest font-extrabold text-primary-orange bg-orange-50 px-2.5 py-1 rounded-[8px]">
                                    {b.bookingId}
                                  </span>
                                  <span className="text-[8px] uppercase tracking-widest font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-[8px]">
                                    Paid
                                  </span>
                                </div>
                                <h4 className="text-base font-bold text-dark-charcoal font-display leading-tight">{b.event.title}</h4>
                                <div className="space-y-1.5 text-xs text-gray-500 font-semibold">
                                  <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary-orange" /> {b.event.location}</p>
                                  <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-primary-orange" /> {new Date(b.event.startDate).toLocaleDateString()}</p>
                                  <p className="flex items-center gap-1.5"><UserIcon className="h-4 w-4 text-primary-orange" /> {b.seatCount} Seat{b.seatCount > 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <div className="pt-4 border-t border-gray-50 mt-4 flex items-center justify-between">
                                <Link 
                                  href={`/treks/${b.event.slug}`}
                                  className="text-xs font-bold text-primary-orange hover:underline uppercase tracking-wider"
                                >
                                  View Details
                                </Link>
                                <button 
                                  onClick={() => toast(`Downloading Ticket PDF for ID: ${b.bookingId}...`, 'success')}
                                  className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
                                >
                                  Ticket PDF
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* History */}
                    <div className="space-y-5">
                      <h3 className="text-lg font-bold text-dark-charcoal font-display">Trek History & Certificates</h3>
                      {loadingBookings ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2].map((n) => <Skeleton key={n} className="h-32 rounded-[20px]" />)}
                        </div>
                      ) : completedBookings.length === 0 ? (
                        <p className="text-xs text-gray-400 bg-gray-50 p-6 rounded-[20px] text-center font-semibold">No completed treks recorded in your profile yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {completedBookings.map((b) => (
                            <div key={b.id} className="bg-gray-50 p-6 rounded-[20px] border border-gray-100 flex flex-col justify-between shadow-sm">
                              <div className="space-y-3">
                                <span className="text-[8px] uppercase tracking-widest font-extrabold text-gray-400 bg-white border border-gray-200 px-2.5 py-1 rounded-[8px]">
                                  {b.bookingId}
                                </span>
                                <h4 className="text-base font-bold text-dark-charcoal font-display leading-tight">{b.event.title}</h4>
                                <div className="space-y-1 text-xs text-gray-500 font-semibold">
                                  <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-gray-400" /> Completed: {new Date(b.event.startDate).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="pt-4 border-t border-gray-150/60 mt-4 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                  <Award className="h-4 w-4 text-primary-orange" /> Certificate Issued
                                </span>
                                <button 
                                  onClick={() => toast(`Downloading certificate for event: ${b.event.title}...`, 'success')}
                                  className="bg-dark-charcoal text-white hover:bg-black font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-colors cursor-pointer"
                                >
                                  Download PDF
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* 2. Profile Settings Tab */}
                {activeSubTab === 'profile' && (
                  <form onSubmit={handleProfileUpdate} className="space-y-6 bg-white border border-gray-150 p-8 rounded-[20px] shadow-sm">
                    <h3 className="text-lg font-bold text-dark-charcoal font-display border-b border-gray-50 pb-3">Hiker Profile Details</h3>
                    
                    {profileSuccess && (
                      <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs px-4 py-3 rounded-xl font-bold">
                        ✔ {profileSuccess}
                      </div>
                    )}
                    {profileError && (
                      <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl">
                        {profileError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Phone Number</label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                      <div>
                        <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Date of Birth</label>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Trek Experience</label>
                        <select
                          value={trekExperience}
                          onChange={(e) => setTrekExperience(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                        >
                          <option value="Beginner">Beginner Explorer</option>
                          <option value="Intermediate">Intermediate Climber</option>
                          <option value="Advanced">Advanced Summit Hiker</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Fitness Level</label>
                        <select
                          value={fitnessLevel}
                          onChange={(e) => setFitnessLevel(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                        >
                          <option value="Poor">Poor Stamina</option>
                          <option value="Average">Average Walking</option>
                          <option value="Good">Good Athletics</option>
                          <option value="Excellent">Excellent Mountain Endurance</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-5 bg-gray-50 rounded-[20px] border border-gray-100 space-y-4 pt-4">
                      <p className="text-xs font-extrabold text-primary-orange uppercase tracking-wider">Mandatory SOS Contacts</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-[9px] font-extrabold text-gray-450 uppercase tracking-widest mb-1.5">Emergency Name</label>
                          <input
                            type="text"
                            value={emergencyContact}
                            onChange={(e) => setEmergencyContact(e.target.value)}
                            placeholder="Full Name"
                            className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-gray-455 uppercase tracking-widest mb-1.5">SOS Phone Number</label>
                          <input
                            type="tel"
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                            placeholder="Mobile number"
                            className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-extrabold text-gray-455 uppercase tracking-widest mb-1.5">Relationship</label>
                          <input
                            type="text"
                            value={emergencyRelationship}
                            onChange={(e) => setEmergencyRelationship(e.target.value)}
                            placeholder="e.g. Father, Spouse"
                            className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                      <div>
                        <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Blood Group</label>
                        <select
                          value={bloodGroup}
                          onChange={(e) => setBloodGroup(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                        >
                          <option value="">Choose Blood Group</option>
                          {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Allergies / Medical Flags</label>
                        <input
                          type="text"
                          value={allergies}
                          onChange={(e) => setAllergies(e.target.value)}
                          placeholder="e.g. Asthma, Penicillin, Dust allergy"
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Medical Notes & Warnings</label>
                      <textarea
                        rows={2}
                        value={medicalNotes}
                        onChange={(e) => setMedicalNotes(e.target.value)}
                        placeholder="Detail any critical health histories, surgeries, or notes..."
                        className="w-full border border-gray-250 rounded-xl p-4 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Address Details</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street address, City, Pincode"
                        className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-button shadow-md cursor-pointer transition-colors"
                      >
                        Save Profile Updates
                      </button>
                    </div>
                  </form>
                )}

                {/* 3. Active Device Sessions Tab */}
                {activeSubTab === 'sessions' && (
                  <div className="space-y-6 bg-white border border-gray-150 p-8 rounded-[20px] shadow-sm">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                      <div>
                        <h3 className="text-lg font-bold text-dark-charcoal font-display">Active Devices</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Revoke sessions to protect your security credentials.</p>
                      </div>
                      {sessions.length > 1 && (
                        <button
                          onClick={handleLogoutAllDevices}
                          className="bg-red-50 text-red-600 hover:bg-red-100 font-extrabold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl border border-red-200 transition-colors cursor-pointer"
                        >
                          Logout All Devices
                        </button>
                      )}
                    </div>

                    {loadingSessions ? (
                      <div className="space-y-3">
                        {[1, 2].map(n => <Skeleton key={n} className="h-20 rounded-xl" />)}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sessions.map((session) => (
                          <div key={session.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 shadow-sm">
                                <Laptop className="h-5 w-5" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-dark-charcoal flex items-center gap-2">
                                  {session.deviceInfo}
                                  {session.isCurrent && (
                                    <span className="bg-orange-50 text-primary-orange text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border border-orange-100">
                                      Active now
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-gray-450 font-semibold">IP: {session.ipAddress} | Created: {new Date(session.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            {!session.isCurrent && (
                              <button
                                onClick={() => handleRevokeSession(session.id)}
                                className="text-xs font-bold text-red-600 hover:underline uppercase tracking-wider cursor-pointer"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
