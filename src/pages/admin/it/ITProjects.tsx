/**
 * IT Projects Page Component
 * -------------------------------------------------------------
 * Component for tracking and managing the IT department's projects.
 * Supports Concept, Backlog, Active, and Completed lifecycle stages.
 */

import { useState, useEffect, useCallback } from 'react'
import { StatTile } from '@/components/admin/StatTile'
import { itService } from '@/services/itService'
import { usePageLabel } from '@/contexts/PageLabelContext'
import { useITLayout } from './ITLayoutContext'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'
import type { Project, ProjectStatus } from './projects/types'
import { COLUMNS } from './projects/types'
import { ProjectCard } from './projects/ProjectCard'
import { ProjectModal } from './projects/ProjectModal'

// Main projects board page component
export default function ITProjects() {
  const { setCurrentLabel } = usePageLabel()
  const isMobile = useIsMobile()

  useEffect(() => {
    setCurrentLabel('IT Projects')
  }, [setCurrentLabel])

  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Project | null>(null)
  const [mobileFilter, setMobileFilter] = useState<ProjectStatus | 'all'>('all')

  useITLayout(
    'IT Projects',
    'folder_open',
    'Track ongoing and completed IT department projects.',
    <button className="btn btn-primary btn-sm" onClick={() => setCreateOpen(true)}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
        add
      </span>
      Create project
    </button>
  )

  // Fetch projects and resolve creator names from users table
  const load = useCallback(async () => {
    try {
      const data = await itService.getProjects()
      setProjects(data.map((p) => ({ ...p, status: p.status as ProjectStatus })))
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      load()
    }, 0)
    return () => clearTimeout(timer)
  }, [load])

  // Move project status inside the lifecycle stages
  async function handleStatusChange(id: string, status: ProjectStatus) {
    try {
      await itService.updateProjectStatus(id, status)
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
    } catch {
      toast.error('Failed to update status')
    }
  }

  // Delete project from database and state
  async function handleDelete(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return
    try {
      await itService.deleteProject(id)
      toast.success('Project deleted')
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast.error('Failed to delete project')
    }
  }

  return (
    <div>
      {/* KPI strip */}
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {COLUMNS.map((c) => {
          const count = projects.filter((p) => p.status === c.status).length
          return (
            <StatTile
              key={c.status}
              label={c.label}
              value={loading ? '—' : count}
              bar={c.bar}
              compact
            />
          )
        })}
      </div>

      {/* Mobile filter */}
      {isMobile && (
        <div style={{ marginBottom: 16 }}>
          <select
            value={mobileFilter}
            onChange={(e) => setMobileFilter(e.target.value as ProjectStatus | 'all')}
            style={{
              width: '100%',
              height: 38,
              padding: '0 12px',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-sm)',
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 12,
              color: 'hsl(var(--on-surface))',
              background: 'hsl(var(--background))',
              boxSizing: 'border-box',
            }}
          >
            <option value="all">All ({projects.length})</option>
            {COLUMNS.map((c) => (
              <option key={c.status} value={c.status}>
                {c.label} ({projects.filter((p) => p.status === c.status).length})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Kanban — 4 columns desktop / single filtered list mobile */}
      <div
        style={
          isMobile
            ? { display: 'flex', flexDirection: 'column', gap: 10 }
            : {
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16,
                alignItems: 'start',
              }
        }
      >
        {COLUMNS.filter(
          (col) => !isMobile || mobileFilter === 'all' || mobileFilter === col.status
        ).map((col) => {
          const colProjects = projects.filter((p) => p.status === col.status)
          return (
            <div key={col.status}>
              {/* Column header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 12,
                  padding: '0 2px',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 15, color: col.bar }}
                >
                  {col.icon}
                </span>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  {col.label}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    color: 'hsl(var(--on-surface-muted))',
                    background: 'hsl(var(--container-low))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius-pill)',
                    padding: '0 6px',
                  }}
                >
                  {colProjects.length}
                </span>
              </div>

              {/* Drop zone */}
              <div
                style={{
                  minHeight: 80,
                  background: 'hsl(var(--container-low))',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px dashed hsl(var(--border))',
                  padding: 8,
                }}
              >
                {loading ? (
                  <div
                    style={{
                      height: 60,
                      borderRadius: 'var(--radius-sm)',
                      background: 'hsl(var(--border))',
                      opacity: 0.4,
                    }}
                  />
                ) : colProjects.length === 0 ? (
                  <p
                    style={{
                      textAlign: 'center',
                      color: 'hsl(var(--on-surface-muted))',
                      fontSize: 11,
                      margin: '24px 0',
                      fontFamily: "'Public Sans', sans-serif",
                    }}
                  >
                    No {col.label.toLowerCase()} projects
                  </p>
                ) : (
                  colProjects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onEdit={() => setEditTarget(p)}
                      onDelete={() => handleDelete(p.id)}
                      onStatusChange={(next) => handleStatusChange(p.id, next)}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {createOpen && (
        <ProjectModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false)
            load()
          }}
        />
      )}

      {editTarget && (
        <ProjectModal
          editing={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null)
            load()
          }}
        />
      )}
    </div>
  )
}
