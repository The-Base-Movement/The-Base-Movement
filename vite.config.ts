import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { visualizer } from "rollup-plugin-visualizer"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
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
          '/press'
        ];
        return paths.filter((path: string) => publicRoutes.includes(path) || path.startsWith('/blog/'));
      }
    },
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
      }
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    }
  };
});
