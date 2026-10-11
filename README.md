# Amazon Clone

The production application lives in the [`frontend/`](./frontend) directory (Next.js 16, App Router, Supabase).

## Quick start

```bash
cd frontend
cp .env.example .env.local   # fill in Supabase keys and invite codes
npm install
npm run dev
```

Database migrations live in [`supabase/migrations/`](./supabase/migrations) and are applied via:

```bash
cd frontend
npm run db:migrate
```

See [`frontend/README.md`](./frontend/README.md) for full setup, scripts, environment variables, and deployment notes.
