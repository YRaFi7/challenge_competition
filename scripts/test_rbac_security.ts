import http from 'http';

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
    redirect?: 'manual' | 'follow';
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

async function runTests() {
  console.log('--- STARTING RBAC SECURITY VERIFICATION SUITE ---\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, details || '');
      failed++;
    }
  }

  try {
    // 1. Unauthenticated Route Protection
    console.log('1. Testing Unauthenticated Route Protection (Middleware Redirection)...');
    
    const unauthParticipant = await makeRequest('/participant');
    assert(
      unauthParticipant.statusCode === 307 &&
      Boolean(unauthParticipant.headers.location?.includes('/auth/participant/login')),
      'Unauthenticated GET /participant redirects (307) to /auth/participant/login'
    );

    const unauthJudge = await makeRequest('/judge');
    assert(
      unauthJudge.statusCode === 307 &&
      Boolean(unauthJudge.headers.location?.includes('/auth/judge/login')),
      'Unauthenticated GET /judge redirects (307) to /auth/judge/login'
    );

    const unauthAdmin = await makeRequest('/admin');
    assert(
      unauthAdmin.statusCode === 307 &&
      Boolean(unauthAdmin.headers.location?.includes('/auth/admin/login')),
      'Unauthenticated GET /admin redirects (307) to /auth/admin/login'
    );

    // 2. Participant Registration & Strict Portal Access
    console.log('\n2. Testing Participant Flow & Cross-Portal Access Control...');
    const testPartEmail = `test_part_${Date.now()}@test.com`;
    const regPartRes = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'register',
        name: 'Auto Test Participant',
        email: testPartEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '9876543210',
        location: 'Bengaluru, India',
        qualification: 'B.Tech',
        role: 'PARTICIPANT',
        institution: 'Antigravity Test Lab',
      },
    });
    assert(regPartRes.statusCode === 200, 'Participant registration returns 200 OK');

    const partCookie = extractCookie(regPartRes.headers, 'pb_session_token');
    assert(Boolean(partCookie), 'Participant registration yields signed pb_session_token cookie');

    // Participant accessing /participant
    const partAccessOwn = await makeRequest('/participant', {
      headers: { Cookie: `pb_session_token=${partCookie}` },
    });
    assert(partAccessOwn.statusCode === 200, 'Authenticated participant CAN access /participant (200 OK)');

    // Participant attempting to access /judge
    const partAccessJudge = await makeRequest('/judge', {
      headers: { Cookie: `pb_session_token=${partCookie}` },
    });
    assert(
      partAccessJudge.statusCode === 307 &&
      partAccessJudge.headers.location?.includes('/unauthorized') &&
      partAccessJudge.headers.location?.includes('Judge'),
      'Participant attempting to access /judge is redirected (307) to /unauthorized?portal=Judge+Portal'
    );

    // Participant attempting to access /admin
    const partAccessAdmin = await makeRequest('/admin', {
      headers: { Cookie: `pb_session_token=${partCookie}` },
    });
    assert(
      partAccessAdmin.statusCode === 307 &&
      partAccessAdmin.headers.location?.includes('/unauthorized') &&
      partAccessAdmin.headers.location?.includes('Admin'),
      'Participant attempting to access /admin is redirected (307) to /unauthorized?portal=Admin+Portal'
    );

    // 3. Judge Registration, Pending Status & Approval Enforcement
    console.log('\n3. Testing Judge Registration & Approval Enforcement...');
    const testJudgeEmail = `test_judge_${Date.now()}@test.com`;
    const regJudgeRes = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'register',
        name: 'Auto Test Judge Candidate',
        email: testJudgeEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '9876543211',
        location: 'Bengaluru, India',
        qualification: 'M.Tech',
        role: 'JUDGE',
        expertise: ['AI & ML', 'Distributed Systems'],
        bio: 'Automated test judge for verifying pending approval gate.',
      },
    });
    const regJudgeBody = JSON.parse(regJudgeRes.body);
    assert(
      regJudgeRes.statusCode === 200 && regJudgeBody.pendingApproval === true,
      'Judge registration succeeds with pendingApproval: true'
    );
    assert(
      !extractCookie(regJudgeRes.headers, 'pb_session_token'),
      'Pending Judge is NOT issued a session token upon registration'
    );

    // Pending Judge attempting to login
    const loginPendingJudge = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'login',
        email: testJudgeEmail,
        password: 'Password123!',
        portal: 'judge',
      },
    });
    assert(
      loginPendingJudge.statusCode === 403 &&
      loginPendingJudge.body.includes('approval'),
      'Pending Judge login is blocked (403) with "Account awaiting approval" message'
    );

    // Seeded approved judge login
    const loginApprovedJudge = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'login',
        email: 'nikhil@mail.com',
        password: 'Password123!',
        portal: 'judge',
      },
    });
    assert(loginApprovedJudge.statusCode === 200, 'Approved Judge (nikhil@mail.com) can log in (200 OK)');
    const judgeCookie = extractCookie(loginApprovedJudge.headers, 'pb_session_token');
    assert(Boolean(judgeCookie), 'Approved Judge receives pb_session_token cookie');

    // Judge accessing /judge
    const judgeAccessOwn = await makeRequest('/judge', {
      headers: { Cookie: `pb_session_token=${judgeCookie}` },
    });
    assert(judgeAccessOwn.statusCode === 200, 'Approved Judge CAN access /judge (200 OK)');

    // Judge attempting to access /admin
    const judgeAccessAdmin = await makeRequest('/admin', {
      headers: { Cookie: `pb_session_token=${judgeCookie}` },
    });
    assert(
      judgeAccessAdmin.statusCode === 307 &&
      judgeAccessAdmin.headers.location?.includes('/unauthorized'),
      'Judge attempting to access /admin is blocked and redirected to /unauthorized'
    );

    // Judge attempting to access /participant
    const judgeAccessPart = await makeRequest('/participant', {
      headers: { Cookie: `pb_session_token=${judgeCookie}` },
    });
    assert(
      judgeAccessPart.statusCode === 307 &&
      judgeAccessPart.headers.location?.includes('/unauthorized'),
      'Judge attempting to access /participant is blocked and redirected to /unauthorized'
    );

    // 4. Admin Portal Protection & Admin Registration Prevention
    console.log('\n4. Testing Admin Portal & Registration Prevention...');
    // Attempting to register an admin via public API
    const regAdminRes = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'register',
        name: 'Hacker Admin',
        email: 'hacker@evil.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '9876543212',
        location: 'Nowhere',
        qualification: 'None',
        role: 'SUPER_ADMIN',
      },
    });
    assert(
      regAdminRes.statusCode === 403 &&
      regAdminRes.body.includes('Only 1 Administrator account is permitted'),
      'Public Admin registration is forbidden (403)'
    );

    // Legitimate Super Admin Login
    const loginAdminRes = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'login',
        email: 'admin@gmail.com',
        password: 'Admin@123',
        portal: 'admin',
      },
    });
    assert(loginAdminRes.statusCode === 200, 'Super Admin (admin@gmail.com) can log in (200 OK)');
    const adminCookie = extractCookie(loginAdminRes.headers, 'pb_session_token');
    assert(Boolean(adminCookie), 'Super Admin receives pb_session_token cookie');

    // Super Admin accessing /admin
    const adminAccessOwn = await makeRequest('/admin', {
      headers: { Cookie: `pb_session_token=${adminCookie}` },
    });
    assert(adminAccessOwn.statusCode === 200, 'Super Admin CAN access /admin (200 OK)');

    // Attempting to login to Admin portal with Participant credentials
    const partLoginAsAdmin = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'login',
        email: testPartEmail,
        password: 'Password123!',
        portal: 'admin',
      },
    });
    assert(
      partLoginAsAdmin.statusCode === 403 &&
      partLoginAsAdmin.body.includes('Access Denied: Only authorized administrators'),
      'Participant login to Admin portal is rejected with 403 Access Denied'
    );

    // 5. Public User / Voter Registration & Portal Access
    console.log('\n5. Testing Public User / Voter Flow...');
    const testVoterEmail = `test_voter_${Date.now()}@test.com`;
    const regVoterRes = await makeRequest('/api/auth', {
      method: 'POST',
      body: {
        action: 'register',
        name: 'Community Voter',
        email: testVoterEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phone: '9876543213',
        location: 'Bengaluru, India',
        qualification: 'B.A',
        role: 'PUBLIC_USER',
      },
    });
    assert(regVoterRes.statusCode === 200, 'Public User registration succeeds (200 OK)');
    const voterCookie = extractCookie(regVoterRes.headers, 'pb_session_token');

    // Public user attempting to access /admin
    const voterAccessAdmin = await makeRequest('/admin', {
      headers: { Cookie: `pb_session_token=${voterCookie}` },
    });
    assert(
      voterAccessAdmin.statusCode === 307 &&
      voterAccessAdmin.headers.location?.includes('/unauthorized'),
      'Public user accessing /admin is redirected to /unauthorized'
    );

    // Public user attempting to access /judge
    const voterAccessJudge = await makeRequest('/judge', {
      headers: { Cookie: `pb_session_token=${voterCookie}` },
    });
    assert(
      voterAccessJudge.statusCode === 307 &&
      voterAccessJudge.headers.location?.includes('/unauthorized'),
      'Public user accessing /judge is redirected to /unauthorized'
    );

    // Public user attempting to access /participant
    const voterAccessParticipant = await makeRequest('/participant', {
      headers: { Cookie: `pb_session_token=${voterCookie}` },
    });
    assert(
      voterAccessParticipant.statusCode === 307 &&
      voterAccessParticipant.headers.location?.includes('/unauthorized'),
      'Public user accessing /participant is redirected to /unauthorized'
    );

    console.log(`\n==========================================`);
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log(`==========================================`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
