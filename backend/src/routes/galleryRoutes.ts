import { Router } from 'express';
import { getGalleryImages, uploadGalleryImage, deleteGalleryImage } from '../controllers/galleryController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getGalleryImages);

// Admin-only routes
router.post('/', requireAuth, requireAdmin, uploadGalleryImage);
router.delete('/:id', requireAuth, requireAdmin, deleteGalleryImage);

export default router;
