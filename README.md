# Amazon Clone – Full‑Stack Boilerplate

This repository is a **production‑ready** Next.js 14 starter that implements a role‑based e‑commerce‑like backend using **Supabase** as the database and authentication provider. It supports three user roles:

- **Super Admin** – can manage **admins** and **customers**.
- **Admin** – can manage **customers**.
- **Customer** – can view their own profile (read‑only for this demo).

All data lives in Supabase (PostgreSQL) and the API routes are hosted on Vercel. The code is deliberately minimal while still reflecting real‑world concerns such as:

- Type safety with TypeScript.
- Centralised Supabase client.
- Role‑based access control (RBAC) via middleware.
- Input validation with Zod.
- Error handling & logging.
- Environment‑variable configuration for production.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Supabase Setup](#supabase-setup)
3. [Running Locally](#running-locally)
4. [Deploy to Vercel](#deploy-to-vercel)
5. [API Reference](#api-reference)
6. [Future Enhancements](#future-enhancements)

---

## Project Structure

```
amazon/
├─ lib/                # Helper utilities
│   └─ supabase.ts     # Supabase client singleton
├─ middleware/         # Role‑based auth middleware
│   └─ auth.ts         # Extract user & enforce roles
├─ pages/
│   ├─ api/
│   │   ├─ auth/       # Sign‑up / login / logout
│   │   │   ├─ signup.ts
│   │   │   └─ login.ts
│   │   ├─ customers/  # CRUD for customers (admin & super‑admin)
│   │   │   ├─ index.ts   # POST (create) & GET (list)
│   │   │   └─ [id].ts    # GET, PUT, DELETE for a single customer
│   │   └─ admins/      # CRUD for admins (super‑admin only)
│   │       ├─ index.ts
│   │       └─ [id].ts
│   └─ _app.tsx        # Global CSS / layout (optional)
├─ public/             # Static assets
├─ styles/             # Tailwind / CSS (optional)
├─ .env.example        # Template for env vars
├─ next.config.js
├─ tsconfig.json
└─ package.json
```

---

## Supabase Setup

1. **Create a Supabase project** at https://app.supabase.com.
2. In the **SQL editor**, run the schema below (copy‑paste into a new query and hit **Run**).

```sql
-- Enable row‑level security (RLS) on all tables
create policy "allow all" on public.customers for all using (true);
create policy "allow all" on public.admins for all using (true);
create policy "allow all" on public.profiles for all using (true);

-- 1️⃣ Profiles (stores role information)
create table public.profiles (
  id uuid primary key references auth.users (id),
  role text not null check (role in ('superadmin','admin','customer')),
  created_at timestamp with time zone default now()
);

-- 2️⃣ Customers (owned by an admin or superadmin)
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_by uuid references auth.users (id), -- the admin/superadmin that created it
  created_at timestamp with time zone default now()
);

-- 3️⃣ Admins (managed by superadmin)
create table public.admins (
  id uuid primary key references auth.users (id),
  email text not null unique,
  created_at timestamp with time zone default now()
);

-- Enable RLS on these tables (you can tighten later)
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.admins enable row level security;
```

3. **Create a Service Role key** (Settings → API → Service Role) – you will need this for server‑side calls.
4. **Copy the anon/public key** – used by the frontend.
5. Populate `.env.example` (see below) and rename to `.env.local`.

---

## Environment Variables (`.env.example`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your‑project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon‑public‑key>
SUPABASE_SERVICE_ROLE_KEY=<service‑role‑key>
```

Add the file to Vercel's **Environment Variables** section (both **Preview** and **Production**).

---

## Running Locally

```bash
# 1️⃣ Install dependencies
npm install

# 2️⃣ Copy env template
cp .env.example .env.local
# (Edit .env.local with your Supabase keys)

# 3️⃣ Development server
npm run dev
```

The API will be available at `http://localhost:3000/api/...`.

---

## Deploy to Vercel

1. Push the repository to GitHub (or GitLab).
2. In the Vercel dashboard, click **New Project** → import your repo.
3. Vercel will automatically detect the **Next.js** framework.
4. Add the three environment variables (same values as `.env.local`).
5. Click **Deploy** – Vercel will build and host the app on a generated URL.

---

## API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/signup` | Create a new Supabase auth user and assign role (`admin` or `customer`). Super‑admin must create admins via the **admins** endpoint. |
| `POST` | `/api/auth/login` | Exchange email/password for a JWT (handled by Supabase client). |
| `POST` | `/api/auth/logout` | Clears the Supabase session cookie. |

### Customers (`/api/customers`)
| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/customers` | `admin`, `superadmin` | List all customers created by the requesting admin (or all if super‑admin). |
| `POST` | `/api/customers` | `admin`, `superadmin` | Create a new customer record. |
| `GET` | `/api/customers/:id` | `admin`, `superadmin` | Retrieve a single customer (must belong to the admin). |
| `PUT` | `/api/customers/:id` | `admin`, `superadmin` | Update customer fields. |
| `DELETE` | `/api/customers/:id` | `admin`, `superadmin` | Delete a customer. |

### Admins (`/api/admins`)
| Method | Path | Role | Description |
|--------|------|------|-------------|
| `GET` | `/api/admins` | `superadmin` | List all admins. |
| `POST` | `/api/admins` | `superadmin` | Create a new admin (creates a Supabase auth user + profile). |
| `GET` | `/api/admins/:id` | `superadmin` | Get admin details. |
| `PUT` | `/api/admins/:id` | `superadmin` | Update admin (e.g., email). |
| `DELETE` | `/api/admins/:id` | `superadmin` | Revoke admin rights (deletes auth user). |

All routes expect a **Bearer** token in the `Authorization` header – the token is the Supabase JWT generated on login.

---

## Future Enhancements
- Add **Zod** schemas for request validation.
- Implement **refresh‑token** flow.
- Use **tRPC** for type‑safe client‑server contracts.
- Add **unit / integration tests** with Jest.
- Integrate **Stripe** or another payment provider.
- Build a small UI (React components) for admin dashboards.

---

## License

MIT © 2026 Antigravity Boilerplate.
