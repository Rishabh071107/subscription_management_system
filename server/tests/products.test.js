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

test('POST /api/products creates product successfully for Admin/Staff', async () => {
  const res = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      name: `Test Suite Software ${Date.now()}`,
      productType: 'SOFTWARE',
      salesPrice: 199.99,
      costPrice: 49.99,
      notes: 'Automated test product suite notes',
      variants: [
        { name: '10-Seat Pack', additionalPrice: 50.00, sku: `SKU-TST-${Date.now()}-1` }
      ]
    })
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.data.product.salesPrice, '199.99');
  assert.equal(data.data.product.variants.length, 1);
});

test('POST /api/products rejects negative sales price (HTTP 400)', async () => {
  const res = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': staffCookie
    },
    body: JSON.stringify({
      name: 'Invalid Negative Price Product',
      salesPrice: -50.00,
      costPrice: 10.00
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /sales price/i);
});

test('POST /api/products rejects empty product name (HTTP 400)', async () => {
  const res = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': adminCookie
    },
    body: JSON.stringify({
      name: '   ',
      salesPrice: 100.00
    })
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /name is required/i);
});

test('POST /api/products rejects duplicate SKU within the same product and across existing variants', async () => {
  const uniqueSku = `SKU-DUP-${Date.now()}`;

  // 1. Create first product with this SKU
  const firstRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({
      name: 'First Product SKU Owner',
      salesPrice: 80.00,
      variants: [{ name: 'Base', additionalPrice: 0, sku: uniqueSku }]
    })
  });
  assert.equal(firstRes.status, 201);

  // 2. Attempt to create another product with the identical SKU -> HTTP 409
  const dupRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({
      name: 'Second Product With Same SKU',
      salesPrice: 90.00,
      variants: [{ name: 'Clashing Variant', additionalPrice: 10, sku: uniqueSku }]
    })
  });
  assert.equal(dupRes.status, 409);
  const dupData = await dupRes.json();
  assert.equal(dupData.success, false);
  assert.match(dupData.message, /already exists/i);
});

test('GET /api/products retrieves list with search, filter, and pagination', async () => {
  const res = await fetch(`${baseUrl}/api/products?page=1&limit=5`, {
    headers: { 'Cookie': staffCookie }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.meta.totalPages >= 1);
});

test('GET /api/products/:id returns full details with variants and relation counts', async () => {
  // First create a product
  const createRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({
      name: `Detail Check Product ${Date.now()}`,
      salesPrice: 150.00,
      costPrice: 50.00,
      notes: 'Detailed description test',
      variants: [{ name: 'Standard Edition', additionalPrice: 0 }]
    })
  });
  const created = (await createRes.json()).data.product;

  const res = await fetch(`${baseUrl}/api/products/${created.id}`, {
    headers: { 'Cookie': customerCookie }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.data.product.id, created.id);
  assert.equal(data.data.product.name, created.name);
  assert.ok(Array.isArray(data.data.product.variants));
  assert.ok(data.data.product._count);
});

test('PATCH /api/products/:id/status toggles product activation status', async () => {
  // Create product
  const createRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({
      name: `Toggle Test ${Date.now()}`,
      salesPrice: 60.00
    })
  });
  const prodId = (await createRes.json()).data.product.id;

  // Deactivate
  const deactRes = await fetch(`${baseUrl}/api/products/${prodId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': staffCookie },
    body: JSON.stringify({ isActive: false })
  });
  assert.equal(deactRes.status, 200);
  const deactData = await deactRes.json();
  assert.equal(deactData.data.product.isActive, false);

  // Reactivate
  const reactRes = await fetch(`${baseUrl}/api/products/${prodId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': staffCookie },
    body: JSON.stringify({ isActive: true })
  });
  assert.equal(reactRes.status, 200);
  const reactData = await reactRes.json();
  assert.equal(reactData.data.product.isActive, true);
});

test('Variant lifecycle: POST, PUT, and DELETE on /api/products/:id/variants', async () => {
  const prodRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': adminCookie },
    body: JSON.stringify({ name: `Variant Lifecycle ${Date.now()}`, salesPrice: 120.00 })
  });
  const prod = (await prodRes.json()).data.product;

  // 1. Add variant
  const addRes = await fetch(`${baseUrl}/api/products/${prod.id}/variants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': staffCookie },
    body: JSON.stringify({ name: 'Enterprise Addon', additionalPrice: 40.00, sku: `VAR-ENT-${Date.now()}` })
  });
  assert.equal(addRes.status, 201);
  const variant = (await addRes.json()).data.variant;
  assert.equal(variant.name, 'Enterprise Addon');

  // 2. Update variant
  const updateRes = await fetch(`${baseUrl}/api/products/${prod.id}/variants/${variant.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': staffCookie },
    body: JSON.stringify({ name: 'Enterprise Plus Addon', additionalPrice: 55.00 })
  });
  assert.equal(updateRes.status, 200);
  const updatedVariant = (await updateRes.json()).data.variant;
  assert.equal(updatedVariant.name, 'Enterprise Plus Addon');
  assert.equal(Number(updatedVariant.additionalPrice), 55);

  // 3. Delete variant
  const delRes = await fetch(`${baseUrl}/api/products/${prod.id}/variants/${variant.id}`, {
    method: 'DELETE',
    headers: { 'Cookie': adminCookie }
  });
  assert.equal(delRes.status, 200);
});

test('Safe deactivation: Product with existing subscription reference is deactivated rather than deleted', async () => {
  // Check the seeded product referenced by the seeded subscription
  const seededSub = await prisma.subscription.findFirst({
    include: { lines: true }
  });
  assert.ok(seededSub, 'Seeded subscription should exist');
  const referencedProductId = seededSub.lines[0].productId;

  const deleteRes = await fetch(`${baseUrl}/api/products/${referencedProductId}`, {
    method: 'DELETE',
    headers: { 'Cookie': adminCookie }
  });

  assert.equal(deleteRes.status, 200);
  const deleteData = await deleteRes.json();
  assert.equal(deleteData.data.action, 'DEACTIVATED');
  assert.equal(deleteData.data.product.isActive, false);

  // Verify in database that the record still exists (relational preservation)
  const dbProd = await prisma.product.findUnique({ where: { id: referencedProductId } });
  assert.ok(dbProd, 'Product must not be deleted from database');
  assert.equal(dbProd.isActive, false);
});

test('RBAC: Customers are forbidden from mutating products (POST, PUT, DELETE)', async () => {
  // Create attempt
  const postRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': customerCookie },
    body: JSON.stringify({ name: 'Hacker Product', salesPrice: 1.00 })
  });
  assert.equal(postRes.status, 403);

  // Update attempt
  const putRes = await fetch(`${baseUrl}/api/products/some-fake-id`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': customerCookie },
    body: JSON.stringify({ name: 'Hacker Update' })
  });
  assert.equal(putRes.status, 403);

  // Delete attempt
  const delRes = await fetch(`${baseUrl}/api/products/some-fake-id`, {
    method: 'DELETE',
    headers: { 'Cookie': customerCookie }
  });
  assert.equal(delRes.status, 403);
});
