import { Router } from 'express';
import { 
  getMemories, createMemory, toggleLikeMemory, 
  commentOnMemory, deleteMemory, toggleHideMemory, togglePinMemory 
} from '../controllers/memoryController';
import { requireAuth, requireAdmin, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// Public memories feed
router.get('/', getMemories);

// Protected social interaction routes
router.post('/', requireAuth, createMemory);
router.post('/:memoryId/like', requireAuth, toggleLikeMemory);
router.post('/:memoryId/comment', requireAuth, commentOnMemory);
router.delete('/:id', requireAuth, deleteMemory);

// Admin-only moderation routes (Hyper Admin Only)
router.put('/:id/toggle-hide', requireAuth, requireSuperAdmin, toggleHideMemory);
router.put('/:id/toggle-pin', requireAuth, requireSuperAdmin, togglePinMemory);

export default router;
