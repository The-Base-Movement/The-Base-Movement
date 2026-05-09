import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { visualizer } from "rollup-plugin-visualizer"
import prerender from 'vite-plugin-prerender'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/',
    plugins: [
      react(),
      visualizer({
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap'
      }),
      prerender({
        staticDir: path.resolve(__dirname, 'dist'),
        routes: [
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
          '/press'
        ],
        renderer: new prerender.PuppeteerRenderer({
          renderAfterDocumentEvent: 'render-event',
          maxConcurrentRoutes: 1,
          renderAfterTime: 5000,
          injectProperty: '__PRERENDER_INJECTED',
          inject: {
            prerendered: true
          },
          headless: true,
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage', 
            '--single-process',
            '--no-zygote'
          ]
        }),
        postProcess(renderedRoute: any) {
          renderedRoute.html = renderedRoute.html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, (match: string) => {
              if (match.includes('src') || match.includes('import')) return match;
              return '';
            });
          
          renderedRoute.html = renderedRoute.html.replace(
            /data-rh="true"/g,
            'data-rh="true" data-prerendered="true"'
          );
          return renderedRoute;
        }
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
