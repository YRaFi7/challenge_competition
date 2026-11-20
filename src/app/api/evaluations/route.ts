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
    const submissionId = searchParams.get('submissionId');

    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const isJudge = user.role === 'JUDGE';

    if (!isJudge && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const where: any = {};
    if (submissionId) where.submissionId = submissionId;
    if (isJudge && !isAdmin) where.judgeId = user.id;

    const evaluations = await prisma.evaluation.findMany({
      where,
      include: {
        scores: { include: { criterion: true } },
        submission: {
          include: {
            challenge: { include: { rubric: { include: { criteria: true } } } },
            files: true,
          },
        },
        revisions: true,
      },
    });

    return NextResponse.json({ evaluations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'JUDGE' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Only authorized judges can evaluate submissions.' }, { status: 403 });
    }

    const body = await req.json();
    const { submissionId, rubricId, scores, feedback, strengths, improvementAreas, isFinal, recommendAs, recommendNotes } = body;

    // Verify judge assignment
    const assignment = await prisma.judgeAssignment.findFirst({
      where: { judgeId: user.id, submissionId },
    });

    if (!assignment && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'You are not assigned to evaluate this submission.' }, { status: 403 });
    }

    // Check if evaluation already locked
    const existing = await prisma.evaluation.findUnique({
      where: {
        submissionId_judgeId: {
          submissionId,
          judgeId: user.id,
        },
      },
    });

    if (existing && existing.status === 'SUBMITTED' && !existing.isReopened && !isFinal) {
      return NextResponse.json({ error: 'This evaluation is submitted and locked. Contact administrator to reopen.' }, { status: 400 });
    }

    let totalScore = 0;
    if (scores && typeof scores === 'object') {
      totalScore = Object.values(scores).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
    }

    const status = isFinal ? 'SUBMITTED' : 'DRAFT_SAVED';

    const evaluation = await prisma.evaluation.upsert({
      where: {
        submissionId_judgeId: {
          submissionId,
          judgeId: user.id,
        },
      },
      update: {
        totalScore,
        status,
        feedback: feedback || existing?.feedback,
        strengths: strengths || existing?.strengths,
        improvementAreas: improvementAreas || existing?.improvementAreas,
      },
      create: {
        submissionId,
        judgeId: user.id,
        rubricId,
        totalScore,
        status,
        feedback: feedback || '',
        strengths: strengths || '',
        improvementAreas: improvementAreas || '',
      },
    });

    // Save individual criteria scores
    if (scores && typeof scores === 'object') {
      for (const [criterionId, scoreVal] of Object.entries(scores)) {
        await prisma.evaluationScore.upsert({
          where: {
            evaluationId_criterionId: {
              evaluationId: evaluation.id,
              criterionId,
            },
          },
          update: { score: Number(scoreVal) || 0 },
          create: {
            evaluationId: evaluation.id,
            criterionId,
            score: Number(scoreVal) || 0,
          },
        });
      }
    }

    // If final, save revision snapshot and update assignment status
    if (isFinal) {
      await prisma.evaluationRevision.create({
        data: {
          evaluationId: evaluation.id,
          version: evaluation.version,
          totalScore,
          feedback,
        },
      });

      if (assignment) {
        await prisma.judgeAssignment.update({
          where: { id: assignment.id },
          data: { status: 'COMPLETED' },
        });
      }

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Evaluation submitted successfully',
          message: `Evaluation for submission locked at ${totalScore}/100 marks.`,
          link: '#history',
        },
      });
    }

    // Shortlisting recommendation
    if (recommendAs) {
      const sub = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { user: true },
      });
      if (sub) {
        // find active award category
        const cat = await prisma.awardCategory.findFirst({ where: { isPublicVoting: true } });
        if (cat) {
          await prisma.nomination.create({
            data: {
              categoryId: cat.id,
              submissionId: sub.id,
              nomineeTitle: sub.title,
              nomineeName: sub.user.name,
              source: 'Judge',
              status: 'SHORTLISTED',
              recommendedAs: recommendAs,
              recommendNotes: recommendNotes || '',
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, evaluation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
