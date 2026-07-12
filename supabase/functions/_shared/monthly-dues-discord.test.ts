import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import {
  buildMonthlyDuesDiscordMessage,
  sendMonthlyDuesDiscordAlert,
  type MonthlyDuesDiscordEvent,
} from './monthly-dues-discord.ts'

const paymentEvent: MonthlyDuesDiscordEvent = {
  type: 'payment_success',
  reference: '123e4567-e89b-12d3-a456-426614174000',
  month: '2026-02-01',
  amountGhs: 50,
  currency: 'GHS',
  mode: 'manual',
}

Deno.test('messages carry only allowed operational fields', () => {
  const message = buildMonthlyDuesDiscordMessage(paymentEvent, 'https://admin.example/finance')
  const serialized = JSON.stringify(message)

  assertStringIncludes(serialized, '123E4567') // shortened operational reference
  assertEquals(serialized.includes('123e4567-e89b-12d3-a456-426614174000'), false) // never the full id
  assertStringIncludes(serialized, '2026-02-01')
  assertStringIncludes(serialized, '50.00')
  assertStringIncludes(serialized, 'GHS')
  assertStringIncludes(serialized, 'https://admin.example/finance')
})

Deno.test('unexpected event properties are never serialized', () => {
  const dirty = {
    ...paymentEvent,
    email: 'jane@example.com',
    phone_number: '+233241234567',
    national_id: 'GHA-123456789-0',
    consent: { email_enabled: true },
    provider_response: { secret: 'raw' },
  } as unknown as MonthlyDuesDiscordEvent

  const serialized = JSON.stringify(buildMonthlyDuesDiscordMessage(dirty, null))
  assertEquals(serialized.includes('jane@example.com'), false)
  assertEquals(serialized.includes('+233241234567'), false)
  assertEquals(serialized.includes('GHA-123456789-0'), false)
  assertEquals(serialized.includes('email_enabled'), false)
  assertEquals(serialized.includes('raw'), false)
})

Deno.test('reminder summaries carry counts only', () => {
  const serialized = JSON.stringify(
    buildMonthlyDuesDiscordMessage(
      { type: 'reminder_summary', sent: 12, failed: 1, skipped: 3 },
      null
    )
  )
  assertStringIncludes(serialized, '12')
  assertStringIncludes(serialized, 'Reminder')
})

Deno.test('missing webhook secret means not sent, never an error', async () => {
  const result = await sendMonthlyDuesDiscordAlert(paymentEvent, {
    webhookUrl: '',
    fetchImpl: () => Promise.reject(new Error('must not be called')),
  })
  assertEquals(result, { sent: false })
})

Deno.test('discord failures are swallowed and reported as unsent', async () => {
  const rejected = await sendMonthlyDuesDiscordAlert(paymentEvent, {
    webhookUrl: 'https://discord.example/webhook',
    fetchImpl: () => Promise.reject(new Error('network down')),
  })
  assertEquals(rejected, { sent: false })

  const badStatus = await sendMonthlyDuesDiscordAlert(paymentEvent, {
    webhookUrl: 'https://discord.example/webhook',
    fetchImpl: () => Promise.resolve(new Response('nope', { status: 500 })),
  })
  assertEquals(badStatus, { sent: false })
})

Deno.test('successful sends post the redacted embed to the webhook', async () => {
  let seenUrl = ''
  let seenBody = ''
  const result = await sendMonthlyDuesDiscordAlert(paymentEvent, {
    webhookUrl: 'https://discord.example/webhook',
    adminLink: 'https://admin.example/finance',
    fetchImpl: (url, init) => {
      seenUrl = String(url)
      seenBody = String(init?.body ?? '')
      return Promise.resolve(new Response(null, { status: 204 }))
    },
  })
  assertEquals(result, { sent: true })
  assertEquals(seenUrl, 'https://discord.example/webhook')
  assertStringIncludes(seenBody, '123E4567')
  assertEquals(seenBody.includes('123e4567-e89b-12d3-a456-426614174000'), false)
})
