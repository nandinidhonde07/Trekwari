import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Gets all published blogs.
 */
export async function getBlogs(req: Request, res: Response) {
  try {
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true },
      include: {
        author: {
          select: { name: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(blogs);
  } catch (error) {
    console.error('Get blogs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve blog articles.' });
  }
}

/**
 * Gets a blog by its slug.
 */
export async function getBlogBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  try {
    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        author: {
          select: { name: true, avatarUrl: true, role: true }
        }
      }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }

    return res.json(blog);
  } catch (error) {
    console.error('Get blog by slug error:', error);
    return res.status(500).json({ error: 'Failed to retrieve article details.' });
  }
}

/**
 * Creates a new blog post (Admin only).
 */
export async function createBlog(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { title, slug, content, bannerImage, category } = req.body;

  if (!title || !slug || !content || !bannerImage || !category) {
    return res.status(400).json({ error: 'Please provide all blog fields.' });
  }

  try {
    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: 'A blog with this slug already exists.' });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        content,
        bannerImage,
        category,
        authorId: req.user.id,
        isPublished: true
      }
    });

    return res.status(201).json({
      message: 'Blog post published successfully!',
      blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    return res.status(500).json({ error: 'Failed to publish blog.' });
  }
}

/**
 * Deletes a blog post (Admin only).
 */
export async function deleteBlog(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }

    await prisma.blog.delete({ where: { id } });
    return res.json({ message: 'Blog article deleted successfully.' });
  } catch (error) {
    console.error('Delete blog error:', error);
    return res.status(500).json({ error: 'Failed to delete blog article.' });
  }
}
