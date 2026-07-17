import { Router } from 'express';
import { getBlogs, getBlogBySlug, createBlog, deleteBlog } from '../controllers/blogController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getBlogs);
router.get('/:slug', getBlogBySlug);

// Admin-only routes
router.post('/', requireAuth, requireAdmin, createBlog);
router.delete('/:id', requireAuth, requireAdmin, deleteBlog);

export default router;
