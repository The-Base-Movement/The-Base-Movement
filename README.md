# The Base Movement - Ghana First

![The Base Banner](docs/the-base-banner-1.png)

## Mission: Ghana First, Jobs for the Youth!

**The Base** is a high-fidelity, authoritative global political movement dedicated to the transformation of Ghana through patriotism, honesty, and discipline. This platform serves as the digital headquarters for our members worldwide — both in **Base Ghana** and **Base Diaspora**.

---

## Technical Architecture

### Core Stack

| Layer      | Technology                                                      |
| ---------- | --------------------------------------------------------------- |
| Framework  | React 18 + Vite 7 (TypeScript strict mode)                      |
| Routing    | React Router v6 (lazy-loaded routes in `src/routes.tsx`)        |
| Styling    | Custom CSS design system (`src/index.css`) + Tailwind utilities |
| Icons      | Material Symbols Outlined (exclusively)                         |
| Backend    | Supabase (Postgres, Auth, Edge Functions, Storage)              |
| Build      | Hybrid SSR + static prerendering (`scripts/prerender.mjs`)      |
| Rich text  | TinyMCE (blog editor)                                           |
| OCR        | Tesseract.js + PDF.js (in-browser scan-to-fill registration)    |
| Charts     | Recharts (growth analytics)                                     |
| Animations | GSAP (micro-animations)                                         |

### Three Application Surfaces

1. **Public Site (`PublicLayout`)** — marketing, homepage, blog, store, chapters, registration
2. **Member Dashboard (`DashboardLayout`)** — authenticated workspace for registered patriots
3. **Admin Command Center (`AdminLayout`)** — staff operations: member verification, analytics, store, broadcasts

---

## Design Principles

Our visual identity is governed by the national colours of Ghana:

- **Green `#006B3F`** — long-term vision for a transformed nation; primary CTAs and active states
- **Gold `#DAA520`** — values of Patriotism, Honesty, and Discipline; secondary highlights
- **Red `#CE1126`** — immediate call to action; urgency and live indicators
- **Charcoal `#111111`** — premium legibility; primary text and solid headers

All colours are defined as CSS variables (`hsl(var(--primary))`, `hsl(var(--accent))`, etc.) in `src/index.css`. Never use raw hex codes in components.

---

## Project Structure

```
src/
├── routes.tsx          # All routes, lazy-loaded page imports
├── index.css           # Custom design system (variables, layout classes, components)
├── pages/              # Full-page views (admin/, dashboard/, home/, etc.)
├── components/         # Shared UI components
├── services/           # Supabase service layer (adminService, memberService, etc.)
├── context/            # React context providers (BrandingContext, StoreContext)
├── hooks/              # Custom hooks (useBranding, useStore, useMediaQuery, etc.)
├── lib/                # Utilities (scanForm, supabase client, etc.)
├── types/              # TypeScript definitions
└── utils/              # Helper functions

supabase/
├── functions/          # Edge Functions (broadcast-dispatcher, kyc-verify, ocr-verify, etc.)
└── migrations/         # Database migration files

docs/
└── audits/             # Verified reference documents for the design system and architecture
```

---

## Development

### Prerequisites

- Node.js v20+
- npm

### Setup

```bash
# 1. Clone
git clone https://github.com/Styphler17/The-Base-Movement.git
cd The-Base-Movement

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TINYMCE_API_KEY

# 4. Start the dev server
npm run dev
```

### Key Commands

| Command                | Description                                                  |
| ---------------------- | ------------------------------------------------------------ |
| `npm run dev`          | Vite dev server                                              |
| `npm run typecheck`    | TypeScript strict check (run before committing)              |
| `npm run build`        | Full production build: tsc → client bundle → SSR → prerender |
| `npm run build:client` | Client bundle only                                           |
| `npm run lint`         | ESLint                                                       |
| `npm run test`         | Vitest test suite                                            |

---

## Our Foundation

- **Vision**: A Ghana with quality education, lean accountable government, and industrialisation.
- **Mission**: To deliver an honest, detailed, and actionable agenda rooted in the realities of ordinary Ghanaians.
- **Values**: Patriotism, Honesty, and Discipline.

---

© 2026 The Base Movement. All Rights Reserved. **Ghana First.**
