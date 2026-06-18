# Edge Function Security Hardening — Remediation Log

**Date:** 2026-06-18  
**Scope:** Supabase Edge Functions — Service-role key access hardening

## Summary

Applied service-role authentication guards to edge functions that previously lacked caller authorization. Functions now enforce:
- Bearer token validation via `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` header
- Centralized auth helper from `supabase/functions/_shared/admin-auth.ts`
- Consistent error responses (`401` not authenticated, `403` not authorized)

---

## Remediated Functions

### 1. `backfill-donation-receipts` ✅

**Before:** No authentication guard. Any authenticated user could invoke.

**After:**
```typescript
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const authz = requireServiceRoleCall(req, serviceKey)
if (!authz.ok) return authz.response
```

**Impact:** Now requires `Authorization: Bearer <SERVICE_ROLE_KEY>` header. Cron and internal edge functions only.

---

### 2. `send-donation-receipt` ✅

**Before:** No authentication guard. Browser could invoke with arbitrary `donationId`.

**After:** Added `requireServiceRoleCall` guard at entry point.

**Impact:** Now protected. Can only be invoked by:
- Cron jobs passing service role key
- Other edge functions with service role access
- Browser calls now rejected unless they include service role bearer token (not user-facing)

---

### 3. `poll-closing-scheduler` ✅

**Before:** No authentication guard at entry point.

**After:** Added `requireServiceRoleCall` guard before cron job logic.

**Impact:** Now requires service-role authentication. Cron execution is protected.

---

### 4. `create-csv-member-accounts` ✅

**Before:** Manual JWT auth check without consistent permission validation.

**After:** Migrated to `requireAuthorizedAdmin` helper with `canManageMembers` permission.

**Import added:**
```typescript
import { canManageMembers, json, requireAuthorizedAdmin } from '../_shared/admin-auth.ts'
```

**Authorization call:**
```typescript
const authz = await requireAuthorizedAdmin(req, supabaseAdmin, canManageMembers)
if (!authz.ok) return authz.response
```

**Impact:** Now uses centralized admin role/permission checking. Consistent with other admin functions.

---

## Already Protected (Verified)

The following functions were already using proper authentication:

- `activity-digest` — Uses `requireServiceRoleCall` ✓
- `broadcast-dispatcher` — Uses `requireServiceRoleCall` ✓
- `notify-leads` — Uses `requireServiceRoleCall` ✓
- `security-digest` — Uses `requireServiceRoleCall` ✓
- `send-push-notification` — Uses `requireServiceRoleCall` ✓
- `send-poll-notification` — Uses `requireServiceRoleCall` ✓
- `newsletter-scheduler` — Manual bearer token check ✓
- `sync-activity-to-sheets` — Uses `requireServiceRoleCall` ✓

---

## Audit Status

| Finding ID | Function | Status | Remediation |
|---|---|---|---|
| `donation-receipt-backfill-missing-authz` | `backfill-donation-receipts` | ✅ Remediated | `requireServiceRoleCall` guard added |
| `donation-receipt-sender-missing-authz` | `send-donation-receipt` | ✅ Remediated | `requireServiceRoleCall` guard added |
| `poll-closing-scheduler-missing-authz` | `poll-closing-scheduler` | ✅ Remediated | `requireServiceRoleCall` guard added |
| `admin-bulk-account-provisioning-role-gap` | `create-csv-member-accounts` | ✅ Remediated | Migrated to `requireAuthorizedAdmin` helper |

---

## Testing Recommendations

1. **Unit test:** Verify `requireServiceRoleCall` rejects requests without Authorization header
2. **Integration test:** Verify cron jobs can still invoke protected functions with service role key
3. **Browser test:** Verify browser-side calls to `send-donation-receipt` are now rejected (calls should go through internal edge-function-to-edge-function invocation instead)
4. **Admin test:** Verify `create-csv-member-accounts` accepts admins with `can_manage_members` permission

---

## Deployment Notes

- No database schema changes required
- No environment variable changes required
- Service-role key already exists in Supabase project settings
- Existing cron jobs will continue to work (they pass service role key)
- Browser-side invocations of previously unguarded functions will now fail with `401` — this is intentional hardening

---

## Related Files

- `supabase/functions/_shared/admin-auth.ts` — Centralized auth helpers
- `docs/security_checks/report.md` — Full security audit details
- `docs/security_checks/reviewed_surfaces.md` — Comprehensive surface review
