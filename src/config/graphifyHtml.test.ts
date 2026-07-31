import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('graphify static export location', () => {
  it('keeps graphify out of the public production tree', () => {
    const publicFile = path.resolve(process.cwd(), 'public/graphify/graph.html')
    const docsFile = path.resolve(process.cwd(), 'docs/graphify-site/graph.html')

    expect(fs.existsSync(publicFile)).toBe(false)
    expect(fs.existsSync(docsFile)).toBe(true)
  })
})
