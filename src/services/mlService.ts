const ML_BASE = import.meta.env.VITE_ML_SERVICE_URL ?? 'http://localhost:8000'

async function fetchML<T>(path: string): Promise<T> {
  const res = await fetch(`${ML_BASE}${path}`)
  if (!res.ok) throw new Error(`ML service error: ${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface MLHealthStatus {
  status: string
  database: string
  version: string
}

export interface DonorScore {
  member_id: string
  reg_no: string
  full_name: string
  region: string | null
  constituency: string | null
  status: string
  score: number
  tier: 'High' | 'Medium' | 'Low'
  donation_count: number
  last_donation_date: string | null
  activity_events_30d: number
  recommended_action: string
}

export interface PropensityResponse {
  generated_at: string
  total_scored: number
  high_propensity: number
  medium_propensity: number
  low_propensity: number
  members: DonorScore[]
}

export interface RegionForecast {
  region: string
  current_members: number
  active_members: number
  new_members_30d: number
  new_members_prev_30d: number
  growth_rate_pct: number
  acceleration: number
  forecast_30d: number
  forecast_60d: number
  forecast_90d: number
  confidence: 'High' | 'Medium' | 'Low'
}

export interface ForecastResponse {
  generated_at: string
  total_regions: number
  national_total: number
  national_active: number
  fastest_growing_region: string
  regions: RegionForecast[]
}

export interface RegionSentiment {
  region: string
  sentiment_score: number
  sentiment_label: 'Strong' | 'Positive' | 'Neutral' | 'Concerning'
  active_ratio: number
  donation_participation_rate: number
  velocity_score: number
  trend: 'Rising' | 'Stable' | 'Falling'
  total_members: number
}

export interface SentimentResponse {
  generated_at: string
  national_sentiment: number
  most_positive_region: string
  most_negative_region: string
  regions: RegionSentiment[]
}

// ── API Methods ────────────────────────────────────────────────────────────

export const mlService = {
  health: () => fetchML<MLHealthStatus>('/health'),

  getDonorPropensity: () => fetchML<PropensityResponse>('/api/donor/propensity'),

  getMemberPropensity: (regNo: string) =>
    fetchML<DonorScore>(`/api/donor/propensity/${encodeURIComponent(regNo)}`),

  getMobilizationForecast: () => fetchML<ForecastResponse>('/api/mobilization/forecast'),

  getMobilizationSentiment: () => fetchML<SentimentResponse>('/api/mobilization/sentiment'),
}
