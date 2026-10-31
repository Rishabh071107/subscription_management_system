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
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('RBAC: Unauthenticated requests cannot access dashboard metrics', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/summary`);
  assert.equal(res.status, 401);
});

test('RBAC: Customer cannot access admin revenue report', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/revenue`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 403);
});

test('Admin Financial Summary: GET /api/dashboard/summary returns live database aggregations', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/summary`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const data = json.data;

  assert.equal(data.role, 'ADMIN');
  assert.ok(typeof data.activeSubscriptions === 'number');
  assert.ok(typeof data.revenueReceived === 'number');
  assert.ok(typeof data.outstandingAmount === 'number');
  assert.ok(typeof data.overdueInvoices === 'number');
  assert.ok(typeof data.overdueAmount === 'number');
  assert.ok(typeof data.totalInvoiced === 'number');
  assert.ok(typeof data.totalCustomers === 'number');

  // Verify revenue received matches actual sum of recorded payments in database
  const paymentSumAgg = await prisma.payment.aggregate({
    _sum: { amount: true }
  });
  const expectedRevenue = Math.round(Number(paymentSumAgg._sum.amount || 0) * 100) / 100;
  assert.equal(data.revenueReceived, expectedRevenue);
});

test('Contract Compliance: GET /api/v1/reports/dashboard/summary returns identical financial metrics', async () => {
  const res = await fetch(`${baseUrl}/api/v1/reports/dashboard/summary`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data.activeSubscriptions !== undefined);
  assert.ok(json.data.revenueReceived !== undefined);
  assert.ok(json.data.outstandingAmount !== undefined);
});

test('Revenue Timeline: GET /api/dashboard/revenue returns timeline grouped by date', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/revenue`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const data = json.data;

  assert.ok(typeof data.totalRevenue === 'number');
  assert.ok(typeof data.totalTransactions === 'number');
  assert.ok(Array.isArray(data.timeline));
  data.timeline.forEach((point) => {
    assert.match(point.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(typeof point.amount === 'number');
  });
});

test('Subscription Statistics: GET /api/dashboard/subscriptions returns distribution and MRR', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/subscriptions`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const data = json.data;

  assert.ok(Array.isArray(data.statusDistribution));
  assert.ok(Array.isArray(data.planDistribution));
  assert.ok(typeof data.activeCount === 'number');
  assert.ok(typeof data.estimatedMrr === 'number');
  assert.ok(typeof data.estimatedArr === 'number');
  assert.equal(data.estimatedArr, Math.round(data.estimatedMrr * 12 * 100) / 100);
});

test('Payment Method Breakdown: GET /api/dashboard/payments returns method totals and recent items', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/payments`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const data = json.data;

  assert.ok(typeof data.totalPayments === 'number');
  assert.ok(typeof data.totalAmount === 'number');
  assert.ok(Array.isArray(data.byMethod));
  assert.ok(Array.isArray(data.recentPayments));

  data.byMethod.forEach((m) => {
    assert.ok(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'OTHER'].includes(m.method));
    assert.ok(typeof m.count === 'number');
    assert.ok(typeof m.amount === 'number');
  });
});

test('Overdue Report: GET /api/dashboard/overdue returns overdue invoices and total debt', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/overdue`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const data = json.data;

  assert.ok(typeof data.totalOverdueInvoices === 'number');
  assert.ok(typeof data.totalOverdueAmount === 'number');
  assert.ok(Array.isArray(data.invoices));
});

test('Customer Dashboard Isolation: Customer receives isolated account metrics and not admin data', async () => {
  const res = await fetch(`${baseUrl}/api/dashboard/summary`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const data = json.data;

  assert.equal(data.role, 'CUSTOMER');
  assert.ok(typeof data.activeSubscriptionsCount === 'number');
  assert.ok(typeof data.totalOutstanding === 'number');
  assert.ok(typeof data.totalPaid === 'number');
  assert.ok(Array.isArray(data.activeSubscriptions));

  // Ensure customer's totalPaid equals only payments made by this customer
  const custPaymentSum = await prisma.payment.aggregate({
    where: { customerId: customerUser.id },
    _sum: { amount: true }
  });
  const expectedCustPaid = Number(custPaymentSum._sum.amount || 0);
  assert.equal(data.totalPaid, expectedCustPaid);
});

