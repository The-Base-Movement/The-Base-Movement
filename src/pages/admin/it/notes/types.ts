// ─── Types ────────────────────────────────────────────────────────────────────

export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange' | 'red' | 'teal'

export interface Note {
  id: string
  title: string | null
  content: string
  color_theme: NoteColor
  author_id: string
  author_name: string
  created_at: string
  comment_count: number
}

export interface Comment {
  id: string
  content: string
  author_name: string
  created_at: string
}

// ─── Color palette ────────────────────────────────────────────────────────────

export const COLORS: {
  value: NoteColor
  bg: string
  border: string
  pin: string
  label: string
}[] = [
  { value: 'yellow', bg: '#FEFCE8', border: '#FDE047', pin: '#CA8A04', label: 'Yellow' },
  { value: 'green', bg: '#F0FDF4', border: '#86EFAC', pin: '#16A34A', label: 'Green' },
  { value: 'blue', bg: '#EFF6FF', border: '#93C5FD', pin: '#2563EB', label: 'Blue' },
  { value: 'pink', bg: '#FDF2F8', border: '#F9A8D4', pin: '#DB2777', label: 'Pink' },
  { value: 'purple', bg: '#FAF5FF', border: '#D8B4FE', pin: '#9333EA', label: 'Purple' },
  { value: 'orange', bg: '#FFF7ED', border: '#FDBA74', pin: '#EA580C', label: 'Orange' },
  { value: 'red', bg: '#FFF1F2', border: '#FCA5A5', pin: '#DC2626', label: 'Red' },
  { value: 'teal', bg: '#F0FDFA', border: '#5EEAD4', pin: '#0D9488', label: 'Teal' },
]

export const NOTE_INK = {
  title: '#1F2937',
  body: '#374151',
  muted: '#6B7280',
  placeholder: '#9CA3AF',
}

export function colorFor(v: NoteColor) {
  return COLORS.find((c) => c.value === v) ?? COLORS[0]
}

// Deterministic subtle tilt based on note id
export function tiltFor(id: string): number {
  const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return ((code % 7) - 3) * 0.4 // range: -1.2° to 1.2°
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
