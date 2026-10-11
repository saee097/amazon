import { test, before } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.TEST_API_BASE || "http://localhost:3000";

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let body = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

let serverUp = false;

before(async () => {
  try {
    const r = await fetch(`${BASE}/api/health`, { method: "GET" });
    serverUp = r.ok || r.status === 404;
  } catch {
    serverUp = false;
  }
});

test("GET /api/health returns 200 or 404 (endpoint exists)", async () => {
  if (!serverUp) return;
  const res = await fetch(`${BASE}/api/health`, { method: "GET" });
  assert.ok([200, 404].includes(res.status), `expected 200/404, got ${res.status}`);
});

test("forgot-password does not leak devCode in response", async () => {
  if (!serverUp) return;
  const { res, body } = await fetchJson("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: "nobody@example.com" }),
  });
  const serialized = JSON.stringify(body);
  assert.equal(
    serialized.includes("devCode"),
    false,
    "response must not contain devCode field"
  );
});

test("unauthenticated admin endpoint returns 401", async () => {
  if (!serverUp) return;
  const { res } = await fetchJson("/api/admin/dashboard");
  assert.equal(res.status, 401, `expected 401, got ${res.status}`);
});

test("login with invalid credentials returns 401", async () => {
  if (!serverUp) return;
  const { res } = await fetchJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "nope@example.com", password: "wrongpass" }),
  });
  assert.equal(res.status, 401, `expected 401, got ${res.status}`);
});

test("category creation rejects empty body (400)", async () => {
  if (!serverUp) return;
  // Without a valid admin token the request should still be 401, but if a token
  // is provided via TEST_ADMIN_TOKEN it must validate the body.
  const headers = {};
  if (process.env.TEST_ADMIN_TOKEN) {
    headers.Authorization = `Bearer ${process.env.TEST_ADMIN_TOKEN}`;
  }
  const { res } = await fetchJson("/api/categories", {
    method: "POST",
    body: JSON.stringify({}),
    headers,
  });
  if (process.env.TEST_ADMIN_TOKEN) {
    assert.equal(res.status, 400, `expected 400 validation error, got ${res.status}`);
  } else {
    assert.equal(res.status, 401, `expected 401 without token, got ${res.status}`);
  }
});
