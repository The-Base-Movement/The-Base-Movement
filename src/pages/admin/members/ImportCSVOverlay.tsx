import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { adminService } from '@/services/adminService'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { User } from '@/types/admin'

interface ImportCSVOverlayProps {
  onClose: () => void
  onSuccess: () => void
}

interface ParsedRecord {
  rowNumber: number
  data: Partial<User>
  errors: string[]
  isValid: boolean
}

const REQUIRED_FIELDS: (keyof User)[] = ['full_name', 'phone_number', 'gender', 'age_range']

const HEADER_MAP: Record<string, keyof User> = {
  // Name
  fullname: 'full_name',
  name: 'full_name',
  full_name: 'full_name',
  // Phone
  phone: 'phone_number',
  phonenumber: 'phone_number',
  contactnumber: 'phone_number',
  phone_number: 'phone_number',
  // Gender
  gender: 'gender',
  sex: 'gender',
  // Age
  age: 'age_range',
  agerange: 'age_range',
  age_range: 'age_range',
  // Region / Constituency (Ghana)
  region: 'region',
  constituency: 'constituency',
  // Chapter
  chapter: 'chapter',
  // Profession
  profession: 'profession',
  occupation: 'profession',
  job: 'profession',
  // Email
  email: 'email',
  emailaddress: 'email',
  email_address: 'email',
  // Education
  education: 'education_level',
  educationlevel: 'education_level',
  education_level: 'education_level',
  // Emergency contact
  emergencyname: 'emergency_name',
  emergencycontact: 'emergency_name',
  emergencycontactname: 'emergency_name',
  emergency_name: 'emergency_name',
  emergencyrelationship: 'emergency_relationship',
  emergency_relationship: 'emergency_relationship',
  emergencyphone: 'emergency_phone',
  emergencynumber: 'emergency_phone',
  emergency_phone: 'emergency_phone',
  // Address
  residentialaddress: 'residential_address',
  address: 'residential_address',
  residential_address: 'residential_address',
  city: 'city',
  // National ID
  nationalid: 'national_id',
  national_id: 'national_id',
  idnumber: 'national_id',
  // Children
  children: 'children_count',
  childrencount: 'children_count',
  children_count: 'children_count',
  // Referral
  referredby: 'referred_by',
  referred_by: 'referred_by',
  referral: 'referred_by',
}

const CSV_TEMPLATE_HEADERS = [
  'Full Name',
  'Phone Number',
  'Gender',
  'Age Range',
  'Region',
  'Constituency',
  'Chapter',
  'Profession',
  'Email',
  'Education Level',
  'Emergency Contact Name',
  'Emergency Relationship',
  'Emergency Phone',
  'National ID',
  'Residential Address',
  'City',
  'Children Count',
  'Referred By',
]

const CSV_SAMPLE_ROW = [
  'John Doe',
  '+233240000000',
  'Male',
  '26-40',
  'Greater Accra',
  'Ayawaso West',
  'Legon Patriots',
  'Engineer',
  'johndoe@example.com',
  "Bachelor's Degree",
  'Mary Doe',
  'Spouse',
  '+233241111111',
  'GHA-1234567890',
  'East Legon',
  'Accra',
  '2',
  '',
]

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[\s_-]/g, '')

function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let row: string[] = ['']
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push('')
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++
      lines.push(row)
      row = ['']
    } else {
      row[row.length - 1] += char
    }
  }
  if (row.length > 1 || row[0] !== '') lines.push(row)
  return lines.filter((r) => r.some((cell) => cell.trim() !== ''))
}

export function ImportCSVOverlay({ onClose, onSuccess }: ImportCSVOverlayProps) {
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = () => {
    const csvContent = [CSV_TEMPLATE_HEADERS.join(','), CSV_SAMPLE_ROW.join(',')].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'ghana_registration_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Template downloaded.')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setIsParsing(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const rows = parseCSV(text)

        if (rows.length < 2) {
          toast.error('CSV is empty or missing data rows.')
          setIsParsing(false)
          return
        }

        const headers = rows[0].map((h) => normalizeHeader(h.trim()))
        const dataRows = rows.slice(1)

        const records: ParsedRecord[] = dataRows.map((row, index) => {
          const rowNumber = index + 2
          const recordData: Partial<User> = {}
          const errors: string[] = []

          headers.forEach((header, colIndex) => {
            const field = HEADER_MAP[header]
            if (!field) return
            const val = row[colIndex]?.trim()
            if (!val) return

            if (field === 'children_count') {
              const n = parseInt(val, 10)
              recordData.children_count = isNaN(n) ? 0 : n
            } else {
              recordData[field] = val as never
            }
          })

          REQUIRED_FIELDS.forEach((field) => {
            if (!recordData[field]) {
              errors.push(`Missing: ${String(field).replace(/_/g, ' ')}`)
            }
          })

          if (recordData.gender) {
            const g = recordData.gender.toLowerCase()
            if (g === 'm' || g === 'male') recordData.gender = 'Male'
            else if (g === 'f' || g === 'female') recordData.gender = 'Female'
            else errors.push(`Invalid gender: "${recordData.gender}". Use Male or Female.`)
          }

          return { rowNumber, data: recordData, errors, isValid: errors.length === 0 }
        })

        setParsedRecords(records)
      } catch (err) {
        console.error('[CSV IMPORT] Parse error:', err)
        toast.error('Failed to parse CSV. Check the file format.')
      } finally {
        setIsParsing(false)
      }
    }
    reader.readAsText(file)
  }

  const MAX_IMPORT_ROWS = 2000

  const handleImportSubmit = async () => {
    const validRecords = parsedRecords.filter((r) => r.isValid)
    if (validRecords.length === 0) {
      toast.error('No valid records to import.')
      return
    }
    if (validRecords.length > MAX_IMPORT_ROWS) {
      toast.error(
        `Too many records. Maximum per import is ${MAX_IMPORT_ROWS.toLocaleString()}. This file has ${validRecords.length.toLocaleString()} valid rows — split it into smaller files.`
      )
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    try {
      const yearStr = new Date().getFullYear().toString().slice(-2)
      const usersToInsert: User[] = validRecords.map((record, index) => {
        const platform = record.data.region ? 'GHANA' : 'DIASPORA'
        const baseNum = Math.floor(1000 + Math.random() * 9000)
        const suffix = String((baseNum + index) % 10000).padStart(4, '0')
        const regNo = `TBM-${platform === 'GHANA' ? 'GH' : 'DI'}-${yearStr}${suffix}`

        return {
          id: crypto.randomUUID(),
          full_name: record.data.full_name!,
          phone_number: record.data.phone_number!,
          gender: record.data.gender!,
          age_range: record.data.age_range!,
          registration_number: regNo,
          platform,
          country: platform === 'GHANA' ? 'Ghana' : record.data.country || 'Unknown',
          region: record.data.region || '',
          constituency: record.data.constituency || '',
          chapter: record.data.chapter || '',
          profession: record.data.profession || 'Patriot',
          email: record.data.email || null,
          education_level: record.data.education_level || '',
          emergency_name: record.data.emergency_name || '',
          emergency_relationship: record.data.emergency_relationship || '',
          emergency_phone: record.data.emergency_phone || '',
          national_id: record.data.national_id || '',
          residential_address: record.data.residential_address || '',
          city: record.data.city || '',
          children_count: record.data.children_count ?? 0,
          referred_by: record.data.referred_by || '',
          avatar_url: null,
          joined_at: new Date().toISOString(),
          status: 'Pending',
          verification_status: 'In Review',
          registration_source: 'physical_form',
        }
      })

      const chunkSize = 50
      const totalChunks = Math.ceil(usersToInsert.length / chunkSize)
      let totalInserted = 0
      let totalSkipped = 0

      for (let i = 0; i < usersToInsert.length; i += chunkSize) {
        const chunk = usersToInsert.slice(i, i + chunkSize)
        const chunkNum = Math.floor(i / chunkSize) + 1
        const { inserted, skipped, error } = await adminService.bulkRegisterMembers(chunk)
        if (error) throw error
        totalInserted += inserted
        totalSkipped += skipped
        setImportProgress(Math.round((chunkNum / totalChunks) * 100))
      }

      // Provision Auth accounts and send passwords via Edge Function
      if (totalInserted > 0) {
        try {
          const { data: authResult, error: authFuncError } = await supabase.functions.invoke(
            'create-csv-member-accounts',
            {
              body: {
                members: usersToInsert.map((u) => ({
                  reg_no: u.registration_number,
                  phone: u.phone_number,
                  name: u.full_name,
                  email: u.email || undefined,
                })),
              },
            }
          )

          if (authFuncError) {
            console.warn('[CSV-IMPORT-AUTH-ERROR] Edge function failed:', authFuncError)
            toast.warning(
              'CSV profiles imported, but automatic account provisioning failed. Please reset passwords manually.'
            )
          } else if (authResult) {
            const { created, skipped, failed, failedUsers } = authResult
            console.warn(
              `[CSV-IMPORT-AUTH-SUCCESS] Accounts: ${created} created, ${skipped} skipped, ${failed} failed.`
            )
            if (failedUsers && failedUsers.length > 0) {
              console.error('[CSV-IMPORT-FAILURES] Details:', failedUsers)
            }
          }
        } catch (authErr) {
          console.warn('[CSV-IMPORT-AUTH-EXCEPTION] Failed to call Edge Function:', authErr)
        }
      }

      const skipNote =
        totalSkipped > 0 ? ` (${totalSkipped} skipped — phone number already registered)` : ''
      toast.success(`${totalInserted} member${totalInserted !== 1 ? 's' : ''} imported.${skipNote}`)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error('[CSV IMPORT] Import error:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to import members.')
    } finally {
      setIsImporting(false)
    }
  }

  const validCount = parsedRecords.filter((r) => r.isValid).length
  const invalidCount = parsedRecords.filter((r) => !r.isValid).length

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        background: 'rgba(15,19,16,.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={isImporting ? undefined : onClose}
    >
      <div
        className="panel"
        style={{
          maxWidth: 860,
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          margin: '0 auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ph" style={{ padding: '20px 24px', background: 'hsl(var(--on-surface))' }}>
          <div>
            <h2
              style={{
                color: '#fff',
                fontSize: 20,
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
              }}
            >
              Import Physical Registration Forms
            </h2>
            <div
              style={{
                color: 'hsl(var(--accent))',
                marginTop: 3,
                fontSize: 12,
                fontWeight: 'var(--font-weight-normal, 400)' as React.CSSProperties['fontWeight'],
              }}
            >
              Ghana Network · CSV batch import
            </div>
          </div>
          <button
            onClick={onClose}
            className="ico"
            style={{
              background: 'rgba(255,255,255,0.1)',
              borderColor: 'transparent',
              color: '#fff',
            }}
            disabled={isImporting}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="csv-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Instructions banner — always visible, top of body */}
          <div
            style={{
              background: 'hsl(var(--container-low))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 6,
              padding: '16px 20px',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{
                    fontWeight: 'var(--font-weight-medium, 500)',
                    fontSize: 13,
                    marginBottom: 8,
                    color: 'hsl(var(--on-surface))',
                  }}
                >
                  How to use
                </div>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 12,
                    lineHeight: 1.7,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  <li>Download the template and fill in member data (one row per member).</li>
                  <li>
                    Required:{' '}
                    <strong style={{ color: 'hsl(var(--on-surface))' }}>
                      Full Name, Phone, Gender, Age Range
                    </strong>
                    .
                  </li>
                  <li>
                    For Ghana members, add{' '}
                    <strong style={{ color: 'hsl(var(--on-surface))' }}>
                      Region &amp; Constituency
                    </strong>{' '}
                    — leave blank for Diaspora.
                  </li>
                  <li>Upload the filled CSV. Invalid rows are skipped; valid ones are imported.</li>
                </ol>
              </div>
              <button
                className="btn btn-outline"
                onClick={handleDownloadTemplate}
                style={{ fontSize: 11, padding: '10px 16px', whiteSpace: 'nowrap' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  download
                </span>
                Download Template
              </button>
            </div>

            {/* Field reference — collapsible on mobile via scroll */}
            <div
              style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid hsl(var(--border))' }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  color: 'hsl(var(--on-surface-muted))',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                All supported columns
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px' }}>
                {CSV_TEMPLATE_HEADERS.map((h) => (
                  <span
                    key={h}
                    style={{
                      fontSize: 11,
                      background: '#fff',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 3,
                      padding: '2px 8px',
                      fontWeight: 'var(--font-weight-normal, 400)',
                      color: REQUIRED_FIELDS.some(
                        (f) => String(f).replace(/_/g, ' ').toLowerCase() === h.toLowerCase()
                      )
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: 'hsl(var(--primary))',
                  marginTop: 6,
                  fontWeight: 'var(--font-weight-normal, 400)',
                }}
              >
                Green = required
              </div>
            </div>
          </div>

          {/* Upload area or parsed results */}
          {!fileName ? (
            <div
              style={{
                border: '2px dashed hsl(var(--border))',
                borderRadius: 8,
                padding: 'clamp(32px, 6vw, 64px) 32px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'hsl(var(--container-low))',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                id="csv-file-upload"
                name="csv-file-upload"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 48,
                  color: 'hsl(var(--primary))',
                  display: 'block',
                  marginBottom: 12,
                }}
              >
                cloud_upload
              </span>
              <h4
                style={{
                  margin: '0 0 6px 0',
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 15,
                }}
              >
                Tap to browse or drag &amp; drop
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
                Accepts .csv files only
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* File info row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                  padding: 16,
                  borderRadius: 8,
                  background: 'hsl(var(--container-low))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ color: 'hsl(var(--primary))', fontSize: 28, flexShrink: 0 }}
                  >
                    description
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 'var(--font-weight-medium, 500)',
                        fontSize: 13,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fileName}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'hsl(var(--on-surface-muted))',
                        marginTop: 2,
                      }}
                    >
                      {isParsing ? 'Parsing…' : `${parsedRecords.length} rows detected`}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: 11, height: 'auto' }}
                  onClick={() => {
                    setFileName(null)
                    setParsedRecords([])
                  }}
                  disabled={isImporting}
                >
                  Change File
                </button>
              </div>

              {/* Summary stats */}
              {!isParsing && parsedRecords.length > 0 && (
                <div className="csv-stats-grid" style={{ display: 'grid', gap: 12 }}>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 6,
                      background: 'rgba(0,107,63,0.05)',
                      border: '1px solid rgba(0,107,63,0.15)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight:
                          'var(--font-weight-medium, 500)' as React.CSSProperties['fontWeight'],
                        color: 'hsl(var(--primary))',
                      }}
                    >
                      VALID RECORDS
                    </div>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        marginTop: 4,
                        color: 'hsl(var(--primary))',
                      }}
                    >
                      {validCount}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 6,
                      background:
                        invalidCount > 0 ? 'rgba(235,94,85,0.05)' : 'hsl(var(--container-low))',
                      border:
                        invalidCount > 0
                          ? '1px solid rgba(235,94,85,0.15)'
                          : '1px solid hsl(var(--border))',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        color:
                          invalidCount > 0
                            ? 'hsl(var(--destructive))'
                            : 'hsl(var(--on-surface-muted))',
                      }}
                    >
                      ERRORS DETECTED
                    </div>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 'var(--font-weight-medium, 500)',
                        marginTop: 4,
                        color:
                          invalidCount > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface))',
                      }}
                    >
                      {invalidCount}
                    </div>
                  </div>
                </div>
              )}

              {/* Error details */}
              {invalidCount > 0 && (
                <div className="panel" style={{ maxHeight: 180, overflowY: 'auto', padding: 16 }}>
                  <h5
                    style={{
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--destructive))',
                      margin: '0 0 10px 0',
                      fontSize: 12,
                    }}
                  >
                    Rows with errors — will be skipped
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {parsedRecords
                      .filter((r) => !r.isValid)
                      .map((record) => (
                        <div
                          key={record.rowNumber}
                          style={{
                            display: 'flex',
                            alignItems: 'start',
                            gap: 8,
                            fontSize: 12,
                            borderBottom: '1px solid hsl(var(--border))',
                            paddingBottom: 8,
                          }}
                        >
                          <strong style={{ minWidth: 56, color: 'hsl(var(--on-surface))' }}>
                            Row {record.rowNumber}:
                          </strong>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight:
                                  'var(--font-weight-medium, 500)' as React.CSSProperties['fontWeight'],
                                color: '#334155',
                              }}
                            >
                              {record.data.full_name || 'Unnamed'}
                            </div>
                            <div
                              style={{
                                color: 'hsl(var(--destructive))',
                                fontSize: 11,
                                marginTop: 2,
                              }}
                            >
                              {record.errors.join(' · ')}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Valid preview */}
              {validCount > 0 && (
                <div className="panel" style={{ padding: 16, overflowX: 'auto' }}>
                  <h5
                    style={{
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--primary))',
                      margin: '0 0 10px 0',
                      fontSize: 12,
                    }}
                  >
                    Valid Records Preview ({validCount})
                  </h5>
                  <table
                    style={{
                      width: '100%',
                      fontSize: 12,
                      textAlign: 'left',
                      borderCollapse: 'collapse',
                      minWidth: 480,
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        {['Name', 'Phone', 'Gender', 'Age', 'Region / Constituency'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '6px 8px 6px 0',
                              fontWeight:
                                'var(--font-weight-semibold, 600)' as React.CSSProperties['fontWeight'],
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRecords
                        .filter((r) => r.isValid)
                        .slice(0, 10)
                        .map((record, index) => (
                          <tr key={index} style={{ borderBottom: '1px dotted hsl(var(--border))' }}>
                            <td
                              style={{
                                padding: '8px 8px 8px 0',
                                fontWeight:
                                  'var(--font-weight-normal, 400)' as React.CSSProperties['fontWeight'],
                              }}
                            >
                              {record.data.full_name}
                            </td>
                            <td
                              style={{
                                padding: '8px 8px 8px 0',
                                color: 'hsl(var(--on-surface-muted))',
                              }}
                            >
                              {record.data.phone_number}
                            </td>
                            <td
                              style={{
                                padding: '8px 8px 8px 0',
                                color: 'hsl(var(--on-surface-muted))',
                              }}
                            >
                              {record.data.gender}
                            </td>
                            <td
                              style={{
                                padding: '8px 8px 8px 0',
                                color: 'hsl(var(--on-surface-muted))',
                              }}
                            >
                              {record.data.age_range}
                            </td>
                            <td
                              style={{
                                padding: '8px 8px 8px 0',
                                color: 'hsl(var(--on-surface-muted))',
                              }}
                            >
                              {record.data.region
                                ? `${record.data.region} · ${record.data.constituency || '—'}`
                                : 'Diaspora'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {validCount > 10 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: 'hsl(var(--on-surface-muted))',
                        textAlign: 'center',
                        marginTop: 10,
                        fontStyle: 'italic',
                      }}
                    >
                      Showing first 10 of {validCount} valid records.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="csv-footer"
          style={{
            padding: '16px 24px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            background: 'hsl(var(--container-low))',
          }}
        >
          {isImporting ? (
            <div style={{ flex: 1, minWidth: 180 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11.5,
                  fontWeight: 'var(--font-weight-medium, 500)',
                  marginBottom: 6,
                }}
              >
                <span>Importing records…</span>
                <span>{importProgress}%</span>
              </div>
              <div
                style={{
                  height: 4,
                  background: 'hsl(var(--border))',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: 'hsl(var(--primary))',
                    width: `${importProgress}%`,
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          ) : (
            <div />
          )}

          <div className="csv-footer-btns" style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-outline"
              onClick={onClose}
              disabled={isParsing || isImporting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={isParsing || isImporting || validCount === 0}
              onClick={handleImportSubmit}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                save
              </span>
              Admit {validCount} {validCount === 1 ? 'Member' : 'Members'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .csv-stats-grid { grid-template-columns: 1fr 1fr; }
        @media (max-width: 600px) {
          .csv-body { padding: 16px !important; }
          .csv-stats-grid { grid-template-columns: 1fr; }
          .csv-footer { padding: 14px 16px !important; flex-direction: column; align-items: stretch !important; }
          .csv-footer-btns { flex-direction: column; }
          .csv-footer-btns .btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>,
    document.body
  )
}
