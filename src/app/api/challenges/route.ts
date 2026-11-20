import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const duration = searchParams.get('duration');
    const search = searchParams.get('search');

    const where: any = {};
    if (category && category !== 'All') {
      where.categoryName = { contains: category, mode: 'insensitive' };
    }
    if (status && status !== 'All') {
      where.status = status.toUpperCase().replace(/\s+/g, '_');
    }
    if (duration && duration !== 'All' && duration !== 'Any duration') {
      where.durationType = duration.toUpperCase();
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const challenges = await prisma.challenge.findMany({
      where,
      include: {
        rubric: {
          include: { criteria: true },
        },
        registrations: true,
        submissions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ challenges });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'CHALLENGE_MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized. Admin permission required.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, categoryName, description, durationType, registrationFee, prizePool, participationType, minTeamSize, maxTeamSize, status } = body;

    const count = await prisma.challenge.count();
    const code = `CH-${100 + count + 1}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const challenge = await prisma.challenge.create({
      data: {
        code,
        title,
        slug: `${slug}-${count + 1}`,
        categoryName: categoryName || 'Design',
        description,
        durationType: durationType || 'DAILY',
        durationDisplay: `${durationType || 'Daily'} challenge`,
        registrationFee: Number(registrationFee) || 149,
        prizePool: prizePool || '₹50,000',
        participationType: participationType || 'Individual or team',
        minTeamSize: Number(minTeamSize) || 1,
        maxTeamSize: Number(maxTeamSize) || 4,
        status: status || 'REGISTRATION_OPEN',
        isPublished: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        adminName: user.name,
        action: 'Created challenge',
        module: 'Challenge',
        record: `${challenge.code} ${challenge.title}`,
        reason: 'New challenge published by administrator.',
      },
    });

    return NextResponse.json({ success: true, challenge });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
