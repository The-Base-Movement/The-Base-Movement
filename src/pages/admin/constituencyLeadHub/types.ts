export type UserOption = {
  id: string
  full_name: string
  avatar_url?: string
}

export type HubActiveTab = 'members' | 'donations' | 'activities' | 'committee' | 'helpdesk'

export type Modal = 'add-activity' | 'assign-leader' | 'assign-committee' | null
