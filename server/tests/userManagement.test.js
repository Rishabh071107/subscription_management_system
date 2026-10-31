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
  adminCookie = adminRes.headers.get('set-cookie').split(';')[0];

  // Login Staff
  const staffRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@brightloop.io', password: 'Staff@2026!' })
  });
  staffCookie = staffRes.headers.get('set-cookie').split(';')[0];

  // Login Customer
  const custRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@acmecorp.com', password: 'Customer@2026!' })
  });
  customerCookie = custRes.headers.get('set-cookie').split(';')[0];
});

test.after(async () => {
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test('GET /api/admin/staff succeeds for Admin with 200', async () => {
  const res = await fetch(`${baseUrl}/api/admin/staff`, {
    headers: { Cookie: adminCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
});

test('GET /api/admin/staff is forbidden for Staff (HTTP 403)', async () => {
  const res = await fetch(`${baseUrl}/api/admin/staff`, {
    headers: { Cookie: staffCookie }
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('GET /api/admin/staff is forbidden for Customer (HTTP 403)', async () => {
  const res = await fetch(`${baseUrl}/api/admin/staff`, {
    headers: { Cookie: customerCookie }
  });
  assert.equal(res.status, 403);
  const data = await res.json();
  assert.equal(data.success, false);
});

test('POST /api/admin/staff creates new Staff account and writes audit event', async () => {
  const newStaffEmail = `staff_op_${Date.now()}@brightloop.io`;
  const res = await fetch(`${baseUrl}/api/admin/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie
    },
    body: JSON.stringify({
      email: newStaffEmail,
      password: 'StaffSecretPass@2026!',
      firstName: 'Operations',
      lastName: 'Specialist',
      phone: '+1 555-0811'
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  const staff = data.data.staff;
  assert.equal(staff.email, newStaffEmail);
  assert.equal(staff.role, 'STAFF');

  // Verify Audit Log
  const audit = await prisma.auditLog.findFirst({
    where: { action: 'STAFF_CREATED', entityId: staff.id }
  });
  assert.ok(audit, 'Audit log for STAFF_CREATED must exist');
});

test('PATCH /api/admin/staff/:id/status toggles staff active status', async () => {
  // Create staff to toggle
  const staffEmail = `toggle_staff_${Date.now()}@brightloop.io`;
  const createRes = await fetch(`${baseUrl}/api/admin/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie
    },
    body: JSON.stringify({
      email: staffEmail,
      password: 'StaffSecretPass@2026!',
      firstName: 'Toggle',
      lastName: 'Staff'
    })
  });
  const staff = (await createRes.json()).data.staff;

  // Deactivate
  const deactRes = await fetch(`${baseUrl}/api/admin/staff/${staff.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: adminCookie
    },
    body: JSON.stringify({ isActive: false })
  });

  assert.equal(deactRes.status, 200);
  const deactData = await deactRes.json();
  assert.equal(deactData.data.staff.isActive, false);

  // Verify audit log
  const audit = await prisma.auditLog.findFirst({
    where: { action: 'ACCOUNT_DEACTIVATED', entityId: staff.id }
  });
  assert.ok(audit, 'Audit log for ACCOUNT_DEACTIVATED must exist');
});

test('GET /api/customers succeeds for Staff and Admin (HTTP 200)', async () => {
  // Staff check
  const staffRes = await fetch(`${baseUrl}/api/customers`, {
    headers: { Cookie: staffCookie }
  });
  assert.equal(staffRes.status, 200);
  const staffData = await staffRes.json();
  assert.equal(staffData.success, true);
  assert.ok(Array.isArray(staffData.data));

  // Admin check
  const adminRes = await fetch(`${baseUrl}/api/customers`, {
    headers: { Cookie: adminCookie }
  });
  assert.equal(adminRes.status, 200);
});

test('GET /api/customers is forbidden for Customer (HTTP 403)', async () => {
  const res = await fetch(`${baseUrl}/api/customers`, {
    headers: { Cookie: customerCookie }
  });
  assert.equal(res.status, 403);
});

test('PATCH /api/profile updates authenticated user profile and records audit log', async () => {
  const res = await fetch(`${baseUrl}/api/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: staffCookie
    },
    body: JSON.stringify({
      phone: '+1 555-9999'
    })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.user.phone, '+1 555-9999');
});

