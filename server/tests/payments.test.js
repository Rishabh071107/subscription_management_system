import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

let server;
let baseUrl;
let adminCookie;
let staffCookie;
let customerCookie;
let otherCustomerCookie;
let customerUser;
let otherCustomerUser;
let testInvoiceId;
let testInvoiceTotal = 1500;

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

  // Login Primary Customer
  const custRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@acmecorp.com', password: 'Customer@2026!' })
  });
  customerCookie = custRes.headers.get('set-cookie')?.split(';')[0];

  customerUser = await prisma.user.findUnique({
    where: { email: 'customer@acmecorp.com' }
  });

  // Create or find a secondary customer for tenant isolation testing
  let otherCust = await prisma.user.findFirst({
    where: { role: 'CUSTOMER', email: { not: 'customer@acmecorp.com' } }
  });

  if (!otherCust) {
    otherCust = await prisma.user.create({
      data: {
        email: 'secondary-cust@example.com',
        passwordHash: '$2b$10$w09lP0t7x7FkL0W87Z2Y4eN.7n2aJvB.a1uVbL9xWqI/jGhy7x36K', // hashed dummy
        firstName: 'Secondary',
        lastName: 'Customer',
        role: 'CUSTOMER'
      }
    });
  }
  otherCustomerUser = otherCust;

  // Login secondary customer
  const otherCustRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'customer@acmecorp.com', password: 'Customer@2026!' }) // fallback session
  });
  otherCustomerCookie = otherCustRes.headers.get('set-cookie')?.split(';')[0];

  // Create a clean confirmed test invoice for customerUser
  const year = new Date().getFullYear();
  const invCount = await prisma.invoice.count();
  const invoiceNumber = `INV-${year}-${(invCount + 100).toString().padStart(4, '0')}`;

  const inv = await prisma.invoice.create({
    data: {
      invoiceNumber,
      customerId: customerUser.id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 86400000),
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(Date.now() + 30 * 86400000),
      subtotal: testInvoiceTotal,
      taxAmount: 0,
      discountAmount: 0,
      total: testInvoiceTotal,
      amountPaid: 0,
      outstandingAmount: testInvoiceTotal,
      status: 'CONFIRMED'
    }
  });
  testInvoiceId = inv.id;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('RBAC: Unauthenticated requests cannot access payments endpoints', async () => {
  const res = await fetch(`${baseUrl}/api/payments`);
  assert.equal(res.status, 401);
});

test('RBAC: Customers cannot record payments', async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: customerCookie
    },
    body: JSON.stringify({
      invoiceId: testInvoiceId,
      amount: 100,
      paymentMethod: 'CARD'
    })
  });
  assert.equal(res.status, 403);
});

test('Validation: Rejects payment with missing invoiceId', async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: staffCookie
    },
    body: JSON.stringify({
      amount: 100,
      paymentMethod: 'CARD'
    })
  });
  assert.equal(res.status, 400);
});

test('Validation: Rejects non-positive or invalid payment amounts', async () => {
  const invalidAmounts = [0, -50, 'abc'];
  for (const amt of invalidAmounts) {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: staffCookie
      },
      body: JSON.stringify({
        invoiceId: testInvoiceId,
        amount: amt,
        paymentMethod: 'UPI'
      })
    });
    assert.equal(res.status, 400);
  }
});

test('Validation: Rejects invalid payment method', async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: staffCookie
    },
    body: JSON.stringify({
      invoiceId: testInvoiceId,
      amount: 100,
      paymentMethod: 'BITCOIN_INVALID'
    })
  });
  assert.equal(res.status, 400);
});

test('Overpayment Prevention: Rejects payment exceeding outstanding balance', async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: staffCookie
    },
    body: JSON.stringify({
      invoiceId: testInvoiceId,
      amount: testInvoiceTotal + 500, // 2000 > 1500
      paymentMethod: 'BANK_TRANSFER'
    })
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.message, /cannot exceed the outstanding balance/i);
});

let firstPaymentId;

test('Partial Payment: Staff records partial payment and transitions invoice to PARTIALLY_PAID', async () => {
  const paymentAmount = 500;
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: staffCookie
    },
    body: JSON.stringify({
      invoiceId: testInvoiceId,
      amount: paymentAmount,
      paymentMethod: 'BANK_TRANSFER',
      referenceNote: 'First milestone deposit',
      transactionId: 'TXN-001-PARTIAL'
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.ok(data.data.payment);
  firstPaymentId = data.data.payment.id;
  assert.match(data.data.payment.paymentNumber, /^PAY-\d{4}-\d{4}$/);
  assert.equal(Number(data.data.payment.amount), 500);

  // Verify invoice balance and status
  const invCheck = await prisma.invoice.findUnique({ where: { id: testInvoiceId } });
  assert.equal(Number(invCheck.amountPaid), 500);
  assert.equal(Number(invCheck.outstandingAmount), 1000);
  assert.equal(invCheck.status, 'PARTIALLY_PAID');
});

test('Invoice Association: GET /api/payments/invoice/:invoiceId returns recorded payments', async () => {
  const res = await fetch(`${baseUrl}/api/payments/invoice/${testInvoiceId}`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.data.payments));
  assert.equal(data.data.payments.length, 1);
  assert.equal(data.data.payments[0].id, firstPaymentId);
});

test('Full Payment: Second payment settles remaining balance and transitions invoice to PAID', async () => {
  const remainingBalance = 1000;
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie
    },
    body: JSON.stringify({
      invoiceId: testInvoiceId,
      amount: remainingBalance,
      paymentMethod: 'CARD',
      referenceNote: 'Final balance settlement',
      transactionId: 'TXN-002-FINAL'
    })
  });

  assert.equal(res.status, 201);

  // Verify invoice status is now PAID and outstanding balance is 0
  const invCheck = await prisma.invoice.findUnique({ where: { id: testInvoiceId } });
  assert.equal(Number(invCheck.amountPaid), 1500);
  assert.equal(Number(invCheck.outstandingAmount), 0);
  assert.equal(invCheck.status, 'PAID');
});

test('Idempotency & Guard: Cannot record payments against an already PAID invoice', async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: staffCookie
    },
    body: JSON.stringify({
      invoiceId: testInvoiceId,
      amount: 100,
      paymentMethod: 'CASH'
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.message, /already fully paid/i);
});

test('Guard: Cannot record payment against a CANCELLED invoice', async () => {
  // Create a cancelled invoice
  const inv = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-CANC-${Date.now()}`,
      customerId: customerUser.id,
      issueDate: new Date(),
      dueDate: new Date(),
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(Date.now() + 30 * 86400000),
      subtotal: 500,
      taxAmount: 0,
      discountAmount: 0,
      total: 500,
      amountPaid: 0,
      outstandingAmount: 500,
      status: 'CANCELLED'
    }
  });

  const res = await fetch(`${baseUrl}/api/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: staffCookie
    },
    body: JSON.stringify({
      invoiceId: inv.id,
      amount: 100,
      paymentMethod: 'UPI'
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.message, /cancelled invoice/i);
});

test('Customer Data Isolation: Customer can only view their own payments in list', async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    headers: { cookie: customerCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.data));

  // Every payment returned must belong to the customer
  data.data.forEach((p) => {
    assert.equal(p.customerId, customerUser.id);
  });
});

test('Customer Data Isolation: Customer cannot view another customer payment details', async () => {
  // Create an invoice and payment for another customer
  const foreignInv = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-FOR-${Date.now()}`,
      customerId: otherCustomerUser.id,
      issueDate: new Date(),
      dueDate: new Date(),
      billingPeriodStart: new Date(),
      billingPeriodEnd: new Date(Date.now() + 30 * 86400000),
      subtotal: 300,
      taxAmount: 0,
      discountAmount: 0,
      total: 300,
      amountPaid: 0,
      outstandingAmount: 300,
      status: 'CONFIRMED'
    }
  });

  const foreignPmt = await prisma.payment.create({
    data: {
      paymentNumber: `PAY-FOR-${Date.now()}`,
      invoiceId: foreignInv.id,
      customerId: otherCustomerUser.id,
      amount: 300,
      paymentMethod: 'CASH'
    }
  });

  // customerUser tries to fetch foreign payment
  const res = await fetch(`${baseUrl}/api/payments/${foreignPmt.id}`, {
    headers: { cookie: customerCookie }
  });

  assert.equal(res.status, 403);
});

test('List Filtering: Can filter payments by paymentMethod and date range', async () => {
  const res = await fetch(`${baseUrl}/api/payments?paymentMethod=CARD`, {
    headers: { cookie: staffCookie }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.data));
  data.data.forEach((p) => {
    assert.equal(p.paymentMethod, 'CARD');
  });
});
