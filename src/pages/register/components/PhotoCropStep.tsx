import { useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'

// The membership card photo window is 120×155px (MembershipCard.tsx), so the
// crop is locked to that portrait ratio — what the member frames here is
// exactly what prints on their card.
const CARD_PHOTO_ASPECT = 120 / 155

interface PhotoCropStepProps {
  photoUrl: string | null
  onPhotoChange: (url: string | null) => void
  onCropComplete: (area: Area | null) => void
}

export function PhotoCropStep({ photoUrl, onPhotoChange, onCropComplete }: PhotoCropStepProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    // Data URL (not object URL) so offline drafts in IndexedDB keep the photo
    const reader = new FileReader()
    reader.onload = () => {
      onPhotoChange(reader.result as string)
      onCropComplete(null)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    onPhotoChange(null)
    onCropComplete(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileInputRef}
        id="member-photo-input"
        name="memberPhoto"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {!photoUrl ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-3 py-12 border-2 border-dashed border-border bg-container-low text-on-surface-muted hover:border-primary hover:text-primary transition-colors cursor-pointer"
          style={{ borderRadius: 'var(--radius-md)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 40 }}>
            add_a_photo
          </span>
          <span className="text-sm font-medium">Upload your photo</span>
          <span className="text-[11px]">
            Take a selfie or choose a clear photo of your face — JPG or PNG
          </span>
        </button>
      ) : (
        <>
          <div
            className="relative w-full overflow-hidden bg-black"
            style={{ height: 320, borderRadius: 'var(--radius-md)' }}
          >
            <Cropper
              image={photoUrl}
              crop={crop}
              zoom={zoom}
              aspect={CARD_PHOTO_ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) => onCropComplete(areaPixels)}
            />
          </div>

          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-on-surface-muted"
              style={{ fontSize: 18 }}
            >
              zoom_out
            </span>
            <input
              id="photo-zoom"
              name="photoZoom"
              aria-label="Zoom photo"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[hsl(var(--primary))] cursor-pointer"
            />
            <span
              className="material-symbols-outlined text-on-surface-muted"
              style={{ fontSize: 18 }}
            >
              zoom_in
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 h-[38px] text-[12px] font-medium border border-border bg-white text-on-surface cursor-pointer hover:bg-container-low transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                photo_library
              </span>
              Change photo
            </button>
            <button
              type="button"
              onClick={removePhoto}
              className="flex-1 h-[38px] text-[12px] font-medium border border-border bg-white cursor-pointer hover:bg-container-low transition-colors flex items-center justify-center gap-2"
              style={{ color: 'hsl(var(--destructive))' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                delete
              </span>
              Remove
            </button>
          </div>
        </>
      )}

      <p className="text-[11px] text-on-surface-muted leading-relaxed m-0">
        Drag to position and pinch or use the slider to zoom — the framed area is exactly what
        appears on your official membership card. A photo is required to print your card.
      </p>
    </div>
  )
}
