'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/toast';
import { TrekCMSManager } from '../../components/TrekCMSManager';
import { ImageCropModal } from '../../components/ImageCropModal';
import { AdminReviewAnalytics } from '../../components/AdminReviewAnalytics';
import { AdminAttendanceScanner } from '../../components/AdminAttendanceScanner';
import { AdminAttendanceDashboard } from '../../components/AdminAttendanceDashboard';
import { 
  BarElement, CategoryScale, Chart as ChartJS, Legend, 
  LinearScale, LineElement, PointElement, Title, Tooltip 
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { 
  ShieldAlert, Settings as SettingsIcon, BarChart3, Calendar, 
  Users, DollarSign, Heart, Check, X, Search, Plus, Trash, Edit, Star, Copy, ArrowUp, ArrowDown, BookOpen, Upload,
  QrCode, ClipboardList
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
  const { toast } = useToast();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

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
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Pending Reviews
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Settings Fields
  const [orgName, setOrgName] = useState('TreckWari');
  const [founderName, setFounderName] = useState('Atharva Dhawale');
  const [orgEmail, setOrgEmail] = useState('atharvadhawale80@gmail.com');
  const [orgPhone, setOrgPhone] = useState('+91 9322340365');
  const [orgWhatsapp, setOrgWhatsapp] = useState('+91 9322340365');
  const [orgLocation, setOrgLocation] = useState('Kopargaon, Maharashtra, India');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [tagline, setTagline] = useState('');
  const [hqName, setHqName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [officeTimings, setOfficeTimings] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [googleMapsEmbed, setGoogleMapsEmbed] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Admin Profile Photo Editor
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [cropImageSrc, setCropImageSrc] = useState('');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Blog CMS states
  const [blogsList, setBlogsList] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [isBlogFormOpen, setIsBlogFormOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogCategory, setBlogCategory] = useState('Trekking');
  const [blogContent, setBlogContent] = useState('');
  const [blogBanner, setBlogBanner] = useState('');
  const [blogSummary, setBlogSummary] = useState('');
  const [blogReadTime, setBlogReadTime] = useState('');
  const [blogIsPublished, setBlogIsPublished] = useState(true);
  const [blogIsFeatured, setBlogIsFeatured] = useState(false);
  const [blogScheduledAt, setBlogScheduledAt] = useState('');
  const [blogTags, setBlogTags] = useState('');
  const [blogSeoTitle, setBlogSeoTitle] = useState('');
  const [blogSeoDescription, setBlogSeoDescription] = useState('');
  const [blogSeoKeywords, setBlogSeoKeywords] = useState('');
  const [blogAutoSaveStatus, setBlogAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [blogStats, setBlogStats] = useState<any>(null);
  const [blogSearch, setBlogSearch] = useState('');
  const [blogStatusFilter, setBlogStatusFilter] = useState('ALL');
  const [blogCategoryFilter, setBlogCategoryFilter] = useState('ALL');
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  const [isAdminPreviewOpen, setIsAdminPreviewOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [activeBlogSubTab, setActiveBlogSubTab] = useState<'articles' | 'analytics' | 'categories'>('articles');
  const [blogVersions, setBlogVersions] = useState<any[]>([]);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);

  // Hiker Memories moderation states
  const [memoriesList, setMemoriesList] = useState<any[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [memorySearch, setMemorySearch] = useState('');
  const [memoryEventFilter, setMemoryEventFilter] = useState('');
  const [memoryStatusFilter, setMemoryStatusFilter] = useState('ALL');
  const [memorySortBy, setMemorySortBy] = useState('NEWEST');
  const [selectedMemories, setSelectedMemories] = useState<string[]>([]);

  // Admin Official Post form states
  const [isOfficialPostOpen, setIsOfficialPostOpen] = useState(false);
  const [officialEventId, setOfficialEventId] = useState('');
  const [officialCaption, setOfficialCaption] = useState('');
  const [officialImages, setOfficialImages] = useState<string[]>([]);
  const [officialTags, setOfficialTags] = useState('');

  // User Management & Audit Logs states
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [selectedUserSessions, setSelectedUserSessions] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [showSessionsModal, setShowSessionsModal] = useState(false);

  const fetchAdminUsers = async () => {
    setLoadingAdminUsers(true);
    try {
      const data = await api.admin.getUsers(userSearch);
      setAdminUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingAdminUsers(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const data = await api.admin.getAuditLogs();
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const handleToggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await api.admin.toggleUserStatus(id, !currentStatus);
      toast(res.message, 'success');
      fetchAdminUsers();
    } catch (err: any) {
      toast(err.message || 'Failed to update user status.', 'error');
    }
  };

  const handleVerifyUserEmail = async (id: string) => {
    try {
      const res = await api.admin.verifyUserEmail(id);
      toast(res.message, 'success');
      fetchAdminUsers();
    } catch (err: any) {
      toast(err.message || 'Failed to verify user email.', 'error');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.admin.updateUserRole(userId, newRole);
      toast('User role updated successfully', 'success');
      setAdminUsers(adminUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      toast(err.message || 'Failed to update user role.', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account? All booking references, memories, comments, and sessions will be affected.')) return;
    try {
      const res = await api.admin.deleteUser(userId);
      toast(res.message || 'User deleted successfully', 'success');
      setAdminUsers(adminUsers.filter(u => u.id !== userId));
    } catch (err: any) {
      toast(err.message || 'Failed to delete user account.', 'error');
    }
  };

  const handleAdminResetPassword = async (id: string) => {
    try {
      const res = await api.admin.resetUserPassword(id);
      toast(res.message, 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to trigger password reset.', 'error');
    }
  };

  const handleManageSessions = async (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowSessionsModal(true);
    setSelectedUserSessions([]);
    try {
      const data = await api.admin.getUserSessions(userId);
      setSelectedUserSessions(data);
    } catch (err) {
      console.error('Failed to load user sessions:', err);
    }
  };

  const handleRevokeUserSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session?')) return;
    try {
      await api.admin.revokeUserSession(sessionId);
      if (selectedUserId) {
        const data = await api.admin.getUserSessions(selectedUserId);
        setSelectedUserSessions(data);
      }
    } catch (err) {
      console.error('Failed to revoke session:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchAdminUsers();
      fetchAuditLogs();
    }
  }, [activeTab, userSearch]);

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

  const handleDownloadTicketPDF = async (bookingId: string, bookingIdStr: string) => {
    try {
      toast('Generating and downloading PDF ticket...', 'success');
      const blob = await api.bookings.downloadTicketPdf(bookingId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket-${bookingIdStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast(err.message || 'Failed to download ticket.', 'error');
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
        setOrgName(data.companyName || data.organizationName || 'TrekWari');
        setFounderName(data.founderName || 'Atharva Dhawale');
        setOrgEmail(data.email || 'atharvadhawale80@gmail.com');
        setOrgPhone(data.phone || '+91 9322340365');
        setOrgWhatsapp(data.whatsapp || '+91 9322340365');
        setOrgLocation(data.location || 'Kopargaon, Maharashtra, India');
        setLogoUrl(data.logoUrl || '');
        setFaviconUrl(data.faviconUrl || '');
        setTagline(data.tagline || '');
        setHqName(data.hqName || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setState(data.state || '');
        setCountry(data.country || 'India');
        setPincode(data.pincode || '');
        setOfficeTimings(data.officeTimings || '');
        setEmergencyContact(data.emergencyContact || '');
        setGoogleMapsEmbed(data.googleMapsEmbed || '');
        setLatitude(data.latitude ? String(data.latitude) : '');
        setLongitude(data.longitude ? String(data.longitude) : '');
        setFacebook(data.facebook || '');
        setInstagram(data.instagram || '');
        setYoutube(data.youtube || '');
        setLinkedin(data.linkedin || '');
        setTwitter(data.twitter || '');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const fetchBlogsList = async () => {
    setLoadingBlogs(true);
    try {
      const data = await api.blogs.adminAll();
      if (data && data.blogs) {
        setBlogsList(data.blogs);
        setBlogStats(data.stats);
      } else {
        setBlogsList(Array.isArray(data) ? data : []);
      }
      const catData = await api.blogs.categories().catch(() => []);
      setCategoriesList(Array.isArray(catData) ? catData : []);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch blogs.', 'error');
    } finally {
      setLoadingBlogs(false);
    }
  };

  const fetchMemoriesList = async () => {
    setLoadingMemories(true);
    try {
      const data = await api.memories.list(
        memoryEventFilter || undefined,
        memorySearch || undefined,
        memoryStatusFilter === 'ALL' ? undefined : memoryStatusFilter,
        memorySortBy
      );
      setMemoriesList(data);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch memories.', 'error');
    } finally {
      setLoadingMemories(false);
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
    if (activeTab === 'blog') fetchBlogsList();
    if (activeTab === 'memories') {
      fetchMemoriesList();
      fetchTreksList(); // Fetch treks list to populate dropdown
    }
  }, [activeTab, memoryEventFilter, memoryStatusFilter, memorySortBy]);

  useEffect(() => {
    if (activeTab === 'memories') {
      const timer = setTimeout(() => {
        fetchMemoriesList();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [memorySearch]);

  // Auto-save draft timer for articles
  useEffect(() => {
    if (!isBlogFormOpen || !blogTitle) return;

    const timer = setInterval(() => {
      setBlogAutoSaveStatus('saving');
      const draftData = {
        title: blogTitle,
        slug: blogSlug,
        category: blogCategory,
        content: blogContent,
        bannerImage: blogBanner,
        summary: blogSummary,
        readTime: blogReadTime,
        tags: blogTags,
        seoTitle: blogSeoTitle,
        seoDescription: blogSeoDescription,
        seoKeywords: blogSeoKeywords,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('trekwari_article_draft', JSON.stringify(draftData));
      setTimeout(() => setBlogAutoSaveStatus('saved'), 600);
    }, 30000);

    return () => clearInterval(timer);
  }, [isBlogFormOpen, blogTitle, blogSlug, blogCategory, blogContent, blogBanner, blogSummary, blogReadTime, blogTags, blogSeoTitle, blogSeoDescription, blogSeoKeywords]);

  // Check for saved draft on opening form
  const checkAndRestoreDraft = () => {
    const saved = localStorage.getItem('trekwari_article_draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (confirm(`Unsaved draft found from ${new Date(draft.savedAt).toLocaleString()}. Would you like to restore it?`)) {
          setBlogTitle(draft.title || '');
          setBlogSlug(draft.slug || '');
          setBlogCategory(draft.category || 'Trekking');
          setBlogContent(draft.content || '');
          setBlogBanner(draft.bannerImage || '');
          setBlogSummary(draft.summary || '');
          setBlogReadTime(draft.readTime || '');
          setBlogTags(draft.tags || '');
          setBlogSeoTitle(draft.seoTitle || '');
          setBlogSeoDescription(draft.seoDescription || '');
          setBlogSeoKeywords(draft.seoKeywords || '');
        }
      } catch (e) {}
    }
  };

  // Blog / Article CMS Handlers
  const handleCreateOrUpdateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle || !blogContent || !blogBanner) {
      toast('Please fill all required article fields: Title, Content, and Banner Image.', 'error');
      return;
    }

    const payload = {
      title: blogTitle,
      slug: blogSlug,
      content: blogContent,
      bannerImage: blogBanner,
      category: blogCategory,
      summary: blogSummary || blogTitle,
      readTime: blogReadTime,
      isPublished: blogIsPublished,
      isFeatured: blogIsFeatured,
      scheduledAt: blogScheduledAt || null,
      tags: blogTags,
      seoTitle: blogSeoTitle || blogTitle,
      seoDescription: blogSeoDescription || blogSummary || blogTitle,
      seoKeywords: blogSeoKeywords
    };

    try {
      if (editingBlog) {
        await api.blogs.update(editingBlog.id, payload);
        toast('Article modified successfully!', 'success');
      } else {
        await api.blogs.create(payload);
        toast('Article saved/published successfully!', 'success');
      }
      localStorage.removeItem('trekwari_article_draft');
      setIsBlogFormOpen(false);
      setEditingBlog(null);
      resetBlogForm();
      fetchBlogsList();
    } catch (err: any) {
      toast(err.message || 'Failed to save article.', 'error');
    }
  };

  const resetBlogForm = () => {
    setBlogTitle('');
    setBlogSlug('');
    setBlogCategory('Trekking');
    setBlogContent('');
    setBlogBanner('');
    setBlogSummary('');
    setBlogReadTime('');
    setBlogIsPublished(true);
    setBlogIsFeatured(false);
    setBlogScheduledAt('');
    setBlogTags('');
    setBlogSeoTitle('');
    setBlogSeoDescription('');
    setBlogSeoKeywords('');
  };

  const handleEditBlog = (blog: any) => {
    setEditingBlog(blog);
    setBlogTitle(blog.title || '');
    setBlogSlug(blog.slug || '');
    setBlogCategory(blog.category || 'Trekking');
    setBlogContent(blog.content || '');
    setBlogBanner(blog.bannerImage || '');
    setBlogSummary(blog.summary || '');
    setBlogReadTime(blog.readTime || '');
    setBlogIsPublished(Boolean(blog.isPublished));
    setBlogIsFeatured(Boolean(blog.isFeatured));
    setBlogScheduledAt(blog.scheduledAt ? new Date(blog.scheduledAt).toISOString().slice(0, 16) : '');
    setBlogTags(blog.tags || '');
    setBlogSeoTitle(blog.seoTitle || '');
    setBlogSeoDescription(blog.seoDescription || '');
    setBlogSeoKeywords(blog.seoKeywords || '');
    setIsBlogFormOpen(true);
  };

  const handleTogglePublishBlog = async (id: string) => {
    try {
      const res = await api.blogs.togglePublish(id);
      toast(res.message, 'success');
      fetchBlogsList();
    } catch (err: any) {
      toast(err.message || 'Failed to update publish status.', 'error');
    }
  };

  const handleToggleFeaturedBlog = async (id: string) => {
    try {
      const res = await api.blogs.toggleFeatured(id);
      toast(res.message, 'success');
      fetchBlogsList();
    } catch (err: any) {
      toast(err.message || 'Failed to update featured status.', 'error');
    }
  };

  const handleDuplicateBlog = async (id: string) => {
    try {
      const res = await api.blogs.duplicate(id);
      toast('Article duplicated as draft!', 'success');
      fetchBlogsList();
    } catch (err: any) {
      toast(err.message || 'Failed to duplicate article.', 'error');
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;
    try {
      await api.blogs.delete(id);
      toast('Article deleted successfully.', 'success');
      fetchBlogsList();
    } catch (err: any) {
      toast(err.message || 'Failed to delete article.', 'error');
    }
  };

  const handleFetchVersions = async (id: string) => {
    try {
      const data = await api.blogs.versions(id);
      setBlogVersions(data);
      setIsVersionsModalOpen(true);
    } catch (err: any) {
      toast(err.message || 'Failed to load version history.', 'error');
    }
  };

  const handleRestoreVersion = async (blogId: string, versionId: string) => {
    if (!confirm('Restore article to this selected version?')) return;
    try {
      const res = await api.blogs.restoreVersion(blogId, versionId);
      toast(res.message, 'success');
      setIsVersionsModalOpen(false);
      fetchBlogsList();
    } catch (err: any) {
      toast(err.message || 'Failed to restore version.', 'error');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.blogs.createCategory({ name: newCatName.trim(), description: newCatDesc.trim() });
      toast('Category added successfully!', 'success');
      setNewCatName('');
      setNewCatDesc('');
      fetchBlogsList();
    } catch (err: any) {
      toast(err.message || 'Failed to add category.', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.blogs.deleteCategory(id);
      toast('Category removed.', 'success');
      fetchBlogsList();
    } catch (err: any) {
      toast(err.message || 'Failed to delete category.', 'error');
    }
  };

  // Hiker Memories Moderation Handlers
  const handleToggleHideMemory = async (id: string) => {
    try {
      const res = await api.memories.toggleHide(id);
      toast(res.message, 'success');
      fetchMemoriesList();
    } catch (err: any) {
      toast(err.message || 'Failed to change visibility.', 'error');
    }
  };

  const handleTogglePinMemory = async (id: string) => {
    try {
      const res = await api.memories.togglePin(id);
      toast(res.message, 'success');
      fetchMemoriesList();
    } catch (err: any) {
      toast(err.message || 'Failed to change pin status.', 'error');
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory post permanently?')) return;
    try {
      await api.memories.delete(id);
      toast('Memory post deleted permanently.', 'success');
      fetchMemoriesList();
    } catch (err: any) {
      toast(err.message || 'Failed to delete memory.', 'error');
    }
  };

  // Bulk Actions
  const handleBulkMemoriesAction = async (action: 'HIDE' | 'RESTORE' | 'DELETE' | 'PIN') => {
    if (selectedMemories.length === 0) {
      toast('Please select at least one memory post.', 'error');
      return;
    }

    if (action === 'DELETE' && !confirm(`Are you sure you want to permanently delete the ${selectedMemories.length} selected memory posts?`)) {
      return;
    }

    try {
      for (const id of selectedMemories) {
        if (action === 'HIDE') {
          const mem = memoriesList.find(m => m.id === id);
          if (mem && !mem.hidden) await api.memories.toggleHide(id);
        } else if (action === 'RESTORE') {
          const mem = memoriesList.find(m => m.id === id);
          if (mem && mem.hidden) await api.memories.toggleHide(id);
        } else if (action === 'PIN') {
          const mem = memoriesList.find(m => m.id === id);
          if (mem && !mem.pinned) await api.memories.togglePin(id);
        } else if (action === 'DELETE') {
          await api.memories.delete(id);
        }
      }
      toast(`Bulk action completed successfully!`, 'success');
      setSelectedMemories([]);
      fetchMemoriesList();
    } catch (err: any) {
      toast(err.message || 'Error executing bulk action.', 'error');
    }
  };

  // Create Official Memory Post
  const handleCreateOfficialPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialEventId || officialImages.length === 0) {
      toast('Please select a trek/event and upload at least one image.', 'error');
      return;
    }

    try {
      await api.memories.create({
        eventId: officialEventId,
        caption: officialCaption,
        mediaUrls: officialImages,
        mediaType: 'IMAGE',
        tags: officialTags || null
      });

      toast('Official memory post published successfully!', 'success');
      setIsOfficialPostOpen(false);
      setOfficialEventId('');
      setOfficialCaption('');
      setOfficialImages([]);
      setOfficialTags('');
      fetchMemoriesList();
    } catch (err: any) {
      toast(err.message || 'Failed to publish official post.', 'error');
    }
  };

  const handleOfficialImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 8 * 1024 * 1024) {
        toast('Each image must be smaller than 8MB.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setOfficialImages(prev => [...prev, reader.result as string]);
      };
    });
  };

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

    // Validations
    if (!orgName || orgName.trim() === '') {
      toast('Company name is required.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgEmail)) {
      toast('Please enter a valid company email address.', 'error');
      return;
    }
    if (!/^\+?[0-9\s-]{10,15}$/.test(orgPhone)) {
      toast('Please enter a valid 10-15 digit phone number.', 'error');
      return;
    }
    if (orgWhatsapp && !/^\+?[0-9\s-]{10,15}$/.test(orgWhatsapp)) {
      toast('Please enter a valid WhatsApp contact number.', 'error');
      return;
    }
    if (googleMapsEmbed && !googleMapsEmbed.startsWith('http') && !googleMapsEmbed.includes('<iframe')) {
      toast('Please supply a valid Google Maps HTTP link or iframe embed code.', 'error');
      return;
    }
    if (facebook && !facebook.startsWith('http') && facebook.trim() !== '') {
      toast('Facebook profile link must start with http:// or https://', 'error');
      return;
    }
    if (instagram && !instagram.startsWith('http') && instagram.trim() !== '') {
      toast('Instagram profile link must start with http:// or https://', 'error');
      return;
    }
    if (youtube && !youtube.startsWith('http') && youtube.trim() !== '') {
      toast('YouTube channel link must start with http:// or https://', 'error');
      return;
    }

    try {
      await api.settings.update({
        companyName: orgName,
        founderName,
        email: orgEmail,
        phone: orgPhone,
        whatsapp: orgWhatsapp,
        location: orgLocation,
        logoUrl,
        faviconUrl,
        tagline,
        hqName,
        address,
        city,
        state,
        country,
        pincode,
        officeTimings,
        emergencyContact,
        googleMapsEmbed,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        facebook,
        instagram,
        youtube,
        linkedin,
        twitter
      });
      setSettingsSuccess('Company settings updated successfully!');
      toast('Company settings updated successfully!', 'success');
      fetchSettings();
    } catch (err: any) {
      toast(err.message || 'Failed to save settings.', 'error');
    }
  };

  // Admin Profile Photo Editor Handlers
  const { uploadAvatar, removeAvatar, refreshUser } = useAuth();

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size must be smaller than 5MB.');
      return;
    }

    setPhotoError('');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setIsCropModalOpen(true);
      if (e.target) e.target.value = '';
    };
  };

  const handleCropComplete = async (croppedBase64: string) => {
    setIsCropModalOpen(false);
    setIsUploadingPhoto(true);
    setPhotoError('');
    try {
      await uploadAvatar(croppedBase64);
      toast('Profile picture updated successfully!', 'success');
      refreshUser();
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to upload cropped image.');
      toast('Failed to upload profile picture.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;
    setIsUploadingPhoto(true);
    setPhotoError('');
    try {
      await removeAvatar();
      toast('Profile picture removed successfully!', 'success');
      refreshUser();
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to remove profile picture.');
      toast('Failed to remove profile picture.', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (loading || loadingStats || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-orange" />
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
      
      <section className="pt-28 pb-12 bg-primary-orange text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] uppercase font-bold text-sunrise-orange tracking-widest">Admin Control Panel</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display mt-1">TreckWari Platform Dashboard</h1>
        </div>
      </section>

      {/* Main Tabs Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Settings tabs sidebar */}
          <div className="lg:col-span-3 bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm h-fit space-y-1.5">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                activeTab === 'analytics' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-4.5 w-4.5" />
              Business Analytics
            </button>

            <button
              onClick={() => setActiveTab('treks')}
              className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                activeTab === 'treks' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-4.5 w-4.5" />
              Manage Treks (CMS)
            </button>

            <button
              onClick={() => setActiveTab('policies')}
              className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                activeTab === 'policies' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="h-4.5 w-4.5" />
              Trek Policies (CMS)
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                activeTab === 'reviews' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Star className="h-4.5 w-4.5" />
              Review Approvals ({pendingReviews.length})
            </button>

            <button
              onClick={() => setActiveTab('review-analytics')}
              className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                activeTab === 'review-analytics' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Star className="h-4.5 w-4.5" />
              Review Analytics
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                activeTab === 'bookings' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              Manage Bookings
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                activeTab === 'attendance' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <ClipboardList className="h-4.5 w-4.5" />
              Attendance Dashboard
            </button>

            <button
              onClick={() => setActiveTab('scanner')}
              className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                activeTab === 'scanner' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <QrCode className="h-4.5 w-4.5" />
              Attendance Scanner
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                  activeTab === 'users' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <Users className="h-4.5 w-4.5" />
                User & Sessions Control
              </button>
            )}

            <button
              onClick={() => setActiveTab('blog')}
              className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                activeTab === 'blog' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="h-4.5 w-4.5" />
              Manage Articles
            </button>

            <button
              onClick={() => setActiveTab('memories')}
              className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                activeTab === 'memories' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              <Heart className="h-4.5 w-4.5" />
              Hiker Memories
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2.5 px-4 py-3.5 rounded-xl text-left text-xs uppercase font-extrabold tracking-widest transition-all cursor-pointer ${
                  activeTab === 'settings' ? 'bg-primary-orange text-white shadow-md shadow-orange-500/10' : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <SettingsIcon className="h-4.5 w-4.5" />
                Company Settings
              </button>
            )}
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
                    <p className="text-xl font-extrabold text-dark-charcoal mt-1">{stats.summary.totalUsers}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <Calendar className="h-6 w-6 text-sunrise-orange mb-2" />
                    <p className="text-[10px] uppercase font-bold text-gray-400">Paid Bookings</p>
                    <p className="text-xl font-extrabold text-dark-charcoal mt-1">{stats.summary.totalBookings}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <DollarSign className="h-6 w-6 text-sunrise-orange mb-2" />
                    <p className="text-[10px] uppercase font-bold text-gray-400">Total Revenue</p>
                    <p className="text-xl font-extrabold text-dark-charcoal mt-1">₹{stats.summary.totalRevenue}</p>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <Heart className="h-6 w-6 text-sunrise-orange mb-2" />
                    <p className="text-[10px] uppercase font-bold text-gray-400">Conversion</p>
                    <p className="text-xl font-extrabold text-dark-charcoal mt-1">{stats.summary.conversionRate}%</p>
                  </div>
                </div>

                {/* Line Chart Card */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <h4 className="text-sm font-bold text-dark-charcoal font-display mb-4">Revenue Chart (INR)</h4>
                  <div className="h-64 sm:h-80">
                    <Line data={revenueChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                  </div>
                </div>
              </div>
            )}
            {/* Trek CMS CRUD Tab */}
            {activeTab === 'treks' && (
              <TrekCMSManager policies={policies} />
            )}

            {activeTab === 'attendance' && (
              <AdminAttendanceDashboard />
            )}

            {activeTab === 'scanner' && (
              <AdminAttendanceScanner />
            )}

            {activeTab === 'review-analytics' && (
              <AdminReviewAnalytics />
            )}

            {/* Trek Policies CMS Tab */}
            {activeTab === 'policies' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="text-base font-bold text-dark-charcoal font-display">Trek Policies & Preparation CMS</h3>
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
                      className="bg-primary-orange text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create Template
                    </button>
                  )}
                </div>

                {showPolicyForm ? (
                  /* Form configuration */
                  <form onSubmit={handleSavePolicy} className="space-y-6 border border-gray-150 p-5 rounded-2xl bg-gray-50 text-xs text-gray-600">
                    <h4 className="text-sm font-bold text-dark-charcoal border-b border-gray-100 pb-2">Policy Settings Details</h4>
                    
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
                      <h4 className="font-bold text-dark-charcoal font-display border-b border-gray-50 pb-1.5">Participant Responsibility Letter</h4>
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
                      <h4 className="font-bold text-dark-charcoal font-display border-b border-gray-50 pb-1.5">Things to Carry Checklist</h4>
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
                          className="bg-primary-orange text-white px-3 py-1.5 rounded-lg font-bold"
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
                              <button type="button" onClick={() => moveCarryItem(idx, 'up')} className="p-1 text-gray-400 hover:text-dark-charcoal">
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" onClick={() => moveCarryItem(idx, 'down')} className="p-1 text-gray-400 hover:text-dark-charcoal">
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
                      <h4 className="font-bold text-dark-charcoal font-display border-b border-gray-50 pb-1.5">Things Not Allowed (Prohibited)</h4>
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
                          className="bg-primary-orange text-white px-3 py-1.5 rounded-lg font-bold"
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
                      <h4 className="font-bold text-dark-charcoal font-display border-b border-gray-50 pb-1.5">Cancellation & Refund Policies</h4>
                      
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
                          className="bg-primary-orange text-white px-3 py-1.5 rounded-lg font-bold"
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
                      <h4 className="font-bold text-dark-charcoal font-display border-b border-gray-50 pb-1.5">Downloadable Documents URLs</h4>
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
                      <button type="submit" className="bg-primary-orange text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md">
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
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-orange" />
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
                            <td className="p-3 font-semibold text-dark-charcoal">{p.title}</td>
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
                              <button onClick={() => handleEditPolicy(p)} className="p-1 text-gray-400 hover:text-dark-charcoal" title="Edit">
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
                <h3 className="text-base font-bold text-dark-charcoal font-display border-b border-gray-50 pb-3">Pending Roster Reviews</h3>
                {loadingReviews ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-orange" />
                  </div>
                ) : pendingReviews.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No reviews pending approval.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingReviews.map((rev) => (
                      <div key={rev.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-dark-charcoal">{rev.user.name} reviewed <strong>{rev.event.title}</strong></p>
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
                  <h3 className="text-base font-bold text-dark-charcoal font-display">Manage Bookings & Terms Auditing</h3>
                  <button 
                    onClick={fetchBookingsList}
                    className="text-xs text-dark-charcoal hover:underline font-bold"
                  >
                    Refresh List
                  </button>
                </div>

                {loadingBookings ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-orange" />
                  </div>
                ) : bookings.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-12">No bookings found in the system.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 uppercase font-extrabold tracking-wider">
                          <th className="p-3">Booking ID</th>
                          <th className="p-3">Trek Name</th>
                          <th className="p-3">Booking User</th>
                          <th className="p-3 text-center">Participants</th>
                          <th className="p-3">Amount Paid</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-center">Remaining Seats</th>
                          <th className="p-3">Booking Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-gray-700">
                        {bookings.map((booking: any) => (
                          <tr 
                            key={booking.id} 
                            onClick={() => setSelectedBooking(booking)} 
                            className="hover:bg-orange-50/35 cursor-pointer transition-colors"
                          >
                            <td className="p-3">
                              <span className="font-extrabold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded border border-orange-100/50">
                                {booking.bookingId}
                              </span>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-dark-charcoal">{booking.event.title}</p>
                              <p className="text-[9px] text-gray-400">Exp: {new Date(booking.event.startDate).toLocaleDateString()}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-gray-900">{booking.user.name}</p>
                              <p className="text-[9px] text-gray-400">{booking.user.email}</p>
                            </td>
                            <td className="p-3 text-center">
                              <p className="font-extrabold text-gray-800">{booking.seatCount}</p>
                            </td>
                            <td className="p-3">
                              <p className="font-extrabold text-dark-charcoal">₹{booking.totalAmount.toFixed(2)}</p>
                            </td>
                            <td className="p-3">
                              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                booking.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {booking.paymentStatus}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <p className="font-semibold text-gray-600">{booking.event.availableSeats}</p>
                            </td>
                            <td className="p-3">
                              <p className="text-gray-500 font-semibold">{new Date(booking.createdAt).toLocaleDateString()}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Booking Detail Modal */}
                {selectedBooking && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-150 shadow-2xl p-6 sm:p-8 space-y-6 relative max-h-[90vh] overflow-y-auto no-scrollbar">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <div>
                          <h3 className="text-sm font-extrabold text-dark-charcoal font-display uppercase tracking-wider">Booking Details</h3>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">ID: {selectedBooking.bookingId} | Booked on: {new Date(selectedBooking.createdAt).toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedBooking(null)}
                          className="text-gray-400 hover:text-dark-charcoal font-bold text-xs uppercase cursor-pointer"
                        >
                          Close
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-6 text-xs text-gray-600 font-semibold">
                        <div className="space-y-2.5">
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1">Trek & Booking Info</p>
                          <p><span className="text-gray-400">Trek Name:</span> <strong className="text-dark-charcoal">{selectedBooking.event.title}</strong></p>
                          <p><span className="text-gray-400">Trek Date:</span> {new Date(selectedBooking.event.startDate).toLocaleDateString()}</p>
                          <p><span className="text-gray-400">Primary Hiker:</span> {selectedBooking.user.name} ({selectedBooking.user.email})</p>
                          <p><span className="text-gray-400">Seats Booked:</span> {selectedBooking.seatCount} Seat(s)</p>
                          <p><span className="text-gray-400">Amount Paid:</span> <strong className="text-primary-orange">INR {selectedBooking.totalAmount.toFixed(2)}</strong></p>
                          <p><span className="text-gray-400">Payment Status:</span> 
                            <span className={`ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                              selectedBooking.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>{selectedBooking.paymentStatus}</span>
                          </p>
                          <p><span className="text-gray-400">Remaining Event Seats:</span> {selectedBooking.event.availableSeats}</p>
                        </div>

                        <div className="space-y-2.5">
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1">SOS Emergency Contact</p>
                          <p><span className="text-gray-400">Contact Name:</span> {selectedBooking.emergencyName || 'N/A'}</p>
                          <p><span className="text-gray-400">Relationship:</span> {selectedBooking.emergencyRelationship || 'N/A'}</p>
                          <p><span className="text-gray-400">Mobile Phone:</span> {selectedBooking.emergencyContact}</p>
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1 pt-2">Medical Disclosures</p>
                          <p>{selectedBooking.medicalDetails || 'No chronic health issues or disclosures reported.'}</p>
                        </div>
                      </div>

                      {/* Participants list */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1">Participants List ({selectedBooking.members?.length || 0})</p>
                        <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1 no-scrollbar">
                          {selectedBooking.members?.map((m: any, idx: number) => (
                            <div key={m.id || idx} className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-2 text-xs">
                              <div className="flex justify-between items-center border-b border-gray-250/40 pb-1.5">
                                <span className="font-extrabold text-primary-orange uppercase tracking-wider">Hiker {idx + 1}: {m.name}</span>
                                <span className={`text-[10px] font-bold ${m.checkedIn ? 'text-emerald-600' : 'text-amber-500'}`}>
                                  {m.checkedIn ? '✓ Boarded (Checked-in)' : '⏳ Boarding Pending'}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] text-gray-500 font-semibold">
                                <p><span className="text-gray-400">Age / Gender:</span> {m.age} Years | {m.gender}</p>
                                <p><span className="text-gray-400">Mobile:</span> {m.phone || 'N/A'}</p>
                                <p><span className="text-gray-400">Email:</span> {m.email || 'N/A'}</p>
                                <p><span className="text-gray-400">Blood Group:</span> {m.bloodGroup || 'N/A'}</p>
                                <p><span className="text-gray-400">Fitness:</span> {m.fitnessLevel || 'Average'}</p>
                                <p><span className="text-gray-400">Bus / Seat:</span> {m.busNumber || 'Bus 1'} / {m.seatNumber || 'Auto'}</p>
                                <p className="col-span-2"><span className="text-gray-400">ID Proof:</span> {m.idProofType || 'Aadhaar'} - <strong>{m.idProofNumber || 'N/A'}</strong></p>
                              </div>
                              {m.medicalConditions && (
                                <p className="text-[10px] text-red-700 bg-red-50 p-1.5 rounded">
                                  <strong>Medical condition:</strong> {m.medicalConditions} {m.allergies ? `| Allergies: ${m.allergies}` : ''}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ticket PDF Actions */}
                      <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                        <span className="text-[10px] text-gray-400 font-bold">Audit IP: {selectedBooking.ipAddress || 'N/A'}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadTicketPDF(selectedBooking.id, selectedBooking.bookingId)}
                            className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
                          >
                            Download PDF Ticket
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(null)}
                            className="bg-gray-100 hover:bg-gray-200 text-dark-charcoal font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Company settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Admin Profile photo card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-dark-charcoal font-display border-b border-gray-50 pb-3">My Profile Picture</h3>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="h-20 w-20 rounded-full border-2 border-primary-orange overflow-hidden bg-gray-50 flex items-center justify-center font-bold text-dark-charcoal text-3xl shadow-sm">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          user?.name?.charAt(0) || 'A'
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
                    <div className="space-y-1 text-center sm:text-left">
                      <p className="text-xs font-bold text-dark-charcoal">{user?.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user?.role}</p>
                      {user?.avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="mt-2 text-[10px] font-black uppercase text-red-500 hover:underline cursor-pointer border-none bg-transparent"
                        >
                          Remove Profile Picture
                        </button>
                      )}
                    </div>
                  </div>
                  {photoError && (
                    <p className="text-xs text-red-500 font-semibold">{photoError}</p>
                  )}
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-dark-charcoal font-display border-b border-gray-50 pb-3">Company Settings</h3>
                  {settingsSuccess && (
                    <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs px-4 py-2.5 rounded-xl">
                      {settingsSuccess}
                    </div>
                  )}
                  
                  <form onSubmit={handleSaveSettings} className="space-y-6">
                    {/* Section 1: Company Profile */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary-orange">1. Company Profile</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Company Name</label>
                          <input
                            type="text"
                            required
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none focus:border-primary-orange"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tagline / Motto</label>
                          <input
                            type="text"
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Company Logo (URL)</label>
                          <input
                            type="text"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="/logo.png"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Contact Coordinates */}
                    <div className="space-y-4 pt-4 border-t border-gray-50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary-orange">2. Contact Coordinates</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Primary Phone</label>
                          <input
                            type="text"
                            required
                            value={orgPhone}
                            onChange={(e) => setOrgPhone(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">WhatsApp Number</label>
                          <input
                            type="text"
                            value={orgWhatsapp}
                            onChange={(e) => setOrgWhatsapp(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Official Email</label>
                          <input
                            type="email"
                            required
                            value={orgEmail}
                            onChange={(e) => setOrgEmail(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Emergency Hotline</label>
                          <input
                            type="text"
                            value={emergencyContact}
                            onChange={(e) => setEmergencyContact(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Headquarters Address */}
                    <div className="space-y-4 pt-4 border-t border-gray-50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary-orange">3. Headquarters Location & Address</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Basecamp/HQ Name</label>
                          <input
                            type="text"
                            value={hqName}
                            onChange={(e) => setHqName(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="TrekWari HQ Basecamp"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Timings / Office Hours</label>
                          <input
                            type="text"
                            value={officeTimings}
                            onChange={(e) => setOfficeTimings(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="9:00 AM - 6:00 PM (Mon-Sat)"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Street Address</label>
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">City</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">State</label>
                          <input
                            type="text"
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pincode</label>
                          <input
                            type="text"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Country</label>
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Latitude</label>
                          <input
                            type="text"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="19.892403"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Longitude</label>
                          <input
                            type="text"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="74.469796"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Google Maps Embed Link (iframe src)</label>
                          <input
                            type="text"
                            value={googleMapsEmbed}
                            onChange={(e) => setGoogleMapsEmbed(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="https://www.google.com/maps/embed?..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Social Media */}
                    <div className="space-y-4 pt-4 border-t border-gray-50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary-orange">4. Social Media Links</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Facebook Profile</label>
                          <input
                            type="text"
                            value={facebook}
                            onChange={(e) => setFacebook(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="https://facebook.com/..."
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Instagram Profile</label>
                          <input
                            type="text"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="https://instagram.com/..."
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">YouTube Channel</label>
                          <input
                            type="text"
                            value={youtube}
                            onChange={(e) => setYoutube(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="https://youtube.com/..."
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">LinkedIn Profile</label>
                          <input
                            type="text"
                            value={linkedin}
                            onChange={(e) => setLinkedin(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">X (Twitter)</label>
                          <input
                            type="text"
                            value={twitter}
                            onChange={(e) => setTwitter(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="https://twitter.com/..."
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl shadow-md transition-colors w-full cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Manage Articles (Blog CMS) */}
            {activeTab === 'blog' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* CMS Sub-Tab Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveBlogSubTab('articles')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                        activeBlogSubTab === 'articles' ? 'bg-primary-orange text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📰 Articles List ({blogsList.length})
                    </button>
                    <button
                      onClick={() => setActiveBlogSubTab('analytics')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                        activeBlogSubTab === 'analytics' ? 'bg-primary-orange text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      📊 Analytics & Stats
                    </button>
                    <button
                      onClick={() => setActiveBlogSubTab('categories')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                        activeBlogSubTab === 'categories' ? 'bg-primary-orange text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      🏷️ Categories ({categoriesList.length})
                    </button>
                  </div>

                  {activeBlogSubTab === 'articles' && !isBlogFormOpen && (
                    <button
                      onClick={() => {
                        setEditingBlog(null);
                        resetBlogForm();
                        checkAndRestoreDraft();
                        setIsBlogFormOpen(true);
                      }}
                      className="flex items-center gap-1.5 bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create New Article</span>
                    </button>
                  )}
                </div>

                {/* Sub-Tab 1: Articles List or Form */}
                {activeBlogSubTab === 'articles' && (
                  <>
                    {isBlogFormOpen ? (
                      /* Blog Create/Edit Form */
                      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                        <div className="flex flex-wrap items-center justify-between border-b border-gray-150 pb-4 gap-4">
                          <div>
                            <h3 className="text-base font-extrabold text-dark-charcoal font-display">
                              {editingBlog ? '✏️ Edit Article' : '✍️ Create New Article'}
                            </h3>
                            <p className="text-xs text-gray-400 font-semibold">Authoring and SEO configuration</p>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Auto Save Status Indicator */}
                            <span className="text-xs font-bold flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                              {blogAutoSaveStatus === 'saved' && <span className="text-emerald-600 font-extrabold">🟢 Saved</span>}
                              {blogAutoSaveStatus === 'saving' && <span className="text-amber-500 font-extrabold animate-pulse">🟡 Saving...</span>}
                              {blogAutoSaveStatus === 'unsaved' && <span className="text-red-500 font-extrabold">🔴 Unsaved Changes</span>}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setIsBlogFormOpen(false);
                                setEditingBlog(null);
                              }}
                              className="text-xs font-bold text-gray-400 hover:text-dark-charcoal uppercase tracking-wider cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>

                        <form onSubmit={handleCreateOrUpdateBlog} className="space-y-6">
                          
                          {/* Title & Slug */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Article Title *</label>
                              <input
                                type="text"
                                required
                                value={blogTitle}
                                onChange={(e) => {
                                  setBlogTitle(e.target.value);
                                  setBlogAutoSaveStatus('unsaved');
                                  if (!editingBlog) {
                                    setBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                                  }
                                }}
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-white focus:outline-none focus:border-primary-orange"
                                placeholder="e.g. Essential Gear Checklist for Harishchandragad Trek"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">URL Slug (Path)</label>
                              <input
                                type="text"
                                required
                                value={blogSlug}
                                onChange={(e) => { setBlogSlug(e.target.value); setBlogAutoSaveStatus('unsaved'); }}
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono bg-white focus:outline-none focus:border-primary-orange"
                                placeholder="harishchandragad-gear-checklist"
                              />
                            </div>
                          </div>

                          {/* Category, Banner & Estimated Read Time */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>
                              <select
                                value={blogCategory}
                                onChange={(e) => { setBlogCategory(e.target.value); setBlogAutoSaveStatus('unsaved'); }}
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold bg-white focus:outline-none focus:border-primary-orange cursor-pointer"
                              >
                                {categoriesList.map((cat: any) => (
                                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                                <option value="Trekking">Trekking</option>
                                <option value="Trek Guides">Trek Guides</option>
                                <option value="Travel Tips">Travel Tips</option>
                                <option value="Safety">Safety</option>
                                <option value="Adventure Stories">Adventure Stories</option>
                                <option value="Equipment">Equipment</option>
                                <option value="Announcements">Announcements</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Banner Image *</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={blogBanner}
                                  onChange={(e) => { setBlogBanner(e.target.value); setBlogAutoSaveStatus('unsaved'); }}
                                  placeholder="Image URL or upload..."
                                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none focus:border-primary-orange"
                                />
                                <button
                                  type="button"
                                  onClick={() => setIsImageLibraryOpen(true)}
                                  className="bg-gray-100 hover:bg-gray-200 text-dark-charcoal text-[10px] font-extrabold px-3 py-2.5 rounded-xl whitespace-nowrap border border-gray-200"
                                >
                                  Library
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Read Time (Auto / Override)</label>
                              <input
                                type="text"
                                value={blogReadTime}
                                onChange={(e) => { setBlogReadTime(e.target.value); setBlogAutoSaveStatus('unsaved'); }}
                                placeholder="Auto-calculated e.g. 5 min read"
                                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:border-primary-orange"
                              />
                            </div>
                          </div>

                          {/* Article Body with Rich Text Formatting Bar */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Article Body Content *</label>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditorTab('write')}
                                  className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg cursor-pointer ${
                                    editorTab === 'write' ? 'bg-primary-orange text-white' : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  Write
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditorTab('preview')}
                                  className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg cursor-pointer ${
                                    editorTab === 'preview' ? 'bg-primary-orange text-white' : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  Preview
                                </button>
                              </div>
                            </div>

                            {editorTab === 'write' ? (
                              <div>
                                {/* Rich Text Toolbar */}
                                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 border border-b-0 border-gray-200 rounded-t-xl">
                                  {[
                                    { label: 'H1', tag: '<h1>', closeTag: '</h1>' },
                                    { label: 'H2', tag: '<h2>', closeTag: '</h2>' },
                                    { label: 'H3', tag: '<h3>', closeTag: '</h3>' },
                                    { label: 'Bold', tag: '<strong>', closeTag: '</strong>' },
                                    { label: 'Italic', tag: '<em>', closeTag: '</em>' },
                                    { label: 'Underline', tag: '<u>', closeTag: '</u>' },
                                    { label: 'Highlight', tag: '<mark>', closeTag: '</mark>' },
                                    { label: 'Bullet List', tag: '<ul>\n  <li>', closeTag: '</li>\n</ul>' },
                                    { label: 'Num List', tag: '<ol>\n  <li>', closeTag: '</li>\n</ol>' },
                                    { label: 'Quote', tag: '<blockquote>', closeTag: '</blockquote>' },
                                    { label: 'Divider', tag: '<hr />', closeTag: '' },
                                    { label: 'Table', tag: '<table>\n  <thead>\n    <tr><th>Feature</th><th>Details</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Item 1</td><td>Info 1</td></tr>\n  </tbody>\n</table>', closeTag: '' },
                                    { label: 'YouTube Embed', tag: '<iframe width="100%" height="360" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>', closeTag: '' },
                                    { label: 'Google Map', tag: '<iframe width="100%" height="300" src="https://maps.google.com/maps?q=Kalsubai&t=&z=13&ie=UTF8&iwloc=&output=embed" frameborder="0"></iframe>', closeTag: '' }
                                  ].map((btn, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        const textarea = document.getElementById('blog-content-area') as HTMLTextAreaElement;
                                        if (textarea) {
                                          const start = textarea.selectionStart;
                                          const end = textarea.selectionEnd;
                                          const text = textarea.value;
                                          const selected = text.substring(start, end);
                                          const replacement = btn.tag + selected + btn.closeTag;
                                          setBlogContent(text.substring(0, start) + replacement + text.substring(end));
                                          setBlogAutoSaveStatus('unsaved');
                                          setTimeout(() => {
                                            textarea.focus();
                                            textarea.setSelectionRange(start + btn.tag.length, start + btn.tag.length + selected.length);
                                          }, 50);
                                        }
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-white border border-gray-200 rounded hover:bg-gray-150 text-dark-charcoal cursor-pointer"
                                    >
                                      {btn.label}
                                    </button>
                                  ))}
                                </div>

                                <textarea
                                  id="blog-content-area"
                                  rows={14}
                                  required
                                  value={blogContent}
                                  onChange={(e) => { setBlogContent(e.target.value); setBlogAutoSaveStatus('unsaved'); }}
                                  className="w-full border border-gray-200 border-t-0 rounded-b-xl p-4 text-xs font-mono bg-white focus:outline-none focus:border-primary-orange"
                                  placeholder="Write HTML or plain text body..."
                                />
                              </div>
                            ) : (
                              <div className="border border-gray-200 rounded-xl p-6 bg-white max-h-96 overflow-y-auto rich-text text-xs space-y-3">
                                <div dangerouslySetInnerHTML={{ __html: blogContent || '<p className="text-gray-400 italic">No content written yet.</p>' }} />
                              </div>
                            )}
                          </div>

                          {/* Summary & Excerpt */}
                          <div>
                            <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">Short Summary / Excerpt</label>
                            <textarea
                              rows={2}
                              value={blogSummary}
                              onChange={(e) => { setBlogSummary(e.target.value); setBlogAutoSaveStatus('unsaved'); }}
                              className="w-full border border-gray-200 rounded-xl p-3 text-xs bg-white focus:outline-none focus:border-primary-orange"
                              placeholder="Brief summary displayed on article card..."
                            />
                          </div>

                          {/* Status Toggles & Schedule Picker */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={blogIsPublished}
                                onChange={(e) => { setBlogIsPublished(e.target.checked); setBlogAutoSaveStatus('unsaved'); }}
                                className="rounded text-primary-orange focus:ring-primary-orange h-4 w-4"
                              />
                              <span className="text-xs font-bold text-dark-charcoal">Publish Immediately</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={blogIsFeatured}
                                onChange={(e) => { setBlogIsFeatured(e.target.checked); setBlogAutoSaveStatus('unsaved'); }}
                                className="rounded text-primary-orange focus:ring-primary-orange h-4 w-4"
                              />
                              <span className="text-xs font-bold text-dark-charcoal">Pin as Featured Banner</span>
                            </label>

                            <div>
                              <label className="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Schedule Publication (Optional)</label>
                              <input
                                type="datetime-local"
                                value={blogScheduledAt}
                                onChange={(e) => { setBlogScheduledAt(e.target.value); setBlogAutoSaveStatus('unsaved'); }}
                                className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs bg-white focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* SEO Configuration & Live Google Preview */}
                          <div className="space-y-4 border-t border-gray-150 pt-4">
                            <h4 className="text-xs font-extrabold text-dark-charcoal font-display uppercase tracking-wider">SEO & Metadata Settings</h4>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">SEO Title</label>
                                <input
                                  type="text"
                                  value={blogSeoTitle}
                                  onChange={(e) => { setBlogSeoTitle(e.target.value); setBlogAutoSaveStatus('unsaved'); }}
                                  placeholder="e.g. Harishchandragad Trek Prep | TrekWari"
                                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">SEO Keywords (Comma Separated)</label>
                                <input
                                  type="text"
                                  value={blogSeoKeywords}
                                  onChange={(e) => { setBlogSeoKeywords(e.target.value); setBlogAutoSaveStatus('unsaved'); }}
                                  placeholder="trek, sahyadri, monsoon, camping"
                                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Meta Description</label>
                              <textarea
                                rows={2}
                                value={blogSeoDescription}
                                onChange={(e) => { setBlogSeoDescription(e.target.value); setBlogAutoSaveStatus('unsaved'); }}
                                placeholder="Summary snippet shown in Google Search results..."
                                className="w-full border border-gray-200 rounded-xl p-3 text-xs bg-white focus:outline-none"
                              />
                            </div>

                            {/* Live Google Search Preview Box */}
                            <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm space-y-1">
                              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">Google Search Live Preview</p>
                              <p className="text-sm font-bold text-blue-800 hover:underline cursor-pointer truncate">
                                {blogSeoTitle || blogTitle || 'Article Title | TrekWari'}
                              </p>
                              <p className="text-[11px] text-emerald-700 font-mono truncate">
                                www.trekwari.com/blog/{blogSlug || 'article-slug'}
                              </p>
                              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                {blogSeoDescription || blogSummary || 'Learn everything about this trek including route maps, difficulty, cost, and safety instructions.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-4 pt-2">
                            <button
                              type="submit"
                              className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-md transition-colors w-full cursor-pointer"
                            >
                              {editingBlog ? 'Update Article' : 'Save & Publish Article'}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      /* Articles Table View */
                      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                          <div>
                            <h3 className="text-base font-extrabold text-dark-charcoal font-display">Article Management CMS</h3>
                            <p className="text-xs text-gray-400 font-semibold">Total {blogsList.length} articles</p>
                          </div>

                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <input
                              type="text"
                              value={blogSearch}
                              onChange={(e) => setBlogSearch(e.target.value)}
                              placeholder="Search title..."
                              className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:bg-white focus:outline-none"
                            />
                            <select
                              value={blogStatusFilter}
                              onChange={(e) => setBlogStatusFilter(e.target.value)}
                              className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold bg-gray-50 focus:outline-none cursor-pointer"
                            >
                              <option value="ALL">All Status</option>
                              <option value="PUBLISHED">Published</option>
                              <option value="DRAFT">Draft</option>
                              <option value="FEATURED">Featured</option>
                            </select>
                          </div>
                        </div>

                        {loadingBlogs ? (
                          <div className="text-center py-12 space-y-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-orange mx-auto" />
                            <p className="text-xs text-gray-400 font-bold uppercase">Loading article catalog...</p>
                          </div>
                        ) : blogsList.length === 0 ? (
                          <div className="text-center py-16 text-gray-400 font-semibold text-xs space-y-3">
                            <BookOpen className="h-10 w-10 text-gray-300 mx-auto" />
                            <p>No articles match your criteria.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-extrabold uppercase tracking-wider">
                                  <th className="p-3">Banner</th>
                                  <th className="p-3">Title / Category</th>
                                  <th className="p-3">Status</th>
                                  <th className="p-3">Author</th>
                                  <th className="p-3 text-center">Stats</th>
                                  <th className="p-3">Date</th>
                                  <th className="p-3 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {blogsList
                                  .filter((b) => {
                                    if (blogStatusFilter === 'PUBLISHED') return b.isPublished;
                                    if (blogStatusFilter === 'DRAFT') return !b.isPublished;
                                    if (blogStatusFilter === 'FEATURED') return b.isFeatured;
                                    return true;
                                  })
                                  .filter((b) => !blogSearch || b.title.toLowerCase().includes(blogSearch.toLowerCase()))
                                  .map((blog) => (
                                    <tr key={blog.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                      <td className="p-3">
                                        <img
                                          src={blog.bannerImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400'}
                                          alt=""
                                          className="h-10 w-16 object-cover rounded-lg border border-gray-200"
                                        />
                                      </td>
                                      <td className="p-3">
                                        <div className="flex items-center gap-2">
                                          <p className="font-extrabold text-dark-charcoal line-clamp-1">{blog.title}</p>
                                          {blog.isFeatured && (
                                            <span className="bg-primary-orange text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Featured</span>
                                          )}
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-500 uppercase">{blog.category}</span>
                                      </td>
                                      <td className="p-3">
                                        {blog.isPublished ? (
                                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                                            PUBLISHED
                                          </span>
                                        ) : (
                                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                                            DRAFT
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-3 font-semibold text-gray-600">{blog.author?.name || 'TrekWari Lead'}</td>
                                      <td className="p-3 text-center">
                                        <div className="flex items-center justify-center gap-3 text-[10px] text-gray-500 font-bold">
                                          <span>👁️ {blog.views || 0}</span>
                                          <span>👍 {blog.likes || 0}</span>
                                          <span>💬 {blog._count?.comments || 0}</span>
                                        </div>
                                      </td>
                                      <td className="p-3 text-gray-400">{new Date(blog.createdAt).toLocaleDateString()}</td>
                                      <td className="p-3">
                                        <div className="flex justify-center gap-2">
                                          <button
                                            onClick={() => handleToggleFeaturedBlog(blog.id)}
                                            className={`p-1.5 rounded cursor-pointer ${blog.isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-gray-300 hover:text-amber-500'}`}
                                            title="Toggle Featured Pin"
                                          >
                                            ⭐
                                          </button>
                                          <button
                                            onClick={() => handleTogglePublishBlog(blog.id)}
                                            className="p-1.5 text-gray-400 hover:text-emerald-600 cursor-pointer"
                                            title="Toggle Publish Status"
                                          >
                                            🌐
                                          </button>
                                          <button
                                            onClick={() => handleEditBlog(blog)}
                                            className="p-1.5 text-gray-400 hover:text-dark-charcoal cursor-pointer"
                                            title="Edit Article"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDuplicateBlog(blog.id)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 cursor-pointer"
                                            title="Duplicate Article"
                                          >
                                            <Copy className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => handleFetchVersions(blog.id)}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 cursor-pointer text-[10px] font-bold"
                                            title="Version History"
                                          >
                                            vHistory
                                          </button>
                                          <button
                                            onClick={() => handleDeleteBlog(blog.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
                                            title="Delete Article"
                                          >
                                            <Trash className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Sub-Tab 2: Analytics Dashboard */}
                {activeBlogSubTab === 'analytics' && blogStats && (
                  <div className="space-y-6">
                    {/* Stat Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Total Articles</p>
                        <p className="text-2xl font-extrabold text-dark-charcoal">{blogStats.totalArticles}</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Published</p>
                        <p className="text-2xl font-extrabold text-emerald-700">{blogStats.published}</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500">Drafts</p>
                        <p className="text-2xl font-extrabold text-amber-600">{blogStats.drafts}</p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-500">Total Article Views</p>
                        <p className="text-2xl font-extrabold text-sky-600">{blogStats.totalViews}</p>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                      <h3 className="text-sm font-extrabold text-dark-charcoal font-display uppercase tracking-wider">Top Categories Breakdown</h3>
                      <div className="space-y-3">
                        {blogStats.topCategories?.map((cat: any, i: number) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-dark-charcoal">
                              <span>{cat.name}</span>
                              <span>{cat.count} articles</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-orange" style={{ width: `${Math.min(100, (cat.count / (blogStats.totalArticles || 1)) * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 3: Category Management */}
                {activeBlogSubTab === 'categories' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                      <h3 className="text-sm font-extrabold text-dark-charcoal font-display">Add New Category</h3>
                      <form onSubmit={handleCreateCategory} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Category Name *</label>
                          <input
                            type="text"
                            required
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2 text-xs bg-white focus:outline-none"
                            placeholder="e.g. Wilderness Safety"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                          <textarea
                            rows={3}
                            value={newCatDesc}
                            onChange={(e) => setNewCatDesc(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl p-3 text-xs bg-white focus:outline-none"
                            placeholder="Optional category description..."
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md w-full cursor-pointer"
                        >
                          Add Category
                        </button>
                      </form>
                    </div>

                    <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-4">
                      <h3 className="text-sm font-extrabold text-dark-charcoal font-display">Existing Categories ({categoriesList.length})</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {categoriesList.map((cat: any) => (
                          <div key={cat.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-150">
                            <div>
                              <p className="text-xs font-bold text-dark-charcoal">{cat.name}</p>
                              {cat.description && <p className="text-[10px] text-gray-400 font-medium">{cat.description}</p>}
                            </div>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500 text-xs p-1">
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Hiker Memories Moderation Tab */}
            {activeTab === 'memories' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Official Post Publisher card */}
                {isOfficialPostOpen ? (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                      <h3 className="text-base font-bold text-dark-charcoal font-display">🏔️ Publish Official TrekWari Memory</h3>
                      <button onClick={() => setIsOfficialPostOpen(false)} className="text-xs font-bold text-gray-400 hover:text-dark-charcoal uppercase tracking-wider cursor-pointer">Cancel</button>
                    </div>

                    <form onSubmit={handleCreateOfficialPost} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Connected Trek (Event)</label>
                        <select
                          required
                          value={officialEventId}
                          onChange={(e) => setOfficialEventId(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                        >
                          <option value="">-- Select Trek Event --</option>
                          {events.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.title} ({new Date(t.startDate).toLocaleDateString()})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Caption (Support Emojis & Hashtags)</label>
                        <textarea
                          rows={3}
                          value={officialCaption}
                          onChange={(e) => setOfficialCaption(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl p-3 text-xs bg-white focus:outline-none focus:border-primary-orange"
                          placeholder="Explore the Sahyadris with our leaders! 🌄 #trekwari #kalsubai"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tags (Comma-separated)</label>
                          <input
                            type="text"
                            value={officialTags}
                            onChange={(e) => setOfficialTags(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs bg-white focus:outline-none"
                            placeholder="Monsoon, Sahyadri, Summit"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Images Upload (Select Multiple)</label>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleOfficialImageUpload}
                            className="text-xs text-gray-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Preview uploaded images */}
                      {officialImages.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                          {officialImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square border border-gray-200 rounded-xl overflow-hidden group">
                              <img src={img} alt="" className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setOfficialImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl shadow-md transition-colors w-full cursor-pointer"
                      >
                        Publish Official Post
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Memories Moderation Panel */
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-50 pb-3">
                      <h3 className="text-base font-bold text-dark-charcoal font-display">Hiker Memories Moderation</h3>
                      <button
                        onClick={() => {
                          setOfficialImages([]);
                          setOfficialCaption('');
                          setOfficialEventId('');
                          setOfficialTags('');
                          setIsOfficialPostOpen(true);
                        }}
                        className="flex items-center gap-1.5 bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create Official Post</span>
                      </button>
                    </div>

                    {/* Filter toolbar */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-150">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Search caption / uploader</label>
                        <input
                          type="text"
                          value={memorySearch}
                          onChange={(e) => setMemorySearch(e.target.value)}
                          placeholder="Search..."
                          className="w-full border border-gray-250 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Trek / Event</label>
                        <select
                          value={memoryEventFilter}
                          onChange={(e) => setMemoryEventFilter(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none"
                        >
                          <option value="">All Treks</option>
                          {events.map((t: any) => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status Filter</label>
                        <select
                          value={memoryStatusFilter}
                          onChange={(e) => setMemoryStatusFilter(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none"
                        >
                          <option value="ALL">All Posts</option>
                          <option value="VISIBLE">Visible Only</option>
                          <option value="HIDDEN">Hidden Only</option>
                          <option value="PINNED">Pinned Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Sort By</label>
                        <select
                          value={memorySortBy}
                          onChange={(e) => setMemorySortBy(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none"
                        >
                          <option value="NEWEST">Newest First</option>
                          <option value="LIKES">Most Liked</option>
                        </select>
                      </div>
                    </div>

                    {/* Bulk Actions Controls */}
                    {selectedMemories.length > 0 && (
                      <div className="flex items-center gap-3 bg-orange-50 border border-orange-200/50 p-3 rounded-xl animate-in slide-in-from-top-2">
                        <span className="text-xs font-bold text-primary-orange">{selectedMemories.length} Selected</span>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleBulkMemoriesAction('HIDE')} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-500 rounded hover:bg-gray-100 cursor-pointer">Hide Selected</button>
                          <button onClick={() => handleBulkMemoriesAction('RESTORE')} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider bg-white border border-gray-200 text-gray-500 rounded hover:bg-gray-100 cursor-pointer">Restore Selected</button>
                          <button onClick={() => handleBulkMemoriesAction('PIN')} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider bg-white border border-orange-200 text-primary-orange rounded hover:bg-orange-100/50 cursor-pointer">Pin Selected</button>
                          <button onClick={() => handleBulkMemoriesAction('DELETE')} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer">Delete Selected</button>
                        </div>
                      </div>
                    )}

                    {/* Memories list table */}
                    {loadingMemories ? (
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider text-center py-8 animate-pulse">Loading memories...</p>
                    ) : memoriesList.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 font-semibold text-xs">No memories found matching the filters.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                              <th className="p-3 w-8">
                                <input
                                  type="checkbox"
                                  checked={selectedMemories.length === memoriesList.length}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedMemories(memoriesList.map(m => m.id));
                                    } else {
                                      setSelectedMemories([]);
                                    }
                                  }}
                                  className="rounded border-gray-300 text-primary-orange focus:ring-primary-orange"
                                />
                              </th>
                              <th className="p-3">Thumbnail</th>
                              <th className="p-3">Uploader</th>
                              <th className="p-3">Trek Event</th>
                              <th className="p-3">Caption</th>
                              <th className="p-3">Details</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {memoriesList.map((m) => {
                              const isChecked = selectedMemories.includes(m.id);
                              // Parse multi images if JSON
                              let firstImage = '';
                              let isMulti = false;
                              try {
                                if (m.mediaUrl.startsWith('[')) {
                                  const parsed = JSON.parse(m.mediaUrl);
                                  firstImage = parsed[0];
                                  isMulti = true;
                                } else {
                                  firstImage = m.mediaUrl;
                                }
                              } catch {
                                firstImage = m.mediaUrl;
                              }

                              const isOfficial = m.user.role === 'ADMIN' || m.user.role === 'SUPER_ADMIN';

                              return (
                                <tr key={m.id} className={`border-b border-gray-100 hover:bg-gray-50/50 ${isChecked ? 'bg-orange-50/10' : ''}`}>
                                  <td className="p-3">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedMemories(prev => [...prev, m.id]);
                                        } else {
                                          setSelectedMemories(prev => prev.filter(id => id !== m.id));
                                        }
                                      }}
                                      className="rounded border-gray-300 text-primary-orange focus:ring-primary-orange"
                                    />
                                  </td>
                                  <td className="p-3 relative">
                                    {firstImage && (
                                      <div className="relative h-10 w-10 border border-gray-100 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                                        <img src={firstImage} alt="" className="h-full w-full object-cover" />
                                        {isMulti && (
                                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[7px] text-white font-extrabold uppercase tracking-wider">
                                            Multi
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {isOfficial ? (
                                      <p className="font-extrabold text-primary-orange flex items-center gap-1">
                                        <span>🏔️ Official</span>
                                      </p>
                                    ) : (
                                      <>
                                        <p className="font-bold text-dark-charcoal">{m.user.name}</p>
                                        <p className="text-[9px] text-gray-400 font-semibold">{m.user.role}</p>
                                      </>
                                    )}
                                  </td>
                                  <td className="p-3 font-semibold text-gray-650">
                                    {m.event?.title}<br />
                                    <span className="text-[9px] text-gray-400">{new Date(m.event?.startDate).toLocaleDateString()}</span>
                                  </td>
                                  <td className="p-3 max-w-[200px] truncate" title={m.caption}>
                                    {m.caption || <span className="text-gray-300 italic">No caption</span>}
                                  </td>
                                  <td className="p-3 text-gray-400">
                                    <p>{m.likesCount} Likes</p>
                                    <p>{m.comments?.length || 0} Comments</p>
                                  </td>
                                  <td className="p-3 space-y-1">
                                    {m.pinned && (
                                      <span className="inline-block bg-orange-50 text-primary-orange border border-orange-100 px-2 py-0.5 rounded font-extrabold text-[8px] uppercase tracking-wider">
                                        Pinned 📌
                                      </span>
                                    )}
                                    {m.hidden && (
                                      <span className="inline-block bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded font-extrabold text-[8px] uppercase tracking-wider">
                                        Hidden 👁️‍🗨️
                                      </span>
                                    )}
                                    {!m.pinned && !m.hidden && (
                                      <span className="inline-block bg-gray-100 text-gray-400 px-2 py-0.5 rounded font-extrabold text-[8px] uppercase tracking-wider">
                                        Active
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex justify-center gap-2">
                                      <button
                                        onClick={() => handleTogglePinMemory(m.id)}
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${m.pinned ? 'bg-orange-50 border-orange-200 text-primary-orange hover:bg-orange-100' : 'bg-white border-gray-200 text-gray-400 hover:text-dark-charcoal'}`}
                                        title={m.pinned ? 'Unpin Post' : 'Pin Post'}
                                      >
                                        📌
                                      </button>
                                      <button
                                        onClick={() => handleToggleHideMemory(m.id)}
                                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${m.hidden ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100' : 'bg-white border-gray-200 text-gray-400 hover:text-dark-charcoal'}`}
                                        title={m.hidden ? 'Restore Post' : 'Hide Post'}
                                      >
                                        👁️
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMemory(m.id)}
                                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer"
                                        title="Delete Memory"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* User Profiles & Sessions Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Users List Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-50 pb-3">
                    <h3 className="text-base font-bold text-dark-charcoal font-display">User Accounts Management</h3>
                    
                    {/* User Search Bar */}
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search name, email, phone..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary-orange"
                      />
                    </div>
                  </div>

                  {loadingAdminUsers ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600" />
                    </div>
                  ) : adminUsers.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">No registered user accounts found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="pb-3 pl-2">User Details</th>
                            <th className="pb-3">Role</th>
                            <th className="pb-3">Verification</th>
                            <th className="pb-3">Account Status</th>
                            <th className="pb-3 text-right pr-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {adminUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/50">
                              <td className="py-3.5 pl-2 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary-orange/10 flex items-center justify-center font-bold text-dark-charcoal text-xs overflow-hidden">
                                  {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" /> : u.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-dark-charcoal">{u.name}</p>
                                  <p className="text-[10px] text-gray-400">{u.email} | {u.phone || 'No phone'}</p>
                                </div>
                              </td>
                              <td className="py-3.5">
                                <select
                                  value={u.role}
                                  disabled={!isSuperAdmin || u.id === user?.id}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  className="bg-white border border-gray-200 text-[10px] px-1.5 py-0.5 rounded font-bold text-gray-700 focus:outline-none disabled:opacity-50"
                                >
                                  <option value="USER">USER</option>
                                  <option value="VOLUNTEER">VOLUNTEER</option>
                                  <option value="TREK_LEADER">TREK_LEADER</option>
                                  <option value="ADMIN">ADMIN</option>
                                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                </select>
                              </td>
                              <td className="py-3.5">
                                {u.emailVerified ? (
                                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                    Verified
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleVerifyUserEmail(u.id)}
                                    className="text-[9px] font-extrabold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded border border-red-150 transition-colors uppercase tracking-wider"
                                  >
                                    Verify Manually
                                  </button>
                                )}
                              </td>
                              <td className="py-3.5">
                                <button
                                  onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                                  disabled={!isSuperAdmin || u.id === user?.id}
                                  className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border transition-all disabled:opacity-50 ${
                                    u.isActive 
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                                      : 'text-red-600 bg-red-50 border-red-200 hover:bg-orange-50 hover:text-emerald-700 hover:border-emerald-200'
                                  }`}
                                >
                                  {u.isActive ? 'Active (Suspend)' : 'Suspended (Activate)'}
                                </button>
                              </td>
                              <td className="py-3.5 text-right pr-2 space-x-2">
                                <button
                                  onClick={() => handleManageSessions(u.id, u.name)}
                                  className="text-gray-600 hover:text-orange-600 border border-gray-200 hover:border-orange-200 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white shadow-sm transition-all"
                                >
                                  Sessions
                                </button>
                                <button
                                  onClick={() => handleAdminResetPassword(u.id)}
                                  disabled={!isSuperAdmin}
                                  className="text-gray-600 hover:text-orange-600 border border-gray-200 hover:border-orange-200 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white shadow-sm transition-all disabled:opacity-50"
                                >
                                  Reset Pass
                                </button>
                                {isSuperAdmin && u.id !== user?.id && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="text-red-600 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase bg-white shadow-sm transition-all cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Audit Logs Console Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <h3 className="text-base font-bold text-dark-charcoal font-display border-b border-gray-50 pb-3 flex items-center gap-1.5">
                    <ShieldAlert className="h-5 w-5 text-orange-500" />
                    Security & Authentication Audit Logs
                  </h3>

                  {loadingAuditLogs ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600" />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">No security audit logs recorded yet.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-100 rounded-2xl">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider text-[9px] sticky top-0 z-10">
                            <th className="py-2.5 pl-3">Timestamp</th>
                            <th className="py-2.5">Action</th>
                            <th className="py-2.5">User Context</th>
                            <th className="py-2.5">Activity Details</th>
                            <th className="py-2.5 pr-3 text-right">IP Address</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-mono">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50/50">
                              <td className="py-2.5 pl-3 text-gray-400">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="py-2.5">
                                <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                                  log.action.includes('FAIL') || log.action.includes('SUSP')
                                    ? 'bg-red-50 text-red-700' 
                                    : log.action.includes('SUCCESS') || log.action.includes('VERIFY') || log.action.includes('REGIS')
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-blue-50 text-blue-700'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-2.5 text-dark-charcoal font-semibold">
                                {log.user ? `${log.user.name} (${log.user.role})` : 'Anonymous'}
                              </td>
                              <td className="py-2.5 text-gray-600 font-sans max-w-xs truncate" title={log.details}>
                                {log.details}
                              </td>
                              <td className="py-2.5 pr-3 text-right text-gray-400">
                                {log.ipAddress || 'unknown'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Article Version History Modal */}
            {isVersionsModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-xl w-full border border-gray-150 shadow-2xl p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-dark-charcoal font-display">📜 Article Version History</h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Click to restore a previous revision of this article.</p>
                    </div>
                    <button 
                      onClick={() => setIsVersionsModalOpen(false)}
                      className="text-gray-400 hover:text-dark-charcoal font-bold text-xs uppercase tracking-wider"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {blogVersions.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">No previous versions recorded yet.</p>
                    ) : (
                      blogVersions.map((ver) => (
                        <div key={ver.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-150 flex items-center justify-between gap-4 text-xs">
                          <div>
                            <p className="font-extrabold text-dark-charcoal">{ver.title}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-1">
                              Edited by {ver.editedBy} • {new Date(ver.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRestoreVersion(ver.blogId, ver.id)}
                            className="bg-primary-orange hover:bg-orange-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl cursor-pointer shadow-sm shrink-0"
                          >
                            Restore Version
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Image Library Picker Modal */}
            {isImageLibraryOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-150 shadow-2xl p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-dark-charcoal font-display">🖼️ Image Library</h3>
                      <p className="text-[10px] text-gray-400 font-semibold">Select a preset high-resolution trek photo or upload a custom banner.</p>
                    </div>
                    <button 
                      onClick={() => setIsImageLibraryOpen(false)}
                      className="text-gray-400 hover:text-dark-charcoal font-bold text-xs uppercase tracking-wider"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Upload New Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.readAsDataURL(file);
                          reader.onload = () => {
                            setBlogBanner(reader.result as string);
                            setIsImageLibraryOpen(false);
                            toast('Image uploaded to banner!', 'success');
                          };
                        }
                      }}
                      className="text-xs text-gray-500 cursor-pointer"
                    />

                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">Preset Stock Photos</p>
                      <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                        {[
                          'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800',
                          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800',
                          'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800',
                          'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=800',
                          'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=800',
                          'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800'
                        ].map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            onClick={() => {
                              setBlogBanner(url);
                              setIsImageLibraryOpen(false);
                              toast('Selected preset image!', 'success');
                            }}
                            className="h-20 w-full object-cover rounded-xl border border-gray-200 hover:border-primary-orange cursor-pointer transition-all hover:scale-105"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* User Sessions Revocation Modal */}
            {showSessionsModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-lg w-full border border-gray-100 shadow-2xl p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-dark-charcoal font-display">Active Sessions: {selectedUserName}</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Revoke active sessions to immediately force logouts on user devices.</p>
                    </div>
                    <button 
                      onClick={() => setShowSessionsModal(false)}
                      className="text-gray-400 hover:text-gray-600 font-bold text-xs uppercase"
                    >
                      Close
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedUserSessions.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">No active sessions found for this user.</p>
                    ) : (
                      selectedUserSessions.map((s) => (
                        <div key={s.id} className="bg-gray-50 p-3.5 rounded-xl border border-gray-150 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <p className="font-bold text-dark-charcoal max-w-[280px] truncate">{s.deviceInfo}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              IP: {s.ipAddress} | Logged: {new Date(s.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRevokeUserSession(s.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Revoke device session"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      <ImageCropModal 
        isOpen={isCropModalOpen} 
        imageSrc={cropImageSrc} 
        onClose={() => setIsCropModalOpen(false)} 
        onCropComplete={handleCropComplete} 
      />
      <Footer />
    </main>
  );
}
