import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'treckwari-jwt-super-secret-key-9322340365';

/**
 * Handles user registration.
 */
export async function register(req: AuthRequest, res: Response) {
  const { email, name, password, referredBy } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Please provide email, name, and password.' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email address already registered.' });
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
        // Credit the referrer with 50 points
        await prisma.user.update({
          where: { id: referrer.id },
          data: { rewardPoints: { increment: 50 } }
        });
      }
    }

    // Create User
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        referralCode,
        referredBy: validReferrer,
        rewardPoints: validReferrer ? 25 : 0 // Get 25 signup points if referred
      }
    });

    // Sign JWT
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        referralCode: newUser.referralCode,
        rewardPoints: newUser.rewardPoints,
        badgeLevel: newUser.badgeLevel
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

/**
 * Handles user login.
 */
export async function login(req: AuthRequest, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter your email and password.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify Password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        referralCode: user.referralCode,
        rewardPoints: user.rewardPoints,
        badgeLevel: user.badgeLevel,
        bloodGroup: user.bloodGroup,
        allergies: user.allergies,
        medicalNotes: user.medicalNotes
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

/**
 * Gets the currently authenticated user profile.
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
      role: user.role,
      avatarUrl: user.avatarUrl,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      rewardPoints: user.rewardPoints,
      badgeLevel: user.badgeLevel,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      medicalNotes: user.medicalNotes,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Updates the user's profile settings.
 */
export async function updateProfile(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { name, avatarUrl, bloodGroup, allergies, medicalNotes } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name,
        avatarUrl,
        bloodGroup,
        allergies,
        medicalNotes
      }
    });

    return res.json({
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        referralCode: updatedUser.referralCode,
        rewardPoints: updatedUser.rewardPoints,
        badgeLevel: updatedUser.badgeLevel,
        bloodGroup: updatedUser.bloodGroup,
        allergies: updatedUser.allergies,
        medicalNotes: updatedUser.medicalNotes
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

/**
 * Mock password reset request.
 */
export async function forgotPassword(req: AuthRequest, res: Response) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please enter your email.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't leak registered emails, return success anyway
      return res.json({ message: 'If that email exists in our records, a reset link was sent.' });
    }

    console.log(`[Password Reset Mock] Generating recovery token for ${email}...`);
    // Send email using outbox
    return res.json({ message: 'If that email exists in our records, a reset link was sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to process forgot password request.' });
  }
}
