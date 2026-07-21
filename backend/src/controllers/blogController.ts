import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../utils/audit';

/**
 * Calculates estimated reading time based on word count.
 */
function calculateReadingTime(content: string): string {
  const plainText = content.replace(/<[^>]*>/g, ' ');
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Helper to ensure unique slug by appending counter if collision occurs.
 */
async function generateUniqueSlug(baseSlug: string, currentId?: string): Promise<string> {
  let cleanSlug = baseSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!cleanSlug) cleanSlug = 'article-' + Date.now();

  let slug = cleanSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (!existing || (currentId && existing.id === currentId)) {
      return slug;
    }
    counter++;
    slug = `${cleanSlug}-${counter}`;
  }
}

/**
 * Gets all published and scheduled-due blogs for public feeds.
 * Supports search, category, tag, and sorting (latest / popular).
 */
export async function getBlogs(req: Request, res: Response) {
  try {
    const { search, category, tag, sort } = req.query;
    const now = new Date();

    const where: any = {
      isPublished: true,
      OR: [
        { scheduledAt: null },
        { scheduledAt: { lte: now } }
      ]
    };

    if (category && typeof category === 'string' && category !== 'ALL') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (tag && typeof tag === 'string') {
      where.tags = { contains: tag, mode: 'insensitive' };
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.AND = [
        {
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { summary: { contains: term, mode: 'insensitive' } },
            { content: { contains: term, mode: 'insensitive' } },
            { tags: { contains: term, mode: 'insensitive' } },
            { category: { contains: term, mode: 'insensitive' } }
          ]
        }
      ];
    }

    let orderBy: any = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'popular') {
      orderBy = [{ views: 'desc' }, { likes: 'desc' }, { createdAt: 'desc' }];
    }

    const blogs = await prisma.blog.findMany({
      where,
      orderBy,
      include: {
        author: {
          select: { name: true, avatarUrl: true, role: true }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    return res.json(blogs);
  } catch (error) {
    console.error('Get blogs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve blog articles.' });
  }
}

/**
 * Gets a published blog by its slug and increments view count.
 * Also returns related articles and related treks.
 */
export async function getBlogBySlug(req: Request, res: Response) {
  const { slug } = req.params;

  try {
    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true, role: true }
        },
        comments: {
          where: { isHidden: false },
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } }
          }
        }
      }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }

    // Increment view count asynchronously
    await prisma.blog.update({
      where: { id: blog.id },
      data: { views: { increment: 1 } }
    }).catch(() => {});

    // Fetch related articles (same category or overlapping tags, excluding current)
    const relatedArticles = await prisma.blog.findMany({
      where: {
        id: { not: blog.id },
        isPublished: true,
        category: blog.category
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true, avatarUrl: true } }
      }
    });

    // Fetch related treks matching category / location
    const relatedTreks = await prisma.event.findMany({
      where: {
        status: 'OPEN_REGISTRATION',
        isDeleted: false
      },
      take: 3,
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        difficulty: true,
        duration: true,
        location: true,
        images: true
      }
    });

    return res.json({
      ...blog,
      views: blog.views + 1,
      relatedArticles,
      relatedTreks
    });
  } catch (error) {
    console.error('Get blog by slug error:', error);
    return res.status(500).json({ error: 'Failed to retrieve article details.' });
  }
}

/**
 * Admin: Gets all blogs (Draft, Scheduled, Published) + CMS Analytics.
 */
export async function getAdminBlogs(req: AuthRequest, res: Response) {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true, avatarUrl: true } },
        _count: { select: { comments: true, versions: true } }
      }
    });

    const now = new Date();
    const totalArticles = blogs.length;
    const published = blogs.filter(b => b.isPublished && (!b.scheduledAt || new Date(b.scheduledAt) <= now)).length;
    const drafts = blogs.filter(b => !b.isPublished).length;
    const scheduled = blogs.filter(b => b.isPublished && b.scheduledAt && new Date(b.scheduledAt) > now).length;
    const featured = blogs.filter(b => b.isFeatured).length;

    const totalViews = blogs.reduce((sum, b) => sum + (b.views || 0), 0);
    const totalLikes = blogs.reduce((sum, b) => sum + (b.likes || 0), 0);
    const totalShares = blogs.reduce((sum, b) => sum + (b.shares || 0), 0);

    const sortedByViews = [...blogs].sort((a, b) => b.views - a.views);
    const mostRead = sortedByViews[0] ? sortedByViews[0].title : 'N/A';

    // Calculate Top Categories
    const catMap: Record<string, number> = {};
    blogs.forEach(b => {
      catMap[b.category] = (catMap[b.category] || 0) + 1;
    });

    return res.json({
      blogs,
      stats: {
        totalArticles,
        published,
        drafts,
        scheduled,
        featured,
        totalViews,
        totalLikes,
        totalShares,
        mostRead,
        topCategories: Object.entries(catMap).map(([name, count]) => ({ name, count }))
      }
    });
  } catch (error) {
    console.error('Get admin blogs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve admin blog articles.' });
  }
}

/**
 * Creates a new blog post (Admin only).
 */
export async function createBlog(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const {
    title,
    slug,
    content,
    bannerImage,
    category,
    summary,
    readTime,
    isPublished = true,
    isFeatured = false,
    scheduledAt,
    tags,
    seoTitle,
    seoDescription,
    seoKeywords
  } = req.body;

  if (!title || !content || !bannerImage || !category) {
    return res.status(400).json({ error: 'Title, content, banner image, and category are required.' });
  }

  try {
    const uniqueSlug = await generateUniqueSlug(slug || title);
    const calculatedReadTime = readTime?.trim() || calculateReadingTime(content);

    let finalBanner = bannerImage;
    if (bannerImage.startsWith('data:image/') || bannerImage.startsWith('data:application/octet-stream')) {
      const { uploadToCloudinary } = require('../utils/cloudinary');
      finalBanner = await uploadToCloudinary(bannerImage, 'blogs');
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug: uniqueSlug,
        content,
        bannerImage: finalBanner,
        category,
        summary: summary || title,
        readTime: calculatedReadTime,
        isPublished: Boolean(isPublished),
        isFeatured: Boolean(isFeatured),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        tags: tags || '',
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || summary || title,
        seoKeywords: seoKeywords || '',
        authorId: req.user.id
      }
    });

    // Save initial version
    await prisma.blogVersion.create({
      data: {
        blogId: blog.id,
        title: blog.title,
        content: blog.content,
        summary: blog.summary,
        bannerImage: blog.bannerImage,
        editedBy: req.user.email
      }
    });

    await logAuditEvent(
      req.user.id,
      'ARTICLE_CREATE',
      `Admin published article: "${title}".`,
      req,
      null,
      JSON.stringify(blog)
    );

    return res.status(201).json({
      message: 'Article created successfully!',
      blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    return res.status(500).json({ error: 'Failed to create blog article.' });
  }
}

/**
 * Updates an existing blog post (Admin only).
 */
export async function updateBlog(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { id } = req.params;
  const {
    title,
    slug,
    content,
    bannerImage,
    category,
    summary,
    readTime,
    isPublished,
    isFeatured,
    scheduledAt,
    tags,
    seoTitle,
    seoDescription,
    seoKeywords
  } = req.body;

  try {
    const existingBlog = await prisma.blog.findUnique({ where: { id } });
    if (!existingBlog) {
      return res.status(404).json({ error: 'Blog article not found.' });
    }

    const uniqueSlug = slug ? await generateUniqueSlug(slug, id) : existingBlog.slug;
    const calculatedReadTime = readTime?.trim() || (content ? calculateReadingTime(content) : existingBlog.readTime);

    let finalBanner = existingBlog.bannerImage;
    if (bannerImage && (bannerImage.startsWith('data:image/') || bannerImage.startsWith('data:application/octet-stream'))) {
      const { uploadToCloudinary } = require('../utils/cloudinary');
      finalBanner = await uploadToCloudinary(bannerImage, 'blogs');
    } else if (bannerImage) {
      finalBanner = bannerImage;
    }

    const updated = await prisma.blog.update({
      where: { id },
      data: {
        title: title || existingBlog.title,
        slug: uniqueSlug,
        content: content || existingBlog.content,
        bannerImage: finalBanner,
        category: category || existingBlog.category,
        summary: summary !== undefined ? summary : existingBlog.summary,
        readTime: calculatedReadTime,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : existingBlog.isPublished,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existingBlog.isFeatured,
        scheduledAt: scheduledAt !== undefined ? (scheduledAt ? new Date(scheduledAt) : null) : existingBlog.scheduledAt,
        tags: tags !== undefined ? tags : existingBlog.tags,
        seoTitle: seoTitle !== undefined ? seoTitle : existingBlog.seoTitle,
        seoDescription: seoDescription !== undefined ? seoDescription : existingBlog.seoDescription,
        seoKeywords: seoKeywords !== undefined ? seoKeywords : existingBlog.seoKeywords
      }
    });

    // Store version entry
    await prisma.blogVersion.create({
      data: {
        blogId: id,
        title: updated.title,
        content: updated.content,
        summary: updated.summary,
        bannerImage: updated.bannerImage,
        editedBy: req.user.email
      }
    });

    await logAuditEvent(
      req.user.id,
      'ARTICLE_EDIT',
      `Admin modified article: "${updated.title}".`,
      req,
      JSON.stringify(existingBlog),
      JSON.stringify(updated)
    );

    return res.json({
      message: 'Article updated successfully!',
      blog: updated
    });
  } catch (error) {
    console.error('Update blog error:', error);
    return res.status(500).json({ error: 'Failed to update blog article.' });
  }
}

/**
 * Toggles publish status of an article.
 */
export async function togglePublishBlog(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) return res.status(404).json({ error: 'Article not found.' });

    const updated = await prisma.blog.update({
      where: { id },
      data: { isPublished: !blog.isPublished }
    });

    return res.json({ message: `Article status updated to ${updated.isPublished ? 'Published' : 'Draft'}.`, blog: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update publish status.' });
  }
}

/**
 * Toggles featured status of an article.
 */
export async function toggleFeaturedBlog(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) return res.status(404).json({ error: 'Article not found.' });

    const updated = await prisma.blog.update({
      where: { id },
      data: { isFeatured: !blog.isFeatured }
    });

    return res.json({ message: `Article ${updated.isFeatured ? 'pinned as Featured' : 'unpinned'}.`, blog: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update featured status.' });
  }
}

/**
 * Duplicates an article.
 */
export async function duplicateBlog(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { id } = req.params;

  try {
    const original = await prisma.blog.findUnique({ where: { id } });
    if (!original) return res.status(404).json({ error: 'Original article not found.' });

    const copyTitle = `${original.title} (Copy)`;
    const copySlug = await generateUniqueSlug(original.slug + '-copy');

    const copy = await prisma.blog.create({
      data: {
        title: copyTitle,
        slug: copySlug,
        content: original.content,
        bannerImage: original.bannerImage,
        category: original.category,
        summary: original.summary,
        readTime: original.readTime,
        isPublished: false,
        isFeatured: false,
        tags: original.tags,
        seoTitle: copyTitle,
        seoDescription: original.seoDescription,
        seoKeywords: original.seoKeywords,
        authorId: req.user.id
      }
    });

    return res.json({ message: 'Article duplicated as draft.', blog: copy });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to duplicate article.' });
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

    await logAuditEvent(
      req.user?.id || null,
      'ARTICLE_DELETE',
      `Admin deleted article: "${blog.title}".`,
      req,
      JSON.stringify(blog),
      null
    );

    return res.json({ message: 'Blog article deleted successfully.' });
  } catch (error) {
    console.error('Delete blog error:', error);
    return res.status(500).json({ error: 'Failed to delete blog article.' });
  }
}

/**
 * Increments share count.
 */
export async function incrementBlogShares(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const updated = await prisma.blog.update({
      where: { id },
      data: { shares: { increment: 1 } }
    });
    return res.json({ shares: updated.shares });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to log share.' });
  }
}

/**
 * Increments like count.
 */
export async function likeBlog(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const updated = await prisma.blog.update({
      where: { id },
      data: { likes: { increment: 1 } }
    });
    return res.json({ likes: updated.likes });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to log like.' });
  }
}

/**
 * Version History Endpoints
 */
export async function getBlogVersions(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    const versions = await prisma.blogVersion.findMany({
      where: { blogId: id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(versions);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch version history.' });
  }
}

export async function restoreBlogVersion(req: AuthRequest, res: Response) {
  const { id, versionId } = req.params;
  try {
    const version = await prisma.blogVersion.findUnique({ where: { id: versionId } });
    if (!version) return res.status(404).json({ error: 'Version record not found.' });

    const updated = await prisma.blog.update({
      where: { id },
      data: {
        title: version.title,
        content: version.content,
        summary: version.summary || undefined,
        bannerImage: version.bannerImage || undefined
      }
    });

    return res.json({ message: 'Restored article version successfully.', blog: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to restore article version.' });
  }
}

/**
 * Category CRUD Endpoints
 */
export async function getBlogCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json(categories);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
}

export async function createBlogCategory(req: AuthRequest, res: Response) {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required.' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  try {
    const category = await prisma.blogCategory.create({
      data: { name, slug, description }
    });
    return res.status(201).json(category);
  } catch (err: any) {
    return res.status(400).json({ error: 'Category already exists or invalid data.' });
  }
}

export async function deleteBlogCategory(req: AuthRequest, res: Response) {
  const { id } = req.params;
  try {
    await prisma.blogCategory.delete({ where: { id } });
    return res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
}

/**
 * Comment Endpoints
 */
export async function addBlogComment(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  try {
    const comment = await prisma.blogComment.create({
      data: {
        blogId: id,
        userId: req.user.id,
        content: content.trim()
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    return res.status(201).json(comment);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to post comment.' });
  }
}

export async function deleteBlogComment(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { commentId } = req.params;

  try {
    const comment = await prisma.blogComment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });

    // Allow user to delete own comment, or admin
    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    await prisma.blogComment.delete({ where: { id: commentId } });
    return res.json({ message: 'Comment deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete comment.' });
  }
}

