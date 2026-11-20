import { PrismaClient, UserRole, AccountStatus, ChallengeStatus, DurationType, HackathonFormat, RegistrationStatus, SubmissionStatus, EvaluationStatus, NominationStatus, CertificateStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding db_challenge...');

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  // 1. Single Super Admin (Strict Platform Policy: Exactly 1 Admin permitted)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      passwordHash: adminPasswordHash,
      role: UserRole.SUPER_ADMIN,
      name: 'Super Admin',
    },
    create: {
      email: 'admin@gmail.com',
      name: 'Super Admin',
      passwordHash: adminPasswordHash,
      role: UserRole.SUPER_ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      avatarInitials: 'SA',
      location: 'India',
    },
  });

  // 2. Judges
  const judgeNikhil = await prisma.user.upsert({
    where: { email: 'nikhil@mail.com' },
    update: {},
    create: {
      email: 'nikhil@mail.com',
      name: 'Dr. Nikhil Menon',
      passwordHash,
      role: UserRole.JUDGE,
      accountStatus: AccountStatus.ACTIVE,
      avatarInitials: 'NM',
      phone: '+91 9895 125678',
      location: 'Kochi, India',
      judgeProfile: {
        create: {
          title: 'Principal Product Designer · Judge',
          biography: 'Twenty years designing products for fintech and public services, with a focus on accessible interfaces. Judges design and UX challenges.',
          experienceYears: 20,
          qualifications: 'PhD, Human-Computer Interaction (IIT Madras) · M.Des, Interaction Design (NID Ahmedabad)',
          experienceInfo: 'Principal Designer, Meridian Labs (2019-present) · Design Lead, Kerala Digital Services (2012-2019)',
          expertiseTags: ['UX research', 'Interaction design', 'Accessibility', 'Design systems'],
          websiteUrl: 'nikhilmenon.design',
          portfolioUrl: 'nikhilmenon.design/work',
          linkedinUrl: 'linkedin.com/in/nikhil-menon',
          isApproved: true,
        },
      },
    },
  });

  const judgePriya = await prisma.user.upsert({
    where: { email: 'priya@mail.com' },
    update: {},
    create: {
      email: 'priya@mail.com',
      name: 'Dr. Priya Nair',
      passwordHash,
      role: UserRole.JUDGE,
      accountStatus: AccountStatus.ACTIVE,
      avatarInitials: 'PN',
      location: 'Kochi, India',
      judgeProfile: {
        create: {
          title: 'UX Research Director',
          biography: 'Research lead with expertise in digital interfaces and accessibility.',
          experienceYears: 14,
          expertiseTags: ['UX Research', 'Design Systems'],
          isApproved: true,
        },
      },
    },
  });

  const judgeMarcus = await prisma.user.upsert({
    where: { email: 'marcus@mail.com' },
    update: {},
    create: {
      email: 'marcus@mail.com',
      name: 'Marcus Lee',
      passwordHash,
      role: UserRole.JUDGE,
      accountStatus: AccountStatus.ACTIVE,
      avatarInitials: 'ML',
      location: 'Singapore',
      judgeProfile: {
        create: {
          title: 'Frontend Architect',
          biography: 'Specialized in UI animation, accessibility and design engineering.',
          experienceYears: 12,
          expertiseTags: ['Frontend', 'UI Engineering'],
          isApproved: true,
        },
      },
    },
  });

  const judgeTomas = await prisma.user.upsert({
    where: { email: 'tomas@mail.com' },
    update: {},
    create: {
      email: 'tomas@mail.com',
      name: 'Tomas Novak',
      passwordHash,
      role: UserRole.JUDGE,
      accountStatus: AccountStatus.ACTIVE,
      avatarInitials: 'TN',
      location: 'Prague, CZ',
      judgeProfile: {
        create: {
          title: 'Data & AI Systems Architect',
          experienceYears: 10,
          expertiseTags: ['AI & Data', 'Product Systems'],
          isApproved: true,
        },
      },
    },
  });

  const judgeAlicia = await prisma.user.upsert({
    where: { email: 'alicia@mail.com' },
    update: {},
    create: {
      email: 'alicia@mail.com',
      name: 'Alicia Gomez',
      passwordHash,
      role: UserRole.JUDGE,
      accountStatus: AccountStatus.PENDING,
      avatarInitials: 'AG',
      judgeProfile: {
        create: {
          title: 'Brand Designer',
          experienceYears: 9,
          expertiseTags: ['Brand Design', 'Visual Polish'],
          isApproved: false,
        },
      },
    },
  });

  // 3. Participants
  const participantAnjali = await prisma.user.upsert({
    where: { email: 'anjali@mail.com' },
    update: {},
    create: {
      email: 'anjali@mail.com',
      name: 'Anjali R.',
      passwordHash,
      role: UserRole.PARTICIPANT,
      accountStatus: AccountStatus.ACTIVE,
      avatarInitials: 'AR',
      phone: '+91 9846 001234',
      location: 'Thrissur, India',
      participantProfile: {
        create: {
          education: 'B.Des, Product Design · Government Engineering College, Thrissur (2023–2027)',
          experience: 'UX Intern, Portfolio Builders (Jun–Aug 2026) · Freelance UI designer (2024–present)',
          skills: ['Figma', 'UX research', 'Prototyping', 'HTML/CSS'],
          interests: ['Fintech', 'Mobility', 'Accessibility'],
          portfolioUrl: 'anjali.design/work',
          githubUrl: 'github.com/anjali-r',
          linkedinUrl: 'linkedin.com/in/anjali-r',
          websiteUrl: 'anjali.design',
          isPublic: true,
          showBadges: true,
        },
      },
    },
  });

  const participantMeera = await prisma.user.upsert({
    where: { email: 'meera@mail.com' },
    update: {},
    create: {
      email: 'meera@mail.com',
      name: 'Meera N.',
      passwordHash,
      role: UserRole.PARTICIPANT,
      accountStatus: AccountStatus.ACTIVE,
      avatarInitials: 'MN',
      location: 'Kozhikode, India',
    },
  });

  const participantRahul = await prisma.user.upsert({
    where: { email: 'rahul@mail.com' },
    update: {},
    create: {
      email: 'rahul@mail.com',
      name: 'Rahul M.',
      passwordHash,
      role: UserRole.PARTICIPANT,
      accountStatus: AccountStatus.ACTIVE,
      avatarInitials: 'RM',
      location: 'Ernakulam, India',
    },
  });

  const participantSana = await prisma.user.upsert({
    where: { email: 'sana@mail.com' },
    update: {},
    create: {
      email: 'sana@mail.com',
      name: 'Sana K.',
      passwordHash,
      role: UserRole.PARTICIPANT,
      accountStatus: AccountStatus.ACTIVE,
      avatarInitials: 'SK',
      location: 'Thiruvananthapuram, India',
    },
  });

  const participantMaya = await prisma.user.upsert({
    where: { email: 'maya@mail.com' },
    update: {},
    create: {
      email: 'maya@mail.com',
      name: 'Maya Rao',
      passwordHash,
      role: UserRole.PARTICIPANT,
      accountStatus: AccountStatus.ACTIVE,
      avatarInitials: 'MR',
    },
  });

  const participantDaniel = await prisma.user.upsert({
    where: { email: 'dkim@mail.com' },
    update: {},
    create: {
      email: 'dkim@mail.com',
      name: 'Daniel Kim',
      passwordHash,
      role: UserRole.PARTICIPANT,
      accountStatus: AccountStatus.ACTIVE,
      avatarInitials: 'DK',
    },
  });

  const participantLena = await prisma.user.upsert({
    where: { email: 'lena.f@mail.com' },
    update: {},
    create: {
      email: 'lena.f@mail.com',
      name: 'Lena Fischer',
      passwordHash,
      role: UserRole.PARTICIPANT,
      accountStatus: AccountStatus.PENDING,
      avatarInitials: 'LF',
    },
  });

  const participantOmar = await prisma.user.upsert({
    where: { email: 'omar@mail.com' },
    update: {},
    create: {
      email: 'omar@mail.com',
      name: 'Omar Khalil',
      passwordHash,
      role: UserRole.PARTICIPANT,
      accountStatus: AccountStatus.SUSPENDED,
      avatarInitials: 'OK',
    },
  });

  const participantIvy = await prisma.user.upsert({
    where: { email: 'ivy@mail.com' },
    update: {},
    create: {
      email: 'ivy@mail.com',
      name: 'Ivy Chen',
      passwordHash,
      role: UserRole.PARTICIPANT,
      accountStatus: AccountStatus.RESTRICTED,
      avatarInitials: 'IC',
    },
  });

  // 4. Categories
  const catDesign = await prisma.challengeCategory.upsert({
    where: { name: 'Design' },
    update: {},
    create: { name: 'Design', visibility: 'Public' },
  });
  const catFrontend = await prisma.challengeCategory.upsert({
    where: { name: 'Frontend' },
    update: {},
    create: { name: 'Frontend', visibility: 'Public' },
  });
  const catAIData = await prisma.challengeCategory.upsert({
    where: { name: 'AI & Data' },
    update: {},
    create: { name: 'AI & Data', visibility: 'Public' },
  });
  const catUX = await prisma.challengeCategory.upsert({
    where: { name: 'UX Design' },
    update: {},
    create: { name: 'UX Design', visibility: 'Public' },
  });

  // 5. Challenges
  const chFintech = await prisma.challenge.upsert({
    where: { code: 'CH-2048' },
    update: {},
    create: {
      code: 'CH-2048',
      title: 'Fintech Onboarding UX',
      slug: 'fintech-onboarding-ux',
      categoryName: 'UX Design',
      categoryId: catUX.id,
      description: 'Design a first-time user flow for a savings app and submit a prototype with a short write-up.',
      overview: 'New users abandon savings apps during sign-up. Redesign the first-time flow so a user can open an account and set a first goal in under three minutes.',
      objectives: [
        'Reduce steps and cognitive load in sign-up.',
        'Explain trust and security clearly.',
        'Prototype the complete happy path.',
      ],
      eligibility: 'Open to students and working professionals in India.',
      rules: 'Original work only, credit all assets. Submit once before deadline.',
      status: ChallengeStatus.REGISTRATION_OPEN,
      durationType: DurationType.DAILY,
      durationDisplay: 'Daily · 24 hours',
      registrationFee: 149,
      prizePool: '₹50,000',
      participationType: 'Solo or 2–4',
      minTeamSize: 1,
      maxTeamSize: 4,
      registrationOpen: new Date('2026-11-15T09:00:00Z'),
      registrationClose: new Date('2026-11-21T18:00:00Z'),
      challengeStart: new Date('2026-11-22T09:00:00Z'),
      challengeEnd: new Date('2026-11-23T09:00:00Z'),
      submissionDeadline: new Date('2026-11-23T12:00:00Z'),
      evaluationDeadline: new Date('2026-11-25T18:00:00Z'),
      isPublished: true,
    },
  });

  const chTravel = await prisma.challenge.upsert({
    where: { code: 'CH-2052' },
    update: {},
    create: {
      code: 'CH-2052',
      title: 'Weekly UI: Travel Dashboard',
      slug: 'weekly-ui-travel-dashboard',
      categoryName: 'UI Design',
      categoryId: catDesign.id,
      description: 'Design a trip-planning dashboard for desktop and mobile with a clear visual system.',
      overview: 'Create a comprehensive travel itinerary and booking management interface.',
      status: ChallengeStatus.LIVE,
      durationType: DurationType.WEEKLY,
      durationDisplay: 'Weekly · 7 days',
      registrationFee: 99,
      prizePool: '₹25,000',
      participationType: 'Individual',
      minTeamSize: 1,
      maxTeamSize: 1,
      registrationOpen: new Date('2026-11-10T09:00:00Z'),
      registrationClose: new Date('2026-11-17T18:00:00Z'),
      challengeStart: new Date('2026-11-15T09:00:00Z'),
      challengeEnd: new Date('2026-11-22T18:00:00Z'),
      submissionDeadline: new Date('2026-11-22T18:00:00Z'),
      evaluationDeadline: new Date('2026-11-25T18:00:00Z'),
      isPublished: true,
    },
  });

  const chSpeed = await prisma.challenge.upsert({
    where: { code: 'CH-2010' },
    update: {},
    create: {
      code: 'CH-2010',
      title: 'Speed UI: Mobile Checkout',
      slug: 'speed-ui-mobile-checkout',
      categoryName: 'UI Design',
      categoryId: catDesign.id,
      description: 'Redesign a mobile checkout in three hours and submit a prototype link.',
      status: ChallengeStatus.LIVE,
      durationType: DurationType.HOURLY,
      durationDisplay: 'Hourly · 3 hours',
      registrationFee: 149,
      prizePool: '₹5,000',
      participationType: 'Solo or team of 2–4',
      minTeamSize: 1,
      maxTeamSize: 4,
      registrationOpen: new Date('2026-11-18T09:00:00Z'),
      registrationClose: new Date('2026-11-19T14:00:00Z'),
      challengeStart: new Date('2026-11-19T14:00:00Z'),
      challengeEnd: new Date('2026-11-19T17:00:00Z'),
      submissionDeadline: new Date('2026-11-19T17:00:00Z'),
      isPublished: true,
    },
  });

  const chUIRedesign = await prisma.challenge.upsert({
    where: { code: 'CH-2041' },
    update: {},
    create: {
      code: 'CH-2041',
      title: 'UI Redesign Challenge',
      slug: 'ui-redesign-challenge',
      categoryName: 'UI Design',
      categoryId: catDesign.id,
      description: 'Redesign the booking experience of a regional bus app.',
      overview: 'Riders struggle to find live arrival times and book across routes. Participants redesign the core flows and defend their decisions.',
      status: ChallengeStatus.UNDER_EVALUATION,
      durationType: DurationType.WEEKLY,
      durationDisplay: 'Weekly · 7 days',
      registrationFee: 149,
      prizePool: '₹35,000',
      participationType: 'Individual or team',
      minTeamSize: 1,
      maxTeamSize: 4,
      challengeStart: new Date('2026-11-05T09:00:00Z'),
      challengeEnd: new Date('2026-11-15T18:00:00Z'),
      submissionDeadline: new Date('2026-11-15T18:00:00Z'),
      evaluationDeadline: new Date('2026-11-22T18:00:00Z'),
      isPublished: true,
    },
  });

  const chCaseStudy = await prisma.challenge.upsert({
    where: { code: 'CH-2065' },
    update: {},
    create: {
      code: 'CH-2065',
      title: 'December Case Study',
      slug: 'december-case-study',
      categoryName: 'UX Design',
      categoryId: catUX.id,
      description: 'A full product case study from research to final screens across December.',
      status: ChallengeStatus.UPCOMING,
      durationType: DurationType.MONTHLY,
      durationDisplay: 'Monthly · 30 days',
      registrationFee: 149,
      prizePool: '₹75,000',
      participationType: 'Team of 2–4',
      minTeamSize: 2,
      maxTeamSize: 4,
      registrationOpen: new Date('2026-11-25T09:00:00Z'),
      registrationClose: new Date('2026-11-28T18:00:00Z'),
      challengeStart: new Date('2026-12-01T09:00:00Z'),
      challengeEnd: new Date('2026-12-31T18:00:00Z'),
      submissionDeadline: new Date('2026-12-31T18:00:00Z'),
      isPublished: true,
    },
  });

  const chRedesignPrize = await prisma.challenge.upsert({
    where: { code: 'CH-2026' },
    update: {},
    create: {
      code: 'CH-2026',
      title: 'The Redesign Prize 2026',
      slug: 'the-redesign-prize-2026',
      categoryName: 'UI Design',
      categoryId: catDesign.id,
      description: 'Redesign a public-interest website or app and defend it before the jury.',
      status: ChallengeStatus.REGISTRATION_OPEN,
      durationType: DurationType.YEARLY,
      durationDisplay: 'Yearly · 12 months',
      registrationFee: 199,
      prizePool: '₹2,00,000',
      participationType: 'Solo or 2–4',
      minTeamSize: 1,
      maxTeamSize: 4,
      registrationOpen: new Date('2026-11-01T09:00:00Z'),
      registrationClose: new Date('2026-12-01T18:00:00Z'),
      submissionDeadline: new Date('2026-12-15T18:00:00Z'),
      isPublished: true,
    },
  });

  const chEcommerce = await prisma.challenge.upsert({
    where: { code: 'CH-2035' },
    update: {},
    create: {
      code: 'CH-2035',
      title: 'E-commerce Checkout Redesign',
      slug: 'ecommerce-checkout-redesign',
      categoryName: 'UX Design',
      categoryId: catUX.id,
      description: 'Winners and nominees are published. See top entries and judges notes.',
      status: ChallengeStatus.COMPLETED,
      durationType: DurationType.DAILY,
      durationDisplay: 'Daily · 24 hours',
      registrationFee: 149,
      prizePool: '₹25,000',
      challengeStart: new Date('2026-11-08T09:00:00Z'),
      challengeEnd: new Date('2026-11-09T09:00:00Z'),
      submissionDeadline: new Date('2026-11-09T12:00:00Z'),
      resultPublishDate: new Date('2026-11-14T09:00:00Z'),
      isPublished: true,
    },
  });

  // 6. Rubrics
  const rubricUIRedesign = await prisma.evaluationRubric.upsert({
    where: { challengeId: chUIRedesign.id },
    update: {},
    create: {
      name: 'UI Redesign Challenge Rubric',
      challengeId: chUIRedesign.id,
      totalMarks: 100,
      version: 1,
      criteria: {
        create: [
          { name: 'Visual Design', description: 'Hierarchy, consistency, polish', maxMarks: 25, weightPercent: 25 },
          { name: 'User Experience', description: 'Clarity of flows and decisions', maxMarks: 25, weightPercent: 25 },
          { name: 'Creativity', description: 'Originality of approach', maxMarks: 20, weightPercent: 20 },
          { name: 'Technical Execution', description: 'Quality and feasibility', maxMarks: 20, weightPercent: 20 },
          { name: 'Presentation', description: 'Storytelling and documentation', maxMarks: 10, weightPercent: 10 },
        ],
      },
    },
  });

  // 7. Hackathons
  const hkKerala = await prisma.hackathon.upsert({
    where: { code: 'HK-21' },
    update: {},
    create: {
      code: 'HK-21',
      title: 'Kerala Product Hackathon',
      slug: 'kerala-product-hackathon',
      categoryName: 'Product',
      description: 'Three days at the venue or hybrid. Build a working product and present it to a panel of judges.',
      format: HackathonFormat.HYBRID,
      venue: 'Kochi Innovation Hub',
      status: ChallengeStatus.REGISTRATION_OPEN,
      registrationFee: 199,
      prizePool: 'Up to ₹10 lakh',
      minTeamSize: 2,
      maxTeamSize: 4,
      registrationOpen: new Date('2026-11-25T09:00:00Z'),
      registrationClose: new Date('2026-12-10T18:00:00Z'),
      eventStart: new Date('2026-12-14T09:00:00Z'),
      eventEnd: new Date('2026-12-16T18:00:00Z'),
      submissionDeadline: new Date('2026-12-16T18:00:00Z'),
      isPublished: true,
      sessions: {
        create: [
          { title: 'Opening ceremony', sessionType: 'General', timeDisplay: 'Fri Dec 14, 09:00', order: 1 },
          { title: 'Workshop: Prototyping in a day', sessionType: 'Workshop', timeDisplay: 'Fri Dec 14, 11:00', order: 2 },
          { title: 'Mentoring sessions', sessionType: 'Mentoring', timeDisplay: 'Fri Dec 14, 14:00', order: 3 },
          { title: 'Submission deadline', sessionType: 'Technical', timeDisplay: 'Sat Dec 15, 20:00', order: 4 },
          { title: 'Closing & awards ceremony', sessionType: 'Judging', timeDisplay: 'Sun Dec 16, 16:00', order: 5 },
        ],
      },
    },
  });

  const hkAIBuilders = await prisma.hackathon.upsert({
    where: { code: 'HK-20' },
    update: {},
    create: {
      code: 'HK-20',
      title: 'AI Builders Weekend',
      slug: 'ai-builders-weekend',
      categoryName: 'AI & Data',
      description: 'A 36-hour remote sprint on practical AI products and accessible interfaces.',
      format: HackathonFormat.ONLINE,
      status: ChallengeStatus.UNDER_EVALUATION,
      registrationFee: 199,
      prizePool: '₹2,50,000',
      minTeamSize: 2,
      maxTeamSize: 4,
      eventStart: new Date('2026-11-15T09:00:00Z'),
      eventEnd: new Date('2026-11-17T18:00:00Z'),
      submissionDeadline: new Date('2026-11-17T18:00:00Z'),
      isPublished: true,
    },
  });

  const hkCivic = await prisma.hackathon.upsert({
    where: { code: 'HK-19' },
    update: {},
    create: {
      code: 'HK-19',
      title: 'Civic Tech Jam',
      slug: 'civic-tech-jam',
      categoryName: 'Civic Tech',
      description: 'Results published. See the winning teams in the Winners section.',
      format: HackathonFormat.OFFLINE,
      venue: 'Trivandrum Maker Space',
      status: ChallengeStatus.COMPLETED,
      registrationFee: 99,
      prizePool: '₹1,00,000',
      eventStart: new Date('2026-11-02T09:00:00Z'),
      eventEnd: new Date('2026-11-03T18:00:00Z'),
      isPublished: true,
    },
  });

  // 8. Teams
  const teamParallel = await prisma.team.upsert({
    where: { code: 'T-PARALLEL' },
    update: {},
    create: {
      code: 'T-PARALLEL',
      name: 'Team Parallel',
      description: 'Product design collective focused on fintech and mobility experiences.',
      leaderId: participantAnjali.id,
      challengeId: chSpeed.id,
      status: 'Active',
      members: {
        create: [
          { userId: participantAnjali.id, role: 'Leader' },
          { userId: participantRahul.id, role: 'Member' },
          { userId: participantSana.id, role: 'Member' },
        ],
      },
      invitations: {
        create: [
          { email: 'vivek.t@mail.com', status: 'Pending' },
        ],
      },
    },
  });

  const teamPixelPilots = await prisma.team.upsert({
    where: { code: 'T-310' },
    update: {},
    create: {
      code: 'T-310',
      name: 'Pixel Pilots',
      description: 'Design and prototype team for hackathon challenges.',
      leaderId: participantMaya.id,
      hackathonId: hkAIBuilders.id,
      status: 'Active',
      members: {
        create: [
          { userId: participantMaya.id, role: 'Leader' },
        ],
      },
    },
  });

  // 9. Registrations
  await prisma.challengeRegistration.upsert({
    where: { code: 'REG-24117' },
    update: {},
    create: {
      code: 'REG-24117',
      challengeId: chTravel.id,
      userId: participantAnjali.id,
      status: RegistrationStatus.APPROVED,
    },
  });

  await prisma.challengeRegistration.upsert({
    where: { code: 'REG-24130' },
    update: {},
    create: {
      code: 'REG-24130',
      challengeId: chSpeed.id,
      userId: participantAnjali.id,
      teamId: teamParallel.id,
      status: RegistrationStatus.APPROVED,
    },
  });

  await prisma.hackathonRegistration.upsert({
    where: { code: 'REG-24102' },
    update: {},
    create: {
      code: 'REG-24102',
      hackathonId: hkKerala.id,
      userId: participantAnjali.id,
      teamId: teamParallel.id,
      status: RegistrationStatus.PENDING,
    },
  });

  // 10. Submissions
  const sub1024 = await prisma.submission.upsert({
    where: { code: 'SUB-1024' },
    update: {},
    create: {
      code: 'SUB-1024',
      title: 'Checkout, simplified',
      shortDescription: 'A three-step checkout with inline validation and clearer error recovery.',
      detailedWriteup: 'A confident redesign with clear reasoning. The flow reduces effort without hiding important choices.',
      version: 'v2',
      status: SubmissionStatus.SUBMITTED,
      challengeId: chUIRedesign.id,
      userId: participantMeera.id,
      demoUrl: 'https://figma.com/proto/checkout-simplified',
      githubUrl: 'https://github.com/meera-n/checkout',
      files: {
        create: [
          { fileName: 'prototype.fig', fileType: 'Design file', fileSize: '8.2 MB', fileUrl: '/uploads/prototype.fig' },
          { fileName: 'case-study.pdf', fileType: 'PDF document', fileSize: '2.4 MB', fileUrl: '/uploads/case-study.pdf' },
        ],
      },
    },
  });

  const subWayfinder = await prisma.submission.upsert({
    where: { code: 'SUB-1031' },
    update: {},
    create: {
      code: 'SUB-1031',
      title: 'Wayfinder travel dashboard',
      shortDescription: 'A trip-planning dashboard for desktop and mobile.',
      detailedWriteup: 'Research showed users drop off when asked for documents before seeing value. The flow shows a goal first, then asks for identity details in a single step.',
      version: 'v2',
      status: SubmissionStatus.DRAFT,
      challengeId: chTravel.id,
      userId: participantAnjali.id,
      demoUrl: 'https://figma.com/proto/wayfinder-dashboard',
    },
  });

  const subCheckoutDone = await prisma.submission.upsert({
    where: { code: 'SUB-5390' },
    update: {},
    create: {
      code: 'SUB-5390',
      title: 'Checkout, simplified',
      shortDescription: 'Completed daily challenge submission with approved results.',
      detailedWriteup: 'Reduced form fields by half and added clear error recovery.',
      version: 'v3',
      status: SubmissionStatus.EVALUATED,
      challengeId: chEcommerce.id,
      userId: participantMeera.id,
      publishedScore: 86,
      publishedRank: 3,
      publishedFeedback: 'A confident, well-reasoned checkout. The reduction from five steps to three is clear and the edge cases are handled with care.',
    },
  });

  // 11. Judge Assignment & Evaluation
  await prisma.judgeAssignment.create({
    data: {
      judgeId: judgeNikhil.id,
      challengeId: chUIRedesign.id,
      submissionId: sub1024.id,
      status: EvaluationStatus.PENDING_REVIEW,
      deadline: new Date('2026-11-22T18:00:00Z'),
    },
  });

  const eval1024 = await prisma.evaluation.upsert({
    where: {
      submissionId_judgeId: {
        submissionId: sub1024.id,
        judgeId: judgeNikhil.id,
      },
    },
    update: {},
    create: {
      submissionId: sub1024.id,
      judgeId: judgeNikhil.id,
      rubricId: rubricUIRedesign.id,
      totalScore: 85,
      status: EvaluationStatus.DRAFT_SAVED,
      feedback: 'A confident redesign with clear reasoning. The flow reduces effort without hiding important choices.',
      strengths: 'Strong hierarchy on the payment step. Thoughtful error recovery.',
      improvementAreas: 'Empty and loading states need more attention. Add accessibility notes.',
      version: 1,
    },
  });

  // Populate criterion scores
  const rubricCriteria = await prisma.evaluationCriterion.findMany({
    where: { rubricId: rubricUIRedesign.id },
  });
  for (const c of rubricCriteria) {
    let scoreVal = 20;
    if (c.name === 'Visual Design') scoreVal = 20;
    if (c.name === 'User Experience') scoreVal = 22;
    if (c.name === 'Creativity') scoreVal = 17;
    if (c.name === 'Technical Execution') scoreVal = 18;
    if (c.name === 'Presentation') scoreVal = 8;

    await prisma.evaluationScore.upsert({
      where: {
        evaluationId_criterionId: {
          evaluationId: eval1024.id,
          criterionId: c.id,
        },
      },
      update: { score: scoreVal },
      create: {
        evaluationId: eval1024.id,
        criterionId: c.id,
        score: scoreVal,
      },
    });
  }

  // 12. Award Programme, Categories, Nominations, Voting
  const awardProg = await prisma.awardProgramme.upsert({
    where: { id: 'prog-2026' },
    update: {},
    create: {
      id: 'prog-2026',
      name: 'Annual Awards · Season 2026',
      year: '2026',
      description: 'Recognition that has been earned. Categories, nominees, voting rules and results published.',
      judgingDates: '21–30 Nov',
      resultsDate: '15 Dec',
      status: 'Open',
    },
  });

  const catPeoplesChoiceUI = await prisma.awardCategory.upsert({
    where: { id: 'cat-pc-ui' },
    update: {},
    create: {
      id: 'cat-pc-ui',
      programmeId: awardProg.id,
      name: 'People’s Choice · UI',
      description: 'Best interface of the season, chosen by free verified public voting.',
      isPublicVoting: true,
      status: 'Voting open',
    },
  });

  const catBestUX = await prisma.awardCategory.upsert({
    where: { id: 'cat-best-ux' },
    update: {},
    create: {
      id: 'cat-best-ux',
      programmeId: awardProg.id,
      name: 'Best UX Design',
      description: 'Research, flows and problem solving.',
      isPublicVoting: false,
      status: 'Nominees published',
    },
  });

  const nom1 = await prisma.nomination.upsert({
    where: { id: 'nom-checkout' },
    update: {},
    create: {
      id: 'nom-checkout',
      categoryId: catPeoplesChoiceUI.id,
      submissionId: sub1024.id,
      nomineeTitle: 'Checkout, simplified',
      nomineeName: 'Meera N.',
      description: 'A three-step checkout for a regional e-commerce brand. Redesign cut form fields by half and added clear error recovery.',
      status: NominationStatus.APPROVED,
      voteCount: 142,
    },
  });

  const nom2 = await prisma.nomination.upsert({
    where: { id: 'nom-wayfinder' },
    update: {},
    create: {
      id: 'nom-wayfinder',
      categoryId: catPeoplesChoiceUI.id,
      submissionId: subWayfinder.id,
      nomineeTitle: 'Wayfinder travel dashboard',
      nomineeName: 'Anjali R.',
      description: 'A trip-planning dashboard with clear typography and booking management.',
      status: NominationStatus.APPROVED,
      voteCount: 98,
    },
  });

  const nom3 = await prisma.nomination.upsert({
    where: { id: 'nom-finflow' },
    update: {},
    create: {
      id: 'nom-finflow',
      categoryId: catPeoplesChoiceUI.id,
      nomineeTitle: 'FinFlow onboarding',
      nomineeName: 'Team Parallel',
      description: 'Streamlined onboarding flow for personal savings app.',
      status: NominationStatus.APPROVED,
      voteCount: 115,
    },
  });

  // Create voting campaign
  await prisma.votingCampaign.upsert({
    where: { id: 'camp-pc-2026' },
    update: {},
    create: {
      id: 'camp-pc-2026',
      title: 'Public Choice Awards · 2026',
      categoryId: catPeoplesChoiceUI.id,
      startDate: new Date('2026-12-01T09:00:00Z'),
      endDate: new Date('2026-12-10T18:00:00Z'),
      status: 'Live',
    },
  });

  // 13. Certificates & Badges
  await prisma.certificate.upsert({
    where: { code: 'CERT-77421' },
    update: {},
    create: {
      code: 'CERT-77421',
      recipientId: participantAnjali.id,
      recipientName: 'Anjali R. and Team Parallel',
      awardTitle: 'Winner · Best Presentation',
      eventName: 'E-commerce Checkout Redesign',
      certType: 'Winner',
      status: CertificateStatus.ACTIVE,
      issuedAt: new Date('2026-11-14T09:00:00Z'),
    },
  });

  const badges = [
    { title: 'First submission', icon: '★', type: 'Participation' },
    { title: 'Three in a row', icon: '3', type: 'Participation' },
    { title: 'Finalist', icon: '◆', type: 'Finalist' },
    { title: 'Reviewer', icon: '✓', type: 'Recognition' },
    { title: 'Top 10', icon: '◎', type: 'Excellence' },
  ];
  for (const b of badges) {
    await prisma.achievementBadge.create({
      data: {
        userId: participantAnjali.id,
        title: b.title,
        icon: b.icon,
        badgeType: b.type,
      },
    });
  }

  // 14. Notifications
  const participantNotifications = [
    { title: 'Challenge ending soon', message: 'Speed UI: Mobile Checkout ends in 01h 25m.', link: '#submissions', isRead: false },
    { title: 'Submission deadline reminder', message: 'Weekly UI: Travel Dashboard closes 22 Nov, 6:00 PM.', link: '#submissions', isRead: false },
    { title: 'New challenge published', message: 'Fintech Onboarding UX (Daily) is open for registration.', link: '#details', isRead: false },
    { title: 'Team invitation', message: 'Sana K. invited you to join Studio Nila.', link: '#teams', isRead: false },
    { title: 'Challenge is live', message: 'Weekly UI: Travel Dashboard is now live.', link: '#registrations', isRead: true },
    { title: 'Evaluation published', message: 'Checkout, simplified scored 86 / 100.', link: '#evaluation', isRead: true },
  ];
  for (const n of participantNotifications) {
    await prisma.notification.create({
      data: {
        userId: participantAnjali.id,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.isRead,
      },
    });
  }

  const judgeNotifications = [
    { title: 'Three new submissions require evaluation', message: 'UI Redesign Challenge', link: '#submissions', isRead: false },
    { title: 'Evaluation deadline approaching', message: 'UI Redesign closes 22 Nov, 6:00 PM. 4 pending.', link: '#submissions', isRead: false },
    { title: 'New challenge assigned to you', message: 'Annual Awards Shortlist', link: '#challenge', isRead: false },
    { title: 'Your draft evaluation was saved', message: '#1031 · Wayfinder', link: '#rubric', isRead: true },
  ];
  for (const n of judgeNotifications) {
    await prisma.notification.create({
      data: {
        userId: judgeNikhil.id,
        title: n.title,
        message: n.message,
        link: n.link,
        isRead: n.isRead,
      },
    });
  }

  // 15. Audit Logs
  await prisma.auditLog.create({
    data: {
      adminId: superAdmin.id,
      adminName: 'Super Admin',
      action: 'Published results',
      module: 'Hackathon',
      record: 'HK-19 Civic Tech Jam',
      reason: 'Judging round finalized and certified.',
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: superAdmin.id,
      adminName: 'Super Admin',
      action: 'Suspended account',
      module: 'Participants',
      record: 'P-1044 Omar Khalil',
      reason: 'Repeated guideline violations reported.',
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: superAdmin.id,
      adminName: 'Super Admin',
      action: 'Changed rubric',
      module: 'Submissions',
      record: 'UI Redesign Challenge Rubric',
      reason: 'Adjusted presentation criteria weight.',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
