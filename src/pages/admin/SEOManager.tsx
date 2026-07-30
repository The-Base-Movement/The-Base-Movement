import { useState, useEffect, useMemo } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { BrandLine } from '@/components/ui/BrandLine'
import { toast } from 'sonner'
import { seoService } from '@/services/seoService'
import { analyzeSEO } from '@/utils/seoAnalyzer'
import { DEFAULT_PAGE_CONFIGS, type PageSEOConfig } from '@/types/seo'

export default function SEOManager() {
  const [configs, setConfigs] = useState<PageSEOConfig[]>(DEFAULT_PAGE_CONFIGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedPath, setSelectedPath] = useState<string>('/')
  const [searchFilter, setSearchFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'content' | 'analysis' | 'previews' | 'technical'>(
    'content'
  )
  const [previewMode, setPreviewMode] = useState<
    'google-desktop' | 'google-mobile' | 'facebook' | 'twitter'
  >('google-desktop')
  const [customPathInput, setCustomPathInput] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    async function loadSEOData() {
      setLoading(true)
      try {
        const loaded = await seoService.getPageConfigs()
        setConfigs(loaded)
      } catch (err) {
        console.error('Failed to load SEO configs:', err)
        toast.error('Failed to load site SEO settings.')
      } finally {
        setLoading(false)
      }
    }
    loadSEOData()
  }, [])

  const selectedConfig = useMemo(() => {
    return configs.find((c) => c.path === selectedPath) || configs[0] || DEFAULT_PAGE_CONFIGS[0]
  }, [configs, selectedPath])

  // Compute Rank Math + AIOSEO score for selected page
  const analysis = useMemo(() => {
    return analyzeSEO(selectedConfig)
  }, [selectedConfig])

  // Compute overall site SEO stats
  const siteStats = useMemo(() => {
    const total = configs.length
    const analyses = configs.map((c) => analyzeSEO(c))
    const avgScore =
      total > 0 ? Math.round(analyses.reduce((acc, a) => acc + a.totalScore, 0) / total) : 0
    const highRankCount = analyses.filter((a) => a.totalScore >= 80).length
    const needsAttentionCount = analyses.filter((a) => a.totalScore < 80).length

    return { total, avgScore, highRankCount, needsAttentionCount }
  }, [configs])

  // Filtered page list for left sidebar
  const filteredConfigs = useMemo(() => {
    const q = searchFilter.trim().toLowerCase()
    if (!q) return configs
    return configs.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.path.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.focusKeyword.toLowerCase().includes(q)
    )
  }, [configs, searchFilter])

  const handleConfigChange = <K extends keyof PageSEOConfig>(field: K, value: PageSEOConfig[K]) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.path === selectedPath) {
          return { ...c, [field]: value }
        }
        return c
      })
    )
  }

  const handleSavePage = async () => {
    setSaving(true)
    try {
      const success = await seoService.savePageConfig(selectedConfig)
      if (success) {
        toast.success(`SEO settings saved for ${selectedConfig.label} (${selectedConfig.path})`)
      } else {
        toast.error('Failed to save SEO settings.')
      }
    } catch {
      toast.error('Error saving SEO settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const success = await seoService.saveAllPageConfigs(configs)
      if (success) {
        toast.success('All page SEO configurations saved successfully.')
      } else {
        toast.error('Failed to bulk save SEO settings.')
      }
    } catch {
      toast.error('Error saving SEO settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCustomPage = () => {
    const path = customPathInput.trim().startsWith('/')
      ? customPathInput.trim()
      : `/${customPathInput.trim()}`
    if (!path || path === '/') {
      toast.error('Please enter a valid route path (e.g. /custom-page).')
      return
    }
    if (configs.some((c) => c.path === path)) {
      toast.error('A configuration for this route path already exists.')
      return
    }

    const newConfig: PageSEOConfig = {
      path,
      label: path
        .substring(1)
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      title: `${path.substring(1)} | The Base Movement`,
      description:
        'Join The Base Movement in Ghana and across the diaspora. We are committed to youth employment, accountable leadership, civic action, and economic progress.',
      focusKeyword: path.substring(1).replace(/-/g, ' '),
      canonicalUrl: `https://www.thebasemovement.org.gh${path}`,
      ogImage: '/branding/og-image.png',
    }

    setConfigs((prev) => [...prev, newConfig])
    setSelectedPath(path)
    setCustomPathInput('')
    setShowAddModal(false)
    toast.success(`Added new SEO configuration for ${path}`)
  }

  return (
    <div className="main" style={{ minHeight: '100vh', paddingBottom: 40 }}>
      {/* Header & Navigation */}
      <Breadcrumbs />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 'var(--font-weight-medium, 500)',
              margin: '0 0 4px',
              color: 'hsl(var(--on-surface))',
            }}
          >
            SEO Command Center &amp; Optimizer
          </h1>
          <BrandLine />
          <p style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '8px 0 0' }}>
            Manage page titles, meta descriptions, focus keywords, and social cards using Rank Math
            &amp; AIOSEO scoring.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              add_link
            </span>
            Add Route Path
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSaveAll}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              save
            </span>
            {saving ? 'Saving…' : 'Save All SEO Settings'}
          </button>
        </div>
      </div>

      {/* Top Stats Strip */}
      <div className="kpis" style={{ marginBottom: 24 }}>
        <div
          className="panel"
          style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: 'hsl(var(--primary))',
            }}
          />
          <p
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
              margin: '0 0 6px',
            }}
          >
            Managed Pages
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {siteStats.total}
          </p>
        </div>
        <div
          className="panel"
          style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: siteStats.avgScore >= 80 ? 'hsl(142 76% 36%)' : 'hsl(45 93% 47%)',
            }}
          />
          <p
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
              margin: '0 0 6px',
            }}
          >
            Average SEO Score
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {siteStats.avgScore}{' '}
            <span style={{ fontSize: 14, color: 'hsl(var(--on-surface-muted))' }}>/ 100</span>
          </p>
        </div>
        <div
          className="panel"
          style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: 'hsl(142 76% 36%)',
            }}
          />
          <p
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
              margin: '0 0 6px',
            }}
          >
            High SEO Score (80+)
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {siteStats.highRankCount}
          </p>
        </div>
        <div
          className="panel"
          style={{ padding: '16px 20px', position: 'relative', overflow: 'hidden' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background:
                siteStats.needsAttentionCount > 0
                  ? 'hsl(var(--destructive))'
                  : 'hsl(var(--on-surface-muted))',
            }}
          />
          <p
            style={{
              fontSize: 10,
              fontWeight: 'var(--font-weight-medium, 500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'hsl(var(--on-surface-muted))',
              margin: '0 0 6px',
            }}
          >
            Needs Attention (&lt;80)
          </p>
          <p
            style={{
              fontSize: 'var(--kpi-num-size)',
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            {siteStats.needsAttentionCount}
          </p>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="sidebar-main" style={{ alignItems: 'start' }}>
        {/* Left Column: Page Selector List */}
        <div className="panel" style={{ padding: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 'var(--font-weight-medium, 500)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--on-surface-muted))',
                margin: '0 0 8px',
              }}
            >
              Select Page to Optimize
            </p>
            <div style={{ position: 'relative' }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 16,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Search page or route…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  width: '100%',
                  height: 36,
                  paddingLeft: 34,
                  paddingRight: 10,
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--on-surface))',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: 600,
              overflowY: 'auto',
            }}
          >
            {loading ? (
              <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', padding: 12 }}>
                Loading pages…
              </p>
            ) : filteredConfigs.length === 0 ? (
              <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', padding: 12 }}>
                No pages found.
              </p>
            ) : (
              filteredConfigs.map((c) => {
                const isSelected = c.path === selectedPath
                const pageAnalysis = analyzeSEO(c)
                return (
                  <div
                    key={c.path}
                    onClick={() => setSelectedPath(c.path)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: isSelected ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                      border: isSelected
                        ? '1px solid hsl(var(--primary))'
                        : '1px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 'var(--font-weight-medium, 500)',
                          color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
                        }}
                      >
                        {c.label}
                      </span>
                      <span
                        className="pill"
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          background:
                            pageAnalysis.totalScore >= 80
                              ? 'hsl(142 76% 36% / 0.15)'
                              : 'hsl(45 93% 47% / 0.15)',
                          color:
                            pageAnalysis.totalScore >= 80 ? 'hsl(142 76% 36%)' : 'hsl(45 93% 47%)',
                        }}
                      >
                        {pageAnalysis.totalScore}/100
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        margin: 0,
                        fontFamily: 'monospace',
                      }}
                    >
                      {c.path}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: SEO Editor & Live Previews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Active Page Header Panel */}
          <div className="panel" style={{ padding: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20, color: 'hsl(var(--primary))' }}
                  >
                    language
                  </span>
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      margin: 0,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {selectedConfig.label}
                  </h2>
                  <span
                    className="pill pill-mute"
                    style={{ fontSize: 11, fontFamily: 'monospace' }}
                  >
                    {selectedConfig.path}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
                  Focus Keyword: <strong>{selectedConfig.focusKeyword || 'Not set'}</strong>
                </p>
              </div>

              {/* Rank Math Score Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: 'hsl(var(--container-low))',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      textTransform: 'uppercase',
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Rank Math / AIOSEO Score
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: analysis.gradeColor,
                    }}
                  >
                    {analysis.grade === 'GOOD'
                      ? 'Excellent Optimization'
                      : analysis.grade === 'OK'
                        ? 'Fair — Needs Improvement'
                        : 'Poor Optimization'}
                  </div>
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: analysis.gradeColor,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 'bold',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  {analysis.totalScore}
                </div>
              </div>
            </div>

            {/* Inner Sub-Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 20,
                borderBottom: '1px solid hsl(var(--border))',
                paddingBottom: 10,
              }}
            >
              <button
                className={`btn btn-sm ${activeTab === 'content' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                onClick={() => setActiveTab('content')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  edit_note
                </span>
                Meta &amp; Content
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'analysis' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                onClick={() => setActiveTab('analysis')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  analytics
                </span>
                SEO Checklist ({analysis.passedCount}/{analysis.totalCount})
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'previews' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                onClick={() => setActiveTab('previews')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  preview
                </span>
                Live Search &amp; Social Previews
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'technical' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                onClick={() => setActiveTab('technical')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  settings_suggest
                </span>
                Technical &amp; Social Tags
              </button>
            </div>

            {/* Tab 1: Meta & Content Editor */}
            {activeTab === 'content' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        marginBottom: 6,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      Page Label / Title Name
                    </label>
                    <input
                      type="text"
                      value={selectedConfig.label}
                      onChange={(e) => handleConfigChange('label', e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--on-surface))',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        marginBottom: 6,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      Focus Keyword (Primary Search Term)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. The Base Movement Ghana"
                      value={selectedConfig.focusKeyword}
                      onChange={(e) => handleConfigChange('focusKeyword', e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--on-surface))',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Page Title Input */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      SEO Meta Title (&lt;title&gt;)
                    </label>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color:
                          selectedConfig.title.length >= 45 && selectedConfig.title.length <= 60
                            ? 'hsl(142 76% 36%)'
                            : 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {selectedConfig.title.length} / 60 chars (Recommended: 45–60)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={selectedConfig.title}
                    onChange={(e) => handleConfigChange('title', e.target.value)}
                    style={{
                      width: '100%',
                      height: 40,
                      padding: '0 12px',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--on-surface))',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Meta Description Input */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      Meta Description (&lt;meta name="description"&gt;)
                    </label>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color:
                          selectedConfig.description.length >= 145 &&
                          selectedConfig.description.length <= 162
                            ? 'hsl(142 76% 36%)'
                            : 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      {selectedConfig.description.length} / 160 chars (Recommended: 145–160)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={selectedConfig.description}
                    onChange={(e) => handleConfigChange('description', e.target.value)}
                    style={{
                      width: '100%',
                      padding: 12,
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--on-surface))',
                      boxSizing: 'border-box',
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSavePage}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Changes for this Page'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Rank Math Checklist */}
            {activeTab === 'analysis' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                <p
                  style={{ fontSize: 13, color: 'hsl(var(--on-surface-muted))', margin: '0 0 8px' }}
                >
                  Actionable optimization rules derived from Rank Math and All in One SEO formulas:
                </p>
                {analysis.rules.map((rule) => (
                  <div
                    key={rule.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 20,
                        color: rule.passed ? 'hsl(142 76% 36%)' : 'hsl(var(--destructive))',
                        marginTop: 2,
                      }}
                    >
                      {rule.passed ? 'check_circle' : 'cancel'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 2,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 'var(--font-weight-medium, 500)',
                            color: 'hsl(var(--on-surface))',
                          }}
                        >
                          {rule.title}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 'bold',
                            color: rule.passed
                              ? 'hsl(142 76% 36%)'
                              : 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          +{rule.score}/{rule.maxScore} pts
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          color: 'hsl(var(--on-surface-muted))',
                          margin: '0 0 4px',
                        }}
                      >
                        {rule.message}
                      </p>
                      {rule.tip && (
                        <p
                          style={{
                            fontSize: 11,
                            color: 'hsl(var(--accent))',
                            margin: 0,
                            fontStyle: 'italic',
                          }}
                        >
                          💡 Tip: {rule.tip}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Live Search & Social Previews */}
            {activeTab === 'previews' && (
              <div style={{ marginTop: 16 }}>
                {/* Preview selector */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  <button
                    className={`btn btn-sm ${previewMode === 'google-desktop' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                    onClick={() => setPreviewMode('google-desktop')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      desktop_windows
                    </span>
                    Google Desktop Snippet
                  </button>
                  <button
                    className={`btn btn-sm ${previewMode === 'google-mobile' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                    onClick={() => setPreviewMode('google-mobile')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      smartphone
                    </span>
                    Google Mobile Snippet
                  </button>
                  <button
                    className={`btn btn-sm ${previewMode === 'facebook' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                    onClick={() => setPreviewMode('facebook')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      share
                    </span>
                    Facebook Card
                  </button>
                  <button
                    className={`btn btn-sm ${previewMode === 'twitter' ? 'btn-active-tab' : 'btn-inactive-tab'}`}
                    onClick={() => setPreviewMode('twitter')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      tag
                    </span>
                    Twitter / X Card
                  </button>
                </div>

                {/* Google Desktop Preview */}
                {previewMode === 'google-desktop' && (
                  <div
                    style={{
                      background: '#ffffff',
                      color: '#202124',
                      padding: 20,
                      borderRadius: 8,
                      border: '1px solid #dadce0',
                      fontFamily: 'arial, sans-serif',
                      maxWidth: 650,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: '#1a6b3c',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      >
                        TBM
                      </div>
                      <div>
                        <div style={{ fontSize: 14, color: '#202124', lineHeight: 1.3 }}>
                          The Base Movement Ghana
                        </div>
                        <div style={{ fontSize: 12, color: '#4d5156', lineHeight: 1.3 }}>
                          https://www.thebasemovement.org.gh{selectedConfig.path}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        color: '#1a0dab',
                        lineHeight: 1.3,
                        marginBottom: 4,
                        cursor: 'pointer',
                        textDecoration: 'none',
                      }}
                    >
                      {selectedConfig.title}
                    </div>
                    <div style={{ fontSize: 14, color: '#4d5156', lineHeight: 1.58 }}>
                      {selectedConfig.description}
                    </div>
                  </div>
                )}

                {/* Google Mobile Preview */}
                {previewMode === 'google-mobile' && (
                  <div
                    style={{
                      background: '#ffffff',
                      color: '#202124',
                      padding: 16,
                      borderRadius: 12,
                      border: '1px solid #dadce0',
                      fontFamily: 'arial, sans-serif',
                      maxWidth: 375,
                      margin: '0 auto',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: '#1a6b3c',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 'bold',
                        }}
                      >
                        TBM
                      </div>
                      <div style={{ fontSize: 12, color: '#202124' }}>
                        <div>The Base Movement</div>
                        <div style={{ fontSize: 11, color: '#4d5156' }}>
                          thebasemovement.org.gh{selectedConfig.path}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{ fontSize: 18, color: '#1a0dab', lineHeight: 1.3, marginBottom: 6 }}
                    >
                      {selectedConfig.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#4d5156', lineHeight: 1.45 }}>
                      {selectedConfig.description}
                    </div>
                  </div>
                )}

                {/* Facebook Open Graph Card */}
                {previewMode === 'facebook' && (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: 8,
                      border: '1px solid #dddfe2',
                      overflow: 'hidden',
                      maxWidth: 500,
                      fontFamily: 'Helvetica, Arial, sans-serif',
                    }}
                  >
                    <div
                      style={{
                        height: 250,
                        background: '#f0f2f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyCenter: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={selectedConfig.ogImage || '/branding/og-image.png'}
                        alt="OG Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div
                      style={{ padding: 12, background: '#f2f3f5', borderTop: '1px solid #e5e5e5' }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: '#606770',
                          textTransform: 'uppercase',
                          marginBottom: 2,
                        }}
                      >
                        THEBASEMOVEMENT.ORG.GH
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 'bold',
                          color: '#1d2129',
                          marginBottom: 4,
                          lineHeight: 1.2,
                        }}
                      >
                        {selectedConfig.ogTitle || selectedConfig.title}
                      </div>
                      <div
                        style={{ fontSize: 13, color: '#606770', lineHeight: 1.4 }}
                        className="line-clamp-2"
                      >
                        {selectedConfig.ogDescription || selectedConfig.description}
                      </div>
                    </div>
                  </div>
                )}

                {/* Twitter / X Card */}
                {previewMode === 'twitter' && (
                  <div
                    style={{
                      background: '#000000',
                      color: '#e7e9ea',
                      borderRadius: 16,
                      border: '1px solid #2f3336',
                      overflow: 'hidden',
                      maxWidth: 500,
                      fontFamily:
                        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    }}
                  >
                    <div style={{ height: 250, background: '#16181c', overflow: 'hidden' }}>
                      <img
                        src={
                          selectedConfig.twitterImage ||
                          selectedConfig.ogImage ||
                          '/branding/og-image.png'
                        }
                        alt="Twitter Card Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ fontSize: 13, color: '#71767b', marginBottom: 2 }}>
                        thebasemovement.org.gh
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 'bold',
                          color: '#e7e9ea',
                          marginBottom: 4,
                        }}
                      >
                        {selectedConfig.twitterTitle || selectedConfig.title}
                      </div>
                      <div
                        style={{ fontSize: 13, color: '#71767b', lineHeight: 1.4 }}
                        className="line-clamp-2"
                      >
                        {selectedConfig.twitterDescription || selectedConfig.description}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Technical & Social Tags */}
            {activeTab === 'technical' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        marginBottom: 6,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      Open Graph Image URL (og:image)
                    </label>
                    <input
                      type="text"
                      placeholder="/branding/og-image.png"
                      value={selectedConfig.ogImage || ''}
                      onChange={(e) => handleConfigChange('ogImage', e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--on-surface))',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 12,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        marginBottom: 6,
                        color: 'hsl(var(--on-surface))',
                      }}
                    >
                      Canonical Tag URL (&lt;link rel="canonical"&gt;)
                    </label>
                    <input
                      type="text"
                      placeholder={`https://www.thebasemovement.org.gh${selectedConfig.path}`}
                      value={selectedConfig.canonicalUrl || ''}
                      onChange={(e) => handleConfigChange('canonicalUrl', e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 12px',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--on-surface))',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <input
                    type="checkbox"
                    id="noindex-toggle"
                    checked={!!selectedConfig.noindex}
                    onChange={(e) => handleConfigChange('noindex', e.target.checked)}
                    style={{ width: 18, height: 18, cursor: 'pointer' }}
                  />
                  <div>
                    <label
                      htmlFor="noindex-toggle"
                      style={{
                        fontSize: 13,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color: 'hsl(var(--on-surface))',
                        cursor: 'pointer',
                      }}
                    >
                      Suppress Search Engine Indexing (&lt;meta name="robots" content="noindex,
                      nofollow"&gt;)
                    </label>
                    <p style={{ fontSize: 11, color: 'hsl(var(--on-surface-muted))', margin: 0 }}>
                      Enable only for private member pages or admin portals you want hidden from
                      Google/Bing.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSavePage}
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save Technical Tags'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Site SEO Overview Table */}
          <div className="panel" style={{ padding: 20 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 'var(--font-weight-medium, 500)',
                margin: '0 0 16px',
                color: 'hsl(var(--on-surface))',
              }}
            >
              All Managed Site Pages (Overview Table)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid hsl(var(--border))', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>Page / Path</th>
                    <th style={{ padding: '10px 12px' }}>Focus Keyword</th>
                    <th style={{ padding: '10px 12px' }}>Title Tag</th>
                    <th style={{ padding: '10px 12px' }}>SEO Score</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((c) => {
                    const rowAnalysis = analyzeSEO(c)
                    return (
                      <tr key={c.path} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <td
                          style={{
                            padding: '10px 12px',
                            fontWeight: 'var(--font-weight-medium, 500)',
                          }}
                        >
                          <div>{c.label}</div>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'hsl(var(--on-surface-muted))',
                              fontFamily: 'monospace',
                            }}
                          >
                            {c.path}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'hsl(var(--on-surface-muted))' }}>
                          {c.focusKeyword || '—'}
                        </td>
                        <td
                          style={{
                            padding: '10px 12px',
                            color: 'hsl(var(--on-surface))',
                            maxWidth: 260,
                          }}
                          className="truncate"
                        >
                          {c.title}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            className="pill"
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              background:
                                rowAnalysis.totalScore >= 80
                                  ? 'hsl(142 76% 36% / 0.15)'
                                  : 'hsl(45 93% 47% / 0.15)',
                              color:
                                rowAnalysis.totalScore >= 80
                                  ? 'hsl(142 76% 36%)'
                                  : 'hsl(45 93% 47%)',
                            }}
                          >
                            {rowAnalysis.totalScore}/100 ({rowAnalysis.grade})
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setSelectedPath(c.path)
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal to add custom route path */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyCenter: 'center',
            padding: 16,
          }}
        >
          <div
            className="panel"
            style={{ width: 450, padding: 24, background: 'hsl(var(--background))' }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 'var(--font-weight-medium, 500)',
                margin: '0 0 12px',
                color: 'hsl(var(--on-surface))',
              }}
            >
              Add Custom Route Path for SEO
            </h3>
            <p style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', margin: '0 0 16px' }}>
              Specify any custom path (e.g. <code>/impact</code> or <code>/leadership</code>) to
              manage its SEO settings.
            </p>
            <input
              type="text"
              placeholder="/custom-path"
              value={customPathInput}
              onChange={(e) => setCustomPathInput(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                background: 'hsl(var(--background))',
                color: 'hsl(var(--on-surface))',
                boxSizing: 'border-box',
                marginBottom: 16,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleAddCustomPage}>
                Add Path
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
