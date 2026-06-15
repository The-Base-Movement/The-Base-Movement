import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { kycService, type KycDocKind, type KycStatus, type MemberKyc } from '@/services/kycService'

interface KycDocumentsProps {
  /** The member's auth id (own id for a member, the member's id for an admin). */
  userId: string
  /** Show admin review controls (mark verified / failed). */
  showVerifyControls?: boolean
}

const DOCS: { kind: KycDocKind; label: string }[] = [
  { kind: 'front', label: 'Ghana Card — front' },
  { kind: 'back', label: 'Ghana Card — back' },
  { kind: 'selfie', label: 'Selfie' },
]

const STATUS_PILL: Record<KycStatus, { cls: string; text: string }> = {
  not_uploaded: { cls: 'pill-mute', text: 'Not uploaded' },
  uploaded: { cls: 'pill-warn', text: 'Awaiting review' },
  pending_verification: { cls: 'pill-warn', text: 'Verifying…' },
  verified: { cls: 'pill-ok', text: 'Verified' },
  failed: { cls: 'pill-err', text: 'Verification failed' },
}

const tileStyle: CSSProperties = {
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius-md)',
  background: 'hsl(var(--card))',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

function pathFor(kyc: MemberKyc | null, kind: KycDocKind): string | null {
  if (!kyc) return null
  return kind === 'front'
    ? kyc.ghanaCardFrontPath
    : kind === 'back'
      ? kyc.ghanaCardBackPath
      : kyc.selfiePath
}

export function KycDocuments({ userId, showVerifyControls }: KycDocumentsProps) {
  const [kyc, setKyc] = useState<MemberKyc | null>(null)
  const [urls, setUrls] = useState<Partial<Record<KycDocKind, string>>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<KycDocKind | 'status' | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const pendingKind = useRef<KycDocKind | null>(null)

  const refreshUrls = useCallback(async (record: MemberKyc | null) => {
    if (!record) return setUrls({})
    const next: Partial<Record<KycDocKind, string>> = {}
    await Promise.all(
      DOCS.map(async ({ kind }) => {
        const p = pathFor(record, kind)
        if (p) {
          const u = await kycService.signedUrl(p)
          if (u) next[kind] = u
        }
      })
    )
    setUrls(next)
  }, [])

  const load = useCallback(async () => {
    try {
      const record = await kycService.get(userId)
      setKyc(record)
      await refreshUrls(record)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId, refreshUrls])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const pickFile = (kind: KycDocKind) => {
    pendingKind.current = kind
    fileInput.current?.click()
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const kind = pendingKind.current
    e.target.value = '' // allow re-selecting the same file
    if (!file || !kind) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    setBusy(kind)
    try {
      const updated = await kycService.uploadDocument(userId, kind, file)
      setKyc(updated)
      await refreshUrls(updated)
      toast.success('Document uploaded.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setBusy(null)
    }
  }

  const setStatus = async (status: KycStatus) => {
    setBusy('status')
    try {
      await kycService.setStatus(userId, status)
      setKyc((k) => (k ? { ...k, status } : k))
      toast.success(`Marked ${STATUS_PILL[status].text.toLowerCase()}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status.')
    } finally {
      setBusy(null)
    }
  }

  const status: KycStatus = kyc?.status ?? 'not_uploaded'
  const pill = STATUS_PILL[status]

  return (
    <div className="panel">
      <div className="ph">
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 'var(--font-weight-medium, 500)',
              color: 'hsl(var(--on-surface))',
            }}
          >
            Identity verification
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>
            Upload your Ghana Card (front &amp; back) and a selfie.
          </p>
        </div>
        <span className={`pill ${pill.cls}`}>{pill.text}</span>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onFile}
      />

      <div
        style={{
          padding: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 12,
        }}
      >
        {loading
          ? DOCS.map(({ kind, label }) => (
              <div key={kind} style={tileStyle}>
                <span style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>{label}</span>
                <div style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))' }}>Loading…</div>
              </div>
            ))
          : DOCS.map(({ kind, label }) => {
              const url = urls[kind]
              const uploading = busy === kind
              return (
                <div key={kind} style={tileStyle}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 'var(--font-weight-medium, 500)',
                      color: 'hsl(var(--on-surface-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {label}
                  </span>
                  <div
                    style={{
                      height: 110,
                      borderRadius: 'var(--radius-sm)',
                      background: 'hsl(var(--container-low))',
                      border: '1px solid hsl(var(--border))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ width: '100%', height: '100%' }}
                      >
                        <img
                          src={url}
                          alt={label}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </a>
                    ) : (
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 28, color: 'hsl(var(--on-surface-muted))' }}
                      >
                        {kind === 'selfie' ? 'photo_camera' : 'badge'}
                      </span>
                    )}
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => pickFile(kind)}
                    disabled={uploading}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                      upload
                    </span>
                    {uploading ? 'Uploading…' : url ? 'Replace' : 'Upload'}
                  </button>
                </div>
              )
            })}
      </div>

      {showVerifyControls && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{ fontSize: 12, color: 'hsl(var(--on-surface-muted))', marginRight: 'auto' }}
          >
            Manual review (Smile ID auto-verification arrives in Phase 2)
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setStatus('verified')}
            disabled={busy === 'status' || status === 'not_uploaded'}
          >
            Mark verified
          </button>
          <button
            className="btn btn-outline-dest btn-sm"
            onClick={() => setStatus('failed')}
            disabled={busy === 'status' || status === 'not_uploaded'}
          >
            Mark failed
          </button>
        </div>
      )}
    </div>
  )
}
