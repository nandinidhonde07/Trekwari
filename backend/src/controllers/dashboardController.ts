import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

/**
 * Compiles summary analytics and statistics for the Admin Dashboard.
 */
export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    // 1. Core counters
    const totalUsers = await prisma.user.count();
    
    const paidBookingsCount = await prisma.booking.count({
      where: { paymentStatus: 'PAID' }
    });

    const totalBookingsCount = await prisma.booking.count();

    const revenueResult = await prisma.booking.aggregate({
      where: { paymentStatus: 'PAID' },
      _sum: {
        totalAmount: true
      }
    });
    const totalRevenue = revenueResult._sum.totalAmount || 0;

    // Conversion rate (paid / total bookings)
    const conversionRate = totalBookingsCount > 0 
      ? Math.round((paidBookingsCount / totalBookingsCount) * 100) 
      : 100;

    // 2. Upcoming Active Treks with seating fill loads
    const upcomingEvents = await prisma.event.findMany({
      where: {
        status: 'OPEN_REGISTRATION',
        startDate: { gte: new Date() }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        maxSeats: true,
        availableSeats: true,
        startDate: true,
        price: true
      },
      take: 5,
      orderBy: { startDate: 'asc' }
    });

    const upcomingTreksList = upcomingEvents.map(e => {
      const seatsFilled = e.maxSeats - e.availableSeats;
      const fillPercentage = Math.round((seatsFilled / e.maxSeats) * 100);
      return {
        id: e.id,
        title: e.title,
        slug: e.slug,
        startDate: e.startDate.toLocaleDateString(),
        price: e.price,
        seatsFilled,
        maxSeats: e.maxSeats,
        fillPercentage
      };
    });

    // 3. Popular Treks (calculated by sum of booked seats for each event)
    const events = await prisma.event.findMany({
      include: {
        bookings: {
          where: { paymentStatus: 'PAID' },
          select: { seatCount: true }
        }
      }
    });

    const popularTreksList = events
      .map(e => {
        const totalSeatsBooked = e.bookings.reduce((sum, b) => sum + b.seatCount, 0);
        return {
          id: e.id,
          title: e.title,
          slug: e.slug,
          totalBookings: e.bookings.length,
          totalSeatsBooked,
          revenue: totalSeatsBooked * e.price
        };
      })
      .sort((a, b) => b.totalSeatsBooked - a.totalSeatsBooked)
      .slice(0, 5);

    // 4. Monthly Bookings & Revenue chart mapping (last 6 months)
    const monthlyStats = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const monthBookings = await prisma.booking.count({
        where: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      const monthRevenueResult = await prisma.booking.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: {
          totalAmount: true
        }
      });
      const monthRevenue = monthRevenueResult._sum.totalAmount || 0;

      const monthLabel = monthStart.toLocaleString('default', { month: 'short' });

      monthlyStats.push({
        month: monthLabel,
        bookings: monthBookings,
        revenue: monthRevenue
      });
    }

    // 5. User Retention (Returning customers who booked > 1 paid trek)
    const userBookingsCounts = await prisma.booking.groupBy({
      by: ['userId'],
      where: { paymentStatus: 'PAID' },
      _count: {
        id: true
      }
    });

    const returningCustomersCount = userBookingsCounts.filter(u => u._count.id > 1).length;

    return res.json({
      summary: {
        totalUsers,
        totalBookings: paidBookingsCount,
        totalRevenue,
        conversionRate,
        returningCustomers: returningCustomersCount
      },
      monthlyStats,
      popularTreks: popularTreksList,
      upcomingTreks: upcomingTreksList
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ error: 'Failed to compile dashboard reports.' });
  }
}
