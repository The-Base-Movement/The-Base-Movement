import { useEffect } from 'react'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'

const GRAPHIFY_DOCS_PATH = '/docs/graphify-site/graph.html'

export default function ITBrain() {
  const { setCurrentLabel } = usePageLabel()

  useEffect(() => {
    setCurrentLabel('Brain')
  }, [setCurrentLabel])

  useITLayout('Brain', 'neurology', 'Graphify knowledge graph for the project codebase.')

  return (
    <div>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Graph Nodes', value: '7,921', icon: 'hub', bar: 'hsl(var(--primary))' },
          { label: 'Edges', value: '11,819', icon: 'account_tree', bar: 'hsl(var(--accent))' },
          { label: 'Communities', value: '544', icon: 'schema', bar: 'hsl(var(--on-surface))' },
          {
            label: 'Files Indexed',
            value: '1,205',
            icon: 'data_object',
            bar: 'hsl(var(--destructive))',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="panel"
            style={{ padding: '16px 18px 16px 22px', position: 'relative', overflow: 'hidden' }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                background: item.bar,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p
                  style={{
                    margin: '0 0 8px',
                    fontSize: 10,
                    fontWeight: 'var(--font-weight-medium, 500)',
                    textTransform: 'uppercase',
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 'var(--kpi-num-size)',
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface))',
                    lineHeight: 1,
                  }}
                >
                  {item.value}
                </p>
              </div>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 24, color: 'hsl(var(--on-surface-muted))' }}
              >
                {item.icon}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="ph" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 'var(--font-weight-medium, 500)' }}>
            Project Brain
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'hsl(var(--on-surface-muted))' }}>
            Graphify was moved out of the main production site. Open the static export from docs or
            publish it on a dedicated subdomain before linking it here again.
          </p>
          <a
            className="btn btn-outline btn-sm"
            href={GRAPHIFY_DOCS_PATH}
            target="_blank"
            rel="noreferrer"
            style={{ width: 'fit-content', marginTop: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              open_in_new
            </span>
            Open Docs Copy
          </a>
        </div>
      </div>
    </div>
  )
}
