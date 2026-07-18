import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing records to ensure idempotency
  await prisma.certificate.deleteMany();
  await prisma.bookingMember.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.memoryComment.deleteMany();
  await prisma.memoryLike.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.eventLeader.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.event.deleteMany();
  await prisma.trekPolicy.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.product.deleteMany();
  await prisma.blog.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.partner.deleteMany();

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // 1. Seed Users
  const atharva = await prisma.user.upsert({
    where: { email: 'atharvadhawale80@gmail.com' },
    update: {},
    create: {
      email: 'atharvadhawale80@gmail.com',
      name: 'Atharva Dhawale',
      passwordHash: adminPassword,
      phone: '+919322340365',
      role: 'SUPER_ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
      referralCode: 'ATHARVA100',
      rewardPoints: 500,
      badgeLevel: 'SUMMIT_LEGEND',
      bloodGroup: 'O+',
      allergies: 'None',
      medicalNotes: 'Certified Trek Leader',
      emailVerified: true,
      isActive: true
    }
  });

  const leaderUser = await prisma.user.upsert({
    where: { email: 'leader@treckwari.com' },
    update: {},
    create: {
      email: 'leader@treckwari.com',
      name: 'Rohan Patil',
      passwordHash: adminPassword,
      phone: '+919876543210',
      role: 'TREK_LEADER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop',
      referralCode: 'ROHAN50',
      rewardPoints: 200,
      badgeLevel: 'GOLD_MOUNTAIN_WARRIOR',
      bloodGroup: 'A+',
      allergies: 'Dust allergy',
      medicalNotes: 'First Aid Certified',
      emailVerified: true,
      isActive: true
    }
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@treckwari.com' },
    update: {},
    create: {
      email: 'user@treckwari.com',
      name: 'Amit Shinde',
      passwordHash: userPassword,
      phone: '+919111222333',
      role: 'USER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop',
      referralCode: 'AMIT10',
      referredBy: 'ATHARVA100',
      rewardPoints: 50,
      badgeLevel: 'BRONZE_EXPLORER',
      bloodGroup: 'B+',
      allergies: 'None',
      medicalNotes: 'No major illnesses',
      emailVerified: true,
      isActive: true
    }
  });

  // 2. Seed Organization Settings
  await prisma.organizationSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      organizationName: 'TreckWari',
      founderName: 'Atharva Dhawale',
      email: 'atharvadhawale80@gmail.com',
      phone: '+91 9322340365',
      whatsapp: '+91 9322340365',
      instagram: 'https://www.instagram.com/trekwari',
      youtube: 'https://youtube.com/@trekwari',
      facebook: 'https://facebook.com/trekwari',
      location: 'Kopargaon, Maharashtra, India',
      logoUrl: '/logo.png',
      faviconUrl: '/favicon.ico'
    }
  });

  // 3. Seed Events (Treks)
  // Kalsubai Completed Instance
  const kalsubaiCompleted = await prisma.event.upsert({
    where: { slug: 'kalsubai-completed-2026' },
    update: {},
    create: {
      title: 'Kalsubai Summit Trek (1st Trek)',
      slug: 'kalsubai-completed-2026',
      type: 'TREK',
      status: 'COMPLETED',
      difficulty: 'Moderate',
      altitude: '1646m',
      duration: '1 Day',
      price: 1399,
      maxSeats: 50,
      availableSeats: 0,
      startDate: new Date('2026-06-15T06:00:00Z'),
      endDate: new Date('2026-06-15T18:00:00Z'),
      location: 'Bari Village, Maharashtra',
      description: 'Conquer the highest peak of Maharashtra. Kalsubai is one of the most famous trekking routes in the Sahyadris, offering breathtaking views of the surrounding reservoirs and peaks.',
      highlights: JSON.stringify([
        'Stand on the highest summit of Maharashtra (1646 meters)',
        'Spectacular sunrise views above the clouds',
        'Traditional local village breakfast and lunch',
        'Explore the Kalsubai temple at the summit'
      ]),
      itinerary: JSON.stringify([
        { time: '10:30 PM', activity: 'Pickup from Kopargaon/Shirdi' },
        { time: '04:00 AM', activity: 'Reach Base Village (Bari), Freshen up & Breakfast' },
        { time: '05:30 AM', activity: 'Briefing and Start of Kalsubai Ascent' },
        { time: '09:00 AM', activity: 'Reach Summit, Explore and Photography' },
        { time: '11:00 AM', activity: 'Start descent to base village' },
        { time: '02:30 PM', activity: 'Reach Base, Traditional lunch (Veg/Non-veg)' },
        { time: '04:30 PM', activity: 'Departure back to Kopargaon' }
      ]),
      thingsToCarry: JSON.stringify([
        'Trekking shoes with good grip (Mandatory)',
        '2-3 liters of water',
        'Rainwear (Ponchos/Raincoats)',
        'Personal medications & first aid kit',
        'ID Proof (Aadhar/Voter ID)'
      ]),
      fitnessLevel: 'Moderate. Requires 3-4 hours of continuous hiking and climbing steel ladders near the top.',
      safetyMeasures: JSON.stringify([
        'Certified trek leaders with remote first-aid response skills',
        'Standard safety equipment and emergency backup stretchers',
        'Continuous weather monitoring and local support dispatch'
      ]),
      pickupPoints: JSON.stringify(['Kopargaon', 'Shirdi', 'Rahta', 'Loni', 'Sangamner', 'Ahilyanagar']),
      images: JSON.stringify([
        '/images/kalsubai_1.jpg', // Kalsubai Flyer
        '/images/kalsubai_2.jpg', // Peak Clouds
        '/images/kalsubai_3.jpg', // Mountain ridge climb
        '/images/kalsubai_4.jpg'  // Custom Sunrise view
      ]),
      distance: 12.0,
      elevationGain: 900.0,
      meetingPoint: 'Kopargaon Main Bus Stand',
      endPoint: 'Kopargaon Main Bus Stand',
      googleMapsUrl: 'https://maps.app.goo.gl/kalsubai-mock',
      trekGrade: 'Moderate',
      suitableFor: 'Beginners & Regular Trekkers',
      minAge: 10,
      latitude: 19.6012,
      longitude: 73.7176
    }
  });

  // Kalsubai Upcoming Active Instance
  const kalsubaiUpcoming = await prisma.event.upsert({
    where: { slug: 'kalsubai-summit-trek' },
    update: {},
    create: {
      title: 'Kalsubai Summit Trek',
      slug: 'kalsubai-summit-trek',
      type: 'TREK',
      status: 'OPEN_REGISTRATION',
      difficulty: 'Moderate',
      altitude: '1646m',
      duration: '1 Day',
      price: 1399,
      maxSeats: 30,
      availableSeats: 18,
      startDate: new Date('2026-08-02T06:00:00Z'),
      endDate: new Date('2026-08-02T18:00:00Z'),
      location: 'Bari Village, Maharashtra',
      description: 'Conquer the highest peak of Maharashtra. Kalsubai is one of the most famous trekking routes in the Sahyadris, offering breathtaking views of the surrounding reservoirs and peaks.',
      highlights: JSON.stringify([
        'Stand on the highest summit of Maharashtra (1646 meters)',
        'Spectacular sunrise views above the clouds',
        'Traditional local village breakfast and lunch',
        'Explore the Kalsubai temple at the summit'
      ]),
      itinerary: JSON.stringify([
        { time: '10:30 PM', activity: 'Pickup from Kopargaon/Shirdi' },
        { time: '04:00 AM', activity: 'Reach Base Village (Bari), Freshen up & Breakfast' },
        { time: '05:30 AM', activity: 'Briefing and Start of Kalsubai Ascent' },
        { time: '09:00 AM', activity: 'Reach Summit, Explore and Photography' },
        { time: '11:00 AM', activity: 'Start descent to base village' },
        { time: '02:30 PM', activity: 'Reach Base, Traditional lunch (Veg/Non-veg)' },
        { time: '04:30 PM', activity: 'Departure back to Kopargaon' }
      ]),
      thingsToCarry: JSON.stringify([
        'Trekking shoes with good grip (Mandatory)',
        '2-3 liters of water',
        'Rainwear (Ponchos/Raincoats)',
        'Personal medications & first aid kit',
        'ID Proof (Aadhar/Voter ID)'
      ]),
      fitnessLevel: 'Moderate. Requires 3-4 hours of continuous hiking and climbing steel ladders near the top.',
      safetyMeasures: JSON.stringify([
        'Certified trek leaders with remote first-aid response skills',
        'Standard safety equipment and emergency backup stretchers',
        'Continuous weather monitoring and local support dispatch'
      ]),
      pickupPoints: JSON.stringify(['Kopargaon', 'Shirdi', 'Rahta', 'Loni', 'Sangamner', 'Ahilyanagar']),
      images: JSON.stringify([
        '/images/kalsubai_1.jpg', // Kalsubai Flyer
        '/images/kalsubai_2.jpg', // Peak Clouds
        '/images/kalsubai_3.jpg', // Mountain ridge climb
        '/images/kalsubai_4.jpg'  // Custom Sunrise view
      ]),
      distance: 12.0,
      elevationGain: 900.0,
      meetingPoint: 'Kopargaon Main Bus Stand',
      endPoint: 'Kopargaon Main Bus Stand',
      googleMapsUrl: 'https://maps.app.goo.gl/kalsubai-mock',
      trekGrade: 'Moderate',
      suitableFor: 'Beginners & Regular Trekkers',
      minAge: 10,
      latitude: 19.6012,
      longitude: 73.7176
    }
  });

  // Adrai Completed Instance
  const adraiCompleted = await prisma.event.upsert({
    where: { slug: 'adari-jungle-completed-2026' },
    update: {},
    create: {
      title: 'Adrai Jungle Trek (2nd Trek)',
      slug: 'adari-jungle-completed-2026',
      type: 'TREK',
      status: 'COMPLETED',
      difficulty: 'Easy',
      altitude: '750m',
      duration: '1 Day',
      price: 1499,
      maxSeats: 40,
      availableSeats: 0,
      startDate: new Date('2026-07-11T07:00:00Z'),
      endDate: new Date('2026-07-11T19:00:00Z'),
      location: 'Malshej Ghat, Maharashtra',
      description: 'Explore the dense forest and water streams of Malshej. The Adrai Jungle Trek takes you deep into the heart of the Western Ghats jungle, passing through cascades and thick mossy vegetation.',
      highlights: JSON.stringify([
        'Walk through lush green ancient forests',
        'Numerous stream crossings and waterfalls',
        'Witness beautiful local flora and fauna',
        'Trek with expert local guides and survival leaders'
      ]),
      itinerary: JSON.stringify([
        { time: '05:00 AM', activity: 'Departure from Kopargaon' },
        { time: '08:30 AM', activity: 'Reach Base Village, hot breakfast' },
        { time: '09:30 AM', activity: 'Start forest hike' },
        { time: '01:00 PM', activity: 'Packed lunch deep inside the jungle streams' },
        { time: '02:30 PM', activity: 'Begin return hike to base' },
        { time: '05:00 PM', activity: 'Evening snacks and tea at base' },
        { time: '06:00 PM', activity: 'Travel back to Kopargaon' }
      ]),
      thingsToCarry: JSON.stringify([
        'Comfortable running shoes or trekking sandals',
        'Extra set of dry clothes (Mandatory)',
        'Waterproof dry bag for electronic items',
        'Odomos / Insect repellent spray',
        'Rainwear (Ponchos/Raincoats)'
      ]),
      fitnessLevel: 'Easy. Perfect for beginners and children. Flat trails with minor rocky stream crossings.',
      safetyMeasures: JSON.stringify([
        'Ropes and floatation devices for deep water streams',
        'Certified guides with forest tracking certificates',
        'Emergency response team positioned at the trailhead'
      ]),
      pickupPoints: JSON.stringify(['Kopargaon', 'Shirdi', 'Rahta', 'Loni', 'Sangamner']),
      images: JSON.stringify([
        '/images/adrai_1.jpg', // Adrai Badge
        '/images/adrai_2.jpg', // Poster Malshej
        '/images/adrai_3.jpg', // Rainwear Hikers
        '/images/adrai_4.jpg', // Foggy meadow
        '/images/adrai_5.jpg', // Lone tree
        '/images/adrai_6.jpg'  // Trekkers group
      ]),
      distance: 8.0,
      elevationGain: 200.0,
      meetingPoint: 'Kopargaon Railway Station',
      endPoint: 'Kopargaon Railway Station',
      googleMapsUrl: 'https://maps.app.goo.gl/adrai-mock',
      trekGrade: 'Easy',
      suitableFor: 'Nature lovers, Beginners, Families',
      minAge: 8,
      latitude: 19.2974,
      longitude: 73.7915
    }
  });

  // Adrai Upcoming Active Instance
  const adraiUpcoming = await prisma.event.upsert({
    where: { slug: 'adari-jungle-trek' },
    update: {},
    create: {
      title: 'Adrai Jungle Trek',
      slug: 'adari-jungle-trek',
      type: 'TREK',
      status: 'OPEN_REGISTRATION',
      difficulty: 'Easy',
      altitude: '750m',
      duration: '1 Day',
      price: 1499,
      maxSeats: 30,
      availableSeats: 25,
      startDate: new Date('2026-08-16T07:00:00Z'),
      endDate: new Date('2026-08-16T19:00:00Z'),
      location: 'Malshej Ghat, Maharashtra',
      description: 'Explore the dense forest and water streams of Malshej. The Adrai Jungle Trek takes you deep into the heart of the Western Ghats jungle, passing through cascades and thick mossy vegetation.',
      highlights: JSON.stringify([
        'Walk through lush green ancient forests',
        'Numerous stream crossings and waterfalls',
        'Witness beautiful local flora and fauna',
        'Trek with expert local guides and survival leaders'
      ]),
      itinerary: JSON.stringify([
        { time: '05:00 AM', activity: 'Departure from Kopargaon' },
        { time: '08:30 AM', activity: 'Reach Base Village, hot breakfast' },
        { time: '09:30 AM', activity: 'Start forest hike' },
        { time: '01:00 PM', activity: 'Packed lunch deep inside the jungle streams' },
        { time: '02:30 PM', activity: 'Begin return hike to base' },
        { time: '05:00 PM', activity: 'Evening snacks and tea at base' },
        { time: '06:00 PM', activity: 'Travel back to Kopargaon' }
      ]),
      thingsToCarry: JSON.stringify([
        'Comfortable running shoes or trekking sandals',
        'Extra set of dry clothes (Mandatory)',
        'Waterproof dry bag for electronic items',
        'Odomos / Insect repellent spray',
        'Rainwear (Ponchos/Raincoats)'
      ]),
      fitnessLevel: 'Easy. Perfect for beginners and children. Flat trails with minor rocky stream crossings.',
      safetyMeasures: JSON.stringify([
        'Ropes and floatation devices for deep water streams',
        'Certified guides with forest tracking certificates',
        'Emergency response team positioned at the trailhead'
      ]),
      pickupPoints: JSON.stringify(['Kopargaon', 'Shirdi', 'Rahta', 'Loni', 'Sangamner']),
      images: JSON.stringify([
        '/images/adrai_1.jpg', // Adrai Badge
        '/images/adrai_2.jpg', // Poster Malshej
        '/images/adrai_3.jpg', // Rainwear Hikers
        '/images/adrai_4.jpg', // Foggy meadow
        '/images/adrai_5.jpg', // Lone tree
        '/images/adrai_6.jpg'  // Trekkers group
      ]),
      distance: 8.0,
      elevationGain: 200.0,
      meetingPoint: 'Kopargaon Railway Station',
      endPoint: 'Kopargaon Railway Station',
      googleMapsUrl: 'https://maps.app.goo.gl/adrai-mock',
      trekGrade: 'Easy',
      suitableFor: 'Nature lovers, Beginners, Families',
      minAge: 8,
      latitude: 19.2974,
      longitude: 73.7915
    }
  });

  // Assign Atharva and Rohan to the Treks
  await prisma.eventLeader.create({
    data: {
      eventId: kalsubaiUpcoming.id,
      userId: atharva.id,
      role: 'LEADER'
    }
  });

  await prisma.eventLeader.create({
    data: {
      eventId: adraiUpcoming.id,
      userId: leaderUser.id,
      role: 'LEADER'
    }
  });

  // 4. Seed FAQs
  await prisma.fAQ.createMany({
    data: [
      { question: 'How can I book a trek?', answer: 'You can book a trek directly by selecting the upcoming trip on our Treks page, clicking "Book Now", choosing your date, entering participant and medical details, signing the digital waiver, and completing payment.', eventId: null },
      { question: 'Is prior experience needed for Kalsubai?', answer: 'No prior trekking experience is required, but you should have reasonable physical fitness and be comfortable walking uphill for 3-4 hours.', eventId: kalsubaiUpcoming.id },
      { question: 'What food is provided on the Adrai trek?', answer: 'We provide a traditional Maharashtrian breakfast (Poha/Misal Pav) and a wholesome village-cooked lunch (both Vegetarian and Non-Vegetarian options are cooked separately).', eventId: adraiUpcoming.id },
      { question: 'What is your cancellation policy?', answer: 'Cancellations made 7 days prior to the event will receive a 100% refund. Cancellations made 3-6 days prior receive a 50% refund. No refunds are available for cancellations made within 48 hours.', eventId: null },
      { question: 'Are toilets available during the treks?', answer: 'Toilets are available at the base village homestay where we stop for breakfast and lunch. However, no toilet facilities are available on the actual trail/mountain peaks.', eventId: null }
    ]
  });

  // 5. Seed Sponsors & Partners
  await prisma.sponsor.createMany({
    data: [
      { name: 'Decathlon Nashik', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Decathlon_Logo.svg', website: 'https://decathlon.in' },
      { name: 'Giri Outdoor Gear', logoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256', website: 'https://giri.in' }
    ]
  });

  await prisma.partner.createMany({
    data: [
      { name: 'Maharashtra Tourism (MTDC)', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Seal_of_Maharashtra.svg', website: 'https://maharashtratourism.gov.in' }
    ]
  });

  // 6. Seed Merchandise Products
  await prisma.product.createMany({
    data: [
      { name: 'TreckWari Premium Forest T-Shirt', description: 'Quick-dry, lightweight micro-polyester trekking shirt in deep forest green.', price: 499, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=512&auto=format&fit=crop', category: 'T-Shirts', stock: 100 },
      { name: 'TreckWari Explorer Peak Cap', description: 'Breathable mountain hiking cap with mesh side panels and quick-adjust buckle.', price: 299, image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=512&auto=format&fit=crop', category: 'Caps', stock: 50 },
      { name: 'TreckWari Aluminum Water Bottle', description: 'Sleek, lightweight 1L leakproof bottle with karabiner hook attachment.', price: 349, image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=512&auto=format&fit=crop', category: 'Water Bottles', stock: 80 },
      { name: 'TreckWari Logo Waterproof Sticker Pack', description: 'Pack of 5 heavy-duty vinyl stickers for your laptops, helmets, and cars.', price: 99, image: 'https://images.unsplash.com/photo-1572375995501-4b0894dbe0d7?q=80&w=512&auto=format&fit=crop', category: 'Stickers', stock: 500 }
    ]
  });

  // 7. Seed Blogs
  await prisma.blog.createMany({
    data: [
      {
        title: 'Trekking for Beginners: Essential Tips for Your First Summit',
        slug: 'trekking-for-beginners-essential-tips',
        content: '<p>Trekking in the mountains is one of the most rewarding experiences. For your first trek (like our Adrai Jungle or Kalsubai Summit treks), it is essential to prepare correctly. Hydration, stamina building, and appropriate footwear make a major difference.</p><h2>1. Focus on Cardiovascular Endurance</h2><p>Start jogging or climbing stairs at least a week before the trek to prep your leg muscles and lung capacity.</p><h2>2. Choose Your Footwear Carefully</h2><p>Never hike in flat sneakers. Wear proper trekking shoes with deep treads to avoid slipping on mud and loose rock.</p>',
        bannerImage: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=512&auto=format&fit=crop',
        category: 'Mountain Tips',
        isPublished: true,
        authorId: atharva.id
      },
      {
        title: 'Monsoon Packing Guide: What to Carry in the Sahyadris',
        slug: 'monsoon-packing-guide-sahyadris',
        content: '<p>Trekking during mon Maharashtra monsoons is absolutely magical—green hills, misty peaks, and numerous streams. However, it also requires high preparedness.</p><h2>1. Double-Pack Electronics</h2><p>Always keep your phones, wallets, and chargers in ziploc bags before placing them in your backpack.</p><h2>2. Wear Synthetic Clothing</h2><p>Avoid jeans at all costs. Denim stays wet for hours, which causes rashes and makes you cold. Wear polyester trekking pants and dry-fit t-shirts.</p>',
        bannerImage: 'https://images.unsplash.com/photo-1551829142-d9b96a3ee215?q=80&w=512&auto=format&fit=crop',
        category: 'Packing Guide',
        isPublished: true,
        authorId: atharva.id
      }
    ]
  });

  // 8. Seed Gallery Images
  await prisma.galleryImage.createMany({
    data: [
      { url: '/images/kalsubai_2.jpg', category: 'KALSUBAI', caption: 'Sunrise above clouds at Kalsubai Peak' },
      { url: '/images/kalsubai_3.jpg', category: 'KALSUBAI', caption: 'Hikers navigating the final ladders' },
      { url: '/images/adrai_4.jpg', category: 'ADRAI', caption: 'Foggy meadows of Adrai forest' },
      { url: '/images/adrai_5.jpg', category: 'ADRAI', caption: 'The famous lone tree of Adrai' },
      { url: '/images/adrai_3.jpg', category: 'ADRAI', caption: 'Trekking during downpours in Malshej' },
      { url: '/images/adrai_6.jpg', category: 'ADRAI', caption: 'TreckWari family resting in the valley' }
    ]
  });

  // 9. Seed Coupon
  await prisma.coupon.create({
    data: {
      code: 'FIRSTTREK',
      discount: 100, // 100 Rs flat off
      isPercentage: false,
      expiry: new Date('2027-12-31T23:59:59Z'),
      usageLimit: 500,
      isActive: true
    }
  });

  // 10. Seed Sample Booking for completed history (Amit booked Kalsubai completed)
  const pastBooking = await prisma.booking.create({
    data: {
      bookingId: 'TW-20260615-9988',
      userId: normalUser.id,
      eventId: kalsubaiCompleted.id,
      totalAmount: 1399,
      seatCount: 1,
      paymentStatus: 'PAID',
      paymentId: 'pay_mocked12345',
      emergencyContact: '+91 9999988888',
      emergencyName: 'Sunita Shinde',
      emergencyRelationship: 'Mother',
      medicalDetails: 'None',
      waiverAccepted: true,
      waiverSignedAt: new Date('2026-06-12T10:00:00Z'),
      termsAccepted: true,
      termsAcceptedAt: new Date('2026-06-12T10:00:00Z'),
      fitnessDeclared: true,
      riskAcknowledged: true,
      instructionsAgreed: true,
      couponCode: 'FIRSTTREK',
      discountAmount: 100
    }
  });

  // Add booking member
  await prisma.bookingMember.create({
    data: {
      bookingId: pastBooking.id,
      name: 'Amit Shinde',
      age: 24,
      gender: 'Male',
      attendanceStatus: 'PRESENT'
    }
  });

  // Generate completed Certificate
  await prisma.certificate.create({
    data: {
      certificateId: 'TW-CERT-KALSB-001',
      bookingId: pastBooking.id,
      userId: normalUser.id,
      eventId: kalsubaiCompleted.id,
      pdfUrl: '/certificates/cert_amit_kalsubai.pdf'
    }
  });

  // 11. Seed Adventure Memories (Instagram post mockup)
  const memory = await prisma.memory.create({
    data: {
      userId: normalUser.id,
      eventId: kalsubaiCompleted.id,
      caption: 'Unforgettable sunrise at Kalsubai Peak! Visited with the incredible TreckWari team! 🏔️🌅 #TreckWari #Kalsubai #Sahyadris',
      mediaUrl: '/images/kalsubai_2.jpg',
      mediaType: 'IMAGE'
    }
  });

  // Add Like
  await prisma.memoryLike.create({
    data: {
      userId: atharva.id,
      memoryId: memory.id
    }
  });

  // 9. Seed Trek Policy templates
  const defaultPolicy = await prisma.trekPolicy.upsert({
    where: { title: 'Standard Sahyadri Monsoon Policy Template' },
    update: {},
    create: {
      title: 'Standard Sahyadri Monsoon Policy Template',
      isTemplate: true,
      letterTitle: 'Participant Responsibility & Liability Agreement',
      letterDescription: 'Please read the following guidelines thoroughly. By completing this booking, you declare yourself fit to climb steep ladder structures and forest trails in wet weather conditions.',
      letterTerms: '1. All participants must strictly adhere to the instructions of the Trek Leader. 2. Consumption of alcohol, smoking, or any illegal substances is strictly prohibited. 3. Littering is banned; we practice a strict leave-no-trace outdoor code.',
      letterWaiver: 'I hereby declare that I am voluntarily participating in this trek and assume all risks of injury, illness, or property loss. I release TreckWari and its volunteers from liability.',
      letterDeclaration: 'I declare that I do not suffer from severe asthma, epilepsy, heart conditions, or high blood pressure, and I am physically fit to trek 10-15 kilometers.',
      letterCheckboxText: 'I agree to the terms, waiver, and declare myself medically fit.',
      termsAndConditions: '1. Registration: Hiker registration details must be accurate. 2. Safety Guidelines: Participants must strictly follow the trek leader directions. 3. Zero Tolerance Policy: Alcohol consumption, smoking, and littering are strictly prohibited during the trek. 4. Medical Liability: Participants assume full responsibility for their health and physical readiness.',
      privacyPolicy: '1. Information Collected: We collect your name, email, contact details, emergency contacts, and medical warnings. 2. Data Use: Data is used exclusively to verify bookings, coordinate logistics, and respond in medical emergencies. 3. Security: We protect your data and never sell it to third parties.',
      thingsToCarry: JSON.stringify([
        { name: 'Rainwear or Poncho', isRequired: true, icon: 'umbrella', order: 1 },
        { name: 'Trekking shoes with solid grip', isRequired: true, icon: 'footprints', order: 2 },
        { name: '2 liters of drinking water', isRequired: true, icon: 'droplet', order: 3 },
        { name: 'Personal medication kit', isRequired: false, icon: 'pill', order: 4 },
        { name: 'Warm apparel (fleece/hoodie)', isRequired: false, icon: 'shirt', order: 5 }
      ]),
      thingsNotAllowed: JSON.stringify(['Alcohol & drug substances', 'Plastic single-use bottles', 'Speakers & loud music playing devices', 'Valuables & expensive jewelry']),
      medicalMandatoryFields: JSON.stringify(['bloodGroup', 'allergies', 'medicalNotes', 'emergencyContact']),
      safetyGuidelines: JSON.stringify([
        { instruction: 'Always stay behind the Trek Leader and ahead of the Sweep Volunteer.', category: 'Navigation' },
        { instruction: 'Keep three points of contact when climbing steel ladders.', category: 'Climbing' },
        { instruction: 'Inform the leader immediately if you feel dizzy or sprain a joint.', category: 'Medical' }
      ]),
      cancellationRules: JSON.stringify([
        '100% refund if cancelled 7+ days before departure.',
        '50% refund if cancelled 3-6 days before departure.',
        'No refund if cancelled within 48 hours of departure.'
      ]),
      refundPercentages: JSON.stringify([
        { timeframeDays: 7, percent: 100 },
        { timeframeDays: 3, percent: 50 },
        { timeframeDays: 0, percent: 0 }
      ]),
      weatherPolicy: 'In case of severe rain alerts (Red Alert) issued by the weather bureau, the trek will be cancelled. Participants will receive a full transfer credit voucher or refund.',
      organizerCancellationPolicy: 'If the event is cancelled by TreckWari due to low attendance or safety hazards, a 100% refund will be processed.',
      noShowPolicy: 'No refunds or credits will be provided in case of participant no-shows on the morning of departure.',
      faqs: JSON.stringify([
        { question: 'Is transport included in the price?', answer: 'Yes, round-trip transport from Kopargaon/Shirdi is included.' },
        { question: 'Are washrooms available on the trek?', answer: 'Only local eco-toilets are available at the base village. No restrooms on the trail.' }
      ]),
      prepTips: JSON.stringify(['Start walking 4-5 kilometers daily one week prior.', 'Avoid heavy leg training workouts 3 days before departure.']),
      fitnessRecommendations: JSON.stringify(['Cardio jogging 20 mins', 'Stretches for knee joints and calf muscles']),
      clothingSuggestions: JSON.stringify(['Synthetic polyester t-shirts (dries fast)', 'Full trekking track pants (protects from leeches and thorns)']),
      foodRecommendations: JSON.stringify(['Eat a carb-rich meal the night before.', 'Carry glucose, energy bars, or electrolytes.']),
      weatherAdvice: 'Heavy monsoon showers are expected. Put all clothes inside polythene bags inside your backpack.',
      equipmentRecommendations: 'Trekking poles are highly recommended to balance on muddy descents.'
    }
  });

  // Link this template to upcoming events
  await prisma.event.updateMany({
    where: { slug: { in: ['kalsubai-summit-trek', 'kalsubai-completed-2026', 'adari-jungle-completed-2026'] } },
    data: { policyId: defaultPolicy.id }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
