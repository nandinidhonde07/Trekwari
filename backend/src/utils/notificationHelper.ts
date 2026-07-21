import { prisma } from '../lib/prisma';
import { sendEmail } from './email';

/**
 * Dispatches a system notification both to the user's dashboard and via transactional email.
 */
export async function sendSystemNotification(
  userId: string,
  title: string,
  message: string,
  emailSubject?: string,
  emailHtml?: string
) {
  try {
    // 1. Write web database notification
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        isRead: false
      }
    });

    // 2. Dispatch SMTP email if headers are present
    if (emailSubject && emailHtml) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.email) {
        await sendEmail({
          to: user.email,
          subject: emailSubject,
          html: emailHtml
        });
      }
    }
  } catch (error) {
    console.error('System Notification dispatch failed:', error);
  }
}
