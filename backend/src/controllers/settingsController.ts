import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Gets organization settings.
 */
export async function getSettings(req: AuthRequest, res: Response) {
  try {
    let settings = await prisma.organizationSettings.findUnique({
      where: { id: 'default-settings' }
    });

    // If settings somehow missing, seed dynamic fallback
    if (!settings) {
      settings = await prisma.organizationSettings.create({
        data: {
          id: 'default-settings',
          organizationName: 'TreckWari',
          founderName: 'Atharva Dhawale',
          email: 'atharvadhawale80@gmail.com',
          phone: '+91 9322340365',
          whatsapp: '+91 9322340365',
          instagram: 'https://www.instagram.com/trekwari',
          youtube: 'https://youtube.com/@trekwari',
          facebook: 'https://facebook.com/trekwari',
          location: 'Kopargaon, Maharashtra, India',
          logoUrl: '/logo.png',
          faviconUrl: '/favicon.ico'
        }
      });
    }

    return res.json(settings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve website settings.' });
  }
}

/**
 * Updates organization settings (Admin only).
 */
export async function updateSettings(req: AuthRequest, res: Response) {
  const {
    organizationName,
    founderName,
    email,
    phone,
    whatsapp,
    instagram,
    youtube,
    facebook,
    location,
    logoUrl,
    faviconUrl
  } = req.body;

  try {
    const updatedSettings = await prisma.organizationSettings.update({
      where: { id: 'default-settings' },
      data: {
        organizationName,
        founderName,
        email,
        phone,
        whatsapp,
        instagram,
        youtube,
        facebook,
        location,
        logoUrl,
        faviconUrl
      }
    });

    return res.json({
      message: 'Website settings updated successfully!',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Failed to save settings.' });
  }
}
