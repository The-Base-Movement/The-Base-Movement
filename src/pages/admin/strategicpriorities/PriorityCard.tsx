import { useState } from 'react'
import type { DonationCampaign } from '@/types/admin'

interface PriorityCardProps {
  campaign: DonationCampaign
  onEdit: () => void
  onDelete: () => void
}

export function PriorityCard({ campaign, onEdit, onDelete }: PriorityCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className="panel"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 180,
          position: 'relative',
          overflow: 'hidden',
          background: 'hsl(var(--container-low))',
          borderBottom: '1px solid hsl(var(--border))',
        }}
      >
        {campaign.imageUrl ? (
          <img
            src={imageError ? '/branding/logo.png' : campaign.imageUrl}
            alt={campaign.title}
            onError={() => setImageError(true)}
            crossOrigin="anonymous"
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#fff' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 48,
                color: 'hsl(var(--on-surface-muted))',
                opacity: 0.1,
              }}
            >
              image
            </span>
          </div>
        )}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <span
            className="pill"
            style={{
              background:
                campaign.status === 'Active' ? 'hsl(var(--primary))' : 'hsl(var(--on-surface))',
              color: '#fff',
              fontSize: 9,
              fontWeight: 'var(--font-weight-medium, 500)',
            }}
          >
            {campaign.status}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: 24,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-medium, 500)',
              fontSize: 16,
              color: 'hsl(var(--on-surface))',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {campaign.title}
          </h3>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontWeight: 'var(--font-weight-normal, 400)',
              fontSize: 12,
              color: 'hsl(var(--on-surface-muted))',
              margin: 0,
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {campaign.description}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-normal, 400)',
                  fontSize: 11,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Progress
              </span>
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 'var(--font-weight-medium, 500)',
                  fontSize: 14,
                  color: 'hsl(var(--on-surface))',
                }}
              >
                {((campaign.raisedAmount / campaign.targetAmount) * 100).toFixed(0)}%
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: 'hsl(var(--container-low))',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'hsl(var(--primary))',
                  width: `${Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100)}%`,
                  transition: 'width 1s',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-medium, 500)',
                fontSize: 10,
              }}
            >
              <span style={{ color: 'hsl(var(--primary))' }}>
                ${campaign.raisedAmount.toLocaleString()}
              </span>
              <span style={{ color: 'hsl(var(--on-surface-muted))' }}>
                of ${campaign.targetAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              paddingTop: 16,
              borderTop: '1px solid hsl(var(--border))',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 'var(--font-weight-normal, 400)',
                fontSize: 11,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                calendar_today
              </span>
              <span>Ends: {new Date(campaign.endDate).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ flex: 1, height: 32, padding: 0, justifyContent: 'center' }}
                onClick={onEdit}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, marginRight: 6 }}
                >
                  edit
                </span>
                Edit Priority
              </button>
              <button
                className="btn btn-dest btn-sm"
                style={{ width: 34, height: 32, padding: 0, justifyContent: 'center' }}
                onClick={onDelete}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  delete
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
