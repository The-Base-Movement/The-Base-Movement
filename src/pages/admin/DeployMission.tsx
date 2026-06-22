/**
 * Deploy Canvassing Mission Component
 * -------------------------------------------------------------
 * Form orchestrator to configure, schedule, and launch new field canvassing
 * and mobilization campaigns in specific regions and constituencies.
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import type { CanvassingCampaign } from '@/types/admin'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'

// Subcomponents
import { DeployMissionForm } from './deploymission/DeployMissionForm'
import { TacticalGuidelinesSidebar } from './deploymission/TacticalGuidelinesSidebar'

// Primary DeployMission component managing campaign creation form state
export default function DeployMission() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([])
  const [constituencies, setConstituencies] = useState<
    { id: string; region_id: string; name: string }[]
  >([])
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedConstituency, setSelectedConstituency] = useState('')
  const [newCampaign, setNewCampaign] = useState<Partial<CanvassingCampaign>>(() => ({
    title: '',
    description: '',
    goal_contacts: 100,
    status: 'ACTIVE',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }))

  const filteredConstituencies = useMemo(() => {
    if (selectedRegion) {
      const regionId = regions.find((r) => r.name === selectedRegion)?.id
      return regionId ? constituencies.filter((c) => c.region_id === regionId) : []
    }
    return []
  }, [selectedRegion, regions, constituencies])

  const [prevRegion, setPrevRegion] = useState(selectedRegion)
  if (selectedRegion !== prevRegion) {
    setPrevRegion(selectedRegion)
    setSelectedConstituency('')
  }

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

  // Submits the new campaign creation request to the administration services
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
      <AdminPageHeader
        title="Deploy mobilization mission"
        icon="sports_kabaddi"
        description="Launch and track strategic field directives and missions."
        actions={
          <Link to="/admin/ground-game">
            <button className="btn btn-outline btn-sm">
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                arrow_back
              </span>
              Cancel
            </button>
          </Link>
        }
      />

      {/* Two-column layout */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ flex: '3 1 400px', minWidth: 0 }}>
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
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <TacticalGuidelinesSidebar
            newCampaign={newCampaign}
            selectedRegion={selectedRegion}
            selectedConstituency={selectedConstituency}
          />
        </div>
      </div>
    </div>
  )
}
