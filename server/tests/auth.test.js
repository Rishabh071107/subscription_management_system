import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test('POST /api/auth/signup creates account with CUSTOMER role and ignores injected ADMIN role', async () => {
  const testEmail = `cust_test_${Date.now()}@example.com`;
  const res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'StrongPass@2026!',
      firstName: 'Alice',
      lastName: 'Wonder',
      role: 'ADMIN' // Malicious attempt to elevate role
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.user.role, 'CUSTOMER'); // Must be CUSTOMER
  assert.equal(data.data.user.email, testEmail);
  assert.equal(data.data.user.password, undefined); // Password hash must never leak

  // Verify Set-Cookie header is present with HttpOnly
  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie, 'Set-Cookie header should be present');
  assert.ok(setCookie.includes('token='), 'Cookie should contain token');
  assert.ok(setCookie.toLowerCase().includes('httponly'), 'Cookie must be HttpOnly');

  // Verify in database that role is CUSTOMER
  const dbUser = await prisma.user.findUnique({ where: { email: testEmail } });
  assert.equal(dbUser.role, 'CUSTOMER');
});

test('POST /api/auth/login succeeds with valid credentials and sets HTTP-only cookie', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@brightloop.io',
      password: 'Brightloop@2026'
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.user.email, 'admin@brightloop.io');
  assert.equal(data.data.user.role, 'ADMIN');

  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie);
  assert.ok(setCookie.toLowerCase().includes('httponly'));
});

test('POST /api/auth/login returns generic 401 error on invalid password', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@brightloop.io',
      password: 'WrongPassword123!'
    })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Invalid email or password');
});

test('POST /api/auth/login returns generic 401 error on non-existent email', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'nonexistent_user_99999@brightloop.io',
      password: 'AnyPassword123!'
    })
  });

  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.message, 'Invalid email or password');
});

test('GET /api/auth/me returns current user using cookie authentication', async () => {
  // Step 1: Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'staff@brightloop.io',
      password: 'Staff@2026!'
    })
  });

  assert.equal(loginRes.status, 200);
  const cookieHeader = loginRes.headers.get('set-cookie');
  const tokenCookie = cookieHeader.split(';')[0];

  // Step 2: Call /api/auth/me with Cookie
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: {
      Cookie: tokenCookie
    }
  });

  assert.equal(meRes.status, 200);
  const meData = await meRes.json();
  assert.equal(meData.success, true);
  assert.equal(meData.data.user.email, 'staff@brightloop.io');
  assert.equal(meData.data.user.role, 'STAFF');
  assert.equal(meData.data.user.password, undefined);
});

test('POST /api/auth/logout clears the session cookie', async () => {
  const res = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST'
  });

  assert.equal(res.status, 200);
  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie);
  // Cookie cleared has token=; or expires in past
  assert.ok(setCookie.includes('token=;') || setCookie.includes('Expires=Thu, 01 Jan 1970'));
});

test('Password reset lifecycle: forgot-password then reset-password', async () => {
  const email = 'customer@acmecorp.com';
  // Step 1: Request reset
  const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  assert.equal(forgotRes.status, 200);
  const forgotData = await forgotRes.json();
  assert.equal(forgotData.success, true);
  const resetToken = forgotData.data?.resetToken;
  assert.ok(resetToken);

  // Step 2: Reset password
  const newPassword = 'NewSecretPass@2026!';
  const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: resetToken,
      newPassword
    })
  });

  assert.equal(resetRes.status, 200);

  // Step 3: Login with new password
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: newPassword
    })
  });

  assert.equal(loginRes.status, 200);

  // Restore original password for other tests
  await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  }).then(r => r.json()).then(d => {
    return fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: d.data.resetToken, newPassword: 'Customer@2026!' })
    });
  });
});

