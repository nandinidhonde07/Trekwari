import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { generateTicketPDF } from '../utils/pdf';
import { sendEmail, getBookingConfirmationTemplate, getAdminNotificationTemplate } from '../utils/email';

/**
 * Creates a pending booking and a mock Razorpay order.
 */
export async function createBooking(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const {
    eventId,
    seatCount,
    emergencyContact,
    emergencyName,
    emergencyRelationship,
    medicalDetails,
    waiverAccepted,
    termsAccepted,
    fitnessDeclared,
    riskAcknowledged,
    instructionsAgreed,
    guardianPermitted,
    couponCode,
    members // Array of { name, age, gender }
  } = req.body;

  if (!eventId || !seatCount || !emergencyContact || !emergencyName || !emergencyRelationship || !members || members.length === 0) {
    return res.status(400).json({ error: 'Missing required booking fields. Emergency Name, Phone, and Relationship are all mandatory.' });
  }

  if (!waiverAccepted) {
    return res.status(400).json({ error: 'You must accept the digital risk & liability waiver to book.' });
  }

  if (!termsAccepted || !fitnessDeclared || !riskAcknowledged || !instructionsAgreed) {
    return res.status(400).json({ error: 'You must read and agree to all terms and declarations to proceed.' });
  }

  const hasUnder18 = members.some((m: any) => parseInt(m.age) < 18);
  if (hasUnder18 && !guardianPermitted) {
    return res.status(400).json({ error: 'Parental/Guardian permission is mandatory for participants under 18 years of age.' });
  }

  try {
    // Verify that the user's email address is verified before booking is permitted
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email address to book a trek. You can trigger a verification link in your profile settings.' });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: 'Trekking event not found.' });
    }

    if (event.status !== 'OPEN_REGISTRATION') {
      return res.status(400).json({ error: 'Registrations are currently closed for this trek.' });
    }

    // Check available seats
    if (event.availableSeats < seatCount) {
      return res.status(400).json({
        error: `Insufficient seats. Only ${event.availableSeats} seats left.`,
        availableSeats: event.availableSeats
      });
    }

    // Calculate Pricing
    let subtotal = event.price * seatCount;
    let discount = 0;

    // Verify Coupon Code if supplied
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive && new Date(coupon.expiry) > new Date() && coupon.usedCount < coupon.usageLimit) {
        if (coupon.isPercentage) {
          discount = subtotal * (coupon.discount / 100);
        } else {
          discount = coupon.discount;
        }
        discount = Math.min(discount, subtotal); // Don't exceed subtotal
      }
    }

    const totalAmount = subtotal - discount;

    // Create unique readable booking ID: TW-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const bookingIdStr = `TW-${dateStr}-${randNum}`;

    let razorpayOrderId = `order_mock_${Math.random().toString(36).substring(2, 11)}`;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret && !keyId.includes('yourtestkey') && !keySecret.includes('yourrazorpaysecret')) {
      try {
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({
          key_id: keyId,
          key_secret: keySecret
        });
        const order = await rzp.orders.create({
          amount: Math.round(totalAmount * 100), // in paise
          currency: 'INR',
          receipt: bookingIdStr
        });
        razorpayOrderId = order.id;
      } catch (err) {
        console.error('Razorpay Order creation failed, falling back to mock:', err);
      }
    }

    // Capture IP Address and User Agent for terms acceptance auditing
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    // Create pending booking
    const booking = await prisma.booking.create({
      data: {
        bookingId: bookingIdStr,
        userId: req.user.id,
        eventId,
        totalAmount,
        seatCount,
        paymentStatus: 'PENDING',
        razorpayOrderId,
        emergencyContact,
        emergencyName,
        emergencyRelationship,
        medicalDetails,
        waiverAccepted: true,
        waiverSignedAt: new Date(),
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        ipAddress,
        userAgent,
        fitnessDeclared: true,
        riskAcknowledged: true,
        instructionsAgreed: true,
        guardianPermitted: hasUnder18 ? true : null,
        couponCode,
        discountAmount: discount,
        members: {
          create: members.map((m: any) => ({
            name: m.name,
            age: parseInt(m.age),
            gender: m.gender,
            phone: m.phone || null,
            attendanceStatus: 'PENDING'
          }))
        }
      },
      include: {
        members: true
      }
    });

    return res.status(201).json({
      message: 'Booking initialized. Proceeding to checkout.',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ error: 'Failed to initialize booking.' });
  }
}

/**
 * Confirms payment and issues tickets.
 */
export async function confirmBookingPayment(req: AuthRequest, res: Response) {
  const { bookingId, paymentId, razorpayOrderId, razorpaySignature } = req.body;

  if (!bookingId || !paymentId) {
    return res.status(400).json({ error: 'Missing booking ID or payment transaction ID.' });
  }

  // Live Razorpay Signature Verification
  if (razorpayOrderId && razorpaySignature) {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keySecret && !keySecret.includes('yourrazorpaysecretkey')) {
      const crypto = require('crypto');
      const text = razorpayOrderId + "|" + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');
      
      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ error: 'Razorpay payment signature verification failed. Invalid transaction.' });
      }
    }
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        event: true,
        members: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking records not found.' });
    }

    if (booking.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Booking payment is already confirmed.' });
    }

    // Begin database transaction to decrement seats and update booking status
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Refresh event seat count
      const refreshedEvent = await tx.event.findUnique({ where: { id: booking.eventId } });
      if (!refreshedEvent || refreshedEvent.availableSeats < booking.seatCount) {
        throw new Error('Seats were filled before payment could be processed.');
      }

      // Decrement seats
      const updatedEvent = await tx.event.update({
        where: { id: booking.eventId },
        data: {
          availableSeats: { decrement: booking.seatCount }
        }
      });

      // Update seats to REGISTRATION_CLOSED if fully booked
      if (updatedEvent.availableSeats <= 0) {
        await tx.event.update({
          where: { id: booking.eventId },
          data: { status: 'REGISTRATION_CLOSED' }
        });
      }

      // Increment coupon usage if coupon was applied
      if (booking.couponCode) {
        await tx.coupon.update({
          where: { code: booking.couponCode },
          data: { usedCount: { increment: 1 } }
        }).catch(() => {});
      }

      // Credit reward points: 10 points per seat booked
      await tx.user.update({
        where: { id: booking.userId },
        data: {
          rewardPoints: { increment: booking.seatCount * 10 }
        }
      });

      // Create user notification
      await tx.notification.create({
        data: {
          userId: booking.userId,
          title: 'Booking Confirmed! 🏔️',
          message: `Your booking for "${booking.event.title}" on ${booking.event.startDate.toLocaleDateString()} is confirmed! Your ticket is ready for download.`
        }
      });

      // Update booking payment details
      return tx.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'PAID',
          paymentId
        },
        include: {
          user: true,
          event: true,
          members: true
        }
      });
    });

    // Generate PDF Ticket
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateTicketPDF({
        bookingId: updatedBooking.bookingId,
        trekTitle: updatedBooking.event.title,
        startDate: updatedBooking.event.startDate.toLocaleDateString(),
        location: updatedBooking.event.location,
        leadName: updatedBooking.user.name,
        seatCount: updatedBooking.seatCount,
        pickupPoint: JSON.parse(updatedBooking.event.pickupPoints as string)[0] || 'Kopargaon',
        emergencyContact: updatedBooking.emergencyContact,
        totalAmount: updatedBooking.totalAmount,
        members: updatedBooking.members.map(m => `${m.name} (${m.age}, ${m.gender})`)
      });
    } catch (pdfErr) {
      console.error('Failed to generate ticket PDF:', pdfErr);
      return res.status(500).json({ error: 'Payment confirmed but failed to generate ticket PDF.' });
    }

    // Send Confirmation Email
    const emailHtml = getBookingConfirmationTemplate(
      updatedBooking.user.name,
      updatedBooking.event.title,
      updatedBooking.event.startDate.toLocaleDateString(),
      updatedBooking.seatCount
    );

    await sendEmail({
      to: updatedBooking.user.email,
      subject: `Booking Confirmed: ${updatedBooking.event.title} (ID: ${updatedBooking.bookingId})`,
      html: emailHtml,
      attachments: [{
        filename: `ticket_${updatedBooking.bookingId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    // Alert Organizer (Atharva Dhawale)
    const alertHtml = getAdminNotificationTemplate(
      `New Booking for ${updatedBooking.event.title}`,
      `Lead Hiker: ${updatedBooking.user.name} (${updatedBooking.user.email}) has booked ${updatedBooking.seatCount} seat(s) for the trek to ${updatedBooking.event.title}. Total Paid Amount: INR ${updatedBooking.totalAmount}. Please check the roster and assign trek leaders.`
    );

    await sendEmail({
      to: 'atharvadhawale80@gmail.com',
      subject: `[New Booking ALERT] ${updatedBooking.event.title} - ${updatedBooking.seatCount} Seats`,
      html: alertHtml
    });

    // Create User Notification
    await prisma.notification.create({
      data: {
        userId: updatedBooking.userId,
        title: 'Booking Confirmed!',
        message: `Your booking for ${updatedBooking.event.title} has been confirmed. PDF ticket is ready for download.`
      }
    });

    return res.json({
      message: 'Booking payment confirmed successfully! Ticket issued.',
      booking: updatedBooking
    });
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    return res.status(500).json({ error: error.message || 'Failed to confirm payment.' });
  }
}

/**
 * Lists bookings for the logged-in user.
 */
export async function getUserBookings(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        event: true,
        certificate: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedBookings = bookings.map(b => ({
      ...b,
      event: {
        ...b.event,
        images: parseField(b.event.images),
        pickupPoints: parseField(b.event.pickupPoints)
      }
    }));

    return res.json(formattedBookings);
  } catch (error) {
    console.error('Get user bookings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve bookings.' });
  }
}

/**
 * Lists all bookings in the system for Admin.
 */
export async function getAllBookings(req: AuthRequest, res: Response) {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true, startDate: true } },
        members: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    return res.status(500).json({ error: 'Failed to retrieve all bookings.' });
  }
}

/**
 * Public route to verify a booking or ticket QR code.
 */
export async function verifyBooking(req: Request, res: Response) {
  const { id } = req.params; // bookingId or uuid

  try {
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { id },
          { bookingId: id }
        ]
      },
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { title: true, startDate: true, status: true } },
        members: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        verified: false,
        message: 'Invalid Ticket QR. Booking record not found.'
      });
    }

    const isValid = booking.paymentStatus === 'PAID';

    return res.json({
      verified: true,
      isValid,
      bookingId: booking.bookingId,
      leadName: booking.user.name,
      trekTitle: booking.event.title,
      startDate: booking.event.startDate.toLocaleDateString(),
      seatCount: booking.seatCount,
      paymentStatus: booking.paymentStatus,
      eventStatus: booking.event.status,
      members: booking.members.map(m => ({
        name: m.name,
        age: m.age,
        gender: m.gender,
        attendanceStatus: m.attendanceStatus
      }))
    });
  } catch (error) {
    console.error('Verify booking error:', error);
    return res.status(500).json({ error: 'Error during validation scanning.' });
  }
}

// Utility to parse JSON
function parseField(field: string, fallback: any = []) {
  try {
    return field ? JSON.parse(field) : fallback;
  } catch (e) {
    return fallback;
  }
}
