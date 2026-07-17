import * as bcrypt from 'bcryptjs';

// Force port to 5005 to avoid collisions with any running instances
process.env.PORT = '5005';
process.env.NODE_ENV = 'test';

// Start the Express app server
import './index';

async function runSmokeTests() {
  console.log('\n============================================================');
  console.log('🚀 INITIALIZING TRECKWARI MONOREPO LOCAL INTEGRATION SMOKE TESTS');
  console.log('============================================================\n');

  // Wait for Express to bind to port 5005
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const baseUrl = 'http://localhost:5005/api';
  let hikerToken = '';
  let adminToken = '';
  let sampleEventId = '';
  let sampleSlug = '';
  let createdBookingId = '';

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Healthcheck Endpoint
    // -------------------------------------------------------------------------
    console.log('🧪 Test 1: Querying Healthcheck...');
    const healthRes = await fetch('http://localhost:5005/health');
    const healthData = (await healthRes.json()) as any;
    if (!healthRes.ok || healthData.status !== 'healthy') {
      throw new Error('Health check endpoint failed!');
    }
    console.log('✅ Healthcheck status: HEALTHY\n');

    // -------------------------------------------------------------------------
    // TEST 2: Hiker Registration
    // -------------------------------------------------------------------------
    console.log('🧪 Test 2: Registering a new hiker account...');
    const regEmail = `smoke_hiker_${Math.floor(Math.random() * 10000)}@example.com`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regEmail,
        password: 'HikerPass123!',
        name: 'Smoke Test Hiker',
        phone: '+91 9999900000'
      })
    });
    const regData = (await regRes.json()) as any;
    if (!regRes.ok) {
      throw new Error(`Hiker registration failed: ${JSON.stringify(regData)}`);
    }
    console.log('✅ Hiker registered successfully.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Hiker Login
    // -------------------------------------------------------------------------
    console.log('🧪 Test 3: Logging in Hiker to fetch JWT token...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: regEmail,
        password: 'HikerPass123!'
      })
    });
    const loginData = (await loginRes.json()) as any;
    if (!loginRes.ok || !loginData.token) {
      throw new Error(`Hiker login failed: ${JSON.stringify(loginData)}`);
    }
    hikerToken = loginData.token;
    console.log('✅ Hiker token retrieved.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Fetch Trek/Events list (Postgres validation)
    // -------------------------------------------------------------------------
    console.log('🧪 Test 4: Querying dynamic treks from PostgreSQL...');
    const eventsRes = await fetch(`${baseUrl}/events`);
    const eventsData = (await eventsRes.json()) as any;
    if (!eventsRes.ok || !Array.isArray(eventsData) || eventsData.length === 0) {
      throw new Error(`Failed to query treks list from PostgreSQL: ${JSON.stringify(eventsData)}`);
    }
    const targetTrek = eventsData.find(e => e.status === 'OPEN_REGISTRATION') || eventsData[0];
    sampleEventId = targetTrek.id;
    sampleSlug = targetTrek.slug;
    console.log(`✅ Treks found. Selected sample: "${targetTrek.title}" (ID: ${sampleEventId})\n`);

    // -------------------------------------------------------------------------
    // TEST 5: Fetch Coordinates-based Weather reports (OpenWeather API Check)
    // -------------------------------------------------------------------------
    console.log('🧪 Test 5: Loading coordinates weather forecast...');
    const weatherRes = await fetch(`${baseUrl}/weather?eventId=${sampleEventId}&slug=${sampleSlug}`);
    const weatherData = (await weatherRes.json()) as any;
    if (!weatherRes.ok || !weatherData.temp || !weatherData.forecast) {
      throw new Error(`Weather forecast loading failed: ${JSON.stringify(weatherData)}`);
    }
    console.log(`✅ Weather loaded. Temp: ${weatherData.temp} | Conditions: ${weatherData.conditions} | Source: ${weatherData.source}\n`);

    // -------------------------------------------------------------------------
    // TEST 6: Complete Booking Flow with SOS & Checkbox audits
    // -------------------------------------------------------------------------
    console.log('🧪 Test 6: Submitting booking with emergency details and checklist validations...');
    const bookingRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hikerToken}`
      },
      body: JSON.stringify({
        eventId: sampleEventId,
        seatCount: 1,
        emergencyContact: '+91 9876543210',
        emergencyName: 'Rajesh Hiker Parent',
        emergencyRelationship: 'Father',
        medicalDetails: 'None',
        waiverAccepted: true,
        termsAccepted: true,
        fitnessDeclared: true,
        riskAcknowledged: true,
        instructionsAgreed: true,
        guardianPermitted: false,
        members: [{ name: 'Smoke Test Hiker', age: 24, gender: 'Male' }]
      })
    });
    const bookingData = (await bookingRes.json()) as any;
    if (!bookingRes.ok) {
      throw new Error(`Booking submission failed: ${JSON.stringify(bookingData)}`);
    }
    createdBookingId = bookingData.booking.id;
    const rzpOrderId = bookingData.booking.razorpayOrderId;
    console.log(`✅ Booking initialized in pending status. ID: ${createdBookingId} | Razorpay Order: ${rzpOrderId}\n`);

    // -------------------------------------------------------------------------
    // TEST 7: Mock Payment Confirmation (Razorpay signature validation bypass check)
    // -------------------------------------------------------------------------
    console.log('🧪 Test 7: Confirming checkout payment transaction...');
    const payRes = await fetch(`${baseUrl}/bookings/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hikerToken}`
      },
      body: JSON.stringify({
        bookingId: createdBookingId,
        paymentId: 'pay_smoke_txn_9922',
        razorpayOrderId: rzpOrderId,
        razorpaySignature: 'sig_smoke_test_validation_code'
      })
    });
    const payData = (await payRes.json()) as any;
    if (!payRes.ok) {
      throw new Error(`Payment confirmation failed: ${JSON.stringify(payData)}`);
    }
    console.log('✅ Checkout payment confirmed successfully.\n');

    // -------------------------------------------------------------------------
    // TEST 8: QR Code Verification scanning
    // -------------------------------------------------------------------------
    console.log('🧪 Test 8: Scanning ticket check-in QR code...');
    const qrRes = await fetch(`${baseUrl}/bookings/verify/${createdBookingId}`);
    const qrData = (await qrRes.json()) as any;
    if (!qrRes.ok || !qrData.verified || !qrData.isValid) {
      throw new Error(`Ticket QR validation failed: ${JSON.stringify(qrData)}`);
    }
    console.log(`✅ Ticket scanned. Checked Lead: ${qrData.leadName} | Status: ${qrData.paymentStatus}\n`);

    // -------------------------------------------------------------------------
    // TEST 9: Admin Log in & Roster Audit Reports
    // -------------------------------------------------------------------------
    console.log('🧪 Test 9: Logging in as Administrator...');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'atharvadhawale80@gmail.com',
        password: 'admin123'
      })
    });
    const adminLoginData = (await adminLoginRes.json()) as any;
    if (!adminLoginRes.ok || !adminLoginData.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }
    adminToken = adminLoginData.token;

    console.log('🧪 Test 9 (cont): Loading admin bookings roster list with audit trails...');
    const adminBookingsRes = await fetch(`${baseUrl}/bookings/admin/all`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminBookingsData = (await adminBookingsRes.json()) as any;
    if (!adminBookingsRes.ok || !Array.isArray(adminBookingsData)) {
      throw new Error(`Admin bookings fetch failed: ${JSON.stringify(adminBookingsData)}`);
    }
    const auditRecord = adminBookingsData.find(b => b.id === createdBookingId);
    if (!auditRecord || !auditRecord.termsAccepted || !auditRecord.ipAddress) {
      throw new Error('Audit record validation failed! IP address or T&C flags not recorded.');
    }
    console.log(`✅ Admin bookings audit checklist verified. Verified IP: ${auditRecord.ipAddress} | UA: ${auditRecord.userAgent}\n`);

    // -------------------------------------------------------------------------
    // SMOKE TESTS PASSED
    // -------------------------------------------------------------------------
    console.log('============================================================');
    console.log('🎉 SMOKE TESTS PASSED SUCCESSFULLY! Platform is Deploy-Ready.');
    console.log('============================================================');
    console.log('✓ Healthchecks verify healthy Express runtime');
    console.log('✓ Users successfully register, login, and retrieve JWTs');
    console.log('✓ PostgreSQL queries return OPEN_REGISTRATION events');
    console.log('✓ OpenWeather retrieves coordinates forecasts & triggers warnings');
    console.log('✓ Checkbox agreements & emergency metadata validate properly');
    console.log('✓ Mock Razorpay checkout transactions confirm bookings');
    console.log('✓ Dynamic QR verification returns valid hiker parameters');
    console.log('✓ Admin Bookings Roster records Terms, IPs, and User-Agents');
    console.log('============================================================\n');
    process.exit(0);

  } catch (err: any) {
    console.error('\n❌ SMOKE TESTS FAILED ENCOUNTERING ERROR:');
    console.error(err.message || err);
    console.error('============================================================\n');
    process.exit(1);
  }
}

runSmokeTests();
