import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../utils/audit';

/**
 * Gets company/organization settings.
 */
export async function getSettings(req: AuthRequest, res: Response) {
  try {
    let settings = await prisma.organizationSettings.findUnique({
      where: { id: 'default-settings' }
    });

    // If settings missing, seed fallback
    if (!settings) {
      settings = await prisma.organizationSettings.create({
        data: {
          id: 'default-settings',
          companyName: 'TrekWari',
          founderName: 'Atharva Dhawale',
          email: 'atharvadhawale80@gmail.com',
          phone: '+91 9322340365',
          whatsapp: '+91 9322340365',
          instagram: 'https://www.instagram.com/trekwari',
          youtube: 'https://youtube.com/@trekwari',
          facebook: 'https://facebook.com/trekwari',
          location: 'Kopargaon, Maharashtra, India',
          logoUrl: '/logo.png',
          faviconUrl: '/favicon.ico',
          tagline: 'Explore Sahyadri with Certified Leaders',
          hqName: 'TrekWari HQ Basecamp',
          address: 'Kopargaon Road',
          city: 'Kopargaon',
          state: 'Maharashtra',
          country: 'India',
          pincode: '423601',
          officeTimings: '9:00 AM - 6:00 PM (Mon-Sat)',
          emergencyContact: '+91 9322340365',
          googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15002.570776735165!2d74.46979603099951!3d19.892403759972323!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bdd007d4b4a3a6b%3A0xe5a3c9e6db5837bd!2sKopargaon%2C%20Maharashtra%20423601!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
          latitude: 19.892403,
          longitude: 74.469796,
          linkedin: '',
          twitter: ''
        }
      });
    }

    return res.json(settings);
  } catch (error) {
    console.error('Fetch settings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve company settings.' });
  }
}

/**
 * Updates company/organization settings (Admin only).
 */
export async function updateSettings(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const {
    companyName,
    founderName,
    email,
    phone,
    whatsapp,
    instagram,
    youtube,
    facebook,
    location,
    logoUrl,
    faviconUrl,
    tagline,
    hqName,
    address,
    city,
    state,
    country,
    pincode,
    officeTimings,
    emergencyContact,
    googleMapsEmbed,
    latitude,
    longitude,
    linkedin,
    twitter
  } = req.body;

  // Basic validation
  if (!companyName || !email || !phone) {
    return res.status(400).json({ error: 'Company Name, Email, and Phone are required fields.' });
  }

  try {
    const previous = await prisma.organizationSettings.findUnique({
      where: { id: 'default-settings' }
    });

    const updatedSettings = await prisma.organizationSettings.update({
      where: { id: 'default-settings' },
      data: {
        companyName,
        founderName,
        email,
        phone,
        whatsapp,
        instagram,
        youtube,
        facebook,
        location,
        logoUrl,
        faviconUrl,
        tagline,
        hqName,
        address,
        city,
        state,
        country,
        pincode,
        officeTimings,
        emergencyContact,
        googleMapsEmbed,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        linkedin,
        twitter
      }
    });

    // Write to audit log
    await logAuditEvent(
      req.user.id,
      'COMPANY_SETTINGS_UPDATE',
      'Admin updated global company profile and headquarters settings.',
      req,
      previous ? JSON.stringify(previous) : null,
      JSON.stringify(updatedSettings)
    );

    return res.json({
      message: 'Company settings updated successfully!',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ error: 'Failed to save company settings.' });
  }
}
