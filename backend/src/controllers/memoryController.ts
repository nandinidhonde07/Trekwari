import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Gets all adventure memories (past user photo posts).
 */
export async function getMemories(req: AuthRequest, res: Response) {
  const { eventId } = req.query;

  try {
    const whereClause: any = {};
    if (eventId) {
      whereClause.eventId = String(eventId);
    }

    const memories = await prisma.memory.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, badgeLevel: true } },
        event: { select: { title: true, slug: true, location: true, startDate: true } },
        likes: { select: { userId: true } },
        comments: {
          include: {
            user: { select: { name: true, avatarUrl: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format memories to include a like counts and boolean indicating if logged-in user liked it
    const loggedInUserId = req.user?.id;
    const formattedMemories = memories.map(m => {
      const likedByMe = loggedInUserId ? m.likes.some(l => l.userId === loggedInUserId) : false;
      return {
        id: m.id,
        caption: m.caption,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        createdAt: m.createdAt,
        user: m.user,
        event: m.event,
        likesCount: m.likes.length,
        likedByMe,
        comments: m.comments
      };
    });

    return res.json(formattedMemories);
  } catch (error) {
    console.error('Get memories error:', error);
    return res.status(500).json({ error: 'Failed to retrieve adventure memories.' });
  }
}

/**
 * Posts a new memory (requires authentication).
 */
export async function createMemory(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { eventId, caption, mediaUrl, mediaType } = req.body;

  if (!eventId || !mediaUrl) {
    return res.status(400).json({ error: 'Please supply an event ID and a media URL.' });
  }

  try {
    let finalUrl = mediaUrl;
    // Check if the payload is a base64 data URI and upload to Cloudinary directly
    if (mediaUrl.startsWith('data:image/') || mediaUrl.startsWith('data:application/octet-stream')) {
      const { uploadToCloudinary } = require('../utils/cloudinary');
      finalUrl = await uploadToCloudinary(mediaUrl, 'memories');
    }

    const memory = await prisma.memory.create({
      data: {
        userId: req.user.id,
        eventId,
        caption,
        mediaUrl: finalUrl,
        mediaType: mediaType || 'IMAGE'
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, badgeLevel: true } },
        event: { select: { title: true, slug: true, location: true, startDate: true } }
      }
    });

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
      // Unlike
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
      // Like
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
        user: { select: { name: true, avatarUrl: true } }
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
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Unauthorized to delete this memory.' });
    }

    await prisma.memory.delete({ where: { id } });
    return res.json({ message: 'Memory post deleted successfully.' });
  } catch (error) {
    console.error('Delete memory error:', error);
    return res.status(500).json({ error: 'Failed to delete memory post.' });
  }
}
