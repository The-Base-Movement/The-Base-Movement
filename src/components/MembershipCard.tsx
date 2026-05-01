import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface MembershipCardProps {
  userName?: string
  avatarUrl?: string | null
  userRegNo?: string
  onPhotoClick?: () => void
  initials?: string
  gender?: string
  joinedDate?: string
  status?: string
  country?: string
  region?: string
  constituency?: string
  chapter?: string
}

const MembershipCard: React.FC<MembershipCardProps> = ({
  userName,
  avatarUrl,
  userRegNo,
  onPhotoClick,
  initials,
  gender,
  joinedDate,
  status,
  country,
  region,
  constituency,
  chapter
}) => {
  return (
    <div className="relative aspect-[1.6/1] w-full overflow-hidden bg-white flex flex-col font-meta shadow-2xl border-l-[3px] border-r-[3px] border-l-brand-green border-r-brand-green border-t-[3px] border-t-[#CE1126] border-b-[3px] border-b-warm-gold rounded-[8px]">
      
      {/* Card Header (Red Section) */}
      <div className="bg-[#CE1126] p-3 sm:p-4 flex justify-between items-start">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-[8px] p-1 shadow-md">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h4 className="text-white font-black text-[10px] sm:text-xs uppercase leading-none">The Base Movement</h4>
            <p className="text-white/80 text-[6px] sm:text-[7px] font-medium uppercase mt-1">Ghana First, Jobs for the youth!</p>
          </div>
        </div>
        <div className="px-2 sm:px-3 py-1 bg-white/10 border border-white/20 rounded-none">
          <span className="text-white text-[7px] sm:text-[8px] font-black uppercase tracking-widest">
            {country && country !== 'Ghana' ? 'Base Diaspora' : 'Ghana Member'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 p-3 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4 relative overflow-hidden">
        {/* Photo Frame with Gradient Border - Properly positioned to clear footer */}
        <div className="w-24 h-28 sm:w-34 sm:h-42 p-[1.5px] shrink-0 bg-gradient-to-b from-[#CE1126] via-[#DAA520] to-[#006B3F] shadow-lg relative z-10 rounded-[4px]">
          <div className="w-full h-full p-1 bg-slate-50 rounded-[3px]">
            <div 
              className={`w-full h-full bg-slate-200 overflow-hidden relative group rounded-[2px] ${onPhotoClick ? 'cursor-pointer' : ''}`}
              onClick={onPhotoClick}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-green flex items-center justify-center text-white text-xl sm:text-2xl font-black">
                  {initials || 'M'}
                </div>
              )}
              {onPhotoClick && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white text-sm sm:text-base">photo_camera</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Member Details - Refined for perfect alignment */}
        <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
          <div>
            <h5 className="text-[#1a1a1a] font-bold text-[10px] sm:text-lg uppercase tracking-tight leading-tight truncate pr-16">{userName || 'Member Name'}</h5>
            <div className="h-0.5 w-6 sm:w-12 bg-brand-green mt-0.5"></div>
          </div>

          <div className="grid grid-cols-1 gap-y-0.5 sm:gap-y-1 text-charcoal-dark">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-[5px] sm:text-[7px] font-black text-slate-400 uppercase w-12 sm:w-20 shrink-0">Reg. No.</span>
              <span className="text-[6px] sm:text-[8px] font-black text-brand-green uppercase tracking-wider truncate">{userRegNo || 'DI-XXXXXX'}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-[5px] sm:text-[7px] font-black text-slate-400 uppercase w-12 sm:w-20 shrink-0">Gender</span>
              <span className="text-[6px] sm:text-[8px] font-bold uppercase truncate">{gender || 'Not Specified'}</span>
            </div>
            
            {(!country || country === 'Ghana') ? (
              <>
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-[5px] sm:text-[7px] font-black text-slate-400 uppercase w-12 sm:w-20 shrink-0">Region</span>
                  <span className="text-[6px] sm:text-[8px] font-bold uppercase truncate">{region || 'Not Specified'}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-[5px] sm:text-[7px] font-black text-slate-400 uppercase w-12 sm:w-20 shrink-0">Const.</span>
                  <span className="text-[6px] sm:text-[8px] font-bold uppercase truncate">{constituency || 'Not Specified'}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-[5px] sm:text-[7px] font-black text-slate-400 uppercase w-12 sm:w-20 shrink-0">Country</span>
                <span className="text-[6px] sm:text-[8px] font-bold uppercase truncate">{country || 'Not Specified'}</span>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-[5px] sm:text-[7px] font-black text-slate-400 uppercase w-12 sm:w-20 shrink-0">Chapter</span>
              <span className="text-[6px] sm:text-[8px] font-bold uppercase truncate">{chapter || 'Not Specified'}</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-[5px] sm:text-[7px] font-black text-slate-400 uppercase w-12 sm:w-20 shrink-0">Joined</span>
              <span className="text-[6px] sm:text-[8px] font-bold uppercase truncate">{joinedDate || '30 Apr 2026'}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-[5px] sm:text-[7px] font-black text-slate-400 uppercase w-12 sm:w-20 shrink-0">Status</span>
              <span className="text-[6px] sm:text-[8px] font-black text-brand-green uppercase truncate">{status || 'Active'}</span>
            </div>
          </div>
        </div>

        {/* QR Code - Stable positioned */}
        <div className="absolute top-[22%] right-2 sm:right-4 flex flex-col items-center scale-[0.6] sm:scale-[0.85] origin-top-right z-20">
          <div className="bg-white border border-slate-200 p-1 shadow-sm">
            <QRCodeSVG 
              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://thebasemovement.com'}/verify/${userRegNo || 'DI-XXXXXX'}`}
              size={64}
              level="H"
              includeMargin={false}
              className="w-10 h-10 sm:w-16 sm:h-16"
            />
          </div>
          <span className="text-[5px] sm:text-[6px] text-slate-400 uppercase mt-1 font-black tracking-widest">Verify ID</span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="h-4 sm:h-6 bg-slate-50 border-t border-slate-100 px-3 sm:px-6 flex items-center justify-center">
        <p className="text-[5px] sm:text-[7px] text-slate-400 font-bold uppercase tracking-widest truncate">
          {typeof window !== 'undefined' ? window.location.origin : 'https://thebasemovement.com'}/verify/{userRegNo || 'DI-XXXXXX'}
        </p>
      </div>

    </div>
  )
}

export default MembershipCard
