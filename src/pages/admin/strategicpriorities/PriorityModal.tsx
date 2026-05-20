import { createPortal } from 'react-dom'
import type { DonationCampaign } from '@/types/admin'
import type { FormEvent, ChangeEvent } from 'react'

interface PriorityModalProps {
  isOpen: boolean
  isCreating: boolean
  onClose: () => void
  isMobile: boolean
  isSubmitting: boolean
  formData: Omit<DonationCampaign, 'id' | 'raisedAmount'>
  setFormData: React.Dispatch<React.SetStateAction<Omit<DonationCampaign, 'id' | 'raisedAmount'>>>
  onSubmit: (e: FormEvent) => void
  imageUploadMode: 'url' | 'upload'
  setImageUploadMode: (mode: 'url' | 'upload') => void
  isUploadingImage: boolean
  handleImageUpload: (e: ChangeEvent<HTMLInputElement>) => void
}

export function PriorityModal({
  isOpen,
  isCreating,
  onClose,
  isMobile,
  isSubmitting,
  formData,
  setFormData,
  onSubmit,
  imageUploadMode,
  setImageUploadMode,
  isUploadingImage,
  handleImageUpload,
}: PriorityModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      <div
        className="panel"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 640,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            padding: isMobile ? '16px 18px' : '24px 32px',
            borderBottom: '1px solid hsl(var(--border))',
            background: 'hsl(var(--container-low))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 900,
                fontSize: 18,
                color: 'hsl(var(--on-surface))',
              }}
            >
              {isCreating ? 'Deploy New Priority' : 'Adjust Strategic Protocol'}
            </h3>
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: "'Public Sans', sans-serif",
                fontWeight: 500,
                fontSize: 12,
                color: 'hsl(var(--on-surface-muted))',
              }}
            >
              Defining critical resource allocation for the movement.
            </p>
          </div>
          <button
            aria-label="Close modal"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: 'hsl(var(--on-surface-muted))',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              close
            </span>
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div
            style={{
              padding: isMobile ? 16 : 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                htmlFor="input-afc280"
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Priority title
              </label>
              <input
                aria-label="e.g. Ashanti Region Media Blitz"
                name="name-afc280"
                id="input-afc280"
                type="text"
                required
                placeholder="e.g. Ashanti Region Media Blitz"
                style={{
                  width: '100%',
                  height: 48,
                  background: 'hsl(var(--container-low))',
                  border: 'none',
                  borderBottom: '2px solid hsl(var(--border))',
                  padding: '0 16px',
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  outline: 'none',
                  color: 'hsl(var(--on-surface))',
                }}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                htmlFor="textarea-e67af7"
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'hsl(var(--on-surface-muted))',
                }}
              >
                Mission description
              </label>
              <textarea
                aria-label="Define the scope and impact of this priority"
                name="name-e67af7"
                id="textarea-e67af7"
                rows={3}
                required
                placeholder="Define the scope and impact of this priority..."
                style={{
                  width: '100%',
                  background: 'hsl(var(--container-low))',
                  border: 'none',
                  borderBottom: '2px solid hsl(var(--border))',
                  padding: 16,
                  fontFamily: "'Public Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 14,
                  outline: 'none',
                  color: 'hsl(var(--on-surface))',
                  resize: 'none',
                }}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  htmlFor="input-489f6e"
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Target capital (₵)
                </label>
                <input
                  name="name-489f6e"
                  id="input-489f6e"
                  type="number"
                  required
                  style={{
                    width: '100%',
                    height: 48,
                    background: 'hsl(var(--container-low))',
                    border: 'none',
                    borderBottom: '2px solid hsl(var(--border))',
                    padding: '0 16px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    outline: 'none',
                    color: 'hsl(var(--on-surface))',
                  }}
                  value={formData.targetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAmount: Number(e.target.value) })
                  }
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  htmlFor="input-94fab5"
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Mission deadline
                </label>
                <input
                  name="name-94fab5"
                  id="input-94fab5"
                  type="date"
                  required
                  style={{
                    width: '100%',
                    height: 48,
                    background: 'hsl(var(--container-low))',
                    border: 'none',
                    borderBottom: '2px solid hsl(var(--border))',
                    padding: '0 16px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    outline: 'none',
                    color: 'hsl(var(--on-surface))',
                  }}
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label
                  htmlFor="select-683ee2"
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    color: 'hsl(var(--on-surface-muted))',
                  }}
                >
                  Status
                </label>
                <select
                  name="name-683ee2"
                  id="select-683ee2"
                  style={{
                    width: '100%',
                    height: 48,
                    background: 'hsl(var(--container-low))',
                    border: 'none',
                    borderBottom: '2px solid hsl(var(--border))',
                    padding: '0 16px',
                    fontFamily: "'Public Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: 14,
                    outline: 'none',
                    color: 'hsl(var(--on-surface))',
                  }}
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as 'Active' | 'Closed',
                    })
                  }
                >
                  <option value="Active">Active Mobilization</option>
                  <option value="Closed">Mission Completed</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 12,
                      color: 'hsl(var(--on-surface-muted))',
                    }}
                  >
                    Visual Asset
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      background: 'hsl(var(--container-low))',
                      borderRadius: 4,
                      padding: 2,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('upload')}
                      style={{
                        border: 'none',
                        background:
                          imageUploadMode === 'upload' ? 'hsl(var(--on-surface))' : 'transparent',
                        color:
                          imageUploadMode === 'upload' ? '#fff' : 'hsl(var(--on-surface-muted))',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 8px',
                        borderRadius: 3,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        cloud_upload
                      </span>
                      Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode('url')}
                      style={{
                        border: 'none',
                        background:
                          imageUploadMode === 'url' ? 'hsl(var(--on-surface))' : 'transparent',
                        color: imageUploadMode === 'url' ? '#fff' : 'hsl(var(--on-surface-muted))',
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 8px',
                        borderRadius: 3,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        link
                      </span>
                      Image URL
                    </button>
                  </div>
                </div>

                {imageUploadMode === 'url' ? (
                  <input
                    aria-label="https://"
                    type="url"
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      height: 48,
                      background: 'hsl(var(--container-low))',
                      border: 'none',
                      borderBottom: '2px solid hsl(var(--border))',
                      padding: '0 16px',
                      fontFamily: "'Public Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: 14,
                      outline: 'none',
                      color: 'hsl(var(--on-surface))',
                    }}
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                ) : (
                  <div style={{ position: 'relative' }}>
                    {isUploadingImage ? (
                      <div
                        style={{
                          height: 80,
                          background: 'hsl(var(--container-low))',
                          border: '1px dashed hsl(var(--border))',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 10,
                        }}
                      >
                        <span
                          className="material-symbols-outlined animate-spin"
                          style={{ color: 'hsl(var(--accent))' }}
                        >
                          sync
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'hsl(var(--on-surface-muted))',
                          }}
                        >
                          Uploading media to priorities archive...
                        </span>
                      </div>
                    ) : formData.imageUrl ? (
                      <div
                        style={{
                          background: 'hsl(var(--container-low))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 4,
                          padding: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                        }}
                      >
                        <img
                          src={formData.imageUrl}
                          alt="Priority Preview"
                          style={{
                            width: 60,
                            height: 40,
                            objectFit: 'cover',
                            borderRadius: 4,
                            border: '1px solid hsl(var(--border))',
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 12,
                              fontWeight: 800,
                              color: 'hsl(var(--on-surface))',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formData.imageUrl.split('/').pop()}
                          </p>
                          <span
                            style={{ fontSize: 10, color: 'hsl(var(--accent))', fontWeight: 700 }}
                          >
                            Active priority visual
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="btn btn-dest btn-sm"
                          style={{ width: 34, height: 34, padding: 0, justifyContent: 'center' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            delete
                          </span>
                        </button>
                      </div>
                    ) : (
                      <label
                        style={{
                          height: 80,
                          background: 'hsl(var(--container-low))',
                          border: '1px dashed hsl(var(--border))',
                          borderRadius: 4,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 24,
                            color: 'hsl(var(--on-surface-muted))',
                            marginBottom: 4,
                          }}
                        >
                          cloud_upload
                        </span>
                        <span
                          style={{ fontSize: 12, fontWeight: 800, color: 'hsl(var(--on-surface))' }}
                        >
                          Ingest priority media asset
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'hsl(var(--on-surface-muted))',
                            fontWeight: 600,
                            marginTop: 2,
                          }}
                        >
                          Max size 5MB • priorities category
                        </span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: isMobile ? 16 : 32,
              borderTop: '1px solid hsl(var(--border))',
              background: 'hsl(var(--container-low))',
              display: 'flex',
              gap: 12,
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1, height: 48 }}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Abort Mission
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, height: 48 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18 }}>
                  sync
                </span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  history
                </span>
              )}
              {isCreating ? 'Deploy Protocol' : 'Sync Adjustments'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
