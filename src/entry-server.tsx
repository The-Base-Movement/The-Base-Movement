import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async'
import { ChaptersProvider } from './context/ChaptersContext'
import App from './App'
import { Writable } from 'node:stream'

/**
 * Server-side render function.
 * Note: We use renderToPipeableStream even for SSG because the application
 * uses React.lazy and Suspense for routing. renderToString would only 
 * capture the Loading fallbacks. onAllReady ensures full content resolution.
 */
export async function render(url: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 300000,
        retry: 1,
        networkMode: 'always',
      },
    },
  })
  
  const helmetContext: { helmet?: HelmetServerState } = {}

  return new Promise((resolve, reject) => {
    let appHtml = ''
    
    // Create a writable stream to capture the output string
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        appHtml += chunk.toString()
        callback()
      },
      final(callback) {
        const { helmet } = helmetContext
        resolve({
          appHtml,
          head: helmet ? `
            ${helmet.title?.toString() || ''}
            ${helmet.meta?.toString() || ''}
            ${helmet.link?.toString() || ''}
          ` : ''
        })
        callback()
      }
    })

    const { pipe, abort } = renderToPipeableStream(
      <StaticRouter location={url}>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider context={helmetContext}>
            <ChaptersProvider>
              <App />
            </ChaptersProvider>
          </HelmetProvider>
        </QueryClientProvider>
      </StaticRouter>,
      {
        onAllReady() {
          // When all content (including Suspense boundaries) is ready
          pipe(stream)
          // Ensure the stream is ended only after piping is initiated
          stream.end()
        },
        onShellError(err: unknown) {
          reject(err)
        },
        onError(err: unknown) {
          // Log errors but don't necessarily fail the whole build for a single component error
          console.error('[SSR ERROR]', err)
        }
      }
    )

    // Safety timeout for the entire rendering process
    setTimeout(() => {
      abort()
      reject(new Error(`Rendering timed out for ${url}`))
    }, 30000)
  })
}
