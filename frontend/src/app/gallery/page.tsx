'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { 
  Maximize2, X, Heart, MessageCircle, Send, Image as ImageIcon, 
  Sparkles, Plus, Calendar, User, MessageSquare, Share2, Download, Trash2
} from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/toast';
import { EmptyState } from '../../components/ui/empty-state';

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
    location?: string;
    startDate?: string;
  };
  likesCount: number;
  likedByMe: boolean;
  comments: MemoryComment[];
}

export default function GalleryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

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
  const [newMediaUrls, setNewMediaUrls] = useState<string[]>([]);
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

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    try {
      await api.memories.delete(memoryId);
      toast('Memory deleted successfully!', 'success');
      setMemories(prev => prev.filter(m => m.id !== memoryId));
    } catch (err: any) {
      toast(err.message || 'Failed to delete memory.', 'error');
    }
  };

  useEffect(() => {
    if (activeSubTab === 'memories') {
      loadMemoriesFeed();
    }
  }, [activeSubTab]);

  const handleToggleLike = async (memoryId: string) => {
    if (!isAuthenticated) {
      toast('Please log in to like posts!', 'error');
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
      toast('Please log in to comment!', 'error');
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
    const urlsToUpload = newMediaUrls.length > 0 ? newMediaUrls : (newMediaUrl ? [newMediaUrl] : []);
    if (urlsToUpload.length === 0) {
      setShareError('Please select or upload at least one photo.');
      return;
    }

    setIsUploading(true);
    try {
      for (const url of urlsToUpload) {
        await api.memories.create({
          eventId: newEventId,
          caption: newCaption,
          mediaUrl: url,
          mediaType: 'IMAGE'
        });
      }
      toast('Memory shared successfully!', 'success');
      setShowShareForm(false);
      setNewCaption('');
      setNewMediaUrl('');
      setNewMediaUrls([]);
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
      <section className="bg-white border-b border-gray-150 pt-32 pb-16 text-dark-charcoal text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-4">
          <span className="text-xs uppercase tracking-[0.3em] font-extrabold text-primary-orange">Photo & Drone Captures</span>
          <h1 className="text-3xl sm:text-5xl font-black font-display text-dark-charcoal">Adventure Hub</h1>
          
          {/* Sub-tab Toggle */}
          <div className="flex justify-center pt-4">
            <div className="bg-gray-100 p-1.5 rounded-full flex border border-gray-200">
              <button
                onClick={() => setActiveSubTab('gallery')}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSubTab === 'gallery' ? 'bg-white text-dark-charcoal shadow-sm' : 'text-gray-400 hover:text-primary-orange'
                }`}
              >
                Curated Albums
              </button>
              <button
                onClick={() => setActiveSubTab('memories')}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSubTab === 'memories' ? 'bg-white text-dark-charcoal shadow-sm' : 'text-gray-400 hover:text-primary-orange'
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
                className={`px-5 py-2.5 rounded-full border transition-all cursor-pointer ${
                  filter === cat
                    ? 'bg-primary-orange border-primary-orange text-white shadow-sm'
                    : 'bg-white border-gray-250 text-gray-400 hover:border-gray-300 hover:text-dark-charcoal'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loadingGallery ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white border border-gray-150 rounded-[20px] overflow-hidden p-4 shadow-sm space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="No Images Found"
              description="No adventure images are uploaded under this category yet."
              icon={<ImageIcon className="h-8 w-8" />}
            />
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
                  <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-xl text-dark-charcoal opacity-0 group-hover:opacity-100 transition-opacity">
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
              <h3 className="text-sm font-bold text-dark-charcoal font-display">Trek Memories Feed</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">See photos shared by past adventurers.</p>
            </div>
            {isAuthenticated ? (
              <button
                onClick={() => setShowShareForm(!showShareForm)}
                className="bg-primary-orange hover:bg-orange-600 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
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
              <h4 className="text-xs font-bold text-dark-charcoal uppercase border-b border-gray-150 pb-2">Share Your Trek Memory</h4>
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
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Upload Photos</label>
                  {newMediaUrls.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded-2xl border border-gray-150 max-h-40 overflow-y-auto">
                        {newMediaUrls.map((url, idx) => (
                          <div key={idx} className="relative rounded-xl border border-gray-200 overflow-hidden aspect-square bg-white flex items-center justify-center">
                            <img src={url} alt="Preview" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setNewMediaUrls(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-500 shadow-sm transition-colors cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewMediaUrls([])}
                        className="text-[10px] text-red-600 font-extrabold uppercase hover:underline cursor-pointer"
                      >
                        Clear All Photos
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-orange-500/50 transition-colors cursor-pointer relative bg-gray-50/50">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        required
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) {
                            let hasOverLimit = false;
                            for (let i = 0; i < files.length; i++) {
                              const file = files[i];
                              if (file.size > 5 * 1024 * 1024) {
                                hasOverLimit = true;
                                continue;
                              }
                              const reader = new FileReader();
                              reader.readAsDataURL(file);
                              reader.onload = () => {
                                setNewMediaUrls(prev => [...prev, reader.result as string]);
                              };
                            }
                            if (hasOverLimit) {
                              toast('Some images exceeded the 5MB size limit and were skipped.', 'error');
                            }
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Plus className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-500 font-medium">Click to select or drag photos here</span>
                        <span className="text-[10px] text-gray-400">Select multiple files. Max size 5MB (PNG, JPG)</span>
                      </div>
                    </div>
                  )}
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
                  className="bg-primary-orange text-white font-bold text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-orange" />
            </div>
          ) : memories.length === 0 ? (
            <EmptyState
              title="No Memories Posted Yet"
              description="Be the first to share an inspiring peak photo or summit story from your past treks!"
              actionLabel={isAuthenticated ? "Share a Memory" : "Log In to Share"}
              onAction={() => {
                if (isAuthenticated) {
                  setShowShareForm(true);
                } else {
                  router.push('/login');
                }
              }}
              icon={<MessageSquare className="h-8 w-8" />}
            />
          ) : (
            <div className="space-y-6">
              {memories.map((m) => (
                <div key={m.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  {/* Top user bar */}
                  <div className="p-4 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center font-bold text-primary-orange text-xs overflow-hidden">
                        {m.user.avatarUrl ? <img src={m.user.avatarUrl} alt="" className="h-full w-full object-cover" /> : m.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-dark-charcoal flex items-center gap-1.5">
                          {m.user.name}
                          <span className="bg-orange-50 text-primary-orange text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wide">
                            {m.user.badgeLevel.replace(/_/g, ' ')}
                          </span>
                        </p>
                        <p className="text-[9px] text-gray-400 font-semibold">
                          {new Date(m.createdAt).toLocaleDateString()}
                          {m.event.location ? ` • ${m.event.location}` : ''}
                          {m.event.startDate ? ` • ${new Date(m.event.startDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-orange-50 text-sunrise-orange text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-orange-100">
                        {m.event.title}
                      </span>
                      {user && user.id === m.user.id && (
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          className="text-gray-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                          title="Delete memory"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Image */}
                  <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-95 transition-all">
                    <img 
                      src={m.mediaUrl} 
                      alt={m.caption || ''} 
                      className="w-full h-full object-cover" 
                      onClick={() => setSelectedImage(m.mediaUrl)}
                    />
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
                        <strong className="text-dark-charcoal mr-1.5">{m.user.name}</strong>{m.caption}
                      </p>
                    )}

                    {/* Comments List */}
                    {m.comments.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto border border-gray-100">
                        {m.comments.map((comm) => (
                          <div key={comm.id} className="text-[10px] text-gray-600 leading-relaxed">
                            <strong className="text-dark-charcoal mr-1.5">{comm.user.name}:</strong>
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
                          className="flex-1 text-[11px] border border-gray-250 rounded-xl px-3 py-1.5 focus:outline-none focus:border-primary-orange"
                        />
                        <button type="submit" className="text-primary-orange hover:text-orange-600 p-1.5 cursor-pointer">
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
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col justify-center items-center p-4 animate-in fade-in duration-200"
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white hover:text-primary-orange p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="relative max-h-[75vh] max-w-full flex flex-col items-center">
            <img 
              src={selectedImage} 
              alt="Adventure capture" 
              className="max-h-[75vh] max-w-full object-contain rounded-lg border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Share and Download Action Strip */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="mt-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-full border border-white/15 flex items-center gap-4 shadow-lg text-white pointer-events-auto"
            >
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedImage);
                  toast('Image link copied to clipboard!', 'success');
                }}
                className="flex items-center gap-1.5 hover:text-primary-orange text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Share2 className="h-4.5 w-4.5" />
                <span>Share Link</span>
              </button>
              <div className="h-4 w-px bg-white/20" />
              <a
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary-orange text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <Download className="h-4.5 w-4.5" />
                <span>Full Image</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
