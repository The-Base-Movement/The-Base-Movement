# Performance Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate performance optimizations via bundle analysis and runtime telemetry.

**Architecture:** Use `rollup-plugin-visualizer` for static analysis and a custom `PerformanceAudit` component for runtime metrics (FCP, LCP, Lazy Loading).

**Tech Stack:** React, Vite, Rollup Visualizer.

---

### Task 1: Static Bundle Analysis Setup

**Files:**
- Modify: `vite.config.ts`

- [x] **Step 1: Update vite.config.ts to include visualizer**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [x] **Step 2: Run build to generate stats**
Run: `npm run build`
Expected: `stats.html` created in the project root.

- [x] **Step 3: Commit**
```bash
git add vite.config.ts
git commit -m "test: setup bundle visualizer"
```

---

### Task 2: Runtime Telemetry Component

**Files:**
- Create: `src/components/PerformanceAudit.tsx`
- Modify: `src/App.tsx`

- [x] **Step 1: Create PerformanceAudit.tsx**

```tsx
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
```

- [x] **Step 2: Inject into App.tsx**

```tsx
// ... imports
import PerformanceAudit from './components/PerformanceAudit'

export default function App() {
  return (
    <PerformanceProvider>
      <StoreProvider>
        {/* ... */}
        <PerformanceAudit />
        <Suspense fallback={<LoadingScreen />}>
          {/* ... */}
        </Suspense>
      </StoreProvider>
    </PerformanceProvider>
  )
}
```

- [x] **Step 3: Commit**
```bash
git add src/components/PerformanceAudit.tsx src/App.tsx
git commit -m "test: add runtime performance audit component"
```

---

### Task 3: Performance Validation Execution

- [x] **Step 1: Execute manual navigation**
Navigate through: Home -> Blog -> Dashboard -> Store.
Observe the Performance Audit overlay.

- [x] **Step 2: Document findings**
Create `docs/superpowers/reports/2026-05-05-performance-audit-results.md`.

- [x] **Step 3: Commit report**
```bash
git add docs/superpowers/reports/2026-05-05-performance-audit-results.md
git commit -m "docs: performance validation results"
```
