# Savra Teacher Analytics Dashboard

> Real-time Insights Engine for school administrators — Savra Round 2 Founding Engineer Assignment.

**Live Demo**: _[To be added after deployment]_
**Demo Login**: `admin` / `admin123`

---

## Features

- **5-metric overview**: Active Teachers · Lessons Created · Assessments Made · Quizzes Conducted · Submission Rate
- **Weekly activity trends**: Stacked area chart, Feb 11–18, 2026, 3 series (Lessons / Quizzes / Assessments)
- **Teacher selector**: Filter all metrics and charts per teacher via URL state (bookmarkable)
- **Per-teacher drill-down**: Class selector · class-wise breakdown · subject distribution · comparison vs school avg · recent activity
- **AI Pulse Summary** on overview (cross-teacher comparative insights, matches PRD UI)
- **Per-teacher AI insights**: 2-sentence narrative + strengths + suggestions
- **Graceful duplicate handling**: Data Quality Banner surfaces 4 detected near-duplicate groups
- **Authentication**: Protected routes with JWT sessions (Auth.js v5)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 App Router | Server Components, built-in API routes, native Vercel |
| Language | TypeScript 5 strict | Type safety across all layers |
| Styling | Tailwind CSS v4 + shadcn/ui | OKLCH colors, modern CSS-first config |
| Charts | shadcn/ui Charts (Recharts) | CSS variable theming, dynamic SSR:false |
| URL State | nuqs 2.8.8 | Type-safe teacher/class filters — bookmarkable URLs |
| Database | Supabase (PostgreSQL) | Production-grade, free tier, Vercel-compatible |
| ORM | Prisma 5 | Type-safe queries, schema migrations, duplicate constraints |
| Client Fetch | TanStack Query v5 | React 19 compatible (SWR has React 19 issue #3051) |
| AI | Anthropic SDK (claude-sonnet-4-6) | Structured JSON educational insights with 24h DB cache |
| Auth | Auth.js v5 (beta) | JWT, credentials provider, App Router middleware |
| Deployment | Vercel | Zero-config for Next.js |

---

## Architecture Decisions

**Database (Supabase + Prisma):** PostgreSQL was chosen over embedded TypeScript arrays to demonstrate production-grade data modeling. The schema has three tables:
- `teacher_activities`: Composite `@@unique` constraint (Layer 1 deduplication) + 3 indexes for fast query
- `duplicate_flags`: Semantic near-duplicates detected at seed time (Layer 2)
- `insight_cache`: 24h TTL AI responses — survives serverless restarts, avoids redundant API calls

**Server Components:** The overview page uses `Promise.all` to fetch metrics, teachers, trends, and activities in parallel. All route handlers have `export const revalidate = 60` (Next.js 15 removed default caching).

**Duplicate Handling (3 layers):**
- Layer 1: `@@unique([teacherId, grade, subject, activityType, createdAt])` prevents exact re-imports
- Layer 2: Seed script detects same-day semantic duplicates → stores in `duplicate_flags` table
- Layer 3: `DataQualityBanner` shows "N groups detected" — both records kept, admin informed

**URL State (nuqs):** All filter views are bookmarkable and shareable. Teacher and class filters live in the URL, driving server-side data fetch and client chart rendering. Components using `useQueryState` are wrapped in `<Suspense>` boundaries (required for SSR).

**AI Insights:** Two modes — overview (cross-teacher comparative) and per-teacher (narrative + strengths + suggestions). `ANTHROPIC_API_KEY` is optional — static fallback is shown when not configured, so the app never crashes.

---

## Duplicate Handling

The dataset contains **4 near-duplicate groups** — same teacher, grade, subject, activity type on the same calendar day, but different timestamps (18 min to 4.5h apart):

1. Anita Sharma | Class 8 | Mathematics | Question Paper | Feb 16 (18 min apart)
2. Anita Sharma | Class 8 | Mathematics | Lesson Plan | Feb 18 (2h apart)
3. Rahul Verma | Class 8 | Science | Quiz | Feb 14 (4h apart)
4. Neha Kapoor | Class 9 | Mathematics | Lesson Plan | Feb 18 (4.5h apart)

**3-Layer Strategy:**
- Layer 1: `@@unique` constraint — prevents byte-for-byte exact duplicates
- Layer 2: Seed script's `detectNearDuplicates()` — same-day semantic detection → `duplicate_flags` table
- Layer 3: `DataQualityBanner` amber alert — admin sees and decides; records are **never silently deleted**

API endpoint: `GET /api/data-quality` returns full JSON report.

---

## Local Setup

```bash
git clone <repo-url>
cd Dashboard
npm install --legacy-peer-deps

# Set up environment
cp .env.example .env.local
# Fill in: DATABASE_URL, DIRECT_URL (Supabase), ANTHROPIC_API_KEY, AUTH_SECRET

# Generate AUTH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"

# Run database migration (requires DATABASE_URL + DIRECT_URL)
npx prisma migrate deploy

# Seed the dataset
npx prisma db seed

# Start local dev server
npm run dev
# → http://localhost:3000 — Login: admin / admin123
```

### Supabase Setup
1. Create free project at [supabase.com](https://supabase.com)
2. Settings → Database → Connection string → **Transaction pooler** → `DATABASE_URL`
3. Settings → Database → Connection string → **Direct connection** → `DIRECT_URL`

---

## Dataset Ground Truth (44 Records)

| Teacher | ID | Lessons | Quizzes | Assessments | Total |
|---|---|---|---|---|---|
| Anita Sharma | T001 | 4 | 1 | 4 | 9 |
| Rahul Verma | T002 | 4 | 3 | 2 | 9 |
| Pooja Mehta | T003 | 3 | 2 | 4 | 9 |
| Vikas Nair | T004 | 3 | 3 | 1 | 7 |
| Neha Kapoor | T005 | 4 | 4 | 2 | 10 |

---

## Future Scalability Improvements

- **Multi-tenancy**: Add `schoolId` to all tables for district-level dashboards
- **Real-time**: Supabase Realtime subscriptions for live activity feeds
- **Submission tracking**: `student_submissions` table to enable the Submission Rate metric
- **Auth**: SAML/SSO for school district single sign-on
- **Caching**: Prisma Accelerate for connection pooling and query caching at scale
- **Historical analytics**: Weekly snapshot table for multi-week trend comparison
- **Export**: PDF/CSV report generation for principals
- **Notifications**: Webhook triggers for teacher inactivity alerts
