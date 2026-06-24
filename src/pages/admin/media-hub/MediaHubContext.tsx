import { createContext, useContext, useEffect } from 'react'
import type React from 'react'

interface MediaHubHeader {
  title: string
  icon: string
  description: string
  actions?: React.ReactNode
}

interface MediaHubContextValue {
  header: MediaHubHeader
  setHeader: (h: MediaHubHeader) => void
}

export const MediaHubContext = createContext<MediaHubContextValue>({
  header: { title: 'Media Hub', icon: 'newsmode', description: '' },
  setHeader: () => {},
})

export function useMediaHubLayout(
  title: string,
  icon: string,
  description: string,
  actions?: React.ReactNode
) {
  const { setHeader } = useContext(MediaHubContext)
  useEffect(() => {
    setHeader({ title, icon, description, actions })
  }, [title, icon, description, actions, setHeader])
}
