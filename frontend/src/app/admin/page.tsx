'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { 
  BarElement, CategoryScale, Chart as ChartJS, Legend, 
  LinearScale, LineElement, PointElement, Title, Tooltip 
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { 
  ShieldAlert, Settings as SettingsIcon, BarChart3, Calendar, 
  Users, DollarSign, Heart, Check, X, Search, Plus, Trash, Edit, Star, Copy, ArrowUp, ArrowDown, BookOpen
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface EventItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  availableSeats: number;
  maxSeats: number;
  startDate: string;
  status: string;
  location: string;
  description: string;
  difficulty: string;
  policyId: string | null;
}

interface PolicyItem {
  id: string;
  title: string;
  isTemplate: boolean;
  letterTitle: string;
  letterDescription: string;
  letterTerms: string;
  letterWaiver: string;
  letterDeclaration: string;
  letterCheckboxText: string;
  thingsToCarry: string;
  thingsNotAllowed: string;
  medicalMandatoryFields: string;
  safetyGuidelines: string;
  cancellationRules: string;
  refundPercentages: string;
  weatherPolicy: string;
  organizerCancellationPolicy: string;
  noShowPolicy: string;
  faqs: string;
  prepTips: string;
  fitnessRecommendations: string;
  clothingSuggestions: string;
  foodRecommendations: string;
  weatherAdvice: string;
  equipmentRecommendations: string;
  trekInfoPdf?: string;
  thingsToCarryPdf?: string;
  responsibilityLetterPdf?: string;
  safetyGuidelinesPdf?: string;
  medicalDeclarationPdf?: string;
  cancellationPolicyPdf?: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  const [activeTab, setActiveTab] = useState('analytics'); // analytics, treks, reviews, policies, settings
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Event Manager States
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  // Event Form Input States
  const [eventTitle, setEventTitle] = useState('');
  const [eventSlug, setEventSlug] = useState('');
  const [eventPrice, setEventPrice] = useState(1399);
  const [eventSeats, setEventSeats] = useState(30);
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDifficulty, setEventDifficulty] = useState('Moderate');
  const [eventStatus, setEventStatus] = useState('DRAFT');
  const [eventPolicyId, setEventPolicyId] = useState('');

  // Policy CMS States
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  // Policy Form Input States
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyIsTemplate, setPolicyIsTemplate] = useState(true);
  const [letterTitle, setLetterTitle] = useState('Participant Responsibility Letter');
  const [letterDescription, setLetterDescription] = useState('');
  const [letterTerms, setLetterTerms] = useState('');
  const [letterWaiver, setLetterWaiver] = useState('');
  const [letterDeclaration, setLetterDeclaration] = useState('');
  const [letterCheckboxText, setLetterCheckboxText] = useState('I agree to the terms and declare myself fit.');
  
  // Things to Carry array state
  const [carryList, setCarryList] = useState<Array<{ name: string; isRequired: boolean; icon: string; order: number }>>([]);
  const [newCarryName, setNewCarryName] = useState('');
  const [newCarryRequired, setNewCarryRequired] = useState(true);
  
  // Prohibited Items
  const [prohibitedList, setProhibitedList] = useState<string[]>([]);
  const [newProhibited, setNewProhibited] = useState('');

  // Medical requirements checklist
  const [medicalConfig, setMedicalConfig] = useState<string[]>([]);

  // Safety guidelines
  const [safetyList, setSafetyList] = useState<Array<{ instruction: string; category: string }>>([]);
  const [newSafetyInstruction, setNewSafetyInstruction] = useState('');
  const [newSafetyCategory, setNewSafetyCategory] = useState('General');

  // FAQs lists
  const [faqList, setFaqList] = useState<Array<{ question: string; answer: string }>>([]);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Cancellation and Refund policy
  const [cancellationRules, setCancellationRules] = useState<string[]>([]);
  const [newCancelRule, setNewCancelRule] = useState('');
  const [refundRules, setRefundRules] = useState<Array<{ timeframeDays: number; percent: number }>>([]);
  const [newRefundDays, setNewRefundDays] = useState(7);
  const [newRefundPercent, setNewRefundPercent] = useState(100);
  const [weatherPolicy, setWeatherPolicy] = useState('');
  const [organizerCancelPolicy, setOrganizerCancelPolicy] = useState('');
  const [noShowPolicy, setNoShowPolicy] = useState('');

  // Prep guides
  const [prepTips, setPrepTips] = useState<string[]>([]);
  const [newPrepTip, setNewPrepTip] = useState('');
  const [fitnessRec, setFitnessRec] = useState<string[]>([]);
  const [newFitnessRec, setNewFitnessRec] = useState('');
  const [clothingSug, setClothingSug] = useState<string[]>([]);
  const [newClothingSug, setNewClothingSug] = useState('');
  const [foodRec, setFoodRec] = useState<string[]>([]);
  const [newFoodRec, setNewFoodRec] = useState('');
  const [weatherAdvice, setWeatherAdvice] = useState('');
  const [equipmentRec, setEquipmentRec] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');

  // PDF Docs Links
  const [trekInfoPdf, setTrekInfoPdf] = useState('');
  const [thingsToCarryPdf, setThingsToCarryPdf] = useState('');
  const [responsibilityLetterPdf, setResponsibilityLetterPdf] = useState('');

  // Bookings list state
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Pending Reviews
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Settings Fields
  const [orgName, setOrgName] = useState('TreckWari');
  const [founderName, setFounderName] = useState('Atharva Dhawale');
  const [orgEmail, setOrgEmail] = useState('atharvadhawale80@gmail.com');
  const [orgPhone, setOrgPhone] = useState('+91 9322340365');
  const [orgLocation, setOrgLocation] = useState('Kopargaon, Maharashtra');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Role Gate check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!loading && user) {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, router]);

  // Load Dashboard Analytics
  useEffect(() => {
    async function loadStats() {
      if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) return;
      try {
        const data = await api.dashboard.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, [isAuthenticated, user]);

  const fetchBookingsList = async () => {
    setLoadingBookings(true);
    try {
      const data = await api.bookings.all();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookingsList();
    }
  }, [activeTab]);

  // Load Treks list for CRUD tab
  const fetchTreksList = async () => {
    setLoadingEvents(true);
    try {
      const data = await api.events.list({ status: '' });
      setEvents(data);
    } catch (err) {
      console.error('Failed to load treks:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Load Pending Reviews tab
  const fetchPendingReviews = async () => {
    setLoadingReviews(true);
    try {
      const data = await api.reviews.getPending();
      setPendingReviews(data);
    } catch (err) {
      console.error('Failed to load pending reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Load Policies list
  const fetchPoliciesList = async () => {
    setLoadingPolicies(true);
    try {
      const data = await api.policies.list();
      setPolicies(data);
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Load Public Settings into editor
  const fetchSettings = async () => {
    try {
      const data = await api.settings.get();
      if (data) {
        setOrgName(data.organizationName);
        setFounderName(data.founderName);
        setOrgEmail(data.email);
        setOrgPhone(data.phone);
        setOrgLocation(data.location);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'treks') {
      fetchTreksList();
      fetchPoliciesList();
    }
    if (activeTab === 'reviews') fetchPendingReviews();
    if (activeTab === 'policies') fetchPoliciesList();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: eventTitle,
        slug: eventSlug,
        price: eventPrice,
        maxSeats: eventSeats,
        startDate: eventDate,
        endDate: eventDate,
        location: eventLocation,
        description: eventDescription,
        difficulty: eventDifficulty,
        status: eventStatus,
        policyId: eventPolicyId || null
      };

      if (editingEventId) {
        await api.events.update(editingEventId, payload);
      } else {
        await api.events.create({
          ...payload,
          highlights: ['Scenic Summit views', 'Traditional meals'],
          itinerary: [{ time: '05:00 AM', activity: 'Departure' }],
          thingsToCarry: ['Water', 'Shoes'],
          fitnessLevel: 'Moderate stamina',
          safetyMeasures: ['First aid kit'],
          pickupPoints: ['Kopargaon', 'Shirdi'],
          images: ['/images/kalsubai_2.jpg']
        });
      }
      setShowEventForm(false);
      setEditingEventId(null);
      fetchTreksList();
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const handleEditTrek = (trek: any) => {
    setEditingEventId(trek.id);
    setEventTitle(trek.title);
    setEventSlug(trek.slug);
    setEventPrice(trek.price);
    setEventSeats(trek.maxSeats);
    setEventDate(new Date(trek.startDate).toISOString().slice(0, 16));
    setEventLocation(trek.location);
    setEventDescription(trek.description);
    setEventDifficulty(trek.difficulty);
    setEventStatus(trek.status);
    setEventPolicyId(trek.policyId || '');
    setShowEventForm(true);
  };

  const handleDuplicateTrek = async (id: string) => {
    try {
      await api.events.duplicate(id);
      fetchTreksList();
    } catch (err) {
      console.error('Failed to duplicate trek:', err);
    }
  };

  const handleDeleteTrek = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This will erase all connected bookings.')) return;
    try {
      await api.events.delete(id);
      fetchTreksList();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const handleApproveReview = async (id: string) => {
    try {
      await api.reviews.approve(id);
      fetchPendingReviews();
    } catch (err) {
      console.error('Failed to approve review:', err);
    }
  };

  const handleRejectReview = async (id: string) => {
    try {
      await api.reviews.delete(id);
      fetchPendingReviews();
    } catch (err) {
      console.error('Failed to reject review:', err);
    }
  };

  // Policy Form Handlers
  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: policyTitle,
        isTemplate: policyIsTemplate,
        letterTitle,
        letterDescription,
        letterTerms,
        letterWaiver,
        letterDeclaration,
        letterCheckboxText,
        termsAndConditions,
        privacyPolicy,
        thingsToCarry: carryList,
        thingsNotAllowed: prohibitedList,
        medicalMandatoryFields: medicalConfig,
        safetyGuidelines: safetyList,
        cancellationRules,
        refundPercentages: refundRules,
        weatherPolicy,
        organizerCancellationPolicy: organizerCancelPolicy,
        noShowPolicy,
        faqs: faqList,
        prepTips,
        fitnessRecommendations: fitnessRec,
        clothingSuggestions: clothingSug,
        foodRecommendations: foodRec,
        weatherAdvice,
        equipmentRecommendations: equipmentRec,
        trekInfoPdf,
        thingsToCarryPdf,
        responsibilityLetterPdf
      };

      if (editingPolicyId) {
        await api.policies.update(editingPolicyId, payload);
      } else {
        await api.policies.create(payload);
      }
      setShowPolicyForm(false);
      setEditingPolicyId(null);
      fetchPoliciesList();
    } catch (err) {
      console.error('Failed to save policy:', err);
    }
  };

  const handleEditPolicy = (policy: PolicyItem) => {
    setEditingPolicyId(policy.id);
    setPolicyTitle(policy.title);
    setPolicyIsTemplate(policy.isTemplate);
    setLetterTitle(policy.letterTitle);
    setLetterDescription(policy.letterDescription);
    setLetterTerms(policy.letterTerms);
    setLetterWaiver(policy.letterWaiver);
    setLetterDeclaration(policy.letterDeclaration);
    setLetterCheckboxText(policy.letterCheckboxText);
    
    // Parse arrays
    setCarryList(JSON.parse(policy.thingsToCarry || '[]'));
    setProhibitedList(JSON.parse(policy.thingsNotAllowed || '[]'));
    setMedicalConfig(JSON.parse(policy.medicalMandatoryFields || '[]'));
    setSafetyList(JSON.parse(policy.safetyGuidelines || '[]'));
    setCancellationRules(JSON.parse(policy.cancellationRules || '[]'));
    setRefundRules(JSON.parse(policy.refundPercentages || '[]'));
    setFaqList(JSON.parse(policy.faqs || '[]'));
    setPrepTips(JSON.parse(policy.prepTips || '[]'));
    setFitnessRec(JSON.parse(policy.fitnessRecommendations || '[]'));
    setClothingSug(JSON.parse(policy.clothingSuggestions || '[]'));
    setFoodRec(JSON.parse(policy.foodRecommendations || '[]'));
    
    setWeatherPolicy(policy.weatherPolicy);
    setOrganizerCancelPolicy(policy.organizerCancellationPolicy);
    setNoShowPolicy(policy.noShowPolicy);
    setWeatherAdvice(policy.weatherAdvice);
    setEquipmentRec(policy.equipmentRecommendations);
    setTermsAndConditions((policy as any).termsAndConditions || '');
    setPrivacyPolicy((policy as any).privacyPolicy || '');
    setTrekInfoPdf(policy.trekInfoPdf || '');
    setThingsToCarryPdf(policy.thingsToCarryPdf || '');
    setResponsibilityLetterPdf(policy.responsibilityLetterPdf || '');
    
    setShowPolicyForm(true);
  };

  const handleDuplicatePolicy = async (id: string) => {
    try {
      await api.policies.duplicate(id);
      fetchPoliciesList();
    } catch (err) {
      console.error('Failed to duplicate policy:', err);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy template?')) return;
    try {
      await api.policies.delete(id);
      fetchPoliciesList();
    } catch (err) {
      console.error('Failed to delete policy:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess('');
    try {
      await api.settings.update({
        organizationName: orgName,
        founderName,
        email: orgEmail,
        phone: orgPhone,
        whatsapp: orgPhone,
        location: orgLocation
      });
      setSettingsSuccess('Website settings updated successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  if (loading || loadingStats || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest-green" />
      </div>
    );
  }

  // Monthly stats chart configurations
  const chartMonths = stats.monthlyStats.map((s: any) => s.month);
  const chartBookings = stats.monthlyStats.map((s: any) => s.bookings);
  const chartRevenue = stats.monthlyStats.map((s: any) => s.revenue);

  const revenueChartData = {
    labels: chartMonths,
    datasets: [
      {
        label: 'Monthly Revenue (INR)',
        data: chartRevenue,
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  // Reorder Carry Item List
  const moveCarryItem = (index: number, direction: 'up' | 'down') => {
    const list = [...carryList];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    // Update order values
    const updated = list.map((item, idx) => ({ ...item, order: idx + 1 }));
    setCarryList(updated);
  };

  return (
    <main className="min-h-screen relative bg-gray-50">
      <Navbar />
      
      <section className="pt-28 pb-12 bg-forest-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] uppercase font-bold text-sunrise-orange tracking-widest">Admin Control Panel</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display mt-1">TreckWari Platform Dashboard</h1>
        </div>
      </section>

      {/* Main Tabs Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Settings tabs sidebar */}
          <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit space-y-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-bold tracking-wider transition-colors ${
                activeTab === 'analytics' ? 'bg-forest-green text-white' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Business Analytics
            </button>

            <button
              onClick={() => setActiveTab('treks')}
              className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-bold tracking-wider transition-colors ${
                activeTab === 'treks' ? 'bg-forest-green text-white' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Manage Treks (CMS)
            </button>

            <button
              onClick={() => setActiveTab('policies')}
              className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-bold tracking-wider transition-colors ${
                activeTab === 'policies' ? 'bg-forest-green text-white' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Trek Policies (CMS)
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-bold tracking-wider transition-colors ${
                activeTab === 'reviews' ? 'bg-forest-green text-white' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Star className="h-4 w-4" />
              Review Approvals ({pendingReviews.length})
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-bold tracking-wider transition-colors ${
                activeTab === 'bookings' ? 'bg-forest-green text-white' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Users className="h-4 w-4" />
              Manage Bookings
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-bold tracking-wider transition-colors ${
                activeTab === 'settings' ? 'bg-forest-green text-white' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <SettingsIcon className="h-4 w-4" />
              Direct HQ Settings
            </button>
          </div>

          {/* Right: Detailed Tab Screen */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Analytics Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <Users className="h-6 w-6 text-sunrise-orange mb-2" />
                    <p className="text-[10px] uppercase font-bold text-gray-400">Total Users</p>
                    <p className="text-xl font-extrabold text-forest-green mt-1">{stats.summary.totalUsers}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <Calendar className="h-6 w-6 text-sunrise-orange mb-2" />
                    <p className="text-[10px] uppercase font-bold text-gray-400">Paid Bookings</p>
                    <p className="text-xl font-extrabold text-forest-green mt-1">{stats.summary.totalBookings}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <DollarSign className="h-6 w-6 text-sunrise-orange mb-2" />
                    <p className="text-[10px] uppercase font-bold text-gray-400">Total Revenue</p>
                    <p className="text-xl font-extrabold text-forest-green mt-1">₹{stats.summary.totalRevenue}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <Heart className="h-6 w-6 text-sunrise-orange mb-2" />
                    <p className="text-[10px] uppercase font-bold text-gray-400">Conversion</p>
                    <p className="text-xl font-extrabold text-forest-green mt-1">{stats.summary.conversionRate}%</p>
                  </div>
                </div>

                {/* Line Chart Card */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h4 className="text-sm font-bold text-forest-green font-display mb-4">Revenue Chart (INR)</h4>
                  <div className="h-64 sm:h-80">
                    <Line data={revenueChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>
            )}

            {/* Trek CMS CRUD Tab */}
            {activeTab === 'treks' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="text-base font-bold text-forest-green font-display">Trekking Events</h3>
                  {!showEventForm && (
                    <button
                      onClick={() => {
                        setEditingEventId(null);
                        setEventTitle('');
                        setEventSlug('');
                        setEventPrice(1399);
                        setEventSeats(30);
                        setEventDate('');
                        setEventLocation('');
                        setEventDescription('');
                        setEventStatus('DRAFT');
                        setEventPolicyId('');
                        setShowEventForm(true);
                      }}
                      className="bg-forest-green text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Event
                    </button>
                  )}
                </div>

                {showEventForm ? (
                  /* Create/Edit Form */
                  <form onSubmit={handleCreateEvent} className="space-y-4 border border-gray-150 p-5 rounded-2xl bg-gray-50">
                    <h4 className="text-xs uppercase font-bold text-forest-green mb-4">{editingEventId ? 'Edit Trek details' : 'Add New Trek'}</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        placeholder="Trek Title"
                        value={eventTitle}
                        onChange={(e) => {
                          setEventTitle(e.target.value);
                          setEventSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''));
                        }}
                        className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-forest-green"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Slug identifier"
                        value={eventSlug}
                        onChange={(e) => setEventSlug(e.target.value)}
                        className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <input
                        type="number"
                        required
                        placeholder="Price (INR)"
                        value={eventPrice}
                        onChange={(e) => setEventPrice(parseFloat(e.target.value))}
                        className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                      <input
                        type="number"
                        required
                        placeholder="Max Seats"
                        value={eventSeats}
                        onChange={(e) => setEventSeats(parseInt(e.target.value))}
                        className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                      <input
                        type="datetime-local"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        placeholder="Location"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                      />
                      <select
                        value={eventDifficulty}
                        onChange={(e) => setEventDifficulty(e.target.value)}
                        className="border border-gray-200 bg-white rounded-xl px-2 py-2 text-xs focus:outline-none"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Difficult">Difficult</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Event Status Dropdown */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Event Status</label>
                        <select
                          value={eventStatus}
                          onChange={(e) => setEventStatus(e.target.value)}
                          className="w-full border border-gray-200 bg-white rounded-xl px-2 py-2.5 text-xs focus:outline-none"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="OPEN_REGISTRATION">Open Registration</option>
                          <option value="REGISTRATION_CLOSED">Registration Closed</option>
                          <option value="UPCOMING">Upcoming</option>
                          <option value="ONGOING">Ongoing</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>

                      {/* Policy Template dropdown */}
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Assign Policy Template</label>
                        <select
                          value={eventPolicyId}
                          onChange={(e) => setEventPolicyId(e.target.value)}
                          className="w-full border border-gray-200 bg-white rounded-xl px-2 py-2.5 text-xs focus:outline-none"
                        >
                          <option value="">No policy (Use Defaults)</option>
                          {policies.map((p) => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      required
                      placeholder="Description details..."
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      className="w-full border border-gray-200 bg-white rounded-xl p-3 text-xs focus:outline-none"
                    />

                    <div className="flex gap-3 pt-2">
                      <button type="submit" className="bg-forest-green text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl">
                        Save
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowEventForm(false);
                          setEditingEventId(null);
                        }}
                        className="border border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-gray-150"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : loadingEvents ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-forest-green" />
                  </div>
                ) : (
                  /* Treks list Table */
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                          <th className="p-3">Trek Name</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Seats</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((trek) => (
                          <tr key={trek.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="p-3 font-semibold text-forest-green">{trek.title}</td>
                            <td className="p-3">₹{trek.price}</td>
                            <td className="p-3">{trek.availableSeats}/{trek.maxSeats}</td>
                            <td className="p-3">{new Date(trek.startDate).toLocaleDateString()}</td>
                            <td className="p-3">
                              <span className={`font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded ${
                                trek.status === 'OPEN_REGISTRATION' ? 'bg-emerald-50 text-forest-green' :
                                trek.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700' :
                                trek.status === 'DRAFT' ? 'bg-gray-100 text-gray-500' :
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {trek.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="p-3 flex justify-center gap-3">
                              <button onClick={() => handleEditTrek(trek)} className="p-1 text-gray-400 hover:text-forest-green" title="Edit">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDuplicateTrek(trek.id)} className="p-1 text-gray-400 hover:text-sunrise-orange" title="Duplicate">
                                <Copy className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeleteTrek(trek.id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                                <Trash className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Trek Policies CMS Tab */}
            {activeTab === 'policies' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="text-base font-bold text-forest-green font-display">Trek Policies & Preparation CMS</h3>
                  {!showPolicyForm && (
                    <button
                      onClick={() => {
                        setEditingPolicyId(null);
                        setPolicyTitle('');
                        setPolicyIsTemplate(true);
                        setLetterTitle('Participant Responsibility & Liability Agreement');
                        setLetterDescription('');
                        setLetterTerms('');
                        setLetterWaiver('');
                        setLetterDeclaration('');
                        setLetterCheckboxText('I agree to the terms, waiver, and declare myself fit.');
                        setCarryList([]);
                        setProhibitedList([]);
                        setMedicalConfig([]);
                        setSafetyList([]);
                        setCancellationRules([]);
                        setRefundRules([]);
                        setWeatherPolicy('');
                        setOrganizerCancelPolicy('');
                        setNoShowPolicy('');
                        setFaqList([]);
                        setPrepTips([]);
                        setFitnessRec([]);
                        setClothingSug([]);
                        setFoodRec([]);
                        setWeatherAdvice('');
                        setEquipmentRec('');
                        setTrekInfoPdf('');
                        setThingsToCarryPdf('');
                        setResponsibilityLetterPdf('');
                        setShowPolicyForm(true);
                      }}
                      className="bg-forest-green text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create Template
                    </button>
                  )}
                </div>

                {showPolicyForm ? (
                  /* Form configuration */
                  <form onSubmit={handleSavePolicy} className="space-y-6 border border-gray-150 p-5 rounded-2xl bg-gray-50 text-xs text-gray-600">
                    <h4 className="text-sm font-bold text-forest-green border-b border-gray-100 pb-2">Policy Settings Details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-gray-400 mb-1.5 uppercase">Policy Template Name</label>
                        <input
                          type="text"
                          required
                          value={policyTitle}
                          onChange={(e) => setPolicyTitle(e.target.value)}
                          placeholder="e.g. Standard Monsoon Extreme Trek template"
                          className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-400 mb-1.5 uppercase">Is Global Template?</label>
                        <select
                          value={policyIsTemplate ? 'true' : 'false'}
                          onChange={(e) => setPolicyIsTemplate(e.target.value === 'true')}
                          className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                        >
                          <option value="true">Yes, list as Template</option>
                          <option value="false">No, custom trek override</option>
                        </select>
                      </div>
                    </div>

                    {/* Section 1: Responsibility Letter */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                      <h4 className="font-bold text-forest-green font-display border-b border-gray-50 pb-1.5">Participant Responsibility Letter</h4>
                      <input
                        type="text"
                        required
                        value={letterTitle}
                        onChange={(e) => setLetterTitle(e.target.value)}
                        placeholder="Letter Title"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                      <textarea
                        rows={2}
                        value={letterDescription}
                        onChange={(e) => setLetterDescription(e.target.value)}
                        placeholder="Letter Description (introductory remarks)"
                        className="w-full border border-gray-200 rounded-lg p-2 text-xs"
                      />
                      <textarea
                        rows={3}
                        value={letterTerms}
                        onChange={(e) => setLetterTerms(e.target.value)}
                        placeholder="Terms & Conditions (line separated or paragraphs)"
                        className="w-full border border-gray-200 rounded-lg p-2 text-xs"
                      />
                      <textarea
                        rows={3}
                        value={letterWaiver}
                        onChange={(e) => setLetterWaiver(e.target.value)}
                        placeholder="Liability Waiver text"
                        className="w-full border border-gray-200 rounded-lg p-2 text-xs"
                      />
                      <input
                        type="text"
                        value={letterCheckboxText}
                        onChange={(e) => setLetterCheckboxText(e.target.value)}
                        placeholder="Acceptance Checkbox Label"
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                      <textarea
                        rows={3}
                        value={termsAndConditions}
                        onChange={(e) => setTermsAndConditions(e.target.value)}
                        placeholder="Terms & Conditions (CMS Driven - editable for hiker booking acceptance)"
                        className="w-full border border-gray-200 rounded-lg p-2 text-xs"
                      />
                      <textarea
                        rows={3}
                        value={privacyPolicy}
                        onChange={(e) => setPrivacyPolicy(e.target.value)}
                        placeholder="Privacy Policy (CMS Driven - details data handling audits)"
                        className="w-full border border-gray-200 rounded-lg p-2 text-xs"
                      />
                    </div>

                    {/* Section 2: Things to Carry (Interactive order) */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                      <h4 className="font-bold text-forest-green font-display border-b border-gray-50 pb-1.5">Things to Carry Checklist</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCarryName}
                          onChange={(e) => setNewCarryName(e.target.value)}
                          placeholder="Add item (e.g. Hiking Pole)"
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                        <select
                          value={newCarryRequired ? 'true' : 'false'}
                          onChange={(e) => setNewCarryRequired(e.target.value === 'true')}
                          className="border border-gray-200 rounded-lg px-2 text-xs"
                        >
                          <option value="true">Required</option>
                          <option value="false">Optional</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newCarryName.trim()) return;
                            setCarryList([...carryList, { name: newCarryName, isRequired: newCarryRequired, icon: 'droplet', order: carryList.length + 1 }]);
                            setNewCarryName('');
                          }}
                          className="bg-forest-green text-white px-3 py-1.5 rounded-lg font-bold"
                        >
                          Add
                        </button>
                      </div>

                      {/* Carry Checklist table */}
                      <div className="space-y-1">
                        {carryList.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                            <span>{item.name} {item.isRequired ? '(Required)' : '(Optional)'}</span>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => moveCarryItem(idx, 'up')} className="p-1 text-gray-400 hover:text-forest-green">
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" onClick={() => moveCarryItem(idx, 'down')} className="p-1 text-gray-400 hover:text-forest-green">
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCarryList(carryList.filter((_, i) => i !== idx))}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 3: Prohibited items */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                      <h4 className="font-bold text-forest-green font-display border-b border-gray-50 pb-1.5">Things Not Allowed (Prohibited)</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newProhibited}
                          onChange={(e) => setNewProhibited(e.target.value)}
                          placeholder="e.g. Speakers, Loud music"
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newProhibited.trim()) return;
                            setProhibitedList([...prohibitedList, newProhibited]);
                            setNewProhibited('');
                          }}
                          className="bg-forest-green text-white px-3 py-1.5 rounded-lg font-bold"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {prohibitedList.map((item, idx) => (
                          <span key={idx} className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg border border-red-100 flex items-center gap-1.5">
                            {item}
                            <button type="button" onClick={() => setProhibitedList(prohibitedList.filter((_, i) => i !== idx))} className="text-red-500 font-extrabold hover:text-red-900">×</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Section 4: Cancellation and Refund Rules */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                      <h4 className="font-bold text-forest-green font-display border-b border-gray-50 pb-1.5">Cancellation & Refund Policies</h4>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCancelRule}
                          onChange={(e) => setNewCancelRule(e.target.value)}
                          placeholder="Cancellation Rule line..."
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newCancelRule.trim()) return;
                            setCancellationRules([...cancellationRules, newCancelRule]);
                            setNewCancelRule('');
                          }}
                          className="bg-forest-green text-white px-3 py-1.5 rounded-lg font-bold"
                        >
                          Add
                        </button>
                      </div>
                      
                      <ul className="space-y-1">
                        {cancellationRules.map((rule, idx) => (
                          <li key={idx} className="flex justify-between items-center bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                            <span>{rule}</span>
                            <button type="button" onClick={() => setCancellationRules(cancellationRules.filter((_, i) => i !== idx))} className="text-red-600">Remove</button>
                          </li>
                        ))}
                      </ul>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                        <textarea
                          placeholder="Weather Cancellation Policy..."
                          value={weatherPolicy}
                          onChange={(e) => setWeatherPolicy(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2"
                        />
                        <textarea
                          placeholder="Organizer Cancellation Policy..."
                          value={organizerCancelPolicy}
                          onChange={(e) => setOrganizerCancelPolicy(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2"
                        />
                        <textarea
                          placeholder="No-Show Policy..."
                          value={noShowPolicy}
                          onChange={(e) => setNoShowPolicy(e.target.value)}
                          className="border border-gray-200 rounded-lg p-2"
                        />
                      </div>
                    </div>

                    {/* Section 5: Downloadable PDFs links */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                      <h4 className="font-bold text-forest-green font-display border-b border-gray-50 pb-1.5">Downloadable Documents URLs</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="Trek Info PDF URL"
                          value={trekInfoPdf}
                          onChange={(e) => setTrekInfoPdf(e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1.5"
                        />
                        <input
                          type="text"
                          placeholder="Things to Carry PDF"
                          value={thingsToCarryPdf}
                          onChange={(e) => setThingsToCarryPdf(e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1.5"
                        />
                        <input
                          type="text"
                          placeholder="Responsibility Letter PDF"
                          value={responsibilityLetterPdf}
                          onChange={(e) => setResponsibilityLetterPdf(e.target.value)}
                          className="border border-gray-200 rounded-lg px-2 py-1.5"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <button type="submit" className="bg-forest-green text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md">
                        Save Policy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPolicyForm(false);
                          setEditingPolicyId(null);
                        }}
                        className="border border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-gray-150"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : loadingPolicies ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-forest-green" />
                  </div>
                ) : (
                  /* Policies Table */
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                          <th className="p-3">Policy Title</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Connected Treks</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {policies.map((p) => (
                          <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="p-3 font-semibold text-forest-green">{p.title}</td>
                            <td className="p-3">
                              {p.isTemplate ? (
                                <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider">
                                  Global Template
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider">
                                  Custom Override
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              {(p as any).events?.length || 0} Trek{((p as any).events?.length || 0) !== 1 ? 's' : ''}
                            </td>
                            <td className="p-3 flex justify-center gap-3">
                              <button onClick={() => handleEditPolicy(p)} className="p-1 text-gray-400 hover:text-forest-green" title="Edit">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDuplicatePolicy(p.id)} className="p-1 text-gray-400 hover:text-sunrise-orange" title="Duplicate">
                                <Copy className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeletePolicy(p.id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                                <Trash className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Review Approvals Tab */}
            {activeTab === 'reviews' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-300">
                <h3 className="text-base font-bold text-forest-green font-display border-b border-gray-50 pb-3">Pending Roster Reviews</h3>
                {loadingReviews ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-forest-green" />
                  </div>
                ) : pendingReviews.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No reviews pending approval.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingReviews.map((rev) => (
                      <div key={rev.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-forest-green">{rev.user.name} reviewed <strong>{rev.event.title}</strong></p>
                          <p className="text-amber-500 text-xs">{'⭐'.repeat(rev.rating)}</p>
                          <p className="text-xs text-gray-600 mt-1 italic">"{rev.comment}"</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApproveReview(rev.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1">
                            <Check className="h-4 w-4" /> Approve
                          </button>
                          <button onClick={() => handleRejectReview(rev.id)} className="border border-red-200 hover:bg-red-50 text-red-600 p-2 rounded-xl text-xs font-bold flex items-center gap-1">
                            <X className="h-4 w-4" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="text-base font-bold text-forest-green font-display">Manage Bookings & Terms Auditing</h3>
                  <button 
                    onClick={fetchBookingsList}
                    className="text-xs text-forest-green hover:underline font-bold"
                  >
                    Refresh List
                  </button>
                </div>

                {loadingBookings ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-forest-green" />
                  </div>
                ) : bookings.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-12">No bookings found in the system.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 uppercase font-extrabold tracking-wider">
                          <th className="p-3">Hiker</th>
                          <th className="p-3">Trek</th>
                          <th className="p-3">Seats & Amount</th>
                          <th className="p-3">Emergency Contact</th>
                          <th className="p-3">Medical Info</th>
                          <th className="p-3">Terms Audit</th>
                          <th className="p-3">Declarations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-gray-700">
                        {bookings.map((booking: any) => (
                          <tr key={booking.id} className="hover:bg-gray-50/50">
                            <td className="p-3">
                              <p className="font-bold text-gray-900">{booking.user.name}</p>
                              <p className="text-[10px] text-gray-400">{booking.user.email}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-forest-green">{booking.event.title}</p>
                              <p className="text-[10px] text-gray-400">Date: {new Date(booking.event.startDate).toLocaleDateString()}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-bold">{booking.seatCount} Seat(s)</p>
                              <p className="text-amber-600 font-extrabold">₹{booking.totalAmount}</p>
                              <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
                                booking.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {booking.paymentStatus}
                              </span>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-gray-800">{booking.emergencyName || 'N/A'}</p>
                              <p className="text-gray-600">{booking.emergencyContact}</p>
                              <p className="text-[10px] text-gray-400 italic">Rel: {booking.emergencyRelationship || 'N/A'}</p>
                            </td>
                            <td className="p-3 max-w-[150px]">
                              {booking.medicalDetails ? (
                                <p className="text-gray-600 truncate" title={booking.medicalDetails}>{booking.medicalDetails}</p>
                              ) : (
                                <p className="text-gray-400 italic">None reported</p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-0.5">Blood Group: {booking.user.bloodGroup || 'O+'}</p>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <p className="flex items-center gap-1 font-bold text-emerald-700">
                                  <span>Terms Accepted ✔️</span>
                                </p>
                                <p className="text-[10px] text-gray-400">Date: {booking.termsAcceptedAt ? new Date(booking.termsAcceptedAt).toLocaleString() : new Date(booking.createdAt).toLocaleString()}</p>
                                <p className="text-[9px] text-gray-400 font-mono">IP: {booking.ipAddress || '127.0.0.1'}</p>
                                <p className="text-[8px] text-gray-400 truncate max-w-[120px]" title={booking.userAgent || ''}>UA: {booking.userAgent || 'Chrome / Windows'}</p>
                              </div>
                            </td>
                            <td className="p-3 space-y-1">
                              <p className="flex items-center gap-1">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span className="text-gray-500">Physical Fitness</span>
                              </p>
                              <p className="flex items-center gap-1">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span className="text-gray-500">Inherent Risk</span>
                              </p>
                              <p className="flex items-center gap-1">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span className="text-gray-500">Organizer Rules</span>
                              </p>
                              {booking.guardianPermitted && (
                                <p className="flex items-center gap-1 text-emerald-700 font-bold">
                                  <span>✓ Guardian Permit</span>
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Direct HQ Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-300">
                <h3 className="text-base font-bold text-forest-green font-display border-b border-gray-50 pb-3">Organization Settings</h3>
                {settingsSuccess && (
                  <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
                    {settingsSuccess}
                  </div>
                )}
                
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Company Name</label>
                      <input
                        type="text"
                        required
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none focus:border-forest-green"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Founder Name</label>
                      <input
                        type="text"
                        required
                        value={founderName}
                        onChange={(e) => setFounderName(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Contact Number</label>
                      <input
                        type="text"
                        required
                        value={orgPhone}
                        onChange={(e) => setOrgPhone(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Official Email Address</label>
                      <input
                        type="email"
                        required
                        value={orgEmail}
                        onChange={(e) => setOrgEmail(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Headquarters Location</label>
                    <input
                      type="text"
                      required
                      value={orgLocation}
                      onChange={(e) => setOrgLocation(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-forest-green hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl shadow-md transition-colors"
                  >
                    Save Settings
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
