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

  const { eventId, rating, comment, images } = req.body;

  if (!eventId || rating === undefined || !comment) {
    return res.status(400).json({ error: 'Missing required review details.' });
  }

  const rValue = parseInt(rating);
  if (rValue < 1 || rValue > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5 stars.' });
  }

  try {
    // Optional check: verify user actually completed/booked this trek
    const hasBooked = await prisma.booking.findFirst({
      where: {
        userId: req.user.id,
        eventId,
        paymentStatus: 'PAID'
      }
    });

    if (!hasBooked) {
      return res.status(400).json({ error: 'You can only review treks you have officially booked.' });
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        eventId,
        rating: rValue,
        comment,
        images: JSON.stringify(images || []),
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
 * Deletes a review (Admin/Owner).
 */
export async function deleteReview(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: 'Review not found.' });
    }

    // Verify ownership or admin privileges
    const isOwner = review.userId === req.user?.id;
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    await prisma.review.delete({ where: { id } });
    return res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({ error: 'Failed to delete review.' });
  }
}
