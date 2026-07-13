import React from 'react'

interface PublicRequestModalProps {
  chapterLocation: string
  setChapterLocation: (v: string) => void
  chapterDescription: string
  setChapterDescription: (v: string) => void
  isSubmitting: boolean
  submissionSuccess: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function PublicRequestModal({
  chapterLocation,
  setChapterLocation,
  chapterDescription,
  setChapterDescription,
  isSubmitting,
  submissionSuccess,
  onClose,
  onSubmit,
}: PublicRequestModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[500px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 bg-charcoal-dark text-white">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-brand-green" style={{ fontSize: 20 }}>
              public
            </span>
            <h3 className="text-xl font-bold tracking-tight font-meta m-0">
              Start a Diaspora Community
            </h3>
          </div>
          <p className="text-stone-400 text-xs font-medium tracking-tight m-0 leading-relaxed">
            Base Diaspora communities bring people together by country or city to connect, organise
            constructive activities, and support Ghana&rsquo;s future. Submit your interest to help
            start a community where you live.
          </p>
        </div>
        {submissionSuccess ? (
          <div className="p-12 text-center space-y-4">
            <span
              className="material-symbols-outlined text-brand-green block mx-auto"
              style={{ fontSize: 32 }}
            >
              send
            </span>
            <h3 className="text-stone-900">Thank you</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Your interest in starting a Base Diaspora community in{' '}
              <span className="font-bold text-brand-green">{chapterLocation}</span> has been
              received. Our team will contact you after reviewing your submission.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="p-8 space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="input-53d016" className="text-micro font-medium text-stone-400">
                Country or territory, and city or region
              </label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-300"
                  style={{ fontSize: 16 }}
                >
                  location_on
                </span>
                <input
                  aria-label="Country or territory, and city or region"
                  name="chapterLocation"
                  id="input-53d016"
                  required
                  placeholder="e.g. London, United Kingdom or Toronto, Canada"
                  value={chapterLocation}
                  onChange={(e) => setChapterLocation(e.target.value)}
                  className="w-full pl-10 h-12 bg-stone-50 border border-stone-200 font-medium text-sm outline-none focus:border-brand-green"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="textarea-7ec95d" className="text-micro font-medium text-stone-400">
                Why do you want to start this diaspora community?
              </label>
              <textarea
                aria-label="Why do you want to start this diaspora community?"
                name="chapterDescription"
                id="textarea-7ec95d"
                required
                placeholder="Describe local interest and your vision…"
                value={chapterDescription}
                onChange={(e) => setChapterDescription(e.target.value)}
                className="w-full min-h-[120px] bg-stone-50 border border-stone-200 font-medium text-sm p-4 outline-none focus:border-brand-green resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-12 text-stone-400 text-xs font-bold border border-stone-200 bg-white cursor-pointer hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 px-8 bg-primary text-white font-bold text-xs border-none cursor-pointer disabled:opacity-60 hover:opacity-90 transition-opacity min-w-[140px]"
              >
                {isSubmitting ? 'Processing...' : 'Submit interest'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
