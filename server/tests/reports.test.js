import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

let server;
let baseUrl;
let adminCookie;
let staffCookie;
let customerCookie;

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
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('RBAC: Unauthenticated requests cannot access reports', async () => {
  const endpoints = ['/subscriptions', '/invoices', '/payments', '/revenue'];
  for (const ep of endpoints) {
    const res = await fetch(`${baseUrl}/api/reports${ep}`);
    assert.equal(res.status, 401);
  }
});

test('RBAC: Customers are forbidden from accessing financial reports', async () => {
  const endpoints = ['/subscriptions', '/invoices', '/payments', '/revenue'];
  for (const ep of endpoints) {
    const res = await fetch(`${baseUrl}/api/reports${ep}`, {
      headers: { cookie: customerCookie }
    });
    assert.equal(res.status, 403);
  }
});

test('Subscription Report: GET /api/reports/subscriptions returns summaries and cohorts', async () => {
  const res = await fetch(`${baseUrl}/api/reports/subscriptions`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();

  assert.ok(Array.isArray(json.data));
  assert.ok(json.summary);
  assert.ok(typeof json.summary.totalSubscriptions === 'number');
  assert.ok(typeof json.summary.activeSubscriptions === 'number');
  assert.ok(typeof json.summary.estimatedMrr === 'number');
  assert.ok(typeof json.summary.estimatedArr === 'number');
  assert.ok(Array.isArray(json.summary.statusDistribution));
  assert.ok(Array.isArray(json.summary.planDistribution));
  assert.ok(json.pagination);
});

test('Subscription Report: Supports status filter and pagination', async () => {
  const res = await fetch(`${baseUrl}/api/reports/subscriptions?status=ACTIVE&page=1&limit=5`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();

  assert.ok(Array.isArray(json.data));
  json.data.forEach((sub) => {
    assert.equal(sub.status, 'ACTIVE');
  });
  assert.equal(json.pagination.page, 1);
  assert.equal(json.pagination.limit, 5);
});

test('Subscription Report: CSV export returns text/csv header and attachment', async () => {
  const res = await fetch(`${baseUrl}/api/reports/subscriptions?export=csv`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/csv/);
  assert.match(res.headers.get('content-disposition'), /attachment; filename="subscription-report-/);
  const text = await res.text();
  assert.match(text, /^Subscription #,Customer Name,Customer Email/);
});

test('Invoice Report: GET /api/reports/invoices returns billing reconciliations and metrics', async () => {
  const res = await fetch(`${baseUrl}/api/reports/invoices`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();

  assert.ok(Array.isArray(json.data));
  assert.ok(json.summary);
  assert.ok(typeof json.summary.totalInvoices === 'number');
  assert.ok(typeof json.summary.totalBilled === 'number');
  assert.ok(typeof json.summary.totalPaid === 'number');
  assert.ok(typeof json.summary.totalOutstanding === 'number');
  assert.ok(typeof json.summary.collectionRate === 'number');
  assert.ok(Array.isArray(json.summary.statusDistribution));
  assert.ok(json.pagination);
});

test('Invoice Report: CSV export returns properly formatted CSV stream', async () => {
  const res = await fetch(`${baseUrl}/api/reports/invoices?export=csv`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/csv/);
  assert.match(res.headers.get('content-disposition'), /attachment; filename="invoice-report-/);
  const text = await res.text();
  assert.match(text, /^Invoice #,Customer Name,Customer Email/);
});

test('Payment Report: GET /api/reports/payments returns collected totals and method splits', async () => {
  const res = await fetch(`${baseUrl}/api/reports/payments`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();

  assert.ok(Array.isArray(json.data));
  assert.ok(json.summary);
  assert.ok(typeof json.summary.totalPayments === 'number');
  assert.ok(typeof json.summary.totalCollected === 'number');
  assert.ok(typeof json.summary.averagePayment === 'number');
  assert.ok(Array.isArray(json.summary.methodDistribution));
  assert.ok(json.pagination);
});

test('Payment Report: CSV export returns text/csv attachment', async () => {
  const res = await fetch(`${baseUrl}/api/reports/payments?export=csv`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/csv/);
  assert.match(res.headers.get('content-disposition'), /attachment; filename="payment-report-/);
  const text = await res.text();
  assert.match(text, /^Payment #,Invoice #,Customer Name/);
});

test('Revenue Report: GET /api/reports/revenue returns timeline and aggregates', async () => {
  const res = await fetch(`${baseUrl}/api/reports/revenue`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const data = json.data;

  assert.ok(typeof data.totalRevenue === 'number');
  assert.ok(typeof data.totalTransactions === 'number');
  assert.ok(typeof data.averageTransaction === 'number');
  assert.ok(Array.isArray(data.timeline));
});

test('Revenue Report: CSV export returns text/csv timeline', async () => {
  const res = await fetch(`${baseUrl}/api/reports/revenue?export=csv`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/csv/);
  assert.match(res.headers.get('content-disposition'), /attachment; filename="revenue-report-/);
  const text = await res.text();
  assert.match(text, /^Date,Revenue \(\$\),Transactions Count/);
});

test('Contract Compliance: Base path /api/v1/reports serves identical report endpoints', async () => {
  const res = await fetch(`${baseUrl}/api/v1/reports/invoices`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.summary !== undefined);
  assert.ok(Array.isArray(json.data));
});

test('Validation: Invalid query parameters throw 400 with errors list', async () => {
  const res = await fetch(`${baseUrl}/api/reports/invoices?startDate=not-a-date&status=INVALID_STATUS`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.ok(json.errors || json.message);
});

