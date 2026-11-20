import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const hackathons = await prisma.hackathon.findMany({
      include: {
        sessions: { orderBy: { order: 'asc' } },
        registrations: true,
        submissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ hackathons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { title, format, venue, description, prizePool, registrationFee, minTeamSize, maxTeamSize } = body;

    const count = await prisma.hackathon.count();
    const code = `HK-${20 + count + 1}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const hackathon = await prisma.hackathon.create({
      data: {
        code,
        title,
        slug: `${slug}-${count + 1}`,
        description,
        format: format || 'ONLINE',
        venue: venue || null,
        prizePool: prizePool || 'Up to ₹10 lakh',
        registrationFee: Number(registrationFee) || 199,
        minTeamSize: Number(minTeamSize) || 2,
        maxTeamSize: Number(maxTeamSize) || 4,
        status: 'REGISTRATION_OPEN',
        isPublished: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        adminName: user.name,
        action: 'Created hackathon',
        module: 'Hackathon',
        record: `${hackathon.code} ${hackathon.title}`,
        reason: 'New hackathon created by administrator.',
      },
    });

    return NextResponse.json({ success: true, hackathon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
