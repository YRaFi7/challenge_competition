import assert from 'assert';

async function verifyNewUserRequests() {
  console.log('Testing New User Requests...');

  // 1. Test Participant Registration & Login
  const partEmail = `test_part_${Date.now()}@participant.com`;
  const partRes = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      role: 'PARTICIPANT',
      firstName: 'Anjali',
      lastName: 'Ramesh',
      location: 'Thrissur, India',
      qualification: 'B.Des, Product Design',
      email: partEmail,
      phone: '9846001234',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    }),
  });
  const partData = await partRes.json();
  assert.strictEqual(partRes.status, 200);
  assert.strictEqual(partData.success, true);
  console.log('✅ PASS: Participant registered successfully (200)');

  // 2. Test Public Registration (5 fields, no images)
  const pubEmail = `pub_${Date.now()}@voter.com`;
  const pubRes = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      role: 'PUBLIC_USER',
      name: 'Rohan Sharma',
      email: pubEmail,
      phone: '9876543210',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    }),
  });
  const pubData = await pubRes.json();
  assert.strictEqual(pubRes.status, 200);
  assert.strictEqual(pubData.success, true);
  console.log('✅ PASS: Public registration with 5 fields (no images) succeeded (200)');

  // 3. Test Judge Registration (7 fields)
  const judgeEmail = `judge_${Date.now()}@jury.com`;
  const judgeRes = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      role: 'JUDGE',
      firstName: 'Vikram',
      lastName: 'Seth',
      qualification: 'Doctorate (Ph.D.)',
      email: judgeEmail,
      phone: '9812345670',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    }),
  });
  const judgeData = await judgeRes.json();
  assert.strictEqual(judgeRes.status, 200);
  assert.strictEqual(judgeData.pendingApproval, true);
  console.log('✅ PASS: Judge registration with 7 fields succeeded with pendingApproval: true (200)');

  // 4. Test Unified Login - asks for email & password, directs to own respected pages
  // 4a. Participant
  const partLogin = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: partEmail, password: 'Password123!' }),
  });
  const partLoginData = await partLogin.json();
  assert.strictEqual(partLoginData.redirectUrl, '/participant');
  console.log('✅ PASS: Participant login directs to /participant');

  // 4b. Judge (approved)
  const approvedJudgeLogin = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: 'nikhil@mail.com', password: 'Password123!' }),
  });
  const approvedJudgeData = await approvedJudgeLogin.json();
  assert.strictEqual(approvedJudgeData.redirectUrl, '/judge');
  console.log('✅ PASS: Judge login directs to /judge');

  // 4c. Public
  const pubLogin = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: pubEmail, password: 'Password123!' }),
  });
  const pubLoginData = await pubLogin.json();
  assert.strictEqual(pubLoginData.redirectUrl, '/public');
  console.log('✅ PASS: Public user login directs to /public');

  // 4d. Admin
  const adminLogin = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email: 'admin@gmail.com', password: 'Admin@123' }),
  });
  const adminLoginData = await adminLogin.json();
  assert.strictEqual(adminLoginData.redirectUrl, '/admin');
  console.log('✅ PASS: Admin login (admin@gmail.com / Admin@123) directs to /admin');

  // 5. Test Public voting email verification
  const pubCookie = pubRes.headers.get('set-cookie')?.split(';')[0];
  const mismatchVote = await fetch('http://localhost:3000/api/voting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: pubCookie || '' },
    body: JSON.stringify({ action: 'send_code', email: 'wrong_email@test.com', nominationId: 'nom-1' }),
  });
  const mismatchData = await mismatchVote.json();
  assert.strictEqual(mismatchVote.status, 400);
  assert.strictEqual(mismatchData.error, 'Invalid Email Address. Please enter the email address you used during registration.');
  console.log('✅ PASS: Voting email mismatch rejected with exact message');

  const matchVote = await fetch('http://localhost:3000/api/voting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: pubCookie || '' },
    body: JSON.stringify({ action: 'send_code', email: pubEmail, nominationId: 'nom-1' }),
  });
  const matchData = await matchVote.json();
  assert.strictEqual(matchVote.status, 200);
  assert.strictEqual(matchData.success, true);
  console.log('✅ PASS: Voting email matching registered email accepted with verification code');

  // 6. Test Max 1 Admin Policy Enforcement
  const tryRegisterAdmin = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      role: 'ADMIN',
      name: 'Second Admin',
      email: 'admin2@gmail.com',
      phone: '9876543299',
      password: 'AdminPassword123!',
      confirmPassword: 'AdminPassword123!',
    }),
  });
  assert.strictEqual(tryRegisterAdmin.status, 403);
  const tryRegisterData = await tryRegisterAdmin.json();
  assert.strictEqual(tryRegisterData.error.includes('Only 1 Administrator account is permitted'), true);
  console.log('✅ PASS: Registering a second admin is strictly rejected with 403 (Max 1 Admin policy)');

  console.log('\n🎉 ALL USER REQUIREMENTS FULLY VERIFIED AND PASSING 100%!');
}

verifyNewUserRequests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
