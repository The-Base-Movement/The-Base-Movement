const encoder = new TextEncoder()

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false

  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return diff === 0
}

function normalizeReference(reference: string) {
  const normalized = reference.trim()
  if (!normalized) throw new Error('Missing Hubtel client reference')
  return normalized
}

function getCallbackSecret(secret?: string) {
  const resolved = secret?.trim()
  if (resolved) return resolved

  // @ts-expect-error: Deno global
  const envSecret = Deno.env.get('HUBTEL_CALLBACK_SECRET')?.trim()
  if (envSecret) return envSecret

  // @ts-expect-error: Deno global
  const apiKey = Deno.env.get('HUBTEL_API_KEY')?.trim()
  if (apiKey) return apiKey

  throw new Error('Hubtel callback secret is not configured')
}

export async function signHubtelCallbackReference(reference: string, secret?: string) {
  const normalizedReference = normalizeReference(reference)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getCallbackSecret(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    keyMaterial,
    encoder.encode(normalizedReference)
  )
  return toBase64Url(new Uint8Array(signature))
}

export async function buildSignedHubtelCallbackUrl(
  callbackUrl: string,
  reference: string,
  secret?: string,
  dbReference?: string
) {
  const normalizedReference = normalizeReference(reference)
  const url = new URL(callbackUrl)
  if (dbReference?.trim()) {
    url.searchParams.set('dbRef', dbReference.trim())
  }
  url.searchParams.set('ref', normalizedReference)
  url.searchParams.set('sig', await signHubtelCallbackReference(normalizedReference, secret))
  return url.toString()
}

export async function verifyHubtelCallbackSignature(
  requestUrl: string,
  bodyReference: string,
  secret?: string
) {
  const normalizedReference = normalizeReference(bodyReference)
  const url = new URL(requestUrl)
  const signedReference = url.searchParams.get('ref')?.trim()
  const providedSignature = url.searchParams.get('sig')?.trim()

  if (!signedReference || !providedSignature) {
    return { ok: false, reason: 'Missing callback signature' } as const
  }

  if (signedReference !== normalizedReference) {
    return { ok: false, reason: 'Signed reference does not match callback body' } as const
  }

  const expectedSignature = await signHubtelCallbackReference(normalizedReference, secret)
  if (!timingSafeEqual(providedSignature, expectedSignature)) {
    return { ok: false, reason: 'Invalid callback signature' } as const
  }

  return { ok: true, reference: normalizedReference } as const
}
