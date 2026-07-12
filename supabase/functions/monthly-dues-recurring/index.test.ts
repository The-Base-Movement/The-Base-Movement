import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  buildHubtelAuthHeader,
  buildRecurringInvoicePayload,
  callHubtelRecurring,
  mapRecurringCancelResponse,
  mapRecurringCreateResponse,
  mapRecurringVerifyResponse,
  nextStatusAfterCancel,
} from './index.ts'

const config = {
  baseUrl: 'https://rmp.hubtel.com/api',
  clientId: 'id-1',
  clientSecret: 'secret-1',
  accountNumber: 'ACC-1',
}

Deno.test('authenticates with Hubtel basic credentials', () => {
  assertEquals(buildHubtelAuthHeader('id-1', 'secret-1'), `Basic ${btoa('id-1:secret-1')}`)
})

Deno.test('create payload carries the monthly schedule, amount, and signed callback', () => {
  const payload = buildRecurringInvoicePayload({
    amountGhs: 50,
    dueDay: 28,
    memberName: 'Jane Patriot',
    memberPhone: '+233241234567',
    enrollmentId: 'enr-1',
    callbackUrl:
      'https://x.supabase.co/functions/v1/monthly-dues-recurring-callback?ref=enr-1&sig=abc',
    accountNumber: 'ACC-1',
  })

  assertEquals(payload.totalAmount, 50)
  assertEquals(payload.currency, 'GHS')
  assertEquals(payload.clientReference, 'enr-1')
  assertEquals(payload.recurring.frequency, 'monthly')
  assertEquals(payload.recurring.dayOfMonth, 28)
  assertEquals(payload.callbackUrl.includes('sig=abc'), true)
  assertEquals(payload.merchantAccountNumber, 'ACC-1')
})

Deno.test('requests hit the configured base URL with auth headers', async () => {
  let seenUrl = ''
  let seenAuth = ''
  let seenMethod = ''
  const fetchImpl = (url: string, init?: RequestInit) => {
    seenUrl = url
    seenMethod = init?.method ?? 'GET'
    seenAuth = (init?.headers as Record<string, string>)?.Authorization ?? ''
    return Promise.resolve(
      new Response(JSON.stringify({ ResponseCode: '0000', Data: { invoiceId: 'inv-9' } }), {
        status: 200,
      })
    )
  }

  const result = await callHubtelRecurring(fetchImpl, config, '/invoices', 'POST', { a: 1 })
  assertEquals(seenUrl, 'https://rmp.hubtel.com/api/invoices')
  assertEquals(seenMethod, 'POST')
  assertEquals(seenAuth, buildHubtelAuthHeader('id-1', 'secret-1'))
  assertEquals(result.ok, true)
  assertEquals(mapRecurringCreateResponse(result.payload).invoiceId, 'inv-9')
})

Deno.test('provider errors are preserved, never treated as success', async () => {
  const fetchImpl = () =>
    Promise.resolve(
      new Response(JSON.stringify({ ResponseCode: '4000', Message: 'Invalid account' }), {
        status: 400,
      })
    )

  const result = await callHubtelRecurring(fetchImpl, config, '/invoices', 'POST', {})
  assertEquals(result.ok, false)
  assertEquals(result.status, 400)
  assertEquals((result.payload as { Message?: string }).Message, 'Invalid account')
  assertEquals(mapRecurringCreateResponse(result.payload).invoiceId, null)
})

Deno.test('verify maps provider states onto activation', () => {
  assertEquals(mapRecurringVerifyResponse({ ResponseCode: '0000', Data: { status: 'Active' } }), {
    active: true,
    providerStatus: 'Active',
  })
  assertEquals(mapRecurringVerifyResponse({ ResponseCode: '0000', Data: { status: 'Pending' } }), {
    active: false,
    providerStatus: 'Pending',
  })
  assertEquals(mapRecurringVerifyResponse({ ResponseCode: '4040' }), {
    active: false,
    providerStatus: null,
  })
})

Deno.test('cancel maps provider confirmation only on success codes', () => {
  assertEquals(mapRecurringCancelResponse({ ResponseCode: '0000' }).cancelled, true)
  assertEquals(mapRecurringCancelResponse({ ResponseCode: '5000' }).cancelled, false)
  assertEquals(mapRecurringCancelResponse({}).cancelled, false)
})

Deno.test('failed cancellations stay pending and retryable', () => {
  assertEquals(nextStatusAfterCancel(true), 'opted_out')
  assertEquals(nextStatusAfterCancel(false), 'cancellation_pending')
})
