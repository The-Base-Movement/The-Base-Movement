export interface Entry {
  id: string
  chapter: string
  amount: number
  description: string
  category: string
  timestamp: string
}

export interface FormState {
  chapter: string
  amount: string
  description: string
  category: string
  timestamp: string
}

export const CATEGORIES = [
  'Printing',
  'Transport',
  'Events',
  'Supplies',
  'Administration',
  'Canvassing',
  'Other',
]
