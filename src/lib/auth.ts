import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './db';

const SESSION_COOKIE_NAME = 'pb_session_token';
const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'challenge-secret-key-34f5c5-portfolio-builders';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  location?: string | null;
  qualification?: string | null;
  profilePicture?: string | null;
  bio?: string | null;
  role: string;
  accountStatus: string;
  avatarInitials: string;
}

// Generate signed token: base64(payload).signature
export function createSessionToken(userId: string, role: string): string {
  const timestamp = Date.now();
  const payload = Buffer.from(`${userId}:${role}:${timestamp}`).toString('base64');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

// Verify token signature and decode payload
export function decodeAndVerifyToken(token: string): { userId: string; role: string; timestamp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
    if (signature !== expectedSignature) return null;

    const raw = Buffer.from(payload, 'base64').toString('utf-8');
    const [userId, role, timestampStr] = raw.split(':');
    if (!userId || !role) return null;

    return {
      userId,
      role,
      timestamp: Number(timestampStr) || 0,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const tokenData = decodeAndVerifyToken(token);
    if (!tokenData) return null;

    // Fetch user directly from PostgreSQL to ensure up-to-date role and status
    const user = await prisma.user.findUnique({
      where: { id: tokenData.userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        qualification: true,
        profilePicture: true,
        bio: true,
        role: true,
        accountStatus: true,
        avatarInitials: true,
      },
    });

    if (!user || user.accountStatus === 'SUSPENDED') return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      location: user.location,
      qualification: user.qualification,
      profilePicture: user.profilePicture,
      bio: user.bio,
      role: user.role,
      accountStatus: user.accountStatus,
      avatarInitials: user.avatarInitials || (user.name ? `${user.name.split(' ')[0]?.[0] || 'U'}${user.name.split(' ')[1]?.[0] || ''}`.toUpperCase() : 'U'),
    };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
