import { useEffect, useState } from 'react'
import { constituencyService } from '@/services/constituencyService'
import { chapterService } from '@/services/chapterService'
import { diasporaName } from '@/lib/diaspora'

const GHANA_REGIONS = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

const CHEVRON_SVG = `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%231a1a1a%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`

const selectStyle = {
  backgroundImage: CHEVRON_SVG,
  backgroundRepeat: 'no-repeat' as const,
  backgroundPosition: 'right .7rem top 50%',
  backgroundSize: '.65rem auto',
}

interface ContactFormProps {
  formData: {
    fullName: string
    email: string
    phone: string
    platform: string
    region: string
    constituency: string
    country: string
    chapter: string
    message: string
  }
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  onFieldChange: (field: string, value: string) => void
  handleSubmit: (e: React.FormEvent) => void
}

type ConstituencyName = { id: number; name: string; regionName?: string }
type ChapterLite = { id: string; name: string; country: string }

export function ContactForm({
  formData,
  handleChange,
  onFieldChange,
  handleSubmit,
}: ContactFormProps) {
  const [constituencies, setConstituencies] = useState<ConstituencyName[]>([])
  const [chapters, setChapters] = useState<ChapterLite[]>([])
  const [loadingConstituencies, setLoadingConstituencies] = useState(false)
  const [loadingChapters, setLoadingChapters] = useState(false)

  // Fetch constituencies once when Ghana is selected
  useEffect(() => {
    if (formData.platform !== 'GHANA') return
    if (constituencies.length > 0) return
    void (async () => {
      setLoadingConstituencies(true)
      const data = await constituencyService.listNames()
      setConstituencies(data)
      setLoadingConstituencies(false)
    })()
  }, [formData.platform, constituencies.length])

  // Fetch chapters once when Diaspora is selected
  useEffect(() => {
    if (formData.platform !== 'DIASPORA') return
    if (chapters.length > 0) return
    void (async () => {
      setLoadingChapters(true)
      const data = await chapterService.getChapters()
      setChapters(data.map((c) => ({ id: c.id, name: c.name, country: c.country })))
      setLoadingChapters(false)
    })()
  }, [formData.platform, chapters.length])

  // Derived lists
  const filteredConstituencies = formData.region
    ? constituencies.filter((c) => c.regionName === formData.region)
    : constituencies

  const diasporaCountries = [...new Set(chapters.map((c) => c.country))].sort()
  const filteredChapters = formData.country
    ? chapters.filter((c) => c.country === formData.country)
    : chapters

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFieldChange('region', e.target.value)
    onFieldChange('constituency', '') // reset constituency when region changes
  }

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFieldChange('country', e.target.value)
    onFieldChange('chapter', '') // reset chapter when country changes
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="fullName"
          className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
        >
          Full name <span className="text-[var(--brand-red)]">*</span>
        </label>
        <input
          name="name-c11fb5"
          id="fullName"
          type="text"
          autoComplete="name"
          value={formData.fullName}
          onChange={handleChange}
          className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
          >
            Email address
          </label>
          <input
            name="name-2d2db6"
            id="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="phone"
            className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
          >
            Phone number
          </label>
          <input
            name="name-1ec9f2"
            id="phone"
            type="text"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
          />
        </div>
      </div>

      {/* Platform selector */}
      <div className="space-y-2">
        <label
          htmlFor="platform"
          className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
        >
          Your platform
        </label>
        <select
          name="name-36f857"
          id="platform"
          autoComplete="off"
          value={formData.platform}
          onChange={handleChange}
          className="w-full form-understate p-4 text-charcoal-dark appearance-none text-sm bg-slate-50/50"
          style={selectStyle}
        >
          <option value="">Select your platform</option>
          <option value="GHANA">Base Ghana</option>
          <option value="DIASPORA">Base Diaspora</option>
        </select>
      </div>

      {/* ── Ghana: Region → Constituency ───────────────────────────────────── */}
      {formData.platform === 'GHANA' && (
        <div
          className="space-y-4 rounded-sm border border-slate-200 p-4"
          style={{ background: 'hsl(var(--container-low))' }}
        >
          <p className="text-micro font-medium text-charcoal-dark font-meta tracking-tight flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              location_on
            </span>
            Ghana location
            <span className="text-slate-400 font-normal ml-1">— optional</span>
          </p>

          {/* Region */}
          <div className="space-y-2">
            <label
              htmlFor="region"
              className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
            >
              Region
            </label>
            <select
              id="region"
              value={formData.region}
              onChange={handleRegionChange}
              className="w-full form-understate p-4 text-charcoal-dark appearance-none text-sm bg-slate-50/50"
              style={selectStyle}
            >
              <option value="">Select your region</option>
              {GHANA_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Constituency */}
          <div className="space-y-2">
            <label
              htmlFor="constituency"
              className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
            >
              Constituency
            </label>
            <select
              id="constituency"
              value={formData.constituency}
              onChange={(e) => onFieldChange('constituency', e.target.value)}
              disabled={
                loadingConstituencies || (!!formData.region && filteredConstituencies.length === 0)
              }
              className="w-full form-understate p-4 text-charcoal-dark appearance-none text-sm bg-slate-50/50 disabled:opacity-50"
              style={selectStyle}
            >
              <option value="">
                {loadingConstituencies
                  ? 'Loading…'
                  : formData.region
                    ? `Select constituency in ${formData.region}`
                    : 'Select constituency'}
              </option>
              {filteredConstituencies.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Diaspora: Country → Chapter ────────────────────────────────────── */}
      {formData.platform === 'DIASPORA' && (
        <div
          className="space-y-4 rounded-sm border border-slate-200 p-4"
          style={{ background: 'hsl(var(--container-low))' }}
        >
          <p className="text-micro font-medium text-charcoal-dark font-meta tracking-tight flex items-center gap-1.5">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              public
            </span>
            Base Diaspora community
            <span className="text-slate-400 font-normal ml-1">— optional</span>
          </p>

          {/* Country */}
          <div className="space-y-2">
            <label
              htmlFor="country"
              className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
            >
              Country
            </label>
            <select
              id="country"
              value={formData.country}
              onChange={handleCountryChange}
              disabled={loadingChapters}
              className="w-full form-understate p-4 text-charcoal-dark appearance-none text-sm bg-slate-50/50 disabled:opacity-50"
              style={selectStyle}
            >
              <option value="">{loadingChapters ? 'Loading…' : 'Select your country'}</option>
              {diasporaCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter */}
          <div className="space-y-2">
            <label
              htmlFor="chapter"
              className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
            >
              Community
            </label>
            <select
              id="chapter"
              value={formData.chapter}
              onChange={(e) => onFieldChange('chapter', e.target.value)}
              disabled={loadingChapters || (!!formData.country && filteredChapters.length === 0)}
              className="w-full form-understate p-4 text-charcoal-dark appearance-none text-sm bg-slate-50/50 disabled:opacity-50"
              style={selectStyle}
            >
              <option value="">
                {loadingChapters
                  ? 'Loading…'
                  : formData.country
                    ? `Select your community in ${formData.country}`
                    : 'Select your community'}
              </option>
              {filteredChapters.map((c) => (
                <option key={c.id} value={c.name}>
                  {diasporaName(c.name)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="message"
          className="text-micro font-medium text-charcoal-dark font-meta tracking-tight"
        >
          Message <span className="text-[var(--brand-red)]">*</span>
        </label>
        <textarea
          name="name-aab423"
          id="message"
          autoComplete="off"
          value={formData.message}
          onChange={handleChange}
          className="w-full form-understate p-4 text-charcoal-dark text-sm bg-slate-50/50"
        ></textarea>
      </div>

      <button type="submit" className="btn btn-primary w-full" style={{ height: 52 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          send
        </span>
        Send Message
      </button>
    </form>
  )
}
