/**
 * Share a post to a social platform, or fall back to the native share sheet.
 *
 * Extracted from BlogPost so the Youth Wing article page can share the same way
 * without a second copy of the URL templates -- two copies would drift the first
 * time a platform changes its share endpoint.
 */
export function sharePost(title: string, url: string, platform?: string) {
  let shareUrl: string

  switch (platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      break
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
      break
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
      break
    case 'whatsapp':
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`
      break
    case 'telegram':
      shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
      break
    case 'email':
      window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
      return
    default:
      if (navigator.share) {
        navigator.share({ title, url }).catch(() => {})
      } else {
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard')
      }
      return
  }

  window.open(shareUrl, '_blank', 'width=600,height=400')
}
