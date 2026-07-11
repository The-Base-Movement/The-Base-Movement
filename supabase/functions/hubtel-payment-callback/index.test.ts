import { assertEquals } from 'jsr:@std/assert'
import { donationCallbackResponse } from './index.ts'

Deno.test('maps donation callback RPC results', () => {
  assertEquals(donationCallbackResponse({ matched: false, already_final: false }), null)
  assertEquals(donationCallbackResponse({ matched: true, already_final: false }), {
    success: true,
    already: false,
  })
  assertEquals(donationCallbackResponse({ matched: true, already_final: true }), {
    success: true,
    already: true,
  })
})
