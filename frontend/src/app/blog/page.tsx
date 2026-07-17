'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WhatsAppWidget from '../../components/WhatsAppWidget';
import { api } from '../../lib/api';
import { Calendar, User, Clock, ArrowRight, X } from 'lucide-react';

interface BlogItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  image: string | null;
  readTime: string;
  createdAt: string;
  author: {
    name: string;
    avatarUrl: string;
  };
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<BlogItem | null>(null);

  useEffect(() => {
    async function loadBlogs() {
      try {
        const data = await api.blogs.list();
        setBlogs(data);
      } catch (err) {
        console.error('Failed to load blog posts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  return (
    <main className="min-h-screen relative bg-gray-50">
      <Navbar />
      <WhatsAppWidget />

      {/* Header */}
      <section className="bg-forest-green pt-32 pb-16 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 space-y-2">
          <span className="text-xs uppercase tracking-[0.3em] font-bold text-sunrise-orange">Adventure guides & logs</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">TreckWari Blog</h1>
          <p className="text-sm text-emerald-100/70 max-w-lg mx-auto pt-2 leading-relaxed">
            Tips, route summaries, and gear guides authored by certified trek leaders.
          </p>
        </div>
      </section>

      {/* Blogs list */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-forest-green" />
          </div>
        ) : blogs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-12">No blog articles published yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <div 
                key={blog.id}
                onClick={() => setSelectedBlog(blog)}
                className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Article Banner */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={blog.image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800'}
                      alt={blog.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    <span className="absolute top-4 left-4 bg-forest-green text-white text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded">
                      {blog.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-3">
                    {/* Date/Time strip */}
                    <div className="flex gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {blog.readTime}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-forest-green font-display line-clamp-2 mt-2 group-hover:text-emerald-800 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 pt-2 border-t border-gray-50">
                      {blog.summary}
                    </p>
                  </div>
                </div>

                {/* Author profile */}
                <div className="px-6 pb-6 pt-0 flex justify-between items-center border-t border-gray-50 mt-4">
                  <div className="flex items-center gap-2 pt-3">
                    <img src={blog.author.avatarUrl} alt={blog.author.name} className="h-7 w-7 rounded-full object-cover" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{blog.author.name}</span>
                  </div>
                  <span className="text-sunrise-orange text-xs font-bold uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all pt-3">
                    Read Article
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Blog Detail Overlay Lightbox */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-2xl relative flex flex-col justify-between">
            <button 
              onClick={() => setSelectedBlog(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              {/* Header Image */}
              <div className="relative h-64 w-full rounded-2xl overflow-hidden mb-6">
                <img 
                  src={selectedBlog.image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800'} 
                  alt={selectedBlog.title} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-4 left-4 bg-forest-green text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg">
                  {selectedBlog.category}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-extrabold text-forest-green font-display">{selectedBlog.title}</h2>
                <div className="flex gap-6 text-[10px] text-gray-400 font-bold uppercase tracking-wider pb-4 border-b border-gray-100">
                  <span className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1 text-sunrise-orange" />
                    {new Date(selectedBlog.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1 text-sunrise-orange" />
                    {selectedBlog.readTime}
                  </span>
                  <span className="flex items-center">
                    <User className="h-3.5 w-3.5 mr-1 text-sunrise-orange" />
                    By {selectedBlog.author.name}
                  </span>
                </div>
              </div>

              {/* Text content */}
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed font-sans font-light space-y-4 pt-6 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                {selectedBlog.content.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-150 pt-6 mt-6 flex justify-end">
              <button 
                onClick={() => setSelectedBlog(null)}
                className="bg-forest-green text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl hover:bg-emerald-800 transition-colors"
              >
                Close Article
              </button>
            </div>

          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
