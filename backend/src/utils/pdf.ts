import PDFDocument from 'pdfkit';
import { generateQRCode } from './qr';

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

interface TicketData {
  bookingId: string;
  trekTitle: string;
  startDate: string;
  location: string;
  leadName: string;
  seatCount: number;
  pickupPoint: string;
  emergencyContact: string;
  totalAmount: number;
  members: string[];
}

/**
 * Generates a beautiful PDF ticket for a booking.
 */
export async function generateTicketPDF(data: TicketData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  
  // Header Logo and Title
  doc.fillColor('#14532D').fontSize(24).font('Helvetica-Bold').text('TRECKWARI', 40, 50);
  doc.fontSize(10).font('Helvetica').text('Not Just A Trek, It\'s A Waari.', 40, 78);
  
  doc.fillColor('#374151').fontSize(14).font('Helvetica-Bold').text('TREKKING EXPEDITION TICKET', 320, 50, { align: 'right' });
  doc.fontSize(10).font('Helvetica').fillColor('#F59E0B').text(`Booking ID: ${data.bookingId}`, 320, 70, { align: 'right' });
  doc.fillColor('#9CA3AF').text(`Generated at: ${new Date().toLocaleDateString()}`, 320, 85, { align: 'right' });

  // Divider Line
  doc.moveTo(40, 110).lineTo(550, 110).strokeColor('#E5E7EB').lineWidth(1).stroke();

  // Booking Summary Box
  doc.fillColor('#F0FDF4').rect(40, 130, 510, 80).fill();
  doc.fillColor('#14532D').fontSize(16).font('Helvetica-Bold').text(data.trekTitle, 60, 145);
  doc.fillColor('#374151').fontSize(11).font('Helvetica').text(`Date: ${data.startDate}  |  Location: ${data.location}`, 60, 175);
  doc.text(`Seats Booked: ${data.seatCount}  |  Status: PAID`, 60, 192);

  // Participant details
  doc.fillColor('#1F2937').fontSize(12).font('Helvetica-Bold').text('Primary Booking Holder:', 40, 235);
  doc.font('Helvetica').fontSize(11).text(data.leadName, 40, 255);

  doc.font('Helvetica-Bold').text('Pickup Point:', 220, 235);
  doc.font('Helvetica').text(data.pickupPoint, 220, 255);

  doc.font('Helvetica-Bold').text('Emergency Contact:', 400, 235);
  doc.font('Helvetica').text(data.emergencyContact, 400, 255);

  // Group Members Table
  doc.font('Helvetica-Bold').text('Participant Roster:', 40, 290);
  let memberY = 310;
  
  // Headers
  doc.fillColor('#F3F4F6').rect(40, memberY, 510, 20).fill();
  doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold').text('No.', 50, memberY + 5);
  doc.text('Participant Name', 100, memberY + 5);
  doc.text('Status', 480, memberY + 5);
  
  memberY += 20;
  doc.font('Helvetica');

  data.members.forEach((member, index) => {
    // Zebra striping
    if (index % 2 === 1) {
      doc.fillColor('#F9FAFB').rect(40, memberY, 510, 20).fill();
    }
    doc.fillColor('#4B5563').text(`${index + 1}`, 50, memberY + 5);
    doc.text(member, 100, memberY + 5);
    doc.text('Confirmed', 480, memberY + 5);
    memberY += 20;
  });

  // Payment Breakdown
  doc.fillColor('#374151').font('Helvetica-Bold').text('Total Paid Amount:', 40, memberY + 20);
  doc.font('Helvetica').text(`INR ${data.totalAmount.toFixed(2)} (Inclusive of GST & Guides fees)`, 40, memberY + 38);

  // Terms and Safety guidelines
  doc.fontSize(10).font('Helvetica-Bold').text('Important Safety Guidelines:', 40, memberY + 70);
  doc.font('Helvetica').fontSize(9).fillColor('#6B7280');
  const guidelines = [
    '1. Please carry a valid Photo ID proof to the pickup point.',
    '2. Trekking shoes with good rubber treads are mandatory for security.',
    '3. Do not wander away from the designated group and follow your Trek Leader\'s advice.',
    '4. TreckWari is an eco-friendly group. Littering is strictly prohibited in nature trails.',
    '5. In case of emergency or delay, contact Atharva Dhawale immediately at +91 9322340365.'
  ];
  let guidelineY = memberY + 90;
  guidelines.forEach((g) => {
    doc.text(g, 40, guidelineY);
    guidelineY += 15;
  });

  // Embed QR Code for scanning
  try {
    const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-booking/${data.bookingId}`;
    const qrBase64 = await generateQRCode(qrUrl);
    const qrBuffer = Buffer.from(qrBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
    doc.image(qrBuffer, 430, memberY + 70, { width: 100, height: 100 });
    doc.fontSize(8).fillColor('#9CA3AF').text('Scan to Verify Ticket', 440, memberY + 175);
  } catch (err) {
    console.error('Failed to embed QR code in PDF:', err);
  }

  // Footer banner
  doc.fontSize(8).fillColor('#9CA3AF').text('TreckWari Adventure Expeditions. Kopargaon, Maharashtra.', 40, 780, { align: 'center' });

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
  // Landscape certificate
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });

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
  doc.fontSize(14).font('Helvetica').fillColor('#7C4A21').text('TRECKWARI ADVENTURES & EXPEDITIONS', 40, 90, { align: 'center' });
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
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F2937').text('Atharva Dhawale', 120, 490, { width: 160, align: 'center' });
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
