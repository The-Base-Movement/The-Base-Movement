import { Outlet } from 'react-router-dom'
import { StoreProvider } from '@/types/StoreProvider'

export default function WithStore() {
  return (
    <StoreProvider>
      <Outlet />
    </StoreProvider>
  )
}
