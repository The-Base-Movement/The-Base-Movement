import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

function readVercelConfig() {
  const file = path.resolve(process.cwd(), 'vercel.json')
  return JSON.parse(fs.readFileSync(file, 'utf8')) as {
    headers: Array<{
      source: string
      headers: Array<{ key: string; value: string }>
    }>
  }
}

function getCspValue(source: string) {
  const config = readVercelConfig()
  const blocks = config.headers.filter((entry) => entry.source === source)
  expect(blocks.length, `Missing Vercel header block for ${source}`).toBeGreaterThan(0)
  const csp = blocks
    .flatMap((block) => block.headers)
    .find((header) => header.key === 'Content-Security-Policy')
  expect(csp, `Missing CSP header for ${source}`).toBeDefined()
  return csp?.value ?? ''
}

describe('vercel CSP policy', () => {
  it('does not allow inline scripts on public pages', () => {
    const csp = getCspValue('/((?!admin).*)')

    expect(csp).not.toContain(`script-src 'self' 'unsafe-inline'`)
    expect(csp).not.toContain(`'wasm-unsafe-eval'`)
  })

  it('does not allow inline scripts or wasm eval on admin routes', () => {
    const csp = getCspValue('/admin(.*)')

    expect(csp).not.toContain(`script-src 'self' 'unsafe-inline'`)
    expect(csp).not.toContain(`'wasm-unsafe-eval'`)
    expect(csp).not.toContain('unpkg.com')
  })
})
