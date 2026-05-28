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
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
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
