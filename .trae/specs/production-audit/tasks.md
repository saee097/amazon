# Production Audit & Hardening - Implementation Plan

## Task 1: Harden auth handler (invite codes, reset-code leak, in-memory state)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Remove hardcoded default invite codes (`|| "ADMIN-2025"`, `|| "SUPER-2025"`); return 403 if env var missing when an admin/superadmin role is requested.
  - Remove `devCode` from the forgot-password response.
  - Keep `resetCodes` in-memory but add a clear comment + TODO noting serverless limitation; do not fabricate DB persistence beyond current scope. (Out-of-scope full DB-backed reset is a known limitation.)
  - Ensure `attempts` rate-limit map is documented as best-effort per-instance.
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `rule` TR-1.1: Register with role `admin` and no `ADMIN_INVITE_CODE` env returns 403 (set/override env or test the code path). Evidence: curl + source.
  - `rule` TR-1.2: Forgot-password response JSON has no `devCode` key. Evidence: curl.

## Task 2: Add Zod validation to admin/catalog write endpoints (no raw body insert)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - In `admin.ts` and `products.ts`/`resources.ts`, replace direct `insert(body)` / `update(body)` for categories, brands, coupons, warehouses, roles, permissions, settings, banners, menu-items with schema-validated payloads (reuse existing schemas where present; add small schemas for the rest).
  - Keep field mapping intact so the existing frontend payloads still work.
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `rule` TR-2.1: POST `/admin/categories` with `{}` returns 400. Evidence: curl.
  - `rule` TR-2.2: POST `/admin/coupons` with missing `code`/`discount_value` returns 400. Evidence: curl.

## Task 3: Add edge middleware for /admin protection
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Create `frontend/middleware.ts` exporting a default `middleware` that reads the auth token from the `authToken` cookie (or Authorization header) and redirects unauthenticated/non-admin users away from `/admin/:path*`.
  - Reuse role logic from `src/proxy.ts` but as a real Next.js middleware.
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `rule` TR-3.1: `frontend/middleware.ts` exists and exports default `middleware` with matcher `/admin/:path*`. Evidence: source.
  - `rule` TR-3.2: Unauthenticated GET `/admin/dashboard` returns 307/308 to `/auth/login`. Evidence: curl against dev server.

## Task 4: Prevent orphaned auth users on profile write failure
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - In `auth.ts` register, `admin.ts` `/admin/users` POST, and `admin.ts` `/admin/customers` POST: wrap the profile insert/update in try/catch; on failure call `supabase.auth.admin.deleteUser(authUser.id)` and return the error.
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `rule` TR-4.1: All three create paths contain a catch that calls `deleteUser` when profile write fails. Evidence: source inspection.

## Task 5: Roll back coupon used_count on checkout failure
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - In `store.ts` checkout, after incrementing `coupons.used_count`, if the subsequent order insert fails, decrement `used_count` back before returning the error.
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `rule` TR-5.1: Checkout order-error path contains a `coupons.update({ used_count: ... })` decrement. Evidence: source.

## Task 6: Batch order list queries (remove N+1)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - In `admin.ts` `/admin/orders` GET and `store.ts` `/store/orders` GET: collect order IDs, fetch all `order_items` in one `.in("order_id", ids)` query and all profiles in one `.in("id", userIds)` query, then map.
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `rule` TR-6.1: No per-order `select` for items/profiles inside the order loop. Evidence: source.

## Task 7: Cart null-safety
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - In `store.ts`, null-check the result of `getOrCreateCart` before using `cart.id`; return 500 if cart is null.
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `rule` TR-7.1: `getOrCreateCart` callers check for null and return an error response. Evidence: source.

## Task 8: Add automated API test suite
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3
- **Description**:
  - Add a test runner (node:test or vitest) and a `tests/` directory with API integration tests using the real local dev server (`npm run dev`) on a test port, OR use Next's route handlers directly via `fetch`.
  - Tests: login success/failure, forgot-password no devCode, unauthenticated admin access rejected, cart add/get, category create validation (400 on empty).
  - Add `test` and `test:api` scripts to `frontend/package.json`.
  - Register and clean up test users to avoid polluting the DB.
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `rule` TR-8.1: `npm run test:api` exits 0. Evidence: command output.

## Task 9: Clean up legacy root-level files & fix env examples
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None
- **Description**:
  - Remove or clearly relocate unused root boilerplate: root `lib/`, `middleware/`, `pages/`, `types/`, root `package.json`, root `package-lock.json`, root `next-env.d.ts`, root `tsconfig.tsbuildinfo`, root `.env.example`, root `README.md` (replace with a pointer README).
  - Ensure `frontend/.env.example` covers all vars used (Supabase, site URL, API URL, Google, Resend, invite codes).
  - Add `ADMIN_INVITE_CODE` / `SUPERADMIN_INVITE_CODE` to `frontend/.env.example`.
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `rubric` TR-9.1: Repository clarity; scale 1-5; anchors 1/3/5; threshold >= 4; evidence: root listing.

## Task 10: Verify build, lint, and live smoke test
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1-9
- **Description**:
  - Run `next build`, `eslint`, and start the dev server to smoke-test key endpoints (health, login, products, admin unauthenticated redirect).
- **Acceptance Criteria Addressed**: AC-10, AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `rule` TR-10.1: `npm run build` exits 0. Evidence: output.
  - `rule` TR-10.2: `GET /api/health` returns 200. Evidence: curl.
  - `rule` TR-10.3: `GET /admin/dashboard` unauthenticated returns redirect. Evidence: curl.
