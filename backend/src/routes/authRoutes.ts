import { Router } from 'express';
import { 
  register, 
  login, 
  googleLogin, 
  refreshSession, 
  verifyEmail, 
  resendVerification, 
  forgotPassword, 
  resetPassword, 
  getProfile, 
  updateProfile, 
  uploadAvatar, 
  getSessions, 
  revokeSession, 
  logout, 
  logoutAll 
} from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/refresh', refreshSession);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.post('/profile/avatar', requireAuth, uploadAvatar);
router.get('/sessions', requireAuth, getSessions);
router.delete('/sessions/:id', requireAuth, revokeSession);
router.post('/logout', logout);
router.post('/logout-all', requireAuth, logoutAll);

export default router;
