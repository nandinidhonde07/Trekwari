'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import WhatsAppWidget from '../../../components/WhatsAppWidget';
import { api, APIError } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { 
  Calendar, Clock, Mountain, MapPin, IndianRupee, ShieldCheck, 
  Sparkles, CheckCircle2, User, AlertCircle, Compass, Thermometer, Wind, Umbrella, CheckSquare,
  Sunrise, Sunset
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
  itinerary: Array<{ time: string; activity: string }>;
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

  const [trek, setTrek] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Booking Flow States
  const [bookingDrawerOpen, setBookingDrawerOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Seats, 2: Roster details, 3: Medical/SOS, 4: Waiver
  const [seatCount, setSeatCount] = useState(1);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [medicalDetails, setMedicalDetails] = useState('');
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [members, setMembers] = useState<Array<{ name: string; age: number; gender: string }>>([
    { name: '', age: 20, gender: 'Male' }
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
        // Pre-fill primary member name if user logged in
        if (user) {
          setMembers([{ name: user.name, age: 20, gender: 'Male' }]);
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
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest-green" />
      </div>
    );
  }

  if (!trek) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto pt-40 pb-20 text-center px-4">
          <AlertCircle className="h-12 w-12 text-sunrise-orange mx-auto mb-4" />
          <h2 className="text-xl font-bold text-forest-green font-display">Trek Not Found</h2>
          <p className="text-sm text-gray-500 mt-2">The trek you are looking for does not exist or has been removed.</p>
          <Link href="/treks" className="inline-block mt-6 bg-forest-green text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl">
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
  const policyCancellationRules = trek.policy ? JSON.parse(trek.policy.cancellationRules || '[]') : null;

  const handleSeatCountChange = (count: number) => {
    setSeatCount(count);
    const newMembers = [...members];
    if (count > newMembers.length) {
      for (let i = newMembers.length; i < count; i++) {
        newMembers.push({ name: '', age: 20, gender: 'Male' });
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

    // Validation
    const emptyMember = members.some(m => !m.name.trim());
    if (emptyMember) {
      setBookingError('Please fill out the names of all participants.');
      return;
    }

    if (!emergencyContact.trim()) {
      setBookingError('Please supply an emergency contact number.');
      return;
    }

    if (checkoutStep === 1) {
      setCheckoutStep(2);
      return;
    }
    if (checkoutStep === 2) {
      setCheckoutStep(3);
      return;
    }
    if (checkoutStep === 3) {
      if (!emergencyContact || !emergencyName || !emergencyRelationship) {
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

        // Load Razorpay Checkout SDK dynamically
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
          throw new Error('Razorpay payment gateway SDK failed to load. Check your network.');
        }

        const isMockOrder = data.booking.razorpayOrderId.startsWith('order_mock_');
        
        if (isMockOrder) {
          // Trigger Simulated Razorpay Payment Modal
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
          // Open Live Razorpay Options
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_yourtestkeyhere',
            amount: Math.round(data.booking.totalAmount * 100),
            currency: 'INR',
            name: 'TreckWari',
            description: `Expedition booking for ${trek.title}`,
            order_id: data.booking.razorpayOrderId,
            prefill: {
              name: user?.name || '',
              email: user?.email || '',
              contact: emergencyContact
            },
            theme: {
              color: '#14532D' // Forest Green Theme Color
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

  // Weather parameters (mock forecast based on trek type)
  const isKalsubai = trek.slug.includes('kalsubai');
  const weatherTemp = isKalsubai ? '18°C' : '23°C';
  const weatherWind = isKalsubai ? '14 km/h' : '8 km/h';
  const weatherRain = isKalsubai ? 'Rainy Fog (90%)' : 'Showers (65%)';

  return (
    <main className="min-h-screen relative bg-gray-50">
      <Navbar />
      <WhatsAppWidget />

      {/* Trek Hero Section */}
      <section className="relative h-[65vh] w-full flex items-end pb-12 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${trek.images[0] || '/images/homepage_banner.jpg'}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3 text-white">
            <span className="bg-sunrise-orange text-forest-green text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded">
              {trek.difficulty}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-display">{trek.title}</h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 flex items-center font-medium">
              <MapPin className="h-4 w-4 mr-1 text-sunrise-orange flex-shrink-0" />
              {trek.location}
            </p>
          </div>
          
          {/* Quick Price panel */}
          <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 flex items-center gap-6 shadow-xl flex-shrink-0">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Total Price</p>
              <p className="text-xl font-extrabold text-forest-green flex items-center">
                <IndianRupee className="h-4.5 w-4.5 mr-0.5 text-sunrise-orange" />
                {trek.price}
              </p>
            </div>
            {trek.status === 'OPEN_REGISTRATION' ? (
              <button
                onClick={() => setBookingDrawerOpen(true)}
                className="bg-sunrise-orange hover:bg-yellow-500 text-forest-green font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all"
              >
                Book Spots
              </button>
            ) : (
              <span className="bg-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl cursor-not-allowed">
                Completed
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Tabs Menu */}
      <section className="bg-white border-b border-gray-250 sticky top-14 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto no-scrollbar py-3 text-sm">
            {['overview', 'itinerary', 'weather', 'map', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`uppercase tracking-wider font-semibold pb-1 border-b-2 transition-all capitalize focus:outline-none flex-shrink-0 ${
                  activeTab === tab 
                    ? 'border-sunrise-orange text-forest-green' 
                    : 'border-transparent text-gray-400 hover:text-forest-green'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Details Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left: Tab Content */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-forest-green font-display">Trek Overview</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-sans font-light">{trek.description}</p>
                </div>

                {/* Highlights */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-forest-green font-display">Highlights</h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-gray-600 font-sans font-light">
                    {trek.highlights.map((h, i) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-sunrise-orange flex-shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Things to Carry */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-forest-green font-display">Things to Carry</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-600 font-sans font-light">
                    {policyCarryList ? (
                      policyCarryList.map((t: any, i: number) => (
                        <div key={i} className="flex items-center">
                          <CheckSquare className="h-4 w-4 mr-2 text-sunrise-orange flex-shrink-0" />
                          <span>{t.name} {t.isRequired ? '(Required)' : '(Optional)'}</span>
                        </div>
                      ))
                    ) : (
                      trek.thingsToCarry.map((t, i) => (
                        <div key={i} className="flex items-center">
                          <CheckSquare className="h-4 w-4 mr-2 text-sunrise-orange flex-shrink-0" />
                          <span>{t}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Things Not Allowed */}
                {policyProhibitedList && policyProhibitedList.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-red-700 font-display">Things Not Allowed (Prohibited)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-red-700 font-sans font-medium">
                      {policyProhibitedList.map((t: string, i: number) => (
                        <div key={i} className="flex items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600 mr-2 flex-shrink-0" />
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety & Roster Leaders */}
                <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-forest-green font-display">Trek Leader In-Charge</h4>
                    {trek.leaders.map((leader, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <img src={leader.user.avatarUrl} alt={leader.user.name} className="h-10 w-10 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-bold text-forest-green font-display">{leader.user.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{leader.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-forest-green font-display">Safety Features</h4>
                    <ul className="space-y-1 text-xs text-gray-500 font-sans">
                      {policySafetyList && policySafetyList.length > 0 ? (
                        policySafetyList.map((s: any, i: number) => (
                          <li key={i}>• <strong>[{s.category}]</strong> {s.instruction}</li>
                        ))
                      ) : (
                        trek.safetyMeasures.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Itinerary Tab */}
            {activeTab === 'itinerary' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-forest-green font-display">Trek Timeline & Itinerary</h3>
                <div className="relative border-l-2 border-emerald-100 ml-4 pl-6 space-y-8 py-2">
                  {trek.itinerary.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline circle */}
                      <div className="absolute left-[-32px] top-1 bg-white border-2 border-sunrise-orange text-sunrise-orange h-4 w-4 rounded-full flex items-center justify-center shadow-sm" />
                      <p className="text-xs font-extrabold text-sunrise-orange font-sans uppercase tracking-wider">{step.time}</p>
                      <p className="text-sm text-gray-700 font-bold font-display mt-0.5">{step.activity}</p>
                    </div>
                  ))}
                  {/* End Certificate Issued stamp */}
                  <div className="relative">
                    <div className="absolute left-[-32px] top-1 bg-white border-2 border-forest-green text-forest-green h-4 w-4 rounded-full flex items-center justify-center shadow-sm" />
                    <p className="text-xs font-extrabold text-forest-green font-sans uppercase tracking-wider">End of Trip</p>
                    <p className="text-sm text-gray-700 font-bold font-display mt-0.5">Participation Certificate Issued (PDF)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Weather Tab */}
            {activeTab === 'weather' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-forest-green font-display">Trek Weather Report</h3>
                <p className="text-xs text-gray-500">Live coordinates-based weather report for <strong>{weatherData?.location || trek.location}</strong>.</p>
                
                {loadingWeather ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-forest-green" />
                  </div>
                ) : weatherData ? (
                  <div className="space-y-6">
                    {/* Live Condition & Primary Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider">Temperature</p>
                          <p className="text-2xl font-black text-forest-green">{weatherData.temp}</p>
                          <p className="text-[10px] text-gray-400">Feels Like: <strong className="text-gray-500">{weatherData.feelsLike}</strong></p>
                        </div>
                        {weatherData.icon && (
                          <img 
                            src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`} 
                            alt="" 
                            className="h-14 w-14 bg-emerald-50 rounded-full"
                          />
                        )}
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider">Atmosphere</p>
                          <p className="text-sm font-extrabold text-forest-green capitalize mt-1">{weatherData.conditions}</p>
                          <p className="text-[10px] text-gray-400">Rain Probability: <strong className="text-forest-green">{weatherData.rainProbability}</strong></p>
                        </div>
                        <Umbrella className="h-10 w-10 text-sunrise-orange bg-orange-50 p-2 rounded-full" />
                      </div>
                      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider">Wind & Humidity</p>
                          <p className="text-sm font-extrabold text-forest-green mt-1">Wind: {weatherData.windSpeed}</p>
                          <p className="text-[10px] text-gray-400">Humidity: <strong className="text-gray-500">{weatherData.humidity}</strong></p>
                        </div>
                        <Wind className="h-10 w-10 text-sunrise-orange bg-orange-50 p-2 rounded-full" />
                      </div>
                    </div>

                    {/* Safety Warnings Section */}
                    {weatherData.alerts && weatherData.alerts.length > 0 && (
                      <div className="bg-red-50 border border-red-200 p-4 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                          <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
                          <span>ACTIVE SAFETY WARNINGS</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-red-700 font-medium">
                          {weatherData.alerts.map((alert: string, idx: number) => (
                            <li key={idx}>{alert}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Sun Schedule */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 justify-center">
                        <Sunrise className="h-5 w-5 text-sunrise-orange" />
                        <div className="text-center sm:text-left">
                          <p className="text-[9px] uppercase tracking-wider text-gray-400 font-extrabold">Sunrise</p>
                          <p className="text-xs font-bold text-forest-green">{weatherData.sunrise}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 justify-center border-l border-gray-250/60">
                        <Sunset className="h-5 w-5 text-sunrise-orange" />
                        <div className="text-center sm:text-left">
                          <p className="text-[9px] uppercase tracking-wider text-gray-400 font-extrabold">Sunset</p>
                          <p className="text-xs font-bold text-forest-green">{weatherData.sunset}</p>
                        </div>
                      </div>
                    </div>

                    {/* 5-Day Forecast Row */}
                    {weatherData.forecast && weatherData.forecast.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-xs uppercase font-extrabold text-forest-green tracking-wider border-b border-gray-100 pb-1.5">5-Day Weather Forecast</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {weatherData.forecast.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm text-center flex flex-col items-center justify-between">
                              <p className="text-[10px] font-extrabold text-gray-400">{item.date}</p>
                              {item.icon && (
                                <img 
                                  src={`https://openweathermap.org/img/wn/${item.icon}.png`} 
                                  alt="" 
                                  className="h-10 w-10 my-1 bg-emerald-50/50 rounded-full"
                                />
                              )}
                              <p className="text-xs font-extrabold text-forest-green">{item.temp}</p>
                              <p className="text-[9px] text-gray-400 capitalize truncate w-full mt-0.5">{item.conditions}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-xs text-forest-green font-sans leading-relaxed">
                      📢 **Monsoon Trek Note**: Flash showers are common in the Sahyadris. Always pack spare sets of dry clothes inside water-tight bags. Check warnings with your Trek Leader before summit runs.
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-12">Weather details unavailable.</p>
                )}
              </div>
            )}

            {/* Map Tab */}
            {activeTab === 'map' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-forest-green font-display">Expedition Trail Route</h3>
                <div className="h-64 sm:h-96 w-full rounded-2xl overflow-hidden border border-gray-200">
                  <iframe 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(trek.location || '')}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={false} 
                    loading="lazy"
                    title={trek.title}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <strong>Meeting Point:</strong> {trek.meetingPoint || 'Kopargaon Bus Stand'}
                  </div>
                  <div>
                    <strong>End Point:</strong> {trek.endPoint || 'Kopargaon Bus Stand'}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-forest-green font-display">Hiker Reviews</h3>

                {/* Submit review form */}
                {isAuthenticated ? (
                  <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-150 space-y-4">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-forest-green">Write a Review</h4>
                    {reviewSuccess && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
                        Review submitted! It will appear on this page once approved by the organizer.
                      </div>
                    )}
                    {reviewError && (
                      <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-xl">
                        {reviewError}
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Stars Rating</label>
                      <select 
                        value={reviewRating}
                        onChange={(e) => setReviewRating(parseInt(e.target.value))}
                        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none"
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
                        placeholder="Write your trekking memories..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl p-3 text-xs bg-white focus:outline-none focus:border-forest-green"
                      />
                    </div>
                    <button type="submit" className="bg-forest-green text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors">
                      Submit Review
                    </button>
                  </form>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center text-xs text-gray-400">
                    You must be logged in to submit a trek review.
                  </div>
                )}

                {/* List of Reviews */}
                <div className="space-y-5">
                  {trek.reviews.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No approved reviews yet. Be the first to share your experience!</p>
                  ) : (
                    trek.reviews.map((rev) => (
                      <div key={rev.id} className="border-b border-gray-100 pb-5 last:border-0 flex gap-4">
                        <img src={rev.user.avatarUrl} alt={rev.user.name} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-forest-green font-display">{rev.user.name}</span>
                            <span className="text-amber-500 text-xs">{'⭐'.repeat(rev.rating)}</span>
                          </div>
                          <p className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-2 font-sans font-light leading-relaxed">{rev.comment}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

          </div>

          {/* Right Sidebar: Quick Details Grid */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
              <h4 className="text-sm font-bold text-forest-green border-b border-gray-100 pb-3 font-display">Trek Metrics</h4>
              <ul className="space-y-4 text-xs font-sans">
                <li className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-400 font-semibold">Trek Grade</span>
                  <span className="font-bold text-forest-green">{trek.trekGrade || 'Moderate'}</span>
                </li>
                {trek.altitude && (
                  <li className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-400 font-semibold">Max Elevation</span>
                    <span className="font-bold text-forest-green">{trek.altitude}</span>
                  </li>
                )}
                {trek.distance && (
                  <li className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-400 font-semibold">Route Distance</span>
                    <span className="font-bold text-forest-green">{trek.distance} km</span>
                  </li>
                )}
                {trek.elevationGain && (
                  <li className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-400 font-semibold">Elevation Gain</span>
                    <span className="font-bold text-forest-green">{trek.elevationGain}m</span>
                  </li>
                )}
                <li className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-400 font-semibold">Minimum Age</span>
                  <span className="font-bold text-forest-green">{trek.minAge} Years</span>
                </li>
                <li className="flex justify-between pb-1">
                  <span className="text-gray-400 font-semibold">Suitable For</span>
                  <span className="font-bold text-forest-green truncate max-w-[180px]">{trek.suitableFor || 'Everyone'}</span>
                </li>
              </ul>
            </div>

            {/* Sidebar Booking CTA box */}
            {trek.status === 'OPEN_REGISTRATION' && (
              <div className="bg-sunrise-orange/10 border border-sunrise-orange/30 p-6 rounded-3xl space-y-4">
                <h4 className="text-sm font-bold text-forest-green font-display">Spots Are Filling Fast</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-sans">
                  Current Seat Load: **{trek.maxSeats - trek.availableSeats} Booked** | **{trek.availableSeats} Remaining**
                </p>
                <button
                  onClick={() => setBookingDrawerOpen(true)}
                  className="bg-sunrise-orange hover:bg-yellow-500 text-forest-green font-bold text-xs uppercase tracking-wider py-3.5 rounded-2xl w-full shadow-md text-center transition-all"
                >
                  Book Your Seat Now
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Booking Checkout Drawer Overlay */}
      {bookingDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto p-6 sm:p-8 flex flex-col justify-between border-l border-gray-250 animate-in slide-in-from-right duration-350">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-sunrise-orange tracking-wider">Step {checkoutStep} of 4</span>
                  <h3 className="text-lg font-bold text-forest-green font-display">{trek.title} Booking</h3>
                </div>
                <button 
                  onClick={() => {
                    setBookingDrawerOpen(false);
                    setCheckoutStep(1);
                    setBookingError('');
                  }}
                  className="text-gray-400 hover:text-gray-700 font-bold text-xl"
                  disabled={isProcessingPayment}
                >
                  ×
                </button>
              </div>

              {bookingError && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-2.5 rounded-xl mb-4 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Booking Steps Forms */}
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                
                {/* Step 1: Select Seat Count */}
                {checkoutStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h4 className="text-xs uppercase font-bold text-forest-green tracking-wider">Select Seats</h4>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-2">How many seats would you like to book?</label>
                      <select
                        value={seatCount}
                        onChange={(e) => handleSeatCountChange(parseInt(e.target.value))}
                        className="w-full border border-gray-250 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <option key={n} value={n}>{n} Seat{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between text-sm font-sans text-forest-green pt-4">
                      <span>Unit Cost:</span>
                      <strong>INR {trek.price}</strong>
                    </div>
                  </div>
                )}

                {/* Step 2: Member roster details */}
                {checkoutStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <h4 className="text-xs uppercase font-bold text-forest-green tracking-wider">Enter Trekkers Details</h4>
                    <div className="space-y-6 overflow-y-auto max-h-[50vh] pr-2 no-scrollbar">
                      {members.map((member, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-4">
                          <p className="text-xs font-bold text-forest-green font-display">Trekker {idx + 1} {idx === 0 ? '(Primary)' : ''}</p>
                          <div>
                            <input
                              type="text"
                              required
                              value={member.name}
                              onChange={(e) => handleMemberChange(idx, 'name', e.target.value)}
                              placeholder="Full Name"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:border-forest-green"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="number"
                              required
                              min="1"
                              value={member.age}
                              onChange={(e) => handleMemberChange(idx, 'age', parseInt(e.target.value))}
                              placeholder="Age"
                              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none"
                            />
                            <select
                              value={member.gender}
                              onChange={(e) => handleMemberChange(idx, 'gender', e.target.value)}
                              className="w-full border border-gray-200 rounded-xl px-2 py-2 text-xs bg-white focus:outline-none"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Medical details & Emergency SOS Contact */}
                {checkoutStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h4 className="text-xs uppercase font-bold text-forest-green tracking-wider">SOS Contacts & Policies</h4>
                    
                    {/* Emergency Contact */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-3">
                      <p className="text-xs font-bold text-forest-green font-display">Mandatory Emergency Contact</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-gray-400 mb-1">Contact Name</label>
                          <input
                            type="text"
                            required
                            value={emergencyName}
                            onChange={(e) => setEmergencyName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-gray-400 mb-1">Relationship</label>
                          <input
                            type="text"
                            required
                            value={emergencyRelationship}
                            onChange={(e) => setEmergencyRelationship(e.target.value)}
                            placeholder="e.g. Mother, Father"
                            className="w-full border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider font-extrabold text-gray-400 mb-1">Emergency Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={emergencyContact}
                          onChange={(e) => setEmergencyContact(e.target.value)}
                          placeholder="SOS phone number"
                          className="w-full border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Optional Medical details */}
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-3">
                      <p className="text-xs font-bold text-forest-green font-display">Medical Details (Optional)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-gray-400 mb-1">Blood Group</label>
                          <select
                            value={bloodGroup}
                            onChange={(e) => setBloodGroup(e.target.value)}
                            className="w-full border border-gray-200 bg-white rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                          >
                            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider font-extrabold text-gray-400 mb-1">Allergies / Warnings</label>
                          <input
                            type="text"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            placeholder="e.g. Penicillin, Asthma"
                            className="w-full border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-wider font-extrabold text-gray-400 mb-1">Other Medical Notes</label>
                        <textarea
                          rows={2}
                          value={medicalDetails}
                          onChange={(e) => setMedicalDetails(e.target.value)}
                          placeholder="Describe any chronic medical conditions or notes..."
                          className="w-full border border-gray-200 bg-white rounded-lg p-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Policy tabbed scrollable card */}
                    <div className="border border-gray-150 rounded-2xl overflow-hidden font-sans">
                      {/* Tab headers */}
                      <div className="flex bg-gray-50 border-b border-gray-150 text-[10px] uppercase font-bold text-gray-400">
                        <button
                          type="button"
                          onClick={() => setPolicyActiveSubTab('waiver')}
                          className={`flex-1 py-2 text-center border-r border-gray-150 last:border-0 ${
                            policyActiveSubTab === 'waiver' ? 'bg-white text-forest-green border-b-2 border-b-forest-green font-extrabold' : ''
                          }`}
                        >
                          Waiver
                        </button>
                        <button
                          type="button"
                          onClick={() => setPolicyActiveSubTab('terms')}
                          className={`flex-1 py-2 text-center border-r border-gray-150 last:border-0 ${
                            policyActiveSubTab === 'terms' ? 'bg-white text-forest-green border-b-2 border-b-forest-green font-extrabold' : ''
                          }`}
                        >
                          Terms
                        </button>
                        <button
                          type="button"
                          onClick={() => setPolicyActiveSubTab('cancellation')}
                          className={`flex-1 py-2 text-center border-r border-gray-150 last:border-0 ${
                            policyActiveSubTab === 'cancellation' ? 'bg-white text-forest-green border-b-2 border-b-forest-green font-extrabold' : ''
                          }`}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => setPolicyActiveSubTab('privacy')}
                          className={`flex-1 py-2 text-center last:border-0 ${
                            policyActiveSubTab === 'privacy' ? 'bg-white text-forest-green border-b-2 border-b-forest-green font-extrabold' : ''
                          }`}
                        >
                          Privacy
                        </button>
                      </div>
                      
                      {/* Scrollable content container */}
                      <div className="text-[10px] text-gray-500 bg-white p-4 h-32 overflow-y-auto leading-relaxed space-y-2">
                        {policyActiveSubTab === 'waiver' && (
                          <div>
                            <p className="font-bold text-gray-800">{trek.policy?.letterTitle || 'Trek Liability Waiver'}</p>
                            <p className="mt-1">{trek.policy?.letterWaiver || 'I hereby assume all risks of injury, illness, or property loss during this expedition.'}</p>
                          </div>
                        )}
                        {policyActiveSubTab === 'terms' && (
                          <div>
                            <p className="font-bold text-gray-800">Trek Rules & Conduct Terms</p>
                            <p className="mt-1">{trek.policy?.termsAndConditions || '1. Strictly follow instructions of trek leaders. 2. No littering is allowed. 3. Zero tolerance for drug/alcohol intake during events.'}</p>
                          </div>
                        )}
                        {policyActiveSubTab === 'cancellation' && (
                          <div>
                            <p className="font-bold text-gray-800">Cancellation & Refund Policy</p>
                            <p className="mt-1">{trek.policy?.cancellationRules ? JSON.parse(trek.policy.cancellationRules).join(', ') : 'Standard cancellation timelines apply.'}</p>
                            {trek.policy?.weatherPolicy && <p className="mt-1.5 font-bold">Weather: {trek.policy.weatherPolicy}</p>}
                          </div>
                        )}
                        {policyActiveSubTab === 'privacy' && (
                          <div>
                            <p className="font-bold text-gray-800">Privacy & Data Audit Policy</p>
                            <p className="mt-1">{trek.policy?.privacyPolicy || 'We protect all personal data and emergency contact warnings, storing them securely for emergency and logistics use.'}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-start gap-2">
                        <input 
                          type="checkbox"
                          required
                          id="fit-check"
                          checked={fitnessDeclared}
                          onChange={(e) => setFitnessDeclared(e.target.checked)}
                          className="mt-0.5 accent-forest-green h-4 w-4 rounded"
                        />
                        <label htmlFor="fit-check" className="text-[11px] text-gray-500 leading-relaxed font-sans select-none">
                          ✅ I confirm that I am physically fit for this trek.
                        </label>
                      </div>
                      <div className="flex items-start gap-2">
                        <input 
                          type="checkbox"
                          required
                          id="risk-check"
                          checked={riskAcknowledged}
                          onChange={(e) => setRiskAcknowledged(e.target.checked)}
                          className="mt-0.5 accent-forest-green h-4 w-4 rounded"
                        />
                        <label htmlFor="risk-check" className="text-[11px] text-gray-500 leading-relaxed font-sans select-none">
                          ✅ I understand that trekking involves inherent risks and I participate at my own responsibility.
                        </label>
                      </div>
                      <div className="flex items-start gap-2">
                        <input 
                          type="checkbox"
                          required
                          id="instructions-check"
                          checked={instructionsAgreed}
                          onChange={(e) => setInstructionsAgreed(e.target.checked)}
                          className="mt-0.5 accent-forest-green h-4 w-4 rounded"
                        />
                        <label htmlFor="instructions-check" className="text-[11px] text-gray-500 leading-relaxed font-sans select-none">
                          ✅ I agree to follow the instructions of the trek leader and organizers.
                        </label>
                      </div>

                      {/* Guardian check for minors */}
                      {members.some(m => m.age < 18) && (
                        <div className="flex items-start gap-2 p-2.5 bg-orange-50 border border-orange-200 rounded-xl">
                          <input 
                            type="checkbox"
                            required
                            id="guardian-check"
                            checked={guardianPermitted}
                            onChange={(e) => setGuardianPermitted(e.target.checked)}
                            className="mt-0.5 accent-forest-green h-4 w-4 rounded"
                          />
                          <label htmlFor="guardian-check" className="text-[11px] text-orange-850 leading-relaxed font-sans select-none font-bold">
                            ☐ I confirm that I have permission from my parent/legal guardian.
                          </label>
                        </div>
                      )}

                      {/* Main Acceptance Checkbox */}
                      <div className="flex items-start gap-2 border-t border-gray-100 pt-2.5">
                        <input 
                          type="checkbox"
                          required
                          id="waiver-check"
                          checked={termsAccepted}
                          onChange={(e) => {
                            setTermsAccepted(e.target.checked);
                            setWaiverAccepted(e.target.checked);
                          }}
                          className="mt-0.5 accent-forest-green h-4 w-4 rounded"
                        />
                        <label htmlFor="waiver-check" className="text-[11px] text-gray-500 leading-relaxed font-sans select-none font-bold">
                          I have read and agree to the Terms & Conditions, Cancellation & Refund Policy, Privacy Policy, and Trek Risk Waiver.
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Booking Success Ticket Download */}
                {checkoutStep === 4 && bookingSuccess && (
                  <div className="space-y-6 text-center py-6 animate-in scale-in duration-300">
                    <CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto" />
                    <div>
                      <h4 className="text-xl font-bold text-forest-green font-display">Trek Booked Successfully!</h4>
                      <p className="text-xs text-gray-400 mt-1">Booking ID: {bookingSuccess.bookingId}</p>
                    </div>
                    
                    <div className="bg-emerald-50 border border-emerald-150 p-5 rounded-2xl text-left text-xs text-forest-green font-sans leading-relaxed space-y-1">
                      <p>• A confirmation email has been dispatched to your email address.</p>
                      <p>• Your PDF ticket containing check-in QR codes is ready for download.</p>
                      <p>• You can download certificates once trek status changes to Completed.</p>
                    </div>

                    <div className="space-y-3 pt-4">
                      {/* Ticket download mock trigger */}
                      <button
                        onClick={() => {
                          alert(`Mocking PDF ticket stream for ID: ${bookingSuccess.bookingId}. Buffer generated by pdfkit.`);
                        }}
                        className="bg-forest-green hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl w-full shadow-md text-center"
                      >
                        Download Ticket PDF
                      </button>
                      <Link
                        href="/dashboard"
                        className="block bg-gray-100 hover:bg-gray-200 text-forest-green font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl text-center"
                      >
                        Go to Hiker Dashboard
                      </Link>
                    </div>
                  </div>
                )}

                {/* Form Actions Footer (Steps 1, 2, 3) */}
                {checkoutStep < 4 && (
                  <div className="pt-8 border-t border-gray-100 flex gap-4 mt-8">
                    {checkoutStep > 1 && (
                      <button
                        type="button"
                        onClick={() => setCheckoutStep(checkoutStep - 1)}
                        className="border border-gray-250 text-gray-500 font-semibold px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-xs uppercase tracking-wider"
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
                      className="bg-sunrise-orange hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-forest-green font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl flex-1 shadow-md transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isProcessingPayment ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-forest-green" />
                      ) : checkoutStep === 3 ? (
                        <>
                          <Sparkles className="h-4.5 w-4.5 text-forest-green fill-forest-green/10" />
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

          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
