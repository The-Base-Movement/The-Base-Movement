interface PostHeroImageProps {
  imageUrl: string | null | undefined
  title: string
  logoUrl: string
}

export function PostHeroImage({ imageUrl, title, logoUrl }: PostHeroImageProps) {
  return (
    <div className="relative aspect-[21/9] overflow-hidden border border-stone-200">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          decoding="async"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-charcoal-dark to-charcoal-dark/90 relative">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] pointer-events-none" />
          <img src={logoUrl} alt="The Base" className="w-32 h-32 opacity-20 mb-6 grayscale" />
          <span className="text-xs font-medium text-white/20 tracking-tight">
            The Base editorial
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-charcoal-dark/10"></div>
    </div>
  )
}
