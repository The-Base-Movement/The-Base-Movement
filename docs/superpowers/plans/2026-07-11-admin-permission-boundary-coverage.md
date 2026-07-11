# Admin Permission Boundary Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make sensitive admin routes and privileged Edge Functions use one tested permission vocabulary without introducing a new role framework.

**Architecture:** Keep `ROLE_CATALOG`, `userCan`, `adminRouteAccess`, RLS, and existing RPCs as the authorization foundation. Generalize the existing Edge Function admin-auth helper so route and server boundaries use the same action/resource pairs, then add table-driven regression checks for sensitive routes and critical Edge Function callers.

**Tech Stack:** React 19, TypeScript, Vitest, Supabase Edge Functions, Deno tests, existing Supabase admin/RLS model.

## Global Constraints

- Do not broaden privileged access.
- Preserve session-storage auth, MFA, privileged-device controls, and `ProtectedAdminRoute`.
- Preserve the admin-gated `admin_get_national_id(reg_no)` RPC; never expose `users.national_id` directly.
- Use the existing `AdminPermission` action/resource vocabulary and stored legacy flags.
- Keep service-role automation working where it is already required.
- Add no permission framework, UI library, dependency, or role-management screen.
- Never log secrets, national IDs, member exports, or unnecessary member PII.

---

### Task 1: Generalize the shared Edge Function permission check

**Files:**
- Modify: `supabase/functions/_shared/admin-auth.ts`
- Create: `supabase/functions/_shared/admin-auth.test.ts`

**Interfaces:**
- Produces: `hasAdminPermission(admin: AdminAuthRow | null | undefined, permission: AdminPermission): boolean`.
- Preserves: `canManageNewsletters`, `canManageMembers`, and `canManageDonations`.
- Adds: `canManageStore` and `canViewAuditLogs` for later privileged functions.

- [ ] **Step 1: Write the failing Deno tests**

Create `supabase/functions/_shared/admin-auth.test.ts`:

```ts
import { assertEquals } from 'jsr:@std/assert'
import {
  canManageDonations,
  canManageMembers,
  canManageNewsletters,
  canManageStore,
  canViewAuditLogs,
  hasAdminPermission,
} from './admin-auth.ts'

const arrayAdmin = {
  id: 'admin-1',
  role: 'FINANCE_OFFICER',
  permissions: [
    { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
    { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' },
  ],
}

Deno.test('checks array permissions by action and resource', () => {
  assertEquals(
    hasAdminPermission(arrayAdmin, { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' }),
    true
  )
  assertEquals(
    hasAdminPermission(arrayAdmin, { action: 'MANAGE_INVENTORY', resource: 'STORE' }),
    false
  )
})

Deno.test('preserves privileged role access', () => {
  const founder = { id: 'admin-2', role: 'FOUNDER', permissions: [] }
  assertEquals(canManageMembers(founder), true)
  assertEquals(canManageNewsletters(founder), true)
  assertEquals(canManageDonations(founder), true)
  assertEquals(canManageStore(founder), true)
  assertEquals(canViewAuditLogs(founder), true)
})

Deno.test('preserves legacy permission flags', () => {
  const legacy = {
    id: 'admin-3',
    role: 'ADMIN',
    permissions: {
      can_manage_members: true,
      can_manage_newsletters: true,
      can_manage_store: false,
    },
  }
  assertEquals(canManageMembers(legacy), true)
  assertEquals(canManageNewsletters(legacy), true)
  assertEquals(canManageStore(legacy), false)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx -y deno test --no-check --no-lock supabase/functions/_shared/admin-auth.test.ts
```

Expected: FAIL because `hasAdminPermission`, `canManageStore`, and `canViewAuditLogs` are not exported.

- [ ] **Step 3: Implement the generic permission helper**

In `supabase/functions/_shared/admin-auth.ts`, replace the current permission types and duplicated array checks with:

```ts
export type AdminPermission = {
  action: string
  resource: string
}

export type LegacyAdminPermissions = {
  can_manage_members?: boolean
  can_post_blog?: boolean
  can_manage_newsletters?: boolean
  can_manage_donations?: boolean
  can_manage_store?: boolean
  can_view_audit_logs?: boolean
  [key: string]: boolean | undefined
}

export type AdminPermissions = AdminPermission[] | LegacyAdminPermissions

export interface AdminAuthRow {
  id: string
  role: string | null
  permissions: AdminPermissions | null
}

const legacyPermissionFlags: Record<string, keyof LegacyAdminPermissions> = {
  'VERIFY_MEMBER:MEMBERS': 'can_manage_members',
  'MANAGE_NEWSLETTERS:NEWSLETTERS': 'can_manage_newsletters',
  'MANAGE_DONATIONS:DONATIONS': 'can_manage_donations',
  'MANAGE_INVENTORY:STORE': 'can_manage_store',
  'VIEW_AUDIT_LOGS:SYSTEM': 'can_view_audit_logs',
}

export function hasAdminPermission(
  admin: AdminAuthRow | null | undefined,
  permission: AdminPermission
): boolean {
  if (!admin) return false
  if (isPrivilegedAdminRole(admin.role)) return true

  if (Array.isArray(admin.permissions)) {
    return admin.permissions.some(
      (granted) =>
        granted.action === permission.action && granted.resource === permission.resource
    )
  }

  const legacyFlag = legacyPermissionFlags[`${permission.action}:${permission.resource}`]
  return legacyFlag ? admin.permissions?.[legacyFlag] === true : false
}

export const canManageNewsletters = (admin: AdminAuthRow | null | undefined) =>
  hasAdminPermission(admin, { action: 'MANAGE_NEWSLETTERS', resource: 'NEWSLETTERS' })

export const canManageMembers = (admin: AdminAuthRow | null | undefined) =>
  hasAdminPermission(admin, { action: 'VERIFY_MEMBER', resource: 'MEMBERS' })

export const canManageDonations = (admin: AdminAuthRow | null | undefined) =>
  hasAdminPermission(admin, { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' })

export const canManageStore = (admin: AdminAuthRow | null | undefined) =>
  hasAdminPermission(admin, { action: 'MANAGE_INVENTORY', resource: 'STORE' })

export const canViewAuditLogs = (admin: AdminAuthRow | null | undefined) =>
  hasAdminPermission(admin, { action: 'VIEW_AUDIT_LOGS', resource: 'SYSTEM' })
```

Keep `requireServiceRoleCall`, `requireAuthorizedAdmin`, `json`, `isPrivilegedAdminRole`, and `getSenderEmail` otherwise unchanged.

- [ ] **Step 4: Run the focused Deno test**

Run:

```bash
npx -y deno test --no-check --no-lock supabase/functions/_shared/admin-auth.test.ts
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/admin-auth.ts supabase/functions/_shared/admin-auth.test.ts
git commit -m "Unify Edge Function admin permission checks"
```

### Task 2: Lock sensitive admin route decisions with a table-driven test

**Files:**
- Create: `src/test/adminSensitiveRouteAccess.test.ts`
- Modify only if the test exposes a mismatch: `src/lib/adminRouteAccess.ts`

**Interfaces:**
- Consumes: `getAdminRouteAccessDecision(user, pathname)` and the existing `AdminPermission` pairs.
- Produces: Regression coverage for direct URL access to sensitive admin routes.

- [ ] **Step 1: Write the sensitive-route matrix test**

Create `src/test/adminSensitiveRouteAccess.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getAdminRouteAccessDecision } from '@/lib/adminRouteAccess'
import type { AdminPermission, AdminRole, AdminUser } from '@/types/admin'

const admin = (role: AdminRole, permissions: AdminPermission[]): AdminUser =>
  ({
    id: 'admin-1',
    email: 'admin@example.test',
    name: 'Admin User',
    role,
    permissions,
    aal: 'aal2',
  }) as AdminUser

const cases: Array<{
  path: string
  permission: AdminPermission
}> = [
  {
    path: '/admin/members/member-1',
    permission: { action: 'VIEW_MEMBER_DIRECTORY', resource: 'MEMBERS' },
  },
  {
    path: '/admin/donations',
    permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
  },
  {
    path: '/admin/priorities',
    permission: { action: 'MANAGE_DONATIONS', resource: 'DONATIONS' },
  },
  {
    path: '/admin/newsletter/analytics',
    permission: { action: 'MANAGE_NEWSLETTERS', resource: 'NEWSLETTERS' },
  },
  {
    path: '/admin/store',
    permission: { action: 'MANAGE_INVENTORY', resource: 'STORE' },
  },
  {
    path: '/admin/orders',
    permission: { action: 'MANAGE_INVENTORY', resource: 'STORE' },
  },
  {
    path: '/admin/administrators',
    permission: { action: 'VIEW_ADMINS', resource: 'ADMINS' },
  },
]

describe('sensitive admin route access', () => {
  it.each(cases)('requires $permission.action on $path', ({ path, permission }) => {
    expect(getAdminRouteAccessDecision(admin('ADMIN', []), path).allowed).toBe(false)
    expect(getAdminRouteAccessDecision(admin('ADMIN', [permission]), path).allowed).toBe(true)
  })

  it('fails closed for an unmapped admin route', () => {
    expect(getAdminRouteAccessDecision(admin('SUPER_ADMIN', []), '/admin/unmapped').allowed).toBe(
      false
    )
  })
})
```

- [ ] **Step 2: Run the test and inspect any mismatch**

Run:

```bash
npm run test:run -- src/test/adminSensitiveRouteAccess.test.ts
```

Expected: PASS. If a listed route fails, add the corresponding exact-or-descendant rule to `MANUAL_ROUTE_RULES` in `src/lib/adminRouteAccess.ts`; do not loosen the expected matrix.

- [ ] **Step 3: Run the existing role and department policy tests**

Run:

```bash
npm run test:run -- src/test/adminSensitiveRouteAccess.test.ts src/test/roleCatalog.test.ts src/test/adminPermissionHydration.test.ts src/test/departmentCatalog.test.ts
```

Expected: PASS for all four files.

- [ ] **Step 4: Commit**

```bash
git add src/test/adminSensitiveRouteAccess.test.ts src/lib/adminRouteAccess.ts
git commit -m "Cover sensitive admin route permissions"
```

If `src/lib/adminRouteAccess.ts` did not change, omit it from `git add`.

### Task 3: Align donation receipt and member-export Edge Functions with permissions

**Files:**
- Modify: `supabase/functions/send-donation-receipt/index.ts`
- Modify: `supabase/functions/backfill-donation-receipts/index.ts`
- Modify: `supabase/functions/sync-sendgrid-bulk/index.ts`
- Create: `src/test/edgeFunctionAuthorizationContracts.test.ts`

**Interfaces:**
- Consumes: `requireAuthorizedAdmin`, `canManageDonations`, and `canManageNewsletters` from Task 1.
- Preserves: service-role calls from Hubtel callbacks, cron/automation, and existing function response bodies.

- [ ] **Step 1: Write the failing source-contract test**

Create `src/test/edgeFunctionAuthorizationContracts.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFileSync(path, 'utf8')

describe('privileged Edge Function authorization contracts', () => {
  it('allows authorized donation admins or service automation to send receipts', () => {
    const code = source('supabase/functions/send-donation-receipt/index.ts')
    expect(code).toContain('requireAuthorizedAdmin')
    expect(code).toContain('canManageDonations')
    expect(code).toContain('allowServiceRole: true')
  })

  it('uses donation permission for receipt backfill', () => {
    const code = source('supabase/functions/backfill-donation-receipts/index.ts')
    expect(code).toContain('canManageDonations')
    expect(code).not.toContain('(admin) => isPrivilegedAdminRole(admin.role)')
  })

  it('uses newsletter permission for SendGrid bulk member sync', () => {
    const code = source('supabase/functions/sync-sendgrid-bulk/index.ts')
    expect(code).toContain('canManageNewsletters')
    expect(code).not.toContain('canManageMembers')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test:run -- src/test/edgeFunctionAuthorizationContracts.test.ts
```

Expected: FAIL because the receipt sender is service-role-only, backfill checks only privileged roles, and bulk sync uses member-management permission.

- [ ] **Step 3: Authorize receipt delivery for donation managers and automation**

In `supabase/functions/send-donation-receipt/index.ts`, change the shared import to:

```ts
import {
  canManageDonations,
  getSenderEmail,
  json,
  requireAuthorizedAdmin,
} from '../_shared/admin-auth.ts'
```

After creating `supabaseAdmin`, replace `requireServiceRoleCall` with:

```ts
const authz = await requireAuthorizedAdmin(req, supabaseAdmin, canManageDonations, {
  allowServiceRole: true,
  serviceRoleKey: serviceKey,
})
if (!authz.ok) return authz.response
```

This keeps Hubtel/service-role invocation working and makes `adminService.retryDonationReceipt()` usable by an authorized donation administrator.

- [ ] **Step 4: Align receipt backfill with donation permission**

In `supabase/functions/backfill-donation-receipts/index.ts`, replace the shared import with:

```ts
import { canManageDonations, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'
```

Replace the authorization callback:

```ts
(admin) => isPrivilegedAdminRole(admin.role)
```

with:

```ts
canManageDonations
```

Keep `allowServiceRole: true` unchanged.

- [ ] **Step 5: Require newsletter permission for SendGrid bulk sync**

In `supabase/functions/sync-sendgrid-bulk/index.ts`, replace:

```ts
import { canManageMembers, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'
```

with:

```ts
import { canManageNewsletters, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'
```

Pass `canManageNewsletters` to the existing `requireAuthorizedAdmin` call. Keep service-role fallback unchanged if it is already enabled.

- [ ] **Step 6: Run focused authorization tests**

Run:

```bash
npm run test:run -- src/test/edgeFunctionAuthorizationContracts.test.ts src/test/adminDonationReceipt.test.ts
npx -y deno test --no-check --no-lock supabase/functions/_shared/admin-auth.test.ts supabase/functions/send-donation-receipt/index.test.ts
npm run typecheck
```

Expected: all commands exit 0; Vitest reports 5 tests across two files and Deno reports the shared auth plus receipt-outcome tests passing.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/send-donation-receipt/index.ts supabase/functions/backfill-donation-receipts/index.ts supabase/functions/sync-sendgrid-bulk/index.ts src/test/edgeFunctionAuthorizationContracts.test.ts
git commit -m "Align privileged functions with admin permissions"
```

### Task 4: Final boundary verification

**Files:** Modify only when a check exposes a defect in Tasks 1–3.

**Interfaces:**
- Verifies: route decisions, permission hydration, Edge Function authorization helpers, receipt retry behavior, and TypeScript compatibility.

- [ ] **Step 1: Run the complete focused Vitest set**

Run:

```bash
npm run test:run -- src/test/adminSensitiveRouteAccess.test.ts src/test/edgeFunctionAuthorizationContracts.test.ts src/test/adminDonationReceipt.test.ts src/test/roleCatalog.test.ts src/test/adminPermissionHydration.test.ts src/test/departmentCatalog.test.ts
```

Expected: all six files pass.

- [ ] **Step 2: Run the complete focused Deno set**

Run:

```bash
npx -y deno test --no-check --no-lock supabase/functions/_shared/admin-auth.test.ts supabase/functions/send-donation-receipt/index.test.ts
```

Expected: all tests pass.

- [ ] **Step 3: Run static validation**

Run:

```bash
npm run typecheck
npx eslint src/lib/adminRouteAccess.ts src/test/adminSensitiveRouteAccess.test.ts src/test/edgeFunctionAuthorizationContracts.test.ts supabase/functions/_shared/admin-auth.ts supabase/functions/_shared/admin-auth.test.ts supabase/functions/send-donation-receipt/index.ts supabase/functions/backfill-donation-receipts/index.ts supabase/functions/sync-sendgrid-bulk/index.ts
git diff --check
```

Expected: every command exits 0. Edge Function files may be reported as ignored by ESLint, but there must be no lint errors in checked files.

- [ ] **Step 4: Update the project graph**

Run:

```bash
graphify update .
```

Expected: graph rebuild succeeds.

- [ ] **Step 5: Confirm the implementation branch is clean**

Run:

```bash
git status --short
```

Expected: no output. If a verification command changed a file, return to the task that owns that file, rerun its focused checks, and include the correction in that task's commit before completing this step.
