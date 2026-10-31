import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/db.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test('Database connection is healthy and responsive', async () => {
  const result = await prisma.$queryRaw`SELECT 1 as connected`;
  assert.equal(Number(result[0].connected), 1);
});

test('GET /api/health returns 200 with success status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.message.includes('healthy'));
});

test('GET /api/unknown returns 404 with error message', async () => {
  const res = await fetch(`${baseUrl}/api/unknown-endpoint-testing`);
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.success, false);
});

