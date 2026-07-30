import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Region, Constituency } from '@/types/registration'

export interface RegistrationChapterOption {
  name: string
  country: string
}

export function useRegistrationData() {
  const [dbCountries, setDbCountries] = useState<string[]>([])
  const [dbCountryCodes, setDbCountryCodes] = useState<Record<string, string>>({})
  const [dbRegions, setDbRegions] = useState<Region[]>([])
  const [dbConstituencies, setDbConstituencies] = useState<Constituency[]>([])
  const [dbChapters, setDbChapters] = useState<string[]>([])
  const [dbChapterOptions, setDbChapterOptions] = useState<RegistrationChapterOption[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: countriesData } = await supabase
          .from('countries')
          .select('*')
          .order('name', { ascending: true })
        if (Array.isArray(countriesData)) {
          setDbCountries(countriesData.map((c) => c.name).filter((n) => n !== 'Ghana'))
          const codeMap: Record<string, string> = {}
          countriesData.forEach((c) => {
            if (c.dialing_code) codeMap[c.name] = c.dialing_code
          })
          setDbCountryCodes(codeMap)
        }

        const { data: regionsData } = await supabase
          .from('ghana_regions')
          .select('*')
          .order('name', { ascending: true })
        setDbRegions(Array.from(new Map((regionsData || []).map((r) => [r.name, r])).values()))

        const { data: conData } = await supabase
          .from('ghana_constituencies')
          .select('*')
          .order('name', { ascending: true })
        setDbConstituencies(
          Array.from(new Map((conData || []).map((c) => [`${c.region_id}-${c.name}`, c])).values())
        )

        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('name, country')
          .order('name', { ascending: true })
        const chapterOptions = (chaptersData || [])
          .filter((chapter) => typeof chapter.name === 'string' && typeof chapter.country === 'string')
          .map((chapter) => ({ name: chapter.name, country: chapter.country }))
        setDbChapterOptions(chapterOptions)
        setDbChapters(chapterOptions.map((chapter) => chapter.name))
      } catch (error) {
        console.error('Failed to fetch registration data:', error)
      }
    }
    fetchData()
  }, [])

  return {
    dbCountries,
    dbCountryCodes,
    dbRegions,
    dbConstituencies,
    dbChapters,
    dbChapterOptions,
  }
}
