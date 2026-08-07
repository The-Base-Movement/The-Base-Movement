/**
 * Shared CSV download helper — used by the member directory export and the
 * chapter / constituency hub exports so all three produce identical formatting.
 */
export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const escape = (cell: unknown) => `"${String(cell ?? '').replace(/"/g, '""')}"`
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join(
    '\n'
  )
  // BOM keeps accented names readable when the file is opened in Excel.
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
