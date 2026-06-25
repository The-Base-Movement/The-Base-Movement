import type { AudienceFilter } from '@/services/newsletterService'

export interface SimpleSlot {
  id: string
  type: 'simple'
  filter: AudienceFilter
}

export interface ConstituencySlot {
  id: string
  type: 'constituency'
  regionFilter: string | null
  search: string
  selected: string[]
}

export interface ChapterSlot {
  id: string
  type: 'chapter'
  search: string
  selected: string[]
}

export type FilterSlot = SimpleSlot | ConstituencySlot | ChapterSlot

export interface RegionsData {
  regions: string[]
  byRegion: Record<string, string[]>
  allConstituencies: string[]
}
