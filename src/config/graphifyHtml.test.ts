import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('graph static export location', () => {
  // The export is a large local-only artifact and is no longer tracked in the
  // repo, so we only assert it never reappears in the production tree.
  it('keeps the graph export out of the public production tree', () => {
    const publicFile = path.resolve(process.cwd(), 'public/graphify/graph.html')

    expect(fs.existsSync(publicFile)).toBe(false)
  })
})
