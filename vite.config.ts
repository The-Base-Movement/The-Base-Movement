import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { visualizer } from "rollup-plugin-visualizer"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: '/',
    plugins: [
      inspectAttr(), 
      react(),
      visualizer({
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap'
      })
    ],
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['lucide-react', 'framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge'],
            'vendor-viz': ['recharts'],
            'vendor-pdf': ['jspdf', 'html2canvas'],
            'supabase': ['@supabase/supabase-js']
          }
        }
      }
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    }
  };
});
