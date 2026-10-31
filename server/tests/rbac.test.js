import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

let server;
let baseUrl;

// Pre-fetched credentials & tokens
let adminCookie;
let staffCookie;
let customer1Cookie;
let customer1Id;
let customer2Cookie;
let customer2Id;
let customer1InvoiceId;

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
  adminCookie = adminRes.headers.get('set-cookie').split(';')[0];

  // Login Staff
  const staffRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@brightloop.io', password: 'Staff@2026!' })
  });
  staffCookie = staffRes.headers.get('set-cookie').split(';')[0];

  // Login Customer 1 (Alex Morgan)
  const cust1Res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@acmecorp.com', password: 'Customer@2026!' })
  });
  customer1Cookie = cust1Res.headers.get('set-cookie').split(';')[0];
  const cust1Data = await cust1Res.json();
  customer1Id = cust1Data.data.user.id;

  // Create & Login Customer 2
  const cust2Email = `cust2_${Date.now()}@testcorp.com`;
  const cust2Res = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cust2Email,
      password: 'Pass@2026!Cust2',
      firstName: 'Bob',
      lastName: 'Jones'
    })
  });
  customer2Cookie = cust2Res.headers.get('set-cookie').split(';')[0];
  const cust2Data = await cust2Res.json();
  customer2Id = cust2Data.data.user.id;

  // Find or verify customer 1's invoice
  const inv = await prisma.invoice.findFirst({
    where: { customerId: customer1Id }
  });
  if (inv) {
    customer1InvoiceId = inv.id;
  }
});

test.after(async () => {
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test('RBAC: Logged-out / Unauthenticated user calling protected API returns HTTP 401', async () => {
  const res = await fetch(`${baseUrl}/api/users`);
  assert.equal(res.status, 401);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('RBAC: Customer calling Admin API (/api/users/staff) returns HTTP 403', async () => {
  const res = await fetch(`${baseUrl}/api/users/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customer1Cookie
    },
    body: JSON.stringify({
      email: 'hacked_staff@test.com',
      password: 'StaffPassword@123',
      firstName: 'Malicious',
      lastName: 'Staff'
    })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('RBAC: Staff attempting to create Admin or Staff (/api/users/staff) returns HTTP 403', async () => {
  const res = await fetch(`${baseUrl}/api/users/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffCookie
    },
    body: JSON.stringify({
      email: 'new_staff@brightloop.io',
      password: 'StaffPass@2026!',
      firstName: 'Junior',
      lastName: 'Staff',
      role: 'ADMIN'
    })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('RBAC: Admin creating Staff account is Allowed (HTTP 201)', async () => {
  const staffEmail = `staff_${Date.now()}@brightloop.io`;
  const res = await fetch(`${baseUrl}/api/users/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie
    },
    body: JSON.stringify({
      email: staffEmail,
      password: 'StaffPass@2026!',
      firstName: 'Emily',
      lastName: 'Clark'
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.staff.role, 'STAFF');
});

test('RBAC: Customer calling Admin billing run returns HTTP 403', async () => {
  const res = await fetch(`${baseUrl}/api/invoices/run-billing-cycle`, {
    method: 'POST',
    headers: {
      Cookie: customer1Cookie
    }
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('Ownership: Customer 1 accesses their own invoice successfully', async () => {
  if (!customer1InvoiceId) {
    return; // Skipped if no invoice in seed
  }

  const res = await fetch(`${baseUrl}/api/invoices/${customer1InvoiceId}`, {
    headers: {
      Cookie: customer1Cookie
    }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.invoice.id, customer1InvoiceId);
});

test('Ownership: Customer 2 attempting to access Customer 1 invoice returns HTTP 403 with no data disclosure', async () => {
  if (!customer1InvoiceId) {
    return;
  }

  const res = await fetch(`${baseUrl}/api/invoices/${customer1InvoiceId}`, {
    headers: {
      Cookie: customer2Cookie // Customer 2 trying to read Customer 1's invoice
    }
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.equal(data.data, undefined); // No invoice data disclosed!
});

test('RBAC: Inactive user attempting login is denied with HTTP 403', async () => {
  // Create an inactive user
  const inactiveEmail = `inactive_${Date.now()}@acme.com`;
  const salt = await import('bcryptjs').then(m => m.default.genSalt(10));
  const hashedPassword = await import('bcryptjs').then(m => m.default.hash('InactivePass@2026!', salt));

  await prisma.user.create({
    data: {
      email: inactiveEmail,
      password: hashedPassword,
      firstName: 'Inactive',
      lastName: 'User',
      role: 'CUSTOMER',
      isActive: false
    }
  });

  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: inactiveEmail,
      password: 'InactivePass@2026!'
    })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.ok(data.message.toLowerCase().includes('deactivated'));
});

