export interface HierarchyRow {
  id: string
  user_id: string
  reports_to: string | null
  role_title: string
  full_name: string
  avatar_url?: string | null
}

export interface TreeNode extends HierarchyRow {
  children: TreeNode[]
}

export interface AdminCandidate {
  id: string
  full_name: string
  role: string
  avatar_url?: string | null
}

export function buildTree(rows: HierarchyRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  rows.forEach((r) => map.set(r.user_id, { ...r, children: [] }))
  const roots: TreeNode[] = []
  rows.forEach((r) => {
    const node = map.get(r.user_id)!
    if (r.reports_to && map.has(r.reports_to)) {
      map.get(r.reports_to)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

export const INPUT_ST: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-sm)',
  fontFamily: "'Public Sans', sans-serif",
  fontWeight: 'var(--font-weight-medium, 500)',
  fontSize: 13,
  color: 'hsl(var(--on-surface))',
  background: 'hsl(var(--background))',
  boxSizing: 'border-box',
  outline: 'none',
}
