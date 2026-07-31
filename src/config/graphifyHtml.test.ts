import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('graphify static HTML', () => {
  it('loads vis-network locally instead of unpkg', () => {
    const file = path.resolve(process.cwd(), 'public/graphify/graph.html')
    const html = fs.readFileSync(file, 'utf8')

    expect(html).not.toContain('https://unpkg.com/vis-network')
    expect(html).toContain('./vis-network.min.js')
  })
})
