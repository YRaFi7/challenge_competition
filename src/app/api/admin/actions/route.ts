import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [
      totalParticipants,
      activeChallenges,
      activeHackathons,
      totalJudges,
      publicVotes,
      totalSubmissions,
      pendingEvaluations,
      completedEvaluations,
      publishedWinners,
      auditLogs,
      participantsList,
      judgesList,
      submissionsList,
      certificatesList,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'PARTICIPANT' } }),
      prisma.challenge.count({ where: { isPublished: true } }),
      prisma.hackathon.count({ where: { isPublished: true } }),
      prisma.user.count({ where: { role: 'JUDGE' } }),
      prisma.vote.count({ where: { isVerified: true } }),
      prisma.submission.count(),
      prisma.evaluation.count({ where: { status: { in: ['ASSIGNED', 'PENDING_REVIEW', 'IN_PROGRESS', 'DRAFT_SAVED'] } } }),
      prisma.evaluation.count({ where: { status: { in: ['SUBMITTED', 'COMPLETED'] } } }),
      prisma.winner.count(),
      prisma.auditLog.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
      prisma.user.findMany({
        where: { role: 'PARTICIPANT' },
        include: {
          challengeRegistrations: true,
          submissions: true,
          teamMemberships: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.findMany({
        where: { role: 'JUDGE' },
        include: {
          judgeProfile: true,
          judgeAssignments: true,
          evaluations: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.submission.findMany({
        include: {
          challenge: true,
          hackathon: true,
          user: true,
          team: true,
          evaluations: { include: { judge: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.certificate.findMany({
        orderBy: { issuedAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalParticipants,
        activeChallenges,
        activeHackathons,
        totalJudges,
        publicVotes,
        totalSubmissions,
        pendingEvaluations,
        completedEvaluations,
        publishedWinners,
      },
      auditLogs,
      participantsList,
      judgesList,
      submissionsList,
      certificatesList,
    });
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
    const { action, targetId, reason, judgeId, challengeId, hackathonId, deadline } = body;

    // Platform Policy: Strictly forbid creating or promoting additional admins
    if (action === 'create_admin' || action === 'promote_to_admin' || action === 'add_admin') {
      const adminCount = await prisma.user.count({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      });
      if (adminCount >= 1) {
        return NextResponse.json(
          { error: 'Platform Policy Violation: Only 1 Administrator account is permitted on this platform. Cannot add or promote another admin.' },
          { status: 403 }
        );
      }
    }

    // Suspend participant
    if (action === 'suspend_participant') {
      const target = await prisma.user.update({
        where: { id: targetId },
        data: { accountStatus: 'SUSPENDED' },
      });
      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          adminName: user.name,
          action: 'Suspended account',
          module: 'Participants',
          record: `${target.name} (${target.email})`,
          reason: reason || 'Suspension by administrator.',
        },
      });
      return NextResponse.json({ success: true });
    }

    // Restore participant
    if (action === 'restore_participant') {
      const target = await prisma.user.update({
        where: { id: targetId },
        data: { accountStatus: 'ACTIVE' },
      });
      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          adminName: user.name,
          action: 'Restored account',
          module: 'Participants',
          record: `${target.name} (${target.email})`,
          reason: reason || 'Restored by administrator.',
        },
      });
      return NextResponse.json({ success: true });
    }

    // Restrict participant
    if (action === 'restrict_participant') {
      const target = await prisma.user.update({
        where: { id: targetId },
        data: { accountStatus: 'RESTRICTED' },
      });
      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          adminName: user.name,
          action: 'Restricted account',
          module: 'Participants',
          record: `${target.name} (${target.email})`,
          reason: reason || 'Restricted by administrator.',
        },
      });
      return NextResponse.json({ success: true });
    }

    // Approve Judge
    if (action === 'approve_judge') {
      await prisma.judgeProfile.update({
        where: { userId: targetId },
        data: { isApproved: true },
      });
      await prisma.user.update({
        where: { id: targetId },
        data: { accountStatus: 'ACTIVE' },
      });
      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          adminName: user.name,
          action: 'Approved judge profile',
          module: 'Judges',
          record: targetId,
          reason: 'Application approved.',
        },
      });
      return NextResponse.json({ success: true });
    }

    // Assign Judge
    if (action === 'assign_judge') {
      const assignment = await prisma.judgeAssignment.create({
        data: {
          judgeId,
          challengeId: challengeId || null,
          hackathonId: hackathonId || null,
          deadline: deadline ? new Date(deadline) : null,
          status: 'PENDING_REVIEW',
        },
      });

      await prisma.notification.create({
        data: {
          userId: judgeId,
          title: 'New assignment',
          message: 'You have been assigned to evaluate submissions.',
          link: '#challenges',
        },
      });

      return NextResponse.json({ success: true, assignment });
    }

    // Reopen Evaluation
    if (action === 'reopen_evaluation') {
      const updated = await prisma.evaluation.update({
        where: { id: targetId },
        data: {
          isReopened: true,
          status: 'REOPENED',
          reopenedUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days extension
        },
      });
      await prisma.notification.create({
        data: {
          userId: updated.judgeId,
          title: 'An administrator reopened an evaluation',
          message: 'Editable until 24 Nov. Earlier version preserved.',
          link: '#feedback',
        },
      });
      return NextResponse.json({ success: true });
    }

    // Publish Winners
    if (action === 'publish_winners') {
      await prisma.challenge.updateMany({
        where: { status: 'UNDER_EVALUATION' },
        data: { status: 'RESULTS_PUBLISHED' },
      });
      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          adminName: user.name,
          action: 'Published winners',
          module: 'Awards',
          record: 'Official results published publicly.',
          reason: reason || 'Authorized result approval.',
        },
      });
      return NextResponse.json({ success: true });
    }

    // Issue Certificate
    if (action === 'issue_certificate') {
      const { recipientName, awardTitle, eventName, certType } = body;
      const count = await prisma.certificate.count();
      const cert = await prisma.certificate.create({
        data: {
          code: `CERT-${2026}-${String(840 + count + 1).padStart(4, '0')}`,
          recipientId: user.id,
          recipientName: recipientName || 'Participant',
          awardTitle: awardTitle || 'Achievement Award',
          eventName: eventName || 'Portfolio Builders Challenge',
          certType: certType || 'Winner',
        },
      });
      return NextResponse.json({ success: true, certificate: cert });
    }

    // Revoke Certificate
    if (action === 'revoke_certificate') {
      await prisma.certificate.update({
        where: { id: targetId },
        data: { status: 'REVOKED' },
      });
      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          adminName: user.name,
          action: 'Revoked certificate',
          module: 'Certificates',
          record: targetId,
          reason: reason || 'Authorized revocation.',
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown admin action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
