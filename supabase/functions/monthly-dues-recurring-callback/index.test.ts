import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { buildSignedHubtelCallbackUrl } from '../hubtel-payment-shared/callback-auth.ts'
import {
  mapRecurringCallback,
  recurringChargeDecision,
  verifyRecurringCallbackRequest,
} from './index.ts'

Deno.test('signed references are required and must match the callback body', async () => {
  const signed = await buildSignedHubtelCallbackUrl(
    'https://x.supabase.co/functions/v1/monthly-dues-recurring-callback',
    'enr-1',
    'test-secret'
  )

  const ok = await verifyRecurringCallbackRequest(signed, 'enr-1', 'test-secret')
  assertEquals(ok.ok, true)

  const wrongBody = await verifyRecurringCallbackRequest(signed, 'enr-2', 'test-secret')
  assertEquals(wrongBody.ok, false)

  const unsigned = await verifyRecurringCallbackRequest(
    'https://x.supabase.co/functions/v1/monthly-dues-recurring-callback',
    'enr-1',
    'test-secret'
  )
  assertEquals(unsigned.ok, false)
})

Deno.test('maps successful recurring charges with transaction and amount', () => {
  assertEquals(
    mapRecurringCallback({
      ResponseCode: '0000',
      Data: { TransactionId: 'txn-7', Amount: '50.00' },
    }),
    { success: true, transactionId: 'txn-7', amountGhs: 50 }
  )
})

Deno.test('maps failed charges without inventing identifiers', () => {
  assertEquals(mapRecurringCallback({ ResponseCode: '2001', Status: 'Failed' }), {
    success: false,
    transactionId: null,
    amountGhs: null,
  })
})

Deno.test('duplicate charge callbacks are acknowledged, not reapplied', () => {
  assertEquals(recurringChargeDecision({ matched: true, already_final: true, status: 'paid' }), {
    handled: true,
    already: true,
    alert: false,
  })
})

Deno.test('amount mismatches on recurring charges are alerted', () => {
  assertEquals(
    recurringChargeDecision({ matched: true, already_final: false, amount_mismatch: true }),
    { handled: true, already: false, alert: true }
  )
})

Deno.test('unmatched recurring references are rejected', () => {
  assertEquals(recurringChargeDecision({ matched: false, already_final: false }), null)
  assertEquals(recurringChargeDecision(null), null)
})
