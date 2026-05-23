import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { CanvassingCampaign } from '@/types/admin'
import { toast } from 'sonner'
import { BrandLine } from '@/components/ui/BrandLine'

// Subcomponents
import { DeployMissionForm } from './deploymission/DeployMissionForm'
import { TacticalGuidelinesSidebar } from './deploymission/TacticalGuidelinesSidebar'

export default function DeployMission() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [constituencies, setConstituencies] = useState<
    { id: string; region_id: string; name: string }[]
  >([])
  const [filteredConstituencies, setFilteredConstituencies] = useState<
    { id: string; region_id: string; name: string }[]
  >([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedConstituency, setSelectedConstituency] = useState('')
  const [newCampaign, setNewCampaign] = useState<Partial<CanvassingCampaign>>({
    title: '',
    description: '',
    goal_contacts: 100,
    status: 'ACTIVE',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  useEffect(() => {
    async function fetchData() {
      const [regionsData, constituenciesData] = await Promise.all([
        adminService.getGhanaRegions(),
        adminService.getGhanaConstituencies(),
      ])
      setRegions(regionsData)
      setConstituencies(constituenciesData)
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedRegion) {
      const regionId = regions.find((r) => r.name === selectedRegion)?.id
      setFilteredConstituencies(
        regionId ? constituencies.filter((c) => c.region_id === regionId) : []
      )
    } else {
      setFilteredConstituencies([])
    }
    setSelectedConstituency('')
  }, [selectedRegion, regions, constituencies])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCampaign.title || !selectedRegion || !selectedConstituency) {
      toast.error('Please complete all mandatory fields.')
      return
    }
    setLoading(true)
    try {
      const success = await adminService.createCanvassingCampaign({
        ...newCampaign,
        target_constituency: selectedConstituency,
        target_wards: [selectedRegion],
      })
      if (success) {
        toast.success('Mobilization mission deployed to the field.')
        navigate('/admin/ground-game')
      } else {
        toast.error('Failed to deploy mission.')
      }
    } catch {
      toast.error('Operational error during deployment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="main">
      {/* Top bar */}
      <div className="top" style={{ marginBottom: 20 }}>
        <div>
          <div className="crumbs" style={{ marginBottom: 6 }}>
            <Link to="/admin/dashboard" style={{ color: 'hsl(var(--primary))' }}>
              Admin
            </Link>
            {' · '}
            <Link to="/admin/ground-game" style={{ color: 'hsl(var(--primary))' }}>
              Constituency Operations
            </Link>
            {' · '}
            Deploy mission
          </div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: 'hsl(var(--destructive))' }}
            >
              sports_kabaddi
            </span>
            Deploy mobilization mission
          </h2>
          <BrandLine />
          <p
            style={{
              color: 'hsl(var(--on-surface-muted))',
              fontSize: 12.5,
              marginTop: 6,
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            Launch and track strategic field directives and missions.
          </p>
        </div>
        <div className="actions">
          <Link to="/admin/ground-game">
            <button className="btn btn-outline btn-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                arrow_back
              </span>
              Abort
            </button>
          </Link>
        </div>
      </div>

      {/* Two-column layout */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, alignItems: 'start' }}
      >
        <DeployMissionForm
          handleSubmit={handleSubmit}
          newCampaign={newCampaign}
          setNewCampaign={setNewCampaign}
          regions={regions}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          selectedConstituency={selectedConstituency}
          setSelectedConstituency={setSelectedConstituency}
          filteredConstituencies={filteredConstituencies}
          loading={loading}
        />

        <TacticalGuidelinesSidebar
          newCampaign={newCampaign}
          selectedRegion={selectedRegion}
          selectedConstituency={selectedConstituency}
        />
      </div>
    </div>
  )
}
