import { Router } from 'express';
import { createBooking, confirmBookingPayment, getUserBookings, verifyBooking, getAllBookings } from '../controllers/bookingController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public QR Verification endpoint
router.get('/verify/:id', verifyBooking);

// Protected routes
router.post('/', requireAuth, createBooking);
router.post('/confirm-payment', requireAuth, confirmBookingPayment);
router.get('/my-bookings', requireAuth, getUserBookings);
router.get('/admin/all', requireAuth, requireAdmin, getAllBookings);

export default router;
