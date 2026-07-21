'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Plus, Edit, Trash2, Save, X, Eye, EyeOff, CheckCircle2, AlertCircle,
  MapPin, Calendar, IndianRupee, Users, Image as ImageIcon, ChevronDown, ChevronUp, Clock, Layers, ArrowUp, ArrowDown, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploader } from './ImageUploader';

interface TrekCMSManagerProps {
  policies?: any[];
}

export function TrekCMSManager({ policies = [] }: TrekCMSManagerProps) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTrekId, setEditingTrekId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Accordion open state inside form
  const [openSection, setOpenSection] = useState<string>('basic'); // 'basic' | 'dates' | 'details' | 'itinerary' | 'advanced'

  // FORM STATES
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>(['']);
  const [type, setType] = useState('TREK');
  const [difficulty, setDifficulty] = useState('MODERATE');
  const [duration, setDuration] = useState('1 Day');
  const [distance, setDistance] = useState('10 km');
  const [altitude, setAltitude] = useState('1646m');
  const [location, setLocation] = useState('Sahyadri Range, Maharashtra');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [description, setDescription] = useState('');

  // Dates & Pricing
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxSeats, setMaxSeats] = useState('30');
  const [price, setPrice] = useState('1499');

  // Trek Details
  const [thingsToCarry, setThingsToCarry] = useState('');
  const [safetyInstructions, setSafetyInstructions] = useState('');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');
  const [trekLeaderName, setTrekLeaderName] = useState('');
  const [pickupPoints, setPickupPoints] = useState<{ name: string; time: string }[]>([
    { name: 'Kasara Station', time: '04:30 AM' }
  ]);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([
    { question: 'Is this trek suitable for beginners?', answer: 'Yes, with basic fitness.' }
  ]);

  // Itinerary (Days with Activities)
  const [itineraryDays, setItineraryDays] = useState<{ day: number; title: string; activities: { time: string; activity: string; desc: string }[] }[]>([
    {
      day: 1,
      title: 'Summit Climb & Descent',
      activities: [
        { time: '05:00 AM', activity: 'Base Village Arrival & Chai', desc: 'Reach base village, gear check and briefing.' },
        { time: '06:00 AM', activity: 'Ascent Begins', desc: 'Start climbing through forest trail towards peak.' }
      ]
    }
  ]);

  // Advanced Settings
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [policyId, setPolicyId] = useState('');

  // Fetch all treks
  const fetchTrips = async () => {
    setLoading(true);
    try {
      const data = await api.events.adminList();
      setTrips(data || []);
    } catch (err) {
      console.error('Failed to fetch admin treks:', err);
      showToast('Failed to load treks from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Reset Form
  const resetForm = () => {
    setEditingTrekId(null);
    setTitle('');
    setCoverImage('');
    setGalleryImages(['']);
    setType('TREK');
    setDifficulty('MODERATE');
    setDuration('1 Day');
    setDistance('10 km');
    setAltitude('1646m');
    setLocation('Sahyadri Range, Maharashtra');
    setGoogleMapsUrl('');
    setDescription('');
    setStartDate(new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16));
    setEndDate(new Date(Date.now() + 86400000 * 7.5).toISOString().slice(0, 16));
    setMaxSeats('30');
    setPrice('1499');
    setThingsToCarry('Trekking shoes, 2L water, Raincoat, Energy bars');
    setSafetyInstructions('Follow trek leader instructions. Do not wander away from group.');
    setCoordinatorName('');
    setCoordinatorPhone('');
    setTrekLeaderName('');
    setPickupPoints([{ name: 'Kasara Station', time: '04:30 AM' }]);
    setFaqs([{ question: 'Is this trek suitable for beginners?', answer: 'Yes, with basic physical fitness.' }]);
    setItineraryDays([
      {
        day: 1,
        title: 'Summit Climb & Descent',
        activities: [
          { time: '05:00 AM', activity: 'Base Village Arrival & Chai', desc: 'Reach base village, gear check and briefing.' },
          { time: '06:00 AM', activity: 'Ascent Begins', desc: 'Start climbing through forest trail towards peak.' }
        ]
      }
    ]);
    setMetaTitle('');
    setMetaDescription('');
    setPolicyId('');
    setOpenSection('basic');
  };

  // Open Edit Form
  const handleEdit = (trek: any) => {
    setEditingTrekId(trek.id);
    setTitle(trek.title || '');
    const imgs = Array.isArray(trek.images) ? trek.images : JSON.parse(trek.images || '[]');
    setCoverImage(imgs[0] || '');
    setGalleryImages(imgs.length > 1 ? imgs.slice(1) : ['']);
    setType(trek.type || 'TREK');
    setDifficulty(trek.difficulty || 'MODERATE');
    setDuration(trek.duration || '1 Day');
    setDistance(trek.distance ? `${trek.distance} km` : '10 km');
    setAltitude(trek.altitude || '1646m');
    setLocation(trek.location || '');
    setGoogleMapsUrl(trek.googleMapsUrl || '');
    setDescription(trek.description || '');
    setStartDate(trek.startDate ? new Date(trek.startDate).toISOString().slice(0, 16) : '');
    setEndDate(trek.endDate ? new Date(trek.endDate).toISOString().slice(0, 16) : '');
    setMaxSeats(String(trek.maxSeats || 30));
    setPrice(String(trek.price || 1499));

    const carry = Array.isArray(trek.thingsToCarry) ? trek.thingsToCarry.join(', ') : (trek.thingsToCarry || '');
    setThingsToCarry(carry);
    const safety = Array.isArray(trek.safetyMeasures) ? trek.safetyMeasures.join(', ') : (trek.safetyMeasures || '');
    setSafetyInstructions(safety);
    setCoordinatorName(trek.coordinatorName || '');
    setCoordinatorPhone(trek.coordinatorPhone || '');
    setTrekLeaderName(trek.trekLeaderName || '');

    const pts = Array.isArray(trek.pickupPoints) ? trek.pickupPoints : JSON.parse(trek.pickupPoints || '[]');
    setPickupPoints(pts.length > 0 ? pts : [{ name: 'Kasara Station', time: '04:30 AM' }]);

    const itin = Array.isArray(trek.itinerary) ? trek.itinerary : JSON.parse(trek.itinerary || '[]');
    if (itin.length > 0) {
      setItineraryDays(itin);
    } else {
      setItineraryDays([
        {
          day: 1,
          title: 'Summit Climb & Descent',
          activities: [
            { time: '05:00 AM', activity: 'Base Village Arrival', desc: 'Reach base village' }
          ]
        }
      ]);
    }

    setMetaTitle(trek.metaTitle || '');
    setMetaDescription(trek.metaDescription || '');
    setPolicyId(trek.policyId || '');
    setShowFormModal(true);
    setOpenSection('basic');
  };

  // Submit Form Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !coverImage.trim() || !price || !maxSeats || !startDate) {
      showToast('Please fill in required fields (Name, Cover Image, Date, Seats, Price).', 'error');
      return;
    }

    setSaving(true);
    try {
      const imagesArr = [coverImage.trim(), ...galleryImages.filter(img => img && img.trim())];
      const carryArr = thingsToCarry.split(',').map(s => s.trim()).filter(Boolean);
      const safetyArr = safetyInstructions.split(',').map(s => s.trim()).filter(Boolean);

      const payload = {
        title: title.trim(),
        images: imagesArr,
        type,
        difficulty,
        duration,
        distance: parseFloat(distance) || 10,
        altitude,
        location: location.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        description: description.trim(),
        startDate,
        endDate: endDate || startDate,
        maxSeats: parseInt(maxSeats),
        price: parseFloat(price),
        thingsToCarry: carryArr,
        safetyMeasures: safetyArr,
        coordinatorName: coordinatorName.trim(),
        coordinatorPhone: coordinatorPhone.trim(),
        trekLeaderName: trekLeaderName.trim(),
        pickupPoints,
        itinerary: itineraryDays,
        faqs,
        metaTitle,
        metaDescription,
        policyId: policyId || null,
        status: editingTrekId ? undefined : 'OPEN_REGISTRATION'
      };

      if (editingTrekId) {
        await api.events.update(editingTrekId, payload);
        showToast('🟢 Saved ✓ Trek updated successfully!');
      } else {
        await api.events.create(payload);
        showToast('🟢 Saved ✓ Trek created & published successfully!');
      }

      setShowFormModal(false);
      resetForm();
      fetchTrips();
    } catch (err: any) {
      console.error('Save trek error:', err);
      showToast(err.message || 'Failed to save trek to database.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Trek
  const handleDelete = async (id: string, trekTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${trekTitle}"?`)) return;
    try {
      await api.events.delete(id);
      showToast('Trek deleted successfully.');
      fetchTrips();
    } catch (err) {
      console.error('Delete trek error:', err);
      showToast('Failed to delete trek.', 'error');
    }
  };

  // Toggle Publish / Draft
  const handleTogglePublish = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'OPEN_REGISTRATION' ? 'DRAFT' : 'OPEN_REGISTRATION';
    try {
      await api.events.update(id, { status: nextStatus });
      showToast(`Trek status updated to ${nextStatus === 'OPEN_REGISTRATION' ? 'Published' : 'Draft'}.`);
      fetchTrips();
    } catch (err) {
      console.error('Toggle status error:', err);
      showToast('Failed to update status.', 'error');
    }
  };

  // Itinerary Helper Functions
  const addDay = () => {
    setItineraryDays(prev => [
      ...prev,
      {
        day: prev.length + 1,
        title: `Day ${prev.length + 1} Activity`,
        activities: [{ time: '08:00 AM', activity: 'Morning Exploration', desc: 'Trail exploration' }]
      }
    ]);
  };

  const addActivity = (dayIndex: number) => {
    setItineraryDays(prev => {
      const updated = [...prev];
      updated[dayIndex].activities.push({ time: '12:00 PM', activity: 'New Activity', desc: '' });
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border font-bold text-xs flex items-center gap-2 ${
              toast.type === 'success' 
                ? 'bg-emerald-950 text-emerald-200 border-emerald-800' 
                : 'bg-red-950 text-red-200 border-red-800'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" /> : <AlertCircle className="h-4.5 w-4.5 text-red-400" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[24px] border border-gray-150 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-dark-charcoal font-display">Trek Management CMS</h2>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Create, edit, publish, and manage all Sahyadri expeditions. Changes instantly sync to live site.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowFormModal(true);
          }}
          className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-button shadow-md flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Trek</span>
        </button>
      </div>

      {/* Treks Table */}
      {loading ? (
        <div className="bg-white border border-gray-150 rounded-[24px] p-12 text-center text-gray-400 font-bold text-xs">
          Loading treks from database...
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white border border-gray-150 rounded-[24px] p-16 text-center space-y-4">
          <MapPin className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-dark-charcoal font-display">No Treks Found</h3>
          <p className="text-xs text-gray-400 font-semibold max-w-sm mx-auto">
            Click "Add New Trek" above to create your first expedition.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-150 rounded-[24px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-[10px] uppercase font-black text-gray-400 tracking-wider">
                  <th className="py-4 px-6">Trek</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Seats</th>
                  <th className="py-4 px-4">Price</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-dark-charcoal">
                {trips.map((trip) => {
                  const imgs = Array.isArray(trip.images) ? trip.images : JSON.parse(trip.images || '[]');
                  const thumb = imgs[0] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400';
                  const isPublished = trip.status === 'OPEN_REGISTRATION';

                  return (
                    <tr key={trip.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={thumb}
                            alt=""
                            className="h-12 w-16 object-cover rounded-xl border border-gray-150 flex-shrink-0"
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400'; }}
                          />
                          <div>
                            <p className="font-bold text-dark-charcoal font-display text-sm">{trip.title}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">{trip.location}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs font-bold text-gray-600">
                        {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-block text-[9px] uppercase font-extrabold px-2.5 py-1 rounded-full border ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs font-bold text-gray-600">
                        {trip.availableSeats ?? trip.maxSeats} / {trip.maxSeats}
                      </td>

                      <td className="py-4 px-4 font-extrabold text-dark-charcoal font-display">
                        ₹{trip.price}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTogglePublish(trip.id, trip.status)}
                            title={isPublished ? 'Unpublish Trek' : 'Publish Trek'}
                            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                              isPublished
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>

                          <button
                            onClick={() => handleEdit(trip)}
                            title="Edit Trek"
                            className="p-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 cursor-pointer transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(trip.id, trip.title)}
                            title="Delete Trek"
                            className="p-2 rounded-xl bg-red-50 text-red-650 hover:bg-red-100 border border-red-200 cursor-pointer transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL (Single Page Collapsible Accordion) */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-150 rounded-[28px] max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl my-auto">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-150 flex items-center justify-between bg-gray-50 rounded-t-[28px]">
              <div>
                <h3 className="text-lg font-extrabold text-dark-charcoal font-display">
                  {editingTrekId ? 'Edit Trek Expedition' : 'Add New Trek'}
                </h3>
                <p className="text-xs text-gray-500 font-semibold">Fill in basic details to publish on the live site.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="bg-primary-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-button shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : editingTrekId ? 'Update Trek' : 'Save & Publish Trek'}</span>
                </button>

                <button
                  onClick={() => setShowFormModal(false)}
                  className="p-2 text-gray-400 hover:text-dark-charcoal rounded-full bg-white border border-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Single Page Collapsible Sections */}
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-4 flex-1">

              {/* SECTION 1: Basic Information */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === 'basic' ? '' : 'basic')}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100/80 flex items-center justify-between font-bold text-sm text-dark-charcoal font-display transition-colors"
                >
                  <span>1. Basic Information <span className="text-xs text-red-500 font-normal">*Required</span></span>
                  {openSection === 'basic' ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {openSection === 'basic' && (
                  <div className="p-6 space-y-4 border-t border-gray-150">
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Trek Name *</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Kalsubai Summit Trek"
                        className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                      />
                    </div>

                    {/* Cover Image Upload */}
                    <div>
                      <ImageUploader
                        label="Cover Image *"
                        value={coverImage}
                        onChange={setCoverImage}
                        folder="treckwari/treks"
                      />
                    </div>

                    {/* Gallery Images Section */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                        Trek Gallery Images ({galleryImages.filter(Boolean).length})
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {galleryImages.filter(Boolean).map((imgUrl, idx) => (
                          <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square group shadow-sm">
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                              <div className="flex justify-between items-center">
                                {coverImage === imgUrl ? (
                                  <span className="bg-primary-orange text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Cover</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setCoverImage(imgUrl)}
                                    className="bg-white/90 text-dark-charcoal text-[8px] font-bold px-2 py-0.5 rounded-full hover:bg-white cursor-pointer"
                                  >
                                    Set Cover
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== idx))}
                                  className="bg-red-650 text-white p-1 rounded-lg hover:bg-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>

                              <div className="flex justify-center gap-1">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...galleryImages];
                                      const temp = updated[idx];
                                      updated[idx] = updated[idx - 1];
                                      updated[idx - 1] = temp;
                                      setGalleryImages(updated);
                                    }}
                                    className="bg-white/80 p-1 rounded hover:bg-white text-dark-charcoal"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </button>
                                )}
                                {idx < galleryImages.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...galleryImages];
                                      const temp = updated[idx];
                                      updated[idx] = updated[idx + 1];
                                      updated[idx + 1] = temp;
                                      setGalleryImages(updated);
                                    }}
                                    className="bg-white/80 p-1 rounded hover:bg-white text-dark-charcoal"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <ImageUploader
                        label="+ Add Image to Gallery"
                        value=""
                        onChange={(url) => {
                          if (url) setGalleryImages(prev => [...prev.filter(Boolean), url]);
                        }}
                        folder="treckwari/gallery"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Trek Type</label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange bg-white"
                        >
                          <option value="TREK">Monsoon / Mountain Trek</option>
                          <option value="CAMPING">Wilderness Camping</option>
                          <option value="SAFARI">Nature Safari</option>
                          <option value="BACKPACKING">Expedition Tour</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Base Location</label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Bari Village, Igatpuri"
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Difficulty</label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange bg-white"
                        >
                          <option value="EASY">Easy</option>
                          <option value="MODERATE">Moderate</option>
                          <option value="DIFFICULT">Challenging / Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Duration</label>
                        <input
                          type="text"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="e.g. 1 Day"
                          className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Distance</label>
                        <input
                          type="text"
                          value={distance}
                          onChange={(e) => setDistance(e.target.value)}
                          placeholder="e.g. 10 km"
                          className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Max Altitude</label>
                        <input
                          type="text"
                          value={altitude}
                          onChange={(e) => setAltitude(e.target.value)}
                          placeholder="e.g. 1646m"
                          className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Base Location</label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Bari Village, Igatpuri"
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Google Maps Link</label>
                        <input
                          type="text"
                          value={googleMapsUrl}
                          onChange={(e) => setGoogleMapsUrl(e.target.value)}
                          placeholder="https://maps.google.com/..."
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Short Description *</label>
                      <textarea
                        rows={3}
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Overview of the trek expedition..."
                        className="w-full border border-gray-250 rounded-xl p-4 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Dates & Pricing */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === 'dates' ? '' : 'dates')}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100/80 flex items-center justify-between font-bold text-sm text-dark-charcoal font-display transition-colors"
                >
                  <span>2. Dates & Pricing <span className="text-xs text-red-500 font-normal">*Required</span></span>
                  {openSection === 'dates' ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {openSection === 'dates' && (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 border-t border-gray-150">
                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Trek Date *</label>
                      <input
                        type="datetime-local"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Registration Close</label>
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Total Seats *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={maxSeats}
                        onChange={(e) => setMaxSeats(e.target.value)}
                        className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Price (INR) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange font-bold text-primary-orange"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: Trek Details & Leaders */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === 'details' ? '' : 'details')}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100/80 flex items-center justify-between font-bold text-sm text-dark-charcoal font-display transition-colors"
                >
                  <span>3. Trek Details & Leaders (Optional)</span>
                  {openSection === 'details' ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {openSection === 'details' && (
                  <div className="p-6 space-y-4 border-t border-gray-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Things to Carry (Comma separated)</label>
                        <input
                          type="text"
                          value={thingsToCarry}
                          onChange={(e) => setThingsToCarry(e.target.value)}
                          placeholder="Trekking shoes, 2L water, Raincoat"
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Safety Instructions</label>
                        <input
                          type="text"
                          value={safetyInstructions}
                          onChange={(e) => setSafetyInstructions(e.target.value)}
                          placeholder="Follow lead guide instructions"
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Coordinator Name</label>
                        <input
                          type="text"
                          value={coordinatorName}
                          onChange={(e) => setCoordinatorName(e.target.value)}
                          placeholder="e.g. Atharva Dhawale"
                          className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Coordinator Phone</label>
                        <input
                          type="text"
                          value={coordinatorPhone}
                          onChange={(e) => setCoordinatorPhone(e.target.value)}
                          placeholder="+91 9322340365"
                          className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Trek Lead / Guide Name</label>
                        <input
                          type="text"
                          value={trekLeaderName}
                          onChange={(e) => setTrekLeaderName(e.target.value)}
                          placeholder="e.g. Sagar Jadhav"
                          className="w-full border border-gray-250 rounded-xl px-3 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>
                    </div>

                    {/* Pickup Points */}
                    <div className="space-y-2 pt-2">
                      <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Pickup Locations</label>
                      {pickupPoints.map((pt, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Location (e.g. Kasara Station)"
                            value={pt.name}
                            onChange={(e) => {
                              const updated = [...pickupPoints];
                              updated[idx].name = e.target.value;
                              setPickupPoints(updated);
                            }}
                            className="flex-1 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Time (e.g. 04:30 AM)"
                            value={pt.time}
                            onChange={(e) => {
                              const updated = [...pickupPoints];
                              updated[idx].time = e.target.value;
                              setPickupPoints(updated);
                            }}
                            className="w-32 border border-gray-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setPickupPoints(pickupPoints.filter((_, i) => i !== idx))}
                            className="text-gray-400 hover:text-red-500 p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPickupPoints([...pickupPoints, { name: '', time: '' }])}
                        className="text-[10px] font-bold text-primary-orange flex items-center gap-1 mt-1 hover:underline cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Pickup Location
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 4: Simple Itinerary */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === 'itinerary' ? '' : 'itinerary')}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100/80 flex items-center justify-between font-bold text-sm text-dark-charcoal font-display transition-colors"
                >
                  <span>4. Itinerary (Day Wise Schedule)</span>
                  {openSection === 'itinerary' ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {openSection === 'itinerary' && (
                  <div className="p-6 space-y-6 border-t border-gray-150">
                    {itineraryDays.map((dayItem, dIdx) => (
                      <div key={dIdx} className="bg-gray-50 p-5 rounded-2xl border border-gray-150 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                          <h4 className="text-xs font-bold font-display text-primary-orange uppercase tracking-wider">
                            Day {dayItem.day}
                          </h4>
                          <input
                            type="text"
                            placeholder="Day Title (e.g. Summit Ascent)"
                            value={dayItem.title}
                            onChange={(e) => {
                              const updated = [...itineraryDays];
                              updated[dIdx].title = e.target.value;
                              setItineraryDays(updated);
                            }}
                            className="bg-white border border-gray-250 rounded-xl px-3 py-1.5 text-xs font-semibold flex-1 max-w-xs ml-3"
                          />
                        </div>

                        {/* Activities list */}
                        <div className="space-y-3">
                          {dayItem.activities.map((act, aIdx) => (
                            <div key={aIdx} className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                              <input
                                type="text"
                                placeholder="Time (05:00 AM)"
                                value={act.time}
                                onChange={(e) => {
                                  const updated = [...itineraryDays];
                                  updated[dIdx].activities[aIdx].time = e.target.value;
                                  setItineraryDays(updated);
                                }}
                                className="w-28 border border-gray-250 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                              />
                              <input
                                type="text"
                                placeholder="Activity Name"
                                value={act.activity}
                                onChange={(e) => {
                                  const updated = [...itineraryDays];
                                  updated[dIdx].activities[aIdx].activity = e.target.value;
                                  setItineraryDays(updated);
                                }}
                                className="flex-1 border border-gray-250 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                              />
                              <input
                                type="text"
                                placeholder="Short description"
                                value={act.desc}
                                onChange={(e) => {
                                  const updated = [...itineraryDays];
                                  updated[dIdx].activities[aIdx].desc = e.target.value;
                                  setItineraryDays(updated);
                                }}
                                className="flex-1 border border-gray-250 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setItineraryDays(prev => {
                                    const updated = [...prev];
                                    updated[dIdx].activities = updated[dIdx].activities.filter((_, i) => i !== aIdx);
                                    return updated;
                                  });
                                }}
                                className="text-gray-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addActivity(dIdx)}
                            className="text-[10px] font-bold text-primary-orange flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Activity to Day {dayItem.day}
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addDay}
                      className="bg-white border border-gray-250 hover:border-primary-orange text-dark-charcoal font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Plus className="h-4 w-4 text-primary-orange" />
                      <span>Add Day {itineraryDays.length + 1}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 5: Advanced Settings */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenSection(openSection === 'advanced' ? '' : 'advanced')}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100/80 flex items-center justify-between font-bold text-sm text-dark-charcoal font-display transition-colors"
                >
                  <span>5. Advanced Settings & SEO (Optional)</span>
                  {openSection === 'advanced' ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {openSection === 'advanced' && (
                  <div className="p-6 space-y-4 border-t border-gray-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">SEO Title</label>
                        <input
                          type="text"
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value)}
                          placeholder="e.g. Kalsubai Peak Trek Maharashtra"
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Waiver Policy</label>
                        <select
                          value={policyId}
                          onChange={(e) => setPolicyId(e.target.value)}
                          className="w-full border border-gray-250 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-primary-orange bg-white"
                        >
                          <option value="">Default TrekWari Safety Policy</option>
                          {policies.map((p) => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Action Bar */}
              <div className="pt-4 border-t border-gray-150 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-6 py-3 rounded-xl border border-gray-250 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest px-8 py-3 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : editingTrekId ? 'Update Trek' : 'Save & Publish Trek'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
