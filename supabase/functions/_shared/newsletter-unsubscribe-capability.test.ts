import { assertEquals, assertRejects } from 'std/testing/asserts.ts'

import {
  createNewsletterUnsubscribeToken,
  verifyNewsletterUnsubscribeToken,
} from './newsletter-unsubscribe-capability.ts'

const TEST_SECRET = 'test-newsletter-unsubscribe-secret'
const TEST_USER_ID = '4b1dbbd1-a4b8-4d65-8d6e-65bfdbe6a7d1'

Deno.test('newsletter unsubscribe capability accepts valid signed tokens', async () => {
  Deno.env.set('NEWSLETTER_UNSUBSCRIBE_SECRET', TEST_SECRET)

  const now = new Date('2026-06-18T12:00:00.000Z')
  const token = await createNewsletterUnsubscribeToken(TEST_USER_ID, now, 300)

  assertEquals(
    await verifyNewsletterUnsubscribeToken(token, new Date('2026-06-18T12:04:59.000Z')),
    TEST_USER_ID
  )
})

Deno.test('newsletter unsubscribe capability rejects forged reversible identifiers', async () => {
  Deno.env.set('NEWSLETTER_UNSUBSCRIBE_SECRET', TEST_SECRET)

  const forgedToken = btoa(TEST_USER_ID).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

  await assertRejects(() => verifyNewsletterUnsubscribeToken(forgedToken))
})

Deno.test('newsletter unsubscribe capability rejects expired tokens', async () => {
  Deno.env.set('NEWSLETTER_UNSUBSCRIBE_SECRET', TEST_SECRET)

  const issuedAt = new Date('2026-06-18T12:00:00.000Z')
  const token = await createNewsletterUnsubscribeToken(TEST_USER_ID, issuedAt, 60)

  await assertRejects(() =>
    verifyNewsletterUnsubscribeToken(token, new Date('2026-06-18T12:01:00.000Z'))
  )
})
