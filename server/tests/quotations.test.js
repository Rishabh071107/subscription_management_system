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
let testProduct;
let testPlan;
let createdQuotationId;

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

  testProduct = await prisma.product.findFirst({
    where: { isActive: true }
  });

  testPlan = await prisma.plan.findFirst({
    where: { status: 'ACTIVE' }
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('POST /api/quotations - creates quotation with tax, lines, and generated number', async () => {
  const payload = {
    customerId: customerUser.id,
    taxRate: 18,
    discountAmount: 10,
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Quotation test notes',
    termsAndConditions: 'Net 30 days payment terms',
    lines: [
      {
        productId: testProduct.id,
        quantity: 2,
        unitPrice: 100,
        taxRate: 18,
        description: 'Line item 1'
      }
    ]
  };

  const res = await fetch(`${baseUrl}/api/quotations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': staffCookie
    },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.quotation.id);
  assert.match(data.data.quotation.quotationNumber, /^QT-\d{4}-\d{4}$/);
  assert.equal(Number(data.data.quotation.subtotal), 200);
  assert.equal(Number(data.data.quotation.taxAmount), 36);
  assert.equal(Number(data.data.quotation.discountAmount), 10);
  assert.equal(Number(data.data.quotation.totalAmount), 226);
  assert.equal(data.data.quotation.status, 'DRAFT');

  createdQuotationId = data.data.quotation.id;
});

test('GET /api/quotations - retrieves paginated quotations list', async () => {
  const res = await fetch(`${baseUrl}/api/quotations?page=1&limit=10`, {
    headers: { 'Cookie': staffCookie }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.meta.total >= 1);
});

test('GET /api/quotations/:id - retrieves quotation details', async () => {
  const res = await fetch(`${baseUrl}/api/quotations/${createdQuotationId}`, {
    headers: { 'Cookie': adminCookie }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.quotation.id, createdQuotationId);
  assert.equal(data.data.quotation.lines.length, 1);
});

test('GET /api/quotations/:id - data isolation prevents customer viewing other quotations', async () => {
  // Create another customer
  let otherCustomer = await prisma.user.findFirst({
    where: { role: 'CUSTOMER', email: { not: customerUser.email } }
  });

  if (!otherCustomer) {
    otherCustomer = await prisma.user.create({
      data: {
        email: 'other_cust@example.com',
        password: 'Password123!',
        firstName: 'Other',
        lastName: 'Cust',
        role: 'CUSTOMER'
      }
    });
  }

  // Create a quotation for otherCustomer with a unique quotationNumber
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const otherQuote = await prisma.quotation.create({
    data: {
      quotationNumber: `QT-TEST-${randomSuffix}-${Date.now()}`,
      customerId: otherCustomer.id,
      createdById: customerUser.id,
      status: 'DRAFT',
      subtotal: 50,
      taxAmount: 9,
      totalAmount: 59
    }
  });

  // Attempt to view with customerUser cookie
  const res = await fetch(`${baseUrl}/api/quotations/${otherQuote.id}`, {
    headers: { 'Cookie': customerCookie }
  });

  assert.equal(res.status, 403);
});

test('PATCH /api/quotations/:id/status - updates status to CONFIRMED', async () => {
  const res = await fetch(`${baseUrl}/api/quotations/${createdQuotationId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': staffCookie
    },
    body: JSON.stringify({ status: 'CONFIRMED' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.data.quotation.status, 'CONFIRMED');
});

test('POST /api/quotations/:id/convert - converts quotation into subscription', async () => {
  const res = await fetch(`${baseUrl}/api/quotations/${createdQuotationId}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      planId: testPlan.id,
      paymentTerms: 'Net 30',
      autoRenew: true
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.data.subscription.id);
  assert.equal(data.data.subscription.quotationId, createdQuotationId);
  assert.equal(data.data.subscription.status, 'CONFIRMED');

  // Verify quotation status became CONVERTED
  const updatedQuote = await prisma.quotation.findUnique({
    where: { id: createdQuotationId }
  });
  assert.equal(updatedQuote.status, 'CONVERTED');
});

test('POST /api/quotations/:id/convert - rejects duplicate conversion', async () => {
  const res = await fetch(`${baseUrl}/api/quotations/${createdQuotationId}/convert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({ planId: testPlan.id })
  });

  assert.equal(res.status, 400);
});
