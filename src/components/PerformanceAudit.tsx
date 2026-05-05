import { useEffect, useState } from 'react'

export default function PerformanceAudit() {
  const [metrics, setMetrics] = useState({
    fcp: 0,
    lcp: 0,
    lazyImages: 0,
    eagerImages: 0,
  })

  useEffect(() => {
    // 1. Paint Timings
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }))
        }
        if (entry.entryType === 'largest-contentful-paint') {
          setMetrics(prev => ({ ...prev, lcp: entry.startTime }))
        }
      });
    });

    observer.observe({ type: 'paint', buffered: true });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    // 2. Image Audit
    const auditImages = () => {
      const imgs = Array.from(document.querySelectorAll('img'))
      const lazy = imgs.filter(img => img.loading === 'lazy').length
      const eager = imgs.length - lazy
      setMetrics(prev => ({ ...prev, lazyImages: lazy, eagerImages: eager }))
    }

    auditImages()
    const interval = setInterval(auditImages, 2000)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-black/80 text-white p-3 rounded-lg text-xs font-mono shadow-2xl border border-white/20 backdrop-blur-md pointer-events-none">
      <div className="font-bold text-[var(--brand-gold)] mb-1">⚡ PERF AUDIT</div>
      <div>FCP: {(metrics.fcp / 1000).toFixed(2)}s</div>
      <div>LCP: {(metrics.lcp / 1000).toFixed(2)}s</div>
      <div className="mt-1 border-t border-white/10 pt-1">
        Images: <span className="text-green-400">{metrics.lazyImages}L</span> / <span className="text-red-400">{metrics.eagerImages}E</span>
      </div>
    </div>
  )
}
