import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Chapter } from '@/types/admin'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { adminService } from '@/services/adminService'
import { DiasporaCoverageTable } from './DiasporaCoverageTable'
import { DiasporaLeaderboardPanel } from './DiasporaLeaderboardPanel'

interface HubSelectorProps {
  chapters: Chapter[]
}

export function HubSelector({ chapters }: HubSelectorProps) {
  const [diasporaMembers, setDiasporaMembers] = useState<
    Array<{ country: string; status: string; joined_at: string | null }>
  >([])
  const [countryFlags, setCountryFlags] = useState<Record<string, string>>({})

  useEffect(() => {
    adminService.getDiasporaMembersSummary().then(setDiasporaMembers)
    adminService.getCountries().then((countries) => {
      const map: Record<string, string> = {}
      countries.forEach((c) => {
        if (c.flag_url) map[c.name] = c.flag_url
      })
      setCountryFlags(map)
    })
  }, [])

  const countryStats = useMemo(() => {
    const map = new Map<string, { chapters: number; members: number; verified: number }>()
    chapters.forEach((c) => {
      const key = c.country || c.city_or_region
      if (!key) return
      const entry = map.get(key) || { chapters: 0, members: 0, verified: 0 }
      entry.chapters += 1
      map.set(key, entry)
    })
    diasporaMembers.forEach((m) => {
      const entry = map.get(m.country) || { chapters: 0, members: 0, verified: 0 }
      entry.members += 1
      if (m.status === 'Active' || m.status === 'Approved') entry.verified += 1
      map.set(m.country, entry)
    })
    return Array.from(map.entries()).map(([country, v]) => ({ country, ...v }))
  }, [chapters, diasporaMembers])

  const leaderboard = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const counts = new Map<string, number>()
    diasporaMembers.forEach((m) => {
      if (!m.joined_at || new Date(m.joined_at) < cutoff) return
      counts.set(m.country, (counts.get(m.country) || 0) + 1)
    })
    return Array.from(counts.entries())
      .map(([country, newMembers]) => ({
        country,
        newMembers,
        flagUrl: countryFlags[country],
      }))
      .sort((a, b) => b.newMembers - a.newMembers)
      .slice(0, 10)
  }, [diasporaMembers, countryFlags])

  const totalNewMembers = useMemo(
    () => leaderboard.reduce((s, r) => s + r.newMembers, 0),
    [leaderboard]
  )

  return (
    <div className="main">
      <AdminPageHeader
        title="Diaspora Operations"
        icon="hub"
        description="Country-by-country coverage and mobilization across the diaspora network."
        actions={
          <Link to="/admin/chapters" className="btn btn-outline btn-sm">
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              location_on
            </span>
            Manage chapters
          </Link>
        }
      />

      <div className="chapters-charts-grid twocol" style={{ marginBottom: 20 }}>
        <DiasporaCoverageTable stats={countryStats} />
        <DiasporaLeaderboardPanel leaderboard={leaderboard} totalNewMembers={totalNewMembers} />
      </div>
    </div>
  )
}
