'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { 
  Maximize2, X, Heart, MessageCircle, Send, Image as ImageIcon, 
  Sparkles, Plus, Calendar, User, MessageSquare
} from 'lucide-react';

interface GalleryItem {
  id: string;
  url: string;
  category: string;
  caption: string;
}

interface MemoryComment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    name: string;
    avatarUrl: string | null;
  };
}

interface MemoryItem {
  id: string;
  caption: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    badgeLevel: string;
  };
  event: {
    title: string;
    slug: string;
  };
  likesCount: number;
  likedByMe: boolean;
  comments: MemoryComment[];
}

export default function GalleryPage() {
  const { user, isAuthenticated } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'gallery' | 'memories'>('gallery');
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Memories Feed States
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [showShareForm, setShowShareForm] = useState(false);

  // New Memory Form
  const [newEventId, setNewEventId] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [shareError, setShareError] = useState('');

  // Comment input state per post id
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Load Curated Gallery
  useEffect(() => {
    if (activeSubTab === 'gallery') {
      async function loadGallery() {
        setLoadingGallery(true);
        try {
          const data = await api.gallery.list();
          setItems(data);
        } catch (err) {
          console.error('Failed to load gallery:', err);
        } finally {
          setLoadingGallery(false);
        }
      }
      loadGallery();
    }
  }, [activeSubTab]);

  // Load Memories feed & Treks list
  const loadMemoriesFeed = async () => {
    setLoadingMemories(true);
    try {
      const data = await api.memories.list();
      setMemories(data);
      const events = await api.events.list();
      setEventsList(events);
    } catch (err) {
      console.error('Failed to load memories:', err);
    } finally {
      setLoadingMemories(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'memories') {
      loadMemoriesFeed();
    }
  }, [activeSubTab]);

  const handleToggleLike = async (memoryId: string) => {
    if (!isAuthenticated) {
      alert('Please log in to like posts!');
      return;
    }
    try {
      const res = await api.memories.toggleLike(memoryId);
      setMemories(prev => 
        prev.map(m => {
          if (m.id === memoryId) {
            return {
              ...m,
              likedByMe: res.liked,
              likesCount: res.liked ? m.likesCount + 1 : m.likesCount - 1
            };
          }
          return m;
        })
      );
    } catch (err) {
      console.error('Toggle like error:', err);
    }
  };

  const handlePostComment = async (memoryId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to comment!');
      return;
    }
    const text = commentInputs[memoryId];
    if (!text?.trim()) return;

    try {
      const res = await api.memories.comment(memoryId, text);
      // Append comment locally
      setMemories(prev => 
        prev.map(m => {
          if (m.id === memoryId) {
            return {
              ...m,
              comments: [...m.comments, res.comment]
            };
          }
          return m;
        })
      );
      // Reset input
      setCommentInputs(prev => ({ ...prev, [memoryId]: '' }));
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleShareMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    setShareError('');
    if (!newEventId) {
      setShareError('Please select a trek event.');
      return;
    }
    if (!newMediaUrl) {
      setShareError('Please provide an image URL.');
      return;
    }

    setIsUploading(true);
    try {
      await api.memories.create({
        eventId: newEventId,
        caption: newCaption,
        mediaUrl: newMediaUrl,
        mediaType: 'IMAGE'
      });
      setShowShareForm(false);
      setNewCaption('');
      setNewMediaUrl('');
      loadMemoriesFeed();
    } catch (err: any) {
      setShareError(err.message || 'Failed to share memory.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    return filter === 'ALL' || item.category.toUpperCase() === filter;
  });

  return (
    <main className="min-h-screen relative bg-gray-50">
      <Navbar />
      <WhatsAppWidget />

      {/* Header */}
      <section className="bg-forest-green pt-32 pb-16 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-4">
          <span className="text-xs uppercase tracking-[0.3em] font-bold text-sunrise-orange">Photo & Drone Captures</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">Adventure Hub</h1>
          
          {/* Sub-tab Toggle */}
          <div className="flex justify-center pt-4">
            <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-full flex border border-white/20">
              <button
                onClick={() => setActiveSubTab('gallery')}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  activeSubTab === 'gallery' ? 'bg-white text-forest-green shadow-md' : 'text-white hover:text-sunrise-orange'
                }`}
              >
                Curated Albums
              </button>
              <button
                onClick={() => setActiveSubTab('memories')}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  activeSubTab === 'memories' ? 'bg-white text-forest-green shadow-md' : 'text-white hover:text-sunrise-orange'
                }`}
              >
                Hiker Memories Feed
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tab: Curated Gallery */}
      {activeSubTab === 'gallery' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-300">
          {/* Category Filters */}
          <div className="flex gap-4 justify-center mb-12 text-xs font-bold uppercase tracking-wider">
            {['ALL', 'KALSUBAI', 'ADRAI'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-full border transition-all ${
                  filter === cat
                    ? 'bg-forest-green border-forest-green text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-forest-green'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loadingGallery ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-forest-green" />
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-12">No images uploaded under this category.</p>
          ) : (
            /* Masonry Pinterest Column Layout */
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {filteredItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedImage(item.url)}
                  className="masonry-item relative bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-350 cursor-pointer group"
                >
                  <img
                    src={item.url}
                    alt={item.caption}
                    className="w-full h-auto object-cover group-hover:scale-102 transition-all"
                  />
                  {/* Floating details overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end text-white">
                    <p className="text-xs font-bold font-display">{item.caption}</p>
                    <p className="text-[10px] text-sunrise-orange uppercase font-bold tracking-wider mt-1">{item.category}</p>
                  </div>
                  {/* Fullscreen icon */}
                  <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-xl text-forest-green opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab: Hiker Memories Feed */}
      {activeSubTab === 'memories' && (
        <section className="max-w-xl mx-auto px-4 py-12 animate-in fade-in duration-300 space-y-8">
          
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-forest-green font-display">Trek Memories Feed</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">See photos shared by past adventurers.</p>
            </div>
            {isAuthenticated ? (
              <button
                onClick={() => setShowShareForm(!showShareForm)}
                className="bg-forest-green text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full flex items-center gap-1 hover:bg-emerald-800 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Share Moment
              </button>
            ) : (
              <span className="text-[10px] text-gray-400 italic">Log in to share post</span>
            )}
          </div>

          {/* Share Memory Form Overlay/Block */}
          {showShareForm && (
            <form onSubmit={handleShareMemory} className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4 animate-in slide-in-from-top duration-200">
              <h4 className="text-xs font-bold text-forest-green uppercase border-b border-gray-50 pb-2">Share Your Trek Memory</h4>
              {shareError && <p className="text-[10px] text-red-600">{shareError}</p>}
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Trek / Event</label>
                  <select
                    required
                    value={newEventId}
                    onChange={(e) => setNewEventId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-2.5 py-2 bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Event --</option>
                    {eventsList.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Image URL (Cloudinary path)</label>
                  <input
                    type="text"
                    required
                    placeholder="https://cloudinary.com/..."
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Caption</label>
                  <textarea
                    rows={2}
                    placeholder="Tell us about the summit experience..."
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="bg-forest-green text-white font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" /> {isUploading ? 'Sharing...' : 'Publish Post'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareForm(false)}
                  className="border border-gray-250 text-gray-400 font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Memories Feed Timeline */}
          {loadingMemories ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-forest-green" />
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400 space-y-2 shadow-sm">
              <MessageSquare className="h-8 w-8 mx-auto text-gray-300" />
              <p className="text-xs">No memories shared on the feed yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {memories.map((m) => (
                <div key={m.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  {/* Top user bar */}
                  <div className="p-4 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-forest-green/10 flex items-center justify-center font-bold text-forest-green text-xs overflow-hidden">
                        {m.user.avatarUrl ? <img src={m.user.avatarUrl} alt="" className="h-full w-full object-cover" /> : m.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-forest-green flex items-center gap-1.5">
                          {m.user.name}
                          <span className="bg-emerald-50 text-forest-green text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                            {m.user.badgeLevel.replace(/_/g, ' ')}
                          </span>
                        </p>
                        <p className="text-[9px] text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="bg-orange-50 text-sunrise-orange text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-orange-100">
                      {m.event.title}
                    </span>
                  </div>

                  {/* Image */}
                  <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                    <img src={m.mediaUrl} alt={m.caption || ''} className="w-full h-full object-cover" />
                  </div>

                  {/* Caption & Likes */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <button 
                        onClick={() => handleToggleLike(m.id)}
                        className={`flex items-center gap-1 transition-colors ${m.likedByMe ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                      >
                        <Heart className={`h-5 w-5 ${m.likedByMe ? 'fill-current' : ''}`} />
                        <span>{m.likesCount}</span>
                      </button>
                      <span className="text-gray-400 flex items-center gap-1">
                        <MessageCircle className="h-5 w-5" />
                        <span>{m.comments.length}</span>
                      </span>
                    </div>

                    {m.caption && (
                      <p className="text-xs text-gray-600 leading-relaxed">
                        <strong className="text-forest-green mr-1.5">{m.user.name}</strong>{m.caption}
                      </p>
                    )}

                    {/* Comments List */}
                    {m.comments.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto border border-gray-100">
                        {m.comments.map((comm) => (
                          <div key={comm.id} className="text-[10px] text-gray-600 leading-relaxed">
                            <strong className="text-forest-green mr-1.5">{comm.user.name}:</strong>
                            {comm.text}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Input */}
                    {isAuthenticated && (
                      <form onSubmit={(e) => handlePostComment(m.id, e)} className="flex gap-2 border-t border-gray-55 pt-2.5">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[m.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [m.id]: e.target.value })}
                          className="flex-1 text-[11px] border border-gray-250 rounded-xl px-3 py-1.5 focus:outline-none focus:border-forest-green"
                        />
                        <button type="submit" className="text-forest-green hover:text-emerald-800 p-1.5">
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Lightbox Overlay */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200"
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white hover:text-sunrise-orange p-2"
          >
            <X className="h-6 w-6" />
          </button>
          <img 
            src={selectedImage} 
            alt="Adventure capture" 
            className="max-h-[85vh] max-w-full object-contain rounded-lg border border-white/10 shadow-2xl"
          />
        </div>
      )}

      <Footer />
    </main>
  );
}
