# Email Job Scheduler

A production-grade email scheduling service with a live dashboard. Schedule emails (single or via CSV upload) to be sent at a specific time, with per-sender hourly rate limiting, delayed job processing via BullMQ, and full persistence across restarts — no cron jobs involved.

## Architecture Overview

```
Frontend (Next.js)  <-- REST API (JSON) -->  Backend (Express + TypeScript)
                                                     |
                                    ---------------------------------
                                    |            |            |
                                Postgres       Redis       BullMQ Queue
                               (job storage) (rate limit   (delayed jobs)
                                              counters)          |
                                                                  v
                                                          Email Worker
                                                    (concurrency + rate limit
                                                       check on every job)
                                                                  |
                                                                  v
                                                          Ethereal SMTP
                                                        (test inbox, per
                                                          preview URL)
```

**Scheduling flow:** user submits an email (or CSV of recipients) with a start time → each recipient becomes an `EmailJob` row in Postgres → a matching delayed BullMQ job is queued in Redis → at the scheduled time, the worker picks it up, checks the sender's rate limit for the current hour window, sends via SMTP if allowed, and updates the job's status. If the hourly limit is already hit, the job is **not dropped** — it's moved to the next hour window and retried automatically.

**Persistence:** all job state lives in Postgres and Redis, not in-process memory. Restarting the API or worker does not lose or duplicate jobs — BullMQ resumes exactly where it left off, since the queue itself lives in Redis independent of the Node process.

**Rate limiting:** implemented with a Redis Lua script (`INCR` + `EXPIRE`, atomic) keyed as `ratelimit:{senderId}:{hourWindow}`. Configurable per request via `hourlyLimit`. Counts are mirrored into Postgres for auditability, but Redis is the source of truth for the atomic check.

**Auth:** Google OAuth 2.0 for sign-in/identity (issues a JWT used as a Bearer token by the frontend). Email sending itself is decoupled from login — it uses a `Sender` record (SMTP credentials), independent of which user is signed in, currently backed by an auto-provisioned Ethereal test inbox.

## Features Implemented

**Backend**
- REST API for scheduling emails and reading scheduled/sent/stats data
- Delayed job scheduling via BullMQ (no OS-level or library cron)
- Per-sender, per-hour rate limiting with automatic rescheduling (no drops)
- Configurable worker concurrency (default 5) and configurable delay/hourly-limit per request
- Idempotent job processing (BullMQ `jobId` tied 1:1 to the `EmailJob` id, plus a status guard)
- Retry with exponential backoff on send failure (3 attempts) before marking a job `failed`
- Google OAuth login (`/auth/google`, `/auth/google/callback`, `/auth/me`) issuing a JWT
- Health check endpoint (`/health`)

**Frontend**
- Dashboard with live counts (scheduled / sent / failed) and a scheduled-vs-sent chart, polling every 5s
- Compose page: subject, body, CSV recipient upload, start time, delay between sends, hourly limit
- Scheduled and Sent views with status badges, loading and empty states
- Google sign-in button / signed-in user display / logout, wired to the backend OAuth flow

## Tech Stack

- Backend: Node.js, Express, TypeScript, Prisma
- Queue: BullMQ
- Database: PostgreSQL
- Cache / rate-limit store: Redis
- Email: Nodemailer via Ethereal Email (test SMTP — see below)
- Frontend: Next.js, React, TypeScript, Tailwind CSS, Recharts
- Auth: Google OAuth 2.0 + JWT

## Environment Variables

`backend/.env`
```
PORT=5000
DATABASE_URL=postgresql://scheduler_user:scheduler_pass@localhost:5432/email_scheduler?schema=public
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:3000
JWT_SECRET=<any random string>
```

`frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Ethereal Email Setup

No manual setup needed. On first use, the backend automatically creates a throwaway [Ethereal Email](https://ethereal.email/) test account via `nodemailer.createTestAccount()` and uses it as the default `Sender`. Ethereal never delivers to real inboxes — every sent email's contents are viewable via a preview URL printed in the worker's console output (`Sent EmailJob <id> -> <previewUrl>`). This is intentional for a self-contained demo; swapping in a real SMTP provider only requires inserting a `Sender` row with real credentials.

## How to Run

Prerequisites: Node.js 18+, PostgreSQL and Redis running locally (or via `docker-compose up -d` from the repo root, which starts both).

**1. Backend**
```
cd backend
npm install
npx prisma migrate deploy   # creates the database tables
npm run dev                 # starts the API on :5000
```
In a second terminal, start the worker (required — the API alone only enqueues jobs, it doesn't send them):
```
cd backend
npm run worker
```

**2. Frontend**
```
cd frontend
npm install
npm run dev                 # serves the dashboard on :3000
```

**3. Verify end-to-end** (optional, no UI needed)
```
cd backend
npm run test:schedule       # schedules + confirms one email sends successfully
npm run test:ratelimit      # fires a burst over the hourly limit, confirms none are dropped
```

Open [http://localhost:3000](http://localhost:3000) to use the dashboard.

## Assumptions, Shortcuts & Trade-offs

- Email sending uses Ethereal Email (fake SMTP) rather than a real provider, so no real recipients ever receive mail — this keeps the demo self-contained and safe to run repeatedly.
- Google OAuth covers sign-in/identity only; it is not yet wired to send email through the logged-in user's own Gmail account (that requires Gmail-specific OAuth scopes and app verification, out of scope for tonight).
- No request validation library (e.g. Zod) — validation is done with manual checks in the controllers.
- No structured logging (Pino/Winston) — currently plain `console.log`/`console.error`.
- No graceful shutdown handling (SIGTERM draining in-flight jobs) yet.
- Docker Compose currently containerizes Postgres and Redis only; the backend and frontend are run locally with `npm run dev` rather than containerized.
