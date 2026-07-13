/**
 * Diaspora display naming
 * -------------------------------------------------------------
 * Public-facing rebrand of "chapters" to "Base Diaspora" communities.
 * Database names, IDs and legacy slugs stay unchanged — these helpers
 * only transform what is shown to users and generate the new URL slugs
 * (with backward-compatible matching for old chapter-name slugs).
 */

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

/** Location extracted from a stored name, e.g. 'TBM Belgium Chapter' or 'Base Diaspora — Belgium' → 'Belgium'. */
export function diasporaLocation(rawName: string): string {
  return (
    rawName
      .replace(/^Base Diaspora\s*[—–-]\s*/i, '')
      .replace(/^TBM\s+/i, '')
      .replace(/\s+Chapter$/i, '')
      .trim() || rawName
  )
}

/** Formal branded label: 'TBM Belgium Chapter' → 'Base Diaspora — Belgium'. */
export function diasporaName(rawName: string): string {
  if (/base diaspora/i.test(rawName)) return rawName
  return `Base Diaspora — ${diasporaLocation(rawName)}`
}

/** Compact label for tight spaces: 'TBM Belgium Chapter' → 'Belgium Diaspora'. */
export function shortDiasporaName(rawName: string): string {
  return `${diasporaLocation(rawName)} Diaspora`
}

/** New URL slug derived from the branded name: 'base-diaspora-belgium'. */
export function diasporaSlug(rawName: string): string {
  return slugify(diasporaName(rawName))
}

/** Legacy slug derived from the raw stored name: 'tbm-belgium-chapter'. */
export function legacyChapterSlug(rawName: string): string {
  return slugify(rawName)
}

/** True when a URL slug refers to this chapter — accepts new, legacy, and pre-rename TBM slugs. */
export function matchesChapterSlug(rawName: string, slug: string | undefined): boolean {
  if (!slug) return false
  return (
    diasporaSlug(rawName) === slug ||
    legacyChapterSlug(rawName) === slug ||
    slugify(`tbm ${diasporaLocation(rawName)} chapter`) === slug
  )
}

/** Public-facing coordinator name — hides internal 'Unassigned' placeholder. */
export function coordinatorDisplayName(leaderName?: string | null): string {
  if (!leaderName || leaderName.trim().toLowerCase() === 'unassigned') {
    return 'Coordinator to be appointed'
  }
  return leaderName
}
