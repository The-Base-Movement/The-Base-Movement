import { useState, useEffect } from 'react'
import { partyAffiliationService } from '@/services/partyAffiliationService'
import { politicalParties as defaultParties } from '@/components/admin/RegistrationForm.constants'

/**
 * Reusable hook that fetches dynamic Political Parties & CSOs from the database,
 * falling back to static default constants if offline. Automatically sorts them alphabetically (A-Z).
 */
export function usePoliticalParties(): string[] {
  const [parties, setParties] = useState<string[]>(defaultParties)

  useEffect(() => {
    let active = true
    partyAffiliationService
      .getParties()
      .then((records) => {
        if (!active || !records || records.length === 0) return

        const list = records.map((r) => r.full_label || (r.code ? `${r.name} — ${r.code}` : r.name))
        
        // Exclude 'Unspecified / Independent' if returned, then sort alphabetically (A-Z)
        const filteredList = list.filter((p) => p !== 'Unspecified / Independent')
        filteredList.sort((a, b) => a.localeCompare(b))

        setParties(filteredList)
      })
      .catch((err) => {
        console.warn('[usePoliticalParties] Failed to load dynamic parties from database, using defaults:', err)
      })

    return () => {
      active = false
    }
  }, [])

  return parties
}
