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
