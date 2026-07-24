import { assertEquals } from 'jsr:@std/assert'
import {
  canManageDonations,
  canManageMembers,
  canManageNewsletters,
  canViewGuestDonationReceipts,
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
  assertEquals(canViewGuestDonationReceipts(founder), false)
})

Deno.test('limits guest receipts to finance officers and the movement manager', () => {
  assertEquals(canViewGuestDonationReceipts(arrayAdmin), true)
  assertEquals(
    canViewGuestDonationReceipts({ id: 'manager', role: 'MOVEMENT_MANAGER', permissions: [] }),
    true
  )
  assertEquals(canViewGuestDonationReceipts({ id: 'admin', role: 'ADMIN', permissions: [] }), false)
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
