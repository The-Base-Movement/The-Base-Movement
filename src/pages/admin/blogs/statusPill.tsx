/**
 * blogs/statusPill.tsx
 * ─────────────────────────────────────────────────────────────────
 * Renders a color-coded pill for a blog post status string.
 *
 * Published          → pill-ok  (green)
 * Pending Verification → pill-warn (yellow)
 * anything else      → pill-mute (grey)
 */

export function statusPill(status: string) {
  if (status === 'Published') return <span className="pill pill-ok">{status}</span>
  if (status === 'Pending Verification') return <span className="pill pill-warn">Pending</span>
  return <span className="pill pill-mute">{status}</span>
}
