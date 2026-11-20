import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId');

    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'RESULTS_MANAGER';
    const isJudge = user.role === 'JUDGE';

    let where: any = {};
    if (challengeId) where.challengeId = challengeId;

    if (!isAdmin) {
      if (isJudge) {
        // Judge sees assigned submissions only!
        const assignments = await prisma.judgeAssignment.findMany({
          where: { judgeId: user.id },
          select: { submissionId: true },
        });
        const assignedSubIds = assignments.map(a => a.submissionId).filter(Boolean) as string[];
        where.id = { in: assignedSubIds };
      } else {
        // Participant sees their own or team's submissions
        where.userId = user.id;
      }
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        challenge: true,
        hackathon: true,
        user: { select: { id: true, name: true, email: true, avatarInitials: true } },
        team: true,
        files: true,
        evaluations: isJudge
          ? { where: { judgeId: user.id }, include: { scores: true } }
          : isAdmin
          ? { include: { scores: true, judge: { select: { id: true, name: true } } } }
          : false,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ submissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { submissionId, challengeId, hackathonId, title, shortDescription, detailedWriteup, demoUrl, githubUrl, videoUrl, isDraft } = body;

    if (submissionId) {
      // Update existing submission
      const existing = await prisma.submission.findUnique({ where: { id: submissionId } });
      if (!existing) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      if (existing.userId !== user.id && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const nextVersion = existing.version === 'v1' ? 'v2' : existing.version === 'v2' ? 'v3' : 'v4';

      const updated = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          title: title || existing.title,
          shortDescription: shortDescription ?? existing.shortDescription,
          detailedWriteup: detailedWriteup ?? existing.detailedWriteup,
          demoUrl: demoUrl ?? existing.demoUrl,
          githubUrl: githubUrl ?? existing.githubUrl,
          videoUrl: videoUrl ?? existing.videoUrl,
          version: nextVersion,
          status: isDraft ? 'DRAFT' : 'SUBMITTED',
        },
      });

      return NextResponse.json({ success: true, submission: updated });
    }

    // Create new submission
    const count = await prisma.submission.count();
    const code = `SUB-${5400 + count + 1}`;

    const newSub = await prisma.submission.create({
      data: {
        code,
        challengeId: challengeId || null,
        hackathonId: hackathonId || null,
        userId: user.id,
        title: title || 'Untitled Project',
        shortDescription: shortDescription || '',
        detailedWriteup: detailedWriteup || '',
        demoUrl: demoUrl || '',
        githubUrl: githubUrl || '',
        videoUrl: videoUrl || '',
        version: 'v1',
        status: isDraft ? 'DRAFT' : 'SUBMITTED',
      },
    });

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: isDraft ? 'Draft saved' : 'Submission received',
        message: `${newSub.title} (${newSub.code})`,
        link: '#submissions',
      },
    });

    return NextResponse.json({ success: true, submission: newSub });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
