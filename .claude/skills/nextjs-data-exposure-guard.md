---
name: nextjs-data-exposure-guard
description: >
  Prevents sensitive data from leaking into HTML source, browser console, DevTools, and
  client-side JavaScript bundles in Next.js projects. Trigger this skill whenever working
  on a Next.js project that handles user data, auth, payments, or any private information.
  Use when auditing __NEXT_DATA__, reviewing getServerSideProps props, checking .env prefixes,
  removing console.log from production, hardening API route error handling, or any time
  the question is "what can someone see when they inspect our page?". Critical for political,
  financial, healthcare, or any high-trust platforms where data exposure is a reputational
  or legal risk.
---

# Next.js Data Exposure Guard

Stops sensitive data from leaking into HTML, DevTools, console, and client JS bundles.
Applies to any Next.js project — App Router or Pages Router.

---

## The 5 Leak Vectors

Every exposure issue comes from one of these five sources. Check all five on every audit.

| #   | Vector                                     | Where It Shows                              |
| --- | ------------------------------------------ | ------------------------------------------- |
| 1   | `__NEXT_DATA__` over-hydration             | Page source → `<script id="__NEXT_DATA__">` |
| 2   | `NEXT_PUBLIC_` env variable misuse         | Client JS bundle, visible in Sources tab    |
| 3   | `console.log` left in production           | Browser Console tab                         |
| 4   | Raw error messages from API routes         | Browser Console / Network tab response      |
| 5   | Sensitive fields passed through page props | `__NEXT_DATA__` + React component tree      |

---

## Vector 1 — `__NEXT_DATA__` Over-Hydration

### What it is

Next.js serializes everything returned from `getServerSideProps` or passed as page props
into a `<script id="__NEXT_DATA__">` tag in the HTML. Anyone can read it — no DevTools needed,
just View Source.

### How to audit

Open any page → View Source → Ctrl+F `__NEXT_DATA__` → read the JSON.
Or in DevTools Console:

```js
JSON.parse(document.getElementById('__NEXT_DATA__').textContent)
```

### The rule

Only pass fields the UI **needs to render** into props. Strip everything else server-side.

```js
// BAD — full user object in props = full user object in HTML
export async function getServerSideProps({ req }) {
  const user = await getUser(req)
  return { props: { user } }
  // Exposes: email, phone, hashedPassword, role, memberId, region, createdAt...
}

// GOOD — only what the UI needs
export async function getServerSideProps({ req }) {
  const user = await getUser(req)
  return {
    props: {
      user: {
        displayName: user.name,
        platform: user.platform, // GHANA or DIASPORA
        avatarUrl: user.avatarUrl ?? null,
      },
    },
  }
}
```

### App Router equivalent

In App Router, sensitive fetches stay in Server Components — they never serialize to the client.
Only data passed to Client Components (`'use client'`) crosses the boundary. Audit those boundaries.

```js
// Server Component — safe, never sent to client
const user = await db.getUser(session.userId)

// BAD — passing full object to a Client Component
return <ProfileCard user={user} />

// GOOD — destructure only what the Client Component renders
return <ProfileCard name={user.displayName} platform={user.platform} />
```

---

## Vector 2 — `NEXT_PUBLIC_` Env Variable Misuse

### What it is

Any variable prefixed `NEXT_PUBLIC_` is **bundled into the client JavaScript** and visible
to anyone who opens Sources tab or runs `strings` on your JS bundle.

### The rule

`NEXT_PUBLIC_` = safe to be public. Nothing else.

```bash
# .env — correct usage

# PUBLIC — fine, these are meant to be client-visible
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxx
NEXT_PUBLIC_SITE_URL=https://thebasemovement.com
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=thebasemovement.com

# SECRET — server-side only, NO NEXT_PUBLIC_ prefix
DATABASE_URL=postgresql://...
PAYSTACK_SECRET_KEY=sk_live_xxxx
NEXTAUTH_SECRET=xxxx
JWT_SECRET=xxxx
SMTP_PASSWORD=xxxx
```

### Audit command

```bash
# Find every NEXT_PUBLIC_ variable — verify each one is actually safe to be public
grep -r "NEXT_PUBLIC_" .env .env.local .env.production 2>/dev/null

# Find any secret-looking values with NEXT_PUBLIC_ prefix (should return nothing)
grep "NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*PASSWORD\|NEXT_PUBLIC_.*PRIVATE" .env* 2>/dev/null
```

### Accessing server-only vars

Never access non-`NEXT_PUBLIC_` vars in client components — Next.js returns `undefined` and
sometimes logs a warning, but the real risk is accidental exposure if the prefix is added later.

```js
// In a Server Component or API route — fine
const db = process.env.DATABASE_URL

// In a Client Component — WRONG, and will be undefined anyway
const secret = process.env.JWT_SECRET // undefined in client, but don't do this
```

---

## Vector 3 — `console.log` in Production

### What it is

Development logs left in production code appear in any user's browser Console tab.
This can expose request payloads, user objects, API responses, or internal logic.

### Fix — strip all console output from production builds

In `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    // Or target specific methods only:
    // removeConsole: { exclude: ['error'] } // keeps console.error, removes rest
  },
}

module.exports = nextConfig
```

### For intentional server-side logging

Use a server-only logger (Pino, Winston) that writes to your logging service, never to stdout
in a way that reaches the browser:

```js
// lib/logger.js — server-side only
import pino from 'pino'
export const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

// Usage in API route or Server Component
logger.info({ userId: user.id }, 'User registered') // goes to your log drain, not browser
```

### Audit command

```bash
# Find console.log in source files (excluding node_modules)
grep -r "console\.log" --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.next .

# More specific — find ones that might log sensitive data
grep -r "console\.log.*user\|console\.log.*email\|console\.log.*token\|console\.log.*password" \
  --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .
```

---

## Vector 4 — API Route Error Leakage

### What it is

Unhandled errors in API routes can expose: stack traces, file system paths, DB error messages,
table/column names, or internal logic — all visible in the Network tab response body.

### The rule

Log full errors server-side. Return only generic messages to the client.

```js
// BAD — exposes internals
export async function POST(req) {
  const data = await db.query(sql)  // if this throws...
  // Error: relation "tbl_members" does not exist  ← attacker learns your table name
}

// BAD — explicit exposure
} catch (error) {
  return Response.json({ error: error.message }) // never do this
}

// GOOD
} catch (error) {
  // Log full error server-side (Sentry, your logger)
  logger.error(error, 'Registration failed')
  // or: await Sentry.captureException(error)

  // Return generic message to client
  return Response.json(
    { message: 'Something went wrong. Please try again.' },
    { status: 500 }
  )
}
```

### Global error wrapper for API routes (Pages Router)

```js
// lib/withErrorHandler.js
export function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error(error) // server-side only
      res.status(500).json({ message: 'Internal server error' })
    }
  }
}

// Usage
export default withErrorHandler(async (req, res) => {
  // your handler
})
```

### Specific errors to never expose

- DB connection errors (contain DB URL fragments)
- Auth errors beyond "Invalid credentials"
- File system errors (contain server paths)
- Validation library internal errors (use `.format()` to sanitize Zod errors first)

```js
// Zod error — sanitize before sending
} catch (error) {
  if (error instanceof ZodError) {
    return Response.json(
      { message: 'Validation failed', fields: error.flatten().fieldErrors },
      { status: 400 }
    )
    // fieldErrors only contains field names + messages — no internals
  }
}
```

---

## Vector 5 — Sensitive Fields in Component Props

### What it is

Even without `getServerSideProps`, data flows through the React component tree.
If a parent component receives a full user/member object and passes it down,
React DevTools (or hydration data) exposes the whole object.

### The rule

Destructure at the source. Pass only what a component renders.

```js
// BAD
<MemberCard member={member} />
// In DevTools → Components tab: member = { id, email, phone, role, hashedPassword... }

// GOOD
<MemberCard
  name={member.displayName}
  region={member.region}
  platform={member.platform}
/>
```

### Sensitive fields that should never reach client components

- `password` / `hashedPassword`
- `email` (unless the component explicitly displays it to the authenticated user)
- `phone` (same rule)
- `role` / `permissions` (use derived booleans: `isAdmin`, `canEdit` — not the raw role string)
- `internalId` / `dbId` (use a public-safe slug or UUID instead)
- Any audit/log fields

---

## Full Audit Checklist

Run before every production deploy and after any auth, user, or payment feature change.

### **NEXT_DATA** audit

- [ ] Open site in browser → View Source → search `__NEXT_DATA__`
- [ ] Verify no email, phone, password, role, or internal IDs in the output
- [ ] Check every `getServerSideProps` — props contain only UI-required fields

### Env variable audit

- [ ] `grep "NEXT_PUBLIC_" .env*` — every result is safe to be public
- [ ] No SECRET, PASSWORD, PRIVATE, KEY (secret), TOKEN in NEXT*PUBLIC* vars
- [ ] Preview deployments use separate/restricted env vars (not production secrets)

### Console audit

- [ ] `removeConsole` set in `next.config.js` for production
- [ ] Grep for `console.log` — verify none log user data or API responses
- [ ] Run the production build locally (`next build && next start`) and open Console — should be clean

### API route audit

- [ ] All `catch` blocks return generic messages, not `error.message`
- [ ] Sentry or equivalent capturing full errors server-side
- [ ] No DB error messages, file paths, or stack traces in any API response

### Component prop audit

- [ ] No full user/member objects passed to client components
- [ ] React DevTools installed → inspect auth'd pages → no sensitive fields visible in component tree
- [ ] Role/permission checks use derived booleans, not raw role strings

---

## Quick Audit Script

Save as `scripts/audit-exposure.sh` and run before releases:

```bash
#!/bin/bash
echo "=== Checking NEXT_PUBLIC_ vars ==="
grep -r "NEXT_PUBLIC_.*SECRET\|NEXT_PUBLIC_.*PASSWORD\|NEXT_PUBLIC_.*PRIVATE" .env* 2>/dev/null \
  && echo "⚠️  WARNING: Secrets with NEXT_PUBLIC_ prefix found" || echo "✅ Clean"

echo ""
echo "=== Checking console.log in source ==="
COUNT=$(grep -r "console\.log" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next . | wc -l)
echo "Found $COUNT console.log statements — review each one"

echo ""
echo "=== Checking error.message in API responses ==="
grep -r "error\.message\|error\.stack" --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules --exclude-dir=.next . \
  && echo "⚠️  Review above — ensure none reach the client response" || echo "✅ Clean"

echo ""
echo "=== Manual steps required ==="
echo "1. View Source on live site → search __NEXT_DATA__ → inspect for PII"
echo "2. Open Console on live site → should be empty in production"
echo "3. Open Network tab → trigger an error → verify generic message returned"
```

---

## Related Skills

- `political-movement-supervisor` — full security protocol for The Base Movement
- `searchfit-seo:technical-seo` — for auditing public-facing page performance
