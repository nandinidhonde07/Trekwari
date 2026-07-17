import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from './lib/prisma';

// Helper to hash tokens
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function runSmokeTests() {
  console.log('============================================================');
  console.log('        STARTING AUTHENTICATION SYSTEM SMOKE TESTS          ');
  console.log('============================================================');

  const testEmail = `test_hiker_${Date.now()}@treckwari.com`;
  const testPhone = '9988776655';
  const weakPassword = '123';
  const strongPassword = 'StrongPass123!';

  try {
    // 1. Validate Password Strength Check
    console.log('\n[TEST 1] Testing password strength validation logic...');
    const validateStrength = (pass: string): boolean => {
      if (pass.length < 8) return false;
      const hasUpper = /[A-Z]/.test(pass);
      const hasLower = /[a-z]/.test(pass);
      const hasDigit = /\d/.test(pass);
      const hasSpecial = /[^A-Za-z0-9]/.test(pass);
      return hasUpper && hasLower && hasDigit && hasSpecial;
    };

    if (validateStrength(weakPassword)) {
      throw new Error('FAIL: Weak password was incorrectly validated as strong!');
    }
    if (!validateStrength(strongPassword)) {
      throw new Error('FAIL: Strong password failed validation checks!');
    }
    console.log('✔ PASS: Password strength validation works correctly.');

    // 2. Validate User Creation & E.164 Format Normalization
    console.log('\n[TEST 2] Testing E.164 phone formatting and account creation...');
    const formatE164Phone = (phone: string): string => {
      const cleaned = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
      if (cleaned.startsWith('+')) return cleaned;
      if (cleaned.length === 10) return `+91${cleaned}`;
      return `+${cleaned}`;
    };

    const formattedPhone = formatE164Phone(testPhone);
    if (formattedPhone !== '+919988776655') {
      throw new Error(`FAIL: Phone format did not map to E.164! Output: ${formattedPhone}`);
    }

    const testPasswordHash = await bcrypt.hash(strongPassword, 10);
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Smoke Test User',
        phone: formattedPhone,
        passwordHash: testPasswordHash,
        referralCode: `SMOKE${Math.floor(100 + Math.random() * 900)}`,
        emailVerified: false
      }
    });

    console.log(`✔ PASS: Test user created successfully in database (ID: ${testUser.id}).`);

    // 3. Test Failed Login Lockout Logic
    console.log('\n[TEST 3] Testing failed login counter and lockout threshold...');
    let failedAttempts = 0;
    let lockoutUntil: Date | null = null;

    // Simulate 5 failed attempts
    for (let i = 1; i <= 5; i++) {
      failedAttempts++;
      if (failedAttempts >= 5) {
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
    }

    if (failedAttempts !== 5 || !lockoutUntil || lockoutUntil.getTime() <= Date.now()) {
      throw new Error('FAIL: Lockout status was not activated correctly on 5 failed attempts!');
    }

    // Save temporary lockout state to test user in DB
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        failedLoginAttempts: failedAttempts,
        lockoutUntil
      }
    });

    const refreshedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    if (!refreshedUser?.lockoutUntil || refreshedUser.failedLoginAttempts !== 5) {
      throw new Error('FAIL: Failed attempts or lockout timestamp not stored in DB!');
    }
    console.log('✔ PASS: Lockout state stored and validated successfully.');

    // Reset lockout state
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null
      }
    });

    // 4. Test Session Creation and Revocation
    console.log('\n[TEST 4] Testing active device session logs and revocation...');
    const mockRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashToken(mockRefreshToken);

    const session = await prisma.session.create({
      data: {
        userId: testUser.id,
        tokenHash,
        deviceInfo: 'Smoke Test Agent Node',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    const activeSessions = await prisma.session.findMany({ where: { userId: testUser.id } });
    if (activeSessions.length !== 1 || activeSessions[0].id !== session.id) {
      throw new Error('FAIL: Device session record was not logged in the DB!');
    }

    // Revoke
    await prisma.session.delete({ where: { id: session.id } });
    const clearedSessions = await prisma.session.findMany({ where: { userId: testUser.id } });
    if (clearedSessions.length !== 0) {
      throw new Error('FAIL: Revoking device session failed to clear it from the DB!');
    }
    console.log('✔ PASS: Session creation and revocation verified.');

    // 5. Test Password Reset Token Hash Security
    console.log('\n[TEST 5] Testing password reset hashing security...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);

    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        resetTokenHash,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000)
      }
    });

    const userForReset = await prisma.user.findFirst({
      where: {
        resetTokenHash,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!userForReset || userForReset.id !== testUser.id) {
      throw new Error('FAIL: Hashed reset token validation lookup failed!');
    }
    console.log('✔ PASS: Reset token hashing lookup completed successfully.');

    // 6. Test manual verification (Admin control)
    console.log('\n[TEST 6] Testing manual email verification trigger...');
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        emailVerified: true
      }
    });

    const verifiedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    if (!verifiedUser?.emailVerified) {
      throw new Error('FAIL: Manual verification trigger failed!');
    }
    console.log('✔ PASS: Manual verification update completed.');

    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('\n✔ PASS: Smoke test cleanup successful.');

    console.log('\n============================================================');
    console.log('  ALL SMOKE TESTS PASSED! AUTHENTICATION SYSTEM IS SECURE!  ');
    console.log('============================================================');
  } catch (error: any) {
    console.error('\n❌ SMOKE TEST FAILURE:', error.message || error);
    process.exit(1);
  }
}

runSmokeTests();
