'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import WhatsAppWidget from '../../../components/WhatsAppWidget';
import { api } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { 
  Calendar, Clock, Mountain, MapPin, IndianRupee, 
  Sparkles, CheckCircle2, User, AlertCircle, Compass, 
  Wind, Umbrella, CheckSquare, Sunrise, Sunset, X, Star, ChevronRight,
  Flame, Flag, BookOpen, Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../../../components/ui/skeleton';
import { useToast } from '../../../components/ui/toast';

interface EventDetails {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  difficulty: string;
  altitude: string | null;
  duration: string;
  price: number;
  availableSeats: number;
  maxSeats: number;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  highlights: string[];
  itinerary: any[];
  thingsToCarry: string[];
  fitnessLevel: string;
  safetyMeasures: string[];
  pickupPoints: string[];
  images: string[];
  distance: number | null;
  elevationGain: number | null;
  meetingPoint: string | null;
  endPoint: string | null;
  googleMapsUrl: string | null;
  gpxRoute: string | null;
  trekGrade: string | null;
  suitableFor: string | null;
  minAge: number;
  leaders: Array<{ role: string; user: { name: string; avatarUrl: string } }>;
  reviews: Array<{ id: string; rating: number; comment: string; createdAt: string; user: { name: string; avatarUrl: string } }>;
  policy: any;
  faqs: Array<{ id: string; question: string; answer: string }>;
}

export default function TrekDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { slug } = params;
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  const [trek, setTrek] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({ 1: true });

  // Booking Flow States
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [seatCount, setSeatCount] = useState(1);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalDetails, setMedicalDetails] = useState('');
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [members, setMembers] = useState<Array<{ name: string; age: number; gender: string; phone?: string }>>([
    { name: '', age: 20, gender: 'Male', phone: '' }
  ]);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fitnessDeclared, setFitnessDeclared] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);
  const [instructionsAgreed, setInstructionsAgreed] = useState(false);
  const [guardianPermitted, setGuardianPermitted] = useState(false);
  const [policyActiveSubTab, setPolicyActiveSubTab] = useState<'waiver' | 'terms' | 'cancellation' | 'privacy'>('waiver');

  // Review Form States
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Live Weather States
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Load Trek Details
  useEffect(() => {
    async function fetchTrekDetails() {
      if (!slug) return;
      try {
        const data = await api.events.get(String(slug));
        setTrek(data);
        if (user) {
          setMembers([{ name: user.name, age: 20, gender: 'Male', phone: '' }]);
        }
      } catch (err) {
        console.error('Failed to load trek details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrekDetails();
  }, [slug, user]);

  useEffect(() => {
    async function fetchWeather() {
      if (!trek?.id) return;
      setLoadingWeather(true);
      try {
        const data = await api.weather.get({ eventId: trek.id, slug: trek.slug });
        setWeatherData(data);
      } catch (err) {
        console.error('Failed to load weather report:', err);
      } finally {
        setLoadingWeather(false);
      }
    }
    fetchWeather();
  }, [trek?.id, trek?.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-orange" />
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-400">Loading Trail...</span>
        </div>
      </div>
    );
  }

  if (!trek) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-md mx-auto pt-40 pb-20 text-center px-6">
          <AlertCircle className="h-12 w-12 text-primary-orange mx-auto mb-4" />
          <h2 className="text-xl font-bold text-dark-charcoal font-display">Trek Not Found</h2>
          <p className="text-xs text-gray-500 mt-2">The trek you are looking for does not exist or has been archived.</p>
          <Link href="/treks" className="inline-block mt-6 bg-primary-orange text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-full shadow-md">
            Explore All Treks
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  // Parse policy structures if available
  const policyCarryList = trek.policy ? JSON.parse(trek.policy.thingsToCarry || '[]') : null;
  const policyProhibitedList = trek.policy ? JSON.parse(trek.policy.thingsNotAllowed || '[]') : null;
  const policySafetyList = trek.policy ? JSON.parse(trek.policy.safetyGuidelines || '[]') : null;

  const handleSeatCountChange = (count: number) => {
    setSeatCount(count);
    const newMembers = [...members];
    if (count > newMembers.length) {
      for (let i = newMembers.length; i < count; i++) {
        newMembers.push({ name: '', age: 20, gender: 'Male', phone: '' });
      }
    } else {
      newMembers.length = count;
    }
    setMembers(newMembers);
  };

  const handleMemberChange = (index: number, field: string, value: any) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (checkoutStep === 1) {
      setCheckoutStep(2);
      return;
    }

    if (checkoutStep === 2) {
      const emptyMember = members.some(m => !m.name.trim());
      if (emptyMember) {
        setBookingError('Please fill out the names of all participants.');
        return;
      }
      const invalidAge = members.some(m => !m.age || m.age <= 0);
      if (invalidAge) {
        setBookingError('Please enter a valid age for all participants.');
        return;
      }
      const emptyPhone = members.some(m => !m.phone || !m.phone.trim());
      if (emptyPhone) {
        setBookingError('Please fill out the phone numbers of all participants.');
        return;
      }
      setCheckoutStep(3);
      return;
    }

    if (checkoutStep === 3) {
      if (!emergencyName.trim() || !emergencyRelationship.trim() || !emergencyContact.trim()) {
        setBookingError('All Emergency Contact details (Name, Phone, Relationship) are mandatory.');
        return;
      }
      if (!waiverAccepted || !termsAccepted || !fitnessDeclared || !riskAcknowledged || !instructionsAgreed) {
        setBookingError('You must read and agree to all terms and declarations to proceed.');
        return;
      }
      const hasUnder18 = members.some((m: any) => parseInt(m.age as any) < 18);
      if (hasUnder18 && !guardianPermitted) {
        setBookingError('You must confirm Parental/Guardian permission for participants under 18 years of age.');
        return;
      }

      setIsProcessingPayment(true);
      try {
        const data = await api.bookings.create({
          eventId: trek.id,
          seatCount,
          emergencyContact,
          emergencyName,
          emergencyRelationship,
          medicalDetails: medicalDetails || `Blood Group: ${bloodGroup}${allergies ? `. Allergies: ${allergies}` : ''}`,
          waiverAccepted: true,
          termsAccepted: true,
          fitnessDeclared: true,
          riskAcknowledged: true,
          instructionsAgreed: true,
          guardianPermitted: hasUnder18 ? true : null,
          members
        });

        const loadScript = () => {
          return new Promise((resolve) => {
            if ((window as any).Razorpay) {
              resolve(true);
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const loaded = await loadScript();
        if (!loaded) {
          throw new Error('Razorpay payment SDK failed to load.');
        }

        const isMockOrder = data.booking.razorpayOrderId.startsWith('order_mock_');
        
        if (isMockOrder) {
          setTimeout(async () => {
            try {
              const confirmData = await api.bookings.confirmPayment(
                data.booking.id, 
                `txn_mock_${Math.random().toString(36).substring(2, 9)}`,
                data.booking.razorpayOrderId,
                'sig_mock_validation'
              );
              setBookingSuccess(confirmData.booking);
              setCheckoutStep(4);
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            } catch (confirmErr: any) {
              setBookingError(confirmErr.message || 'Payment confirmation failed.');
            } finally {
              setIsProcessingPayment(false);
            }
          }, 1500);
        } else {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_yourtestkeyhere',
            amount: Math.round(data.booking.totalAmount * 100),
            currency: 'INR',
            name: 'TrekWari',
            description: `Expedition booking for ${trek.title}`,
            order_id: data.booking.razorpayOrderId,
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
              contact: emergencyContact
            },
            theme: {
              color: '#FF7A00'
            },
            handler: async function (response: any) {
              try {
                const confirmData = await api.bookings.confirmPayment(
                  data.booking.id,
                  response.razorpay_payment_id,
                  response.razorpay_order_id,
                  response.razorpay_signature
                );
                setBookingSuccess(confirmData.booking);
                setCheckoutStep(4);
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
              } catch (confirmErr: any) {
                setBookingError(confirmErr.message || 'Payment confirmation failed.');
              } finally {
                setIsProcessingPayment(false);
              }
            },
            modal: {
              ondismiss: function () {
                setIsProcessingPayment(false);
              }
            }
          };
          const rzp1 = new (window as any).Razorpay(options);
          rzp1.open();
        }
      } catch (err: any) {
        setBookingError(err.message || 'Failed to initialize booking.');
        setIsProcessingPayment(false);
      }
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess(false);

    try {
      await api.reviews.submit(trek.slug, {
        eventId: trek.id,
        rating: reviewRating,
        comment: reviewComment,
        images: []
      });
      setReviewSuccess(true);
      setReviewComment('');
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review.');
    }
  };

  // 5-Photo Grid configuration (fallbacks for empty image arrays)
  const displayImages = [
    trek.images[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000',
    trek.images[1] || 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=600',
    trek.images[2] || 'https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=600',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600',
    'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?q=80&w=600'
  ];

  return (
    <main className="min-h-screen relative bg-white font-sans">
      <Navbar />
      <WhatsAppWidget />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-32 pb-16">
        
        {/* Title and Rating Headers */}
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-orange-50 text-primary-orange text-[9px] uppercase font-extrabold tracking-widest px-3 py-1 rounded-[8px]">
              {trek.difficulty}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-dark-charcoal">
              <Star className="h-4 w-4 fill-primary-orange text-primary-orange" />
              <span>4.9 (24 Hiker reviews)</span>
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-dark-charcoal tracking-tight font-display">{trek.title}</h1>
          <p className="text-xs sm:text-sm text-gray-500 flex items-center font-medium">
            <MapPin className="h-4 w-4 mr-1 text-primary-orange flex-shrink-0" />
            {trek.location}
          </p>
        </div>

        {/* 1. Airbnb-Style 5-Photo Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-[20px] overflow-hidden aspect-video max-h-[460px] relative shadow-sm">
          {/* Main Large Left Box */}
          <div 
            onClick={() => setSelectedImageIndex(0)}
            className="md:col-span-2 md:row-span-2 relative cursor-pointer overflow-hidden group border border-white/5"
          >
            <img 
              src={displayImages[0]} 
              alt="Main trail capture" 
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all duration-300" />
          </div>
          {/* Right smaller boxes */}
          {displayImages.slice(1, 5).map((img, idx) => (
            <div 
              key={idx}
              onClick={() => setSelectedImageIndex(idx + 1)}
              className="relative cursor-pointer overflow-hidden group border border-white/5 hidden md:block"
            >
              <img 
                src={img} 
                alt="" 
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all duration-300" />
            </div>
          ))}
        </div>

        {/* 2. Airbnb Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          
          {/* Left Column (70%) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Overview Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-5"
            >
              <h3 className="text-xl sm:text-2xl font-extrabold text-dark-charcoal font-display">Trek Overview</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-semibold font-sans">{trek.description}</p>
              
              {/* Highlights */}
              <div className="space-y-3 pt-4">
                <h4 className="text-xs uppercase tracking-widest font-extrabold text-primary-orange">Highlights</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 font-semibold font-sans">
                  {trek.highlights.map((h, i) => (
                    <li key={i} className="flex items-start bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-primary-orange flex-shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.section>

            {/* Itinerary Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6 pt-8 border-t border-gray-100"
            >
              <h3 className="text-xl sm:text-2xl font-extrabold text-dark-charcoal font-display">Trek Timeline & Itinerary</h3>
              
              {(() => {
                const isMultiDay = Array.isArray(trek.itinerary) && 
                                   trek.itinerary.length > 0 && 
                                   (trek.itinerary[0]?.dayNumber !== undefined || trek.itinerary[0]?.activities !== undefined);

                const getIcon = (iconName: string) => {
                  switch (iconName) {
                    case 'Sunrise': return <Sunrise className="h-3.5 w-3.5 text-amber-500" />;
                    case 'Transport': return <Activity className="h-3.5 w-3.5 text-blue-500" />;
                    case 'Food & Meals': return <Flame className="h-3.5 w-3.5 text-orange-500" />;
                    case 'Camping': return <BookOpen className="h-3.5 w-3.5 text-teal-500" />;
                    case 'Trek Trail': return <Compass className="h-3.5 w-3.5 text-emerald-500" />;
                    case 'Flag summit': return <Flag className="h-3.5 w-3.5 text-red-500" />;
                    default: return <Compass className="h-3.5 w-3.5 text-emerald-500" />;
                  }
                };

                if (isMultiDay) {
                  return (
                    <div className="space-y-4">
                      {trek.itinerary.map((day: any) => {
                        const isExpanded = !!openDays[day.dayNumber];
                        return (
                          <div key={day.dayNumber} className="border border-gray-150 rounded-[20px] overflow-hidden bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() => setOpenDays(prev => ({ ...prev, [day.dayNumber]: !prev[day.dayNumber] }))}
                              className="w-full flex items-center justify-between p-5 bg-gray-50/50 hover:bg-gray-50 transition-all font-semibold font-sans text-left border-none outline-none cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <span className="bg-orange-50 text-primary-orange text-xs font-black px-2.5 py-1 rounded-lg">Day {day.dayNumber}</span>
                                <div>
                                  <h4 className="text-sm font-bold text-dark-charcoal">{day.dayTitle}</h4>
                                  {day.shortSummary && <p className="text-[10px] text-gray-400 font-bold mt-0.5">{day.shortSummary}</p>}
                                </div>
                              </div>
                              {isExpanded ? <ChevronRight className="h-4 w-4 text-gray-400 rotate-90 transition-transform duration-300" /> : <ChevronRight className="h-4 w-4 text-gray-400 transition-transform duration-300" />}
                            </button>
                            
                            {isExpanded && (
                              <div className="p-5 border-t border-gray-100 space-y-4 bg-white animate-in slide-in-from-top-1 duration-200">
                                
                                {/* Day Stats list */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 p-3.5 rounded-xl border border-gray-100 font-sans">
                                  {day.accommodation && (
                                    <div>
                                      <p className="text-[8px] font-extrabold text-gray-400">Accommodation</p>
                                      <p className="text-dark-charcoal text-xs font-bold mt-0.5">{day.accommodation}</p>
                                    </div>
                                  )}
                                  {day.distanceCovered !== undefined && (
                                    <div>
                                      <p className="text-[8px] font-extrabold text-gray-400">Distance</p>
                                      <p className="text-dark-charcoal text-xs font-bold mt-0.5">{day.distanceCovered} km</p>
                                    </div>
                                  )}
                                  {day.trekDuration && (
                                    <div>
                                      <p className="text-[8px] font-extrabold text-gray-400">Trek Time</p>
                                      <p className="text-dark-charcoal text-xs font-bold mt-0.5">{day.trekDuration}</p>
                                    </div>
                                  )}
                                  {day.elevationGain !== undefined && (
                                    <div>
                                      <p className="text-[8px] font-extrabold text-gray-400">Altitude Gain</p>
                                      <p className="text-dark-charcoal text-xs font-bold mt-0.5">+{day.elevationGain}m</p>
                                    </div>
                                  )}
                                </div>

                                {/* Timeline Events list */}
                                <div className="relative border-l border-gray-200 ml-4 pl-8 space-y-6 py-2">
                                  {day.activities?.map((act: any, idx: number) => (
                                    <div key={idx} className="relative font-sans">
                                      {/* Timeline Circle with Icon */}
                                      <div className="absolute left-[-47px] top-0 bg-white border-2 border-gray-150 h-8 w-8 rounded-full flex items-center justify-center shadow-sm">
                                        {getIcon(act.icon)}
                                      </div>
                                      <p className="text-[10px] font-extrabold text-primary-orange uppercase tracking-wider">{act.time}</p>
                                      <p className="text-sm text-dark-charcoal font-bold font-display mt-0.5">{act.title}</p>
                                      {act.description && <p className="text-xs text-gray-650 font-semibold font-sans mt-1 leading-relaxed">{act.description}</p>}
                                    </div>
                                  ))}
                                </div>

                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Fallback to old flat array format
                return (
                  <div className="relative border-l border-gray-200 ml-4 pl-8 space-y-8 py-2">
                    {trek.itinerary.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute left-[-37px] top-1 bg-white border-2 border-primary-orange h-4 w-4 rounded-full flex items-center justify-center shadow-sm" />
                        <p className="text-[10px] font-extrabold text-primary-orange font-sans uppercase tracking-widest">{step.time}</p>
                        <p className="text-sm text-dark-charcoal font-bold font-display mt-1">{step.activity}</p>
                      </div>
                    ))}
                    <div className="relative">
                      <div className="absolute left-[-37px] top-1 bg-white border-2 border-dark-charcoal h-4 w-4 rounded-full flex items-center justify-center shadow-sm" />
                      <p className="text-[10px] font-extrabold text-dark-charcoal font-sans uppercase tracking-widest">End of Trip</p>
                      <p className="text-sm text-gray-500 font-bold font-display mt-1">Participation Certificate Issued (PDF)</p>
                    </div>
                  </div>
                );
              })()}
            </motion.section>

            {/* Things to Carry Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4 pt-8 border-t border-gray-100"
            >
              <h3 className="text-xl sm:text-2xl font-extrabold text-dark-charcoal font-display">Things to Carry</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 font-semibold font-sans">
                {policyCarryList ? (
                  policyCarryList.map((t: any, i: number) => (
                    <div key={i} className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <CheckSquare className="h-4 w-4 mr-2.5 text-primary-orange flex-shrink-0" />
                      <span>{t.name} {t.isRequired ? '(Required)' : '(Optional)'}</span>
                    </div>
                  ))
                ) : (
                  trek.thingsToCarry.map((t, i) => (
                    <div key={i} className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <CheckSquare className="h-4 w-4 mr-2.5 text-primary-orange flex-shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.section>

            {/* Prohibited List */}
            {policyProhibitedList && policyProhibitedList.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-4 pt-8 border-t border-gray-100"
              >
                <h3 className="text-lg font-bold text-red-700 font-display">Prohibited Items</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-red-700 font-semibold font-sans">
                  {policyProhibitedList.map((t: string, i: number) => (
                    <div key={i} className="flex items-center p-3 bg-red-50/50 rounded-xl border border-red-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600 mr-2 flex-shrink-0" />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Live Weather Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-5 pt-8 border-t border-gray-100"
            >
              <h3 className="text-xl sm:text-2xl font-extrabold text-dark-charcoal font-display">Live Weather Forecast</h3>
              <p className="text-xs text-gray-500 font-semibold">Live coordinates-based weather report for <strong>{weatherData?.location || trek.location}</strong>.</p>
              
              {loadingWeather ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1,2,3].map(n => <Skeleton key={n} className="h-24 rounded-xl" />)}
                </div>
              ) : weatherData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider">Temperature</p>
                        <p className="text-2xl font-black text-dark-charcoal font-display">{weatherData.temp}</p>
                        <p className="text-[9px] text-gray-400">Feels Like: <strong className="text-gray-550">{weatherData.feelsLike}</strong></p>
                      </div>
                      {weatherData.icon && (
                        <img 
                          src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`} 
                          alt="" 
                          className="h-12 w-12 bg-white rounded-full shadow-sm"
                        />
                      )}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider">Atmosphere</p>
                        <p className="text-xs font-bold text-dark-charcoal capitalize mt-1">{weatherData.conditions}</p>
                        <p className="text-[9px] text-gray-400">Rain Prob: <strong className="text-primary-orange">{weatherData.rainProbability}</strong></p>
                      </div>
                      <Umbrella className="h-9 w-9 text-primary-orange bg-orange-50 p-2 rounded-full" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-wider">Wind Speed</p>
                        <p className="text-xs font-bold text-dark-charcoal mt-1">Wind: {weatherData.windSpeed}</p>
                        <p className="text-[9px] text-gray-400">Humidity: <strong className="text-gray-550">{weatherData.humidity}</strong></p>
                      </div>
                      <Wind className="h-9 w-9 text-primary-orange bg-orange-50 p-2 rounded-full" />
                    </div>
                  </div>

                  {weatherData.alerts && weatherData.alerts.length > 0 && (
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl space-y-1">
                      <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span>SAFETY BULLETIN</span>
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-red-700 font-semibold">
                        {weatherData.alerts.map((alert: string, idx: number) => (
                          <li key={idx}>{alert}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3 justify-center">
                      <Sunrise className="h-4 w-4 text-primary-orange" />
                      <div className="text-left">
                        <p className="text-[8px] uppercase tracking-wider text-gray-400 font-extrabold">Sunrise</p>
                        <p className="text-xs font-extrabold text-dark-charcoal">{weatherData.sunrise}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-center border-l border-gray-200">
                      <Sunset className="h-4 w-4 text-primary-orange" />
                      <div className="text-left">
                        <p className="text-[8px] uppercase tracking-wider text-gray-400 font-extrabold">Sunset</p>
                        <p className="text-xs font-extrabold text-dark-charcoal">{weatherData.sunset}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">Weather forecast details currently unavailable.</p>
              )}
            </motion.section>

            {/* Map & Coordinates */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4 pt-8 border-t border-gray-100"
            >
              <h3 className="text-xl sm:text-2xl font-extrabold text-dark-charcoal font-display">Trail Map</h3>
              <div className="h-64 sm:h-96 w-full rounded-2xl overflow-hidden border border-gray-150">
                <iframe 
                  src={trek.googleMapsUrl || `https://maps.google.com/maps?q=${encodeURIComponent(trek.location || '')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy"
                  title={trek.title}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-650 bg-gray-50 p-4 rounded-xl">
                <div>
                  <strong>Meeting Point:</strong> {trek.meetingPoint || 'Kopargaon Bus Stand'}
                </div>
                <div>
                  <strong>End Point:</strong> {trek.endPoint || 'Kopargaon Bus Stand'}
                </div>
              </div>
            </motion.section>

            {/* Roster Leaders */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4 pt-8 border-t border-gray-100"
            >
              <h3 className="text-xl sm:text-2xl font-extrabold text-dark-charcoal font-display">Trek Leadership</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trek.leaders.map((leader, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <img src={leader.user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-dark-charcoal font-display">{leader.user.name}</p>
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider font-extrabold mt-0.5">{leader.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Hiker Reviews Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8 pt-8 border-t border-gray-100"
            >
              <h3 className="text-xl sm:text-2xl font-extrabold text-dark-charcoal font-display">Hiker Reviews</h3>

              {/* Submit Review */}
              {isAuthenticated ? (
                <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-6 rounded-[20px] border border-gray-100 space-y-4">
                  <h4 className="text-xs uppercase tracking-widest font-extrabold text-dark-charcoal">Share Your Trek Experience</h4>
                  {reviewSuccess && (
                    <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs px-4 py-3 rounded-xl font-bold">
                      ✔ Review submitted! It will appear on the page once approved by our moderator team.
                    </div>
                  )}
                  {reviewError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-xl">
                      {reviewError}
                    </div>
                  )}
                  <div>
                    <label className="block text-[8px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">Stars Rating</label>
                    <select 
                      value={reviewRating}
                      onChange={(e) => setReviewRating(parseInt(e.target.value))}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-primary-orange"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                      <option value="3">⭐⭐⭐ (3 Stars)</option>
                      <option value="2">⭐⭐ (2 Stars)</option>
                      <option value="1">⭐ (1 Star)</option>
                    </select>
                  </div>
                  <div>
                    <textarea
                      rows={3}
                      required
                      placeholder="Share your memories, leaders coordination, food, safety, and trail recommendations..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl p-3 text-xs bg-white focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange"
                    />
                  </div>
                  <button type="submit" className="bg-primary-orange text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-button hover:bg-orange-600 transition-colors shadow-md cursor-pointer">
                    Submit Review
                  </button>
                </form>
              ) : (
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center text-xs text-gray-450 font-semibold">
                  You must be logged in to submit a trek review.
                </div>
              )}

              {/* Reviews Timeline */}
              <div className="space-y-6">
                {trek.reviews.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No approved reviews yet. Be the first to share your experience!</p>
                ) : (
                  trek.reviews.map((rev) => (
                    <div key={rev.id} className="border-b border-gray-50 pb-6 last:border-0 flex gap-4">
                      <img src={rev.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100'} alt="" className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-dark-charcoal font-display">{rev.user.name}</span>
                          <span className="text-amber-500 text-xs">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2 font-sans font-medium leading-relaxed">{rev.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.section>

          </div>

          {/* Right Column (30%) - Airbnb Sticky Booking Sidebar Card */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 self-start space-y-6">
              
              {/* Sticky Card */}
              <div className="bg-white rounded-[20px] border border-gray-150 p-6 shadow-lg shadow-black/[0.02] space-y-5">
                
                {/* Header Price & Star */}
                <div className="flex justify-between items-baseline border-b border-gray-50 pb-4">
                  <div>
                    <span className="text-2xl font-black text-dark-charcoal flex items-center font-display">
                      <IndianRupee className="h-5 w-5 text-primary-orange" />
                      {trek.price}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5 block">per participant</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-dark-charcoal">
                    <Star className="h-3.5 w-3.5 fill-primary-orange text-primary-orange" />
                    <span>4.9</span>
                  </span>
                </div>

                {/* Dates & Availability display */}
                <div className="space-y-4 text-xs font-semibold">
                  
                  {/* Dates */}
                  <div className="border border-gray-150 rounded-[14px] overflow-hidden grid grid-cols-2 divide-x divide-gray-150">
                    <div className="p-3 bg-gray-50/50">
                      <p className="text-[8px] uppercase tracking-wider text-gray-400 font-extrabold mb-0.5">Start Date</p>
                      <p className="text-dark-charcoal text-xs font-bold">{new Date(trek.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="p-3 bg-gray-50/50">
                      <p className="text-[8px] uppercase tracking-wider text-gray-400 font-extrabold mb-0.5">End Date</p>
                      <p className="text-dark-charcoal text-xs font-bold">{new Date(trek.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Seat availability progress meter */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <span>Seat Occupancy</span>
                      <span className="text-primary-orange">{trek.availableSeats} spots left</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-orange rounded-full transition-all duration-500" 
                        style={{ width: `${((trek.maxSeats - trek.availableSeats) / trek.maxSeats) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Stepper Participant Input */}
                  <div className="flex items-center justify-between bg-gray-50/80 p-3 rounded-[14px] border border-gray-100">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-extrabold">Participants</p>
                      <p className="text-dark-charcoal text-xs font-bold mt-0.5">{seatCount} Hiker{seatCount > 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-xl px-2 py-1 shadow-sm">
                      <button 
                        onClick={() => seatCount > 1 && handleSeatCountChange(seatCount - 1)}
                        className="text-xs font-black text-gray-400 hover:text-dark-charcoal px-2 cursor-pointer focus:outline-none"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-dark-charcoal min-w-[12px] text-center">{seatCount}</span>
                      <button 
                        onClick={() => seatCount < Math.min(10, trek.availableSeats) && handleSeatCountChange(seatCount + 1)}
                        className="text-xs font-black text-gray-400 hover:text-dark-charcoal px-2 cursor-pointer focus:outline-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Transparent Price breakdown */}
                  <div className="border-t border-gray-100 pt-4 space-y-2 text-xs font-semibold text-gray-500">
                    <div className="flex justify-between">
                      <span>INR {trek.price} × {seatCount} seats</span>
                      <span className="text-dark-charcoal font-bold">INR {trek.price * seatCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trek Leader & Safety Kit</span>
                      <span className="text-emerald-600 font-bold">Included</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-150 pt-2 text-sm font-bold text-dark-charcoal">
                      <span>Total Amount</span>
                      <span className="text-primary-orange flex items-center"><IndianRupee className="h-3.5 w-3.5" />{trek.price * seatCount}</span>
                    </div>
                  </div>

                </div>

                {/* Primary Orange Booking CTA */}
                {trek.status === 'OPEN_REGISTRATION' ? (
                  <button
                    onClick={() => setBookingDrawerOpen(true)}
                    className="w-full bg-primary-orange hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-widest py-4 rounded-button shadow-md shadow-orange-500/10 cursor-pointer text-center transition-all duration-300"
                  >
                    Reserve Now
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-400 text-xs font-bold uppercase tracking-widest py-4 rounded-button cursor-not-allowed text-center"
                  >
                    Completed
                  </button>
                )}

              </div>

              {/* Side Metadata details */}
              <div className="bg-gray-50 rounded-[20px] p-6 border border-gray-100 space-y-4">
                <h4 className="text-xs uppercase tracking-widest font-extrabold text-dark-charcoal mb-2">Expedition Metrics</h4>
                <ul className="space-y-3.5 text-xs font-semibold text-gray-600">
                  <li className="flex justify-between border-b border-gray-100 pb-2">
                    <span>Altitude</span>
                    <span className="text-dark-charcoal font-extrabold">{trek.altitude || '1646m'}</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-100 pb-2">
                    <span>Route Grade</span>
                    <span className="text-dark-charcoal font-extrabold">{trek.trekGrade || 'Moderate'}</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-100 pb-2">
                    <span>Trail Length</span>
                    <span className="text-dark-charcoal font-extrabold">{trek.distance ? `${trek.distance} km` : '10 km'}</span>
                  </li>
                  <li className="flex justify-between pb-1">
                    <span>Min Age Limit</span>
                    <span className="text-dark-charcoal font-extrabold">{trek.minAge} Years</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* 3. Booking Checkout Slide-Out Drawer Overlay */}
      <AnimatePresence>
        {bookingDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
            
            {/* Click backdrop to exit */}
            <div className="absolute inset-0 cursor-default" onClick={() => !isProcessingPayment && setBookingDrawerOpen(false)} />
            
            {/* Drawer Body Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between border-l border-gray-100 relative z-10 shadow-2xl"
            >
              
              {/* Header */}
              <div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                  <div>
                    {/* Animated Progress Meter */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-orange transition-all duration-300"
                          style={{ width: `${(checkoutStep / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] uppercase font-extrabold text-primary-orange tracking-widest">Step {checkoutStep} of 4</span>
                    </div>
                    <h3 className="text-lg font-bold text-dark-charcoal font-display">Checkout: {trek.title}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setBookingDrawerOpen(false);
                      setCheckoutStep(1);
                      setBookingError('');
                    }}
                    className="text-gray-400 hover:text-dark-charcoal p-1.5 rounded-full hover:bg-gray-50 cursor-pointer"
                    disabled={isProcessingPayment}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {bookingError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl mb-6 flex items-start gap-2 animate-pulse">
                    <AlertCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Checkout forms */}
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  
                  {/* Step 1: Select Seat Count */}
                  {checkoutStep === 1 && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      <p className="text-xs font-semibold text-gray-500">Review your ticket slots count for this departure:</p>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-dark-charcoal">Selected Seats count:</span>
                        <div className="flex items-center space-x-3 bg-white border border-gray-250 rounded-xl px-2.5 py-1.5 shadow-sm">
                          <button 
                            type="button"
                            onClick={() => seatCount > 1 && handleSeatCountChange(seatCount - 1)}
                            className="text-xs font-black text-gray-400 hover:text-dark-charcoal px-2 cursor-pointer focus:outline-none"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-dark-charcoal min-w-[12px] text-center">{seatCount}</span>
                          <button 
                            type="button"
                            onClick={() => seatCount < Math.min(10, trek.availableSeats) && handleSeatCountChange(seatCount + 1)}
                            className="text-xs font-black text-gray-400 hover:text-dark-charcoal px-2 cursor-pointer focus:outline-none"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100/60 flex justify-between text-xs font-bold text-dark-charcoal">
                        <span>Unit Rate:</span>
                        <span className="text-primary-orange font-extrabold">INR {trek.price}</span>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Member roster details */}
                  {checkoutStep === 2 && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      <p className="text-xs font-semibold text-gray-500">Provide the names and details of all hikers in your group:</p>
                      <div className="space-y-6 overflow-y-auto max-h-[50vh] pr-2 no-scrollbar">
                        {members.map((member, idx) => (
                          <div key={idx} className="p-5 bg-gray-50 rounded-[20px] border border-gray-100 space-y-4">
                            <p className="text-xs font-extrabold text-primary-orange uppercase tracking-wider">Hiker {idx + 1} {idx === 0 ? '(Primary Contact)' : ''}</p>
                            
                            <div className="space-y-3">
                              <input
                                type="text"
                                required
                                value={member.name}
                                onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                                placeholder="Full Name (as per ID)"
                                className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold"
                              />
                              <input
                                type="tel"
                                required
                                value={member.phone || ''}
                                onChange={(e) => handleMemberChange(idx, 'phone', e.target.value)}
                                placeholder="Active Mobile Number"
                                className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold"
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={member.age}
                                  onChange={(e) => handleMemberChange(idx, 'age', parseInt(e.target.value))}
                                  placeholder="Age"
                                  className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold"
                                />
                                <select
                                  value={member.gender}
                                  onChange={(e) => handleMemberChange(idx, 'gender', e.target.value)}
                                  className="w-full border border-gray-250 bg-white rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-orange focus:ring-1 focus:ring-primary-orange font-semibold"
                                >
                                  <option value="Male">Male</option>
                                  <option value="Female">Female</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Medical details & Emergency SOS Contact */}
                  {checkoutStep === 3 && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      
                      {/* Emergency Contact */}
                      <div className="p-5 bg-gray-50 rounded-[20px] border border-gray-100 space-y-4">
                        <p className="text-xs font-extrabold text-primary-orange uppercase tracking-wider">Mandatory SOS Contact</p>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            required
                            value={emergencyName}
                            onChange={(e) => setEmergencyName(e.target.value)}
                            placeholder="Contact Person Name"
                            className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                          />
                          <input
                            type="text"
                            required
                            value={emergencyRelationship}
                            onChange={(e) => setEmergencyRelationship(e.target.value)}
                            placeholder="Relationship"
                            className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                          />
                        </div>
                        <input
                          type="tel"
                          required
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="Emergency Mobile Phone"
                          className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                        />
                      </div>

                      {/* Optional Medical details */}
                      <div className="p-5 bg-gray-50 rounded-[20px] border border-gray-100 space-y-4">
                        <p className="text-xs font-extrabold text-primary-orange uppercase tracking-wider">Medical Disclosures (Optional)</p>
                        <div className="grid grid-cols-2 gap-4">
                          <select
                            value={bloodGroup}
                            onChange={(e) => setBloodGroup(e.target.value)}
                            className="w-full border border-gray-250 bg-white rounded-xl px-3 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                          >
                            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            placeholder="Allergies (e.g. Nuts)"
                            className="w-full border border-gray-250 bg-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={medicalDetails}
                          onChange={(e) => setMedicalDetails(e.target.value)}
                          placeholder="List any chronic medical conditions or notes..."
                          className="w-full border border-gray-250 bg-white rounded-xl p-4 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                        />
                      </div>

                      {/* Policies */}
                      <div className="border border-gray-150 rounded-[14px] overflow-hidden font-sans bg-white">
                        <div className="flex bg-gray-50 border-b border-gray-150 text-[9px] uppercase font-bold text-gray-400">
                          {['waiver', 'terms', 'cancellation', 'privacy'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setPolicyActiveSubTab(t as any)}
                              className={`flex-1 py-3 text-center border-r border-gray-150 last:border-0 cursor-pointer ${
                                policyActiveSubTab === t ? 'bg-white text-primary-orange font-extrabold border-b-2 border-b-primary-orange' : ''
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                        <div className="text-[10px] text-gray-500 bg-white p-4 h-24 overflow-y-auto leading-relaxed space-y-1.5 no-scrollbar">
                          {policyActiveSubTab === 'waiver' && (
                            <div>
                              <p className="font-bold text-dark-charcoal">{trek.policy?.letterTitle || 'Trek Liability Waiver'}</p>
                              <p className="mt-1">{trek.policy?.letterWaiver || 'I hereby assume all risks of injury, illness, or property loss during this expedition.'}</p>
                            </div>
                          )}
                          {policyActiveSubTab === 'terms' && (
                            <div>
                              <p className="font-bold text-dark-charcoal">Trek Rules & Conduct Terms</p>
                              <p className="mt-1">{trek.policy?.termsAndConditions || '1. Follow instructions of leaders. 2. No littering. 3. Zero drug tolerance.'}</p>
                            </div>
                          )}
                          {policyActiveSubTab === 'cancellation' && (
                            <div>
                              <p className="font-bold text-dark-charcoal">Cancellation Policy</p>
                              <p className="mt-1">{trek.policy?.cancellationRules ? JSON.parse(trek.policy.cancellationRules).join(', ') : 'Standard timelines apply.'}</p>
                            </div>
                          )}
                          {policyActiveSubTab === 'privacy' && (
                            <div>
                              <p className="font-bold text-dark-charcoal">Privacy & Audit Policy</p>
                              <p className="mt-1">{trek.policy?.privacyPolicy || 'We protect emergency details.'}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Declaration Checkboxes */}
                      <div className="space-y-2 pt-2 text-[10px] font-semibold text-gray-500 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <input 
                            type="checkbox"
                            required
                            id="fit-check"
                            checked={fitnessDeclared}
                            onChange={(e) => setFitnessDeclared(e.target.checked)}
                            className="mt-0.5 accent-primary-orange h-4 w-4 rounded cursor-pointer"
                          />
                          <label htmlFor="fit-check" className="select-none cursor-pointer">
                            I declare that I am physically fit for this trekking event.
                          </label>
                        </div>
                        <div className="flex items-start gap-2">
                          <input 
                            type="checkbox"
                            required
                            id="risk-check"
                            checked={riskAcknowledged}
                            onChange={(e) => setRiskAcknowledged(e.target.checked)}
                            className="mt-0.5 accent-primary-orange h-4 w-4 rounded cursor-pointer"
                          />
                          <label htmlFor="risk-check" className="select-none cursor-pointer">
                            I acknowledge the risks involved and participate at my own responsibility.
                          </label>
                        </div>
                        <div className="flex items-start gap-2">
                          <input 
                            type="checkbox"
                            required
                            id="instructions-check"
                            checked={instructionsAgreed}
                            onChange={(e) => setInstructionsAgreed(e.target.checked)}
                            className="mt-0.5 accent-primary-orange h-4 w-4 rounded cursor-pointer"
                          />
                          <label htmlFor="instructions-check" className="select-none cursor-pointer">
                            I agree to follow the leader directions and eco-friendly guidelines.
                          </label>
                        </div>

                        {members.some(m => m.age < 18) && (
                          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-900">
                            <input 
                              type="checkbox"
                              required
                              id="guardian-check"
                              checked={guardianPermitted}
                              onChange={(e) => setGuardianPermitted(e.target.checked)}
                              className="mt-0.5 accent-primary-orange h-4 w-4 rounded cursor-pointer"
                            />
                            <label htmlFor="guardian-check" className="select-none cursor-pointer font-bold">
                              I confirm parental/guardian permission is granted for minors in my roster.
                            </label>
                          </div>
                        )}

                        <div className="flex items-start gap-2 border-t border-gray-100 pt-3 text-xs font-bold text-dark-charcoal">
                          <input 
                            type="checkbox"
                            required
                            id="waiver-check"
                            checked={termsAccepted}
                            onChange={(e) => {
                              setTermsAccepted(e.target.checked);
                              setWaiverAccepted(e.target.checked);
                            }}
                            className="mt-0.5 accent-primary-orange h-4 w-4 rounded cursor-pointer"
                          />
                          <label htmlFor="waiver-check" className="select-none cursor-pointer leading-tight">
                            I accept the Wilderness Waiver, Rules, and Cancellation terms.
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Booking Success Ticket Download */}
                  {checkoutStep === 4 && bookingSuccess && (
                    <div className="space-y-6 text-center py-6 animate-in scale-in duration-300">
                      <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full w-fit mx-auto shadow-sm">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-dark-charcoal font-display">Expedition Reserved!</h4>
                        <p className="text-[10px] text-gray-400 font-extrabold uppercase mt-1">ID: {bookingSuccess.bookingId}</p>
                      </div>
                      
                      <div className="bg-emerald-55/5 p-5 rounded-[20px] text-left text-xs text-emerald-800 space-y-2 border border-emerald-100 font-semibold leading-relaxed">
                        <p>• A PDF ticket containing details and check-in QR codes is ready.</p>
                        <p>• Emergency trip contacts and packing lists are sent to your email.</p>
                        <p>• Your Trek Certificate will be unlocked after trail completion.</p>
                      </div>

                      <div className="space-y-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            toast(`Downloading Ticket PDF for booking: ${bookingSuccess.bookingId}.`, 'success');
                          }}
                          className="w-full bg-primary-orange hover:bg-orange-600 hover:scale-[1.02] active:scale-[0.98] text-white font-bold text-xs uppercase tracking-widest py-4 rounded-button shadow-md cursor-pointer transition-all"
                        >
                          Download Ticket PDF
                        </button>
                        <Link
                          href="/dashboard"
                          className="block bg-gray-150 text-dark-charcoal font-bold text-xs uppercase tracking-widest py-4 rounded-button text-center hover:bg-gray-200 transition-colors"
                        >
                          Go to Dashboard
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Form Actions Footer */}
                  {checkoutStep < 4 && (
                    <div className="pt-6 border-t border-gray-100 flex gap-4 mt-8">
                      {checkoutStep > 1 && (
                        <button
                          type="button"
                          onClick={() => setCheckoutStep(checkoutStep - 1)}
                          className="border border-gray-250 text-gray-500 font-semibold px-5 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-xs uppercase tracking-wider cursor-pointer"
                          disabled={isProcessingPayment}
                        >
                          Back
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={
                          isProcessingPayment || (checkoutStep === 3 && (
                            !termsAccepted ||
                            !fitnessDeclared ||
                            !riskAcknowledged ||
                            !instructionsAgreed ||
                            !emergencyContact ||
                            !emergencyName ||
                            !emergencyRelationship ||
                            (members.some(m => m.age < 18) && !guardianPermitted)
                          ))
                        }
                        className="bg-primary-orange hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest py-4 rounded-button flex-1 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isProcessingPayment ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                        ) : checkoutStep === 3 ? (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Pay INR {(trek.price * seatCount).toFixed(2)}
                          </>
                        ) : (
                          'Continue'
                        )}
                      </button>
                    </div>
                  )}

                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      {selectedImageIndex !== null && (
        <div 
          onClick={() => setSelectedImageIndex(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex justify-center items-center p-4"
        >
          <button 
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-6 right-6 text-white hover:text-primary-orange p-2 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
          <img 
            src={displayImages[selectedImageIndex]} 
            alt="Expedition capture" 
            className="max-h-[85vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/10"
          />
        </div>
      )}

      <Footer />
    </main>
  );
}
