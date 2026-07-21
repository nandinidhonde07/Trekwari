'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

export default function LatestArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHomepageArticles() {
      try {
        const data = await api.blogs.list();
        if (Array.isArray(data)) {
          // Filter out isFeatured article to avoid duplication
          const nonFeatured = data.filter((a: any) => !a.isFeatured);
          setArticles(nonFeatured.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to load homepage articles:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHomepageArticles();
  }, []);

  return (
    <section className="relative z-30 bg-warm-white py-24 border-t border-gray-150">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] font-extrabold text-primary-orange flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Trek Logs & Field Guides
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-dark-charcoal font-display leading-[1.15]">
              Latest Expedition Articles
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-xl">
              Trail insights, fitness preparation checklists, and wilderness safety tips written by certified mountaineers.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-primary-orange hover:text-orange-600 transition-colors bg-orange-50 border border-orange-200/60 px-6 py-3.5 rounded-xl self-start md:self-auto"
          >
            Explore All Articles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-[20px] p-4 border border-gray-150 animate-pulse space-y-4">
                <div className="h-48 bg-gray-100 rounded-xl" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-6 w-3/4 bg-gray-100 rounded" />
                <div className="h-12 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white border border-gray-150 rounded-[20px] p-12 text-center text-xs text-gray-400 font-semibold">
            No articles published yet. Stay tuned for upcoming trek guides!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {articles.map((article, idx) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white border border-gray-150 rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl hover:border-orange-500/20 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Banner Image */}
                  <div className="relative h-52 overflow-hidden bg-gray-100">
                    <img
                      src={article.bannerImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800'}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
                    <span className="absolute top-4 left-4 bg-dark-charcoal/90 backdrop-blur-md text-white text-[9px] uppercase font-extrabold tracking-widest px-3 py-1 rounded-full border border-white/20">
                      {article.category || 'Trekking'}
                    </span>
                    {article.isFeatured && (
                      <span className="absolute top-4 right-4 bg-primary-orange text-white text-[9px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                        <Sparkles className="h-3 w-3" /> Featured
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                      <span className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-primary-orange" />
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1 text-primary-orange" />
                        {article.readTime || '4 min read'}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-dark-charcoal font-display line-clamp-2 group-hover:text-primary-orange transition-colors leading-snug">
                      {article.title}
                    </h3>

                    <p className="text-xs text-gray-500 font-medium line-clamp-3 leading-relaxed border-t border-gray-100 pt-3">
                      {article.summary || article.seoDescription || 'Read our detailed expedition log and essential trek notes.'}
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 pb-6 pt-0 border-t border-gray-50 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 pt-3">
                    <div className="h-7 w-7 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-[10px] text-primary-orange overflow-hidden">
                      {article.author?.avatarUrl ? (
                        <img src={article.author.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        article.author?.name?.charAt(0) || 'A'
                      )}
                    </div>
                    <span className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider">
                      {article.author?.name || 'TrekWari Team'}
                    </span>
                  </div>

                  <Link
                    href="/blog"
                    className="text-xs font-extrabold text-primary-orange uppercase tracking-wider inline-flex items-center gap-1 group-hover:gap-2 transition-all pt-3"
                  >
                    Read More
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
