import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from './ui/toast';
import { Star, MessageSquare, ShieldAlert, Award, Pin, EyeOff, CornerDownRight, Check, X } from 'lucide-react';

export function AdminReviewAnalytics() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.reviews.getAnalytics();
      setAnalytics(data);

      const pending = await api.reviews.getPending();
      setPendingReviews(pending);
    } catch (err: any) {
      console.error(err);
      toast('Error loading analytics: ' + (err.message || 'Failed to fetch reviews data.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.reviews.approve(id);
      toast('Review approved. The review is now public.', 'success');
      fetchData();
    } catch (err: any) {
      toast('Approval failed: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await api.reviews.delete(id);
      toast('Review deleted successfully', 'success');
      fetchData();
    } catch (err: any) {
      toast('Delete failed: ' + err.message, 'error');
    }
  };

  const handleTogglePin = async (id: string, currentlyPinned: boolean) => {
    try {
      await api.reviews.updateStatus(id, { pinned: !currentlyPinned });
      toast(currentlyPinned ? 'Review unpinned' : 'Review pinned successfully', 'success');
      fetchData();
    } catch (err: any) {
      toast('Failed to update review status: ' + err.message, 'error');
    }
  };

  const handleToggleHide = async (id: string, currentlyHidden: boolean) => {
    try {
      await api.reviews.updateStatus(id, { hidden: !currentlyHidden });
      toast(currentlyHidden ? 'Review is now visible' : 'Review hidden successfully', 'success');
      fetchData();
    } catch (err: any) {
      toast('Failed to update review status: ' + err.message, 'error');
    }
  };

  const handlePostReply = async (id: string) => {
    if (!replyText.trim()) return;
    try {
      await api.reviews.updateStatus(id, { replyComment: replyText });
      toast('Reply posted. Admin reply submitted successfully.', 'success');
      setReplyingToId(null);
      setReplyText('');
      fetchData();
    } catch (err: any) {
      toast('Failed to post reply: ' + err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const sentiment = analytics?.sentimentAnalysis || { positive: 0, neutral: 0, negative: 0 };
  const totalSentiment = sentiment.positive + sentiment.neutral + sentiment.negative || 1;
  const positivePercent = Math.round((sentiment.positive / totalSentiment) * 100);
  const neutralPercent = Math.round((sentiment.neutral / totalSentiment) * 100);
  const negativePercent = Math.round((sentiment.negative / totalSentiment) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Analytics Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Average Stars Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Average Trek Rating</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-gray-800">{analytics?.averageRating || 0}</span>
              <span className="text-gray-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.round(analytics?.averageRating || 0) ? 'fill-current' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="border-t border-gray-50 pt-4 mt-4 text-xs text-gray-400">
            Total Reviews: <span className="font-bold text-gray-700">{analytics?.totalReviews || 0}</span>
          </div>
        </div>

        {/* Sentiment Analysis Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">AI Sentiment Analytics</span>
          <div className="space-y-3 mt-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-green-600">Positive</span>
                <span>{positivePercent}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full rounded-full" style={{ width: `${positivePercent}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-yellow-600">Neutral</span>
                <span>{neutralPercent}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${neutralPercent}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-red-600">Negative</span>
                <span>{negativePercent}%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: `${negativePercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Most/Lowest Rated Treks */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Most Reviewed Batch</span>
              <p className="text-sm font-extrabold text-gray-700 mt-1">{analytics?.mostReviewedTrek || 'N/A'}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider text-red-500">Lowest Rated Batch</span>
              <p className="text-sm font-extrabold text-red-600 mt-1">{analytics?.lowestRatedTrek || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Roster & Word Cloud Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Word Cloud */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-4">Sentiment Word Cloud</h3>
          {analytics?.wordCloud && analytics.wordCloud.length > 0 ? (
            <div className="flex flex-wrap gap-3 items-center justify-center py-6 bg-gray-50 rounded-xl px-4 min-h-[160px]">
              {analytics.wordCloud.map((word: any, index: number) => {
                const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
                const colors = ['text-orange-400', 'text-emerald-500', 'text-blue-500', 'text-orange-600', 'text-indigo-600', 'text-emerald-600'];
                const sizeClass = sizes[Math.min(word.value - 1, sizes.length - 1)] || 'text-sm';
                const colorClass = colors[index % colors.length];
                return (
                  <span
                    key={index}
                    className={`${sizeClass} ${colorClass} font-extrabold tracking-tight transition-all hover:scale-110 cursor-pointer duration-200`}
                    title={`Occurred ${word.value} times`}
                  >
                    {word.text}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-8">Not enough data to construct word cloud.</p>
          )}
        </div>

        {/* Common Complaints */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-4">Common Issues / Complaints</h3>
          {analytics?.commonComplaints && analytics.commonComplaints.length > 0 ? (
            <div className="space-y-4">
              {analytics.commonComplaints.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
                    <span className="text-xs font-bold text-gray-600">{item.category}</span>
                  </div>
                  <span className="text-xs font-extrabold bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
                    {item.count} reports
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <span className="text-emerald-500 font-extrabold text-xs bg-emerald-50 px-3 py-1.5 rounded-full">
                ✔ Zero active complaints detected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quarantine Queue (Pending Approvals) */}
      {pendingReviews.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm shadow-red-500/5">
          <h3 className="text-sm font-extrabold text-red-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
            Review Approvals Queue ({pendingReviews.length})
          </h3>
          <div className="space-y-6">
            {pendingReviews.map((rev) => (
              <div key={rev.id} className="p-5 bg-red-50/20 border border-red-50 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-gray-700">{rev.user.name}</span>
                    <span className="text-[10px] text-gray-400 block">{rev.event.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(rev.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-lg cursor-pointer transition-colors"
                      title="Approve & Publish"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rev.id)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg cursor-pointer transition-colors"
                      title="Reject & Delete"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4.5 w-4.5 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} />
                  ))}
                  {rev.title && <span className="ml-2 text-xs font-bold text-gray-800">"{rev.title}"</span>}
                </div>

                <p className="text-xs text-gray-600 italic">"{rev.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pinned & Active Reviews Moderation list */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wider mb-6">Active Reviews Moderation</h3>
        
        {/* Fetch list of all reviews and render */}
        <ReviewList
          replyingToId={replyingToId}
          setReplyingToId={setReplyingToId}
          replyText={replyText}
          setReplyText={setReplyText}
          handleTogglePin={handleTogglePin}
          handleToggleHide={handleToggleHide}
          handlePostReply={handlePostReply}
          handleDelete={handleDelete}
          toast={toast}
        />
      </div>
    </div>
  );
}

// Child Helper component to render list of reviews
function ReviewList({
  replyingToId,
  setReplyingToId,
  replyText,
  setReplyText,
  handleTogglePin,
  handleToggleHide,
  handlePostReply,
  handleDelete,
  toast
}: any) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      // Fetch all reviews using standard event route or settings
      const data = await api.events.list(); // fetch some treks to read reviews
      // Gather all reviews across all events (or fetch directly)
      const all: any[] = [];
      for (const trek of data) {
        const fullTrek = await api.events.get(trek.slug);
        if (fullTrek.reviews) {
          fullTrek.reviews.forEach((r: any) => {
            all.push({ ...r, trekTitle: trek.title });
          });
        }
      }
      // Sort reviews (pinned first, then date)
      all.sort((a: any, b: any) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setReviews(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-xs text-gray-400 text-center py-6">Loading active reviews feed...</p>;
  }

  if (reviews.length === 0) {
    return <p className="text-xs text-gray-400 text-center py-6">No approved reviews in the system yet.</p>;
  }

  return (
    <div className="space-y-6">
      {reviews.map((rev) => (
        <div
          key={rev.id}
          className={`p-5 rounded-xl border transition-all ${
            rev.pinned ? 'bg-orange-50/20 border-orange-200' : 'bg-white border-gray-100'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center font-extrabold text-gray-500 text-xs">
                {rev.isAnonymous ? 'A' : rev.user?.name ? rev.user.name[0] : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-gray-700">
                    {rev.isAnonymous ? 'Anonymous Reviewer' : rev.user?.name || 'Verified Hiker'}
                  </span>
                  {rev.isVerified && (
                    <span className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded">
                      <Award className="h-2.5 w-2.5 fill-current" /> VERIFIED
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 block">{rev.trekTitle}</span>
              </div>
            </div>

            {/* Moderation Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTogglePin(rev.id, rev.pinned)}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  rev.pinned ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:bg-gray-50'
                }`}
                title={rev.pinned ? 'Unpin from Homepage' : 'Pin to Homepage'}
              >
                <Pin className="h-4.5 w-4.5 fill-current" />
              </button>
              <button
                onClick={() => handleToggleHide(rev.id, rev.hidden)}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  rev.hidden ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:bg-gray-50'
                }`}
                title={rev.hidden ? 'Make Review Public' : 'Hide from Public'}
              >
                <EyeOff className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => {
                  setReplyingToId(rev.id);
                  setReplyText(rev.replyComment || '');
                }}
                className="text-gray-400 hover:bg-gray-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                title="Reply to Review"
              >
                <MessageSquare className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => handleDelete(rev.id).then(() => loadReviews())}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg cursor-pointer transition-colors"
                title="Delete Review (Hyper Admin)"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Stars & Content */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-1.5 text-yellow-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} />
              ))}
              {rev.title && <span className="ml-2 text-xs font-bold text-gray-800">"{rev.title}"</span>}
            </div>

            <p className="text-xs text-gray-600 italic">"{rev.comment}"</p>

            {/* Granular Ratings Breakdown Drawer */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-55/35 p-3 rounded-lg border border-gray-100 text-[10px] text-gray-500 mt-2">
              <div>Trek Experience: <span className="font-bold text-gray-700">{rev.ratingExperience || 'N/A'}/5</span></div>
              <div>Leader Rating: <span className="font-bold text-gray-700">{rev.ratingCoordinator || 'N/A'}/5</span></div>
              <div>Safety Rating: <span className="font-bold text-gray-700">{rev.ratingSafety || 'N/A'}/5</span></div>
              <div>Food Rating: <span className="font-bold text-gray-700">{rev.ratingFood || 'N/A'}/5</span></div>
            </div>

            {/* Render Reply */}
            {rev.replyComment && (
              <div className="flex gap-2 bg-gray-50 p-3.5 rounded-lg border border-gray-100 mt-3 text-xs text-gray-600">
                <CornerDownRight className="h-4.5 w-4.5 text-gray-400 shrink-0" />
                <div>
                  <span className="font-extrabold text-orange-600 text-[10px] uppercase block tracking-wider mb-1">
                    TrekWari Official Reply
                  </span>
                  <p className="italic">"{rev.replyComment}"</p>
                </div>
              </div>
            )}

            {/* Reply Drawer Form */}
            {replyingToId === rev.id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <span className="text-xs font-extrabold text-gray-700">Write Reply Response</span>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-white p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  rows={3}
                  placeholder="Thank you for sharing your experience! We look forward..."
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setReplyingToId(null)}
                    className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePostReply(rev.id).then(() => {
                      setReviews(reviews.map(r => r.id === rev.id ? { ...r, replyComment: replyText } : r));
                    })}
                    className="px-3.5 py-1.5 bg-primary-orange text-white rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Submit Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
