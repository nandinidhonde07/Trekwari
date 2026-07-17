import { Router } from 'express';
import { getEvents, getEventBySlug, createEvent, updateEvent, deleteEvent, duplicateEvent } from '../controllers/trekController';
import { submitReview, getPendingReviews, approveReview, deleteReview } from '../controllers/reviewController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getEvents);
router.get('/:slug', getEventBySlug);

// Admin-only event management
router.post('/', requireAuth, requireAdmin, createEvent);
router.put('/:id', requireAuth, requireAdmin, updateEvent);
router.delete('/:id', requireAuth, requireAdmin, deleteEvent);
router.post('/:id/duplicate', requireAuth, requireAdmin, duplicateEvent);

// Reviews management
router.post('/:slug/reviews', requireAuth, submitReview);
router.get('/admin/reviews/pending', requireAuth, requireAdmin, getPendingReviews);
router.put('/admin/reviews/:id/approve', requireAuth, requireAdmin, approveReview);
router.delete('/reviews/:id', requireAuth, deleteReview);

export default router;
