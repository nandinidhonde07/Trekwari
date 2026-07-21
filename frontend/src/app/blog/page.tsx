'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { 
  Calendar, Clock, User, ArrowRight, X, Search, Sparkles, Eye, ThumbsUp, Share2, 
  MessageSquare, Send, Check, Copy, Facebook, Linkedin, Twitter, MessageCircle, BookOpen, MapPin, Tag
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/toast';

export default function BlogPage() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);
  const [blogDetails, setBlogDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeTag, setActiveTag] = useState('');
  const [sortMode, setSortMode] = useState<'latest' | 'popular'>('latest');

  // Reader Modal State
  const [readingProgress, setReadingProgress] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const readerContentRef = useRef<HTMLDivElement>(null);

  // Load Categories & Articles
  useEffect(() => {
    async function loadData() {
      try {
        const [blogsData, catData] = await Promise.all([
          api.blogs.list(),
          api.blogs.categories().catch(() => [])
        ]);
        setBlogs(Array.isArray(blogsData) ? blogsData : []);
        setCategories(Array.isArray(catData) ? catData : []);
      } catch (err) {
        console.error('Failed to load blog posts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Fetch full blog details (with related treks/articles & comments) when selected
  useEffect(() => {
    if (!selectedBlog) {
      setBlogDetails(null);
      setReadingProgress(0);
      return;
    }

    async function fetchDetails() {
      setLoadingDetails(true);
      try {
        const data = await api.blogs.get(selectedBlog.slug);
        setBlogDetails(data);
      } catch (err) {
        console.error('Failed to fetch article details:', err);
        setBlogDetails(selectedBlog);
      } finally {
        setLoadingDetails(false);
      }
    }
    fetchDetails();
  }, [selectedBlog]);

  // Reading progress scroll tracker
  const handleScrollProgress = () => {
    if (!readerContentRef.current) return;
    const el = readerContentRef.current;
    const totalHeight = el.scrollHeight - el.clientHeight;
    if (totalHeight > 0) {
      const currentProgress = (el.scrollTop / totalHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, currentProgress)));
    }
  };

  // Like Article
  const handleLike = async () => {
    if (!blogDetails) return;
    try {
      const res = await api.blogs.like(blogDetails.id);
      setBlogDetails((prev: any) => ({ ...prev, likes: res.likes }));
      toast('Thank you for liking this article!', 'success');
    } catch (err) {
      toast('Failed to register like.', 'error');
    }
  };

  // Share Article
  const handleShare = async (platform: string) => {
    if (!blogDetails) return;
    const url = window.location.href;
    const text = `Read "${blogDetails.title}" on TrekWari!`;

    try {
      await api.blogs.share(blogDetails.id);
      setBlogDetails((prev: any) => ({ ...prev, shares: (prev.shares || 0) + 1 }));
    } catch (err) {}

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      toast('Article link copied to clipboard!', 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !blogDetails) return;

    if (!isAuthenticated) {
      toast('Please login to leave a comment.', 'error');
      return;
    }

    setSubmittingComment(true);
    try {
      const newComment = await api.blogs.addComment(blogDetails.id, commentInput);
      setBlogDetails((prev: any) => ({
        ...prev,
        comments: [newComment, ...(prev.comments || [])]
      }));
      setCommentInput('');
      toast('Comment posted successfully!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to post comment.', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.blogs.deleteComment(commentId);
      setBlogDetails((prev: any) => ({
        ...prev,
        comments: (prev.comments || []).filter((c: any) => c.id !== commentId)
      }));
      toast('Comment deleted.', 'success');
    } catch (err: any) {
      toast('Failed to delete comment.', 'error');
    }
  };

  // Filtered & Sorted Blogs
  const filteredBlogs = blogs.filter((b) => {
    const matchesCat = activeCategory === 'ALL' || b.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesTag = !activeTag || (b.tags && b.tags.toLowerCase().includes(activeTag.toLowerCase()));
    const matchesSearch = !search || (
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.summary && b.summary.toLowerCase().includes(search.toLowerCase())) ||
      (b.category && b.category.toLowerCase().includes(search.toLowerCase())) ||
      (b.tags && b.tags.toLowerCase().includes(search.toLowerCase()))
    );
    return matchesCat && matchesTag && matchesSearch;
  }).sort((a, b) => {
    if (sortMode === 'popular') return (b.views || 0) - (a.views || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const featuredBlog = blogs.find((b) => b.isFeatured) || blogs[0];

  return (
    <main className="min-h-screen relative bg-warm-white">
      <Navbar />
      <WhatsAppWidget />

      {/* Hero Banner Header */}
      <section className="bg-dark-charcoal text-white pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F97316_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-3">
          <span className="text-[10px] uppercase tracking-[0.4em] font-extrabold text-primary-orange bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full inline-block backdrop-blur-md">
            Expedition Knowledge Base
          </span>
          <h1 className="text-3xl sm:text-6xl font-extrabold font-display tracking-tight text-white">
            TrekWari Articles & Field Guides
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto font-medium leading-relaxed">
            Trail prep checklists, safety guides, route recce reports, and monsoon trek logs authored by expedition leaders.
          </p>
        </div>
      </section>

      {/* Featured Top Banner Article */}
      {featuredBlog && !search && activeCategory === 'ALL' && !activeTag && (
        <section className="max-w-7xl mx-auto px-6 sm:px-8 -mt-10 relative z-20">
          <div 
            onClick={() => setSelectedBlog(featuredBlog)}
            className="bg-white border border-gray-150 rounded-[28px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer grid grid-cols-1 lg:grid-cols-12 group"
          >
            {/* Banner Image */}
            <div className="lg:col-span-7 relative h-72 lg:h-full overflow-hidden bg-gray-100 min-h-[300px]">
              <img
                src={featuredBlog.bannerImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200'}
                alt={featuredBlog.title}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-6 left-6 flex gap-2">
                <span className="bg-primary-orange text-white text-[9px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                  <Sparkles className="h-3.5 w-3.5" /> FEATURED ARTICLE
                </span>
                <span className="bg-dark-charcoal/90 backdrop-blur-md text-white text-[9px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full border border-white/20">
                  {featuredBlog.category}
                </span>
              </div>
            </div>

            {/* Content info */}
            <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-primary-orange" />
                    {new Date(featuredBlog.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1 text-primary-orange" />
                    {featuredBlog.readTime || '5 min read'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-3xl font-extrabold text-dark-charcoal font-display group-hover:text-primary-orange transition-colors leading-snug">
                  {featuredBlog.title}
                </h2>

                <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed line-clamp-4">
                  {featuredBlog.summary || featuredBlog.seoDescription || 'Read our featured expedition report and trail preparation notes.'}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-xs text-primary-orange overflow-hidden">
                    {featuredBlog.author?.avatarUrl ? (
                      <img src={featuredBlog.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      featuredBlog.author?.name?.charAt(0) || 'A'
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-dark-charcoal uppercase tracking-wider">{featuredBlog.author?.name || 'TrekWari Lead'}</p>
                    <p className="text-[9px] text-gray-400 font-bold">Author</p>
                  </div>
                </div>

                <span className="text-xs font-black uppercase tracking-wider text-primary-orange flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read Article
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Grid Feed with Controls */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16 space-y-10">
        
        {/* Controls Toolbar: Search & Categories */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white p-6 rounded-[24px] border border-gray-150 shadow-sm">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => { setActiveCategory('ALL'); setActiveTag(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'ALL' && !activeTag
                  ? 'bg-primary-orange text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Articles
            </button>
            {['Trek Guides', 'Travel Tips', 'Safety', 'Adventure Stories', 'Equipment', 'Announcements'].map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setActiveTag(''); }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-primary-orange text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input & Sort Toggle */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles, tags..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-primary-orange focus:bg-white transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark-charcoal">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={sortMode}
              onChange={(e: any) => setSortMode(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-dark-charcoal focus:outline-none focus:border-primary-orange cursor-pointer"
            >
              <option value="latest">Latest First</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Selected Tag Filter Banner */}
        {activeTag && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-900 text-xs px-4 py-2.5 rounded-xl font-bold">
            <Tag className="h-3.5 w-3.5 text-primary-orange" />
            <span>Filtering by tag: #{activeTag}</span>
            <button onClick={() => setActiveTag('')} className="ml-auto text-orange-700 hover:text-orange-950">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Article Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-[24px] p-5 border border-gray-150 animate-pulse space-y-4">
                <div className="h-48 bg-gray-100 rounded-xl" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-6 w-3/4 bg-gray-100 rounded" />
                <div className="h-12 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="bg-white border border-gray-150 rounded-[24px] p-16 text-center space-y-3">
            <BookOpen className="h-10 w-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-dark-charcoal font-display">No articles found</h3>
            <p className="text-xs text-gray-400 font-semibold max-w-sm mx-auto">
              Try adjusting your search query or switching category filters.
            </p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('ALL'); setActiveTag(''); }}
              className="bg-primary-orange text-white text-xs font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
              <div 
                key={blog.id}
                onClick={() => setSelectedBlog(blog)}
                className="bg-white border border-gray-150 rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-500/20 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Article Banner */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    <img
                      src={blog.bannerImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800'}
                      alt={blog.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
                    <span className="absolute top-4 left-4 bg-dark-charcoal/90 backdrop-blur-md text-white text-[9px] uppercase font-extrabold tracking-widest px-3 py-1 rounded-full border border-white/20">
                      {blog.category}
                    </span>
                    {blog.isFeatured && (
                      <span className="absolute top-4 right-4 bg-primary-orange text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Sparkles className="h-3 w-3" /> Featured
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                      <span className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-primary-orange" />
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1 text-primary-orange" />{blog.readTime || '4 min'}</span>
                        <span className="flex items-center"><Eye className="h-3.5 w-3.5 mr-1 text-gray-400" />{blog.views || 0}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-dark-charcoal font-display line-clamp-2 leading-snug group-hover:text-primary-orange transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-3 pt-2 border-t border-gray-100">
                      {blog.summary || blog.seoDescription || 'Read our trail guide and expedition preparation notes.'}
                    </p>

                    {/* Tag chips */}
                    {blog.tags && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {blog.tags.split(',').slice(0, 3).map((tagStr: string, idx: number) => {
                          const t = tagStr.trim();
                          if (!t) return null;
                          return (
                            <span 
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); setActiveTag(t); }}
                              className="text-[9px] font-bold text-gray-500 bg-gray-100 hover:bg-orange-50 hover:text-primary-orange px-2 py-0.5 rounded transition-colors"
                            >
                              #{t}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Author Strip */}
                <div className="px-6 pb-6 pt-0 border-t border-gray-50 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 pt-3">
                    <div className="h-7 w-7 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-[10px] text-primary-orange overflow-hidden">
                      {blog.author?.avatarUrl ? (
                        <img src={blog.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        blog.author?.name?.charAt(0) || 'A'
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider">{blog.author?.name || 'TrekWari Lead'}</span>
                  </div>
                  <span className="text-primary-orange text-xs font-black uppercase tracking-wider inline-flex items-center gap-1 group-hover:gap-2 transition-all pt-3">
                    Read
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ARTICLE READER LIGHTBOX MODAL WITH STICKY PROGRESS BAR */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex justify-center items-center p-3 sm:p-6 animate-in fade-in duration-200">
          
          <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[28px] border border-gray-200 shadow-2xl relative flex flex-col overflow-hidden">
            
            {/* Top Sticky Reading Progress Bar */}
            <div className="h-1.5 w-full bg-gray-100 relative z-30">
              <div 
                className="h-full bg-primary-orange transition-all duration-150"
                style={{ width: `${readingProgress}%` }}
              />
            </div>

            {/* Modal Header Controls Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-20">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-orange bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                  {selectedBlog.category}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  Reading Progress: {Math.round(readingProgress)}%
                </span>
              </div>
              <button 
                onClick={() => setSelectedBlog(null)}
                className="text-gray-400 hover:text-dark-charcoal p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Reader Content Body */}
            <div 
              ref={readerContentRef}
              onScroll={handleScrollProgress}
              className="overflow-y-auto p-6 sm:p-10 space-y-8 flex-1 custom-scrollbar"
            >
              {loadingDetails ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-orange" />
                </div>
              ) : (
                <>
                  {/* Hero Banner Image */}
                  <div className="relative h-64 sm:h-96 w-full rounded-[24px] overflow-hidden shadow-md">
                    <img 
                      src={blogDetails?.bannerImage || selectedBlog.bannerImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200'} 
                      alt={selectedBlog.title} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>

                  {/* Article Title & Author Header */}
                  <div className="space-y-4 border-b border-gray-100 pb-6">
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-dark-charcoal font-display leading-tight">
                      {selectedBlog.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-gray-500 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-primary-orange overflow-hidden">
                          {selectedBlog.author?.avatarUrl ? (
                            <img src={selectedBlog.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            selectedBlog.author?.name?.charAt(0) || 'A'
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-dark-charcoal uppercase tracking-wider">{selectedBlog.author?.name || 'TrekWari Lead'}</p>
                          <p className="text-[10px] text-gray-400">Published on {new Date(selectedBlog.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-gray-400 font-bold">
                        <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1 text-primary-orange" />{selectedBlog.readTime || '5 min read'}</span>
                        <span className="flex items-center"><Eye className="h-3.5 w-3.5 mr-1 text-gray-400" />{blogDetails?.views || selectedBlog.views || 0} views</span>
                        <span className="flex items-center"><ThumbsUp className="h-3.5 w-3.5 mr-1 text-primary-orange" />{blogDetails?.likes || selectedBlog.likes || 0} likes</span>
                      </div>
                    </div>
                  </div>

                  {/* Formatted HTML Article Content */}
                  <div 
                    className="text-xs sm:text-sm text-gray-700 leading-relaxed font-sans pt-2 space-y-4 rich-text"
                    dangerouslySetInnerHTML={{ __html: blogDetails?.content || selectedBlog.content }}
                  />

                  {/* Tags & Interaction Bar */}
                  <div className="border-t border-b border-gray-150 py-6 my-8 space-y-6">
                    
                    {/* Tags List */}
                    {selectedBlog.tags && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">Tags:</span>
                        {selectedBlog.tags.split(',').map((t: string, i: number) => {
                          const tag = t.trim();
                          if (!tag) return null;
                          return (
                            <span key={i} className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                              #{tag}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Social Sharing & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleLike}
                          className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-primary-orange border border-orange-200 font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Like ({blogDetails?.likes || 0})
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 mr-1 flex items-center gap-1">
                          <Share2 className="h-3.5 w-3.5" /> Share:
                        </span>
                        <button onClick={() => handleShare('whatsapp')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 cursor-pointer" title="Share on WhatsApp">
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleShare('facebook')} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 cursor-pointer" title="Share on Facebook">
                          <Facebook className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleShare('twitter')} className="p-2 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-100 cursor-pointer" title="Share on X">
                          <Twitter className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleShare('linkedin')} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 cursor-pointer" title="Share on LinkedIn">
                          <Linkedin className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleShare('copy')} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 cursor-pointer" title="Copy Link">
                          {copiedLink ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Related Articles & Treks */}
                  {blogDetails?.relatedArticles?.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <h3 className="text-base font-extrabold text-dark-charcoal font-display uppercase tracking-wider">Related Expedition Articles</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {blogDetails.relatedArticles.map((rel: any) => (
                          <div 
                            key={rel.id}
                            onClick={() => setSelectedBlog(rel)}
                            className="bg-gray-50 p-4 rounded-2xl border border-gray-150 hover:border-primary-orange cursor-pointer transition-all flex gap-3"
                          >
                            <img src={rel.bannerImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400'} alt="" className="h-14 w-20 object-cover rounded-xl shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-dark-charcoal line-clamp-2">{rel.title}</p>
                              <p className="text-[10px] text-gray-400 font-semibold mt-1">{new Date(rel.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {blogDetails?.relatedTreks?.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                      <h3 className="text-base font-extrabold text-dark-charcoal font-display uppercase tracking-wider">Recommended Treks</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {blogDetails.relatedTreks.map((trek: any) => (
                          <a key={trek.id} href={`/treks/${trek.slug}`} target="_blank" rel="noreferrer" className="bg-warm-white p-4 rounded-2xl border border-gray-150 hover:border-primary-orange transition-all block space-y-2">
                            <p className="text-xs font-extrabold text-dark-charcoal line-clamp-1">{trek.title}</p>
                            <p className="text-[10px] text-gray-500 flex items-center gap-1 font-semibold"><MapPin className="h-3 w-3 text-primary-orange" />{trek.location}</p>
                            <div className="flex justify-between items-center text-xs font-bold pt-1">
                              <span className="text-primary-orange">₹{trek.price}</span>
                              <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-extrabold">Book Now</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments Section */}
                  <div className="space-y-6 pt-8 border-t border-gray-150">
                    <h3 className="text-base font-extrabold text-dark-charcoal font-display flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary-orange" />
                      Comments ({blogDetails?.comments?.length || 0})
                    </h3>

                    {/* Write Comment Form */}
                    <form onSubmit={handleAddComment} className="space-y-3">
                      <textarea
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder={isAuthenticated ? "Share your thoughts or questions about this trek guide..." : "Please login to leave a comment."}
                        disabled={!isAuthenticated || submittingComment}
                        rows={3}
                        className="w-full border border-gray-200 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:border-primary-orange bg-gray-50 focus:bg-white transition-all disabled:opacity-60"
                      />
                      {isAuthenticated && (
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={submittingComment || !commentInput.trim()}
                            className="bg-primary-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-sm"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Post Comment
                          </button>
                        </div>
                      )}
                    </form>

                    {/* Comments List */}
                    <div className="space-y-4 pt-2">
                      {blogDetails?.comments?.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-6">Be the first to comment on this article!</p>
                      ) : (
                        blogDetails?.comments?.map((comment: any) => (
                          <div key={comment.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-150 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-[9px] text-primary-orange overflow-hidden">
                                  {comment.user?.avatarUrl ? (
                                    <img src={comment.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    comment.user?.name?.charAt(0) || 'U'
                                  )}
                                </div>
                                <span className="font-extrabold text-dark-charcoal">{comment.user?.name || 'Hiker'}</span>
                                {comment.isPinned && (
                                  <span className="bg-orange-100 text-primary-orange text-[9px] font-black px-2 py-0.5 rounded">PINNED</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                {(user?.id === comment.userId || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                  <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-400 hover:text-red-500 p-1 text-[10px] font-bold">
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-600 font-semibold leading-relaxed pl-8">{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
