/**
 * polls/statusPill.tsx
 * ─────────────────────────────────────────────────────────────────
 * Helper function that returns a styled status pill JSX element
 * for a given poll status string.
 *
 * Status → Pill class:
 *  'Active'  → .pill.pill-ok   (green)
 *  'Draft'   → .pill.pill-warn (amber)
 *  anything else → .pill.pill-mute (grey)
 *
 * Usage: {statusPill(poll.status)}
 */

export function statusPill(status: string) {
  if (status === 'Active') return <span className="pill pill-ok">{status}</span>
  if (status === 'Draft')  return <span className="pill pill-warn">{status}</span>
  return <span className="pill pill-mute">{status}</span>
}
