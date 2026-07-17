import { Router } from 'express';
import { getLeaderEvents, getEventRoster, markAttendance } from '../controllers/leaderController';
import { requireAuth, requireLeader } from '../middleware/auth';

const router = Router();

// Gated for Trek Leaders, Volunteers, Admins
router.use(requireAuth, requireLeader);

router.get('/my-events', getLeaderEvents);
router.get('/roster/:eventId', getEventRoster);
router.post('/attendance', markAttendance);

export default router;
