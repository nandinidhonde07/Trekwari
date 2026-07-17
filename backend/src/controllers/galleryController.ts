import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Gets all gallery images/videos, optional category filtering.
 */
export async function getGalleryImages(req: Request, res: Response) {
  const { category } = req.query;

  try {
    const whereClause: any = {};
    if (category) {
      whereClause.category = String(category).toUpperCase();
    }

    const images = await prisma.galleryImage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return res.json(images);
  } catch (error) {
    console.error('Get gallery images error:', error);
    return res.status(500).json({ error: 'Failed to retrieve gallery media.' });
  }
}

/**
 * Uploads/Saves new media url to gallery (Admin only).
 */
export async function uploadGalleryImage(req: AuthRequest, res: Response) {
  const { url, category, caption } = req.body;

  if (!url || !category) {
    return res.status(400).json({ error: 'Please supply a media URL and a valid category.' });
  }

  try {
    const newImage = await prisma.galleryImage.create({
      data: {
        url,
        category: category.toUpperCase(),
        caption
      }
    });

    return res.status(201).json({
      message: 'Media added to gallery successfully!',
      image: newImage
    });
  } catch (error) {
    console.error('Upload gallery image error:', error);
    return res.status(500).json({ error: 'Failed to upload media to database.' });
  }
}

/**
 * Deletes a gallery media entry (Admin only).
 */
export async function deleteGalleryImage(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const existing = await prisma.galleryImage.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Media entry not found in gallery.' });
    }

    await prisma.galleryImage.delete({ where: { id } });
    return res.json({ message: 'Media entry deleted from gallery successfully.' });
  } catch (error) {
    console.error('Delete gallery image error:', error);
    return res.status(500).json({ error: 'Failed to delete gallery media.' });
  }
}
