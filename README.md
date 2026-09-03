# Amazon E-Commerce Platform

A production-ready e-commerce platform with a Next.js frontend and **Supabase** backend, deployed on **Vercel**.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Redux Toolkit |
| Backend API | Next.js API Routes (serverless on Vercel) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (JWT-compatible with existing frontend) |
| Hosting | Vercel |

## Quick Start

```bash
cd frontend
cp .env.example .env.local
# Add your Supabase credentials to .env.local
npm install
npm run seed    # Create demo customer and admin users
npm run dev
```

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for full Supabase + Vercel deployment instructions.

## Default Admin Credentials

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@amazonstore.com | Customer@123456 |
| Admin | admin@amazonstore.com | Admin@123456 |
| Super Admin | superadmin@amazonstore.com | Super@123456 |

> These are local/demo seed credentials only. Set the `SEED_*_EMAIL` and `SEED_*_PASSWORD` environment variables to unique secrets for non-local environments, then rotate or remove demo accounts before launch.

## Catalog Media

The demo catalog references images from the official [J. Pakistan](https://www.junaidjamshed.com/collections/womens-stitched?page=1) and [6pm](https://www.6pm.com/womens) sites. Those sources are supplied only for evaluation; obtain a license and move approved assets to your own storage before production launch. Product image rendering automatically falls back to local catalog artwork when a remote source is unavailable.

## Project Structure

```
amazon/
├── frontend/              # Next.js app (UI + API routes)
│   ├── src/app/api/       # REST API endpoints (/api/*)
│   ├── src/server/        # Supabase backend logic
│   └── scripts/seed.ts    # Admin user seeding
├── supabase/
│   ├── migrations/        # PostgreSQL schema
│   └── seed.sql           # Sample catalog data
└── DEPLOYMENT.md          # Production deployment guide
```


---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.2.9 | React framework (App Router) |
| [React](https://react.dev) | 19.2.4 | UI library |
| [React DOM](https://react.dev) | 19.2.4 | DOM rendering |
| [TypeScript](https://www.typescriptlang.org) | ^5 | Type-safe JavaScript |
| [Tailwind CSS](https://tailwindcss.com) | ^4 | Utility-first CSS framework |
| [@tailwindcss/postcss](https://tailwindcss.com) | ^4 | PostCSS plugin for Tailwind |
| [Redux Toolkit](https://redux-toolkit.js.org) | ^2.12.0 | State management |
| [React-Redux](https://react-redux.js.org) | ^9.3.0 | React bindings for Redux |
| [Redux Persist](https://github.com/rt2zz/redux-persist) | ^6.0.0 | Persist Redux state to localStorage |
| [Axios](https://axios-http.com) | ^1.18.1 | HTTP client |
| [React Router DOM](https://reactrouter.com) | ^7.18.0 | Client-side routing |
| [Framer Motion](https://www.framer.com/motion/) | ^12.42.2 | Animation library |
| [Lucide React](https://lucide.dev) | ^1.26.0 | Icon library |
| [React Icons](https://react-icons.github.io) | ^5.6.0 | Icon library |
| [next/font](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) | — | Font optimization (Poppins, Geist) |
| [PostCSS](https://postcsscss.org) | — | CSS processing |
| [ESLint](https://eslint.org) | ^9 | Linting |
| [eslint-config-next](https://nextjs.org/docs/app/api-reference/config/eslint-config) | 16.2.9 | Next.js ESLint config |
| [Babel React Compiler](https://react.dev/reference/react-compiler/compiler) | 1.0.0 | React compiler |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org) | — | Runtime |
| [Express](https://expressjs.com) | ^5.2.1 | Web framework |
| [MongoDB](https://mongodb.com) | — | Database |
| [Mongoose](https://mongoosejs.com) | ^9.7.2 | ODM for MongoDB |
| [JWT (jsonwebtoken)](https://github.com/auth0/node-jsonwebtoken) | ^9.0.3 | Authentication tokens |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | ^3.0.3 | Password hashing |
| [Redis](https://redis.io) | ^6.0.0 | Caching / sessions |
| [Cloudinary](https://cloudinary.com) | ^2.10.0 | Image storage & delivery |
| [Stripe](https://stripe.com) | ^22.2.3 | Payment processing |
| [Nodemailer](https://nodemailer.com) | ^9.0.1 | Email delivery |
| [Morgan](https://github.com/expressjs/morgan) | ^1.11.0 | HTTP request logging |
| [Helmet](https://helmetjs.github.io) | ^8.2.0 | HTTP security headers |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | ^8.5.2 | Rate limiting |
| [express-validator](https://express-validator.github.io) | ^7.3.2 | Request validation |
| [cookie-parser](https://github.com/expressjs/cookie-parser) | ^1.4.7 | Cookie parsing |
| [cors](https://github.com/expressjs/cors) | ^2.8.6 | CORS middleware |
| [dotenv](https://github.com/motdotla/dotenv) | ^17.4.2 | Environment variable management |
| [compression](https://github.com/expressjs/compression) | ^1.8.1 | Response compression |
| [multer](https://github.com/expressjs/multer) | ^2.2.0 | Multipart form data handling |
| [nodemon](https://nodemon.io) | ^3.1.14 | Auto-restart during development |

### DevOps & Tooling

| Tool | Purpose |
|---|---|
| [Git](https://git-scm.com) | Version control |
| [npm](https://npmjs.com) | Package management |
| [VS Code](https://code.visualstudio.com) | Editor (recommended) |

---

## Project Structure

```
amazon/
├── frontend/                  # Next.js 16 App Router frontend
│   ├── src/
│   │   ├── app/               # App Router pages & layouts
│   │   ├── components/        # React components (admin, ui)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── layouts/           # Layout components
│   │   ├── lib/               # Utilities (api, auth, store, rbac, images)
│   │   ├── services/          # API service layers
│   │   ├── store/             # Redux store & slices
│   │   └── styles/            # Global CSS (Tailwind)
│   ├── public/                # Static assets
│   ├── next.config.ts         # Next.js configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── tailwind.config.*      # Tailwind CSS config
│   ├── postcss.config.mjs     # PostCSS configuration
│   ├── eslint.config.mjs      # ESLint configuration
│   └── .env.local             # Frontend environment variables
├── backend/                   # Express.js backend
│   ├── src/
│   │   ├── app.js             # Express app setup
│   │   ├── server.js          # Server entry point
│   │   ├── config/            # DB, Cloudinary, Stripe configs
│   │   ├── controllers/       # Route controllers (CRUD, auth, admin)
│   │   ├── middlewares/       # Auth, RBAC, validation, rate limiting
│   │   ├── models/            # Mongoose models + ERD definitions
│   │   ├── routes/            # Express route definitions
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Helpers (token, email, upload, pagination)
│   │   └── validators/        # Request validation schemas
│   ├── .env                   # Backend environment variables
│   ├── .env.example           # Example environment file
│   ├── seed.js                # Database seeding script
│   ├── seedProducts.js        # Product seeding script
│   └── checkBrands.js         # Brand checking utility
├── scripts/                   # Utility scripts
│   └── fetch-nishat-images.js # Image fetching script
└── dy                         # Dynamic configuration file
```

---

## Key Features

- **Authentication**: JWT-based auth with access/refresh tokens, cookie storage, token refresh interception
- **Role-Based Access Control (RBAC)**: Three roles — `customer`, `admin`, `superadmin` with permission-based access
- **Product Management**: Full CRUD with variants, images, inventory, and stock tracking
- **Order Management**: Complete order lifecycle (pending → processing → shipped → delivered)
- **Payment Integration**: Stripe payment processing
- **Image Upload**: Cloudinary integration for product images
- **Email Notifications**: Nodemailer for transactional emails
- **Rate Limiting**: express-rate-limit for API protection
- **Security**: Helmet for HTTP headers, bcryptjs for password hashing
- **Real-time State**: Redux Toolkit with Redux Persist for client-side state
- **Animations**: Framer Motion for UI animations
- **Responsive Design**: Tailwind CSS v4 with custom design tokens

---

## Environment Setup

### Prerequisites

- Node.js (LTS)
- npm
- MongoDB (local or Atlas)
- Redis (optional)
- Cloudinary account (optional)
- Stripe account (optional)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

### Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_ENABLED=false
```

**Backend** (`.env`): See `.env.example` for all required variables including `MONGO_URI`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `CLOUDINARY_*`, and SMTP credentials.

---

## Available Scripts

### Frontend
| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

### Backend
| Script | Description |
|---|---|
| `npm run dev` | Start with nodemon on port 5000 |
| `npm start` | Start production server |
| `npm test` | Backend boot check |
