import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Sends a transactional email using Nodemailer SMTP, falling back to console logging if credentials are missing.
 */
export async function sendEmail({ to, subject, html, attachments }: SendEmailParams): Promise<boolean> {
  console.log(`[Email Outbox] Dispatching mail to: ${to} | Subject: ${subject}`);

  // Fetch dynamic company details
  let companyName = 'TrekWari';
  let companyEmail = 'bookings@treckwari.com';
  let companyLocation = 'Kopargaon, Maharashtra, India';

  try {
    const { prisma } = require('../lib/prisma');
    const settings = await prisma.organizationSettings.findUnique({
      where: { id: 'default-settings' }
    });
    if (settings) {
      companyName = settings.companyName;
      companyEmail = settings.email;
      companyLocation = settings.location;
    }
  } catch (err) {
    // Fallback if database is not available
  }

  // Auto-replace brand keywords in email HTML body
  const parsedHtml = html
    .replace(/TreckWari/gi, companyName)
    .replace(/Kopargaon,\s*Maharashtra,\s*India/gi, companyLocation);

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || `${companyName} <${companyEmail}>`;

  const isMock = !host || !user || !pass || host.includes('your_brevo_smtp_key') || user.includes('your_brevo_registered_email');

  if (!isMock) {
    try {
      console.log(`[Email SMTP] Dispatching via SMTP server: ${host}`);
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port || '587'),
        secure: port === '465',
        auth: {
          user,
          pass
        }
      });

      await transporter.sendMail({
        from,
        to,
        subject,
        html: parsedHtml,
        attachments: attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      });

      console.log('[Email SMTP] SMTP delivery completed.');
      return true;
    } catch (error) {
      console.error('[Email SMTP] SMTP transmission failed:', error);
    }
  } else {
    console.warn('[Email Warning] SMTP credentials (SMTP_HOST/USER/PASS) are missing. Logging preview to console.');
  }

  // Fallback: local console simulation
  console.log(`
========================================================================
[EMAIL MOCK DISPATCH]
To: ${to}
Subject: ${subject}
Attachment count: ${attachments?.length || 0}
Body preview:
${parsedHtml.replace(/<[^>]*>/g, ' ').substring(0, 400)}...
========================================================================
  `);
  
  return true;
}

/**
 * -----------------------------------------------------------------------------
 * Reusable Production Email Templates
 * -----------------------------------------------------------------------------
 */

export function getBookingConfirmationTemplate(userName: string, trekTitle: string, date: string, seats: number): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #14532d; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">Trek Booking Confirmed! 🏔️</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your booking for the upcoming expedition has been confirmed successfully! We are excited to guide you in the mountains.</p>
      <div style="background-color: #f3f4f6; padding: 16px; rounded-lg; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Trek / Event:</strong> ${trekTitle}</p>
        <p style="margin: 4px 0;"><strong>Expedition Date:</strong> ${date}</p>
        <p style="margin: 4px 0;"><strong>Seats Reserved:</strong> ${seats} Seat(s)</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> PAID</p>
      </div>
      <p>Your digital PDF ticket has been generated and is attached to this email. You can also view it in your dashboard.</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Please review the "Things to Carry" checklist on the trek details page prior to departure.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">TreckWari Adventures. Kopargaon, Maharashtra, India.</p>
    </div>
  `;
}

export function getPasswordResetTemplate(userName: string, resetLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #14532d; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">Reset Your Password</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>We received a request to reset your password for your TreckWari account. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetLink}" style="background-color: #14532d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p>Or copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 11px;">${resetLink}</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">TreckWari Adventures. Kopargaon, Maharashtra, India.</p>
    </div>
  `;
}

export function getTrekReminderTemplate(userName: string, trekTitle: string, date: string, meetingPoint: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #14532d; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">Adventure Reminder: ${trekTitle} 🏕️</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>This is a reminder that your scheduled trek is coming up soon! Prepare your backpack and double-check your checklist.</p>
      <div style="background-color: #f3f4f6; padding: 16px; rounded-lg; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Trek / Event:</strong> ${trekTitle}</p>
        <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${date}</p>
        <p style="margin: 4px 0;"><strong>Meeting Point:</strong> ${meetingPoint}</p>
      </div>
      <p>Please carry a valid photo ID and ensure your electronic devices are packed in protective waterproof zip bags.</p>
      <p>If you have any questions, reach out to your trek leader immediately.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">TreckWari Adventures. Kopargaon, Maharashtra, India.</p>
    </div>
  `;
}

export function getContactFormTemplate(name: string, email: string, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #14532d; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">New Contact Query ✉️</h2>
      <p>You have received a new message from the TreckWari Contact Form:</p>
      <div style="background-color: #f3f4f6; padding: 16px; rounded-lg; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>From:</strong> ${name}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 4px 0;"><strong>Message:</strong></p>
        <p style="margin: 8px 0; color: #4b5563; font-style: italic;">"${message}"</p>
      </div>
      <p>Reply directly to this email to contact the user.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">TreckWari System Notifications.</p>
    </div>
  `;
}

export function getCertificateTemplate(userName: string, trekTitle: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #14532d; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">Participation Certificate Awarded! 🏅</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Congratulations on successfully completing the <strong>${trekTitle}</strong> trek! Your dedication, stamina, and support made this a successful summit.</p>
      <p>We are proud to award you a **Certificate of Participation**. Your PDF certificate is attached to this email.</p>
      <p>We look forward to summiting many more peaks with you in the future!</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">TreckWari Adventures. Kopargaon, Maharashtra, India.</p>
    </div>
  `;
}

export function getAdminNotificationTemplate(subject: string, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #14532d; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">Admin Alert: ${subject} ⚠️</h2>
      <p>Hello Administrator,</p>
      <p>The system generated a new alert:</p>
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b; font-weight: bold;">${message}</p>
      </div>
      <p style="color: #6b7280; font-size: 11px;">Timestamp: ${new Date().toISOString()}</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">TreckWari System Administrator Notifications.</p>
    </div>
  `;
}

export function getEmailVerificationTemplate(userName: string, verifyLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <h2 style="color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 8px;">Verify Your Email Address</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Welcome to TrekWari! Please verify your email address to activate your account and begin booking your Sahyadri expeditions:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${verifyLink}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email</a>
      </div>
      <p>This verification link is active for <strong>24 hours</strong>. If the link does not work, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; color: #6b7280; font-size: 11px;">${verifyLink}</p>
      <p>If you did not sign up for a TrekWari account, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 11px; color: #9ca3af; text-align: center;">TrekWari Adventures. Kopargaon, Maharashtra, India.</p>
    </div>
  `;
}
