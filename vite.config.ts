import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import type { Config as SVGOConfig } from 'svgo'

/// <reference types="vitest" />

// Unique id for this build — the git SHA on Vercel, a timestamp locally. Baked
// into the client bundle as import.meta.env.VITE_BUILD_ID AND written to
// /version.json, so the running app can detect when a newer build has been
// deployed and prompt a reload.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || `dev-${Date.now()}`

// Emit version.json into the CLIENT build output only (not the SSR bundle).
function emitVersionJson(): Plugin {
  let isSsr = false
  return {
    name: 'emit-version-json',
    apply: 'build',
    configResolved(config) {
      isSsr = !!config.build.ssr
    },
    generateBundle() {
      if (isSsr) return
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildId: BUILD_ID }),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/',
    plugins: [
      react(),
      emitVersionJson(),
      mode === 'production' &&
        ViteImageOptimizer({
          exclude: [
            '**/flags/**',
            '**/branding/**',
            '**/priorities/**',
            '**/avatars/**',
            '**/noise.png',
          ],
          png: { compressionLevel: 9, adaptiveFiltering: true },
          jpeg: { quality: 90, mozjpeg: true },
          jpg: { quality: 90, mozjpeg: true },
          svg: {
            multipass: true,
            plugins: [
              {
                name: 'preset-default',
              },
            ],
          } as SVGOConfig,
          cache: true,
          cacheLocation: 'node_modules/.cache/vite-plugin-image-optimizer',
        }),
      mode !== 'production' &&
        visualizer({
          filename: 'stats.html',
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
        }),
    ].filter(Boolean),
    // vite-react-ssg options
    ssgOptions: {
      mock: true,
      formatting: 'none',
      includedRoutes(paths: string[]) {
        // Only prerender public SEO routes, keep admin/dashboard as SPA
        const publicRoutes = [
          '/',
          '/about',
          '/blog',
          '/our-agenda',
          '/contact',
          '/donate',
          '/store',
          '/impact',
          '/polls',
          '/chapters',
          '/privacy',
          '/terms',
          '/press',
        ]
        return paths.filter(
          (path: string) => publicRoutes.includes(path) || path.startsWith('/blog/')
        )
      },
    },
    server: {
      port: 3000,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'npm:libphonenumber-js@1.11.20/max': 'libphonenumber-js/max',
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            // Only split libs that are truly self-contained with no React deps.
            // Everything else goes into one vendor chunk to prevent cross-chunk
            // circular reference errors at runtime.
            if (id.includes('@tinymce')) return 'vendor-editor'
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-'))
              return 'vendor-charts'
            if (id.includes('@supabase')) return 'vendor-supabase'
            // Heavy, self-contained (no React deps) libs used only on specific lazy
            // routes — split out so they don't bloat the eager vendor chunk that
            // loads on every page. mapbox-gl → map pages, tesseract.js → registration OCR.
            if (id.includes('mapbox-gl')) return 'vendor-map'
            if (id.includes('tesseract.js')) return 'vendor-ocr'
            if (id.includes('pdfjs-dist')) return 'vendor-pdf'
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-export'
            return 'vendor'
          },
        },
      },
    },
    define: {
      'import.meta.env.VITE_BUILD_ID': JSON.stringify(BUILD_ID),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
      'import.meta.env.VITE_TINYMCE_API_KEY': JSON.stringify(env.TINYMCE_API_KEY),
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(env.SENTRY_DSN),
      'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(env.MAPBOX_TOKEN),
      'import.meta.env.VITE_UMAMI_WEBSITE_ID': JSON.stringify(env.UMAMI_WEBSITE_ID),
      'import.meta.env.VITE_UMAMI_SHARE_URL': JSON.stringify(env.UMAMI_SHARE_URL),
      'import.meta.env.VITE_VAPID_PUBLIC_KEY': JSON.stringify(env.VAPID_PUBLIC_KEY),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      passWithNoTests: true,
      coverage: {
        reporter: ['text', 'lcov'],
        exclude: ['node_modules', 'src/test'],
      },
    },
  }
})
