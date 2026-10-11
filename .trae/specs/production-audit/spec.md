# Production Audit & Hardening - Product Requirements Document

## Overview
- **Summary**: Audit and harden the existing Next.js 16 e-commerce application (located in `frontend/`) to production-readiness: fix confirmed security vulnerabilities, bugs, and architectural gaps; enforce validation and authorization consistently; add test coverage; and prepare deployment configuration.
- **Purpose**: The application builds and runs but has security weaknesses (in-memory reset codes, hardcoded invite-code defaults, mass-assignment via raw request bodies, no server-side middleware), duplicated/untyped handler logic, N+1 queries, orphaned-auth-user risks, and no automated tests.
- **Target Users**: Customers, store admins, super admins, and the engineering/ops team deploying to Vercel with Supabase.

## Goals
- Eliminate critical security vulnerabilities in auth, admin, and catalog endpoints.
- Enforce Zod validation on every mutating endpoint that currently passes raw `body` to the database.
- Fix confirmed data-integrity bugs (orphaned auth users, coupon usage not rolled back on failed checkout, N+1 order queries, null-safety on cart).
- Add a real Next.js edge middleware protecting `/admin` routes server-side.
- Add a focused automated test suite covering auth, store (cart/checkout), and admin catalog endpoints.
- Clean up legacy root-level boilerplate files that conflict with the real `frontend/` app.
- Verify production build, lint, type-check (where enabled), and a live API smoke test pass.

## Non-Goals
- Rewrite the entire app or introduce new frameworks/infra (no Redis, queues, separate backend).
- Add new payment providers (COD-only is the current business scope).
- Migrate to a different auth provider.
- Change the visual identity or UI.
- Remove working functionality.

## Background & Context
- The real app lives in `frontend/`. Root-level `lib/`, `middleware/`, `pages/`, `types/`, `package.json` (Next 14), and root `README.md` describe a different, unused boilerplate.
- API architecture: single catch-all `/api/[...path]/route.ts` -> `router.ts` -> handlers (`auth`, `store`, `products`, `admin`, `dashboard`, `resources`, `logs`).
- Auth: Supabase Auth JWT (Bearer token). Roles: customer / admin / superadmin.
- All handler files carry `// @ts-nocheck`.
- Build passes cleanly today; no tests exist.
- Supabase env vars are present in `frontend/.env.local`.

## Functional Requirements
- **FR-1**: Auth endpoints (login, register, refresh, profile, change-password, delete-account, forgot/reset password) enforce validation and correct HTTP statuses.
- **FR-2**: Admin/catalog write endpoints validate request bodies against Zod schemas; no raw `body` is inserted/updated directly.
- **FR-3**: Admin routes are protected at the edge by Next.js middleware redirecting unauthenticated/non-admin users.
- **FR-4**: User creation (register, admin/users, admin/customers) does not leave orphaned Supabase auth users if the profile write fails.
- **FR-5**: Checkout rolls back coupon `used_count` if the order fails after coupon increment.
- **FR-6**: Order list endpoints avoid N+1 by batching item/profile fetches.
- **FR-7**: Password-reset codes and rate-limiting state are not exposed to clients and do not rely on in-memory-only storage for correctness in serverless.
- **FR-8**: Invite codes for admin/superadmin registration are not hardcoded defaults; missing env var returns an error rather than falling back to a known code.
- **FR-9**: A test suite covers: auth login success/failure, cart add/get, checkout success path, admin product create validation, and unauthenticated access rejection.

## Non-Functional Requirements
- **NFR-1**: Production build (`next build`) succeeds with no errors.
- **NFR-2**: Lint passes on changed files (or documented existing failures not introduced).
- **NFR-3**: No secrets or reset codes are returned in API responses.
- **NFR-4**: Error responses never leak stack traces to clients in production.
- **NFR-5**: All mutating admin endpoints return 401 without a token and 403 for insufficient role.

## Constraints
- **Technical**: Next.js 16 App Router, Supabase (Postgres + Auth + Storage), Zod, Axios, Vercel deployment. Node runtime for API routes (already set).
- **Business**: Preserve existing REST API shape so the existing frontend keeps working.
- **Dependencies**: Must not break the existing admin UI or storefront flows.

## Assumptions
- The Vercel deployment root is the `frontend/` directory (as indicated by `frontend/vercel.json` and `frontend/package.json`).
- A real Supabase project is available and reachable from this environment for smoke testing.
- Existing demo users (superadmin@amazonstore.com / Super@123456 etc.) may exist from a prior seed; tests that need users will register their own test users and clean up.

## Acceptance Criteria

### AC-1: No hardcoded invite-code defaults
- **Type**: `rule`
- **Given**: `ADMIN_INVITE_CODE` and `SUPERADMIN_INVITE_CODE` are not set in the environment
- **When**: A registration request with role `admin` or `superadmin` is submitted
- **Then**: The server returns 403 and does not use a default known invite code
- **Pass Condition**: Code inspection of `auth.ts` register branch shows no `|| "..."` fallback; response is 403
- **Evidence**: Source diff + curl test

### AC-2: Reset code not leaked in response
- **Type**: `rule`
- **Given**: A forgot-password request is made
- **When**: The response is inspected
- **Then**: The response body does not contain the reset code (`devCode` field removed)
- **Pass Condition**: `devCode` absent from the forgot-password response in all environments
- **Evidence**: Source diff + curl test

### AC-3: Admin endpoints validate body (no raw insert)
- **Type**: `rule`
- **Given**: A POST/PUT to `/admin/categories`, `/admin/brands`, `/admin/coupons`, `/admin/warehouses`, `/admin/roles`, `/admin/permissions`, `/admin/settings`
- **When**: The request body is missing required fields or has wrong types
- **Then**: The server returns 400 with a validation message and does not touch the database
- **Pass Condition**: Each listed endpoint uses a Zod schema (or explicit allow-list) before insert/update
- **Evidence**: Source diff + curl negative test

### AC-4: Edge middleware protects /admin
- **Type**: `rule`
- **Given**: An unauthenticated request to `/admin/dashboard`
- **When**: The request hits the Next.js edge
- **Then**: It is redirected to `/auth/login` before reaching the page handler
- **Pass Condition**: `frontend/middleware.ts` exists, exports default `middleware`, and matcher covers `/admin/:path*`
- **Evidence**: Source file existence + curl 307/308 test

### AC-5: No orphaned auth user on profile write failure
- **Type**: `rule`
- **Given**: Register or admin user creation
- **When**: The profile row write fails after `auth.admin.createUser` succeeds
- **Then**: The auth user is deleted (compensation) so no orphan remains
- **Pass Condition**: Both register and admin/users/customers create paths wrap profile writes in try/catch with `auth.admin.deleteUser` on failure
- **Evidence**: Source diff

### AC-6: Coupon rollback on checkout failure
- **Type**: `rule`
- **Given**: A checkout with a valid coupon where order creation fails after `used_count` is incremented
- **When**: The order insert errors
- **Then**: `used_count` is decremented back
- **Pass Condition**: Checkout handler decrements `used_count` in the order-error path
- **Evidence**: Source diff

### AC-7: Order list uses batched queries
- **Type**: `rule`
- **Given**: `/admin/orders` and `/store/orders` list endpoints
- **When**: Multiple orders are returned
- **Then**: Items and profiles are fetched with `in` queries (not per-order loops)
- **Pass Condition**: No per-order `select` inside a loop for items/profiles in either handler
- **Evidence**: Source diff

### AC-8: Cart null-safety
- **Type**: `rule`
- **Given**: A cart cannot be created (DB error)
- **When**: `/store/cart` GET is called
- **Then**: Returns a 500 error instead of crashing on `cart!.id`
- **Pass Condition**: `getOrCreateCart` result is null-checked before use
- **Evidence**: Source diff

### AC-9: Automated test suite exists and passes
- **Type**: `rule`
- **Given**: The test command `npm test` (or `npm run test:api`)
- **When**: Run from `frontend/`
- **Then**: Tests for auth, cart, checkout, admin-product validation, and unauthenticated access execute and pass
- **Pass Condition**: Test runner exits 0
- **Evidence**: Command output

### AC-10: Production build passes
- **Type**: `rule`
- **Given**: All changes applied
- **When**: `next build` runs in `frontend/`
- **Then**: Build succeeds with exit code 0
- **Evidence**: Command output

### AC-11: Legacy root files do not interfere
- **Type**: `rubric`
- **Dimension**: Repository clarity and deployment safety
- **Scale**: 1-5
- **Anchors**: 1 = root `package.json`/`pages/` still conflict with frontend app; 3 = legacy files removed or clearly marked; 5 = root contains only deployment-relevant files and a clear README
- **Pass Threshold**: >= 4
- **Evidence**: `ls` of root + README content

## Open Questions
- [ ] None blocking; implementation proceeds with the above scope.
