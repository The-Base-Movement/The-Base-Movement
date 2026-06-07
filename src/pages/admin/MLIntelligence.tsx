import { useEffect, useRef, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  mlService,
  type MLHealthStatus,
  type PropensityResponse,
  type ForecastResponse,
  type SentimentResponse,
} from '@/services/mlService'
import MLIntelligenceTabs, { type Tab } from '@/pages/admin/mlintelligence/MLIntelligenceTabs'
import StatusDot from '@/pages/admin/mlintelligence/StatusDot'
import LoadingPanel from '@/pages/admin/mlintelligence/LoadingPanel'
import ErrorPanel from '@/pages/admin/mlintelligence/ErrorPanel'
import DonorPropensityTab, {
  type DonorTierFilter,
} from '@/pages/admin/mlintelligence/DonorPropensityTab'
import ForecastTab from '@/pages/admin/mlintelligence/ForecastTab'
import SentimentTab from '@/pages/admin/mlintelligence/SentimentTab'

const PAGE_SIZE = 15

export default function MLIntelligence() {
  const [tab, setTab] = useState<Tab>('donor')
  const [health, setHealth] = useState<MLHealthStatus | null>(null)
  const [healthError, setHealthError] = useState(false)

  const [propensity, setPropensity] = useState<PropensityResponse | null>(null)
  const [propensityError, setPropensityError] = useState('')

  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [forecastError, setForecastError] = useState('')

  const [sentiment, setSentiment] = useState<SentimentResponse | null>(null)
  const [sentimentError, setSentimentError] = useState('')

  const startedRef = useRef<Set<Tab>>(new Set())
  const [donorSearch, setDonorSearch] = useState('')
  const [donorTierFilter, setDonorTierFilter] = useState<DonorTierFilter>('All')
  const [donorPage, setDonorPage] = useState(1)

  useEffect(() => {
    mlService
      .health()
      .then(setHealth)
      .catch(() => setHealthError(true))
  }, [])

  useEffect(() => {
    if (tab === 'donor' && !startedRef.current.has('donor')) {
      startedRef.current.add('donor')
      mlService
        .getDonorPropensity()
        .then(setPropensity)
        .catch((error: Error) => setPropensityError(error.message))
    }

    if (tab === 'forecast' && !startedRef.current.has('forecast')) {
      startedRef.current.add('forecast')
      mlService
        .getMobilizationForecast()
        .then(setForecast)
        .catch((error: Error) => setForecastError(error.message))
    }

    if (tab === 'sentiment' && !startedRef.current.has('sentiment')) {
      startedRef.current.add('sentiment')
      mlService
        .getMobilizationSentiment()
        .then(setSentiment)
        .catch((error: Error) => setSentimentError(error.message))
    }
  }, [tab])

  const filteredDonors = (propensity?.members ?? []).filter((member) => {
    const matchesTier = donorTierFilter === 'All' || member.tier === donorTierFilter
    const query = donorSearch.toLowerCase()
    const matchesSearch =
      !query ||
      member.full_name.toLowerCase().includes(query) ||
      member.reg_no.toLowerCase().includes(query) ||
      (member.region ?? '').toLowerCase().includes(query)

    return matchesTier && matchesSearch
  })

  const totalDonorPages = Math.max(1, Math.ceil(filteredDonors.length / PAGE_SIZE))
  const pagedDonors = filteredDonors.slice((donorPage - 1) * PAGE_SIZE, donorPage * PAGE_SIZE)

  const serviceOffline = healthError || (health && health.status !== 'ok')

  return (
    <div className="main">
      <AdminPageHeader
        title="ML Intelligence"
        description="Predictive analytics powered by the FastAPI microservice"
        icon="auto_awesome"
      />

      <div
        className="panel"
        style={{
          padding: '10px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <StatusDot status={health} />
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            fontWeight: 'var(--font-weight-medium, 500)',
            color: 'hsl(var(--on-surface))',
          }}
        >
          ML Service
        </span>
        {health && (
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            v{health.version} · DB {health.database}
          </span>
        )}
        {serviceOffline && (
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              color: 'hsl(var(--destructive))',
            }}
          >
            Service offline — start the FastAPI server locally or on your VPS (see
            docs/audits/ml-microservice-audit-2026-05-31.md)
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 10,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          {import.meta.env.VITE_ML_SERVICE_URL ?? 'http://localhost:8000'}
        </span>
      </div>

      <MLIntelligenceTabs
        tab={tab}
        onChange={(nextTab) => {
          setTab(nextTab)
          setDonorPage(1)
        }}
      />

      {tab === 'donor' && (
        <>
          {!propensity && !propensityError && <LoadingPanel label="Scoring members…" />}
          {propensityError && <ErrorPanel message={propensityError} />}
          {propensity && (
            <DonorPropensityTab
              propensity={propensity}
              donorSearch={donorSearch}
              donorTierFilter={donorTierFilter}
              donorPage={donorPage}
              totalDonorPages={totalDonorPages}
              filteredDonorsCount={filteredDonors.length}
              pagedDonors={pagedDonors}
              onSearch={(value) => {
                setDonorSearch(value)
                setDonorPage(1)
              }}
              onTierFilterChange={(value) => {
                setDonorTierFilter(value)
                setDonorPage(1)
              }}
              onPageChange={setDonorPage}
            />
          )}
        </>
      )}

      {tab === 'forecast' && (
        <>
          {!forecast && !forecastError && <LoadingPanel label="Computing forecasts…" />}
          {forecastError && <ErrorPanel message={forecastError} />}
          {forecast && <ForecastTab forecast={forecast} />}
        </>
      )}

      {tab === 'sentiment' && (
        <>
          {!sentiment && !sentimentError && <LoadingPanel label="Analysing sentiment…" />}
          {sentimentError && <ErrorPanel message={sentimentError} />}
          {sentiment && <SentimentTab sentiment={sentiment} />}
        </>
      )}
    </div>
  )
}
