import { X, Copy, Check, Mail } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/neon-button'
import { FacebookIcon, WhatsAppIcon, XIcon } from './icons/SocialIcons'

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
    icon: FacebookIcon, 
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
        <div className="p-6 border-b border-stone-100 flex flex-col gap-2 bg-stone-50 relative">
          <h2 className="text-base font-bold text-stone-900 font-meta tracking-tight pr-10 truncate">{title}</h2>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-none bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-[var(--brand-green)] transition-colors"
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
