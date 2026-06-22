/**
 * WithChapters Component
 * -------------------------------------------------------------
 * Thin route-layout wrapper that provides `ChaptersContext` to all nested
 * routes. This lets chapter-related pages (list, detail, join) share the same
 * fetched chapter data without each page fetching it independently.
 *
 * Used in `src/routes.tsx` as a parent route wrapping any route that needs
 * chapter data (e.g. /dashboard/chapters, /chapters).
 */

import { Outlet } from 'react-router-dom'
import { ChaptersProvider } from '@/context/ChaptersContext'

export default function WithChapters() {
  return (
    <ChaptersProvider>
      <Outlet />
    </ChaptersProvider>
  )
}
