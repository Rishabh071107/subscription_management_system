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
let otherCustomerUser;
let overdueInvoiceId;
let criticalOverdueInvoiceId;
let futureInvoiceId;

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

  // Find or create secondary customer
  let otherCust = await prisma.user.findFirst({
    where: { role: 'CUSTOMER', email: { not: 'customer@acmecorp.com' } }
  });
  if (!otherCust) {
    otherCust = await prisma.user.create({
      data: {
        email: 'beta-overdue-cust@example.com',
        passwordHash: '$2b$10$w09lP0t7x7FkL0W87Z2Y4eN.7n2aJvB.a1uVbL9xWqI/jGhy7x36K',
        firstName: 'Beta',
        lastName: 'Customer',
        role: 'CUSTOMER'
      }
    });
  }
  otherCustomerUser = otherCust;

  const now = Date.now();
  const msInDay = 86400000;

  // 1. Create an overdue invoice (10 days past due, bucket 1-30)
  const overdue1 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-OD1-${now}`,
      customerId: customerUser.id,
      issueDate: new Date(now - 40 * msInDay),
      dueDate: new Date(now - 10 * msInDay),
      billingPeriodStart: new Date(now - 40 * msInDay),
      billingPeriodEnd: new Date(now - 10 * msInDay),
      subtotal: 1000,
      taxAmount: 0,
      discountAmount: 0,
      total: 1000,
      amountPaid: 200,
      outstandingAmount: 800,
      status: 'CONFIRMED'
    }
  });
  overdueInvoiceId = overdue1.id;

  // 2. Create a critical overdue invoice (75 days past due, bucket 61-90)
  const overdueCritical = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-OD-CRIT-${now}`,
      customerId: customerUser.id,
      issueDate: new Date(now - 105 * msInDay),
      dueDate: new Date(now - 75 * msInDay),
      billingPeriodStart: new Date(now - 105 * msInDay),
      billingPeriodEnd: new Date(now - 75 * msInDay),
      subtotal: 2500,
      taxAmount: 0,
      discountAmount: 0,
      total: 2500,
      amountPaid: 0,
      outstandingAmount: 2500,
      status: 'CONFIRMED'
    }
  });
  criticalOverdueInvoiceId = overdueCritical.id;

  // 3. Create a future invoice (NOT overdue)
  const futureInv = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-FUT-${now}`,
      customerId: customerUser.id,
      issueDate: new Date(now),
      dueDate: new Date(now + 15 * msInDay),
      billingPeriodStart: new Date(now),
      billingPeriodEnd: new Date(now + 30 * msInDay),
      subtotal: 1200,
      taxAmount: 0,
      discountAmount: 0,
      total: 1200,
      amountPaid: 0,
      outstandingAmount: 1200,
      status: 'CONFIRMED'
    }
  });
  futureInvoiceId = futureInv.id;

  // 4. Create a paid invoice whose due date passed (NOT overdue)
  await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-PAID-PAST-${now}`,
      customerId: customerUser.id,
      issueDate: new Date(now - 30 * msInDay),
      dueDate: new Date(now - 5 * msInDay),
      billingPeriodStart: new Date(now - 30 * msInDay),
      billingPeriodEnd: new Date(now - 5 * msInDay),
      subtotal: 600,
      taxAmount: 0,
      discountAmount: 0,
      total: 600,
      amountPaid: 600,
      outstandingAmount: 0,
      status: 'PAID'
    }
  });

  // 5. Create a cancelled invoice whose due date passed (NOT overdue)
  await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-CANC-PAST-${now}`,
      customerId: customerUser.id,
      issueDate: new Date(now - 30 * msInDay),
      dueDate: new Date(now - 5 * msInDay),
      billingPeriodStart: new Date(now - 30 * msInDay),
      billingPeriodEnd: new Date(now - 5 * msInDay),
      subtotal: 400,
      taxAmount: 0,
      discountAmount: 0,
      total: 400,
      amountPaid: 0,
      outstandingAmount: 400,
      status: 'CANCELLED'
    }
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('RBAC: Unauthenticated requests are rejected with 401', async () => {
  const res = await fetch(`${baseUrl}/api/overdue/summary`);
  assert.equal(res.status, 401);
});

test('RBAC: Customers cannot trigger batch status synchronization', async () => {
  const res = await fetch(`${baseUrl}/api/overdue/sync`, {
    method: 'POST',
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 403);
});

test('RBAC: Customers cannot post collection follow-up logs', async () => {
  const res = await fetch(`${baseUrl}/api/overdue/invoices/${overdueInvoiceId}/follow-up`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: customerCookie
    },
    body: JSON.stringify({ note: 'Unauthorized follow up attempt' })
  });
  assert.equal(res.status, 403);
});

test('Overdue Summary: GET /api/overdue/summary returns aggregated debt metrics and aging buckets', async () => {
  const res = await fetch(`${baseUrl}/api/overdue/summary`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const summary = json.data;

  assert.ok(summary.totalOverdueInvoices >= 2);
  assert.ok(summary.totalOverdueAmount >= 3300); // 800 + 2500
  assert.ok(summary.affectedCustomersCount >= 1);
  assert.ok(summary.criticalOverdueCount >= 1);
  assert.ok(summary.criticalOverdueAmount >= 2500);

  // Aging buckets structure
  assert.ok(summary.agingBuckets['1-30']);
  assert.ok(summary.agingBuckets['31-60']);
  assert.ok(summary.agingBuckets['61-90']);
  assert.ok(summary.agingBuckets['90+']);
  assert.ok(summary.agingBuckets['1-30'].count >= 1);
  assert.ok(summary.agingBuckets['61-90'].count >= 1);
});

test('Overdue List: GET /api/overdue/invoices excludes future, paid, and cancelled invoices', async () => {
  const res = await fetch(`${baseUrl}/api/overdue/invoices?customerId=${customerUser.id}&limit=50`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const invoices = json.data;

  assert.ok(Array.isArray(invoices));
  const ids = invoices.map((inv) => inv.id);

  // Must include actual past due invoices
  assert.ok(ids.includes(overdueInvoiceId));
  assert.ok(ids.includes(criticalOverdueInvoiceId));

  // Must NOT include future invoices
  assert.ok(!ids.includes(futureInvoiceId));

  // Verify each returned invoice matches overdue criteria
  const now = Date.now();
  invoices.forEach((inv) => {
    assert.ok(new Date(inv.dueDate).getTime() < now);
    assert.ok(Number(inv.outstandingAmount) > 0);
    assert.notEqual(inv.status, 'CANCELLED');
    assert.notEqual(inv.status, 'PAID');
    assert.ok(inv.daysOverdue >= 0);
    assert.ok(['1-30', '31-60', '61-90', '90+'].includes(inv.bucket));
  });
});

test('Overdue List: Filter by aging bucket returns only matching invoices', async () => {
  const res = await fetch(`${baseUrl}/api/overdue/invoices?bucket=61-90`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const invoices = json.data;

  assert.ok(invoices.length >= 1);
  invoices.forEach((inv) => {
    assert.equal(inv.bucket, '61-90');
    assert.ok(inv.daysOverdue >= 61 && inv.daysOverdue <= 90);
  });
});

test('Overdue Details: GET /api/overdue/invoices/:id returns enriched invoice with daysOverdue', async () => {
  const res = await fetch(`${baseUrl}/api/overdue/invoices/${overdueInvoiceId}`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  const invoice = json.data.invoice;

  assert.equal(invoice.id, overdueInvoiceId);
  assert.equal(invoice.isOverdue, true);
  assert.ok(invoice.daysOverdue >= 10);
  assert.ok(Array.isArray(invoice.followUpLogs));
});

test('Collection Follow-Up: Staff logs follow-up note on overdue invoice', async () => {
  const noteContent = 'Contacted Accounts Payable; promised full transfer within 48 hours.';
  const res = await fetch(`${baseUrl}/api/overdue/invoices/${overdueInvoiceId}/follow-up`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: staffCookie
    },
    body: JSON.stringify({ note: noteContent })
  });

  assert.equal(res.status, 201);
  const json = await res.json();
  assert.ok(json.data.followUp);
  assert.equal(json.data.followUp.details, noteContent);

  // Verify note is retrievable on the invoice details
  const detailRes = await fetch(`${baseUrl}/api/overdue/invoices/${overdueInvoiceId}`, {
    headers: { cookie: staffCookie }
  });
  const detailJson = await detailRes.json();
  const logs = detailJson.data.invoice.followUpLogs;
  assert.ok(logs.some((l) => l.details === noteContent));
});

test('Validation: Follow-up note requires non-empty content', async () => {
  const res = await fetch(`${baseUrl}/api/overdue/invoices/${overdueInvoiceId}/follow-up`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: staffCookie
    },
    body: JSON.stringify({ note: '   ' })
  });

  assert.equal(res.status, 400);
});

test('Overdue Status Sync: POST /api/overdue/sync updates past-due invoices to OVERDUE status', async () => {
  const res = await fetch(`${baseUrl}/api/overdue/sync`, {
    method: 'POST',
    headers: { cookie: adminCookie }
  });

  assert.equal(res.status, 200);
  const json = await res.json();
  assert.ok(json.data.updatedCount >= 1);

  // Check invoice status in DB
  const updatedInv = await prisma.invoice.findUnique({ where: { id: overdueInvoiceId } });
  assert.equal(updatedInv.status, 'OVERDUE');
});

test('Customer Data Isolation: Customer cannot access overdue invoice of another customer', async () => {
  // Create overdue invoice for other customer
  const now = Date.now();
  const msInDay = 86400000;
  const foreignInv = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-FOR-OD-${now}`,
      customerId: otherCustomerUser.id,
      issueDate: new Date(now - 20 * msInDay),
      dueDate: new Date(now - 5 * msInDay),
      billingPeriodStart: new Date(now - 20 * msInDay),
      billingPeriodEnd: new Date(now - 5 * msInDay),
      subtotal: 750,
      taxAmount: 0,
      discountAmount: 0,
      total: 750,
      amountPaid: 0,
      outstandingAmount: 750,
      status: 'CONFIRMED'
    }
  });

  const res = await fetch(`${baseUrl}/api/overdue/invoices/${foreignInv.id}`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 403);
});

