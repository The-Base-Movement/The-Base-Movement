const TOKEN_VERSION = 1
const TOKEN_AUDIENCE = 'newsletter-unsubscribe'
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 365
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
let signingKeyCache: { secret: string; key: Promise<CryptoKey> } | null = null

interface UnsubscribeCapabilityPayload {
  v: number
  aud: string
  sub: string
  exp: number
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(input: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(input)) throw new Error('invalid base64url payload')

  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function getCapabilitySecret(): string {
  const secret =
    Deno.env.get('NEWSLETTER_UNSUBSCRIBE_SECRET') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!secret) throw new Error('newsletter unsubscribe capability secret is not configured')
  return secret
}

async function importSigningKey(secret: string): Promise<CryptoKey> {
  if (!signingKeyCache || signingKeyCache.secret !== secret) {
    signingKeyCache = {
      secret,
      key: crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      ),
    }
  }

  return signingKeyCache.key
}

async function signPayload(payloadSegment: string, secret: string): Promise<string> {
  const key = await importSigningKey(secret)
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadSegment))
  )
  return base64UrlEncode(signature)
}

async function verifySignature(
  payloadSegment: string,
  signatureSegment: string,
  secret: string
): Promise<boolean> {
  const key = await importSigningKey(secret)
  return crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecode(signatureSegment),
    new TextEncoder().encode(payloadSegment)
  )
}

function parsePayload(payloadSegment: string): UnsubscribeCapabilityPayload {
  const payloadText = new TextDecoder().decode(base64UrlDecode(payloadSegment))
  const payload = JSON.parse(payloadText) as Partial<UnsubscribeCapabilityPayload>

  if (
    payload.v !== TOKEN_VERSION ||
    payload.aud !== TOKEN_AUDIENCE ||
    typeof payload.sub !== 'string' ||
    !UUID_PATTERN.test(payload.sub) ||
    !Number.isInteger(payload.exp)
  ) {
    throw new Error('invalid capability payload')
  }

  return payload as UnsubscribeCapabilityPayload
}

export async function createNewsletterUnsubscribeToken(
  userId: string,
  now = new Date(),
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<string> {
  if (!UUID_PATTERN.test(userId)) throw new Error('invalid user id for unsubscribe capability')
  if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error('invalid unsubscribe capability ttl')
  }

  const payload: UnsubscribeCapabilityPayload = {
    v: TOKEN_VERSION,
    aud: TOKEN_AUDIENCE,
    sub: userId,
    exp: Math.floor(now.getTime() / 1000) + ttlSeconds,
  }

  const payloadSegment = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const signatureSegment = await signPayload(payloadSegment, getCapabilitySecret())
  return `${payloadSegment}.${signatureSegment}`
}

export async function verifyNewsletterUnsubscribeToken(
  token: string,
  now = new Date()
): Promise<string> {
  if (typeof token !== 'string' || token.length < 32 || token.length > 512) {
    throw new Error('invalid unsubscribe capability token length')
  }

  const parts = token.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('invalid unsubscribe capability token shape')
  }

  const [payloadSegment, signatureSegment] = parts
  const payload = parsePayload(payloadSegment)
  const secret = getCapabilitySecret()

  if (!(await verifySignature(payloadSegment, signatureSegment, secret))) {
    throw new Error('invalid unsubscribe capability signature')
  }

  if (payload.exp <= Math.floor(now.getTime() / 1000)) {
    throw new Error('expired unsubscribe capability token')
  }

  return payload.sub
}
