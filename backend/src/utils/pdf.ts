import PDFDocument from 'pdfkit';
import { generateQRCode } from './qr';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

/**
 * Converts a PDFKit document generation process into a Buffer promise.
 */
function buildPDFBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));
    doc.end();
  });
}

interface TicketMember {
  id: string;
  name: string;
  gender: string;
  age: number;
  phone?: string | null;
  email?: string | null;
  bloodGroup?: string | null;
  idProofType?: string | null;
  idProofNumber?: string | null;
  seatNumber?: string | null;
  busNumber?: string | null;
}

interface TicketData {
  bookingId: string;
  trekTitle: string;
  startDate: string;
  location: string;
  totalAmount: number;
  difficulty: string;
  reportingTime: string;
  reportingLocation: string;
  pickupPoint: string;
  coordinatorName: string;
  coordinatorPhone: string;
  emergencyContact: string;
  weatherReminder: string;
  thingsToCarry: string[];
  safetyInstructions: string[];
  cancellationPolicy: string;
  userId: string;
  eventId: string;
  securityToken: string;
  createdAt: string;
  members: TicketMember[];
}

/**
 * Generates a beautiful multi-page PDF ticket where each participant gets their own airline boarding pass page.
 */
export async function generateTicketPDF(data: TicketData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const JWT_SECRET = process.env.JWT_SECRET || 'treckwari-jwt-super-secret-key-9322340365';

  // Load settings
  const settings = await prisma.organizationSettings.findUnique({
    where: { id: 'default-settings' }
  });
  const companyName = settings?.companyName || 'TrekWari';

  for (let i = 0; i < data.members.length; i++) {
    const member = data.members[i];

    if (i > 0) {
      doc.addPage();
    }

    // --- MAIN BOARDING PASS ---
    // Outer border container (rounded)
    doc.roundedRect(40, 40, 515, 450, 10).strokeColor('#1F2937').lineWidth(1.5).stroke();

    // Top Orange Header Bar
    doc.fillColor('#F97316').roundedRect(41, 41, 513, 50, 10).fill();
    doc.rect(41, 61, 513, 30).fill();
    
    // Logo & Header text
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16).text(companyName.toUpperCase(), 55, 52);
    doc.fontSize(8).font('Helvetica').text(settings?.tagline || "Not Just A Trek, It's A Waari.", 55, 72);

    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text('BOARDING PASS / EXPEDITION TICKET', 240, 58, { align: 'right', width: 300 });

    // Primary layout grid
    let gridY = 110;

    // Row 1: Trek Info
    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('TREK / EXPEDITION', 55, gridY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(14).text(data.trekTitle.toUpperCase(), 55, gridY + 12, { width: 280 });

    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('DATE', 360, gridY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(12).text(data.startDate, 360, gridY + 12);

    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('DIFFICULTY', 460, gridY);
    doc.fillColor('#F97316').font('Helvetica-Bold').fontSize(12).text(data.difficulty.toUpperCase(), 460, gridY + 12);

    gridY += 45;

    // Row 2: Participant Info
    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('PARTICIPANT NAME', 55, gridY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(12).text(`${member.name} (${member.age}, ${member.gender})`, 55, gridY + 12);

    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('BUS / SEAT', 360, gridY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(12).text(`${member.busNumber || 'Bus 1'} / ${member.seatNumber || 'Auto-Assigned'}`, 360, gridY + 12);

    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('TICKET STATUS', 460, gridY);
    doc.fillColor('#16A34A').font('Helvetica-Bold').fontSize(12).text('CONFIRMED', 460, gridY + 12);

    gridY += 45;

    // Row 3: Pickup & Timing
    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('PICKUP POINT', 55, gridY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(10).text(data.pickupPoint, 55, gridY + 12, { width: 280 });

    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('REPORTING TIME', 360, gridY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(11).text(data.reportingTime, 360, gridY + 12);

    gridY += 45;

    // Row 4: Coordinator Details
    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('TREK COORDINATOR', 55, gridY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(11).text(data.coordinatorName || 'Trek Coordinator', 55, gridY + 12);

    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('COORDINATOR PHONE', 360, gridY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(11).text(data.coordinatorPhone || settings?.phone || '+91 9322340365', 360, gridY + 12);

    gridY += 45;

    // Divider Line inside card
    doc.moveTo(41, gridY).lineTo(554, gridY).strokeColor('#E5E7EB').lineWidth(1).stroke();

    gridY += 15;

    // Row 5: Group Roster & Things to Carry
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(10).text('GROUP ROSTER & THINGS TO CARRY', 55, gridY);
    
    // Left: Group Roster (list of all booking members)
    let rosterY = gridY + 15;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1F2937').text(`Participants (${data.members.length}):`, 55, rosterY);
    rosterY += 12;
    doc.font('Helvetica').fontSize(8.0).fillColor('#4B5563');
    data.members.forEach((m, idx) => {
      if (idx < 6) {
        doc.text(`${idx + 1}. ${m.name} (${m.age}, ${m.gender})`, 55, rosterY);
        rosterY += 11;
      } else if (idx === 6) {
        doc.text(`... and ${data.members.length - 6} more`, 55, rosterY);
        rosterY += 11;
      }
    });
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1F2937').text(`Total Paid: INR ${data.totalAmount.toFixed(2)}`, 55, rosterY + 4);

    // Right: Things to Carry
    let carryY = gridY + 15;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#1F2937').text('THINGS TO CARRY:', 300, carryY);
    carryY += 12;
    doc.font('Helvetica').fontSize(8.0).fillColor('#4B5563');
    data.thingsToCarry.slice(0, 5).forEach((item) => {
      doc.text(`• ${item}`, 300, carryY, { width: 230 });
      carryY += 11;
    });

    // Weather Warning Box
    doc.fillColor('#FFF7ED').rect(55, gridY + 95, 485, 28).fill();
    doc.fillColor('#C2410C').font('Helvetica-Bold').fontSize(7.5).text(`🌦 WEATHER NOTES: ${data.weatherReminder || 'Expect moderate monsoon showers. Carry poncho/rainwear.'}`, 65, gridY + 105);

    // --- DASHED DIVIDER ---
    doc.strokeColor('#F97316').lineWidth(2).dash(5, { space: 3 }).moveTo(40, 510).lineTo(555, 510).stroke().undash();

    // --- TICKET STUB / SECURITY GATE COPY ---
    // Outer border container
    doc.roundedRect(40, 530, 515, 230, 10).strokeColor('#1F2937').lineWidth(1.5).stroke();

    // Top Orange Header Bar for Stub
    doc.fillColor('#1F2937').roundedRect(41, 531, 513, 30, 10).fill();
    doc.rect(41, 541, 513, 20).fill();
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text('SECURITY GATE AUDIT COPY (STUB)', 55, 542);
    doc.text('GATE RECEIPT', 460, 542, { align: 'right', width: 80 });

    // Details on Stub
    let stubY = 575;
    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('BOOKING ID', 55, stubY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(11).text(data.bookingId, 55, stubY + 12);

    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('TICKET ID (SEAT)', 240, stubY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(11).text(`${member.id.substring(0, 8).toUpperCase()} (${member.seatNumber || 'AUTO'})`, 240, stubY + 12);

    stubY += 35;

    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('PARTICIPANT', 55, stubY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(11).text(member.name, 55, stubY + 12);

    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('TREK DATE', 240, stubY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(11).text(data.startDate, 240, stubY + 12);

    stubY += 35;

    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('PICKUP LOCATION', 55, stubY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(9.5).text(data.pickupPoint, 55, stubY + 12, { width: 170 });

    doc.fillColor('#9CA3AF').font('Helvetica-Bold').fontSize(8).text('PAYMENT PAID', 240, stubY);
    doc.fillColor('#1F2937').font('Helvetica-Bold').fontSize(11).text(`INR ${(data.totalAmount / data.members.length).toFixed(2)}`, 240, stubY + 12);

    // Cryptographically signed QR Code
    try {
      const timestamp = Date.now().toString();
      const textToSign = `${data.bookingId}|${member.id}|${data.userId}|${data.eventId}|${timestamp}`;
      const signature = crypto.createHmac('sha256', JWT_SECRET).update(textToSign).digest('hex');

      const qrPayload = JSON.stringify({
        bookingId: data.bookingId,
        bookingToken: member.id,
        userId: data.userId,
        trekId: data.eventId,
        timestamp,
        signature
      });

      const qrBase64 = await generateQRCode(qrPayload);
      const qrBuffer = Buffer.from(qrBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
      doc.image(qrBuffer, 410, 575, { width: 130, height: 130 });
      doc.fontSize(7.5).fillColor('#9CA3AF').text('SCAN TO BOARD BUS', 438, 715);
    } catch (err) {
      console.error('Failed to embed secure QR code in stub:', err);
    }

    // Emergency Line on Stub
    doc.fillColor('#C2410C').font('Helvetica-Bold').fontSize(8.5).text(`🚨 EMERGENCY HELPLINE: ${data.emergencyContact || settings?.phone || '+91 9322340365'}`, 55, 740);

    // Footer brand notice
    doc.fontSize(7.5).fillColor('#9CA3AF').text(`Generated: ${new Date().toLocaleString()} | Powered by ${companyName} CMS System. All Rights Reserved.`, 40, 785, { align: 'center' });
  }

  return buildPDFBuffer(doc);
}

interface CertificateData {
  certificateId: string;
  name: string;
  trekTitle: string;
  altitude: string;
  date: string;
}

/**
 * Generates a certificate of trekking completion.
 */
export async function generateCertificatePDF(data: CertificateData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });

  // Load settings
  const settings = await prisma.organizationSettings.findUnique({
    where: { id: 'default-settings' }
  });
  const companyName = (settings?.companyName || 'TrekWari').toUpperCase();
  const founder = settings?.founderName || 'Atharva Dhawale';

  // Border Frame
  doc.rect(20, 20, 782, 555).strokeColor('#14532D').lineWidth(5).stroke();
  doc.rect(25, 25, 772, 545).strokeColor('#F59E0B').lineWidth(1.5).stroke();

  // Decorative corners
  doc.rect(20, 20, 40, 40).fillColor('#166534').fill();
  doc.rect(762, 20, 40, 40).fill();
  doc.rect(20, 535, 40, 40).fill();
  doc.rect(762, 535, 40, 40).fill();

  // Restoring fill color
  doc.fillColor('#1F2937');

  // Certificate Header
  doc.fontSize(14).font('Helvetica').fillColor('#7C4A21').text(`${companyName} ADVENTURES & EXPEDITIONS`, 40, 90, { align: 'center' });
  doc.fontSize(36).font('Helvetica-Bold').fillColor('#14532D').text('CERTIFICATE OF PARTICIPATION', 40, 125, { align: 'center' });
  
  // Award Text
  doc.fontSize(14).font('Helvetica').fillColor('#4B5563').text('This certificate is proudly awarded to', 40, 200, { align: 'center' });
  
  // Name
  doc.fontSize(28).font('Helvetica-Bold').fillColor('#1F2937').text(data.name, 40, 240, { align: 'center' });
  
  // Line under name
  doc.moveTo(250, 280).lineTo(570, 280).strokeColor('#F59E0B').lineWidth(2).stroke();

  // Achievement description
  const descriptionText = `for successfully summiting and completing the adventure expedition of`;
  doc.fontSize(14).font('Helvetica').fillColor('#4B5563').text(descriptionText, 40, 310, { align: 'center' });

  // Trek Title & details
  const altitudeText = data.altitude ? ` (Altitude: ${data.altitude})` : '';
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#166534').text(`${data.trekTitle}${altitudeText}`, 40, 345, { align: 'center' });
  
  doc.fontSize(12).font('Helvetica').fillColor('#6B7280').text(`Conducted on ${data.date} under certified leadership guidelines.`, 40, 390, { align: 'center' });

  // Signature lines
  // Left: Founder
  doc.moveTo(120, 480).lineTo(280, 480).strokeColor('#9CA3AF').lineWidth(1).stroke();
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F2937').text(founder, 120, 490, { width: 160, align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#6B7280').text('Founder & Trek Leader', 120, 505, { width: 160, align: 'center' });

  // Middle: QR validation code
  try {
    const validationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-booking/${data.certificateId}`;
    const qrBase64 = await generateQRCode(validationUrl);
    const qrBuffer = Buffer.from(qrBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
    doc.image(qrBuffer, 370, 420, { width: 80, height: 80 });
    doc.fontSize(8).fillColor('#9CA3AF').text(`Verify: ${data.certificateId}`, 40, 505, { align: 'center' });
  } catch (err) {
    console.error('Failed to embed QR in Certificate:', err);
  }

  // Right: Co-signature
  doc.moveTo(540, 480).lineTo(700, 480).strokeColor('#9CA3AF').lineWidth(1).stroke();
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F2937').text('TreckWari Safety Council', 540, 490, { width: 160, align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#6B7280').text('Safety & Audit Head', 540, 505, { width: 160, align: 'center' });

  return buildPDFBuffer(doc);
}
