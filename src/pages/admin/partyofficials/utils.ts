export interface PartyOfficial {
  id: string
  name: string
  role: string
  tier: string
  region?: string
  bio?: string
  avatar_url?: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  linkedin_url?: string
  email?: string
  order_index: number
}

export interface PartyTier {
  id: string
  name: string
  title: string
  description: string
  order_index: number
}

export const inputSt: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--container-low))',
  outline: 'none',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 700,
  fontSize: 12,
  borderRadius: 4,
  boxSizing: 'border-box',
  color: 'hsl(var(--on-surface))',
}
