# Amazon Store Frontend

A production-grade e-commerce application built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS 4**, **Redux Toolkit**, **Axios**, **Supabase** (PostgreSQL + Auth), and **Zod**.

## Architecture

### Frontend (this project)
- **Framework**: Next.js 16 (App Router) with TypeScript strict mode
- **State Management**: Redux Toolkit with Redux Persist for client-side state
- **API Client**: Axios with typed interceptors
- **Validation**: Zod schemas for request/response validation
- **Styling**: Tailwind CSS 4 (no config file needed)

### Backend
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth with role-based access control (super_admin, admin, support, customer)
- **API**: Next.js Route Handlers (`/api/*`) with server-side Supabase admin clients

## Getting Started

### Prerequisites
- Node.js 20+
- A Supabase project

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — **secret** key (server-side only)
- `NEXT_PUBLIC_SITE_URL` — your site URL for redirect links

### Database Setup

Apply migrations and seed the database:

```bash
npm run db:migrate
npm run seed
```

This creates demo users:
- **Super Admin**: `superadmin@amazonstore.com` / `Super@123456`
- **Admin**: `admin@amazonstore.com` / `Admin@123456`
- **Customer**: `customer@amazonstore.com` / `Customer@123456`

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## Deployment

### Vercel

1. Import your repository into Vercel
2. Set all environment variables in **Project Settings → Environment Variables**
   - Copy from `.env.production.local` for the production environment
   - Copy from `.env.local` for the preview environment
3. Deploy

> **Important**: `SUPABASE_SERVICE_ROLE_KEY` must be set as a **Server-side** environment variable only. Never expose it as a `NEXT_PUBLIC_*` variable.

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages and layouts
├── components/             # Reusable UI components
├── lib/                    # Client-side utilities (Redux store, Axios, helpers)
├── server/                 # Server-side code (API handlers, Supabase clients, auth)
├── public/                 # Static assets
├── scripts/                # DB migration and seed scripts (not type-checked in build)
├── supabase/               # SQL migrations and seed data
├── vercel.json             # Vercel-specific configuration
└── .env.example            # Environment variable template
```

## Scripts

| Script           | Description                          |
|------------------|--------------------------------------|
| `dev`            | Start development server             |
| `build`          | Build for production                 |
| `start`          | Start production server              |
| `lint`           | Run ESLint                           |
| `seed`           | Seed database with demo data         |
| `db:migrate`     | Apply SQL migrations                 |
| `db:test`        | Test database connection             |
