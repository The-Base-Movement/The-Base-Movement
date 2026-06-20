import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('leader security webhook identity policy', () => {
  it('sends the resolved leader name and never exposes the role label', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'supabase/functions/capture-admin-device/index.ts'),
      'utf8'
    )

    expect(source).toContain(".select('full_name')")
    expect(source).toContain("{ name: 'Leader', value: adminName")
    expect(source).not.toContain("{ name: 'Role'")
  })
})
