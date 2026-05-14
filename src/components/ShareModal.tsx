import { useState } from 'react'

function ShareIcon({ name }: { name: string }) {
  if (name === 'WhatsApp') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  )
  if (name === 'Facebook') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  )
  if (name === 'X') return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  )
  return <span className="material-symbols-outlined" style={{ fontSize: 20 }}>mail</span>
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  url?: string;
}

export function ShareModal({ isOpen, onClose, title = "Share & Invite Others", url = "https://thebasemovement.com/register" }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

const shareOptions = [
  { name: 'WhatsApp', color: 'bg-[#25D366]', hover: 'hover:bg-[#25D366]/10', textColor: 'text-[#25D366]', borderColor: 'border-[#25D366]/20', link: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}` },
  { name: 'Facebook', color: 'bg-[#1877F2]', hover: 'hover:bg-[#1877F2]/10', textColor: 'text-[#1877F2]', borderColor: 'border-[#1877F2]/20', link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { name: 'X', color: 'bg-[#000000]', hover: 'hover:bg-[#000000]/10', textColor: 'text-black', borderColor: 'border-black/20', link: `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` },
  { name: 'Email', color: 'bg-[var(--brand-red)]', hover: 'hover:bg-[var(--brand-red)]/10', textColor: 'text-[var(--brand-red)]', borderColor: 'border-[var(--brand-red)]/20', link: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}` },
]

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal-dark/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex flex-col gap-2 bg-stone-50 relative">
          <h2 className="text-base font-bold text-stone-900 font-meta tracking-tight pr-10 truncate">{title}</h2>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-none bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-[var(--brand-green)] transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Copy Link Section */}
          <div className="space-y-3">
            <p className="text-micro font-bold text-stone-400 text-center tracking-tight">Your personal invite link:</p>
            <div className="space-y-2">
              <div className="w-full p-4 bg-stone-50 border border-stone-100 text-stone-600 text-sm font-medium break-all text-center">
                {url}
              </div>
              <button
                onClick={handleCopy}
                className={`w-full h-12 rounded-none font-bold text-xs tracking-tight transition-all flex items-center justify-center gap-2 border-none cursor-pointer ${copied ? 'bg-emerald-600 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-[var(--brand-green)] hover:text-white hover:border-[var(--brand-green)]'}`}
              >
                {copied ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                    Copied to clipboard
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
                    Copy link
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative">
             <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-stone-100"></div>
            </div>
            <div className="relative flex justify-center text-micro font-bold tracking-tight">
              <span className="bg-white px-4 text-stone-400">Or share directly</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            {shareOptions.map((option) => (
              <a 
                key={option.name}
                href={option.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-4 p-4 border ${option.borderColor} ${option.hover} transition-all group`}
              >
                <div className={`w-10 h-10 ${option.color} text-white flex items-center justify-center rounded-none shadow-sm`}>
                  <ShareIcon name={option.name} />
                </div>
                <span className={`text-sm font-bold ${option.textColor}`}>Share on {option.name}</span>
                <span className="ml-auto material-symbols-outlined text-stone-300 group-hover:text-stone-400 transition-colors text-[20px]">chevron_right</span>
              </a>
            ))}
          </div>
        </div>

        {/* Brand Footer */}
        <div className="flex h-1.5 w-full">
          <div className="flex-1 bg-[var(--brand-red)]"></div>
          <div className="flex-1 bg-[var(--brand-gold)]"></div>
          <div className="flex-1 bg-[var(--brand-green)]"></div>
        </div>
      </div>
    </div>
  )
}
