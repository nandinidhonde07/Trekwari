import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { generateTicketPDF } from '../utils/pdf';
import { sendEmail, getBookingConfirmationTemplate, getAdminNotificationTemplate } from '../utils/email';
import crypto from 'crypto';

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

    // Check if event is completed or past
    const now = new Date();
    if (event.status === 'COMPLETED' || new Date(event.endDate || event.startDate) < now) {
      return res.status(400).json({ error: 'This expedition has already been completed. Bookings are closed.' });
    }

    // Check if event is archived or not open
    if (event.status === 'CANCELLED' || event.status === 'DRAFT' || event.isDeleted) {
      return res.status(400).json({ error: 'This expedition is not currently available for booking.' });
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

    if (seatCount !== members.length) {
      return res.status(400).json({ error: 'Seat count must match the number of participant details provided.' });
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

    const gstAmount = Math.round(subtotal * 0.18);
    const totalAmount = subtotal - discount + gstAmount;

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
    const securityToken = crypto.randomUUID();

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
        securityToken,
        members: {
          create: members.map((m: any, index: number) => ({
            name: m.name,
            gender: m.gender || 'Male',
            age: parseInt(m.age),
            phone: m.phone || null,
            email: m.email || null,
            bloodGroup: m.bloodGroup || null,
            emergencyName: m.emergencyName || null,
            emergencyPhone: m.emergencyPhone || null,
            medicalConditions: m.medicalConditions || null,
            allergies: m.allergies || null,
            fitnessLevel: m.fitnessLevel || 'Average',
            idProofType: m.idProofType || null,
            idProofNumber: m.idProofNumber || null,
            busNumber: `Bus ${Math.ceil((index + 1) / 30)}`,
            seatNumber: `Seat ${index + 1}`,
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
          event: {
            include: {
              policy: true
            }
          },
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
        totalAmount: updatedBooking.totalAmount,
        difficulty: updatedBooking.event.difficulty,
        reportingTime: updatedBooking.event.meetingPoint || '06:00 AM',
        reportingLocation: updatedBooking.event.meetingPoint || 'Main Gate Bus Station',
        pickupPoint: JSON.parse(updatedBooking.event.pickupPoints as string)[0] || 'Kopargaon',
        coordinatorName: updatedBooking.event.coordinatorName || 'Trek Coordinator',
        coordinatorPhone: updatedBooking.event.coordinatorPhone || '+91 9322340365',
        emergencyContact: updatedBooking.emergencyContact,
        weatherReminder: updatedBooking.event.weatherNotes || 'Expect moderate showers. Carry rainwear.',
        thingsToCarry: JSON.parse(updatedBooking.event.thingsToCarry || '[]'),
        safetyInstructions: JSON.parse(updatedBooking.event.safetyMeasures || '[]'),
        cancellationPolicy: updatedBooking.event.policy?.cancellationRules ? JSON.parse(updatedBooking.event.policy.cancellationRules).join(', ') : 'Standard guidelines apply.',
        userId: updatedBooking.userId,
        eventId: updatedBooking.eventId,
        securityToken: updatedBooking.securityToken || '',
        createdAt: updatedBooking.createdAt.toISOString(),
        members: updatedBooking.members.map(m => ({
          id: m.id,
          name: m.name,
          gender: m.gender,
          age: m.age,
          phone: m.phone,
          email: m.email,
          bloodGroup: m.bloodGroup,
          idProofType: m.idProofType,
          idProofNumber: m.idProofNumber,
          seatNumber: m.seatNumber,
          busNumber: m.busNumber
        }))
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
    const settings = await prisma.organizationSettings.findUnique({
      where: { id: 'default-settings' }
    });
    const organizerEmail = settings?.email || 'atharvadhawale80@gmail.com';

    const alertHtml = getAdminNotificationTemplate(
      `New Booking for ${updatedBooking.event.title}`,
      `Lead Hiker: ${updatedBooking.user.name} (${updatedBooking.user.email}) has booked ${updatedBooking.seatCount} seat(s) for the trek to ${updatedBooking.event.title}. Total Paid Amount: INR ${updatedBooking.totalAmount}. Please check the roster and assign trek leaders.`
    );

    await sendEmail({
      to: organizerEmail,
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

/**
 * Generates and downloads the PDF boarding ticket for a booking.
 */
export async function downloadBookingTicketPDF(req: AuthRequest, res: Response) {
  const { id } = req.params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: true,
        event: true,
        members: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Verify ownership or staff permissions
    const isOwner = booking.userId === req.user?.id;
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    if (!isOwner && !isStaff) {
      return res.status(403).json({ error: 'Access denied. You can only download your own tickets.' });
    }

    const settings = await prisma.organizationSettings.findUnique({
      where: { id: 'default-settings' }
    });

    const thingsToCarry = parseField(booking.event.thingsToCarry, ['Raincoat / Poncho', 'Trekking Shoes', '2 Liters Water', 'Valid Photo ID']);
    const safetyInstructions = parseField(booking.event.safetyMeasures, ['Follow the coordinator instructions', 'Do not wander off', 'Eco-friendly trail rule (no littering)']);
    const pickupPoints = parseField(booking.event.pickupPoints, ['Kopargaon HQ']);

    const ticketData = {
      bookingId: booking.bookingId,
      trekTitle: booking.event.title,
      startDate: booking.event.startDate.toLocaleDateString('en-IN', { dateStyle: 'medium' }),
      location: booking.event.location,
      totalAmount: booking.totalAmount,
      difficulty: booking.event.difficulty || 'Moderate',
      reportingTime: booking.event.startDate.toLocaleTimeString('en-IN', { timeStyle: 'short' }) || '06:00 AM',
      reportingLocation: booking.event.meetingPoint || 'Kopargaon Basecamp',
      pickupPoint: booking.event.meetingPoint || pickupPoints[0] || 'Kopargaon Basecamp',
      coordinatorName: booking.event.coordinatorName || settings?.founderName || 'Atharva Dhawale',
      coordinatorPhone: booking.event.coordinatorPhone || settings?.phone || '+91 9322340365',
      emergencyContact: settings?.emergencyContact || settings?.phone || '+91 9322340365',
      weatherReminder: booking.event.weatherNotes || 'Expect cool mountain breezes. Carry light rain jacket.',
      thingsToCarry,
      safetyInstructions,
      cancellationPolicy: 'Refunds as per TrekWari policy guidelines.',
      userId: booking.userId,
      eventId: booking.eventId,
      securityToken: booking.securityToken || 'token-placeholder',
      createdAt: booking.createdAt.toISOString(),
      members: booking.members.map((m, idx) => ({
        id: m.id,
        name: m.name,
        gender: m.gender,
        age: m.age,
        phone: m.phone,
        email: m.email,
        bloodGroup: m.bloodGroup,
        idProofType: m.idProofType,
        idProofNumber: m.idProofNumber,
        seatNumber: m.seatNumber || `Seat ${idx + 1}`,
        busNumber: m.busNumber || 'Bus 1'
      }))
    };

    const pdfBuffer = await generateTicketPDF(ticketData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=boarding-pass-${booking.bookingId}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Download ticket PDF error:', error);
    return res.status(500).json({ error: 'Failed to generate PDF boarding passes.' });
  }
}

/**
 * Cryptographically verifies a ticket QR code and returns details.
 */
export async function verifyBookingQR(req: Request, res: Response) {
  const { qrPayload } = req.body;

  if (!qrPayload) {
    return res.status(400).json({ error: 'QR Code payload is missing.' });
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'treckwari-jwt-super-secret-key-9322340365';

  try {
    const data = typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
    const { bookingId, bookingToken, userId, trekId, timestamp, signature } = data;

    if (!bookingId || !bookingToken || !userId || !trekId || !timestamp || !signature) {
      return res.status(400).json({ error: 'Malformed QR Code payload. Fields are missing.' });
    }

    // 1. Verify HMAC Signature
    const textToSign = `${bookingId}|${bookingToken}|${userId}|${trekId}|${timestamp}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(textToSign)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid QR signature. Ticket is counterfeit or tampered!' });
    }

    // 2. Fetch booking and participant
    const booking = await prisma.booking.findUnique({
      where: { bookingId },
      include: {
        user: { select: { name: true, email: true } },
        event: true,
        members: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Ticket does not exist in our systems.' });
    }

    // 3. Verify payment is completed
    if (booking.paymentStatus !== 'PAID') {
      return res.status(400).json({ error: 'Ticket payment status is unpaid.' });
    }

    // 4. Verify trek date is valid
    const eventEndDate = new Date(booking.event.endDate);
    const limitDate = new Date(eventEndDate.getTime() + 48 * 60 * 60 * 1000); // 48h padding
    if (new Date() > limitDate) {
      return res.status(400).json({ error: `This ticket has expired. The trek was completed on ${eventEndDate.toLocaleDateString()}.` });
    }

    // 5. Verify member exists
    const member = booking.members.find(m => m.id === bookingToken);
    if (!member) {
      return res.status(404).json({ error: 'Participant boarding record not found.' });
    }

    // 6. Check duplicate check-in
    if (member.checkedIn) {
      return res.status(400).json({
        error: 'ALREADY_CHECKED_IN',
        message: 'Already Checked In',
        checkedInAt: member.checkedInAt,
        checkedInBy: member.checkedInBy || 'System Staff'
      });
    }

    // Success! Return verification info
    return res.json({
      verified: true,
      bookingId: booking.bookingId,
      bookingMemberId: member.id,
      name: member.name,
      age: member.age,
      gender: member.gender,
      busNumber: member.busNumber,
      seatNumber: member.seatNumber,
      pickupPoint: booking.event.meetingPoint || 'Basecamp',
      coordinatorName: booking.event.coordinatorName || 'Atharva Dhawale',
      attendanceStatus: member.attendanceStatus
    });
  } catch (error) {
    console.error('QR Verification error:', error);
    return res.status(500).json({ error: 'QR Code verification failed.' });
  }
}

/**
 * Checks in a specific participant.
 */
export async function checkInParticipant(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
  const { bookingMemberId, deviceInfo, location } = req.body;

  if (!bookingMemberId) {
    return res.status(400).json({ error: 'Participant ID is required.' });
  }

  try {
    const member = await prisma.bookingMember.findUnique({
      where: { id: bookingMemberId },
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            event: true
          }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Boarding record not found.' });
    }

    // Check duplicate scan safety
    if (member.checkedIn) {
      await prisma.checkInLog.create({
        data: {
          bookingMemberId,
          scannedBy: req.user.email,
          deviceInfo: deviceInfo || 'Web Scanner',
          location: location || null,
          status: 'DUPLICATE'
        }
      });

      return res.status(400).json({
        error: 'Duplicate scan. Participant is already checked in.',
        checkedInAt: member.checkedInAt,
        checkedInBy: member.checkedInBy
      });
    }

    // Mark as checked in
    const updatedMember = await prisma.bookingMember.update({
      where: { id: bookingMemberId },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
        checkedInBy: req.user.email,
        checkedInDevice: deviceInfo || 'Web Scanner',
        attendanceStatus: 'CHECKED_IN'
      }
    });

    // Write CheckInLog
    await prisma.checkInLog.create({
      data: {
        bookingMemberId,
        scannedBy: req.user.email,
        deviceInfo: deviceInfo || 'Web Scanner',
        location: location || null,
        status: 'SUCCESS'
      }
    });

    // Send check-in notifications
    const { sendSystemNotification } = require('../utils/notificationHelper');
    const msg = `Boarding completed! ${member.name} checked in successfully for ${member.booking.event.title} (${member.busNumber || 'Bus 1'}, ${member.seatNumber || 'Auto'}).`;
    await sendSystemNotification(
      member.booking.userId,
      'Boarding Checked In!',
      msg,
      'Boarding Notification - TrekWari',
      `<h2>Boarding Completed!</h2><p>Hello ${member.booking.user.name},</p><p>We are glad to inform you that participant <b>${member.name}</b> has completed the QR boarding check-in on the bus (<b>${member.busNumber || 'Bus 1'}</b>, <b>${member.seatNumber || 'Auto-Assigned'}</b>) for the expedition of <b>${member.booking.event.title}</b>.</p><p>Time: ${new Date().toLocaleTimeString()}</p><p>Happy Trekking!</p>`
    );

    return res.json({
      message: 'Participant checked in successfully!',
      member: updatedMember
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ error: 'Failed to process check-in.' });
  }
}

/**
 * Calculates live attendance statistics and returns roster lists.
 */
export async function getAttendanceStats(req: AuthRequest, res: Response) {
  const { eventId, search } = req.query;

  try {
    let whereClause: any = {};
    if (eventId) {
      whereClause.eventId = String(eventId);
    } else {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      whereClause.event = {
        startDate: {
          gte: todayStart,
          lte: todayEnd
        }
      };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        paymentStatus: 'PAID',
        ...whereClause
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        event: { select: { id: true, title: true, maxSeats: true, startDate: true } },
        members: true
      }
    });

    const allMembers: any[] = [];
    bookings.forEach(b => {
      b.members.forEach(m => {
        allMembers.push({
          id: m.id,
          bookingId: b.bookingId,
          primaryUser: b.user.name,
          primaryPhone: b.user.phone,
          primaryEmail: b.user.email,
          name: m.name,
          gender: m.gender,
          age: m.age,
          phone: m.phone,
          email: m.email,
          bloodGroup: m.bloodGroup,
          emergencyName: m.emergencyName,
          emergencyPhone: m.emergencyPhone,
          medicalConditions: m.medicalConditions,
          allergies: m.allergies,
          fitnessLevel: m.fitnessLevel,
          idProofType: m.idProofType,
          idProofNumber: m.idProofNumber,
          busNumber: m.busNumber,
          seatNumber: m.seatNumber,
          checkedIn: m.checkedIn,
          checkedInAt: m.checkedInAt,
          checkedInBy: m.checkedInBy,
          checkedInDevice: m.checkedInDevice,
          attendanceStatus: m.attendanceStatus,
          trekTitle: b.event.title,
          trekDate: b.event.startDate.toLocaleDateString()
        });
      });
    });

    const totalSeats = allMembers.length;
    const checkedInCount = allMembers.filter(m => m.checkedIn).length;
    const absentCount = allMembers.filter(m => m.attendanceStatus === 'ABSENT').length;
    const pendingCount = totalSeats - checkedInCount - absentCount;

    const busOccupancy: { [bus: string]: { booked: number; checkedIn: number } } = {};
    allMembers.forEach(m => {
      const bus = m.busNumber || 'Bus 1';
      if (!busOccupancy[bus]) {
        busOccupancy[bus] = { booked: 0, checkedIn: 0 };
      }
      busOccupancy[bus].booked++;
      if (m.checkedIn) {
        busOccupancy[bus].checkedIn++;
      }
    });

    let filteredMembers = allMembers;
    if (search) {
      const term = String(search).toLowerCase();
      filteredMembers = allMembers.filter(
        m =>
          m.name.toLowerCase().includes(term) ||
          m.bookingId.toLowerCase().includes(term) ||
          (m.phone && m.phone.includes(term)) ||
          (m.primaryPhone && m.primaryPhone.includes(term))
      );
    }

    return res.json({
      stats: {
        totalSeats,
        checkedIn: checkedInCount,
        pending: pendingCount,
        absent: absentCount,
        busOccupancy
      },
      roster: filteredMembers
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    return res.status(500).json({ error: 'Failed to retrieve attendance roster.' });
  }
}

/**
 * Validates a coupon code and calculates the discount amount.
 */
export async function validateCoupon(req: Request, res: Response) {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required.' });
  }

  try {
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon code is invalid.' });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ error: 'Coupon is inactive.' });
    }
    if (new Date(coupon.expiry) <= new Date()) {
      return res.status(400).json({ error: 'Coupon has expired.' });
    }
    if (coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ error: 'Coupon usage limit has been reached.' });
    }

    let discount = 0;
    if (coupon.isPercentage) {
      discount = subtotal * (coupon.discount / 100);
    } else {
      discount = coupon.discount;
    }
    discount = Math.min(discount, subtotal);

    return res.json({
      valid: true,
      discount,
      code: coupon.code
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to validate coupon.' });
  }
}
