import type { Dispatch, SetStateAction } from 'react'
import type { HubActiveTab } from './types'

interface ConstituencyHubTabsProps {
  activeTab: HubActiveTab
  setActiveTab: Dispatch<SetStateAction<HubActiveTab>>
  membersCount: number
  donationsCount: number
  activitiesCount: number
  committeeCount: number
}

export function ConstituencyHubTabs({
  activeTab,
  setActiveTab,
  membersCount,
  donationsCount,
  activitiesCount,
  committeeCount,
}: ConstituencyHubTabsProps) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
      <button
        className={activeTab === 'members' ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
        onClick={() => setActiveTab('members')}
      >
        Members ({membersCount})
      </button>
      <button
        className={activeTab === 'donations' ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
        onClick={() => setActiveTab('donations')}
      >
        Donations ({donationsCount})
      </button>
      <button
        className={activeTab === 'activities' ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
        onClick={() => setActiveTab('activities')}
      >
        Activities ({activitiesCount})
      </button>
      <button
        className={activeTab === 'committee' ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
        onClick={() => setActiveTab('committee')}
      >
        Committee ({committeeCount})
      </button>
      <button
        className={activeTab === 'helpdesk' ? 'btn btn-active-tab' : 'btn btn-inactive-tab'}
        onClick={() => setActiveTab('helpdesk')}
      >
        Support Tickets
      </button>
    </div>
  )
}
