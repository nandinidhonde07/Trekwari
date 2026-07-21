import { Request } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Logs a platform action into the database AuditLog table.
 */
export async function logAuditEvent(
  userId: string | null,
  action: string,
  details: string,
  req: Request,
  previousValue?: string | null,
  newValue?: string | null
) {
  try {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress: ipAddress ? ipAddress.split(',')[0].trim() : null,
        previousValue: previousValue || null,
        newValue: newValue || null
      }
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
