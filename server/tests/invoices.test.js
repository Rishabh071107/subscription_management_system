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
let createdInvoiceId;
let testSubscriptionId;

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

  // Find or create active subscription for idempotency and billing tests
  const sub = await prisma.subscription.findFirst({
    where: { customerId: customerUser.id, status: 'ACTIVE' }
  });

  if (sub) {
    testSubscriptionId = sub.id;
  } else {
    // Check if any plan exists
    let plan = await prisma.plan.findFirst();
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: 'Pro Tier Test',
          billingInterval: 'MONTHLY',
          price: 99.00
        }
      });
    }

    const createdSub = await prisma.subscription.create({
      data: {
        subscriptionNumber: `SUB-TEST-${Date.now()}`,
        customerId: customerUser.id,
        planId: plan.id,
        status: 'ACTIVE',
        billingInterval: 'MONTHLY',
        subtotal: 100.00,
        taxRate: 18.00,
        taxAmount: 18.00,
        totalAmount: 118.00,
        nextBillingDate: new Date()
      }
    });
    testSubscriptionId = createdSub.id;
  }
});

test.after(async () => {
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/invoices returns 401 when unauthenticated', async () => {
  const res = await fetch(`${baseUrl}/api/invoices`);
  assert.equal(res.status, 401);
});

test('GET /api/invoices succeeds for Admin with pagination metadata', async () => {
  const res = await fetch(`${baseUrl}/api/invoices?page=1&limit=5`, {
    headers: { Cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.meta);
  assert.equal(data.meta.page, 1);
});

test('GET /api/invoices succeeds for Staff', async () => {
  const res = await fetch(`${baseUrl}/api/invoices`, {
    headers: { Cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
});

test('GET /api/invoices scopes results for Customer (Customer data isolation)', async () => {
  const res = await fetch(`${baseUrl}/api/invoices`, {
    headers: { Cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  // Every invoice in response must belong to this customer
  data.data.forEach((inv) => {
    assert.equal(inv.customerId, customerUser.id);
  });
});

test('POST /api/invoices validates required manual invoice fields', async () => {
  const res = await fetch(`${baseUrl}/api/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: staffCookie },
    body: JSON.stringify({
      customerId: customerUser.id,
      dueDate: new Date().toISOString(),
      lines: [] // Invalid: lines must not be empty
    })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('POST /api/invoices creates manual invoice with calculated totals and line items', async () => {
  const res = await fetch(`${baseUrl}/api/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: staffCookie },
    body: JSON.stringify({
      customerId: customerUser.id,
      dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
      lines: [
        {
          description: 'Custom Enterprise Onboarding',
          quantity: 2,
          unitPrice: 500,
          taxRate: 18.00
        }
      ],
      discountAmount: 50,
      notes: 'Initial test invoice'
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.invoice.id);
  assert.ok(data.data.invoice.invoiceNumber.startsWith('INV-'));

  createdInvoiceId = data.data.invoice.id;

  // Verify financial integrity
  // Subtotal = 2 * 500 = 1000
  // Tax = 1000 * 18% = 180
  // Total = 1000 + 180 - 50 = 1130
  assert.equal(Number(data.data.invoice.subtotal), 1000);
  assert.equal(Number(data.data.invoice.taxAmount), 180);
  assert.equal(Number(data.data.invoice.discountAmount), 50);
  assert.equal(Number(data.data.invoice.total), 1130);
  assert.equal(Number(data.data.invoice.outstandingAmount), 1130);
  assert.equal(Number(data.data.invoice.amountPaid), 0);
  assert.equal(data.data.invoice.status, 'DRAFT');
});

test('GET /api/invoices/:id retrieves invoice details for Staff', async () => {
  const res = await fetch(`${baseUrl}/api/invoices/${createdInvoiceId}`, {
    headers: { Cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.invoice.id, createdInvoiceId);
  assert.ok(Array.isArray(data.data.invoice.lines));
  assert.equal(data.data.invoice.lines.length, 1);
});

test('GET /api/invoices/:id allows Customer to view their own invoice', async () => {
  const res = await fetch(`${baseUrl}/api/invoices/${createdInvoiceId}`, {
    headers: { Cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.invoice.customerId, customerUser.id);
});

test('POST /api/invoices/:id/confirm transitions draft invoice to CONFIRMED', async () => {
  const res = await fetch(`${baseUrl}/api/invoices/${createdInvoiceId}/confirm`, {
    method: 'POST',
    headers: { Cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.invoice.status, 'CONFIRMED');
});

test('POST /api/invoices/:id/send records audit log for sending invoice', async () => {
  const res = await fetch(`${baseUrl}/api/invoices/${createdInvoiceId}/send`, {
    method: 'POST',
    headers: { Cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
});

test('GET /api/invoices/:id/print renders printable HTML document', async () => {
  const res = await fetch(`${baseUrl}/api/invoices/${createdInvoiceId}/print`, {
    headers: { Cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const contentType = res.headers.get('content-type');
  assert.ok(contentType.includes('text/html'));
  const html = await res.text();
  assert.ok(html.includes('Brightloop Software'));
  assert.ok(html.includes('INVOICE'));
});

test('POST /api/invoices/:id/cancel cancels unpaid invoice', async () => {
  const res = await fetch(`${baseUrl}/api/invoices/${createdInvoiceId}/cancel`, {
    method: 'POST',
    headers: { Cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.invoice.status, 'CANCELLED');
});

test('POST /api/invoices/:id/confirm fails when invoice is in CANCELLED state', async () => {
  const res = await fetch(`${baseUrl}/api/invoices/${createdInvoiceId}/confirm`, {
    method: 'POST',
    headers: { Cookie: staffCookie }
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('GET /api/invoices/:id returns 404 for non-existent invoice', async () => {
  const res = await fetch(`${baseUrl}/api/invoices/00000000-0000-0000-0000-000000000000`, {
    headers: { Cookie: adminCookie }
  });
  assert.equal(res.status, 404);
});

test('POST /api/invoices/generate enforces strict idempotency against duplicate billing', async () => {
  const periodStart = '2026-11-01T00:00:00.000Z';
  const periodEnd = '2026-12-01T00:00:00.000Z';

  // First generation
  const res1 = await fetch(`${baseUrl}/api/invoices/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      subscriptionId: testSubscriptionId,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd
    })
  });

  // Second generation for exact same subscription and period must be rejected with 409
  const res2 = await fetch(`${baseUrl}/api/invoices/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
    body: JSON.stringify({
      subscriptionId: testSubscriptionId,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd
    })
  });

  assert.equal(res2.status, 409);
  const data2 = await res2.json();
  assert.equal(data2.success, false);
  assert.ok(data2.message.includes('already exists'));
});

