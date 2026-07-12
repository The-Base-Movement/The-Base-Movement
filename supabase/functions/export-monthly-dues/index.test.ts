import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { buildDuesCsv, resolveExportScope, sanitizeCsvCell, toExportRow } from './index.ts'

const payment = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  member_id: 'user-a',
  dues_month: '2026-02-01',
  due_date: '2026-02-28',
  amount_ghs: 50,
  display_amount: 4.25,
  display_currency: 'USD',
  payment_mode: 'manual_hubtel',
  status: 'paid',
  receipt_number: 'PAY00001',
  paid_at: '2026-02-10T00:00:00Z',
  // Fields that must never reach an export:
  national_id: 'GHA-123456789-0',
  verification_notes: 'internal note',
  users: { full_name: 'Jane Patriot', registration_number: 'TBM-GH-260001', email: 'j@x.com' },
}

Deno.test('member exports are always scoped to the caller', () => {
  assertEquals(resolveExportScope('user-a', false, 'member'), {
    ok: true,
    scope: 'member',
    memberId: 'user-a',
  })
})

Deno.test('finance exports require the finance permission', () => {
  assertEquals(resolveExportScope('user-a', false, 'finance').ok, false)
  assertEquals(resolveExportScope('admin-1', true, 'finance'), {
    ok: true,
    scope: 'finance',
    memberId: null,
  })
})

Deno.test('unknown scopes are rejected', () => {
  assertEquals(resolveExportScope('user-a', true, 'everything').ok, false)
})

Deno.test('CSV cells are formula-injection safe', () => {
  assertEquals(sanitizeCsvCell('=SUM(A1:A9)'), "'=SUM(A1:A9)")
  assertEquals(sanitizeCsvCell('+233241234567'), "'+233241234567")
  assertEquals(sanitizeCsvCell('-50'), "'-50")
  assertEquals(sanitizeCsvCell('@import'), "'@import")
  assertEquals(sanitizeCsvCell('\tx'), "'\tx")
  assertEquals(sanitizeCsvCell('safe'), 'safe')
})

Deno.test('export rows carry stable columns with local and GHS amounts', () => {
  const row = toExportRow(payment, 'finance')
  assertEquals(row['Month'], '2026-02')
  assertEquals(row['Type'], 'Monthly Dues')
  assertEquals(row['Local Amount'], '4.25')
  assertEquals(row['Currency'], 'USD')
  assertEquals(row['GHS Amount'], '50.00')
  assertEquals(row['Status'], 'paid')
  assertEquals(row['Method'], 'Hubtel')
  assertEquals(row['Reference'], '123E4567')
  assertEquals(row['Receipt'], 'PAY00001')
  assertEquals(row['Member'], 'Jane Patriot')
  assertEquals(row['Reg No'], 'TBM-GH-260001')
})

Deno.test('member rows exclude member-identity columns', () => {
  const row = toExportRow(payment, 'member')
  assertEquals('Member' in row, false)
  assertEquals('Reg No' in row, false)
})

Deno.test('exports never contain national id, notes, or email', () => {
  const csv = buildDuesCsv([payment], 'finance')
  assertEquals(csv.includes('GHA-123456789-0'), false)
  assertEquals(csv.includes('internal note'), false)
  assertEquals(csv.includes('j@x.com'), false)
  assertStringIncludes(csv, 'Jane Patriot')
})

Deno.test('CSV has a stable header and quoted cells', () => {
  const csv = buildDuesCsv([payment], 'member')
  const [header, first] = csv.split('\n')
  assertEquals(
    header,
    '"Month","Type","Local Amount","Currency","GHS Amount","Status","Method","Reference","Receipt"'
  )
  assertStringIncludes(first, '"2026-02"')
  assertStringIncludes(first, '"50.00"')
})
