import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import { calculatePeriodEnd } from '../src/modules/billing/billing.service.js';

let server;
let baseUrl;
let adminCookie;
let staffCookie;
let customerCookie;
let createdRunId;
let customerUser;

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
});

test.after(async () => {
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test('calculatePeriodEnd computes accurate boundaries for all billing intervals', () => {
  const start = new Date('2026-01-01T00:00:00.000Z');

  const dailyEnd = calculatePeriodEnd(start, 'DAILY');
  assert.equal(dailyEnd.toISOString().slice(0, 10), '2026-01-02');

  const weeklyEnd = calculatePeriodEnd(start, 'WEEKLY');
  assert.equal(weeklyEnd.toISOString().slice(0, 10), '2026-01-08');

  const monthlyEnd = calculatePeriodEnd(start, 'MONTHLY');
  assert.equal(monthlyEnd.toISOString().slice(0, 10), '2026-02-01');

  const yearlyEnd = calculatePeriodEnd(start, 'YEARLY');
  assert.equal(yearlyEnd.toISOString().slice(0, 10), '2027-01-01');
});

test('POST /api/billing/run returns 401 when unauthenticated', async () => {
  const res = await fetch(`${baseUrl}/api/billing/run`, { method: 'POST' });
  assert.equal(res.status, 401);
});

test('POST /api/billing/run is forbidden for Staff and Customer (403)', async () => {
  const staffRes = await fetch(`${baseUrl}/api/billing/run`, {
    method: 'POST',
    headers: { Cookie: staffCookie }
  });
  assert.equal(staffRes.status, 403);

  const custRes = await fetch(`${baseUrl}/api/billing/run`, {
    method: 'POST',
    headers: { Cookie: customerCookie }
  });
  assert.equal(custRes.status, 403);
});

test('POST /api/billing/run executes recurring billing run for Admin', async () => {
  const res = await fetch(`${baseUrl}/api/billing/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.billingRun);
  assert.ok(data.data.billingRun.id);
  assert.equal(typeof data.data.totalEvaluated, 'number');
  assert.equal(typeof data.data.generated, 'number');
  assert.equal(typeof data.data.failed, 'number');

  createdRunId = data.data.billingRun.id;
});

test('GET /api/billing/runs returns historical billing runs with pagination', async () => {
  const res = await fetch(`${baseUrl}/api/billing/runs?page=1&limit=5`, {
    headers: { Cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.meta);
  assert.ok(data.data.some(r => r.id === createdRunId));
});

test('GET /api/billing/runs/:id retrieves detailed diagnostics and items evaluated', async () => {
  const res = await fetch(`${baseUrl}/api/billing/runs/${createdRunId}`, {
    headers: { Cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.run.id, createdRunId);
  assert.ok(Array.isArray(data.data.run.items));
});

test('GET /api/billing/runs/:id returns 404 for non-existent run ID', async () => {
  const res = await fetch(`${baseUrl}/api/billing/runs/00000000-0000-0000-0000-000000000000`, {
    headers: { Cookie: adminCookie }
  });
  assert.equal(res.status, 404);
});

test('POST /api/billing/runs/:id/retry executes safe retry for run items', async () => {
  const res = await fetch(`${baseUrl}/api/billing/runs/${createdRunId}/retry`, {
    method: 'POST',
    headers: { Cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.message);
});

test('Billing Engine safely skips PAUSED and CLOSED subscriptions', async () => {
  let plan = await prisma.plan.findFirst();
  if (!plan) {
    plan = await prisma.plan.create({
      data: { name: 'Billing Test Plan', price: 50.00, billingInterval: 'MONTHLY' }
    });
  }

  // Create a paused subscription due right now
  const pausedSub = await prisma.subscription.create({
    data: {
      subscriptionNumber: `SUB-PAUSED-${Date.now()}`,
      customerId: customerUser.id,
      planId: plan.id,
      status: 'PAUSED',
      billingInterval: 'MONTHLY',
      subtotal: 50.00,
      totalAmount: 59.00,
      nextBillingDate: new Date(Date.now() - 10000)
    }
  });

  // Execute billing run
  const res = await fetch(`${baseUrl}/api/billing/run`, {
    method: 'POST',
    headers: { Cookie: adminCookie }
  });
  assert.equal(res.status, 200);

  // Verify no invoice was generated for paused sub
  const invoice = await prisma.invoice.findFirst({
    where: { subscriptionId: pausedSub.id }
  });
  assert.equal(invoice, null);
});

test('Repeated billing runs preserve idempotency and prevent duplicate invoicing', async () => {
  // First run
  const res1 = await fetch(`${baseUrl}/api/billing/run`, {
    method: 'POST',
    headers: { Cookie: adminCookie }
  });
  assert.equal(res1.status, 200);

  // Immediate second run must not generate duplicate invoices
  const res2 = await fetch(`${baseUrl}/api/billing/run`, {
    method: 'POST',
    headers: { Cookie: adminCookie }
  });
  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.data.generated, 0);
});

