import { Router } from 'express';
import { getMemories, createMemory, toggleLikeMemory, commentOnMemory, deleteMemory } from '../controllers/memoryController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public memories feed
router.get('/', getMemories);

// Protected social interaction routes
router.post('/', requireAuth, createMemory);
router.post('/:memoryId/like', requireAuth, toggleLikeMemory);
router.post('/:memoryId/comment', requireAuth, commentOnMemory);
router.delete('/:id', requireAuth, deleteMemory);

export default router;
