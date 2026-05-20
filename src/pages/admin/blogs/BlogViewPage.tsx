/**
 * blogs/BlogViewPage.tsx
 * ─────────────────────────────────────────────────────────────────
 * Read-only article preview for the Blogs admin page.
 * Shown when currentView === 'view'. Displays the full post content
 * alongside a metadata sidebar (status, category, read time, SEO fields).
 *
 * Props:
 *  viewPost   — the post being previewed
 *  currentUser — used to conditionally show delete (destructive) action
 *  onBack     — navigates back to list view
 *  onEdit     — opens this post in the editor
 *  onDelete   — triggers delete confirmation for this post
 */

import type { BlogPost, AdminUser } from '@/types/admin'
import { statusPill } from './statusPill'
import { metaSt } from './styles'

interface BlogViewPageProps {
  viewPost: BlogPost
  currentUser: AdminUser | null
  onBack: () => void
  onEdit: (post: BlogPost) => void
  onDelete: (post: BlogPost) => void
}

export function BlogViewPage({ viewPost, onBack, onEdit, onDelete }: BlogViewPageProps) {
  const metaRowSt: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottom: '1px solid hsl(var(--border))',
    marginBottom: 0,
  }
  const metaLabelSt: React.CSSProperties = { ...metaSt, fontSize: 11, fontWeight: 700 }
  const metaValueSt: React.CSSProperties = {
    fontFamily: "'Public Sans', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    color: 'hsl(var(--on-surface))',
  }

  return (
    <div className="main" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="top" style={{ alignItems: 'flex-start', marginBottom: 0 }}>
        <div>
          {/* Breadcrumb */}
          <div className="crumbs">
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'inherit',
                fontWeight: 700,
                fontSize: 11,
                color: 'hsl(var(--primary))',
              }}
            >
              Editorial
            </button>
            {' · '} Intelligence review
          </div>
          <h2
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 6,
              maxWidth: 600,
              lineHeight: 1.2,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0 }}>
              visibility
            </span>
            {viewPost.title}
          </h2>
        </div>
        <div className="actions">
          <button className="btn btn-outline btn-sm" onClick={onBack}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              arrow_back
            </span>
            Back
          </button>
          <button className="btn btn-primary" onClick={() => onEdit(viewPost)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              edit
            </span>
            Modify dispatch
          </button>
        </div>
      </div>

      {/* main-sidebar layout */}
      <div className="main-sidebar" style={{ alignItems: 'start' }}>
        {/* Article content panel */}
        <div className="panel" style={{ overflow: 'hidden' }}>
          {/* Cover image */}
          {viewPost.imageUrl && (
            <div style={{ height: 300, overflow: 'hidden' }}>
              <img
                src={viewPost.imageUrl}
                crossOrigin="anonymous"
                loading="lazy"
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          <div style={{ padding: '32px 40px' }}>
            {/* Category + date + read time */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 18,
                flexWrap: 'wrap',
              }}
            >
              <span className="pill pill-ok" style={{ fontWeight: 700, fontSize: 11 }}>
                {viewPost.category}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...metaSt }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  calendar_today
                </span>
                {new Date(viewPost.publishedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...metaSt }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  schedule
                </span>
                {viewPost.readTime}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 800,
                fontSize: 30,
                color: 'hsl(var(--on-surface))',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                margin: '0 0 18px',
              }}
            >
              {viewPost.title}
            </h1>

            {/* Excerpt (pull quote style) */}
            {viewPost.excerpt && (
              <div
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: 'hsl(var(--on-surface))',
                  lineHeight: 1.75,
                  fontStyle: 'italic',
                  borderLeft: '4px solid hsl(var(--primary))',
                  paddingLeft: 20,
                  marginBottom: 28,
                  opacity: 0.65,
                }}
              >
                {viewPost.excerpt}
              </div>
            )}

            {/* Author strip */}
            {viewPost.authorName && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 0',
                  borderTop: '1px solid hsl(var(--border))',
                  borderBottom: '1px solid hsl(var(--border))',
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 4,
                    background: 'hsl(var(--primary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {viewPost.authorImage ? (
                    <img
                      src={viewPost.authorImage}
                      crossOrigin="anonymous"
                      loading="lazy"
                      alt={viewPost.authorName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: 15,
                        color: '#fff',
                      }}
                    >
                      {viewPost.authorName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 13,
                      color: 'hsl(var(--on-surface))',
                    }}
                  >
                    {viewPost.authorName}
                  </div>
                  <div style={metaSt}>{viewPost.authorRole || 'Contributor'}</div>
                </div>
              </div>
            )}

            {/* Body HTML from TinyMCE */}
            <div
              className="prose prose-on-surface max-w-none prose-p:text-on-surface/70 prose-p:leading-relaxed prose-p:text-[16px] prose-headings:text-on-surface prose-headings:font-black prose-headings:tracking-tight"
              dangerouslySetInnerHTML={{ __html: viewPost.content }}
            />

            {/* Tags */}
            {viewPost.tags?.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 28,
                  paddingTop: 20,
                  borderTop: '1px solid hsl(var(--border))',
                }}
              >
                {viewPost.tags.map((tag) => (
                  <span key={tag} className="pill pill-mute" style={{ fontSize: 11 }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}
        >
          {/* Post Intelligence metadata */}
          <div className="panel">
            <div className="ph">
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 13.5,
                  color: 'hsl(var(--on-surface))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 15, color: 'hsl(var(--destructive))' }}
                >
                  article
                </span>
                Post Intelligence
              </span>
            </div>
            <div
              style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={metaRowSt}>
                <span style={metaLabelSt}>Status</span>
                {statusPill(viewPost.status)}
              </div>
              <div style={metaRowSt}>
                <span style={metaLabelSt}>Category</span>
                <span style={metaValueSt}>{viewPost.category}</span>
              </div>
              <div style={metaRowSt}>
                <span style={metaLabelSt}>Read time</span>
                <span style={metaValueSt}>{viewPost.readTime}</span>
              </div>
              <div style={metaRowSt}>
                <span style={metaLabelSt}>Published</span>
                <span style={metaValueSt}>
                  {new Date(viewPost.publishedAt).toLocaleDateString()}
                </span>
              </div>
              {viewPost.isFeatured && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <span className="pill pill-ok" style={{ fontSize: 10, fontWeight: 800 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 12, marginRight: 3 }}
                    >
                      star
                    </span>
                    Featured
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SEO data — only shown if fields are set */}
          {(viewPost.metaDescription || viewPost.seoTitle) && (
            <div className="panel">
              <div className="ph">
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 13.5,
                    color: 'hsl(var(--on-surface))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 15, color: 'hsl(var(--primary))' }}
                  >
                    search
                  </span>
                  SEO Data
                </span>
              </div>
              <div
                style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {viewPost.seoTitle && (
                  <div>
                    <div
                      style={{
                        ...metaSt,
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      SEO Title
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 12,
                        color: 'hsl(var(--on-surface))',
                        lineHeight: 1.5,
                      }}
                    >
                      {viewPost.seoTitle}
                    </div>
                  </div>
                )}
                {viewPost.metaDescription && (
                  <div>
                    <div
                      style={{
                        ...metaSt,
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      Meta Description
                    </div>
                    <div
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontWeight: 700,
                        fontSize: 11.5,
                        color: 'hsl(var(--on-surface-muted))',
                        lineHeight: 1.6,
                      }}
                    >
                      {viewPost.metaDescription}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{ justifyContent: 'center' }}
              onClick={() => onEdit(viewPost)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                edit
              </span>
              Edit Post
            </button>
            <button
              className="btn btn-dest btn-sm"
              style={{ justifyContent: 'center' }}
              onClick={() => {
                onBack()
                onDelete(viewPost)
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                delete
              </span>
              Delete Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
