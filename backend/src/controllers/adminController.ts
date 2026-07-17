import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendEmail, getPasswordResetTemplate } from '../utils/email';

// Helper to hash tokens
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper to log administrative actions in AuditLog
async function logAdminAction(adminId: string, action: string, details: string, req: Request) {
  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action,
        details,
        ipAddress: ipAddress ? ipAddress.split(',')[0].trim() : null
      }
    });
  } catch (err) {
    console.error('Failed to write admin audit log:', err);
  }
}

/**
 * Gets all users with optional search filter.
 */
export async function getUsers(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { search } = req.query;

  try {
    const whereClause: any = {};
    if (search) {
      const searchStr = String(search);
      whereClause.OR = [
        { name: { contains: searchStr, mode: 'insensitive' } },
        { email: { contains: searchStr, mode: 'insensitive' } },
        { phone: { contains: searchStr, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatarUrl: true,
        emailVerified: true,
        isActive: true,
        rewardPoints: true,
        badgeLevel: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(users);
  } catch (error) {
    console.error('Admin getUsers error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
}

/**
 * Toggles a user's active status (Suspend/Activate).
 */
export async function toggleUserStatus(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { id } = req.params;
  const { isActive } = req.body;

  if (isActive === undefined) {
    return res.status(400).json({ error: 'isActive status parameter is required.' });
  }

  // Prevent self-suspension
  if (id === req.user.id) {
    return res.status(400).json({ error: 'You cannot suspend your own account.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !!isActive }
    });

    // If suspending user, revoke all active sessions to force logout
    if (!isActive) {
      await prisma.session.deleteMany({
        where: { userId: id }
      });
    }

    const statusAction = isActive ? 'ADMIN_USER_ACTIVATION' : 'ADMIN_USER_SUSPENSION';
    await logAdminAction(req.user.id, statusAction, `Toggled user status of ${user.email} (ID: ${user.id}) to: ${isActive ? 'Active' : 'Suspended'}`, req);

    return res.json({
      message: `Account status updated successfully. Account is now ${isActive ? 'active' : 'suspended'}.`,
      user: {
        id: updated.id,
        email: updated.email,
        isActive: updated.isActive
      }
    });
  } catch (error) {
    console.error('Admin toggleUserStatus error:', error);
    return res.status(500).json({ error: 'Failed to update user status.' });
  }
}

/**
 * Manually marks a user's email address as verified.
 */
export async function verifyUserEmail(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    await logAdminAction(req.user.id, 'ADMIN_MANUAL_EMAIL_VERIFY', `Manually verified email address for ${user.email} (ID: ${user.id})`, req);

    return res.json({
      message: 'User email verified successfully.',
      user: {
        id: updated.id,
        email: updated.email,
        emailVerified: updated.emailVerified
      }
    });
  } catch (error) {
    console.error('Admin verifyUserEmail error:', error);
    return res.status(500).json({ error: 'Failed to verify email address.' });
  }
}

/**
 * Triggers a secure password reset link email from admin interface.
 */
export async function adminResetPassword(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id },
      data: {
        resetTokenHash,
        resetTokenExpiry
      }
    });

    const resetLink = `${req.headers.origin || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const emailHtml = getPasswordResetTemplate(user.name, resetLink);
    await sendEmail({
      to: user.email,
      subject: 'Reset Your TrekWari Account Password (Admin Initiated)',
      html: emailHtml
    });

    await logAdminAction(req.user.id, 'ADMIN_RESET_PASSWORD_TRIGGER', `Triggered password reset email for ${user.email} (ID: ${user.id})`, req);

    return res.json({ message: 'Password reset link sent to user email successfully.' });
  } catch (error) {
    console.error('Admin resetPassword error:', error);
    return res.status(500).json({ error: 'Failed to trigger password reset.' });
  }
}

/**
 * Fetches global authentication audit logs.
 */
export async function getAuditLogs(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { limit, offset } = req.query;

  try {
    const take = limit ? parseInt(String(limit)) : 100;
    const skip = offset ? parseInt(String(offset)) : 0;

    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip
    });

    return res.json(logs);
  } catch (error) {
    console.error('Admin getAuditLogs error:', error);
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
}

/**
 * Lists active sessions of a specific user.
 */
export async function getUserSessions(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { id } = req.params;

  try {
    const sessions = await prisma.session.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = sessions.map(s => ({
      id: s.id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Admin getUserSessions error:', error);
    return res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
}

/**
 * Revokes a user session by an administrator.
 */
export async function revokeUserSession(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { sessionId } = req.params;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    await prisma.session.delete({ where: { id: sessionId } });

    await logAdminAction(
      req.user.id,
      'ADMIN_SESSION_REVOKE',
      `Revoked session for user ${session.user.email} on device: ${session.deviceInfo} (IP: ${session.ipAddress})`,
      req
    );

    return res.json({ message: 'Session revoked successfully by admin.' });
  } catch (error) {
    console.error('Admin revokeUserSession error:', error);
    return res.status(500).json({ error: 'Failed to revoke user session.' });
  }
}
