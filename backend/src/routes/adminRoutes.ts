import { Router } from 'express';
import { 
  getUsers, 
  toggleUserStatus, 
  verifyUserEmail, 
  adminResetPassword, 
  getAuditLogs, 
  getUserSessions, 
  revokeUserSession,
  adminUpdateUserRole,
  adminDeleteUser
} from '../controllers/adminController';
import { requireAuth, requireAdmin, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// Require authenticated user for all admin actions
router.use(requireAuth);

// Gated for general Admin access (viewing users list)
router.get('/users', requireAdmin, getUsers);

// Gated strictly for Hyper Admin (SUPER_ADMIN) only
router.post('/users/:id/role', requireSuperAdmin, adminUpdateUserRole);
router.delete('/users/:id', requireSuperAdmin, adminDeleteUser);
router.post('/users/:id/status', requireSuperAdmin, toggleUserStatus);
router.post('/users/:id/verify', requireSuperAdmin, verifyUserEmail);
router.post('/users/:id/reset-password', requireSuperAdmin, adminResetPassword);
router.get('/users/:id/sessions', requireSuperAdmin, getUserSessions);
router.delete('/sessions/:sessionId', requireSuperAdmin, revokeUserSession);
router.get('/audit-logs', requireSuperAdmin, getAuditLogs);

export default router;
