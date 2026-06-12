import { Outlet } from 'react-router-dom'
import { ChaptersProvider } from '@/context/ChaptersContext'

export default function WithChapters() {
  return (
    <ChaptersProvider>
      <Outlet />
    </ChaptersProvider>
  )
}
