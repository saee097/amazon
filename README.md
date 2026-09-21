# Amazon E-Commerce Platform

A production-grade, full-stack e-commerce platform inspired by modern marketplaces, built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **Supabase PostgreSQL + Auth**, **Redux Toolkit**, **Zod**, **Axios**, and **Vercel**.

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
  - [Customer Storefront](#customer-storefront)
  - [Authentication & Authorization](#authentication--authorization)
  - [Admin Dashboard](#admin-dashboard)
  - [Super Admin Panel](#super-admin-panel)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Development](#development)
- [API Overview](#api-overview)
- [RBAC & Permissions](#rbac--permissions)
- [Deployment](#deployment)
- [Scripts](#scripts)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Architecture

```
Browser → Vercel (Next.js Frontend + API Routes) → Supabase (PostgreSQL + Auth)
```

- **Frontend**: Next.js 16 App Router with React 19, TypeScript, Tailwind CSS 4
- **State Management**: Redux Toolkit with Redux Persist (auth, cart, wishlist slices)
- **API**: Next.js Route Handlers (`/api/*`) + catch-all proxy with Axios interceptors
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Auth**: Supabase Auth with JWT tokens, email verification, OAuth-ready, role-based access control

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| State | Redux Toolkit + Redux Persist |
| HTTP Client | Axios (typed interceptors, token refresh) |
| Validation | Zod (server-side schemas, request/response validation) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (JWT, email OTP, OAuth-ready) |
| Email | Resend (verification codes, password reset) |
| Icons | Lucide React, React Icons |
| Animations | Framer Motion |
| Maps | Google Maps JS API |
| Hosting | Vercel |

## Features

### Customer Storefront

| Feature | Description |
|---------|-------------|
| Homepage | Hero carousel, featured products, daily deals, categories, testimonials, newsletter signup |
| Product Catalog | Grid listing with filtering, sorting, pagination, category sidebar |
| Product Details | Image gallery with hover-zoom, variants (size/color), inventory-aware quantity, add-to-cart, related products |
| Search | Search results with filters |
| Shopping Cart | Persistent cart (Redux Persist + DB), qty adjustment, price summary, checkout entry |
| Wishlist | Saved products grid, move to cart |
| Checkout | Shipping address, shipping method, payment (cash on delivery), order review, coupon validation |
| Orders | Order history with status tracking |
| Order Tracking | Enter order number + email to view shipment status |
| Addresses | CRUD for multiple saved addresses |
| Profile | Edit personal info, order history, password change |
| Returns | Return request creation |
| Reviews | Product reviews |
| Notifications | In-app notification center |
| Settings | Account settings, password change |
| Coupons | Validate and apply discount codes |
| Contact | Contact form with store info and map embed |
| Static Pages | About, FAQ, Terms, Privacy, Size Guide, Shipping, Returns, Refunds policies |
| Store Locator | List and map of physical store locations |
| Sitemap & SEO | Dynamic product/category pages with slug support |

### Authentication & Authorization

| Feature | Description |
|---------|-------------|
| Login | Email/password with rate limiting, account lock/suspension check |
| Registration | Name, email, password + confirmation, terms checkbox, role-based invite codes |
| Email Verification | OTP verification with code entry, auto-focus, resend timer |
| Password Reset | Forgot password → email code → set new password with strength meter |
| OAuth | Google OAuth callback handler |
| Session Management | JWT access + refresh tokens, session validation, auto token refresh |
| Account Deletion | Soft-delete user and auth account |
| Role-Based Access | Customer, Admin, Super Admin roles with granular permissions |

### Admin Dashboard

| Section | Features |
|---------|----------|
| Dashboard | KPI cards (revenue, orders, customers, products), quick actions, recent activity |
| Products | CRUD with search, image upload, variants, SKU, inventory, SEO fields, featured toggle |
| Categories | Tree-view management with create/edit/delete |
| Brands | CRUD with logo upload |
| Orders | Search, filter by status/payment, CSV export, status/payment updates, order detail |
| Customers | Search/filter, status toggle, bulk actions, create/edit |
| Inventory | Overview (total/in stock/low/out of stock), inline quantity editing, CSV export |
| Stock | Stock records with warehouse, product, type, quantity; inline add stock |
| Shipments | Status cards, search by tracking/order/carrier, inline status updates, CSV export |
| Coupons | CRUD with type, value, limits, date ranges, status |
| Vendors | CRUD with commission tracking |
| Support Tickets | CRUD with priority and status |
| Notifications | CRUD with type and read status |
| Collections | Drag-and-drop reordering, create/edit/delete |
| Menu Items | Drag-and-drop reordering, URL/sort-order/status management |
| Banners | Image upload, view toggle (table/cards), filter, preview, sort order |
| Settings | Tabbed interface (General, Security, Email, Maintenance) |
| Security | 8 setting groups (Auth, 2FA, Session, Rate Limiting, API Security, CSP, Audit, Compliance) |
| Analytics | Revenue charts, order pipeline, top products, daily breakdown, fulfillment metrics |
| Roles | CRUD with permission assignment (grouped checkboxes) |
| Permissions | CRUD with module-based grouping |
| Users | Search/filter/bulk actions, role assignment (superadmin-only for superadmins) |
| Admins | Manage admin users with granular permissions (superadmin-only) |
| Profile | Admin profile (Profile, Security, Notifications, Privacy tabs) |
| Reviews | Read-only review management |
| FAQ | FAQ management |
| Reports | View-only reports |
| Activity Logs | Filterable audit trail with CSV export, detail modal with diffs |
| System Health | Database, API, storage status checks |

### Super Admin Panel

| Feature | Description |
|---------|-------------|
| Super Dashboard | System stats, revenue/order summary, system health cards, recent critical logs |
| All Users | Read-only listing of all users with role/status badges |
| Manage Admins | Admin user CRUD with permission assignment (superadmin-only) |
| Unrestricted Access | Full system configuration and administrative capabilities |

## Project Structure

```
amazon/
├── README.md
├── DEPLOYMENT.md
├── .gitignore
├── frontend/
│   ├── .env.example
│   ├── .env.local
│   ├── .env.production.local
│   ├── .gitignore
│   ├── .next/
│   ├── .vercel/
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.mjs
│   ├── public/
│   ├── scripts/
│   │   ├── seed.ts
│   │   ├── migrate.mjs
│   │   ├── apply-migrations.mjs
│   │   ├── check-data.mjs
│   │   ├── debug-*.ts
│   │   ├── test-*.mjs
│   │   └── ... (29 scripts total)
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   │   ├── page.tsx            # Homepage
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   ├── not-found.tsx
│   │   │   ├── forbidden.tsx
│   │   │   ├── globals.css
│   │   │   ├── favicon.ico
│   │   │   ├── auth/               # Login, register, forgot-password, reset-password, verify-email, verify-code, google OAuth
│   │   │   ├── products/           # Product listing + product detail
│   │   │   ├── cart/               # Shopping cart
│   │   │   ├── checkout/           # Checkout flow
│   │   │   ├── wishlist/           # Wishlist
│   │   │   ├── orders/             # Order history
│   │   │   ├── profile/            # Customer profile
│   │   │   ├── addresses/          # Saved addresses
│   │   │   ├── search/             # Search results
│   │   │   ├── track-order/        # Order tracking
│   │   │   ├── settings/           # Account settings
│   │   │   ├── about/              # About Us
│   │   │   ├── faq/                # FAQ
│   │   │   ├── terms/              # Terms of Service
│   │   │   ├── privacy/            # Privacy Policy
│   │   │   ├── size-guide/         # Size guide
│   │   │   ├── stores/             # Store locator
│   │   │   ├── shipping/           # Shipping policy
│   │   │   ├── return/             # Return policy
│   │   │   ├── refunds/            # Refund policy
│   │   │   ├── contact/            # Contact page
│   │   │   ├── unauthorized/       # Access denied
│   │   │   └── admin/              # Admin dashboard (all admin pages)
│   │   │       ├── layout.jsx
│   │   │       ├── dashboard/
│   │   │       ├── products/       # List, create, edit
│   │   │       ├── categories/     # List, create, edit
│   │   │       ├── brands/         # List, create, edit
│   │   │       ├── orders/         # List, detail
│   │   │       ├── customers/      # List, create, edit
│   │   │       ├── inventory/
│   │   │       ├── stock/
│   │   │       ├── shipments/
│   │   │       ├── coupons/        # List, create
│   │   │       ├── vendors/
│   │   │       ├── support/
│   │   │       ├── superadmin/     # Super admin pages
│   │   │       ├── roles/
│   │   │       ├── permissions/
│   │   │       ├── users/
│   │   │       ├── admins/
│   │   │       ├── settings/
│   │   │       ├── security/
│   │   │       ├── analytics/
│   │   │       ├── logs/
│   │   │       ├── banners/
│   │   │       ├── collections/
│   │   │       ├── menu/
│   │   │       ├── notifications/
│   │   │       ├── reviews/
│   │   │       ├── faqs/
│   │   │       ├── blogs/
│   │   │       ├── newsletter/
│   │   │       ├── warehouses/
│   │   │       ├── returns/
│   │   │       ├── refunds/
│   │   │       ├── payments/
│   │   │       ├── variants/
│   │   │       └── profile/
│   │   │   └── api/                # API route handlers
│   │   │       ├── [...path]/route.ts    # Catch-all API proxy
│   │   │       ├── health/route.ts
│   │   │       ├── debug-coupons/route.ts
│   │   │       ├── debug-coupons2/route.ts
│   │   │       ├── debug-coupons-test/route.ts
│   │   │       └── debug-checkout/route.ts
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── AdminLayout.jsx       # Admin sidebar + topbar layout
│   │   │   │   ├── ResourceManager.jsx   # Generic CRUD table component
│   │   │   │   └── ImageUpload.jsx       # Image upload with drag-drop
│   │   │   ├── ui/
│   │   │   │   ├── Toast.jsx             # Toast notification system
│   │   │   │   ├── ProductImage.tsx      # Resilient image renderer
│   │   │   │   └── ProductImageGallery.tsx # Interactive gallery with zoom
│   │   │   ├── ClientShell.tsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── RoleBadge.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── lib/
│   │   │   ├── api.js            # Axios instance + interceptors
│   │   │   ├── auth.js           # Client auth (localStorage + cookies)
│   │   │   ├── rbac.js           # Client-side RBAC + route guards
│   │   │   ├── store.js          # Redux Toolkit store (auth, cart, wishlist)
│   │   │   ├── storeEvents.ts
│   │   │   ├── queryParams.js
│   │   │   └── images.ts
│   │   └── server/
│   │       ├── api/
│   │       │   ├── router.ts     # Route dispatcher
│   │       │   └── handlers/
│   │       │       ├── auth.ts
│   │       │       ├── store.ts
│   │       │       ├── dashboard.ts
│   │       │       ├── admin.ts
│   │       │       ├── resources.ts
│   │       │       ├── products.ts
│   │       │       └── logs.ts
│   │       ├── lib/
│   │       │   ├── auth.ts       # Server auth (requireAuth, requireAdmin, requirePermission)
│   │       │   ├── response.ts   # JSON response helpers
│   │       │   ├── mapper.ts     # DB row → API response mappers
│   │       │   ├── validation.ts # Zod validation wrapper
│   │       │   ├── validate.ts
│   │       │   ├── params.ts     # Query parameter parsing
│   │       │   ├── permissions.ts # RBAC permission definitions
│   │       │   ├── env.ts
│   │       │   └── email.ts      # Resend email service
│   │       └── supabase/
│   │           └── admin.ts      # Supabase admin client singleton
│   └── public/
├── supabase/
│   ├── migrations/
│   │   ├── 20260101000000_initial_schema.sql         # Core schema (30 tables, enums, RLS, functions, triggers)
│   │   ├── 20260903000000_catalog_demo_media.sql
│   │   ├── 20260905000000_auth_production_refinements.sql
│   │   ├── 20260906000000_add_product_columns.sql
│   │   ├── 20260906000001_production_gaps.sql
│   │   ├── 20260907000000_admin_profile_preferences.sql
│   │   ├── 20260913000000_fix_rls_recursion.sql
│   │   ├── 20260913000000_inventory_threshold_override.sql
│   │   ├── 20260914000000_faqs_table.sql
│   │   └── 20260920000000_coupon_enhancements.sql
│   └── seed.sql
└── .gitignore
```

## Database Schema

The database runs on **Supabase PostgreSQL** with **Row Level Security (RLS)**. The initial migration creates **30 tables** across 10+ domains:

### Authentication & Users
- **profiles** — User profiles linked to `auth.users` (names, contact, role, status, permissions, avatar, verification)
- **roles** — Named application roles with permission slugs
- **permissions** — Permission definitions
- **security_settings** — Key/value security configuration

### Catalog
- **brands** — Product brands with logos and status
- **categories** — Hierarchical categories (self-referencing parent)
- **products** — Products with pricing, SKU, inventory, SEO fields, media
- **product_variants** — Size/color variants with pricing and inventory
- **product_images** — Product image URLs with alt text and ordering
- **collections** — Curated product groupings

### Shopping
- **carts** — Persistent carts per user (with optional coupon)
- **cart_items** — Items in carts (products + optional variants)
- **wishlists** — Wishlisted products
- **coupons** — Discount codes with usage limits, dates, per-user caps

### Customer Data
- **addresses** — User shipping/billing addresses

### Orders & Fulfillment
- **orders** — Orders with statuses, payment method, shipping snapshot
- **order_items** — Immutable line items per order
- **shipments** — Carrier, tracking, lifecycle timestamps

### Inventory
- **warehouses** — Warehouse locations
- **stock** — Product/variant quantities per warehouse

### Returns & Refunds
- **returns** — Customer return requests
- **refunds** — Refund amounts and processing status

### Engagement
- **reviews** — Product ratings and comments
- **support_tickets** — Support requests with priority/status
- **notifications** — Notifications with type and read status

### Storefront Content
- **banners** — Promotional banners
- **menu_items** — Navigation links with ordering

### Administration & Auditing
- **app_settings** — JSON settings grouped by category
- **audit_logs** — Admin actions with IP, timestamp, details
- **vendors** — Vendor contacts with commission

### Key Database Features
- **RLS policies** on customer, order, review, and catalog tables
- **Automatic `updated_at` triggers** on profiles, products, carts, orders, stock
- **Auth trigger** that auto-creates a profile on new `auth.users` registration
- **Inventory RPC functions** (`reserve_inventory`, `commit_inventory`, `adjust_inventory`) for atomic stock operations
- **Public read access** for active products, categories, brands, banners, and menu items

## Getting Started

### Prerequisites

- **Node.js 20+**
- **npm**
- A **Supabase** project (free tier at [supabase.com](https://supabase.com))

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — server-side only, never expose to browser |
| `NEXT_PUBLIC_SITE_URL` | Your site URL for redirect links |
| `NEXT_PUBLIC_API_URL` | API base URL (default: `/api`) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key (optional) |
| `NEXT_PUBLIC_GOOGLE_ENABLED` | Set to `true` to enable Google OAuth (default: `false`) |
| `RESEND_API_KEY` | Resend API key for emails (optional) |
| `FROM_EMAIL` | Sender email for notifications (optional) |

### Database Setup

1. In Supabase SQL Editor, run all migrations in order (oldest first):
   ```
   supabase/migrations/20260101000000_initial_schema.sql
   supabase/migrations/20260903000000_catalog_demo_media.sql
   supabase/migrations/20260905000000_auth_production_refinements.sql
   supabase/migrations/20260906000000_add_product_columns.sql
   supabase/migrations/20260906000001_production_gaps.sql
   supabase/migrations/20260907000000_admin_profile_preferences.sql
   supabase/migrations/20260913000000_fix_rls_recursion.sql
   supabase/migrations/20260913000000_inventory_threshold_override.sql
   supabase/migrations/20260914000000_faqs_table.sql
   supabase/migrations/20260920000000_coupon_enhancements.sql
   ```

2. Run the seed script:
   ```bash
   npm run seed
   ```

3. Run migrations from the project root:
   ```bash
   npm run db:migrate
   ```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). API at [http://localhost:3000/api](http://localhost:3000/api).

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## API Overview

The backend uses **Next.js Route Handlers** with a catch-all proxy (`/api/[...path]`) and standalone routes. All API responses follow the `{ success, data }` envelope (or `{ success: false, message }` for errors).

### Auth API (`/api/auth/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login with email/password (rate limited) |
| POST | `/api/auth/register` | No | Register (role-based invite codes for admin/superadmin) |
| POST | `/api/auth/refresh` | No | Refresh session tokens |
| GET | `/api/auth/verify` | Token | Verify session |
| GET | `/api/auth/sessions` | Token | Recent login/logout audit events |
| GET | `/api/auth/profile` | Token | Get current user profile |
| PUT | `/api/auth/profile` | Token | Update profile fields |
| PUT | `/api/auth/change-password` | Token | Change password |
| POST | `/api/auth/delete-account` | Token | Soft-delete user |
| POST | `/api/auth/forgot-password` | No | Request password reset code |
| POST | `/api/auth/verify-code` | No | Verify 6-digit code |
| POST | `/api/auth/reset-password` | No | Reset password with verified code |
| GET | `/api/auth/verify-email/:token` | No | Verify email OTP |

### Store API (`/api/store/*`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/store/products` | No | List products with filters, sorting, pagination |
| GET | `/api/store/products/:idOrSlug` | No | Product detail |
| GET | `/api/store/categories` | No | List categories |
| GET | `/api/store/cart` | Token | Get cart with totals |
| POST | `/api/store/cart` | Token | Add item to cart |
| DELETE | `/api/store/cart/items/:itemId` | Token | Remove cart item |
| GET | `/api/store/wishlist` | Token | Get wishlist |
| GET | `/api/store/orders` | Token | Get user orders |
| GET | `/api/store/coupons/validate` | Token | Validate coupon |
| POST | `/api/store/checkout` | Token | Checkout (create order, reserve inventory, clear cart) |
| GET | `/api/store/refunds` | Token | Get user refunds |

### Dashboard API (`/api/dashboard/*`) — Admin only

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | Full dashboard overview (22 parallel queries) |
| GET | `/api/dashboard/stats` | Stats subset |
| GET | `/api/dashboard/activity` | Recent audit logs |
| GET | `/api/dashboard/admin-stats` | Admin/superadmin counts |

### Admin API (`/api/admin/*`) — Admin/Superadmin

**Products, Categories, Brands, Orders** — Full CRUD  
**Users** — CRUD + bulk actions (block/activate/suspend)  
**Customers** — Full CRUD  
**Roles/Permissions** — Full CRUD  
**Settings** — Bulk upsert by category  
**Inventory** — List, movements, adjust (via RPC)  
**Stock** — CRUD  
**Shipments** — List  
**System** — Health check  
**Upload** — Image upload to Supabase Storage  
**Logs** — List + CSV export (with `logs:view` / `logs:export` permissions)  
**Support, Collections, Banners, Menu, Notifications, Reviews, Coupons, FAQ, Security, Variants, Vendors** — CRUD via generic resource handler  

### Catalog API (`/api/*`) — Public reads, admin writes

| Resource | Products | Categories | Brands | Banners | Menu Items | Warehouses | Coupons | Addresses | Returns |
|----------|----------|------------|--------|---------|------------|------------|---------|-----------|---------|
| CRUD | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Standalone API Routes

| Route | Description |
|-------|-------------|
| `GET /api/health` | Health check (DB connectivity, profile count) |
| `GET /api/debug-coupons` | Debug endpoint for coupons |
| `GET /api/debug-coupons2` | Debug endpoint (variant) |
| `GET /api/debug-coupons-test` | Debug endpoint with mapper test |
| `GET /api/debug-checkout?userId=...` | Checkout flow simulation |

## RBAC & Permissions

### Roles

| Role | Description | Access |
|------|-------------|--------|
| **Customer** | Standard shopper | Storefront + profile + cart + orders |
| **Admin** | Dashboard manager | Admin dashboard + management features |
| **Super Admin** | Full system access | Everything + superadmin panel + admin management |

### Permission Model

Granular permissions such as `products:view`, `products:create`, `products:update`, `products:delete`, `orders:view`, `orders:update`, `users:view`, `users:update`, `inventory:adjust`, `settings:update`, `logs:view`, `logs:export`, etc.

**Permission assignments** are stored on each profile and derived from role by default. Admins can be granted custom permission sets; superadmins bypass all permission checks.

### Client-Side Route Guards

The frontend uses `ProtectedRoute`, `AdminLayout`, and `getAllowedRoutes()` from `src/lib/rbac.js` to prevent unauthorized navigation. Permission-based sidebar items are filtered in `AdminLayout`.

## Deployment

### Supabase + Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete deployment guide.

**Quick Deploy:**

1. Set up Supabase project and run migrations + seed
2. Set environment variables in Vercel:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `NEXT_PUBLIC_API_URL` | `/api` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_ENABLED` | `false` |

3. Set **Root Directory** to `frontend` in Vercel project settings
4. Deploy

**Vercel CLI:**

```bash
cd frontend
npx vercel login
npx vercel --prod
```

**Health Check:** Visit `https://your-app.vercel.app/api/health` — should return `{ "status": "ok" }`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed database with demo data |
| `npm run db:migrate` | Apply SQL migrations |
| `npm run db:test` | Test database connection |

### Demo Credentials (created by `npm run seed`)

| Role | Email | Password |
|------|-------|----------|
| Customer | `customer@amazonstore.com` | `Customer@123456` |
| Admin | `admin@amazonstore.com` | `Admin@123456` |
| Super Admin | `superadmin@amazonstore.com` | `Super@123456` |

## Security

- **Row Level Security (RLS)** on all customer, order, review, and catalog tables
- **JWT authentication** with access + refresh tokens
- **Rate limiting** on auth endpoints (10 requests/60s per IP)
- **Account lock/suspension** check on login
- **Audit logging** on all admin actions (create, update, delete, login, password change)
- **Password validation** via Zod (min 8 characters)
- **Input validation** via Zod schemas on all API endpoints
- **XSS/CSRF headers** configured in `next.config.ts` and `vercel.json`
- **Supabase RLS** with SECURITY DEFINER functions for inventory operations
- **Sensitive data redaction** in audit logs (passwords, tokens, card numbers)
- **Cookie security**: 7-day expiry, HTTP-only where applicable

## Troubleshooting

**"Missing Supabase environment variables"**
→ Ensure all Supabase env vars are set in `.env.local` and Vercel project settings.

**Products not loading**
→ Run seed: `npm run seed`, then verify data in Supabase dashboard.

**401 on admin routes**
→ Run `npm run seed` to create admin users, or check your JWT token validity.

**Login fails**
→ Verify account is not blocked/suspended. Check rate limiting (10 req/60s).

**CORS errors**
→ API is same-origin (`/api`), no CORS needed. If deploying API separately, configure CORS accordingly.

**Image not loading**
→ Check that `NEXT_PUBLIC_SUPABASE_URL` is correct and images bucket exists in Supabase Storage.
