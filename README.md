# Savra Teacher Analytics Dashboard

> Real-time Insights Engine for school administrators — Savra Round 2 Founding Engineer Assignment.

**Live Demo**: [https://savra-dashboard-two.vercel.app](https://savra-dashboard-two.vercel.app)
**Demo Login**: `admin` / `admin123`

---

## Features

- **5-metric overview**: Active Teachers · Lessons Created · Assessments Made · Quizzes Conducted · Submission Rate
- **Weekly activity trends**: Stacked area chart, Feb 11–18, 2026, 3 series (Lessons / Quizzes / Assessments)
- **Teacher selector**: Filter all metrics and charts per teacher via URL state (bookmarkable)
- **Per-teacher drill-down**: Class selector · class-wise breakdown · subject distribution · comparison vs school avg · recent activity
- **AI Pulse Summary** on overview (cross-teacher comparative insights)
- **Per-teacher AI insights**: 2-sentence narrative + strengths + suggestions
- **Graceful duplicate handling**: Data Quality Banner surfaces 4 detected near-duplicate groups
- **Authentication**: Protected routes with JWT sessions (Auth.js v5)
- **Excel export**: Full report download from Reports page (Summary + Teacher Breakdown + Data Quality sheets)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 App Router | Server Components, built-in API routes, native Vercel support |
| Language | TypeScript 5 strict | End-to-end type safety across all layers |
| Styling | Tailwind CSS v4 + shadcn/ui | OKLCH color space, modern CSS-first config, zero-runtime |
| Charts | shadcn/ui Charts (Recharts) | CSS variable theming, dynamic `ssr:false` client wrappers |
| URL State | nuqs 2.8.8 | Type-safe teacher/class filters — bookmarkable, shareable URLs |
| Database | Supabase (PostgreSQL) | Production-grade managed Postgres, free tier, Vercel-compatible |
| ORM | Prisma 5 | Type-safe queries, schema migrations, composite unique constraints |
| Client Fetch | TanStack Query v5 | React 19 compatible (SWR has a known React 19 issue #3051) |
| AI | Anthropic SDK (claude-sonnet-4-6) | Structured JSON educational insights with 24h DB cache |
| Auth | Auth.js v5 (beta) | JWT, credentials provider, App Router middleware |
| Deployment | Vercel | Zero-config Next.js, serverless functions, global CDN |

---

## Architecture Decisions

### 1. Next.js App Router — Server Components First

The entire data layer runs as React Server Components. Pages like `/dashboard` and `/dashboard/teachers/[id]` call `Promise.all()` to fetch metrics, teacher data, trends, and AI insights in parallel — no waterfalls, no client-side loading spinners for primary data. Only chart components (Recharts requires DOM) are lazy-loaded with `dynamic(() => import(...), { ssr: false })` client wrappers.

This means the dashboard renders fully on the server with real data, then hydrates — giving fast First Contentful Paint and a clean HTML structure for any future SEO needs.

### 2. Database — Supabase (PostgreSQL) over In-Memory Arrays

While the assignment could have been solved with hardcoded TypeScript arrays, a real school analytics platform needs a persistent, queryable database. Three design decisions follow from this:

- **Transaction pooler (`DATABASE_URL`, port 6543, `pgbouncer=true`)** for Vercel serverless — prevents connection exhaustion across concurrent cold starts
- **Direct connection (`DIRECT_URL`, port 5432)** only for Prisma migrations — never used at runtime
- **Composite `@@unique` constraint** on `teacher_activities` enforces Layer 1 deduplication at the database level, making it impossible to insert byte-for-byte duplicate records regardless of which code path runs

### 3. Prisma Schema — Three-Table Design

```
teacher_activities  →  core fact table (44 records, 3 indexes)
duplicate_flags     →  semantic near-duplicate audit trail
insight_cache       →  24h TTL AI response cache (survives serverless restarts)
```

The `insight_cache` table is particularly important for serverless: without it, every page load would call the Anthropic API, burning quota and adding 1–2s latency. With the cache, AI responses are computed once and reused for 24 hours.

### 4. Two-Layer AI Insight Strategy

AI insights use two completely separate code paths:

- **`lib/ai/summaryGenerator.ts`** — fully synchronous, zero latency, no API calls. Generates per-teacher narrative from deterministic templates using live DB data. Used on every teacher detail page regardless of API key availability.
- **`lib/ai/insights.ts`** — calls Anthropic API, writes result to `insight_cache`, returns static `OVERVIEW_FALLBACK` / `TEACHER_FALLBACK` when `ANTHROPIC_API_KEY` is missing or the API call fails. This means the app **never crashes** due to AI — it degrades gracefully.

### 5. URL State (nuqs) — Filters Live in the URL

All dashboard filters (teacher, class, subject, period) are stored in URL search params via `nuqs`, not in React state. This makes every filtered view bookmarkable and shareable. A principal can link a colleague directly to "Anita Sharma's quiz performance for Class 8 this month." Components using `useQueryState` are wrapped in `<Suspense>` boundaries as required by Next.js 15 for SSR compatibility.

### 6. Tailwind CSS v4 — OKLCH Color Space

Tailwind v4 computes colors in OKLCH rather than the legacy sRGB hex values used in v3. This matters for charts: hardcoding `#e11d48` (the v3 rose-600 hex) produces a visually different color than the CSS class `text-rose-600` resolved at runtime by v4. All chart fill colors are set to the v4-compiled OKLCH hex values (`#e70044`, `#009767`, `#f05100`) so bars and MetricsCard icons match pixel-perfectly.

### 7. Duplicate Handling — 3-Layer Strategy

The 44-record dataset contains 4 near-duplicate groups (same teacher + class + subject + type on the same day, different timestamps). The handling is layered:

- **Layer 1** (`@@unique` DB constraint): Prevents byte-for-byte exact re-imports at write time
- **Layer 2** (`detectNearDuplicates()` in seed): Same-day semantic detection — stores pairs in `duplicate_flags` with `timeDeltaMins`
- **Layer 3** (`DataQualityBanner` component): Shows admin an amber alert with the count — records are **never silently deleted**, the admin decides

### 8. Auth.js v5 with Middleware Protection

All `/dashboard/*` routes are protected at the middleware layer — the check happens before any server component renders, so unauthenticated users never touch the data layer. JWT sessions are used (no database session table needed), and `AUTH_SECRET` is required in production. `AUTH_URL` is set to the canonical Vercel domain to ensure session cookies bind to the correct origin.

### 9. Export Route — ArrayBuffer over Buffer

The Excel export route (`/api/reports/export`) uses `XLSX.write()` which returns a Node.js `Buffer`. In Next.js 15 with strict TypeScript, `Buffer<ArrayBufferLike>` is not directly assignable to `BodyInit` because `ArrayBufferLike` includes `SharedArrayBuffer` which `Response` doesn't accept. The fix is to copy the buffer into a fresh `ArrayBuffer` (`new Uint8Array(ab).set(raw)`) — this is a strict type narrowing, not a runtime change. The downloaded `.xlsx` file is byte-identical either way.

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
npm install

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

### Data & Database

- **Multi-tenancy**: Add `schoolId` (and `districtId`) as a discriminator column on all tables. A single deployment serves hundreds of schools with row-level security enforced at the Postgres layer via Supabase RLS policies — no data leakage between tenants.
- **Connection pooling at scale**: Replace the direct Supabase pooler with [Prisma Accelerate](https://www.prisma.io/accelerate) for global edge caching of frequent queries (teacher lists, overview stats) and connection pooling that handles thousands of concurrent serverless invocations without exhausting Postgres connection limits.
- **Partitioned fact table**: At 10k+ teachers and millions of activity rows, partition `teacher_activities` by `createdAt` month. Old partitions become read-only, queries on the current month stay fast without full-table index scans.
- **Historical snapshots**: Add a `weekly_snapshots` table that stores pre-aggregated per-teacher metrics each Sunday. This unlocks multi-week trend comparison, year-over-year views, and fast dashboard loads without re-scanning the full activity table.

### Authentication & Access Control

- **Role-based access control (RBAC)**: Introduce `principal`, `admin`, and `district_admin` roles. Principals see only their school's data; district admins get cross-school aggregates. Enforced at the middleware and data-layer level.
- **SAML / SSO**: Integrate a SAML provider (Google Workspace for Education, Microsoft Entra) so schools can log in with their existing district credentials — no separate password management.
- **Audit log**: Record every login, export, and data change in an `audit_log` table with `userId`, `action`, `resourceId`, and `ipAddress`. Required for FERPA/data-governance compliance at district level.

### AI & Insights

- **Streaming AI responses**: Replace the current batch Anthropic API call with streaming (`stream: true`) and Server-Sent Events so AI insights appear word-by-word instead of after a 1–2s wait — better perceived performance.
- **Semantic caching**: Before hitting the Anthropic API, check if a semantically similar prompt was answered recently (using vector embeddings on the prompt hash). Reduces duplicate API calls when teacher data barely changes between refreshes.
- **Insight history**: Store past AI summaries with timestamps so principals can compare "this week vs last week" AI narratives side by side.
- **Configurable AI personas**: Allow district admins to tune the prompt tone (encouraging vs critical) and output language (English, Hindi, regional languages) per school.

### Real-time & Notifications

- **Supabase Realtime**: Subscribe to `INSERT` events on `teacher_activities` to push live updates to the dashboard without polling. A principal sees new activity appear instantly as teachers submit work.
- **Teacher inactivity alerts**: A cron job (Vercel Cron or pg_cron) checks daily for teachers with zero activities in the past 3 days and sends a Slack/email webhook alert to the principal.
- **Activity submission tracking**: Add a `student_submissions` table linked to each `teacher_activity` to enable the Submission Rate metric (currently shown as a placeholder on the dashboard).

### Performance & Infrastructure

- **Edge middleware**: Migrate the Auth.js middleware to the Vercel Edge runtime (currently Node.js runtime) for sub-1ms auth checks at the CDN layer globally, rather than routing to a serverless function in a single region.
- **ISR for public pages**: The login page and any marketing/info pages can use Incremental Static Regeneration to serve from Vercel's CDN with zero cold-start latency.
- **API rate limiting**: Add per-IP and per-user rate limiting on `/api/reports/export` and `/api/insights` (the two most expensive routes) using Vercel's Edge Config or Upstash Redis.
- **Observability**: Integrate [Sentry](https://sentry.io) for error tracking and [Vercel Analytics](https://vercel.com/analytics) + [Speed Insights](https://vercel.com/docs/speed-insights) for Core Web Vitals monitoring in production.

### Export & Reporting

- **PDF reports**: Generate styled PDF exports (using Puppeteer or a React-to-PDF library) for printable weekly summary reports — a common requirement for school management meetings.
- **Scheduled email reports**: Allow principals to subscribe to automated weekly PDF/Excel reports delivered to their inbox every Monday morning via a Resend/SendGrid integration.
- **CSV export per teacher**: Export individual teacher activity logs as CSV for import into external HR or payroll systems.
