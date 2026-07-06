import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { donationService } from '@/services/donationService'

interface DonationReceiptModalProps {
  isOpen: boolean
  donationId: string | null
  reference?: string | null
  onClose: () => void
}

interface ReceiptState {
  donationId: string | null
  error: string | null
  receiptHtml: string | null
}

export default function DonationReceiptModal({
  isOpen,
  donationId,
  reference,
  onClose,
}: DonationReceiptModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [receiptState, setReceiptState] = useState<ReceiptState>({
    donationId: null,
    error: null,
    receiptHtml: null,
  })

  const receiptHtml = receiptState.donationId === donationId ? receiptState.receiptHtml : null
  const error = receiptState.donationId === donationId ? receiptState.error : null
  const loading = !!isOpen && !!donationId && !receiptHtml && !error

  const receiptUrl = useMemo(() => {
    if (!receiptHtml) return null
    return URL.createObjectURL(new Blob([receiptHtml], { type: 'text/html' }))
  }, [receiptHtml])

  useEffect(() => {
    return () => {
      if (receiptUrl) URL.revokeObjectURL(receiptUrl)
    }
  }, [receiptUrl])

  useEffect(() => {
    let cancelled = false

    if (!isOpen || !donationId) {
      return
    }

    donationService
      .getReceiptAccess(donationId)
      .then(async (access) => {
        if (cancelled) return
        if (!access?.signedUrl) {
          setReceiptState({ donationId, error: 'Receipt unavailable.', receiptHtml: null })
          return
        }

        const response = await fetch(access.signedUrl)
        if (!response.ok) {
          throw new Error(`Receipt request failed with ${response.status}`)
        }

        const html = await response.text()
        if (!cancelled) {
          setReceiptState({ donationId, error: null, receiptHtml: html })
        }
      })
      .catch((err: unknown) => {
        console.error('[ReceiptModal] Failed to load receipt:', err)
        if (!cancelled) {
          setReceiptState({ donationId, error: 'Failed to load receipt.', receiptHtml: null })
        }
      })

    return () => {
      cancelled = true
    }
  }, [donationId, isOpen])

  if (!isOpen || !donationId) return null

  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print()
  }

  const handleDownload = () => {
    if (!receiptHtml) return
    const blob = new Blob([receiptHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${reference || donationId}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,.88)',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: 720,
          width: '100%',
          background: 'hsl(var(--card))',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,.4)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 14,
                color: 'hsl(var(--on-surface))',
              }}
            >
              Donation Receipt
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                marginTop: 1,
              }}
            >
              Secure member access
            </div>
          </div>
          <button
            aria-label="Close receipt viewer"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-sm)',
              background: 'hsl(var(--container-low))',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {loading ? (
            <div
              style={{
                height: '65vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--on-surface-muted))',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13,
              }}
            >
              Loading receipt…
            </div>
          ) : error ? (
            <div
              style={{
                height: '65vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--destructive))',
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13,
                padding: 24,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={receiptUrl ?? undefined}
              title="Donation Receipt"
              style={{ width: '100%', height: '65vh', border: 'none', display: 'block' }}
            />
          )}
        </div>

        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            borderTop: '1px solid hsl(var(--border))',
            flexShrink: 0,
          }}
        >
          <button
            className="btn btn-outline btn-sm"
            onClick={handleDownload}
            disabled={!receiptHtml}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              download
            </span>
            Download
          </button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint} disabled={!receiptHtml}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              print
            </span>
            Print / Save PDF
          </button>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
