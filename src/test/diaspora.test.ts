import { describe, it, expect } from 'vitest'
import {
  diasporaName,
  shortDiasporaName,
  diasporaSlug,
  matchesChapterSlug,
  coordinatorDisplayName,
} from '@/lib/diaspora'

describe('diaspora naming', () => {
  it('formats legacy TBM names', () => {
    expect(diasporaName('TBM Belgium Chapter')).toBe('Base Diaspora — Belgium')
    expect(shortDiasporaName('TBM Belgium Chapter')).toBe('Belgium Diaspora')
  })

  it('passes through and shortens renamed names', () => {
    expect(diasporaName('Base Diaspora — Belgium')).toBe('Base Diaspora — Belgium')
    expect(shortDiasporaName('Base Diaspora — Belgium')).toBe('Belgium Diaspora')
  })

  it('resolves new and legacy slugs for both naming eras', () => {
    for (const stored of ['TBM Belgium Chapter', 'Base Diaspora — Belgium']) {
      expect(matchesChapterSlug(stored, 'base-diaspora-belgium')).toBe(true)
      expect(matchesChapterSlug(stored, 'tbm-belgium-chapter')).toBe(true)
      expect(matchesChapterSlug(stored, 'tbm-canada-chapter')).toBe(false)
    }
    expect(diasporaSlug('Base Diaspora — Belgium')).toBe('base-diaspora-belgium')
  })

  it('hides the Unassigned placeholder', () => {
    expect(coordinatorDisplayName('Unassigned')).toBe('Coordinator to be appointed')
    expect(coordinatorDisplayName(null)).toBe('Coordinator to be appointed')
    expect(coordinatorDisplayName('Pro Medias')).toBe('Pro Medias')
  })
})
