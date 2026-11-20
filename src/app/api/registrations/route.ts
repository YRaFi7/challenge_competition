import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admins see all registrations, participants see their own
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PARTICIPANT_MANAGER';
    const where = isAdmin ? {} : { userId: user.id };

    const challengeRegistrations = await prisma.challengeRegistration.findMany({
      where,
      include: {
        challenge: true,
        user: { select: { id: true, name: true, email: true } },
        team: true,
      },
      orderBy: { registeredAt: 'desc' },
    });

    const hackathonRegistrations = await prisma.hackathonRegistration.findMany({
      where,
      include: {
        hackathon: true,
        user: { select: { id: true, name: true, email: true } },
        team: true,
      },
      orderBy: { registeredAt: 'desc' },
    });

    return NextResponse.json({ challengeRegistrations, hackathonRegistrations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to register.' }, { status: 401 });
    }

    const body = await req.json();
    const { challengeId, hackathonId, teamId, paymentMethod, paymentDetails } = body;

    if (challengeId) {
      const challenge = await prisma.challenge.findFirst({
        where: {
          OR: [
            { id: challengeId },
            { code: challengeId },
          ],
        },
      });

      if (!challenge) {
        return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
      }

      // Check existing registration
      const existing = await prisma.challengeRegistration.findFirst({
        where: { challengeId: challenge.id, userId: user.id },
      });
      if (existing) {
        return NextResponse.json({ error: 'Already registered for this challenge' }, { status: 400 });
      }

      const count = await prisma.challengeRegistration.count();
      const code = `REG-${24100 + count + 1}`;

      const reg = await prisma.challengeRegistration.create({
        data: {
          code,
          challengeId: challenge.id,
          userId: user.id,
          teamId: teamId || null,
          status: 'APPROVED',
        },
      });

      // Send notification to participant
      const methodLabel = paymentMethod ? ` (Payment via ${paymentMethod})` : '';
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Registration & Payment Confirmed',
          message: `${challenge.title} · ${reg.code}${methodLabel}`,
          type: 'Challenges',
          link: '#registrations',
        },
      });

      return NextResponse.json({ success: true, registration: reg, message: `Registration confirmed for ${challenge.title}` });
    }

    if (hackathonId) {
      const hackathon = await prisma.hackathon.findFirst({
        where: {
          OR: [
            { id: hackathonId },
            { code: hackathonId },
          ],
        },
      });

      if (!hackathon) {
        return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
      }

      const count = await prisma.hackathonRegistration.count();
      const code = `REG-${24100 + count + 1}`;

      const reg = await prisma.hackathonRegistration.create({
        data: {
          code,
          hackathonId: hackathon.id,
          userId: user.id,
          teamId: teamId || null,
          status: 'PENDING',
        },
      });

      const methodLabel = paymentMethod ? ` (Payment via ${paymentMethod})` : '';
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Hackathon Registration Received',
          message: `${hackathon.title} · ${reg.code}${methodLabel}. Under review.`,
          type: 'Challenges',
          link: '#registrations',
        },
      });

      return NextResponse.json({ success: true, registration: reg });
    }

    return NextResponse.json({ error: 'Missing challengeId or hackathonId' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
