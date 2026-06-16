interface PostHeroImageProps {
  imageUrl: string | null | undefined
  title: string
}

export function PostHeroImage({ imageUrl, title }: PostHeroImageProps) {
  return (
    <div
      className="relative aspect-[21/9] overflow-hidden"
      style={{ border: '1px solid hsl(var(--border))' }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          decoding="async"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-4"
          style={{ background: 'hsl(132 9% 10%)' }}
        >
          <div className="flex h-2 w-28" aria-hidden="true">
            <div className="flex-1 bg-[#CE1126]" />
            <div className="flex-1 bg-[#DAA520]" />
            <div className="flex-1 bg-[#006B3F]" />
          </div>
          <span className="text-xs font-medium tracking-[0.18em] uppercase text-white/30 font-['Public_Sans',sans-serif]">
            The Base Editorial
          </span>
        </div>
      )}
    </div>
  )
}
