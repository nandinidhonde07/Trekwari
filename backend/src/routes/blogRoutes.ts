import { Router } from 'express';
import { 
  getBlogs, 
  getBlogBySlug, 
  getAdminBlogs,
  createBlog, 
  updateBlog, 
  togglePublishBlog,
  toggleFeaturedBlog,
  duplicateBlog,
  deleteBlog,
  incrementBlogShares,
  likeBlog,
  getBlogVersions,
  restoreBlogVersion,
  getBlogCategories,
  createBlogCategory,
  deleteBlogCategory,
  addBlogComment,
  deleteBlogComment
} from '../controllers/blogController';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getBlogs);
router.get('/categories', getBlogCategories);
router.get('/:slug', getBlogBySlug);
router.post('/:id/share', incrementBlogShares);
router.post('/:id/like', likeBlog);
router.post('/:id/comments', requireAuth, addBlogComment);
router.delete('/comments/:commentId', requireAuth, deleteBlogComment);

// Admin-only routes
router.get('/admin/all', requireAuth, requireAdmin, getAdminBlogs);
router.post('/', requireAuth, requireAdmin, createBlog);
router.put('/:id', requireAuth, requireAdmin, updateBlog);
router.patch('/:id/publish', requireAuth, requireAdmin, togglePublishBlog);
router.patch('/:id/featured', requireAuth, requireAdmin, toggleFeaturedBlog);
router.post('/:id/duplicate', requireAuth, requireAdmin, duplicateBlog);
router.delete('/:id', requireAuth, requireAdmin, deleteBlog);
router.get('/:id/versions', requireAuth, requireAdmin, getBlogVersions);
router.post('/:id/versions/:versionId/restore', requireAuth, requireAdmin, restoreBlogVersion);
router.post('/categories', requireAuth, requireAdmin, createBlogCategory);
router.delete('/categories/:id', requireAuth, requireAdmin, deleteBlogCategory);

export default router;
