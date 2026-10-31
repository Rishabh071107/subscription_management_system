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
let testInvoice;
let testPayment;

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

  // Primary Customer
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
      email: `notif_iso_${uniqueTimestamp}@example.com`,
      password: hashedPassword,
      firstName: 'IsoNotifCustomer',
      lastName: 'Testing',
      phone: '+1 555-7777',
      role: 'CUSTOMER',
      isActive: true
    }
  });

  const otherCustRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `notif_iso_${uniqueTimestamp}@example.com`, password: 'OtherCust@2026!' })
  });
  otherCustomerCookie = otherCustRes.headers.get('set-cookie')?.split(';')[0];

  // Create test invoice for primary customer
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  testInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-NOTIF-${uniqueTimestamp}`,
      customerId: customerUser.id,
      billingPeriodStart: new Date(),
      billingPeriodEnd: nextMonth,
      dueDate: nextMonth,
      status: 'CONFIRMED',
      subtotal: 200.00,
      taxRate: 18.00,
      taxAmount: 36.00,
      total: 236.00,
      amountPaid: 0.00,
      outstandingAmount: 236.00
    }
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('RBAC: Unauthenticated requests cannot access notifications', async () => {
  const res = await fetch(`${baseUrl}/api/v1/notifications`);
  assert.equal(res.status, 401);
});

test('Admin Access: GET /api/v1/notifications lists all notifications', async () => {
  const res = await fetch(`${baseUrl}/api/v1/notifications`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data.notifications));
  assert.ok(json.data.pagination);
});

test('Customer Isolation: Customer only sees their own notifications', async () => {
  // Create a notification for other customer
  await prisma.notification.create({
    data: {
      userId: otherCustomerUser.id,
      recipient: otherCustomerUser.email,
      type: 'WELCOME',
      subject: 'Welcome to Brightloop Other Customer',
      status: 'SENT',
      sentAt: new Date()
    }
  });

  const res = await fetch(`${baseUrl}/api/v1/notifications`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);

  for (const n of json.data.notifications) {
    assert.notEqual(n.userId, otherCustomerUser.id);
    assert.notEqual(n.recipient, otherCustomerUser.email);
  }
});

test('Customer Security: Cannot view another customer notification details (403 Forbidden)', async () => {
  const otherNotif = await prisma.notification.create({
    data: {
      userId: otherCustomerUser.id,
      recipient: otherCustomerUser.email,
      type: 'INVOICE_SENT',
      subject: 'Private Invoice Statement',
      status: 'SENT',
      sentAt: new Date()
    }
  });

  const res = await fetch(`${baseUrl}/api/v1/notifications/${otherNotif.id}`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 403);
  const json = await res.json();
  assert.equal(json.success, false);
});

test('Returns 404 for non-existent notification ID', async () => {
  const res = await fetch(`${baseUrl}/api/v1/notifications/00000000-0000-0000-0000-000000000000`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 404);
});

test('Integration: POST /api/invoices/:id/send dispatches INVOICE_SENT notification', async () => {
  const sendRes = await fetch(`${baseUrl}/api/invoices/${testInvoice.id}/send`, {
    method: 'POST',
    headers: { cookie: adminCookie }
  });
  assert.equal(sendRes.status, 200);

  // Verify notification was created and dispatched
  const notif = await prisma.notification.findFirst({
    where: {
      userId: customerUser.id,
      type: 'INVOICE_SENT',
      recipient: customerUser.email
    },
    orderBy: { createdAt: 'desc' }
  });

  assert.ok(notif, 'Invoice notification record should exist');
  assert.equal(notif.status, 'SENT');
  assert.ok(notif.sentAt);
  assert.ok(notif.subject.includes(testInvoice.invoiceNumber));
});

test('Integration: Recording a payment dispatches PAYMENT_CONFIRMED notification', async () => {
  const paymentRes = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie
    },
    body: JSON.stringify({
      invoiceId: testInvoice.id,
      amount: 100.00,
      paymentMethod: 'BANK_TRANSFER',
      referenceNote: 'Notification test wire transfer'
    })
  });
  assert.equal(paymentRes.status, 201);
  const json = await paymentRes.json();
  testPayment = json.data.payment;

  // Verify notification was created and dispatched
  const notif = await prisma.notification.findFirst({
    where: {
      userId: customerUser.id,
      type: 'PAYMENT_CONFIRMED',
      recipient: customerUser.email
    },
    orderBy: { createdAt: 'desc' }
  });

  assert.ok(notif, 'Payment confirmation notification should exist');
  assert.equal(notif.status, 'SENT');
  assert.ok(notif.sentAt);
  assert.ok(notif.subject.includes(testPayment.paymentNumber));
});

test('Validation: GET with invalid pagination params returns 400', async () => {
  const res = await fetch(`${baseUrl}/api/v1/notifications?page=-1`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 400);
});

test('Backward Compatibility: /api/notifications mirrors /api/v1/notifications', async () => {
  const res = await fetch(`${baseUrl}/api/notifications`, {
    headers: { cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(Array.isArray(json.data.notifications));
});
