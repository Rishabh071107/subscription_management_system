import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import bcrypt from 'bcryptjs';

let server;
let baseUrl;
let adminCookie;
let staffCookie;
let customerCookie;
let otherCustomerCookie;
let customerUser;
let otherCustomerUser;
let customerSubscription;
let otherCustomerSubscription;
let customerInvoice;
let otherCustomerInvoice;

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

  // Primary Test Customer
  const custRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@acmecorp.com', password: 'Customer@2026!' })
  });
  customerCookie = custRes.headers.get('set-cookie')?.split(';')[0];

  customerUser = await prisma.user.findUnique({
    where: { email: 'customer@acmecorp.com' }
  });

  // Create Secondary Customer for Data Isolation Testing
  const uniqueTimestamp = Date.now();
  const hashedPassword = await bcrypt.hash('OtherCust@2026!', 10);
  otherCustomerUser = await prisma.user.create({
    data: {
      email: `portal_iso_${uniqueTimestamp}@example.com`,
      password: hashedPassword,
      firstName: 'IsoCustomer',
      lastName: 'Testing',
      phone: '+1 555-8888',
      role: 'CUSTOMER',
      isActive: true
    }
  });

  const otherCustRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `portal_iso_${uniqueTimestamp}@example.com`, password: 'OtherCust@2026!' })
  });
  otherCustomerCookie = otherCustRes.headers.get('set-cookie')?.split(';')[0];

  // Find or create a plan
  let plan = await prisma.plan.findFirst();
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: `Portal Test Plan ${uniqueTimestamp}`,
        code: `PLAN-P-${uniqueTimestamp}`,
        price: 150.00,
        billingInterval: 'MONTHLY'
      }
    });
  }

  // Create subscription for Primary Customer
  customerSubscription = await prisma.subscription.create({
    data: {
      subscriptionNumber: `SUB-CUST-${uniqueTimestamp}`,
      customerId: customerUser.id,
      planId: plan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      subtotal: 150.00,
      taxAmount: 27.00,
      totalAmount: 177.00
    }
  });

  // Create subscription for Other Customer
  otherCustomerSubscription = await prisma.subscription.create({
    data: {
      subscriptionNumber: `SUB-OTHER-${uniqueTimestamp}`,
      customerId: otherCustomerUser.id,
      planId: plan.id,
      status: 'ACTIVE',
      startDate: new Date(),
      subtotal: 150.00,
      taxAmount: 27.00,
      totalAmount: 177.00
    }
  });

  // Create invoice for Primary Customer
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  customerInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-CUST-${uniqueTimestamp}`,
      customerId: customerUser.id,
      subscriptionId: customerSubscription.id,
      billingPeriodStart: new Date(),
      billingPeriodEnd: nextMonth,
      dueDate: nextMonth,
      status: 'CONFIRMED',
      subtotal: 150.00,
      taxRate: 18.00,
      taxAmount: 27.00,
      total: 177.00,
      amountPaid: 0.00
    }
  });

  // Create invoice for Other Customer
  otherCustomerInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-OTHER-${uniqueTimestamp}`,
      customerId: otherCustomerUser.id,
      subscriptionId: otherCustomerSubscription.id,
      billingPeriodStart: new Date(),
      billingPeriodEnd: nextMonth,
      dueDate: nextMonth,
      status: 'CONFIRMED',
      subtotal: 150.00,
      taxRate: 18.00,
      taxAmount: 27.00,
      total: 177.00,
      amountPaid: 0.00
    }
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('RBAC: Unauthenticated requests cannot access customer portal endpoints', async () => {
  const endpoints = ['/dashboard', '/subscriptions', '/invoices', '/profile'];
  for (const ep of endpoints) {
    const res = await fetch(`${baseUrl}/api/v1/portal${ep}`);
    assert.equal(res.status, 401, `Expected 401 for ${ep} without authentication`);
  }
});

test('RBAC: Internal Admin and Staff roles cannot access customer portal', async () => {
  const adminRes = await fetch(`${baseUrl}/api/v1/portal/dashboard`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(adminRes.status, 403, 'Admin should be forbidden from customer portal');

  const staffRes = await fetch(`${baseUrl}/api/v1/portal/dashboard`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(staffRes.status, 403, 'Staff should be forbidden from customer portal');
});

test('Portal Dashboard: GET /api/v1/portal/dashboard returns customer metrics and recent items', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/dashboard`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  const data = json.data;

  assert.ok(typeof data.metrics.activeSubscriptionsCount === 'number');
  assert.ok(typeof data.metrics.invoicesCount === 'number');
  assert.ok(typeof data.metrics.totalOutstanding === 'number');
  assert.ok(typeof data.metrics.totalPaid === 'number');
  assert.ok(Array.isArray(data.recentSubscriptions));
  assert.ok(Array.isArray(data.recentInvoices));
  assert.equal(data.user.id, customerUser.id);
});

test('Portal Subscriptions: GET /api/v1/portal/subscriptions returns only own subscriptions', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/subscriptions`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  const data = json.data;

  assert.ok(Array.isArray(data.subscriptions));
  assert.ok(data.pagination);
  // Ensure none of the returned subscriptions belong to the other customer
  for (const sub of data.subscriptions) {
    assert.equal(sub.customerId, customerUser.id);
    assert.notEqual(sub.customerId, otherCustomerUser.id);
  }
});

test('Portal Subscription Detail: GET /api/v1/portal/subscriptions/:id returns own subscription', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/subscriptions/${customerSubscription.id}`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.subscription.id, customerSubscription.id);
  assert.equal(json.data.subscription.customerId, customerUser.id);
});

test('Security Isolation: Customer cannot view another customer subscription (403 Forbidden)', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/subscriptions/${otherCustomerSubscription.id}`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 403);
  const json = await res.json();
  assert.equal(json.success, false);
});

test('Portal Subscriptions: Returns 404 for non-existent subscription', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/subscriptions/00000000-0000-0000-0000-000000000000`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 404);
});

test('Portal Invoices: GET /api/v1/portal/invoices returns only own invoices', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/invoices`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  const data = json.data;

  assert.ok(Array.isArray(data.invoices));
  assert.ok(data.pagination);
  for (const inv of data.invoices) {
    assert.equal(inv.customerId, customerUser.id);
    assert.notEqual(inv.customerId, otherCustomerUser.id);
  }
});

test('Portal Invoice Detail: GET /api/v1/portal/invoices/:id returns own invoice', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/invoices/${customerInvoice.id}`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.invoice.id, customerInvoice.id);
  assert.equal(json.data.invoice.customerId, customerUser.id);
});

test('Security Isolation: Customer cannot view another customer invoice (403 Forbidden)', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/invoices/${otherCustomerInvoice.id}`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 403);
  const json = await res.json();
  assert.equal(json.success, false);
});

test('Portal Invoices: Returns 404 for non-existent invoice', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/invoices/00000000-0000-0000-0000-000000000000`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 404);
});

test('Portal Profile: GET /api/v1/portal/profile returns own profile', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/profile`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.user.id, customerUser.id);
  assert.equal(json.data.user.email, customerUser.email);
});

test('Portal Profile Update: PATCH /api/v1/portal/profile updates permitted fields', async () => {
  const updatedPhone = '+1 555-999-0011';
  const res = await fetch(`${baseUrl}/api/v1/portal/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: customerCookie
    },
    body: JSON.stringify({
      firstName: 'AcmeUpdated',
      lastName: 'CustomerMod',
      phone: updatedPhone
    })
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.equal(json.data.user.firstName, 'AcmeUpdated');
  assert.equal(json.data.user.lastName, 'CustomerMod');
  assert.equal(json.data.user.phone, updatedPhone);

  // Verify DB state
  const dbUser = await prisma.user.findUnique({ where: { id: customerUser.id } });
  assert.equal(dbUser.firstName, 'AcmeUpdated');
  assert.equal(dbUser.phone, updatedPhone);
});

test('Security: PATCH /api/v1/portal/profile rejects privilege escalation and immutable fields', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: customerCookie
    },
    body: JSON.stringify({
      role: 'ADMIN',
      email: 'hacker@malicious.com'
    })
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.success, false);
});

test('Validation: GET with invalid pagination params returns 400', async () => {
  const res = await fetch(`${baseUrl}/api/v1/portal/subscriptions?page=-5`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.success, false);
});

test('Backward Compatibility: /api/portal alias path mirrors /api/v1/portal', async () => {
  const res = await fetch(`${baseUrl}/api/portal/dashboard`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.data.metrics);
});
