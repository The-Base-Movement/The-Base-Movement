---
name: political-movement-supervisor
description: >
  Web development supervisor protocol for The Base Movement (thebasemovement.com / nevermind-beta.vercel.app).
  A Ghana-focused grassroots political movement with live pages: Home, About, Blog, Polls, Agenda,
  Leadership, Chapters, Jobs, Store, Donate, Contact, Login/Register, Diaspora/Ghana platforms.
  Trigger this skill for any work on this project — security reviews, new features, content rules,
  deployment decisions, database/auth changes, or anything touching member/supporter data.
  Also trigger for content publishing, messaging strategy, and electoral compliance questions.
---

# The Base Movement — Web Dev Supervisor Protocol

Site: thebasemovement.com (staging: nevermind-beta.vercel.app)
Stack: Next.js on Vercel · Ghana + Diaspora dual-platform · Auth with Login/Register flows
Purpose: Grassroots political movement — youth jobs, accountability, national development

---

## Supervisor Aims

Every decision on this codebase is checked against these:

1. **Mobilize** — Does this feature move a visitor toward joining, donating, or taking action? If not, justify it.
2. **Protect Members** — Registered users (Ghana Base + Diaspora) are the movement's most sensitive asset. Their data is treated like classified information.
3. **Own the Narrative** — The site is the primary source of truth. Social channels amplify; they don't replace.
4. **Stay Live Under Pressure** — Political moments are unpredictable. The site must handle traffic spikes without going down.
5. **Build Electoral Trust** — Everything public-facing — from the Jobs page to the Store — is scrutinized. Nothing sloppy ships.
6. **Compliance First on Money** — Donate page and Store involve real money. Ghana electoral law and payment processor rules are verified before any change to those flows.

---

## Iron Laws (Non-Negotiable)

| #   | Law                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------- |
| 1   | No member PII (name, phone, email, region) in client-side storage (localStorage, cookies without HTTPOnly) |
| 2   | No production deploy Friday after 3PM WAT                                                                  |
| 3   | All form inputs (Register, Contact, Donate, Newsletter) validated server-side — not just client-side       |
| 4   | Every commit to main must be reversible within 5 minutes                                                   |
| 5   | No secrets, API keys, or DB credentials in the codebase — `.env` only                                      |
| 6   | No self-merge to main/production                                                                           |
| 7   | Donate and Store changes require legal/compliance sign-off before going live                               |
| 8   | All Blog/Updates content must have a named author and cited sources before publish                         |
| 9   | No Facebook Pixel, Google Ads tags, or data-selling analytics on Register or Donate pages                  |
| 10  | Admin dashboard access is role-restricted and IP-restricted where possible                                 |

---

## Security — Specific to This Site

### Authentication (Login / Register pages)

- Use a proven auth provider (NextAuth, Clerk, Supabase Auth) — do not roll custom session logic
- HTTPOnly, Secure, SameSite=Strict cookies for session tokens
- CSRF tokens on all POST forms
- Rate-limit login route: max 5 failed attempts → temporary lockout
- Rate-limit register route to prevent mass fake account creation
- Email verification required before account activation
- Ghana vs Diaspora platform flag stored server-side, not manipulable from client

### Member / Supporter Data

- Role-based access: viewer, coordinator, admin, super-admin
- Bulk member export requires audit log entry (who, when, what)
- Member data encrypted at rest in DB
- No third-party receives member data without explicit consent + legal basis
- GDPR-adjacent practices apply for Diaspora users (EU, UK, US members)

### Payments — Donate + Store

- Never handle raw card data — use Paystack (Ghana-standard) or Stripe
- Webhook endpoints for payment confirmation are signature-verified
- Donation receipts stored with transaction ID, amount, timestamp, member ID
- Refund/dispute flow documented before going live
- Electoral law on donation limits/disclosure reviewed with a Ghanaian legal contact

### Forms — Contact, Newsletter, Polls

- All inputs sanitized and validated server-side
- Honeypot field on Contact and Newsletter forms (spam prevention)
- Poll responses tied to verified accounts only — no anonymous voting manipulation
- Contact form submissions stored in DB with IP + timestamp for abuse tracking

### Infrastructure (Vercel)

- Environment variables set in Vercel dashboard only — never in codebase
- Preview deployments do NOT have access to production DB credentials
- Production and staging use separate DB instances
- Vercel project is owned by an org account, not a personal account
- Enable Vercel's DDoS protection and edge rate limiting
- Custom domain (thebasemovement.com) has HTTPS enforced, HSTS header set

### Security Headers (add to `next.config.js`)

```js
headers: [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline';",
    // Tighten script-src once inline scripts are audited
  },
]
```

---

## Checks & Balances

### Pre-Deploy Checklist

- [ ] Tested in staging (nevermind-beta.vercel.app) first
- [ ] `npm audit` — zero critical/high CVEs
- [ ] No secrets in code (`git grep -r "sk_" . && git grep -r "password"`)
- [ ] No `console.log` with sensitive data left in production paths
- [ ] Server-side validation on any new/changed form
- [ ] Mobile tested (site has Ghana mobile-first audience)
- [ ] Lighthouse ≥ 90 on affected pages
- [ ] Rollback plan: which commit to revert to, how long it takes
- [ ] Error monitoring (Sentry) active and catching errors in staging
- [ ] If Donate/Store changed: compliance check done
- [ ] If auth/register changed: full signup flow tested end-to-end
- [ ] If Blog content published: author named, sources cited

### Weekly Supervisor Questions

1. What pages/features shipped? Do they move people toward joining or acting?
2. What new member/supporter data are we now holding? Is it protected?
3. Did any core flow break this week (Register, Login, Donate, Contact)?
4. Is there a process or feature that exists out of habit and should be removed?
5. Is the stats dashboard (Regions 0/16, Branches 0, Diaspora 0) accurate and updating correctly?

### Incident Response

| Step           | Action                                                                                |
| -------------- | ------------------------------------------------------------------------------------- |
| 1. Identify    | P0: site down, breach, broken auth/donate. P1: major UX broken. P2: content/minor bug |
| 2. Communicate | P0: notify all stakeholders within 15 minutes                                         |
| 3. Revert      | Don't fix forward under pressure — revert to last known good deploy on Vercel         |
| 4. Post-mortem | Written within 48 hours: what happened, root cause, what changes                      |

---

## Content Rules (Political Platform)

Applies to: Blog/Updates, Polls, The Plan, Leadership pages, Press

1. **No anonymous publishing** — every article/statement has a named author or official designation
2. **Claim → Source** — every factual/statistical claim has a URL or citation in the CMS before publish
3. **Correction template** — a visible correction notice is built into the CMS; don't add it later
4. **Polls integrity** — poll questions are reviewed for leading/biased language before publishing; results shown with methodology note
5. **Leadership page** — officer bios reviewed by the named individual before publishing
6. **Jobs page** — all job listings verified as real before posting; no ghost listings
7. **No urgency dark patterns** — no fake countdown timers, no "only X spots left" unless factually true

---

## Priority Framework

| Level       | Trigger                                                                                       | Response                                                                       |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| P0 CRITICAL | Site down, data breach, broken register/login/donate, defamatory content live                 | Drop everything. Revert first. Notify stakeholders. No ETA given — just fixed. |
| P1 HIGH     | Core UX broken (signup flow, chapter map, polls), security vuln, wrong political content live | Fixed this sprint. No new features until resolved.                             |
| P2 STANDARD | Feature work, content updates, optimizations, minor bugs                                      | Backlog. Prioritized by mobilization impact.                                   |

---

## Page-Specific Notes

| Page        | Key Risk                              | Watch For                                                    |
| ----------- | ------------------------------------- | ------------------------------------------------------------ |
| `/register` | Mass fake signups, PII exposure       | Rate limiting, email verification, server-side validation    |
| `/donate`   | Electoral compliance, payment failure | Paystack webhook verification, receipt storage, legal limits |
| `/store`    | Payment flow, inventory accuracy      | Same as donate; don't show out-of-stock items as available   |
| `/polls`    | Vote manipulation, leading questions  | Auth-gated voting, bias review on questions                  |
| `/blog`     | Misinformation, anonymous content     | Author + source required fields in CMS                       |
| `/officers` | Outdated/unauthorized info            | Named individual approval before publish                     |
| `/jobs`     | Ghost listings, spam applications     | Verified listings only; application data protected           |
| `/chapters` | Stale data (0 counts showing)         | Stats pipeline must be live before public launch             |

---

## What Still Needs Attention (Observed from Live Site)

Based on audit of nevermind-beta.vercel.app:

- **Stats are showing 0** — Regions 0/16, Branches 0, Diaspora 0, Ghana Base 0. These need to either be populated or hidden until data is live. Showing zeros publicly undermines credibility.
- **Donate page rendered empty** — The `/donate` page returned no content. This is a P1 issue if real donations are expected.
- **OG image path** — Homepage uses `/branding/logo.png` for OG image but donate page references `/branding/og-image.png`. Verify both exist and are correct dimensions (1200×630).
- **Register is robots-disallowed** — Confirm this is intentional (to block scraping) not accidental (blocking legitimate access).
- **thebasemovement.com vs nevermind-beta.vercel.app** — Confirm canonical URL is set correctly across all pages to avoid SEO split once production domain is live.
