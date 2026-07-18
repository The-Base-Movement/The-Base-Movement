import { useRef, useState, useEffect } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import type { AudienceFilter, AudienceType } from '@/services/newsletterService'
import { newsletterService, formatRecipientCount } from '@/services/newsletterService'
import { useIsDarkTheme } from '@/hooks/useIsDarkTheme'
import {
  ChapterSlotRow,
  ConstituencySlotRow,
  SimpleFilterRow,
} from './components/AudienceFilterRows'
import type { ChapterSlot, ConstituencySlot, FilterSlot, RegionsData } from './composeTypes'
import { EMAIL_TEMPLATES } from './emailTemplates'

function deriveFilters(slots: FilterSlot[]): AudienceFilter[] {
  return slots.flatMap((slot): AudienceFilter[] => {
    if (slot.type === 'simple') return [slot.filter]
    if (slot.type === 'constituency')
      return slot.selected.map((c) => ({ type: 'constituency', value: c }))
    return slot.selected.map((c) => ({ type: 'chapter', value: c }))
  })
}

function slotsComplete(slots: FilterSlot[]): boolean {
  if (slots.length === 0) return false
  return slots.every((slot) => {
    if (slot.type === 'simple') return slot.filter.type === 'all' || slot.filter.value !== null
    return slot.selected.length > 0
  })
}

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

// ComposePanel
// ---------------------------------------------------------------------------

interface ComposePanelProps {
  isSending: boolean
  onSend: (subject: string, bodyHtml: string, filters: AudienceFilter[]) => void
  onSchedule: (
    subject: string,
    bodyHtml: string,
    filters: AudienceFilter[],
    scheduledAt: string
  ) => void
}

export function ComposePanel({ isSending, onSend, onSchedule }: ComposePanelProps) {
  const isDark = useIsDarkTheme()
  const editorRef = useRef<{ getContent: () => string; setContent: (html: string) => void } | null>(
    null
  )
  const [subject, setSubject] = useState('')
  const [slots, setSlots] = useState<FilterSlot[]>([
    { id: uid(), type: 'simple', filter: { type: 'all', value: null } },
  ])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [allRegions, setAllRegions] = useState<string[]>([])
  const [regionsData, setRegionsData] = useState<RegionsData | null>(null)
  const [allChapters, setAllChapters] = useState<string[]>([])
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')

  // Pre-fetch reference data for slot pickers
  useEffect(() => {
    let cancelled = false
    Promise.all([
      newsletterService.getAudienceOptions('region'),
      newsletterService.getRegionsWithConstituencies(),
      newsletterService.getAudienceOptions('chapter'),
    ])
      .then(([regions, rData, chapters]) => {
        if (!cancelled) {
          setAllRegions(regions)
          setRegionsData(rData)
          setAllChapters(chapters)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const filters = deriveFilters(slots)
  const filtersComplete = slotsComplete(slots)
  const isAllMode =
    slots.length === 1 && slots[0].type === 'simple' && slots[0].filter.type === 'all'
  const hasConstituencySlot = slots.some((s) => s.type === 'constituency')
  const hasChapterSlot = slots.some((s) => s.type === 'chapter')

  // Recipient count — batch constituency queries into one DB call
  useEffect(() => {
    if (!filtersComplete) return
    let cancelled = false
    const derived = deriveFilters(slots)
    if (derived.length === 0) return

    const constituencyValues = derived
      .filter((f) => f.type === 'constituency' && f.value)
      .map((f) => f.value as string)
    const chapterValues = derived
      .filter((f) => f.type === 'chapter' && f.value)
      .map((f) => f.value as string)
    const otherFilters = derived.filter((f) => f.type !== 'constituency' && f.type !== 'chapter')

    Promise.all([
      constituencyValues.length > 0
        ? newsletterService.getRecipientCountForConstituencies(constituencyValues)
        : Promise.resolve(0),
      chapterValues.length > 0
        ? newsletterService.getRecipientCountForChapters(chapterValues)
        : Promise.resolve(0),
      ...otherFilters.map((f) =>
        newsletterService.getRecipientCount(f.type as Exclude<AudienceType, 'multi'>, f.value)
      ),
    ])
      .then((counts) => {
        if (!cancelled) setTotalCount(counts.reduce((a, b) => a + b, 0))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [slots, filtersComplete])

  function updateSimpleSlot(id: string, filter: AudienceFilter) {
    setSlots((prev) => prev.map((s) => (s.id === id && s.type === 'simple' ? { ...s, filter } : s)))
  }

  function updateConstituencySlot(id: string, updates: Partial<ConstituencySlot>) {
    setSlots((prev) =>
      prev.map((s) => (s.id === id && s.type === 'constituency' ? { ...s, ...updates } : s))
    )
  }

  function updateChapterSlot(id: string, updates: Partial<ChapterSlot>) {
    setSlots((prev) =>
      prev.map((s) => (s.id === id && s.type === 'chapter' ? { ...s, ...updates } : s))
    )
  }

  function removeSlot(id: string) {
    setSlots((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (next.length === 0)
        return [{ id: uid(), type: 'simple', filter: { type: 'all', value: null } }]
      return next
    })
  }

  function addSimpleSlot() {
    setSlots((prev) => [
      ...prev,
      { id: uid(), type: 'simple', filter: { type: 'region', value: null } },
    ])
  }

  function addConstituencySlot() {
    setSlots((prev) => {
      const without = prev.filter((s) => !(s.type === 'simple' && s.filter.type === 'all'))
      return [
        ...without,
        { id: uid(), type: 'constituency', regionFilter: null, search: '', selected: [] },
      ]
    })
  }

  function addChapterSlot() {
    setSlots((prev) => {
      const without = prev.filter((s) => !(s.type === 'simple' && s.filter.type === 'all'))
      return [...without, { id: uid(), type: 'chapter', search: '', selected: [] }]
    })
  }

  function handleSend() {
    const body = editorRef.current?.getContent() ?? ''
    onSend(subject, body, filters)
  }

  function handleSchedule() {
    const body = editorRef.current?.getContent() ?? ''
    onSchedule(subject, body, filters, new Date(scheduledAt).toISOString())
  }

  const scheduledAtValid = scheduleMode ? scheduledAt.length > 0 : true

  const canSend =
    !isSending &&
    subject.trim().length > 0 &&
    filtersComplete &&
    filters.length > 0 &&
    (totalCount === null || totalCount > 0) &&
    scheduledAtValid

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 'var(--font-weight-medium, 500)',
    color: 'hsl(var(--on-surface-muted))',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 6,
    fontFamily: "'Public Sans', sans-serif",
  }

  const addBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
    fontSize: 12,
    color: 'hsl(var(--primary))',
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 'var(--font-weight-medium, 500)',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  }

  return (
    <div className="panel" style={{ padding: 0 }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, paddingRight: 60 }}>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 13,
              color: 'hsl(var(--on-surface))',
              margin: 0,
            }}
          >
            Compose newsletter
          </p>
          <p
            style={{
              fontSize: 11,
              color: 'hsl(var(--on-surface-muted))',
              margin: '2px 0 0',
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            Sent via Resend · wrapped in branded template
          </p>
        </div>
        <img
          src="/branding/icons/loudspeaker.png"
          alt=""
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: '100%',
            opacity: 0.12,
            pointerEvents: 'none',
            zIndex: 0,
            objectFit: 'contain',
          }}
        />
      </div>

      <div className="compose-body">
        {/* Subject */}
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="newsletter-compose-subject" style={labelStyle}>
            Subject
          </label>
          <input
            id="newsletter-compose-subject"
            name="newsletter-compose-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Movement update — June 2026"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontFamily: "'Public Sans', sans-serif",
              color: 'hsl(var(--on-surface))',
              background: 'hsl(var(--background))',
              outline: 'none',
            }}
          />
        </div>

        {/* Audience slots */}
        <div style={{ marginBottom: 6 }}>
          <label style={labelStyle}>
            Audience{filters.length > 1 ? ` (${filters.length} targets)` : ''}
          </label>

          {slots.map((slot) =>
            slot.type === 'simple' ? (
              <SimpleFilterRow
                key={slot.id}
                filter={slot.filter}
                preloadedOptions={slot.filter.type === 'region' ? allRegions : undefined}
                onChange={(f) => updateSimpleSlot(slot.id, f)}
                onRemove={() => removeSlot(slot.id)}
                showRemove={slots.length > 1}
              />
            ) : slot.type === 'constituency' ? (
              <ConstituencySlotRow
                key={slot.id}
                slot={slot}
                regions={regionsData?.regions ?? []}
                byRegion={regionsData?.byRegion ?? {}}
                allConstituencies={regionsData?.allConstituencies ?? []}
                onChange={(updates) => updateConstituencySlot(slot.id, updates)}
                onRemove={() => removeSlot(slot.id)}
                showRemove={slots.length > 1}
              />
            ) : (
              <ChapterSlotRow
                key={slot.id}
                slot={slot}
                allChapters={allChapters}
                onChange={(updates) => updateChapterSlot(slot.id, updates)}
                onRemove={() => removeSlot(slot.id)}
                showRemove={slots.length > 1}
              />
            )
          )}

          {/* Add buttons */}
          <div style={{ display: 'flex', gap: 14, marginTop: 2 }}>
            {!isAllMode && (
              <button onClick={addSimpleSlot} style={addBtnStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  add
                </span>
                Add audience
              </button>
            )}
            {!hasConstituencySlot && (
              <button onClick={addConstituencySlot} style={addBtnStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  add_location_alt
                </span>
                Select constituencies
              </button>
            )}
            {!hasChapterSlot && (
              <button onClick={addChapterSlot} style={addBtnStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  group_add
                </span>
                Select chapters
              </button>
            )}
          </div>
        </div>

        {/* Recipient count */}
        {filtersComplete && totalCount !== null && (
          <p
            style={{
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              marginBottom: 14,
              fontFamily: "'Public Sans', sans-serif",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}
            >
              people
            </span>
            ~{formatRecipientCount(totalCount)}
            {filters.length > 1 && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>(duplicates removed at send time)</span>
            )}
          </p>
        )}

        {/* Email template picker */}
        <div style={{ marginBottom: 14, marginTop: 14 }}>
          <label style={labelStyle}>Start from a template (optional)</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EMAIL_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  editorRef.current?.setContent(tpl.html)
                  if (!subject) setSubject(tpl.defaultSubject)
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface))',
                  background: 'hsl(var(--container-low))',
                  cursor: 'pointer',
                }}
                title={tpl.description}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 14, color: 'hsl(var(--primary))' }}
                >
                  {tpl.icon}
                </span>
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* TinyMCE body */}
        <div style={{ marginBottom: 18, marginTop: 14 }}>
          <label htmlFor="newsletter-compose-body" style={labelStyle}>
            Body
          </label>
          <Editor
            id="newsletter-compose-body"
            textareaName="newsletter-compose-body"
            key={isDark ? 'dark' : 'light'}
            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
            onInit={(_, editor) => {
              editorRef.current = editor
            }}
            initialValue=""
            init={{
              height: 400,
              menubar: false,
              plugins: [
                'advlist',
                'autolink',
                'lists',
                'link',
                'charmap',
                'searchreplace',
                'wordcount',
              ],
              toolbar:
                'undo redo | blocks | bold italic underline forecolor | alignleft aligncenter alignright | bullist numlist | link | removeformat',
              statusbar: false,
              content_style: isDark
                ? 'body { font-family: "Public Sans", sans-serif; font-size:14px; color:#f1f5f9; line-height:1.65; background:#0f1110; }'
                : 'body { font-family: "Public Sans", sans-serif; font-size:14px; color:#1f2520; line-height:1.65; background:white; }',
              skin: isDark ? 'oxide-dark' : 'oxide',
              content_css: isDark ? 'dark' : 'default',
              branding: false,
            }}
          />
        </div>

        {/* Send / Schedule row */}
        <div className="newsletter-send-row">
          {/* Mode toggle */}
          <div
            style={{
              display: 'flex',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setScheduleMode(false)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                border: 'none',
                cursor: 'pointer',
                background: !scheduleMode ? 'hsl(var(--primary))' : 'transparent',
                color: !scheduleMode ? '#fff' : 'hsl(var(--on-surface))',
              }}
            >
              Send now
            </button>
            <button
              type="button"
              onClick={() => setScheduleMode(true)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                border: 'none',
                borderLeft: '1px solid hsl(var(--border))',
                cursor: 'pointer',
                background: scheduleMode ? 'hsl(var(--accent))' : 'transparent',
                color: scheduleMode ? '#fff' : 'hsl(var(--on-surface))',
              }}
            >
              Schedule
            </button>
          </div>

          {/* Datetime picker (schedule mode only) */}
          {scheduleMode && (
            <input
              id="newsletter-compose-scheduled-at"
              name="newsletter-compose-scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                padding: '6px 10px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontFamily: "'Public Sans', sans-serif",
                color: 'hsl(var(--on-surface))',
                background: 'hsl(var(--background))',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              aria-label="Scheduled date and time"
            />
          )}

          {/* Action button */}
          {scheduleMode ? (
            <button
              className="btn btn-accent"
              onClick={handleSchedule}
              disabled={!canSend}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                schedule_send
              </span>
              Schedule newsletter
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={!canSend}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                send
              </span>
              {isSending ? 'Sending…' : 'Send newsletter'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
