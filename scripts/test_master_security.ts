import http from 'http';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

interface RequestResult {
  statusCode: number;
  headers: http.IncomingHttpHeaders;
  body: string;
}

function makeRequest(
  urlPath: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<RequestResult> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const postData = options.body ? JSON.stringify(options.body) : undefined;

    const reqHeaders: Record<string, string> = {
      ...(options.headers || {}),
    };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData).toString();
    }

    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            body: data,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function extractCookie(headers: http.IncomingHttpHeaders, cookieName: string): string | undefined {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return undefined;
  for (const cookieStr of setCookie) {
    const match = cookieStr.match(new RegExp(`${cookieName}=([^;]+)`));
    if (match) return match[1];
  }
  return undefined;
}

async function runMasterSecurityTests() {
  console.log('================================================================');
  console.log('   MASTER IMPLEMENTATION VERIFICATION — SECURITY & VOTING       ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, details ? `\n   Details: ${JSON.stringify(details)}` : '');
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Strict 10-Digit Phone Number Rule
    // -------------------------------------------------------------
    console.log('--- TEST 1: Strict 10-Digit Phone Number Validation ---');
    
    // 1a. Less than 10 digits
    const resShortPhone = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'register',
        firstName: 'John',
        lastName: 'Doe',
        location: 'Bengaluru, India',
        qualification: 'Bachelor of Technology (B.Tech / BE)',
        email: `short_phone_${Date.now()}@test.com`,
        phone: '987654321', // 9 digits
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'PARTICIPANT',
      },
    });
    assert(
      resShortPhone.statusCode === 400 &&
      resShortPhone.body.includes('Please enter a valid 10-digit phone number.'),
      'Registration with 9-digit phone is rejected with exact 400 message: "Please enter a valid 10-digit phone number."'
    );

    // 1b. Non-digit characters
    const resAlphaPhone = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'register',
        firstName: 'John',
        lastName: 'Doe',
        location: 'Bengaluru, India',
        qualification: 'Bachelor of Technology (B.Tech / BE)',
        email: `alpha_phone_${Date.now()}@test.com`,
        phone: '98765abc10',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'PARTICIPANT',
      },
    });
    assert(
      resAlphaPhone.statusCode === 400 &&
      resAlphaPhone.body.includes('Please enter a valid 10-digit phone number.'),
      'Registration with letters in phone is rejected with exact 400 message'
    );

    // 1c. More than 10 digits
    const resLongPhone = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'register',
        firstName: 'John',
        lastName: 'Doe',
        location: 'Bengaluru, India',
        qualification: 'Bachelor of Technology (B.Tech / BE)',
        email: `long_phone_${Date.now()}@test.com`,
        phone: '987654321012',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'PARTICIPANT',
      },
    });
    assert(
      resLongPhone.statusCode === 400 &&
      resLongPhone.body.includes('Please enter a valid 10-digit phone number.'),
      'Registration with 12-digit phone is rejected'
    );

    // -------------------------------------------------------------
    // TEST 2: Password Mismatch Validation
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Password Matching Validation ---');
    const resMismatch = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'register',
        firstName: 'Alice',
        lastName: 'Wonder',
        location: 'Bengaluru, India',
        qualification: 'Bachelor of Science (B.Sc / BS)',
        email: `mismatch_${Date.now()}@test.com`,
        phone: '9876543210',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword456!',
        role: 'PARTICIPANT',
      },
    });
    assert(
      resMismatch.statusCode === 400 &&
      resMismatch.body.includes('Passwords do not match'),
      'Registration with mismatched confirmPassword is rejected'
    );

    // -------------------------------------------------------------
    // TEST 3: Complete 9 Registration Fields Stored in Database
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: 9 Registration Fields & DB Persistence ---');
    const partEmail = `master_part_${Date.now()}@test.com`;
    const regPartRes = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'register',
        firstName: 'Alex',
        lastName: 'Rivera',
        location: 'Bengaluru, India',
        qualification: 'Master of Technology (M.Tech / ME)',
        phone: '9123456780',
        email: partEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        profilePicture: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        role: 'PARTICIPANT',
      },
    });
    assert(regPartRes.statusCode === 200, 'Valid Participant registration returns 200 OK');

    // Verify in database
    const dbPart = await prisma.user.findUnique({
      where: { email: partEmail },
    });
    assert(
      dbPart !== null &&
      dbPart.firstName === 'Alex' &&
      dbPart.lastName === 'Rivera' &&
      dbPart.location === 'Bengaluru, India' &&
      dbPart.qualification === 'Master of Technology (M.Tech / ME)' &&
      dbPart.phone === '9123456780' &&
      dbPart.profilePicture !== null &&
      dbPart.role === 'PARTICIPANT',
      'All 9 registration fields correctly saved in PostgreSQL User model'
    );

    // -------------------------------------------------------------
    // TEST 4: Login Exact Messages
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Login Exact Response Messages ---');

    // 4a. Unregistered email
    const loginNotFound = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'login',
        email: 'nonexistent_user_999@test.com',
        password: 'Password123!',
        portal: 'participant',
      },
    });
    assert(
      loginNotFound.statusCode === 404 &&
      loginNotFound.body.includes('Account not found. Please register first.'),
      'Unregistered email returns 404: "Account not found. Please register first."'
    );

    // 4b. Invalid password
    const loginBadPass = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'login',
        email: partEmail,
        password: 'WrongPassword999!',
        portal: 'participant',
      },
    });
    assert(
      loginBadPass.statusCode === 401 &&
      loginBadPass.body.includes('Invalid email address or password. Please try again.'),
      'Wrong password returns 401: "Invalid email address or password. Please try again."'
    );

    // 4c. Pending judge approval
    const judgeEmail = `master_judge_${Date.now()}@test.com`;
    await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'register',
        firstName: 'Elena',
        lastName: 'Rostova',
        location: 'Cambridge, MA, USA',
        phone: '9888877770',
        email: judgeEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        qualification: 'Doctorate (Ph.D.)',
        role: 'JUDGE',
        expertise: ['AI & Neural Nets'],
      },
    });
    const loginJudgePending = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'login',
        email: judgeEmail,
        password: 'Password123!',
        portal: 'judge',
      },
    });
    assert(
      loginJudgePending.statusCode === 403 &&
      loginJudgePending.body.includes('Your account is awaiting administrator approval.'),
      'Pending Judge login returns 403: "Your account is awaiting administrator approval."'
    );

    // 4d. Suspended account
    const suspendedEmail = `suspended_${Date.now()}@test.com`;
    await prisma.user.create({
      data: {
        name: 'Suspended User',
        email: suspendedEmail,
        passwordHash: 'Password123!',
        role: 'PARTICIPANT',
        accountStatus: 'SUSPENDED',
      },
    });
    const loginSuspended = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'login',
        email: suspendedEmail,
        password: 'Password123!',
        portal: 'participant',
      },
    });
    assert(
      loginSuspended.statusCode === 403 &&
      loginSuspended.body.includes('Your account has been suspended. Please contact the administrator.'),
      'Suspended user login returns 403: "Your account has been suspended. Please contact the administrator."'
    );

    // 4e. Successful Login
    const loginSuccess = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'login',
        email: partEmail,
        password: 'Password123!',
        portal: 'participant',
      },
    });
    assert(
      loginSuccess.statusCode === 200 &&
      loginSuccess.body.includes('Login successful. Welcome back!'),
      'Successful login returns 200: "Login successful. Welcome back!"'
    );
    const partCookie = extractCookie(loginSuccess.headers, 'pb_session_token');
    assert(Boolean(partCookie), 'Successful login sets pb_session_token session cookie');

    // -------------------------------------------------------------
    // TEST 5: Password Recovery / Reset Flow
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Forgot Password & Recovery Flow ---');
    const forgotRes = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'forgot_password',
        email: partEmail,
      },
    });
    const forgotBody = JSON.parse(forgotRes.body);
    const resetCode = forgotBody.demoCode || forgotBody.resetCode;
    assert(
      forgotRes.statusCode === 200 && Boolean(resetCode),
      'Forgot password generates verification OTP code'
    );

    const resetRes = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'reset_password',
        email: partEmail,
        code: resetCode,
        newPassword: 'BrandNewPassword123!',
      },
    });
    assert(
      resetRes.statusCode === 200 &&
      resetRes.body.includes('Password has been reset successfully. You can now log in with your new password.'),
      'Reset password with valid code succeeds'
    );

    // Verify login with new password works
    const loginWithNewPass = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'login',
        email: partEmail,
        password: 'BrandNewPassword123!',
        portal: 'participant',
      },
    });
    assert(loginWithNewPass.statusCode === 200, 'Login with new password succeeds');

    // -------------------------------------------------------------
    // TEST 6: Public Voting Registered Email Verification
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Public Voting Email Verification ---');
    
    // Register a Public User
    const voterEmail = `verified_voter_${Date.now()}@test.com`;
    const regVoter = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'register',
        firstName: 'Devon',
        lastName: 'Miles',
        location: 'Austin, TX, USA',
        qualification: 'Bachelor of Arts (BA)',
        phone: '9555544440',
        email: voterEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'PUBLIC_USER',
      },
    });
    assert(regVoter.statusCode === 200, 'Public voter registered successfully');
    const voterCookie = extractCookie(regVoter.headers, 'pb_session_token');

    // Unauthenticated user attempting to vote
    const unauthVote = await makeRequest('/api/voting', {
      method: 'POST',
      body: {
        nominationId: 'nom-1',
        email: voterEmail,
      },
    });
    assert(
      unauthVote.statusCode === 401 &&
      (unauthVote.body.includes('Authentication required') || unauthVote.body.includes('sign in')),
      'Unauthenticated voting rejected with 401'
    );

    // Mismatched email verification
    const mismatchVote = await makeRequest('/api/voting', {
      method: 'POST',
      headers: { Cookie: `pb_session_token=${voterCookie}` },
      body: {
        nominationId: 'nom-1',
        email: 'different_wrong_email@test.com',
      },
    });
    assert(
      mismatchVote.statusCode === 400 &&
      mismatchVote.body.includes('Invalid Email Address. Please enter the email address you used during registration.'),
      'Email mismatch in voting rejected with exact message: "Invalid Email Address. Please enter the email address you used during registration."'
    );

    // -------------------------------------------------------------
    // TEST 7: Successful Vote & One-Person-One-Vote Protection
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: One-Person-One-Vote Protection & Category Integrity ---');

    // First get nominations from DB to test with real database IDs
    const nominations = await prisma.nomination.findMany({
      take: 5,
      include: { category: true },
    });
    console.log(`Found ${nominations.length} nominations in database.`);

    let prog = await prisma.awardProgramme.findFirst();
    if (!prog) {
      prog = await prisma.awardProgramme.create({
        data: {
          name: 'Annual National Awards 2026',
          year: '2026',
        },
      });
    }

    if (nominations.length < 2) {
      let cat = await prisma.awardCategory.findFirst();
      if (!cat) {
        cat = await prisma.awardCategory.create({
          data: {
            programmeId: prog.id,
            name: 'Best AI Project',
            description: 'AI Project Award',
          },
        });
      }
      const newNom1 = await prisma.nomination.create({
        data: {
          categoryId: cat.id,
          nomineeName: 'AI Prototype A',
          nomineeTitle: 'Project Alpha',
        },
      });
      const newNom2 = await prisma.nomination.create({
        data: {
          categoryId: cat.id,
          nomineeName: 'AI Prototype B',
          nomineeTitle: 'Project Beta',
        },
      });
      nominations.push(newNom1 as any, newNom2 as any);
    }

    const firstNom = nominations[0];
    let sameCatNom = nominations.find((n) => n.categoryId === firstNom.categoryId && n.id !== firstNom.id);
    if (!sameCatNom) {
      sameCatNom = (await prisma.nomination.create({
        data: {
          categoryId: firstNom.categoryId,
          nomineeName: 'Same Category Alternate Nominee',
          nomineeTitle: 'Project Same Category',
        },
      })) as any;
    }
    let diffCatNom = nominations.find((n) => n.categoryId !== firstNom.categoryId);
    if (!diffCatNom) {
      const diffCat = await prisma.awardCategory.create({
        data: {
          programmeId: prog.id,
          name: `Design Excellence ${Date.now()}`,
          description: 'Design Award',
        },
      });
      diffCatNom = await prisma.nomination.create({
        data: {
          categoryId: diffCat.id,
          nomineeName: 'Design System Pro',
          nomineeTitle: 'Design Pro',
        },
      }) as any;
    }

    // First legitimate vote
    const validVote = await makeRequest('/api/voting', {
      method: 'POST',
      headers: { Cookie: `pb_session_token=${voterCookie}` },
      body: {
        action: 'cast_vote',
        nominationId: firstNom.id,
        email: voterEmail,
      },
    });
    assert(
      validVote.statusCode === 200 &&
      validVote.body.includes('Vote recorded successfully!'),
      'First vote in category succeeds with 200: "Vote recorded successfully!"',
      { status: validVote.statusCode, body: validVote.body }
    );

    // Attempt duplicate vote in SAME category (even with different nomination in that category)
    const duplicateVote = await makeRequest('/api/voting', {
      method: 'POST',
      headers: { Cookie: `pb_session_token=${voterCookie}` },
      body: {
        action: 'cast_vote',
        nominationId: sameCatNom.id, // Same category
        email: voterEmail,
      },
    });
    assert(
      duplicateVote.statusCode === 400 &&
      duplicateVote.body.includes('You have already voted. Multiple votes are not allowed.'),
      'Duplicate vote in same category rejected with exact message: "You have already voted. Multiple votes are not allowed."',
      { status: duplicateVote.statusCode, body: duplicateVote.body }
    );

    // Vote in a DIFFERENT category
    const differentCategoryVote = await makeRequest('/api/voting', {
      method: 'POST',
      headers: { Cookie: `pb_session_token=${voterCookie}` },
      body: {
        action: 'cast_vote',
        nominationId: diffCatNom!.id, // Different category
        email: voterEmail,
      },
    });
    assert(
      differentCategoryVote.statusCode === 200 &&
      differentCategoryVote.body.includes('Vote recorded successfully!'),
      'Vote in distinct award category succeeds',
      { status: differentCategoryVote.statusCode, body: differentCategoryVote.body }
    );

    // Verify GET /api/voting returns user status & voted category
    const getVotingStatus = await makeRequest('/api/voting', {
      headers: { Cookie: `pb_session_token=${voterCookie}` },
    });
    const statusBody = JSON.parse(getVotingStatus.body);
    assert(
      getVotingStatus.statusCode === 200 &&
      statusBody.currentUser?.email === voterEmail &&
      Array.isArray(statusBody.userVotes) &&
      statusBody.userVotes.some((v: any) => v.categoryId === firstNom.categoryId),
      'GET /api/voting returns user session and lists voted categories for disabled "✓ Voted" UI rendering'
    );

    // -------------------------------------------------------------
    // TEST 8: Welcome Page Registration Required Popup & Redirections
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Welcome Page Modal & Redirection Routes ---');
    const welcomeRes = await makeRequest('/');
    assert(
      welcomeRes.statusCode === 200 &&
      welcomeRes.body.includes('Registration Required') &&
      welcomeRes.body.includes('Please register first to access this feature.'),
      'Welcome page includes Registration Required modal structure with required text'
    );

    console.log(`\n================================================================`);
    console.log(`MASTER TEST SUITE SUMMARY`);
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log(`================================================================`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during test suite:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMasterSecurityTests();
