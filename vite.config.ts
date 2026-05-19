import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

/// <reference types="vitest" />

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/',
    plugins: [
      react(),
      visualizer({
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
    ],
    // vite-react-ssg options
    ssgOptions: {
      mock: true,
      formatting: 'none',
      includedRoutes(paths: string[]) {
        // Only prerender public SEO routes, keep admin/dashboard as SPA
        const publicRoutes = [
          '/',
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
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('@tinymce')) return 'vendor-editor'
            if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf'
            if (id.includes('framer-motion')) return 'vendor-motion'
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-'))
              return 'vendor-charts'
            if (id.includes('lucide-react')) return 'vendor-icons'
            if (id.includes('@radix-ui')) return 'vendor-radix'
            if (id.includes('@supabase')) return 'vendor-supabase'
            if (id.includes('@tanstack')) return 'vendor-query'
            // Keep react-dependent runtime libs in the same chunk as React to
            // avoid "cannot access before initialization" errors from circular
            // references across chunk boundaries.
            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('/react/') ||
              id.includes('/react-is/') ||
              id.includes('/sonner/') ||
              id.includes('/scheduler/')
            )
              return 'vendor-react'
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('/zod/'))
              return 'vendor-forms'
            return 'vendor'
          },
        },
      },
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      coverage: {
        reporter: ['text', 'lcov'],
        exclude: ['node_modules', 'src/test'],
      },
    },
  }
})
