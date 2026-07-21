import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendEmail, getPasswordResetTemplate, getEmailVerificationTemplate } from '../utils/email';

const JWT_SECRET = process.env.JWT_SECRET || 'treckwari-jwt-super-secret-key-9322340365';

// Helper to hash tokens
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper to validate password strength
function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasDigit && hasSpecial;
}

// Helper to normalize phone numbers to E.164 format
function formatE164Phone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // Default to +91 (India) for 10-digit local numbers
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
}

// Helper to log authentication events in AuditLog
async function logAuditEvent(
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

// Set refresh token in secure HTTP-only cookie
function setRefreshCookie(res: Response, refreshToken: string, rememberMe: boolean) {
  const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  res.cookie('tw_refresh', refreshToken, {
    httpOnly: true,
    secure: true, // Secure flag required for sameSite none
    sameSite: 'none',
    maxAge: duration,
    path: '/'
  });
}

/**
 * Handles user registration.
 */
export async function register(req: Request, res: Response) {
  const { email, name, phone, password, referredBy } = req.body;

  if (!email || !name || !phone || !password) {
    return res.status(400).json({ error: 'Please provide email, name, phone number, and password.' });
  }

  // Validate password strength
  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.'
    });
  }

  // Normalize phone number
  const e164Phone = formatE164Phone(phone);
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(e164Phone)) {
    return res.status(400).json({ error: 'Invalid phone number format. Please provide a valid mobile number.' });
  }

  try {
    // Check if email already registered
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email address already registered.' });
    }

    // Check if phone already registered
    const existingPhone = await prisma.user.findUnique({ where: { phone: e164Phone } });
    if (existingPhone) {
      return res.status(400).json({ error: 'Mobile number already registered.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate unique referral code
    const baseCode = name.replace(/\s+/g, '').substring(0, 5).toUpperCase();
    const randNum = Math.floor(100 + Math.random() * 900);
    const referralCode = `${baseCode}${randNum}`;

    // Verify referrer if supplied
    let validReferrer = null;
    if (referredBy) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: referredBy } });
      if (referrer) {
        validReferrer = referredBy;
        await prisma.user.update({
          where: { id: referrer.id },
          data: { rewardPoints: { increment: 50 } }
        });
      }
    }

    // Generate Email Verification Token (Expires in 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create User
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        phone: e164Phone,
        passwordHash,
        referralCode,
        referredBy: validReferrer,
        rewardPoints: validReferrer ? 25 : 0,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      }
    });

    // Send Verification Email
    const verifyLink = `${req.headers.origin || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const emailHtml = getEmailVerificationTemplate(newUser.name, verifyLink);
    await sendEmail({
      to: newUser.email,
      subject: 'Verify your TrekWari account',
      html: emailHtml
    });

    await logAuditEvent(newUser.id, 'REGISTRATION', 'User account registered. Verification email dispatched.', req);

    return res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account before making any bookings.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        emailVerified: newUser.emailVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

/**
 * Handles user login (Email or Phone + Password).
 */
export async function login(req: Request, res: Response) {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter your email/phone and password.' });
  }

  try {
    // Check email format to query correctly
    const isEmail = email.includes('@');
    const searchField = isEmail ? { email: email } : { phone: formatE164Phone(email) };

    const user = await prisma.user.findFirst({
      where: searchField
    });

    if (!user) {
      await logAuditEvent(null, 'FAILED_LOGIN', `Failed login attempt for identifier: ${email}. User not found.`, req);
      return res.status(401).json({ error: 'Invalid email/phone or password.' });
    }

    // Check account activation
    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact customer support.' });
    }

    // Check Lockout Status
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({ error: `Account is temporarily locked. Please try again in ${minutesLeft} minute(s).` });
    }

    // Verify Password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      const failedAttempts = user.failedLoginAttempts + 1;
      let lockoutUntil: Date | null = null;
      let errorResponse = 'Invalid email/phone or password.';

      if (failedAttempts >= 5) {
        lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lockout
        errorResponse = 'Too many failed login attempts. Your account is locked for 15 minutes.';
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockoutUntil
        }
      });

      await logAuditEvent(user.id, 'FAILED_LOGIN', `Failed password attempt (${failedAttempts}/5). Lockout: ${lockoutUntil ? 'Yes' : 'No'}`, req);
      return res.status(401).json({ error: errorResponse });
    }

    // Successful authentication - Reset lockout stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null
      }
    });

    // Create session & refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000);
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        deviceInfo: userAgent.substring(0, 200),
        ipAddress: ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '').split(',')[0].trim(),
        expiresAt
      }
    });

    // Set HTTP-only Cookie
    setRefreshCookie(res, refreshToken, !!rememberMe);

    // Sign Access Token (JWT)
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    await logAuditEvent(user.id, 'LOGIN', 'User successfully logged in via credentials.', req);

    return res.json({
      token, // Return access token to JS
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        referralCode: user.referralCode,
        rewardPoints: user.rewardPoints,
        badgeLevel: user.badgeLevel,
        emailVerified: user.emailVerified,
        bloodGroup: user.bloodGroup,
        allergies: user.allergies,
        medicalNotes: user.medicalNotes,
        emergencyContact: user.emergencyContact,
        emergencyPhone: user.emergencyPhone,
        emergencyRelationship: user.emergencyRelationship,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        trekExperience: user.trekExperience,
        fitnessLevel: user.fitnessLevel
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

/**
 * Handles Google Login (Verify Google ID Token popup).
 */
export async function googleLogin(req: Request, res: Response) {
  const { credential, rememberMe } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential token is required.' });
  }

  try {
    // Call Google TokenInfo endpoint to verify token signature and retrieve payload
    const tokenVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
    const verifyRes = await fetch(tokenVerifyUrl);
    
    if (!verifyRes.ok) {
      return res.status(400).json({ error: 'Invalid Google Identity token.' });
    }

    const payload = await verifyRes.json() as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
      aud: string;
    };

    // Verify audience matches configuration if present
    const envClientId = process.env.GOOGLE_CLIENT_ID;
    if (envClientId && payload.aud !== envClientId) {
      return res.status(400).json({ error: 'Google OAuth Client ID mismatch.' });
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: payload.sub },
          { email: payload.email }
        ]
      }
    });

    if (user) {
      // Link Google Account if logging in via matching email for the first time
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: payload.sub,
            emailVerified: true, // Google accounts are implicitly verified
            avatarUrl: user.avatarUrl || payload.picture
          }
        });
      }
    } else {
      // Auto-register User
      const randomPassword = crypto.randomBytes(24).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      
      const baseCode = payload.name.replace(/\s+/g, '').substring(0, 5).toUpperCase();
      const randNum = Math.floor(100 + Math.random() * 900);
      const referralCode = `${baseCode}${randNum}`;

      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          googleId: payload.sub,
          passwordHash,
          avatarUrl: payload.picture,
          referralCode,
          emailVerified: true,
          isActive: true
        }
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    // Create session
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        deviceInfo: (req.headers['user-agent'] || 'Google Sign-In').substring(0, 200),
        ipAddress: ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '').split(',')[0].trim(),
        expiresAt
      }
    });

    setRefreshCookie(res, refreshToken, !!rememberMe);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    await logAuditEvent(user.id, 'GOOGLE_SIGN_IN', 'User successfully authenticated via Google OAuth.', req);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
        referralCode: user.referralCode,
        rewardPoints: user.rewardPoints,
        badgeLevel: user.badgeLevel,
        emailVerified: user.emailVerified,
        bloodGroup: user.bloodGroup,
        allergies: user.allergies,
        medicalNotes: user.medicalNotes,
        emergencyContact: user.emergencyContact,
        emergencyPhone: user.emergencyPhone,
        emergencyRelationship: user.emergencyRelationship,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        trekExperience: user.trekExperience,
        fitnessLevel: user.fitnessLevel
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({ error: 'Failed to process Google sign-in request.' });
  }
}

/**
 * Handles Token Refresh (Rotation).
 */
export async function refreshSession(req: Request, res: Response) {
  // Read token from cookie, falling back to header body if cross-site block
  const oldRefreshToken = (req as any).cookies?.tw_refresh || req.body.refreshToken;

  if (!oldRefreshToken) {
    return res.status(401).json({ error: 'No refresh token provided.' });
  }

  const oldHash = hashToken(oldRefreshToken);

  try {
    const session = await prisma.session.findUnique({
      where: { tokenHash: oldHash },
      include: { user: true }
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    // Refresh Token Rotation: Delete old session, generate new token
    await prisma.session.delete({ where: { id: session.id } });

    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newHash = hashToken(newRefreshToken);
    
    // Maintain duration
    const remainingTime = session.expiresAt.getTime() - Date.now();
    const expiresAt = new Date(Date.now() + Math.max(remainingTime, 15 * 60 * 1000)); // Minimum 15m expiration safety

    await prisma.session.create({
      data: {
        userId: session.userId,
        tokenHash: newHash,
        deviceInfo: session.deviceInfo,
        ipAddress: ((req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '').split(',')[0].trim(),
        expiresAt
      }
    });

    // Send cookie
    setRefreshCookie(res, newRefreshToken, true);

    const token = jwt.sign(
      { id: session.user.id, email: session.user.email, role: session.user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({
      token,
      refreshToken: newRefreshToken // Also return in body for header fallback
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Failed to rotate session tokens.' });
  }
}

/**
 * Verifies email verification token.
 */
export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Verification token is required.' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: String(token),
        emailVerificationExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Verification token is invalid or has expired. Please request a new one.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
      }
    });

    await logAuditEvent(user.id, 'EMAIL_VERIFICATION', 'User successfully verified their email address.', req);

    return res.json({ message: 'Email verified successfully! You can now proceed to book treks.' });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Internal server error during email verification.' });
  }
}

/**
 * Resends email verification link.
 */
export async function resendVerification(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Please enter your email address.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Your email address is already verified.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires
      }
    });

    const verifyLink = `${req.headers.origin || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const emailHtml = getEmailVerificationTemplate(user.name, verifyLink);
    await sendEmail({
      to: user.email,
      subject: 'Verify your TrekWari account (Resend)',
      html: emailHtml
    });

    await logAuditEvent(user.id, 'EMAIL_VERIFICATION_RESEND', 'Verification link re-dispatched to email address.', req);

    return res.json({ message: 'Verification email sent successfully! Please check your inbox.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Failed to resend verification email.' });
  }
}

/**
 * Triggers Forgot Password recovery token generation.
 */
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Please enter your email address.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return obfuscated success response to prevent directory harvesting attacks
      return res.json({ message: 'If that email exists in our records, a reset link was sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash,
        resetTokenExpiry
      }
    });

    const resetLink = `${req.headers.origin || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const emailHtml = getPasswordResetTemplate(user.name, resetLink);
    await sendEmail({
      to: user.email,
      subject: 'Reset Your TrekWari Account Password',
      html: emailHtml
    });

    await logAuditEvent(user.id, 'PASSWORD_RESET_REQUEST', 'Hashed password reset token generated and sent.', req);

    return res.json({ message: 'If that email exists in our records, a reset link was sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request.' });
  }
}

/**
 * Resets password using valid token.
 */
export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Verification token and new password are required.' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.'
    });
  }

  const tokenHash = hashToken(token);

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiry: { gt: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Password reset link is invalid or has expired. Please request a new one.' });
    }

    const newPasswordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetTokenHash: null,
        resetTokenExpiry: null,
        failedLoginAttempts: 0, // Reset lockout state on manual password recovery
        lockoutUntil: null
      }
    });

    // Revoke all existing sessions for safety after password resets
    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    res.clearCookie('tw_refresh');

    await logAuditEvent(user.id, 'PASSWORD_RESET_COMPLETE', 'User password successfully reset. Revoked all active device sessions.', req);

    return res.json({ message: 'Password has been reset successfully! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
}

/**
 * Gets currently logged-in user profile.
 */
export async function getProfile(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      rewardPoints: user.rewardPoints,
      badgeLevel: user.badgeLevel,
      emailVerified: user.emailVerified,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      medicalNotes: user.medicalNotes,
      emergencyContact: user.emergencyContact,
      emergencyPhone: user.emergencyPhone,
      emergencyRelationship: user.emergencyRelationship,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      address: user.address,
      trekExperience: user.trekExperience,
      fitnessLevel: user.fitnessLevel,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Updates user profile details.
 */
export async function updateProfile(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const {
    name,
    avatarUrl,
    phone,
    bloodGroup,
    allergies,
    medicalNotes,
    emergencyContact,
    emergencyPhone,
    emergencyRelationship,
    dateOfBirth,
    gender,
    address,
    trekExperience,
    fitnessLevel
  } = req.body;

  try {
    let phoneUpdate = undefined;
    if (phone) {
      phoneUpdate = formatE164Phone(phone);
      // Validate E.164 pattern
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneUpdate)) {
        return res.status(400).json({ error: 'Invalid phone number format.' });
      }

      // Check duplicate phone
      const duplicatePhone = await prisma.user.findFirst({
        where: { phone: phoneUpdate, NOT: { id: req.user.id } }
      });
      if (duplicatePhone) {
        return res.status(400).json({ error: 'Phone number already in use by another account.' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        avatarUrl,
        phone: phoneUpdate,
        bloodGroup,
        allergies,
        medicalNotes,
        emergencyContact,
        emergencyPhone,
        emergencyRelationship,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        trekExperience,
        fitnessLevel
      }
    });

    await logAuditEvent(updatedUser.id, 'PROFILE_UPDATE', 'User updated profile details.', req);

    return res.json({
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        referralCode: updatedUser.referralCode,
        rewardPoints: updatedUser.rewardPoints,
        badgeLevel: updatedUser.badgeLevel,
        emailVerified: updatedUser.emailVerified,
        bloodGroup: updatedUser.bloodGroup,
        allergies: updatedUser.allergies,
        medicalNotes: updatedUser.medicalNotes,
        emergencyContact: updatedUser.emergencyContact,
        emergencyPhone: updatedUser.emergencyPhone,
        emergencyRelationship: updatedUser.emergencyRelationship,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        address: updatedUser.address,
        trekExperience: updatedUser.trekExperience,
        fitnessLevel: updatedUser.fitnessLevel
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

/**
 * Accept profile photo upload base64 string, upload to Cloudinary, and save to profile.
 */
export async function uploadAvatar(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { avatar } = req.body;

  if (!avatar || !avatar.startsWith('data:image')) {
    return res.status(400).json({ error: 'Please supply a valid base64 image data URI.' });
  }

  try {
    const { uploadToCloudinary } = require('../utils/cloudinary');
    const secureUrl = await uploadToCloudinary(avatar, 'avatars');

    await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: secureUrl }
    });

    await logAuditEvent(req.user.id, 'AVATAR_UPLOAD', 'User uploaded new custom profile photo.', req);

    return res.json({
      message: 'Profile photo uploaded successfully!',
      avatarUrl: secureUrl
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({ error: 'Failed to upload profile photo.' });
  }
}

/**
 * Removes profile photo (resets avatarUrl to null).
 */
export async function removeAvatar(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null }
    });

    await logAuditEvent(
      req.user.id,
      'AVATAR_REMOVE',
      'User removed custom profile photo.',
      req,
      user ? JSON.stringify({ avatarUrl: user.avatarUrl }) : null,
      JSON.stringify({ avatarUrl: null })
    );

    return res.json({
      message: 'Profile photo removed successfully.',
      avatarUrl: null
    });
  } catch (error) {
    console.error('Avatar remove error:', error);
    return res.status(500).json({ error: 'Failed to remove profile photo.' });
  }
}

/**
 * Returns all active sessions for the authenticated user.
 */
export async function getSessions(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    const activeCookieToken = (req as any).cookies?.tw_refresh;
    const currentHash = activeCookieToken ? hashToken(activeCookieToken) : null;

    const formatted = sessions.map(s => ({
      id: s.id,
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.tokenHash === currentHash
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Get sessions error:', error);
    return res.status(500).json({ error: 'Failed to retrieve active sessions.' });
  }
}

/**
 * Revokes a specific device session.
 */
export async function revokeSession(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { id } = req.params;

  try {
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session || session.userId !== req.user.id) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    await prisma.session.delete({ where: { id } });

    await logAuditEvent(req.user.id, 'SESSION_REVOKE', `Revoked device session: ${session.deviceInfo} (IP: ${session.ipAddress})`, req);

    // If revoking current session, clear cookie
    const activeCookieToken = (req as any).cookies?.tw_refresh;
    if (activeCookieToken && hashToken(activeCookieToken) === session.tokenHash) {
      res.clearCookie('tw_refresh');
    }

    return res.json({ message: 'Session revoked successfully.' });
  } catch (error) {
    console.error('Revoke session error:', error);
    return res.status(500).json({ error: 'Failed to revoke device session.' });
  }
}

/**
 * Logs out of the current device.
 */
export async function logout(req: Request, res: Response) {
  const refreshToken = (req as any).cookies?.tw_refresh || req.body.refreshToken;

  if (refreshToken) {
    try {
      const tokenHash = hashToken(refreshToken);
      const session = await prisma.session.findUnique({ where: { tokenHash } });
      
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
        await logAuditEvent(session.userId, 'LOGOUT', 'User logged out of current device.', req);
      }
    } catch (err) {
      console.error('Logout session cleanup failed:', err);
    }
  }

  res.clearCookie('tw_refresh');
  return res.json({ message: 'Logged out successfully.' });
}

/**
 * Logs out of all devices.
 */
export async function logoutAll(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    await prisma.session.deleteMany({
      where: { userId: req.user.id }
    });

    res.clearCookie('tw_refresh');
    await logAuditEvent(req.user.id, 'LOGOUT_ALL', 'Logged out of all active devices.', req);

    return res.json({ message: 'Successfully logged out of all active devices.' });
  } catch (error) {
    console.error('Logout all error:', error);
    return res.status(500).json({ error: 'Failed to clear all active sessions.' });
  }
}
