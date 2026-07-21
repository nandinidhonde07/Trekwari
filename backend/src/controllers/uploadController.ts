import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary } from '../utils/cloudinary';
import { prisma } from '../lib/prisma';

/**
 * Uploads an image file (base64 data URI) directly to Cloudinary or storage,
 * and saves it to the Media Library (GalleryImage) database table.
 */
export async function uploadImage(req: AuthRequest, res: Response) {
  try {
    const { file, folder, category, caption } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No image file or base64 data provided.' });
    }

    // Upload to Cloudinary / configured storage
    const secureUrl = await uploadToCloudinary(file, folder || 'treckwari/treks');

    // Save entry in GalleryImage table so it appears in Media Library
    try {
      await prisma.galleryImage.create({
        data: {
          url: secureUrl,
          category: (category || 'TREKS').toUpperCase(),
          caption: caption || 'Uploaded via Trek Management'
        }
      });
    } catch (dbErr) {
      console.warn('Could not record in GalleryImage table (non-critical):', dbErr);
    }

    return res.status(200).json({
      message: 'Image uploaded successfully!',
      url: secureUrl
    });
  } catch (error: any) {
    console.error('Image upload controller error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload image.' });
  }
}
