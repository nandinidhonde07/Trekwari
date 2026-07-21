'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useToast } from './ui/toast';
import { useAuth } from '../hooks/useAuth';
import { 
  Plus, Trash2, Copy, ArrowUp, ArrowDown, Eye, Edit, Save, Upload, X, 
  Search, Filter, Download, ChevronDown, ChevronUp, Users, Calendar, 
  DollarSign, Globe, Camera, CheckCircle2, Image as ImageIcon, Sun, 
  Activity, Flag, Flame, BookOpen, AlertCircle, HelpCircle, Bold, Italic, 
  List, ListOrdered, Link as LinkIcon, Table, MapPin, Compass
} from 'lucide-react';

// Activity Icon styles mapping
const ICON_OPTIONS = [
  { name: 'Sunrise', icon: <Sun className="h-3.5 w-3.5" />, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { name: 'Transport', icon: <Activity className="h-3.5 w-3.5" />, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { name: 'Food & Meals', icon: <Flame className="h-3.5 w-3.5" />, color: 'text-orange-500 bg-orange-50 border-orange-200' },
  { name: 'Camping', icon: <BookOpen className="h-3.5 w-3.5" />, color: 'text-teal-500 bg-teal-50 border-teal-200' },
  { name: 'Trek Trail', icon: <Compass className="h-3.5 w-3.5" />, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  { name: 'Flag summit', icon: <Flag className="h-3.5 w-3.5" />, color: 'text-red-500 bg-red-50 border-red-200' }
];

interface PolicyItem {
  id: string;
  title: string;
}

interface LeaderUser {
  id: string;
  name: string;
  role: string;
}

interface TrekCMSManagerProps {
  policies: PolicyItem[];
  onRefreshStats?: () => void;
}

// Client-side base64 canvas-based image compressor
function compressImage(base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}

// Custom Light-weight Rich Text Editor helper component
function RichTextEditor({ 
  value, 
  onChange, 
  placeholder,
  label 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string;
  label: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + selected + after;
    const newVal = text.substring(0, start) + replacement + text.substring(end);
    onChange(newVal);
    
    // Reset focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="border border-gray-250 bg-white rounded-2xl overflow-hidden focus-within:border-primary-orange transition-all">
        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-150 px-3.5 py-2 flex flex-wrap gap-2">
          <button 
            type="button" 
            onClick={() => insertText('**', '**')} 
            className="p-1 rounded hover:bg-gray-200 text-gray-500" 
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button 
            type="button" 
            onClick={() => insertText('*', '*')} 
            className="p-1 rounded hover:bg-gray-200 text-gray-500" 
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button 
            type="button" 
            onClick={() => insertText('\n- ', '')} 
            className="p-1 rounded hover:bg-gray-200 text-gray-500" 
            title="Bullet list"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button 
            type="button" 
            onClick={() => insertText('\n1. ', '')} 
            className="p-1 rounded hover:bg-gray-200 text-gray-500" 
            title="Numbered list"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button 
            type="button" 
            onClick={() => insertText('[', '](url)')} 
            className="p-1 rounded hover:bg-gray-200 text-gray-500" 
            title="Insert Link"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </button>
          <button 
            type="button" 
            onClick={() => insertText('\n| Column 1 | Column 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n')} 
            className="p-1 rounded hover:bg-gray-200 text-gray-500" 
            title="Insert Table"
          >
            <Table className="h-3.5 w-3.5" />
          </button>
        </div>
        <textarea
          ref={textareaRef}
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Write here...'}
          className="w-full p-3.5 text-xs text-dark-charcoal focus:outline-none bg-white resize-y font-semibold"
        />
      </div>
    </div>
  );
}

export function TrekCMSManager({ policies, onRefreshStats }: TrekCMSManagerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  
  // Tabs for the Trek list and form editor
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'DRAFT' | 'ARCHIVED' | 'NEW'>('ALL');
  
  // Lists
  const [treks, setTreks] = useState<any[]>([]);
  const [leadersList, setLeadersList] = useState<LeaderUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [leaderFilter, setLeaderFilter] = useState('');
  
  // Selected IDs for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Stepper creator wizard state
  const [step, setStep] = useState(1);
  const [editingTrekId, setEditingTrekId] = useState<string | null>(null);
  
  // Form Values State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [category, setCategory] = useState('MOUNTAINS');
  const [difficulty, setDifficulty] = useState('Moderate');
  const [duration, setDuration] = useState('1 Day');
  const [distance, setDistance] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [maxAltitude, setMaxAltitude] = useState('');
  const [location, setLocation] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [endPoint, setEndPoint] = useState('');
  
  // Dates & Slots
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxSeats, setMaxSeats] = useState(30);
  const [waitingSeats, setWaitingSeats] = useState(0); // Reserved/Waitlist slots
  
  // Pricing
  const [price, setPrice] = useState(1399);
  const [discountPrice, setDiscountPrice] = useState(0);
  
  // Image Upload states
  const [coverImage, setCoverImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Multi-day Itinerary Builder
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [itineraryType, setItineraryType] = useState('CUSTOM');
  
  // Leaders & Pickups
  const [selectedLeaderIds, setSelectedLeaderIds] = useState<string[]>([]);
  const [pickupPoints, setPickupPoints] = useState<any[]>([]);
  const [policyId, setPolicyId] = useState('');
  
  // Operational CMS Logistics states
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');
  const [trekLeaderName, setTrekLeaderName] = useState('');
  const [assistantLeadersText, setAssistantLeadersText] = useState('');
  const [busNumber, setBusNumber] = useState('Bus 1');
  const [weatherNotes, setWeatherNotes] = useState('');

  // SEO & FAQs
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  
  // Load initial resources
  useEffect(() => {
    fetchTreks();
    fetchLeaders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered treks selector
  const fetchTreks = async () => {
    setLoading(true);
    try {
      const data = await api.events.list();
      setTreks(data);
    } catch (err) {
      console.error('Failed to load treks:', err);
      toast('Failed to load treks list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaders = async () => {
    try {
      const data = await api.admin.getUsers();
      // Filter potential staff/leaders
      const leaders = data.filter((u: any) => 
        u.role === 'TREK_LEADER' || 
        u.role === 'VOLUNTEER' || 
        u.role === 'ADMIN' || 
        u.role === 'SUPER_ADMIN'
      );
      setLeadersList(leaders);
    } catch (err) {
      console.error('Failed to load leaders:', err);
    }
  };

  // Auto Generate Slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingTrekId) {
      const generatedSlug = val.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      setSlug(generatedSlug);
      setMetaTitle(`${val} Summit Trek | TrekWari`);
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cover' | 'banner' | 'gallery') => {
    const files = e.target.files;
    if (!files) return;
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast(`${file.name} exceeds 5MB size limit.`, 'error');
          continue;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const compressed = await compressImage(reader.result as string);
          if (target === 'cover') setCoverImage(compressed);
          if (target === 'banner') setBannerImage(compressed);
          if (target === 'gallery') setGalleryImages(prev => [...prev, compressed]);
        };
      }
      toast('Images loaded and compressed successfully.', 'success');
    } catch (err) {
      toast('Failed to load images.', 'error');
    }
  };

  // Duplication workflow
  const handleDuplicateTrek = async (id: string) => {
    try {
      const res = await api.events.duplicate(id);
      toast(res.message || 'Trek duplicated as Draft successfully!', 'success');
      fetchTreks();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      toast(err.message || 'Failed to duplicate trek.', 'error');
    }
  };

  // Delete trek action
  const handleDeleteTrek = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trek permanently?')) return;
    try {
      await api.events.delete(id);
      toast('Trek deleted successfully.', 'success');
      fetchTreks();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      toast(err.message || 'Failed to delete trek.', 'error');
    }
  };

  // Itinerary Templates Pre-fill
  const applyItineraryTemplate = (type: string) => {
    setItineraryType(type);
    
    if (type === 'ONE_DAY') {
      setItinerary([
        {
          dayNumber: 1,
          dayTitle: 'Summit Climb & Descent',
          shortSummary: 'Reach the peak and return on the same day.',
          accommodation: 'None',
          mealsIncluded: ['Breakfast', 'Lunch'],
          distanceCovered: 8,
          trekDuration: '6 Hours',
          elevationGain: 600,
          activities: [
            { time: '05:00 AM', title: 'Reporting & Gathering', description: 'Assemble at the designated base camp meeting point.', location: 'Meeting Point', icon: 'Transport' },
            { time: '05:30 AM', title: 'Departure by Bus', description: 'Start the road journey towards the base village.', location: 'En route', icon: 'Transport' },
            { time: '08:00 AM', title: 'Breakfast & Briefing', description: 'Enjoy local village breakfast and briefing on safety protocols.', location: 'Base Village', icon: 'Food & Meals' },
            { time: '09:00 AM', title: 'Trek Starts', description: 'Gradual climb towards the mountain peak.', location: 'Mountain Trail', icon: 'Trek Trail' },
            { time: '12:30 PM', title: 'Reach Summit', description: 'Conquer the peak, photography, and panoramic valley views.', location: 'Summit Peak', icon: 'Flag summit' },
            { time: '01:30 PM', title: 'Descend to Base', description: 'Start the return trail back to the village.', location: 'Mountain Trail', icon: 'Trek Trail' },
            { time: '04:00 PM', title: 'Traditional Village Lunch', description: 'Delectable hot village-style lunch.', location: 'Base Village', icon: 'Food & Meals' },
            { time: '05:30 PM', title: 'Return Journey', description: 'Board the bus back to the starting point.', location: 'Return Route', icon: 'Transport' }
          ]
        }
      ]);
    } else if (type === 'WEEKEND') {
      setItinerary([
        {
          dayNumber: 1,
          dayTitle: 'Basecamp Assembly & Sunset',
          shortSummary: 'Arrive at the base camp and settle in.',
          accommodation: 'Tents / Campsite',
          mealsIncluded: ['Dinner'],
          distanceCovered: 3,
          trekDuration: '2 Hours',
          elevationGain: 200,
          activities: [
            { time: '02:00 PM', title: 'Gathering at Base Village', description: 'Meet trek guides and collect survival items.', location: 'Base Village', icon: 'Transport' },
            { time: '03:00 PM', title: 'Trail Walk to Campsite', description: 'Short walk to the lakeside campsite.', location: 'Trail', icon: 'Trek Trail' },
            { time: '05:30 PM', title: 'Sunset Views & Tent Setup', description: 'Help setup tents and enjoy warm tea.', location: 'Campsite', icon: 'Sunrise' },
            { time: '08:30 PM', title: 'Bonfire & Dinner', description: 'Hot local dinner by the campfire.', location: 'Campsite', icon: 'Food & Meals' }
          ]
        },
        {
          dayNumber: 2,
          dayTitle: 'Summit Ascent & Certificate Distribution',
          shortSummary: 'Acclimatize, push to the summit, and descend.',
          accommodation: 'None',
          mealsIncluded: ['Breakfast', 'Lunch'],
          distanceCovered: 7,
          trekDuration: '5 Hours',
          elevationGain: 500,
          activities: [
            { time: '05:00 AM', title: 'Wakeup & Sunrise Trail', description: 'Early morning climb to catch the sunrise.', location: 'Summit Path', icon: 'Sunrise' },
            { time: '07:30 AM', title: 'Summit Conquest', description: 'Flag hosting at the peak.', location: 'Summit Peak', icon: 'Flag summit' },
            { time: '09:00 AM', title: 'Descent & Breakfast', description: 'Descend to base for hot local breakfast.', location: 'Base Village', icon: 'Food & Meals' },
            { time: '01:00 PM', title: 'Lunch & Certificates', description: 'Earn your digital certificates over lunch.', location: 'Base Village', icon: 'Food & Meals' }
          ]
        }
      ]);
    }
  };

  // Itinerary Item Modification Helpers
  const addDay = () => {
    const nextDayNum = itinerary.length + 1;
    const newDay = {
      dayNumber: nextDayNum,
      dayTitle: `Day ${nextDayNum} Route`,
      shortSummary: 'Short summary of the day\'s goals.',
      accommodation: 'None',
      mealsIncluded: [],
      distanceCovered: 0,
      trekDuration: '0 Hours',
      elevationGain: 0,
      activities: []
    };
    setItinerary([...itinerary, newDay]);
  };

  const removeDay = (idx: number) => {
    const filtered = itinerary.filter((_, i) => i !== idx);
    // Recalculate Day Numbers
    const updated = filtered.map((d, i) => ({
      ...d,
      dayNumber: i + 1
    }));
    setItinerary(updated);
  };

  const addActivity = (dayIdx: number) => {
    const updated = [...itinerary];
    updated[dayIdx].activities.push({
      time: '08:00 AM',
      title: 'New Activity',
      description: 'Activity details...',
      location: 'Trek Trail',
      icon: 'Trek Trail'
    });
    setItinerary(updated);
  };

  const removeActivity = (dayIdx: number, actIdx: number) => {
    const updated = [...itinerary];
    updated[dayIdx].activities = updated[dayIdx].activities.filter((_: any, i: number) => i !== actIdx);
    setItinerary(updated);
  };

  // Save Trek Form submit
  const handleSaveTrek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !location || !coverImage) {
      toast('Please fill in name, slug, location, and cover image.', 'error');
      return;
    }

    const payload = {
      title,
      slug,
      type: category,
      status: editingTrekId ? statusFilter || 'DRAFT' : 'DRAFT',
      difficulty,
      altitude: maxAltitude,
      duration,
      price: parseFloat(String(price)),
      maxSeats: parseInt(String(maxSeats)),
      availableSeats: parseInt(String(maxSeats)), // Available initially equals max seats
      waitingSeats: parseInt(String(waitingSeats)),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      location,
      description: fullDesc || shortDesc,
      highlights: [shortDesc],
      itinerary,
      thingsToCarry: [],
      fitnessLevel: 'Average',
      safetyMeasures: [],
      pickupPoints,
      images: [coverImage, bannerImage, ...galleryImages].filter(Boolean),
      distance: parseFloat(String(distance)),
      elevationGain: parseFloat(String(elevationGain)),
      meetingPoint,
      endPoint,
      googleMapsUrl,
      leaderIds: selectedLeaderIds,
      policyId: policyId || null,
      coordinatorName,
      coordinatorPhone,
      trekLeaderName,
      assistantLeaders: JSON.stringify(assistantLeadersText.split(',').map((s: string) => s.trim()).filter(Boolean)),
      busNumber,
      weatherNotes
    };

    try {
      if (editingTrekId) {
        await api.events.update(editingTrekId, payload);
        toast('Trek updated successfully!', 'success');
      } else {
        await api.events.create(payload);
        toast('New trek created as Draft successfully!', 'success');
      }
      setStep(1);
      setEditingTrekId(null);
      setActiveSubTab('ALL');
      fetchTreks();
      if (onRefreshStats) onRefreshStats();
      resetForm();
    } catch (err: any) {
      toast(err.message || 'Failed to save trek.', 'error');
    }
  };

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setShortDesc('');
    setFullDesc('');
    setCategory('MOUNTAINS');
    setDifficulty('Moderate');
    setDuration('1 Day');
    setDistance(0);
    setElevationGain(0);
    setMaxAltitude('');
    setLocation('');
    setGoogleMapsUrl('');
    setMeetingPoint('');
    setEndPoint('');
    setStartDate('');
    setEndDate('');
    setMaxSeats(30);
    setWaitingSeats(0);
    setPrice(1399);
    setCoverImage('');
    setBannerImage('');
    setGalleryImages([]);
    setItinerary([]);
    setSelectedLeaderIds([]);
    setPickupPoints([]);
    setPolicyId('');
    setMetaTitle('');
    setMetaDescription('');
    setCoordinatorName('');
    setCoordinatorPhone('');
    setTrekLeaderName('');
    setAssistantLeadersText('');
    setBusNumber('Bus 1');
    setWeatherNotes('');
  };

  const handleEditTrekClick = (trek: any) => {
    setEditingTrekId(trek.id);
    setTitle(trek.title);
    setSlug(trek.slug);
    setShortDesc(trek.description.slice(0, 100));
    setFullDesc(trek.description);
    setCategory(trek.type || 'MOUNTAINS');
    setDifficulty(trek.difficulty);
    setDuration(trek.duration);
    setDistance(trek.distance || 0);
    setElevationGain(trek.elevationGain || 0);
    setMaxAltitude(trek.altitude || '');
    setLocation(trek.location);
    setGoogleMapsUrl(trek.googleMapsUrl || '');
    setMeetingPoint(trek.meetingPoint || '');
    setEndPoint(trek.endPoint || '');
    
    // Parse Dates
    if (trek.startDate) setStartDate(new Date(trek.startDate).toISOString().slice(0, 16));
    if (trek.endDate) setEndDate(new Date(trek.endDate).toISOString().slice(0, 16));
    
    setMaxSeats(trek.maxSeats);
    setWaitingSeats(trek.waitingSeats || 0);
    setPrice(trek.price);
    
    // Set Images
    const imgs = trek.images || [];
    setCoverImage(imgs[0] || '');
    setBannerImage(imgs[1] || '');
    setGalleryImages(imgs.slice(2));
    
    setItinerary(trek.itinerary || []);
    setSelectedLeaderIds((trek.leaders || []).map((l: any) => l.userId));
    setPickupPoints(trek.pickupPoints || []);
    setPolicyId(trek.policyId || '');
    setStatusFilter(trek.status);
    setCoordinatorName(trek.coordinatorName || '');
    setCoordinatorPhone(trek.coordinatorPhone || '');
    setTrekLeaderName(trek.trekLeaderName || '');
    if (trek.assistantLeaders) {
      try {
        setAssistantLeadersText(JSON.parse(trek.assistantLeaders).join(', '));
      } catch {
        setAssistantLeadersText(trek.assistantLeaders);
      }
    } else {
      setAssistantLeadersText('');
    }
    setBusNumber(trek.busNumber || 'Bus 1');
    setWeatherNotes(trek.weatherNotes || '');
    
    setStep(1);
    setActiveSubTab('NEW'); // Switch to editor mode
  };

  // CSV Export Action
  const handleExportCSV = () => {
    const itemsToExport = treks.filter(t => selectedIds.includes(t.id));
    const finalItems = itemsToExport.length > 0 ? itemsToExport : treks;
    
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Trek Name,Slug,Category,Price,Seats,Date,Difficulty,Status\n';
    
    finalItems.forEach(t => {
      csvContent += `"${t.title}","${t.slug}","${t.type}",${t.price},"${t.availableSeats}/${t.maxSeats}","${new Date(t.startDate).toLocaleDateString()}","${t.difficulty}","${t.status}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `treks_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Trek CSV exported successfully.', 'success');
  };

  // Filters
  const filteredTreks = treks.filter(t => {
    if (activeSubTab === 'DRAFT' && t.status !== 'DRAFT') return false;
    if (activeSubTab === 'ARCHIVED' && t.status !== 'ARCHIVED') return false;
    
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.location.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = !difficultyFilter || t.difficulty === difficultyFilter;
    const matchesStatus = !statusFilter || t.status === statusFilter;
    
    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-150 font-sans font-bold">
        {(['ALL', 'DRAFT', 'ARCHIVED', 'NEW'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveSubTab(tab);
              if (tab !== 'NEW') {
                setEditingTrekId(null);
                resetForm();
              }
            }}
            className={`px-6 py-3 border-b-2 text-xs uppercase font-extrabold tracking-wider transition-all cursor-pointer ${
              activeSubTab === tab 
                ? 'border-primary-orange text-primary-orange font-black' 
                : 'border-transparent text-gray-400 hover:text-dark-charcoal'
            }`}
          >
            {tab === 'NEW' ? (editingTrekId ? '✏️ Edit Trek' : '➕ Add Trek') : `${tab} TREKS`}
          </button>
        ))}
      </div>

      {activeSubTab !== 'NEW' ? (
        /* CMS LIST VIEW */
        <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-gray-150 shadow-sm space-y-6">
          
          {/* Action and search strip */}
          <div className="flex flex-col md:flex-row justify-between gap-4 font-semibold font-sans">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trek name or basecamp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-250 bg-white rounded-xl text-xs focus:outline-none focus:border-primary-orange font-semibold text-dark-charcoal"
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="border border-gray-250 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold"
              >
                <option value="">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Difficult">Difficult</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-250 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="OPEN_REGISTRATION">Open Registration</option>
                <option value="REGISTRATION_CLOSED">Registration Closed</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <button
                type="button"
                onClick={handleExportCSV}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold border border-gray-200"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* List Table */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-orange" />
            </div>
          ) : filteredTreks.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-semibold font-sans">No treks match the search criteria.</div>
          ) : (
            <div className="overflow-x-auto border border-gray-150 rounded-[20px]">
              <table className="w-full text-xs text-left border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4 pl-6">Cover</th>
                    <th className="p-4">Trek Expedition</th>
                    <th className="p-4">Next date</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Difficulty</th>
                    <th className="p-4">Spots left</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans font-semibold">
                  {filteredTreks.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="p-4 pl-6">
                        <div className="h-10 w-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-150">
                          {t.images && t.images[0] ? (
                            <img src={t.images[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-300">
                              <Camera className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-dark-charcoal">{t.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{t.location}</p>
                      </td>
                      <td className="p-4 font-semibold text-gray-650">
                        {new Date(t.startDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-bold text-dark-charcoal font-display">₹{t.price}</td>
                      <td className="p-4">
                        <span className="font-bold bg-gray-100 px-2 py-0.5 rounded text-[10px] text-gray-700">
                          {t.difficulty}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-gray-650">
                        {t.availableSeats} / {t.maxSeats}
                      </td>
                      <td className="p-4">
                        <span className={`font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          t.status === 'OPEN_REGISTRATION' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                          t.status === 'DRAFT' ? 'bg-gray-100 text-gray-500 border border-gray-150' :
                          t.status === 'COMPLETED' ? 'bg-blue-50 text-blue-800' :
                          'bg-amber-50 text-amber-800'
                        }`}>
                          {t.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-center pr-6 space-x-2">
                        <button 
                          type="button"
                          onClick={() => handleEditTrekClick(t)} 
                          className="p-2 border border-gray-200 hover:border-dark-charcoal text-gray-500 hover:text-dark-charcoal rounded-xl transition-all cursor-pointer bg-white"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDuplicateTrek(t.id)} 
                          className="p-2 border border-gray-200 hover:border-primary-orange text-gray-500 hover:text-primary-orange rounded-xl transition-all cursor-pointer bg-white"
                          title="Duplicate"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {isSuperAdmin && (
                          <button 
                            type="button"
                            onClick={() => handleDeleteTrek(t.id)} 
                            className="p-2 border border-gray-200 hover:border-red-650 text-gray-500 hover:text-red-650 rounded-xl transition-all cursor-pointer bg-white"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      ) : (
        /* CMS STEPPER FORM */
        <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-gray-150 shadow-sm space-y-8">
          
          {/* Stepper Status Indicators */}
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-150">
            {[
              { num: 1, name: 'Basic Info' },
              { num: 2, name: 'Schedules & Slots' },
              { num: 3, name: 'Pricing' },
              { num: 4, name: 'Gallery Media' },
              { num: 5, name: 'Timeline Builder' },
              { num: 6, name: 'Pickups & Guides' },
              { num: 7, name: 'SEO & Policy' }
            ].map(s => (
              <button
                key={s.num}
                type="button"
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest cursor-pointer transition-all ${
                  step === s.num 
                    ? 'text-primary-orange scale-102 font-black' 
                    : 'text-gray-400 hover:text-dark-charcoal'
                }`}
              >
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  step === s.num ? 'bg-primary-orange text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s.num}
                </span>
                <span className="hidden lg:inline">{s.name}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSaveTrek} className="space-y-6 text-xs text-gray-650 font-semibold font-sans">
            
            {/* STEP 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trek Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kalsubai Summit Trek"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-primary-orange font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Slug identifier</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. kalsubai-summit-trek"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Difficulty Level</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3 py-2.5 text-xs focus:outline-none font-semibold"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Difficult">Difficult</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duration</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1 Day, 2 Days"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distance (km)</label>
                    <input
                      type="number"
                      placeholder="e.g. 12"
                      value={distance}
                      onChange={(e) => setDistance(parseFloat(e.target.value))}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Basecamp Location</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bari Village, Maharashtra"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Max Altitude (e.g. 1646m)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1646m"
                      value={maxAltitude}
                      onChange={(e) => setMaxAltitude(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meeting Point</label>
                    <input
                      type="text"
                      placeholder="e.g. Kopargaon Bus Stand / Shirdi"
                      value={meetingPoint}
                      onChange={(e) => setMeetingPoint(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Drop Point</label>
                    <input
                      type="text"
                      placeholder="e.g. Kopargaon Bus Stand / Shirdi"
                      value={endPoint}
                      onChange={(e) => setEndPoint(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Short Description / Hook</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief 1-sentence hook showing on listings..."
                    value={shortDesc}
                    onChange={(e) => setShortDesc(e.target.value)}
                    className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                  />
                </div>

                <RichTextEditor 
                  label="Full Trek Description" 
                  value={fullDesc} 
                  onChange={setFullDesc} 
                  placeholder="Conquer the peak..."
                />
              </div>
            )}

            {/* STEP 2: Schedules & Capacity */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-sans">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-sans">End Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Seats Limit</label>
                    <input
                      type="number"
                      required
                      value={maxSeats}
                      onChange={(e) => setMaxSeats(parseInt(e.target.value))}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-bold text-dark-charcoal"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reserved / Waitlist Seats</label>
                    <input
                      type="number"
                      value={waitingSeats}
                      onChange={(e) => setWaitingSeats(parseInt(e.target.value))}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-bold text-dark-charcoal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trek Coordinator Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Atharva Dhawale"
                      value={coordinatorName}
                      onChange={(e) => setCoordinatorName(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Coordinator Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9322340365"
                      value={coordinatorPhone}
                      onChange={(e) => setCoordinatorPhone(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Main Trek Leader</label>
                    <input
                      type="text"
                      placeholder="e.g. Atharva Dhawale"
                      value={trekLeaderName}
                      onChange={(e) => setTrekLeaderName(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assistant Leaders (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Leader A, Leader B"
                      value={assistantLeadersText}
                      onChange={(e) => setAssistantLeadersText(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bus / Vehicle Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Bus 1"
                      value={busNumber}
                      onChange={(e) => setBusNumber(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Weather & Climate Advisory Notes</label>
                    <textarea
                      placeholder="Expect monsoon showers, carry raincoats..."
                      value={weatherNotes}
                      onChange={(e) => setWeatherNotes(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Pricing */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Base Price (INR)</label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value))}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-bold text-primary-orange"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Discount Price Override (Optional)</label>
                    <input
                      type="number"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(parseFloat(e.target.value))}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Media Uploader */}
            {step === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Cover and banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  
                  {/* Cover */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trek Cover Image</label>
                    {coverImage ? (
                      <div className="relative rounded-2xl overflow-hidden aspect-video border border-gray-150 bg-gray-50 flex items-center justify-center">
                        <img src={coverImage} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setCoverImage('')} className="absolute top-2 right-2 bg-red-650 text-white rounded-full p-1.5 hover:bg-red-500 shadow-md transition-colors cursor-pointer border-none">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-orange-500/50 transition-colors cursor-pointer relative bg-gray-50/50">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <span className="text-xs text-gray-500">Click to upload cover photo</span>
                      </div>
                    )}
                  </div>

                  {/* Banner */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Header Banner Image</label>
                    {bannerImage ? (
                      <div className="relative rounded-2xl overflow-hidden aspect-video border border-gray-150 bg-gray-50 flex items-center justify-center">
                        <img src={bannerImage} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setBannerImage('')} className="absolute top-2 right-2 bg-red-650 text-white rounded-full p-1.5 hover:bg-red-500 shadow-md transition-colors cursor-pointer border-none">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-orange-500/50 transition-colors cursor-pointer relative bg-gray-50/50">
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <span className="text-xs text-gray-500">Click to upload banner photo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Multiple Gallery Manager */}
                <div className="space-y-2 border-t border-gray-100 pt-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trek Gallery Photos</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-150 rounded-2xl max-h-60 overflow-y-auto">
                    {galleryImages.map((img, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden aspect-square border border-gray-200 bg-white">
                        <img src={img} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1.5 right-1.5 bg-red-650 text-white rounded-full p-1 hover:bg-red-500 shadow-md transition-colors cursor-pointer border-none">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center hover:border-orange-500/50 transition-colors relative aspect-square bg-white shadow-sm">
                      <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Dynamic Itinerary Builder */}
            {step === 5 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Templates Selector */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-dark-charcoal uppercase">Itinerary Templates</h4>
                    <p className="text-[9px] text-gray-400 font-bold mt-0.5">Pre-fill schedule layout with standard templates.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => applyItineraryTemplate('ONE_DAY')} className="bg-white border border-gray-250 hover:border-primary-orange px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer font-bold">One-Day Trek</button>
                    <button type="button" onClick={() => applyItineraryTemplate('WEEKEND')} className="bg-white border border-gray-250 hover:border-primary-orange px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer font-bold">Weekend Trek</button>
                  </div>
                </div>

                {/* Day Roster list */}
                <div className="space-y-4">
                  {itinerary.map((day, dIdx) => (
                    <div key={day.dayNumber} className="bg-white border border-gray-150 rounded-[20px] p-5 space-y-4">
                      
                      {/* Day Header details */}
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-orange-50 text-primary-orange text-xs font-black px-3 py-1 rounded-lg">Day {day.dayNumber}</span>
                          <input
                            type="text"
                            required
                            placeholder="Day Title (e.g. Summit ascent)"
                            value={day.dayTitle}
                            onChange={(e) => {
                              const updated = [...itinerary];
                              updated[dIdx].dayTitle = e.target.value;
                              setItinerary(updated);
                            }}
                            className="border-none font-bold text-sm text-dark-charcoal focus:outline-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          {dIdx > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...itinerary];
                                const temp = updated[dIdx];
                                updated[dIdx] = updated[dIdx - 1];
                                updated[dIdx - 1] = temp;
                                // Re-index
                                updated.forEach((d, i) => d.dayNumber = i + 1);
                                setItinerary(updated);
                              }}
                              className="p-1.5 text-gray-400 hover:text-primary-orange border border-gray-200 rounded-lg cursor-pointer bg-white shadow-sm"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {dIdx < itinerary.length - 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...itinerary];
                                const temp = updated[dIdx];
                                updated[dIdx] = updated[dIdx + 1];
                                updated[dIdx + 1] = temp;
                                // Re-index
                                updated.forEach((d, i) => d.dayNumber = i + 1);
                                setItinerary(updated);
                              }}
                              className="p-1.5 text-gray-400 hover:text-primary-orange border border-gray-200 rounded-lg cursor-pointer bg-white shadow-sm"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeDay(dIdx)}
                            className="p-1.5 text-gray-400 hover:text-red-650 border border-gray-200 rounded-lg cursor-pointer bg-white shadow-sm"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Day summary */}
                      <input
                        type="text"
                        placeholder="Short summary description of this day..."
                        value={day.shortSummary}
                        onChange={(e) => {
                          const updated = [...itinerary];
                          updated[dIdx].shortSummary = e.target.value;
                          setItinerary(updated);
                        }}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold"
                      />

                      {/* Day Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-gray-400 mb-1">Accommodation</label>
                          <input
                            type="text"
                            placeholder="e.g. lakeside camp"
                            value={day.accommodation || ''}
                            onChange={(e) => {
                              const updated = [...itinerary];
                              updated[dIdx].accommodation = e.target.value;
                              setItinerary(updated);
                            }}
                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-gray-400 mb-1">Trek Distance (km)</label>
                          <input
                            type="number"
                            value={day.distanceCovered || 0}
                            onChange={(e) => {
                              const updated = [...itinerary];
                              updated[dIdx].distanceCovered = parseFloat(e.target.value);
                              setItinerary(updated);
                            }}
                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-gray-400 mb-1">Trek Duration</label>
                          <input
                            type="text"
                            placeholder="e.g. 5 Hours"
                            value={day.trekDuration || ''}
                            onChange={(e) => {
                              const updated = [...itinerary];
                              updated[dIdx].trekDuration = e.target.value;
                              setItinerary(updated);
                            }}
                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase tracking-wider text-gray-400 mb-1">Elevation Gain (m)</label>
                          <input
                            type="number"
                            value={day.elevationGain || 0}
                            onChange={(e) => {
                              const updated = [...itinerary];
                              updated[dIdx].elevationGain = parseFloat(e.target.value);
                              setItinerary(updated);
                            }}
                            className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Inner timeline builder */}
                      <div className="space-y-3 pt-3 border-t border-gray-100">
                        <h5 className="text-[10px] uppercase tracking-widest text-primary-orange font-bold">Timeline Events</h5>
                        <div className="space-y-3">
                          {day.activities.map((act: any, aIdx: number) => (
                            <div key={aIdx} className="p-3 bg-gray-50 border border-gray-150 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
                              <input
                                type="text"
                                value={act.time}
                                onChange={(e) => {
                                  const updated = [...itinerary];
                                  updated[dIdx].activities[aIdx].time = e.target.value;
                                  setItinerary(updated);
                                }}
                                className="w-20 border border-gray-250 bg-white rounded-lg px-2 py-1 text-xs text-center focus:outline-none font-bold"
                              />
                              <input
                                type="text"
                                value={act.title}
                                onChange={(e) => {
                                  const updated = [...itinerary];
                                  updated[dIdx].activities[aIdx].title = e.target.value;
                                  setItinerary(updated);
                                }}
                                placeholder="Activity title"
                                className="flex-1 border border-gray-250 bg-white rounded-lg px-2.5 py-1 text-xs focus:outline-none font-bold text-dark-charcoal"
                              />
                              <select
                                value={act.icon}
                                onChange={(e) => {
                                  const updated = [...itinerary];
                                  updated[dIdx].activities[aIdx].icon = e.target.value;
                                  setItinerary(updated);
                                }}
                                className="border border-gray-250 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none"
                              >
                                {ICON_OPTIONS.map(opt => (
                                  <option key={opt.name} value={opt.name}>{opt.name}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeActivity(dIdx, aIdx)}
                                className="text-gray-400 hover:text-red-650 p-1 cursor-pointer bg-white border border-gray-200 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addActivity(dIdx)}
                            className="bg-orange-50 text-primary-orange font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer border border-orange-100 hover:bg-orange-100/50"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Timeline Event
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDay}
                    className="w-full border-2 border-dashed border-gray-250 text-gray-500 font-extrabold text-[10px] uppercase tracking-widest py-3 rounded-2xl hover:border-primary-orange/50 hover:text-primary-orange transition-colors cursor-pointer"
                  >
                    ➕ Add Journey Day
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Pickups & Guides */}
            {step === 6 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                
                {/* Trek Leaders */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-widest text-primary-orange font-bold border-b border-gray-150 pb-2">Leaders Assignment</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Trek Guide / Leaders</label>
                      <select
                        multiple
                        value={selectedLeaderIds}
                        onChange={(e) => {
                          const values = Array.from(e.target.selectedOptions, option => option.value);
                          setSelectedLeaderIds(values);
                        }}
                        className="w-full border border-gray-250 bg-white rounded-xl p-2.5 text-xs focus:outline-none min-h-28 font-semibold"
                      >
                        {leadersList.map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.role})</option>
                        ))}
                      </select>
                      <span className="text-[9px] text-gray-400 block font-bold">Hold Ctrl / Cmd to select multiple guides.</span>
                    </div>
                  </div>
                </div>

                {/* Pickup Points */}
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <h4 className="text-xs uppercase tracking-widest text-primary-orange font-bold border-b border-gray-150 pb-2">Pickup Locations</h4>
                  <div className="space-y-3">
                    {pickupPoints.map((pt, idx) => (
                      <div key={idx} className="p-3.5 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row gap-3 items-center">
                        <input
                          type="text"
                          placeholder="e.g. Pune Station"
                          required
                          value={pt.name}
                          onChange={(e) => {
                            const updated = [...pickupPoints];
                            updated[idx].name = e.target.value;
                            setPickupPoints(updated);
                          }}
                          className="flex-1 border border-gray-250 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Time (e.g. 10:30 PM)"
                          required
                          value={pt.time}
                          onChange={(e) => {
                            const updated = [...pickupPoints];
                            updated[idx].time = e.target.value;
                            setPickupPoints(updated);
                          }}
                          className="w-40 border border-gray-250 bg-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setPickupPoints(prev => prev.filter((_, i) => i !== idx))}
                          className="text-gray-400 hover:text-red-650 p-2 cursor-pointer border border-gray-200 rounded-xl bg-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPickupPoints([...pickupPoints, { name: '', time: '', googleMapsUrl: '' }])}
                      className="bg-white border border-gray-250 hover:border-primary-orange text-gray-500 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Add Pickup Point
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: FAQ & SEO */}
            {step === 7 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-sans">Assign Waiver Policy</label>
                  <select
                    value={policyId}
                    onChange={(e) => setPolicyId(e.target.value)}
                    className="w-full border border-gray-250 bg-white rounded-xl px-3 py-2.5 text-xs focus:outline-none font-semibold"
                  >
                    <option value="">No custom policy (Use default settings)</option>
                    {policies.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meta SEO Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Kalsubai Peak Trek Maharashtra"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meta SEO Description</label>
                    <input
                      type="text"
                      placeholder="Conquer the highest peak of Maharashtra..."
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      className="w-full border border-gray-250 bg-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div className="flex justify-between border-t border-gray-150 pt-6">
              <button
                type="button"
                disabled={step === 1}
                onClick={() => setStep(prev => prev - 1)}
                className="border border-gray-250 text-gray-500 font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>

              {step < 7 ? (
                <button
                  type="button"
                  onClick={() => setStep(prev => prev + 1)}
                  className="bg-primary-orange text-white font-bold text-[10px] uppercase tracking-widest px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-[10px] uppercase tracking-widest px-7 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <Save className="h-4 w-4" /> {editingTrekId ? 'Update Trek' : 'Save Trek Draft'}
                </button>
              )}
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
