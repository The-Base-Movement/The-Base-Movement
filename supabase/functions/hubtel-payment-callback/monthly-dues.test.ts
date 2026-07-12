import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { extractCallbackGhsAmount, monthlyDuesCallbackDecision } from './index.ts'

Deno.test('unmatched references are not handled as monthly dues', () => {
  assertEquals(monthlyDuesCallbackDecision(null), null)
  assertEquals(monthlyDuesCallbackDecision({ matched: false, already_final: false }), null)
})

Deno.test('duplicate callbacks are idempotent', () => {
  const decision = monthlyDuesCallbackDecision({
    matched: true,
    already_final: true,
    status: 'paid',
  })
  assertEquals(decision, { handled: true, already: true, alert: false })
})

Deno.test('mismatched settlement amounts are rejected and alerted', () => {
  const decision = monthlyDuesCallbackDecision({
    matched: true,
    already_final: false,
    amount_mismatch: true,
    status: 'due',
  })
  assertEquals(decision, { handled: true, already: false, alert: true })
})

Deno.test('successful transitions are handled without alerts', () => {
  const decision = monthlyDuesCallbackDecision({
    matched: true,
    already_final: false,
    status: 'paid',
  })
  assertEquals(decision, { handled: true, already: false, alert: false })
})

Deno.test('extracts the settled GHS amount from initiation metadata first', () => {
  assertEquals(extractCallbackGhsAmount({ metadata: { ghsAmount: 50 }, Amount: 4.25 }), 50)
  assertEquals(
    extractCallbackGhsAmount({ Data: { Metadata: { ghsAmount: '50' } }, Amount: 4.25 }),
    50
  )
})

Deno.test('falls back to the callback amount and tolerates junk', () => {
  assertEquals(extractCallbackGhsAmount({ Amount: '50.00' }), 50)
  assertEquals(extractCallbackGhsAmount({ Amount: 'abc' }), null)
  assertEquals(extractCallbackGhsAmount({}), null)
})
