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
    const action = searchParams.get('action');

    // Return participants list for teammate invitation
    if (action === 'participants') {
      const participants = await prisma.user.findMany({
        where: {
          role: 'PARTICIPANT',
          id: { not: user.id },
          accountStatus: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          email: true,
          location: true,
          qualification: true,
          profilePicture: true,
          avatarInitials: true,
          bio: true,
          participantProfile: {
            select: {
              education: true,
              experience: true,
              skills: true,
            },
          },
          submissions: {
            select: {
              id: true,
              code: true,
              title: true,
              status: true,
              challenge: {
                select: {
                  id: true,
                  title: true,
                  code: true,
                },
              },
              hackathon: {
                select: {
                  id: true,
                  title: true,
                  code: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({ participants });
    }

    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

    const teams = await prisma.team.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { leaderId: user.id },
              { members: { some: { userId: user.id } } },
            ],
          },
      include: {
        leader: { select: { id: true, name: true, email: true, avatarInitials: true, profilePicture: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarInitials: true, profilePicture: true, qualification: true } },
          },
        },
        invitations: true,
        challenge: true,
        hackathon: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also fetch pending invitations received by the current user
    const receivedInvitations = await prisma.teamInvitation.findMany({
      where: {
        email: { equals: user.email, mode: 'insensitive' },
        status: 'Pending',
      },
      include: {
        team: {
          include: {
            leader: { select: { id: true, name: true, email: true, avatarInitials: true, profilePicture: true } },
            challenge: { select: { id: true, title: true, code: true } },
            hackathon: { select: { id: true, title: true, code: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, avatarInitials: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ teams, receivedInvitations });
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
    const { action, name, description, teamId, inviteEmail, inviteUserId, invitationId, decision, challengeId } = body;

    // Create team
    if (action === 'create') {
      const count = await prisma.team.count();
      const code = `T-${320 + count + 1}`;

      const team = await prisma.team.create({
        data: {
          code,
          name: name || `Team ${user.name.split(' ')[0]}`,
          description: description || 'Group project team formed for platform challenges.',
          leaderId: user.id,
          challengeId: challengeId || null,
          members: {
            create: [
              { userId: user.id, role: 'Leader' },
            ],
          },
        },
        include: {
          members: true,
        },
      });

      return NextResponse.json({ success: true, team });
    }

    // Invite member
    if (action === 'invite') {
      let targetEmail = inviteEmail?.trim().toLowerCase();

      if (!targetEmail && inviteUserId) {
        const targetUser = await prisma.user.findUnique({ where: { id: inviteUserId } });
        if (targetUser) targetEmail = targetUser.email.toLowerCase();
      }

      if (!teamId || !targetEmail) {
        return NextResponse.json({ error: 'teamId and inviteEmail/inviteUserId are required.' }, { status: 400 });
      }

      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: { members: true },
      });
      if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      if (team.leaderId !== user.id) {
        return NextResponse.json({ error: 'Only team leader can invite members' }, { status: 403 });
      }
      if (team.members.length >= 4) {
        return NextResponse.json({ error: 'Maximum team size (4 members) has been reached.' }, { status: 400 });
      }

      // Check if user is already a member
      const existingUser = await prisma.user.findUnique({ where: { email: targetEmail } });
      if (existingUser && team.members.some((m) => m.userId === existingUser.id)) {
        return NextResponse.json({ error: 'This participant is already an active member of the team.' }, { status: 400 });
      }

      // Check if invitation is already pending
      const existingInvite = await prisma.teamInvitation.findFirst({
        where: {
          teamId,
          email: { equals: targetEmail, mode: 'insensitive' },
          status: 'Pending',
        },
      });
      if (existingInvite) {
        return NextResponse.json({ error: 'An invitation is already pending for this participant.' }, { status: 400 });
      }

      const invitation = await prisma.teamInvitation.create({
        data: {
          teamId,
          email: targetEmail,
          status: 'Pending',
        },
      });

      // Send notification to invited user if registered on platform
      if (existingUser) {
        await prisma.notification.create({
          data: {
            userId: existingUser.id,
            title: `Team invitation: ${team.name}`,
            message: `${user.name} invited you to join ${team.name} for Group Projects.`,
            type: 'Teams',
            link: '#teams',
          },
        });
      }

      return NextResponse.json({ success: true, invitation, message: `Invitation sent to ${targetEmail}` });
    }

    // Respond to invitation (Accept or Reject)
    if (action === 'respond_invite') {
      if (!invitationId || !decision || !['accept', 'reject'].includes(decision)) {
        return NextResponse.json({ error: 'invitationId and valid decision (accept/reject) required.' }, { status: 400 });
      }

      const invitation = await prisma.teamInvitation.findUnique({
        where: { id: invitationId },
        include: {
          team: {
            include: {
              members: true,
              leader: true,
            },
          },
        },
      });

      if (!invitation) {
        return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 });
      }

      // Verify that the logged-in user is the recipient of the invitation
      if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
        return NextResponse.json({ error: 'This invitation was addressed to another email account.' }, { status: 403 });
      }

      if (decision === 'accept') {
        if (invitation.team.members.length >= 4) {
          return NextResponse.json({ error: 'This team has already reached its maximum capacity of 4 members.' }, { status: 400 });
        }

        // Add member if not already added
        const isAlreadyMember = invitation.team.members.some((m) => m.userId === user.id);
        if (!isAlreadyMember) {
          await prisma.teamMember.create({
            data: {
              teamId: invitation.teamId,
              userId: user.id,
              role: 'Member',
            },
          });
        }

        // Update invitation status
        await prisma.teamInvitation.update({
          where: { id: invitationId },
          data: { status: 'Accepted' },
        });

        // Notify team leader
        await prisma.notification.create({
          data: {
            userId: invitation.team.leaderId,
            title: 'Invitation Accepted',
            message: `${user.name} accepted your invitation to join ${invitation.team.name}!`,
            type: 'Teams',
            link: '#teams',
          },
        });

        // Notify accepting user
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: 'Joined Team',
            message: `You are now a member of ${invitation.team.name}. You can participate in Group Projects together!`,
            type: 'Teams',
            link: '#teams',
          },
        });

        return NextResponse.json({
          success: true,
          decision: 'accept',
          message: `You have successfully joined ${invitation.team.name}! You can now collaborate on Group Projects.`,
        });
      }

      if (decision === 'reject') {
        // Update invitation status
        await prisma.teamInvitation.update({
          where: { id: invitationId },
          data: { status: 'Rejected' },
        });

        // Notify team leader
        await prisma.notification.create({
          data: {
            userId: invitation.team.leaderId,
            title: 'Invitation Declined',
            message: `${user.name} declined the invitation to join ${invitation.team.name}.`,
            type: 'Teams',
            link: '#teams',
          },
        });

        return NextResponse.json({
          success: true,
          decision: 'reject',
          message: `Invitation to join ${invitation.team.name} has been declined.`,
        });
      }
    }

    // Cancel invite
    if (action === 'cancel_invite') {
      await prisma.teamInvitation.delete({ where: { id: invitationId } });
      return NextResponse.json({ success: true, message: 'Invitation cancelled.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
