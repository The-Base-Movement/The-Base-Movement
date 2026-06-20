# The Base Movement - Ghana First

![The Base Banner](docs/media/the-base-banner-1.png)

## Mission: Ghana First, Jobs for the Youth!

**The Base** is a grassroots political movement dedicated to the transformation of Ghana through patriotism, honesty, and discipline. This platform is the movement's digital headquarters: members join as **Base Ghana** (organised by region and constituency) or **Base Diaspora** (organised by country), and the platform handles everything from registration and chapters to donations, polls, jobs, the store, and member communications.

**Live site:** [thebasemovement.info](https://thebasemovement.info) (migrating to thebasemovement.info)

---

## Technical Architecture

### Core Stack

| Layer         | Technology                                                   |
| ------------- | ------------------------------------------------------------ |
| Framework     | React 19 + Vite 7 (TypeScript 5.9, strict mode)              |
| Routing       | React Router v7 (lazy-loaded routes in `src/routes.tsx`)     |
| Styling       | Custom CSS design system (`src/index.css`) — no new Tailwind |
| Icons         | Material Symbols Outlined (exclusively — no Lucide)          |
| Backend       | Supabase (Postgres + RLS, Auth, Edge Functions, Storage)     |
| Payments      | Hubtel (mobile money + card) via edge functions              |
| Email / SMS   | SendGrid, Resend, Africa's Talking                           |
| Build         | Hybrid SSR + static prerendering (`scripts/prerender.mjs`)   |
| Forms         | React Hook Form + Zod                                        |
| Rich text     | TinyMCE (blog editor)                                        |
| OCR           | Tesseract.js + PDF.js (in-browser scan-to-fill registration) |
| Charts / Maps | Recharts, Mapbox GL (GIS visualisation)                      |
| Animations    | GSAP + Framer Motion                                         |
| Monitoring    | Sentry (errors), Umami (analytics)                           |
| Hosting       | Vercel (auto-deploys from `main`)                            |

### Three Application Surfaces

1. **Public Site (`PublicLayout`)** — marketing, homepage, blog, store, chapters, registration
2. **Member Dashboard (`DashboardLayout`)** — authenticated workspace for registered patriots: donations, polls, activity, store orders
3. **Admin Command Center (`AdminLayout`)** — staff operations: member verification, analytics, finance, broadcasts, media library, logistics

---

## Design Principles

Our visual identity is governed by the national colours of Ghana:

- **Green `#006B3F`** — long-term vision for a transformed nation; primary CTAs and active states
- **Gold `#DAA520`** — values of Patriotism, Honesty, and Discipline; secondary highlights
- **Red `#CE1126`** — immediate call to action; urgency and live indicators
- **Charcoal `#111111`** — premium legibility; primary text and solid headers

All colours are defined as CSS variables (`hsl(var(--primary))`, `hsl(var(--accent))`, etc.) in `src/index.css`. Never use raw hex codes in components. Full conventions (layout classes, buttons, pills, radius tokens) live in `docs/design-system-handoff/` and `docs/audits/`.

---

## Project Structure

```
src/
├── routes.tsx          # All routes, lazy-loaded page imports
├── index.css           # Custom design system (variables, layout classes, components)
├── pages/              # Full-page views (admin/, dashboard/, donate/, etc.)
├── components/         # Shared UI components
├── services/           # Supabase service layer — the ONLY code that talks to Supabase
├── context/            # React context providers (Auth, Branding, Chapters, Performance)
├── hooks/              # Custom hooks (useBranding, useMediaQuery, use-mobile, etc.)
├── lib/                # Utilities (supabase client, currency, scanForm, analytics)
├── types/              # TypeScript definitions
└── utils/              # Helpers (mapUtils GeoJSON, offlineDb IndexedDB)

supabase/
├── functions/          # 25+ Edge Functions (payments, OTP, email, push, OCR, schedulers)
└── migrations/         # Database migrations — the source of truth for schema & RLS

scripts/                # Build tooling (prerender, SSR entry)
public/                 # Static assets: branding, fonts, flags, GeoJSON, PWA manifest
docs/                   # Architecture, database docs, design-system audits, feature docs
ml-service/             # FastAPI sentiment-analysis microservice (separate deploy)
```

**Key rule:** pages and components never call `supabase` directly — all database access goes through `src/services/`.

---

## Development

### Prerequisites

- Node.js v20+
- npm
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for migrations and edge functions)

### Setup

```bash
# 1. Clone
git clone https://github.com/Styphler17/The-Base-Movement.git
cd The-Base-Movement

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in the VITE_* values — see comments in .env.example for where each key comes from.
# Ask the project owner for the shared Supabase URL and anon key.

# 4. Start the dev server (port 3000)
npm run dev
```

### Key Commands

| Command             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Vite dev server                                              |
| `npm run typecheck` | TypeScript strict check (run before every commit)            |
| `npm run lint`      | ESLint                                                       |
| `npm run build`     | Full production build: tsc → client bundle → SSR → prerender |
| `npm run test`      | Vitest test suite                                            |

---

## Contributing Workflow

`main` is production — every push to it deploys to the live site via Vercel. Work never goes directly on `main`:

1. **Branch** from `main`: `git checkout -b feat/short-description` (or `fix/...`)
2. **Commit freely** on your branch; run `npm run typecheck` and `npm run lint` before pushing
3. **Open a pull request** — Vercel attaches a preview URL to every PR for review
4. **Squash-merge** into `main` after review — one clean commit per feature

### Database & edge functions (shared state — coordinate first)

The Supabase database is shared by everyone and **is** production. Unlike code, it is not branched:

- Schema changes go in a migration file: `supabase migration new <name>`, applied with `supabase db push`
- Edge functions deploy separately: `supabase functions deploy <name>`
- Both should happen **after** the related PR merges, and be coordinated with the project owner
- Every new column on `public.users` needs explicit column-level `GRANT SELECT` — see `docs/database/users-column-security.md`
- Public-facing aggregate data (donation feed, leaderboards) is served through `SECURITY DEFINER` RPCs, not direct table reads — RLS restricts most tables to admins or the row owner

### Deployment pipeline (in order)

```bash
npm run typecheck
npm run build
git push            # Vercel auto-deploys main
supabase functions deploy <name>   # only if edge functions changed
```

---

## Documentation

| Doc                           | Contents                                |
| ----------------------------- | --------------------------------------- |
| `docs/database/`              | Schema documentation and security notes |
| `docs/design-system-handoff/` | Visual reference for the design system  |
| `docs/audits/`                | Design-system audit reports             |
| `docs/session_handover.md`    | Project handover notes                  |

---

## Our Foundation

- **Vision**: A Ghana with quality education, lean accountable government, and industrialisation.
- **Mission**: To deliver an honest, detailed, and actionable agenda rooted in the realities of ordinary Ghanaians.
- **Values**: Patriotism, Honesty, and Discipline.

---

© 2026 The Base Movement. All Rights Reserved. **Ghana First.**
