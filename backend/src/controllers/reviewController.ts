import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Submits a new review for an event (requires authentication).
 */
export async function submitReview(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { 
    eventId, rating, ratingExperience, ratingCoordinator, ratingSafety, 
    ratingFood, ratingTransportation, ratingDifficulty, ratingValue, 
    wouldRecommend, title, comment, images, isAnonymous 
  } = req.body;

  if (!eventId || rating === undefined || !comment) {
    return res.status(400).json({ error: 'Missing required review details. Overall Rating and comment text are mandatory.' });
  }

  const rValue = parseInt(rating);
  if (rValue < 1 || rValue > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
  }

  try {
    // 1. Verify user completed the trek
    const completedBooking = await prisma.booking.findFirst({
      where: {
        userId: req.user.id,
        eventId,
        paymentStatus: 'PAID',
        event: {
          endDate: { lt: new Date() }
        }
      }
    });

    if (!completedBooking) {
      return res.status(400).json({ error: 'You can only review treks you have officially booked, paid for, and completed.' });
    }

    // 2. Prevent duplicate reviews
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: req.user.id,
        eventId
      }
    });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already submitted a review for this trek.' });
    }

    // 3. Upload images to Cloudinary
    const { uploadToCloudinary } = require('../utils/cloudinary');
    let finalUrls: string[] = [];
    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img.startsWith('data:image/')) {
          const secureUrl = await uploadToCloudinary(img, 'reviews');
          finalUrls.push(secureUrl);
        } else {
          finalUrls.push(img);
        }
      }
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        eventId,
        rating: rValue,
        ratingExperience: ratingExperience !== undefined ? parseInt(ratingExperience) : null,
        ratingCoordinator: ratingCoordinator !== undefined ? parseInt(ratingCoordinator) : null,
        ratingSafety: ratingSafety !== undefined ? parseInt(ratingSafety) : null,
        ratingFood: ratingFood !== undefined ? parseInt(ratingFood) : null,
        ratingTransportation: ratingTransportation !== undefined ? parseInt(ratingTransportation) : null,
        ratingDifficulty: ratingDifficulty || 'Moderate',
        ratingValue: ratingValue !== undefined ? parseInt(ratingValue) : null,
        wouldRecommend: wouldRecommend !== undefined ? !!wouldRecommend : true,
        title: title || '',
        comment,
        images: JSON.stringify(finalUrls),
        isAnonymous: !!isAnonymous,
        isVerified: true,
        isApproved: false // Auto-quarantine reviews for Admin approval
      }
    });

    return res.status(201).json({
      message: 'Review submitted successfully! It is pending approval by the organizer.',
      review
    });
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({ error: 'Failed to save review.' });
  }
}

/**
 * Edits an existing review (owner only).
 */
export async function editReview(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { id } = req.params;
  const { 
    rating, ratingExperience, ratingCoordinator, ratingSafety, 
    ratingFood, ratingTransportation, ratingDifficulty, ratingValue, 
    wouldRecommend, title, comment, images, isAnonymous 
  } = req.body;

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    if (review.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only edit your own reviews.' });
    }

    const { uploadToCloudinary } = require('../utils/cloudinary');
    let finalUrls: string[] = [];
    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img.startsWith('data:image/')) {
          const url = await uploadToCloudinary(img, 'reviews');
          finalUrls.push(url);
        } else {
          finalUrls.push(img);
        }
      }
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: rating !== undefined ? parseInt(rating) : review.rating,
        ratingExperience: ratingExperience !== undefined ? parseInt(ratingExperience) : review.ratingExperience,
        ratingCoordinator: ratingCoordinator !== undefined ? parseInt(ratingCoordinator) : review.ratingCoordinator,
        ratingSafety: ratingSafety !== undefined ? parseInt(ratingSafety) : review.ratingSafety,
        ratingFood: ratingFood !== undefined ? parseInt(ratingFood) : review.ratingFood,
        ratingTransportation: ratingTransportation !== undefined ? parseInt(ratingTransportation) : review.ratingTransportation,
        ratingDifficulty: ratingDifficulty || review.ratingDifficulty,
        ratingValue: ratingValue !== undefined ? parseInt(ratingValue) : review.ratingValue,
        wouldRecommend: wouldRecommend !== undefined ? !!wouldRecommend : review.wouldRecommend,
        title: title !== undefined ? title : review.title,
        comment: comment !== undefined ? comment : review.comment,
        images: images ? JSON.stringify(finalUrls) : review.images,
        isAnonymous: isAnonymous !== undefined ? !!isAnonymous : review.isAnonymous
      }
    });

    return res.json({ message: 'Review updated successfully!', review: updated });
  } catch (error) {
    console.error('Edit review error:', error);
    return res.status(500).json({ error: 'Failed to update review.' });
  }
}

/**
 * Gets all pending reviews for admin approval (Admin only).
 */
export async function getPendingReviews(req: AuthRequest, res: Response) {
  try {
    const pendingReviews = await prisma.review.findMany({
      where: { isApproved: false },
      include: {
        user: { select: { name: true, email: true, avatarUrl: true } },
        event: { select: { title: true, slug: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedReviews = pendingReviews.map(r => ({
      ...r,
      images: JSON.parse(r.images as string || '[]')
    }));

    return res.json(formattedReviews);
  } catch (error) {
    console.error('Get pending reviews error:', error);
    return res.status(500).json({ error: 'Failed to retrieve pending reviews.' });
  }
}

/**
 * Approves a review (Admin only).
 */
export async function approveReview(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    await prisma.review.update({
      where: { id },
      data: { isApproved: true }
    });

    return res.json({ message: 'Review approved and published successfully.' });
  } catch (error) {
    console.error('Approve review error:', error);
    return res.status(500).json({ error: 'Failed to approve review.' });
  }
}

/**
 * Deletes a review (Hyper Admin/Owner).
 */
export async function deleteReview(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    // Verify ownership or Hyper Admin privileges
    const isOwner = review.userId === req.user?.id;
    const isStaff = req.user?.role === 'SUPER_ADMIN';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Unauthorized. Only Hyper Admin or the review owner can delete reviews.' });
    }

    await prisma.review.delete({ where: { id } });
    return res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({ error: 'Failed to delete review.' });
  }
}

/**
 * Pins, hides, or replies to a review (Admin/Super Admin only).
 */
export async function adminUpdateReviewStatus(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { pinned, hidden, replyComment } = req.body;

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        pinned: pinned !== undefined ? !!pinned : review.pinned,
        hidden: hidden !== undefined ? !!hidden : review.hidden,
        replyComment: replyComment !== undefined ? replyComment : review.replyComment
      }
    });

    return res.json({
      message: 'Review moderation updated successfully.',
      review: updated
    });
  } catch (error) {
    console.error('Admin update review status error:', error);
    return res.status(500).json({ error: 'Failed to moderate review.' });
  }
}

/**
 * Fetches review analytics for Admin.
 */
export async function getReviewAnalytics(req: AuthRequest, res: Response) {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        event: { select: { title: true, slug: true } }
      }
    });

    if (reviews.length === 0) {
      return res.json({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        sentimentAnalysis: { positive: 0, neutral: 0, negative: 0 },
        mostReviewedTrek: 'N/A',
        lowestRatedTrek: 'N/A',
        monthlyTrends: [],
        commonComplaints: [],
        wordCloud: []
      });
    }

    const totalReviews = reviews.length;
    const totalRatingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = parseFloat((totalRatingSum / totalReviews).toFixed(1));

    // Distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      const rating = r.rating as 1 | 2 | 3 | 4 | 5;
      if (ratingDistribution[rating] !== undefined) {
        ratingDistribution[rating]++;
      }
    });

    // Sentiment and complaints analysis (rule-based)
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    const complaintsMap: { [key: string]: number } = {};
    const wordsMap: { [key: string]: number } = {};

    const negativeKeywords = ['bad', 'worst', 'dirty', 'late', 'terrible', 'poor', 'unhygienic', 'cold', 'expensive', 'delay', 'rude', 'safety', 'unsafe'];
    const positiveKeywords = ['excellent', 'awesome', 'great', 'delicious', 'friendly', 'safe', 'loved', 'summit', 'amazing', 'best', 'superb', 'beautiful'];

    reviews.forEach(r => {
      const text = `${r.title || ''} ${r.comment}`.toLowerCase();
      
      // Basic sentiment scoring
      let score = 0;
      positiveKeywords.forEach(w => { if (text.includes(w)) score++; });
      negativeKeywords.forEach(w => { if (text.includes(w)) score--; });

      if (score > 0 || r.rating >= 4) {
        positive++;
      } else if (score < 0 || r.rating <= 2) {
        negative++;
      } else {
        neutral++;
      }

      // Check common complaints
      if (text.includes('food') && (text.includes('bad') || text.includes('poor') || text.includes('cold') || text.includes('dirty'))) {
        complaintsMap['Food Quality'] = (complaintsMap['Food Quality'] || 0) + 1;
      }
      if (text.includes('bus') || text.includes('transport') || text.includes('vehicle') || text.includes('driver')) {
        if (text.includes('late') || text.includes('delay') || text.includes('broke') || text.includes('slow')) {
          complaintsMap['Transport Delay'] = (complaintsMap['Transport Delay'] || 0) + 1;
        }
      }
      if (text.includes('leader') || text.includes('coordinator') || text.includes('guide')) {
        if (text.includes('rude') || text.includes('unprofessional') || text.includes('lost') || text.includes('bad')) {
          complaintsMap['Coordinator Behavior'] = (complaintsMap['Coordinator Behavior'] || 0) + 1;
        }
      }
      if (text.includes('safety') || text.includes('accident') || text.includes('scared') || text.includes('injury')) {
        complaintsMap['Safety Concerns'] = (complaintsMap['Safety Concerns'] || 0) + 1;
      }

      // Populate word cloud
      const words = text.replace(/[^a-zA-Z\s]/g, '').split(/\s+/);
      words.forEach(w => {
        if (w.length > 4 && !['about', 'there', 'their', 'would', 'could', 'should', 'other', 'really', 'great', 'trekking', 'trekwari'].includes(w)) {
          wordsMap[w] = (wordsMap[w] || 0) + 1;
        }
      });
    });

    // Format Word Cloud (top 15 words)
    const wordCloud = Object.keys(wordsMap)
      .map(key => ({ text: key, value: wordsMap[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    // Format Common Complaints
    const commonComplaints = Object.keys(complaintsMap)
      .map(key => ({ category: key, count: complaintsMap[key] }))
      .sort((a, b) => b.count - a.count);

    // Most Reviewed and Lowest Rated
    const trekStats: { [id: string]: { title: string; sum: number; count: number } } = {};
    reviews.forEach(r => {
      const id = r.eventId;
      if (!trekStats[id]) {
        trekStats[id] = { title: r.event.title, sum: 0, count: 0 };
      }
      trekStats[id].sum += r.rating;
      trekStats[id].count += 1;
    });

    let mostReviewedTrek = 'N/A';
    let maxCount = 0;
    let lowestRatedTrek = 'N/A';
    let minAvg = 6;

    Object.keys(trekStats).forEach(id => {
      const stat = trekStats[id];
      if (stat.count > maxCount) {
        maxCount = stat.count;
        mostReviewedTrek = stat.title;
      }
      const avg = stat.sum / stat.count;
      if (avg < minAvg) {
        minAvg = avg;
        lowestRatedTrek = `${stat.title} (${avg.toFixed(1)}⭐)`;
      }
    });

    // Monthly trends
    const monthlyMap: { [key: string]: { sum: number; count: number } } = {};
    reviews.forEach(r => {
      const monthStr = new Date(r.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = { sum: 0, count: 0 };
      }
      monthlyMap[monthStr].sum += r.rating;
      monthlyMap[monthStr].count += 1;
    });

    const monthlyTrends = Object.keys(monthlyMap)
      .map(month => ({
        month,
        avgRating: parseFloat((monthlyMap[month].sum / monthlyMap[month].count).toFixed(1)),
        count: monthlyMap[month].count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return res.json({
      totalReviews,
      averageRating,
      ratingDistribution,
      sentimentAnalysis: { positive, neutral, negative },
      mostReviewedTrek,
      lowestRatedTrek,
      monthlyTrends,
      commonComplaints,
      wordCloud
    });
  } catch (error) {
    console.error('Review analytics error:', error);
    return res.status(500).json({ error: 'Failed to generate review analytics.' });
  }
}
