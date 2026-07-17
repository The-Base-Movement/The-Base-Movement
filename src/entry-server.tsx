import { renderToPipeableStream } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async'
import App from './App'
import { Writable } from 'node:stream'

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

    const stream = new Writable({
      write(chunk, _encoding, callback) {
        appHtml += chunk.toString()
        callback()
      },
      final(callback) {
        const { helmet } = helmetContext
        resolve({
          appHtml,
          head: helmet
            ? `
            ${helmet.title?.toString() || ''}
            ${helmet.meta?.toString() || ''}
            ${helmet.link?.toString() || ''}
            ${helmet.script?.toString() || ''}
          `
            : '',
        })
        callback()
      },
    })

    const { pipe, abort } = renderToPipeableStream(
      <StaticRouter location={url}>
        <QueryClientProvider client={queryClient}>
          <HelmetProvider context={helmetContext}>
            <App />
          </HelmetProvider>
        </QueryClientProvider>
      </StaticRouter>,
      {
        onAllReady() {
          pipe(stream)
          stream.end()
        },
        onShellError(err: unknown) {
          reject(err)
        },
        onError(err: unknown) {
          console.error('[SSR ERROR]', err)
        },
      }
    )

    setTimeout(() => {
      abort()
      reject(new Error(`Rendering timed out for ${url}`))
    }, 30000)
  })
}
