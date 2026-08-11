export interface MovementEvent {
  id: string
  title: string
  category: 'Town Hall' | 'Mobilization Walk' | 'Job Workshop' | 'Community Action' | 'Diaspora Meetup'
  date: string // ISO date e.g. 2026-10-15T09:00:00+00:00
  locationName: string
  gpsAddress: string
  region: string
  description: string
  attendingCount: number
  organizer: string
  status: 'Planned' | 'In Progress' | 'Completed'
  imageUrl?: string
}

export const PUBLIC_EVENTS: MovementEvent[] = []
