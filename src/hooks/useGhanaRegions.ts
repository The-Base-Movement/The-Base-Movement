import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export const DEFAULT_GHANA_REGIONS = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

/**
 * Reusable hook that fetches the 16 administrative regions of Ghana from the database,
 * falling back to the official 16 regions if offline.
 */
export function useGhanaRegions(): string[] {
  const [regions, setRegions] = useState<string[]>(DEFAULT_GHANA_REGIONS)

  useEffect(() => {
    let active = true

    async function fetchRegions() {
      try {
        const { data, error } = await supabase
          .from('ghana_regions')
          .select('name')
          .order('name', { ascending: true })

        if (!active || error || !data || data.length === 0) return

        const fetchedNames = data.map((r: { name: string }) => r.name).filter(Boolean)
        if (fetchedNames.length > 0) {
          setRegions(fetchedNames)
        }
      } catch (err: unknown) {
        console.warn('[useGhanaRegions] Failed to load regions from database:', err)
      }
    }

    fetchRegions()

    return () => {
      active = false
    }
  }, [])

  return regions
}
