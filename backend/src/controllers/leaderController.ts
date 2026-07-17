import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Gets events assigned to the logged-in leader/volunteer.
 */
export async function getLeaderEvents(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const assignments = await prisma.eventLeader.findMany({
      where: { userId: req.user.id },
      include: {
        event: true
      }
    });

    const events = assignments.map(a => ({
      ...a.event,
      highlights: JSON.parse(a.event.highlights as string || '[]'),
      images: JSON.parse(a.event.images as string || '[]'),
      pickupPoints: JSON.parse(a.event.pickupPoints as string || '[]'),
      itinerary: JSON.parse(a.event.itinerary as string || '[]')
    }));

    return res.json(events);
  } catch (error) {
    console.error('Get leader events error:', error);
    return res.status(500).json({ error: 'Failed to retrieve assigned events.' });
  }
}

/**
 * Gets the roster of bookings and participants for a specific event.
 */
export async function getEventRoster(req: AuthRequest, res: Response) {
  const { eventId } = req.params;

  try {
    // Optional check: verify leader is assigned to this event
    const isAssigned = await prisma.eventLeader.findFirst({
      where: {
        eventId,
        userId: req.user?.id
      }
    });

    // Allow super admins and admins to bypass assignment check
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';

    if (!isAssigned && !isStaff) {
      return res.status(403).json({ error: 'Access denied. You are not assigned to lead this event.' });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        eventId,
        paymentStatus: 'PAID'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            bloodGroup: true,
            allergies: true,
            medicalNotes: true
          }
        },
        members: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(bookings);
  } catch (error) {
    console.error('Get event roster error:', error);
    return res.status(500).json({ error: 'Failed to retrieve event roster.' });
  }
}

/**
 * Marks attendance status for a participant member.
 */
export async function markAttendance(req: AuthRequest, res: Response) {
  const { memberId, status } = req.body; // status: PRESENT, ABSENT, PENDING

  if (!memberId || !status) {
    return res.status(400).json({ error: 'Missing memberId or attendance status.' });
  }

  const validStatuses = ['PRESENT', 'ABSENT', 'PENDING'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid attendance status value.' });
  }

  try {
    const updatedMember = await prisma.bookingMember.update({
      where: { id: memberId },
      data: {
        attendanceStatus: status
      }
    });

    return res.json({
      message: `Marked member attendance as ${status}.`,
      member: updatedMember
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({ error: 'Failed to update member attendance.' });
  }
}
