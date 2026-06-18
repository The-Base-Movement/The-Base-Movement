import {
  buildSignedHubtelCallbackUrl,
  signHubtelCallbackReference,
  verifyHubtelCallbackSignature,
} from './callback-auth.ts'

Deno.test('buildSignedHubtelCallbackUrl appends reference and signature', async () => {
  const url = await buildSignedHubtelCallbackUrl(
    'https://example.com/functions/v1/hubtel-payment-callback',
    'donation-123',
    'test-secret'
  )

  const parsed = new URL(url)
  const signature = parsed.searchParams.get('sig')

  if (parsed.searchParams.get('ref') !== 'donation-123') {
    throw new Error('Expected signed reference query param')
  }

  if (!signature) {
    throw new Error('Expected callback signature query param')
  }

  const expected = await signHubtelCallbackReference('donation-123', 'test-secret')
  if (signature !== expected) {
    throw new Error('Expected deterministic callback signature')
  }
})

Deno.test('verifyHubtelCallbackSignature accepts a matching signed reference', async () => {
  const url = await buildSignedHubtelCallbackUrl(
    'https://example.com/functions/v1/hubtel-payment-callback',
    'order-456',
    'test-secret'
  )

  const result = await verifyHubtelCallbackSignature(url, 'order-456', 'test-secret')
  if (!result.ok) {
    throw new Error(`Expected callback verification to pass: ${result.reason}`)
  }
})

Deno.test('verifyHubtelCallbackSignature rejects mismatched references', async () => {
  const url = await buildSignedHubtelCallbackUrl(
    'https://example.com/functions/v1/hubtel-payment-callback',
    'order-456',
    'test-secret'
  )

  const result = await verifyHubtelCallbackSignature(url, 'other-reference', 'test-secret')
  if (result.ok || result.reason !== 'Signed reference does not match callback body') {
    throw new Error('Expected mismatched references to be rejected')
  }
})

Deno.test('verifyHubtelCallbackSignature rejects missing signatures', async () => {
  const result = await verifyHubtelCallbackSignature(
    'https://example.com/functions/v1/hubtel-payment-callback?ref=order-456',
    'order-456',
    'test-secret'
  )

  if (result.ok || result.reason !== 'Missing callback signature') {
    throw new Error('Expected missing signatures to be rejected')
  }
})
