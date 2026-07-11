import { assertEquals } from 'jsr:@std/assert'
import { receiptOutcome } from './index.ts'

Deno.test('receipt is sent when either delivery channel succeeds', () => {
  assertEquals(receiptOutcome(true, false), 'sent')
  assertEquals(receiptOutcome(false, true), 'sent')
  assertEquals(receiptOutcome(true, true), 'sent')
  assertEquals(receiptOutcome(false, false), 'failed')
})
