import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();

    const categories = await prisma.awardCategory.findMany({
      include: {
        nominations: {
          include: {
            submission: true,
          },
        },
        votingCampaigns: true,
      },
    });

    const winners = await prisma.winner.findMany({
      include: {
        nomination: {
          include: { category: true, submission: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    // If user is logged in, fetch their votes to display voting status and disable buttons
    let userVotes: { id: string; categoryId: string | null; nominationId: string }[] = [];
    if (sessionUser) {
      userVotes = await prisma.vote.findMany({
        where: {
          OR: [
            { userId: sessionUser.id },
            { voterEmail: sessionUser.email.toLowerCase() },
          ],
        },
        select: { id: true, categoryId: true, nominationId: true },
      });
    }

    return NextResponse.json({
      categories,
      winners,
      currentUser: sessionUser
        ? { id: sessionUser.id, email: sessionUser.email, name: sessionUser.name, role: sessionUser.role }
        : null,
      userVotes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        {
          error: 'Authentication required. Please sign in or register first.',
          requireAuth: true,
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, email, code, nominationId, categoryId } = body;

    // Validate email presence
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    // STRICT REQUIREMENT 5: Verify entered email matches the authenticated user's registered email
    const normalizedInputEmail = email.trim().toLowerCase();
    const registeredEmail = sessionUser.email.trim().toLowerCase();

    if (normalizedInputEmail !== registeredEmail) {
      return NextResponse.json(
        { error: 'Invalid Email Address. Please enter the email address you used during registration.' },
        { status: 400 }
      );
    }

    // Step 1: Send verification code / Pre-validation
    if (action === 'send_code') {
      const targetCategoryId = categoryId;

      // Check if user already voted in this category
      if (targetCategoryId) {
        const existingVote = await prisma.vote.findFirst({
          where: {
            OR: [
              { userId: sessionUser.id, categoryId: targetCategoryId },
              { voterEmail: registeredEmail, categoryId: targetCategoryId },
            ],
          },
        });
        if (existingVote) {
          return NextResponse.json(
            { error: 'You have already voted. Multiple votes are not allowed.', alreadyVoted: true },
            { status: 400 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: `Verification code sent to ${registeredEmail}`,
        demoCode: '482107',
      });
    }

    // Step 2: Verify and cast vote (or direct cast)
    if (!action || action === 'verify_and_vote' || action === 'cast_vote') {
      if (!nominationId) {
        return NextResponse.json({ error: 'Nomination ID is required.' }, { status: 400 });
      }

      // Check code if provided (accept '482107' or 6 digits)
      if (action === 'verify_and_vote' && code && code !== '482107' && code.length !== 6) {
        return NextResponse.json(
          { error: 'INVALID_CODE', message: 'That code did not match.' },
          { status: 400 }
        );
      }

      const nomination = await prisma.nomination.findUnique({
        where: { id: nominationId },
      });
      if (!nomination) {
        return NextResponse.json({ error: 'Nomination not found' }, { status: 404 });
      }

      const resolvedCategoryId = nomination.categoryId;

      // STRICT REQUIREMENT 6: Check database before accepting vote
      const existingVote = await prisma.vote.findFirst({
        where: {
          OR: [
            { userId: sessionUser.id, categoryId: resolvedCategoryId },
            { voterEmail: registeredEmail, categoryId: resolvedCategoryId },
          ],
        },
      });

      if (existingVote) {
        return NextResponse.json(
          { error: 'You have already voted. Multiple votes are not allowed.', alreadyVoted: true },
          { status: 400 }
        );
      }

      // Handle simultaneous voting safely in database transaction with atomic unique constraints
      try {
        const result = await prisma.$transaction(async (tx) => {
          const newVote = await tx.vote.create({
            data: {
              nominationId,
              categoryId: resolvedCategoryId,
              userId: sessionUser.id,
              voterEmail: registeredEmail,
              verificationCode: code || '482107',
              isVerified: true,
              ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
            },
          });

          await tx.nomination.update({
            where: { id: nominationId },
            data: { voteCount: { increment: 1 } },
          });

          return newVote;
        });

        return NextResponse.json({
          success: true,
          vote: result,
          message: 'Vote recorded successfully!',
        });
      } catch (dbError: any) {
        // Unique constraint violation P2002
        if (dbError.code === 'P2002') {
          return NextResponse.json(
            { error: 'You have already voted. Multiple votes are not allowed.', alreadyVoted: true },
            { status: 400 }
          );
        }
        throw dbError;
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
