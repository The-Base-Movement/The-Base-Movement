import { renderToPipeableStream, renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async'
import App from './App'
import { Writable } from 'node:stream'

interface RenderResult {
  appHtml: string
  head: string
}

function createTree(url: string, helmetContext: { helmet?: HelmetServerState }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 300000,
        retry: 1,
        networkMode: 'always',
      },
    },
  })

  return (
    <StaticRouter location={url}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider context={helmetContext}>
          <App />
        </HelmetProvider>
      </QueryClientProvider>
    </StaticRouter>
  )
}

function collectHead(helmetContext: { helmet?: HelmetServerState }) {
  const { helmet } = helmetContext
  if (!helmet) return ''
  return `
            ${helmet.title?.toString() || ''}
            ${helmet.meta?.toString() || ''}
            ${helmet.link?.toString() || ''}
            ${helmet.script?.toString() || ''}
          `
}

export async function render(url: string): Promise<RenderResult> {
  const helmetContext: { helmet?: HelmetServerState } = {}

  return new Promise((resolve, reject) => {
    let appHtml = ''
    // Declared before the stream: onAllReady can fire synchronously, so settle()
    // may run before the timer below is assigned.
    let timer: ReturnType<typeof setTimeout> | undefined = undefined

    const settle = (fn: () => void) => {
      if (timer) clearTimeout(timer)
      fn()
    }

    const stream = new Writable({
      write(chunk, _encoding, callback) {
        appHtml += chunk.toString()
        callback()
      },
      final(callback) {
        settle(() => resolve({ appHtml, head: collectHead(helmetContext) }))
        callback()
      },
    })

    const { pipe, abort } = renderToPipeableStream(createTree(url, helmetContext), {
      onAllReady() {
        pipe(stream)
        stream.end()
      },
      onShellError(err: unknown) {
        settle(() => reject(err))
      },
      onError(err: unknown) {
        console.error('[SSR ERROR]', err)
      },
    })

    timer = setTimeout(() => {
      abort()
      reject(new Error(`Rendering timed out for ${url}`))
    }, 30000)
  })
}

/**
 * Synchronous render for static prerendering. Unlike the streaming renderer,
 * this cannot emit React's inline "$RC" hydration-swap script — our CSP allows
 * no inline scripts, so that script would be blocked in the browser and the
 * Suspense fallback markup would never be replaced.
 *
 * Requires every React.lazy() component on the route to already be resolved
 * (the prerender script does a throwaway render() pass first); otherwise React
 * emits fallback markup instead of the real content.
 */
export function renderStatic(url: string): RenderResult {
  const helmetContext: { helmet?: HelmetServerState } = {}
  const appHtml = renderToString(createTree(url, helmetContext))
  return { appHtml, head: collectHead(helmetContext) }
}
