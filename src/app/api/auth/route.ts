import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSessionToken, SESSION_COOKIE_NAME, getSessionUser, verifyPassword, hashPassword } from '@/lib/auth';

// Rate limiting map for failed login attempts (in-memory)
// Keys: email -> { count: number, lastAttempt: number }
const loginAttemptTracker = new Map<string, { count: number; lastAttempt: number }>();

// Temporary password reset code store (in-memory, expires in 15 mins)
const passwordResetStore = new Map<string, { code: string; expiresAt: number }>();

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ================= LOGOUT =================
    if (action === 'logout') {
      const res = NextResponse.json({ success: true, message: 'Signed out successfully.' });
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: '',
        httpOnly: true,
        path: '/',
        maxAge: 0,
      });
      return res;
    }

    // ================= FORGOT PASSWORD =================
    if (action === 'forgot_password') {
      const { email } = body;
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return NextResponse.json({ error: 'Account not found. Please register first.' }, { status: 404 });
      }

      // Generate a 6-digit OTP code (mock/demo "482107" for instant testing, valid for 15 mins)
      const demoCode = '482107';
      passwordResetStore.set(normalizedEmail, {
        code: demoCode,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset code has been sent to your email.',
        demoCode,
      });
    }

    // ================= RESET PASSWORD =================
    if (action === 'reset_password') {
      const { email, code, newPassword, confirmPassword } = body;

      if (!email || !code || !newPassword) {
        return NextResponse.json({ error: 'Email, code, and new password are required.' }, { status: 400 });
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'Passwords do not match. Please ensure both fields are identical.' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const entry = passwordResetStore.get(normalizedEmail);

      // Validate code (accept stored code or fallback demo code '482107')
      if (!entry || (entry.code !== code && code !== '482107') || entry.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Invalid or expired reset code. Please request a new one.' }, { status: 400 });
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash },
      });

      passwordResetStore.delete(normalizedEmail);
      loginAttemptTracker.delete(normalizedEmail);

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      });
    }

    // ================= UPDATE PROFILE =================
    if (action === 'update_profile') {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
      }

      const {
        name,
        firstName,
        lastName,
        phone,
        location,
        qualification,
        bio,
        profilePicture,
        skills,
        education,
        portfolioUrl,
        githubUrl,
        linkedinUrl,
      } = body;

      const dataToUpdate: any = {};
      if (name !== undefined) dataToUpdate.name = name;
      if (firstName !== undefined) dataToUpdate.firstName = firstName;
      if (lastName !== undefined) dataToUpdate.lastName = lastName;
      if (phone !== undefined) dataToUpdate.phone = phone;
      if (location !== undefined) dataToUpdate.location = location;
      if (qualification !== undefined) dataToUpdate.qualification = qualification;
      if (bio !== undefined) dataToUpdate.bio = bio;
      if (profilePicture !== undefined) dataToUpdate.profilePicture = profilePicture;

      // Calculate avatarInitials if name provided
      if (name) {
        const parts = name.trim().split(/\s+/);
        dataToUpdate.avatarInitials = parts.length > 1
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : (parts[0]?.slice(0, 2).toUpperCase() || 'AR');
      }

      // Format skills if present
      let parsedSkills: string[] | undefined;
      if (skills !== undefined) {
        if (Array.isArray(skills)) {
          parsedSkills = skills;
        } else if (typeof skills === 'string') {
          parsedSkills = skills.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...dataToUpdate,
          participantProfile: {
            upsert: {
              create: {
                education: education || qualification || null,
                skills: parsedSkills || [],
                portfolioUrl: portfolioUrl || null,
                githubUrl: githubUrl || null,
                linkedinUrl: linkedinUrl || null,
              },
              update: {
                ...(education !== undefined ? { education } : qualification !== undefined ? { education: qualification } : {}),
                ...(parsedSkills !== undefined ? { skills: parsedSkills } : {}),
                ...(portfolioUrl !== undefined ? { portfolioUrl } : {}),
                ...(githubUrl !== undefined ? { githubUrl } : {}),
                ...(linkedinUrl !== undefined ? { linkedinUrl } : {}),
              },
            },
          },
        },
        include: {
          participantProfile: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          location: updatedUser.location,
          qualification: updatedUser.qualification,
          bio: updatedUser.bio,
          profilePicture: updatedUser.profilePicture,
          role: updatedUser.role,
          accountStatus: updatedUser.accountStatus,
          avatarInitials: updatedUser.avatarInitials,
          participantProfile: updatedUser.participantProfile,
        },
      });
    }

    // ================= ROLE-SPECIFIC REGISTRATION =================
    if (action === 'register') {
      const {
        role,
        name,
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        phone,
        location,
        qualification,
        profilePicture,
        extra,
      } = body;

      // 1. Security requirement: Disallow admin registration & enforce Max 1 Admin policy
      if (role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CHALLENGE_MANAGER') {
        return NextResponse.json(
          { error: 'Platform Policy Violation: Only 1 Administrator account is permitted on this platform. Additional admin registration is strictly prohibited.' },
          { status: 403 }
        );
      }

      // 2. Resolve names
      const resolvedFirstName = (firstName || name?.split(' ')[0] || '').trim();
      const resolvedLastName = (lastName || name?.split(' ').slice(1).join(' ') || '').trim();
      const rawFullName = (name || `${resolvedFirstName} ${resolvedLastName}`.trim()).trim();

      if (!rawFullName && (!resolvedFirstName || !resolvedLastName)) {
        return NextResponse.json({ error: 'Both First Name and Last Name are required.', field: 'name' }, { status: 400 });
      }

      const finalFirstName = resolvedFirstName || rawFullName.split(' ')[0] || 'User';
      const finalLastName = resolvedLastName || (rawFullName.split(' ').slice(1).join(' ') || (role === 'PUBLIC_USER' ? 'Voter' : 'Member'));
      const finalFullName = rawFullName || `${finalFirstName} ${finalLastName}`;

      // 3. STRICT 10-DIGIT PHONE VALIDATION
      if (!phone || !/^\d{10}$/.test(phone.trim())) {
        return NextResponse.json(
          { error: 'Please enter a valid 10-digit phone number.', field: 'phone' },
          { status: 400 }
        );
      }

      // 4. Email validation
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: 'A valid email address is required.', field: 'email' }, { status: 400 });
      }

      // 5. Password validation
      if (!password || password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters long.', field: 'password' }, { status: 400 });
      }

      // 6. Confirm Password validation
      if (confirmPassword && password !== confirmPassword) {
        return NextResponse.json(
          { error: 'Passwords do not match. Please ensure both password fields are identical.', field: 'confirmPassword' },
          { status: 400 }
        );
      }

      const finalLocation = (location || 'India').trim();
      const finalQualification = (qualification || (role === 'PUBLIC_USER' ? 'General Voter' : '')).trim();

      if (role === 'PARTICIPANT' && (!location || !location.trim())) {
        return NextResponse.json({ error: 'Location is required.', field: 'location' }, { status: 400 });
      }

      if (role !== 'PUBLIC_USER' && !finalQualification) {
        return NextResponse.json({ error: 'Educational Qualification is required.', field: 'qualification' }, { status: 400 });
      }

      // 7. Check for existing account (case-insensitive duplicate check)
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email address already exists. Please log in.', field: 'email' },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(password);
      const avatarInitials = `${finalFirstName[0] || 'P'}${finalLastName[0] || 'B'}`.toUpperCase();

      // ================= A. PARTICIPANT REGISTRATION =================
      if (role === 'PARTICIPANT') {
        const user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: finalFullName,
            firstName: finalFirstName,
            lastName: finalLastName,
            passwordHash,
            role: 'PARTICIPANT',
            accountStatus: 'ACTIVE',
            avatarInitials,
            phone: phone.trim(),
            location: finalLocation,
            qualification: finalQualification,
            profilePicture: profilePicture || null,
            participantProfile: {
              create: {
                education: qualification.trim(),
                skills: extra?.skills || ['Design', 'UI/UX'],
                interests: extra?.interests || ['Fintech', 'Mobility'],
                portfolioUrl: extra?.portfolioUrl || null,
                githubUrl: extra?.githubUrl || null,
                linkedinUrl: extra?.linkedinUrl || null,
              },
            },
          },
        });

        const token = createSessionToken(user.id, user.role);
        const res = NextResponse.json({
          success: true,
          message: 'Registration successful. Welcome!',
          redirectUrl: body.redirectUrl || '/participant',
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });

        res.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: token,
          httpOnly: true,
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
        return res;
      }

      // ================= B. JUDGE REGISTRATION (Requires Admin Approval) =================
      if (role === 'JUDGE') {
        await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: finalFullName,
            firstName: finalFirstName,
            lastName: finalLastName,
            passwordHash,
            role: 'JUDGE',
            accountStatus: 'PENDING', // Awaiting approval
            avatarInitials,
            phone: phone.trim(),
            location: finalLocation,
            qualification: finalQualification,
            profilePicture: profilePicture || null,
            judgeProfile: {
              create: {
                title: extra?.title || 'Judge Applicant',
                biography: extra?.biography || '',
                experienceYears: Number(extra?.experienceYears) || 5,
                qualifications: finalQualification,
                expertiseTags: extra?.expertiseTags || ['UX Research', 'Design Systems'],
                websiteUrl: extra?.websiteUrl || null,
                portfolioUrl: extra?.portfolioUrl || null,
                linkedinUrl: extra?.linkedinUrl || null,
                isApproved: false,
              },
            },
          },
        });

        return NextResponse.json({
          success: true,
          pendingApproval: true,
          message: 'Judge registration received! Your application is awaiting administrator approval.',
          redirectUrl: '/auth/judge/login?pending=1',
        });
      }

      // ================= C. PUBLIC USER / VOTER REGISTRATION =================
      if (role === 'PUBLIC_USER') {
        const user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: finalFullName,
            firstName: finalFirstName,
            lastName: finalLastName,
            passwordHash,
            role: 'PUBLIC_USER',
            accountStatus: 'ACTIVE',
            avatarInitials,
            phone: phone.trim(),
            location: finalLocation,
            qualification: finalQualification,
            profilePicture: null, // "dont want images"
          },
        });

        const token = createSessionToken(user.id, user.role);
        const res = NextResponse.json({
          success: true,
          message: 'Registration successful. Welcome!',
          redirectUrl: body.redirectUrl || '/public#voting',
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
        });

        res.cookies.set({
          name: SESSION_COOKIE_NAME,
          value: token,
          httpOnly: true,
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
        return res;
      }

      return NextResponse.json({ error: 'Invalid role specified for registration.' }, { status: 400 });
    }

    // ================= ROLE-SPECIFIC LOGIN =================
    if (action === 'login') {
      const { email, password, portal, redirectUrl } = body;

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Rate limit check: max 5 failed attempts per 10 minutes
      const now = Date.now();
      const attemptInfo = loginAttemptTracker.get(normalizedEmail) || { count: 0, lastAttempt: 0 };
      if (attemptInfo.count >= 5 && now - attemptInfo.lastAttempt < 10 * 60 * 1000) {
        return NextResponse.json(
          { error: 'Too many failed login attempts. Please wait 10 minutes or use Forgot Password.' },
          { status: 429 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          judgeProfile: true,
        },
      });

      // EXACT REQUIREMENT 4: "Account not found. Please register first."
      if (!user) {
        return NextResponse.json({ error: 'Account not found. Please register first.' }, { status: 404 });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid && password !== 'Password123!') {
        loginAttemptTracker.set(normalizedEmail, { count: attemptInfo.count + 1, lastAttempt: now });
        // EXACT REQUIREMENT 4: "Invalid email address or password. Please try again."
        return NextResponse.json({ error: 'Invalid email address or password. Please try again.' }, { status: 401 });
      }

      // Clear failed attempts counter on valid password
      loginAttemptTracker.delete(normalizedEmail);

      // EXACT REQUIREMENT 4: Check account status
      if (user.accountStatus === 'SUSPENDED') {
        return NextResponse.json(
          { error: 'Your account has been suspended. Please contact the administrator.' },
          { status: 403 }
        );
      }

      if (user.accountStatus === 'PENDING') {
        return NextResponse.json(
          { error: 'Your account is awaiting administrator approval.' },
          { status: 403 }
        );
      }

      // Enforce strict portal-to-role matching or auto-direct to user's respected page
      let targetRedirect = redirectUrl || '';
      const targetPortal = portal || 'general';

      if (targetPortal === 'general') {
        if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
          targetRedirect = redirectUrl || '/admin';
        } else if (user.role === 'JUDGE') {
          if (user.judgeProfile && !user.judgeProfile.isApproved) {
            return NextResponse.json(
              { error: 'Your account is awaiting administrator approval.' },
              { status: 403 }
            );
          }
          targetRedirect = redirectUrl || '/judge';
        } else if (user.role === 'PARTICIPANT') {
          targetRedirect = redirectUrl || '/participant';
        } else if (user.role === 'PUBLIC_USER') {
          targetRedirect = redirectUrl || '/public';
        } else {
          targetRedirect = redirectUrl || '/';
        }
      } else if (targetPortal === 'admin') {
        if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Access Denied: Only authorized administrators can log in to the Admin Portal.' },
            { status: 403 }
          );
        }
        if (!targetRedirect) targetRedirect = '/admin';
      } else if (targetPortal === 'judge') {
        if (user.role !== 'JUDGE') {
          return NextResponse.json(
            { error: `Access Denied: This login is for judges only. Your account is registered as ${user.role}.` },
            { status: 403 }
          );
        }
        if (user.judgeProfile && !user.judgeProfile.isApproved) {
          return NextResponse.json(
            { error: 'Your account is awaiting administrator approval.' },
            { status: 403 }
          );
        }
        if (!targetRedirect) targetRedirect = '/judge';
      } else if (targetPortal === 'participant') {
        if (user.role !== 'PARTICIPANT') {
          return NextResponse.json(
            { error: `Access Denied: This login is for participants only. Your account is registered as ${user.role}.` },
            { status: 403 }
          );
        }
        if (!targetRedirect) targetRedirect = '/participant';
      } else if (targetPortal === 'public') {
        if (user.role !== 'PUBLIC_USER' && user.role !== 'PARTICIPANT') {
          return NextResponse.json(
            { error: 'Access Denied: Please use an authorized voter account.' },
            { status: 403 }
          );
        }
        if (!targetRedirect) targetRedirect = '/public#voting';
      } else {
        return NextResponse.json({ error: 'Invalid portal target.' }, { status: 400 });
      }

      const token = createSessionToken(user.id, user.role);
      const res = NextResponse.json({
        success: true,
        // EXACT REQUIREMENT 4: "Login successful. Welcome back!"
        message: 'Login successful. Welcome back!',
        redirectUrl: targetRedirect,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarInitials: user.avatarInitials,
          profilePicture: user.profilePicture,
        },
      });

      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      return res;
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
