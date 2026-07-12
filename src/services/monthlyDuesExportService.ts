import { supabase } from '@/lib/supabase'

/**
 * Client side of the server-authorized dues exports. CSV comes back from
 * the export-monthly-dues edge function verbatim; PDF is rendered locally
 * with the already-installed jsPDF + autotable from the same whitelisted
 * server rows, so both formats carry identical, minimal data.
 */

export interface DuesExportFilters {
  status?: string
  duesMonth?: string
  paymentMode?: string
}

type ExportScope = 'member' | 'finance'

async function fetchExport(
  scope: ExportScope,
  format: 'csv' | 'json',
  filters?: DuesExportFilters
): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke('export-monthly-dues', {
    body: { scope, format, filters },
  })
  if (error) throw error
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(String((data as { error: unknown }).error))
  }
  return data
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function downloadCsv(scope: ExportScope, filters?: DuesExportFilters) {
  const data = await fetchExport(scope, 'csv', filters)
  const csv = typeof data === 'string' ? data : String(data)
  downloadBlob(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    `monthly-dues-${scope}-${new Date().toISOString().slice(0, 10)}.csv`
  )
}

async function downloadPdf(scope: ExportScope, title: string, filters?: DuesExportFilters) {
  const data = (await fetchExport(scope, 'json', filters)) as {
    rows: Record<string, string>[]
  }
  const rows = data?.rows ?? []
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new JsPDF({ orientation: 'landscape' })
  doc.setFontSize(13)
  doc.text(title, 14, 16)
  doc.setFontSize(9)
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB')} · The Base Movement`, 14, 22)
  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  autoTable(doc, {
    startY: 28,
    head: [columns],
    body: rows.map((row) => columns.map((c) => row[c] ?? '')),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 107, 63] },
  })
  doc.save(`monthly-dues-${scope}-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export const monthlyDuesExportService = {
  /** The signed-in member's own dues history. */
  exportMemberCsv: () => downloadCsv('member'),
  exportMemberPdf: () => downloadPdf('member', 'My Monthly Dues Statement'),

  /** Finance exports honour the currently applied filters. */
  exportFinanceCsv: (filters?: DuesExportFilters) => downloadCsv('finance', filters),
  exportFinancePdf: (filters?: DuesExportFilters) =>
    downloadPdf('finance', 'Monthly Dues — Finance Report', filters),
}
