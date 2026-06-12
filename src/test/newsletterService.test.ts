import { describe, it, expect } from 'vitest'
import { buildAudienceLabel, formatRecipientCount } from '../services/newsletterService'

describe('buildAudienceLabel', () => {
  it('returns "All members" when type is all', () => {
    expect(buildAudienceLabel('all', null)).toBe('All members')
  })

  it('returns "Region: Greater Accra" when type is region', () => {
    expect(buildAudienceLabel('region', 'Greater Accra')).toBe('Region: Greater Accra')
  })

  it('returns "Constituency: Ayawaso West" when type is constituency', () => {
    expect(buildAudienceLabel('constituency', 'Ayawaso West')).toBe('Constituency: Ayawaso West')
  })

  it('returns "Chapter: Lapaz 04" when type is chapter', () => {
    expect(buildAudienceLabel('chapter', 'Lapaz 04')).toBe('Chapter: Lapaz 04')
  })

  it('returns "Role: REGIONAL_MANAGER" when type is role', () => {
    expect(buildAudienceLabel('role', 'REGIONAL_MANAGER')).toBe('Role: REGIONAL_MANAGER')
  })
})

describe('formatRecipientCount', () => {
  it('returns "0 recipients" for zero', () => {
    expect(formatRecipientCount(0)).toBe('0 recipients')
  })

  it('returns "1 recipient" for one', () => {
    expect(formatRecipientCount(1)).toBe('1 recipient')
  })

  it('returns "42 recipients" for many', () => {
    expect(formatRecipientCount(42)).toBe('42 recipients')
  })
})
