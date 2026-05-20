import React, { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { adminService } from '@/services/adminService'
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

const REQUIRED_FIELDS = ['full_name', 'phone_number', 'gender', 'age_range']

// Standardized mapping dictionary
const HEADER_MAP: Record<string, keyof User> = {
  fullname: 'full_name',
  name: 'full_name',
  full_name: 'full_name',
  phone: 'phone_number',
  phonenumber: 'phone_number',
  contactnumber: 'phone_number',
  phone_number: 'phone_number',
  gender: 'gender',
  sex: 'gender',
  age: 'age_range',
  agerange: 'age_range',
  age_range: 'age_range',
  region: 'region',
  constituency: 'constituency',
  residentialaddress: 'residential_address',
  address: 'residential_address',
  residential_address: 'residential_address',
  profession: 'profession',
  email: 'email',
  emailaddress: 'email',
  email_address: 'email',
  chapter: 'chapter',
  education: 'education_level',
  educationlevel: 'education_level',
  education_level: 'education_level',
  emergencyname: 'emergency_contact_name',
  emergencycontact: 'emergency_contact_name',
  emergencycontactname: 'emergency_contact_name',
  emergencyrelationship: 'emergency_relationship',
  emergencyphone: 'emergency_number',
  emergencynumber: 'emergency_number',
  emergency_number: 'emergency_number',
}

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
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      lines.push(row)
      row = ['']
    } else {
      row[row.length - 1] += char
    }
  }
  if (row.length > 1 || row[0] !== '') {
    lines.push(row)
  }
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
    const headers = [
      'Full Name',
      'Phone Number',
      'Gender',
      'Age Range',
      'Region',
      'Constituency',
      'Residential Address',
      'Profession',
      'Email',
      'Chapter',
      'Education Level',
      'Emergency Contact Name',
      'Emergency Relationship',
      'Emergency Number',
    ]
    const sampleRow = [
      'John Doe',
      '+233240000000',
      'Male',
      '26-40',
      'Greater Accra',
      'Ayawaso West',
      'East Legon',
      'Engineer',
      'johndoe@example.com',
      'Legon Patriots',
      "Bachelor's Degree",
      'Mary Doe',
      'Spouse',
      '+233241111111',
    ]
    const csvContent = [headers.join(','), sampleRow.join(',')].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'physical_registration_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV Template downloaded successfully.')
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
          toast.error('The uploaded CSV file is empty or missing data rows.')
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
            if (field) {
              const val = row[colIndex]?.trim()
              if (val) {
                recordData[field] = val as never
              }
            }
          })

          // Validate required fields
          REQUIRED_FIELDS.forEach((field) => {
            if (!recordData[field as keyof User]) {
              const humanName = field.replace('_', ' ')
              errors.push(`Missing required field: ${humanName}`)
            }
          })

          // Validate Gender specifically
          if (recordData.gender) {
            const normalizedGender = recordData.gender.toLowerCase()
            if (normalizedGender === 'm' || normalizedGender === 'male') {
              recordData.gender = 'Male'
            } else if (normalizedGender === 'f' || normalizedGender === 'female') {
              recordData.gender = 'Female'
            } else {
              errors.push(`Invalid gender value: ${recordData.gender}. Must be Male or Female.`)
            }
          }

          return {
            rowNumber,
            data: recordData,
            errors,
            isValid: errors.length === 0,
          }
        })

        setParsedRecords(records)
      } catch (err) {
        console.error('[CSV IMPORT] Parse error:', err)
        toast.error('Failed to parse the CSV file. Please make sure it is valid CSV.')
      } finally {
        setIsParsing(false)
      }
    }

    reader.readAsText(file)
  }

  const handleImportSubmit = async () => {
    const validRecords = parsedRecords.filter((r) => r.isValid)
    if (validRecords.length === 0) {
      toast.error('There are no valid records to import.')
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    try {
      const yearStr = new Date().getFullYear().toString().slice(-2)
      const usersToInsert: User[] = validRecords.map((record, index) => {
        const platform = record.data.region ? 'GHANA' : 'DIASPORA'
        const baseNum = Math.floor(1000 + Math.random() * 9000)
        const uniqueSuffix = String((baseNum + index) % 10000).padStart(4, '0')
        const regNo = `TBM-${platform === 'GHANA' ? 'GH' : 'DI'}-${yearStr}${uniqueSuffix}`

        return {
          id: crypto.randomUUID(),
          full_name: record.data.full_name!,
          phone_number: record.data.phone_number!,
          gender: record.data.gender!,
          age_range: record.data.age_range!,
          registration_number: regNo,
          platform,
          country: record.data.country || (platform === 'GHANA' ? 'Ghana' : 'Unknown'),
          region: record.data.region || '',
          constituency: record.data.constituency || '',
          residential_address: record.data.residential_address || '',
          profession: record.data.profession || 'Patriot',
          email: record.data.email || null,
          chapter: record.data.chapter || '',
          education_level: record.data.education_level || 'None',
          emergency_contact_name: record.data.emergency_contact_name || '',
          emergency_relationship: record.data.emergency_relationship || '',
          emergency_number: record.data.emergency_number || '',
          joined_at: new Date().toISOString(),
          status: 'Active',
          registration_source: 'physical_form',
          avatar_url: null,
        }
      })

      // Insert in chunks of 50 to avoid Supabase or connection timeouts
      const chunkSize = 50
      const totalChunks = Math.ceil(usersToInsert.length / chunkSize)

      for (let i = 0; i < usersToInsert.length; i += chunkSize) {
        const chunk = usersToInsert.slice(i, i + chunkSize)
        const currentChunkNumber = Math.floor(i / chunkSize) + 1

        const { data: success, error } = await adminService.bulkRegisterMembers(chunk)
        if (!success || error) {
          throw error || new Error('Bulk registration failed.')
        }

        setImportProgress(Math.round((currentChunkNumber / totalChunks) * 100))
      }

      toast.success(`Successfully imported ${usersToInsert.length} members from physical forms.`)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      console.error('[CSV IMPORT] Import error:', err)
      toast.error(
        err instanceof Error ? err.message : 'Failed to complete importing members into database.'
      )
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
        padding: 16,
        background: 'rgba(15,19,16,.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="panel"
        style={{
          maxWidth: '850px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto',
          background: '#fff',
        }}
      >
        {/* Header */}
        <div className="ph" style={{ padding: '24px 32px', background: 'hsl(var(--on-surface))' }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: '24px', margin: 0 }}>
              Import registered members (CSV)
            </h2>
            <div className="meta" style={{ color: 'hsl(var(--accent))', marginTop: '4px' }}>
              Import physical registration forms in batch mode
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

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px' }}>
            {/* Sidebar Guidelines */}
            <div style={{ fontSize: '13px', color: 'hsl(var(--on-surface-muted))' }}>
              <h4
                style={{ fontWeight: 800, color: 'hsl(var(--on-surface))', margin: '0 0 12px 0' }}
              >
                Instructions
              </h4>
              <p style={{ margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Upload a CSV file containing records gathered from physical registration forms.
              </p>
              <h5 style={{ fontWeight: 800, color: 'hsl(var(--on-surface))', margin: '0 0 6px 0' }}>
                Required Fields:
              </h5>
              <ul style={{ margin: '0 0 20px 0', paddingLeft: '20px', lineHeight: 1.6 }}>
                <li>Full Name</li>
                <li>Phone Number</li>
                <li>Gender (Male/Female)</li>
                <li>Age Range</li>
              </ul>
              <button
                className="btn btn-outline"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  fontSize: '11px',
                  padding: '10px',
                }}
                onClick={handleDownloadTemplate}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  download
                </span>
                Download Template
              </button>
            </div>

            {/* Upload Area & Verification */}
            <div>
              {!fileName ? (
                <div
                  style={{
                    border: '2px dashed hsl(var(--border))',
                    borderRadius: '8px',
                    padding: '48px 32px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'hsl(var(--container-low))',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '48px', color: 'hsl(var(--primary))', marginBottom: '16px' }}
                  >
                    cloud_upload
                  </span>
                  <h4 style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Drag & drop or browse</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'hsl(var(--on-surface-muted))' }}>
                    Select a .csv file exported from your registration logs
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* File Info */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      borderRadius: '8px',
                      background: 'hsl(var(--container-low))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ color: 'hsl(var(--primary))', fontSize: '28px' }}
                      >
                        description
                      </span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px' }}>{fileName}</div>
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: 'hsl(var(--on-surface-muted))',
                            marginTop: '2px',
                          }}
                        >
                          {parsedRecords.length} rows detected
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '11px', height: 'auto' }}
                      onClick={() => {
                        setFileName(null)
                        setParsedRecords([])
                      }}
                      disabled={isImporting}
                    >
                      Change File
                    </button>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '6px',
                        background: 'rgba(0,107,63,0.04)',
                        border: '1px solid rgba(0,107,63,0.15)',
                      }}
                    >
                      <div
                        style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--primary))' }}
                      >
                        VALID RECORDS
                      </div>
                      <div
                        style={{
                          fontSize: '28px',
                          fontWeight: 800,
                          marginTop: '4px',
                          color: 'hsl(var(--primary))',
                        }}
                      >
                        {validCount}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '16px',
                        borderRadius: '6px',
                        background:
                          invalidCount > 0 ? 'rgba(235,94,85,0.04)' : 'hsl(var(--container-low))',
                        border:
                          invalidCount > 0
                            ? '1px solid rgba(235,94,85,0.15)'
                            : '1px solid hsl(var(--border))',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
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
                          fontSize: '28px',
                          fontWeight: 800,
                          marginTop: '4px',
                          color:
                            invalidCount > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--on-surface))',
                        }}
                      >
                        {invalidCount}
                      </div>
                    </div>
                  </div>

                  {/* Validation Details */}
                  {invalidCount > 0 && (
                    <div
                      className="panel"
                      style={{ maxHeight: '200px', overflowY: 'auto', padding: '16px' }}
                    >
                      <h5
                        style={{
                          fontWeight: 800,
                          color: 'hsl(var(--destructive))',
                          margin: '0 0 12px 0',
                          fontSize: '12px',
                        }}
                      >
                        Rows with Validation Errors (Will be skipped)
                      </h5>
                      <div className="space-y-3">
                        {parsedRecords
                          .filter((r) => !r.isValid)
                          .map((record) => (
                            <div
                              key={record.rowNumber}
                              style={{
                                display: 'flex',
                                alignItems: 'start',
                                gap: '8px',
                                fontSize: '12px',
                                borderBottom: '1px solid hsl(var(--border))',
                                paddingBottom: '8px',
                              }}
                            >
                              <strong style={{ minWidth: '60px', color: 'hsl(var(--on-surface))' }}>
                                Row {record.rowNumber}:
                              </strong>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: '#334155' }}>
                                  {record.data.full_name || 'Unnamed Patriot'}
                                </div>
                                <div
                                  style={{
                                    color: 'hsl(var(--destructive))',
                                    fontSize: '11px',
                                    marginTop: '2px',
                                  }}
                                >
                                  {record.errors.join(', ')}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Valid Records Preview */}
                  {validCount > 0 && (
                    <div
                      className="panel"
                      style={{ maxHeight: '200px', overflowY: 'auto', padding: '16px' }}
                    >
                      <h5
                        style={{
                          fontWeight: 800,
                          color: 'hsl(var(--primary))',
                          margin: '0 0 12px 0',
                          fontSize: '12px',
                        }}
                      >
                        Valid Records Preview ({validCount})
                      </h5>
                      <table
                        style={{
                          width: '100%',
                          fontSize: '12px',
                          textAlign: 'left',
                          borderCollapse: 'collapse',
                        }}
                      >
                        <thead>
                          <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                            <th style={{ padding: '6px 0', fontWeight: 800 }}>Name</th>
                            <th style={{ padding: '6px 0', fontWeight: 800 }}>Phone</th>
                            <th style={{ padding: '6px 0', fontWeight: 800 }}>Gender</th>
                            <th style={{ padding: '6px 0', fontWeight: 800 }}>Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRecords
                            .filter((r) => r.isValid)
                            .slice(0, 10)
                            .map((record, index) => (
                              <tr
                                key={index}
                                style={{ borderBottom: '1px dotted hsl(var(--border))' }}
                              >
                                <td style={{ padding: '8px 0', fontWeight: 700 }}>
                                  {record.data.full_name}
                                </td>
                                <td
                                  style={{
                                    padding: '8px 0',
                                    color: 'hsl(var(--on-surface-muted))',
                                  }}
                                >
                                  {record.data.phone_number}
                                </td>
                                <td
                                  style={{
                                    padding: '8px 0',
                                    color: 'hsl(var(--on-surface-muted))',
                                  }}
                                >
                                  {record.data.gender}
                                </td>
                                <td
                                  style={{
                                    padding: '8px 0',
                                    color: 'hsl(var(--on-surface-muted))',
                                  }}
                                >
                                  {record.data.region
                                    ? `${record.data.region} (${record.data.constituency})`
                                    : 'Diaspora'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {validCount > 10 && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'hsl(var(--on-surface-muted))',
                            textAlign: 'center',
                            marginTop: '12px',
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
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '24px 32px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'hsl(var(--container-low))',
          }}
        >
          {isImporting ? (
            <div style={{ flex: 1, marginRight: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  marginBottom: '6px',
                }}
              >
                <span>Importing records into database…</span>
                <span>{importProgress}%</span>
              </div>
              <div
                style={{
                  height: '4px',
                  background: 'hsl(var(--border))',
                  borderRadius: '2px',
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
            <div style={{ flex: 1 }} />
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
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
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                save
              </span>
              Admit {validCount} Members
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
