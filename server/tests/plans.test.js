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

  // Admin Login
  const adminRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@brightloop.io', password: 'Brightloop@2026' })
  });
  adminCookie = adminRes.headers.get('set-cookie').split(';')[0];

  // Staff Login
  const staffRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@brightloop.io', password: 'Staff@2026!' })
  });
  staffCookie = staffRes.headers.get('set-cookie').split(';')[0];

  // Customer Login
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

test('POST /api/plans creates plans across all 4 billing frequencies (DAILY, WEEKLY, MONTHLY, YEARLY)', async () => {
  const frequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

  for (const interval of frequencies) {
    const code = `PLAN-${interval}-${Date.now()}`;
    const res = await fetch(`${baseUrl}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
      body: JSON.stringify({
        name: `Automated ${interval} Plan`,
        code,
        description: `Full recurring test plan for interval: ${interval}`,
        billingInterval: interval,
        intervalCount: 1,
        price: 99.00,
        minQuantity: 1
      })
    });

    assert.equal(res.status, 201, `Failed to create plan for interval ${interval}`);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.plan.billingInterval, interval);
    assert.equal(data.data.plan.code, code);
  }
});

test('POST /api/plans rejects invalid billing frequency (HTTP 400)', async () => {
  const res = await fetch(`${baseUrl}/api/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': staffCookie },
    body: JSON.stringify({
      name: 'Invalid Frequency Plan',
      code: `PLAN-INV-FREQ-${Date.now()}`,
      billingInterval: 'BIWEEKLY',
      price: 50.00
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /billing interval must be one of/i);
});

test('POST /api/plans rejects negative plan price (HTTP 400)', async () => {
  const res = await fetch(`${baseUrl}/api/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': staffCookie },
    body: JSON.stringify({
      name: 'Negative Price Plan',
      code: `PLAN-NEG-${Date.now()}`,
      billingInterval: 'MONTHLY',
      price: -25.00
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /price must be a valid non-negative/i);
});

test('POST /api/plans rejects invalid availability dates where end <= start (HTTP 400)', async () => {
  const res = await fetch(`${baseUrl}/api/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({
      name: 'Invalid Dates Plan',
      code: `PLAN-DATES-${Date.now()}`,
      price: 100.00,
      availabilityStartDate: '2026-12-01',
      availabilityEndDate: '2026-11-01'
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /after the start date/i);
});

test('POST /api/plans rejects minimum quantity less than 1 (HTTP 400)', async () => {
  const res = await fetch(`${baseUrl}/api/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({
      name: 'Invalid Min Quantity Plan',
      code: `PLAN-QTY-${Date.now()}`,
      price: 100.00,
      minQuantity: 0
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /minimum quantity must be at least 1/i);
});

test('POST /api/plans rejects duplicate plan code (HTTP 409)', async () => {
  const duplicateCode = `PLAN-DUP-${Date.now()}`;

  // First creation
  const first = await fetch(`${baseUrl}/api/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ name: 'First Plan', code: duplicateCode, price: 50.00 })
  });
  assert.equal(first.status, 201);

  // Duplicate creation attempt
  const dup = await fetch(`${baseUrl}/api/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ name: 'Second Plan Duplicate', code: duplicateCode, price: 60.00 })
  });
  assert.equal(dup.status, 409);
  const data = await dup.json();
  assert.equal(data.success, false);
  assert.match(data.message, /already exists/i);
});

test('GET /api/plans lists plans with search, interval filter, and pagination', async () => {
  const res = await fetch(`${baseUrl}/api/plans?page=1&limit=5&billingInterval=MONTHLY`, {
    headers: { 'Cookie': staffCookie }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.meta.totalPages >= 1);
});

test('GET /api/plans/:id returns details with subscriber counts', async () => {
  const create = await fetch(`${baseUrl}/api/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ name: 'Details Inspection Plan', code: `PLAN-DTL-${Date.now()}`, price: 75.00 })
  });
  const created = (await create.json()).data.plan;

  const res = await fetch(`${baseUrl}/api/plans/${created.id}`, {
    headers: { 'Cookie': customerCookie }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.data.plan.id, created.id);
  assert.equal(data.data.plan.code, created.code);
  assert.ok(data.data.plan._count);
});

test('PATCH /api/plans/:id/status supports PAUSE, RESUME, CLOSE, and RENEW transitions', async () => {
  const create = await fetch(`${baseUrl}/api/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ name: 'Lifecycle Plan', code: `PLAN-LIFE-${Date.now()}`, price: 120.00 })
  });
  const planId = (await create.json()).data.plan.id;

  // 1. PAUSE
  const pauseRes = await fetch(`${baseUrl}/api/plans/${planId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': staffCookie },
    body: JSON.stringify({ action: 'PAUSE' })
  });
  assert.equal(pauseRes.status, 200);
  assert.equal((await pauseRes.json()).data.plan.status, 'PAUSED');

  // 2. RESUME
  const resumeRes = await fetch(`${baseUrl}/api/plans/${planId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': staffCookie },
    body: JSON.stringify({ action: 'RESUME' })
  });
  assert.equal(resumeRes.status, 200);
  assert.equal((await resumeRes.json()).data.plan.status, 'ACTIVE');

  // 3. CLOSE
  const closeRes = await fetch(`${baseUrl}/api/plans/${planId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': staffCookie },
    body: JSON.stringify({ action: 'CLOSE' })
  });
  assert.equal(closeRes.status, 200);
  assert.equal((await closeRes.json()).data.plan.status, 'CLOSED');

  // 4. Invalid transition: cannot pause a closed plan
  const invalidPause = await fetch(`${baseUrl}/api/plans/${planId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': staffCookie },
    body: JSON.stringify({ action: 'PAUSE' })
  });
  assert.equal(invalidPause.status, 400);

  // 5. RENEW (Reopen)
  const renewRes = await fetch(`${baseUrl}/api/plans/${planId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': staffCookie },
    body: JSON.stringify({ action: 'RENEW' })
  });
  assert.equal(renewRes.status, 200);
  assert.equal((await renewRes.json()).data.plan.status, 'ACTIVE');
});

test('DELETE /api/plans/:id: Plan with active subscriptions is closed rather than deleted', async () => {
  const seededSub = await prisma.subscription.findFirst({
    include: { plan: true }
  });
  assert.ok(seededSub, 'Seeded subscription with plan must exist');
  const planWithSubId = seededSub.planId;

  const res = await fetch(`${baseUrl}/api/plans/${planWithSubId}`, {
    method: 'DELETE',
    headers: { 'Cookie': adminCookie }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.data.action, 'CLOSED');
  assert.equal(data.data.plan.status, 'CLOSED');

  // Verify in database that the plan is NOT deleted
  const dbPlan = await prisma.plan.findUnique({ where: { id: planWithSubId } });
  assert.ok(dbPlan, 'Plan must still exist in database');
  assert.equal(dbPlan.status, 'CLOSED');
});

test('RBAC: Customers are forbidden from modifying plans (POST, PUT, PATCH, DELETE)', async () => {
  // POST attempt
  const postRes = await fetch(`${baseUrl}/api/plans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': customerCookie },
    body: JSON.stringify({ name: 'Hacker Plan', code: 'HACK-1', price: 1 })
  });
  assert.equal(postRes.status, 403);

  // PUT attempt
  const putRes = await fetch(`${baseUrl}/api/plans/fake-id`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': customerCookie },
    body: JSON.stringify({ name: 'Hacker Update' })
  });
  assert.equal(putRes.status, 403);

  // PATCH attempt
  const patchRes = await fetch(`${baseUrl}/api/plans/fake-id/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': customerCookie },
    body: JSON.stringify({ action: 'CLOSE' })
  });
  assert.equal(patchRes.status, 403);

  // DELETE attempt
  const delRes = await fetch(`${baseUrl}/api/plans/fake-id`, {
    method: 'DELETE',
    headers: { 'Cookie': customerCookie }
  });
  assert.equal(delRes.status, 403);
});

