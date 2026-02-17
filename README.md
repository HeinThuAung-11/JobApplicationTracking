# Job Application Tracking System

A production-ready full-stack application to track job applications and notes, built with Next.js (App Router), TypeScript, PostgreSQL, Prisma, Redux Toolkit, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 14 (App Router), TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **State:** Redux Toolkit
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS

## Project Structure

```
├── app/
│   ├── api/                 # Route Handlers (REST API)
│   │   ├── dashboard/
│   │   └── jobs/
│   │       └── [id]/
│   │           └── notes/
│   ├── jobs/                # Job pages (list, new, [id])
│   ├── providers/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # Dashboard
├── components/
│   ├── jobs/                # JobCard, JobForm, NoteList, AddNoteForm
│   └── ui/                  # Button, Card, Input, Select, etc.
├── lib/
│   ├── api-response.ts      # API response helpers
│   ├── axios.ts             # Axios instance
│   └── prisma.ts            # Prisma client singleton
├── prisma/
│   └── schema.prisma
├── store/
│   ├── jobsSlice.ts
│   ├── hooks.ts
│   └── index.ts
└── types/
    └── index.ts
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL (local or hosted, e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app))

### 1. Clone and install

```bash
cd JobApplicationTracking
npm install
```

### 2. Environment variables

Copy the example env file and set your database URL:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

`DATABASE_URL` should use the Supabase pooler host (`:6543`) for app traffic.
`DIRECT_URL` should use the direct host (`db.<project-ref>.supabase.co:5432`) for Prisma migrations.

### 3. Database migration

An initial migration is included. Apply it with:

```bash
npx prisma migrate deploy
```

Or for development (creates new migrations when you change the schema):

```bash
npm run db:migrate
```

When prompted, choose a name (e.g. `init`). To sync schema without migration history (e.g. quick dev reset), use:

```bash
npm run db:push
```

### 4. (Optional) Seed data

You can add a seed script in `prisma/seed.ts` and run `npx prisma db seed` if you want sample data. Not required for first run.

## Run Instructions

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll see the dashboard; use “Add job” to create applications and add notes.

### Build and production run

```bash
npm run build
npm start
```

Runs the app in production mode on port 3000 (or `PORT` env).

### Other commands

- `npm run lint` — Run ESLint
- `npm run db:studio` — Open Prisma Studio to inspect/edit data

## API Reference (REST)

All routes are under `/api`. JSON request/response.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create email/password account |
| GET | `/api/jobs` | List all job applications |
| POST | `/api/jobs` | Create job (body: `company`, `position`, `status`) |
| GET | `/api/jobs/:id` | Get one job with notes |
| PATCH | `/api/jobs/:id` | Update job (body: optional `company`, `position`, `status`) |
| DELETE | `/api/jobs/:id` | Delete job (and its notes) |
| GET | `/api/jobs/:id/notes` | List notes for a job |
| POST | `/api/jobs/:id/notes` | Add note (body: `content`) |
| GET | `/api/dashboard` | Dashboard stats (total, byStatus, recent) |

## Deployment (Vercel + PostgreSQL)

### 1. Database

Create a PostgreSQL database (e.g. Neon, Supabase, or Railway) and copy the connection string.

### 2. Vercel

1. Push the repo to GitHub (or connect another Git provider).
2. Go to [vercel.com](https://vercel.com) → New Project → Import this repo.
3. **Environment variables:** Add all required variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_URL` (your deployed URL, e.g. `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
4. **Build command:** `npm run build` (or leave default; the project uses `prisma generate` in `build`).
5. Deploy. Vercel will run `npm run build` and then serve the app.

### 3. Run migrations in production

After the first deploy, run migrations against the production DB. Options:

**Option A – Local with prod URL**

```bash
DATABASE_URL="your-production-pooler-url" DIRECT_URL="your-production-direct-url" npx prisma migrate deploy
```

**Option B – CI or one-off script**

In your CI or a one-off job, set both `DATABASE_URL` and `DIRECT_URL` and run:

```bash
npx prisma migrate deploy
```

Do **not** run `prisma migrate dev` against production; use `migrate deploy` for prod.

### 4. Post-deploy

- Ensure the deployed app’s env has `DATABASE_URL`, `DIRECT_URL`, and NextAuth/OAuth variables.
- Open your Vercel URL and confirm the dashboard and CRUD flows work.

## Features

- **Dashboard:** Total applications, count by status, recent applications.
- **Applications:** List, create, view, update (including status), delete.
- **Notes:** Add and view notes per application.
- **UI:** Loading and error states, reusable components, responsive layout.
- **API:** Centralized error handling, validation, Prisma singleton, indexed queries.

## License

MIT.
