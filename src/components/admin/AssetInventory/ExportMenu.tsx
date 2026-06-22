/**
 * ExportMenu Component
 * -------------------------------------------------------------
 * Provides an interactive dropdown containing action triggers to download
 * the current asset list in comma-separated values (CSV) format or PDF format.
 */

import { useState } from 'react'
import type { Asset } from './types'

interface Props {
  assets: Asset[]
}

const HEADERS = [
  'Asset Tag',
  'Name',
  'Category',
  'Department',
  'Condition',
  'Serial Number',
  'Status',
  'Assigned To',
  'Purchase Price',
  'Purchase Date',
]

/**
 * assetToRow
 * -------------------------------------------------------------
 * Utility to map an Asset object to an array of raw strings.
 */
function assetToRow(a: Asset): string[] {
  return [
    a.asset_tag ?? '',
    a.name,
    a.category_name,
    a.department_id,
    a.condition,
    a.serial_number ?? '',
    a.assigned_to_name ? 'Assigned' : 'Available',
    a.assigned_to_name ?? '',
    a.purchase_price != null ? `$${a.purchase_price.toFixed(2)}` : '',
    a.purchase_date ?? '',
  ]
}

/**
 * exportCSV
 * -------------------------------------------------------------
 * Formats asset array into a CSV file string and triggers download in browser.
 */
function exportCSV(assets: Asset[]) {
  const rows = [HEADERS, ...assets.map(assetToRow)]
  const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `asset-inventory-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * exportPDF
 * -------------------------------------------------------------
 * Renders a tabular landscape document of the asset data and triggers browser PDF save.
 */
async function exportPDF(assets: Asset[]) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(14)
  doc.text('Asset Inventory Report', 14, 16)
  doc.setFontSize(9)
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    14,
    22
  )
  autoTable(doc, {
    head: [HEADERS],
    body: assets.map(assetToRow),
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 107, 63] },
  })
  doc.save(`asset-inventory-${new Date().toISOString().slice(0, 10)}.pdf`)
}

/**
 * ExportMenu
 * -------------------------------------------------------------
 * Main export dropdown component with options to choose between CSV and PDF.
 */
export function ExportMenu({ assets }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn btn-outline btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
          download
        </span>
        Export
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          expand_more
        </span>
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 4px)',
              zIndex: 50,
              background: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-md)',
              minWidth: 140,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            <button
              className="btn btn-ghost"
              style={{
                width: '100%',
                padding: '9px 14px',
                textAlign: 'left',
                fontSize: 13,
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onClick={() => {
                setOpen(false)
                exportCSV(assets)
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                table_view
              </span>
              Export CSV
            </button>
            <button
              className="btn btn-ghost"
              style={{
                width: '100%',
                padding: '9px 14px',
                textAlign: 'left',
                fontSize: 13,
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onClick={() => {
                setOpen(false)
                exportPDF(assets)
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                picture_as_pdf
              </span>
              Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
