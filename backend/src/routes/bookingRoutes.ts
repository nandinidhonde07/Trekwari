import { Router } from 'express';
import { 
  createBooking, 
  confirmBookingPayment, 
  getUserBookings, 
  verifyBooking, 
  getAllBookings,
  downloadBookingTicketPDF,
  verifyBookingQR,
  checkInParticipant,
  getAttendanceStats,
  validateCoupon
} from '../controllers/bookingController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public QR Verification fallback endpoint
router.get('/verify/:id', verifyBooking);

// Protected user bookings
router.post('/', requireAuth, createBooking);
router.post('/coupons/validate', requireAuth, validateCoupon);
router.post('/confirm-payment', requireAuth, confirmBookingPayment);
router.get('/my-bookings', requireAuth, getUserBookings);
router.get('/:id/ticket/pdf', requireAuth, downloadBookingTicketPDF);

// Admin-only operations scanning & boarding rosters
router.get('/admin/all', requireAuth, requireAdmin, getAllBookings);
router.get('/admin/attendance-stats', requireAuth, requireAdmin, getAttendanceStats);
router.post('/scan/verify', requireAuth, requireAdmin, verifyBookingQR);
router.post('/scan/checkin', requireAuth, requireAdmin, checkInParticipant);

export default router;
