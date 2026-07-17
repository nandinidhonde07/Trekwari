import { Router } from 'express';
import { 
  getUsers, 
  toggleUserStatus, 
  verifyUserEmail, 
  adminResetPassword, 
  getAuditLogs, 
  getUserSessions, 
  revokeUserSession 
} from '../controllers/adminController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Enforce both authentication and administrative privileges globally on these routes
router.use(requireAuth);
router.use(requireAdmin);

router.get('/users', getUsers);
router.post('/users/:id/status', toggleUserStatus);
router.post('/users/:id/verify', verifyUserEmail);
router.post('/users/:id/reset-password', adminResetPassword);
router.get('/users/:id/sessions', getUserSessions);
router.delete('/sessions/:sessionId', revokeUserSession);
router.get('/audit-logs', getAuditLogs);

export default router;
