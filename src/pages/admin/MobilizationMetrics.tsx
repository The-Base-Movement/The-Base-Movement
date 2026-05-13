import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import type { ChapterLeaderboard, Achievement, MovementPulse } from '@/types/admin'
import { toast } from 'sonner'
import MobilizationLeaderboardCard from '@/components/admin/MobilizationLeaderboardCard'

export default function MobilizationMetrics() {
  const [leaderboard, setLeaderboard] = useState<ChapterLeaderboard[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [pulse, setPulse] = useState<MovementPulse | null>(null)
  const [loading, setLoading] = useState(true)
  const [regionFilter, setRegionFilter] = useState('All')
  const [isFilterVisible, setIsFilterVisible] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [leaderboardData, achievementsData, pulseData] = await Promise.all([
          adminService.getRegionalLeaderboard(),
          adminService.getAchievements(),
          adminService.getMovementPulse()
        ])
        setLeaderboard(leaderboardData)
        setAchievements(achievementsData)
        setPulse(pulseData)
      } catch (error) {
        console.error('[METRICS] Failed to synchronize mobilization operational metrics:', error)
        toast.error('Failed to synchronize mobilization operational metrics.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleExport = () => {
    if (!leaderboard.length) {
      toast.error('No data available to export.')
      return
    }
    
    const headers = ['Rank', 'Chapter', 'Region', 'Members', 'Badges', 'Impact Points']
    const csvContent = [
      headers.join(','),
      ...leaderboard.map((entry, index) => [
        index + 1,
        `"${entry.chapter}"`,
        `"${entry.region}"`,
        entry.total_patriots,
        entry.achievements_unlocked,
        entry.total_mobilization_points
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `mobilization_metrics_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Tactical metrics exported successfully.')
  }

  const regions = ['All', ...new Set(leaderboard.map(e => e.region?.trim()).filter(Boolean).sort())]
  
  const filteredLeaderboard = regionFilter === 'All' 
    ? leaderboard 
    : leaderboard.filter(e => e.region === regionFilter)

  if (loading) {
    return (
      <div className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'hsl(var(--border))', display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }}>analytics</span>
          <p style={{ margin: 0, fontSize: 11, fontFamily: "'Public Sans'", fontWeight: 700, color: 'hsl(var(--on-surface-muted))' }}>Synchronizing mobilization metrics…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="main animate-in fade-in duration-500">
      
      {/* Top section */}
      <div className="top">
        <div>
          <div className="crumbs">Admin · Intelligence · Mobilization metrics</div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'hsl(var(--on-surface))' }}>trophy</span>
            Mobilization metrics
          </h2>
        </div>
        <div className="actions">
          <button 
            className={`btn btn-sm ${isFilterVisible ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setIsFilterVisible(!isFilterVisible)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>filter_list</span>
            {isFilterVisible ? 'Hide Filters' : 'Filter'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleExport}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>download</span>Export
          </button>
        </div>
      </div>

      {isFilterVisible && (
        <div style={{ 
          marginBottom: 20, padding: '12px 16px', background: 'hsl(var(--container-low))', 
          border: '1px solid hsl(var(--border))', borderRadius: 4, display: 'flex', gap: 12, alignItems: 'center' 
        }} className="animate-in slide-in-from-top-2">
          <span style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--on-surface-muted))', textTransform: 'uppercase' }}>Region Filter:</span>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1 }}>
            {regions.map(r => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: regionFilter === r ? 'hsl(var(--on-surface))' : 'transparent',
                  color: regionFilter === r ? '#fff' : 'hsl(var(--on-surface))',
                  border: `1px solid ${regionFilter === r ? 'hsl(var(--on-surface))' : 'hsl(var(--border))'}`,
                  cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      <p style={{ margin: '-8px 0 24px', fontSize: 12.5, color: 'hsl(var(--on-surface-muted))', maxWidth: 700, lineHeight: 1.5 }}>
        Performance tracking and impact analytics for regional chapters across the movement's jurisdictional boundaries.
      </p>

      {/* KPI strip */}
      <div className="kpis">
        <div className="kpi gr">
          <div className="l">Impact Points</div>
          <div className="v tnum font-extrabold">{pulse?.totalMobilizationPoints?.toLocaleString() || '0'}</div>
          <div className="d">Total performance score</div>
        </div>
        <div className="kpi k">
          <div className="l">Active Chapters</div>
          <div className="v tnum font-extrabold">{pulse?.activeChapters || '0'}</div>
          <div className="d">Verified chapters</div>
        </div>
        <div className="kpi g">
          <div className="l">Top Region</div>
          <div className="v tnum font-extrabold" style={{ fontSize: 18 }}>{pulse?.topPerformingRegion || 'N/A'}</div>
          <div className="d">Highest performing area</div>
        </div>
        <div className="kpi r">
          <div className="l">Growth Rate</div>
          <div className="v tnum font-extrabold">{pulse?.nationalGrowth || 0}%</div>
          <div className="d">Quarterly increase</div>
        </div>
      </div>

      <div className="twocol" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
        
        {/* Leaderboard panel */}
        <div className="panel">
          <div className="ph">
            <div>
              <h3>Regional power rankings</h3>
              <div className="meta">Aggregated mobilization points</div>
            </div>
            <span className="material-symbols-outlined" style={{ color: 'hsl(var(--on-surface-muted))', fontSize: 20 }}>trending_up</span>
          </div>

          {/* Desktop Table */}
          <div className="desktop-only">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Rank</th>
                  <th>Chapter / region</th>
                  <th style={{ textAlign: 'center' }}>Members</th>
                  <th style={{ textAlign: 'center' }}>Badges</th>
                  <th style={{ textAlign: 'right' }}>Impact points</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--on-surface-muted))', fontWeight: 700 }}>
                      No regional mobilization data for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((entry, index) => (
                    <tr key={entry.chapter}>
                      <td>
                        <div style={{ 
                          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          borderRadius: '50%', fontSize: 12, fontWeight: 800,
                          background: index === 0 ? 'hsl(var(--accent))' : index === 1 ? 'hsl(var(--container-low))' : 'transparent',
                          color: index === 0 ? '#fff' : 'inherit',
                          border: index > 1 ? '1px solid hsl(var(--border))' : 'none'
                        }}>
                          {index + 1}
                        </div>
                      </td>
                      <td>
                        <div className="who">
                          <div>
                            <b>{entry.chapter}</b>
                            <span>{entry.region}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="pill pill-mute">{entry.total_patriots}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="pill pill-warn">{entry.achievements_unlocked}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="reg">{entry.total_mobilization_points.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="mobile-only">
            {filteredLeaderboard.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--on-surface-muted))', fontWeight: 700 }}>
                No regional data found.
              </div>
            ) : (
              filteredLeaderboard.map((entry, index) => (
                <MobilizationLeaderboardCard key={entry.chapter} entry={entry} index={index} />
              ))
            )}
          </div>
        </div>

        {/* Right column: Milestones & Pulse */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Milestones panel */}
          <div className="panel">
            <div className="ph">
              <div>
                <h3>Available milestones</h3>
                <div className="meta">Recognition badges</div>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'hsl(var(--accent))', fontSize: 20 }}>award_star</span>
            </div>
            <div style={{ padding: 18 }}>
              {achievements.map((achievement) => (
                <div key={achievement.id} style={{ 
                  padding: '12px 14px', background: 'hsl(var(--container-low))', borderRadius: 4, 
                  marginBottom: 10, borderLeft: '3px solid hsl(var(--accent))'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <b style={{ fontSize: 13, fontFamily: "'Public Sans'", fontWeight: 800 }}>{achievement.name}</b>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--accent))' }}>+{achievement.points_awarded}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.4 }}>{achievement.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pulse panel */}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'hsl(var(--on-surface-muted))', letterSpacing: '.05em' }}>Movement velocity</h3>
              <span className="material-symbols-outlined" style={{ color: 'hsl(var(--accent))', fontSize: 18 }}>bolt</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
               <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>Mobilization efficiency</span>
                  <span className="tnum" style={{ fontSize: 13, fontWeight: 800 }}>87%</span>
                </div>
                <div style={{ height: 6, background: 'hsl(var(--border))', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'hsl(var(--on-surface))', width: '87%' }} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>Recruitment conversion</span>
                  <span className="tnum" style={{ fontSize: 13, fontWeight: 800 }}>62%</span>
                </div>
                <div style={{ height: 6, background: 'hsl(var(--border))', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'hsl(var(--on-surface))', width: '62%' }} />
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 14, marginTop: 14, textAlign: 'center' }}>
               <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: 'hsl(var(--on-surface-muted))', lineHeight: 1.4 }}>
                 Currently tracking activity across {pulse?.activeChapters || 0} active chapters and {leaderboard.length} regions.
               </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
