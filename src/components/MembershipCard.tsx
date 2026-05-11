import { QRCodeSVG } from 'qrcode.react'
import { useBranding } from '@/hooks/useBranding'

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
  const { settings } = useBranding()
  return (
    <div className="relative aspect-[1.58/1] w-full bg-white flex flex-col font-meta border-x-[3px] border-x-primary border-t-destructive border-b-[3px] border-b-brand-gold rounded-[8px] overflow-hidden">
      
      {/* Card Header (Red Section) - Precise radius matching */}
      <div className="bg-destructive p-2 sm:p-3 flex justify-between items-center rounded-t-[8px]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-[8px] p-1 shadow-md">
            <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain"  decoding="async" loading="lazy" />
          </div>
          <div>
            <h4 className="text-white font-bold text-micro sm:text-xs leading-none">The Base Movement</h4>
            <p className="text-white/80 text-[6px] sm:text-[7px] font-medium mt-1">Ghana First, jobs for the youth!</p>
          </div>
        </div>
        <div className="px-2 sm:px-3 h-5 sm:h-6 bg-white/10 border border-white/20 rounded-none text-center overflow-hidden">
          <span className="text-white text-[7px] sm:text-[8px] font-bold tracking-tight leading-[20px] sm:leading-[24px] block uppercase">
            {country && country !== 'Ghana' ? 'Diaspora Member' : 'Local Member'}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 p-2 sm:px-4 sm:py-2 flex items-center gap-3 sm:gap-6 relative">
        {/* Photo Frame with True External Gradient Border */}
        <div className="w-24 h-28 sm:w-34 sm:h-42 shrink-0 relative z-10 rounded-[4px] bg-white p-0.5 sm:p-1 shadow-sm before:absolute before:-inset-[1px] before:bg-gradient-to-b before:from-destructive before:via-brand-gold before:to-primary before:rounded-[5px] before:-z-10">
          <div className="w-full h-full bg-muted/30 rounded-[2px] relative">
            <div 
              className={`w-full h-full bg-muted overflow-hidden relative group rounded-[2px] ${onPhotoClick ? 'cursor-pointer' : ''}`}
              onClick={onPhotoClick}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={userName} className="w-full h-full object-cover"  decoding="async" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
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

        {/* Member Details - Center-aligned with photo */}
        <div className="flex-1 space-y-0.5 sm:space-y-1.5 min-w-0 pr-16 sm:pr-20">
          <div className="mb-1 sm:mb-2 pt-1">
            <h5 className="text-[hsl(var(--foreground))] font-bold text-sm sm:text-lg tracking-tight leading-normal" title={userName || 'Member Name'}>{userName || 'Member Name'}</h5>
            <div className="h-0.5 w-6 sm:w-12 bg-primary mt-1"></div>
          </div>

          <div className="grid grid-cols-1 gap-y-0.5 sm:gap-y-1 text-on-surface">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[7px] sm:text-[9px] font-bold text-muted-foreground w-12 sm:w-16 shrink-0">Reg. no.</span>
              <span className="text-[8px] sm:text-[11px] font-bold text-primary tracking-tight whitespace-nowrap pb-[2px]">{userRegNo || 'DI-XXXXXX'}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[7px] sm:text-[9px] font-bold text-muted-foreground w-12 sm:w-16 shrink-0">Gender</span>
              <span className="text-[8px] sm:text-[10px] font-bold whitespace-nowrap pb-[2px]">{gender || 'Not Specified'}</span>
            </div>
            
            {(!country || country === 'Ghana') ? (
              <>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-[7px] sm:text-[9px] font-bold text-muted-foreground w-12 sm:w-16 shrink-0">Region</span>
                  <span className="text-[8px] sm:text-[10px] font-bold whitespace-nowrap pb-[2px]">{region || 'Not Specified'}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span className="text-[7px] sm:text-[9px] font-bold text-muted-foreground w-12 sm:w-16 shrink-0">Const.</span>
                  <span className="text-[8px] sm:text-[10px] font-bold whitespace-nowrap pb-[2px]">{constituency || 'Not Specified'}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-[7px] sm:text-[9px] font-bold text-muted-foreground w-12 sm:w-16 shrink-0">Country</span>
                <span className="text-[8px] sm:text-[10px] font-bold whitespace-nowrap pb-[2px]">{country || 'Not Specified'}</span>
              </div>
            )}

            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[7px] sm:text-[9px] font-bold text-muted-foreground w-12 sm:w-16 shrink-0">Chapter</span>
              <span className="text-[7px] sm:text-[10px] font-bold tracking-tight leading-none whitespace-nowrap max-w-[120px] sm:max-w-none pb-[2px]">{chapter || 'Not Specified'}</span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[7px] sm:text-[9px] font-bold text-muted-foreground w-12 sm:w-16 shrink-0">Joined</span>
              <span className="text-[8px] sm:text-[10px] font-bold whitespace-nowrap pb-[2px]">{joinedDate || '30 Apr 2026'}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[7px] sm:text-[9px] font-bold text-muted-foreground w-12 sm:w-16 shrink-0">Status</span>
              <span className="text-[8px] sm:text-[10px] font-bold text-primary whitespace-nowrap pb-[2px]">{status || 'Verified'}</span>
            </div>
          </div>
        </div>

        {/* QR Code - Optimized for horizontal space */}
        <div className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-4 flex flex-col items-center scale-[0.65] sm:scale-[0.9] origin-right z-20">
          <div className="bg-white border border-border/60 p-1 shadow-sm">
            <QRCodeSVG 
              value={`${typeof window !== 'undefined' ? window.location.origin : 'https://thebasemovement.com'}/verify/${userRegNo || 'DI-XXXXXX'}`}
              size={80}
              level="H"
              includeMargin={false}
              className="w-12 h-12 sm:w-20 sm:h-20"
            />
          </div>
          <span className="text-[6px] sm:text-[8px] text-muted-foreground/80 mt-1 font-bold tracking-tight">Verify id</span>
        </div>

        {/* Subtle Watermark Logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
          <img src={settings.logo_url} alt="" className="w-40 sm:w-64 object-contain grayscale"  decoding="async" loading="lazy" />
        </div>
      </div>

      {/* Card Footer - Ensuring full visibility */}
      <div className="bg-muted/10 border-t border-border/20 px-3 sm:px-6 h-6 sm:h-8 flex items-center justify-center pb-1">
        <p className="text-[5px] sm:text-[7px] text-muted-foreground/80 font-bold tracking-tight leading-normal m-0 whitespace-nowrap">
          {typeof window !== 'undefined' ? window.location.origin : 'https://thebasemovement.com'}/verify/{userRegNo || 'DI-XXXXXX'}
        </p>
      </div>

    </div>
  )
}

export default MembershipCard
