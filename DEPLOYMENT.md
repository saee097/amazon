# Deployment Guide — Supabase + Vercel

Production deployment for the Amazon E-Commerce platform using **Supabase** (database + auth) and **Vercel** (hosting).

## Architecture

```
Browser → Vercel (Next.js Frontend + API Routes) → Supabase (PostgreSQL + Auth)
```

- **Frontend UI**: Unchanged — all existing pages work as-is
- **API**: Next.js API routes at `/api/*` (serverless on Vercel)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Auth**: Supabase Auth with JWT tokens compatible with existing frontend

---

## Step 1: Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:
   - Copy contents of `supabase/migrations/20260101000000_initial_schema.sql`
   - Execute it
3. Run seed data:
   - Copy contents of `supabase/seed.sql`
   - Execute it
4. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

> **Important**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

---

## Step 2: Configure Environment Variables

Copy `frontend/.env.example` to `frontend/.env.local`:

```bash
cd frontend
cp .env.example .env.local
```

Fill in your Supabase credentials.

---

## Step 3: Seed Admin Users

```bash
cd frontend
npm install
npm run seed
```

Default accounts:
| Role | Email | Password |
|------|-------|----------|
| Customer | customer@amazonstore.com | Customer@123456 |
| Admin | admin@amazonstore.com | Admin@123456 |
| Super Admin | superadmin@amazonstore.com | Super@123456 |

These are local/demo seed credentials only. Configure unique `SEED_*_EMAIL` and `SEED_*_PASSWORD` values for any shared environment, then rotate or remove seed accounts before launch.

---

## Step 4: Deploy to Vercel

### Option A: Vercel CLI

```bash
cd frontend
npx vercel login
npx vercel --prod
```

### Option B: GitHub Integration

1. Push repo to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variables in Vercel dashboard:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_API_URL` | `/api` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_ENABLED` | `false` |

5. Deploy

---

## Step 5: Verify Deployment

1. Visit `https://your-app.vercel.app/api/health` — should return `{ "status": "ok" }`
2. Visit homepage — products, categories, banners should load
3. Login with admin credentials at `/auth/login`
4. Access admin dashboard at `/admin/dashboard`

---

## Local Development

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in Supabase credentials
npm run seed
npm run dev
```

App runs at `http://localhost:3000`. API at `http://localhost:3000/api`.

---

## API Endpoints

All existing frontend API calls are supported:

| Group | Examples |
|-------|----------|
| Auth | `/api/auth/login`, `/api/auth/register`, `/api/auth/profile` |
| Store | `/api/store/products`, `/api/store/cart`, `/api/store/checkout` |
| Admin | `/api/admin/products`, `/api/admin/orders`, `/api/admin/users` |
| Catalog | `/api/categories`, `/api/brands`, `/api/banners` |

---

## Security Checklist

- [ ] Change default admin passwords after seeding
- [ ] Enable Supabase email confirmation in production
- [ ] Set up Supabase RLS policies (included in migration)
- [ ] Use Vercel environment variables (never commit secrets)
- [ ] Enable Vercel deployment protection for preview branches
- [ ] Configure Supabase auth redirect URLs for your domain

---

## Troubleshooting

**"Missing Supabase environment variables"**
→ Ensure all three Supabase env vars are set in Vercel and `.env.local`

**Products not loading**
→ Run `supabase/seed.sql` in SQL Editor

**401 on admin routes**
→ Run `npm run seed` to create admin users

**CORS errors**
→ API is same-origin (`/api`), no CORS needed in production
