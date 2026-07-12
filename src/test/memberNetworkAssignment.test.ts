import { describe, expect, it } from 'vitest'
import { normalizeMemberNetworkAssignment } from '@/lib/memberNetworkAssignment'

describe('member network assignment normalization', () => {
  it('keeps Ghana constituency and removes chapter', () => {
    expect(
      normalizeMemberNetworkAssignment('GHANA', {
        country: 'Ghana',
        region: 'Greater Accra',
        constituency: '  Ablekuma North  ',
        chapter: 'Accra Central',
      })
    ).toEqual({
      platform: 'GHANA',
      country: 'Ghana',
      region: 'Greater Accra',
      constituency: 'Ablekuma North',
      chapter: null,
    })
  })

  it('keeps Diaspora chapter and removes Ghana fields', () => {
    expect(
      normalizeMemberNetworkAssignment('DIASPORA', {
        country: 'Belgium',
        region: 'Greater Accra',
        constituency: 'Ablekuma North',
        chapter: ' Belgium Chapter ',
      })
    ).toEqual({
      platform: 'DIASPORA',
      country: 'Belgium',
      region: null,
      constituency: null,
      chapter: 'Belgium Chapter',
    })
  })

  it('normalizes blank assignments to null', () => {
    expect(
      normalizeMemberNetworkAssignment('GHANA', {
        country: '',
        region: '',
        constituency: ' ',
        chapter: '',
      })
    ).toEqual({
      platform: 'GHANA',
      country: 'Ghana',
      region: null,
      constituency: null,
      chapter: null,
    })
  })
})
