import { X, Copy, Check, Facebook, Mail } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

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

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.487h2.039L6.486 3.24H4.298l13.311 17.399z"/>
  </svg>
)

const shareOptions = [
  { 
    name: 'WhatsApp', 
    icon: WhatsAppIcon, 
    color: 'bg-[#25D366]', 
    hover: 'hover:bg-[#25D366]/10',
    textColor: 'text-[#25D366]',
    borderColor: 'border-[#25D366]/20',
    link: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}` 
  },
  { 
    name: 'Facebook', 
    icon: Facebook, 
    color: 'bg-[#1877F2]', 
    hover: 'hover:bg-[#1877F2]/10',
    textColor: 'text-[#1877F2]',
    borderColor: 'border-[#1877F2]/20',
    link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` 
  },
  { 
    name: 'X', 
    icon: XIcon, 
    color: 'bg-[#000000]', 
    hover: 'hover:bg-[#000000]/10',
    textColor: 'text-black',
    borderColor: 'border-black/20',
    link: `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}` 
  },
  { 
    name: 'Email', 
    icon: Mail, 
    color: 'bg-[var(--brand-red)]', 
    hover: 'hover:bg-[var(--brand-red)]/10',
    textColor: 'text-[var(--brand-red)]',
    borderColor: 'border-[var(--brand-red)]/20',
    link: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}` 
  },
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
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
          <h2 className="text-lg font-bold text-stone-900 font-meta tracking-tight pr-4">{title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-none bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-[var(--brand-green)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Copy Link Section */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Your personal invite link:</p>
            <div className="space-y-2">
              <div className="w-full p-4 bg-stone-50 border border-stone-100 text-stone-600 text-sm font-medium break-all text-center">
                {url}
              </div>
              <Button 
                onClick={handleCopy}
                className={`w-full h-12 rounded-none font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${copied ? 'bg-emerald-600 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-[var(--brand-green)] hover:text-white hover:border-[var(--brand-green)]'}`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-stone-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
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
                  <option.icon className="w-5 h-5" />
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
