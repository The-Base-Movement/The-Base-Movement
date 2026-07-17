import type { InventoryItem } from '@/services/adminService'
import { SortToggle } from '@/components/ui/SortToggle'

interface InventoryTableProps {
  products: InventoryItem[]
  sortedAndFilteredProducts: InventoryItem[]
  categories: string[]
  activeCategory: string
  setActiveCategory: (cat: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  handleSort: (key: keyof InventoryItem) => void
  sortConfig: { key: keyof InventoryItem; direction: 'asc' | 'desc' } | null
  handleOpenModal: (product?: InventoryItem) => void
  setDeleteConfirm: (confirm: { id: string; name: string } | null) => void
  isDeleting: string | null
}

function statusPill(status: string) {
  if (status === 'Critical') return 'pill pill-err'
  if (status === 'Low Stock') return 'pill pill-warn'
  if (status === 'Processing') return 'pill pill-mute'
  return 'pill pill-ok'
}

function SortIcon({
  col,
  sortConfig,
}: {
  col: keyof InventoryItem
  sortConfig: InventoryTableProps['sortConfig']
}) {
  if (sortConfig?.key !== col)
    return (
      <span className="material-symbols-outlined" style={{ fontSize: 13, opacity: 0.4 }}>
        unfold_more
      </span>
    )
  return (
    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
      {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
    </span>
  )
}

export function InventoryTable({
  products,
  sortedAndFilteredProducts,
  categories,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  handleSort,
  sortConfig,
  handleOpenModal,
  setDeleteConfirm,
  isDeleting,
}: InventoryTableProps) {
  const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 9.5,
    fontWeight: 'var(--font-weight-medium, 500)',
    color: 'hsl(var(--on-surface-muted))',
    letterSpacing: '.06em',
    textTransform: 'uppercase',
    fontFamily: "'Public Sans', sans-serif",
    background: 'hsl(var(--container-low))',
    borderBottom: '1px solid hsl(var(--border))',
    textAlign: 'left' as const,
    whiteSpace: 'nowrap' as const,
  }

  return (
    <div className="panel">
      {/* Row 1: title */}
      <div className="ph" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3>Inventory</h3>
          <span className="meta">
            {sortedAndFilteredProducts.length} of {products.length} items
          </span>
        </div>
        <img
          src="/branding/icons/movement-arrow.png"
          alt=""
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            height: '120%',
            opacity: 0.12,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      </div>

      {/* Row 2: filter controls — categories scroll + search */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          background: 'hsl(var(--container-low))',
        }}
      >
        {/* Category pills — horizontally scrollable strip */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            overflowX: 'auto',
            paddingBottom: 2,
            flex: '1 1 340px',
            minWidth: 0,
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '5px 11px',
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                background: activeCategory === cat ? 'hsl(var(--primary))' : '#fff',
                color: activeCategory === cat ? '#fff' : 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10.5,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Search — full width */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 9,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
                color: 'hsl(var(--on-surface-muted))',
                pointerEvents: 'none',
              }}
            >
              search
            </span>
            <input
              name="searchQuery"
              id="input-b1aa13"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              style={{
                width: '100%',
                height: 34,
                paddingLeft: 30,
                paddingRight: 12,
                border: '1px solid hsl(var(--border))',
                borderRadius: 4,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 12,
                outline: 'none',
                background: 'hsl(var(--card))',
                color: 'hsl(var(--on-surface))',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <SortToggle
            value={sortConfig?.key === 'name' ? sortConfig.direction : 'asc'}
            onChange={() => handleSort('name')}
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="desktop-only" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Product</th>
              <th style={thStyle}>Category</th>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('price')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Price <SortIcon col="price" sortConfig={sortConfig} />
                </span>
              </th>
              <th
                style={{ ...thStyle, cursor: 'pointer', textAlign: 'center' }}
                onClick={() => handleSort('stock')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  In stock <SortIcon col="stock" sortConfig={sortConfig} />
                </span>
              </th>
              <th style={{ ...thStyle, cursor: 'pointer' }} onClick={() => handleSort('status')}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Status <SortIcon col="status" sortConfig={sortConfig} />
                </span>
              </th>
              <th style={{ ...thStyle, textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredProducts.map((product) => (
              <tr
                key={product.id}
                style={{ borderBottom: '1px solid hsl(var(--border))' }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = 'hsl(var(--container-low))')
                }
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
              >
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        border: '1px solid hsl(var(--border))',
                        overflow: 'hidden',
                        background: 'hsl(var(--container-low))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {product.image?.startsWith('http') ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          decoding="async"
                          loading="lazy"
                        />
                      ) : (
                        <span>{product.image}</span>
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 12.5,
                          color: 'hsl(var(--on-surface))',
                        }}
                      >
                        {product.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontWeight: 'var(--font-weight-medium, 500)',
                          fontSize: 10,
                          color: 'hsl(var(--on-surface-muted))',
                          marginTop: 2,
                        }}
                      >
                        #ITM-{product.id.substring(0, 6)}
                      </div>
                    </div>
                  </div>
                </td>
                <td
                  style={{
                    padding: '12px 14px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  {product.category}
                </td>
                <td
                  style={{
                    padding: '12px 14px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12.5,
                  }}
                >
                  {product.price}
                </td>
                <td
                  style={{
                    padding: '12px 14px',
                    textAlign: 'center',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 12.5,
                    color:
                      product.stock === 0
                        ? 'hsl(var(--destructive))'
                        : product.stock < 50
                          ? 'hsl(var(--accent))'
                          : 'hsl(var(--on-surface))',
                  }}
                >
                  {product.stock.toLocaleString()}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span className={statusPill(product.status)}>{product.status}</span>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={() => handleOpenModal(product)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        edit
                      </span>
                      Edit
                    </button>
                    <button
                      className="btn btn-dest btn-sm"
                      disabled={isDeleting === product.id}
                      onClick={() => setDeleteConfirm({ id: product.id, name: product.name })}
                    >
                      {isDeleting === product.id ? (
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 14, animation: 'spin 1s linear infinite' }}
                        >
                          refresh
                        </span>
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                          delete
                        </span>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-only">
        {sortedAndFilteredProducts.map((product) => (
          <div
            key={product.id}
            style={{ padding: '14px 16px', borderBottom: '1px solid hsl(var(--border))' }}
          >
            {/* Row 1: image + name + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 4,
                  border: '1px solid hsl(var(--border))',
                  overflow: 'hidden',
                  background: 'hsl(var(--container-low))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  flexShrink: 0,
                }}
              >
                {product.image?.startsWith('http') ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    decoding="async"
                    loading="lazy"
                  />
                ) : (
                  <span>{product.image}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13.5,
                    color: 'hsl(var(--on-surface))',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {product.name}
                </p>
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'hsl(var(--on-surface-muted))',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                  }}
                >
                  {product.category} · #ITM-{product.id.substring(0, 6)}
                </span>
              </div>
              <span className={statusPill(product.status)} style={{ flexShrink: 0 }}>
                {product.status}
              </span>
            </div>

            {/* Row 2: price + stock */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              <div
                style={{
                  padding: '8px 12px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    marginBottom: 3,
                  }}
                >
                  Price
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                  }}
                >
                  {product.price}
                </div>
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    color: 'hsl(var(--on-surface-muted))',
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    marginBottom: 3,
                  }}
                >
                  In stock
                </div>
                <div
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    color:
                      product.stock === 0
                        ? 'hsl(var(--destructive))'
                        : product.stock < 50
                          ? 'hsl(var(--accent))'
                          : 'hsl(var(--on-surface))',
                  }}
                >
                  {product.stock.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Row 3: actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                className="btn btn-accent btn-sm"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                }}
                onClick={() => handleOpenModal(product)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  edit
                </span>
                Edit item
              </button>
              <button
                className="btn btn-dest btn-sm"
                onClick={() => setDeleteConfirm({ id: product.id, name: product.name })}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  delete
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer legend */}
      <div
        style={{
          padding: '10px 18px',
          borderTop: '1px solid hsl(var(--border))',
          background: 'hsl(var(--container-low))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            {
              label: 'Stable',
              count: products.filter((p) => p.status === 'Stable').length,
              color: 'hsl(var(--primary))',
            },
            {
              label: 'Low stock',
              count: products.filter((p) => p.status === 'Low Stock').length,
              color: 'hsl(var(--accent))',
            },
            {
              label: 'Critical',
              count: products.filter((p) => p.status === 'Critical').length,
              color: 'hsl(var(--destructive))',
            },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 10.5,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                {label}: {count}
              </span>
            </div>
          ))}
        </div>
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 'var(--font-weight-medium, 500)',
            fontSize: 10.5,
            color: 'hsl(var(--on-surface-muted))',
          }}
        >
          Showing {sortedAndFilteredProducts.length} of {products.length} items
        </span>
      </div>
    </div>
  )
}
