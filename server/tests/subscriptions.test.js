import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

let server;
let baseUrl;
let adminCookie;
let staffCookie;
let customerCookie;
let customerUser;
let testProduct;
let testPlan;
let createdSubId;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  // Login Admin
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@brightloop.io', password: 'Brightloop@2026' })
  });
  adminCookie = adminRes.headers.get('set-cookie')?.split(';')[0];

  // Login Staff
  const staffRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@brightloop.io', password: 'Staff@2026!' })
  });
  staffCookie = staffRes.headers.get('set-cookie')?.split(';')[0];

  // Login Customer
  const custRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@acmecorp.com', password: 'Customer@2026!' })
  });
  customerCookie = custRes.headers.get('set-cookie')?.split(';')[0];

  customerUser = await prisma.user.findUnique({
    where: { email: 'customer@acmecorp.com' }
  });

  testProduct = await prisma.product.findFirst({
    where: { isActive: true }
  });

  testPlan = await prisma.plan.findFirst({
    where: { status: 'ACTIVE' }
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/subscriptions - creates subscription with lines and sequential number', async () => {
  const payload = {
    customerId: customerUser.id,
    planId: testPlan.id,
    paymentTerms: 'Net 15',
    autoRenew: true,
    lines: [
      {
        productId: testProduct.id,
        quantity: 1,
        unitPrice: 50,
        taxRate: 18
      }
    ]
  };

  const res = await fetch(`${baseUrl}/api/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': staffCookie
    },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.subscription.id);
  assert.match(data.data.subscription.subscriptionNumber, /^SUB-\d{4}-\d{4}$/);
  assert.equal(data.data.subscription.status, 'CONFIRMED');
  assert.equal(Number(data.data.subscription.subtotal), 50);
  assert.equal(Number(data.data.subscription.taxAmount), 9);
  assert.equal(Number(data.data.subscription.totalAmount), 59);

  createdSubId = data.data.subscription.id;
});

test('GET /api/subscriptions - lists subscriptions with pagination', async () => {
  const res = await fetch(`${baseUrl}/api/subscriptions?page=1&limit=10`, {
    headers: { 'Cookie': staffCookie }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.meta.total >= 1);
});

test('GET /api/subscriptions/:id - retrieves subscription details', async () => {
  const res = await fetch(`${baseUrl}/api/subscriptions/${createdSubId}`, {
    headers: { 'Cookie': adminCookie }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.subscription.id, createdSubId);
  assert.equal(data.data.subscription.lines.length, 1);
});

test('PATCH /api/subscriptions/:id/lifecycle - activates confirmed subscription', async () => {
  const res = await fetch(`${baseUrl}/api/subscriptions/${createdSubId}/lifecycle`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': staffCookie
    },
    body: JSON.stringify({ action: 'ACTIVATE' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.data.subscription.status, 'ACTIVE');
});

test('PATCH /api/subscriptions/:id/lifecycle - pauses active subscription', async () => {
  const res = await fetch(`${baseUrl}/api/subscriptions/${createdSubId}/lifecycle`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': staffCookie
    },
    body: JSON.stringify({ action: 'PAUSE' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.data.subscription.status, 'PAUSED');
  assert.ok(data.data.subscription.pausedAt);
});

test('PATCH /api/subscriptions/:id/lifecycle - resumes paused subscription', async () => {
  const res = await fetch(`${baseUrl}/api/subscriptions/${createdSubId}/lifecycle`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': staffCookie
    },
    body: JSON.stringify({ action: 'RESUME' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.data.subscription.status, 'ACTIVE');
  assert.equal(data.data.subscription.pausedAt, null);
});

test('PATCH /api/subscriptions/:id/lifecycle - closes subscription', async () => {
  const res = await fetch(`${baseUrl}/api/subscriptions/${createdSubId}/lifecycle`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': staffCookie
    },
    body: JSON.stringify({ action: 'CLOSE', reason: 'Customer requested cancellation' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.data.subscription.status, 'CLOSED');
  assert.equal(data.data.subscription.closureReason, 'Customer requested cancellation');
});

test('PATCH /api/subscriptions/:id/lifecycle - renews closed subscription', async () => {
  const res = await fetch(`${baseUrl}/api/subscriptions/${createdSubId}/lifecycle`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': staffCookie
    },
    body: JSON.stringify({ action: 'RENEW' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.data.subscription.status, 'ACTIVE');
  assert.equal(data.data.subscription.closedAt, null);
});
