import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../utils/audit';

/**
 * Gets all adventure memories (past user photo posts).
 */
export async function getMemories(req: AuthRequest, res: Response) {
  const { eventId, search, filterStatus, sortBy } = req.query;

  try {
    const whereClause: any = {};
    
    // Event filter
    if (eventId) {
      whereClause.eventId = String(eventId);
    }

    // Role check for hidden posts
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    if (!isStaff) {
      // Normal users only see visible posts
      whereClause.hidden = false;
    } else if (filterStatus) {
      // Admins can filter by status
      if (filterStatus === 'HIDDEN') {
        whereClause.hidden = true;
      } else if (filterStatus === 'VISIBLE') {
        whereClause.hidden = false;
      } else if (filterStatus === 'PINNED') {
        whereClause.pinned = true;
      }
    }

    // Search query in caption or uploader name
    if (search) {
      whereClause.OR = [
        { caption: { contains: String(search), mode: 'insensitive' } },
        { user: { name: { contains: String(search), mode: 'insensitive' } } }
      ];
    }

    // Define Sorting
    let orderByList: any[] = [];
    if (sortBy === 'LIKES') {
      // Handled after fetching because likes is a relation count, but we can do a default list
      orderByList.push({ createdAt: 'desc' });
    } else {
      // Default: Pinned posts first, then newest
      orderByList.push({ pinned: 'desc' });
      orderByList.push({ createdAt: 'desc' });
    }

    const memories = await prisma.memory.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, badgeLevel: true, role: true } },
        event: { select: { title: true, slug: true, location: true, startDate: true } },
        likes: { select: { userId: true } },
        comments: {
          include: {
            user: { select: { name: true, avatarUrl: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: orderByList
    });

    // Format memories to include like counts and likedByMe status
    const loggedInUserId = req.user?.id;
    let formattedMemories = memories.map(m => {
      const likedByMe = loggedInUserId ? m.likes.some(l => l.userId === loggedInUserId) : false;
      return {
        id: m.id,
        caption: m.caption,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        pinned: m.pinned,
        hidden: m.hidden,
        isFeatured: m.isFeatured,
        tags: m.tags,
        createdAt: m.createdAt,
        user: m.user,
        event: m.event,
        likesCount: m.likes.length,
        likedByMe,
        comments: m.comments
      };
    });

    // If sorting by likes count
    if (sortBy === 'LIKES') {
      formattedMemories.sort((a, b) => b.likesCount - a.likesCount);
    }

    return res.json(formattedMemories);
  } catch (error) {
    console.error('Get memories error:', error);
    return res.status(500).json({ error: 'Failed to retrieve adventure memories.' });
  }
}

/**
 * Posts a new memory (requires authentication). Supports single and multi-images.
 */
export async function createMemory(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  if (req.user.role === 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Regular administrators cannot publish memory posts. Hyper Admin privileges required.' });
  }

  const { eventId, caption, mediaUrl, mediaUrls, mediaType, tags } = req.body;

  if (!eventId || (!mediaUrl && (!mediaUrls || mediaUrls.length === 0))) {
    return res.status(400).json({ error: 'Please supply an event ID and at least one image.' });
  }

  try {
    const { uploadToCloudinary } = require('../utils/cloudinary');

    // Handle multiple images
    let finalUrls: string[] = [];
    const sourceUrls = mediaUrls && mediaUrls.length > 0 ? mediaUrls : [mediaUrl];

    for (const url of sourceUrls) {
      if (url.startsWith('data:image/') || url.startsWith('data:application/octet-stream')) {
        const secureUrl = await uploadToCloudinary(url, 'memories');
        finalUrls.push(secureUrl);
      } else {
        finalUrls.push(url);
      }
    }

    // Stringify array of URLs if multiple, else store single string
    const mediaUrlResult = finalUrls.length > 1 ? JSON.stringify(finalUrls) : finalUrls[0];

    const memory = await prisma.memory.create({
      data: {
        userId: req.user.id,
        eventId,
        caption,
        mediaUrl: mediaUrlResult,
        mediaType: mediaType || 'IMAGE',
        tags: tags || null
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, badgeLevel: true, role: true } },
        event: { select: { title: true, slug: true, location: true, startDate: true } }
      }
    });

    // Audit log
    await logAuditEvent(
      req.user.id,
      'MEMORY_CREATE',
      `User shared a new adventure memory post for event: ${memory.event.title}.`,
      req,
      null,
      JSON.stringify(memory)
    );

    return res.status(201).json({
      message: 'Memory shared successfully!',
      memory
    });
  } catch (error) {
    console.error('Create memory error:', error);
    return res.status(500).json({ error: 'Failed to share memory.' });
  }
}

/**
 * Toggles a hide status on a memory (Admin only).
 */
export async function toggleHideMemory(req: AuthRequest, res: Response) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }

  const { id } = req.params;

  try {
    const memory = await prisma.memory.findUnique({ where: { id } });
    if (!memory) {
      return res.status(404).json({ error: 'Memory post not found.' });
    }

    const updated = await prisma.memory.update({
      where: { id },
      data: { hidden: !memory.hidden }
    });

    await logAuditEvent(
      req.user.id,
      'MEMORY_TOGGLE_HIDE',
      `Admin toggled visibility status for memory post ID ${id}. New hidden state: ${updated.hidden}`,
      req,
      JSON.stringify(memory),
      JSON.stringify(updated)
    );

    return res.json({
      message: updated.hidden ? 'Memory hidden successfully.' : 'Memory restored successfully.',
      memory: updated
    });
  } catch (error) {
    console.error('Toggle hide memory error:', error);
    return res.status(500).json({ error: 'Failed to update visibility status.' });
  }
}

/**
 * Toggles a pinned status on a memory (Admin only).
 */
export async function togglePinMemory(req: AuthRequest, res: Response) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }

  const { id } = req.params;

  try {
    const memory = await prisma.memory.findUnique({ where: { id } });
    if (!memory) {
      return res.status(404).json({ error: 'Memory post not found.' });
    }

    const updated = await prisma.memory.update({
      where: { id },
      data: { pinned: !memory.pinned }
    });

    await logAuditEvent(
      req.user.id,
      'MEMORY_TOGGLE_PIN',
      `Admin toggled pin status for memory post ID ${id}. New pinned state: ${updated.pinned}`,
      req,
      JSON.stringify(memory),
      JSON.stringify(updated)
    );

    return res.json({
      message: updated.pinned ? 'Memory pinned successfully.' : 'Memory unpinned successfully.',
      memory: updated
    });
  } catch (error) {
    console.error('Toggle pin memory error:', error);
    return res.status(500).json({ error: 'Failed to update pin status.' });
  }
}

/**
 * Toggles a like on a memory (requires authentication).
 */
export async function toggleLikeMemory(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { memoryId } = req.params;

  try {
    const existingLike = await prisma.memoryLike.findUnique({
      where: {
        userId_memoryId: {
          userId: req.user.id,
          memoryId
        }
      }
    });

    if (existingLike) {
      await prisma.memoryLike.delete({
        where: {
          userId_memoryId: {
            userId: req.user.id,
            memoryId
          }
        }
      });
      return res.json({ liked: false, message: 'Unliked memory.' });
    } else {
      await prisma.memoryLike.create({
        data: {
          userId: req.user.id,
          memoryId
        }
      });
      return res.json({ liked: true, message: 'Liked memory.' });
    }
  } catch (error) {
    console.error('Toggle like memory error:', error);
    return res.status(500).json({ error: 'Failed to update like status.' });
  }
}

/**
 * Appends a comment to a memory (requires authentication).
 */
export async function commentOnMemory(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { memoryId } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Comment text cannot be empty.' });
  }

  try {
    const comment = await prisma.memoryComment.create({
      data: {
        userId: req.user.id,
        memoryId,
        text
      },
      include: {
        user: { select: { name: true, avatarUrl: true, role: true } }
      }
    });

    return res.status(201).json({
      message: 'Comment posted successfully.',
      comment
    });
  } catch (error) {
    console.error('Comment on memory error:', error);
    return res.status(500).json({ error: 'Failed to post comment.' });
  }
}

/**
 * Deletes a memory (Owner or Admin only).
 */
export async function deleteMemory(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const memory = await prisma.memory.findUnique({ where: { id } });
    if (!memory) {
      return res.status(404).json({ error: 'Memory post not found.' });
    }

    const isOwner = memory.userId === req.user?.id;
    const isStaff = req.user?.role === 'SUPER_ADMIN';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Unauthorized to delete this memory. Only Hyper Admin or the post owner can delete memories.' });
    }

    await prisma.memory.delete({ where: { id } });

    await logAuditEvent(
      req.user?.id || null,
      'MEMORY_DELETE',
      `Memory post ID ${id} deleted by ${isStaff ? 'Admin' : 'Owner'}.`,
      req,
      JSON.stringify(memory),
      null
    );

    return res.json({ message: 'Memory post deleted successfully.' });
  } catch (error) {
    console.error('Delete memory error:', error);
    return res.status(500).json({ error: 'Failed to delete memory post.' });
  }
}
