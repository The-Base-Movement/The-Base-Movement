import { Link } from 'react-router-dom'
import { type Chapter } from '@/types/admin'

interface ChapterCardProps {
  chapter: Chapter
  countryFlags: Record<string, string>
}

export function ChapterCard({ chapter, countryFlags }: ChapterCardProps) {
  const isActive = (chapter.status as string) === 'Active' || (chapter.status as string) === 'Member'
  const isDiaspora = chapter.country !== 'Ghana'
  const isFeatured = chapter.member_count > 500

  const badge = isDiaspora ? 'Diaspora' : isFeatured ? 'Featured' : isActive ? 'Active' : 'Regional'
  const headerBg = isFeatured ? 'hsl(var(--primary))' : '#181d19'

  const leader = chapter.leadership?.[0]
  const leaderName = leader?.name || chapter.leader_name || 'Branch Chair'
  const leaderRole = leader?.role || (isDiaspora ? 'Hub coordinator' : 'Branch chair')
  const leaderInitial = leaderName.charAt(0).toUpperCase()

  const eventsCount = chapter.activities?.length ?? 0
  const programsCount = Math.max(0, Math.floor(eventsCount / 3))

  const regionLabel = chapter.region || chapter.city_or_region
  const flag = isDiaspora && countryFlags[chapter.country] ? countryFlags[chapter.country] : ''
  const slug = chapter.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

  return (
    <div className="bg-white border border-border rounded-[6px] overflow-hidden">
      {/* Dark header */}
      <div
        className="px-4 py-[14px] flex justify-between items-center"
        style={{ background: headerBg }}
      >
        <div>
          <h4 className="font-['Public_Sans',sans-serif] font-extrabold text-[14px] tracking-[-0.005em] text-white leading-tight">
            {chapter.name}
            {flag && <span className="ml-1.5">{flag}</span>}
          </h4>
          <div
            className="text-[9.5px] font-bold tracking-[0.06em] uppercase mt-0.5 font-['Public_Sans',sans-serif]"
            style={{ color: isFeatured ? 'rgba(255,255,255,0.85)' : 'hsl(var(--accent))' }}
          >
            {regionLabel}
          </div>
        </div>
        <span className="px-2 py-[2px] border border-white/20 bg-white/10 rounded-[2px] font-['Public_Sans',sans-serif] font-extrabold text-[9px] tracking-[0.05em] uppercase text-white shrink-0">
          {badge}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        {/* 3-stat grid */}
        <div className="grid grid-cols-3 gap-2 mb-[14px]">
          {[
            { v: chapter.member_count.toLocaleString(), l: 'Members' },
            { v: eventsCount, l: 'Events' },
            { v: programsCount, l: 'Programs' },
          ].map(({ v, l }) => (
            <div key={l}>
              <div className="font-['Public_Sans',sans-serif] font-extrabold text-[18px] tracking-[-0.015em] text-on-surface tabular-nums leading-none">
                {v}
              </div>
              <div className="text-[9.5px] font-bold tracking-[0.05em] uppercase text-on-surface-muted mt-[2px] font-['Public_Sans',sans-serif]">
                {l}
              </div>
            </div>
          ))}
        </div>

        {/* Leader row */}
        <div className="flex items-center gap-[10px] pt-3 border-t border-border">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0 border-2"
            style={{ background: '#181d19', borderColor: 'hsl(var(--accent))' }}
          >
            {leaderInitial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-['Public_Sans',sans-serif] font-extrabold text-[11.5px] text-on-surface truncate">
              {leaderName}
            </div>
            <div className="text-[10px] text-on-surface-muted font-bold font-['Public_Sans',sans-serif]">
              {leaderRole}
            </div>
          </div>
          <Link
            to={`/dashboard/chapters/${slug}`}
            className="shrink-0 px-3 py-1.5 border border-border rounded-[4px] text-[11px] font-extrabold text-on-surface hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors font-['Public_Sans',sans-serif]"
          >
            Join
          </Link>
        </div>
      </div>
    </div>
  )
}
