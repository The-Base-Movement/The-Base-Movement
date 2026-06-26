import { getBlogImageUrl } from '@/lib/blogImages'

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
      <img
        src={getBlogImageUrl(imageUrl)}
        alt={title}
        className="w-full h-full object-cover"
        decoding="async"
        loading="lazy"
      />
    </div>
  )
}
