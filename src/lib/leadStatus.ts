/**
 * Chapter/constituency "verified" status is derived from whether a lead is
 * appointed, not a manually-set field — appointing a lead is the automation
 * trigger, not an admin toggle.
 */
export function isChapterVerified(chapter: {
  leader_id?: string | null
  leader_name?: string | null
}): boolean {
  return !!(chapter.leader_id || (chapter.leader_name && chapter.leader_name !== 'Unassigned'))
}

export function isConstituencyVerified(c: {
  leaderId?: string | null
  leaderName?: string | null
}): boolean {
  return !!(c.leaderId || c.leaderName)
}
